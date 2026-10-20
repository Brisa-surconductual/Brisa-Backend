import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EstructuraActivacionCronograma } from '../../domain/repositories/activacion-cronograma.repository';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';
import { CronogramaSinContenidoProgramadoException } from '../../domain/exeption/cronograma/cronograma-sin-contenido-programado.exeption';

@Injectable()
export class ValidarConsistenciaCronogramaService {
  validar({ cronograma, unidades }: EstructuraActivacionCronograma): void {
    if (cronograma.estado !== EstadoCronograma.INACTIVO) {
      throw new ConflictException(
        'El cronograma ya se encuentra en estado activo.',
      );
    }
    if (unidades.length === 0)
      throw new CronogramaSinUnidadesTemporalesException();
    const ordenesUnidad = new Set<number>();
    let contenidos = 0;
    const ordenadas = [...unidades].sort(
      (a, b) => +a.fecha_inicio - +b.fecha_inicio,
    );
    for (let i = 0; i < ordenadas.length; i++) {
      const unidad = ordenadas[i];
      if (!(unidad.fecha_inicio < unidad.fecha_fin)) {
        throw new BadRequestException(
          'La fecha de inicio de la unidad temporal debe ser menor que la fecha de fin.',
        );
      }
      if (i > 0 && ordenadas[i - 1].fecha_fin > unidad.fecha_inicio) {
        throw new ConflictException(
          'Existen unidades temporales con fechas solapadas. Verifique la planificación.',
        );
      }
      if (ordenesUnidad.has(unidad.orden_unidad)) {
        throw new ConflictException(
          'El orden de la unidad temporal ya se encuentra definido en el cronograma.',
        );
      }
      ordenesUnidad.add(unidad.orden_unidad);
      // La secuencia existente es (orden_unidad, orden_contenido).
      const ordenesContenido = new Set<number>();
      for (const contenido of unidad.contenidos_cronograma) {
        const inicio = contenido.fecha_inicio_disponibilidad;
        const fin = contenido.fecha_fin_disponibilidad;
        if (
          !inicio ||
          !fin ||
          !(inicio < fin) ||
          inicio < unidad.fecha_inicio ||
          fin > unidad.fecha_fin
        ) {
          throw new BadRequestException(
            'Las fechas del contenido deben estar dentro del rango de su unidad temporal.',
          );
        }
        if (
          contenido.orden_contenido === null ||
          !Number.isInteger(contenido.orden_contenido)
        ) {
          throw new BadRequestException(
            'Cada contenido debe tener un orden definido dentro del cronograma.',
          );
        }
        if (ordenesContenido.has(contenido.orden_contenido)) {
          throw new ConflictException(
            'Existe duplicidad en el orden de contenidos dentro de una unidad temporal.',
          );
        }
        ordenesContenido.add(contenido.orden_contenido);
        contenidos++;
      }
    }
    // La plantilla se desplaza según el inicio individual, incluso con fechas históricas.
    if (contenidos === 0) throw new CronogramaSinContenidoProgramadoException();
  }
}
