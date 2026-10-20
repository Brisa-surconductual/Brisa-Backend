import { Cronograma } from '../entities/cronograma.entity';

export interface EstructuraActivacionCronograma {
  cronograma: Cronograma;
  unidades: {
    id_unidad_temporal: string;
    orden_unidad: number;
    fecha_inicio: Date;
    fecha_fin: Date;
    contenidos_cronograma: {
      orden_contenido: number | null;
      fecha_inicio_disponibilidad: Date | null;
      fecha_fin_disponibilidad: Date | null;
    }[];
  }[];
}

export abstract class ActivacionCronogramaRepository {
  // La lectura, validación y activación comparten una transacción.
  abstract activar(
    idCronograma: string,
    validar: (estructura: EstructuraActivacionCronograma) => void,
  ): Promise<Cronograma>;
}
