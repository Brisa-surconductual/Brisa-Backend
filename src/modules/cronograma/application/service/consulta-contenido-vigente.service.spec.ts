import { ModuloSistema } from '../../domain/entities/modulo-sistema.entity';
import { ConsultaContenidoVigenteException } from '../../domain/exeption/contenido/consulta-contenido-vigente.exception';
import { CronogramaUsuarioNoAsignadoException } from '../../domain/exeption/cronograma/cronograma-usuario-no-asignado.exception';
import { ModuloConsultaContenidoNoAutorizadoException } from '../../domain/exeption/modulo/modulo-consulta-contenido-no-autorizado.exception';
import { ContenidoVigenteUsuarioRepository } from '../../domain/repositories/contenido-vigente-usuario.repository';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';
import { CodigoModuloConsultaContenido } from '../ports/consulta-contenido-vigente.port';
import { ConsultarContenidoVigenteUsuarioUseCase } from '../use-cases/contenido/consultar-contenido-vigente-usuario.use-case';
import { ConsultaContenidoVigenteService } from './consulta-contenido-vigente.service';

describe('ConsultaContenidoVigenteService entre módulos', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const moduloRepository: jest.Mocked<ModuloSistemaRepository> = {
    listarActivos: jest.fn(),
    buscarActivoPorCodigo: jest.fn(),
  };
  const contenidoRepository: jest.Mocked<ContenidoVigenteUsuarioRepository> = {
    consultar: jest.fn(),
  };
  const service = new ConsultaContenidoVigenteService(
    moduloRepository,
    new ConsultarContenidoVigenteUsuarioUseCase(contenidoRepository),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T15:00:00.000Z'));
    moduloRepository.buscarActivoPorCodigo.mockImplementation((codigo) =>
      Promise.resolve(
        new ModuloSistema('modulo-1', codigo, 'Módulo autorizado'),
      ),
    );
    contenidoRepository.consultar.mockResolvedValue([]);
  });

  afterEach(() => jest.useRealTimers());

  it.each(['CHAT', 'SEGUIM', 'GAMIF', 'NOTIF'] as const)(
    'autoriza %s y consulta con la hora del servidor',
    async (codigo) => {
      await expect(service.consultar(idUsuario, codigo)).resolves.toEqual([]);
      expect(moduloRepository.buscarActivoPorCodigo.mock.calls).toEqual([
        [codigo],
      ]);
      expect(contenidoRepository.consultar.mock.calls).toEqual([
        [idUsuario, new Date('2026-10-08T15:00:00.000Z')],
      ]);
    },
  );

  it('deniega un código ajeno a RF-21 antes de consultar repositorios', async () => {
    await expect(
      service.consultar(idUsuario, 'DIARIO' as CodigoModuloConsultaContenido),
    ).rejects.toBeInstanceOf(ModuloConsultaContenidoNoAutorizadoException);
    expect(moduloRepository.buscarActivoPorCodigo.mock.calls).toHaveLength(0);
    expect(contenidoRepository.consultar.mock.calls).toHaveLength(0);
  });

  it('deniega un módulo inexistente o inactivo', async () => {
    moduloRepository.buscarActivoPorCodigo.mockResolvedValue(null);
    await expect(service.consultar(idUsuario, 'CHAT')).rejects.toBeInstanceOf(
      ModuloConsultaContenidoNoAutorizadoException,
    );
    expect(contenidoRepository.consultar.mock.calls).toHaveLength(0);
  });

  it('conserva el 404 de la consulta original', async () => {
    contenidoRepository.consultar.mockRejectedValue(
      new CronogramaUsuarioNoAsignadoException(),
    );
    await expect(service.consultar(idUsuario, 'CHAT')).rejects.toBeInstanceOf(
      CronogramaUsuarioNoAsignadoException,
    );
  });

  it('oculta errores inesperados al verificar la identidad del módulo', async () => {
    moduloRepository.buscarActivoPorCodigo.mockRejectedValue(
      new Error('password authentication failed'),
    );
    await expect(service.consultar(idUsuario, 'CHAT')).rejects.toBeInstanceOf(
      ConsultaContenidoVigenteException,
    );
    expect(contenidoRepository.consultar.mock.calls).toHaveLength(0);
  });
});
