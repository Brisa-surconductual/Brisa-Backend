import type {
  auditoria_arboles,
  Prisma,
  tipo_entrada,
  tipo_nodo,
} from '@prisma/client';
import { AuditoriaArbolConversacional } from '../../domain/entities/catalogos/auditoria-arbol-conversacional.entity';
import {
  ContenidoConProgramaciones,
  ProgramacionContenido,
} from '../../domain/entities/catalogos/contenido-con-programaciones.entity';
import { ContenidoCronogramaConversacional } from '../../domain/entities/catalogos/contenido-cronograma.entity';
import { TipoEntradaConversacional } from '../../domain/entities/catalogos/tipo-entrada.entity';
import { TipoNodoConversacional } from '../../domain/entities/catalogos/tipo-nodo.entity';

/** Fila de `contenidos_cronograma` con el nombre del contenido y de su unidad temporal. */
export type ContenidoCronogramaFila = Prisma.contenidos_cronogramaGetPayload<{
  include: {
    contenidos: { select: { nombre_contenido: true } };
    unidades_temporales: {
      select: { nombre_unidad: true; orden_unidad: true };
    };
  };
}>;

/** Programación con su unidad temporal y su cronograma. */
export type ProgramacionContenidoFila = Prisma.contenidos_cronogramaGetPayload<{
  include: { unidades_temporales: { include: { cronogramas: true } } };
}>;

export interface ContenidoCatalogoFila {
  id_contenido: string;
  nombre_contenido: string;
  tipo_contenido: string;
}

export class CatalogosConversacionalesMapper {
  static contenidosConProgramacionesToDomain(
    contenidos: ContenidoCatalogoFila[],
    programaciones: ProgramacionContenidoFila[],
  ): ContenidoConProgramaciones[] {
    const porContenido = new Map<string, ProgramacionContenido[]>();
    for (const fila of programaciones) {
      const unidad = fila.unidades_temporales;
      const lista = porContenido.get(fila.id_contenido) ?? [];
      lista.push({
        idContenidoCronograma: fila.id_contenido_cronograma,
        idCronograma: unidad.id_cronograma,
        nombreCronograma: unidad.cronogramas.nombre_cronograma,
        estadoCronograma: unidad.cronogramas.estado,
        idUnidadTemporal: unidad.id_unidad_temporal,
        ordenUnidad: unidad.orden_unidad,
        nombreUnidad: unidad.nombre_unidad,
        fechaInicioUnidad: unidad.fecha_inicio,
        fechaFinUnidad: unidad.fecha_fin,
        fechaInicioDisponibilidad: fila.fecha_inicio_disponibilidad,
        fechaFinDisponibilidad: fila.fecha_fin_disponibilidad,
      });
      porContenido.set(fila.id_contenido, lista);
    }
    return contenidos.map(
      (contenido) =>
        new ContenidoConProgramaciones(
          contenido.id_contenido,
          contenido.nombre_contenido,
          contenido.tipo_contenido,
          (porContenido.get(contenido.id_contenido) ?? []).sort(
            (a, b) =>
              a.nombreCronograma.localeCompare(b.nombreCronograma, 'es') ||
              a.ordenUnidad - b.ordenUnidad,
          ),
        ),
    );
  }

  static tipoNodoToDomain(fila: tipo_nodo): TipoNodoConversacional {
    return new TipoNodoConversacional(fila.id_tipo_nodo, fila.nombre);
  }

  static tipoEntradaToDomain(fila: tipo_entrada): TipoEntradaConversacional {
    return new TipoEntradaConversacional(fila.id_tipo_entrada, fila.nombre);
  }

  static contenidoCronogramaToDomain(
    fila: ContenidoCronogramaFila,
  ): ContenidoCronogramaConversacional {
    return new ContenidoCronogramaConversacional(
      fila.id_contenido_cronograma,
      fila.id_contenido,
      fila.contenidos.nombre_contenido,
      fila.id_unidad_temporal,
      fila.unidades_temporales.nombre_unidad,
      fila.unidades_temporales.orden_unidad,
    );
  }

  static auditoriaToDomain(
    fila: auditoria_arboles,
    idFlujo: string,
  ): AuditoriaArbolConversacional {
    return new AuditoriaArbolConversacional(
      BigInt(fila.id_auditoria),
      idFlujo,
      fila.id_actor,
      fila.accion,
      fila.id_objeto,
      fila.fecha_operacion,
    );
  }
}
