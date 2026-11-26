import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import {
  BitacoraRepository,
  ColaAuditoriaPort,
} from '../../application/ports/auditoria.port';
import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';

const COLA_AUDITORIA = 'auditoria-diferida';

@Injectable()
export class BullMqAuditoriaAdapter
  implements ColaAuditoriaPort, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(BullMqAuditoriaAdapter.name);
  private cola?: Queue<RegistroAuditoria>;
  private worker?: Worker<RegistroAuditoria>;
  private disponible = () => false;

  constructor(private readonly bitacora: BitacoraRepository) {}

  onApplicationBootstrap(): void {
    const url = process.env.AUDITORIA_REDIS_URL;
    if (!url) return;

    if (
      !URL.canParse(url) ||
      !['redis:', 'rediss:'].includes(new URL(url).protocol)
    ) {
      this.logger.error('La URL de Redis para auditoría no es válida.');
      return;
    }

    const cola = new Queue<RegistroAuditoria>(COLA_AUDITORIA, {
      connection: {
        url,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        commandTimeout: 2000,
      },
      defaultJobOptions: {
        attempts: 6,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: { count: 1000 },
      },
    });
    this.cola = cola;
    this.worker = new Worker<RegistroAuditoria>(
      COLA_AUDITORIA,
      async ({ data }) => {
        try {
          await this.bitacora.enTransaccion((tx) =>
            this.bitacora.insertar(tx, data, true),
          );
        } catch {
          throw new Error('No se pudo persistir la auditoría diferida.');
        }
      },
      { connection: { url, maxRetriesPerRequest: null } },
    );

    const errorRedis = () =>
      this.logger.debug('Redis de auditoría no está disponible.');
    cola.on('error', errorRedis);
    this.worker.on('error', errorRedis);
    void cola.client
      .then((cliente) => {
        this.disponible = () => cliente.status === 'ready';
      })
      .catch(errorRedis);
  }

  async encolar(registro: RegistroAuditoria): Promise<void> {
    if (!this.cola || !this.disponible())
      throw new Error('Cola de auditoría no disponible.');
    await this.cola.add('registrar-auditoria', registro, {
      jobId: registro.id_auditoria,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.cola?.close();
  }
}
