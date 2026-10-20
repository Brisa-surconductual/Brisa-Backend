import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaModalidadProgramaRepository } from './prisma-modalidad-programa.repository';

describe('PrismaModalidadProgramaRepository', () => {
  const findMany = jest.fn();

  const repositorio = new PrismaModalidadProgramaRepository({
    tipo_terapia: { findMany },
  } as unknown as PrismaService);

  beforeEach(() => {
    findMany.mockReset();
  });

  const asignacion = (perfilCompleto: boolean | null, idUsuario: string) => ({
    id_usuario: idUsuario,
    modalidad: 'GRUPAL',
    usuarios_tipo_terapia_id_usuarioTousuarios: {
      rol: 'ESTUDIANTE',
      estado_cuenta: 'ACTIVA',
      perfil_clinico:
        perfilCompleto === null
          ? null
          : { perfil_completo: perfilCompleto },
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
        id_usuario: true,
        modalidad: true,
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

    expect(resultado).toEqual([{
      idUsuario: 'usuario-1',
      modalidad: 'GRUPAL',
      rol: 'ESTUDIANTE',
      estadoCuenta: 'ACTIVA',
      perfilCompleto: true,
    }]);
  });

  it('considera incompleto un perfil inexistente o incompleto', async () => {
    findMany.mockResolvedValue([
      asignacion(null, 'usuario-2'),
      asignacion(false, 'usuario-3'),
    ]);

    const resultado =
      await repositorio.listarAsignacionesVigentesPorPrograma(12);

    expect(resultado.map((usuario) => usuario.perfilCompleto))
      .toEqual([false, false]);
  });

  it('devuelve un arreglo vacio cuando no hay asignaciones', async () => {
    findMany.mockResolvedValue([]);

    await expect(
      repositorio.listarAsignacionesVigentesPorPrograma(99),
    ).resolves.toEqual([]);
  });
});
