import { Prisma } from '@prisma/client';
import {
  DimensionPerfilClinico,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { CapturarDimensionPerfilPolicy } from '../../domain/policies/capturar-dimension-perfil.policy';
import {
  PerfilClinicoRepository,
  ResultadoCapturaDimensionPerfil,
  SolicitudCapturaDimensionPerfil,
} from '../../domain/repositories/perfil-clinico.repository';

interface PerfilCapturado {
  tipo_dependencia: TipoDependenciaClinica | null;
  tipo_craving: TipoCravingClinico | null;
  perfil_completo: boolean;
}

export class PrismaPerfilRespuestaRepository implements PerfilClinicoRepository {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async capturarDimension(
    solicitud: SolicitudCapturaDimensionPerfil,
  ): Promise<ResultadoCapturaDimensionPerfil> {
    const policy = new CapturarDimensionPerfilPolicy();
    policy.comprobarModalidad(solicitud.modalidadSesion);
    policy.validarValor(solicitud.dimension, solicitud.valor);
    const dependencia =
      solicitud.dimension === DimensionPerfilClinico.TIPO_DEPENDENCIA;
    // Identificadores fijos; los valores siempre son parámetros SQL.
    const columna = dependencia
      ? Prisma.sql`tipo_dependencia`
      : Prisma.sql`tipo_craving`;
    const fecha = dependencia
      ? Prisma.sql`fecha_captura_dependencia`
      : Prisma.sql`fecha_captura_craving`;
    const tipo = dependencia
      ? Prisma.sql`chat.tipo_dependencia_enum`
      : Prisma.sql`chat.tipo_craving_enum`;
    // ON CONFLICT bloquea la fila y solo completa una dimensión todavía nula.
    // Una captura concurrente nunca reemplaza el valor o la fecha originales.
    const filas = await this.tx.$queryRaw<PerfilCapturado[]>(Prisma.sql`
      INSERT INTO chat.perfil_clinico AS perfil (id_usuario, ${columna}, ${fecha})
      VALUES (${solicitud.idUsuario}::uuid, ${solicitud.valor}::${tipo}, CURRENT_TIMESTAMP)
      ON CONFLICT (id_usuario) DO UPDATE
        SET ${columna} = EXCLUDED.${columna},
            ${fecha} = EXCLUDED.${fecha},
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE perfil.${columna} IS NULL
      RETURNING tipo_dependencia, tipo_craving, perfil_completo
    `);
    const perfil =
      filas[0] ??
      (await this.tx.perfil_clinico.findUniqueOrThrow({
        where: { id_usuario: solicitud.idUsuario },
        select: {
          tipo_dependencia: true,
          tipo_craving: true,
          perfil_completo: true,
        },
      }));
    const valorVigente = dependencia
      ? perfil.tipo_dependencia
      : perfil.tipo_craving;
    if (valorVigente === null)
      throw new Error('Captura de perfil inconsistente.');
    return {
      aplicado: filas.length > 0,
      dimension: solicitud.dimension,
      valorVigente,
      perfilCompleto: perfil.perfil_completo === true,
    };
  }
}
