import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { ConsultarNodoActualUseCase } from '../../../application/use-cases/sesion/consultar-nodo-actual.use-case';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { DomainExceptionFilter } from '../../filters/domain-exception.filter';
import { NodoActualController } from './nodo-actual.controller';

describe('RF-26 GET /chat/sesiones/:id_sesion/nodo-actual (HTTP)', () => {
  const idSesion = '26000000-0000-4000-8000-000000000001';
  const idUsuario = '26000000-0000-4000-8000-000000000002';
  const idNodo = '26000000-0000-4000-8000-000000000003';
  const idFlujo = '26000000-0000-4000-8000-000000000004';
  const fecha = new Date('2026-11-05T10:00:00Z');
  const contenido = {
    texto: '  Mensaje\nactual. ',
    instrucciones: 'Lee con calma.',
    multimedia: [
      { tipo: 'IMAGEN', url: 'https://example.test/uno.png' },
      { tipo: 'VIDEO', url: 'https://example.test/dos.mp4' },
    ],
  };
  const nodo = new NodoConversacional(
    idNodo,
    idFlujo,
    'tipo',
    'MENSAJE',
    contenido,
    false,
    2,
    null,
    'administrador',
    fecha,
    fecha,
  );
  const sesiones = {
    buscarPorIdYUsuario: jest.fn(),
    guardar: jest.fn(),
    buscarUltimaReanudable: jest.fn(),
  };
  const arboles = { buscarNodo: jest.fn() };
  let app: INestApplication<App>;
  let autenticacion: {
    usuario: { id_usuario: string; rol: Rol };
    sesion: { alcance_sesion: AlcanceSesion };
  } | null;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [NodoActualController],
      providers: [
        ConsultarNodoActualUseCase,
        { provide: SesionConversacionalRepository, useValue: sesiones },
        { provide: ArbolConversacionalRepository, useValue: arboles },
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
                'PAUSADA',
                fecha,
                fecha,
              )
            : null,
        ),
    );
    arboles.buscarNodo.mockResolvedValue(nodo);
  });
  afterEach(() => {
    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(sesiones.buscarUltimaReanudable).not.toHaveBeenCalled();
  });
  afterAll(async () => app.close());

  it('responde 200 sin CSRF, con contenido íntegro y sin datos clínicos ni otros nodos', async () => {
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({
        data: {
          nodo_actual: {
            id_nodo: idNodo,
            tipo_nodo: 'MENSAJE',
            contenido,
            es_nodo_inicial: false,
            orden: 2,
          },
        },
      });
    expect(arboles.buscarNodo).toHaveBeenCalledWith(idNodo);
  });
  it('toma al propietario de la sesión autenticada e ignora id_usuario de la query', async () => {
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .query({ id_usuario: 'otro-usuario' })
      .expect(200);
    expect(sesiones.buscarPorIdYUsuario).toHaveBeenCalledWith(
      idSesion,
      idUsuario,
    );
  });
  it('no expone sesiones ajenas', async () => {
    autenticacion!.usuario.id_usuario = '26000000-0000-4000-8000-000000000099';
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(404);
    expect(result.body).toMatchObject({ codigo: 'SESION_NO_ENCONTRADA' });
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('responde 404 para una sesión inexistente', async () => {
    const result = await request(app.getHttpServer())
      .get('/chat/sesiones/26000000-0000-4000-8000-000000000088/nodo-actual')
      .expect(404);
    expect(result.body).toMatchObject({ codigo: 'SESION_NO_ENCONTRADA' });
  });
  it('rechaza un UUID inválido antes de consultar', async () => {
    await request(app.getHttpServer())
      .get('/chat/sesiones/no-es-uuid/nodo-actual')
      .expect(400);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('responde 401 sin autenticación', async () => {
    autenticacion = null;
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(401);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('responde 403 para un administrador', async () => {
    autenticacion!.usuario.rol = Rol.ADMINISTRATIVO;
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(403);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('responde 403 con alcance limitado', async () => {
    autenticacion!.sesion.alcance_sesion = AlcanceSesion.LIMITADA;
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(403);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('conserva el error 404 de un nodo inexistente', async () => {
    arboles.buscarNodo.mockResolvedValue(null);
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(404);
    expect(result.body).toMatchObject({
      codigo: 'NODO_NO_ENCONTRADO',
      message: 'No se pudo recuperar el contenido del chat.',
    });
  });
  it('informa ERROR_CONFIGURACION sin reiniciar la conversación', async () => {
    sesiones.buscarPorIdYUsuario.mockResolvedValue(
      SesionConversacional.registrarErrorConfiguracion(
        {
          idSesion,
          idUsuario,
          modalidadActiva: ModalidadConversacional.GRUPAL,
          tipoDependencia: null,
          tipoCraving: null,
        },
        fecha,
      ),
    );
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(409);
    expect(result.body).toMatchObject({ codigo: 'SESION_ERROR_CONFIGURACION' });
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('retorna un 500 controlado si falla la base, sin filtrar su mensaje', async () => {
    arboles.buscarNodo.mockRejectedValue(
      new Error('detalle privado de PostgreSQL'),
    );
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(500);
    expect(result.body).toMatchObject({
      codigo: 'CONTENIDO_NODO_NO_DISPONIBLE',
      message: 'El contenido del nodo no está disponible.',
    });
    expect(result.text).not.toContain('PostgreSQL');
  });
});
