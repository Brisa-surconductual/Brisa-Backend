import { UbicacionTemporalParticipante } from '../../../domain/entities/ubicacion-temporal-participante.entity';
import { EstadoCronograma } from '../../../domain/enums/estado-cronograma.enum';
import { ConsultaUbicacionesTemporalesParticipantesException } from '../../../domain/exeption/cronograma/consulta-ubicaciones-temporales-participantes.exception';
import { UbicacionesTemporalesParticipantesRepository } from '../../../domain/repositories/ubicaciones-temporales-participantes.repository';
import { ConsultarUbicacionesTemporalesParticipantesUseCase } from './consultar-ubicaciones-temporales-participantes.use-case';

describe('ConsultarUbicacionesTemporalesParticipantesUseCase', () => {
  const fechaCalculo = new Date('2026-09-15T12:00:00.000Z');
  const consultar = jest.fn();
  const repository = {
    consultar,
  } as unknown as jest.Mocked<UbicacionesTemporalesParticipantesRepository>;
  const useCase = new ConsultarUbicacionesTemporalesParticipantesUseCase(
    repository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('consulta una página y transforma el contrato de salida', async () => {
    consultar.mockResolvedValue({
      total: 1,
      participantes: [crearParticipante()],
    });

    const resultado = await useCase.execute({
      page: 2,
      page_size: 10,
      fecha_calculo: fechaCalculo,
      id_cronograma: '00000000-0000-4000-8000-000000000003',
    });

    expect(consultar).toHaveBeenCalledWith({
      pagina: 2,
      limite: 10,
      fechaCalculo,
      idUsuario: undefined,
      idCronograma: '00000000-0000-4000-8000-000000000003',
      idUnidadTemporal: undefined,
      cronogramaFinalizado: undefined,
    });
    expect(resultado).toEqual(
      expect.objectContaining({
        total: 1,
        page: 2,
        page_size: 10,
        participantes: [
          expect.objectContaining({
            correo_electronico: 'participante@brisa.test',
            nombre_unidad: 'Semana 2',
            cronograma_finalizado: false,
          }),
        ],
      }),
    );
  });

  it('retorna correctamente un listado vacío', async () => {
    consultar.mockResolvedValue({ total: 0, participantes: [] });

    await expect(useCase.execute({ page: 1, page_size: 50 })).resolves.toEqual(
      expect.objectContaining({ total: 0, participantes: [] }),
    );
  });

  it('oculta errores inesperados de persistencia', async () => {
    consultar.mockRejectedValue(new Error('detalle interno'));

    await expect(
      useCase.execute({ page: 1, page_size: 50 }),
    ).rejects.toBeInstanceOf(
      ConsultaUbicacionesTemporalesParticipantesException,
    );
  });

  function crearParticipante(): UbicacionTemporalParticipante {
    return new UbicacionTemporalParticipante(
      '00000000-0000-4000-8000-000000000001',
      'participante@brisa.test',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000003',
      'Cronograma base',
      EstadoCronograma.ACTIVO,
      new Date('2026-09-08T00:00:00.000Z'),
      '00000000-0000-4000-8000-000000000004',
      'Semana 2',
      2,
      new Date('2026-01-08T00:00:00.000Z'),
      new Date('2026-01-15T00:00:00.000Z'),
      fechaCalculo,
      604800,
      false,
      false,
      null,
    );
  }
});
