import type { Prisma } from '@prisma/client';
import { PermisoIndividual } from '../../../domain/entities/permiso-individual/permiso-individual.entity';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import type { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { AccionAuditable } from '../../../domain/results/accion-auditable';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { NuevoPermisoIndividual } from '../../../domain/results/nuevo-permiso-individual';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import type { AuditoriaService } from '../../services/auditoria.service';
import { OtorgarPermisoIndividualUseCase } from './otorgar-permiso-individual.use-case';

describe('OtorgarPermisoIndividualUseCase', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'c0000000-0000-4000-8000-000000000001',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };
  const beneficiario = 'a0000000-0000-4000-8000-000000000002';
  const participante = 'e0000000-0000-4000-8000-000000000003';
  const dto = {
    codigo_participante: 'P-7F3A91C2',
    alcance: AlcancePermiso.ACCESO_INDIVIDUAL,
    fecha_fin_vigencia: '2099-12-31T23:59:59Z',
    id_usuario_beneficiario: beneficiario,
  };

  let repo: Record<keyof PermisosIndividualesRepository, jest.Mock>;
  let auditoria: { ejecutar: jest.Mock };
  let accionAuditada: AccionAuditable | undefined;
  let useCase: OtorgarPermisoIndividualUseCase;

  beforeEach(() => {
    repo = {
      buscarIdParticipante: jest.fn().mockResolvedValue(participante),
      cerrarVencidos: jest.fn().mockResolvedValue(undefined),
      otorgar: jest.fn((_tx: unknown, nuevo: NuevoPermisoIndividual) =>
        Promise.resolve(
          new PermisoIndividual({
            id_permiso: nuevo.id_permiso,
            id_usuario_beneficiario: nuevo.id_usuario_beneficiario,
            codigo_participante: dto.codigo_participante,
            alcance: nuevo.alcance,
            fecha_inicio_vigencia: new Date('2026-11-25T12:00:00Z'),
            fecha_fin_vigencia: nuevo.fecha_fin_vigencia,
            revocado_en: null,
          }),
        ),
      ),
      listar: jest.fn(),
      buscarPorId: jest.fn(),
      revocar: jest.fn(),
      tieneVigente: jest.fn(),
      listarBeneficiarios: jest.fn(),
    };
    auditoria = {
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
    accionAuditada = undefined;
    useCase = new OtorgarPermisoIndividualUseCase(
      repo as PermisosIndividualesRepository,
      auditoria as unknown as AuditoriaService,
    );
  });

  it('otorga el permiso y lo audita como GESTION_PERMISO_INDIVIDUAL con severidad ALTA', async () => {
    const respuesta = await useCase.execute(ctx, dto);

    expect(respuesta).toEqual({
      id_permiso: expect.any(String) as string,
      codigo_participante: 'P-7F3A91C2',
      alcance: 'ACCESO_INDIVIDUAL',
      fecha_inicio_vigencia: '2026-11-25T12:00:00.000Z',
      fecha_fin_vigencia: '2099-12-31T23:59:59.000Z',
      vigente: true,
    });
    expect(repo.cerrarVencidos).toHaveBeenCalledWith(
      tx,
      beneficiario,
      participante,
      'ACCESO_INDIVIDUAL',
      ctx,
    );
    expect(repo.otorgar).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        id_permiso: respuesta.id_permiso,
        id_participante: participante,
        otorgado_por: ctx.idUsuario,
      }),
    );
    expect(accionAuditada).toMatchObject({
      accion: 'GESTION_PERMISO_INDIVIDUAL',
      recurso: 'PERMISO_INDIVIDUAL',
      idRecurso: respuesta.id_permiso,
      severidad: 'ALTA',
      idParticipante: participante,
      detalle: { operacion: 'OTORGAR' },
    });
  });

  it('acepta un permiso sin fecha de fin', async () => {
    const respuesta = await useCase.execute(ctx, {
      ...dto,
      fecha_fin_vigencia: undefined,
    });
    expect(respuesta.fecha_fin_vigencia).toBeNull();
  });

  const codigoDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PermisoIndividualException);
    return {
      status: (error as PermisoIndividualException).getStatus(),
      codigo: (error as PermisoIndividualException).codigo,
    };
  };

  it('rechaza la autoconcesión con 422', async () => {
    await expect(
      codigoDe(
        useCase.execute(ctx, {
          ...dto,
          id_usuario_beneficiario: ctx.idUsuario!,
        }),
      ),
    ).resolves.toEqual({ status: 422, codigo: 'AUTOCONCESION_NO_PERMITIDA' });
    expect(repo.otorgar).not.toHaveBeenCalled();
  });

  it('rechaza una vigencia vencida con 422', async () => {
    await expect(
      codigoDe(
        useCase.execute(ctx, {
          ...dto,
          fecha_fin_vigencia: '2020-01-01T00:00:00Z',
        }),
      ),
    ).resolves.toEqual({ status: 422, codigo: 'VIGENCIA_INVALIDA' });
  });

  it('responde 404 si el participante no existe', async () => {
    repo.buscarIdParticipante.mockResolvedValue(null);
    await expect(codigoDe(useCase.execute(ctx, dto))).resolves.toEqual({
      status: 404,
      codigo: 'PARTICIPANTE_NO_ENCONTRADO',
    });
    expect(repo.otorgar).not.toHaveBeenCalled();
  });

  it('propaga el 409 de un permiso ya vigente', async () => {
    repo.otorgar.mockRejectedValue(
      new PermisoIndividualException('PERMISO_YA_VIGENTE'),
    );
    await expect(codigoDe(useCase.execute(ctx, dto))).resolves.toEqual({
      status: 409,
      codigo: 'PERMISO_YA_VIGENTE',
    });
  });

  it('traduce un error inesperado a 500', async () => {
    repo.otorgar.mockRejectedValue(new Error('caida'));
    await expect(codigoDe(useCase.execute(ctx, dto))).resolves.toEqual({
      status: 500,
      codigo: 'ERROR_PERSISTENCIA_PERMISOS',
    });
  });
});
