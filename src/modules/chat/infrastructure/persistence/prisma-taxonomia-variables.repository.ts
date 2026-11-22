import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { VariableTaxonomia } from '../../domain/entities/taxonomia/variable-taxonomia.entity';
import { AccionAuditoriaArbol } from '../../domain/enums/accion-auditoria-arbol.enum';
import { VariableDuplicadaException } from '../../domain/exceptions/taxonomia.exceptions';
import {
  TaxonomiaVariablesRepository,
  TaxonomiaVariablesTransaccion,
  VariableTaxonomiaConUso,
} from '../../domain/repositories/taxonomia-variables.repository';
import { VersionTaxonomia } from '../../domain/value-objects/version-taxonomia.vo';
import {
  COLUMNAS_VARIABLE,
  EN_USO_PUBLICADO,
  FilaVariableTaxonomia,
  TaxonomiaVariableMapper,
} from '../mappers/taxonomia-variable.mapper';

type Cliente = Prisma.TransactionClient | PrismaService;

/** Versión vigente: la última registrada. */
export async function versionTaxonomiaActual(
  cliente: Cliente,
): Promise<VersionTaxonomia> {
  const filas = await cliente.$queryRaw<{ version: string }[]>(Prisma.sql`
    SELECT version FROM chat.taxonomia_versiones ORDER BY id_version DESC LIMIT 1
  `);
  if (filas.length === 0)
    throw new Error('La taxonomía de variables no tiene versión inicial.');
  return VersionTaxonomia.de(filas[0].version);
}

export async function buscarVariablePorCodigo(
  cliente: Cliente,
  codigo: string,
  bloquear = false,
): Promise<VariableTaxonomia | null> {
  const filas = await cliente.$queryRaw<FilaVariableTaxonomia[]>(Prisma.sql`
    SELECT ${COLUMNAS_VARIABLE} FROM chat.taxonomia_variables v
    WHERE v.codigo = ${codigo}
    ${bloquear ? Prisma.sql`FOR UPDATE` : Prisma.empty}
  `);
  return filas.length === 0 ? null : TaxonomiaVariableMapper.toDomain(filas[0]);
}

class PrismaTaxonomiaVariablesTransaccion implements TaxonomiaVariablesTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  bloquearPorCodigo(codigo: string): Promise<VariableTaxonomia | null> {
    return buscarVariablePorCodigo(this.tx, codigo, true);
  }

  async existeCodigo(codigo: string): Promise<boolean> {
    return (await buscarVariablePorCodigo(this.tx, codigo)) !== null;
  }

  async estaEnUsoPublicado(codigo: string): Promise<boolean> {
    const filas = await this.tx.$queryRaw<{ en_uso: boolean }[]>(Prisma.sql`
      SELECT ${EN_USO_PUBLICADO} AS en_uso
      FROM chat.taxonomia_variables v WHERE v.codigo = ${codigo}
    `);
    return filas[0]?.en_uso === true;
  }

  async insertar(
    variable: VariableTaxonomia,
    idActor: string,
  ): Promise<VariableTaxonomia> {
    const filas = await this.tx.$queryRaw<{ id_variable: string }[]>(Prisma.sql`
      INSERT INTO chat.taxonomia_variables (
        codigo, nombre, descripcion, tipo_valor, valores,
        tipos_entrada_permitidos, etiquetas, habilitada, creado_por
      ) VALUES (
        ${variable.codigo}, ${variable.nombre}, ${variable.descripcion},
        ${variable.tipoValor}::chat.tipo_valor_variable_enum,
        ${variable.valores === null ? null : [...variable.valores]}::text[],
        ${[...variable.tiposEntradaPermitidos]}::text[],
        ${JSON.stringify(variable.etiquetas)}::jsonb,
        ${variable.habilitada}, ${idActor}::uuid
      )
      RETURNING id_variable::text AS id_variable
    `);
    return variable.conId(filas[0].id_variable);
  }

  async actualizarEstado(variable: VariableTaxonomia): Promise<void> {
    await this.tx.$executeRaw(Prisma.sql`
      UPDATE chat.taxonomia_variables
      SET habilitada = ${variable.habilitada}, fecha_actualizacion = now()
      WHERE codigo = ${variable.codigo}
    `);
  }

  versionActual(): Promise<VersionTaxonomia> {
    return versionTaxonomiaActual(this.tx);
  }

  async registrarVersion(
    accion: AccionAuditoriaArbol,
    variable: VariableTaxonomia,
    idActor: string,
  ): Promise<VersionTaxonomia> {
    const siguiente = (await this.versionActual()).siguiente();
    await this.tx.$executeRaw(Prisma.sql`
      INSERT INTO chat.taxonomia_versiones (version, accion, codigo_variable, id_actor)
      VALUES (${siguiente.toString()}, ${accion}, ${variable.codigo}, ${idActor}::uuid)
    `);
    // Igual que 03-G: la taxonomía no pertenece a un árbol, el flujo es nulo.
    await this.tx.auditoria_arboles.create({
      data: {
        id_flujo: null,
        id_actor: idActor,
        accion,
        id_objeto: variable.idVariable,
      },
    });
    return siguiente;
  }
}

/** RF-30B: taxonomía en `chat.taxonomia_variables` / `chat.taxonomia_versiones`. */
@Injectable()
export class PrismaTaxonomiaVariablesRepository implements TaxonomiaVariablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  versionActual(): Promise<VersionTaxonomia> {
    return versionTaxonomiaActual(this.prisma);
  }

  async listar(
    incluirDeshabilitadas: boolean,
  ): Promise<VariableTaxonomiaConUso[]> {
    const filas = await this.prisma.$queryRaw<
      (FilaVariableTaxonomia & { en_uso_publicado: boolean })[]
    >(Prisma.sql`
      SELECT ${COLUMNAS_VARIABLE}, ${EN_USO_PUBLICADO} AS en_uso_publicado
      FROM chat.taxonomia_variables v
      ${incluirDeshabilitadas ? Prisma.empty : Prisma.sql`WHERE v.habilitada`}
      ORDER BY v.fecha_creacion, v.codigo
    `);
    return filas.map((fila) => ({
      variable: TaxonomiaVariableMapper.toDomain(fila),
      enUsoPublicado: fila.en_uso_publicado === true,
    }));
  }

  buscarPorCodigo(codigo: string): Promise<VariableTaxonomia | null> {
    return buscarVariablePorCodigo(this.prisma, codigo);
  }

  /**
   * Transacción serializable: la versión siguiente se calcula a partir de la
   * vigente, así que dos escrituras concurrentes no pueden obtener la misma.
   * Los conflictos de serialización se reintentan.
   */
  async ejecutar<T>(
    operacion: (tx: TaxonomiaVariablesTransaccion) => Promise<T>,
  ): Promise<T> {
    const maximoIntentos = 3;
    for (let intento = 1; ; intento += 1) {
      try {
        return await this.prisma.$transaction(
          (tx) => operacion(new PrismaTaxonomiaVariablesTransaccion(tx)),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: unknown) {
        const detalle = detalleError(error);
        if (detalle.includes('uq_taxonomia_variable_codigo'))
          throw new VariableDuplicadaException();
        const reintentable =
          codigoError(error) === 'P2034' ||
          detalle.includes('40001') ||
          detalle.includes('uq_taxonomia_version');
        if (!reintentable || intento >= maximoIntentos) throw error;
      }
    }
  }
}

function codigoError(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

function detalleError(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const { message, meta } = error as { message?: unknown; meta?: unknown };
  let metaTexto = '';
  try {
    metaTexto = meta === undefined ? '' : JSON.stringify(meta);
  } catch {
    metaTexto = '';
  }
  return `${typeof message === 'string' ? message : ''} ${metaTexto}`;
}
