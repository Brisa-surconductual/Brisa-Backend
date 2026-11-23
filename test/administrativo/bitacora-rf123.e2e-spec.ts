import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import { AuditoriaService } from '../../src/modules/administrativo/application/services/auditoria.service';
import type { ContextoAuditoria } from '../../src/modules/administrativo/domain/auditoria';
import { SessionAuthGuard } from '../../src/modules/usuarios/presentation/guards/session-auth.guard';

const baseLocal = process.env.RF123_TEST_DATABASE_URL;
const redisLocal = process.env.RF123_TEST_REDIS_URL;
const conBase = baseLocal ? describe : describe.skip;
const conRedis = redisLocal ? it : it.skip;
const ruta = '/administrativo/auditoria';

interface SolicitudPrueba {
  headers: Record<string, unknown>;
  autenticacion?: object;
}

jest.setTimeout(45_000);

conBase('RF-123 bitácora administrativa con PostgreSQL', () => {
  const admin = {
    idUsuario: randomUUID(),
    idSesion: randomUUID(),
    direccionIp: '127.0.0.1',
  };
  const estudiante = {
    ...admin,
    idUsuario: randomUUID(),
    idSesion: randomUUID(),
  };
  let prisma: PrismaService;
  let app: INestApplication;
  let auditoria: AuditoriaService;
  let ambiente: Record<string, string | undefined>;

  beforeAll(async () => {
    const url = new URL(baseLocal ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf123_[a-z0-9_]+$/.test(url.pathname)
    ) {
      throw new Error(
        'RF-123 requiere una base local desechable brisa_rf123_*.',
      );
    }
    if (
      redisLocal &&
      (new URL(redisLocal).hostname !== '127.0.0.1' ||
        new URL(redisLocal).port !== '56379')
    )
      throw new Error('RF-123 requiere Redis aislado en 127.0.0.1:56379.');
    ambiente = {
      DATABASE_URL: process.env.DATABASE_URL,
      AUDITORIA_REDIS_URL: process.env.AUDITORIA_REDIS_URL,
    };
    process.env.DATABASE_URL = url.toString();
    if (redisLocal) process.env.AUDITORIA_REDIS_URL = redisLocal;
    else delete process.env.AUDITORIA_REDIS_URL;

    prisma = new PrismaService();
    await prisma.$connect();
    await prisma.$executeRaw`
      INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol)
      VALUES (${admin.idUsuario}::uuid, ${`${admin.idUsuario}@example.invalid`}, 'fixture-rf123', 'ADMINISTRATIVO'),
             (${estudiante.idUsuario}::uuid, ${`${estudiante.idUsuario}@example.invalid`}, 'fixture-rf123', 'ESTUDIANTE')
    `;

    const modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        AdministrativoModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(SessionAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest<SolicitudPrueba>();
          const cuenta = req.headers['x-prueba-actor'];
          if (!cuenta) throw new UnauthorizedException();
          const actor = cuenta === 'estudiante' ? estudiante : admin;
          req.autenticacion = {
            usuario: {
              id_usuario: actor.idUsuario,
              rol: cuenta === 'estudiante' ? 'ESTUDIANTE' : 'ADMINISTRATIVO',
            },
            sesion: {
              id_sesion: actor.idSesion,
              alcance_sesion: cuenta === 'limitada' ? 'LIMITADA' : 'COMPLETA',
            },
          };
          return true;
        },
      })
      .compile();
    app = modulo.createNestApplication();
    await app.init();
    auditoria = app.get(AuditoriaService);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
    for (const [k, v] of Object.entries(ambiente ?? {})) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  function listar(actor = 'admin', query = '') {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get(ruta + query)
      .set('x-prueba-actor', actor);
  }

  function registros(ctx: ContextoAuditoria, recurso: string) {
    return prisma.$queryRaw<
      Array<{ id_auditoria: string; estado: string; direccion_ip: string }>
    >`
      SELECT id_auditoria, estado_accion::text AS estado, direccion_ip
      FROM administrativo.bitacora_auditoria
      WHERE recurso_afectado = ${recurso} AND id_usuario_administrativo = ${ctx.idUsuario}::uuid
        AND id_sesion = ${ctx.idSesion}::uuid ORDER BY marca_temporal DESC
    `;
  }

  it('autoriza la lectura, registra el acceso y pagina sin repetir la fila del cursor', async () => {
    await listar().expect(200);
    await listar().expect(200);
    const primera = await listar('admin', '?limite=1')
      .expect('Cache-Control', 'no-store')
      .expect(200);
    const pagina = primera.body as {
      data: Array<Record<string, unknown>>;
      meta: { siguiente_cursor: string };
    };
    expect(Object.keys(pagina.data[0]).sort()).toEqual([
      'accion',
      'direccion_ip',
      'estado_accion',
      'id_auditoria',
      'id_recurso',
      'marca_temporal',
      'recurso_afectado',
    ]);
    expect(pagina.data[0]).toMatchObject({
      accion: 'ACCESO_MODULO',
      estado_accion: 'EXITOSA',
    });
    const segunda = await listar(
      'admin',
      `?limite=1&antes_de=${pagina.meta.siguiente_cursor}`,
    ).expect(200);
    expect(
      (segunda.body as { data: Array<{ id_auditoria: string }> }).data[0]
        ?.id_auditoria,
    ).not.toBe(pagina.meta.siguiente_cursor);
    expect((await registros(admin, 'BITACORA_AUDITORIA'))[0]).toMatchObject({
      estado: 'EXITOSA',
      direccion_ip: expect.stringMatching(/127\.0\.0\.1|::1/) as unknown,
    });
  });

  it('registra acceso denegado y fallos de validación', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .get(ruta)
      .expect(401);
    await listar('estudiante')
      .expect(403)
      .expect(({ body }) => {
        expect(body).toMatchObject({ codigo: 'ACCESO_DENEGADO' });
      });
    await listar('limitada').expect(403);
    await listar('admin', '?limite=0').expect(400);
    expect(await registros(estudiante, 'BITACORA_AUDITORIA')).toMatchObject([
      { estado: 'DENEGADA' },
    ]);
    const estados = (await registros(admin, 'BITACORA_AUDITORIA')).map(
      (fila) => fila.estado,
    );
    expect(estados).toEqual(expect.arrayContaining(['FALLIDA', 'DENEGADA']));
    await expect(
      prisma.$queryRaw`SELECT accion::text AS accion FROM administrativo.bitacora_auditoria WHERE id_sesion IS NULL AND estado_accion = 'DENEGADA'`,
    ).resolves.toContainEqual({ accion: 'ACCESO_MODULO' });
  });

  it('bloquea UPDATE y DELETE aun si la sentencia no encuentra filas', async () => {
    await expect(
      prisma.$executeRaw`UPDATE administrativo.bitacora_auditoria SET estado_accion = 'FALLIDA' WHERE false`,
    ).rejects.toThrow();
    await expect(
      prisma.$executeRaw`DELETE FROM administrativo.bitacora_auditoria WHERE false`,
    ).rejects.toThrow();
  });

  it('aborta la lectura y revierte una exportación si falla su inserción de auditoría', async () => {
    const identificador = randomUUID();
    await prisma.$executeRaw`CREATE FUNCTION administrativo.fn_prueba_fallo_rf123() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo controlado RF-123'; END $$`;
    await prisma.$executeRaw`CREATE TRIGGER trg_prueba_fallo_rf123 BEFORE INSERT ON administrativo.bitacora_auditoria
      FOR EACH ROW WHEN (NEW.estado_accion = 'EXITOSA' AND NEW.recurso_afectado IN ('BITACORA_AUDITORIA','EXPORTACION_RF123_PRUEBA'))
      EXECUTE FUNCTION administrativo.fn_prueba_fallo_rf123()`;
    try {
      const respuesta = await listar().expect(500);
      expect(respuesta.body).toMatchObject({
        codigo: 'ERROR_REGISTRO_AUDITORIA',
      });
      expect(respuesta.body).not.toHaveProperty('data');
      await expect(
        auditoria.ejecutar(
          admin,
          { accion: 'EXPORTACION_DATOS', recurso: 'EXPORTACION_RF123_PRUEBA' },
          async (tx) => {
            await tx.$executeRaw`INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash) VALUES (${identificador}::uuid, ${`${identificador}@example.invalid`}, 'fixture-rf123')`;
            return Buffer.from('Archivo de prueba');
          },
        ),
      ).rejects.toThrow();
      await expect(
        prisma.$queryRaw`SELECT id_usuario FROM usuario.usuarios WHERE id_usuario = ${identificador}::uuid`,
      ).resolves.toEqual([]);
      expect(await registros(admin, 'EXPORTACION_RF123_PRUEBA')).toMatchObject([
        { estado: 'FALLIDA' },
      ]);
    } finally {
      await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallo_rf123 ON administrativo.bitacora_auditoria`;
      await prisma.$executeRaw`DROP FUNCTION administrativo.fn_prueba_fallo_rf123()`;
    }
  });

  conRedis(
    'registra de forma diferida con un UUID estable y los reintentos acordados',
    async () => {
      const cola = new Queue('auditoria-diferida', {
        connection: { url: redisLocal },
      });
      const evento = {
        idAuditoria: randomUUID(),
        accion: 'ACCESO_MODULO',
        recurso: 'DIFERIDO_RF123',
        estado: 'EXITOSA',
      } as const;
      try {
        await cola.waitUntilReady();
        await prisma.$executeRaw`CREATE FUNCTION administrativo.fn_prueba_fallo_diferido_rf123() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo transitorio RF-123'; END $$`;
        await prisma.$executeRaw`CREATE TRIGGER trg_prueba_fallo_diferido_rf123 BEFORE INSERT ON administrativo.bitacora_auditoria
        FOR EACH ROW WHEN (NEW.registrado_diferido AND NEW.recurso_afectado = 'DIFERIDO_RF123')
        EXECUTE FUNCTION administrativo.fn_prueba_fallo_diferido_rf123()`;
        await cola.pause();
        await expect(
          auditoria.registrar(admin, evento, { modo: 'DIFERIDO' }),
        ).resolves.toBe(evento.idAuditoria);
        const trabajo = await cola.getJob(evento.idAuditoria);
        expect(trabajo?.opts).toMatchObject({
          attempts: 6,
          backoff: { type: 'exponential', delay: 1000 },
        });
        await cola.resume();
        await esperarHasta(
          async () => (await trabajo?.getState()) === 'delayed',
        );
        expect(await registros(admin, evento.recurso)).toEqual([]);
        await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallo_diferido_rf123 ON administrativo.bitacora_auditoria`;
        await esperarHasta(
          async () => (await registros(admin, evento.recurso)).length === 1,
        );
        await expect(
          auditoria.registrar(admin, evento, { modo: 'DIFERIDO' }),
        ).resolves.toBe(evento.idAuditoria);
        await esperarHasta(
          async () => (await cola.getJob(evento.idAuditoria)) === undefined,
        );
        expect(await registros(admin, evento.recurso)).toMatchObject([
          { id_auditoria: evento.idAuditoria, estado: 'EXITOSA' },
        ]);
      } finally {
        await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_prueba_fallo_diferido_rf123 ON administrativo.bitacora_auditoria`;
        await prisma.$executeRaw`DROP FUNCTION IF EXISTS administrativo.fn_prueba_fallo_diferido_rf123()`;
        await cola.resume();
        await cola.close();
      }
    },
  );
});

async function esperarHasta(exito: () => Promise<boolean>) {
  const limite = Date.now() + 15_000;
  while (!(await exito())) {
    if (Date.now() > limite)
      throw new Error('No se confirmó la auditoría diferida.');
    await esperar(100);
  }
}
