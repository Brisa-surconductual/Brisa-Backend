import { PrismaService } from '../../../../../prisma/prisma.service';
import { CalcularUbicacionTemporalUsuarioUseCase } from '../../../cronograma/application/use-cases/cronograma/calcular-ubicacion-temporal-usuario.use-case';
import { PrismaUbicacionTemporalUsuarioRepository } from '../../../cronograma/infrastructure/persistence/prisma-ubicacion-temporal-usuario.repository';
import { DeterminarContextoConversacionalUseCase } from '../../application/use-cases/determinar-contexto-conversacional.use-case';
import { IniciarOReanudarSesionUseCase } from '../../application/use-cases/iniciar-o-reanudar-sesion.use-case';
import { PrismaArbolConversacionalRepository } from './prisma-arbol-conversacional.repository';
import { PrismaAsignacionCronogramaChatRepository } from './prisma-asignacion-cronograma-chat.repository';
import { PrismaContextoConversacionalRepository } from './prisma-contexto-conversacional.repository';
import { PrismaSesionConversacionalRepository } from './prisma-sesion-conversacional.repository';

const ejecutarIntegracion =
  process.env.RF24_INTEGRACION_DB === '1' ? describe : describe.skip;

ejecutarIntegracion('RF-24 - Integración PostgreSQL real', () => {
  const idUsuario = '24000000-0000-4000-8000-000000000001';
  const idFlujo = '24000000-0000-4000-8000-000000000005';
  const idNodo = '24000000-0000-4000-8000-000000000006';

  let prisma: PrismaService;
  let fixtureDisponible = false;

  beforeAll(async () => {
    const conexion = process.env.DATABASE_URL;

    if (!conexion) {
      throw new Error('DATABASE_URL es obligatoria.');
    }

    const url = new URL(conexion);

    if (
      url.hostname !== '127.0.0.1' ||
      url.port !== '55432' ||
      url.pathname !== '/brisa_rf24_integracion' ||
      url.username !== 'rf24_test'
    ) {
      throw new Error(
        'Prueba bloqueada: la conexión no corresponde a PostgreSQL RF-24 local.',
      );
    }

    prisma = new PrismaService();
    await prisma.$connect();

    const bases = await prisma.$queryRaw<{ nombre: string }[]>`
      SELECT current_database() AS nombre
    `;

    expect(bases[0]?.nombre).toBe('brisa_rf24_integracion');

    const sesionesPrevias = await prisma.chat_sesiones.count({
      where: { id_usuario: idUsuario },
    });

    if (sesionesPrevias !== 0) {
      throw new Error(
        'El estudiante de integración ya tiene sesiones. No se modificarán.',
      );
    }

    fixtureDisponible = true;
  });

  afterAll(async () => {
    if (prisma) {
      try {
        if (fixtureDisponible) {
          await prisma.chat_sesiones.deleteMany({
            where: { id_usuario: idUsuario },
          });
        }
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  it('crea una sesión GRUPAL y persiste su estado ACTIVA', async () => {
    const sesiones = new PrismaSesionConversacionalRepository(prisma);
    const arboles = new PrismaArbolConversacionalRepository(prisma);

    const determinarContexto = new DeterminarContextoConversacionalUseCase(
      new PrismaContextoConversacionalRepository(prisma),
    );

    const calcularUbicacion = new CalcularUbicacionTemporalUsuarioUseCase(
      new PrismaUbicacionTemporalUsuarioRepository(prisma),
    );

    const asignacionCronograma = new PrismaAsignacionCronogramaChatRepository(
      prisma,
    );

    const casoDeUso = new IniciarOReanudarSesionUseCase(
      sesiones,
      arboles,
      determinarContexto,
      calcularUbicacion,
      asignacionCronograma,
    );

    const resultado = await casoDeUso.execute(idUsuario);

    expect(resultado.reanudada).toBe(false);
    expect(resultado.sesion.modalidad_activa).toBe('GRUPAL');
    expect(resultado.sesion.estado_actual).toBe('ACTIVA');
    expect(resultado.sesion.id_flujo_conversacional).toBe(idFlujo);
    expect(resultado.nodo_actual.id_nodo).toBe(idNodo);
    expect(resultado.ubicacion_temporal.nombre_unidad).toBe(
      'Unidad de prueba RF24',
    );

    const persistida = await prisma.chat_sesiones.findUnique({
      where: {
        id_sesion: resultado.sesion.id_sesion,
      },
      include: {
        estado_sesiones: true,
      },
    });

    expect(persistida).not.toBeNull();
    expect(persistida?.id_usuario).toBe(idUsuario);
    expect(persistida?.id_flujo_conversacional).toBe(idFlujo);
    expect(persistida?.id_nodo_actual).toBe(idNodo);
    expect(persistida?.estado_sesiones?.estado_actual).toBe('ACTIVA');

    const totalSesiones = await prisma.chat_sesiones.count({
      where: { id_usuario: idUsuario },
    });

    expect(totalSesiones).toBe(1);

    // Simular una pausa real en PostgreSQL.
    await prisma.estado_sesiones.update({
      where: {
        id_sesion: resultado.sesion.id_sesion,
      },
      data: {
        estado_actual: 'PAUSADA',
        fecha_pausa: new Date(),
      },
    });

    // Ejecutar nuevamente RF-24 con el mismo estudiante.
    const reanudada = await casoDeUso.execute(idUsuario);

    expect(reanudada.reanudada).toBe(true);
    expect(reanudada.sesion.id_sesion).toBe(resultado.sesion.id_sesion);
    expect(reanudada.sesion.estado_actual).toBe('ACTIVA');
    expect(reanudada.nodo_actual.id_nodo).toBe(idNodo);

    // Verificar que PostgreSQL actualizó el estado.
    const estadoPersistido = await prisma.estado_sesiones.findUnique({
      where: {
        id_sesion: resultado.sesion.id_sesion,
      },
    });

    expect(estadoPersistido?.estado_actual).toBe('ACTIVA');
    expect(estadoPersistido?.fecha_reanudacion).toBeInstanceOf(Date);

    // Debe seguir existiendo una sola sesión.
    const sesionesFinales = await prisma.chat_sesiones.count({
      where: {
        id_usuario: idUsuario,
      },
    });

    expect(sesionesFinales).toBe(1);

    // Ejecutar nuevamente RF-24 con la sesión ya ACTIVA.
    const inicioConSesionActiva = await casoDeUso.execute(idUsuario);

    expect(inicioConSesionActiva.reanudada).toBe(true);
    expect(inicioConSesionActiva.sesion.id_sesion).toBe(
      resultado.sesion.id_sesion,
    );
    expect(inicioConSesionActiva.sesion.estado_actual).toBe('ACTIVA');

    // Confirmar que no se crean sesiones duplicadas.
    const totalDespuesDeReintento = await prisma.chat_sesiones.count({
      where: {
        id_usuario: idUsuario,
      },
    });

    expect(totalDespuesDeReintento).toBe(1);

    // Preparar un escenario sin sesiones previas.
    await prisma.chat_sesiones.deleteMany({
      where: { id_usuario: idUsuario },
    });

    expect(
      await prisma.chat_sesiones.count({
        where: { id_usuario: idUsuario },
      }),
    ).toBe(0);

    // Lanzar dos solicitudes concurrentes del mismo estudiante.
    const [primera, segunda] = await Promise.all([
      casoDeUso.execute(idUsuario),
      casoDeUso.execute(idUsuario),
    ]);

    // Ambas solicitudes deben obtener la misma sesión.
    expect(primera.sesion.id_sesion).toBe(segunda.sesion.id_sesion);

    expect(primera.sesion.estado_actual).toBe('ACTIVA');
    expect(segunda.sesion.estado_actual).toBe('ACTIVA');

    // Una solicitud crea la sesión y la otra debe reutilizarla.
    expect(
      [primera, segunda].filter((respuesta) => !respuesta.reanudada),
    ).toHaveLength(1);

    // Verificar directamente la persistencia en PostgreSQL.
    const sesionesConcurrentes = await prisma.chat_sesiones.findMany({
      where: { id_usuario: idUsuario },
      include: { estado_sesiones: true },
    });

    expect(sesionesConcurrentes).toHaveLength(1);
    expect(sesionesConcurrentes[0].estado_sesiones?.estado_actual).toBe(
      'ACTIVA',
    );

    // Preparar el escenario de rollback sin sesiones previas.
    await prisma.chat_sesiones.deleteMany({
      where: { id_usuario: idUsuario },
    });

    expect(
      await prisma.chat_sesiones.count({
        where: { id_usuario: idUsuario },
      }),
    ).toBe(0);

    try {
      // Trigger temporal: falla al insertar el estado del estudiante QA.
      await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION chat.rf24_rollback_controlado()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $rf24$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM chat.sesiones
            WHERE id_sesion = NEW.id_sesion
              AND id_usuario =
                '24000000-0000-4000-8000-000000000001'::uuid
          ) THEN
            RAISE EXCEPTION 'RF24_ROLLBACK_FORZADO';
          END IF;

          RETURN NEW;
        END;
        $rf24$;
      `;

      await prisma.$executeRaw`
        CREATE TRIGGER rf24_rollback_controlado
        BEFORE INSERT ON chat.estado_sesiones
        FOR EACH ROW
        EXECUTE FUNCTION chat.rf24_rollback_controlado();
      `;

      // Ejecutar el caso de uso con el fallo controlado.
      let errorCapturado: unknown;

      try {
        await casoDeUso.execute(idUsuario);
      } catch (error: unknown) {
        errorCapturado = error;
      }

      expect(errorCapturado).toBeDefined();
      expect(String(errorCapturado)).toContain('RF24_ROLLBACK_FORZADO');

      // Verificar que la transacción no dejó una sesión parcial.
      const sesionesDespuesDelFallo = await prisma.chat_sesiones.count({
        where: { id_usuario: idUsuario },
      });

      expect(sesionesDespuesDelFallo).toBe(0);
    } finally {
      // Eliminar siempre los objetos temporales de integración.
      await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS rf24_rollback_controlado
        ON chat.estado_sesiones;
      `;

      await prisma.$executeRaw`
        DROP FUNCTION IF EXISTS chat.rf24_rollback_controlado();
      `;
    }
  });
});
