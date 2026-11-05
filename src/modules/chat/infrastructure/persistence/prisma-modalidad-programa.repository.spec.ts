import { PrismaService } from '../../../../../prisma/prisma.service';
import { AsignacionModalidad } from '../../domain/entities/modalidad/asignacion-modalidad.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { TransicionConcurrenteException } from '../../domain/exceptions';
import { PrismaModalidadProgramaRepository } from './prisma-modalidad-programa.repository';

describe('PrismaModalidadProgramaRepository', () => {
  const findMany = jest.fn();
  const updateMany = jest.fn();
  const createMany = jest.fn();
  const transaccion = jest.fn();

  const tx = { tipo_terapia: { updateMany, createMany } };

  const repositorio = new PrismaModalidadProgramaRepository({
    tipo_terapia: { findMany },
    $transaction: transaccion,
  } as unknown as PrismaService);

  beforeEach(() => {
    findMany.mockReset();
    updateMany.mockReset();
    createMany.mockReset();
    transaccion.mockReset();
    transaccion.mockImplementation(
      async (operacion: (cliente: typeof tx) => Promise<unknown>) =>
        operacion(tx),
    );
  });

  const asignacion = (perfilCompleto: boolean | null, idUsuario: string) => ({
    id_tipo_terapia: `asignacion-${idUsuario}`,
    id_usuario: idUsuario,
    id_programa: 12,
    modalidad: 'GRUPAL',
    fecha_vigencia_desde: new Date('2026-10-01T00:00:00Z'),
    administrador_responsable: null,
    usuarios_tipo_terapia_id_usuarioTousuarios: {
      rol: 'ESTUDIANTE',
      estado_cuenta: 'ACTIVA',
      perfil_clinico:
        perfilCompleto === null ? null : { perfil_completo: perfilCompleto },
    },
  });

  it('consulta exclusivamente las asignaciones vigentes del programa', async () => {
    findMany.mockResolvedValue([]);

    await repositorio.listarAsignacionesVigentesPorPrograma(12);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        id_programa: 12,
        fecha_vigencia_hasta: null,
      },
      select: {
        id_tipo_terapia: true,
        id_usuario: true,
        id_programa: true,
        modalidad: true,
        fecha_vigencia_desde: true,
        administrador_responsable: true,
        usuarios_tipo_terapia_id_usuarioTousuarios: {
          select: {
            rol: true,
            estado_cuenta: true,
            perfil_clinico: {
              select: { perfil_completo: true },
            },
          },
        },
      },
    });
  });

  it('mapea correctamente un perfil completo', async () => {
    findMany.mockResolvedValue([asignacion(true, 'usuario-1')]);

    const resultado =
      await repositorio.listarAsignacionesVigentesPorPrograma(12);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      idUsuario: 'usuario-1',
      modalidad: 'GRUPAL',
      esEstudiante: true,
      cuentaActiva: true,
      perfilCompleto: true,
    });
    expect(resultado[0].asignacion.idAsignacion).toBe('asignacion-usuario-1');
    expect(resultado[0].asignacion.vigente).toBe(true);
  });

  it('considera incompleto un perfil inexistente o incompleto', async () => {
    findMany.mockResolvedValue([
      asignacion(null, 'usuario-2'),
      asignacion(false, 'usuario-3'),
    ]);

    const resultado =
      await repositorio.listarAsignacionesVigentesPorPrograma(12);

    expect(resultado.map((usuario) => usuario.perfilCompleto)).toEqual([
      false,
      false,
    ]);
  });

  it('devuelve un arreglo vacio cuando no hay asignaciones', async () => {
    findMany.mockResolvedValue([]);

    await expect(
      repositorio.listarAsignacionesVigentesPorPrograma(99),
    ).resolves.toEqual([]);
  });
  describe('guardarAsignaciones', () => {
    const fecha = new Date('2026-10-20T12:00:00Z');
    const grupal = new AsignacionModalidad(
      'asignacion-1',
      'usuario-1',
      12,
      ModalidadConversacional.GRUPAL,
      new Date('2026-10-01T00:00:00Z'),
    );
    const { cerrada, nueva } = grupal.habilitarPersonalizada(
      'asignacion-2',
      fecha,
      'admin-1',
    );

    it('cierra la asignacion vigente y crea la nueva en una transaccion', async () => {
      updateMany.mockResolvedValue({ count: 1 });
      createMany.mockResolvedValue({ count: 1 });

      await repositorio.guardarAsignaciones([cerrada, nueva]);

      expect(updateMany).toHaveBeenCalledWith({
        where: { id_tipo_terapia: 'asignacion-1', fecha_vigencia_hasta: null },
        data: { fecha_vigencia_hasta: fecha },
      });
      expect(createMany).toHaveBeenCalledWith({
        data: [
          {
            id_tipo_terapia: 'asignacion-2',
            id_usuario: 'usuario-1',
            id_programa: 12,
            modalidad: ModalidadConversacional.PERSONALIZADA,
            fecha_vigencia_desde: fecha,
            administrador_responsable: 'admin-1',
          },
        ],
      });
    });

    it('lanza TransicionConcurrenteException si la asignacion ya no estaba vigente', async () => {
      updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repositorio.guardarAsignaciones([cerrada, nueva]),
      ).rejects.toBeInstanceOf(TransicionConcurrenteException);

      expect(createMany).not.toHaveBeenCalled();
    });
  });
});
