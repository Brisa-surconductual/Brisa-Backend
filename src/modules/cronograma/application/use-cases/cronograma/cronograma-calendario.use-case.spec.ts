import { CronogramaCalendarioUseCase } from './cronograma-calendario.use-case';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { ContenidoCronogramaRepository } from '../../../domain/repositories/contenido-cronograma.repository';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
describe('Calendario de la unidad después de asociar contenido', () => {
  it('conserva la identidad, orden, fechas y recursos de la asociación guardada', async () => {
    const inicio = new Date('2026-10-20T12:00:00Z');
    const fin = new Date('2026-10-21T12:00:00Z');
    const caso = new CronogramaCalendarioUseCase(
      {
        obtenerPorIdUnidadTemporal: jest.fn().mockResolvedValue({
          id_cronograma: 'cronograma',
          obtenerEstado: () => 'PROGRAMADO',
        }),
      } as unknown as UnidadTemporalRepository,
      {
        obtenerContenidosConRecursosPorUnidadTemporal: jest
          .fn()
          .mockResolvedValue([
            {
              id_contenido_cronograma: 'asociacion',
              orden_contenido: 1,
              fecha_inicio_disponibilidad: inicio,
              fecha_fin_disponibilidad: fin,
              contenidos: {
                id_contenido: 'contenido',
                nombre_contenido: 'Manejo de ansiedad',
                tipo_contenido: 'INFORMATIVO',
                recursos_contenido: [
                  { id_recurso: 'recurso', clave_almacenamiento: 'clave' },
                ],
              },
            },
          ]),
      } as unknown as ContenidoCronogramaRepository,
      {
        buscarPorId: jest.fn().mockResolvedValue({
          id_cronograma: 'cronograma',
          estado: 'INACTIVO',
        }),
      } as unknown as CronogramaRepository,
    );
    const resultado = await caso.execute({
      idCronograma: 'cronograma',
      idUnidadTemporal: 'unidad',
    });
    expect(resultado.contenidos).toEqual([
      {
        idContenidoCronograma: 'asociacion',
        idContenido: 'contenido',
        nombreContenido: 'Manejo de ansiedad',
        tipo: 'INFORMATIVO',
        ordenContenido: 1,
        fechaInicioDisponibilidad: inicio,
        fechaFinDisponibilidad: fin,
        recursos: [{ idRecurso: 'recurso', claveAlmacenamiento: 'clave' }],
      },
    ]);
  });
});
