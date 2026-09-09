import { InicializarCronogramaUsuarioUseCase } from './use-cases/cronograma/inicializar-cronograma-usuario.use-case';
import { CreacionUnidadTemporalUseCase } from './use-cases/unidad-temporal/crear-unidad-temporal.use-case';
import { ValidarSolapamientoTemporalService } from './service/validar-solapamiento-temporal.service';
import { CalculoOrdenTemporalService } from './service/calculo-orden-temporal.service';
import { ActualizarContenidoUseCase } from './use-cases/contenido/actualizar-contenido.use-case';
import { CrearContenidoUseCase } from './use-cases/contenido/crear-contenido.use-case';
import { EliminarContenidoUseCase } from './use-cases/contenido/eliminar-contenido.use-case';
import { CrearRecursoContenidoUseCase } from './use-cases/recurso-contenido/crear-recurso-contenido.use-case';
import { AutorizarConsumoEventoContenidoService } from './service/autorizar-consumo-evento-contenido.service';
import { PublicarEventosCambioEstadoUseCase } from './use-cases/contenido/publicar-eventos-cambio-estado.use-case';
import { SolicitarUrlSubidaRecursoUseCase } from './use-cases/recurso-contenido/solicitar-url-subida-recurso.use-case';
import { ListarModulosDestinoUseCase } from './use-cases/modulos/listar-modulos-destino.use-case';
import { ReordenarRecursosContenidoUseCase } from './use-cases/recurso-contenido/reordenar-recursos-contenido.use-case';
import { AsociarContenidoUnidadTemporalUseCase } from './use-cases/asociasion-unidad-temporal-contenido/asociar-contenido-unidad-temporal.use-case';
import { ActualizarDisponibilidadContenidoUseCase } from './use-cases/contenido/actualizar-disponibilidad-contenido.use-case';
import { ReordenarContenidoTemporalService } from './service/reordenar-contenido-temporal.service';
import { ActualizarUnidadTemporalUseCase } from './use-cases/unidad-temporal/actualizar-unidad-temporal.use-case';
import { ReordenarUnidadTemporalService } from './service/reordenar-unidad-temporal.service';
import { EliminarAsociacionContenidoUnidadTemporalUseCase } from './use-cases/asociasion-unidad-temporal-contenido/eliminar-asosiacion-contenido-unidad-temporal.use-case';
import { ValidarConsistenciaCronogramaService } from './service/validad-consistencia-global-cronograma.service';
import { EliminarUnidadTemporalUseCase } from './use-cases/unidad-temporal/eliminar-unidad-temporal.use-case';
import { CronogramaCalendarioUseCase } from './use-cases/cronograma/cronograma-calendario.use-case';
import { RegistrarPausaAdministrativaUseCase } from './use-cases/pausa-administrativa/registrar-pausa-administrativa.use-case';
import { CalcularUbicacionTemporalUsuarioUseCase } from './use-cases/cronograma/calcular-ubicacion-temporal-usuario.use-case';
import { ConsultarContenidoVigenteUsuarioUseCase } from './use-cases/contenido/consultar-contenido-vigente-usuario.use-case';
import { ConsultarPausasAdministrativasUsuarioUseCase } from './use-cases/pausa-administrativa/consultar-pausas-administrativas-usuario.use-case';
import { AnularPausaAdministrativaUseCase } from './use-cases/pausa-administrativa/anular-pausa-administrativa.use-case';
import { ConsultarInformacionTemporalUsuarioUseCase } from './use-cases/cronograma/consultar-informacion-temporal-usuario.use-case';

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
  ConsultarInformacionTemporalUsuarioUseCase,
  ValidarConsistenciaCronogramaService,
  EliminarUnidadTemporalUseCase,
  CronogramaCalendarioUseCase,
];
