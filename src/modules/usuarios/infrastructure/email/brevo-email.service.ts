import { Injectable } from '@nestjs/common';
import { EmailService } from '../../application/ports/email';
import { TemplateEngine } from './templete-engine';

@Injectable()
export class BrevoEmailService implements EmailService {
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly senderName = process.env.EMAIL_FROM_NAME?.trim() || 'Brisa';

  constructor() {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const sender = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !sender) {
      throw new Error(
        'Configura BREVO_API_KEY y EMAIL_FROM para enviar con Brevo.',
      );
    }
    this.apiKey = apiKey;
    this.sender = sender;
  }

  async enviarRecuperacionContrasena(
    correo: string,
    token: string,
  ): Promise<void> {
    const html = await TemplateEngine.render('recuperacion-constrasena.html', {
      codigo: token,
      minutos: '15',
    });

    let response: Response;
    try {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.sender, name: this.senderName },
          to: [{ email: correo }],
          subject: 'Recuperación de contraseña',
          htmlContent: html,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      await response.body?.cancel();
    } catch {
      throw new Error('No fue posible conectar con el proveedor de correo.');
    }

    if (!response.ok) {
      // No exponer el cuerpo del proveedor, direcciones, código ni clave API.
      throw new Error(
        `El proveedor de correo rechazó el envío (HTTP ${response.status}).`,
      );
    }
  }
}
