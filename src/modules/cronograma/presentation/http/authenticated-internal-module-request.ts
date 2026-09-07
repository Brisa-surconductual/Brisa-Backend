import type { Request } from 'express';
import { ModuloSistema } from '../../domain/entities/modulo-sistema.entity';

export interface AuthenticatedInternalModuleRequest extends Request {
  moduloInterno: ModuloSistema;
}
