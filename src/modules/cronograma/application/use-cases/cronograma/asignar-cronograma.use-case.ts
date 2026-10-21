import { Injectable } from '@nestjs/common';
import { CronogramaUsuarioRepository } from '../../../domain/repositories/cronograma-usuario.repository';
import { UnidadTemporalRepository } from '../../../domain/repositories/unidad-temporal.repository';
import { CronogramaRepository } from '../../../domain/repositories/cronograma.repository';
import { AsignarCronogramaDtoRequest } from '../../dto/cronograma/asignar-cronograma.dto-request';
import { AsignarCronogramaDtoResponse } from '../../dto/cronograma/asignar-cronograma.dto-response';
import { CronogramaUsuarioActivoNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-usuario-activo-no-encontrado.exception';
import { CronogramaNoEncontradoException } from '../../../domain/exeption/cronograma/cronograma-no-encontrado.exeption';
import { CronogramaSinUnidadesTemporalesException } from '../../../domain/exeption/cronograma/cronograma-sin-unidades-temporales.exeption';

@Injectable()
export class AsignarCronogramaUsuarioUseCase {
  constructor(
    private readonly cronogramaUsuarioRepository: CronogramaUsuarioRepository,
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly cronogramaRepository: CronogramaRepository,
  ) {}

  async execute(
    idUsuario: string,
    dto: AsignarCronogramaDtoRequest,
  ): Promise<AsignarCronogramaDtoResponse> {
    // 1. Validamos que el usuario ya tenga un cronograma actual
    const asignacionActual =
      await this.cronogramaUsuarioRepository.buscarPorUsuario(idUsuario);
    if (!asignacionActual) {
      throw new CronogramaUsuarioActivoNoEncontradoException();
    }

    // 2. Validamos que el cronograma destino (el nuevo) exista
    const cronogramaNuevo = await this.cronogramaRepository.buscarPorId(
      dto.id_cronograma_nuevo,
    );
    if (!cronogramaNuevo) {
      throw new CronogramaNoEncontradoException();
    }

    // --- NUEVO PASO 2.5: Validar que el NUEVO cronograma tenga unidades temporales ---
    const unidadesNuevoCronograma =
      await this.unidadTemporalRepository.obtenerPorCronograma(
        dto.id_cronograma_nuevo,
      );

    if (unidadesNuevoCronograma.length === 0) {
      throw new CronogramaSinUnidadesTemporalesException();
    }

    let fechaInicioEfectiva = new Date();

    // 3. Regla de negocio: ¿Interrumpir o Esperar?
    if (!dto.interrumpir) {
      // Obtenemos las unidades del cronograma actual que el usuario está cursando
      const unidadesActuales =
        await this.unidadTemporalRepository.obtenerPorCronograma(
          asignacionActual.id_cronograma,
        );

      if (unidadesActuales.length === 0) {
        // Nota: Reutilizamos tu excepción, pero ten en cuenta que aquí estamos
        // validando el cronograma VIEJO para poder calcular la fecha de fin.
        throw new CronogramaSinUnidadesTemporalesException();
      }

      // Encontramos la unidad que termina más tarde (la última unidad del cronograma)
      const ultimaUnidad = unidadesActuales.reduce((prev, current) =>
        current.fecha_fin > prev.fecha_fin ? current : prev,
      );

      // Si la última unidad ya terminó en el pasado, arrancamos hoy. Si no, arrancamos cuando termine.
      fechaInicioEfectiva =
        ultimaUnidad.fecha_fin > new Date()
          ? ultimaUnidad.fecha_fin
          : new Date();
    }

    // 4. Delegamos la transición a la Entidad (DDD)
    const asignacionActualizada = asignacionActual.asignarNuevoCronograma(
      dto.id_cronograma_nuevo,
      fechaInicioEfectiva,
    );

    // 5. Persistimos el cambio
    await this.cronogramaUsuarioRepository.actualizar(asignacionActualizada);

    // 6. Retornamos
    return AsignarCronogramaDtoResponse.crear(
      idUsuario,
      dto.id_cronograma_nuevo,
      fechaInicioEfectiva,
      dto.interrumpir,
    );
  }
}
