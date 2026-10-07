import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CondicionesInicializacionUsuario } from '../../domain/entities/condiciones-inicializacion-usuario.entity';
import { CondicionesInicializacionUsuarioRepository } from '../../domain/repositories/condiciones-inicializacion-usuario.repository';
import { CondicionesInicializacionUsuarioMapper } from '../mappers/condiciones-inicializacion-usuario.mapper';

@Injectable()
export class PrismaCondicionesInicializacionUsuarioRepository implements CondicionesInicializacionUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorUsuario(
    idUsuario: string,
  ): Promise<CondicionesInicializacionUsuario | null> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        rol: true,
        estado_registro: true,
        consentimiendo_aceptado: true,
        id_consentimiento: true,
        linea_base: {
          select: { id_linea_base: true },
        },
      },
    });

    return usuario
      ? CondicionesInicializacionUsuarioMapper.toDomain(usuario)
      : null;
  }

  async buscarUsuariosElegiblesSinCronograma(
    limite: number,
  ): Promise<string[]> {
    const usuarios = await this.prisma.usuarios.findMany({
      where: {
        rol: 'ESTUDIANTE',
        estado_registro: 'REGISTRO_COMPLETO',
        consentimiendo_aceptado: true,
        id_consentimiento: { not: null },
        linea_base: { isNot: null },
        cronogramas_usuario: { is: null },
      },
      orderBy: { fecha_registro: 'asc' },
      take: limite,
      select: { id_usuario: true },
    });

    return usuarios.map((usuario) => usuario.id_usuario);
  }
}
