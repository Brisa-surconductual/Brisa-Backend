import type { Request } from 'express';
import { Sesion } from '../../domain/entities/sesiones.entity';
import { Usuario } from '../../domain/entities/usuarios.entity';

export interface AuthenticatedSessionRequest extends Request {
  autenticacion: {
    sesion: Sesion;
    usuario: Usuario;
  };
}
