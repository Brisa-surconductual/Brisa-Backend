import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SeudonimoParticipantePort } from '../../application/ports/seudonimo-participante.port';

/** Usa `administrativo.fn_obtener_codigo_participante` (M-8, B3). */
@Injectable()
export class PrismaSeudonimoParticipanteAdapter implements SeudonimoParticipantePort {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(idUsuario: string): Promise<string> {
    const [fila] = await this.prisma.$queryRaw<{ codigo: string }[]>`
      SELECT administrativo.fn_obtener_codigo_participante(${idUsuario}::uuid) AS codigo`;
    return fila.codigo;
  }
}
