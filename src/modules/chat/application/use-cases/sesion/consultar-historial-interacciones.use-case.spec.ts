import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { InteraccionRegistrada } from '../../../domain/repositories/historial-interacciones.repository';
import { ContenidoNodoNoDisponibleException } from '../../exceptions/contenido-nodo-no-disponible.exception';
import { HistorialConversacionalInconsistenteException } from '../../exceptions/historial-conversacional-inconsistente.exception';
import { presentadorNodoPrueba } from '../../support/testing/presentacion-nodo.fixture';
import { ConsultarHistorialInteraccionesUseCase } from './consultar-historial-interacciones.use-case';

describe('ConsultarHistorialInteraccionesUseCase (RF-31 / RF-32)', () => {
  const fecha = new Date('2026-11-20T14:00:00Z');
  const sesiones = {
    buscarPorIdYUsuario: jest.fn(),
    buscarUltimaReanudable: jest.fn(),
    guardar: jest.fn(),
  };
  const arboles = { buscarNodo: jest.fn() };
  const historial = { consultar: jest.fn() };
  const caso = new ConsultarHistorialInteraccionesUseCase(
    sesiones,
    arboles as unknown as ArbolConversacionalRepository,
    historial,
    presentadorNodoPrueba(),
  );

  const sesion = new SesionConversacional(
    'sesion',
    'usuario',
    'flujo',
    1,
    ModalidadConversacional.GRUPAL,
    null,
    null,
    'nodo-3',
    'ACTIVA',
    fecha,
    fecha,
  );
  const nodo = (idNodo: string, contenido: Record<string, unknown>) =>
    new NodoConversacional(
      idNodo,
      'flujo',
      'tipo',
      'PREGUNTA',
      contenido,
      false,
      1,
      null,
      'admin',
      fecha,
      fecha,
    );
  const nodos: Record<string, NodoConversacional> = {
    'nodo-1': nodo('nodo-1', { texto: 'Bienvenida' }),
    'nodo-2': nodo('nodo-2', {
      texto: '¿Cómo te sientes?',
      capturaPerfil: { dimension: 'TIPO_CRAVING' },
      entrada: {
        tipo: 'SELECCION_UNICA',
        opciones: [{ valor: 'POSITIVO', etiqueta: 'Con ganas' }],
      },
    }),
  };
  const interaccion = (
    secuencia: number,
    idNodo: string,
    tipoEntrada: string,
    valor: unknown,
  ): InteraccionRegistrada => ({
    idInteraccion: `interaccion-${secuencia}`,
    secuencia,
    timestampInteraccion: fecha,
    idNodo,
    idNodoDestino: `nodo-${secuencia + 1}`,
    tipoEntrada,
    valor,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    sesiones.buscarPorIdYUsuario.mockResolvedValue(sesion);
    arboles.buscarNodo.mockImplementation((id: string) =>
      Promise.resolve(nodos[id] ?? null),
    );
    historial.consultar.mockResolvedValue({
      hayMas: false,
      interacciones: [
        interaccion(1, 'nodo-1', 'CONTINUAR', null),
        interaccion(2, 'nodo-2', 'SELECCION_UNICA', 'POSITIVO'),
      ],
    });
  });
  afterEach(() => {
    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(sesiones.buscarUltimaReanudable).not.toHaveBeenCalled();
  });

  it('devuelve las interacciones en orden con su destino y los bloques del nodo', async () => {
    const r = await caso.execute('sesion', 'usuario', { limite: 20 });
    expect(r.data).toMatchObject({
      hay_mas: false,
      siguiente_cursor: null,
    });
    expect(r.data.items.map((i) => i.secuencia)).toEqual([1, 2]);
    expect(r.data.items[0]).toEqual({
      id_interaccion: 'interaccion-1',
      secuencia: 1,
      timestamp_interaccion: '2026-11-20T14:00:00.000Z',
      nodo: {
        id_nodo: 'nodo-1',
        tipo_nodo: 'PREGUNTA',
        bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Bienvenida' }],
      },
      respuesta: { tipo_entrada: 'CONTINUAR', valor: null, etiqueta: null },
      id_nodo_destino: 'nodo-2',
    });
  });

  it('presenta el tipo canónico y la etiqueta de la opción guardada sin tocar su valor', async () => {
    const r = await caso.execute('sesion', 'usuario', { limite: 20 });
    expect(r.data.items[1].respuesta).toEqual({
      tipo_entrada: 'OPCION_UNICA',
      valor: 'POSITIVO',
      etiqueta: 'Con ganas',
    });
  });

  it('no expone la marca de captura clínica ni el perfil (RF-26, RF-27B)', async () => {
    const r = await caso.execute('sesion', 'usuario', { limite: 20 });
    const json = JSON.stringify(r);
    expect(json).not.toContain('capturaPerfil');
    expect(json).not.toContain('tipo_craving');
    expect(json).not.toContain('tipo_dependencia');
  });

  it('pasa la paginación al repositorio y consulta cada nodo una sola vez', async () => {
    historial.consultar.mockResolvedValue({
      hayMas: true,
      interacciones: [
        interaccion(4, 'nodo-1', 'CONTINUAR', null),
        interaccion(5, 'nodo-1', 'CONTINUAR', null),
      ],
    });
    const r = await caso.execute('sesion', 'usuario', {
      antes_de_secuencia: 6,
      limite: 2,
    });
    expect(historial.consultar).toHaveBeenCalledWith({
      idSesion: 'sesion',
      antesDe: 6,
      limite: 2,
    });
    expect(arboles.buscarNodo).toHaveBeenCalledTimes(1);
    expect(r.data).toMatchObject({ siguiente_cursor: 4, hay_mas: true });
  });

  it('responde vacío en una sesión sin interacciones', async () => {
    historial.consultar.mockResolvedValue({
      hayMas: false,
      interacciones: [],
    });
    const r = await caso.execute('sesion', 'usuario', { limite: 20 });
    expect(r.data).toEqual({
      hay_mas: false,
      siguiente_cursor: null,
      items: [],
    });
  });

  it('trata la sesión de otro usuario como inexistente y no lee el historial', async () => {
    sesiones.buscarPorIdYUsuario.mockResolvedValue(null);
    await expect(
      caso.execute('sesion', 'otro', { limite: 20 }),
    ).rejects.toBeInstanceOf(SesionConversacionalNoEncontradaException);
    expect(historial.consultar).not.toHaveBeenCalled();
  });

  it('responde HISTORIAL_INCONSISTENTE si un nodo del historial es de otro flujo', async () => {
    arboles.buscarNodo.mockResolvedValue(
      new NodoConversacional(
        'nodo-1',
        'otro-flujo',
        'tipo',
        'MENSAJE',
        { texto: 'x' },
        false,
        1,
        null,
        'admin',
        fecha,
        fecha,
      ),
    );
    await expect(
      caso.execute('sesion', 'usuario', { limite: 20 }),
    ).rejects.toBeInstanceOf(HistorialConversacionalInconsistenteException);
  });

  it('rechaza el historial inconsistente antes de presentar cualquier nodo', async () => {
    historial.consultar.mockResolvedValue(null);
    await expect(
      caso.execute('sesion', 'usuario', { limite: 20 }),
    ).rejects.toBeInstanceOf(HistorialConversacionalInconsistenteException);
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });

  it('convierte un fallo inesperado de lectura en CONTENIDO_NO_DISPONIBLE', async () => {
    historial.consultar.mockRejectedValue(new Error('conexión'));
    await expect(
      caso.execute('sesion', 'usuario', { limite: 20 }),
    ).rejects.toBeInstanceOf(ContenidoNodoNoDisponibleException);
  });
});
