import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProcesarRespuestaDtoRequest } from '../../src/modules/chat/application/dto/procesar-respuesta.dto-request';
import {
  EVENTO_SESION_FINALIZADA,
  EventoSesionFinalizada,
} from '../../src/modules/chat/application/ports/evento-sesion-finalizada';
import { ProcesarRespuestaUseCase } from '../../src/modules/chat/application/use-cases/sesion/procesar-respuesta.use-case';
import { BullMqEventosSeguimientoWorker } from '../../src/modules/chat/infrastructure/messaging/bullmq-eventos-seguimiento.worker';
import { PrismaEventosSeguimientoRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-eventos-seguimiento.repository';
import { PrismaProcesarRespuestaRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-procesar-respuesta.repository';
import { FormatoRespuestaAdapter } from '../../src/modules/chat/infrastructure/validation/formato-respuesta.adapter';

const urlBd = process.env.RF39_TEST_DATABASE_URL;
const urlRedis = process.env.RF39_TEST_REDIS_URL;
const conPostgres = urlBd ? describe : describe.skip;
const conRedis = urlRedis ? it : it.skip;

jest.setTimeout(45_000);

conPostgres('RF-39 desde el cierre de sesión hasta M05', () => {
  let prisma: PrismaService;
  let persistencia: PrismaProcesarRespuestaRepository;
  let responder: ProcesarRespuestaUseCase;

  beforeAll(async () => {
    const url = new URL(urlBd ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf39_[a-z0-9_]+$/.test(url.pathname)
    ) {
      throw new Error('RF-39 requiere una base local desechable brisa_rf39_*.');
    }
    const anterior = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url.toString();
    try {
      prisma = new PrismaService();
    } finally {
      restaurarEnv('DATABASE_URL', anterior);
    }
    await prisma.$connect();
    persistencia = new PrismaProcesarRespuestaRepository(prisma);
    responder = new ProcesarRespuestaUseCase(
      persistencia,
      new FormatoRespuestaAdapter(),
    );
  });

  afterAll(async () => prisma?.$disconnect());

  async function crearSesion(modalidad: 'GRUPAL' | 'PERSONALIZADA') {
    const usuario = randomUUID();
    const flujo = randomUUID();
    const inicio = randomUUID();
    const fin = randomUUID();
    const sesion = randomUUID();
    const regla = randomUUID();
    const dependencia = modalidad === 'PERSONALIZADA' ? 'TOLERANCIA' : null;
    const craving = modalidad === 'PERSONALIZADA' ? 'NEGATIVO' : null;
    const [siguienteVersion] = await prisma.$queryRaw<{ version: number }[]>`
      SELECT COALESCE(MAX(version), 0) + 1 AS version
      FROM chat.flujo_conversacion WHERE modalidad = ${modalidad}::chat.modalidad_enum
    `;
    const { version } = siguienteVersion;
    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash)
        VALUES (${usuario}::uuid, ${`${usuario}@example.invalid`}, 'fixture-rf39')
      `,
      prisma.$executeRaw`
        INSERT INTO chat.flujo_conversacion
          (id_flujo, nombre, modalidad, version, creado_por, tipo_dependencia, tipo_craving)
        VALUES (${flujo}::uuid, 'RF39 local', ${modalidad}::chat.modalidad_enum, ${version},
          ${usuario}::uuid, ${dependencia}::chat.tipo_dependencia_enum, ${craving}::chat.tipo_craving_enum)
      `,
      prisma.$executeRaw`
        INSERT INTO chat.tipo_nodo (nombre) VALUES ('PREGUNTA'), ('MENSAJE')
        ON CONFLICT (nombre) DO NOTHING
      `,
      prisma.$executeRaw`
        INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, creado_por, es_nodo_inicial, orden)
        SELECT ${inicio}::uuid, ${flujo}::uuid, id_tipo_nodo,
          '{"entrada":{"tipo_entrada":"ESCALA"}}'::jsonb, ${usuario}::uuid, true, 1
        FROM chat.tipo_nodo WHERE nombre = 'PREGUNTA'
        UNION ALL
        SELECT ${fin}::uuid, ${flujo}::uuid, id_tipo_nodo, '{"texto":"Fin"}'::jsonb, ${usuario}::uuid, false, 2
        FROM chat.tipo_nodo WHERE nombre = 'MENSAJE'
      `,
      prisma.$executeRaw`
        INSERT INTO chat.reglas_validaciones
          (id_regla_validacion,tipo_dato,valor_min,valor_max,mensaje_error,operador_condicion,valor_esperado)
        VALUES (${regla}::uuid, 'NUMERICO', 1, 10, 'Fuera de rango', 'RANGO', '{"min":1,"max":10}')
      `,
      prisma.$executeRaw`
        INSERT INTO chat.reglas_nodos (id_flujo,id_nodo_origen,id_nodo_destino,id_regla_validacion,orden_evaluacion)
        VALUES (${flujo}::uuid, ${inicio}::uuid, ${fin}::uuid, ${regla}::uuid, 1)
      `,
      prisma.$executeRaw`
        INSERT INTO chat.sesiones (id_sesion,id_usuario,id_flujo_conversacional,version_arbol_utilizada,
          modalidad_activa,id_nodo_actual,tipo_dependencia,tipo_craving)
        VALUES (${sesion}::uuid, ${usuario}::uuid, ${flujo}::uuid, ${version}, ${modalidad}::chat.modalidad_enum,
          ${inicio}::uuid, ${dependencia}::chat.tipo_dependencia_enum, ${craving}::chat.tipo_craving_enum)
      `,
      prisma.$executeRaw`
        INSERT INTO chat.estado_sesiones (id_sesion, estado_actual) VALUES (${sesion}::uuid, 'ACTIVA')
      `,
    ]);
    const respuesta: ProcesarRespuestaDtoRequest = {
      id_interaccion: randomUUID(),
      id_nodo: inicio,
      secuencia: 1,
      tipo_entrada: 'ESCALA',
      valor: 7,
      timestamp_interaccion: new Date().toISOString(),
      estado_conectividad: 'EN_LINEA',
    };
    return { usuario, sesion, respuesta };
  }

  function buscar(sesion: string) {
    return prisma.$queryRaw<
      Array<{
        id_evento: string;
        estado: 'ENCOLADO' | 'ERROR_REINTENTO' | 'ENTREGADO';
        timestamp: Date;
      }>
    >`SELECT * FROM chat.eventos_seguimiento WHERE id_sesion = ${sesion}::uuid`;
  }

  it.each(['GRUPAL', 'PERSONALIZADA'] as const)(
    'encola un solo evento para un cierre %s, incluso si se reenvía la respuesta',
    async (modalidad) => {
      const { sesion, usuario, respuesta } = await crearSesion(modalidad);
      const aceptada = await responder.execute(sesion, usuario, respuesta);
      expect(aceptada.estado_sesion).toBe('COMPLETADA');
      await expect(
        responder.execute(sesion, usuario, respuesta),
      ).resolves.toMatchObject({
        duplicada: true,
      });
      const filas = await buscar(sesion);
      expect(filas).toHaveLength(1);
      expect(filas[0]).toMatchObject({
        estado: 'ENCOLADO',
        origen_evento: 'CIERRE_SESION',
        modalidad,
        tipo_dependencia: modalidad === 'GRUPAL' ? null : 'TOLERANCIA',
        tipo_craving: modalidad === 'GRUPAL' ? null : 'NEGATIVO',
      });
      expect(filas[0].timestamp.toISOString()).toBe(aceptada.registrada_en);
    },
  );

  it('revierte la interacción, el cierre y el outbox juntos si falla el commit lógico', async () => {
    const { sesion, usuario, respuesta } = await crearSesion('GRUPAL');
    const abortar = new ProcesarRespuestaUseCase(
      {
        ejecutar: (operacion) =>
          persistencia.ejecutar(async (tx) => {
            await operacion(tx);
            throw new Error('Rollback intencional de la prueba.');
          }),
      },
      new FormatoRespuestaAdapter(),
    );

    await expect(
      abortar.execute(sesion, usuario, respuesta),
    ).rejects.toMatchObject({ status: 500 });
    await expect(buscar(sesion)).resolves.toEqual([]);
    await expect(
      prisma.estado_sesiones.findUnique({ where: { id_sesion: sesion } }),
    ).resolves.toMatchObject({ estado_actual: 'ACTIVA' });
    await expect(
      prisma.interacciones.count({ where: { id_sesion: sesion } }),
    ).resolves.toBe(0);
  });

  it('omite cierres sin respuestas válidas', async () => {
    const { sesion } = await crearSesion('GRUPAL');
    await prisma.estado_sesiones.update({
      where: { id_sesion: sesion },
      data: { estado_actual: 'COMPLETADA' },
    });
    await expect(buscar(sesion)).resolves.toEqual([]);
  });

  conRedis(
    'entrega por BullMQ y conserva el mismo evento si M05 falla o está ausente',
    async () => {
      const url = new URL(urlRedis ?? '');
      if (url.hostname !== '127.0.0.1' || url.port !== '56379') {
        throw new Error('Usa el Redis aislado de RF-39 en 127.0.0.1:56379.');
      }
      const variables = {
        CHAT_SEGUIMIENTO_REDIS_URL: url.toString(),
        CHAT_SEGUIMIENTO_INTENTOS: '2',
        CHAT_SEGUIMIENTO_BACKOFF_MS: '50',
        CHAT_SEGUIMIENTO_REENCOLAR_MS: '150',
      };
      const bus = new EventEmitter2();
      const anteriores = Object.keys(variables).map(
        (key) => [key, process.env[key]] as const,
      );
      Object.assign(process.env, variables);
      const worker = new BullMqEventosSeguimientoWorker(
        new PrismaEventosSeguimientoRepository(prisma),
        bus,
      );
      try {
        worker.onApplicationBootstrap();
        const { sesion, usuario, respuesta } =
          await crearSesion('PERSONALIZADA');
        const aceptada = await responder.execute(sesion, usuario, respuesta);
        expect(aceptada.estado_sesion).toBe('COMPLETADA');
        await esperarEstado(
          worker,
          async () => (await buscar(sesion))[0]?.estado === 'ERROR_REINTENTO',
        );
        const [pendiente] = await buscar(sesion);

        const entregas: EventoSesionFinalizada[] = [];
        bus.on(EVENTO_SESION_FINALIZADA, (evento: EventoSesionFinalizada) => {
          if (evento.id_sesion !== sesion) return;
          entregas.push(evento);
          if (entregas.length === 1)
            throw new Error('M05 aún no puede procesar el evento.');
        });
        await esperarEstado(
          worker,
          async () => (await buscar(sesion))[0]?.estado === 'ENTREGADO',
        );
        expect(entregas).toHaveLength(2);
        expect(entregas[0]).toEqual(entregas[1]);
        expect(entregas[1]).toEqual({
          id_evento: pendiente.id_evento,
          id_usuario: usuario,
          id_sesion: sesion,
          modalidad: 'PERSONALIZADA',
          tipo: 'CHAT_SESION_FINALIZADA',
          version: '1.0',
          tipo_dependencia: 'TOLERANCIA',
          tipo_craving: 'NEGATIVO',
          origen_evento: 'CIERRE_SESION',
          timestamp: aceptada.registrada_en,
        });
        await worker.encolarPendientes();
        expect(entregas).toHaveLength(2);
      } finally {
        await worker.onModuleDestroy();
        for (const [key, valor] of anteriores) restaurarEnv(key, valor);
      }
    },
  );
});

function restaurarEnv(key: string, valor: string | undefined) {
  if (valor === undefined) delete process.env[key];
  else process.env[key] = valor;
}

async function esperarEstado(
  worker: BullMqEventosSeguimientoWorker,
  listo: () => Promise<boolean>,
) {
  const limite = Date.now() + 20_000;
  while (Date.now() < limite) {
    await worker.encolarPendientes();
    if (await listo()) return;
    await esperar(50);
  }
  throw new Error('BullMQ no confirmó el estado esperado del outbox.');
}
