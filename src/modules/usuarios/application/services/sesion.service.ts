import { Injectable } from "@nestjs/common";
import { SessionConfig } from "../ports/session-config";
import { SessionTokenGenerator } from "../ports/session-token-generator";
import { SessionTokenHasher } from "../ports/session-token-hasher";
import { AlcanceSesion } from "../../domain/enums/alcance-sesion.enum";
import { Sesion } from "../../domain/entities/sesiones.entity";
import { SesionDtoResponse } from "../dto/sesion.dto-response";


@Injectable()
export class SessionService {
  constructor(
    private readonly sessionTokenGenerator: SessionTokenGenerator,
    private readonly sessionTokenHasher: SessionTokenHasher,
    private readonly sessionConfig: SessionConfig,
  ) {}

  async crearSesion(
    idUsuario: string,
    alcance: AlcanceSesion,
  ): Promise<SesionDtoResponse> {

    const tokenSesion =
      this.sessionTokenGenerator.generarToken();

    const tokenHash =
      await this.sessionTokenHasher.hash(tokenSesion);

    const csrfToken =
      this.sessionTokenGenerator.generarToken();

    const csrfTokenHash =
      await this.sessionTokenHasher.hash(csrfToken);

    const sesion = Sesion.iniciar(
      idUsuario,
      tokenHash,
      csrfTokenHash,
      alcance,
      this.sessionConfig.obtenerLimiteInactividadMinutos(),
    );

    return {
      sesion,
      tokenSesion,
      csrfToken,
    };
  }
}