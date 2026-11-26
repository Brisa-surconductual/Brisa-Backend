import type { Prisma } from '@prisma/client';
import type { PermisosIndividualesRepository } from '../../../domain/repositories/permisos-individuales.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { AuditoriaService } from '../../services/auditoria.service';
import { ListarBeneficiariosPermisoUseCase } from './listar-beneficiarios-permiso.use-case';

describe('ListarBeneficiariosPermisoUseCase', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'c0000000-0000-4000-8000-000000000001',
    idSesion: null,
    direccionIp: '127.0.0.1',
  };

  const construir = (listarBeneficiarios: jest.Mock) => {
    const ejecutar = jest.fn(
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
    );
    return {
      ejecutar,
      caso: new ListarBeneficiariosPermisoUseCase(
        { listarBeneficiarios } as unknown as PermisosIndividualesRepository,
        { ejecutar } as unknown as AuditoriaService,
      ),
    };
  };

  it('audita la consulta y pasa la página al repositorio', async () => {
    const listarBeneficiarios = jest
      .fn()
      .mockResolvedValue({ items: [], total: 0 });
    const { caso, ejecutar } = construir(listarBeneficiarios);

    await caso.execute(ctx, { offset: 20, limit: 10 });

    expect(ejecutar).toHaveBeenCalledTimes(1);
    expect(listarBeneficiarios).toHaveBeenCalledWith(tx, {
      offset: 20,
      limit: 10,
    });
  });

  it('devuelve solo id_usuario y correo_electronico con la paginación', async () => {
    const listarBeneficiarios = jest.fn().mockResolvedValue({
      items: [
        {
          id_usuario: 'a0000000-0000-4000-8000-000000000002',
          correo_electronico: 'ana@usco.edu.co',
          contrasena_hash: 'no-debe-salir',
        },
      ],
      total: 41,
    });
    const { caso } = construir(listarBeneficiarios);

    const respuesta = await caso.execute(ctx, { offset: 0, limit: 20 });

    expect(respuesta).toEqual({
      items: [
        {
          id_usuario: 'a0000000-0000-4000-8000-000000000002',
          correo_electronico: 'ana@usco.edu.co',
        },
      ],
      total: 41,
      offset: 0,
      limit: 20,
    });
  });

  it('un fallo de persistencia sale con el código de permisos', async () => {
    const listarBeneficiarios = jest.fn().mockRejectedValue(new Error('db'));
    const ejecutar = jest.fn(
      (
        _c: unknown,
        _a: unknown,
        op: (t: Prisma.TransactionClient) => unknown,
      ) => Promise.resolve().then(() => op(tx)),
    );
    const caso = new ListarBeneficiariosPermisoUseCase(
      { listarBeneficiarios } as unknown as PermisosIndividualesRepository,
      { ejecutar } as unknown as AuditoriaService,
    );

    await expect(
      caso.execute(ctx, { offset: 0, limit: 20 }),
    ).rejects.toMatchObject({ codigo: 'ERROR_PERSISTENCIA_PERMISOS' });
  });
});
