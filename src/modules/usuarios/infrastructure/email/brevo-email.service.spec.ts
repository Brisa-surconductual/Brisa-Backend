import { BrevoEmailService } from './brevo-email.service';
import { TemplateEngine } from './templete-engine';

describe('BrevoEmailService', () => {
  let renderizar: jest.SpyInstance<
    Promise<string>,
    [string, Record<string, string>]
  >;

  beforeEach(() => {
    jest.replaceProperty(process, 'env', {
      BREVO_API_KEY: 'test-api-key',
      EMAIL_FROM: 'sender@example.com',
      EMAIL_FROM_NAME: 'Brisa',
    });
    renderizar = jest
      .spyOn(TemplateEngine, 'render')
      .mockResolvedValue('<p>123456</p>');
  });
  afterEach(() => jest.restoreAllMocks());

  it('envía por HTTPS el código y la plantilla existentes sin abrir SMTP', async () => {
    const enviar = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 201 }));
    await new BrevoEmailService().enviarRecuperacionContrasena(
      'recipient@example.com',
      '123456',
    );
    expect(renderizar).toHaveBeenCalledWith('recuperacion-constrasena.html', {
      codigo: '123456',
      minutos: '15',
    });
    expect(enviar).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: {
          'api-key': 'test-api-key',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: 'sender@example.com', name: 'Brisa' },
          to: [{ email: 'recipient@example.com' }],
          subject: 'Recuperación de contraseña',
          htmlContent: '<p>123456</p>',
        }),
      }),
    );
    expect(enviar.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each(['BREVO_API_KEY', 'EMAIL_FROM'])(
    'rechaza la configuración sin %s antes de contactar el proveedor',
    (variable) => {
      delete process.env[variable];
      const enviar = jest.spyOn(globalThis, 'fetch');
      expect(() => new BrevoEmailService()).toThrow(
        'Configura BREVO_API_KEY y EMAIL_FROM para enviar con Brevo.',
      );
      expect(enviar).not.toHaveBeenCalled();
    },
  );

  it('propaga un rechazo sin exponer el cuerpo privado del proveedor', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('private recipient, code and key', { status: 401 }),
      );
    await expect(
      new BrevoEmailService().enviarRecuperacionContrasena(
        'recipient@example.com',
        '123456',
      ),
    ).rejects.toThrow('El proveedor de correo rechazó el envío (HTTP 401).');
  });

  it('sanitiza los fallos de conexión', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('private details'));
    await expect(
      new BrevoEmailService().enviarRecuperacionContrasena(
        'recipient@example.com',
        '123456',
      ),
    ).rejects.toThrow('No fue posible conectar con el proveedor de correo.');
  });
});
