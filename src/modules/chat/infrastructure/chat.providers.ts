import { ContenidoVigenteChatPort } from '../application/ports/contenido-vigente-chat.port';
import { ArbolConversacionalRepository } from '../domain/repositories/arbol-conversacional.repository';
import { ContextoConversacionalRepository } from '../domain/repositories/contexto-conversacional.repository';
import { CronogramaContenidoVigenteAdapter } from './integration/cronograma-contenido-vigente.adapter';
import { PrismaArbolConversacionalRepository } from './persistence/prisma-arbol-conversacional.repository';
import { PrismaContextoConversacionalRepository } from './persistence/prisma-contexto-conversacional.repository';

export const ChatInfrastructureProviders = [
  {
    provide: ContenidoVigenteChatPort,
    useClass: CronogramaContenidoVigenteAdapter,
  },
  {
    provide: ArbolConversacionalRepository,
    useClass: PrismaArbolConversacionalRepository,
  },
  {
    provide: ContextoConversacionalRepository,
    useClass: PrismaContextoConversacionalRepository,
  },
];
