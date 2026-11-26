import { Injectable } from '@nestjs/common';
import type { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import { BitacoraRepository } from '../../ports/auditoria.port';

/** Origen del participante consultado, según lo que traiga la ruta protegida. */
export type ParticipanteConsultado = { codigo: string } | { idSesion: string };

/**
 * RF-04 / RF-145: ¿el usuario tiene un permiso vigente con ese alcance sobre el
 * participante? Lo usa el guard `@RequierePermisoIndividual`.
 */
@Injectable()
export class VerificarPermisoIndividualUseCase {
  constructor(
    private readonly permisos: PermisosIndividualesRepository,
    private readonly transacciones: BitacoraRepository,
  ) {}

  execute(
    idUsuario: string,
    participante: ParticipanteConsultado,
    alcance: AlcancePermiso,
  ): Promise<boolean> {
    return this.transacciones.enTransaccion((tx) =>
      this.permisos.tieneVigente(tx, idUsuario, participante, alcance),
    );
  }
}
