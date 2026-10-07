import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConsultarContenidoVigenteDtoRequest } from './consultar-contenido-vigente.dto-request';

describe('ConsultarContenidoVigenteDtoRequest (RF-21)', () => {
  it('convierte una fecha ISO válida', async () => {
    const dto = plainToInstance(ConsultarContenidoVigenteDtoRequest, {
      fecha_consulta: '2026-09-15T12:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.fecha_consulta).toEqual(new Date('2026-09-15T12:00:00.000Z'));
  });

  it('permite omitir la fecha para consultar el instante actual', async () => {
    const dto = plainToInstance(ConsultarContenidoVigenteDtoRequest, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rechaza una fecha inválida', async () => {
    const dto = plainToInstance(ConsultarContenidoVigenteDtoRequest, {
      fecha_consulta: 'fecha-invalida',
    });

    await expect(validate(dto)).resolves.toHaveLength(1);
  });
});
