import { BrevoEmailService } from './brevo-email.service';
import { crearEmailService } from './email-provider.factory';
import { MailjetEmailService } from './mailjet-email.service';
import { NodemailerEmailService } from './nodemailer-email';

describe('crearEmailService', () => {
  beforeEach(() =>
    jest.replaceProperty(process, 'env', {
      BREVO_API_KEY: 'test-api-key',
      MAILJET_API_KEY: 'test-api-key',
      MAILJET_SECRET_KEY: 'test-secret-key',
      EMAIL_FROM: 'sender@example.com',
    }),
  );
  afterEach(() => jest.restoreAllMocks());

  it('conserva SMTP como transporte predeterminado para configuraciones existentes', () => {
    expect(crearEmailService()).toBeInstanceOf(NodemailerEmailService);
  });

  it('selecciona Mailjet sin necesitar credenciales de Brevo ni SMTP', () => {
    process.env.EMAIL_PROVIDER = 'mailjet';
    delete process.env.BREVO_API_KEY;
    expect(crearEmailService()).toBeInstanceOf(MailjetEmailService);
  });

  it('conserva Brevo cuando está configurado explícitamente', () => {
    process.env.EMAIL_PROVIDER = 'brevo';
    expect(crearEmailService()).toBeInstanceOf(BrevoEmailService);
  });

  it('rechaza un proveedor desconocido', () => {
    process.env.EMAIL_PROVIDER = 'unknown';
    expect(() => crearEmailService()).toThrow(
      'EMAIL_PROVIDER debe ser mailjet, brevo o smtp.',
    );
  });
});
