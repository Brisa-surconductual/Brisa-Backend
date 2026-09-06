import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { AlmacenamientoRecursosPort } from '../ports/almacenamiento-recursos.port';
import { SolicitarUrlSubidaRecursoUseCase } from './solicitar-url-subida-recurso.use-case';

describe('SolicitarUrlSubidaRecursoUseCase', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  let contenidoRepository: jest.Mocked<ContenidoRepository>;
  let almacenamiento: jest.Mocked<AlmacenamientoRecursosPort>;
  let useCase: SolicitarUrlSubidaRecursoUseCase;

  beforeEach(() => {
    contenidoRepository = {
      crear: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(contenidoExistente()),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
    };
    almacenamiento = {
      crearUrlSubida: jest.fn().mockResolvedValue({
        claveAlmacenamiento: `cronograma/recursos/${idContenido}/00000000-0000-4000-8000-000000000010`,
        url: 'https://bucket.s3.amazonaws.com/firma',
        metodo: 'PUT',
        encabezados: { 'Content-Type': 'image/png' },
        expiraEnSegundos: 300,
      }),
      obtenerMetadatos: jest.fn(),
    };
    useCase = new SolicitarUrlSubidaRecursoUseCase(
      contenidoRepository,
      almacenamiento,
    );
  });

  it('valida el contenido y solicita una URL sin exponer el bucket', async () => {
    const resultado = await useCase.execute({
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.IMAGEN,
      mime_type: 'IMAGE/PNG',
      tamano_bytes: 1024,
    });

    expect(almacenamiento.crearUrlSubida.mock.calls).toEqual([
      [
        {
          idContenido,
          tipoRecurso: TipoRecurso.IMAGEN,
          mimeType: 'image/png',
          tamanoBytes: 1024,
        },
      ],
    ]);
    expect(resultado.clave_almacenamiento).toContain(idContenido);
    expect(resultado.url_subida).toBe('https://bucket.s3.amazonaws.com/firma');
    expect(resultado.metodo).toBe('PUT');
    expect(resultado.encabezados).toEqual({ 'Content-Type': 'image/png' });
    expect(resultado.expira_en_segundos).toBe(300);
    expect(resultado).not.toHaveProperty('bucket');
    expect(resultado).not.toHaveProperty('credenciales');
  });

  it('retorna 400 para texto porque no necesita almacenamiento', async () => {
    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        mime_type: 'text/plain',
        tamano_bytes: 10,
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(contenidoRepository.buscarPorId.mock.calls).toHaveLength(0);
    expect(almacenamiento.crearUrlSubida.mock.calls).toHaveLength(0);
  });

  it('retorna 400 cuando el MIME no corresponde al tipo', async () => {
    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.IMAGEN,
        mime_type: 'video/mp4',
        tamano_bytes: 1024,
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(almacenamiento.crearUrlSubida.mock.calls).toHaveLength(0);
  });

  it('retorna 404 si el contenido no existe', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.DOCUMENTO,
        mime_type: 'application/pdf',
        tamano_bytes: 2048,
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(almacenamiento.crearUrlSubida.mock.calls).toHaveLength(0);
  });

  function contenidoExistente(): Contenido {
    return new Contenido(
      idContenido,
      'Contenido base',
      TipoContenido.INFORMATIVO,
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-01T00:00:00.000Z'),
    );
  }
});
