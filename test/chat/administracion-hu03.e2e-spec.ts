import { createHash } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  estado_flujo_enum,
  modalidad_enum,
  operador_condicion_enum,
  tipo_craving_enum,
  tipo_dato_validacion_enum,
  tipo_dependencia_enum,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { TipoEntradaConversacional } from '../../src/modules/chat/domain/entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../../src/modules/chat/domain/entities/catalogos/tipo-nodo.entity';
import { ArbolConversacional } from '../../src/modules/chat/domain/entities/flujo/arbol-conversacional.entity';
import { FlujoConversacional } from '../../src/modules/chat/domain/entities/flujo/flujo-conversacional.entity';
import { EstadoFlujoConversacional } from '../../src/modules/chat/domain/enums/estado-flujo-conversacional.enum';
import { ModalidadConversacional } from '../../src/modules/chat/domain/enums/modalidad-conversacional-enum';
import { OperadorCondicion } from '../../src/modules/chat/domain/enums/operador-condicional.enum';
import {
  TipoCravingClinico,
  TipoDependenciaClinica,
} from '../../src/modules/chat/domain/enums/perfil-clinico.enum';
import { TipoDatoValidacion } from '../../src/modules/chat/domain/enums/tipo-dato-validacion-enum';
import { ArbolConversacionalRepository } from '../../src/modules/chat/domain/repositories/arbol-conversacional.repository';
import { S3_CLIENT } from '../../src/modules/cronograma/infrastructure/storage/s3-client.provider';
import { EmailService } from '../../src/modules/usuarios/application/ports/email';
import { SessionConfig } from '../../src/modules/usuarios/application/ports/session-config';
import { SessionCookieConfig } from '../../src/modules/usuarios/application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../src/modules/usuarios/application/ports/session-token-hasher';
import { Sesion } from '../../src/modules/usuarios/domain/entities/sesiones.entity';
import { Usuario } from '../../src/modules/usuarios/domain/entities/usuarios.entity';
import { AlcanceSesion } from '../../src/modules/usuarios/domain/enums/alcance-sesion.enum';
import { EstadoCuenta } from '../../src/modules/usuarios/domain/enums/estado-cuenta';
import { EstadoRegistro } from '../../src/modules/usuarios/domain/enums/estado-registro.enum';
import { Rol } from '../../src/modules/usuarios/domain/enums/rol.enum';
import { SesionRepository } from '../../src/modules/usuarios/domain/repositories/sesion.repository';
import { UsuarioRepository } from '../../src/modules/usuarios/domain/repositories/user.repository';
import { CorreoElectronico } from '../../src/modules/usuarios/domain/value-objects/correo_electronico.vo';
import {
  arbolDominio,
  arbolGrupalPublicable,
  fecha,
  ids,
  valorEsperado,
} from './fixtures/arbol-hu03.fixture';

jest.setTimeout(30_000);

describe('HU-03 administrativa HTTP con guards y casos de uso reales', () => {
  const hash = (valor: string) =>
    createHash('sha256').update(valor).digest('hex');
  const arbol = arbolDominio();
  const repo = {
    obtenerFlujo: jest.fn(),
    obtenerArbol: jest.fn(),
    buscarNodo: jest.fn(),
    buscarTransicion: jest.fn(),
    buscarTipoNodo: jest.fn(),
    listarFlujos: jest.fn(),
    listarFlujosPersonalizados: jest.fn(),
    buscarPublicadoGrupal: jest.fn(),
    buscarPublicadoPersonalizado: jest.fn(),
    obtenerUltimaVersionPersonalizada: jest.fn(),
    listarAuditoriaArbol: jest.fn(),
    listarTiposNodo: jest.fn(),
    listarTiposEntrada: jest.fn(),
    listarContenidosCronograma: jest.fn(),
    existeContenidoCronograma: jest.fn(),
    guardarFlujo: jest.fn(),
    guardarFlujos: jest.fn(),
    guardarArbolClonado: jest.fn(),
    guardarNodo: jest.fn(),
    guardarTransicion: jest.fn(),
  } satisfies jest.Mocked<ArbolConversacionalRepository>;
  const arbolPublicado = () =>
    new ArbolConversacional(
      arbol.flujo.publicar(fecha),
      arbol.nodos,
      arbol.transiciones,
    );
  const bodyFlujo = { nombre: 'Inicio', modalidad: 'GRUPAL' };
  const bodyNodo = { id_tipo_nodo: ids.tipo, contenido: { texto: 'Inicio' } };
  const reglaTransicion = {
    operador_condicion: 'IGUALDAD',
    valor_esperado: valorEsperado,
    mensaje_error: 'Respuesta requerida',
  };
  const bodyTransicion = {
    id_nodo_origen: ids.origen,
    id_nodo_destino: ids.destino,
    regla_validacion: reglaTransicion,
    orden_evaluacion: 1,
  };
  const base = '/chat/admin';
  const rutas: Array<{
    metodo: 'get' | 'post' | 'patch';
    ruta: string;
    cuerpo?: Record<string, unknown>;
  }> = [
    { metodo: 'get', ruta: '/flujos' },
    { metodo: 'post', ruta: `/flujos/${ids.flujo}/clonar-version` },
    { metodo: 'post', ruta: `/flujos/${ids.flujo}/publicar` },
    { metodo: 'post', ruta: `/flujos/${ids.flujo}/archivar` },
    { metodo: 'post', ruta: `/flujos/${ids.flujo}/validar` },
    { metodo: 'post', ruta: '/flujos', cuerpo: bodyFlujo },
    { metodo: 'get', ruta: `/flujos/${ids.flujo}` },
    { metodo: 'post', ruta: `/flujos/${ids.flujo}/nodos`, cuerpo: bodyNodo },
    { metodo: 'patch', ruta: `/nodos/${ids.origen}`, cuerpo: { orden: 2 } },
    {
      metodo: 'post',
      ruta: `/flujos/${ids.flujo}/transiciones`,
      cuerpo: bodyTransicion,
    },
    {
      metodo: 'patch',
      ruta: `/transiciones/${ids.transicion}`,
      cuerpo: { orden_evaluacion: 2 },
    },
    { metodo: 'get', ruta: '/catalogos' },
  ];
  let app: INestApplication<App>;

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ global: true }), ChatModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(S3_CLIENT)
      .useValue({ destroy: jest.fn() })
      .overrideProvider(EmailService)
      .useValue({ enviarRecuperacionContrasena: jest.fn() })
      .overrideProvider(ArbolConversacionalRepository)
      .useValue(repo)
      .overrideProvider(SesionRepository)
      .useValue({
        buscarActivaPorTokenHash: (token: string) => {
          const nombre = ['admin', 'estudiante', 'limitada'].find(
            (valor) => hash(valor) === token,
          );
          return Promise.resolve(
            nombre
              ? Sesion.iniciar(
                  nombre === 'estudiante' ? ids.otroFlujo : ids.actor,
                  token,
                  hash('csrf'),
                  nombre === 'limitada'
                    ? AlcanceSesion.LIMITADA
                    : AlcanceSesion.COMPLETA,
                  15,
                  new Date(),
                )
              : null,
          );
        },
        registrarActividad: () => Promise.resolve(true),
        cerrarActiva: () => Promise.resolve(true),
      })
      .overrideProvider(UsuarioRepository)
      .useValue({
        buscarPorId: (idUsuario: string) =>
          Promise.resolve(
            new Usuario(
              idUsuario,
              new CorreoElectronico('pruebas@example.invalid'),
              'hash',
              idUsuario === ids.actor ? Rol.ADMINISTRATIVO : Rol.ESTUDIANTE,
              EstadoRegistro.REGISTRO_COMPLETO,
              EstadoCuenta.ACTIVA,
              new Date(),
              new Date(),
              true,
              true,
              ids.flujo,
            ),
          ),
      })
      .overrideProvider(SessionConfig)
      .useValue({
        obtenerLimiteInactividadMinutos: () => 15,
        obtenerLimiteSegundoPlanoMinutos: () => 15,
      })
      .overrideProvider(SessionCookieConfig)
      .useValue({ obtenerNombreCookie: () => 'brisa_session' })
      .overrideProvider(SessionTokenHasher)
      .useValue({
        hash: (valor: string) => Promise.resolve(hash(valor)),
        compare: (valor: string, esperado: string) =>
          Promise.resolve(hash(valor) === esperado),
      })
      .compile();
    app = fixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repo.listarFlujos.mockResolvedValue({ items: [arbol.flujo], total: 1 });
    repo.obtenerFlujo.mockResolvedValue(arbol.flujo);
    repo.obtenerArbol.mockResolvedValue(arbol);
    repo.buscarNodo.mockImplementation((id) =>
      Promise.resolve(arbol.nodos.find((nodo) => nodo.idNodo === id) ?? null),
    );
    repo.buscarTransicion.mockResolvedValue(arbol.transiciones[0]);
    repo.buscarTipoNodo.mockResolvedValue(
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    );
    repo.buscarPublicadoGrupal.mockResolvedValue(null);
    repo.buscarPublicadoPersonalizado.mockResolvedValue(null);
    repo.obtenerUltimaVersionPersonalizada.mockResolvedValue(0);
    repo.listarTiposNodo.mockResolvedValue([
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    ]);
    repo.listarContenidosCronograma.mockResolvedValue([]);
    repo.listarTiposEntrada.mockResolvedValue([
      new TipoEntradaConversacional(ids.entrada, 'TEXTO_LIBRE'),
    ]);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  function admin(metodo: 'get' | 'post' | 'patch', ruta: string) {
    return request(app.getHttpServer())
      [metodo](base + ruta)
      .set('Cookie', 'brisa_session=admin')
      .set('X-CSRF-Token', 'csrf');
  }

  it.each(rutas)(
    'exige autenticación en $metodo $ruta',
    async ({ metodo, ruta, cuerpo }) => {
      await request(app.getHttpServer())
        [metodo](base + ruta)
        .send(cuerpo)
        .expect(401);
    },
  );

  it.each(rutas)(
    'rechaza una sesión limitada en $metodo $ruta',
    async ({ metodo, ruta, cuerpo }) => {
      await request(app.getHttpServer())
        [metodo](base + ruta)
        .set('Cookie', 'brisa_session=limitada')
        .send(cuerpo)
        .expect(403);
    },
  );

  it.each(rutas)(
    'devuelve 403 al estudiante autenticado en $metodo $ruta',
    async ({ metodo, ruta, cuerpo }) => {
      await request(app.getHttpServer())
        [metodo](base + ruta)
        .set('Cookie', 'brisa_session=estudiante')
        .set('X-CSRF-Token', 'csrf')
        .send(cuerpo)
        .expect(403);
    },
  );

  it.each(rutas.filter((ruta) => ruta.metodo !== 'get'))(
    'exige CSRF en $metodo $ruta',
    async ({ metodo, ruta, cuerpo }) => {
      await request(app.getHttpServer())
        [metodo](base + ruta)
        .set('Cookie', 'brisa_session=admin')
        .send(cuerpo)
        .expect(403);
    },
  );

  it('03-A crea borrador con versión 1 y actor de sesión', async () => {
    const respuesta = await admin('post', '/flujos')
      .send(bodyFlujo)
      .expect(201);
    expect(respuesta.body).toMatchObject({
      data: {
        id_flujo: expect.any(String),
        estado: 'BORRADOR',
        version: 1,
        creado_por: ids.actor,
      },
    });
    expect(repo.guardarFlujo).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Inicio',
        version: 1,
        creadoPor: ids.actor,
      }),
      ids.actor,
    );
  });

  it.each([
    {},
    { nombre: '   ', modalidad: 'GRUPAL' },
    { nombre: 'Inicio' },
    { nombre: 'Inicio', modalidad: 'OTRA' },
    { nombre: 'Inicio', modalidad: 'PERSONALIZADA' },
    {
      nombre: 'Inicio',
      modalidad: 'PERSONALIZADA',
      tipo_dependencia: 'TOLERANCIA',
    },
    { nombre: 'Inicio', modalidad: 'PERSONALIZADA', tipo_craving: 'NEGATIVO' },
    {
      nombre: 'Inicio',
      modalidad: 'PERSONALIZADA',
      tipo_dependencia: null,
      tipo_craving: 'NEGATIVO',
    },
    {
      nombre: 'Inicio',
      modalidad: 'PERSONALIZADA',
      tipo_dependencia: 'TOLERANCIA',
      tipo_craving: null,
    },
    { ...bodyFlujo, tipo_dependencia: 'TOLERANCIA', tipo_craving: 'NEGATIVO' },
    { ...bodyFlujo, creado_por: ids.otroFlujo },
    { ...bodyFlujo, version: 99 },
  ])(
    '03-A rechaza campos inválidos o un perfil incoherente: %j',
    async (cuerpo) => {
      await admin('post', '/flujos').send(cuerpo).expect(400);
      expect(repo.guardarFlujo).not.toHaveBeenCalled();
    },
  );

  it('03-A delega la modalidad personalizada al versionado existente por perfil', async () => {
    await admin('post', '/flujos')
      .send({
        nombre: 'Personalizado',
        modalidad: 'PERSONALIZADA',
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'NEGATIVO',
      })
      .expect(201);
    expect(repo.guardarFlujo).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Personalizado',
        tipoDependencia: 'TOLERANCIA',
        tipoCraving: 'NEGATIVO',
        version: 1,
        creadoPor: ids.actor,
      }),
      ids.actor,
    );
  });

  it('03-B conserva la estructura completa y las fechas de ciclo de vida', async () => {
    const respuesta = await admin('get', `/flujos/${ids.flujo}`)
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(respuesta.body).toMatchObject({
      data: {
        flujo: {
          id_flujo: ids.flujo,
          fecha_publicacion: null,
          fecha_archivado: null,
        },
        nodos: [{ id_nodo: ids.origen }, { id_nodo: ids.destino }],
        transiciones: [
          {
            id_regla: ids.transicion,
            regla_validacion: {
              id_regla_validacion: ids.validacion,
              operador_condicion: 'IGUALDAD',
              valor_esperado: valorEsperado,
            },
          },
        ],
      },
    });
  });

  it('03-C usa false para nodo inicial y null para opcionales omitidos', async () => {
    const respuesta = await admin('post', `/flujos/${ids.flujo}/nodos`)
      .send(bodyNodo)
      .expect(201);
    expect(respuesta.body).toMatchObject({
      data: {
        id_nodo: expect.any(String),
        id_flujo: ids.flujo,
        id_tipo_nodo: ids.tipo,
        es_nodo_inicial: false,
      },
    });
    expect(repo.guardarNodo).toHaveBeenCalledWith(
      expect.objectContaining({
        esNodoInicial: false,
        orden: null,
        idContenidoCronograma: null,
        creadoPor: ids.actor,
      }),
      ids.actor,
    );
  });

  it.each(['id_tipo_nodo', 'contenido', 'es_nodo_inicial'])(
    '03-D rechaza null en %s',
    async (campo) => {
      await admin('patch', `/nodos/${ids.origen}`)
        .send({ [campo]: null })
        .expect(400);
      expect(repo.guardarNodo).not.toHaveBeenCalled();
    },
  );

  it('03-D permite limpiar campos anulables y resuelve el flujo desde el nodo', async () => {
    const respuesta = await admin('patch', `/nodos/${ids.origen}`)
      .send({ orden: null, id_contenido_cronograma: null })
      .expect(200);
    expect(respuesta.body).toHaveProperty('data.fecha_actualizacion');
    expect(repo.guardarNodo).toHaveBeenCalledWith(
      expect.objectContaining({
        idFlujo: ids.flujo,
        idNodo: ids.origen,
        orden: null,
        idContenidoCronograma: null,
        contenido: {
          texto: 'Mensaje',
          entrada: { tipo: 'NUMERICO', min: 0, max: 10 },
        },
      }),
      ids.actor,
    );
  });

  it('03-D rechaza una actualización vacía', async () => {
    await admin('patch', `/nodos/${ids.origen}`).send({}).expect(400);
  });

  it('03-E crea la transición con su regla propia derivada del nodo origen', async () => {
    const respuesta = await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send(bodyTransicion)
      .expect(201);
    expect(respuesta.body).toMatchObject({
      data: {
        id_regla: expect.any(String),
        id_flujo: ids.flujo,
        regla_validacion: {
          id_regla_validacion: expect.any(String),
          operador_condicion: 'IGUALDAD',
          valor_esperado: valorEsperado,
          tipo_dato: 'NUMERICO',
          mensaje_error: 'Respuesta requerida',
        },
      },
    });
    expect(respuesta.body).not.toHaveProperty('data.id_transicion');
    expect(respuesta.body).not.toHaveProperty('data.valor_condicion');
    expect(repo.guardarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({
        idFlujo: ids.flujo,
        reglaValidacion: expect.objectContaining({
          operadorCondicion: OperadorCondicion.IGUALDAD,
          valorEsperado,
          tipoDato: TipoDatoValidacion.NUMERICO,
        }),
      }),
      ids.actor,
    );
  });

  it('03-E rechaza reutilizar una regla existente por id', async () => {
    await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send({ ...bodyTransicion, id_regla_validacion: ids.validacion })
      .expect(400);
    expect(repo.guardarTransicion).not.toHaveBeenCalled();
  });

  it('03-E rechaza un valor esperado que el nodo origen no define', async () => {
    await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send({
        ...bodyTransicion,
        regla_validacion: { ...reglaTransicion, valor_esperado: { valor: 11 } },
      })
      .expect(400);
    expect(repo.guardarTransicion).not.toHaveBeenCalled();
  });

  it.each(Object.keys(bodyTransicion))('03-E requiere %s', async (campo) => {
    const cuerpo: Record<string, unknown> = { ...bodyTransicion };
    delete cuerpo[campo];
    await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send(cuerpo)
      .expect(400);
    expect(repo.guardarTransicion).not.toHaveBeenCalled();
  });

  it('03-E conserva 422 y NODO_FUERA_DE_FLUJO', async () => {
    repo.buscarNodo.mockResolvedValueOnce(
      arbol.nodos[0].copiarEn(ids.otroFlujo, ids.actor),
    );
    const respuesta = await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send(bodyTransicion)
      .expect(422);
    expect(respuesta.body).toMatchObject({ codigo: 'NODO_FUERA_DE_FLUJO' });
  });

  it('03-F resuelve el flujo y conserva las propiedades no enviadas', async () => {
    const respuesta = await admin('patch', `/transiciones/${ids.transicion}`)
      .send({ orden_evaluacion: 2 })
      .expect(200);
    expect(respuesta.body).toHaveProperty('data.id_regla', ids.transicion);
    expect(repo.guardarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({
        idTransicion: ids.transicion,
        idFlujo: ids.flujo,
        ordenEvaluacion: 2,
        idNodoDestino: ids.destino,
        reglaValidacion: expect.objectContaining({
          idReglaValidacion: ids.validacion,
        }),
      }),
      ids.actor,
    );
  });

  it.each(['id_nodo_destino', 'regla_validacion', 'orden_evaluacion'])(
    '03-F rechaza null en %s',
    async (campo) => {
      await admin('patch', `/transiciones/${ids.transicion}`)
        .send({ [campo]: null })
        .expect(400);
      expect(repo.guardarTransicion).not.toHaveBeenCalled();
    },
  );

  it('03-F impide cambiar el origen y rechaza un PATCH vacío', async () => {
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({ id_nodo_origen: ids.destino })
      .expect(400);
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({})
      .expect(400);
  });

  it.each([null, 'si', 1, true, []])(
    '03-E exige un objeto para valor_esperado: %j',
    async (valor) => {
      await admin('post', `/flujos/${ids.flujo}/transiciones`)
        .send({
          ...bodyTransicion,
          regla_validacion: { ...reglaTransicion, valor_esperado: valor },
        })
        .expect(400);
      expect(repo.guardarTransicion).not.toHaveBeenCalled();
    },
  );

  it('03-F reemplaza la regla propia completa y la reconstruye desde el nodo', async () => {
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({
        regla_validacion: {
          operador_condicion: 'RANGO',
          valor_esperado: { min: 2, max: 8 },
          mensaje_error: 'Fuera del rango esperado',
        },
      })
      .expect(200);
    expect(repo.guardarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({
        reglaValidacion: expect.objectContaining({
          operadorCondicion: OperadorCondicion.RANGO,
          valorEsperado: { min: 2, max: 8 },
        }),
      }),
      ids.actor,
    );
  });

  it('03-F rechaza un rango esperado fuera del rango del nodo', async () => {
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({
        regla_validacion: {
          operador_condicion: 'RANGO',
          valor_esperado: { min: 2, max: 20 },
          mensaje_error: 'x',
        },
      })
      .expect(400);
    expect(repo.guardarTransicion).not.toHaveBeenCalled();
  });

  it('03-H entrega catálogos persistidos y enums coincidentes con el cliente Prisma', async () => {
    const respuesta = await admin('get', '/catalogos')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(respuesta.body).toMatchObject({
      data: {
        tipos_nodo: [{ id_tipo_nodo: ids.tipo }],
        tipos_entrada: [{ id_tipo_entrada: ids.entrada }],
        enums: {
          modalidad: Object.values(modalidad_enum),
          tipo_dependencia: Object.values(tipo_dependencia_enum),
          tipo_craving: Object.values(tipo_craving_enum),
          operador_condicion: ['IGUALDAD', 'RANGO'],
          tipo_dato: ['TEXTO', 'NUMERICO', 'FECHA', 'SELECCION'],
          estado_flujo: Object.values(estado_flujo_enum),
        },
      },
    });
    expect(respuesta.body).not.toHaveProperty('data.reglas_validacion');
    // Lo que el dominio ofrece siempre existe en los enums de la base.
    const { enums } = (
      respuesta.body as {
        data: { enums: { operador_condicion: string[]; tipo_dato: string[] } };
      }
    ).data;
    expect(Object.values(operador_condicion_enum)).toEqual(
      expect.arrayContaining(enums.operador_condicion),
    );
    expect(Object.values(tipo_dato_validacion_enum)).toEqual(
      expect.arrayContaining(enums.tipo_dato),
    );
  });

  it.each(['post', 'patch'] as const)(
    '03-G ya no expone una regla reutilizable suelta (%s /reglas-validacion)',
    async (metodo) => {
      await admin(metodo, '/reglas-validacion')
        .send({ tipo_dato: 'TEXTO', mensaje_error: 'Error' })
        .expect(404);
    },
  );

  it('responde 404 para nodo y transición inexistentes', async () => {
    repo.buscarNodo.mockResolvedValueOnce(null);
    repo.buscarTransicion.mockResolvedValueOnce(null);
    await admin('patch', `/nodos/${ids.origen}`).send({ orden: 2 }).expect(404);
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({ orden_evaluacion: 2 })
      .expect(404);
  });

  it('rechaza UUID inválidos antes de consultar repositorios', async () => {
    await admin('get', '/flujos/no-es-uuid').expect(400);
    expect(repo.obtenerArbol).not.toHaveBeenCalled();
  });

  it('mantiene errores de infraestructura sanitizados', async () => {
    repo.guardarFlujo.mockRejectedValueOnce(
      new Error('credencial-privada-simulada'),
    );
    const respuesta = await admin('post', '/flujos')
      .send(bodyFlujo)
      .expect(500);
    expect(respuesta.text).not.toContain('credencial-privada-simulada');
  });

  it('conserva las rutas históricas de /chat/administracion y no agrega DELETE', async () => {
    const anterior = await request(app.getHttpServer())
      .get(`/chat/administracion/flujos/${ids.flujo}/arbol`)
      .set('Cookie', 'brisa_session=admin')
      .expect(200);
    expect(anterior.body).toMatchObject({
      flujo: { id_flujo: ids.flujo },
      transiciones: [{ id_transicion: ids.transicion }],
    });
    expect(anterior.body).not.toHaveProperty('data');
    await request(app.getHttpServer())
      .delete(`${base}/flujos/${ids.flujo}`)
      .set('Cookie', 'brisa_session=admin')
      .expect(404);
  });

  describe('rutas de compatibilidad con el front', () => {
    const historico = (metodo: 'get' | 'post' | 'patch', ruta: string) =>
      request(app.getHttpServer())
        [metodo](ruta)
        .set('Cookie', 'brisa_session=admin')
        .set('X-CSRF-Token', 'csrf');

    it('POST /chat/administracion/flujos crea un flujo grupal y responde sin envoltorio', async () => {
      const respuesta = await historico('post', '/chat/administracion/flujos')
        .send({ nombre: 'Grupal', version: 1 })
        .expect(201);
      expect(respuesta.body).toMatchObject({
        nombre: 'Grupal',
        modalidad: 'GRUPAL',
        estado: 'BORRADOR',
      });
      expect(respuesta.body).not.toHaveProperty('data');
    });

    it('GET /chat/administracion/tipos-nodo devuelve el catálogo de tipos', async () => {
      const respuesta = await historico(
        'get',
        '/chat/administracion/tipos-nodo',
      ).expect(200);
      expect(respuesta.body).toEqual([
        { id_tipo_nodo: ids.tipo, nombre: 'MENSAJE' },
      ]);
    });

    it('crea una transición con su regla propia y la devuelve completa', async () => {
      const respuesta = await historico(
        'post',
        `/chat/administracion/flujos/${ids.flujo}/transiciones`,
      )
        .send({
          id_nodo_origen: ids.origen,
          id_nodo_destino: ids.destino,
          orden_evaluacion: 2,
          regla_validacion: {
            operador_condicion: 'IGUALDAD',
            valor_esperado: valorEsperado,
            mensaje_error: 'Requerida',
          },
        })
        .expect(201);
      expect(respuesta.body).toMatchObject({
        id_flujo: ids.flujo,
        regla_validacion: {
          operador_condicion: 'IGUALDAD',
          valor_esperado: valorEsperado,
          tipo_dato: 'NUMERICO',
          mensaje_error: 'Requerida',
        },
      });
    });

    it('POST /chat/administracion/flujos/:id/publicar responde el flujo completo', async () => {
      repo.obtenerArbol.mockResolvedValueOnce(arbolGrupalPublicable());
      const respuesta = await historico(
        'post',
        `/chat/administracion/flujos/${ids.flujo}/publicar`,
      ).expect(201);
      expect(respuesta.body).toMatchObject({
        id_flujo: ids.flujo,
        estado: 'PUBLICADO',
        nombre: arbol.flujo.nombre,
      });
    });

    it('administra árboles personalizados: crear, publicar, archivar y nueva versión', async () => {
      const base = '/chat/administracion/arboles-personalizados';
      const personalizado = new FlujoConversacional(
        ids.flujo,
        'Personalizado',
        ModalidadConversacional.PERSONALIZADA,
        EstadoFlujoConversacional.BORRADOR,
        1,
        ids.actor,
        fecha,
        null,
        TipoDependenciaClinica.TOLERANCIA,
        TipoCravingClinico.NEGATIVO,
      );

      const creado = await historico('post', base)
        .send({
          nombre: 'Personalizado',
          tipo_dependencia: 'TOLERANCIA',
          tipo_craving: 'NEGATIVO',
        })
        .expect(201);
      expect(creado.body).toMatchObject({
        modalidad: 'PERSONALIZADA',
        tipo_dependencia: 'TOLERANCIA',
        version: 1,
      });

      repo.obtenerArbol.mockResolvedValueOnce(
        new ArbolConversacional(personalizado, arbol.nodos, arbol.transiciones),
      );
      const publicado = await historico(
        'post',
        `${base}/${ids.flujo}/publicar`,
      ).expect(200);
      expect(publicado.body).toMatchObject({ estado: 'PUBLICADO' });

      repo.obtenerFlujo.mockResolvedValueOnce(personalizado.publicar());
      const archivado = await historico(
        'post',
        `${base}/${ids.flujo}/archivar`,
      ).expect(200);
      expect(archivado.body).toMatchObject({ estado: 'ARCHIVADO' });

      repo.obtenerArbol.mockResolvedValueOnce(
        new ArbolConversacional(
          personalizado.publicar(),
          arbol.nodos,
          arbol.transiciones,
        ),
      );
      const nueva = await historico(
        'post',
        `${base}/${ids.flujo}/nueva-version`,
      ).expect(201);
      expect(nueva.body).toMatchObject({ estado: 'BORRADOR', version: 1 });
      expect(nueva.body.id_flujo).not.toBe(ids.flujo);
    });
  });

  it('RF-25 valida la estructura del árbol sin modificarlo', async () => {
    const respuesta = await admin('post', `/flujos/${ids.flujo}/validar`)
      .send({})
      .expect(200);
    expect(respuesta.body).toEqual({
      data: { valido: true, total_nodos: 2, total_transiciones: 1 },
    });
    expect(repo.guardarFlujo).not.toHaveBeenCalled();
  });

  describe('HU-05 / RF-25C: contratos generales de gestión de flujos', () => {
    it('05-A entrega items, metadatos predeterminados y fechas de ciclo de vida', async () => {
      const respuesta = await admin('get', '/flujos').expect(200);
      expect(respuesta.body).toMatchObject({
        data: {
          items: [
            {
              id_flujo: ids.flujo,
              modalidad: 'GRUPAL',
              fecha_publicacion: null,
              fecha_archivado: null,
            },
          ],
        },
        meta: { page: 1, page_size: 20, total: 1 },
      });
      expect(repo.listarFlujos).toHaveBeenCalledWith(expect.any(Object), 1, 20);
      expect(respuesta.headers['cache-control']).toBe('no-store');
    });

    it('05-A mapea los filtros combinados y la paginación', async () => {
      await admin('get', '/flujos')
        .query({
          modalidad: 'PERSONALIZADA',
          tipo_dependencia: 'TOLERANCIA',
          tipo_craving: 'NEGATIVO',
          estado: 'ARCHIVADO',
          page: 2,
          page_size: 100,
        })
        .expect(200);
      expect(repo.listarFlujos).toHaveBeenCalledWith(
        {
          modalidad: 'PERSONALIZADA',
          tipoDependencia: 'TOLERANCIA',
          tipoCraving: 'NEGATIVO',
          estado: 'ARCHIVADO',
        },
        2,
        100,
      );
    });

    it.each([
      { modalidad: 'OTRA' },
      { tipo_dependencia: 'BAJA' },
      { tipo_craving: 'OTRO' },
      { estado: 'OTRO' },
      { page: '0' },
      { page: '-1' },
      { page: '1.5' },
      { page: '1e2' },
      { page: 'texto' },
      { page: '' },
      { page: '9007199254740992' },
      { page: '9007199254740991', page_size: '100' },
      { page_size: '0' },
      { page_size: '101' },
      { page_size: '2.5' },
      { page_size: ['10', '20'] },
      { filtro_ajeno: 'x' },
    ])('05-A rechaza filtros/paginación inválidos: %j', async (query) => {
      await admin('get', '/flujos').query(query).expect(400);
      expect(repo.listarFlujos).not.toHaveBeenCalled();
    });

    it('05-A conserva total filtrado aunque la página esté vacía', async () => {
      repo.listarFlujos.mockResolvedValueOnce({ items: [], total: 8 });
      const respuesta = await admin('get', '/flujos')
        .query({ page: 5 })
        .expect(200);
      expect(respuesta.body).toEqual({
        data: { items: [] },
        meta: { page: 5, page_size: 20, total: 8 },
      });
    });

    it('05-B devuelve nuevo UUID, origen, versión y cantidades con actor de sesión', async () => {
      repo.obtenerArbol.mockResolvedValueOnce(arbolPublicado());
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/clonar-version`,
      )
        .send({})
        .expect(201);
      expect(respuesta.body).toEqual({
        data: {
          id_flujo: expect.any(String),
          id_flujo_origen: ids.flujo,
          version: 2,
          estado: 'BORRADOR',
          nodos_copiados: 2,
          transiciones_copiadas: 1,
        },
      });
      expect(respuesta.body.data.id_flujo).not.toBe(ids.flujo);
      expect(repo.guardarArbolClonado).toHaveBeenCalledWith(
        expect.any(ArbolConversacional),
        ids.flujo,
        ids.actor,
      );
    });

    it('05-C entrega únicamente los campos de publicación documentados', async () => {
      repo.obtenerArbol.mockResolvedValueOnce(arbolGrupalPublicable());
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/publicar`,
      ).expect(200);
      expect(respuesta.body).toEqual({
        data: {
          id_flujo: ids.flujo,
          estado: 'PUBLICADO',
          version: 1,
          fecha_publicacion: expect.any(String),
        },
      });
      expect(repo.guardarFlujo).toHaveBeenCalledWith(
        expect.objectContaining({
          idFlujo: ids.flujo,
          estado: EstadoFlujoConversacional.PUBLICADO,
        }),
        ids.actor,
      );
    });

    it('05-C archiva el publicado anterior de la misma combinación al publicar un personalizado', async () => {
      const borradorPersonalizado = new FlujoConversacional(
        ids.flujo,
        'Personalizado',
        ModalidadConversacional.PERSONALIZADA,
        EstadoFlujoConversacional.BORRADOR,
        2,
        ids.actor,
        fecha,
        null,
        TipoDependenciaClinica.TOLERANCIA,
        TipoCravingClinico.NEGATIVO,
      );
      repo.obtenerArbol.mockResolvedValueOnce(
        new ArbolConversacional(
          borradorPersonalizado,
          arbol.nodos,
          arbol.transiciones,
        ),
      );
      repo.buscarPublicadoPersonalizado.mockResolvedValueOnce(
        new FlujoConversacional(
          ids.otroFlujo,
          'Personalizado',
          ModalidadConversacional.PERSONALIZADA,
          EstadoFlujoConversacional.PUBLICADO,
          1,
          ids.actor,
          fecha,
          fecha,
          TipoDependenciaClinica.TOLERANCIA,
          TipoCravingClinico.NEGATIVO,
        ),
      );
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/publicar`,
      ).expect(200);
      expect(respuesta.body).toMatchObject({
        data: { id_flujo: ids.flujo, estado: 'PUBLICADO' },
      });
      const [guardados, actor] = repo.guardarFlujos.mock.calls[0];
      expect(guardados.map((f) => [f.idFlujo, f.estado])).toEqual([
        [ids.otroFlujo, EstadoFlujoConversacional.ARCHIVADO],
        [ids.flujo, EstadoFlujoConversacional.PUBLICADO],
      ]);
      expect(actor).toBe(ids.actor);
    });

    it('05-C conserva los detalles estructurados del grafo inválido', async () => {
      const detalles = {
        nodos_huerfanos: [ids.destino],
        ciclos: [],
        sin_nodo_inicial: false,
      };
      repo.obtenerArbol.mockResolvedValueOnce(
        new ArbolConversacional(arbol.flujo, arbol.nodos, []),
      );
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/publicar`,
      ).expect(422);
      expect(respuesta.body).toMatchObject({
        codigo: 'GRAFO_INVALIDO',
        detalles,
      });
    });

    it('05-D devuelve el estado y fecha de archivado con actor de sesión', async () => {
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/archivar`,
      ).expect(200);
      expect(respuesta.body).toEqual({
        data: {
          id_flujo: ids.flujo,
          estado: 'ARCHIVADO',
          fecha_archivado: expect.any(String),
        },
      });
      expect(repo.guardarFlujo).toHaveBeenCalledWith(
        expect.objectContaining({
          idFlujo: ids.flujo,
          estado: EstadoFlujoConversacional.ARCHIVADO,
        }),
        ids.actor,
      );
    });

    // Cada acción lee el flujo (o el árbol) y persiste el resultado.
    const accionesFlujo = {
      'clonar-version': {
        leer: () => repo.obtenerArbol,
        persistir: () => repo.guardarArbolClonado,
        // clonar exige un flujo que ya no sea borrador
        valido: () => arbolPublicado(),
        invalido: () => arbol,
      },
      publicar: {
        leer: () => repo.obtenerArbol,
        persistir: () => repo.guardarFlujo,
        valido: () => arbolGrupalPublicable(),
        invalido: () => arbolPublicado(),
      },
      archivar: {
        leer: () => repo.obtenerFlujo,
        persistir: () => repo.guardarFlujo,
        valido: () => arbol.flujo,
        invalido: () => arbol.flujo.archivar(fecha),
      },
    } as const;

    it.each(['clonar-version', 'publicar', 'archivar'] as const)(
      '%s rechaza UUID inválido, estado inválido e inexistencia',
      async (accion) => {
        const { leer, persistir, invalido } = accionesFlujo[accion];
        await admin('post', `/flujos/no-uuid/${accion}`).expect(400);
        expect(persistir()).not.toHaveBeenCalled();
        leer().mockResolvedValueOnce(invalido());
        const respuesta = await admin(
          'post',
          `/flujos/${ids.flujo}/${accion}`,
        ).expect(409);
        expect(respuesta.body).toHaveProperty('codigo', 'ESTADO_INVALIDO');
        leer().mockResolvedValueOnce(null);
        await admin('post', `/flujos/${ids.flujo}/${accion}`).expect(404);
        expect(persistir()).not.toHaveBeenCalled();
      },
    );

    it.each(['clonar-version', 'publicar', 'archivar'] as const)(
      '%s ignora el body: el actor siempre sale de la sesión',
      async (accion) => {
        const { leer, valido } = accionesFlujo[accion];
        leer().mockResolvedValueOnce(valido());

        await admin('post', `/flujos/${ids.flujo}/${accion}`)
          .send({ creado_por: ids.otroFlujo })
          .expect(accion === 'clonar-version' ? 201 : 200);

        const llamada = accionesFlujo[accion].persistir().mock
          .calls[0] as unknown[];
        expect(llamada).toContain(ids.actor);
        expect(llamada).not.toContain(ids.otroFlujo);
      },
    );

    it.each(['clonar-version', 'publicar', 'archivar'] as const)(
      '%s sanitiza errores inesperados de base de datos',
      async (accion) => {
        const { leer, persistir, valido } = accionesFlujo[accion];
        leer().mockResolvedValueOnce(valido());
        persistir().mockRejectedValueOnce(
          new Error('conexion-privada-simulada'),
        );
        const respuesta = await admin(
          'post',
          `/flujos/${ids.flujo}/${accion}`,
        ).expect(500);
        expect(respuesta.text).not.toContain('conexion-privada-simulada');
      },
    );
  });

  it('publica el contrato backend sin prefijo /api', async () => {
    await request(app.getHttpServer())
      .get('/api/chat/admin/catalogos')
      .set('Cookie', 'brisa_session=admin')
      .expect(404);
    await admin('get', '/catalogos').expect(200);
  });
});
