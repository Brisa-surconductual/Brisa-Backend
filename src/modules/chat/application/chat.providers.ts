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

export const ChatApplicationProviders = [
  CrearFlujoGrupalUseCase,
  ListarTiposNodoUseCase,
  ConsultarArbolConversacionalUseCase,
  CrearNodoConversacionalUseCase,
  ActualizarNodoConversacionalUseCase,
  CrearTransicionConversacionalUseCase,
  ActualizarTransicionConversacionalUseCase,
  ValidarArbolConversacionalUseCase,
  PublicarArbolConversacionalUseCase,
];
