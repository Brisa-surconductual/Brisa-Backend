import { CreacionUsuarioUseCase } from './use-cases/creacion-usuario.use-case';
import { RecuperacionUseCase } from './use-cases/recuperacion-contrasena.use-case';

export const UsuarioAplicationProviders = [

    CreacionUsuarioUseCase,
    RecuperacionUseCase,



];