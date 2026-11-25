const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { join } = require('node:path');
const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { SchedulerRegistry } = require('@nestjs/schedule');
const cookieParser = require('cookie-parser');
const { AppModule } = require('../../../src/app.module');
const { PrismaService } = require('../../../prisma/prisma.service');
const {
  SessionTokenHasher,
} = require('../../../src/modules/usuarios/application/ports/session-token-hasher');
const {
  SessionCookieConfig,
} = require('../../../src/modules/usuarios/application/ports/session-cookie-config');
const collection = require('./solo-lectura-rf148.postman_collection.json');

async function crearActor(prisma, hasher, rol) {
  const idUsuario = randomUUID();
  const idSesion = randomUUID();
  const token = randomUUID();
  const csrf = randomUUID();
  const tokenHash = await hasher.hash(token);
  const csrfHash = await hasher.hash(csrf);
  const idConsentimiento = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO usuario.consentimientos (id_consentimiento, version_consentimiento, vigente, fecha_invalidacion, motivo_invalidacion, url_contenido, titulo)
    VALUES (${idConsentimiento}::uuid, ${idConsentimiento.slice(0, 18)}, false, now(), 'Prueba RF-148', 'https://example.invalid/consentimiento', 'Consentimiento RF-148')
  `;
  await prisma.$executeRaw`
    INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol, estado_registro,
      consentimiento_aceptado, registro_consumo_aceptado, id_consentimiento)
    VALUES (${idUsuario}::uuid, ${idUsuario + '@example.invalid'}, ${randomUUID()}, ${rol}::usuario.rol_enum, 'REGISTRO_COMPLETO',
      true, true, ${idConsentimiento}::uuid)
  `;
  await prisma.$executeRaw`
    INSERT INTO usuario.sesiones (id_sesion, id_usuario, token_hash, csrf_token_hash, alcance_sesion)
    VALUES (${idSesion}::uuid, ${idUsuario}::uuid, ${tokenHash}, ${csrfHash}, 'COMPLETA')
  `;
  return { idUsuario, idSesion, token, csrf };
}

function consultarSesion(prisma, idSesion) {
  return prisma.$queryRaw`
    SELECT fecha_ultima_interaccion, activa, estado_aplicacion::text
    FROM usuario.sesiones WHERE id_sesion = ${idSesion}::uuid
  `;
}

async function crearSesionChat(prisma, admin, estudiante) {
  const flujo = randomUUID();
  const nodo = randomUUID();
  const sesion = randomUUID();
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO chat.tipo_nodo (nombre) VALUES ('MENSAJE') ON CONFLICT (nombre) DO NOTHING
    `,
    prisma.$executeRaw`
      INSERT INTO chat.flujo_conversacion (id_flujo, nombre, modalidad, version, creado_por)
      VALUES (${flujo}::uuid, 'RF-148', 'GRUPAL', 1, ${admin.idUsuario}::uuid)
    `,
    prisma.$executeRaw`
      INSERT INTO chat.nodos (id_nodo, id_flujo, id_tipo_nodo, contenido, creado_por, es_nodo_inicial, orden)
      SELECT ${nodo}::uuid, ${flujo}::uuid, id_tipo_nodo, '{"texto":"RF-148"}'::jsonb, ${admin.idUsuario}::uuid, true, 1
      FROM chat.tipo_nodo WHERE nombre = 'MENSAJE'
    `,
    prisma.$executeRaw`
      INSERT INTO chat.sesiones (id_sesion, id_usuario, id_flujo_conversacional, version_arbol_utilizada, modalidad_activa, id_nodo_actual)
      VALUES (${sesion}::uuid, ${estudiante.idUsuario}::uuid, ${flujo}::uuid, 1, 'GRUPAL', ${nodo}::uuid)
    `,
    prisma.$executeRaw`INSERT INTO chat.estado_sesiones (id_sesion) VALUES (${sesion}::uuid)`,
  ]);
  return sesion;
}

// RF-04: la trazabilidad de chat exige un permiso individual vigente para el
// ADMINISTRATIVO. Lo otorga un COORDINADOR_PSI, con su bitácora en la misma transacción.
async function otorgarPermisoIndividual(prisma, coordinador, admin, estudiante) {
  const permiso = randomUUID();
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO administrativo.permisos_acceso_individual
        (id_permiso, id_usuario_administrativo, id_participante, alcance, otorgado_por)
      VALUES (${permiso}::uuid, ${admin.idUsuario}::uuid, ${estudiante.idUsuario}::uuid,
        'ACCESO_INDIVIDUAL', ${coordinador.idUsuario}::uuid)
    `,
    prisma.$queryRaw`
      SELECT administrativo.fn_registrar_auditoria(
        ${coordinador.idUsuario}::uuid, ${coordinador.idSesion}::uuid, 'GESTION_PERMISO_INDIVIDUAL',
        'PERMISO_INDIVIDUAL', ${permiso}::uuid, ${estudiante.idUsuario}::uuid, '127.0.0.1',
        'EXITOSA', 'ALTA', '{"operacion":"OTORGAR"}'::jsonb)::text
    `,
  ]);
}

function consultarDatosChat(prisma, idSesion) {
  return prisma.$queryRaw`
    SELECT s.id_nodo_actual, s.fecha_ultima_interaccion,
      (SELECT count(*) FROM chat.interacciones i WHERE i.id_sesion = s.id_sesion) AS interacciones
    FROM chat.sesiones s WHERE s.id_sesion = ${idSesion}::uuid
  `;
}

function ejecutarColeccion(newman, carpeta, variables) {
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection,
        folder: carpeta,
        envVar: Object.entries(variables).map(([key, value]) => ({
          key,
          value,
        })),
        reporters: 'cli',
        timeoutRequest: 10000,
      },
      (error, resultado) => {
        if (error) return reject(error);
        if (resultado.run.failures.length)
          return reject(new Error('Fallaron las verificaciones de Postman.'));
        resolve();
      },
    );
  });
}

async function verificar() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (
    url.hostname !== '127.0.0.1' ||
    !/^\/brisa_rf148_[a-z0-9_]+$/.test(url.pathname)
  ) {
    throw new Error('RF-148 requiere una base local desechable brisa_rf148_*.');
  }
  const requireNewman = createRequire(
    join(process.env.RF148_NEWMAN_DIR, 'package.json'),
  );
  const newman = requireNewman('newman');
  const app = await NestFactory.create(AppModule, {
    logger: ['warn', 'error'],
  });
  try {
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
    for (const tarea of app.get(SchedulerRegistry).getCronJobs().values()) {
      tarea.stop();
    }

    const prisma = app.get(PrismaService);
    const hasher = app.get(SessionTokenHasher);
    const admin = await crearActor(prisma, hasher, 'ADMINISTRATIVO');
    const estudiante = await crearActor(prisma, hasher, 'ESTUDIANTE');
    const recursoChat = await crearSesionChat(prisma, admin, estudiante);
    const coordinador = await crearActor(prisma, hasher, 'COORDINADOR_PSI');
    await otorgarPermisoIndividual(prisma, coordinador, admin, estudiante);
    const variables = {
      baseUrl: await app.getUrl(),
      nombreCookie: app.get(SessionCookieConfig).obtenerNombreCookie(),
      tokenAdmin: admin.token,
      csrfAdmin: admin.csrf,
      tokenEstudiante: estudiante.token,
      csrfEstudiante: estudiante.csrf,
      recursoChat,
    };
    const sesionAntes = await consultarSesion(prisma, admin.idSesion);
    const chatAntes = await consultarDatosChat(prisma, recursoChat);

    await ejecutarColeccion(newman, 'Bloqueos', variables);
    await ejecutarColeccion(newman, 'Consultas inválidas', variables);
    assert.deepEqual(
      await consultarSesion(prisma, admin.idSesion),
      sesionAntes,
    );

    assert.deepEqual(await consultarDatosChat(prisma, recursoChat), chatAntes);
    const auditadas = await prisma.$queryRaw`
      SELECT recurso_afectado, id_recurso, estado_accion::text, direccion_ip, marca_temporal,
        detalle->>'metodo' AS metodo, detalle->>'uri' AS uri
      FROM administrativo.bitacora_auditoria
      WHERE id_usuario_administrativo = ${admin.idUsuario}::uuid AND id_sesion = ${admin.idSesion}::uuid
        AND accion = 'INTENTO_ESCRITURA_BLOQUEADO'
    `;
    const rutas = {
      CHAT_SESION: `/chat/sesiones/${recursoChat}/respuestas`,
      DIARIO: '/diario/entradas',
      GAMIFICACION: '/gamificacion/progreso',
      NOTIFICACIONES: '/notificaciones/preferencias',
      SEGUIMIENTO: '/seguimiento/participantes',
    };
    assert.equal(auditadas.length, 22);
    for (const [recurso, uri] of Object.entries(rutas)) {
      const registros = auditadas.filter((fila) => fila.uri === uri);
      assert.deepEqual(registros.map((fila) => fila.metodo).sort(), [
        'DELETE',
        'PATCH',
        'POST',
        'PUT',
      ]);
      assert.ok(registros.every((fila) => fila.recurso_afectado === recurso));
    }
    const consultas = auditadas.filter((fila) => fila.metodo === 'GET');
    assert.equal(consultas.length, 2);
    assert.ok(
      consultas.every(
        (fila) =>
          fila.uri === `/chat/admin/sesiones/${recursoChat}/trazabilidad` &&
          fila.recurso_afectado === 'CHAT_SESION',
      ),
    );
    for (const fila of auditadas) {
      assert.equal(fila.estado_accion, 'DENEGADA');
      assert.equal(fila.direccion_ip, '127.0.0.1');
      assert.equal(
        fila.id_recurso,
        fila.recurso_afectado === 'CHAT_SESION' ? recursoChat : null,
      );
      assert.ok(fila.marca_temporal instanceof Date);
    }
    console.log(
      'PostgreSQL: 22 intentos auditados; sesión de autenticación y datos de Chat intactos.',
    );

    await ejecutarColeccion(newman, 'Regresiones', variables);
  } finally {
    await app.close();
  }
}

verificar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
