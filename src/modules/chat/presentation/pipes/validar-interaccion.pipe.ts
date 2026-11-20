import {
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { ProcesarRespuestaDtoRequest } from '../../application/dto/procesar-respuesta.dto-request';
import { RespuestaUsuarioInvalida } from '../../domain/exceptions/respuesta.exceptions';
import { esObjetoRespuesta } from '../../domain/policies/configuracion-entrada-respuesta';

const CAMPOS_OBLIGATORIOS = [
  'id_interaccion',
  'id_nodo',
  'secuencia',
  'tipo_entrada',
  'valor',
  'timestamp_interaccion',
  'estado_conectividad',
] as const;

/** La validación propia de RF-30 distingue campos ausentes de valores inválidos. */
@Injectable()
export class ValidarInteraccionPipe implements PipeTransform<
  unknown,
  Promise<ProcesarRespuestaDtoRequest>
> {
  private readonly validar = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    expectedType: ProcesarRespuestaDtoRequest,
    exceptionFactory: ([error]) => {
      const campo = error?.property ?? 'body';
      throw new RespuestaUsuarioInvalida(
        'El campo de la interacción tiene un valor inválido.',
        campo === 'timestamp_interaccion'
          ? 'FORMATO_INCORRECTO'
          : campo === 'tipo_entrada'
            ? 'TIPO_ENTRADA_NO_PERMITIDO'
            : 'TIPO_DATO_INVALIDO',
        campo,
      );
    },
  });

  async transform(body: unknown): Promise<ProcesarRespuestaDtoRequest> {
    if (
      !esObjetoRespuesta(body) ||
      CAMPOS_OBLIGATORIOS.some(
        (campo) =>
          !Object.hasOwn(body, campo) ||
          body[campo] === undefined ||
          (campo !== 'valor' && body[campo] === null),
      )
    )
      throw new UnprocessableEntityException({
        codigo: 'INTERACCION_INCOMPLETA',
        mensaje: 'Faltan campos obligatorios de la interacción.',
      });
    return (await this.validar.transform(body, {
      type: 'body',
    })) as ProcesarRespuestaDtoRequest;
  }
}
