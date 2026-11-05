import { AuditoriaArbolConversacional } from '../entities/catalogos/auditoria-arbol-conversacional.entity';
import { TipoEntradaConversacional } from '../entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../entities/catalogos/tipo-nodo.entity';
import { ArbolConversacional } from '../entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../entities/reglas-validacion/reglas-validacion.entity';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../enums/perfil-clinico.enum';

/**
 * Puerto de persistencia del árbol conversacional.
 *
 * Solo busca y guarda entidades: las reglas de negocio (publicar, archivar,
 * clonar, validar el grafo) viven en el dominio y en los casos de uso.
 * Cada método `guardar*` es atómico y deja constancia de auditoría.
 */
export abstract class ArbolConversacionalRepository {
  // ── Consultas ────────────────────────────────────────────────────────────

  abstract obtenerFlujo(idFlujo: string): Promise<FlujoConversacional | null>;

  abstract obtenerArbol(idFlujo: string): Promise<ArbolConversacional | null>;

  abstract buscarNodo(idNodo: string): Promise<NodoConversacional | null>;

  abstract buscarTransicion(
    idTransicion: string,
  ): Promise<TransicionConversacional | null>;

  abstract buscarReglaValidacion(
    idReglaValidacion: string,
  ): Promise<ReglaValidacion | null>;

  abstract buscarTipoNodo(
    idTipoNodo: string,
  ): Promise<TipoNodoConversacional | null>;

  abstract listarFlujos(
    filtro: Partial<
      Pick<
        FlujoConversacional,
        'modalidad' | 'tipoDependencia' | 'tipoCraving' | 'estado'
      >
    >,
    page: number,
    pageSize: number,
  ): Promise<{ items: FlujoConversacional[]; total: number }>;

  abstract listarFlujosPersonalizados(): Promise<FlujoConversacional[]>;

  abstract buscarPublicadoGrupal(): Promise<FlujoConversacional | null>;

  abstract buscarPublicadoPersonalizado(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): Promise<FlujoConversacional | null>;

  /** Última versión registrada para el perfil clínico, o 0 si no hay ninguna. */
  abstract obtenerUltimaVersionPersonalizada(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): Promise<number>;

  /** Cantidad de transiciones que referencian la regla de validación. */
  abstract contarUsosReglaValidacion(
    idReglaValidacion: string,
  ): Promise<number>;

  abstract listarAuditoriaArbol(
    idFlujo: string,
  ): Promise<AuditoriaArbolConversacional[]>;

  abstract listarTiposNodo(): Promise<TipoNodoConversacional[]>;

  abstract listarTiposEntrada(): Promise<TipoEntradaConversacional[]>;

  abstract listarReglasValidacion(): Promise<ReglaValidacion[]>;

  // ── Persistencia ─────────────────────────────────────────────────────────

  /** Crea el flujo si no existe; si existe, persiste su estado actual. */
  abstract guardarFlujo(
    flujo: FlujoConversacional,
    idActor: string,
  ): Promise<void>;

  /** Guarda varios flujos en una sola transacción (p. ej. archivar y publicar). */
  abstract guardarFlujos(
    flujos: FlujoConversacional[],
    idActor: string,
  ): Promise<void>;

  /** Guarda un árbol nuevo copiado de `idFlujoOrigen`. */
  abstract guardarArbolClonado(
    arbol: ArbolConversacional,
    idFlujoOrigen: string,
    idActor: string,
  ): Promise<void>;

  abstract guardarNodo(
    nodo: NodoConversacional,
    idActor: string,
  ): Promise<void>;

  /** Guarda la transición junto con su regla de validación. */
  abstract guardarTransicion(
    transicion: TransicionConversacional,
    idActor: string,
  ): Promise<void>;

  abstract guardarReglaValidacion(
    regla: ReglaValidacion,
    idActor: string,
  ): Promise<void>;
}
