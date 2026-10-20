import { AsociarContenidoUnidadTemporalUseCase } from './asociar-contenido-unidad-temporal.use-case';
import { ValidarSolapamientoTemporalService } from '../../service/validar-solapamiento-temporal.service';
import { ReordenarContenidoTemporalService } from '../../service/reordenar-contenido-temporal.service';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { ContenidoCronogramaRepository } from '../../../domain/repositories/contenido-cronograma.repository';
import { ContenidoRepository } from '../../../domain/repositories/contenido.repository';
describe('Asociación y límites reales de disponibilidad', () => {
  const crear = jest.fn();
  const obtenerPorIdContenido = jest.fn();
  const caso = new AsociarContenidoUnidadTemporalUseCase(
    new ValidarSolapamientoTemporalService(),
    {
      obtenerPorIdUnidadTemporal: jest.fn().mockResolvedValue({
        fecha_inicio: new Date('2026-10-20T00:00:00Z'),
        fecha_fin: new Date('2026-10-23T00:00:00Z'),
      }),
    } as unknown as UnidadTemporalRepository,
    {
      obtenerPorIdContenido,
      obtnerPorIdUnidadTemporal: jest.fn().mockResolvedValue([]),
      crearConReordenamiento: crear,
    } as unknown as ContenidoCronogramaRepository,
    new ReordenarContenidoTemporalService(),
    {
      buscarPorId: jest.fn().mockResolvedValue({ id_contenido: 'contenido' }),
    } as unknown as ContenidoRepository,
  );
  const dto = {
    idContenido: 'contenido',
    idUnidadTemporal: 'unidad',
    fechaInicioDisponibilidad: new Date('2026-10-21T13:00:00Z'),
    fechaFinDisponibilidad: new Date('2026-10-22T23:00:00Z'),
  };
  beforeEach(() => {
    crear.mockClear();
    obtenerPorIdContenido.mockResolvedValue(null);
  });
  it('guarda una asociación válida a las 08:00 y 18:00 de Colombia', async () => {
    await expect(caso.execute(dto)).resolves.toMatchObject({
      mensaje: expect.stringContaining('correctamente') as string,
    });
    expect(crear).toHaveBeenCalledTimes(1);
    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        id_contenido: 'contenido',
        id_unidad_temporal: 'unidad',
        orden_contenido: 1,
        fecha_inicio_disponibilidad: dto.fechaInicioDisponibilidad,
        fecha_fin_disponibilidad: dto.fechaFinDisponibilidad,
      }),
      [],
    );
  });
  it('rechaza con 409 la disponibilidad posterior al límite sin persistir', async () => {
    await expect(
      caso.execute({
        ...dto,
        fechaFinDisponibilidad: new Date('2026-10-23T05:00:00Z'),
      }),
    ).rejects.toMatchObject({
      status: 409,
      message:
        'La disponibilidad del contenido debe estar dentro del rango de la unidad temporal asignada.',
    });
    expect(crear).not.toHaveBeenCalled();
  });
  it('conserva el rechazo de contenido ya asociado', async () => {
    obtenerPorIdContenido.mockResolvedValue({
      id_contenido_cronograma: 'existente',
    });
    await expect(caso.execute(dto)).rejects.toMatchObject({ status: 409 });
    expect(crear).not.toHaveBeenCalled();
  });
});
