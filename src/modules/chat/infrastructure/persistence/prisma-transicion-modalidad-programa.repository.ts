import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Rol } from '../../../usuarios/domain/enums/rol.enum';
import { EstadoCuenta } from '../../../usuarios/domain/enums/estado-cuenta';
import { ModalidadConversacional } from '../../domain/enums/arbol-conversacional.enums';
import {
  AsignacionModalidadVigente,
} from '../../domain/repositories/modalidad-programa.repository';
import {
  ResultadoTransicionModalidad,
  SolicitudTransicionModalidad,
  TransicionModalidadProgramaRepository,
} from '../../domain/repositories/transicion-modalidad-programa.repository';
import { EvaluadorElegibilidadModalidad } from '../../domain/services/evaluador-elegibilidad-modalidad.service';
import { PoliticaParticipanteActivoPrograma } from '../../domain/services/politica-participante-activo-programa.service';

@Injectable()
export class PrismaTransicionModalidadProgramaRepository
  extends TransicionModalidadProgramaRepository {
  private readonly evaluador = new EvaluadorElegibilidadModalidad();
  private readonly politica = new PoliticaParticipanteActivoPrograma();

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async habilitarPersonalizada(
    solicitud: SolicitudTransicionModalidad,
  ): Promise<ResultadoTransicionModalidad> {
    const maximoIntentos = 3;

    for (let intento = 1; intento <= maximoIntentos; intento += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const asignaciones = await tx.tipo_terapia.findMany({
              where: {
                id_programa: solicitud.idPrograma,
                fecha_vigencia_hasta: null,
              },
              select: {
                id_usuario: true,
                modalidad: true,
                usuarios_tipo_terapia_id_usuarioTousuarios: {
                  select: {
                    rol: true,
                    estado_cuenta: true,
                    perfil_clinico: {
                      select: { perfil_completo: true },
                    },
                  },
                },
              },
            });

            if (asignaciones.length === 0) {
              throw new ConflictException({
                codigo: 'SIN_ASIGNACIONES_VIGENTES',
              });
            }

            const filas: AsignacionModalidadVigente[] =
              asignaciones.map((asignacion) => {
                const usuario =
                  asignacion.usuarios_tipo_terapia_id_usuarioTousuarios;

                return {
                  idUsuario: asignacion.id_usuario,
                  modalidad: asignacion.modalidad as ModalidadConversacional,
                  rol: usuario.rol as Rol,
                  estadoCuenta: usuario.estado_cuenta as EstadoCuenta,
                  perfilCompleto:
                    usuario.perfil_clinico?.perfil_completo === true,
                };
              });

            const participantesActivos = this.politica.filtrar(filas);

            const modalidadGrupal = participantesActivos.every(
              (fila) =>
                fila.modalidad === ModalidadConversacional.GRUPAL,
            );

            const evaluacion = this.evaluador.evaluar({
              totalUsuariosActivos: participantesActivos.length,
              conPerfilCompleto: participantesActivos.filter(
                (participante) => participante.perfilCompleto,
              ).length,
              modalidadGrupal,
            });

            if (!modalidadGrupal) {
              throw new ConflictException({
                codigo: 'MODALIDAD_NO_GRUPAL',
              });
            }

            if (evaluacion.totalUsuariosActivos === 0) {
              throw new ConflictException({
                codigo: 'SIN_PARTICIPANTES_ACTIVOS',
              });
            }

            if (!evaluacion.elegible) {
              throw new ConflictException({
                codigo: 'PERFILES_INCOMPLETOS',
                sin_perfil_completo: evaluacion.sinPerfilCompleto,
              });
            }

            const fecha = new Date();
            const idsUsuarios = participantesActivos.map((participante) => participante.idUsuario);

            const cierre = await tx.tipo_terapia.updateMany({
              where: {
                id_programa: solicitud.idPrograma,
                id_usuario: { in: idsUsuarios },
                fecha_vigencia_hasta: null,
                modalidad: 'GRUPAL',
              },
              data: {
                fecha_vigencia_hasta: fecha,
              },
            });

            if (cierre.count !== participantesActivos.length) {
              throw new ConflictException({
                codigo: 'TRANSICION_CONCURRENTE',
              });
            }

            const nuevas = await tx.tipo_terapia.createMany({
              data: idsUsuarios.map((idUsuario) => ({
                id_usuario: idUsuario,
                id_programa: solicitud.idPrograma,
                modalidad: 'PERSONALIZADA' as const,
                fecha_vigencia_desde: fecha,
                administrador_responsable: solicitud.idAdministrador,
              })),
            });

            if (nuevas.count !== participantesActivos.length) {
              throw new ConflictException({
                codigo: 'TRANSICION_INCOMPLETA',
              });
            }

            return {
              idPrograma: solicitud.idPrograma,
              modalidad: ModalidadConversacional.PERSONALIZADA,
              usuariosActualizados: nuevas.count,
              fechaVigenciaDesde: fecha,
              administradorResponsable: solicitud.idAdministrador,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error: unknown) {
        const conflictoSerializable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!conflictoSerializable || intento === maximoIntentos) {
          throw error;
        }
      }
    }

    throw new Error('No fue posible completar la transicion.');
  }
}
