import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';
import { FechaNacimiento } from '../../domain/value-objects/fecha-nacimiento.vo';

export function EsMayorDeEdad(
  edadMinima = FechaNacimiento.EDAD_MINIMA,
  opciones?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'esMayorDeEdad',
      constraints: [edadMinima],
      validator: {
        validate: (valor: unknown, argumentos): boolean =>
          FechaNacimiento.cumpleEdadMinima(
            valor,
            new Date(),
            (argumentos?.constraints[0] as number | undefined) ?? edadMinima,
          ),
        defaultMessage: buildMessage(
          (prefijo, argumentos) =>
            `${prefijo}debe corresponder a una persona de al menos ${argumentos?.constraints[0]} años cumplidos`,
          opciones,
        ),
      },
    },
    opciones,
  );
}
