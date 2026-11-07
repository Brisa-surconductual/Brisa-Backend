import { ActualizarNodoConversacionalUseCase } from './use-cases/arbol-conversacional/actualizar-nodo-conversacional.use-case';
import { ActualizarTransicionConversacionalUseCase } from './use-cases/arbol-conversacional/actualizar-transicion-conversacional.use-case';
import { ArchivarFlujoUseCase } from './use-cases/arbol-conversacional/archivar-flujo.use-case';
import { ClonarVersionFlujoUseCase } from './use-cases/arbol-conversacional/clonar-version-flujo.use-case';
import { ConsultarArbolConversacionalUseCase } from './use-cases/arbol-conversacional/consultar-arbol-conversacional.use-case';
import { ConsultarCatalogosChatUseCase } from './use-cases/arbol-conversacional/consultar-catalogos-chat.use-case';
import { CrearFlujoConversacionalUseCase } from './use-cases/arbol-conversacional/crear-flujo-conversacional.use-case';
import { CrearNodoConversacionalUseCase } from './use-cases/arbol-conversacional/crear-nodo-conversacional.use-case';
import { CrearReglaValidacionUseCase } from './use-cases/arbol-conversacional/crear-regla-validacion.use-case';
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
import { DeterminarContextoConversacionalUseCase } from './use-cases/sesion/determinar-contexto-conversacional.use-case';
import { IniciarOReanudarSesionUseCase } from './use-cases/sesion/iniciar-o-reanudar-sesion.use-case';
import { ConsultarNodoActualUseCase } from './use-cases/sesion/consultar-nodo-actual.use-case';
import { PresentarNodoActualService } from './services/presentar-nodo-actual.service';
import { PresentarBloquesNodoActualService } from './services/presentar-bloques-nodo-actual.service';
import { PrepararEntradaNodoActualService } from './services/preparar-entrada-nodo-actual.service';

export const ChatApplicationProviders = [
  PresentarNodoActualService,
  PresentarBloquesNodoActualService,
  PrepararEntradaNodoActualService,
  ConsultarNodoActualUseCase,
  IniciarOReanudarSesionUseCase,
  DeterminarContextoConversacionalUseCase,
  ConsultarElegibilidadModalidadUseCase,
  HabilitarModalidadPersonalizadaUseCase,
  CrearFlujoConversacionalUseCase,
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
  CrearReglaValidacionUseCase,
  ConsultarCatalogosChatUseCase,
  ListarTiposNodoUseCase,
  ListarArbolesPersonalizadosUseCase,
  ConsultarPublicadoPersonalizadoUseCase,
  ConsultarAuditoriaArbolUseCase,
  RechazarEliminacionArbolPersonalizadoUseCase,
  ConsultarMiContenidoVigenteUseCase,
];
