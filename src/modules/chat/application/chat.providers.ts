import { ActualizarNodoConversacionalUseCase } from './use-cases/arbol-conversacional/actualizar-nodo-conversacional.use-case';
import { ActualizarTransicionConversacionalUseCase } from './use-cases/arbol-conversacional/actualizar-transicion-conversacional.use-case';
import { ArchivarFlujoUseCase } from './use-cases/arbol-conversacional/archivar-flujo.use-case';
import { ClonarVersionFlujoUseCase } from './use-cases/arbol-conversacional/clonar-version-flujo.use-case';
import { ConsultarArbolConversacionalUseCase } from './use-cases/arbol-conversacional/consultar-arbol-conversacional.use-case';
import { ConsultarCatalogosChatUseCase } from './use-cases/arbol-conversacional/consultar-catalogos-chat.use-case';
import { CrearFlujoConversacionalUseCase } from './use-cases/arbol-conversacional/crear-flujo-conversacional.use-case';
import { CrearFlujoSosUseCase } from './use-cases/arbol-conversacional/crear-flujo-sos.use-case';
import { CrearFlujoSinPerfilService } from './services/crear-flujo-sin-perfil.service';
import { ActivarSosUseCase } from './use-cases/sos/activar-sos.use-case';
import { FinalizarIntervencionSosUseCase } from './use-cases/sos/finalizar-intervencion-sos.use-case';
import { CrearNodoConversacionalUseCase } from './use-cases/arbol-conversacional/crear-nodo-conversacional.use-case';
import { CrearTransicionConversacionalUseCase } from './use-cases/arbol-conversacional/crear-transicion-conversacional.use-case';
import { ListarFlujosUseCase } from './use-cases/arbol-conversacional/listar-flujos.use-case';
import { ListarTiposNodoUseCase } from './use-cases/arbol-conversacional/listar-tipos-nodo.use-case';
import { PublicarFlujoUseCase } from './use-cases/arbol-conversacional/publicar-flujo.use-case';
import { ValidarArbolConversacionalUseCase } from './use-cases/arbol-conversacional/validar-arbol-conversacional.use-case';
import { ConsultarAuditoriaArbolUseCase } from './use-cases/arbol-personalizado/consultar-auditoria-arbol.use-case';
import { ConsultarPublicadoPersonalizadoUseCase } from './use-cases/arbol-personalizado/consultar-publicado-personalizado.use-case';
import { ListarArbolesPersonalizadosUseCase } from './use-cases/arbol-personalizado/listar-arboles-personalizados.use-case';
import { RechazarEliminacionArbolPersonalizadoUseCase } from './use-cases/arbol-personalizado/rechazar-eliminacion-arbol-personalizado.use-case';
import { ConsultarMiContenidoVigenteUseCase } from './use-cases/contenido-vigente/consultar-mi-contenido-vigente.use-case';
import { ConsultarElegibilidadModalidadUseCase } from './use-cases/modalidad/consultar-elegibilidad-modalidad.use-case';
import { HabilitarModalidadPersonalizadaUseCase } from './use-cases/modalidad/habilitar-modalidad-personalizada.use-case';
import { InicializarModalidadUsuarioUseCase } from './use-cases/modalidad/inicializar-modalidad-usuario.use-case';
import { DeterminarContextoConversacionalUseCase } from './use-cases/sesion/determinar-contexto-conversacional.use-case';
import { IniciarOReanudarSesionUseCase } from './use-cases/sesion/iniciar-o-reanudar-sesion.use-case';
import { ProcesarRespuestaUseCase } from './use-cases/sesion/procesar-respuesta.use-case';
import { ConsultarNodoActualUseCase } from './use-cases/sesion/consultar-nodo-actual.use-case';
import { ConsultarHistorialInteraccionesUseCase } from './use-cases/sesion/consultar-historial-interacciones.use-case';
import { PresentarNodoActualService } from './services/presentar-nodo-actual.service';
import { HabilitacionNodoService } from './services/habilitacion-nodo.service';
import { PresentarBloquesNodoActualService } from './services/presentar-bloques-nodo-actual.service';
import { PrepararEntradaNodoActualService } from './services/preparar-entrada-nodo-actual.service';
import { EstadoConversacionalService } from './services/estado-conversacional.service';
import { PresentarHistorialConversacionalService } from './services/presentar-historial-conversacional.service';
import { RecuperarSesionConversacionalService } from './services/recuperar-sesion-conversacional.service';
import { ReportarErrorConversacionalUseCase } from './use-cases/sesion/reportar-error-conversacional.use-case';
import { VariableNodoService } from './services/variable-nodo.service';
import { VariablesEtiquetadasService } from './services/variables-etiquetadas.service';
import { VariablesEtiquetadasPort } from './ports/variables-etiquetadas.port';
import { ConsultarTaxonomiaVariablesUseCase } from './use-cases/taxonomia/consultar-taxonomia-variables.use-case';
import { CrearVariableTaxonomiaUseCase } from './use-cases/taxonomia/crear-variable-taxonomia.use-case';
import { CambiarEstadoVariableTaxonomiaUseCase } from './use-cases/taxonomia/cambiar-estado-variable-taxonomia.use-case';

export const ChatApplicationProviders = [
  ProcesarRespuestaUseCase,
  EstadoConversacionalService,
  PresentarHistorialConversacionalService,
  RecuperarSesionConversacionalService,
  ReportarErrorConversacionalUseCase,
  PresentarNodoActualService,
  HabilitacionNodoService,
  PresentarBloquesNodoActualService,
  PrepararEntradaNodoActualService,
  ConsultarNodoActualUseCase,
  ConsultarHistorialInteraccionesUseCase,
  IniciarOReanudarSesionUseCase,
  DeterminarContextoConversacionalUseCase,
  ConsultarElegibilidadModalidadUseCase,
  HabilitarModalidadPersonalizadaUseCase,
  InicializarModalidadUsuarioUseCase,
  CrearFlujoConversacionalUseCase,
  CrearFlujoSinPerfilService,
  CrearFlujoSosUseCase,
  ActivarSosUseCase,
  FinalizarIntervencionSosUseCase,
  ListarFlujosUseCase,
  ConsultarArbolConversacionalUseCase,
  ValidarArbolConversacionalUseCase,
  PublicarFlujoUseCase,
  ArchivarFlujoUseCase,
  ClonarVersionFlujoUseCase,
  CrearNodoConversacionalUseCase,
  ActualizarNodoConversacionalUseCase,
  CrearTransicionConversacionalUseCase,
  ActualizarTransicionConversacionalUseCase,
  ConsultarCatalogosChatUseCase,
  ListarTiposNodoUseCase,
  ListarArbolesPersonalizadosUseCase,
  ConsultarPublicadoPersonalizadoUseCase,
  ConsultarAuditoriaArbolUseCase,
  RechazarEliminacionArbolPersonalizadoUseCase,
  ConsultarMiContenidoVigenteUseCase,
  // RF-30B: taxonomía de variables y etiquetado.
  VariableNodoService,
  ConsultarTaxonomiaVariablesUseCase,
  CrearVariableTaxonomiaUseCase,
  CambiarEstadoVariableTaxonomiaUseCase,
  { provide: VariablesEtiquetadasPort, useClass: VariablesEtiquetadasService },
];
