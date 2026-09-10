import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegistrarPausaAdministrativaDtoRequest } from './registrar-pausa-administrativa.dto-request';

describe('RegistrarPausaAdministrativaDtoRequest (RF-22B)', () => {
  const dtoValido = {
    fecha_inicio_pausa: '2026-09-10T12:00:00.000Z',
    fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
    motivo_pausa: '  Incapacidad médica  ',
  };

  it('convierte fechas ISO y normaliza el motivo', async () => {
    const dto = plainToInstance(
      RegistrarPausaAdministrativaDtoRequest,
      dtoValido,
    );

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.fecha_inicio_pausa).toEqual(
      new Date('2026-09-10T12:00:00.000Z'),
    );
    expect(dto.fecha_fin_pausa).toEqual(new Date('2026-09-12T12:00:00.000Z'));
    expect(dto.motivo_pausa).toBe('Incapacidad médica');
  });

  it.each(['fecha_inicio_pausa', 'fecha_fin_pausa', 'motivo_pausa'] as const)(
    'rechaza la ausencia de %s',
    async (campo) => {
      const entrada: Record<string, unknown> = { ...dtoValido };
      delete entrada[campo];
      const dto = plainToInstance(
        RegistrarPausaAdministrativaDtoRequest,
        entrada,
      );

      await expect(validate(dto)).resolves.not.toHaveLength(0);
    },
  );

  it('rechaza fechas inválidas y motivos compuestos solo por espacios', async () => {
    const dto = plainToInstance(RegistrarPausaAdministrativaDtoRequest, {
      fecha_inicio_pausa: 'no-es-fecha',
      fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
      motivo_pausa: '   ',
    });

    const errores = await validate(dto);
    expect(errores.map((error) => error.property)).toEqual(
      expect.arrayContaining(['fecha_inicio_pausa', 'motivo_pausa']),
    );
  });
});
