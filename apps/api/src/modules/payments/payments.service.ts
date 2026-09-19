import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma, PaymentStatus, PaymentMethod } from '@sos-points/database';
import { randomUUID } from 'crypto';
import { SumUpClient } from './sumup.client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private sumup: SumUpClient,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async createPayment(
    registrationId: number,
    amountInEuros: number,
    method: 'CARD' | 'TRANSFER' = 'CARD',
  ) {
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

    if (amountInEuros < 1) {
      throw new BadRequestException('Montant minimum : 1 €');
    }

    const amountInCents = Math.round(amountInEuros * 100);
    const tracker = randomUUID();
    const frontendUrl = (this.config.get('FRONTEND_URL') || 'http://localhost:3000').split(',')[0];
    const apiUrl = this.config.get('API_URL') || 'http://localhost:4000';

    if (method === 'TRANSFER') {
      const paymentData = {
        amount: amountInCents,
        status: PaymentStatus.PENDING_TRANSFER,
        method: PaymentMethod.TRANSFER,
        tracker,
      };

      let payment;
      if (registration.payment) {
        payment = await prisma.payment.update({
          where: { id: registration.payment.id },
          data: paymentData,
        });
      } else {
        payment = await prisma.payment.create({
          data: { ...paymentData, registrationId },
        });
      }

      this.logger.log(
        `payment.pending_transfer paymentId=${payment.id} amountCents=${amountInCents}`,
      );

      return {
        paymentId: payment.id,
        tracker: payment.tracker,
        amount: amountInEuros,
        currency: 'EUR',
        method: 'TRANSFER',
        bankTransfer: {
          bankName: this.config.get('BANK_NAME') || '',
          iban: this.config.get('BANK_IBAN') || '',
          bic: this.config.get('BANK_BIC') || '',
          holder: this.config.get('BANK_HOLDER') || '',
          reference: `SOSPOINT-${registrationId}`,
        },
      };
    }

    const checkout = await this.sumup.createCheckout({
      amount: amountInEuros,
      currency: 'EUR',
      checkoutReference: tracker,
      description: `Stage ${registration.session.place.name} – ${new Date(
        registration.session.date,
      ).toLocaleDateString('fr-FR')}`,
      returnUrl: `${apiUrl}/api/payments/webhook?tracker=${tracker}`,
      redirectUrl: `${frontendUrl}/inscription/success?tracker=${tracker}`,
    });

    const paymentData = {
      amount: amountInCents,
      status: PaymentStatus.CREATED,
      method: PaymentMethod.CARD,
      tracker,
      payId: checkout.id,
      payUrl: checkout.hosted_checkout_url,
    };

    let payment;
    if (registration.payment) {
      payment = await prisma.payment.update({
        where: { id: registration.payment.id },
        data: paymentData,
      });
    } else {
      payment = await prisma.payment.create({
        data: { ...paymentData, registrationId },
      });
    }

    this.logger.log(
      `payment.created paymentId=${payment.id} sumupId=${checkout.id} amountCents=${amountInCents}`,
    );

    return {
      paymentId: payment.id,
      tracker: payment.tracker,
      amount: amountInEuros,
      currency: 'EUR',
      method: 'CARD',
      paymentUrl: payment.payUrl,
      redirectUrl: payment.payUrl,
    };
  }

  async handleWebhook(tracker: string) {
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
      this.logger.warn(`Webhook: unknown tracker ${tracker}`);
      throw new NotFoundException('Paiement introuvable');
    }

    if (payment.status !== PaymentStatus.CREATED) {
      this.logger.warn(
        `Webhook: ${tracker} already processed (status=${payment.status})`,
      );
      return { status: payment.status };
    }

    if (!payment.payId) {
      throw new BadRequestException('Missing SumUp checkout ID');
    }

    const checkout = await this.sumup.getCheckout(payment.payId);

    if (checkout.status === 'PENDING') {
      return { status: 'pending' };
    }

    const isSuccess = checkout.status === 'PAID';

    if (isSuccess) {
      await this.markPaymentSuccess(payment);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILURE },
      });
      await this.mail.sendUserRegistrationError(payment.registration.user.email);
    }

    this.logger.log(
      `payment.webhook tracker=${tracker} status=${isSuccess ? 'SUCCESS' : 'FAILURE'}`,
    );

    return { status: isSuccess ? 'success' : 'failure' };
  }

  async confirmTransfer(paymentId: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
      throw new NotFoundException('Paiement introuvable');
    }

    if (payment.method !== PaymentMethod.TRANSFER) {
      throw new BadRequestException("Ce paiement n'est pas un virement");
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Ce paiement est déjà confirmé');
    }

    await this.markPaymentSuccess(payment);

    this.logger.log(`payment.transfer_confirmed paymentId=${payment.id}`);

    return { status: 'success' };
  }

  private async markPaymentSuccess(payment: any) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.SUCCESS },
      });

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
    });
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

  async findPendingTransfers() {
    return prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING_TRANSFER, method: PaymentMethod.TRANSFER },
      include: {
        registration: {
          include: {
            session: { include: { place: true } },
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
