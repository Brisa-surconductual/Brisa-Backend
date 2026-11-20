import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  PresentacionNodoActualPort,
  RecursoNodoActual,
} from '../../application/ports/presentacion-nodo-actual.port';

/** Consultas y mapeo de filas; la preparación del contrato vive en aplicación. */
@Injectable()
export class PrismaPresentacionNodoActualRepository implements PresentacionNodoActualPort {
  constructor(private readonly prisma: PrismaService) {}

  async tieneSalidas(idNodo: string, idFlujo: string): Promise<boolean> {
    const salidas = await this.prisma.reglas_nodos.count({
      where: { id_nodo_origen: idNodo, id_flujo: idFlujo },
    });
    return salidas > 0;
  }

  async consultarRecursos(idContenido: string): Promise<RecursoNodoActual[]> {
    const filas = await this.prisma.recursos_contenido.findMany({
      where: {
        id_contenido: idContenido,
        recursos_modulos_destino: {
          some: { modulos_sistema: { codigo_modulo: 'CHAT', activo: true } },
        },
      },
      orderBy: { orden_bloque: 'asc' },
      select: {
        id_recurso: true,
        tipo_recurso: true,
        orden_bloque: true,
        texto_contenido: true,
        clave_almacenamiento: true,
        mime_type: true,
        texto_alternativo: true,
        duracion_segundos: true,
      },
    });
    return filas.map((f) => ({
      idRecurso: f.id_recurso,
      tipo: f.tipo_recurso,
      orden: f.orden_bloque,
      texto: f.texto_contenido,
      claveAlmacenamiento: f.clave_almacenamiento,
      mimeType: f.mime_type,
      textoAlternativo: f.texto_alternativo,
      duracionSegundos: f.duracion_segundos,
    }));
  }
}
