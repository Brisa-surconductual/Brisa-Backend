import {
  Controller,
  type ExecutionContext,
  Get,
  type INestApplication,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsInt, IsOptional, Max } from 'class-validator';
import { Type } from 'class-transformer';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import { PermisoIndividualException } from '../../../application/exceptions/permiso-individual.exception';
import { ListarPermisosIndividualesUseCase } from '../../../application/use-cases/permisos-individuales/listar-permisos-individuales.use-case';
import { OtorgarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/otorgar-permiso-individual.use-case';
import { RevocarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/revocar-permiso-individual.use-case';
import { PermisosIndividualesController } from './permisos-individuales.controller';

const ID_COORDINADOR = 'c0000000-0000-4000-8000-000000000001';
const BENEFICIARIO = 'a0000000-0000-4000-8000-000000000002';
const ID_PERMISO = '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d';
const BASE = '/admin/permisos-individuales';
const CODIGO = 'P-7F3A91C2';

const SOBRE_400 = {
  status: 400,
  codigo: 'PARAMETRO_INVALIDO',
  mensaje: 'Los parámetros de la operación no son válidos.',
};

/** SessionAuthGuard simulado: el rol y el alcance llegan en cabeceras `x-test-*`. */
const autenticar = (c: ExecutionContext): boolean => {
  const req = c.switchToHttp().getRequest<{
    headers: Record<string, string>;
    autenticacion?: unknown;
  }>();
  req.autenticacion = {
    usuario: {
      id_usuario: ID_COORDINADOR,
      rol: req.headers['x-test-role'] ?? 'COORDINADOR_PSI',
    },
    sesion: {
      id_sesion: '00000000-0000-4000-8000-0000000a0701',
      alcance_sesion: req.headers['x-test-alcance'] ?? 'COMPLETA',
    },
  };
  return true;
};

/** CsrfSessionGuard simulado: exige la cabecera X-CSRF-Token. */
const csrf = (c: ExecutionContext): boolean =>
  Boolean(
    c.switchToHttp().getRequest<{ headers: Record<string, string> }>().headers[
      'x-csrf-token'
    ],
  );

class ConsultaPrueba {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(10)
  limite?: number;
}

/** Otro controlador, sin el filtro: su 400 debe seguir siendo el de Nest. */
@Controller('prueba-400')
class PruebaController {
  @Get()
  consultar(@Query() consulta: ConsultaPrueba) {
    return { ok: consulta !== undefined };
  }
}

describe('PermisosIndividualesController (HTTP)', () => {
  let app: INestApplication<App>;
  const listar = jest.fn();
  const otorgar = jest.fn();
  const revocar = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [PermisosIndividualesController, PruebaController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        {
          provide: ListarPermisosIndividualesUseCase,
          useValue: { execute: listar },
        },
        {
          provide: OtorgarPermisoIndividualUseCase,
          useValue: { execute: otorgar },
        },
        {
          provide: RevocarPermisoIndividualUseCase,
          useValue: { execute: revocar },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: csrf })
      .compile();
    app = modulo.createNestApplication();
    // Los mismos ajustes que `main.ts`.
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
    listar.mockReset().mockResolvedValue({
      items: [],
      total: 0,
      offset: 0,
      limit: 20,
    });
    otorgar.mockReset().mockResolvedValue({ id_permiso: ID_PERMISO });
    revocar.mockReset().mockResolvedValue({
      id_permiso: ID_PERMISO,
      vigente: false,
      revocado_en: '2026-11-25T15:00:00.000Z',
    });
  });

  afterAll(() => app?.close());

  const servidor = () => app.getHttpServer();
  const cuerpoValido = () => ({
    codigo_participante: CODIGO,
    alcance: 'ACCESO_INDIVIDUAL',
    id_usuario_beneficiario: BENEFICIARIO,
  });
  const conceder = (body: object = cuerpoValido()) =>
    request(servidor()).post(BASE).set('X-CSRF-Token', 'token').send(body);

  describe('400 de validación con el sobre { status, codigo, mensaje }', () => {
    const sinEco = (texto: string, enviado: string) =>
      expect(texto).not.toContain(enviado);

    it('POST sin alcance', async () => {
      const sinAlcance = {
        codigo_participante: CODIGO,
        id_usuario_beneficiario: BENEFICIARIO,
      };
      const r = await conceder(sinAlcance).expect(400);

      expect(r.body).toEqual(SOBRE_400);
      expect(otorgar).not.toHaveBeenCalled();
    });

    it('POST con un campo extra, sin repetirlo', async () => {
      const r = await conceder({ ...cuerpoValido(), campo_extra: 'ECO-777' });

      expect(r.status).toBe(400);
      expect(r.body).toEqual(SOBRE_400);
      sinEco(JSON.stringify(r.body), 'ECO-777');
      expect(otorgar).not.toHaveBeenCalled();
    });

    it('POST con id_usuario_beneficiario que no es UUID', async () => {
      const r = await conceder({
        ...cuerpoValido(),
        id_usuario_beneficiario: 'no-es-uuid-ECO-5',
      }).expect(400);

      expect(r.body).toEqual(SOBRE_400);
      sinEco(JSON.stringify(r.body), 'ECO-5');
    });

    it.each([
      ['limit=101', '?limit=101'],
      ['limit=0', '?limit=0'],
      ['solo_vigentes=x', '?solo_vigentes=x'],
      ['un parámetro desconocido', '?foo=1'],
    ])('GET con %s', async (_, consulta) => {
      const r = await request(servidor()).get(`${BASE}${consulta}`).expect(400);

      expect(r.body).toEqual(SOBRE_400);
      expect(listar).not.toHaveBeenCalled();
    });

    it('POST /:id_permiso/revocar con un id que no es UUID', async () => {
      const r = await request(servidor())
        .post(`${BASE}/no-uuid-ECO-9/revocar`)
        .set('X-CSRF-Token', 'token')
        .expect(400);

      expect(r.body).toEqual(SOBRE_400);
      sinEco(JSON.stringify(r.body), 'ECO-9');
      expect(revocar).not.toHaveBeenCalled();
    });
  });

  describe('lo que no cambia', () => {
    it.each([
      ['PARTICIPANTE_NO_ENCONTRADO', 404],
      ['PERMISO_YA_VIGENTE', 409],
      ['AUTOCONCESION_NO_PERMITIDA', 422],
      ['ERROR_PERSISTENCIA_PERMISOS', 500],
    ] as const)(
      'el error de negocio %s sigue con su sobre',
      async (codigo, status) => {
        const error = new PermisoIndividualException(codigo);
        otorgar.mockRejectedValue(error);

        const r = await conceder().expect(status);

        expect(r.body).toEqual(error.getResponse());
      },
    );

    it('POST sin CSRF responde 403 con el sobre de la guarda, no con el del filtro', async () => {
      const r = await request(servidor())
        .post(BASE)
        .send(cuerpoValido())
        .expect(403);

      expect(r.body).not.toHaveProperty('codigo');
      expect(otorgar).not.toHaveBeenCalled();
    });

    it('201 y 200 siguen igual', async () => {
      await conceder().expect(201).expect('Cache-Control', 'no-store');
      await request(servidor())
        .post(`${BASE}/${ID_PERMISO}/revocar`)
        .set('X-CSRF-Token', 'token')
        .expect(200);
    });

    it('otro controlador mantiene el 400 por defecto de Nest', async () => {
      const r = await request(servidor())
        .get('/prueba-400?limite=99')
        .expect(400);

      expect(r.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
      expect(r.body).not.toHaveProperty('codigo');
    });
  });
});
