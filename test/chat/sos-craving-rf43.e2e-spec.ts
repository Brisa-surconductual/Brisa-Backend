import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProcesarRespuestaDtoRequest } from '../../src/modules/chat/application/dto/procesar-respuesta.dto-request';
import type { EventoSosActivado } from '../../src/modules/chat/application/ports/evento-sos-activado';
import type { PerfilClinicoVigentePort } from '../../src/modules/chat/application/ports/perfil-clinico-vigente.port';
import { EstadoConversacionalService } from '../../src/modules/chat/application/services/estado-conversacional.service';
import { HabilitacionNodoService } from '../../src/modules/chat/application/services/habilitacion-nodo.service';
import type { PresentarNodoActualService } from '../../src/modules/chat/application/services/presentar-nodo-actual.service';
import { ProcesarRespuestaUseCase } from '../../src/modules/chat/application/use-cases/sesion/procesar-respuesta.use-case';
import { ActivarSosUseCase } from '../../src/modules/chat/application/use-cases/sos/activar-sos.use-case';
import { FinalizarIntervencionSosUseCase } from '../../src/modules/chat/application/use-cases/sos/finalizar-intervencion-sos.use-case';
import type { NodoConversacional } from '../../src/modules/chat/domain/entities/flujo/nodo-conversacional.entity';
import { MotivoFinalizacionSos } from '../../src/modules/chat/domain/enums/intervencion-sos.enum';
import {
  IntervencionSosEnCursoException,
  IntervencionSosFinalizadaException,
  TiempoSosAgotadoException,
} from '../../src/modules/chat/domain/exceptions';
import type { HabilitacionContenidoChatRepository } from '../../src/modules/chat/domain/repositories/habilitacion-contenido-chat.repository';
import { PrismaArbolConversacionalRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-arbol-conversacional.repository';
import { PrismaEventosSeguimientoRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-eventos-seguimiento.repository';
import { PrismaIntervencionSosRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-intervencion-sos.repository';
import { PrismaProcesarRespuestaRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-procesar-respuesta.repository';
import { PrismaSesionConversacionalRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-sesion-conversacional.repository';
import { FormatoRespuestaAdapter } from '../../src/modules/chat/infrastructure/validation/formato-respuesta.adapter';

/**
 * RF-43 contra PostgreSQL real. Requiere:
 * - una base local desechable `brisa_rf43_*` con todas las migraciones;
 * - el cliente de Prisma regenerado desde esa base (incluye `SOS`).
 * RF43_TEST_DATABASE_URL=postgresql://postgres@localhost:55432/brisa_rf43_test
 */
const urlBd = process.env.RF43_TEST_DATABASE_URL;
const conPostgres = urlBd ? describe : describe.skip;

jest.setTimeout(45_000);

conPostgres('RF-43 protocolo SOS (PostgreSQL)', () => {
  let prisma: PrismaService;
  let activar: ActivarSosUseCase;
  let finalizar: FinalizarIntervencionSosUseCase;
  let responder: ProcesarRespuestaUseCase;
  let sesiones: PrismaSesionConversacionalRepository;
  let sos: PrismaIntervencionSosRepository;
  let eventos: PrismaEventosSeguimientoRepository;
  const admin = randomUUID();
  const sosInicial = randomUUID();
  const sosFinal = randomUUID();
  const flujoTerapia = randomUUID();
  const terapiaInicial = randomUUID();

  beforeAll(async () => {
    const url = new URL(urlBd ?? '');
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !/^\/brisa_rf43_[a-z0-9_]+$/.test(url.pathname)
    )
      throw new Error('RF-43 requiere una base local desechable brisa_rf43_*.');
    const anterior = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url.toString();
    try {
      prisma = new PrismaService();
    } finally {
      if (anterior === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = anterior;
    }
    await prisma.$connect();

    const presentar = {
      preparar: (_s: unknown, nodo: NodoConversacional) =>
        Promise.resolve({
          nodo: {
            idNodo: nodo.idNodo,
            tipoNodo: nodo.nombreTipoNodo,
            esTerminal: false,
            disponibilidad: { habilitado: true, habilitaAprox: null },
            bloques: [],
            entrada: null,
          },
        }),
    } as unknown as PresentarNodoActualService;
    const perfil = {
      obtener: () => Promise.resolve({ tipo_craving: 'POSITIVO' }),
    } as unknown as PerfilClinicoVigentePort;

    sos = new PrismaIntervencionSosRepository(prisma);
    sesiones = new PrismaSesionConversacionalRepository(prisma);
    eventos = new PrismaEventosSeguimientoRepository(prisma);
    activar = new ActivarSosUseCase(
      sos,
      new PrismaArbolConversacionalRepository(prisma),
      perfil,
      presentar,
    );
    finalizar = new FinalizarIntervencionSosUseCase(sos, sesiones);
    responder = new ProcesarRespuestaUseCase(
      new PrismaProcesarRespuestaRepository(prisma),
      new FormatoRespuestaAdapter(),
      new EstadoConversacionalService(),
      new HabilitacionNodoService({} as HabilitacionContenidoChatRepository),
    );

    const flujoSos = randomUUID();
    await prisma.$transaction([
      prisma.$executeRaw`INSERT INTO chat.tipo_nodo (nombre) VALUES ('MENSAJE') ON CONFLICT (nombre) DO NOTHING`,
      prisma.$executeRaw`
        INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol)
        VALUES (${admin}::uuid, ${`${admin}@example.invalid`}, 'fixture-rf43', 'ADMINISTRATIVO')`,
      // Flujo SOS publicado: inicial (CONTINUAR) → final, por avance implícito.
      prisma.$executeRaw`
        INSERT INTO chat.flujo_conversacion (id_flujo, nombre, modalidad, version, creado_por)
        VALUES (${flujoSos}::uuid, 'SOS e2e', 'SOS', 1, ${admin}::uuid)`,
      prisma.$executeRaw`
        INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, creado_por, es_nodo_inicial, es_nodo_final, orden)
        SELECT ${sosInicial}::uuid, ${flujoSos}::uuid, id_tipo_nodo, '{"texto":"Respira"}'::jsonb, ${admin}::uuid, true, false, 1
        FROM chat.tipo_nodo WHERE nombre = 'MENSAJE'
        UNION ALL
        SELECT ${sosFinal}::uuid, ${flujoSos}::uuid, id_tipo_nodo, '{"texto":"Lo lograste"}'::jsonb, ${admin}::uuid, false, true, 2
        FROM chat.tipo_nodo WHERE nombre = 'MENSAJE'`,
      prisma.$executeRaw`UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO' WHERE id_flujo = ${flujoSos}::uuid`,
      // Flujo de terapia (grupal) para las sesiones que se pausan.
      prisma.$executeRaw`
        INSERT INTO chat.flujo_conversacion (id_flujo, nombre, modalidad, version, creado_por)
        VALUES (${flujoTerapia}::uuid, 'Terapia e2e', 'GRUPAL', 1, ${admin}::uuid)`,
      prisma.$executeRaw`
        INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, creado_por, es_nodo_inicial, orden)
        SELECT ${terapiaInicial}::uuid, ${flujoTerapia}::uuid, id_tipo_nodo, '{"texto":"Hola"}'::jsonb, ${admin}::uuid, true, 1
        FROM chat.tipo_nodo WHERE nombre = 'MENSAJE'`,
    ]);
  });

  afterAll(async () => prisma?.$disconnect());

  async function estudianteConSesionActiva() {
    const usuario = randomUUID();
    const sesion = randomUUID();
    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash)
        VALUES (${usuario}::uuid, ${`${usuario}@example.invalid`}, 'fixture-rf43')`,
      prisma.$executeRaw`
        INSERT INTO chat.sesiones (id_sesion, id_usuario, id_flujo_conversacional, version_arbol_utilizada, modalidad_activa, id_nodo_actual)
        VALUES (${sesion}::uuid, ${usuario}::uuid, ${flujoTerapia}::uuid, 1, 'GRUPAL', ${terapiaInicial}::uuid)`,
      prisma.$executeRaw`INSERT INTO chat.estado_sesiones (id_sesion) VALUES (${sesion}::uuid)`,
    ]);
    return { usuario, sesion };
  }

  const continuar = (idNodo: string): ProcesarRespuestaDtoRequest => ({
    id_interaccion: randomUUID(),
    id_nodo: idNodo,
    secuencia: 1,
    tipo_entrada: 'CONTINUAR',
    valor: null,
    timestamp_interaccion: new Date().toISOString(),
    estado_conectividad: 'EN_LINEA',
  });

  it('activa, pausa la terapia, completa el sub-árbol, finaliza y deja el evento para M05', async () => {
    const { usuario, sesion } = await estudianteConSesionActiva();

    const activada = await activar.execute(usuario);

    expect(activada.sesion_pausada).toEqual({ id_sesion: sesion });
    expect(activada.nodo_actual.id_nodo).toBe(sosInicial);
    expect(
      Date.parse(activada.fin_maximo_servidor) -
        Date.parse(activada.inicio_servidor),
    ).toBe(60_000);
    const [estadoTerapia] = await prisma.$queryRaw<
      { estado: string; motivo: string | null; pausa: boolean }[]
    >`
      SELECT estado_actual::text AS estado, motivo_pausa::text AS motivo, fecha_pausa IS NOT NULL AS pausa
      FROM chat.estado_sesiones WHERE id_sesion = ${sesion}::uuid`;
    expect(estadoTerapia).toEqual({
      estado: 'PAUSADA',
      motivo: 'SOS_CRAVING',
      pausa: true,
    });

    // Doble toque: la intervención vigente no se duplica.
    await expect(activar.execute(usuario)).rejects.toBeInstanceOf(
      IntervencionSosEnCursoException,
    );

    // RF-32 retoma la sesión de terapia, nunca la SOS.
    const pendiente = await sesiones.buscarUltimaNoCompletada(usuario);
    expect(pendiente?.idSesion).toBe(sesion);
    expect(pendiente?.idNodoActual).toBe(terapiaInicial);

    const paso = await responder.execute(
      activada.id_sesion_sos,
      usuario,
      continuar(sosInicial),
    );
    expect(paso.estado_sesion).toBe('COMPLETADA');

    const fin = await finalizar.execute(
      activada.id_intervencion,
      usuario,
      MotivoFinalizacionSos.COMPLETADA,
    );
    expect(fin.estado).toBe('COMPLETA');
    expect(fin.duracion_segundos).toBeGreaterThanOrEqual(0);
    expect(fin.duracion_segundos).toBeLessThanOrEqual(60);
    expect(fin.sesion_pausada).toEqual({
      id_sesion: sesion,
      id_nodo_actual: terapiaInicial,
    });

    await expect(
      finalizar.execute(
        activada.id_intervencion,
        usuario,
        MotivoFinalizacionSos.COMPLETADA,
      ),
    ).rejects.toBeInstanceOf(IntervencionSosFinalizadaException);

    const filas = await prisma.$queryRaw<{ tipo: string }[]>`
      SELECT tipo_evento::text AS tipo FROM chat.eventos_seguimiento
      WHERE id_usuario = ${usuario}::uuid`;
    expect(filas).toEqual([{ tipo: 'CHAT_SOS_ACTIVADO' }]);

    const reservados = await eventos.reservarPendientes(30_000);
    const evento = reservados.find(
      (e) => e.id_usuario === usuario,
    ) as EventoSosActivado;
    expect(evento).toMatchObject({
      tipo: 'CHAT_SOS_ACTIVADO',
      id_intervencion: activada.id_intervencion,
      tipo_craving: 'POSITIVO',
      duracion_intervencion: fin.duracion_segundos,
      estado_intervencion: 'COMPLETA',
      nivel_craving: 5,
      estado_sesion_anterior: 'ACTIVA',
    });
  });

  it('pasado el límite del servidor rechaza respuestas y el cron la expira con 60 s', async () => {
    const { usuario } = await estudianteConSesionActiva();
    const activada = await activar.execute(usuario);
    // Simula una activación de hace 2 minutos (el CHECK exige límite = inicio + 60 s).
    await prisma.$executeRaw`
      UPDATE chat.intervenciones_sos
      SET fecha_activacion = now() - interval '120 seconds',
          fecha_limite = now() - interval '60 seconds'
      WHERE id_intervencion = ${activada.id_intervencion}::uuid`;

    await expect(
      responder.execute(activada.id_sesion_sos, usuario, continuar(sosInicial)),
    ).rejects.toBeInstanceOf(TiempoSosAgotadoException);

    await sos.expirarVencidas(100);

    const [fila] = await prisma.$queryRaw<
      { estado: string; duracion: number }[]
    >`
      SELECT estado::text AS estado, duracion_segundos AS duracion
      FROM chat.intervenciones_sos WHERE id_intervencion = ${activada.id_intervencion}::uuid`;
    expect(fila).toEqual({ estado: 'EXPIRADA', duracion: 60 });

    // Con la anterior cerrada, un nuevo toque activa otra intervención.
    const otra = await activar.execute(usuario);
    expect(otra.id_intervencion).not.toBe(activada.id_intervencion);
    // La terapia ya estaba pausada: se ofrece retomarla sin volver a pausar.
    expect(otra.sesion_pausada).toEqual(activada.sesion_pausada);
  });
});
