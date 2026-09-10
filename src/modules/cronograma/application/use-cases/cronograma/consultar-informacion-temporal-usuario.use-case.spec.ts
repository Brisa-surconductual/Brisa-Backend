import { ContenidoVigenteUsuario } from '../../../domain/entities/contenido-vigente-usuario.entity';
import { InformacionTemporalUsuario } from '../../../domain/entities/informacion-temporal-usuario.entity';
import { UbicacionTemporalUsuario } from '../../../domain/entities/ubicacion-temporal-usuario.entity';
import { EstadoContenido } from '../../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../../domain/enums/tipo-contenido.enum';
import { ConsultaInformacionTemporalException } from '../../../domain/exeption/cronograma/consulta-informacion-temporal.exception';
import { CronogramaActivoUsuarioNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-activo-usuario-no-encontrado.exception';
import { InformacionTemporalUsuarioRepository } from '../../../domain/repositories/informacion-temporal-usuario.repository';
import { ConsultarInformacionTemporalUsuarioUseCase } from './consultar-informacion-temporal-usuario.use-case';

describe('ConsultarInformacionTemporalUsuarioUseCase (RF-23)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
  const consultar = jest.fn();
  const repository = {
    consultar,
  } as unknown as jest.Mocked<InformacionTemporalUsuarioRepository>;
  const useCase = new ConsultarInformacionTemporalUsuarioUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('expone conjuntamente los contratos de RF-22 y RF-21', async () => {
    consultar.mockResolvedValue(crearInformacion([crearContenido()]));

    const resultado = await useCase.execute(idUsuario, fechaConsulta);

    expect(resultado.ubicacion_temporal).toMatchObject({
      id_usuario: idUsuario,
      nombre_unidad: 'Semana 2',
      fecha_calculo: fechaConsulta,
      cronograma_finalizado: false,
    });
    expect(resultado.contenidos_vigentes).toEqual([
      expect.objectContaining({
        nombre_contenido: 'Prevención de recaídas',
        estado_disponibilidad: EstadoContenido.ACTIVO,
      }),
    ]);
    expect(consultar).toHaveBeenCalledWith(idUsuario, fechaConsulta);
  });

  it('conserva la ubicación y retorna contenidos vacíos cuando no hay vigencia', async () => {
    consultar.mockResolvedValue(crearInformacion([]));

    const resultado = await useCase.execute(idUsuario, fechaConsulta);

    expect(resultado.ubicacion_temporal.id_usuario).toBe(idUsuario);
    expect(resultado.contenidos_vigentes).toEqual([]);
  });

  it('propaga el 404 producido por PostgreSQL', async () => {
    consultar.mockRejectedValue(
      new CronogramaActivoUsuarioNoEncontradoException(),
    );

    await expect(
      useCase.execute(idUsuario, fechaConsulta),
    ).rejects.toBeInstanceOf(CronogramaActivoUsuarioNoEncontradoException);
  });

  it('oculta errores inesperados de infraestructura', async () => {
    consultar.mockRejectedValue(new Error('detalle sensible'));

    await expect(
      useCase.execute(idUsuario, fechaConsulta),
    ).rejects.toBeInstanceOf(ConsultaInformacionTemporalException);
  });

  function crearInformacion(
    contenidos: ContenidoVigenteUsuario[],
  ): InformacionTemporalUsuario {
    return new InformacionTemporalUsuario(
      new UbicacionTemporalUsuario(
        idUsuario,
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000004',
        'Semana 2',
        2,
        fechaConsulta,
        604800,
        false,
        null,
      ),
      contenidos,
    );
  }

  function crearContenido(): ContenidoVigenteUsuario {
    return new ContenidoVigenteUsuario(
      '00000000-0000-4000-8000-000000000005',
      '00000000-0000-4000-8000-000000000006',
      'Prevención de recaídas',
      TipoContenido.INFORMATIVO,
      '00000000-0000-4000-8000-000000000004',
      'Semana 2',
      2,
      1,
      new Date('2026-01-08T00:00:00.000Z'),
      new Date('2026-01-15T00:00:00.000Z'),
      EstadoContenido.ACTIVO,
    );
  }
});
