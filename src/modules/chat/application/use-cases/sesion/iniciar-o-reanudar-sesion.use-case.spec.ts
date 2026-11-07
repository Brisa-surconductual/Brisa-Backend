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
import {
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
    buscarUltimaReanudable: jest.fn(),
    guardar: jest.fn(),
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
    arboles.buscarNodo.mockResolvedValue(nodo);
    asignacionCronograma.existeAsignacion.mockResolvedValue(true);
  });

  it('reanuda una sesión existente sin volver a determinar modalidad ni árbol', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(sesion);
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

  it('reanuda una sesión pausada y persiste su nuevo estado', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(crearSesion('PAUSADA'));

    const resultado = await casoDeUso.execute(ids.usuario);

    expect(resultado.reanudada).toBe(true);
    expect(resultado.sesion.estado_actual).toBe('ACTIVA');
    expect(sesiones.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        idSesion: ids.sesion,
        estadoActual: 'ACTIVA',
      }),
    );
  });

  it('reanuda la sesión creada en paralelo cuando el guardado detecta una activa', async () => {
    sesiones.buscarUltimaReanudable
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
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

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
    expect(resultado.nodo_actual.es_nodo_inicial).toBe(true);

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

      sesiones.buscarUltimaReanudable.mockResolvedValue(null);

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

    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(arboles.obtenerArbol).not.toHaveBeenCalled();
  });

  it('rechaza el inicio PERSONALIZADO sin árbol publicado', async () => {
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

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
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);

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
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);
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
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);
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
    sesiones.buscarUltimaReanudable.mockResolvedValue(null);
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

    expect(sesiones.guardar).not.toHaveBeenCalled();
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
    expect(sesiones.guardar).not.toHaveBeenCalled();
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
    expect(sesiones.guardar).not.toHaveBeenCalled();
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
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });
});
