import { InicializarCronogramaUsuarioUseCase } from './use-cases/inicializar-cronograma-usuario.use-case';
import { CreacionUnidadTemporalUseCase } from './use-cases/crear-unidad-temporal.use-case';
import { ValidarSolapamientoTemporalService } from './service/validar-solapamiento-temporal.service';
import { CalculoOrdenTemporalService } from './service/calculo-orden-temporal.service';
import { ActualizarContenidoUseCase } from './use-cases/actualizar-contenido.use-case';
import { CrearContenidoUseCase } from './use-cases/crear-contenido.use-case';
import { EliminarContenidoUseCase } from './use-cases/eliminar-contenido.use-case';
import { CrearRecursoContenidoUseCase } from './use-cases/crear-recurso-contenido.use-case';
import { AutorizarConsumoEventoContenidoService } from './service/autorizar-consumo-evento-contenido.service';
import { PublicarEventosCambioEstadoUseCase } from './use-cases/publicar-eventos-cambio-estado.use-case';
import {AsociarContenidoUnidadTemporalUseCase} from "./use-cases/asociar-contenido-unidad-temporal.use-case";
import {ActualizarDisponibilidadContenidoUseCase} from "./use-cases/actualizar-disponibilidad-contenido.use-case";
import {ReordenarContenidoTemporalService} from "./service/reordenar-contenido-temporal.service";

export const CronogramaApplicationProviders = [
  InicializarCronogramaUsuarioUseCase,
  CreacionUnidadTemporalUseCase,
  ValidarSolapamientoTemporalService,
  CalculoOrdenTemporalService,
  CrearContenidoUseCase,
  ActualizarContenidoUseCase,
  EliminarContenidoUseCase,
  CrearRecursoContenidoUseCase,
  AutorizarConsumoEventoContenidoService,
  PublicarEventosCambioEstadoUseCase,
  AsociarContenidoUnidadTemporalUseCase,
  ActualizarDisponibilidadContenidoUseCase,
  ReordenarContenidoTemporalService,
];
