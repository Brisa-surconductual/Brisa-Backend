import { HttpException, Injectable } from '@nestjs/common';
import { UnidadTemporalRepository } from '../../domain/repositories/unidad-temporal.repository';
import { ContenidoCronogramaRepository } from '../../domain/repositories/contenido-cronograma.repository';
import { CronogramaRepository } from '../../domain/repositories/cronograma.repository';
import { CalculoEstadoContenidoPort } from '../ports/calculo-estado-contenido.port';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { CronogramaNoEncontradoException } from '../../domain/exeption/cronograma-no-encontrado.exeption';
import { CronogramaNoInactivoException } from '../../domain/exeption/cronograma-no-inactivo.exeption';
import { CronogramaSinUnidadesTemporalesException } from '../../domain/exeption/cronograma-sin-unidades-temporales.exeption';
import { CronogramaSinContenidoProgramadoException } from '../../domain/exeption/cronograma-sin-contenido-programado.exeption';
import { ValidacionConsistenciaCronogramaException } from '../../domain/exeption/validar-consistencia-cronograma.exeption';

@Injectable()
export class ValidarConsistenciaCronogramaService {
  constructor(
    private readonly cronogramaRepository: CronogramaRepository,
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
    private readonly calculoEstadoContenidoPort: CalculoEstadoContenidoPort,
  ) {}

  async validar(idCronograma: string): Promise<void> {
    try {
      const cronograma = await this.cronogramaRepository.buscarPorId(idCronograma);

      if (!cronograma) {
        throw new CronogramaNoEncontradoException();
      }

      if (cronograma.estado !== 'INACTIVO') {
        throw new CronogramaNoInactivoException();
      }

      const unidadesTemporales = await this.unidadTemporalRepository.obtenerPorCronograma(idCronograma);

      if (unidadesTemporales.length === 0) {
        throw new CronogramaSinUnidadesTemporalesException();
      }

      const contenidosPorUnidad = await Promise.all(
        unidadesTemporales.map((unidad) =>
          this.contenidoCronogramaRepository.obtnerPorIdUnidadTemporal(unidad.id_unidad_Temporal),
        ),
      );

      const todosLosContenidos = contenidosPorUnidad.flat();

      const estadosCalculados = await Promise.all(
        todosLosContenidos.map((contenido) =>
          this.calculoEstadoContenidoPort.calcular(
            contenido.fecha_inicio_disponibilidad,
            contenido.fecha_fin_disponibilidad,
          ),
        ),
      );

      const hayContenidoProgramado = estadosCalculados.some(
        (estado) => estado === EstadoContenido.PROGRAMADO,
      );

      if (!hayContenidoProgramado) {
        throw new CronogramaSinContenidoProgramadoException();
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ValidacionConsistenciaCronogramaException();
    }
  }
}