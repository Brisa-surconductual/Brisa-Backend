import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConsultarUbicacionesTemporalesParticipantesDtoRequest } from './consultar-ubicaciones-temporales-participantes.dto-request';

describe('ConsultarUbicacionesTemporalesParticipantesDtoRequest', () => {
  it('aplica paginación por defecto', async () => {
    const dto = plainToInstance(
      ConsultarUbicacionesTemporalesParticipantesDtoRequest,
      {},
    );

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toEqual(expect.objectContaining({ page: 1, page_size: 50 }));
  });

  it('transforma fecha, números y booleano', async () => {
    const dto = plainToInstance(
      ConsultarUbicacionesTemporalesParticipantesDtoRequest,
      {
        page: '2',
        page_size: '25',
        fecha_calculo: '2026-09-15T12:00:00.000Z',
        cronograma_finalizado: 'false',
      },
    );

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.page_size).toBe(25);
    expect(dto.fecha_calculo).toEqual(new Date('2026-09-15T12:00:00.000Z'));
    expect(dto.cronograma_finalizado).toBe(false);
  });

  it('rechaza páginas fuera del límite, fechas inválidas y UUID inválidos', async () => {
    const dto = plainToInstance(
      ConsultarUbicacionesTemporalesParticipantesDtoRequest,
      {
        page: 0,
        page_size: 101,
        fecha_calculo: 'fecha-invalida',
        id_usuario: 'no-es-uuid',
      },
    );

    expect(await validate(dto)).toHaveLength(4);
  });
});
