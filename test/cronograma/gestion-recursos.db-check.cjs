/* Opt-in: fixtures con ROLLBACK. --installed prueba el esquema ya desplegado. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
require('dotenv').config({
  path: path.join(__dirname, '../../config/.env'),
  quiet: true,
});

async function verificar() {
  const usarEsquemaInstalado = process.argv.includes('--installed');
  if (process.env.RUN_DB_RESOURCE_CHECK !== '1') {
    throw new Error(
      'Defina RUN_DB_RESOURCE_CHECK=1 para ejecutar la prueba transaccional.',
    );
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  let transaccion = false;
  let verificaciones = 0;
  const rechazo = async (sql, valores, constraint) => {
    await client.query('SAVEPOINT rechazo_esperado');
    try {
      await client.query(sql, valores);
      await client.query('SET CONSTRAINTS ALL IMMEDIATE');
      assert.fail(`No rechazó ${constraint}`);
    } catch (error) {
      assert.equal(error.constraint, constraint);
      verificaciones += 1;
    } finally {
      await client.query('ROLLBACK TO SAVEPOINT rechazo_esperado');
      await client.query('RELEASE SAVEPOINT rechazo_esperado');
    }
  };
  try {
    await client.query('BEGIN');
    transaccion = true;
    await client.query("SET LOCAL lock_timeout = '3s'");
    await client.query("SET LOCAL statement_timeout = '20s'");
    if (usarEsquemaInstalado) {
      const migracion = await client.query(
        'SELECT id FROM public._prisma_migrations WHERE migration_name=$1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL',
        ['20261006120000_gestion_recursos_contenido'],
      );
      assert.equal(
        migracion.rows.length,
        1,
        'Debe estar aplicada la migración antes de probar el esquema instalado.',
      );
    } else {
      await client.query(
        fs.readFileSync(
          path.join(
            __dirname,
            '../../prisma/migrations/20261006120000_gestion_recursos_contenido/migration.sql',
          ),
          'utf8',
        ),
      );
    }
    const contenido = randomUUID(),
      modulo = randomUUID(),
      cronograma = randomUUID(),
      unidad = randomUUID();
    const texto = randomUUID(),
      imagen = randomUUID();
    const clave = `cronograma/recursos/${contenido}/${randomUUID()}`;
    const nueva = `cronograma/recursos/${contenido}/${randomUUID()}`;
    await client.query(
      "INSERT INTO cronograma.contenidos (id_contenido,nombre_contenido,tipo_contenido) VALUES ($1,'Prueba transaccional gestión recursos','MULTIMEDIA')",
      [contenido],
    );
    await client.query(
      "INSERT INTO cronograma.modulos_sistema (id_modulo,codigo_modulo,nombre_modulo) VALUES ($1,$2,'Prueba transaccional')",
      [modulo, `T${randomUUID().slice(0, 8)}`],
    );
    await client.query(
      "INSERT INTO cronograma.recursos_contenido (id_recurso,id_contenido,tipo_recurso,orden_bloque,texto_contenido) VALUES ($1,$2,'TEXTO',1,'Texto')",
      [texto, contenido],
    );
    await client.query(
      'INSERT INTO cronograma.recursos_modulos_destino (id_recurso,id_modulo) VALUES ($1,$2)',
      [texto, modulo],
    );
    await client.query(
      "INSERT INTO cronograma.recursos_contenido (id_recurso,id_contenido,tipo_recurso,orden_bloque,clave_almacenamiento,mime_type,tamano_bytes) VALUES ($1,$2,'IMAGEN',2,$3,'image/png',100)",
      [imagen, contenido, clave],
    );
    await client.query(
      'INSERT INTO cronograma.recursos_modulos_destino (id_recurso,id_modulo) VALUES ($1,$2)',
      [imagen, modulo],
    );
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    await rechazo(
      'DELETE FROM cronograma.recursos_modulos_destino WHERE id_recurso=$1',
      [texto],
      'trg_recurso_requiere_modulo',
    );
    await rechazo(
      "INSERT INTO cronograma.recursos_contenido (id_contenido,tipo_recurso,orden_bloque,clave_almacenamiento,mime_type,tamano_bytes) VALUES ($1,'IMAGEN',3,$2,'image/png',100)",
      [contenido, clave],
      'uq_recurso_clave_almacenamiento',
    );
    await client.query(
      'UPDATE cronograma.recursos_contenido SET clave_almacenamiento=$2 WHERE id_recurso=$1',
      [imagen, nueva],
    );
    const encolado = await client.query(
      'SELECT estado, disponible_desde > now() FROM cronograma.limpieza_objetos_recurso WHERE clave_almacenamiento=$1',
      [clave],
    );
    assert.equal(encolado.rows[0].estado, 'PENDIENTE');
    assert.equal(encolado.rows[0]['?column?'], true);
    verificaciones += 1;
    await rechazo(
      'UPDATE cronograma.recursos_contenido SET clave_almacenamiento=$2 WHERE id_recurso=$1',
      [imagen, clave],
      'ck_recurso_clave_retirada',
    );
    await client.query(
      "INSERT INTO cronograma.cronogramas (id_cronograma,nombre_cronograma) VALUES ($1,'Prueba transaccional recursos')",
      [cronograma],
    );
    await client.query(
      "INSERT INTO cronograma.unidades_temporales (id_unidad_temporal,id_cronograma,nombre_unidad,orden_unidad,fecha_inicio,fecha_fin) VALUES ($1,$2,'Unidad prueba',1,'2031-01-01','2031-01-31')",
      [unidad, cronograma],
    );
    await client.query(
      'INSERT INTO cronograma.contenidos_cronograma (id_contenido,id_unidad_temporal,orden_contenido) VALUES ($1,$2,1)',
      [contenido, unidad],
    );
    await client.query(
      "UPDATE cronograma.cronogramas SET estado='ACTIVO' WHERE id_cronograma=$1",
      [cronograma],
    );
    await rechazo(
      "UPDATE cronograma.recursos_contenido SET texto_contenido='Cambio prohibido' WHERE id_recurso=$1",
      [texto],
      'trg_recurso_bloqueo_cronograma_activo',
    );
    await rechazo(
      'DELETE FROM cronograma.recursos_contenido WHERE id_recurso=$1',
      [texto],
      'trg_recurso_bloqueo_cronograma_activo',
    );
    await rechazo(
      'DELETE FROM cronograma.recursos_modulos_destino WHERE id_recurso=$1',
      [texto],
      'trg_recurso_bloqueo_cronograma_activo',
    );
    await rechazo(
      "INSERT INTO cronograma.recursos_contenido (id_contenido,tipo_recurso,orden_bloque,texto_contenido) VALUES ($1,'TEXTO',3,'Bloqueado')",
      [contenido],
      'trg_recurso_bloqueo_cronograma_activo',
    );
    await client.query(
      "UPDATE cronograma.cronogramas SET estado='INACTIVO' WHERE id_cronograma=$1",
      [cronograma],
    );
    await client.query(
      'DELETE FROM cronograma.recursos_contenido WHERE id_recurso=$1',
      [imagen],
    );
    assert.equal(
      (
        await client.query(
          'SELECT count(*)::int AS total FROM cronograma.recursos_modulos_destino WHERE id_recurso=$1',
          [imagen],
        )
      ).rows[0].total,
      0,
    );
    assert.equal(
      (
        await client.query(
          'SELECT count(*)::int AS total FROM cronograma.limpieza_objetos_recurso WHERE clave_almacenamiento=$1',
          [nueva],
        )
      ).rows[0].total,
      1,
    );
    verificaciones += 1;
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    // Se reclaman únicamente los fixtures de esta transacción, nunca tareas reales.
    const clavesPrueba = [clave, nueva];
    const reclamar = `WITH lote AS (
      SELECT id_limpieza FROM cronograma.limpieza_objetos_recurso
      WHERE clave_almacenamiento = ANY($1::text[])
        AND ((estado = 'PENDIENTE' AND disponible_desde <= now())
          OR (estado = 'EN_PROCESO' AND reclamado_en < now() - interval '10 minutes'))
      ORDER BY disponible_desde, id_limpieza
      FOR UPDATE SKIP LOCKED LIMIT 20
    ) UPDATE cronograma.limpieza_objetos_recurso AS cola
      SET estado = 'EN_PROCESO', reclamado_en = now(), intentos = intentos + 1
      FROM lote WHERE cola.id_limpieza = lote.id_limpieza
      RETURNING cola.id_limpieza, cola.id_contenido, cola.clave_almacenamiento, cola.intentos`;
    await client.query(
      "UPDATE cronograma.limpieza_objetos_recurso SET disponible_desde=now()-interval '1 second' WHERE clave_almacenamiento=ANY($1::text[])",
      [clavesPrueba],
    );
    const reclamadas = await client.query(reclamar, [clavesPrueba]);
    assert.equal(reclamadas.rows.length, 2);
    assert.ok(reclamadas.rows.every((tarea) => tarea.intentos === 1));
    verificaciones += 1;
    assert.equal((await client.query(reclamar, [clavesPrueba])).rows.length, 0);
    verificaciones += 1;
    await client.query(
      "UPDATE cronograma.limpieza_objetos_recurso SET reclamado_en=now()-interval '11 minutes' WHERE clave_almacenamiento=ANY($1::text[])",
      [clavesPrueba],
    );
    const recuperadas = await client.query(reclamar, [clavesPrueba]);
    assert.equal(recuperadas.rows.length, 2);
    assert.ok(recuperadas.rows.every((tarea) => tarea.intentos === 2));
    verificaciones += 1;
    await client.query(
      "UPDATE cronograma.limpieza_objetos_recurso SET estado='PENDIENTE', reclamado_en=NULL, disponible_desde=now()+($1 * interval '1 second') WHERE clave_almacenamiento=ANY($2::text[])",
      [60, clavesPrueba],
    );
    assert.equal((await client.query(reclamar, [clavesPrueba])).rows.length, 0);
    verificaciones += 1;
    await client.query(
      "UPDATE cronograma.limpieza_objetos_recurso SET estado='COMPLETADO', fecha_completado=now(), ultimo_error=NULL WHERE clave_almacenamiento=ANY($1::text[])",
      [clavesPrueba],
    );
    assert.equal((await client.query(reclamar, [clavesPrueba])).rows.length, 0);
    verificaciones += 1;
    console.log(
      `PostgreSQL: ${verificaciones} verificaciones correctas; ${usarEsquemaInstalado ? 'esquema instalado validado, fixtures se revierten' : 'migración y fixtures se revierten'}.`,
    );
  } finally {
    if (transaccion) await client.query('ROLLBACK');
    await client.end();
  }
}

verificar().catch((error) => {
  console.error('Falló la verificación PostgreSQL:', error.message);
  process.exitCode = 1;
});
