import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SeudonimoParticipantePort } from '../../application/ports/seudonimo-participante.port';

/**
 * Seudónimos de `administrativo.seudonimos_participante` (M-8, B3).
 * `obtener` usa `administrativo.fn_obtener_codigo_participante`, que crea el
 * código si falta. `resolver` NO usa esa función (no es su inversa): lee la
 * tabla por `codigo_participante`, que tiene índice único (`uq_seudonimo_codigo`).
 */
@Injectable()
export class PrismaSeudonimoParticipanteAdapter implements SeudonimoParticipantePort {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(idUsuario: string): Promise<string> {
    const [fila] = await this.prisma.$queryRaw<{ codigo: string }[]>`
      SELECT administrativo.fn_obtener_codigo_participante(${idUsuario}::uuid) AS codigo`;
    return fila.codigo;
  }

  async resolver(codigoParticipante: string): Promise<string | null> {
    const filas = await this.prisma.$queryRaw<{ id_usuario: string }[]>`
      SELECT s.id_usuario::text AS id_usuario
        FROM administrativo.seudonimos_participante s
       WHERE s.codigo_participante = ${codigoParticipante}`;
    return filas.length === 1 ? filas[0].id_usuario : null;
  }
}
