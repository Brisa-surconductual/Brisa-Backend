import { EmailService } from '../../application/ports/email';
import { BrevoEmailService } from './brevo-email.service';
import { NodemailerEmailService } from './nodemailer-email';

export function crearEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER ?? 'smtp').trim().toLowerCase();
  if (provider === 'brevo') return new BrevoEmailService();
  if (provider === 'smtp') return new NodemailerEmailService();
  throw new Error('EMAIL_PROVIDER debe ser brevo o smtp.');
}
