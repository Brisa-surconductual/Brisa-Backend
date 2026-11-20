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
import { presentadorNodoPrueba } from '../../../application/support/testing/presentacion-nodo.fixture';
import { ConsultarHistorialInteraccionesUseCase } from '../../../application/use-cases/sesion/consultar-historial-interacciones.use-case';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { HistorialInteraccionesRepository } from '../../../domain/repositories/historial-interacciones.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { DomainExceptionFilter } from '../../filters/domain-exception.filter';
import { HistorialInteraccionesController } from './historial-interacciones.controller';

describe('RF-31 / RF-32 GET /chat/sesiones/:idSesion/interacciones (HTTP)', () => {
  const idSesion = '32000000-0000-4000-8000-000000000001';
  const idUsuario = '32000000-0000-4000-8000-000000000002';
  const idNodo = '32000000-0000-4000-8000-000000000003';
  const idFlujo = '32000000-0000-4000-8000-000000000004';
  const fecha = new Date('2026-11-20T10:00:00Z');
  const ruta = `/chat/sesiones/${idSesion}/interacciones`;
  const sesiones = {
    buscarPorIdYUsuario: jest.fn(),
    guardar: jest.fn(),
    buscarUltimaReanudable: jest.fn(),
  };
  const arboles = { buscarNodo: jest.fn() };
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
    app.useGlobalFilters(new DomainExceptionFilter());
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
    arboles.buscarNodo.mockResolvedValue(
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
    );
    historial.consultar.mockResolvedValue({
      ultimaSecuencia: 1,
      hayMas: false,
      interacciones: [
        {
          idInteraccion: '32000000-0000-4000-8000-000000000010',
          secuencia: 1,
          timestampInteraccion: fecha,
          registradaEn: fecha,
          idNodo,
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
        id_sesion: idSesion,
        ultima_secuencia: 1,
        hay_mas: false,
        interacciones: [
          {
            id_interaccion: '32000000-0000-4000-8000-000000000010',
            secuencia: 1,
            timestamp_interaccion: '2026-11-20T10:00:00.000Z',
            registrada_en: '2026-11-20T10:00:00.000Z',
            nodo: {
              idNodo,
              bloques: [
                {
                  orden: 1,
                  tipo: 'TEXTO',
                  texto: '¿Qué tan fuerte es el deseo?',
                },
              ],
              entrada: {
                tipo: 'ESCALA',
                obligatorio: true,
                min: 1,
                max: 10,
                paso: 1,
                opciones: null,
                etiquetas: null,
                maxCaracteres: null,
              },
            },
            respuesta: { tipo_entrada: 'ESCALA', valor: 7 },
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

  it('acepta antes_de y limite como enteros de la query', async () => {
    await request(app.getHttpServer())
      .get(`${ruta}?antes_de=5&limite=3`)
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
    ['antes_de=0'],
    ['antes_de=abc'],
    ['id_usuario=x'],
  ])('rechaza la query inválida %s con 400 sin leer', async (query) => {
    await request(app.getHttpServer()).get(`${ruta}?${query}`).expect(400);
    expect(historial.consultar).not.toHaveBeenCalled();
  });

  it('rechaza un idSesion que no es UUID con 400', async () => {
    await request(app.getHttpServer())
      .get('/chat/sesiones/no-uuid/interacciones')
      .expect(400);
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

  it('responde 500 CONTENIDO_NO_DISPONIBLE si un nodo no puede presentarse', async () => {
    arboles.buscarNodo.mockResolvedValue(null);
    const r = await request(app.getHttpServer()).get(ruta).expect(500);
    expect(r.body).toMatchObject({ codigo: 'CONTENIDO_NO_DISPONIBLE' });
  });
});
