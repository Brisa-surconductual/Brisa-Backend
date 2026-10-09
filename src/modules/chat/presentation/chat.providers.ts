import { ChatController } from './chat.controller';
import { ArbolPersonalizadoController } from './arbol-personalizado.controller';
import { ContenidoVigenteChatController } from './contenido-vigente-chat.controller';

export const ChatPresentationProviders = [
  ChatController,
  ArbolPersonalizadoController,
  ContenidoVigenteChatController,
];
