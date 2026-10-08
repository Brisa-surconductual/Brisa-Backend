/* Opt-in: crea un único objeto de prueba y lo elimina al terminar. */
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({
  path: path.join(__dirname, '../../config/.env'),
  quiet: true,
});
require('ts-node').register({ transpileOnly: true });
const {
  crearS3Client,
} = require('../../src/modules/cronograma/infrastructure/storage/s3-client.provider');
const {
  S3AlmacenamientoRecursosAdapter,
} = require('../../src/modules/cronograma/infrastructure/storage/s3-almacenamiento-recursos.adapter');
const {
  TipoRecurso,
} = require('../../src/modules/cronograma/domain/enums/tipo-recurso.enum');
let etapa = 'configuración';

async function verificar() {
  if (process.env.RUN_S3_RESOURCE_CHECK !== '1') {
    throw new Error(
      'Defina RUN_S3_RESOURCE_CHECK=1 para crear y eliminar el objeto de prueba.',
    );
  }
  const client = crearS3Client();
  let ultimoHttpS3 = 0; // Sin respuesta HTTP registrada.
  client.middlewareStack.add(
    (next, context) => async (args) => {
      ultimoHttpS3 = 0;
      try {
        return await next(args);
      } catch (error) {
        ultimoHttpS3 = error.$metadata?.httpStatusCode ?? 0;
        console.error(
          `S3 ${context.commandName}: ${error.name}, HTTP ${error.$metadata?.httpStatusCode ?? 'sin respuesta'}`,
        );
        throw error;
      }
    },
    { step: 'initialize', name: 'diagnosticoPruebaRecursos' },
  );
  const adapter = new S3AlmacenamientoRecursosAdapter(client);
  const idContenido = randomUUID();
  const cuerpo = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8MsAAAAASUVORK5CYII=',
    'base64',
  );
  let objeto;
  let eliminado = false;
  try {
    etapa = 'firma de URL';
    const firma = await adapter.crearUrlSubida({
      idContenido,
      tipoRecurso: TipoRecurso.IMAGEN,
      mimeType: 'image/png',
      tamanoBytes: cuerpo.length,
    });
    objeto = { idContenido, claveAlmacenamiento: firma.claveAlmacenamiento };
    etapa = 'subida PUT';
    const respuesta = await fetch(firma.url, {
      method: 'PUT',
      headers: firma.encabezados,
      body: cuerpo,
      signal: AbortSignal.timeout(20000),
    });
    assert.ok(respuesta.ok, `PUT de prueba devolvió HTTP ${respuesta.status}`);
    etapa = 'verificación HEAD';
    assert.deepEqual(await adapter.obtenerMetadatos(objeto), {
      mimeType: 'image/png',
      tamanoBytes: cuerpo.length,
    });
    etapa = 'eliminación DELETE';
    await adapter.eliminarObjeto(objeto);
    eliminado = true;
    etapa = 'confirmación de eliminación';
    try {
      assert.equal(await adapter.obtenerMetadatos(objeto), null);
    } catch (error) {
      // AWS devuelve 403 al consultar una clave eliminada sin ListBucket.
      // Se acepta sólo después del HEAD positivo y DELETE exitoso anteriores.
      if (ultimoHttpS3 !== 403) throw error;
      console.log(
        'DELETE confirmado; HEAD posterior devolvió 403, compatible con ausencia sin ListBucket.',
      );
    }
    console.log(
      'S3: URL firmada, PUT, HEAD y DELETE correctos. Objeto de prueba eliminado.',
    );
  } finally {
    if (objeto && !eliminado) {
      try {
        await adapter.eliminarObjeto(objeto);
        console.log('Objeto de prueba eliminado al finalizar.');
      } catch {
        console.error(
          `Revisar limpieza del objeto de prueba: ${objeto.claveAlmacenamiento}`,
        );
      }
    }
    client.destroy();
  }
}

verificar().catch((error) => {
  console.error(`Falló la verificación S3 (${etapa}):`, error.message);
  process.exitCode = 1;
});
