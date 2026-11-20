import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ConsultaHistorialInteracciones,
  HistorialInteraccionesRepository,
  InteraccionRegistrada,
  PaginaHistorialInteracciones,
} from '../../domain/repositories/historial-interacciones.repository';

/**
 * RF-31 / RF-32: lee `chat.interacciones` con su respuesta válida. Usa la clave
 * única (id_sesion, secuencia); no escribe en ninguna tabla.
 */
@Injectable()
export class PrismaHistorialInteraccionesRepository implements HistorialInteraccionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async consultar({
    idSesion,
    antesDe,
    limite,
  }: ConsultaHistorialInteracciones): Promise<PaginaHistorialInteracciones> {
    const [ultima, filas] = await Promise.all([
      this.prisma.interacciones.findFirst({
        where: { id_sesion: idSesion },
        orderBy: { secuencia: 'desc' },
        select: { secuencia: true },
      }),
      this.prisma.interacciones.findMany({
        where: {
          id_sesion: idSesion,
          ...(antesDe === null ? {} : { secuencia: { lt: antesDe } }),
        },
        orderBy: { secuencia: 'desc' },
        // Una fila extra indica si quedan interacciones más antiguas.
        take: limite + 1,
        select: {
          id_interaccion: true,
          secuencia: true,
          timestamp_interaccion: true,
          fecha_creacion: true,
          id_nodo: true,
          respuestas: {
            where: { es_valida: true },
            take: 1,
            select: {
              valor_respuesta: true,
              tipo_entrada: { select: { nombre: true } },
            },
          },
        },
      }),
    ]);

    const hayMas = filas.length > limite;
    const pagina = filas.slice(0, limite).reverse();
    return {
      ultimaSecuencia: ultima?.secuencia ?? 0,
      hayMas,
      interacciones: pagina.map((f): InteraccionRegistrada => {
        const respuesta = f.respuestas[0];
        // RF-30: toda interacción se registra junto con su respuesta.
        if (respuesta === undefined)
          throw new Error('Interacción sin respuesta registrada.');
        return {
          idInteraccion: f.id_interaccion,
          secuencia: f.secuencia,
          timestampInteraccion: f.timestamp_interaccion,
          registradaEn: f.fecha_creacion,
          idNodo: f.id_nodo,
          tipoEntrada: respuesta.tipo_entrada.nombre,
          valor: respuesta.valor_respuesta,
        };
      }),
    };
  }
}
