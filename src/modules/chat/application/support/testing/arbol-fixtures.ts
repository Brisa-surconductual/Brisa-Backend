import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../../domain/enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';

/** Datos de prueba compartidos por los specs de los casos de uso del árbol. */
export const ids = {
  flujo: '00000000-0000-4000-8000-000000000001',
  otroFlujo: '00000000-0000-4000-8000-000000000002',
  nodoA: '00000000-0000-4000-8000-000000000003',
  nodoB: '00000000-0000-4000-8000-000000000004',
  tipo: '00000000-0000-4000-8000-000000000005',
  actor: '00000000-0000-4000-8000-000000000006',
  regla: '00000000-0000-4000-8000-000000000007',
  transicion: '00000000-0000-4000-8000-000000000008',
};
export const fecha = new Date('2026-10-01T12:00:00.000Z');

export const entradaSiNo = {
  tipo: 'SELECCION_UNICA',
  opciones: [
    { valor: 'si', etiqueta: 'Sí' },
    { valor: 'no', etiqueta: 'No' },
  ],
};

export function flujoGrupal(
  estado = EstadoFlujoConversacional.BORRADOR,
): FlujoConversacional {
  return new FlujoConversacional(
    ids.flujo,
    'Árbol grupal',
    ModalidadConversacional.GRUPAL,
    estado,
    1,
    ids.actor,
    fecha,
    estado === EstadoFlujoConversacional.BORRADOR ? null : fecha,
  );
}

export function flujoPersonalizado(
  estado = EstadoFlujoConversacional.BORRADOR,
  version = 2,
  idFlujo = ids.flujo,
): FlujoConversacional {
  return new FlujoConversacional(
    idFlujo,
    'Árbol personalizado',
    ModalidadConversacional.PERSONALIZADA,
    estado,
    version,
    ids.actor,
    fecha,
    estado === EstadoFlujoConversacional.BORRADOR ? null : fecha,
    TipoDependenciaClinica.TOLERANCIA,
    TipoCravingClinico.NEGATIVO,
    estado === EstadoFlujoConversacional.ARCHIVADO ? fecha : null,
  );
}

export function nodo(
  idNodo: string,
  idFlujo = ids.flujo,
  inicial = idNodo === ids.nodoA,
): NodoConversacional {
  return new NodoConversacional(
    idNodo,
    idFlujo,
    ids.tipo,
    'MENSAJE',
    // Selección única sí/no: `reglaTexto` (IGUALDAD "si") es una regla válida
    // para su transición (RF-25).
    { texto: 'Hola', entrada: entradaSiNo },
    inicial,
    1,
    null,
    ids.actor,
    fecha,
    fecha,
  );
}

/** Regla propia de una transición desde un nodo `entradaSiNo`: "si". */
export const reglaTexto = new ReglaValidacion(
  ids.regla,
  TipoDatoValidacion.TEXTO,
  true,
  null,
  null,
  null,
  [],
  'Respuesta requerida',
  OperadorCondicion.IGUALDAD,
  { valor: 'si' },
);

export function transicion(
  origen = ids.nodoA,
  destino = ids.nodoB,
  idFlujo = ids.flujo,
): TransicionConversacional {
  return new TransicionConversacional(
    ids.transicion,
    idFlujo,
    origen,
    destino,
    1,
    reglaTexto,
    fecha,
  );
}

/** Segunda salida de A ("no"), para que la pregunta sí/no quede cubierta. */
export function transicionNo(idFlujo = ids.flujo): TransicionConversacional {
  return new TransicionConversacional(
    `${ids.transicion.slice(0, -1)}9`,
    idFlujo,
    ids.nodoA,
    ids.nodoB,
    2,
    new ReglaValidacion(
      `${ids.regla.slice(0, -1)}9`,
      TipoDatoValidacion.TEXTO,
      true,
      null,
      null,
      null,
      [],
      'Respuesta requerida',
      OperadorCondicion.IGUALDAD,
      { valor: 'no' },
    ),
    fecha,
  );
}

/** Árbol mínimo y válido: A (inicial) → B por "si" y por "no". */
export function arbol(flujo = flujoGrupal()): ArbolConversacional {
  return new ArbolConversacional(
    flujo,
    [nodo(ids.nodoA, flujo.idFlujo), nodo(ids.nodoB, flujo.idFlujo)],
    [
      transicion(ids.nodoA, ids.nodoB, flujo.idFlujo),
      transicionNo(flujo.idFlujo),
    ],
  );
}

/** Repositorio simulado: cada método del puerto es un `jest.fn()`. */
export function repositorioSimulado(): jest.Mocked<ArbolConversacionalRepository> {
  const metodos = [
    'obtenerFlujo',
    'obtenerArbol',
    'buscarNodo',
    'buscarTransicion',
    'buscarTipoNodo',
    'listarFlujos',
    'listarFlujosPersonalizados',
    'buscarPublicadoGrupal',
    'buscarPublicadoUnico',
    'obtenerUltimaVersionSinPerfil',
    'buscarPublicadoPersonalizado',
    'obtenerUltimaVersionPersonalizada',
    'listarAuditoriaArbol',
    'listarTiposNodo',
    'listarTiposEntrada',
    'listarContenidosCronograma',
    'existeContenido',
    'listarContenidosConProgramaciones',
    'guardarFlujo',
    'guardarFlujos',
    'guardarArbolClonado',
    'guardarNodo',
    'guardarTransicion',
    'guardarTransiciones',
  ] as const;
  return Object.fromEntries(
    metodos.map((metodo) => [metodo, jest.fn()]),
  ) as unknown as jest.Mocked<ArbolConversacionalRepository>;
}
