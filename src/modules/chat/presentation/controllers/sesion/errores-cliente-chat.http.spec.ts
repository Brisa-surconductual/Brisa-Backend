import {
  BadRequestException,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionTokenHasher } from '../../../../usuarios/application/ports/session-token-hasher';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { ReportarErrorConversacionalUseCase } from '../../../application/use-cases/sesion/reportar-error-conversacional.use-case';
import { RegistroErroresConversacionalesRepository } from '../../../domain/repositories/registro-errores-conversacionales.repository';
import { ErrorConversacionalFilter } from '../../filters/error-conversacional.filter';
import { ErroresClienteChatController } from './errores-cliente-chat.controller';

interface SolicitudPrueba {
  header(nombre: string): string | undefined;
  autenticacion?: unknown;
}

@Controller()
class RutasDePruebaController {
  @Get('/chat/sesiones/:idSesion/nodo-actual')
  @UseGuards(SessionAuthGuard)
  obtenerNodo(): never {
    throw new ServiceUnavailableException({
      codigo: 'RECURSO_NO_DISPONIBLE',
      message: 'detalle privado de almacenamiento',
      stack: 'traza privada',
    });
  }

  @Get('/fuera-del-chat')
  fueraDelChat(): never {
    throw new BadRequestException('Contrato existente');
  }
}

describe('RF-37 — registro de errores conversacionales (HTTP)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000031';
  const idSesion = '00000000-0000-4000-8000-000000000032';
  const ruta = '/chat/errores-cliente';
  const reportar = { codigo: 'RECURSO_NO_DISPONIBLE', id_sesion: idSesion };
  const registro = { registrarBackend: jest.fn(), registrarCliente: jest.fn() };
  let app: INestApplication<App>;

  const post = () =>
    request(app.getHttpServer())
      .post(ruta)
      .set('Cookie', 'sesion=local')
      .set('X-CSRF-Token', 'csrf-local');
  const getNodo = () =>
    request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .set('Cookie', 'sesion=local');

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ErroresClienteChatController, RutasDePruebaController],
      providers: [
        ReportarErrorConversacionalUseCase,
        { provide: APP_FILTER, useClass: ErrorConversacionalFilter },
        {
          provide: RegistroErroresConversacionalesRepository,
          useValue: registro,
        },
        {
          provide: SessionTokenHasher,
          useValue: {
            compare: (token: string, esperado: string) =>
              Promise.resolve(token === esperado),
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate(contexto: ExecutionContext) {
          const req = contexto.switchToHttp().getRequest<SolicitudPrueba>();
          if (req.header('cookie') !== 'sesion=local')
            throw new UnauthorizedException();
          req.autenticacion = {
            usuario: { id_usuario: idUsuario },
            sesion: { csrf_token_hash: 'csrf-local' },
          };
          return true;
        },
      })
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = modulo.createNestApplication();
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
    jest.resetAllMocks();
    registro.registrarCliente.mockResolvedValue('REGISTRADO');
    registro.registrarBackend.mockResolvedValue(undefined);
  });
  afterAll(async () => app.close());

  it('acepta un reporte autenticado y conserva el identificador de correlación', async () => {
    await post()
      .set('X-Request-Id', 'chat-37.a')
      .send(reportar)
      .expect(204)
      .expect('X-Request-Id', 'chat-37.a');
    expect(registro.registrarCliente).toHaveBeenCalledWith({
      idUsuario,
      idSesion,
      codigo: 'RECURSO_NO_DISPONIBLE',
      xRequestId: 'chat-37.a',
    });
  });

  it('reemplaza un identificador fuera del formato permitido y admite reportes sin sesión', async () => {
    await post()
      .set('X-Request-Id', 'id con espacio')
      .send({ codigo: 'SIN_CONEXION' })
      .expect(204)
      .expect('X-Request-Id', /^[0-9a-f-]{36}$/iu);
    expect(registro.registrarCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        idUsuario,
        idSesion: null,
        codigo: 'SIN_CONEXION',
      }),
    );
  });

  it('rechaza payloads ajenos al catálogo o con texto libre', async () => {
    const respuesta = await post()
      .send({ codigo: 'INVENTADO', detalle: 'dato privado' })
      .expect(400);
    expect(respuesta.body).toMatchObject({ codigo: 'PARAMETRO_INVALIDO' });
    expect(respuesta.text).not.toContain('dato privado');
    expect(registro.registrarCliente).not.toHaveBeenCalled();
    expect(registro.registrarBackend).not.toHaveBeenCalled();
  });

  it('responde 429 con Retry-After sin duplicar el reporte como error de backend', async () => {
    registro.registrarCliente.mockResolvedValue('LIMITE');
    const respuesta = await post()
      .send(reportar)
      .expect(429)
      .expect('Retry-After', '60');
    expect(respuesta.body).toMatchObject({ codigo: 'LIMITE_REPORTES' });
    expect(registro.registrarBackend).not.toHaveBeenCalled();
  });

  it('exige cookie y CSRF para registrar', async () => {
    await request(app.getHttpServer()).post(ruta).send(reportar).expect(401);
    const respuesta = await request(app.getHttpServer())
      .post(ruta)
      .set('Cookie', 'sesion=local')
      .send(reportar)
      .expect(403);
    expect(respuesta.body).toMatchObject({ codigo: 'CSRF_INVALIDO' });
    expect(registro.registrarCliente).not.toHaveBeenCalled();
  });

  it('no revela si existe una sesión que no pertenece al estudiante', async () => {
    registro.registrarCliente.mockResolvedValue('SESION_NO_ENCONTRADA');
    const respuesta = await post().send(reportar).expect(404);
    expect(respuesta.body).toMatchObject({ codigo: 'SESION_NO_ENCONTRADA' });
  });

  it('normaliza un fallo de carga y registra solo el contexto autorizado para la auditoría', async () => {
    const respuesta = await getNodo()
      .set('X-Request-Id', 'falla-37')
      .expect(503)
      .expect('X-Request-Id', 'falla-37');
    expect(respuesta.body).toEqual({
      statusCode: 503,
      codigo: 'RECURSO_NO_DISPONIBLE',
      mensaje:
        'No fue posible cargar el contenido en este momento. Inténtalo de nuevo más tarde.',
    });
    expect(registro.registrarBackend).toHaveBeenCalledWith({
      xRequestId: 'falla-37',
      codigo: 'RECURSO_NO_DISPONIBLE',
      statusHttp: 503,
      idUsuario,
      idSesion,
    });
  });

  it('conserva la respuesta original si el registro de auditoría falla', async () => {
    registro.registrarBackend.mockRejectedValue(
      new Error('secreto en fallo de PostgreSQL'),
    );
    const aviso = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    try {
      const respuesta = await getNodo().expect(503);
      expect(respuesta.text).not.toContain('PostgreSQL');
      expect(aviso).toHaveBeenCalledTimes(1);
    } finally {
      aviso.mockRestore();
    }
  });

  it('respeta el formato de una ruta fuera de la conversación', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/fuera-del-chat')
      .expect(400);
    expect(respuesta.body).toEqual({
      statusCode: 400,
      message: 'Contrato existente',
      error: 'Bad Request',
    });
    expect(registro.registrarBackend).not.toHaveBeenCalled();
  });

  it('correlaciona también la variante HEAD que Express atiende con la ruta de lectura', async () => {
    await request(app.getHttpServer())
      .head(`/CHAT/SESIONES/${idSesion}/NODO-ACTUAL`)
      .set('Cookie', 'sesion=local')
      .set('X-Request-Id', 'head-rf37')
      .expect(503)
      .expect('X-Request-Id', 'head-rf37');
    expect(registro.registrarBackend).toHaveBeenCalledWith(
      expect.objectContaining({ xRequestId: 'head-rf37', idSesion }),
    );
  });
});
