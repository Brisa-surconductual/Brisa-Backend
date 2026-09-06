import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { CrearRecursoContenidoDtoRequest } from './crear-recurso-contenido.dto-request';

describe('DTO de recurso con módulos destino (RF-153/RF-154)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const idModulo = '00000000-0000-4000-8000-000000000002';

  it('acepta un bloque de texto válido', async () => {
    const dto = plainToInstance(CrearRecursoContenidoDtoRequest, {
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.TEXTO,
      orden_bloque: 1,
      texto_contenido: '  Contenido educativo  ',
      id_modulos: [idModulo],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.texto_contenido).toBe('Contenido educativo');
  });

  it('acepta la referencia de un recurso multimedia sin recibir el binario', async () => {
    const dto = plainToInstance(CrearRecursoContenidoDtoRequest, {
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.VIDEO,
      orden_bloque: 2,
      clave_almacenamiento: 'cronograma/videos/prevencion.mp4',
      mime_type: 'video/mp4',
      tamano_bytes: 2048,
      duracion_segundos: 90,
      texto_alternativo: 'Video sobre prevención',
      id_modulos: [idModulo],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([
    [
      'lista de módulos vacía',
      {
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 1,
        texto_contenido: 'Texto',
        id_modulos: [],
      },
    ],
    [
      'módulo con identificador inválido',
      {
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 1,
        texto_contenido: 'Texto',
        id_modulos: ['no-es-uuid'],
      },
    ],
    [
      'módulos repetidos',
      {
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 1,
        texto_contenido: 'Texto',
        id_modulos: [idModulo, idModulo],
      },
    ],
    [
      'orden menor que uno',
      {
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 0,
        texto_contenido: 'Texto',
        id_modulos: [idModulo],
      },
    ],
    [
      'texto sin contenido',
      {
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 1,
        id_modulos: [idModulo],
      },
    ],
    [
      'multimedia sin MIME ni tamaño',
      {
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.IMAGEN,
        orden_bloque: 1,
        clave_almacenamiento:
          'cronograma/recursos/00000000-0000-4000-8000-000000000010',
        id_modulos: [idModulo],
      },
    ],
  ])('rechaza una solicitud con %s', async (_, datos) => {
    const dto = plainToInstance(CrearRecursoContenidoDtoRequest, datos);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
