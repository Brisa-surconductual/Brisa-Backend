import { MailjetEmailService } from './mailjet-email.service';
import { TemplateEngine } from './templete-engine';

describe('MailjetEmailService', () => {
  let renderizar: jest.SpyInstance<
    Promise<string>,
    [string, Record<string, string>]
  >;

  beforeEach(() => {
    jest.replaceProperty(process, 'env', {
      MAILJET_API_KEY: 'test-api-key',
      MAILJET_SECRET_KEY: 'test-secret-key',
      EMAIL_FROM: 'sender@example.com',
      EMAIL_FROM_NAME: 'Brisa',
    });
    renderizar = jest
      .spyOn(TemplateEngine, 'render')
      .mockResolvedValue('<p>123456</p>');
  });
  afterEach(() => jest.restoreAllMocks());

  it('envía la plantilla existente por HTTPS con ambas claves y sin seguimiento', async () => {
    const enviar = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        Messages: [
          {
            Status: 'success',
            To: [{ Email: 'recipient@example.com', MessageID: 123 }],
          },
        ],
      }),
    );
    const timeout = jest.spyOn(AbortSignal, 'timeout');

    await new MailjetEmailService().enviarRecuperacionContrasena(
      'recipient@example.com',
      '123456',
    );

    expect(renderizar).toHaveBeenCalledWith('recuperacion-constrasena.html', {
      codigo: '123456',
      minutos: '15',
    });
    expect(enviar).toHaveBeenCalledWith(
      'https://api.mailjet.com/v3.1/send',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: {
          Authorization: `Basic ${Buffer.from('test-api-key:test-secret-key').toString('base64')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          Messages: [
            {
              From: { Email: 'sender@example.com', Name: 'Brisa' },
              To: [{ Email: 'recipient@example.com' }],
              Subject: 'Recuperación de contraseña',
              HTMLPart: '<p>123456</p>',
              TrackOpens: 'disabled',
              TrackClicks: 'disabled',
            },
          ],
        }),
      }),
    );
    expect(enviar.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    expect(timeout).toHaveBeenCalledWith(10_000);
  });

  it.each(['MAILJET_API_KEY', 'MAILJET_SECRET_KEY', 'EMAIL_FROM'])(
    'rechaza la configuración sin %s antes de contactar el proveedor',
    (variable) => {
      delete process.env[variable];
      const enviar = jest.spyOn(globalThis, 'fetch');
      expect(() => new MailjetEmailService()).toThrow(
        'Configura MAILJET_API_KEY, MAILJET_SECRET_KEY y EMAIL_FROM para enviar con Mailjet.',
      );
      expect(enviar).not.toHaveBeenCalled();
    },
  );

  it.each([401, 403, 429, 500])(
    'propaga HTTP %i sin exponer el cuerpo privado del proveedor',
    async (status) => {
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          new Response('private recipient, code and key', { status }),
        );
      await expect(
        new MailjetEmailService().enviarRecuperacionContrasena(
          'recipient@example.com',
          '123456',
        ),
      ).rejects.toThrow(
        `El proveedor de correo rechazó el envío (HTTP ${status}).`,
      );
    },
  );

  it.each([
    null,
    {},
    { Messages: [] },
    { Messages: [null] },
    { Messages: [{}] },
    { Messages: [{ Status: 'error', Errors: ['private details'] }] },
    { Messages: [{ Status: 'success' }, { Status: 'error' }] },
  ])('rechaza HTTP 200 sin un único mensaje aceptado: %j', async (payload) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(payload));
    await expect(
      new MailjetEmailService().enviarRecuperacionContrasena(
        'recipient@example.com',
        '123456',
      ),
    ).rejects.toThrow(
      'El proveedor de correo no confirmó la aceptación del envío.',
    );
  });

  it('rechaza y sanitiza una respuesta HTTP 200 que no es JSON válido', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('private details', { status: 200 }));
    await expect(
      new MailjetEmailService().enviarRecuperacionContrasena(
        'recipient@example.com',
        '123456',
      ),
    ).rejects.toThrow(
      'No fue posible completar la solicitud al proveedor de correo.',
    );
  });

  it.each([
    new Error('private details'),
    new DOMException('private details', 'TimeoutError'),
  ])('sanitiza los fallos de conexión y timeout: %s', async (error) => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(error);
    await expect(
      new MailjetEmailService().enviarRecuperacionContrasena(
        'recipient@example.com',
        '123456',
      ),
    ).rejects.toThrow(
      'No fue posible completar la solicitud al proveedor de correo.',
    );
  });
});
