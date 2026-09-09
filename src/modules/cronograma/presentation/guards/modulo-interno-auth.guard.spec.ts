import { ExecutionContext } from '@nestjs/common';
import { ModuloApiKeyHasherPort } from '../../application/ports/modulo-api-key-hasher.port';
import { ModuloInternoCredentialsConfigPort } from '../../application/ports/modulo-interno-credentials-config.port';
import { ModuloSistema } from '../../domain/entities/modulo-sistema.entity';
import { ModuloConsultaContenidoNoAutorizadoException } from '../../domain/exeption/modulo/modulo-consulta-contenido-no-autorizado.exception';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';
import { ModuloInternoAuthGuard } from './modulo-interno-auth.guard';

describe('ModuloInternoAuthGuard (RF-21)', () => {
  const apiKey = 'api-key-interna-segura-de-32-bytes-minimo';
  const buscarActivoPorCodigo = jest.fn();
  const obtenerApiKeyHash = jest.fn();
  const comparar = jest.fn();
  const repository = {
    listarActivos: jest.fn(),
    buscarActivoPorCodigo,
  } as unknown as jest.Mocked<ModuloSistemaRepository>;
  const credentialsConfig = {
    obtenerApiKeyHash,
  } as unknown as jest.Mocked<ModuloInternoCredentialsConfigPort>;
  const hasher = {
    comparar,
  } as unknown as jest.Mocked<ModuloApiKeyHasherPort>;
  const guard = new ModuloInternoAuthGuard(
    repository,
    credentialsConfig,
    hasher,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    obtenerApiKeyHash.mockReturnValue('a'.repeat(64));
    comparar.mockReturnValue(true);
    buscarActivoPorCodigo.mockResolvedValue(
      new ModuloSistema('00000000-0000-4000-8000-000000000003', 'CHAT', 'Chat'),
    );
  });

  it('autentica el módulo activo y lo adjunta a la solicitud', async () => {
    const { context, request } = crearContexto({
      authorization: `Bearer ${apiKey}`,
      'x-module-code': ' chat ',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(obtenerApiKeyHash).toHaveBeenCalledWith('CHAT');
    expect(comparar).toHaveBeenCalledWith(apiKey, 'a'.repeat(64));
    expect(buscarActivoPorCodigo).toHaveBeenCalledWith('CHAT');
    expect(request.moduloInterno).toEqual(
      expect.objectContaining({ codigo_modulo: 'CHAT' }),
    );
  });

  it.each([
    [{ 'x-module-code': 'CHAT' }, 'sin Authorization'],
    [{ authorization: `Bearer ${apiKey}` }, 'sin código de módulo'],
    [
      { authorization: 'Basic credencial', 'x-module-code': 'CHAT' },
      'con esquema distinto de Bearer',
    ],
  ])('retorna 403 %s: %s', async (headers, caso) => {
    expect(caso).toEqual(expect.any(String));
    const { context } = crearContexto(headers);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ModuloConsultaContenidoNoAutorizadoException,
    );
  });

  it('retorna 403 para un código sin credencial autorizada', async () => {
    obtenerApiKeyHash.mockReturnValue(null);
    const { context } = crearContexto({
      authorization: `Bearer ${apiKey}`,
      'x-module-code': 'DIARIO',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ModuloConsultaContenidoNoAutorizadoException,
    );
    expect(buscarActivoPorCodigo).not.toHaveBeenCalled();
  });

  it('retorna 403 si la API key no coincide', async () => {
    comparar.mockReturnValue(false);
    const { context } = crearContexto({
      authorization: `Bearer ${apiKey}`,
      'x-module-code': 'CHAT',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ModuloConsultaContenidoNoAutorizadoException,
    );
    expect(buscarActivoPorCodigo).not.toHaveBeenCalled();
  });

  it('retorna 403 si el módulo está inactivo o no existe', async () => {
    buscarActivoPorCodigo.mockResolvedValue(null);
    const { context } = crearContexto({
      authorization: `Bearer ${apiKey}`,
      'x-module-code': 'CHAT',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ModuloConsultaContenidoNoAutorizadoException,
    );
  });

  function crearContexto(headers: Record<string, string>): {
    context: ExecutionContext;
    request: Record<string, unknown>;
  } {
    const request: Record<string, unknown> = { headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    return { context, request };
  }
});
