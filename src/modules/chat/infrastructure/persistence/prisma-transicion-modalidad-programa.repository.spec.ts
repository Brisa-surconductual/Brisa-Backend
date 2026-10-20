import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaTransicionModalidadProgramaRepository } from './prisma-transicion-modalidad-programa.repository';

describe('PrismaTransicionModalidadProgramaRepository', () => {
  const tx = {
    tipo_terapia: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const transaccion = jest.fn(
    async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
      operacion(tx),
  );

  const prisma = {
    $transaction: transaccion,
  } as unknown as PrismaService;

  const repositorio = new PrismaTransicionModalidadProgramaRepository(prisma);

  const solicitud = {
    idPrograma: 12,
    idAdministrador: '00000000-0000-4000-8000-000000000001',
  };

  const asignacion = (
    idUsuario: string,
    perfilCompleto = true,
    modalidad = 'GRUPAL',
  ) => ({
    id_usuario: idUsuario,
    modalidad,
    usuarios_tipo_terapia_id_usuarioTousuarios: {
      rol: 'ESTUDIANTE',
      estado_cuenta: 'ACTIVA',
      perfil_clinico: {
        perfil_completo: perfilCompleto,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    tx.tipo_terapia.findMany.mockResolvedValue([
      asignacion('usuario-1'),
      asignacion('usuario-2'),
    ]);
    tx.tipo_terapia.updateMany.mockResolvedValue({ count: 2 });
    tx.tipo_terapia.createMany.mockResolvedValue({ count: 2 });

    transaccion.mockImplementation(
      async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
        operacion(tx),
    );
  });

  it('actualiza las vigencias y registra el administrador', async () => {
    const resultado = await repositorio.habilitarPersonalizada(solicitud);

    expect(resultado).toMatchObject({
      idPrograma: 12,
      modalidad: 'PERSONALIZADA',
      usuariosActualizados: 2,
      administradorResponsable: solicitud.idAdministrador,
    });

    expect(resultado.fechaVigenciaDesde).toBeInstanceOf(Date);

    expect(tx.tipo_terapia.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.tipo_terapia.createMany).toHaveBeenCalledTimes(1);

    const cierre =
      tx.tipo_terapia.updateMany.mock.calls[0][0];

    const creacion =
      tx.tipo_terapia.createMany.mock.calls[0][0];

    expect(cierre.where).toMatchObject({
      id_programa: 12,
      fecha_vigencia_hasta: null,
      modalidad: 'GRUPAL',
    });

    expect(creacion.data).toHaveLength(2);

    for (const fila of creacion.data) {
      expect(fila).toMatchObject({
        id_programa: 12,
        modalidad: 'PERSONALIZADA',
        administrador_responsable: solicitud.idAdministrador,
      });

      expect(fila.fecha_vigencia_desde)
        .toEqual(cierre.data.fecha_vigencia_hasta);
    }

    expect(transaccion).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  });

  it('rechaza perfiles incompletos sin escribir datos', async () => {
    tx.tipo_terapia.findMany.mockResolvedValue([
      asignacion('usuario-1', true),
      asignacion('usuario-2', false),
    ]);

    await expect(
      repositorio.habilitarPersonalizada(solicitud),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.tipo_terapia.updateMany).not.toHaveBeenCalled();
    expect(tx.tipo_terapia.createMany).not.toHaveBeenCalled();
  });

  it('rechaza programas sin asignaciones vigentes', async () => {
    tx.tipo_terapia.findMany.mockResolvedValue([]);

    await expect(
      repositorio.habilitarPersonalizada(solicitud),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.tipo_terapia.updateMany).not.toHaveBeenCalled();
    expect(tx.tipo_terapia.createMany).not.toHaveBeenCalled();
  });

  it('rechaza modalidades mixtas sin escribir', async () => {
    tx.tipo_terapia.findMany.mockResolvedValue([
      asignacion('usuario-1'),
      asignacion('usuario-2', true, 'PERSONALIZADA'),
    ]);

    await expect(
      repositorio.habilitarPersonalizada(solicitud),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.tipo_terapia.updateMany).not.toHaveBeenCalled();
    expect(tx.tipo_terapia.createMany).not.toHaveBeenCalled();
  });

  it('rechaza un cierre parcial antes de crear registros', async () => {
    tx.tipo_terapia.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      repositorio.habilitarPersonalizada(solicitud),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.tipo_terapia.createMany).not.toHaveBeenCalled();
  });

  it('reintenta la transaccion ante un conflicto P2034', async () => {
    const conflicto = new Prisma.PrismaClientKnownRequestError(
      'Conflicto de serializacion',
      {
        code: 'P2034',
        clientVersion: 'test',
      },
    );

    transaccion.mockRejectedValueOnce(conflicto);

    const resultado = await repositorio.habilitarPersonalizada(solicitud);

    expect(resultado.usuariosActualizados).toBe(2);
    expect(transaccion).toHaveBeenCalledTimes(2);
  });

  it("no modifica asignaciones de participantes bloqueados", async () => {
    const bloqueado = asignacion("usuario-bloqueado", false);
    bloqueado.usuarios_tipo_terapia_id_usuarioTousuarios.estado_cuenta =
      "BLOQUEADA";

    tx.tipo_terapia.findMany.mockResolvedValue([
      asignacion("usuario-1"),
      bloqueado,
    ]);

    tx.tipo_terapia.updateMany.mockResolvedValue({ count: 1 });
    tx.tipo_terapia.createMany.mockResolvedValue({ count: 1 });

    const resultado = await repositorio.habilitarPersonalizada(solicitud);

    expect(resultado.usuariosActualizados).toBe(1);
    expect(
      tx.tipo_terapia.updateMany.mock.calls[0][0].where.id_usuario.in,
    ).toEqual(["usuario-1"]);
    expect(tx.tipo_terapia.createMany.mock.calls[0][0].data)
      .toHaveLength(1);
  });

});
