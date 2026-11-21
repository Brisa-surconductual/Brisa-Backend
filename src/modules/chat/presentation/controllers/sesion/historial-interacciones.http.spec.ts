import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { PresentarNodoActualService } from '../../../application/services/presentar-nodo-actual.service';
import { PresentarHistorialConversacionalService } from '../../../application/services/presentar-historial-conversacional.service';
import { presentadorNodoPrueba } from '../../../application/support/testing/presentacion-nodo.fixture';
import { ConsultarHistorialInteraccionesUseCase } from '../../../application/use-cases/sesion/consultar-historial-interacciones.use-case';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { HistorialInteraccionesRepository } from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { instalarFiltroConversacionalPrueba } from '../../support/testing/filtro-error-conversacional.fixture';
import { HistorialInteraccionesController } from './historial-interacciones.controller';

describe('RF-31 / RF-32 GET /chat/sesiones/:id_sesion/historial (HTTP)', () => {
  const idSesion = '32000000-0000-4000-8000-000000000001';
  const idUsuario = '32000000-0000-4000-8000-000000000002';
  const idNodo = '32000000-0000-4000-8000-000000000003';
  const idFlujo = '32000000-0000-4000-8000-000000000004';
  const idNodoDestino = '32000000-0000-4000-8000-000000000005';
  const fecha = new Date('2026-11-20T10:00:00Z');
  const ruta = `/chat/sesiones/${idSesion}/historial`;
  const sesiones = {
    buscarPorIdYUsuario: jest.fn(),
    guardar: jest.fn(),
    buscarUltimaNoCompletada: jest.fn(),
  };
  const arboles = { buscarNodosPorIds: jest.fn() };
  const historial = { consultar: jest.fn() };
  let app: INestApplication<App>;
  let autenticacion: {
    usuario: { id_usuario: string; rol: Rol };
    sesion: { alcance_sesion: AlcanceSesion };
  } | null;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [HistorialInteraccionesController],
      providers: [
        ConsultarHistorialInteraccionesUseCase,
        PresentarHistorialConversacionalService,
        {
          provide: PresentarNodoActualService,
          useValue: presentadorNodoPrueba(),
        },
        { provide: SesionConversacionalRepository, useValue: sesiones },
        { provide: ArbolConversacionalRepository, useValue: arboles },
        { provide: HistorialInteraccionesRepository, useValue: historial },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          if (!autenticacion) throw new UnauthorizedException();
          const req = context
            .switchToHttp()
            .getRequest<{ autenticacion: unknown }>();
          req.autenticacion = autenticacion;
          return true;
        },
      })
      .compile();
    app = modulo.createNestApplication();
    // Igual que main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    instalarFiltroConversacionalPrueba(app);
    await app.init();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    autenticacion = {
      usuario: { id_usuario: idUsuario, rol: Rol.ESTUDIANTE },
      sesion: { alcance_sesion: AlcanceSesion.COMPLETA },
    };
    sesiones.buscarPorIdYUsuario.mockImplementation(
      (sesion: string, usuario: string) =>
        Promise.resolve(
          sesion === idSesion && usuario === idUsuario
            ? new SesionConversacional(
                idSesion,
                idUsuario,
                idFlujo,
                1,
                ModalidadConversacional.GRUPAL,
                null,
                null,
                idNodo,
                'ACTIVA',
                fecha,
                fecha,
              )
            : null,
        ),
    );
    arboles.buscarNodosPorIds.mockResolvedValue([
      new NodoConversacional(
        idNodo,
        idFlujo,
        'tipo',
        'PREGUNTA',
        {
          texto: '¿Qué tan fuerte es el deseo?',
          entrada: { tipo: 'ESCALA', min: 1, max: 10, paso: 1 },
        },
        false,
        1,
        null,
        'admin',
        fecha,
        fecha,
      ),
    ]);
    historial.consultar.mockResolvedValue({
      hayMas: true,
      interacciones: [
        {
          idInteraccion: '32000000-0000-4000-8000-000000000010',
          secuencia: 21,
          timestampInteraccion: fecha,
          idNodo,
          idNodoDestino,
          tipoEntrada: 'ESCALA',
          valor: 7,
        },
      ],
    });
  });
  afterEach(() => {
    expect(sesiones.guardar).not.toHaveBeenCalled();
  });
  afterAll(async () => app.close());

  it('responde 200 sin CSRF, con no-store, envoltura data y límite 20 por defecto', async () => {
    const r = await request(app.getHttpServer())
      .get(ruta)
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(r.body).toEqual({
      data: {
        hay_mas: true,
        siguiente_cursor: 21,
        items: [
          {
            id_interaccion: '32000000-0000-4000-8000-000000000010',
            secuencia: 21,
            timestamp_interaccion: '2026-11-20T10:00:00.000Z',
            nodo: {
              id_nodo: idNodo,
              tipo_nodo: 'PREGUNTA',
              bloques: [
                {
                  orden: 1,
                  tipo: 'TEXTO',
                  texto: '¿Qué tan fuerte es el deseo?',
                },
              ],
            },
            respuesta: { tipo_entrada: 'ESCALA', valor: 7, etiqueta: null },
            id_nodo_destino: idNodoDestino,
          },
        ],
      },
    });
    expect(historial.consultar).toHaveBeenCalledWith({
      idSesion,
      antesDe: null,
      limite: 20,
    });
  });

  it('acepta antes_de_secuencia y limite como enteros de la query', async () => {
    await request(app.getHttpServer())
      .get(`${ruta}?antes_de_secuencia=5&limite=3`)
      .expect(200);
    expect(historial.consultar).toHaveBeenCalledWith({
      idSesion,
      antesDe: 5,
      limite: 3,
    });
  });

  it.each([
    ['limite=21'],
    ['limite=0'],
    ['antes_de_secuencia=0'],
    ['antes_de_secuencia=abc'],
    ['antes_de_secuencia=2147483648'],
    ['antes_de_secuencia=10&antes_de_secuencia=20'],
    ['antes_de=5'],
    ['id_usuario=x'],
  ])('rechaza la query inválida %s con 400 sin leer', async (query) => {
    const r = await request(app.getHttpServer())
      .get(`${ruta}?${query}`)
      .expect(400);
    expect(r.body).toMatchObject({
      statusCode: 400,
      codigo: 'PARAMETRO_INVALIDO',
    });
    expect(historial.consultar).not.toHaveBeenCalled();
  });

  it('rechaza un idSesion que no es UUID con 400', async () => {
    const r = await request(app.getHttpServer())
      .get('/chat/sesiones/no-uuid/historial')
      .expect(400);
    expect(r.body).toMatchObject({
      statusCode: 400,
      codigo: 'PARAMETRO_INVALIDO',
    });
  });

  it('trata la sesión de otro usuario como inexistente (404 SESION_NO_ENCONTRADA)', async () => {
    autenticacion = {
      usuario: {
        id_usuario: '32000000-0000-4000-8000-000000000099',
        rol: Rol.ESTUDIANTE,
      },
      sesion: { alcance_sesion: AlcanceSesion.COMPLETA },
    };
    const r = await request(app.getHttpServer()).get(ruta).expect(404);
    expect(r.body).toMatchObject({ codigo: 'SESION_NO_ENCONTRADA' });
    expect(historial.consultar).not.toHaveBeenCalled();
  });

  it('responde 401 sin sesión y 403 a un rol distinto de estudiante', async () => {
    autenticacion = null;
    await request(app.getHttpServer()).get(ruta).expect(401);
    autenticacion = {
      usuario: { id_usuario: idUsuario, rol: Rol.ADMINISTRATIVO },
      sesion: { alcance_sesion: AlcanceSesion.COMPLETA },
    };
    await request(app.getHttpServer()).get(ruta).expect(403);
  });

  it('responde 200 con una página vacía y sin cursor', async () => {
    historial.consultar.mockResolvedValue({ hayMas: false, interacciones: [] });
    await request(app.getHttpServer())
      .get(ruta)
      .expect(200)
      .expect({
        data: { items: [], hay_mas: false, siguiente_cursor: null },
      });
  });

  it('responde 422 HISTORIAL_INCONSISTENTE si el historial no supera la validación', async () => {
    historial.consultar.mockResolvedValue(null);
    const r = await request(app.getHttpServer()).get(ruta).expect(422);
    expect(r.body).toMatchObject({
      statusCode: 422,
      codigo: 'HISTORIAL_INCONSISTENTE',
    });
    expect(arboles.buscarNodosPorIds).not.toHaveBeenCalled();
  });

  it('responde 500 CONTENIDO_NO_DISPONIBLE ante un fallo al preparar el nodo', async () => {
    arboles.buscarNodosPorIds.mockRejectedValue(new Error('Fallo de lectura'));
    const r = await request(app.getHttpServer()).get(ruta).expect(500);
    expect(r.body).toMatchObject({ codigo: 'CONTENIDO_NO_DISPONIBLE' });
  });
});
