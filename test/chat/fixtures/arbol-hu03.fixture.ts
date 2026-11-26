import { ArbolConversacional } from '../../../src/modules/chat/domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../../src/modules/chat/domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../../src/modules/chat/domain/entities/flujo/nodo-conversacional.entity';
import { ReglaValidacion } from '../../../src/modules/chat/domain/entities/reglas-validacion/reglas-validacion.entity';
import { TransicionConversacional } from '../../../src/modules/chat/domain/entities/flujo/transicion-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../src/modules/chat/domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../../src/modules/chat/domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../../src/modules/chat/domain/enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../../../src/modules/chat/domain/enums/tipo-dato-validacion-enum';

export const ids = {
  flujo: '00000000-0000-4000-8000-000000000001',
  origen: '00000000-0000-4000-8000-000000000002',
  destino: '00000000-0000-4000-8000-000000000003',
  tipo: '00000000-0000-4000-8000-000000000004',
  actor: '00000000-0000-4000-8000-000000000005',
  validacion: '00000000-0000-4000-8000-000000000006',
  transicion: '00000000-0000-4000-8000-000000000007',
  otroFlujo: '00000000-0000-4000-8000-000000000008',
  otraValidacion: '00000000-0000-4000-8000-000000000009',
  entrada: '00000000-0000-4000-8000-000000000010',
};
export const fecha = new Date('2026-10-17T12:00:00.000Z');
/** RF-25: el origen pide un número de 0 a 10; su transición, igualdad con 5. */
export const entradaOrigen = { tipo: 'NUMERICO', min: 0, max: 10 };
export const valorEsperado = { valor: 5 };
export const flujoRow = {
  id_flujo: ids.flujo,
  nombre: 'Árbol HU-03',
  modalidad: ModalidadConversacional.GRUPAL,
  estado: EstadoFlujoConversacional.BORRADOR,
  version: 1,
  creado_por: ids.actor,
  fecha_creacion: fecha,
  fecha_publicacion: null,
  fecha_archivado: null,
  tipo_dependencia: null,
  tipo_craving: null,
};

export function arbolDominio(): ArbolConversacional {
  const flujo = new FlujoConversacional(
    ids.flujo,
    flujoRow.nombre,
    flujoRow.modalidad,
    flujoRow.estado,
    1,
    ids.actor,
    fecha,
    null,
  );
  const nodo = (id: string) =>
    new NodoConversacional(
      id,
      ids.flujo,
      ids.tipo,
      'MENSAJE',
      id === ids.origen
        ? { texto: 'Mensaje', entrada: entradaOrigen }
        : { texto: 'Mensaje' },
      id === ids.origen,
      1,
      null,
      ids.actor,
      fecha,
      fecha,
    );
  const regla = new ReglaValidacion(
    ids.validacion,
    TipoDatoValidacion.NUMERICO,
    true,
    null,
    null,
    null,
    [],
    'Respuesta requerida',
    OperadorCondicion.IGUALDAD,
    valorEsperado,
  );
  const transicion = new TransicionConversacional(
    ids.transicion,
    ids.flujo,
    ids.origen,
    ids.destino,
    1,
    regla,
    fecha,
  );
  return new ArbolConversacional(
    flujo,
    [nodo(ids.origen), nodo(ids.destino)],
    [transicion],
  );
}

/**
 * RF-25: árbol grupal que cumple todo lo que exige publicar: el de
 * `arbolDominio` más los dos nodos de captura clínica, cada uno con una
 * transición por cada valor de su dominio.
 */
export function arbolGrupalPublicable(): ArbolConversacional {
  const base = arbolDominio();
  const captura = (idNodo: string, dimension: string, valores: string[]) =>
    new NodoConversacional(
      idNodo,
      ids.flujo,
      ids.tipo,
      'PREGUNTA',
      {
        texto: dimension,
        capturaPerfil: { dimension },
        entrada: {
          tipo: 'SELECCION_UNICA',
          opciones: valores.map((valor) => ({ valor, etiqueta: valor })),
        },
      },
      false,
      2,
      null,
      ids.actor,
      fecha,
      fecha,
    );
  const salidas = (origen: string, destino: string, valores: string[]) =>
    valores.map(
      (valor, i) =>
        new TransicionConversacional(
          `${origen.slice(0, -2)}${i}${valor.length}`,
          ids.flujo,
          origen,
          destino,
          i + 1,
          new ReglaValidacion(
            `regla-${origen}-${valor}`,
            TipoDatoValidacion.TEXTO,
            true,
            null,
            null,
            null,
            [],
            'Elige una opción',
            OperadorCondicion.IGUALDAD,
            { valor },
          ),
          fecha,
        ),
    );
  const dependencia = ['ABSTINENCIA_FISICA', 'TOLERANCIA'];
  const craving = ['POSITIVO', 'NEGATIVO'];
  const idDependencia = '00000000-0000-4000-8000-000000000011';
  const idCraving = '00000000-0000-4000-8000-000000000012';
  return new ArbolConversacional(
    base.flujo,
    [
      base.nodos[0],
      captura(idDependencia, 'TIPO_DEPENDENCIA', dependencia),
      captura(idCraving, 'TIPO_CRAVING', craving),
      base.nodos[1],
    ],
    [
      new TransicionConversacional(
        ids.transicion,
        ids.flujo,
        ids.origen,
        idDependencia,
        1,
        base.transiciones[0].reglaValidacion,
        fecha,
      ),
      ...salidas(idDependencia, idCraving, dependencia),
      ...salidas(idCraving, ids.destino, craving),
    ],
  );
}
