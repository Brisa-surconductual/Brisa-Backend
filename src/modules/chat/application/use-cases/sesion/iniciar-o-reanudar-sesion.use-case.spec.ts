import { CalcularUbicacionTemporalUsuarioUseCase } from '../../../../cronograma/application/use-cases/cronograma/calcular-ubicacion-temporal-usuario.use-case';
import { UbicacionTemporalUsuarioDtoResponse } from '../../../../cronograma/application/dto/cronograma/ubicacion-temporal-usuario.dto-response';
import { ArbolConversacional } from '../../../domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../../domain/entities/flujo/flujo-conversacional.entity';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { EstadoFlujoConversacional } from '../../../domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../../domain/enums/perfil-clinico.enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { DeterminarContextoConversacionalUseCase } from './determinar-contexto-conversacional.use-case';
import { IniciarOReanudarSesionUseCase } from './iniciar-o-reanudar-sesion.use-case';
import { PresentarHistorialConversacionalService } from '../../services/presentar-historial-conversacional.service';
import {
  EstadoSesionRecuperado,
  RecuperarSesionConversacionalService,
} from '../../services/recuperar-sesion-conversacional.service';
import { presentadorNodoPrueba } from '../../support/testing/presentacion-nodo.fixture';
import {
  ArbolYaCompletadoException,
  PerfilClinicoIncompletoException,
  SesionActivaExistenteException,
} from '../../../domain/exceptions';

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
    buscarPorIdYUsuario: jest.fn(),
    buscarUltimaNoCompletada: jest.fn(),
    buscarCompletadaDelArbol: jest.fn(),
    guardar: jest.fn(),
  };

  const arboles = {
    buscarPublicadoGrupal: jest.fn(),
    buscarPublicadoPersonalizado: jest.fn(),
    obtenerArbol: jest.fn(),
    buscarNodosPorIds: jest.fn(),
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

  const recuperar = jest.fn<
    Promise<EstadoSesionRecuperado | null>,
    [string, string]
  >();
  const consultarCompletada = jest.fn<
    Promise<EstadoSesionRecuperado | null>,
    [string, string]
  >();
  const presentador = presentadorNodoPrueba();

  const casoDeUso = new IniciarOReanudarSesionUseCase(
    sesiones,
    arboles as unknown as ArbolConversacionalRepository,
    determinarContexto as unknown as DeterminarContextoConversacionalUseCase,
    calcularUbicacion as unknown as CalcularUbicacionTemporalUsuarioUseCase,
    asignacionCronograma,
    {
      async recuperar<T>(
        sesion: string,
        usuario: string,
        finalizar: (estado: EstadoSesionRecuperado) => Promise<T>,
      ) {
        const estado = await recuperar(sesion, usuario);
        return estado === null ? null : finalizar(estado);
      },
      async consultarCompletada<T>(
        sesion: string,
        usuario: string,
        finalizar: (estado: EstadoSesionRecuperado) => Promise<T>,
      ) {
        const estado = await consultarCompletada(sesion, usuario);
        return estado === null ? null : finalizar(estado);
      },
    } as unknown as RecuperarSesionConversacionalService,
    presentador,
    new PresentarHistorialConversacionalService(
      arboles as unknown as ArbolConversacionalRepository,
      presentador,
    ),
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

  const crearSesion = (estado: 'ACTIVA' | 'PAUSADA') =>
    new SesionConversacional(
      ids.sesion,
      ids.usuario,
      ids.flujo,
      1,
      ModalidadConversacional.GRUPAL,
      null,
      null,
      ids.nodo,
      estado,
      fecha,
      fecha,
    );

  const sesion = crearSesion('ACTIVA');

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
    arboles.buscarNodosPorIds.mockResolvedValue([nodo]);
    asignacionCronograma.existeAsignacion.mockResolvedValue(true);
    sesiones.buscarCompletadaDelArbol.mockResolvedValue(null);
    recuperar.mockResolvedValue({
      sesion,
      nodo,
      historial: { hayMas: false, interacciones: [] },
      recuperadaDesdeHistorial: false,
    });
  });

  it('reanuda una sesión existente sin volver a determinar modalidad ni árbol', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(sesion);
    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.id_sesion).toBe(ids.sesion);
    expect(resultado.nodo_actual.id_nodo).toBe(ids.nodo);
    expect(resultado.ubicacion_temporal.nombre_unidad).toBe('Semana 1');

    expect(determinarContexto.execute).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoPersonalizado).not.toHaveBeenCalled();

    expect(sesiones.guardar).not.toHaveBeenCalled();
  });

  it('presenta el estado activo que devolvió la recuperación de una sesión pausada', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(crearSesion('PAUSADA'));

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.estado_actual).toBe('ACTIVA');
    expect(recuperar).toHaveBeenCalledWith(ids.sesion, ids.usuario);
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });

  it('incluye la última secuencia y el cursor del historial recuperado', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(sesion);
    recuperar.mockResolvedValue({
      sesion,
      nodo,
      recuperadaDesdeHistorial: true,
      historial: {
        hayMas: true,
        interacciones: [22, 41].map((secuencia) => ({
          secuencia,
          idInteraccion: String(secuencia),
          timestampInteraccion: fecha,
          idNodo: ids.nodo,
          idNodoDestino: ids.nodo,
          tipoEntrada: 'CONTINUAR',
          valor: null,
        })),
      },
    });
    const resultado = await casoDeUso.execute(ids.usuario);
    expect(resultado.recuperada_desde_historial).toBe(true);
    expect(resultado.sesion.ultima_secuencia).toBe(41);
    expect(resultado.historial_reciente.siguiente_cursor).toBe(22);
    expect(
      resultado.historial_reciente.items.map((item) => item.secuencia),
    ).toEqual([22, 41]);
    expect(resultado.nodo_actual).toEqual({
      id_nodo: ids.nodo,
      tipo_nodo: 'MENSAJE',
      es_terminal: true,
      disponibilidad: { habilitado: true, habilita_aprox: null },
      bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Bienvenido' }],
      entrada: null,
    });
  });

  it('reanuda la sesión creada en paralelo cuando el guardado detecta una activa', async () => {
    sesiones.buscarUltimaNoCompletada
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(sesion);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.GRUPAL,
      perfil: null,
    });
    arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);
    arboles.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujo, [nodo], []),
    );
    sesiones.guardar.mockRejectedValueOnce(
      new SesionActivaExistenteException(),
    );

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.id_sesion).toBe(ids.sesion);
  });

  it('inicia una sesión nueva con el árbol GRUPAL publicado', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.GRUPAL,
      perfil: null,
    });

    arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);

    arboles.obtenerArbol.mockResolvedValue(
      new ArbolConversacional(flujo, [nodo], []),
    );

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(false);
    expect(resultado.sesion.modalidad_activa).toBe(
      ModalidadConversacional.GRUPAL,
    );
    expect(resultado.nodo_actual.es_terminal).toBe(true);
    expect(resultado.sesion.ultima_secuencia).toBe(0);
    expect(resultado.historial_reciente).toEqual({
      items: [],
      hay_mas: false,
      siguiente_cursor: null,
    });

    expect(determinarContexto.execute).toHaveBeenCalledWith(ids.usuario);
    expect(arboles.buscarPublicadoGrupal).toHaveBeenCalledTimes(1);
    expect(arboles.obtenerArbol).toHaveBeenCalledWith(ids.flujo);

    expect(sesiones.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsuario: ids.usuario,
        idFlujoConversacional: ids.flujo,
        versionArbolUtilizada: 1,
        modalidadActiva: ModalidadConversacional.GRUPAL,
        tipoDependencia: null,
        tipoCraving: null,
        idNodoActual: ids.nodo,
        estadoActual: 'ACTIVA',
      }),
    );
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

      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

      determinarContexto.execute.mockResolvedValue({
        modalidad: ModalidadConversacional.PERSONALIZADA,
        perfil: {
          tipo_dependencia: tipoDependencia,
          tipo_craving: tipoCraving,
        },
      });

      arboles.buscarPublicadoPersonalizado.mockResolvedValue(
        flujoPersonalizado,
      );

      arboles.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(flujoPersonalizado, [nodo], []),
      );

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.reanudada).toBe(false);
      expect(resultado.sesion.modalidad_activa).toBe(
        ModalidadConversacional.PERSONALIZADA,
      );

      expect(resultado.sesion.tipo_dependencia).toBe(tipoDependencia);
      expect(resultado.sesion.tipo_craving).toBe(tipoCraving);

      expect(arboles.buscarPublicadoPersonalizado).toHaveBeenCalledWith(
        tipoDependencia,
        tipoCraving,
      );

      expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();

      expect(sesiones.guardar).toHaveBeenCalledWith(
        expect.objectContaining({
          idUsuario: ids.usuario,
          idFlujoConversacional: ids.flujo,
          versionArbolUtilizada: 1,
          modalidadActiva: ModalidadConversacional.PERSONALIZADA,
          tipoDependencia,
          tipoCraving,
          idNodoActual: ids.nodo,
        }),
      );
    },
  );

  it('rechaza el inicio cuando no existe un árbol GRUPAL publicado', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

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

    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(arboles.obtenerArbol).not.toHaveBeenCalled();
  });

  it('rechaza el inicio PERSONALIZADO sin árbol publicado', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        tipo_craving: TipoCravingClinico.NEGATIVO,
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

    expect(arboles.buscarPublicadoPersonalizado).toHaveBeenCalledWith(
      TipoDependenciaClinica.TOLERANCIA,
      TipoCravingClinico.NEGATIVO,
    );

    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(sesiones.guardar).toHaveBeenCalledTimes(1);
    expect(sesiones.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsuario: ids.usuario,
        estadoActual: 'ERROR_CONFIGURACION',
        modalidadActiva: ModalidadConversacional.PERSONALIZADA,
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
        idFlujoConversacional: null,
        versionArbolUtilizada: null,
        idNodoActual: null,
      }),
    );
  });

  it('responde 409 cuando el árbol personalizado existe pero no está publicado', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        tipo_craving: TipoCravingClinico.NEGATIVO,
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

    expect(arboles.listarFlujos).toHaveBeenCalledWith(
      {
        modalidad: ModalidadConversacional.PERSONALIZADA,
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
      },
      1,
      1,
    );

    expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
    expect(sesiones.guardar).toHaveBeenCalledTimes(1);
    expect(sesiones.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsuario: ids.usuario,
        estadoActual: 'ERROR_CONFIGURACION',
        modalidadActiva: ModalidadConversacional.PERSONALIZADA,
        tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
        tipoCraving: TipoCravingClinico.NEGATIVO,
        idFlujoConversacional: null,
        versionArbolUtilizada: null,
        idNodoActual: null,
      }),
    );
  });

  it('registra ERROR_CONFIGURACION y responde 500 si falla la consulta del árbol personalizado', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        tipo_craving: TipoCravingClinico.NEGATIVO,
      },
    });
    arboles.buscarPublicadoPersonalizado.mockRejectedValue(
      new Error('conexión perdida'),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 500,
      response: { codigo: 'ERROR_CARGA_ARBOL' },
    });

    expect(sesiones.guardar).toHaveBeenCalledWith(
      expect.objectContaining({ estadoActual: 'ERROR_CONFIGURACION' }),
    );
  });

  it('informa el motivo original aunque no se pueda registrar el error', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.PERSONALIZADA,
      perfil: {
        tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
        tipo_craving: TipoCravingClinico.NEGATIVO,
      },
    });
    arboles.buscarPublicadoPersonalizado.mockResolvedValue(null);
    arboles.listarFlujos.mockResolvedValue({ items: [], total: 0 });
    sesiones.guardar.mockRejectedValue(new Error('base de datos caída'));

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('no registra ERROR_CONFIGURACION cuando falta el árbol GRUPAL', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
    determinarContexto.execute.mockResolvedValue({
      modalidad: ModalidadConversacional.GRUPAL,
      perfil: null,
    });
    arboles.buscarPublicadoGrupal.mockResolvedValue(null);

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 404,
    });
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });

  it('responde PERFIL_INCOMPLETO (409) sin crear sesión', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

    determinarContexto.execute.mockRejectedValue(
      new PerfilClinicoIncompletoException(),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 409,
      response: {
        codigo: 'PERFIL_INCOMPLETO',
      },
    });

    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(arboles.buscarPublicadoPersonalizado).not.toHaveBeenCalled();
  });

  it('responde SIN_CRONOGRAMA (422) sin crear sesión', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
    asignacionCronograma.existeAsignacion.mockResolvedValue(false);

    await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
      status: 422,
      response: {
        codigo: 'SIN_CRONOGRAMA',
      },
    });

    expect(calcularUbicacion.execute).not.toHaveBeenCalled();
    expect(determinarContexto.execute).not.toHaveBeenCalled();
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });

  it('propaga errores de infraestructura al verificar la asignación', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

    asignacionCronograma.existeAsignacion.mockRejectedValue(
      new Error('Error de conexión a PostgreSQL'),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toThrow(
      'Error de conexión a PostgreSQL',
    );

    expect(calcularUbicacion.execute).not.toHaveBeenCalled();
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });

  it('propaga errores del cálculo temporal sin crear una sesión', async () => {
    sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);

    calcularUbicacion.execute.mockRejectedValue(
      new Error('Error interno de Cronograma'),
    );

    await expect(casoDeUso.execute(ids.usuario)).rejects.toThrow(
      'Error interno de Cronograma',
    );

    expect(determinarContexto.execute).not.toHaveBeenCalled();
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });
  describe('árbol ya completado (una terapia por árbol publicado)', () => {
    const idSesionCompletada = '00000000-0000-4000-8000-000000000010';
    const idFlujoNuevo = '00000000-0000-4000-8000-000000000020';
    const idPersonalizado = '00000000-0000-4000-8000-000000000030';

    const completada = new SesionConversacional(
      idSesionCompletada,
      ids.usuario,
      ids.flujo,
      1,
      ModalidadConversacional.GRUPAL,
      null,
      null,
      ids.nodo,
      'COMPLETADA',
      fecha,
      fecha,
    );

    const historialCompletado = {
      hayMas: false,
      interacciones: [7, 8].map((secuencia) => ({
        secuencia,
        idInteraccion: String(secuencia),
        timestampInteraccion: fecha,
        idNodo: ids.nodo,
        idNodoDestino: ids.nodo,
        tipoEntrada: 'CONTINUAR',
        valor: null,
      })),
    };

    const flujoDe = (
      idFlujo: string,
      version: number,
      modalidad = ModalidadConversacional.GRUPAL,
      tipoDependencia?: TipoDependenciaClinica,
      tipoCraving?: TipoCravingClinico,
    ) =>
      new FlujoConversacional(
        idFlujo,
        'Árbol',
        modalidad,
        EstadoFlujoConversacional.PUBLICADO,
        version,
        ids.usuario,
        fecha,
        fecha,
        tipoDependencia,
        tipoCraving,
      );

    const nodoDe = (idFlujo: string) =>
      new NodoConversacional(
        ids.nodo,
        idFlujo,
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

    /** Solo existe una sesión COMPLETADA para el árbol (flujo y versión) indicado. */
    const completadaSoloPara = (idFlujo: string, version: number) =>
      sesiones.buscarCompletadaDelArbol.mockImplementation(
        (_usuario: string, flujoBuscado: string, versionBuscada: number) =>
          Promise.resolve(
            flujoBuscado === idFlujo && versionBuscada === version
              ? completada
              : null,
          ),
      );

    const contextoGrupal = () =>
      determinarContexto.execute.mockResolvedValue({
        modalidad: ModalidadConversacional.GRUPAL,
        perfil: null,
      });

    beforeEach(() => {
      consultarCompletada.mockResolvedValue({
        sesion: completada,
        nodo,
        historial: historialCompletado,
        recuperadaDesdeHistorial: false,
      });
    });

    it('volver a entrar devuelve la terapia COMPLETADA sin crear otra sesión', async () => {
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      contextoGrupal();
      arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);
      completadaSoloPara(ids.flujo, 1);

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.reanudada).toBe(false);
      expect(resultado.recuperada_desde_historial).toBe(false);
      expect(resultado.sesion.id_sesion).toBe(idSesionCompletada);
      expect(resultado.sesion.estado_actual).toBe('COMPLETADA');
      expect(resultado.sesion.id_flujo_conversacional).toBe(ids.flujo);
      expect(resultado.sesion.version_arbol_utilizada).toBe(1);
      expect(resultado.nodo_actual.id_nodo).toBe(ids.nodo);
      expect(resultado.nodo_actual.es_terminal).toBe(true);
      expect(resultado.sesion.ultima_secuencia).toBe(8);
      expect(
        resultado.historial_reciente.items.map((item) => item.secuencia),
      ).toEqual([7, 8]);

      expect(sesiones.buscarCompletadaDelArbol).toHaveBeenCalledWith(
        ids.usuario,
        ids.flujo,
        1,
      );
      expect(consultarCompletada).toHaveBeenCalledWith(
        idSesionCompletada,
        ids.usuario,
      );
      expect(recuperar).not.toHaveBeenCalled();
      expect(arboles.obtenerArbol).not.toHaveBeenCalled();
      expect(sesiones.guardar).not.toHaveBeenCalled();
    });

    it('una sesión ACTIVA duplicada del árbol completado no prevalece sobre la COMPLETADA', async () => {
      // El repositorio descarta la ACTIVA duplicada (ver repository.spec):
      // para el caso de uso no hay pendiente y sí una completada del árbol.
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      contextoGrupal();
      arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);
      completadaSoloPara(ids.flujo, 1);

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.sesion.id_sesion).toBe(idSesionCompletada);
      expect(resultado.sesion.estado_actual).toBe('COMPLETADA');
      expect(recuperar).not.toHaveBeenCalled();
      expect(sesiones.guardar).not.toHaveBeenCalled();
    });

    it('reanuda una sesión PAUSADA legítima sin consultar completadas', async () => {
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(
        crearSesion('PAUSADA'),
      );

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.reanudada).toBe(true);
      expect(resultado.sesion.estado_actual).toBe('ACTIVA');
      expect(sesiones.buscarCompletadaDelArbol).not.toHaveBeenCalled();
      expect(consultarCompletada).not.toHaveBeenCalled();
    });

    it('publicar un árbol distinto permite iniciar una conversación nueva', async () => {
      const flujoNuevo = flujoDe(idFlujoNuevo, 2);
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      contextoGrupal();
      arboles.buscarPublicadoGrupal.mockResolvedValue(flujoNuevo);
      arboles.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(flujoNuevo, [nodoDe(idFlujoNuevo)], []),
      );
      completadaSoloPara(ids.flujo, 1);

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.reanudada).toBe(false);
      expect(resultado.sesion.estado_actual).toBe('ACTIVA');
      expect(resultado.sesion.id_flujo_conversacional).toBe(idFlujoNuevo);
      expect(sesiones.buscarCompletadaDelArbol).toHaveBeenCalledWith(
        ids.usuario,
        idFlujoNuevo,
        2,
      );
      expect(consultarCompletada).not.toHaveBeenCalled();
      expect(sesiones.guardar).toHaveBeenCalledWith(
        expect.objectContaining({
          idFlujoConversacional: idFlujoNuevo,
          versionArbolUtilizada: 2,
          estadoActual: 'ACTIVA',
        }),
      );
    });

    it('una terapia GRUPAL completada no bloquea el árbol PERSONALIZADO del perfil', async () => {
      const personalizado = flujoDe(
        idPersonalizado,
        1,
        ModalidadConversacional.PERSONALIZADA,
        TipoDependenciaClinica.TOLERANCIA,
        TipoCravingClinico.NEGATIVO,
      );
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      determinarContexto.execute.mockResolvedValue({
        modalidad: ModalidadConversacional.PERSONALIZADA,
        perfil: {
          tipo_dependencia: TipoDependenciaClinica.TOLERANCIA,
          tipo_craving: TipoCravingClinico.NEGATIVO,
        },
      });
      arboles.buscarPublicadoPersonalizado.mockResolvedValue(personalizado);
      arboles.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(personalizado, [nodoDe(idPersonalizado)], []),
      );
      completadaSoloPara(ids.flujo, 1);

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(arboles.buscarPublicadoGrupal).not.toHaveBeenCalled();
      expect(arboles.buscarPublicadoPersonalizado).toHaveBeenCalledWith(
        TipoDependenciaClinica.TOLERANCIA,
        TipoCravingClinico.NEGATIVO,
      );
      expect(sesiones.buscarCompletadaDelArbol).toHaveBeenCalledWith(
        ids.usuario,
        idPersonalizado,
        1,
      );
      expect(resultado.sesion.estado_actual).toBe('ACTIVA');
      expect(resultado.sesion.modalidad_activa).toBe(
        ModalidadConversacional.PERSONALIZADA,
      );
      expect(resultado.sesion.tipo_dependencia).toBe(
        TipoDependenciaClinica.TOLERANCIA,
      );
      expect(sesiones.guardar).toHaveBeenCalledWith(
        expect.objectContaining({
          idFlujoConversacional: idPersonalizado,
          modalidadActiva: ModalidadConversacional.PERSONALIZADA,
          tipoDependencia: TipoDependenciaClinica.TOLERANCIA,
          tipoCraving: TipoCravingClinico.NEGATIVO,
        }),
      );
    });

    it('devuelve la terapia PERSONALIZADA completada del árbol del perfil', async () => {
      const personalizado = flujoDe(
        idPersonalizado,
        3,
        ModalidadConversacional.PERSONALIZADA,
        TipoDependenciaClinica.ABSTINENCIA_FISICA,
        TipoCravingClinico.POSITIVO,
      );
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      determinarContexto.execute.mockResolvedValue({
        modalidad: ModalidadConversacional.PERSONALIZADA,
        perfil: {
          tipo_dependencia: TipoDependenciaClinica.ABSTINENCIA_FISICA,
          tipo_craving: TipoCravingClinico.POSITIVO,
        },
      });
      arboles.buscarPublicadoPersonalizado.mockResolvedValue(personalizado);
      completadaSoloPara(idPersonalizado, 3);

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.sesion.estado_actual).toBe('COMPLETADA');
      expect(sesiones.buscarCompletadaDelArbol).toHaveBeenCalledWith(
        ids.usuario,
        idPersonalizado,
        3,
      );
      expect(sesiones.guardar).not.toHaveBeenCalled();
    });

    it('una solicitud concurrente que encuentra el árbol completado al guardar devuelve la COMPLETADA', async () => {
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      contextoGrupal();
      arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);
      arboles.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(flujo, [nodo], []),
      );
      sesiones.buscarCompletadaDelArbol
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(completada);
      sesiones.guardar.mockRejectedValueOnce(new ArbolYaCompletadoException());

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.reanudada).toBe(false);
      expect(resultado.sesion.id_sesion).toBe(idSesionCompletada);
      expect(resultado.sesion.estado_actual).toBe('COMPLETADA');
      expect(sesiones.guardar).toHaveBeenCalledTimes(1);
    });

    it('una sesión que se completa durante la reanudación no crea otra del mismo árbol', async () => {
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(sesion);
      recuperar.mockResolvedValue(null);
      contextoGrupal();
      arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);
      completadaSoloPara(ids.flujo, 1);

      const resultado = await casoDeUso.execute(ids.usuario);

      expect(resultado.sesion.estado_actual).toBe('COMPLETADA');
      expect(sesiones.guardar).not.toHaveBeenCalled();
    });

    it('informa ESTADO_INCONSISTENTE si el guardado rechaza el árbol pero no se encuentra la completada', async () => {
      sesiones.buscarUltimaNoCompletada.mockResolvedValue(null);
      contextoGrupal();
      arboles.buscarPublicadoGrupal.mockResolvedValue(flujo);
      arboles.obtenerArbol.mockResolvedValue(
        new ArbolConversacional(flujo, [nodo], []),
      );
      sesiones.buscarCompletadaDelArbol.mockResolvedValue(null);
      sesiones.guardar.mockRejectedValueOnce(new ArbolYaCompletadoException());

      await expect(casoDeUso.execute(ids.usuario)).rejects.toMatchObject({
        codigo: 'ESTADO_INCONSISTENTE',
      });
    });
  });
});
