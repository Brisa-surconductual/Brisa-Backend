import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import {
  EmailSender,
  MensajeRecuperacion,
} from '../../application/ports/email-sender';

@Injectable()
export class NodemailerEmailSender implements EmailSender {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    this.from = process.env.SMTP_FROM ?? 'Brisa <no-reply@localhost>';
    this.transporter =
      host && user && password
        ? nodemailer.createTransport({
            host,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass: password },
          })
        : null;
  }

  async enviarRecuperacion(mensaje: MensajeRecuperacion): Promise<void> {
    const transporter = this.requireTransporter();
    const baseUrl =
      process.env.PASSWORD_RECOVERY_URL ??
      'http://localhost:5173/restablecer-contrasena';
    const url = new URL(baseUrl);
    url.searchParams.set('token', mensaje.token);

    try {
      await transporter.sendMail({
        from: this.from,
        to: mensaje.destinatario,
        subject: 'Recuperación de contraseña de Brisa',
        text:
          `Abre el siguiente enlace para restablecer tu contraseña:\n\n` +
          `${url.toString()}\n\n` +
          `El enlace expira a las ${mensaje.fechaExpiracion.toISOString()}.`,
      });
    } catch (error) {
      this.logger.error('Password recovery email delivery failed.', error);
      throw error;
    }
  }

  async enviarActivacionPendiente(destinatario: string): Promise<void> {
    const transporter = this.requireTransporter();
    const url =
      process.env.ACCOUNT_ACTIVATION_URL ??
      'http://localhost:5173/activar-cuenta';

    try {
      await transporter.sendMail({
        from: this.from,
        to: destinatario,
        subject: 'Completa la activación de tu cuenta de Brisa',
        text: `Tu cuenta aún requiere activación. Continúa en: ${url}`,
      });
    } catch (error) {
      this.logger.error('Activation email delivery failed.', error);
      throw error;
    }
  }

  private requireTransporter(): Transporter {
    if (!this.transporter) {
      this.logger.warn(
        'SMTP is not configured; no recovery email was delivered.',
      );
      throw new Error('SMTP is not configured.');
    }
    return this.transporter;
  }
}
