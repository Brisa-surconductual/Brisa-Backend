import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CalculoEstadoContenidoPort } from '../../application/ports/calculo-estado-contenido.port';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';

interface EstadoRow {
  estado: EstadoContenido;
}

@Injectable()
export class PrismaCalculoEstadoContenidoAdapter implements CalculoEstadoContenidoPort {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(fechaInicio: Date | null, fechaFin: Date | null): Promise<EstadoContenido> {
    const filas = await this.prisma.$queryRaw<EstadoRow[]>(Prisma.sql`
      SELECT cronograma.fn_estado_contenido(${fechaInicio}, ${fechaFin}) AS estado
    `);

    return filas[0].estado;
  }
}