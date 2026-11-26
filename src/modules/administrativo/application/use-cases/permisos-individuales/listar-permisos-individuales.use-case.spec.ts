import type { Prisma } from '@prisma/client';
import { PermisoIndividual } from '../../../domain/entities/permiso-individual/permiso-individual.entity';
import { AlcancePermiso } from '../../../domain/enums/alcance-permiso.enum';
import type { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { PermisoIndividualException } from '../../exceptions/permiso-individual.exception';
import type { AuditoriaService } from '../../services/auditoria.service';
import { ListarPermisosIndividualesUseCase } from './listar-permisos-individuales.use-case';

describe('ListarPermisosIndividualesUseCase', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'c0000000-0000-4000-8000-000000000001',
    idSesion: null,
    direccionIp: '127.0.0.1',
  };

  it('pagina y calcula la vigencia con el reloj de la base', async () => {
    const ahora = new Date('2026-11-25T12:00:00Z');
    const permiso = (id: string, fin: Date | null) =>
      new PermisoIndividual({
        id_permiso: id,
        id_usuario_beneficiario: 'a0000000-0000-4000-8000-000000000002',
        codigo_participante: 'P-7F3A91C2',
        alcance: AlcancePermiso.ACCESO_INDIVIDUAL,
        fecha_inicio_vigencia: new Date('2026-11-23T03:00:00Z'),
        fecha_fin_vigencia: fin,
        revocado_en: null,
      });
    const listar = jest.fn().mockResolvedValue({
      items: [
        permiso('p1', null),
        permiso('p2', new Date('2026-11-24T00:00:00Z')),
      ],
      total: 7,
      ahora,
    });
    const repo = { listar } as unknown as PermisosIndividualesRepository;
    const auditoria = {
      ejecutar: jest.fn(
        (
          _c: unknown,
          accion: unknown,
          op: (t: Prisma.TransactionClient) => unknown,
        ) => {
          expect(accion).toMatchObject({
            accion: 'ACCESO_MODULO',
            recurso: 'PERMISOS_INDIVIDUALES',
          });
          return op(tx);
        },
      ),
    } as unknown as AuditoriaService;

    const filtro = { solo_vigentes: false, offset: 0, limit: 20 };
    const respuesta = await new ListarPermisosIndividualesUseCase(
      repo,
      auditoria,
    ).execute(ctx, filtro);

    expect(listar).toHaveBeenCalledWith(tx, filtro);
    expect(respuesta.total).toBe(7);
    expect(respuesta.offset).toBe(0);
    expect(respuesta.limit).toBe(20);
    expect(respuesta.items.map((i) => [i.id_permiso, i.vigente])).toEqual([
      ['p1', true],
      ['p2', false],
    ]);
    expect(respuesta.items[0]).toMatchObject({
      alcance: 'ACCESO_INDIVIDUAL',
      fecha_inicio_vigencia: '2026-11-23T03:00:00.000Z',
      fecha_fin_vigencia: null,
      revocado_en: null,
    });
  });

  describe('con codigo_participante (BE-336)', () => {
    const construir = (repo: object) => {
      const auditoria = {
        ejecutar: jest.fn(
          (
            _c: unknown,
            _accion: unknown,
            op: (t: Prisma.TransactionClient) => unknown,
          ) => op(tx),
        ),
      } as unknown as AuditoriaService;
      return new ListarPermisosIndividualesUseCase(
        repo as PermisosIndividualesRepository,
        auditoria,
      );
    };
    const filtro = {
      codigo_participante: 'P-00000000',
      solo_vigentes: true,
      offset: 0,
      limit: 20,
    };

    it('un código inexistente responde 404 como el POST y no lista', async () => {
      const listar = jest.fn();
      const buscarIdParticipante = jest.fn().mockResolvedValue(null);
      const caso = construir({ listar, buscarIdParticipante });

      const error = await caso.execute(ctx, filtro).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PermisoIndividualException);
      expect((error as PermisoIndividualException).getStatus()).toBe(404);
      expect((error as PermisoIndividualException).getResponse()).toEqual(
        new PermisoIndividualException(
          'PARTICIPANTE_NO_ENCONTRADO',
        ).getResponse(),
      );
      expect(buscarIdParticipante).toHaveBeenCalledWith(tx, 'P-00000000');
      expect(listar).not.toHaveBeenCalled();
    });

    it('un participante que existe sin permisos responde 200 con items vacío', async () => {
      const listar = jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        ahora: new Date('2026-11-25T12:00:00Z'),
      });
      const buscarIdParticipante = jest
        .fn()
        .mockResolvedValue('e0000000-0000-4000-8000-000000000003');
      const caso = construir({ listar, buscarIdParticipante });

      await expect(caso.execute(ctx, filtro)).resolves.toEqual({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      expect(listar).toHaveBeenCalledWith(tx, filtro);
    });

    it('sin codigo_participante no busca al participante', async () => {
      const listar = jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        ahora: new Date('2026-11-25T12:00:00Z'),
      });
      const buscarIdParticipante = jest.fn();
      const caso = construir({ listar, buscarIdParticipante });

      await caso.execute(ctx, { solo_vigentes: false, offset: 0, limit: 20 });

      expect(buscarIdParticipante).not.toHaveBeenCalled();
      expect(listar).toHaveBeenCalledTimes(1);
    });
  });
});
