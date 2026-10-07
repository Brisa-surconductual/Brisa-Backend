import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ModuloInternoAuthGuard } from './guards/modulo-interno-auth.guard';
import { InformacionTemporalController } from './informacion-temporal.controller';

describe('InformacionTemporalController (RF-23)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const execute = jest.fn();
  const controller = new InformacionTemporalController({ execute } as never);

  beforeEach(() => jest.clearAllMocks());

  it('delega la consulta centralizada con usuario y fecha', async () => {
    const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
    execute.mockResolvedValue({
      ubicacion_temporal: { id_usuario: idUsuario },
      contenidos_vigentes: [],
    });

    await expect(
      controller.consultar(idUsuario, { fecha_consulta: fechaConsulta }),
    ).resolves.toEqual(expect.objectContaining({ contenidos_vigentes: [] }));
    expect(execute).toHaveBeenCalledWith(idUsuario, fechaConsulta);
  });

  it('protege la lectura exclusivamente con el guard de módulo interno', () => {
    const handler = InformacionTemporalController.prototype['consultar'];
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

    expect(guards).toEqual([ModuloInternoAuthGuard]);
  });
});
