import { CreacionUsuarioUseCase } from './use-cases/creacion-usuario.use-case';
import { RecuperacionUseCase } from './use-cases/recuperacion-contrasena.use-case';
import { ActualizarContrasenaUseCase } from './use-cases/actualizar-contraseña.use-case';
import { ExpirarCodigosUseCase } from './use-cases/expirar-codigos.use-case';
import {CreacionAdministradorUseCase} from "./use-cases/creacion-adimistrador.use-case";

export const UsuarioAplicationProviders = [

    CreacionUsuarioUseCase,
    RecuperacionUseCase,
    ActualizarContrasenaUseCase,
    ExpirarCodigosUseCase,
    CreacionAdministradorUseCase,
    
];