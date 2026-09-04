import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { SolicitarUrlSubidaRecursoDtoRequest } from './solicitar-url-subida-recurso.dto-request';

describe('SolicitarUrlSubidaRecursoDtoRequest', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';

  it('acepta únicamente metadatos, nunca el binario', async () => {
    const dto = plainToInstance(SolicitarUrlSubidaRecursoDtoRequest, {
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.IMAGEN,
      mime_type: ' image/png ',
      tamano_bytes: 1024,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.mime_type).toBe('image/png');
    expect(dto).not.toHaveProperty('archivo');
  });

  it.each([
    ['contenido inválido', { id_contenido: 'no-uuid' }],
    ['MIME vacío', { mime_type: '   ' }],
    ['tamaño cero', { tamano_bytes: 0 }],
  ])('rechaza %s', async (_, cambio) => {
    const dto = plainToInstance(SolicitarUrlSubidaRecursoDtoRequest, {
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.IMAGEN,
      mime_type: 'image/png',
      tamano_bytes: 1024,
      ...cambio,
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
