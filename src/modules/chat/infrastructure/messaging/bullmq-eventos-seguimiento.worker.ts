import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { Queue, RedisOptions, Worker } from 'bullmq';
import {
  EVENTO_SESION_FINALIZADA,
  TIPO_EVENTO_SESION_FINALIZADA,
} from '../../application/ports/evento-sesion-finalizada';
import {
  EVENTO_SOS_ACTIVADO,
  EventoSeguimientoChat,
  TIPO_EVENTO_SOS_ACTIVADO,
} from '../../application/ports/evento-sos-activado';
import { PrismaEventosSeguimientoRepository } from '../persistence/prisma-eventos-seguimiento.repository';

function configuracionRedis(cadena: string): RedisOptions {
  const url = new URL(cadena);
  const db = Number(url.pathname.slice(1) || 0);
  if (
    !['redis:', 'rediss:'].includes(url.protocol) ||
    !url.hostname ||
    !Number.isSafeInteger(db) ||
    db < 0
  ) {
    throw new Error('Se requiere una URL de Redis.');
  }
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: decodeURIComponent(url.username) || undefined,
    password: decodeURIComponent(url.password) || undefined,
    db,
    ...(url.protocol === 'rediss:' && { tls: {} }),
  };
}

/**
 * Tópico interno de cada tipo de evento. La cola BullMQ es una sola
 * (`chat.sesion-finalizada`, RF-39); M05 escucha un tópico por tipo.
 */
export const TOPICO_POR_TIPO: Readonly<
  Record<EventoSeguimientoChat['tipo'], string>
> = {
  [TIPO_EVENTO_SESION_FINALIZADA]: EVENTO_SESION_FINALIZADA,
  [TIPO_EVENTO_SOS_ACTIVADO]: EVENTO_SOS_ACTIVADO,
};

function enteroPositivo(valor: string | undefined, defecto: number): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 && numero <= 2_147_483_647
    ? numero
    : defecto;
}

@Injectable()
export class BullMqEventosSeguimientoWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BullMqEventosSeguimientoWorker.name);
  private cola?: Queue<EventoSeguimientoChat>;
  private worker?: Worker<EventoSeguimientoChat>;
  private envio?: Promise<void>;
  private redisListo = () => false;
  private readonly reenvioMs = enteroPositivo(
    process.env.CHAT_SEGUIMIENTO_REENCOLAR_MS,
    30_000,
  );

  constructor(
    private readonly repositorio: PrismaEventosSeguimientoRepository,
    private readonly eventos: EventEmitter2,
  ) {}

  onApplicationBootstrap(): void {
    const url = process.env.CHAT_SEGUIMIENTO_REDIS_URL;
    if (!url) return;

    let base: RedisOptions;
    try {
      base = configuracionRedis(url);
    } catch {
      this.logger.error('La URL de Redis para seguimiento no es válida.');
      return;
    }

    const cola = new Queue<EventoSeguimientoChat>(EVENTO_SESION_FINALIZADA, {
      connection: {
        ...base,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        commandTimeout: 2000,
      },
      defaultJobOptions: {
        attempts: enteroPositivo(process.env.CHAT_SEGUIMIENTO_INTENTOS, 5),
        backoff: {
          type: 'exponential',
          delay: enteroPositivo(process.env.CHAT_SEGUIMIENTO_BACKOFF_MS, 1000),
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    });
    this.cola = cola;
    this.worker = new Worker<EventoSeguimientoChat>(
      EVENTO_SESION_FINALIZADA,
      (trabajo) => this.entregar(trabajo.data),
      { connection: { ...base, maxRetriesPerRequest: null } },
    );

    const informarErrorRedis = () =>
      this.logger.debug('Redis de seguimiento no está disponible.');
    cola.on('error', informarErrorRedis);
    this.worker.on('error', informarErrorRedis);
    void cola.client
      .then((cliente) => {
        this.redisListo = () => cliente.status === 'ready';
      })
      .catch(informarErrorRedis);
  }

  @Interval('encolar-eventos-seguimiento-chat', 200)
  async encolarPendientes(): Promise<void> {
    if (!this.cola || this.envio || !this.redisListo()) return;
    this.envio = this.encolar(this.cola);
    try {
      await this.envio;
    } catch {
      this.logger.warn('No fue posible encolar eventos de seguimiento.');
    } finally {
      this.envio = undefined;
    }
  }

  async onModuleDestroy(): Promise<void> {
    const cola = this.cola;
    this.cola = undefined;
    await this.envio?.catch(() => undefined);
    await this.worker?.close();
    await cola?.close();
  }

  private async encolar(cola: Queue<EventoSeguimientoChat>): Promise<void> {
    const pendientes = await this.repositorio.reservarPendientes(
      this.reenvioMs,
    );
    if (pendientes.length === 0) return;

    try {
      await cola.addBulk(
        pendientes.map((evento) => ({
          name: evento.tipo,
          data: evento,
          opts: { jobId: evento.id_evento },
        })),
      );
    } catch {
      await this.repositorio.marcarError(pendientes.map((e) => e.id_evento));
      throw new Error('No fue posible publicar en la cola de seguimiento.');
    }
  }

  private async entregar(evento: EventoSeguimientoChat): Promise<void> {
    if (!(await this.repositorio.estaPendiente(evento.id_evento))) return;

    try {
      const topico = TOPICO_POR_TIPO[evento.tipo];
      if (topico === undefined || !this.eventos.hasListeners(topico)) {
        throw new Error('M05 no está disponible.');
      }
      await this.eventos.emitAsync(topico, evento);
      await this.repositorio.marcarEntregado(evento.id_evento);
    } catch {
      await this.repositorio.marcarError([evento.id_evento]);
      throw new Error('No se confirmó la entrega del evento a M05.');
    }
  }
}
