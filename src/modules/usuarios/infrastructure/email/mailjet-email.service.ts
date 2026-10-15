import { Injectable } from '@nestjs/common';
import { EmailService } from '../../application/ports/email';
import { TemplateEngine } from './templete-engine';

function mensajeAceptado(payload: unknown): boolean {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('Messages' in payload) ||
    !Array.isArray(payload.Messages) ||
    payload.Messages.length !== 1
  ) {
    return false;
  }
  const mensaje: unknown = payload.Messages[0];
  return (
    typeof mensaje === 'object' &&
    mensaje !== null &&
    'Status' in mensaje &&
    mensaje.Status === 'success'
  );
}

@Injectable()
export class MailjetEmailService implements EmailService {
  private readonly authorization: string;
  private readonly sender: string;
  private readonly senderName = process.env.EMAIL_FROM_NAME?.trim() || 'Brisa';

  constructor() {
    const apiKey = process.env.MAILJET_API_KEY?.trim();
    const secretKey = process.env.MAILJET_SECRET_KEY?.trim();
    const sender = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !secretKey || !sender) {
      throw new Error(
        'Configura MAILJET_API_KEY, MAILJET_SECRET_KEY y EMAIL_FROM para enviar con Mailjet.',
      );
    }
    this.authorization = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`;
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
    let result: unknown;
    try {
      response = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          Authorization: this.authorization,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          Messages: [
            {
              From: { Email: this.sender, Name: this.senderName },
              To: [{ Email: correo }],
              Subject: 'Recuperación de contraseña',
              HTMLPart: html,
              TrackOpens: 'disabled',
              TrackClicks: 'disabled',
            },
          ],
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) {
        result = await response.json();
      } else {
        await response.body?.cancel();
      }
    } catch {
      throw new Error(
        'No fue posible completar la solicitud al proveedor de correo.',
      );
    }

    // Los errores del proveedor pueden contener direcciones, códigos o claves.
    if (!response.ok) {
      throw new Error(
        `El proveedor de correo rechazó el envío (HTTP ${response.status}).`,
      );
    }
    if (!mensajeAceptado(result)) {
      throw new Error(
        'El proveedor de correo no confirmó la aceptación del envío.',
      );
    }
  }
}
