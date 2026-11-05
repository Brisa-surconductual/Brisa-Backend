import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';

export class ElegibilidadModalidadDtoResponse {
  id_programa!: number;
  modalidad_actual!: ModalidadConversacional | null;
  total_usuarios_activos!: number;
  con_perfil_completo!: number;
  sin_perfil_completo!: number;
  elegible!: boolean;

  static crear(
    idPrograma: number,
    modalidadActual: ModalidadConversacional | null,
    conteo: {
      readonly totalUsuariosActivos: number;
      readonly conPerfilCompleto: number;
      readonly sinPerfilCompleto: number;
      readonly elegible: boolean;
    },
  ): ElegibilidadModalidadDtoResponse {
    return {
      id_programa: idPrograma,
      modalidad_actual: modalidadActual,
      total_usuarios_activos: conteo.totalUsuariosActivos,
      con_perfil_completo: conteo.conPerfilCompleto,
      sin_perfil_completo: conteo.sinPerfilCompleto,
      elegible: conteo.elegible,
    };
  }
}

export class TransicionModalidadDtoResponse {
  id_programa!: number;
  modalidad!: ModalidadConversacional;
  usuarios_actualizados!: number;
  fecha_vigencia_desde!: string;
  administrador_responsable!: string;

  static crear(
    idPrograma: number,
    usuariosActualizados: number,
    fechaVigenciaDesde: Date,
    idAdministrador: string,
  ): TransicionModalidadDtoResponse {
    return {
      id_programa: idPrograma,
      modalidad: ModalidadConversacional.PERSONALIZADA,
      usuarios_actualizados: usuariosActualizados,
      fecha_vigencia_desde: fechaVigenciaDesde.toISOString(),
      administrador_responsable: idAdministrador,
    };
  }
}
