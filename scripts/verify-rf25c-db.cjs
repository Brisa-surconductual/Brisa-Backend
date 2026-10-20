const assert = require('node:assert/strict');
const { Client } = require('pg');
require('dotenv').config({ path: 'config/.env', quiet: true });

async function esperarError(etiqueta, operacion, codigo) {
  try {
    await operacion;
  } catch (error) {
    assert.equal(error.code, codigo, `${etiqueta}: código inesperado`);
    return;
  }
  throw new Error(`${etiqueta}: la base no rechazó la operación`);
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('BEGIN');
    const admin = await db.query(
      "SELECT id_usuario FROM usuario.usuarios WHERE rol = 'ADMINISTRATIVO'::usuario.rol_enum LIMIT 1",
    );
    assert.equal(admin.rowCount, 1, 'Se requiere un administrador de prueba');
    const idActor = admin.rows[0].id_usuario;
    const crear = (version) =>
      db.query(
        `INSERT INTO chat.flujo_conversacion
          (nombre, modalidad, tipo_dependencia, tipo_craving, estado, version, creado_por)
         VALUES ('Verificación RF-25C', 'PERSONALIZADA', 'TOLERANCIA', 'NEGATIVO', 'BORRADOR', $1, $2)
         RETURNING id_flujo`,
        [version, idActor],
      );
    const primero = (await crear(1)).rows[0].id_flujo;
    const segundo = (await crear(2)).rows[0].id_flujo;

    await db.query('SAVEPOINT version_duplicada');
    await esperarError('versión duplicada', crear(1), '23505');
    await db.query('ROLLBACK TO SAVEPOINT version_duplicada');

    const primeraPublicacion = await db.query(
      "UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO' WHERE id_flujo = $1",
      [primero],
    );
    assert.equal(primeraPublicacion.rowCount, 1);
    const previo = await db.query(
      'SELECT version, modalidad, tipo_dependencia, tipo_craving, estado FROM chat.flujo_conversacion WHERE id_flujo = ANY($1::uuid[]) ORDER BY version',
      [[primero, segundo]],
    );
    assert.equal(previo.rows.find((item) => item.version === 1).estado, 'PUBLICADO');
    await db.query('SAVEPOINT publicado_duplicado');
    const segundaPublicacion = await db.query(
        "UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO' WHERE id_flujo = $1",
        [segundo],
    );
    const duplicados = await db.query(
      "SELECT id_flujo, estado FROM chat.flujo_conversacion WHERE modalidad = 'PERSONALIZADA' AND tipo_dependencia = 'TOLERANCIA' AND tipo_craving = 'NEGATIVO' AND estado = 'PUBLICADO'",
    );
    const posterior = await db.query(
      'SELECT version, estado FROM chat.flujo_conversacion WHERE id_flujo = ANY($1::uuid[]) ORDER BY version',
      [[primero, segundo]],
    );
    assert.equal(segundaPublicacion.rowCount, 1);
    assert.equal(duplicados.rowCount, 1, 'La BD permitió dos árboles publicados');
    assert.equal(posterior.rows.find((item) => item.version === 1).estado, 'ARCHIVADO');
    assert.equal(posterior.rows.find((item) => item.version === 2).estado, 'PUBLICADO');
    await db.query('ROLLBACK TO SAVEPOINT publicado_duplicado');

    await db.query(
      "UPDATE chat.flujo_conversacion SET estado = 'ARCHIVADO', fecha_archivado = now() WHERE id_flujo = $1",
      [primero],
    );
    await db.query(
      "UPDATE chat.flujo_conversacion SET estado = 'PUBLICADO', fecha_publicacion = now() WHERE id_flujo = $1",
      [segundo],
    );
    const estados = await db.query(
      'SELECT id_flujo, estado FROM chat.flujo_conversacion WHERE id_flujo = ANY($1::uuid[])',
      [[primero, segundo]],
    );
    assert.equal(estados.rows.find((item) => item.id_flujo === primero).estado, 'ARCHIVADO');
    assert.equal(estados.rows.find((item) => item.id_flujo === segundo).estado, 'PUBLICADO');

    const auditoria = await db.query(
      "INSERT INTO chat.auditoria_arboles (id_flujo, id_actor, accion) VALUES ($1, $2, 'PUBLICAR') RETURNING id_auditoria",
      [segundo, idActor],
    );
    await db.query('SAVEPOINT auditoria_inmutable');
    await esperarError(
      'auditoría inmutable',
      db.query(
        'UPDATE chat.auditoria_arboles SET accion = $1 WHERE id_auditoria = $2',
        ['ARCHIVAR', auditoria.rows[0].id_auditoria],
      ),
      'P0001',
    );
    await db.query('ROLLBACK TO SAVEPOINT auditoria_inmutable');

    await db.query('SAVEPOINT perfil_incompleto');
    await esperarError(
      'perfil incompleto',
      db.query(
        `INSERT INTO chat.flujo_conversacion
          (nombre, modalidad, tipo_dependencia, estado, version, creado_por)
         VALUES ('Perfil incompleto', 'PERSONALIZADA', 'TOLERANCIA', 'BORRADOR', 3, $1)`,
        [idActor],
      ),
      '23514',
    );
    await db.query('ROLLBACK TO SAVEPOINT perfil_incompleto');
    console.log('RF-25C DB: versión única, publicado único, reemplazo, perfil completo y auditoría inmutable verificados.');
  } finally {
    await db.query('ROLLBACK');
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
