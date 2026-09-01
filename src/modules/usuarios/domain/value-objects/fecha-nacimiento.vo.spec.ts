import { FechaNacimientoInvalidaException } from '../exeption/fecha-nacimiento-invalida.exception';
import { UsuarioMenorEdadException } from '../exeption/usuario-menor-edad.exception';
import { FechaNacimiento } from './fecha-nacimiento.vo';

describe('FechaNacimiento', () => {
  const fechaReferencia = new Date('2026-08-28T23:59:59.000Z');

  it('acepta a quien cumple exactamente 18 años hoy', () => {
    const fecha = new FechaNacimiento(
      new Date('2008-08-28T00:00:00.000Z'),
      fechaReferencia,
    );

    expect(fecha.getValue()).toEqual(new Date('2008-08-28T00:00:00.000Z'));
  });

  it('rechaza a quien cumple 18 años mañana', () => {
    expect(
      () =>
        new FechaNacimiento(
          new Date('2008-08-29T00:00:00.000Z'),
          fechaReferencia,
        ),
    ).toThrow(UsuarioMenorEdadException);
  });

  it('rechaza una fecha futura con un error HTTP 400', () => {
    expect(
      () =>
        new FechaNacimiento(
          new Date('2027-01-01T00:00:00.000Z'),
          fechaReferencia,
        ),
    ).toThrow(FechaNacimientoInvalidaException);

    try {
      new FechaNacimiento(
        new Date('2027-01-01T00:00:00.000Z'),
        fechaReferencia,
      );
    } catch (error) {
      expect(error).toMatchObject({ status: 400 });
    }
  });

  it('rechaza objetos Date inválidos', () => {
    expect(
      () => new FechaNacimiento(new Date(Number.NaN), fechaReferencia),
    ).toThrow(FechaNacimientoInvalidaException);
  });

  it('calcula la edad usando fechas calendario y no milisegundos aproximados', () => {
    expect(
      FechaNacimiento.cumpleEdadMinima(
        new Date('2008-08-28T00:00:00.000Z'),
        fechaReferencia,
      ),
    ).toBe(true);
    expect(
      FechaNacimiento.cumpleEdadMinima(
        new Date('2008-08-29T00:00:00.000Z'),
        fechaReferencia,
      ),
    ).toBe(false);
  });
});
