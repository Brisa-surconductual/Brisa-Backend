import { Prisma } from '@prisma/client';
import { VariablesRespuestaTransaccion } from '../../application/ports/procesar-respuesta.port';
import { VariableTaxonomia } from '../../domain/entities/taxonomia/variable-taxonomia.entity';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import {
  SnapshotPerfilEtiquetado,
  VariableEtiquetada,
} from '../../domain/repositories/variables-etiquetadas.repository';
import {
  buscarVariablePorCodigo,
  versionTaxonomiaActual,
} from './prisma-taxonomia-variables.repository';

/** RF-30B: etiquetado dentro de la transacción del POST de respuestas. */
export class PrismaVariablesRespuestaRepository implements VariablesRespuestaTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  buscarVariable(codigo: string): Promise<VariableTaxonomia | null> {
    return buscarVariablePorCodigo(this.tx, codigo);
  }

  async versionActual(): Promise<string> {
    return (await versionTaxonomiaActual(this.tx)).toString();
  }

  /** Perfil vigente en esta transacción (incluye una captura recién hecha). */
  async snapshotPerfil(idUsuario: string): Promise<SnapshotPerfilEtiquetado> {
    const perfil = await this.tx.perfil_clinico.findUnique({
      where: { id_usuario: idUsuario },
      select: { tipo_dependencia: true, tipo_craving: true },
    });
    return {
      tipoDependencia:
        (perfil?.tipo_dependencia as TipoDependenciaClinica | null) ?? null,
      tipoCraving: (perfil?.tipo_craving as TipoCravingClinico | null) ?? null,
    };
  }

  async registrar(etiqueta: VariableEtiquetada): Promise<void> {
    await this.tx.$executeRaw(Prisma.sql`
      INSERT INTO chat.variables_etiquetadas (
        id_interaccion, id_sesion, id_usuario, id_nodo, id_variable,
        codigo_variable, valor, elementos, modalidad, tipo_dependencia,
        tipo_craving, estado_etiquetado, version_taxonomia, secuencia,
        timestamp_interaccion
      ) VALUES (
        ${etiqueta.idInteraccion}::uuid, ${etiqueta.idSesion}::uuid,
        ${etiqueta.idUsuario}::uuid, ${etiqueta.idNodo}::uuid,
        ${etiqueta.idVariable}::uuid, ${etiqueta.codigoVariable},
        ${JSON.stringify(etiqueta.valor)}::jsonb,
        ${JSON.stringify(etiqueta.elementos)}::jsonb,
        ${etiqueta.modalidad}::chat.modalidad_enum,
        ${etiqueta.perfil.tipoDependencia}::chat.tipo_dependencia_enum,
        ${etiqueta.perfil.tipoCraving}::chat.tipo_craving_enum,
        ${etiqueta.estado}::chat.estado_etiquetado_enum,
        ${etiqueta.versionTaxonomia}, ${etiqueta.secuencia},
        ${etiqueta.timestampInteraccion}
      )
    `);
  }
}
