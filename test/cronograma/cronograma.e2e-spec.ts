import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { RolesGuard } from '../../src/shared/presentation/guards/role-guard';
import { ActualizarDisponibilidadContenidoUseCase } from '../../src/modules/cronograma/application/use-cases/actualizar-disponibilidad-contenido.use-case';
import { AsociarContenidoUnidadTemporalUseCase } from '../../src/modules/cronograma/application/use-cases/asociar-contenido-unidad-temporal.use-case';
import { ActualizarContenidoUseCase } from '../../src/modules/cronograma/application/use-cases/actualizar-contenido.use-case';
import { CrearContenidoUseCase } from '../../src/modules/cronograma/application/use-cases/crear-contenido.use-case';
import { CrearRecursoContenidoUseCase } from '../../src/modules/cronograma/application/use-cases/crear-recurso-contenido.use-case';
import { CreacionUnidadTemporalUseCase } from '../../src/modules/cronograma/application/use-cases/crear-unidad-temporal.use-case';
import { EliminarContenidoUseCase } from '../../src/modules/cronograma/application/use-cases/eliminar-contenido.use-case';
import { ListarModulosDestinoUseCase } from '../../src/modules/cronograma/application/use-cases/listar-modulos-destino.use-case';
import { ReordenarRecursosContenidoUseCase } from '../../src/modules/cronograma/application/use-cases/reordenar-recursos-contenido.use-case';
import { SolicitarUrlSubidaRecursoUseCase } from '../../src/modules/cronograma/application/use-cases/solicitar-url-subida-recurso.use-case';
import { TipoContenido } from '../../src/modules/cronograma/domain/enums/tipo-contenido.enum';
import { ContenidoCronogramaActivoException } from '../../src/modules/cronograma/domain/exeption/contenido-cronograma-activo.exception';
import { CronogramaController } from '../../src/modules/cronograma/presentation/cronograma.controller';
import { CsrfSessionGuard } from '../../src/modules/usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../src/modules/usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../src/modules/usuarios/presentation/guards/session-scope.guard';

describe('Cronograma - endpoints propios (e2e)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const crearUnidadTemporal = { execute: jest.fn() };
  const crearContenido = { execute: jest.fn() };
  const actualizarContenido = { execute: jest.fn() };
  const eliminarContenido = { execute: jest.fn() };
  const crearRecurso = { execute: jest.fn() };
  const solicitarUrlSubida = { execute: jest.fn() };
  const listarModulos = { execute: jest.fn() };
  const reordenarRecursos = { execute: jest.fn() };
  const asociarContenido = { execute: jest.fn() };
  const actualizarDisponibilidad = { execute: jest.fn() };
  const permitir = { canActivate: jest.fn(() => true) };
  const autorizarRol = { canActivate: jest.fn(() => true) };
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CronogramaController],
      providers: [
        {
          provide: CreacionUnidadTemporalUseCase,
          useValue: crearUnidadTemporal,
        },
        { provide: CrearContenidoUseCase, useValue: crearContenido },
        { provide: ActualizarContenidoUseCase, useValue: actualizarContenido },
        { provide: EliminarContenidoUseCase, useValue: eliminarContenido },
        { provide: CrearRecursoContenidoUseCase, useValue: crearRecurso },
        {
          provide: SolicitarUrlSubidaRecursoUseCase,
          useValue: solicitarUrlSubida,
        },
        { provide: ListarModulosDestinoUseCase, useValue: listarModulos },
        {
          provide: ReordenarRecursosContenidoUseCase,
          useValue: reordenarRecursos,
        },
        {
          provide: AsociarContenidoUnidadTemporalUseCase,
          useValue: asociarContenido,
        },
        {
          provide: ActualizarDisponibilidadContenidoUseCase,
          useValue: actualizarDisponibilidad,
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue(permitir)
      .overrideGuard(SessionScopeGuard)
      .useValue(permitir)
      .overrideGuard(CsrfSessionGuard)
      .useValue(permitir)
      .overrideGuard(RolesGuard)
      .useValue(autorizarRol)
      .compile();

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
    permitir.canActivate.mockReturnValue(true);
    autorizarRol.canActivate.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea contenido con el contrato público de RF-152', async () => {
    crearContenido.execute.mockResolvedValue({
      id_contenido: idContenido,
      mensaje: 'Contenido psicoeducativo creado correctamente.',
    });

    await request(app.getHttpServer())
      .post('/cronograma/contenidos')
      .send({
        nombre_contenido: '  Prevención de recaídas  ',
        tipo_contenido: TipoContenido.INFORMATIVO,
      })
      .expect(201)
      .expect({
        id_contenido: idContenido,
        mensaje: 'Contenido psicoeducativo creado correctamente.',
      });

    expect(crearContenido.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_contenido: 'Prevención de recaídas',
        tipo_contenido: TipoContenido.INFORMATIVO,
      }),
    );
  });

  it('rechaza campos fuera del contrato antes de ejecutar el caso de uso', async () => {
    await request(app.getHttpServer())
      .post('/cronograma/contenidos')
      .send({
        nombre_contenido: 'Prevención',
        tipo_contenido: TipoContenido.INFORMATIVO,
        campo_no_permitido: 'dato',
      })
      .expect(400);

    expect(crearContenido.execute).not.toHaveBeenCalled();
  });

  it('retorna 403 cuando el rol no está autorizado', async () => {
    autorizarRol.canActivate.mockReturnValue(false);

    await request(app.getHttpServer())
      .post('/cronograma/contenidos')
      .send({
        nombre_contenido: 'Prevención',
        tipo_contenido: TipoContenido.INFORMATIVO,
      })
      .expect(403);

    expect(crearContenido.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['patch', 'actualizar', actualizarContenido],
    ['delete', 'eliminar', eliminarContenido],
  ] as const)(
    'propaga HTTP 409 al intentar %s contenido de un cronograma activo',
    async (metodo, _operacion, useCase) => {
      useCase.execute.mockRejectedValue(
        new ContenidoCronogramaActivoException(),
      );
      const solicitud = request(app.getHttpServer())[metodo](
        `/cronograma/contenidos/${idContenido}`,
      );

      if (metodo === 'patch') {
        solicitud.send({ nombre_contenido: 'Nuevo nombre' });
      }

      await solicitud.expect(409).expect((respuesta) => {
        expect(respuesta.text).toContain(
          'No se puede modificar un contenido asociado a un cronograma activo.',
        );
      });
    },
  );
});
