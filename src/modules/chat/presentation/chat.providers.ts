import { ChatController } from './chat.controller';
import { ChatAdminController } from './chat-admin.controller';
import { ArbolPersonalizadoController } from './arbol-personalizado.controller';
import { ContenidoVigenteChatController } from './contenido-vigente-chat.controller';
import { SesionesConversacionalesController } from './sesiones-conversacionales.controller';

export const ChatPresentationProviders = [
  ChatAdminController,
  ChatController,
  ArbolPersonalizadoController,
  ContenidoVigenteChatController,
  SesionesConversacionalesController,
];
