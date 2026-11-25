import { ValidationPipe, type ValidationError } from '@nestjs/common';
import {
  ListadoIndicadoresDtoRequest,
  PARAMETROS_LISTADO,
} from '../../application/dto/listado-indicadores/listado-indicadores.dto-request';
import { ListadoIndicadoresException } from '../../application/exceptions/listado-indicadores.exception';
import type { ConsultaListadoIndicadores } from '../../application/use-cases/listado-indicadores/listar-indicadores-participantes.use-case';
import { detectarCamposRestringidos } from '../../domain/policies/campos-restringidos.policy';
import type { FiltrosListadoIndicadores } from '../../domain/results/listado-indicadores';

/** Primer mensaje de validación, recorriendo también los errores anidados. */
function primerMensaje(errores: ValidationError[]): string | undefined {
  for (const error of errores) {
    const mensaje =
      Object.values(error.constraints ?? {})[0] ??
      primerMensaje(error.children ?? []);
    if (mensaje) return mensaje;
  }
  return undefined;
}

/**
 * `whitelist` sin `forbidNonWhitelisted`: un parámetro no permitido se
 * descarta en silencio en lugar de responder 400 (RF-142 FA3: no revelar qué
 * campos se bloquearon). Un valor inválido de un parámetro permitido sí es 400.
 */
const validarListado = new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (errores) =>
    new ListadoIndicadoresException('PARAMETRO_INVALIDO', {
      mensaje: primerMensaje(errores),
    }),
});

/**
 * RF-142: separa la query del listado en parámetros tipados y validados, y
 * detecta los campos restringidos que se intentaron pedir (en la query o en un
 * cuerpo enviado con el GET) para auditarlos sin rechazar la consulta.
 */
export async function leerConsultaListado(
  query: Record<string, unknown>,
  cuerpo: unknown,
): Promise<ConsultaListadoIndicadores> {
  const camposRestringidos = [
    ...new Set([
      ...detectarCamposRestringidos(query, PARAMETROS_LISTADO),
      ...detectarCamposRestringidos(cuerpo, new Set()),
    ]),
  ];

  const dto = (await validarListado.transform(query, {
    type: 'query',
    metatype: ListadoIndicadoresDtoRequest,
  })) as ListadoIndicadoresDtoRequest;

  const filtros: FiltrosListadoIndicadores = {
    ...(dto.nivel_progreso !== undefined && {
      nivel_progreso: dto.nivel_progreso,
    }),
    ...(dto.adherencia_min !== undefined && {
      adherencia_min: dto.adherencia_min,
    }),
    ...(dto.adherencia_max !== undefined && {
      adherencia_max: dto.adherencia_max,
    }),
    ...(dto.con_alertas !== undefined && { con_alertas: dto.con_alertas }),
  };

  return {
    filtros,
    orden: { campo: dto.orden_campo, direccion: dto.orden_direccion },
    pagina: { offset: dto.offset, limit: dto.limit },
    camposRestringidos,
  };
}
