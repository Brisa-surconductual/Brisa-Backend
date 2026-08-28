import { Contenido } from '../../domain/entities/contenido.entity';
import { TipoContenido } from '../../domain/enums/tipo-contenido.enum';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { ModuloDestinoNoDisponibleException } from '../../domain/exeption/modulo-destino-no-disponible.exception';
import { ContenidoRepository } from '../../domain/repositories/contenido.repository';
import { RecursoContenidoRepository } from '../../domain/repositories/recurso-contenido.repository';
import { CrearRecursoContenidoUseCase } from './crear-recurso-contenido.use-case';

describe('CrearRecursoContenidoUseCase (RF-153/RF-154)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const idModulo = '00000000-0000-4000-8000-000000000002';
  let contenidoRepository: jest.Mocked<ContenidoRepository>;
  let recursoRepository: jest.Mocked<RecursoContenidoRepository>;
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
    };
    useCase = new CrearRecursoContenidoUseCase(
      contenidoRepository,
      recursoRepository,
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
    expect(resultado).toMatchObject({
      id_contenido: idContenido,
      id_modulos: [idModulo],
      mensaje: 'Recurso creado y asociado a sus módulos correctamente.',
    });
  });

  it('normaliza módulos repetidos antes de persistir', async () => {
    await useCase.execute({
      id_contenido: idContenido,
      tipo_recurso: TipoRecurso.IMAGEN,
      orden_bloque: 2,
      clave_almacenamiento: 'cronograma/imagenes/recurso.png',
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
      },
    ],
    [
      'multimedia sin clave de almacenamiento',
      {
        tipo_recurso: TipoRecurso.AUDIO,
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
    recursoRepository.crearConModulosDestino.mockRejectedValue(
      new ModuloDestinoNoDisponibleException(),
    );

    await expect(
      useCase.execute({
        id_contenido: idContenido,
        tipo_recurso: TipoRecurso.DOCUMENTO,
        orden_bloque: 3,
        clave_almacenamiento: 'cronograma/documentos/guia.pdf',
        id_modulos: [idModulo],
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: 'Uno o más módulos destino no existen o están inactivos.',
    });
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
