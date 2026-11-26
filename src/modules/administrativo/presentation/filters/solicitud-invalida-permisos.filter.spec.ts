import { BadRequestException, type ArgumentsHost } from '@nestjs/common';
import { SolicitudInvalidaPermisosFilter } from './solicitud-invalida-permisos.filter';

describe('SolicitudInvalidaPermisosFilter', () => {
  const responder = (excepcion: BadRequestException) => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    new SolicitudInvalidaPermisosFilter().catch(excepcion, host);
    return { status, json };
  };

  it('responde 400 con el sobre { status, codigo, mensaje }', () => {
    const { status, json } = responder(new BadRequestException('x'));

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      status: 400,
      codigo: 'PARAMETRO_INVALIDO',
      mensaje: 'Los parámetros de la operación no son válidos.',
    });
  });

  it('no repite lo que envió el usuario', () => {
    const { json } = responder(
      new BadRequestException(['alcance ECO-123 must be one of the values']),
    );

    expect(json).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(json.mock.calls)).not.toContain('ECO-123');
  });
});
