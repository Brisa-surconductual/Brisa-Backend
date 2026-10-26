import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import {
  DatosNuevaSesionConversacional,
  ResultadoInicioSesionConversacional,
  SesionConversacional,
  SesionConversacionalRepository,
} from '../../domain/repositories/sesion-conversacional.repository';

type SesionPrismaConEstado = Prisma.chat_sesionesGetPayload<{
  include: { estado_sesiones: true };
}>;

@Injectable()
export class PrismaSesionConversacionalRepository implements SesionConversacionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarUltimaReanudable(
    idUsuario: string,
  ): Promise<SesionConversacional | null> {
    const sesion = await this.prisma.chat_sesiones.findFirst({
      where: {
        id_usuario: idUsuario,
        estado_sesiones: {
          is: {
            estado_actual: { in: ['ACTIVA', 'PAUSADA'] },
          },
        },
      },
      include: { estado_sesiones: true },
      orderBy: [
        { fecha_ultima_interaccion: 'desc' },
        { fecha_inicio: 'desc' },
        { id_sesion: 'desc' },
      ],
    });

    if (sesion === null || sesion.estado_sesiones === null) {
      return null;
    }

    return this.mapearSesion(sesion);
  }

  async iniciarOReanudar(
    datos: DatosNuevaSesionConversacional,
  ): Promise<ResultadoInicioSesionConversacional> {
    const maximoIntentos = 3;

    for (let intento = 1; intento <= maximoIntentos; intento += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const existente = await tx.chat_sesiones.findFirst({
              where: {
                id_usuario: datos.idUsuario,
                estado_sesiones: {
                  is: {
                    estado_actual: { in: ['ACTIVA', 'PAUSADA'] },
                  },
                },
              },
              include: { estado_sesiones: true },
              orderBy: [
                { fecha_ultima_interaccion: 'desc' },
                { fecha_inicio: 'desc' },
                { id_sesion: 'desc' },
              ],
            });

            if (existente !== null && existente.estado_sesiones !== null) {
              if (existente.estado_sesiones.estado_actual === 'PAUSADA') {
                const ahora = new Date();

                const estadoActualizado = await tx.estado_sesiones.update({
                  where: { id_sesion: existente.id_sesion },
                  data: {
                    estado_actual: 'ACTIVA',
                    fecha_reanudacion: ahora,
                    fecha_actualizacion: ahora,
                  },
                });

                return {
                  reanudada: true,
                  sesion: this.mapearSesion({
                    ...existente,
                    estado_sesiones: estadoActualizado,
                  }),
                };
              }

              return {
                reanudada: true,
                sesion: this.mapearSesion(existente),
              };
            }

            const creada = await tx.chat_sesiones.create({
              data: {
                id_usuario: datos.idUsuario,
                id_flujo_conversacional: datos.idFlujoConversacional,
                version_arbol_utilizada: datos.versionArbolUtilizada,
                modalidad_activa: datos.modalidadActiva,
                tipo_dependencia: datos.tipoDependencia,
                tipo_craving: datos.tipoCraving,
                id_nodo_actual: datos.idNodoInicial,
                estado_sesiones: {
                  create: {
                    estado_actual: 'ACTIVA',
                  },
                },
              },
              include: { estado_sesiones: true },
            });

            return {
              reanudada: false,
              sesion: this.mapearSesion(creada),
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

    throw new Error('No fue posible iniciar o reanudar la sesión.');
  }

  private mapearSesion(sesion: SesionPrismaConEstado): SesionConversacional {
    if (sesion.estado_sesiones === null) {
      throw new Error('La sesión no tiene un estado registrado.');
    }

    return {
      idSesion: sesion.id_sesion,
      idUsuario: sesion.id_usuario,
      idFlujoConversacional: sesion.id_flujo_conversacional,
      versionArbolUtilizada: sesion.version_arbol_utilizada,
      modalidadActiva: sesion.modalidad_activa as ModalidadConversacional,
      tipoDependencia: sesion.tipo_dependencia as TipoDependenciaClinica | null,
      tipoCraving: sesion.tipo_craving as TipoCravingClinico | null,
      idNodoActual: sesion.id_nodo_actual,
      estadoActual: sesion.estado_sesiones.estado_actual,
      fechaInicio: sesion.fecha_inicio,
      fechaUltimaInteraccion: sesion.fecha_ultima_interaccion,
    };
  }
}
