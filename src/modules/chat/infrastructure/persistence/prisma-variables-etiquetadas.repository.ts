import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ElementoEtiquetado } from '../../domain/entities/taxonomia/variable-taxonomia.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/perfil-clinico.enum';
import { EstadoEtiquetado } from '../../domain/enums/tipo-valor-variable.enum';
import {
  VariableEtiquetada,
  VariablesEtiquetadasRepository,
} from '../../domain/repositories/variables-etiquetadas.repository';

interface FilaVariableEtiquetada {
  id_interaccion: string;
  id_sesion: string;
  id_usuario: string;
  id_nodo: string;
  id_variable: string;
  codigo_variable: string;
  valor: unknown;
  elementos: ElementoEtiquetado[];
  modalidad: string;
  tipo_dependencia: string | null;
  tipo_craving: string | null;
  estado_etiquetado: string;
  version_taxonomia: string;
  secuencia: number;
  timestamp_interaccion: Date;
}

/** RF-30B → RF-53: lectura de `chat.variables_etiquetadas`. */
@Injectable()
export class PrismaVariablesEtiquetadasRepository implements VariablesEtiquetadasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorSesion(idSesion: string): Promise<VariableEtiquetada[]> {
    const filas = await this.prisma.$queryRaw<FilaVariableEtiquetada[]>(
      Prisma.sql`
        SELECT id_interaccion::text AS id_interaccion, id_sesion::text AS id_sesion,
          id_usuario::text AS id_usuario, id_nodo::text AS id_nodo,
          id_variable::text AS id_variable, codigo_variable, valor, elementos,
          modalidad::text AS modalidad, tipo_dependencia::text AS tipo_dependencia,
          tipo_craving::text AS tipo_craving, estado_etiquetado::text AS estado_etiquetado,
          version_taxonomia, secuencia, timestamp_interaccion
        FROM chat.variables_etiquetadas
        WHERE id_sesion = ${idSesion}::uuid
        ORDER BY secuencia
      `,
    );
    return filas.map((fila) => ({
      idInteraccion: fila.id_interaccion,
      idSesion: fila.id_sesion,
      idUsuario: fila.id_usuario,
      idNodo: fila.id_nodo,
      idVariable: fila.id_variable,
      codigoVariable: fila.codigo_variable,
      valor: fila.valor,
      elementos: fila.elementos,
      modalidad: fila.modalidad as ModalidadConversacional,
      perfil: {
        tipoDependencia: fila.tipo_dependencia as TipoDependenciaClinica | null,
        tipoCraving: fila.tipo_craving as TipoCravingClinico | null,
      },
      estado: fila.estado_etiquetado as EstadoEtiquetado,
      versionTaxonomia: fila.version_taxonomia,
      secuencia: Number(fila.secuencia),
      timestampInteraccion: new Date(fila.timestamp_interaccion),
    }));
  }
}
