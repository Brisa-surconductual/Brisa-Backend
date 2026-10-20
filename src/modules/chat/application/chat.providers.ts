import { HabilitarModalidadPersonalizadaUseCase } from "./use-cases/habilitar-modalidad-personalizada.use-case";
import { ConsultarMiContenidoVigenteUseCase } from './use-cases/consultar-mi-contenido-vigente.use-case';
import { DeterminarContextoConversacionalUseCase } from './use-cases/determinar-contexto-conversacional.use-case';
import {
  ActualizarNodoConversacionalUseCase,
  ActualizarTransicionConversacionalUseCase,
  ConsultarArbolConversacionalUseCase,
  CrearFlujoGrupalUseCase,
  CrearNodoConversacionalUseCase,
  CrearTransicionConversacionalUseCase,
  ListarTiposNodoUseCase,
  PublicarArbolConversacionalUseCase,
  ValidarArbolConversacionalUseCase,
} from './use-cases/gestionar-arbol-conversacional.use-cases';
import {
  ArchivarArbolPersonalizadoUseCase,
  ClonarVersionPersonalizadaUseCase,
  ConsultarArbolPersonalizadoUseCase,
  ConsultarAuditoriaArbolUseCase,
  ConsultarPublicadoPersonalizadoUseCase,
  CrearArbolPersonalizadoUseCase,
  ListarArbolesPersonalizadosUseCase,
  PublicarArbolPersonalizadoUseCase,
  RechazarEliminacionArbolPersonalizadoUseCase,
} from './use-cases/gestionar-arbol-personalizado.use-cases';

import {
  ArchivarFlujoUseCase,
  ClonarVersionFlujoUseCase,
  ListarFlujosUseCase,
  PublicarFlujoUseCase,
} from './use-cases/gestionar-flujos.use-cases';
import {
  ActualizarNodoPorIdUseCase,
  ActualizarTransicionPorIdUseCase,
  ConsultarCatalogosChatUseCase,
  CrearFlujoConversacionalUseCase,
  CrearReglaValidacionUseCase,
  CrearTransicionReutilizableUseCase,
} from './use-cases/gestionar-chat-admin.use-cases';
import { IniciarOReanudarSesionUseCase } from './use-cases/iniciar-o-reanudar-sesion.use-case';

import { ConsultarElegibilidadModalidadUseCase } from "./use-cases/consultar-elegibilidad-modalidad.use-case";

export const ChatApplicationProviders = [
  HabilitarModalidadPersonalizadaUseCase,
  ConsultarElegibilidadModalidadUseCase,
  ArchivarFlujoUseCase,
  ClonarVersionFlujoUseCase,
  ListarFlujosUseCase,
  PublicarFlujoUseCase,
  ActualizarNodoPorIdUseCase,
  ActualizarTransicionPorIdUseCase,
  ConsultarCatalogosChatUseCase,
  CrearFlujoConversacionalUseCase,
  CrearReglaValidacionUseCase,
  CrearTransicionReutilizableUseCase,
  ConsultarMiContenidoVigenteUseCase,
  DeterminarContextoConversacionalUseCase,
  IniciarOReanudarSesionUseCase,
  CrearFlujoGrupalUseCase,
  ListarTiposNodoUseCase,
  ConsultarArbolConversacionalUseCase,
  CrearNodoConversacionalUseCase,
  ActualizarNodoConversacionalUseCase,
  CrearTransicionConversacionalUseCase,
  ActualizarTransicionConversacionalUseCase,
  ValidarArbolConversacionalUseCase,
  PublicarArbolConversacionalUseCase,
  CrearArbolPersonalizadoUseCase,
  ClonarVersionPersonalizadaUseCase,
  ListarArbolesPersonalizadosUseCase,
  ConsultarArbolPersonalizadoUseCase,
  ConsultarPublicadoPersonalizadoUseCase,
  PublicarArbolPersonalizadoUseCase,
  ArchivarArbolPersonalizadoUseCase,
  ConsultarAuditoriaArbolUseCase,
  RechazarEliminacionArbolPersonalizadoUseCase,
];
