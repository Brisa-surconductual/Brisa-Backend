import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { TransicionConversacional } from '../../../domain/entities/flujo/transicion-conversacional.entity';
import { ReglaValidacion } from '../../../domain/entities/reglas-validacion/reglas-validacion.entity';
import { OperadorCondicion } from '../../../domain/enums/operador-condicional.enum';
import { TipoDatoValidacion } from '../../../domain/enums/tipo-dato-validacion-enum';

export const idsRespuesta = {
  usuario: '27000000-0000-4000-8000-000000000001',
  sesion: '27000000-0000-4000-8000-000000000002',
  nodo: '27000000-0000-4000-8000-000000000003',
  destino: '27000000-0000-4000-8000-000000000004',
  flujo: '27000000-0000-4000-8000-000000000005',
  interaccion: '27000000-0000-4000-8000-000000000006',
};

export const nodoRespuesta = (
  entrada: unknown = { tipo_entrada: 'NUMERICO' },
  tipo = 'PREGUNTA',
  idNodo = idsRespuesta.nodo,
) =>
  new NodoConversacional(
    idNodo,
    idsRespuesta.flujo,
    'tipo',
    tipo,
    { texto: 'Pregunta', entrada },
    true,
    1,
    null,
    idsRespuesta.usuario,
    new Date(),
    new Date(),
  );

/** Por defecto: numérica, obligatoria, RANGO 0..10. */
export const reglaRespuesta = (cambios: Partial<ReglaValidacion> = {}) =>
  new ReglaValidacion(
    'validacion',
    cambios.tipoDato ?? TipoDatoValidacion.NUMERICO,
    cambios.obligatorio ?? true,
    cambios.valorMin ?? null,
    cambios.valorMax ?? null,
    cambios.formatoRegex ?? null,
    cambios.valoresPermitidos ?? [],
    cambios.mensajeError ?? 'Revise su respuesta.',
    cambios.operadorCondicion ?? OperadorCondicion.RANGO,
    cambios.valorEsperado ?? { min: 0, max: 10 },
  );

export const transicionRespuesta = (
  regla: ReglaValidacion | null = reglaRespuesta(),
  orden = 1,
  idNodoDestino = idsRespuesta.destino,
) =>
  new TransicionConversacional(
    `transicion-${orden}`,
    idsRespuesta.flujo,
    idsRespuesta.nodo,
    idNodoDestino,
    orden,
    regla,
    new Date(),
  );
