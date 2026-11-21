import { ArbolesPersonalizadosController } from './controllers/arbol-personalizado/arboles-personalizados.controller';
import { CatalogosChatController } from './controllers/catalogos/catalogos-chat.controller';
import { ContenidoVigenteChatController } from './controllers/contenido-vigente/contenido-vigente-chat.controller';
import { FlujosConversacionalesController } from './controllers/flujo/flujos-conversacionales.controller';
import { ModalidadProgramaController } from './controllers/modalidad/modalidad-programa.controller';
import { NodosConversacionalesController } from './controllers/nodo/nodos-conversacionales.controller';
import { SesionesConversacionalesController } from './controllers/sesion/sesiones-conversacionales.controller';
import { NodoActualController } from './controllers/sesion/nodo-actual.controller';
import { HistorialInteraccionesController } from './controllers/sesion/historial-interacciones.controller';
import { TransicionesConversacionalesController } from './controllers/transicion/transiciones-conversacionales.controller';
import { RespuestasConversacionalesController } from './controllers/sesion/respuestas-conversacionales.controller';
import { ErroresClienteChatController } from './controllers/sesion/errores-cliente-chat.controller';

export const ChatPresentationProviders = [
  RespuestasConversacionalesController,
  ErroresClienteChatController,
  NodoActualController,
  HistorialInteraccionesController,
  SesionesConversacionalesController,
  ModalidadProgramaController,
  ContenidoVigenteChatController,
  FlujosConversacionalesController,
  NodosConversacionalesController,
  TransicionesConversacionalesController,
  CatalogosChatController,
  ArbolesPersonalizadosController,
];
