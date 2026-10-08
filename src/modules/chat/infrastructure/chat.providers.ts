import { ArbolConversacionalRepository } from '../domain/repositories/arbol-conversacional.repository';
import { PrismaArbolConversacionalRepository } from './persistence/prisma-arbol-conversacional.repository';

export const ChatInfrastructureProviders = [
  {
    provide: ArbolConversacionalRepository,
    useClass: PrismaArbolConversacionalRepository,
  },
];
