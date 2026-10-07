import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ContenidoVigenteController } from './contenido-vigente.controller';
import { ModuloInternoAuthGuard } from './guards/modulo-interno-auth.guard';

describe('ContenidoVigenteController (RF-21)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();
  const useCase = { execute };
  const controller = new ContenidoVigenteController(useCase as never);

  beforeEach(() => jest.clearAllMocks());

  it('delega la consulta con usuario y fecha', async () => {
    const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
    execute.mockResolvedValue([{ id_contenido: 'contenido-1' }]);
    const status = jest.fn();

    await expect(
      controller.consultar(idUsuario, { fecha_consulta: fechaConsulta }, {
        status,
      } as never),
    ).resolves.toHaveLength(1);
    expect(execute).toHaveBeenCalledWith(idUsuario, fechaConsulta);
    expect(status).not.toHaveBeenCalled();
  });

  it('responde 204 sin cuerpo cuando PostgreSQL retorna cero filas', async () => {
    execute.mockResolvedValue([]);
    const status = jest.fn();

    await expect(
      controller.consultar(idUsuario, {}, { status } as never),
    ).resolves.toBeUndefined();
    expect(status).toHaveBeenCalledWith(204);
  });

  it('protege la consulta exclusivamente con el guard de módulo interno', () => {
    const handler = ContenidoVigenteController.prototype['consultar'];
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

    expect(guards).toEqual([ModuloInternoAuthGuard]);
  });
});
