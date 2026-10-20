import { CalcularUbicacionTemporalUsuarioUseCase } from '../../../cronograma/application/use-cases/cronograma/calcular-ubicacion-temporal-usuario.use-case';
import { UbicacionTemporalUsuarioDtoResponse } from '../../../cronograma/application/dto/cronograma/ubicacion-temporal-usuario.dto-response';
import {
  ArbolConversacional,
  FlujoConversacional,
  NodoConversacional,
} from '../../domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  ModalidadConversacional,
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../domain/enums/arbol-conversacional.enums';
import { ArbolConversacionalRepository } from '../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacional } from '../../domain/repositories/sesion-conversacional.repository';
import { DeterminarContextoConversacionalUseCase } from './determinar-contexto-conversacional.use-case';
import { IniciarOReanudarSesionUseCase } from './iniciar-o-reanudar-sesion.use-case';
import { PerfilClinicoIncompletoException } from '../../domain/exeption/contexto-conversacional.exceptions';

describe('IniciarOReanudarSesionUseCase', () => {
  const ids = {
    usuario: '00000000-0000-4000-8000-000000000001',
    flujo: '00000000-0000-4000-8000-000000000002',
    nodo: '00000000-0000-4000-8000-000000000003',
    sesion: '00000000-0000-4000-8000-000000000004',
    tipoNodo: '00000000-0000-4000-8000-000000000005',
  };

  const fecha = new Date('2026-10-19T12:00:00Z');

  const sesiones = {
    buscarUltimaReanudable: jest.fn(),
    iniciarOReanudar: jest.fn(),
  };

  const arboles = {
    buscarPublicadoGrupal: jest.fn(),
    buscarPublicadoPersonalizado: jest.fn(),
    obtenerArbol: jest.fn(),
    buscarNodo: jest.fn(),
    listarFlujos: jest.fn(),
  };

  const determinarContexto = {
    execute: jest.fn(),
  };

  const calcularUbicacion = {
    execute: jest.fn(),
  };

  const asignacionCronograma = {
    existeAsignacion: jest.fn(),
  };

  const casoDeUso = new IniciarOReanudarSesionUseCase(
    sesiones,
    arboles as unknown as ArbolConversacionalRepository,
    determinarContexto as unknown as DeterminarContextoConversacionalUseCase,
    calcularUbicacion as unknown as CalcularUbicacionTemporalUsuarioUseCase,
    asignacionCronograma,
  );

  const flujo = new FlujoConversacional(
    ids.flujo,
    'Árbol grupal',
    ModalidadConversacional.GRUPAL,
    EstadoFlujoConversacional.PUBLICADO,
    1,
    ids.usuario,
    fecha,
    fecha,
  );

  const nodo = new NodoConversacional(
    ids.nodo,
    ids.flujo,
    ids.tipoNodo,
    'MENSAJE',
    { texto: 'Bienvenido' },
    true,
    1,
    null,
    ids.usuario,
    fecha,
    fecha,
  );

  const sesion: SesionConversacional = {
    idSesion: ids.sesion,
    idUsuario: ids.usuario,
    idFlujoConversacional: ids.flujo,
    versionArbolUtilizada: 1,
    modalidadActiva: ModalidadConversacional.GRUPAL,
    tipoDependencia: null,
    tipoCraving: null,
    idNodoActual: ids.nodo,
    estadoActual: 'ACTIVA',
    fechaInicio: fecha,
    fechaUltimaInteraccion: fecha,
  };

  const ubicacion: UbicacionTemporalUsuarioDtoResponse = {
    id_usuario: ids.usuario,
    id_cronograma_usuario: ids.usuario,
    id_cronograma: ids.usuario,
    id_unidad_temporal: ids.usuario,
    nombre_unidad: 'Semana 1',
    orden_unidad: 1,
    fecha_calculo: fecha,
    tiempo_efectivo_transcurrido_segundos: 0,
    cronograma_finalizado: false,
    mensaje: null,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    calcularUbicacion.execute.mockResolvedValue(ubicacion);
    arboles.buscarNodo.mockResolvedValue(nodo);
    asignacionCronograma.existeAsignacion.mockResolvedValue(true);
  });

  it('reanuda una sesión existente sin volver a determinar modalidad ni árbol', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(sesion);
    sesiones.iniciarOReanudar.mockResolvedValue({
      reanudada: true,
      sesion,
    });

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.id_sesion).toBe(ids.sesion);
    expect(resultado.nodo_actual.id_nodo).toBe(ids.nodo);
    expect(resultado.ubicacion_temporal.nombre_unidad).toBe('Semana 1');

    expect(determinarContexto.execute).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoPersonalizado).not.toHaveBeenCalled();

    expect(sesiones.iniciarOReanudar).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsuario: ids.usuario,
        idFlujoConversacional: ids.flujo,
        idNodoInicial: ids.nodo,
      }),
    );
  });

  it('inicia una sesión nueva con el árbol GRUPAL publicado', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.GRUPAL,
      perfil: null,
    });

    arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);

    arboles.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujo, [nodo], []),
    );

    sesiones.iniciarOReanudar.mockResolvedValue({
      reanudada: false,
      sesion,
    });

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(false);
    expect(resultado.sesion.modalidad_activa).toBe(
      ModalidadConversacional.GRUPAL,
    );
    expect(resultado.nodo_actual.es_nodo_inicial).toBe(true);

    expect(determinarContexto.execute).toHaveBeenCalledWith(ids.usuario);
    expect(arboles.buscarPublicadoGrupal).toHaveBeenCalledTimes(1);
    expect(arboles.obtenerArbol).toHaveBeenCalledWith(ids.flujo);

    expect(sesiones.iniciarOReanudar).toHaveBeenCalledWith({
      idUsuario: ids.usuario,
      idFlujoConversacional: ids.flujo,
      versionArbolUtilizada: 1,
      modalidadActiva: ModalidadConversacional.GRUPAL,
      tipoDependencia: null,
      tipoCraving: null,
      idNodoInicial: ids.nodo,
    });
  });

  it.each([
    [TipoDependenciaClinica.ABSTINENCIA_FISICA, TipoCravingClinico.POSITIVO],
    [TipoDependenciaClinica.ABSTINENCIA_FISICA, TipoCravingClinico.NEGATIVO],
    [TipoDependenciaClinica.TOLERANCIA, TipoCravingClinico.POSITIVO],
    [TipoDependenciaClinica.TOLERANCIA, TipoCravingClinico.NEGATIVO],
  ])(
    'inicia una sesión PERSONALIZADA para %s y %s',
    async (tipoDependencia, tipoCraving) => {

    const flujoPersonalizado = new FlujoConversacional(
      ids.flujo,
      'Árbol personalizado',
      ModalidadConversacional.PERSONALIZADA,
      EstadoFlujoConversacional.PUBLICADO,
      1,
      ids.usuario,
      fecha,
      fecha,
      tipoDependencia,
      tipoCraving,
    );

    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipoDependencia,
        tipoCraving,
      },
    });

    arboles.buscarPublicadoPersonalizado.mockResolvedValue(flujoPersonalizado);

    arboles.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujoPersonalizado, [nodo], []),
    );

    sesiones.iniciarOReanudar.mockResolvedValue({
      reanudada: false,
      sesion: {
        ...sesion,
        modalidadActiva: ModalidadConversacional.PERSONALIZADA,
        tipoDependencia,
        tipoCraving,
      },
    });

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(false);
    expect(resultado.sesion.modalidad_activa).toBe(
      ModalidadConversacional.PERSONALIZADA,
    );

    expect(resultado.sesion.tipo_dependencia).toBe(tipoDependencia);
    expect(resultado.sesion.tipo_craving).toBe(tipoCraving);

    expect(arboles.buscarPublicadoPersonalizado).toHaveBeenCalledWith({
      tipoDependencia,
      tipoCraving,
    });

    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();

    expect(sesiones.iniciarOReanudar).toHaveBeenCalledWith({
      idUsuario: ids.usuario,
      idFlujoConversacional: ids.flujo,
      versionArbolUtilizada: 1,
      modalidadActiva: ModalidadConversacional.PERSONALIZADA,
      tipoDependencia,
      tipoCraving,
      idNodoInicial: ids.nodo,
    });
  });

  it('rechaza el inicio cuando no existe un árbol GRUPAL publicado', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.GRUPAL,
      perfil: null,
    });

    arboles.buscarPublicadoGrupal.mockResolvedValue(null);

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 404,
      response: {
        codigo: 'SIN_FLUJO_PUBLICADO',
      },
    });

    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
    expect(arboles.obtenerArbol).not.toHaveBeenCalled();
  });

  it('rechaza el inicio PERSONALIZADO sin árbol publicado', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
      },
    });

    arboles.buscarPublicadoPersonalizado.mockResolvedValue(null);

    arboles.listarFlujos.mockResolvedValue({
      items: [],
      total: 0,
    });

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 404,
      response: {
        codigo: 'SIN_FLUJO_PUBLICADO',
      },
    });

    expect(arboles.buscarPublicadoPersonalizado).toHaveBeenCalledWith({
      tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
      tipoCraving: TipoCravingClinico.NEGATIVO,
    });

    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el árbol personalizado existe pero no está publicado', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
      },
    });

    arboles.buscarPublicadoPersonalizado.mockResolvedValue(null);

    arboles.listarFlujos.mockResolvedValue({
      items: [],
      total: 1,
    });

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 409,
      response: {
        codigo: 'FLUJO_NO_PUBLICADO',
      },
    });

    expect(arboles.listarFlujos).toHaveBeenCalledWith({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
      tipoCraving: TipoCravingClinico.NEGATIVO,
      page: 1,
      pageSize: 1,
    });

    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
  });

  it('responde PERFIL_INCOMPLETO (409) sin crear sesión', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    determinarContexto.execute.mockRejectedValue(
      new PerfilClinicoIncompletoException(),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 409,
      response: {
        codigo: 'PERFIL_INCOMPLETO',
      },
    });

    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoPersonalizado).not.toHaveBeenCalled();
  });

  it('responde SIN_CRONOGRAMA (422) sin crear sesión', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);
    asignacionCronograma.existeAsignacion.mockResolvedValue(false);

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 422,
      response: {
        codigo: 'SIN_CRONOGRAMA',
      },
    });

    expect(calcularUbicacion.execute).not.toHaveBeenCalled();
    expect(determinarContexto.execute).not.toHaveBeenCalled();
    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
  });

  it('propaga errores de infraestructura al verificar la asignación', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    asignacionCronograma.existeAsignacion.mockRejectedValue(
      new Error('Error de conexión a PostgreSQL'),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toThrow(
      'Error de conexión a PostgreSQL',
    );

    expect(calcularUbicacion.execute).not.toHaveBeenCalled();
    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
  });

  it('propaga errores del cálculo temporal sin crear una sesión', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

    calcularUbicacion.execute.mockRejectedValue(
      new Error('Error interno de Cronograma'),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toThrow(
      'Error interno de Cronograma',
    );

    expect(determinarContexto.execute).not.toHaveBeenCalled();
    expect(sesiones.iniciarOReanudar).not.toHaveBeenCalled();
  });
});
