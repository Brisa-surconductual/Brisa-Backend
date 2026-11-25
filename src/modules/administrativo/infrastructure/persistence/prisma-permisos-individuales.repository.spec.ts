import { Prisma } from '@prisma/client';
import { PermisoIndividualException } from '../../application/exceptions/permiso-individual.exception';
import { AlcancePermiso } from '../../domain/enums/alcance-permiso.enum';
import { PrismaPermisosIndividualesRepository } from './prisma-permisos-individuales.repository';

const errorSql = (originalCode: string, originalMessage: string) =>
  new Prisma.PrismaClientKnownRequestError('fallo', {
    code: 'P2010',
    clientVersion: 'test',
    meta: { driverAdapterError: { cause: { originalCode, originalMessage } } },
  });

describe('PrismaPermisosIndividualesRepository', () => {
  const repo = new PrismaPermisosIndividualesRepository();
  const nuevo = {
    id_permiso: '11111111-1111-4111-8111-111111111111',
    id_usuario_beneficiario: 'a0000000-0000-4000-8000-000000000002',
    id_participante: 'e0000000-0000-4000-8000-000000000003',
    alcance: AlcancePermiso.ACCESO_INDIVIDUAL,
    fecha_fin_vigencia: null,
    otorgado_por: 'c0000000-0000-4000-8000-000000000001',
  };

  it.each([
    ['23505', 'duplicate key value', 409, 'PERMISO_YA_VIGENTE'],
    ['AD422', 'ROL_INVALIDO', 422, 'ROL_INVALIDO_PARA_OPERACION'],
    ['AD422', 'AUTOCONCESION_NO_PERMITIDA', 422, 'AUTOCONCESION_NO_PERMITIDA'],
    ['AD409', 'PERMISO_YA_REVOCADO', 409, 'PERMISO_YA_REVOCADO'],
    ['XX000', 'otro', 500, 'ERROR_PERSISTENCIA_PERMISOS'],
  ])('traduce %s/%s a %i %s', async (estado, mensaje, status, codigo) => {
    const tx = {
      $queryRaw: jest.fn().mockRejectedValue(errorSql(estado, mensaje)),
    } as unknown as Prisma.TransactionClient;
    const error = await repo.otorgar(tx, nuevo).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PermisoIndividualException);
    expect((error as PermisoIndividualException).getStatus()).toBe(status);
    expect((error as PermisoIndividualException).codigo).toBe(codigo);
  });

  it('tieneVigente devuelve false si el participante no existe', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
    } as unknown as Prisma.TransactionClient;
    await expect(
      repo.tieneVigente(
        tx,
        nuevo.id_usuario_beneficiario,
        { codigo: 'P-X' },
        AlcancePermiso.ACCESO_INDIVIDUAL,
      ),
    ).resolves.toBe(false);
  });
});
