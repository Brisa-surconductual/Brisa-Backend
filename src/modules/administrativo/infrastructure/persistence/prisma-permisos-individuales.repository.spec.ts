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

  describe('listar (BE-336)', () => {
    const ahora = new Date('2026-11-25T12:00:00Z');
    const fila = {
      id_permiso: '1c9e7a2b-3d4f-4a5b-8c6d-7e8f9a0b1c2d',
      id_usuario_beneficiario: nuevo.id_usuario_beneficiario,
      id_participante: nuevo.id_participante,
      codigo_participante: 'P-7F3A91C2',
      alcance: AlcancePermiso.ACCESO_INDIVIDUAL,
      fecha_inicio_vigencia: new Date('2026-11-23T03:00:00Z'),
      fecha_fin_vigencia: null,
      revocado_en: null,
      correo_beneficiario: 'ana@usco.edu.co',
    };
    const filtro = { solo_vigentes: true, offset: 0, limit: 20 };
    const consultas = (queryRaw: jest.Mock): string[] =>
      (queryRaw.mock.calls as [Prisma.Sql][]).map(([consulta]) => consulta.sql);

    it('trae el correo del beneficiario en la misma consulta de filas (sin N+1)', async () => {
      const queryRaw = jest
        .fn()
        .mockResolvedValueOnce([{ total: 1, ahora }])
        .mockResolvedValueOnce([fila]);
      const tx = { $queryRaw: queryRaw } as unknown as Prisma.TransactionClient;

      const resultado = await repo.listar(tx, filtro);

      expect(queryRaw).toHaveBeenCalledTimes(2);
      expect(resultado.total).toBe(1);
      expect(resultado.items).toHaveLength(1);
      expect(resultado.items[0].correo_beneficiario).toBe('ana@usco.edu.co');
      expect(resultado.items[0].permiso.id_usuario_beneficiario).toBe(
        nuevo.id_usuario_beneficiario,
      );
    });

    it('el JOIN con usuarios va solo en la consulta de filas', async () => {
      const queryRaw = jest
        .fn()
        .mockResolvedValueOnce([{ total: 0, ahora }])
        .mockResolvedValueOnce([]);
      const tx = { $queryRaw: queryRaw } as unknown as Prisma.TransactionClient;

      await repo.listar(tx, filtro);
      const [conteo, filas] = consultas(queryRaw);

      expect(conteo).not.toContain('usuario.usuarios');
      expect(filas).toContain(
        'JOIN usuario.usuarios b ON b.id_usuario = p.id_usuario_administrativo',
      );
      expect(filas).toContain('b.correo_electronico AS correo_beneficiario');
      expect(filas).toContain('ORDER BY p.fecha_creacion DESC, p.id_permiso');
    });

    it('sin filas devuelve una lista vacía con el reloj de la base', async () => {
      const queryRaw = jest
        .fn()
        .mockResolvedValueOnce([{ total: 0, ahora }])
        .mockResolvedValueOnce([]);
      const tx = { $queryRaw: queryRaw } as unknown as Prisma.TransactionClient;

      await expect(repo.listar(tx, filtro)).resolves.toEqual({
        items: [],
        total: 0,
        ahora,
      });
    });
  });

  describe('listarBeneficiarios (BE-336)', () => {
    const construir = (usuarios: object[], total: number) => {
      const findMany = jest.fn().mockResolvedValue(usuarios);
      const count = jest.fn().mockResolvedValue(total);
      const tx = {
        usuarios: { findMany, count },
      } as unknown as Prisma.TransactionClient;
      return { tx, findMany, count };
    };
    const DONDE = { rol: 'ADMINISTRATIVO', estado_cuenta: 'ACTIVA' };

    it('consulta solo ADMINISTRATIVO activos, con select de 2 campos, orden estable y paginación', async () => {
      const { tx, findMany, count } = construir([], 0);

      await repo.listarBeneficiarios(tx, { offset: 20, limit: 10 });

      expect(findMany).toHaveBeenCalledWith({
        where: DONDE,
        select: { id_usuario: true, correo_electronico: true },
        orderBy: { correo_electronico: 'asc' },
        skip: 20,
        take: 10,
      });
      expect(count).toHaveBeenCalledWith({ where: DONDE });
    });

    it('devuelve solo id_usuario y correo_electronico aunque la fila traiga más', async () => {
      const { tx } = construir(
        [
          {
            id_usuario: 'a0000000-0000-4000-8000-000000000002',
            correo_electronico: 'ana@usco.edu.co',
            contrasena_hash: 'no-debe-salir',
          },
        ],
        1,
      );

      await expect(
        repo.listarBeneficiarios(tx, { offset: 0, limit: 20 }),
      ).resolves.toEqual({
        items: [
          {
            id_usuario: 'a0000000-0000-4000-8000-000000000002',
            correo_electronico: 'ana@usco.edu.co',
          },
        ],
        total: 1,
      });
    });

    it('un fallo de la base sale como ERROR_PERSISTENCIA_PERMISOS', async () => {
      const tx = {
        usuarios: {
          findMany: jest.fn().mockRejectedValue(new Error('db')),
          count: jest.fn(),
        },
      } as unknown as Prisma.TransactionClient;

      const error = await repo
        .listarBeneficiarios(tx, { offset: 0, limit: 20 })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PermisoIndividualException);
      expect((error as PermisoIndividualException).codigo).toBe(
        'ERROR_PERSISTENCIA_PERMISOS',
      );
    });
  });
});
