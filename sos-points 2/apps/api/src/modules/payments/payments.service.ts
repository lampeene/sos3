import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma, PaymentStatus } from '@sos-points/database';
import { randomUUID } from 'crypto';
import { PayPlugClient } from './payplug.client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private payplug: PayPlugClient,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async createPayment(registrationId: number, amountInEuros: number) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        user: true,
        session: { include: { place: true } },
        payment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Inscription introuvable');
    }

    if (registration.payment && registration.payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Cette inscription est déjà payée');
    }

    const amountInCents = Math.round(amountInEuros * 100);
    if (amountInCents < 100) {
      throw new BadRequestException('Montant minimum : 1 €');
    }

    const tracker = randomUUID();
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    const apiUrl = this.config.get('API_URL') || 'http://localhost:4000';

    const payplugPayment = await this.payplug.createPayment({
      amount: amountInCents,
      currency: 'EUR',
      customer: {
        email: registration.user.email,
        first_name: registration.user.firstName,
        last_name: registration.user.lastName,
      },
      hosted_payment: {
        return_url: `${frontendUrl}/inscription/success?tracker=${tracker}`,
        cancel_url: `${frontendUrl}/inscription/cancel?tracker=${tracker}`,
      },
      notification_url: `${apiUrl}/api/payments/ipn?tracker=${tracker}`,
      metadata: {
        registrationId: String(registrationId),
        sessionId: String(registration.sessionId),
        tracker,
      },
      description: `Stage ${registration.session.place.name} – ${new Date(
        registration.session.date,
      ).toLocaleDateString('fr-FR')}`,
    });

    const paymentData = {
      amount: amountInCents,
      status: PaymentStatus.CREATED,
      tracker,
      payId: payplugPayment.id,
      payUrl: payplugPayment.hosted_payment?.payment_url || payplugPayment.payment_url,
    };

    let payment;
    if (registration.payment) {
      payment = await prisma.payment.update({
        where: { id: registration.payment.id },
        data: paymentData,
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          ...paymentData,
          registrationId,
        },
      });
    }

    this.logger.log(
      `payment.created paymentId=${payment.id} payplugId=${payplugPayment.id} amountCents=${amountInCents}`,
    );

    return {
      paymentId: payment.id,
      tracker: payment.tracker,
      amount: amountInEuros,
      currency: 'EUR',
      paymentUrl: payment.payUrl,
      redirectUrl: payment.payUrl,
    };
  }

  async handleIpn(tracker: string) {
    if (!tracker) {
      throw new BadRequestException('Missing tracker');
    }

    const payment = await prisma.payment.findUnique({
      where: { tracker },
      include: {
        registration: {
          include: {
            session: { include: { place: true } },
            user: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`IPN: unknown tracker ${tracker}`);
      throw new NotFoundException('Paiement introuvable');
    }

    if (payment.status !== PaymentStatus.CREATED) {
      this.logger.warn(
        `IPN: ${tracker} already processed (status=${payment.status})`,
      );
      return { status: payment.status };
    }

    if (!payment.payId) {
      throw new BadRequestException('Missing PayPlug payment ID');
    }

    const payplugPayment = await this.payplug.getPayment(payment.payId);
    const isSuccess = payplugPayment.is_paid === true;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILURE,
          payFailureCode: payplugPayment.failure?.code,
          payFailureMessage: payplugPayment.failure?.message,
        },
      });

      if (isSuccess) {
        const session = payment.registration.session;
        const newCount = session.usersCount + 1;

        await tx.session.update({
          where: { id: session.id },
          data: {
            usersCount: newCount,
            status: newCount >= session.minRegistration,
          },
        });

        const user = payment.registration.user;
        const placeName = session.place.name;
        const sessionDate = new Date(session.date).toLocaleDateString('fr-FR');

        await this.mail.sendUserRegistration(user.email, sessionDate, placeName);
        await this.mail.sendAdminNewRegistration({
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          sessionDate,
          placeName,
        });
      } else {
        await this.mail.sendUserRegistrationError(
          payment.registration.user.email,
        );
      }
    });

    this.logger.log(
      `payment.ipn tracker=${tracker} status=${isSuccess ? 'SUCCESS' : 'FAILURE'}`,
    );

    return { status: isSuccess ? 'success' : 'failure' };
  }

  async findByRegistration(registrationId: number) {
    return prisma.payment.findUnique({
      where: { registrationId },
    });
  }

  async findByTracker(tracker: string) {
    return prisma.payment.findUnique({
      where: { tracker },
      include: {
        registration: {
          include: {
            session: { include: { place: true } },
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }
}
