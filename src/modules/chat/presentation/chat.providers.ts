import { ArbolesPersonalizadosController } from './controllers/arbol-personalizado/arboles-personalizados.controller';
import { CatalogosChatController } from './controllers/catalogos/catalogos-chat.controller';
import { ContenidoVigenteChatController } from './controllers/contenido-vigente/contenido-vigente-chat.controller';
import { FlujosConversacionalesController } from './controllers/flujo/flujos-conversacionales.controller';
import { ModalidadProgramaController } from './controllers/modalidad/modalidad-programa.controller';
import { NodosConversacionalesController } from './controllers/nodo/nodos-conversacionales.controller';
import { ReglasValidacionController } from './controllers/regla-validacion/reglas-validacion.controller';
import { SesionesConversacionalesController } from './controllers/sesion/sesiones-conversacionales.controller';
import { NodoActualController } from './controllers/sesion/nodo-actual.controller';
import { TransicionesConversacionalesController } from './controllers/transicion/transiciones-conversacionales.controller';

export const ChatPresentationProviders = [
  NodoActualController,
  SesionesConversacionalesController,
  ModalidadProgramaController,
  ContenidoVigenteChatController,
  FlujosConversacionalesController,
  NodosConversacionalesController,
  TransicionesConversacionalesController,
  ReglasValidacionController,
  CatalogosChatController,
  ArbolesPersonalizadosController,
];
