import { FechaNacimientoInvalidaException } from '../exeption/fecha-nacimiento-invalida.exception';
import { UsuarioMenorEdadException } from '../exeption/usuario-menor-edad.exception';

export class FechaNacimiento {
  static readonly EDAD_MINIMA = 18;

  private readonly valor: Date;

  constructor(fechaNacimiento: Date, fechaReferencia = new Date()) {
    if (
      !FechaNacimiento.esFechaValida(fechaNacimiento) ||
      !FechaNacimiento.esFechaValida(fechaReferencia)
    ) {
      throw new FechaNacimientoInvalidaException();
    }

    const nacimiento = FechaNacimiento.normalizarFecha(fechaNacimiento);
    const referencia = FechaNacimiento.normalizarFecha(fechaReferencia);

    if (nacimiento.getTime() > referencia.getTime()) {
      throw new FechaNacimientoInvalidaException(
        'La fecha de nacimiento no puede ser futura.',
      );
    }

    if (!FechaNacimiento.cumpleEdadMinima(nacimiento, referencia)) {
      throw new UsuarioMenorEdadException();
    }

    this.valor = nacimiento;
  }

  static cumpleEdadMinima(
    fechaNacimiento: unknown,
    fechaReferencia = new Date(),
    edadMinima = FechaNacimiento.EDAD_MINIMA,
  ): boolean {
    if (
      !FechaNacimiento.esFechaValida(fechaNacimiento) ||
      !FechaNacimiento.esFechaValida(fechaReferencia)
    ) {
      return false;
    }

    const nacimiento = FechaNacimiento.normalizarFecha(fechaNacimiento);
    const referencia = FechaNacimiento.normalizarFecha(fechaReferencia);

    if (nacimiento.getTime() > referencia.getTime()) {
      return false;
    }

    let edad = referencia.getUTCFullYear() - nacimiento.getUTCFullYear();
    const aunNoCumple =
      referencia.getUTCMonth() < nacimiento.getUTCMonth() ||
      (referencia.getUTCMonth() === nacimiento.getUTCMonth() &&
        referencia.getUTCDate() < nacimiento.getUTCDate());

    if (aunNoCumple) {
      edad -= 1;
    }

    return edad >= edadMinima;
  }

  getValue(): Date {
    return new Date(this.valor.getTime());
  }

  private static esFechaValida(valor: unknown): valor is Date {
    return valor instanceof Date && !Number.isNaN(valor.getTime());
  }

  private static normalizarFecha(fecha: Date): Date {
    return new Date(
      Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()),
    );
  }
}
