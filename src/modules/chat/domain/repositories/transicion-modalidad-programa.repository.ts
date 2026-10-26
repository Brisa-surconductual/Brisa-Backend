import { ModalidadConversacional } from '../enums/arbol-conversacional.enums';

export interface SolicitudTransicionModalidad {
  readonly idPrograma: number;
  readonly idAdministrador: string;
}

export interface ResultadoTransicionModalidad {
  readonly idPrograma: number;
  readonly modalidad: ModalidadConversacional;
  readonly usuariosActualizados: number;
  readonly fechaVigenciaDesde: Date;
  readonly administradorResponsable: string;
}

/**
 * La implementacion debe revalidar la elegibilidad y actualizar
 * todas las asignaciones dentro de una unica transaccion.
 */
export abstract class TransicionModalidadProgramaRepository {
  abstract habilitarPersonalizada(
    solicitud: SolicitudTransicionModalidad,
  ): Promise<ResultadoTransicionModalidad>;
}
