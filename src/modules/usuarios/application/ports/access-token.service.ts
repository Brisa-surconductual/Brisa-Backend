import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Rol } from '../../domain/enums/rol.enum';

export interface AccessTokenClaims {
  sub: string;
  sid: string;
  rol: Rol;
  estadoRegistro: EstadoRegistro;
  type: 'access';
}

export interface AccessTokenEmitido {
  token: string;
  expiresInSeconds: number;
}

export abstract class AccessTokenService {
  abstract emitir(claims: AccessTokenClaims): Promise<AccessTokenEmitido>;
  abstract verificar(token: string): Promise<AccessTokenClaims>;
}
