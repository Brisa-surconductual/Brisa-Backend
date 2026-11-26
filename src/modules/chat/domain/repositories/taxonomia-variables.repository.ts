import { VariableTaxonomia } from '../entities/taxonomia/variable-taxonomia.entity';
import { AccionAuditoriaArbol } from '../enums/accion-auditoria-arbol.enum';
import { VersionTaxonomia } from '../value-objects/version-taxonomia.vo';

export interface VariableTaxonomiaConUso {
  readonly variable: VariableTaxonomia;
  /** Algún nodo de un flujo PUBLICADO captura la variable. */
  readonly enUsoPublicado: boolean;
}

/** Operaciones de escritura dentro de una transacción serializable. */
export interface TaxonomiaVariablesTransaccion {
  /** Bloquea la fila (FOR UPDATE). */
  bloquearPorCodigo(codigo: string): Promise<VariableTaxonomia | null>;
  existeCodigo(codigo: string): Promise<boolean>;
  estaEnUsoPublicado(codigo: string): Promise<boolean>;
  insertar(
    variable: VariableTaxonomia,
    idActor: string,
  ): Promise<VariableTaxonomia>;
  actualizarEstado(variable: VariableTaxonomia): Promise<void>;
  versionActual(): Promise<VersionTaxonomia>;
  /** Crea la versión siguiente y audita la escritura (sin flujo asociado). */
  registrarVersion(
    accion: AccionAuditoriaArbol,
    variable: VariableTaxonomia,
    idActor: string,
  ): Promise<VersionTaxonomia>;
}

/** RF-30B: taxonomía de variables del chat. */
export abstract class TaxonomiaVariablesRepository {
  abstract versionActual(): Promise<VersionTaxonomia>;
  abstract listar(
    incluirDeshabilitadas: boolean,
  ): Promise<VariableTaxonomiaConUso[]>;
  abstract buscarPorCodigo(codigo: string): Promise<VariableTaxonomia | null>;
  abstract ejecutar<T>(
    operacion: (tx: TaxonomiaVariablesTransaccion) => Promise<T>,
  ): Promise<T>;
}
