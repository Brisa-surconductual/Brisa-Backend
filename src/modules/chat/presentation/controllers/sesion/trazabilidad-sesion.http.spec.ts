import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { HistorialConversacionalInconsistenteException } from '../../../application/exceptions/historial-conversacional-inconsistente.exception';
import { ConsultarTrazabilidadSesionUseCase } from '../../../application/use-cases/sesion/consultar-trazabilidad-sesion.use-case';
import { SesionConversacionalNoEncontradaException } from '../../../domain/exceptions/sesion.exceptions';
import {
  ID_PARTICIPANTE,
  ID_SESION_AUTENTICACION,
  ID_USUARIO_ADMIN,
  auditoriaPrueba,
  autenticarPrueba,
} from '../../support/testing/auditoria-consulta.fixture';
import { instalarFiltroConversacionalPrueba } from '../../support/testing/filtro-error-conversacional.fixture';
import { TrazabilidadSesionController } from './trazabilidad-sesion.controller';

const idSesion = '00000000-0000-4000-8000-000000000001';
const ruta = `/chat/admin/sesiones/${idSesion}/trazabilidad`;
const datos = {
  id_sesion: idSesion,
  id_participante: 'P-1A2B3C4D',
  registros: [
    {
      secuencia: 1,
      id_nodo: '00000000-0000-4000-8000-00000000000a',
      respuesta_usuario: { valor: 7 },
      id_nodo_destino: null,
      timestamp_interaccion: '2026-11-20T14:00:00.000Z',
      tipo_entrada: 'ESCALA',
      contenido_historico: 'NO_VERIFICABLE',
      motivo_no_verificable: 'VERSION_NO_PUBLICADA',
      tipo_nodo: null,
      texto_nodo: null,
      etiqueta_respuesta: null,
    },
  ],
};

describe('GET /chat/admin/sesiones/:id_sesion/trazabilidad (HTTP)', () => {
  let app: INestApplication<App>;
  const casoDeUso = { execute: jest.fn() };
  const auditoria = auditoriaPrueba();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [TrazabilidadSesionController],
      providers: [
        RolesGuard,
        auditoria.provider,
        { provide: ConsultarTrazabilidadSesionUseCase, useValue: casoDeUso },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticarPrueba })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    instalarFiltroConversacionalPrueba(app);
    await app.init();
  });
  beforeEach(() => {
    casoDeUso.execute.mockReset().mockResolvedValue(datos);
    auditoria.reiniciar();
  });
  afterAll(() => app?.close());

  it('200 envuelto en data, sin caché', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .expect(200)
      .expect('Cache-Control', 'no-store');

    expect(r.body as unknown).toEqual({ data: datos });
    expect(casoDeUso.execute).toHaveBeenCalledWith(idSesion, {});
  });

  it('codigo_participante opcional: se normaliza y se pasa al caso de uso', async () => {
    await request(app.getHttpServer())
      .get(`${ruta}?codigo_participante=p-1a2b3c4d`)
      .expect(200);

    expect(casoDeUso.execute).toHaveBeenCalledWith(idSesion, {
      codigoParticipante: 'P-1A2B3C4D',
    });
  });

  it.each([
    [
      'un codigo_participante con otro formato',
      'codigo_participante=00000000-0000-4000-8000-000000000002',
    ],
    ['un parámetro desconocido', 'include_pii=true'],
  ])('400 PARAMETRO_INVALIDO con %s', async (_, consulta) => {
    const r = await request(app.getHttpServer())
      .get(`${ruta}?${consulta}`)
      .expect(400);

    expect(r.body as unknown).toHaveProperty('codigo', 'PARAMETRO_INVALIDO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  it('403 NO_AUTORIZADO con una sesión administrativa incompleta', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-alcance', 'LIMITADA')
      .expect(403);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTORIZADO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'no existe ninguna operación de escritura de la trazabilidad (%s)',
    async (metodo) => {
      await request(app.getHttpServer())[metodo](ruta).expect(404);
      expect(casoDeUso.execute).not.toHaveBeenCalled();
    },
  );

  it('403 NO_AUTORIZADO para un estudiante', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-role', 'ESTUDIANTE')
      .expect(403);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTORIZADO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  it('401 sin sesión', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-auth', 'ausente')
      .expect(401);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTENTICADO');
  });

  it('404 SESION_NO_ENCONTRADA', async () => {
    casoDeUso.execute.mockRejectedValue(
      new SesionConversacionalNoEncontradaException(),
    );

    const r = await request(app.getHttpServer()).get(ruta).expect(404);

    expect(r.body as unknown).toHaveProperty('codigo', 'SESION_NO_ENCONTRADA');
  });

  it('422 HISTORIAL_INCONSISTENTE', async () => {
    casoDeUso.execute.mockRejectedValue(
      new HistorialConversacionalInconsistenteException(),
    );

    const r = await request(app.getHttpServer()).get(ruta).expect(422);

    expect(r.body as unknown).toHaveProperty(
      'codigo',
      'HISTORIAL_INCONSISTENTE',
    );
  });

  it('400 PARAMETRO_INVALIDO con un id que no es UUID', async () => {
    const r = await request(app.getHttpServer())
      .get('/chat/admin/sesiones/no-es-uuid/trazabilidad')
      .expect(400);

    expect(r.body as unknown).toHaveProperty('codigo', 'PARAMETRO_INVALIDO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  describe('auditoría RF-123', () => {
    const actor = {
      idUsuario: ID_USUARIO_ADMIN,
      idSesionAutenticacion: ID_SESION_AUTENTICACION,
      direccionIp: expect.any(String) as unknown,
    };

    it('200: registra EXITOSA con la sesión de autenticación, no la conversacional', async () => {
      await request(app.getHttpServer()).get(ruta).expect(200);

      expect(auditoria.eventos()).toEqual([
        {
          actor,
          accion: 'CONSULTA_PARTICIPANTE',
          recursoAfectado: 'trazabilidad_sesion_chat',
          idRecurso: idSesion,
          idParticipante: ID_PARTICIPANTE,
          estado: 'EXITOSA',
          detalle: { operacion: 'CONSULTAR_TRAZABILIDAD_SESION' },
        },
      ]);
      expect(auditoria.eventos()[0].actor.idSesionAutenticacion).not.toBe(
        idSesion,
      );
      expect(auditoria.buscarPorId).toHaveBeenCalledWith(idSesion);
    });

    it('no guarda preguntas, respuestas ni textos en la bitácora', async () => {
      await request(app.getHttpServer()).get(ruta).expect(200);

      const serializado = JSON.stringify(auditoria.eventos());
      for (const sensible of [
        'respuesta_usuario',
        'texto_nodo',
        'registros',
        'ESCALA',
        'P-1A2B3C4D',
      ])
        expect(serializado).not.toContain(sensible);
    });

    it('si la auditoría obligatoria falla: 500 y no se entrega ningún dato', async () => {
      auditoria.registrar.mockRejectedValue(new Error('bitácora caída'));

      const r = await request(app.getHttpServer()).get(ruta).expect(500);

      expect(JSON.stringify(r.body)).not.toContain('registros');
      expect(JSON.stringify(r.body)).not.toContain('P-1A2B3C4D');
      expect(r.body as unknown).not.toHaveProperty('data');
    });

    it('si no se identifica al participante consultado: 500 sin datos', async () => {
      auditoria.buscarPorId.mockResolvedValue(null);

      const r = await request(app.getHttpServer()).get(ruta).expect(500);

      expect(r.body as unknown).not.toHaveProperty('data');
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it.each([
      [
        '404',
        () => new SesionConversacionalNoEncontradaException(),
        404,
        'SESION_NO_ENCONTRADA',
      ],
      [
        '422',
        () => new HistorialConversacionalInconsistenteException(),
        422,
        'HISTORIAL_INCONSISTENTE',
      ],
      ['500', () => new Error('fallo interno'), 500, null],
    ])(
      '%s: registra FALLIDA con el estado y el código público',
      async (_, error, estadoHttp, codigo) => {
        casoDeUso.execute.mockRejectedValue(error());

        await request(app.getHttpServer()).get(ruta).expect(estadoHttp);

        expect(auditoria.eventos()).toEqual([
          expect.objectContaining({
            estado: 'FALLIDA',
            idRecurso: idSesion,
            detalle: {
              operacion: 'CONSULTAR_TRAZABILIDAD_SESION',
              estado_http: estadoHttp,
              codigo_resultado: codigo,
            },
          }),
        ]);
      },
    );

    it('400 por parámetros: registra FALLIDA sin copiar la entrada del cliente', async () => {
      await request(app.getHttpServer())
        .get(`${ruta}?include_pii=true`)
        .expect(400);

      const [evento] = auditoria.eventos();
      expect(evento).toMatchObject({
        estado: 'FALLIDA',
        detalle: {
          operacion: 'CONSULTAR_TRAZABILIDAD_SESION',
          estado_http: 400,
          codigo_resultado: null,
        },
      });
      expect(JSON.stringify(evento)).not.toContain('include_pii');
    });

    it('400 con un id que no es UUID: FALLIDA sin recurso ni participante', async () => {
      await request(app.getHttpServer())
        .get('/chat/admin/sesiones/no-es-uuid/trazabilidad')
        .expect(400);

      expect(auditoria.eventos()).toEqual([
        expect.objectContaining({
          estado: 'FALLIDA',
          idRecurso: null,
          idParticipante: null,
        }),
      ]);
      expect(auditoria.buscarPorId).not.toHaveBeenCalled();
    });

    it('si falla el registro de un error, se conserva la respuesta original', async () => {
      casoDeUso.execute.mockRejectedValue(
        new SesionConversacionalNoEncontradaException(),
      );
      auditoria.registrar.mockRejectedValue(new Error('bitácora caída'));

      const r = await request(app.getHttpServer()).get(ruta).expect(404);

      expect(r.body as unknown).toHaveProperty(
        'codigo',
        'SESION_NO_ENCONTRADA',
      );
    });

    it.each([
      ['un estudiante', 'x-test-role', 'ESTUDIANTE'],
      ['una sesión incompleta', 'x-test-alcance', 'LIMITADA'],
    ])(
      '403 para %s: registra DENEGADA sin consultar datos del participante',
      async (_, cabecera, valor) => {
        await request(app.getHttpServer())
          .get(ruta)
          .set(cabecera, valor)
          .expect(403);

        expect(auditoria.eventos()).toEqual([
          {
            actor,
            accion: 'CONSULTA_PARTICIPANTE',
            recursoAfectado: 'trazabilidad_sesion_chat',
            idRecurso: idSesion,
            idParticipante: null,
            estado: 'DENEGADA',
            detalle: {
              operacion: 'CONSULTAR_TRAZABILIDAD_SESION',
              estado_http: 403,
              codigo_resultado: null,
            },
          },
        ]);
        expect(auditoria.buscarPorId).not.toHaveBeenCalled();
        expect(casoDeUso.execute).not.toHaveBeenCalled();
      },
    );

    it('403 se mantiene aunque la bitácora falle', async () => {
      auditoria.registrar.mockRejectedValue(new Error('bitácora caída'));

      const r = await request(app.getHttpServer())
        .get(ruta)
        .set('x-test-role', 'ESTUDIANTE')
        .expect(403);

      expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTORIZADO');
      expect(casoDeUso.execute).not.toHaveBeenCalled();
    });

    it('401: no se registra (sin usuario ni sesión de autenticación)', async () => {
      await request(app.getHttpServer())
        .get(ruta)
        .set('x-test-auth', 'ausente')
        .expect(401);

      expect(auditoria.registrar).not.toHaveBeenCalled();
    });
  });
});
