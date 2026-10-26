import { HabilitarModalidadProgramaController } from "./habilitar-modalidad-programa.controller";
import { ChatController } from './chat.controller';
import { ChatAdminController } from './chat-admin.controller';
import { ArbolPersonalizadoController } from './arbol-personalizado.controller';
import { ContenidoVigenteChatController } from './contenido-vigente-chat.controller';
import { SesionesConversacionalesController } from './sesiones-conversacionales.controller';

import { ModalidadProgramaAdminController } from './modalidad-programa-admin.controller';

export const ChatPresentationProviders = [
  HabilitarModalidadProgramaController,
  ModalidadProgramaAdminController,
  ChatAdminController,
  ChatController,
  ArbolPersonalizadoController,
  ContenidoVigenteChatController,
  SesionesConversacionalesController,
];
