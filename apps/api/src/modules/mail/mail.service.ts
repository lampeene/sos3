import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get('MAIL_HOST');
    const port = Number(this.config.get('MAIL_PORT')) || 587;
    const user = this.config.get('MAIL_USER');
    const pass = this.config.get('MAIL_PASSWORD');

    if (!host || !user || !pass) {
      this.logger.warn(
        'Mail not fully configured – emails will be logged only',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`Mail transporter ready (${host}:${port})`);
  }

  private get from() {
    return this.config.get('MAIL_FROM') || 'noreply@sos-point.com';
  }

  private get adminEmail() {
    return this.config.get('MAIL_ADMIN') || 'admin@sos-point.com';
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    if (!this.transporter) {
      this.logger.log(`[MAIL-MOCK] To: ${options.to} | ${options.subject}`);
      return { mock: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}`, err);
      throw err;
    }
  }

  private layout(title: string, body: string) {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#08717e;padding:24px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;">
              SOS <span style="color:#f9be00;">Permis à points</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px;color:#333;font-size:15px;line-height:1.6;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#575756;padding:16px 24px;text-align:center;color:#ccc;font-size:12px;">
            SOS Permis à points – Stages agréés par les préfectures
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  async sendUserValidation(email: string, firstName: string, validationUrl: string) {
    const html = this.layout(
      'Validez votre compte',
      `<p>Bonjour <strong>${firstName}</strong>,</p>
       <p>Merci de vous être inscrit. Cliquez pour activer votre compte :</p>
       <p style="text-align:center;margin:28px 0;">
         <a href="${validationUrl}" style="background:#08717e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
           Valider mon compte
         </a>
       </p>`,
    );
    return this.send({
      to: email,
      subject: 'Validez votre compte – SOS Permis à points',
      html,
    });
  }

  async sendUserRegistration(email: string, sessionDate: string, placeName: string) {
    const html = this.layout(
      'Inscription confirmée',
      `<p>Bonjour,</p>
       <p>Votre inscription au stage a été <strong>confirmée</strong>.</p>
       <table style="width:100%;background:#f8f8f8;border-radius:6px;margin:20px 0;">
         <tr><td style="padding:16px;">
           <strong>Lieu :</strong> ${placeName}<br/>
           <strong>Date :</strong> ${sessionDate}
         </td></tr>
       </table>
       <p>Présentez-vous avec une pièce d'identité et votre permis.</p>
       <p>L'équipe SOS Permis à points</p>`,
    );
    return this.send({
      to: email,
      subject: `Inscription confirmée – Stage du ${sessionDate}`,
      html,
    });
  }

  async sendUserRegistrationError(email: string) {
    const html = this.layout(
      'Échec du paiement',
      `<p>Bonjour,</p>
       <p>Le paiement de votre inscription n'a pas abouti. Aucune somme n'a été débitée.</p>
       <p>Vous pouvez réessayer depuis le site.</p>
       <p>L'équipe SOS Permis à points</p>`,
    );
    return this.send({
      to: email,
      subject: 'Échec du paiement – SOS Permis à points',
      html,
    });
  }

  async sendAdminNewRegistration(data: {
    userName: string;
    email: string;
    sessionDate: string;
    placeName: string;
  }) {
    const html = this.layout(
      'Nouvelle inscription',
      `<p>Nouvelle inscription validée :</p>
       <ul>
         <li><strong>Participant :</strong> ${data.userName}</li>
         <li><strong>Email :</strong> ${data.email}</li>
         <li><strong>Lieu :</strong> ${data.placeName}</li>
         <li><strong>Date :</strong> ${data.sessionDate}</li>
       </ul>`,
    );
    return this.send({
      to: this.adminEmail,
      subject: `[Admin] Nouvelle inscription – ${data.placeName} – ${data.sessionDate}`,
      html,
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    const html = this.layout(
      'Réinitialisation du mot de passe',
      `<p>Bonjour,</p>
       <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
       <p style="text-align:center;margin:28px 0;">
         <a href="${resetUrl}" style="background:#08717e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
           Réinitialiser mon mot de passe
         </a>
       </p>
       <p style="color:#888;font-size:13px;">Lien valable 1 heure. Ignorez cet email si vous n'êtes pas à l'origine de la demande.</p>`,
    );
    return this.send({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html,
    });
  }
}
