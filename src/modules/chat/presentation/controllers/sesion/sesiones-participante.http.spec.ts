import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { CursorSesionesInvalidoException } from '../../../application/exceptions/cursor-sesiones-invalido.exception';
import { ListarSesionesParticipanteUseCase } from '../../../application/use-cases/sesion/listar-sesiones-participante.use-case';
import { ParticipanteNoEncontradoException } from '../../../domain/exceptions/sesion.exceptions';
import {
  ID_PARTICIPANTE,
  ID_SESION_AUTENTICACION,
  ID_USUARIO_ADMIN,
  auditoriaPrueba,
  autenticarPrueba,
} from '../../support/testing/auditoria-consulta.fixture';
import { instalarFiltroConversacionalPrueba } from '../../support/testing/filtro-error-conversacional.fixture';
import { SesionesParticipanteController } from './sesiones-participante.controller';

const ruta = '/chat/admin/participantes/P-1A2B3C4D/sesiones';
const datos = {
  id_participante: 'P-1A2B3C4D',
  items: [
    {
      id_sesion: '00000000-0000-4000-8000-000000000001',
      modalidad: 'GRUPAL',
      estado: 'COMPLETADA',
      fecha_inicio: '2026-11-20T14:00:00.000Z',
      fecha_ultima_interaccion: '2026-11-20T14:20:00.000Z',
    },
  ],
  total: 1,
  siguiente_cursor: null,
};

describe('GET /chat/admin/participantes/:codigo_participante/sesiones (HTTP)', () => {
  let app: INestApplication<App>;
  const casoDeUso = { execute: jest.fn() };
  const auditoria = auditoriaPrueba();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [SesionesParticipanteController],
      providers: [
        RolesGuard,
        auditoria.provider,
        { provide: ListarSesionesParticipanteUseCase, useValue: casoDeUso },
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

  it('200 envuelto en data, sin caché, con el límite por defecto', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .expect(200)
      .expect('Cache-Control', 'no-store');

    expect(r.body as unknown).toEqual({ data: datos });
    expect(casoDeUso.execute).toHaveBeenCalledWith('P-1A2B3C4D', {
      limite: 20,
    });
  });

  it('normaliza el código a mayúscula y acepta límite y cursor', async () => {
    await request(app.getHttpServer())
      .get(
        '/chat/admin/participantes/p-1a2b3c4d/sesiones?limite=5&cursor=abc_DEF-123',
      )
      .expect(200);

    expect(casoDeUso.execute).toHaveBeenCalledWith('P-1A2B3C4D', {
      limite: 5,
      cursor: 'abc_DEF-123',
    });
  });

  it('403 NO_AUTORIZADO para un estudiante', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-role', 'ESTUDIANTE')
      .expect(403);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTORIZADO');
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

  it('401 NO_AUTENTICADO sin sesión', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .set('x-test-auth', 'ausente')
      .expect(401);

    expect(r.body as unknown).toHaveProperty('codigo', 'NO_AUTENTICADO');
  });

  it.each([
    ['un UUID interno del estudiante', '00000000-0000-4000-8000-000000000002'],
    ['un código con caracteres no hexadecimales', 'P-1A2B3C4Z'],
    ['un código incompleto', 'P-1A2B'],
  ])('400 PARAMETRO_INVALIDO con %s', async (_, codigo) => {
    const r = await request(app.getHttpServer())
      .get(`/chat/admin/participantes/${codigo}/sesiones`)
      .expect(400);

    expect(r.body as unknown).toHaveProperty('codigo', 'PARAMETRO_INVALIDO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['límite 0', 'limite=0'],
    ['límite mayor que 50', 'limite=51'],
    ['límite no numérico', 'limite=diez'],
    ['cursor con caracteres no permitidos', 'cursor=a%2Bb'],
    ['parámetro desconocido', 'include_pii=true'],
  ])('400 PARAMETRO_INVALIDO con %s', async (_, consulta) => {
    const r = await request(app.getHttpServer())
      .get(`${ruta}?${consulta}`)
      .expect(400);

    expect(r.body as unknown).toHaveProperty('codigo', 'PARAMETRO_INVALIDO');
    expect(casoDeUso.execute).not.toHaveBeenCalled();
  });

  it('400 PARAMETRO_INVALIDO con un cursor alterado', async () => {
    casoDeUso.execute.mockRejectedValue(new CursorSesionesInvalidoException());

    const r = await request(app.getHttpServer())
      .get(`${ruta}?cursor=Zm9vYmFy`)
      .expect(400);

    expect(r.body as unknown).toHaveProperty('codigo', 'PARAMETRO_INVALIDO');
  });

  it('404 PARTICIPANTE_NO_ENCONTRADO', async () => {
    casoDeUso.execute.mockRejectedValue(
      new ParticipanteNoEncontradoException(),
    );

    const r = await request(app.getHttpServer()).get(ruta).expect(404);

    expect(r.body as unknown).toHaveProperty(
      'codigo',
      'PARTICIPANTE_NO_ENCONTRADO',
    );
    expect(r.body as unknown).toHaveProperty(
      'mensaje',
      'No se encontró el participante solicitado.',
    );
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'no existe ninguna operación de escritura (%s)',
    async (metodo) => {
      await request(app.getHttpServer())[metodo](ruta).expect(404);
      expect(casoDeUso.execute).not.toHaveBeenCalled();
    },
  );

  describe('auditoría RF-123', () => {
    it('200: registra EXITOSA con el participante resuelto por su código', async () => {
      await request(app.getHttpServer())
        .get('/chat/admin/participantes/p-1a2b3c4d/sesiones')
        .expect(200);

      expect(auditoria.eventos()).toEqual([
        {
          actor: {
            idUsuario: ID_USUARIO_ADMIN,
            idSesionAutenticacion: ID_SESION_AUTENTICACION,
            direccionIp: expect.any(String) as unknown,
          },
          accion: 'CONSULTA_PARTICIPANTE',
          recursoAfectado: 'sesiones_participante_chat',
          idRecurso: null,
          idParticipante: ID_PARTICIPANTE,
          estado: 'EXITOSA',
          detalle: { operacion: 'LISTAR_SESIONES_PARTICIPANTE' },
        },
      ]);
      expect(auditoria.resolver).toHaveBeenCalledWith('P-1A2B3C4D');
      expect(JSON.stringify(auditoria.eventos())).not.toContain(
        datos.items[0].id_sesion,
      );
    });

    it('si la auditoría obligatoria falla: 500 y no se entrega el listado', async () => {
      auditoria.registrar.mockRejectedValue(new Error('bitácora caída'));

      const r = await request(app.getHttpServer()).get(ruta).expect(500);

      expect(r.body as unknown).not.toHaveProperty('data');
      expect(JSON.stringify(r.body)).not.toContain(datos.items[0].id_sesion);
    });

    it('404 PARTICIPANTE_NO_ENCONTRADO: registra FALLIDA sin participante', async () => {
      casoDeUso.execute.mockRejectedValue(
        new ParticipanteNoEncontradoException(),
      );
      auditoria.resolver.mockResolvedValue(null);

      await request(app.getHttpServer()).get(ruta).expect(404);

      expect(auditoria.eventos()).toEqual([
        expect.objectContaining({
          estado: 'FALLIDA',
          idParticipante: null,
          detalle: {
            operacion: 'LISTAR_SESIONES_PARTICIPANTE',
            estado_http: 404,
            codigo_resultado: 'PARTICIPANTE_NO_ENCONTRADO',
          },
        }),
      ]);
    });

    it('400 con un UUID interno: FALLIDA sin resolver ni copiar la entrada', async () => {
      const uuid = '00000000-0000-4000-8000-000000000002';
      await request(app.getHttpServer())
        .get(`/chat/admin/participantes/${uuid}/sesiones`)
        .expect(400);

      const [evento] = auditoria.eventos();
      expect(evento).toMatchObject({
        estado: 'FALLIDA',
        idParticipante: null,
        detalle: { estado_http: 400, codigo_resultado: null },
      });
      expect(auditoria.resolver).not.toHaveBeenCalled();
      expect(JSON.stringify(evento.detalle)).not.toContain(uuid);
    });

    it('400 por un cursor alterado: FALLIDA con el participante identificado', async () => {
      casoDeUso.execute.mockRejectedValue(
        new CursorSesionesInvalidoException(),
      );

      await request(app.getHttpServer())
        .get(`${ruta}?cursor=Zm9vYmFy`)
        .expect(400);

      expect(auditoria.eventos()).toEqual([
        expect.objectContaining({
          estado: 'FALLIDA',
          idParticipante: ID_PARTICIPANTE,
        }),
      ]);
      expect(JSON.stringify(auditoria.eventos())).not.toContain('Zm9vYmFy');
    });

    it.each([
      ['un estudiante', 'x-test-role', 'ESTUDIANTE'],
      ['una sesión incompleta', 'x-test-alcance', 'LIMITADA'],
    ])(
      '403 para %s: registra DENEGADA sin resolver el código',
      async (_, cabecera, valor) => {
        await request(app.getHttpServer())
          .get(ruta)
          .set(cabecera, valor)
          .expect(403);

        expect(auditoria.eventos()).toEqual([
          expect.objectContaining({
            estado: 'DENEGADA',
            idParticipante: null,
            idRecurso: null,
            detalle: {
              operacion: 'LISTAR_SESIONES_PARTICIPANTE',
              estado_http: 403,
              codigo_resultado: null,
            },
          }),
        ]);
        expect(auditoria.resolver).not.toHaveBeenCalled();
      },
    );

    it('sin sesión de autenticación identificable: 500 sin ejecutar la consulta', async () => {
      const r = await request(app.getHttpServer())
        .get(ruta)
        .set('x-test-sesion-auth', 'ausente')
        .expect(500);

      expect(casoDeUso.execute).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
      expect(r.body as unknown).not.toHaveProperty('data');
    });

    it('401: no se registra', async () => {
      await request(app.getHttpServer())
        .get(ruta)
        .set('x-test-auth', 'ausente')
        .expect(401);

      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('las operaciones de escritura inexistentes no llegan a la auditoría', async () => {
      await request(app.getHttpServer()).post(ruta).expect(404);

      expect(auditoria.registrar).not.toHaveBeenCalled();
    });
  });
});
