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
import { ExportacionIndividualException } from '../../../application/exceptions/exportacion-individual.exception';
import { AuditoriaService } from '../../../application/services/auditoria.service';
import { VerificarPermisoIndividualUseCase } from '../../../application/use-cases/permisos-individuales/verificar-permiso-individual.use-case';
import { ExportarSeguimientoIndividualUseCase } from '../../../application/use-cases/seguimiento-individual/exportar-seguimiento-individual.use-case';
import { PermisoIndividualGuard } from '../../guards/permiso-individual.guard';
import {
  ExportacionIndividualController,
  MENSAJE_SIN_PERMISO_EXPORTACION,
} from './exportacion-individual.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';
const RUTA = '/admin/participantes/P-7F3A91C2/exportacion.csv';
const CSV = '\uFEFForden_unidad_temporal,nombre_unidad\r\n3,Semana 3\r\n';

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

describe('GET /admin/participantes/:codigo/exportacion.csv (HTTP, RF-145)', () => {
  let app: INestApplication<App>;
  const exportar = jest.fn();
  const vigente = jest.fn();
  const registrarIntento = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ExportacionIndividualController],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        PermisoIndividualGuard,
        {
          provide: ExportarSeguimientoIndividualUseCase,
          useValue: { ejecutar: exportar },
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
    exportar.mockReset().mockResolvedValue({
      nombre: 'seguimiento_individual_20261122.csv',
      contenido: Buffer.from(CSV, 'utf8'),
    });
    vigente.mockReset().mockResolvedValue(true);
    registrarIntento.mockReset().mockResolvedValue(undefined);
  });

  afterAll(() => app?.close());

  const descargar = (ruta = RUTA) =>
    request(app.getHttpServer())
      .get(ruta)
      .buffer(true)
      .parse((res, callback) => {
        const partes: Buffer[] = [];
        res.on('data', (parte: Buffer) => partes.push(parte));
        res.on('end', () => callback(null, Buffer.concat(partes)));
      });

  it('200 con el CSV, los encabezados del contrato y el BOM, normalizando el código', async () => {
    const r = await descargar('/admin/participantes/p-7f3a91c2/exportacion.csv')
      .expect(200)
      .expect('Content-Type', 'text/csv; charset=utf-8')
      .expect(
        'Content-Disposition',
        'attachment; filename="seguimiento_individual_20261122.csv"',
      )
      .expect('Cache-Control', 'no-store');
    const cuerpo = r.body as Buffer;
    expect(cuerpo.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    expect(cuerpo.toString('utf8')).toBe(CSV);
    expect(exportar).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: ID_ADMIN }),
      'P-7F3A91C2',
      [],
    );
  });

  it('exige al ADMINISTRATIVO el alcance ACCESO_INDIVIDUAL sobre ese participante', async () => {
    await descargar().expect(200);
    expect(vigente).toHaveBeenCalledWith(
      ID_ADMIN,
      { codigo: 'P-7F3A91C2' },
      'ACCESO_INDIVIDUAL',
    );
  });

  it('403 SIN_PERMISO_INDIVIDUAL con el mensaje del contrato, sin exportar', async () => {
    vigente.mockResolvedValue(false);
    const r = await request(app.getHttpServer()).get(RUTA).expect(403);
    expect(r.body).toEqual({
      status: 403,
      codigo: 'SIN_PERMISO_INDIVIDUAL',
      mensaje: MENSAJE_SIN_PERMISO_EXPORTACION,
    });
    expect(exportar).not.toHaveBeenCalled();
    // El guard deja el intento en la bitácora.
    expect(registrarIntento).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ accion: 'INTENTO_ACCESO_NO_AUTORIZADO' }),
      'DENEGADA',
    );
  });

  it('COORDINADOR_PSI exporta sin permiso individual', async () => {
    await descargar().set('x-test-role', 'COORDINADOR_PSI').expect(200);
    expect(vigente).not.toHaveBeenCalled();
  });

  it('403 para un estudiante', async () => {
    await request(app.getHttpServer())
      .get(RUTA)
      .set('x-test-role', 'ESTUDIANTE')
      .expect(403);
    expect(exportar).not.toHaveBeenCalled();
  });

  it('parámetros para ampliar el contenido: 200 saneado y el caso de uso los recibe', async () => {
    await descargar(
      `${RUTA}?include_pii=true&texto_diario=1&columns=correo&foo=bar`,
    ).expect(200);
    expect(exportar).toHaveBeenCalledWith(expect.anything(), 'P-7F3A91C2', [
      'include_pii',
      'columns',
      'texto_diario',
    ]);
  });

  it('500 EXPORTACION_ABORTADA con el cuerpo del contrato', async () => {
    exportar.mockRejectedValue(
      new ExportacionIndividualException('EXPORTACION_ABORTADA'),
    );
    const r = await request(app.getHttpServer()).get(RUTA).expect(500);
    expect(r.body).toEqual({
      status: 500,
      codigo: 'EXPORTACION_ABORTADA',
      mensaje:
        'Ocurrió un error al procesar la exportación. La acción ha sido abortada por seguridad.',
    });
  });

  it.each([
    ['PARTICIPANTE_NO_ENCONTRADO' as const, 404],
    ['SIN_INDICADORES' as const, 422],
    ['M05_NO_DISPONIBLE' as const, 503],
  ])('%s responde %i', async (codigo, status) => {
    exportar.mockRejectedValue(new ExportacionIndividualException(codigo));
    const r = await request(app.getHttpServer()).get(RUTA).expect(status);
    expect(r.body).toMatchObject({ status, codigo });
  });

  it('400 con un código de participante mal formado', async () => {
    await request(app.getHttpServer())
      .get('/admin/participantes/P_7F$/exportacion.csv')
      .expect(400);
    expect(exportar).not.toHaveBeenCalled();
  });
});
