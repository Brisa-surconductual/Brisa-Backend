import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenClaims,
  AccessTokenEmitido,
  AccessTokenService,
} from '../../application/ports/access-token.service';
import { EstadoRegistro } from '../../domain/enums/estado-registro.enum';
import { Rol } from '../../domain/enums/rol.enum';
import { SesionInvalidaException } from '../../domain/exceptions/usuario.exceptions';

@Injectable()
export class NestJwtAccessTokenService implements AccessTokenService {
  private readonly secret: string;
  private readonly expiresInSeconds: number;

  constructor(private readonly jwtService: JwtService) {
    this.secret = process.env.JWT_SECRET ?? '';
    this.expiresInSeconds = Number(
      process.env.JWT_EXPIRES_IN_SECONDS ?? 28_800,
    );

    if (this.secret.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters.');
    }
    if (
      !Number.isInteger(this.expiresInSeconds) ||
      this.expiresInSeconds <= 0
    ) {
      throw new Error('JWT_EXPIRES_IN_SECONDS must be a positive integer.');
    }
  }

  async emitir(claims: AccessTokenClaims): Promise<AccessTokenEmitido> {
    const token = await this.jwtService.signAsync(claims, {
      secret: this.secret,
      expiresIn: this.expiresInSeconds,
      jwtid: claims.sid,
    });

    return { token, expiresInSeconds: this.expiresInSeconds };
  }

  async verificar(token: string): Promise<AccessTokenClaims> {
    try {
      const claims = await this.jwtService.verifyAsync<AccessTokenClaims>(
        token,
        { secret: this.secret },
      );

      if (
        claims.type !== 'access' ||
        !claims.sub ||
        !claims.sid ||
        !Object.values(Rol).includes(claims.rol) ||
        !Object.values(EstadoRegistro).includes(claims.estadoRegistro)
      ) {
        throw new SesionInvalidaException();
      }

      return claims;
    } catch {
      throw new SesionInvalidaException();
    }
  }
}
