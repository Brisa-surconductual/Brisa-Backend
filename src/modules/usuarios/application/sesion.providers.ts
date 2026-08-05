import { IniciarSesionUseCase } from './use-cases/iniciar-sesion.use-case';
import { CerrarSesionUseCase } from './use-cases/cerrar-sesion.use-case';
import { RegistrarActividadSesionUseCase } from './use-cases/registrar-actividad-sesion.use-case';
import { ExpirarSesionesUseCase } from './use-cases/expirar-sesiones.use-case';
import { RenovarCsrfSesionUseCase } from './use-cases/renovar-csrf-sesion.use-case';

export const SesionApplicationProviders = [
  IniciarSesionUseCase,
  CerrarSesionUseCase,
  RegistrarActividadSesionUseCase,
  ExpirarSesionesUseCase,
  RenovarCsrfSesionUseCase,
];
