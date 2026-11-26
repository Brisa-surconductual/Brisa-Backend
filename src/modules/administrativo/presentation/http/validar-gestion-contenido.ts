import { applyDecorators, ValidationPipe, type Type } from '@nestjs/common';
import { Matches, ValidateIf } from 'class-validator';
import {
  GestionContenidoException,
  type CodigoGestionContenido,
} from '../../application/exceptions/gestion-contenido.exception';

export function validarGestionContenido(
  tipo: Type<unknown>,
  codigo: CodigoGestionContenido,
) {
  return new ValidationPipe({
    expectedType: tipo,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: () => new GestionContenidoException(codigo),
  });
}

export function SiFueEnviado(): PropertyDecorator {
  return ValidateIf((_objeto: unknown, valor: unknown) => valor !== undefined);
}

export function TextoNoVacio(opcional = false): PropertyDecorator {
  return opcional
    ? applyDecorators(SiFueEnviado(), Matches(/\S/u))
    : Matches(/\S/u);
}

export class AccionSinCuerpoDto {}
