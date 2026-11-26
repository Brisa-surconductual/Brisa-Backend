import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { AsignacionCronogramaChatRepository } from '../../domain/repositories/asignacion-cronograma-chat.repository';

@Injectable()
export class PrismaAsignacionCronogramaChatRepository implements AsignacionCronogramaChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existeAsignacion(idUsuario: string): Promise<boolean> {
    const asignacion = await this.prisma.cronogramas_usuario.findUnique({
      where: {
        id_usuario: idUsuario,
      },
      select: {
        id_cronograma_usuario: true,
      },
    });

    return asignacion !== null;
  }
}
