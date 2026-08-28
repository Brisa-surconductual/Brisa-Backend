import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { ActualizarContenidoDtoRequest } from './actualizar-contenido.dto-request';
import { CrearContenidoDtoRequest } from './crear-contenido.dto-request';

describe('DTO de contenido psicoeducativo (RF-152)', () => {
  it('acepta y normaliza las entradas válidas', async () => {
    const dto = plainToInstance(CrearContenidoDtoRequest, {
      nombre_contenido: '  Manejo de emociones  ',
      tipo_contenido: TipoContenido.INFORMATIVO,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.nombre_contenido).toBe('Manejo de emociones');
  });

  it.each([
    [{ tipo_contenido: TipoContenido.ACTIVIDAD }],
    [{ nombre_contenido: 'Actividad', tipo_contenido: 'DESCONOCIDO' }],
    [{ nombre_contenido: '   ', tipo_contenido: TipoContenido.MULTIMEDIA }],
  ])(
    'rechaza una creación con datos incompletos o inválidos',
    async (datos) => {
      const dto = plainToInstance(CrearContenidoDtoRequest, datos);

      await expect(validate(dto)).resolves.not.toHaveLength(0);
    },
  );

  it('rechaza campos presentes pero vacíos en una actualización', async () => {
    const dto = plainToInstance(ActualizarContenidoDtoRequest, {
      nombre_contenido: ' ',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
