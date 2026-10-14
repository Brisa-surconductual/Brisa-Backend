import { BrevoEmailService } from './brevo-email.service';
import { crearEmailService } from './email-provider.factory';
import { NodemailerEmailService } from './nodemailer-email';

describe('crearEmailService', () => {
  beforeEach(() =>
    jest.replaceProperty(process, 'env', {
      BREVO_API_KEY: 'test-api-key',
      EMAIL_FROM: 'sender@example.com',
    }),
  );
  afterEach(() => jest.restoreAllMocks());

  it('conserva SMTP como transporte predeterminado para configuraciones existentes', () => {
    expect(crearEmailService()).toBeInstanceOf(NodemailerEmailService);
  });

  it('selecciona Brevo cuando está configurado para Render', () => {
    process.env.EMAIL_PROVIDER = 'brevo';
    expect(crearEmailService()).toBeInstanceOf(BrevoEmailService);
  });

  it('rechaza un proveedor desconocido', () => {
    process.env.EMAIL_PROVIDER = 'unknown';
    expect(() => crearEmailService()).toThrow(
      'EMAIL_PROVIDER debe ser brevo o smtp.',
    );
  });
});
