import { CondicionesInicializacionUsuarioRepository } from '../domain/repositories/condiciones-inicializacion-usuario.repository';
import { CronogramaRepository } from '../domain/repositories/cronograma.repository';
import { CronogramaUsuarioRepository } from '../domain/repositories/cronograma-usuario.repository';
import { InicializarCronogramasPendientesCron } from './cron/inicializar-cronogramas-pendientes.cron';
import { PrismaCondicionesInicializacionUsuarioRepository } from './persistence/prisma-condiciones-inicializacion-usuario.repository';
import { PrismaCronogramaRepository } from './persistence/prisma-cronograma.repository';
import { PrismaCronogramaUsuarioRepository } from './persistence/prisma-cronograma-usuario.repository';
import { PrismaUnidadTemporalRepository } from './persistence/prisma-unidad-temporal.repository';
import { UnidadTemporalRepository } from '../domain/repositories/unidad-temporal.repository';
import { ContenidoRepository } from '../domain/repositories/contenido.repository';
import { PrismaContenidoRepository } from './persistence/prisma-contenido.repository';
import { RecursoContenidoRepository } from '../domain/repositories/recurso-contenido.repository';
import { PrismaRecursoContenidoRepository } from './persistence/prisma-recurso-contenido.repository';
import { EventoContenidoRepository } from '../domain/repositories/evento-contenido.repository';
import { EventoContenidoPublisher } from '../application/ports/evento-contenido.publisher';
import { PublicarEventosContenidoCron } from './cron/publicar-eventos-contenido.cron';
import { NestEventoContenidoPublisher } from './messaging/nest-evento-contenido.publisher';
import { PrismaEventoContenidoRepository } from './persistence/prisma-evento-contenido.repository';
import { PrismaContenidoCronogramaRepository } from './persistence/primsa-contenido-cronograma.repository';
import { ContenidoCronogramaRepository } from '../domain/repositories/contenido-cronograma.repository';
import { AlmacenamientoRecursosPort } from '../application/ports/almacenamiento-recursos.port';
import { S3AlmacenamientoRecursosAdapter } from './storage/s3-almacenamiento-recursos.adapter';
import { crearS3Client, S3_CLIENT } from './storage/s3-client.provider';
import { ModuloSistemaRepository } from '../domain/repositories/modulo-sistema.repository';
import { PrismaModuloSistemaRepository } from './persistence/prisma-modulo-sistema.repository';

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
  {
    provide: UnidadTemporalRepository,
    useClass: PrismaUnidadTemporalRepository,
  },
  {
    provide: ContenidoRepository,
    useClass: PrismaContenidoRepository,
  },
  {
    provide: RecursoContenidoRepository,
    useClass: PrismaRecursoContenidoRepository,
  },
  {
    provide: EventoContenidoRepository,
    useClass: PrismaEventoContenidoRepository,
  },
  {
    provide: EventoContenidoPublisher,
    useClass: NestEventoContenidoPublisher,
  },
  {
    provide: S3_CLIENT,
    useFactory: crearS3Client,
  },
  {
    provide: AlmacenamientoRecursosPort,
    useClass: S3AlmacenamientoRecursosAdapter,
  },
  {
    provide: ModuloSistemaRepository,
    useClass: PrismaModuloSistemaRepository,
  },
  {
    provide: ContenidoCronogramaRepository,
    useClass: PrismaContenidoCronogramaRepository,
  },

  InicializarCronogramasPendientesCron,
  PublicarEventosContenidoCron,
];
