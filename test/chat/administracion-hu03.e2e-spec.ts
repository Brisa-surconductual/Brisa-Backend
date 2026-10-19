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
import {
  ReglaValidacion,
  TipoEntradaConversacional,
  TipoNodoConversacional,
} from '../../src/modules/chat/domain/entities/arbol-conversacional.entity';
import {
  EstadoFlujoConversacional,
  TipoDatoValidacion,
} from '../../src/modules/chat/domain/enums/arbol-conversacional.enums';
import {
  EstadoFlujoInvalidoException,
  FlujoConversacionalNoEncontradoException,
  GrafoInvalidoException,
  NodoFueraDeFlujoException,
  PublicadoPorPerfilExistenteException,
} from '../../src/modules/chat/domain/exeption/arbol-conversacional.exceptions';
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
import { arbolDominio, fecha, ids } from './fixtures/arbol-hu03.fixture';

jest.setTimeout(30_000);

describe('HU-03 administrativa HTTP con guards y casos de uso reales', () => {
  const hash = (valor: string) =>
    createHash('sha256').update(valor).digest('hex');
  const arbol = arbolDominio();
  const repo = {
    listarFlujos: jest.fn(),
    clonarVersion: jest.fn(),
    publicarAdministrativo: jest.fn(),
    archivarAdministrativo: jest.fn(),
    crearFlujoGrupal: jest.fn(),
    crearFlujoPersonalizado: jest.fn(),
    clonarVersionPersonalizada: jest.fn(),
    listarFlujosPersonalizados: jest.fn(),
    buscarPublicadoGrupal: jest.fn(),
    buscarPublicadoPersonalizado: jest.fn(),
    listarAuditoriaArbol: jest.fn(),
    publicarPersonalizado: jest.fn(),
    archivarPersonalizado: jest.fn(),
    obtenerArbol: jest.fn(),
    listarTiposNodo: jest.fn(),
    listarTiposEntrada: jest.fn(),
    listarReglasValidacion: jest.fn(),
    buscarNodo: jest.fn(),
    buscarTransicion: jest.fn(),
    crearReglaValidacion: jest.fn(),
    crearNodo: jest.fn(),
    actualizarNodo: jest.fn(),
    crearTransicion: jest.fn(),
    actualizarTransicion: jest.fn(),
    publicar: jest.fn(),
  } satisfies jest.Mocked<ArbolConversacionalRepository>;
  const bodyFlujo = { nombre: 'Inicio', modalidad: 'GRUPAL' };
  const bodyNodo = { id_tipo_nodo: ids.tipo, contenido: { texto: 'Inicio' } };
  const bodyTransicion = {
    id_nodo_origen: ids.origen,
    id_nodo_destino: ids.destino,
    id_regla_validacion: ids.validacion,
    operador_condicion: 'IGUALDAD',
    valor_condicion: { valor: 'si' },
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
    {
      metodo: 'patch',
      ruta: '/reglas-validacion',
      cuerpo: { tipo_dato: 'TEXTO', mensaje_error: 'Respuesta requerida' },
    },
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
    repo.clonarVersion.mockResolvedValue({
      flujo: { ...arbol.flujo, idFlujo: ids.otroFlujo, version: 2 },
      idFlujoOrigen: ids.flujo,
      nodosCopiados: 2,
      transicionesCopiadas: 1,
    });
    repo.publicarAdministrativo.mockResolvedValue({
      ...arbol.flujo,
      estado: EstadoFlujoConversacional.PUBLICADO,
      fechaPublicacion: fecha,
    });
    repo.archivarAdministrativo.mockResolvedValue({
      ...arbol.flujo,
      estado: EstadoFlujoConversacional.ARCHIVADO,
      fechaArchivado: fecha,
    });
    repo.crearFlujoGrupal.mockResolvedValue(arbol.flujo);
    repo.crearFlujoPersonalizado.mockResolvedValue(arbol.flujo);
    repo.obtenerArbol.mockResolvedValue(arbol);
    repo.crearNodo.mockResolvedValue(arbol.nodos[1]);
    repo.actualizarNodo.mockResolvedValue(arbol.nodos[0]);
    repo.buscarNodo.mockResolvedValue(arbol.nodos[0]);
    repo.buscarTransicion.mockResolvedValue(arbol.transiciones[0]);
    repo.crearTransicion.mockResolvedValue(arbol.transiciones[0]);
    repo.actualizarTransicion.mockResolvedValue(arbol.transiciones[0]);
    repo.listarTiposNodo.mockResolvedValue([
      new TipoNodoConversacional(ids.tipo, 'MENSAJE'),
    ]);
    repo.listarTiposEntrada.mockResolvedValue([
      new TipoEntradaConversacional(ids.entrada, 'TEXTO_LIBRE'),
    ]);
    repo.listarReglasValidacion.mockResolvedValue([
      arbol.transiciones[0].reglaValidacion,
    ]);
    repo.crearReglaValidacion.mockResolvedValue(
      arbol.transiciones[0].reglaValidacion,
    );
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
        id_flujo: ids.flujo,
        estado: 'BORRADOR',
        version: 1,
        creado_por: ids.actor,
      },
    });
    expect(repo.crearFlujoGrupal).toHaveBeenCalledWith({
      nombre: 'Inicio',
      version: 1,
      creadoPor: ids.actor,
    });
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
      expect(repo.crearFlujoGrupal).not.toHaveBeenCalled();
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
    expect(repo.crearFlujoPersonalizado).toHaveBeenCalledWith({
      nombre: 'Personalizado',
      tipoDependencia: 'TOLERANCIA',
      tipoCraving: 'NEGATIVO',
      creadoPor: ids.actor,
    });
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
            id_regla_validacion: ids.validacion,
            valor_condicion: bodyTransicion.valor_condicion,
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
        id_nodo: ids.destino,
        id_flujo: ids.flujo,
        id_tipo_nodo: ids.tipo,
        es_nodo_inicial: false,
      },
    });
    expect(repo.crearNodo).toHaveBeenCalledWith(
      expect.objectContaining({
        esNodoInicial: false,
        orden: null,
        idContenidoCronograma: null,
        creadoPor: ids.actor,
      }),
    );
  });

  it.each(['id_tipo_nodo', 'contenido', 'es_nodo_inicial'])(
    '03-D rechaza null en %s',
    async (campo) => {
      await admin('patch', `/nodos/${ids.origen}`)
        .send({ [campo]: null })
        .expect(400);
      expect(repo.actualizarNodo).not.toHaveBeenCalled();
    },
  );

  it('03-D permite limpiar campos anulables y resuelve el flujo desde el nodo', async () => {
    const respuesta = await admin('patch', `/nodos/${ids.origen}`)
      .send({ orden: null, id_contenido_cronograma: null })
      .expect(200);
    expect(respuesta.body).toHaveProperty('data.fecha_actualizacion');
    expect(repo.actualizarNodo).toHaveBeenCalledWith(
      expect.objectContaining({
        idFlujo: ids.flujo,
        idNodo: ids.origen,
        orden: null,
        idContenidoCronograma: null,
        contenido: undefined,
      }),
    );
  });

  it('03-D rechaza una actualización vacía', async () => {
    await admin('patch', `/nodos/${ids.origen}`).send({}).expect(400);
  });

  it('03-E acepta la referencia a una regla reutilizable', async () => {
    const respuesta = await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send(bodyTransicion)
      .expect(201);
    expect(respuesta.body).toMatchObject({
      data: {
        id_regla: ids.transicion,
        id_flujo: ids.flujo,
        id_regla_validacion: ids.validacion,
        valor_condicion: bodyTransicion.valor_condicion,
      },
    });
    expect(respuesta.body).not.toHaveProperty('data.id_transicion');
    expect(respuesta.body).not.toHaveProperty('data.regla_validacion');
    expect(repo.crearTransicion).toHaveBeenCalledWith(
      expect.objectContaining({
        idReglaValidacion: ids.validacion,
        creadoPor: ids.actor,
      }),
    );
  });

  it.each(Object.keys(bodyTransicion))('03-E requiere %s', async (campo) => {
    const cuerpo: Record<string, unknown> = { ...bodyTransicion };
    delete cuerpo[campo];
    await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send(cuerpo)
      .expect(400);
    expect(repo.crearTransicion).not.toHaveBeenCalled();
  });

  it('03-E conserva 422 y NODO_FUERA_DE_FLUJO', async () => {
    repo.crearTransicion.mockRejectedValueOnce(new NodoFueraDeFlujoException());
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
    expect(repo.actualizarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({
        idFlujo: ids.flujo,
        ordenEvaluacion: 2,
        idNodoDestino: undefined,
        idReglaValidacion: undefined,
        valorCondicion: undefined,
      }),
    );
  });

  it.each([
    'id_nodo_destino',
    'id_regla_validacion',
    'operador_condicion',
    'valor_condicion',
    'orden_evaluacion',
  ])('03-F rechaza null en %s', async (campo) => {
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({ [campo]: null })
      .expect(400);
    expect(repo.actualizarTransicion).not.toHaveBeenCalled();
  });

  it('03-F impide cambiar el origen y rechaza un PATCH vacío', async () => {
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({ id_nodo_origen: ids.destino })
      .expect(400);
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({})
      .expect(400);
  });

  it.each([null, 'si', 1, true, []])(
    '03-E exige un objeto para valor_condicion: %j',
    async (valor) => {
      await admin('post', `/flujos/${ids.flujo}/transiciones`)
        .send({ ...bodyTransicion, valor_condicion: valor })
        .expect(400);
      expect(repo.crearTransicion).not.toHaveBeenCalled();
    },
  );

  it.each(['si', 1, true, []])(
    '03-F rechaza condiciones escalares o arreglos: %j',
    async (valor) => {
      await admin('patch', `/transiciones/${ids.transicion}`)
        .send({ valor_condicion: valor })
        .expect(400);
      expect(repo.actualizarTransicion).not.toHaveBeenCalled();
    },
  );

  it('03-F conserva el objeto de condición sin inventar claves por operador', async () => {
    const condicion = { respuesta: 'otra', opciones: ['a', 'b'] };
    await admin('patch', `/transiciones/${ids.transicion}`)
      .send({ valor_condicion: condicion })
      .expect(200);
    expect(repo.actualizarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({ valorCondicion: condicion }),
    );
  });

  it('03-H entrega catálogos persistidos y enums coincidentes con el cliente Prisma', async () => {
    const respuesta = await admin('get', '/catalogos')
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(respuesta.body).toMatchObject({
      data: {
        tipos_nodo: [{ id_tipo_nodo: ids.tipo }],
        tipos_entrada: [{ id_tipo_entrada: ids.entrada }],
        reglas_validacion: [{ id_regla_validacion: ids.validacion }],
        enums: {
          modalidad: Object.values(modalidad_enum),
          tipo_dependencia: Object.values(tipo_dependencia_enum),
          tipo_craving: Object.values(tipo_craving_enum),
          operador_condicion: Object.values(operador_condicion_enum),
          tipo_dato: Object.values(tipo_dato_validacion_enum),
          estado_flujo: Object.values(estado_flujo_enum),
        },
      },
    });
  });

  it('03-G conserva PATCH, devuelve 201 con data y aplica valores iniciales', async () => {
    const respuesta = await admin('patch', '/reglas-validacion')
      .send({ tipo_dato: 'TEXTO', mensaje_error: 'Respuesta requerida' })
      .expect(201);
    expect(respuesta.body).toEqual({
      data: {
        id_regla_validacion: ids.validacion,
        tipo_dato: 'TEXTO',
        obligatorio: true,
        valor_min: null,
        valor_max: null,
        formato_regex: null,
        valores_permitidos: [],
        mensaje_error: 'Respuesta requerida',
      },
    });
    expect(repo.crearReglaValidacion).toHaveBeenCalledWith({
      tipoDato: 'TEXTO',
      obligatorio: true,
      valorMin: null,
      valorMax: null,
      formatoRegex: null,
      valoresPermitidos: [],
      mensajeError: 'Respuesta requerida',
      creadoPor: ids.actor,
    });
  });

  it.each([
    {},
    { tipo_dato: 'OTRO', mensaje_error: 'Error' },
    { tipo_dato: 'TEXTO', mensaje_error: '' },
    { tipo_dato: 'TEXTO', mensaje_error: '   ' },
    { tipo_dato: 'TEXTO', mensaje_error: 'Error', obligatorio: null },
    { tipo_dato: 'TEXTO', mensaje_error: 'Error', valores_permitidos: [1] },
    { tipo_dato: 'TEXTO', mensaje_error: 'Error', valor_min: 'cero' },
    { tipo_dato: 'TEXTO', mensaje_error: 'Error', id_flujo: ids.flujo },
    { tipo_dato: 'TEXTO', mensaje_error: 'Error', creado_por: ids.otroFlujo },
  ])('03-G rechaza un cuerpo inválido: %j', async (cuerpo) => {
    await admin('patch', '/reglas-validacion').send(cuerpo).expect(400);
    expect(repo.crearReglaValidacion).not.toHaveBeenCalled();
  });

  it('03-G conserva false, cero y decimales al crear una regla numérica', async () => {
    const cuerpo = {
      tipo_dato: 'NUMERICO',
      obligatorio: false,
      valor_min: 0,
      valor_max: 2.75,
      mensaje_error: '  Fuera de rango  ',
    };
    repo.crearReglaValidacion.mockResolvedValueOnce(
      new ReglaValidacion(
        ids.validacion,
        TipoDatoValidacion.NUMERICO,
        false,
        0,
        2.75,
        null,
        [],
        'Fuera de rango',
      ),
    );
    const respuesta = await admin('patch', '/reglas-validacion')
      .send(cuerpo)
      .expect(201);
    expect(respuesta.body).toEqual({
      data: {
        id_regla_validacion: ids.validacion,
        ...cuerpo,
        mensaje_error: 'Fuera de rango',
        formato_regex: null,
        valores_permitidos: [],
      },
    });
    expect(repo.crearReglaValidacion).toHaveBeenCalledWith({
      tipoDato: 'NUMERICO',
      obligatorio: false,
      valorMin: 0,
      valorMax: 2.75,
      formatoRegex: null,
      valoresPermitidos: [],
      mensajeError: 'Fuera de rango',
      creadoPor: ids.actor,
    });
  });

  it('03-G devuelve las opciones de selección como arreglo de texto reutilizable', async () => {
    repo.crearReglaValidacion.mockResolvedValueOnce(
      new ReglaValidacion(
        ids.validacion,
        TipoDatoValidacion.SELECCION,
        true,
        null,
        null,
        null,
        ['si', 'no'],
        'Elige una opción',
      ),
    );
    const respuesta = await admin('patch', '/reglas-validacion')
      .send({
        tipo_dato: 'SELECCION',
        valores_permitidos: ['si', 'no'],
        mensaje_error: 'Elige una opción',
      })
      .expect(201);
    expect(respuesta.body).toMatchObject({
      data: {
        id_regla_validacion: ids.validacion,
        tipo_dato: 'SELECCION',
        valores_permitidos: ['si', 'no'],
      },
    });
  });

  it('03-G permite crear, consultar y reutilizar la regla sin asignarle un flujo en el body', async () => {
    await admin('patch', '/reglas-validacion')
      .send({ tipo_dato: 'TEXTO', mensaje_error: 'Respuesta requerida' })
      .expect(201);
    const catalogos = await admin('get', '/catalogos').expect(200);
    expect(catalogos.body).toMatchObject({
      data: { reglas_validacion: [{ id_regla_validacion: ids.validacion }] },
    });
    const transicion = await admin('post', `/flujos/${ids.flujo}/transiciones`)
      .send(bodyTransicion)
      .expect(201);
    expect(transicion.body).toHaveProperty(
      'data.id_regla_validacion',
      ids.validacion,
    );
    expect(repo.crearReglaValidacion).toHaveBeenCalledTimes(1);
    expect(repo.crearTransicion).toHaveBeenCalledWith(
      expect.objectContaining({ idReglaValidacion: ids.validacion }),
    );
  });

  it('03-G conserva PATCH como único método de creación en esa ruta', async () => {
    await admin('post', '/reglas-validacion')
      .send({ tipo_dato: 'TEXTO', mensaje_error: 'Error' })
      .expect(404);
    expect(repo.crearReglaValidacion).not.toHaveBeenCalled();
  });

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
    repo.crearFlujoGrupal.mockRejectedValueOnce(
      new Error('credencial-privada-simulada'),
    );
    const respuesta = await admin('post', '/flujos')
      .send(bodyFlujo)
      .expect(500);
    expect(respuesta.text).not.toContain('credencial-privada-simulada');
  });

  it('conserva la ruta administrativa anterior y no agrega DELETE', async () => {
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
      expect(repo.listarFlujos).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 20 }),
      );
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
      expect(repo.listarFlujos).toHaveBeenCalledWith({
        modalidad: 'PERSONALIZADA',
        tipoDependencia: 'TOLERANCIA',
        tipoCraving: 'NEGATIVO',
        estado: 'ARCHIVADO',
        page: 2,
        pageSize: 100,
      });
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
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/clonar-version`,
      )
        .send({})
        .expect(201);
      expect(respuesta.body).toEqual({
        data: {
          id_flujo: ids.otroFlujo,
          id_flujo_origen: ids.flujo,
          version: 2,
          estado: 'BORRADOR',
          nodos_copiados: 2,
          transiciones_copiadas: 1,
        },
      });
      expect(repo.clonarVersion).toHaveBeenCalledWith(ids.flujo, ids.actor);
    });

    it('05-C entrega únicamente los campos de publicación documentados', async () => {
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/publicar`,
      ).expect(200);
      expect(respuesta.body).toEqual({
        data: {
          id_flujo: ids.flujo,
          estado: 'PUBLICADO',
          version: 1,
          fecha_publicacion: fecha.toISOString(),
        },
      });
      expect(repo.publicarAdministrativo).toHaveBeenCalledWith(
        ids.flujo,
        ids.actor,
      );
    });

    it('05-C devuelve 409 y el identificador del publicado previo', async () => {
      repo.publicarAdministrativo.mockRejectedValueOnce(
        new PublicadoPorPerfilExistenteException(ids.otroFlujo),
      );
      const respuesta = await admin(
        'post',
        `/flujos/${ids.flujo}/publicar`,
      ).expect(409);
      expect(respuesta.body).toMatchObject({
        codigo: 'YA_EXISTE_PUBLICADO',
        detalles: { id_flujo_publicado: ids.otroFlujo },
      });
    });

    it('05-C conserva los detalles estructurados del grafo inválido', async () => {
      const detalles = {
        nodos_huerfanos: [ids.destino],
        ciclos: [[ids.origen, ids.origen]],
        sin_nodo_inicial: false,
      };
      repo.publicarAdministrativo.mockRejectedValueOnce(
        new GrafoInvalidoException(detalles),
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
          fecha_archivado: fecha.toISOString(),
        },
      });
      expect(repo.archivarAdministrativo).toHaveBeenCalledWith(
        ids.flujo,
        ids.actor,
      );
    });

    it.each(['clonar-version', 'publicar', 'archivar'])(
      '%s rechaza UUID inválido, estado inválido e inexistencia',
      async (accion) => {
        const operacion =
          accion === 'clonar-version'
            ? repo.clonarVersion
            : accion === 'publicar'
              ? repo.publicarAdministrativo
              : repo.archivarAdministrativo;
        await admin('post', `/flujos/no-uuid/${accion}`).expect(400);
        expect(operacion).not.toHaveBeenCalled();
        operacion.mockRejectedValueOnce(new EstadoFlujoInvalidoException());
        const respuesta = await admin(
          'post',
          `/flujos/${ids.flujo}/${accion}`,
        ).expect(409);
        expect(respuesta.body).toHaveProperty('codigo', 'ESTADO_INVALIDO');
        operacion.mockRejectedValueOnce(
          new FlujoConversacionalNoEncontradoException(),
        );
        await admin('post', `/flujos/${ids.flujo}/${accion}`).expect(404);
      },
    );

    it.each(['clonar-version', 'publicar', 'archivar'])(
      '%s rechaza campos en el body y arreglos',
      async (accion) => {
        await admin('post', `/flujos/${ids.flujo}/${accion}`)
          .send({ creado_por: ids.otroFlujo })
          .expect(400);
        await admin('post', `/flujos/${ids.flujo}/${accion}`)
          .send([])
          .expect(400);
      },
    );

    it.each(['clonar-version', 'publicar', 'archivar'])(
      '%s sanitiza errores inesperados de base de datos',
      async (accion) => {
        const operacion =
          accion === 'clonar-version'
            ? repo.clonarVersion
            : accion === 'publicar'
              ? repo.publicarAdministrativo
              : repo.archivarAdministrativo;
        operacion.mockRejectedValueOnce(new Error('conexion-privada-simulada'));
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
