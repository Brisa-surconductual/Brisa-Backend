import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { IntervencionSos } from '../../../domain/entities/sos/intervencion-sos.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
  ModuloOrigenSos,
} from '../../../domain/enums/intervencion-sos.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { TipoCravingClinico } from '../../../domain/enums/perfil-clinico.enum';
import {
  IntervencionSosEnCursoException,
  SinFlujoSosException,
} from '../../../domain/exceptions';
import {
  IntervencionSosPort,
  IntervencionSosTransaccion,
  NuevaIntervencionSos,
} from '../../ports/intervencion-sos.port';
import {
  PENDIENTE_PERFIL,
  PerfilClinicoVigentePort,
} from '../../ports/perfil-clinico-vigente.port';
import { PresentarNodoActualService } from '../../services/presentar-nodo-actual.service';
import {
  fecha,
  ids,
  nodo,
  repositorioSimulado,
} from '../../support/testing/arbol-fixtures';
import { ActivarSosUseCase } from './activar-sos.use-case';

const idUsuario = '00000000-0000-4000-8000-0000000000e1';
const idSesionTerapia = '00000000-0000-4000-8000-0000000000e2';
const inicio = new Date('2026-11-20T09:40:00.000Z');
const limite = new Date('2026-11-20T09:41:00.000Z');

function flujoSos(): FlujoConversacional {
  return new FlujoConversacional(
    ids.flujo,
    'Protocolo SOS',
    ModalidadConversacional.SOS,
    EstadoFlujoConversacional.PUBLICADO,
    1,
    ids.actor,
    fecha,
    fecha,
  );
}

function sesionTerapia(estado: 'ACTIVA' | 'PAUSADA'): SesionConversacional {
  return new SesionConversacional(
    idSesionTerapia,
    idUsuario,
    ids.otroFlujo,
    1,
    ModalidadConversacional.GRUPAL,
    null,
    null,
    ids.nodoB,
    estado,
    fecha,
    fecha,
  );
}

function intervencion(
  datos: Partial<NuevaIntervencionSos> & {
    estado?: EstadoIntervencionSos;
    vencida?: boolean;
  } = {},
): IntervencionSos {
  return new IntervencionSos(
    '00000000-0000-4000-8000-0000000000a9',
    idUsuario,
    datos.idSesionSos ?? '00000000-0000-4000-8000-0000000000b9',
    datos.idSesionPausada ?? null,
    datos.estadoSesionAnterior ?? EstadoSesionAnteriorSos.NINGUNA,
    datos.tipoCraving ?? null,
    datos.estado ?? EstadoIntervencionSos.EN_CURSO,
    datos.contextoOrigen ?? null,
    inicio,
    limite,
    null,
    datos.vencida ?? false,
  );
}

describe('ActivarSosUseCase (RF-43)', () => {
  const arboles = repositorioSimulado();
  let tx: jest.Mocked<IntervencionSosTransaccion>;
  let sos: jest.Mocked<IntervencionSosPort>;
  let perfil: jest.Mocked<PerfilClinicoVigentePort>;
  let presentar: jest.Mocked<Pick<PresentarNodoActualService, 'preparar'>>;
  let useCase: ActivarSosUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    arboles.buscarPublicadoUnico.mockResolvedValue(flujoSos());
    arboles.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(
        flujoSos(),
        [nodo(ids.nodoA), nodo(ids.nodoB)],
        [],
      ),
    );
    tx = {
      bloquearUsuario: jest.fn().mockResolvedValue(undefined),
      buscarEnCurso: jest.fn().mockResolvedValue(null),
      bloquear: jest.fn(),
      cerrar: jest.fn().mockResolvedValue(true),
      buscarSesionDeTerapiaPendiente: jest.fn().mockResolvedValue(null),
      pausarSesion: jest.fn().mockResolvedValue(undefined),
      crearSesionSos: jest.fn().mockResolvedValue(undefined),
      registrar: jest
        .fn()
        .mockImplementation((datos: NuevaIntervencionSos) =>
          Promise.resolve(intervencion(datos)),
        ),
    };
    sos = {
      ejecutar: jest.fn((operacion) => operacion(tx)),
      listarRecursosApoyo: jest
        .fn()
        .mockResolvedValue([{ nombre: 'Línea 106', telefono: '106' }]),
      expirarVencidas: jest.fn(),
      purgarContextos: jest.fn(),
    } as unknown as jest.Mocked<IntervencionSosPort>;
    perfil = {
      obtener: jest.fn().mockResolvedValue({
        tipo_craving: TipoCravingClinico.NEGATIVO,
      }),
    } as unknown as jest.Mocked<PerfilClinicoVigentePort>;
    presentar = {
      preparar: jest.fn().mockResolvedValue({
        nodo: {
          idNodo: ids.nodoA,
          tipoNodo: 'MENSAJE',
          esTerminal: false,
          disponibilidad: { habilitado: true, habilitaAprox: null },
          bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Respira' }],
          entrada: null,
        },
      }),
    };
    useCase = new ActivarSosUseCase(
      sos,
      arboles,
      perfil,
      presentar as unknown as PresentarNodoActualService,
    );
  });

  it('sin sesión de terapia: crea la sesión SOS en el nodo inicial y devuelve el contrato', async () => {
    const respuesta = await useCase.execute(idUsuario);

    expect(tx.bloquearUsuario).toHaveBeenCalledWith(idUsuario);
    const [sesionSos] = tx.crearSesionSos.mock.calls[0];
    expect(sesionSos).toMatchObject({
      idUsuario,
      modalidadActiva: ModalidadConversacional.SOS,
      idFlujoConversacional: ids.flujo,
      idNodoActual: ids.nodoA,
      estadoActual: 'ACTIVA',
      tipoCraving: TipoCravingClinico.NEGATIVO,
    });
    expect(tx.pausarSesion).not.toHaveBeenCalled();
    expect(tx.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        idSesionSos: sesionSos.idSesion,
        idSesionPausada: null,
        estadoSesionAnterior: EstadoSesionAnteriorSos.NINGUNA,
      }),
    );
    expect(respuesta).toEqual({
      id_intervencion: '00000000-0000-4000-8000-0000000000a9',
      id_sesion_sos: sesionSos.idSesion,
      sesion_pausada: null,
      inicio_servidor: '2026-11-20T04:40:00-05:00',
      fin_maximo_servidor: '2026-11-20T04:41:00-05:00',
      nodo_actual: expect.objectContaining({
        id_nodo: ids.nodoA,
        bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Respira' }],
      }),
      recursos_apoyo: [{ nombre: 'Línea 106', telefono: '106' }],
      contexto_origen: null,
    });
  });

  it('pausa la sesión de terapia ACTIVA y la ofrece para retomar', async () => {
    tx.buscarSesionDeTerapiaPendiente.mockResolvedValue(
      sesionTerapia('ACTIVA'),
    );

    const respuesta = await useCase.execute(idUsuario);

    const [pausada] = tx.pausarSesion.mock.calls[0];
    expect(pausada.estadoActual).toBe('PAUSADA');
    expect(pausada.idNodoActual).toBe(ids.nodoB);
    expect(tx.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        idSesionPausada: idSesionTerapia,
        estadoSesionAnterior: EstadoSesionAnteriorSos.ACTIVA,
      }),
    );
    expect(respuesta.sesion_pausada).toEqual({ id_sesion: idSesionTerapia });
  });

  it('una sesión ya PAUSADA no se vuelve a pausar, pero se ofrece retomarla', async () => {
    tx.buscarSesionDeTerapiaPendiente.mockResolvedValue(
      sesionTerapia('PAUSADA'),
    );

    await useCase.execute(idUsuario);

    expect(tx.pausarSesion).not.toHaveBeenCalled();
    expect(tx.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        idSesionPausada: idSesionTerapia,
        estadoSesionAnterior: EstadoSesionAnteriorSos.PAUSADA,
      }),
    );
  });

  it('404 SIN_FLUJO_SOS si no hay flujo SOS publicado', async () => {
    arboles.buscarPublicadoUnico.mockResolvedValue(null);

    await expect(useCase.execute(idUsuario)).rejects.toBeInstanceOf(
      SinFlujoSosException,
    );
    expect(sos.ejecutar).not.toHaveBeenCalled();
  });

  it('409 INTERVENCION_EN_CURSO con una intervención vigente', async () => {
    tx.buscarEnCurso.mockResolvedValue(intervencion());

    const error = await useCase.execute(idUsuario).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(IntervencionSosEnCursoException);
    expect((error as IntervencionSosEnCursoException).detalles).toEqual({
      id_intervencion: '00000000-0000-4000-8000-0000000000a9',
      fin_maximo_servidor: '2026-11-20T04:41:00-05:00',
    });
    expect(tx.crearSesionSos).not.toHaveBeenCalled();
  });

  it('una intervención en curso ya vencida se cierra como EXPIRADA y se activa otra', async () => {
    tx.buscarEnCurso.mockResolvedValue(intervencion({ vencida: true }));

    await useCase.execute(idUsuario);

    expect(tx.cerrar).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-0000000000a9',
      EstadoIntervencionSos.EXPIRADA,
    );
    expect(tx.crearSesionSos).toHaveBeenCalled();
  });

  it('sin perfil clasificado o si falla la consulta, tipo_craving es null', async () => {
    perfil.obtener.mockResolvedValueOnce({
      tipo_craving: PENDIENTE_PERFIL,
    } as never);
    await useCase.execute(idUsuario);
    expect(tx.registrar.mock.calls[0][0].tipoCraving).toBeNull();

    perfil.obtener.mockRejectedValueOnce(new Error('caído'));
    await useCase.execute(idUsuario);
    expect(tx.registrar.mock.calls[1][0].tipoCraving).toBeNull();
  });

  it('guarda el contexto de origen; un estado demasiado grande no bloquea el SOS', async () => {
    await useCase.execute(idUsuario, {
      contexto_origen: {
        modulo: ModuloOrigenSos.DIARIO,
        ruta: '/diario/nuevo',
        estado: { borrador: 'hoy me sentí...' },
      },
    });
    expect(tx.registrar.mock.calls[0][0].contextoOrigen).toEqual({
      modulo: ModuloOrigenSos.DIARIO,
      ruta: '/diario/nuevo',
      estado: { borrador: 'hoy me sentí...' },
    });

    await useCase.execute(idUsuario, {
      contexto_origen: {
        modulo: ModuloOrigenSos.DIARIO,
        ruta: '/diario/nuevo',
        estado: { borrador: 'x'.repeat(20_000) },
      },
    });
    expect(tx.registrar.mock.calls[1][0].contextoOrigen).toEqual({
      modulo: ModuloOrigenSos.DIARIO,
      ruta: '/diario/nuevo',
      estado: null,
    });
  });
});
