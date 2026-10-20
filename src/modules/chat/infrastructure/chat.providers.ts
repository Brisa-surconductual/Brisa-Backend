import { ArbolConversacionalRepository } from '../domain/repositories/arbol-conversacional.repository';
import { PrismaArbolConversacionalRepository } from './persistence/prisma-arbol-conversacional.repository';
import { ContenidoVigenteChatPort } from '../application/ports/contenido-vigente-chat.port';
import { CronogramaContenidoVigenteAdapter } from './integration/cronograma-contenido-vigente.adapter';

export const ChatInfrastructureProviders = [
  {
    provide: ContenidoVigenteChatPort,
    useClass: CronogramaContenidoVigenteAdapter,
  },
  {
    provide: ArbolConversacionalRepository,
    useClass: PrismaArbolConversacionalRepository,
  },
];
