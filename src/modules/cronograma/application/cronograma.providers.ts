import { InicializarCronogramaUsuarioUseCase } from './use-cases/inicializar-cronograma-usuario.use-case';
import { CreacionUnidadTemporalUseCase } from './use-cases/crear-unidad-temporal.use-case';
import { ValidarSolapamientoUnidadTemporalService } from './service/validar-solapamiento-unidad-temporal.service';
import { CalculoOrdenUnidadTemporalService } from './service/calculo-orden-unidad-temporal.service';
import { ActualizarContenidoUseCase } from './use-cases/actualizar-contenido.use-case';
import { CrearContenidoUseCase } from './use-cases/crear-contenido.use-case';
import { EliminarContenidoUseCase } from './use-cases/eliminar-contenido.use-case';
import { CrearRecursoContenidoUseCase } from './use-cases/crear-recurso-contenido.use-case';
import { AutorizarConsumoEventoContenidoService } from './service/autorizar-consumo-evento-contenido.service';
import { PublicarEventosCambioEstadoUseCase } from './use-cases/publicar-eventos-cambio-estado.use-case';

export const CronogramaApplicationProviders = [
  InicializarCronogramaUsuarioUseCase,
  CreacionUnidadTemporalUseCase,
  ValidarSolapamientoUnidadTemporalService,
  CalculoOrdenUnidadTemporalService,
  CrearContenidoUseCase,
  ActualizarContenidoUseCase,
  EliminarContenidoUseCase,
  CrearRecursoContenidoUseCase,
  AutorizarConsumoEventoContenidoService,
  PublicarEventosCambioEstadoUseCase,
];
