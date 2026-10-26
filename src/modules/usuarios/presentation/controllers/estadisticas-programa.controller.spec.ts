import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { EstadisticasProgramaController } from './estadisticas-programa.controller';
import { ConsultarEstadisticasProgramaUseCase } from '../../application/use-cases/consultar-estadisticas-programa.use-case';
import { EstadisticasProgramaRepository } from '../../domain/repositories/estadisticas-programa.repository';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { Rol } from '../../domain/enums/rol.enum';
import { AlcanceSesion } from '../../domain/enums/alcance-sesion.enum';

describe('Estadísticas agregadas del dashboard administrativo (HTTP)', () => {
  const consultar = jest.fn();
  let app: INestApplication<App>;
  let autenticacion: {
    usuario: { rol: Rol };
    sesion: { alcance_sesion: AlcanceSesion };
  } | null;
  const respuesta = {
    estudiantesActivos: 6,
    conRegistroCompleto: 4,
    conRegistroPendiente: 2,
    diasCronogramaBase: 10,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [EstadisticasProgramaController],
      providers: [
        ConsultarEstadisticasProgramaUseCase,
        { provide: EstadisticasProgramaRepository, useValue: { consultar } },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          if (!autenticacion) throw new UnauthorizedException();
          const request = context
            .switchToHttp()
            .getRequest<{ autenticacion: unknown }>();
          request.autenticacion = autenticacion;
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    autenticacion = {
      usuario: { rol: Rol.ADMINISTRATIVO },
      sesion: { alcance_sesion: AlcanceSesion.COMPLETA },
    };
    consultar.mockResolvedValue(respuesta);
  });
  afterAll(async () => app.close());

  it('retorna solo cifras agregadas y desactiva la caché', async () => {
    consultar.mockResolvedValue({
      ...respuesta,
      correo_electronico: 'no-debe-salir@brisa.test',
    });
    await request(app.getHttpServer())
      .get('/usuarios/estadisticas-programa')
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect(respuesta);
    expect(consultar).toHaveBeenCalledTimes(1);
  });
  it('retorna ceros y duración nula cuando no hay datos', async () => {
    const vacio = {
      estudiantesActivos: 0,
      conRegistroCompleto: 0,
      conRegistroPendiente: 0,
      diasCronogramaBase: null,
    };
    consultar.mockResolvedValue(vacio);
    await request(app.getHttpServer())
      .get('/usuarios/estadisticas-programa')
      .expect(200)
      .expect(vacio);
  });
  it('rechaza un estudiante con sesión completa', async () => {
    autenticacion!.usuario.rol = Rol.ESTUDIANTE;
    await request(app.getHttpServer())
      .get('/usuarios/estadisticas-programa')
      .expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });
  it('rechaza una sesión administrativa limitada', async () => {
    autenticacion!.sesion.alcance_sesion = AlcanceSesion.LIMITADA;
    await request(app.getHttpServer())
      .get('/usuarios/estadisticas-programa')
      .expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });
  it('mantiene el 401 sin sesión', async () => {
    autenticacion = null;
    await request(app.getHttpServer())
      .get('/usuarios/estadisticas-programa')
      .expect(401);
    expect(consultar).not.toHaveBeenCalled();
  });
  it('informa el fallo de consulta sin filtrar detalles de la base', async () => {
    consultar.mockRejectedValue(new Error('Detalle privado del driver'));
    const result = await request(app.getHttpServer())
      .get('/usuarios/estadisticas-programa')
      .expect(500);
    expect(result.text).toContain('No fue posible consultar las estadísticas');
    expect(result.text).not.toContain('Detalle privado');
  });
});
