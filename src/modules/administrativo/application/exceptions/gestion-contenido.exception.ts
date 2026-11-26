import { HttpException } from '@nestjs/common';

const erroresGestionContenido = {
  MENSAJE_INCOMPLETO: [
    400,
    'El contenido del mensaje está incompleto o el tipo de mensaje no es válido.',
  ],
  MENSAJE_NO_ENCONTRADO: [
    404,
    'El mensaje de notificación especificado no existe.',
  ],
  TERMINOS_RESTRINGIDOS: [
    400,
    'El mensaje no puede activarse porque su contenido contiene términos restringidos.',
  ],
  LISTA_TERMINOS_INVALIDA: [
    400,
    'La lista de términos restringidos propuesta no es válida.',
  ],
  LISTA_TERMINOS_NO_CONFIGURADA: [
    404,
    'No existe una lista de términos restringidos configurada.',
  ],
  CAPITULO_INCOMPLETO: [
    400,
    'El contenido obligatorio del capítulo está incompleto.',
  ],
  CAPITULO_NO_ENCONTRADO: [
    404,
    'El capítulo narrativo especificado no existe.',
  ],
  CAPITULO_EN_USO: [
    409,
    'No es posible modificar un capítulo que ya ha sido completado por usuarios del programa.',
  ],
  ORDEN_CAPITULO_DUPLICADO: [
    409,
    'Ya existe un capítulo con ese orden dentro de la fase seleccionada.',
  ],
  ARQUITECTURA_NARRATIVA_INVALIDA: [
    422,
    'La configuración propuesta no respeta la arquitectura narrativa lineal del módulo.',
  ],
  CAPITULO_SIN_UNIDAD_TEMPORAL: [
    422,
    'El capítulo no tiene unidad temporal asociada.',
  ],
  LOGRO_INCOMPLETO: [
    400,
    'La información del logro narrativo está incompleta.',
  ],
  LOGRO_NO_ENCONTRADO: [404, 'El logro narrativo especificado no existe.'],
  REFERENCIA_NARRATIVA_INVALIDA: [
    422,
    'El capítulo o la fase asociada al logro narrativo no es válida.',
  ],
  RECURSO_VISUAL_INVALIDO: [
    422,
    'El recurso visual asociado al logro narrativo no es válido.',
  ],
  REGLA_NIVEL_INCOMPLETA: [
    400,
    'La regla de correspondencia de nivel contiene información incompleta.',
  ],
  PARAMETRO_INVALIDO: [400, 'Los parámetros de la operación no son válidos.'],
  MODULO_NOTIFICACIONES_NO_DISPONIBLE: [
    503,
    'La gestión de mensajes de notificación no está disponible.',
  ],
  MODULO_NARRATIVO_NO_DISPONIBLE: [
    503,
    'La gestión de contenido narrativo no está disponible.',
  ],
} as const;

export type CodigoGestionContenido = keyof typeof erroresGestionContenido;

export class GestionContenidoException extends HttpException {
  constructor(codigo: CodigoGestionContenido, terminosDetectados?: string[]) {
    const [status, mensaje] = erroresGestionContenido[codigo];
    super(
      {
        status,
        codigo,
        mensaje,
        ...(codigo === 'TERMINOS_RESTRINGIDOS' && {
          terminos_detectados: terminosDetectados ?? [],
        }),
      },
      status,
    );
  }
}
