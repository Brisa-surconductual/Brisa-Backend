import {
  ArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
  ReglaValidacion,
  TransicionConversacional,
} from '../../../src/modules/chat/domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  OperadorCondicion,
  TipoDatoValidacion,
} from '../../../src/modules/chat/domain/enums/arbol-conversacional.enums';

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
export const reglaRow = {
  id_regla_validacion: ids.validacion,
  tipo_dato: TipoDatoValidacion.TEXTO,
  obligatorio: true,
  valor_min: null,
  valor_max: null,
  formato_regex: null,
  valores_permitidos: [] as string[],
  mensaje_error: 'Respuesta requerida',
};
export const nodoRow = (id = ids.origen) => ({
  id_nodo: id,
  id_flujo: ids.flujo,
  id_tipo_nodo: ids.tipo,
  contenido: { texto: 'Mensaje' },
  es_nodo_inicial: id === ids.origen,
  orden: 1,
  id_contenido_cronograma: null,
  creado_por: ids.actor,
  fecha_creacion: fecha,
  fecha_actualizacion: fecha,
  tipo_nodo: { nombre: 'MENSAJE' },
});
export const transicionRow = {
  id_regla: ids.transicion,
  id_flujo: ids.flujo,
  id_nodo_origen: ids.origen,
  id_nodo_destino: ids.destino,
  id_regla_validacion: ids.validacion,
  operador_condicion: OperadorCondicion.IGUALDAD,
  valor_condicion: { valor: 'si' },
  orden_evaluacion: 1,
  fecha_creacion: fecha,
  reglas_validaciones: reglaRow,
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
      { texto: 'Mensaje' },
      id === ids.origen,
      1,
      null,
      ids.actor,
      fecha,
      fecha,
    );
  const regla = new ReglaValidacion(
    ids.validacion,
    TipoDatoValidacion.TEXTO,
    true,
    null,
    null,
    null,
    [],
    reglaRow.mensaje_error,
  );
  const transicion = new TransicionConversacional(
    ids.transicion,
    ids.flujo,
    ids.origen,
    ids.destino,
    OperadorCondicion.IGUALDAD,
    transicionRow.valor_condicion,
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
