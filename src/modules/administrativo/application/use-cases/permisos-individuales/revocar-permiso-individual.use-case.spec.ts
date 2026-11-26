import type { Prisma } from '@prisma/client';
import {
  type DatosPermisoIndividual,
  PermisoIndividual,
} from '../../../domain/entities/permiso-individual/permiso-individual.entity';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import type { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import type { AuditoriaService } from '../../services/auditoria.service';
import { RevocarPermisoIndividualUseCase } from './revocar-permiso-individual.use-case';

describe('RevocarPermisoIndividualUseCase', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'c0000000-0000-4000-8000-000000000001',
    idSesion: null,
    direccionIp: '127.0.0.1',
  };
  const idPermiso = '11111111-1111-4111-8111-111111111111';
  const datos: DatosPermisoIndividual = {
    id_permiso: idPermiso,
    id_usuario_beneficiario: 'a0000000-0000-4000-8000-000000000002',
    codigo_participante: 'P-7F3A91C2',
    alcance: AlcancePermiso.ACCESO_INDIVIDUAL,
    fecha_inicio_vigencia: new Date('2026-11-23T03:00:00Z'),
    fecha_fin_vigencia: null,
    revocado_en: null,
  };

  let repo: Record<keyof PermisosIndividualesRepository, jest.Mock>;
  let accionAuditada: AccionAuditable | undefined;
  let useCase: RevocarPermisoIndividualUseCase;

  beforeEach(() => {
    repo = {
      buscarIdParticipante: jest.fn(),
      cerrarVencidos: jest.fn(),
      otorgar: jest.fn(),
      listar: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue({
        permiso: new PermisoIndividual(datos),
        id_participante: 'e0000000-0000-4000-8000-000000000003',
      }),
      revocar: jest.fn().mockResolvedValue(
        new PermisoIndividual({
          ...datos,
          revocado_en: new Date('2026-11-23T03:10:00Z'),
        }),
      ),
      tieneVigente: jest.fn(),
      listarBeneficiarios: jest.fn(),
    };
    const auditoria = {
      ejecutar: jest.fn(
        async (
          _ctx: ContextoAuditoria,
          accion: AccionAuditable,
          operacion: (t: Prisma.TransactionClient) => Promise<unknown>,
        ) => {
          const resultado = await operacion(tx);
          accionAuditada = accion;
          return resultado;
        },
      ),
    };
    useCase = new RevocarPermisoIndividualUseCase(
      repo as PermisosIndividualesRepository,
      auditoria as unknown as AuditoriaService,
    );
  });

  it('revoca, bloqueando la fila, y audita con severidad ALTA', async () => {
    await expect(useCase.execute(ctx, idPermiso)).resolves.toEqual({
      id_permiso: idPermiso,
      vigente: false,
      revocado_en: '2026-11-23T03:10:00.000Z',
    });
    expect(repo.buscarPorId).toHaveBeenCalledWith(tx, idPermiso, true);
    expect(accionAuditada).toMatchObject({
      accion: 'GESTION_PERMISO_INDIVIDUAL',
      idRecurso: idPermiso,
      severidad: 'ALTA',
      idParticipante: 'e0000000-0000-4000-8000-000000000003',
      detalle: { operacion: 'REVOCAR' },
    });
  });

  it('responde 404 si el permiso no existe', async () => {
    repo.buscarPorId.mockResolvedValue(null);
    await expect(useCase.execute(ctx, idPermiso)).rejects.toMatchObject({
      codigo: 'PERMISO_NO_ENCONTRADO',
      status: 404,
    });
  });

  it('responde 409 si el permiso ya fue revocado', async () => {
    repo.buscarPorId.mockResolvedValue({
      permiso: new PermisoIndividual({
        ...datos,
        revocado_en: new Date('2026-11-23T03:05:00Z'),
      }),
      id_participante: 'e0000000-0000-4000-8000-000000000003',
    });
    const error = await useCase
      .execute(ctx, idPermiso)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PermisoIndividualException);
    expect((error as PermisoIndividualException).getStatus()).toBe(409);
    expect((error as PermisoIndividualException).getResponse()).toEqual({
      status: 409,
      codigo: 'PERMISO_YA_REVOCADO',
      mensaje: 'El permiso ya fue revocado.',
    });
    expect(repo.revocar).not.toHaveBeenCalled();
  });
});
