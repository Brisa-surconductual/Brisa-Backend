import { createHash } from 'node:crypto';
import { ProcesarRespuestaDtoRequest } from '../dto/procesar-respuesta.dto-request';

export function huellaInteraccion(dto: ProcesarRespuestaDtoRequest): string {
  // Se conservan el orden de los arreglos y el timestamp enviado, sin perder
  // los microsegundos de la captura. Los UUID no distinguen mayúsculas.
  const campos = [
    dto.id_nodo.toLowerCase(),
    dto.secuencia,
    dto.tipo_entrada,
    valorComparable(dto.valor),
    dto.timestamp_interaccion,
    dto.estado_conectividad,
    dto.recursos_no_presentados?.map((id) => id.toLowerCase()) ?? null,
  ];
  return createHash('sha256').update(JSON.stringify(campos)).digest('hex');
}

function valorComparable(valor: unknown) {
  if (
    valor === null ||
    typeof valor === 'boolean' ||
    typeof valor === 'string' ||
    (typeof valor === 'number' && Number.isFinite(valor)) ||
    (Array.isArray(valor) && valor.every((item) => typeof item === 'string'))
  )
    return valor;
  // Nunca puede coincidir con una respuesta válida previamente almacenada.
  return { invalida: true };
}
