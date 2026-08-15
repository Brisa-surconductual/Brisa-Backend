import { CondicionesInicializacionUsuarioRepository } from '../domain/repositories/condiciones-inicializacion-usuario.repository';
import { CronogramaRepository } from '../domain/repositories/cronograma.repository';
import { CronogramaUsuarioRepository } from '../domain/repositories/cronograma-usuario.repository';
import { InicializarCronogramasPendientesCron } from './cron/inicializar-cronogramas-pendientes.cron';
import { PrismaCondicionesInicializacionUsuarioRepository } from './persistence/prisma-condiciones-inicializacion-usuario.repository';
import { PrismaCronogramaRepository } from './persistence/prisma-cronograma.repository';
import { PrismaCronogramaUsuarioRepository } from './persistence/prisma-cronograma-usuario.repository';

export const CronogramaInfrastructureProviders = [
  {
    provide: CondicionesInicializacionUsuarioRepository,
    useClass: PrismaCondicionesInicializacionUsuarioRepository,
  },
  {
    provide: CronogramaRepository,
    useClass: PrismaCronogramaRepository,
  },
  {
    provide: CronogramaUsuarioRepository,
    useClass: PrismaCronogramaUsuarioRepository,
  },
  InicializarCronogramasPendientesCron,
];
