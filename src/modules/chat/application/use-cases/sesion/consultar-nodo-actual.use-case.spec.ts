import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import {
  SesionConversacional,
  EstadoSesionConversacional,
} from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import {
  NodoActualNoEncontradoException,
  SesionConversacionalNoEncontradaException,
  SesionErrorConfiguracionException,
} from '../../../domain/exceptions';
import { ContenidoNodoNoDisponibleException } from '../../exceptions/contenido-nodo-no-disponible.exception';
import { ConsultarNodoActualUseCase } from './consultar-nodo-actual.use-case';
import { presentadorNodoPrueba } from '../../support/testing/presentacion-nodo.fixture';

describe('ConsultarNodoActualUseCase (RF-26)', () => {
  const sesiones = {
    buscarPorIdYUsuario: jest.fn(),
    buscarUltimaReanudable: jest.fn(),
    guardar: jest.fn(),
  };
  const arboles = {
    buscarNodo: jest.fn(),
    obtenerArbol: jest.fn(),
    buscarPublicadoGrupal: jest.fn(),
    buscarPublicadoPersonalizado: jest.fn(),
    guardarNodo: jest.fn(),
  };
  const caso = new ConsultarNodoActualUseCase(
    sesiones,
    arboles as unknown as ArbolConversacionalRepository,
    presentadorNodoPrueba(),
  );
  const fecha = new Date('2026-11-05T14:00:00Z');
  const contenido = {
    texto: '  Mensaje actual\nSin recortar.  ',
    instrucciones: 'Primera\nSegunda',
    multimedia: [
      { id: 'imagen-2', url: 'https://example.test/2.png' },
      { id: 'imagen-1', url: 'https://example.test/1.png' },
    ],
    ejercicio: { fases: [{ titulo: 'Una fase', duracion_segundos: 10 }] },
    extension_editor: { opciones: ['b', 'a'], valor: false },
  };
  const sesion = (
    estado: EstadoSesionConversacional = 'ACTIVA',
    idNodo: string | null = 'nodo-actual',
  ) =>
    new SesionConversacional(
      'sesion',
      'usuario',
      'flujo-original',
      1,
      ModalidadConversacional.GRUPAL,
      null,
      null,
      idNodo,
      estado,
      fecha,
      fecha,
    );
  const nodo = (
    json: Record<string, unknown> = contenido,
    flujo = 'flujo-original',
  ) =>
    new NodoConversacional(
      'nodo-actual',
      flujo,
      'tipo',
      'MENSAJE',
      json,
      false,
      2,
      null,
      'administrador',
      fecha,
      fecha,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    sesiones.buscarPorIdYUsuario.mockResolvedValue(sesion());
    arboles.buscarNodo.mockResolvedValue(nodo());
  });
  afterEach(() => {
    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(sesiones.buscarUltimaReanudable).not.toHaveBeenCalled();
    expect(arboles.obtenerArbol).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoPersonalizado).not.toHaveBeenCalled();
    expect(arboles.guardarNodo).not.toHaveBeenCalled();
  });

  it('devuelve solo el nodo persistido, conservando texto, orden y elementos visuales', async () => {
    const antes = JSON.stringify(contenido);
    const resultado = await caso.execute('sesion', 'usuario');
    expect(resultado).toMatchObject({
      idSesion: 'sesion',
      estadoSesion: 'ACTIVA',
      nodo: {
        idNodo: 'nodo-actual',
        tipoNodo: 'MENSAJE',
        orden: 2,
        esTerminal: true,
        entrada: null,
      },
    });
    expect(resultado.nodo.bloques.map((b) => b.tipo)).toEqual([
      'TEXTO',
      'INSTRUCCION',
      'IMAGEN',
      'IMAGEN',
    ]);
    expect(resultado.nodo.bloques[0].texto).toBe(contenido.texto);
    expect(resultado.nodo.bloques[1].texto).toBe(contenido.instrucciones);
    expect(JSON.stringify(contenido)).toBe(antes);
    expect(sesiones.buscarPorIdYUsuario).toHaveBeenCalledWith(
      'sesion',
      'usuario',
    );
    expect(arboles.buscarNodo).toHaveBeenCalledTimes(1);
    expect(arboles.buscarNodo).toHaveBeenCalledWith('nodo-actual');
  });
  it.each(['ACTIVA', 'PAUSADA', 'COMPLETADA'] as const)(
    'lee una sesión %s sin modificar su estado ni sus fechas',
    async (estado) => {
      const actual = sesion(estado);
      const reanudar = jest.spyOn(actual, 'reanudar');
      sesiones.buscarPorIdYUsuario.mockResolvedValue(actual);
      await caso.execute('sesion', 'usuario');
      expect(reanudar).not.toHaveBeenCalled();
      expect(actual.estadoActual).toBe(estado);
      expect(actual.fechaUltimaInteraccion).toEqual(fecha);
      expect(actual.idNodoActual).toBe('nodo-actual');
    },
  );
  it('informa contenido no disponible si el JSON está vacío', async () => {
    arboles.buscarNodo.mockResolvedValue(nodo({}));
    await expect(caso.execute('sesion', 'usuario')).rejects.toBeInstanceOf(
      ContenidoNodoNoDisponibleException,
    );
  });
  it('oculta tanto una sesión inexistente como una ajena', async () => {
    sesiones.buscarPorIdYUsuario.mockResolvedValue(null);
    await expect(
      caso.execute('sesion-ajena', 'usuario'),
    ).rejects.toBeInstanceOf(SesionConversacionalNoEncontradaException);
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('informa ERROR_CONFIGURACION sin seleccionar ni crear un árbol', async () => {
    sesiones.buscarPorIdYUsuario.mockResolvedValue(
      sesion('ERROR_CONFIGURACION', null),
    );
    await expect(caso.execute('sesion', 'usuario')).rejects.toBeInstanceOf(
      SesionErrorConfiguracionException,
    );
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('informa que no hay nodo actual sin iniciar ni reiniciar la sesión', async () => {
    sesiones.buscarPorIdYUsuario.mockResolvedValue(sesion('ACTIVA', null));
    await expect(caso.execute('sesion', 'usuario')).rejects.toBeInstanceOf(
      NodoActualNoEncontradoException,
    );
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('responde 404 si el nodo no existe', async () => {
    arboles.buscarNodo.mockResolvedValue(null);
    await expect(caso.execute('sesion', 'usuario')).rejects.toBeInstanceOf(
      NodoActualNoEncontradoException,
    );
  });
  it('no expone un nodo que pertenezca a otro flujo', async () => {
    arboles.buscarNodo.mockResolvedValue(nodo(contenido, 'otro-flujo'));
    await expect(caso.execute('sesion', 'usuario')).rejects.toBeInstanceOf(
      NodoActualNoEncontradoException,
    );
  });
  it('informa contenido no disponible ante un valor JSON null persistido', async () => {
    arboles.buscarNodo.mockResolvedValue(
      nodo(null as unknown as Record<string, unknown>),
    );
    await expect(caso.execute('sesion', 'usuario')).rejects.toBeInstanceOf(
      ContenidoNodoNoDisponibleException,
    );
  });
  it.each(['sesion', 'nodo'])(
    'oculta el detalle de un fallo de lectura de %s',
    async (lectura) => {
      (lectura === 'sesion'
        ? sesiones.buscarPorIdYUsuario
        : arboles.buscarNodo
      ).mockRejectedValue(new Error('detalle privado del driver'));
      await expect(caso.execute('sesion', 'usuario')).rejects.toMatchObject({
        status: 500,
        response: {
          codigo: 'CONTENIDO_NO_DISPONIBLE',
          message: 'El contenido del nodo no está disponible.',
        },
      });
    },
  );
});
