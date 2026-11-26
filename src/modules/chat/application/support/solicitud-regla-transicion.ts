import { SolicitudReglaTransicion } from '../../domain/policies/regla-por-tipo-entrada';
import { ReglaTransicionDtoRequest } from '../dto/chat-admin.dto-request';

export function solicitudReglaTransicion(
  dto: ReglaTransicionDtoRequest | undefined,
): SolicitudReglaTransicion | undefined {
  return dto === undefined
    ? undefined
    : {
        operador: dto.operador_condicion,
        valorEsperado: dto.valor_esperado,
        mensajeError: dto.mensaje_error,
      };
}
