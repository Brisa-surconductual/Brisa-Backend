import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConsultarUbicacionesTemporalesParticipantesUseCase } from '../../src/modules/cronograma/application/use-cases/cronograma/consultar-ubicaciones-temporales-participantes.use-case';
import { UbicacionesTemporalesParticipantesController } from '../../src/modules/cronograma/presentation/ubicaciones-temporales-participantes.controller';
import { SessionAuthGuard } from '../../src/modules/usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../src/modules/usuarios/presentation/guards/session-scope.guard';
import { RolesGuard } from '../../src/shared/presentation/guards/role-guard';

describe('Cronograma - ubicaciones temporales de participantes (e2e)', () => {
  const execute = jest.fn();
  const autorizarRol = jest.fn(() => true);
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [UbicacionesTemporalesParticipantesController],
      providers: [
        {
          provide: ConsultarUbicacionesTemporalesParticipantesUseCase,
          useValue: { execute },
        },
      ],
    });
    moduleBuilder
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true });
    moduleBuilder
      .overrideGuard(SessionScopeGuard)
      .useValue({ canActivate: () => true });
    moduleBuilder
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: autorizarRol });
    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
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
    autorizarRol.mockReturnValue(true);
  });

  afterAll(async () => app.close());

  it('retorna varios participantes y transforma los filtros', async () => {
    const respuesta = {
      total: 2,
      page: 1,
      page_size: 25,
      participantes: [
        crearParticipante('participante1@brisa.test', 'Semana 4', false),
        crearParticipante('participante2@brisa.test', 'Semana 5', true),
      ],
    };
    execute.mockResolvedValue(respuesta);

    await request(app.getHttpServer())
      .get('/cronograma/participantes/ubicaciones-temporales')
      .query({
        page_size: '25',
        fecha_calculo: '2026-09-15T12:00:00.000Z',
        cronograma_finalizado: 'false',
      })
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect(respuesta);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        page_size: 25,
        fecha_calculo: new Date('2026-09-15T12:00:00.000Z'),
        cronograma_finalizado: false,
      }),
    );
  });

  it('retorna un listado vacío con HTTP 200', async () => {
    execute.mockResolvedValue({
      total: 0,
      page: 1,
      page_size: 50,
      participantes: [],
    });

    await request(app.getHttpServer())
      .get('/cronograma/participantes/ubicaciones-temporales')
      .expect(200)
      .expect({ total: 0, page: 1, page_size: 50, participantes: [] });
  });

  it('rechaza parámetros de paginación inválidos', async () => {
    await request(app.getHttpServer())
      .get('/cronograma/participantes/ubicaciones-temporales?page_size=101')
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });

  it('retorna HTTP 403 cuando el guard de rol deniega la consulta', async () => {
    autorizarRol.mockReturnValue(false);

    await request(app.getHttpServer())
      .get('/cronograma/participantes/ubicaciones-temporales')
      .expect(403);

    expect(execute).not.toHaveBeenCalled();
  });

  function crearParticipante(
    correoElectronico: string,
    nombreUnidad: string,
    enPausa: boolean,
  ): Record<string, unknown> {
    return {
      id_usuario: '00000000-0000-4000-8000-000000000001',
      correo_electronico: correoElectronico,
      id_cronograma: '00000000-0000-4000-8000-000000000002',
      id_unidad_temporal: '00000000-0000-4000-8000-000000000003',
      nombre_unidad: nombreUnidad,
      orden_unidad: 4,
      cronograma_finalizado: false,
      en_pausa_administrativa: enPausa,
    };
  }
});
