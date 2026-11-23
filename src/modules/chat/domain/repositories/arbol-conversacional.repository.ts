import { AuditoriaArbolConversacional } from '../entities/catalogos/auditoria-arbol-conversacional.entity';
import { ContenidoConProgramaciones } from '../entities/catalogos/contenido-con-programaciones.entity';
import { ContenidoCronogramaConversacional } from '../entities/catalogos/contenido-cronograma.entity';
import { TipoEntradaConversacional } from '../entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../entities/catalogos/tipo-nodo.entity';
import { ArbolConversacional } from '../entities/flujo/arbol-conversacional.entity';
import {
  FlujoConversacional,
  ModalidadSinPerfil,
} from '../entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../entities/flujo/transicion-conversacional.entity';
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

  abstract buscarNodosPorIds(ids: string[]): Promise<NodoConversacional[]>;

  abstract buscarTransicion(
    idTransicion: string,
  ): Promise<TransicionConversacional | null>;

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

  /** Único flujo publicado de una modalidad sin perfil clínico (GRUPAL o SOS). */
  abstract buscarPublicadoUnico(
    modalidad: ModalidadSinPerfil,
  ): Promise<FlujoConversacional | null>;

  /** Atajo histórico (RF-24): el flujo grupal publicado. */
  abstract buscarPublicadoGrupal(): Promise<FlujoConversacional | null>;

  /** Última versión registrada de una modalidad sin perfil, o 0 si no hay ninguna. */
  abstract obtenerUltimaVersionSinPerfil(
    modalidad: ModalidadSinPerfil,
  ): Promise<number>;

  abstract buscarPublicadoPersonalizado(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): Promise<FlujoConversacional | null>;

  /** Última versión registrada para el perfil clínico, o 0 si no hay ninguna. */
  abstract obtenerUltimaVersionPersonalizada(
    tipoDependencia: TipoDependenciaClinica,
    tipoCraving: TipoCravingClinico,
  ): Promise<number>;

  abstract listarAuditoriaArbol(
    idFlujo: string,
  ): Promise<AuditoriaArbolConversacional[]>;

  abstract listarTiposNodo(): Promise<TipoNodoConversacional[]>;

  abstract listarTiposEntrada(): Promise<TipoEntradaConversacional[]>;

  /** Contenido ya asociado a una unidad temporal, disponible para un nodo. */
  abstract listarContenidosCronograma(): Promise<
    ContenidoCronogramaConversacional[]
  >;

  /** Existe la asociación contenido-cronograma (y por tanto el contenido está programado). */
  /** RF-25: el contenido existe (puede o no estar programado en algún cronograma). */
  abstract existeContenido(idContenido: string): Promise<boolean>;

  /** RF-25 / RF-24: contenidos con sus programaciones (cronograma, unidad y fechas). */
  abstract listarContenidosConProgramaciones(): Promise<
    ContenidoConProgramaciones[]
  >;

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

  /**
   * Guarda el nodo. Si se indican transiciones, las elimina (con sus reglas)
   * en la misma transacción: RF-25, cambio de tipo de respuesta confirmado.
   */
  abstract guardarNodo(
    nodo: NodoConversacional,
    idActor: string,
    transicionesAEliminar?: TransicionConversacional[],
  ): Promise<void>;

  /**
   * Guarda la transición junto con su regla propia; si la regla se
   * reemplazó, elimina la anterior (nunca se comparte).
   */
  abstract guardarTransicion(
    transicion: TransicionConversacional,
    idActor: string,
  ): Promise<void>;

  /**
   * Guarda varias transiciones en una sola transacción (p. ej. la específica,
   * la de "cualquier otra respuesta" y su reubicación al final del orden).
   */
  abstract guardarTransiciones(
    transiciones: TransicionConversacional[],
    idActor: string,
  ): Promise<void>;
}
