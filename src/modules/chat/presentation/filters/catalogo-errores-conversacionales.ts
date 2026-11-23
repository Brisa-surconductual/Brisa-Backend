const RETOMAR =
  'Ocurrió un problema con la conversación. Tu progreso ha sido guardado. Puedes retomar desde donde lo dejaste.';

export const MENSAJE_RECUPERACION =
  'No fue posible recuperar la sesión en este momento. Intente nuevamente más tarde.';

const MENSAJES: Readonly<Record<string, string>> = {
  NO_AUTENTICADO: 'Inicia sesión para continuar con la conversación.',
  NO_AUTORIZADO: 'Tu cuenta no tiene permiso para consultar esta información.',
  CSRF_INVALIDO: 'Actualiza la página e inténtalo de nuevo.',
  PARAMETRO_INVALIDO: 'Revisa los datos de la solicitud e inténtalo de nuevo.',
  INTERACCION_INCOMPLETA:
    'Faltan datos de la respuesta. Intenta enviarla de nuevo.',
  TIPO_ENTRADA_NO_PERMITIDO:
    'Usa la opción de respuesta que aparece en esta pregunta.',
  RESPUESTA_OBLIGATORIA: 'Responde la pregunta para continuar.',
  TIPO_DATO_INVALIDO: 'Revisa el tipo de respuesta que pide la pregunta.',
  FUERA_DE_RANGO: 'El valor ingresado está fuera del rango permitido.',
  FORMATO_INCORRECTO: 'Revisa el formato de tu respuesta e inténtalo de nuevo.',
  VALOR_NO_PERMITIDO: 'Elige una de las opciones disponibles.',
  SIN_COINCIDENCIA:
    'Tu respuesta no coincide con las opciones esperadas. Revisa la pregunta o solicita ayuda.',
  SESION_NO_ENCONTRADA: 'No se pudo recuperar el contenido del chat.',
  NODO_INEXISTENTE: 'No se pudo recuperar el contenido del chat.',
  SESION_ERROR_CONFIGURACION: RETOMAR,
  SESION_NO_REANUDABLE:
    'No se pudo retomar esta sesión. Vuelve a abrir el chat.',
  ESTADO_INCONSISTENTE:
    'El estado de la conversación es inconsistente. No fue posible recuperar la sesión.',
  HISTORIAL_INCONSISTENTE: RETOMAR,
  SIN_TRANSICION: RETOMAR,
  DESTINO_INVALIDO: RETOMAR,
  CAPTURA_FUERA_DE_GRUPAL: RETOMAR,
  ID_INTERACCION_REUTILIZADA:
    'Esta respuesta ya se envió. Abre de nuevo la conversación para comprobar tu progreso.',
  SECUENCIA_FUERA_DE_ORDEN:
    'Vuelve a abrir la conversación antes de enviar tu respuesta.',
  NODO_DESACTUALIZADO: 'La conversación avanzó. Consulta la pregunta actual.',
  NODO_TERMINAL: 'Este mensaje no requiere una respuesta.',
  SESION_NO_ACTIVA: 'Retoma la conversación antes de responder.',
  ERROR_PERSISTENCIA: 'No se pudo guardar tu respuesta. Inténtalo de nuevo.',
  CONTENIDO_NO_DISPONIBLE: 'El contenido del nodo no está disponible.',
  NODO_EN_ESPERA_CRONOGRAMA:
    'Esta parte de tu terapia aún no está habilitada. Vuelve en la fecha indicada.',
  RECURSO_NO_DISPONIBLE:
    'No fue posible cargar el contenido en este momento. Inténtalo de nuevo más tarde.',
  ERROR_CARGA_ARBOL:
    'No se pudo cargar la conversación. Inténtalo de nuevo más tarde.',
  NODO_INICIAL_NO_DISPONIBLE: RETOMAR,
  SIN_FLUJO_PUBLICADO:
    'Todavía no hay una conversación disponible para ti. Contacta al equipo de psicología.',
  FLUJO_NO_PUBLICADO:
    'La conversación todavía no está disponible. Contacta al equipo de psicología.',
  PERFIL_INCOMPLETO:
    'Completa tu perfil antes de iniciar la conversación personalizada.',
  SIN_CRONOGRAMA: 'Necesitas un cronograma asignado para entrar al chat.',
  LIMITE_REPORTES:
    'Has enviado varios reportes en poco tiempo. Espera un momento para volver a intentarlo.',
  // RF-43: protocolo SOS. Tono calmado, sin alarmar.
  SIN_FLUJO_SOS:
    'En este momento no podemos mostrarte el ejercicio. Si lo necesitas, comunícate con una línea de ayuda.',
  INTERVENCION_EN_CURSO: 'Ya estás en un ejercicio de calma. Continuemos.',
  INTERVENCION_NO_ENCONTRADA: 'No encontramos este ejercicio de calma.',
  INTERVENCION_FINALIZADA: 'Este ejercicio de calma ya terminó.',
  TIEMPO_AGOTADO:
    'El ejercicio de calma terminó. Puedes revisar las líneas de ayuda o volver a lo que estabas haciendo.',
};

const MENSAJES_HTTP: Readonly<Partial<Record<number, string>>> = {
  400: MENSAJES.PARAMETRO_INVALIDO,
  401: MENSAJES.NO_AUTENTICADO,
  403: 'Tu sesión no tiene acceso a esta operación del chat.',
  404: MENSAJES.SESION_NO_ENCONTRADA,
  409: RETOMAR,
  422: MENSAJES.PARAMETRO_INVALIDO,
  429: MENSAJES.LIMITE_REPORTES,
  503: MENSAJES.RECURSO_NO_DISPONIBLE,
};

export function esCodigoConversacional(codigo: unknown): codigo is string {
  return typeof codigo === 'string' && Object.hasOwn(MENSAJES, codigo);
}

export function mensajeErrorConversacional(
  status: number,
  codigo: string | null,
  inicio: boolean,
): string {
  if (codigo !== null && esCodigoConversacional(codigo))
    return MENSAJES[codigo];
  return (
    MENSAJES_HTTP[status] ??
    (inicio ? MENSAJE_RECUPERACION : MENSAJES.CONTENIDO_NO_DISPONIBLE)
  );
}
