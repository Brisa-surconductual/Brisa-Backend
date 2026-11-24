import type { INestApplication } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { PrismaService } from '../../../prisma/prisma.service';
import { SessionCookieConfig } from '../../../src/modules/usuarios/application/ports/session-cookie-config';
import { SessionTokenHasher } from '../../../src/modules/usuarios/application/ports/session-token-hasher';

export async function crearActorConSesion(
  app: INestApplication,
  prisma: PrismaService,
  rol: 'ADMINISTRATIVO' | 'ESTUDIANTE',
  referencia: string,
) {
  const id = randomUUID();
  const token = randomUUID();
  const csrf = randomUUID();
  const csrfHash = await app.get(SessionTokenHasher).hash(csrf);
  const hash = createHash('sha256').update(token).digest('hex');
  const consentimiento = rol === 'ESTUDIANTE' ? randomUUID() : null;
  if (consentimiento) {
    await prisma.$executeRaw`
      INSERT INTO usuario.consentimientos
        (id_consentimiento, version_consentimiento, vigente, fecha_invalidacion, motivo_invalidacion, url_contenido, titulo)
      VALUES (${consentimiento}::uuid, ${consentimiento.slice(0, 18)}, false, now(),
        ${'Prueba ' + referencia}, 'https://example.invalid/consentimiento', ${'Consentimiento ' + referencia})
    `;
  }
  await prisma.$executeRaw`
    INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash,
      rol, estado_registro, consentimiento_aceptado, registro_consumo_aceptado, id_consentimiento)
    VALUES (${id}::uuid, ${id + '@example.invalid'}, ${randomUUID()}, ${rol}::usuario.rol_enum,
      'REGISTRO_COMPLETO', true, true, ${consentimiento}::uuid)
  `;
  await prisma.$executeRaw`
    INSERT INTO usuario.sesiones (id_usuario, token_hash, csrf_token_hash, alcance_sesion)
    VALUES (${id}::uuid, ${hash}, ${csrfHash}, 'COMPLETA')
  `;
  const cookie = app.get(SessionCookieConfig).obtenerNombreCookie();
  return { id, csrf, cookie: `${cookie}=${token}` };
}
