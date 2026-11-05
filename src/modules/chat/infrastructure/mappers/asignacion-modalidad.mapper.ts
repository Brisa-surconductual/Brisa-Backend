import { Prisma } from '@prisma/client';
import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { AsignacionModalidad } from '../../domain/entities/modalidad/asignacion-modalidad.entity';
import { AsignacionModalidadVigente } from '../../domain/entities/modalidad/asignacion-modalidad-vigente';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';

/** Columnas que se leen de cada asignación vigente, con los datos de su usuario. */
export const ASIGNACION_VIGENTE_SELECT = {
  id_tipo_terapia: true,
  id_usuario: true,
  id_programa: true,
  modalidad: true,
  fecha_vigencia_desde: true,
  administrador_responsable: true,
  usuarios_tipo_terapia_id_usuarioTousuarios: {
    select: {
      rol: true,
      estado_cuenta: true,
      perfil_clinico: { select: { perfil_completo: true } },
    },
  },
} satisfies Prisma.tipo_terapiaSelect;

export type AsignacionVigenteFila = Prisma.tipo_terapiaGetPayload<{
  select: typeof ASIGNACION_VIGENTE_SELECT;
}>;

export class AsignacionModalidadMapper {
  static toDomain(fila: AsignacionVigenteFila): AsignacionModalidadVigente {
    const usuario = fila.usuarios_tipo_terapia_id_usuarioTousuarios;

    return new AsignacionModalidadVigente(
      new AsignacionModalidad(
        fila.id_tipo_terapia,
        fila.id_usuario,
        fila.id_programa,
        fila.modalidad as ModalidadConversacional,
        fila.fecha_vigencia_desde,
        null,
        fila.administrador_responsable,
      ),
      (usuario.rol as Rol) === Rol.ESTUDIANTE,
      (usuario.estado_cuenta as EstadoCuenta) === EstadoCuenta.ACTIVA,
      usuario.perfil_clinico?.perfil_completo === true,
    );
  }

  static toCreateData(
    asignacion: AsignacionModalidad,
  ): Prisma.tipo_terapiaCreateManyInput {
    return {
      id_tipo_terapia: asignacion.idAsignacion,
      id_usuario: asignacion.idUsuario,
      id_programa: asignacion.idPrograma,
      modalidad: asignacion.modalidad,
      fecha_vigencia_desde: asignacion.fechaVigenciaDesde,
      administrador_responsable: asignacion.administradorResponsable,
    };
  }
}
