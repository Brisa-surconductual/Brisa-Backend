import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProcesarRespuestaDtoRequest } from '../../src/modules/chat/application/dto/procesar-respuesta.dto-request';
import { EstadoConversacionalService } from '../../src/modules/chat/application/services/estado-conversacional.service';
import { HabilitacionNodoService } from '../../src/modules/chat/application/services/habilitacion-nodo.service';
import { ConsultarTrazabilidadSesionUseCase } from '../../src/modules/chat/application/use-cases/sesion/consultar-trazabilidad-sesion.use-case';
import { ProcesarRespuestaUseCase } from '../../src/modules/chat/application/use-cases/sesion/procesar-respuesta.use-case';
import { SesionConversacionalNoEncontradaException } from '../../src/modules/chat/domain/exceptions/sesion.exceptions';
import type { HabilitacionContenidoChatRepository } from '../../src/modules/chat/domain/repositories/habilitacion-contenido-chat.repository';
import { PrismaHistorialInteraccionesRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-historial-interacciones.repository';
import { PrismaProcesarRespuestaRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-procesar-respuesta.repository';
import { PrismaSesionConversacionalRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-sesion-conversacional.repository';
import { PrismaSeudonimoParticipanteAdapter } from '../../src/modules/chat/infrastructure/persistence/prisma-seudonimo-participante.adapter';
import { FormatoRespuestaAdapter } from '../../src/modules/chat/infrastructure/validation/formato-respuesta.adapter';

/**
 * Trazabilidad contra PostgreSQL real (base local desechable `brisa_traz_*`
 * con todas las migraciones):
 * TRAZABILIDAD_TEST_DATABASE_URL=postgresql://postgres@localhost:55432/brisa_traz_test
 */
const urlBd = process.env.TRAZABILIDAD_TEST_DATABASE_URL;
const conPostgres = urlBd ? describe : describe.skip;

jest.setTimeout(45_000);

conPostgres('Trazabilidad de una sesión (PostgreSQL)', () => {
  let prisma: PrismaService;
  let trazabilidad: ConsultarTrazabilidadSesionUseCase;
  let responder: ProcesarRespuestaUseCase;
  const admin = randomUUID();
  const estudiante = randomUUID();
  const flujo = randomUUID();
  const nodoA = randomUUID();
  const nodoB = randomUUID();
  const nodoFin = randomUUID();
  const sesion = randomUUID();

  beforeAll(async () => {
    const url = new URL(urlBd ?? '');
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !/^\/brisa_traz_[a-z0-9_]+$/.test(url.pathname)
    )
      throw new Error('Requiere una base local desechable brisa_traz_*.');
    const anterior = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url.toString();
    try {
      prisma = new PrismaService();
    } finally {
      if (anterior === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = anterior;
    }
    await prisma.$connect();

    trazabilidad = new ConsultarTrazabilidadSesionUseCase(
      new PrismaSesionConversacionalRepository(prisma),
      new PrismaHistorialInteraccionesRepository(prisma),
      new PrismaSeudonimoParticipanteAdapter(prisma),
    );
    responder = new ProcesarRespuestaUseCase(
      new PrismaProcesarRespuestaRepository(prisma),
      new FormatoRespuestaAdapter(),
      new EstadoConversacionalService(),
      new HabilitacionNodoService({} as HabilitacionContenidoChatRepository),
    );

    // A → B → fin por avance implícito (nodos sin respuesta, RF-25).
    await prisma.$transaction([
      prisma.$executeRaw`INSERT INTO chat.tipo_nodo (nombre) VALUES ('MENSAJE') ON CONFLICT (nombre) DO NOTHING`,
      prisma.$executeRaw`
        INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol) VALUES
          (${admin}::uuid, ${`${admin}@example.invalid`}, 'fixture', 'ADMINISTRATIVO'),
          (${estudiante}::uuid, ${`${estudiante}@example.invalid`}, 'fixture', 'ESTUDIANTE')`,
      prisma.$executeRaw`
        INSERT INTO chat.flujo_conversacion (id_flujo, nombre, modalidad, version, creado_por)
        VALUES (${flujo}::uuid, 'Trazabilidad e2e', 'GRUPAL', 1, ${admin}::uuid)`,
      prisma.$executeRaw`
        INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, creado_por, es_nodo_inicial, es_nodo_final, orden)
        SELECT v.id, ${flujo}::uuid, t.id_tipo_nodo, v.contenido, ${admin}::uuid, v.inicial, v.final, v.orden
        FROM chat.tipo_nodo t,
          (VALUES (${nodoA}::uuid, '{"texto":"A"}'::jsonb, true, false, 1),
                  (${nodoB}::uuid, '{"texto":"B"}'::jsonb, false, false, 2),
                  (${nodoFin}::uuid, '{"texto":"Fin"}'::jsonb, false, true, 3))
            AS v(id, contenido, inicial, final, orden)
        WHERE t.nombre = 'MENSAJE'`,
      prisma.$executeRaw`UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO' WHERE id_flujo = ${flujo}::uuid`,
      prisma.$executeRaw`
        INSERT INTO chat.sesiones (id_sesion, id_usuario, id_flujo_conversacional, version_arbol_utilizada, modalidad_activa, id_nodo_actual)
        VALUES (${sesion}::uuid, ${estudiante}::uuid, ${flujo}::uuid, 1, 'GRUPAL', ${nodoA}::uuid)`,
      prisma.$executeRaw`INSERT INTO chat.estado_sesiones (id_sesion) VALUES (${sesion}::uuid)`,
    ]);

    const continuar = (
      idNodo: string,
      secuencia: number,
    ): ProcesarRespuestaDtoRequest => ({
      id_interaccion: randomUUID(),
      id_nodo: idNodo,
      secuencia,
      tipo_entrada: 'CONTINUAR',
      valor: null,
      timestamp_interaccion: new Date().toISOString(),
      estado_conectividad: 'EN_LINEA',
    });
    await responder.execute(sesion, estudiante, continuar(nodoA, 1));
    await responder.execute(sesion, estudiante, continuar(nodoB, 2));
  });

  afterAll(async () => prisma?.$disconnect());

  /** Huella de las tablas del historial: la consulta no debe modificarlas. */
  async function huellaChat(): Promise<string> {
    const [fila] = await prisma.$queryRaw<{ huella: string }[]>`
      SELECT md5(
        (SELECT coalesce(string_agg(t::text, '|' ORDER BY t::text), '') FROM chat.interacciones t WHERE id_sesion = ${sesion}::uuid) ||
        (SELECT coalesce(string_agg(t::text, '|' ORDER BY t::text), '') FROM chat.historial_nodos t WHERE id_sesion = ${sesion}::uuid) ||
        (SELECT coalesce(string_agg(r::text, '|' ORDER BY r::text), '') FROM chat.respuestas r
          JOIN chat.interacciones i ON i.id_interaccion = r.id_interaccion WHERE i.id_sesion = ${sesion}::uuid) ||
        (SELECT coalesce(string_agg(e::text, '|'), '') FROM chat.estado_sesiones e WHERE id_sesion = ${sesion}::uuid)
      ) AS huella`;
    return fila.huella;
  }

  it('devuelve la secuencia completa con seudónimo estable y sin modificar la sesión', async () => {
    const antes = await huellaChat();

    const primera = await trazabilidad.obtenerSesion(sesion);
    const segunda = await trazabilidad.execute(sesion);

    expect(primera.id_sesion).toBe(sesion);
    expect(primera.id_participante).toMatch(/^P-[0-9A-F]{8}$/);
    expect(segunda.id_participante).toBe(primera.id_participante);
    expect(primera.registros).toEqual([
      expect.objectContaining({
        secuencia: 1,
        id_nodo: nodoA,
        respuesta_usuario: { valor: null },
        id_nodo_destino: nodoB,
      }),
      expect.objectContaining({
        secuencia: 2,
        id_nodo: nodoB,
        respuesta_usuario: { valor: null },
        id_nodo_destino: nodoFin,
      }),
    ]);
    expect(
      Number.isNaN(Date.parse(primera.registros[0].timestamp_interaccion)),
    ).toBe(false);
    expect(await huellaChat()).toBe(antes);
  });

  it('404 para una sesión inexistente', async () => {
    await expect(trazabilidad.execute(randomUUID())).rejects.toBeInstanceOf(
      SesionConversacionalNoEncontradaException,
    );
  });
});
