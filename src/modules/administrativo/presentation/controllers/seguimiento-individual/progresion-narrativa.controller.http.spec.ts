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
import { SeguimientoIndividualException } from '../../../application/exceptions/seguimiento-individual.exception';
import { AuditoriaService } from '../../../application/services/auditoria.service';
import { VerificarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { ConsultarProgresionNarrativaUseCase } from '../../../application/use-cases/seguimiento-individual/consultar-progresion-narrativa.use-case';
import { PermisoIndividualGuard } from '../../guards/permiso-individual.guard';
import { ProgresionNarrativaController } from './progresion-narrativa.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const RUTA = '/admin/participantes/P-7F3A91C2/progresion-narrativa';

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

const progresion = {
  codigo_participante: 'P-7F3A91C2',
  id_fase_activa: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
  nombre_fase_activa: 'DESARROLLO',
  id_capitulo_completado: '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
  logros_narrativos_desbloqueados: [
    {
      id_logro: '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
      nombre_logro: 'Primer paso',
      fecha_desbloqueo: '2026-10-30T18:00:00Z',
    },
  ],
  modo_consulta: 'SOLO_LECTURA',
};

describe('GET /admin/participantes/:codigo/progresion-narrativa (HTTP, RF-130)', () => {
  let app: INestApplication<App>;
  const consultar = jest.fn();
  const vigente = jest.fn();
  const registrarIntento = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ProgresionNarrativaController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        PermisoIndividualGuard,
        {
          provide: ConsultarProgresionNarrativaUseCase,
          useValue: { execute: consultar },
        },
        {
          provide: VerificarPermisoIndividualUseCase,
          useValue: { execute: vigente },
        },
        { provide: AuditoriaService, useValue: { registrarIntento } },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
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
    consultar.mockReset().mockResolvedValue(progresion);
    vigente.mockReset().mockResolvedValue(true);
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  afterAll(() => app?.close());

  const consultarRuta = (ruta = RUTA) => request(app.getHttpServer()).get(ruta);

  it('200 con la progresión del contrato, sin caché, normalizando el código', async () => {
    const r = await consultarRuta(
      '/admin/participantes/p-7f3a91c2/progresion-narrativa',
    )
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(r.body).toEqual(progresion);
    expect(consultar).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: ID_ADMIN }),
      'P-7F3A91C2',
    );
  });

  it('exige al ADMINISTRATIVO el alcance PROGRESION_NARRATIVA', async () => {
    await consultarRuta().expect(200);
    expect(vigente).toHaveBeenCalledWith(
      ID_ADMIN,
      { codigo: 'P-7F3A91C2' },
      'PROGRESION_NARRATIVA',
    );
  });

  it('204 sin cuerpo si no hay perfil narrativo', async () => {
    consultar.mockResolvedValue(null);
    const r = await consultarRuta().expect(204);
    expect(r.text).toBe('');
  });

  it('403 SIN_PERMISO_NARRATIVA del contrato si no tiene el permiso explícito', async () => {
    vigente.mockResolvedValue(false);
    const r = await consultarRuta().expect(403);
    expect(r.body).toEqual({
      status: 403,
      codigo: 'SIN_PERMISO_NARRATIVA',
      mensaje:
        'Se requiere permiso explícito para consultar la progresión narrativa individual.',
    });
    expect(consultar).not.toHaveBeenCalled();
    expect(registrarIntento).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        accion: 'INTENTO_ACCESO_NO_AUTORIZADO',
        detalle: expect.objectContaining({
          alcance: 'PROGRESION_NARRATIVA',
        }) as unknown,
      }),
      'DENEGADA',
    );
  });

  it('COORDINADOR_PSI no necesita permiso individual', async () => {
    await consultarRuta().set('x-test-role', 'COORDINADOR_PSI').expect(200);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('403 para un estudiante', async () => {
    await consultarRuta().set('x-test-role', 'ESTUDIANTE').expect(403);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('400 con un código de participante mal formado', async () => {
    await consultarRuta(
      '/admin/participantes/P_7F3A$/progresion-narrativa',
    ).expect(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it.each([
    ['INCONSISTENCIA_PARTICIPANTE' as const, 409],
    ['PARTICIPANTE_NO_ENCONTRADO' as const, 404],
    ['M06_NO_DISPONIBLE' as const, 503],
    ['ERROR_CONSULTA_NARRATIVA' as const, 500],
  ])(
    '%s responde %i con { status, codigo, mensaje }',
    async (codigo, status) => {
      consultar.mockRejectedValue(new SeguimientoIndividualException(codigo));
      const r = await consultarRuta().expect(status);
      expect(r.body).toMatchObject({ status, codigo });
    },
  );

  it('503 con el cuerpo del contrato', async () => {
    consultar.mockRejectedValue(
      new SeguimientoIndividualException('M06_NO_DISPONIBLE'),
    );
    const r = await consultarRuta().expect(503);
    expect(r.body).toEqual({
      status: 503,
      codigo: 'M06_NO_DISPONIBLE',
      mensaje:
        'El módulo de gamificación no se encuentra disponible en este momento.',
    });
  });
});
