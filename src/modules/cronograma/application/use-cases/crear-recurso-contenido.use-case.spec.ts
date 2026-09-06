import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { ModuloDestinoNoDisponibleException } from '../../domain/exeption/modulo-destino-no-disponible.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { AlmacenamientoRecursosPort } from '../ports/almacenamiento-recursos.port';
import { CrearRecursoContenidoUseCase } from './crear-recurso-contenido.use-case';

describe('CrearRecursoContenidoUseCase (RF-153/RF-154)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const idModulo = '00000000-0000-4000-8000-000000000002';
  let contenidoRepository: jest.Mocked<ContenidoRepository>;
  let recursoRepository: jest.Mocked<RecursoContenidoRepository>;
  let almacenamientoRecursos: jest.Mocked<AlmacenamientoRecursosPort>;
  let useCase: CrearRecursoContenidoUseCase;

  beforeEach(() => {
    contenidoRepository = {
      crear: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(contenidoExistente()),
      actualizar: jest.fn(),
      eliminar: jest.fn(),
    };
    recursoRepository = {
      crearConModulosDestino: jest
        .fn()
        .mockImplementation((recurso) => Promise.resolve(recurso)),
      reordenar: jest.fn(),
    };
    almacenamientoRecursos = {
      crearUrlSubida: jest.fn(),
      obtenerMetadatos: jest.fn().mockResolvedValue({
        mimeType: 'image/png',
        tamanoBytes: 1024,
      }),
    };
    useCase = new CrearRecursoContenidoUseCase(
      contenidoRepository,
      recursoRepository,
      almacenamientoRecursos,
    );
  });

  it('crea un recurso de texto junto con sus módulos destino', async () => {
    const resultado = await useCase.execute({
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.TEXTO,
      orden_bloque: 1,
      texto_contenido: 'Orientación inicial',
      id_modulos: [idModulo],
    });

    const [recurso, modulos] =
      recursoRepository.crearConModulosDestino.mock.calls[0];
    expect(recurso).toEqual(
      expect.objectContaining({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        texto_contenido: 'Orientación inicial',
        clave_almacenamiento: null,
      }),
    );
    expect(modulos).toEqual([idModulo]);
    expect(typeof resultado.id_recurso).toBe('string');
    expect(resultado.mensaje).toBe(
      'Recurso creado y asociado a sus módulos correctamente.',
    );
    expect(resultado).not.toHaveProperty('id_contenido');
    expect(resultado).not.toHaveProperty('texto_contenido');
    expect(resultado).not.toHaveProperty('clave_almacenamiento');
    expect(resultado).not.toHaveProperty('id_modulos');
    expect(almacenamientoRecursos.obtenerMetadatos.mock.calls).toHaveLength(0);
  });

  it('normaliza módulos repetidos antes de persistir', async () => {
    await useCase.execute({
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.IMAGEN,
      orden_bloque: 2,
      clave_almacenamiento: `cronograma/recursos/${idContenido}/00000000-0000-4000-8000-000000000010`,
      mime_type: 'image/png',
      tamano_bytes: 1024,
      id_modulos: [idModulo, idModulo],
    });

    expect(recursoRepository.crearConModulosDestino.mock.calls[0][1]).toEqual([
      idModulo,
    ]);
  });

  it('retorna 400 antes de persistir cuando no hay módulos destino', async () => {
    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 1,
        texto_contenido: 'Texto',
        id_modulos: [],
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'El recurso debe tener al menos un módulo destino asignado.',
    });
    expect(contenidoRepository.buscarPorId.mock.calls).toHaveLength(0);
  });

  it.each([
    [
      'texto con clave de almacenamiento',
      {
        tipo_recurso: TipoRecurso.TEXTO,
        texto_contenido: 'Texto',
        clave_almacenamiento: 'archivo.txt',
      },
    ],
    [
      'multimedia con texto',
      {
        tipo_recurso: TipoRecurso.VIDEO,
        texto_contenido: 'Contenido incorrecto',
        clave_almacenamiento: 'video.mp4',
        mime_type: 'video/mp4',
        tamano_bytes: 1024,
      },
    ],
    [
      'multimedia sin clave de almacenamiento',
      {
        tipo_recurso: TipoRecurso.AUDIO,
        mime_type: 'audio/mpeg',
        tamano_bytes: 1024,
      },
    ],
  ])('retorna 400 para %s', async (_, datos) => {
    await expect(
      useCase.execute({
        id_contenido: idContenido,
        orden_bloque: 1,
        id_modulos: [idModulo],
        ...datos,
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(recursoRepository.crearConModulosDestino.mock.calls).toHaveLength(0);
  });

  it('retorna 404 cuando el contenido no existe', async () => {
    contenidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.TEXTO,
        orden_bloque: 1,
        texto_contenido: 'Texto',
        id_modulos: [idModulo],
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(recursoRepository.crearConModulosDestino.mock.calls).toHaveLength(0);
  });

  it('conserva el 404 de un módulo inexistente o inactivo', async () => {
    almacenamientoRecursos.obtenerMetadatos.mockResolvedValue({
      mimeType: 'application/pdf',
      tamanoBytes: 2048,
    });
    recursoRepository.crearConModulosDestino.mockRejectedValue(
      new ModuloDestinoNoDisponibleException(),
    );

    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.DOCUMENTO,
        orden_bloque: 3,
        clave_almacenamiento: `cronograma/recursos/${idContenido}/00000000-0000-4000-8000-000000000011`,
        mime_type: 'application/pdf',
        tamano_bytes: 2048,
        id_modulos: [idModulo],
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: 'Uno o más módulos destino no existen o están inactivos.',
    });
  });

  it('no persiste multimedia si el objeto no existe en S3', async () => {
    almacenamientoRecursos.obtenerMetadatos.mockResolvedValue(null);

    await expect(useCase.execute(recursoImagen())).rejects.toMatchObject({
      status: 400,
    });
    expect(recursoRepository.crearConModulosDestino.mock.calls).toHaveLength(0);
  });

  it('no persiste multimedia si el MIME o tamaño real no coincide', async () => {
    almacenamientoRecursos.obtenerMetadatos.mockResolvedValue({
      mimeType: 'image/jpeg',
      tamanoBytes: 1024,
    });

    await expect(useCase.execute(recursoImagen())).rejects.toMatchObject({
      status: 400,
      message:
        'El MIME type o el tamaño informado no coincide con el archivo almacenado.',
    });
    expect(recursoRepository.crearConModulosDestino.mock.calls).toHaveLength(0);
  });

  function recursoImagen() {
    return {
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.IMAGEN,
      orden_bloque: 2,
      clave_almacenamiento: `cronograma/recursos/${idContenido}/00000000-0000-4000-8000-000000000010`,
      mime_type: 'image/png',
      tamano_bytes: 1024,
      id_modulos: [idModulo],
    };
  }

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
