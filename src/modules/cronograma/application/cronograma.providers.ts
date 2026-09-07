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
import { SolicitarUrlSubidaRecursoUseCase } from './use-cases/solicitar-url-subida-recurso.use-case';
import { ListarModulosDestinoUseCase } from './use-cases/listar-modulos-destino.use-case';
import { ReordenarRecursosContenidoUseCase } from './use-cases/reordenar-recursos-contenido.use-case';
import { AsociarContenidoUnidadTemporalUseCase } from './use-cases/asociar-contenido-unidad-temporal.use-case';
import { ActualizarDisponibilidadContenidoUseCase } from './use-cases/actualizar-disponibilidad-contenido.use-case';
import { ReordenarContenidoTemporalService } from './service/reordenar-contenido-temporal.service';
import { ActualizarUnidadTemporalUseCase } from './use-cases/actualizar-unidad-temporal.use-case';
import { ReordenarUnidadTemporalService } from './service/reordenar-unidad-temporal.service';
import { EliminarAsociacionContenidoUnidadTemporalUseCase } from './use-cases/eliminar-asosiacion-contenido-unidad-temporal.use-case';
import { RegistrarPausaAdministrativaUseCase } from './use-cases/registrar-pausa-administrativa.use-case';
import { CalcularUbicacionTemporalUsuarioUseCase } from './use-cases/calcular-ubicacion-temporal-usuario.use-case';
import { ConsultarContenidoVigenteUsuarioUseCase } from './use-cases/consultar-contenido-vigente-usuario.use-case';
import { ConsultarPausasAdministrativasUsuarioUseCase } from './use-cases/consultar-pausas-administrativas-usuario.use-case';
import { AnularPausaAdministrativaUseCase } from './use-cases/anular-pausa-administrativa.use-case';

export const CronogramaApplicationProviders = [
  InicializarCronogramaUsuarioUseCase,
  CreacionUnidadTemporalUseCase,
  ValidarSolapamientoTemporalService,
  CalculoOrdenTemporalService,
  CrearContenidoUseCase,
  ActualizarContenidoUseCase,
  EliminarContenidoUseCase,
  CrearRecursoContenidoUseCase,
  SolicitarUrlSubidaRecursoUseCase,
  ListarModulosDestinoUseCase,
  ReordenarRecursosContenidoUseCase,
  AutorizarConsumoEventoContenidoService,
  PublicarEventosCambioEstadoUseCase,
  AsociarContenidoUnidadTemporalUseCase,
  ActualizarDisponibilidadContenidoUseCase,
  ReordenarContenidoTemporalService,
  ActualizarUnidadTemporalUseCase,
  ReordenarUnidadTemporalService,
  EliminarAsociacionContenidoUnidadTemporalUseCase,
  RegistrarPausaAdministrativaUseCase,
  CalcularUbicacionTemporalUsuarioUseCase,
  ConsultarContenidoVigenteUsuarioUseCase,
  ConsultarPausasAdministrativasUsuarioUseCase,
  AnularPausaAdministrativaUseCase,
];
