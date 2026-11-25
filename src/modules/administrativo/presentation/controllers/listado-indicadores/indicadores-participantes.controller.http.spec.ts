import {
  type ExecutionContext,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { ListadoIndicadoresException } from '../../../application/exceptions/listado-indicadores.exception';
import { ListarIndicadoresParticipantesUseCase } from '../../../application/use-cases/listado-indicadores/listar-indicadores-participantes.use-case';
import { IndicadoresParticipantesController } from './indicadores-participantes.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const COHORTE = 'c0000000-0000-4000-8000-000000000001';
const RUTA = `/admin/cohortes/${COHORTE}/participantes/indicadores`;

/** SessionAuthGuard simulado; el rol llega en la cabecera x-test-role. */
const autenticar = (c: ExecutionContext): boolean => {
  const req = c.switchToHttp().getRequest<{
    headers: Record<string, string>;
    autenticacion?: unknown;
  }>();
  req.autenticacion = {
    usuario: {
      id_usuario: ID_ADMIN,
      rol: req.headers['x-test-role'] ?? 'ADMINISTRATIVO',
    },
    sesion: {
      id_sesion: '00000000-0000-4000-8000-0000000a0701',
      alcance_sesion: 'COMPLETA',
    },
  };
  return true;
};

const respuesta = {
  items: [
    {
      codigo_participante: 'P-7F3A91C2',
      nivel_progreso: 'EN_AVANCE',
      tasa_adherencia: 0.41,
      alertas_activas: 2,
      alertas_atendidas: 0,
      tipos_alerta_activa: ['INACTIVIDAD', 'CRAVING_ELEVADO'],
    },
  ],
  total: 1,
  offset: 0,
  limit: 20,
};

describe('GET /admin/cohortes/:id_cohorte/participantes/indicadores (HTTP, RF-142)', () => {
  let app: INestApplication<App>;
  const listar = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [IndicadoresParticipantesController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        {
          provide: ListarIndicadoresParticipantesUseCase,
          useValue: { execute: listar },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .compile();
    app = modulo.createNestApplication();
    // Igual que main.ts: el pipe global rechaza campos no permitidos.
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
    listar.mockReset().mockResolvedValue(respuesta);
  });

  afterAll(() => app?.close());

  const consultar = (query = '') =>
    request(app.getHttpServer()).get(`${RUTA}${query}`);

  it('200 con el contrato, sin caché, y valores por defecto', async () => {
    const r = await consultar().expect(200).expect('Cache-Control', 'no-store');
    expect(r.body).toEqual(respuesta);
    expect(listar).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: ID_ADMIN }),
      COHORTE,
      {
        filtros: {},
        orden: { campo: 'codigo_participante', direccion: 'ASC' },
        pagina: { offset: 0, limit: 20 },
        camposRestringidos: [],
      },
    );
  });

  it('pasa los parámetros combinados ya tipados al caso de uso', async () => {
    await consultar(
      '?nivel_progreso=en_avance&adherencia_min=0&adherencia_max=0.5&con_alertas=true&orden_campo=tasa_adherencia&orden_direccion=desc&offset=20&limit=50',
    ).expect(200);
    expect(listar).toHaveBeenCalledWith(expect.anything(), COHORTE, {
      filtros: {
        nivel_progreso: 'EN_AVANCE',
        adherencia_min: 0,
        adherencia_max: 0.5,
        con_alertas: true,
      },
      orden: { campo: 'tasa_adherencia', direccion: 'DESC' },
      pagina: { offset: 20, limit: 50 },
      camposRestringidos: [],
    });
  });

  it('campos restringidos: 200 sanitizado y el caso de uso recibe los campos para auditarlos', async () => {
    const r = await consultar(
      '?incluir_texto=true&correo=1&campos=texto_diario&con_alertas=false',
    ).expect(200);
    expect(r.body).toEqual(respuesta);
    expect(listar).toHaveBeenCalledWith(
      expect.anything(),
      COHORTE,
      expect.objectContaining({
        filtros: { con_alertas: false },
        camposRestringidos: ['incluir_texto', 'correo', 'campos'],
      }),
    );
  });

  it('un parámetro desconocido no restringido se descarta sin 400 ni intento', async () => {
    await consultar('?pagina=2&foo=bar').expect(200);
    expect(listar).toHaveBeenCalledWith(
      expect.anything(),
      COHORTE,
      expect.objectContaining({ filtros: {}, camposRestringidos: [] }),
    );
  });

  it('400 PARAMETRO_INVALIDO con el mensaje del contrato si adherencia_min > adherencia_max', async () => {
    const r = await consultar('?adherencia_min=0.8&adherencia_max=0.2').expect(
      400,
    );
    expect(r.body).toEqual({
      status: 400,
      codigo: 'PARAMETRO_INVALIDO',
      mensaje: 'adherencia_min debe ser menor o igual que adherencia_max.',
    });
    expect(listar).not.toHaveBeenCalled();
  });

  it.each([
    ['nivel_progreso desconocido', '?nivel_progreso=EXPERTO'],
    ['adherencia fuera de 0–1', '?adherencia_max=1.5'],
    ['adherencia no numérica', '?adherencia_min=abc'],
    ['con_alertas no booleano', '?con_alertas=si'],
    ['orden_campo no permitido', '?orden_campo=correo'],
    ['orden_direccion inválida', '?orden_direccion=ARRIBA'],
    ['offset negativo', '?offset=-1'],
    ['limit mayor que 100', '?limit=101'],
    ['limit cero', '?limit=0'],
  ])('400 PARAMETRO_INVALIDO con %s', async (_caso, query) => {
    const r = await consultar(query).expect(400);
    expect(r.body).toMatchObject({ status: 400, codigo: 'PARAMETRO_INVALIDO' });
    expect(listar).not.toHaveBeenCalled();
  });

  it('400 PARAMETRO_INVALIDO si el id de la cohorte no es UUID', async () => {
    const r = await request(app.getHttpServer())
      .get('/admin/cohortes/123/participantes/indicadores')
      .expect(400);
    expect(r.body).toMatchObject({ codigo: 'PARAMETRO_INVALIDO' });
  });

  it.each([
    ['COHORTE_NO_ENCONTRADA' as const, 404],
    ['M05_NO_DISPONIBLE' as const, 503],
    ['ERROR_LISTADO_INDICADORES' as const, 500],
  ])(
    '%s responde %i con { status, codigo, mensaje }',
    async (codigo, status) => {
      listar.mockRejectedValue(new ListadoIndicadoresException(codigo));
      const r = await consultar().expect(status);
      expect(r.body).toMatchObject({ status, codigo });
    },
  );

  it('ADMINISTRATIVO sin permiso individual y COORDINADOR_PSI pueden listar', async () => {
    await consultar().expect(200);
    await consultar().set('x-test-role', 'COORDINADOR_PSI').expect(200);
  });

  it('403 para un estudiante', async () => {
    await consultar().set('x-test-role', 'ESTUDIANTE').expect(403);
    expect(listar).not.toHaveBeenCalled();
  });
});
