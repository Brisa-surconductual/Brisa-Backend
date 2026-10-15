import { setTimeout as delay } from 'node:timers/promises';

async function deploy() {
  const revision = process.env.GITHUB_SHA;
  if (!/^[a-f0-9]{40}$/i.test(revision ?? '')) {
    throw new Error('GITHUB_SHA debe identificar el commit validado.');
  }
  const hook = new URL(process.env.RENDER_DEPLOY_HOOK_URL);
  if (hook.protocol !== 'https:' || hook.hostname !== 'api.render.com') {
    throw new Error('Configura el deploy hook HTTPS oficial de Render.');
  }
  const health = new URL('/health', process.env.RENDER_SERVICE_URL);
  if (health.protocol !== 'https:' || health.username || health.password) {
    throw new Error(
      'RENDER_SERVICE_URL debe ser una URL HTTPS pública sin credenciales.',
    );
  }

  hook.searchParams.set('ref', revision);
  const response = await fetch(hook, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`Render rechazó el despliegue (HTTP ${response.status}).`);
  }
  console.log(
    `Despliegue solicitado para ${revision}; esperando la nueva versión.`,
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await delay(10_000);
    try {
      const check = await fetch(health, {
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      if (!check.ok) continue;
      const body = await check.json();
      if (body.status === 'ok' && body.revision === revision) {
        console.log(`Verificado: Render está sirviendo ${revision}.`);
        return;
      }
    } catch {
      // Durante el arranque pueden producirse respuestas transitorias.
    }
  }
  throw new Error(
    'No se confirmó el commit esperado en /health dentro del plazo.',
  );
}

deploy().catch((error) => {
  // No imprimir URLs del hook, cuerpos remotos ni valores de configuración.
  console.error(
    error instanceof TypeError
      ? 'Revisa la configuración de las URLs y la conexión con Render.'
      : error.message,
  );
  process.exitCode = 1;
});
