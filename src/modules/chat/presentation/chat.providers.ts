import { ChatController } from './chat.controller';
import { ChatAdminController } from './chat-admin.controller';
import { ArbolPersonalizadoController } from './arbol-personalizado.controller';
import { ContenidoVigenteChatController } from './contenido-vigente-chat.controller';

export const ChatPresentationProviders = [
  ChatAdminController,
  ChatController,
  ArbolPersonalizadoController,
  ContenidoVigenteChatController,
];
