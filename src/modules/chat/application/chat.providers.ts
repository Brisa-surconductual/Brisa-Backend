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

import { ConsultarMiContenidoVigenteUseCase } from './use-cases/consultar-mi-contenido-vigente.use-case';

export const ChatApplicationProviders = [
  ConsultarMiContenidoVigenteUseCase,
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
