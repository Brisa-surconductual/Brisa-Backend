import { CalculoUbicacionTemporalException } from '../../domain/exeption/calculo-ubicacion-temporal.exception';
import { FechaInicioUsuarioNoRegistradaException } from '../../domain/exeption/fecha-inicio-usuario-no-registrada.exception';
import { UbicacionTemporalUsuario } from '../../domain/entities/ubicacion-temporal-usuario.entity';
import { UbicacionTemporalUsuarioRepository } from '../../domain/repositories/ubicacion-temporal-usuario.repository';
import { CalcularUbicacionTemporalUsuarioUseCase } from './calcular-ubicacion-temporal-usuario.use-case';

describe('CalcularUbicacionTemporalUsuarioUseCase (RF-22)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const fechaCalculo = new Date('2026-09-15T12:00:00.000Z');
  const calcular = jest.fn();
  const repository = {
    calcular,
  } as unknown as jest.Mocked<UbicacionTemporalUsuarioRepository>;
  const useCase = new CalcularUbicacionTemporalUsuarioUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('delega íntegramente el cálculo en la función SQL y transforma su resultado', async () => {
    repository.calcular.mockResolvedValue(crearUbicacion());

    await expect(useCase.execute(idUsuario, fechaCalculo)).resolves.toEqual({
      id_usuario: idUsuario,
      id_cronograma_usuario: '00000000-0000-4000-8000-000000000002',
      id_cronograma: '00000000-0000-4000-8000-000000000003',
      id_unidad_temporal: '00000000-0000-4000-8000-000000000004',
      nombre_unidad: 'Semana 2',
      orden_unidad: 2,
      fecha_calculo: fechaCalculo,
      tiempo_efectivo_transcurrido_segundos: 604800,
      cronograma_finalizado: false,
      mensaje: null,
    });
    expect(calcular).toHaveBeenCalledWith(idUsuario, fechaCalculo);
  });

  it('propaga el 422 producido por la función SQL', async () => {
    repository.calcular.mockRejectedValue(
      new FechaInicioUsuarioNoRegistradaException(),
    );

    await expect(
      useCase.execute(idUsuario, fechaCalculo),
    ).rejects.toBeInstanceOf(FechaInicioUsuarioNoRegistradaException);
  });

  it('oculta errores inesperados de infraestructura', async () => {
    repository.calcular.mockRejectedValue(new Error('database unavailable'));

    await expect(
      useCase.execute(idUsuario, fechaCalculo),
    ).rejects.toBeInstanceOf(CalculoUbicacionTemporalException);
  });

  function crearUbicacion(): UbicacionTemporalUsuario {
    return new UbicacionTemporalUsuario(
      idUsuario,
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000004',
      'Semana 2',
      2,
      fechaCalculo,
      604800,
      false,
      null,
    );
  }
});
