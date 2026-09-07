import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuloApiKeyHasherPort } from '../../application/ports/modulo-api-key-hasher.port';
import { ModuloInternoCredentialsConfigPort } from '../../application/ports/modulo-interno-credentials-config.port';
import { ModuloConsultaContenidoNoAutorizadoException } from '../../domain/exeption/modulo-consulta-contenido-no-autorizado.exception';
import { ModuloSistemaRepository } from '../../domain/repositories/modulo-sistema.repository';
import { AuthenticatedInternalModuleRequest } from '../http/authenticated-internal-module-request';

@Injectable()
export class ModuloInternoAuthGuard implements CanActivate {
  constructor(
    private readonly moduloRepository: ModuloSistemaRepository,
    private readonly credentialsConfig: ModuloInternoCredentialsConfigPort,
    private readonly apiKeyHasher: ModuloApiKeyHasherPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedInternalModuleRequest>();
    const codigoModulo = this.obtenerCodigoModulo(request);
    const apiKey = this.obtenerApiKey(request);
    const hashEsperado = this.credentialsConfig.obtenerApiKeyHash(codigoModulo);

    if (!hashEsperado || !this.apiKeyHasher.comparar(apiKey, hashEsperado)) {
      throw new ModuloConsultaContenidoNoAutorizadoException();
    }

    const modulo =
      await this.moduloRepository.buscarActivoPorCodigo(codigoModulo);
    if (!modulo) {
      throw new ModuloConsultaContenidoNoAutorizadoException();
    }

    request.moduloInterno = modulo;
    return true;
  }

  private obtenerCodigoModulo(
    request: AuthenticatedInternalModuleRequest,
  ): string {
    const encabezado = request.headers['x-module-code'];
    if (typeof encabezado !== 'string') {
      throw new ModuloConsultaContenidoNoAutorizadoException();
    }

    const codigo = encabezado.trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,10}$/.test(codigo)) {
      throw new ModuloConsultaContenidoNoAutorizadoException();
    }

    return codigo;
  }

  private obtenerApiKey(request: AuthenticatedInternalModuleRequest): string {
    const encabezado = request.headers.authorization;
    if (typeof encabezado !== 'string') {
      throw new ModuloConsultaContenidoNoAutorizadoException();
    }

    const coincidencia = /^Bearer\s+(\S{32,512})$/i.exec(encabezado.trim());
    if (!coincidencia) {
      throw new ModuloConsultaContenidoNoAutorizadoException();
    }

    return coincidencia[1];
  }
}
