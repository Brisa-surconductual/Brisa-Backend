import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
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
import { ActualizarUnidadTemporalUseCase } from '../../src/modules/cronograma/application/use-cases/actualizar-unidad-temporal.use-case';
import { EliminarAsociacionContenidoUnidadTemporalUseCase } from '../../src/modules/cronograma/application/use-cases/eliminar-asosiacion-contenido-unidad-temporal.use-case';
import { RegistrarPausaAdministrativaUseCase } from '../../src/modules/cronograma/application/use-cases/registrar-pausa-administrativa.use-case';
import { TipoContenido } from '../../src/modules/cronograma/domain/enums/tipo-contenido.enum';
import { ContenidoCronogramaActivoException } from '../../src/modules/cronograma/domain/exeption/contenido-cronograma-activo.exception';
import { CronogramaUsuarioActivoNoEncontradoException } from '../../src/modules/cronograma/domain/exeption/cronograma-usuario-activo-no-encontrado.exception';
import { FechaInicioPausaFueraRangoException } from '../../src/modules/cronograma/domain/exeption/fecha-inicio-pausa-fuera-rango.exception';
import { FechasPausaInvalidasException } from '../../src/modules/cronograma/domain/exeption/fechas-pausa-invalidas.exception';
import { PausaAdministrativaSolapadaException } from '../../src/modules/cronograma/domain/exeption/pausa-administrativa-solapada.exception';
import { CronogramaController } from '../../src/modules/cronograma/presentation/cronograma.controller';
import { CsrfSessionGuard } from '../../src/modules/usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../src/modules/usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../src/modules/usuarios/presentation/guards/session-scope.guard';

describe('Cronograma - endpoints propios (e2e)', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const idUsuario = '00000000-0000-4000-8000-000000000002';
  const idAdministrador = '00000000-0000-4000-8000-000000000003';
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
  const actualizarUnidadTemporal = { execute: jest.fn() };
  const eliminarAsociacionContenido = { execute: jest.fn() };
  const registrarPausa = { execute: jest.fn() };
  const autenticar = (context: ExecutionContext): boolean => {
    const requestHttp = context.switchToHttp().getRequest<{
      autenticacion?: { usuario: { id_usuario: string } };
    }>();
    requestHttp.autenticacion = {
      usuario: { id_usuario: idAdministrador },
    };
    return true;
  };
  const permitir = { canActivate: jest.fn(autenticar) };
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
        {
          provide: ActualizarUnidadTemporalUseCase,
          useValue: actualizarUnidadTemporal,
        },
        {
          provide: EliminarAsociacionContenidoUnidadTemporalUseCase,
          useValue: eliminarAsociacionContenido,
        },
        {
          provide: RegistrarPausaAdministrativaUseCase,
          useValue: registrarPausa,
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
    permitir.canActivate.mockImplementation(autenticar);
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

  it('registra una pausa y obtiene el administrador de la sesión', async () => {
    registrarPausa.execute.mockResolvedValue({
      id_pausa: '00000000-0000-4000-8000-000000000004',
      id_usuario: idUsuario,
      id_cronograma_usuario: '00000000-0000-4000-8000-000000000005',
      fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
      fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
      motivo_pausa: 'Incapacidad médica',
      id_usuario_administrativo: idAdministrador,
      fecha_registro: new Date('2026-09-07T12:00:00.000Z'),
      estado_pausa: 'ACTIVA',
      mensaje: 'Pausa administrativa registrada correctamente.',
    });

    await request(app.getHttpServer())
      .post(`/cronograma/usuarios/${idUsuario}/pausas-administrativas`)
      .send({
        fecha_inicio_pausa: '2026-09-10T12:00:00.000Z',
        fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
        motivo_pausa: '  Incapacidad médica  ',
      })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body).toMatchObject({
          id_usuario: idUsuario,
          id_usuario_administrativo: idAdministrador,
          estado_pausa: 'ACTIVA',
        });
      });

    expect(registrarPausa.execute).toHaveBeenCalledWith(
      idUsuario,
      idAdministrador,
      expect.objectContaining({
        fecha_inicio_pausa: new Date('2026-09-10T12:00:00.000Z'),
        fecha_fin_pausa: new Date('2026-09-12T12:00:00.000Z'),
        motivo_pausa: 'Incapacidad médica',
      }),
    );
  });

  it.each(['fecha_inicio_pausa', 'fecha_fin_pausa', 'motivo_pausa'] as const)(
    'retorna 400 cuando falta %s',
    async (campo) => {
      const body: Record<string, unknown> = {
        fecha_inicio_pausa: '2026-09-10T12:00:00.000Z',
        fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
        motivo_pausa: 'Incapacidad médica',
      };
      delete body[campo];

      await request(app.getHttpServer())
        .post(`/cronograma/usuarios/${idUsuario}/pausas-administrativas`)
        .send(body)
        .expect(400);

      expect(registrarPausa.execute).not.toHaveBeenCalled();
    },
  );

  it.each(['id_usuario_administrativo', 'id_cronograma_usuario'])(
    'rechaza el campo manipulable %s en el cuerpo',
    async (campo) => {
      await request(app.getHttpServer())
        .post(`/cronograma/usuarios/${idUsuario}/pausas-administrativas`)
        .send({
          fecha_inicio_pausa: '2026-09-10T12:00:00.000Z',
          fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
          motivo_pausa: 'Incapacidad médica',
          [campo]: '00000000-0000-4000-8000-000000000099',
        })
        .expect(400);

      expect(registrarPausa.execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    [new CronogramaUsuarioActivoNoEncontradoException(), 422],
    [new FechaInicioPausaFueraRangoException(), 422],
    [new FechasPausaInvalidasException(), 400],
    [new PausaAdministrativaSolapadaException(), 409],
  ])('propaga el error de negocio como HTTP %s', async (error, estado) => {
    registrarPausa.execute.mockRejectedValueOnce(error);

    await request(app.getHttpServer())
      .post(`/cronograma/usuarios/${idUsuario}/pausas-administrativas`)
      .send({
        fecha_inicio_pausa: '2026-09-10T12:00:00.000Z',
        fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
        motivo_pausa: 'Incapacidad médica',
      })
      .expect(estado);
  });

  it('retorna 403 sin ejecutar el caso de uso cuando falta permiso', async () => {
    autorizarRol.canActivate.mockReturnValue(false);

    await request(app.getHttpServer())
      .post(`/cronograma/usuarios/${idUsuario}/pausas-administrativas`)
      .send({
        fecha_inicio_pausa: '2026-09-10T12:00:00.000Z',
        fecha_fin_pausa: '2026-09-12T12:00:00.000Z',
        motivo_pausa: 'Incapacidad médica',
      })
      .expect(403);

    expect(registrarPausa.execute).not.toHaveBeenCalled();
  });
});
