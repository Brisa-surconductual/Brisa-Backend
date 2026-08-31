import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { CreacionUsuarioDtoRequest } from './creacion-usuario.dto-request';

describe('CreacionUsuarioDtoRequest - fecha de nacimiento', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('acepta el ISO canónico que actualmente envía el frontend', async () => {
    const { dto, errores } = await validarFecha('2000-05-15T00:00:00.000Z');

    expect(errores).toHaveLength(0);
    expect(dto.fechaNacimiento).toEqual(new Date('2000-05-15T00:00:00.000Z'));
  });

  it('acepta YYYY-MM-DD y el borde de exactamente 18 años', async () => {
    const { dto, errores } = await validarFecha('2008-08-28');

    expect(errores).toHaveLength(0);
    expect(dto.fechaNacimiento).toEqual(new Date('2008-08-28T00:00:00.000Z'));
  });

  it('rechaza a quien todavía tiene 17 años', async () => {
    const { errores } = await validarFecha('2008-08-29');

    expect(errores[0]?.constraints).toMatchObject({
      esMayorDeEdad: 'El usuario debe tener al menos 18 años cumplidos.',
    });
  });

  it('rechaza fechas futuras', async () => {
    const { errores } = await validarFecha('2027-01-01T00:00:00.000Z');

    expect(errores[0]?.constraints).toHaveProperty('esMayorDeEdad');
  });

  it('rechaza fechas calendario imposibles', async () => {
    const { errores } = await validarFecha('2000-02-30');

    expect(errores[0]?.constraints).toHaveProperty('isDate');
  });

  it.each([
    '2000/05/15',
    '15-05-2000',
    '2000-05-15T05:00:00.000Z',
    '2000-05-15T00:00:00-05:00',
  ])('rechaza el formato no canónico %s', async (fechaNacimiento) => {
    const { errores } = await validarFecha(fechaNacimiento);

    expect(errores[0]?.constraints).toHaveProperty('isDate');
  });

  async function validarFecha(fechaNacimiento: string) {
    const dto = plainToInstance(CreacionUsuarioDtoRequest, {
      correoElectronico: 'estudiante@example.com',
      contrasena: 'Segura123!',
      fechaNacimiento,
      ciudad: 'Bogotá',
      entidad_educativa: 'Universidad de prueba',
      programa_academico: 'Ingeniería de Sistemas',
      semestre: 5,
      nivelAcademico: NivelAcademico.PREGRADO,
      fechaInicioConsumo: '2025-01-01',
      fechaUltimoConsumo: '2026-01-01',
      motivoInicioConsumo: MotivoConsumo.CURIOSIDAD,
      frecuenciaConsumo: 2,
    });

    const errores = (await validate(dto)).filter(
      (error) => error.property === 'fechaNacimiento',
    );

    return { dto, errores };
  }
});
