import { Injectable } from '@nestjs/common';
import { ContenidoCronogramaRepository } from '../../domain/repositories/contenido-cronograma.repository';
import { UnidadTemporalRepository } from '../../domain/repositories/unidad-temporal.repository';
import { ConsistenciaFechasVO } from '../../domain/value-objects/cosistencia-fechas.vo';
import { ValidarSolapamientoTemporalService } from '../service/validar-solapamiento-temporal.service';
import { ReordenarContenidoTemporalService } from '../service/reordenar-contenido-temporal.service';
import { ContenidoCronograma } from '../../domain/entities/contenido-cronograma.entity';
import { ContenidoNoAsociadoException } from '../../domain/exeption/contenido-no-asociado.exeption';
import { DisponibilidadFueraDeRangoException } from '../../domain/exeption/disponibilidad-fuera-de-rango.exeption';
import { UnidadTemporalNoEncontradaException } from '../../domain/exeption/unidad-temporal-no-encotrada.exception';
import { SolapamientoConLimiteException } from '../../domain/exeption/solapamineto-con-limite.exeption';
import { calcularLimitesDisponibles, construirMensajeLimite } from '../service/calcular-limite-disponible.service';
import { ActualizarDisponibilidadContenidoDtoRequest } from '../dto/actualizar-disponibilidad-contenido.dto-request';
import { ActualizarDisponibilidadContenidoDtoResponse } from '../dto/actualizar-disponibilidad-contenido.dto-response';

@Injectable()
export class ActualizarDisponibilidadContenidoUseCase {
  constructor(
    private readonly contenidoCronogramaRepository: ContenidoCronogramaRepository,
    private readonly unidadTemporalRepository: UnidadTemporalRepository,
    private readonly validarSolapamientoTemporalService: ValidarSolapamientoTemporalService,
    private readonly reordenarContenidoTemporalService: ReordenarContenidoTemporalService,
  ) {}

  async execute(
    dto: ActualizarDisponibilidadContenidoDtoRequest,
  ): Promise<ActualizarDisponibilidadContenidoDtoResponse> {
    // 404 — la asociación debe existir
    const asociacionActual = await this.contenidoCronogramaRepository.obtenerPorIdContenidoCronograma(
      dto.idContenidoCronograma,
    );
    if (!asociacionActual) {
      throw new ContenidoNoAsociadoException();
    }

    // 400 — fecha_inicio < fecha_fin
    const consistenciaFechas = new ConsistenciaFechasVO(
      dto.fechaInicioDisponibilidad,
      dto.fechaFinDisponibilidad,
    );

    // 409 — dentro del rango de la unidad temporal
    const unidadTemporal = await this.unidadTemporalRepository.obtenerPorIdUnidadTemporal(
      asociacionActual.id_unidad_temporal,
    );
    if (!unidadTemporal) {
      throw new UnidadTemporalNoEncontradaException();
    }
    if (
      consistenciaFechas.fecha_inicio < unidadTemporal.fecha_inicio ||
      consistenciaFechas.fecha_fin > unidadTemporal.fecha_fin
    ) {
      throw new DisponibilidadFueraDeRangoException();
    }

    // Hermanas = resto de contenidos de la misma unidad temporal, sin la propia
    const hermanas = await this.contenidoCronogramaRepository.obtnerPorIdUnidadTemporal(
      asociacionActual.id_unidad_temporal,
    );
    const hermanasSinActual = hermanas.filter(
      (h) => h.id_contenido_cronograma !== asociacionActual.id_contenido_cronograma,
    );

    // 409 — no solapar con hermanas, con mensaje de límite útil
    try {
      this.validarSolapamientoTemporalService.validarSolapamiento(
        hermanasSinActual,
        consistenciaFechas.fecha_inicio,
        consistenciaFechas.fecha_fin,
      );
    } catch {
      const limites = calcularLimitesDisponibles(hermanasSinActual, consistenciaFechas.fecha_inicio);
      throw new SolapamientoConLimiteException(construirMensajeLimite(limites));
    }

    // Persistir las nuevas fechas
    await this.contenidoCronogramaRepository.actualizarDisponibilidad(
      asociacionActual.id_contenido_cronograma,
      consistenciaFechas.fecha_inicio,
      consistenciaFechas.fecha_fin,
    );

   // Ahora, con el método de dominio:
    const asociacionActualizada = ContenidoCronograma.actualizarAsociacion(
        asociacionActual,
        asociacionActual.orden_contenido, // valor temporal; el orden real se recalcula justo después
        consistenciaFechas.fecha_inicio,
        consistenciaFechas.fecha_fin,
    );

    const nuevoOrden = this.reordenarContenidoTemporalService.recalcularOrden([
      ...hermanasSinActual,
      asociacionActualizada,
    ]);

    await this.contenidoCronogramaRepository.actualizarOrdenMasivo(nuevoOrden);

    return ActualizarDisponibilidadContenidoDtoResponse.fromMensaje();
  }
}