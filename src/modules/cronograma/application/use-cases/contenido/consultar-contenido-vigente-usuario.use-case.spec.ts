import { ContenidoVigenteUsuario } from '../../../domain/entities/contenido-vigente-usuario.entity';
import { EstadoContenido } from '../../../domain/enums/estado-contenido.enum';
import { TipoContenido } from '../../../domain/enums/tipo-contenido.enum';
import { ConsultaContenidoVigenteException } from '../../../domain/exeption/contenido/consulta-contenido-vigente.exception';
import { CronogramaUsuarioNoAsignadoException } from '../../../domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { ContenidoVigenteUsuarioRepository } from '../../../domain/repositories/contenido-vigente-usuario.repository';
import { ConsultarContenidoVigenteUsuarioUseCase } from './consultar-contenido-vigente-usuario.use-case';

describe('ConsultarContenidoVigenteUsuarioUseCase (RF-21)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const fechaConsulta = new Date('2026-09-15T12:00:00.000Z');
  const consultar = jest.fn();
  const repository = {
    consultar,
  } as unknown as jest.Mocked<ContenidoVigenteUsuarioRepository>;
  const useCase = new ConsultarContenidoVigenteUsuarioUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('delega el cálculo completo a PostgreSQL y transforma sus filas', async () => {
    consultar.mockResolvedValue([crearContenido()]);

    await expect(useCase.execute(idUsuario, fechaConsulta)).resolves.toEqual([
      expect.objectContaining({
        id_contenido: '00000000-0000-4000-8000-000000000002',
        tipo_contenido: TipoContenido.INFORMATIVO,
        nombre_unidad: 'Semana 2',
        estado_disponibilidad: EstadoContenido.ACTIVO,
      }),
    ]);
    expect(consultar).toHaveBeenCalledWith(idUsuario, fechaConsulta);
  });

  it('retorna una lista vacía sin introducir lógica temporal', async () => {
    consultar.mockResolvedValue([]);

    await expect(useCase.execute(idUsuario, fechaConsulta)).resolves.toEqual(
      [],
    );
  });

  it('propaga el 404 producido por la función SQL', async () => {
    consultar.mockRejectedValue(new CronogramaUsuarioNoAsignadoException());

    await expect(
      useCase.execute(idUsuario, fechaConsulta),
    ).rejects.toBeInstanceOf(CronogramaUsuarioNoAsignadoException);
  });

  it('oculta errores inesperados de infraestructura', async () => {
    consultar.mockRejectedValue(new Error('detalle sensible'));

    await expect(
      useCase.execute(idUsuario, fechaConsulta),
    ).rejects.toBeInstanceOf(ConsultaContenidoVigenteException);
  });

  function crearContenido(): ContenidoVigenteUsuario {
    return new ContenidoVigenteUsuario(
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000003',
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
