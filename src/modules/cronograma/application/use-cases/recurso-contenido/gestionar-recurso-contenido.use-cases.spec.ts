import { TipoRecurso } from '../../../domain/enums/tipo-recurso.enum';
import { RecursoContenido } from '../../../domain/entities/recurso-contenido.entity';
import { RecursoContenidoActivoException } from '../../../domain/exeption/recurso-contenido/recurso-contenido-activo.exception';
import {
  ActualizarRecursoContenidoUseCase,
  EliminarRecursoContenidoUseCase,
  ListarRecursosContenidoUseCase,
} from './gestionar-recurso-contenido.use-cases';

describe('Gestión de recursos', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  const contenido = '00000000-0000-4000-8000-000000000002';
  const modulo = '00000000-0000-4000-8000-000000000003';
  const recursos = {
    buscarDetalle: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    asegurarContenidoEditable: jest.fn(),
    listarPorContenido: jest.fn(),
  };
  const almacenamiento = { obtenerMetadatos: jest.fn() };
  let useCase: ActualizarRecursoContenidoUseCase;
  const detalle = (tipo = TipoRecurso.TEXTO) => ({
    recurso: RecursoContenido.crear({
      idContenido: contenido,
      tipoRecurso: tipo,
      ordenBloque: 1,
      textoContenido: tipo === TipoRecurso.TEXTO ? 'Texto' : undefined,
      claveAlmacenamiento:
        tipo === TipoRecurso.TEXTO ? undefined : 'clave-anterior',
      mimeType: tipo === TipoRecurso.TEXTO ? undefined : 'image/png',
      tamanoBytes: tipo === TipoRecurso.TEXTO ? undefined : 100,
    }),
    idModulos: [modulo],
  });

  beforeEach(() => {
    jest.resetAllMocks();
    recursos.buscarDetalle.mockResolvedValue(detalle());
    recursos.actualizar.mockResolvedValue(detalle());
    almacenamiento.obtenerMetadatos.mockResolvedValue({
      mimeType: 'image/png',
      tamanoBytes: 100,
    });
    useCase = new ActualizarRecursoContenidoUseCase(
      recursos as never,
      almacenamiento as never,
    );
  });

  it('edita texto y destinos sin consultar S3', async () => {
    await useCase.execute(id, {
      texto_contenido: 'Nuevo texto',
      id_modulos: [modulo],
    });
    expect(recursos.actualizar).toHaveBeenCalledWith(
      id,
      expect.objectContaining({
        textoContenido: 'Nuevo texto',
        idModulos: [modulo],
      }),
    );
    expect(almacenamiento.obtenerMetadatos).not.toHaveBeenCalled();
  });

  it('rechaza PATCH vacío antes de acceder a persistencia', async () => {
    await expect(useCase.execute(id, {})).rejects.toMatchObject({
      status: 400,
    });
    expect(recursos.buscarDetalle).not.toHaveBeenCalled();
  });

  it('devuelve 404 para un recurso inexistente', async () => {
    recursos.buscarDetalle.mockResolvedValue(null);
    await expect(
      useCase.execute(id, { texto_contenido: 'Texto' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('bloquea recursos activos antes de consultar AWS', async () => {
    recursos.asegurarContenidoEditable.mockRejectedValue(
      new RecursoContenidoActivoException(),
    );
    await expect(
      useCase.execute(id, { texto_contenido: 'Texto' }),
    ).rejects.toMatchObject({ status: 403 });
    expect(recursos.actualizar).not.toHaveBeenCalled();
    expect(almacenamiento.obtenerMetadatos).not.toHaveBeenCalled();
  });

  it('impide convertir texto en multimedia', async () => {
    await expect(
      useCase.execute(id, {
        clave_almacenamiento: 'clave',
        mime_type: 'image/png',
        tamano_bytes: 100,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rechaza una sustitución parcial de archivo', async () => {
    recursos.buscarDetalle.mockResolvedValue(detalle(TipoRecurso.IMAGEN));
    await expect(
      useCase.execute(id, { clave_almacenamiento: 'nueva' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('comprueba MIME, tamaño y pertenencia del archivo antes de reemplazarlo', async () => {
    recursos.buscarDetalle.mockResolvedValue(detalle(TipoRecurso.IMAGEN));
    await useCase.execute(id, {
      clave_almacenamiento: 'nueva',
      mime_type: 'IMAGE/PNG',
      tamano_bytes: 100,
      texto_alternativo: null,
    });
    expect(almacenamiento.obtenerMetadatos).toHaveBeenCalledWith({
      idContenido: contenido,
      claveAlmacenamiento: 'nueva',
    });
    expect(recursos.actualizar).toHaveBeenCalledWith(
      id,
      expect.objectContaining({
        archivo: {
          claveAlmacenamiento: 'nueva',
          mimeType: 'image/png',
          tamanoBytes: 100,
        },
        textoAlternativo: null,
      }),
    );
  });

  it.each([
    null,
    { mimeType: 'image/png', tamanoBytes: 999 },
    { mimeType: 'video/mp4', tamanoBytes: 100 },
  ])('impide persistir un archivo no verificado: %p', async (metadatos) => {
    recursos.buscarDetalle.mockResolvedValue(detalle(TipoRecurso.IMAGEN));
    almacenamiento.obtenerMetadatos.mockResolvedValue(metadatos);
    await expect(
      useCase.execute(id, {
        clave_almacenamiento: 'nueva',
        mime_type: 'image/png',
        tamano_bytes: 100,
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(recursos.actualizar).not.toHaveBeenCalled();
  });

  it('permite borrar sin depender de una llamada a S3', async () => {
    await new EliminarRecursoContenidoUseCase(recursos as never).execute(id);
    expect(recursos.eliminar).toHaveBeenCalledWith(id);
    expect(almacenamiento.obtenerMetadatos).not.toHaveBeenCalled();
  });

  it('distingue contenido inexistente de una lista de recursos vacía', async () => {
    const contenidos = { buscarPorId: jest.fn().mockResolvedValue({}) };
    recursos.listarPorContenido.mockResolvedValue([]);
    const listar = new ListarRecursosContenidoUseCase(
      contenidos as never,
      recursos as never,
    );
    await expect(listar.execute(contenido)).resolves.toEqual([]);
    contenidos.buscarPorId.mockResolvedValue(null);
    await expect(listar.execute(contenido)).rejects.toMatchObject({
      status: 404,
    });
  });
});
