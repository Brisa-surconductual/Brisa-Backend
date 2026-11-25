import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AdministrativoModule } from '../../src/modules/administrativo/administrativo.module';
import type { ParticipanteCohorte } from '../../src/modules/administrativo/domain/entities/participante-cohorte/participante-cohorte.entity';
import { SessionCookieConfig } from '../../src/modules/usuarios/application/ports/session-cookie-config';

const urlLocal = process.env.RF125_TEST_DATABASE_URL;
const conPostgres = urlLocal ? describe : describe.skip;
const base = '/admin/cohortes';

conPostgres(
  'RF-125 participantes de cohorte con PostgreSQL y sesión real',
  () => {
    jest.setTimeout(60_000);
    let app: INestApplication;
    let prisma: PrismaService;
    let admin: { id: string; sesion: string; cookie: string; csrf: string };
    let estudiante: typeof admin;
    const cronograma = randomUUID();
    const envAnterior = process.env.DATABASE_URL;

    async function crearEstudiante(
      completo: boolean,
      id = randomUUID(),
      vincularLineaBase = completo,
    ) {
      let consentimiento: string | null = null;
      if (completo) {
        consentimiento = randomUUID();
        await prisma.$executeRaw`
        INSERT INTO usuario.consentimientos
          (id_consentimiento, version_consentimiento, vigente, fecha_invalidacion, motivo_invalidacion, url_contenido, titulo)
        VALUES (${consentimiento}::uuid, ${consentimiento.slice(0, 18)}, false, now(),
          'Prueba RF-125', 'https://example.invalid/consentimiento', 'Consentimiento RF-125')
      `;
      }
      await prisma.$executeRaw`
      INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol, estado_registro,
        consentimiento_aceptado, registro_consumo_aceptado, id_consentimiento)
      VALUES (${id}::uuid, ${id + '@example.invalid'}, ${randomUUID()}, 'ESTUDIANTE',
        ${completo ? 'REGISTRO_COMPLETO' : 'PENDIENTE_CONSENTIMIENTO'}::usuario.estado_registro_enum,
        ${completo ? true : null}, ${completo ? true : null}, ${consentimiento}::uuid)
    `;
      if (vincularLineaBase) {
        await prisma.$executeRaw`
        INSERT INTO usuario.linea_base (id_usuario, entidad_educativa, programa_academico,
          semestre_cursado, nivel_academico, ciudad, fecha_nacimiento, fecha_inicio_consumo,
          motivo_inicio_consumo, fecha_ultimo_consumo, frecuencia_consumo)
        VALUES (${id}::uuid, 'Universidad', 'Programa', 3, 'PREGRADO', 'Neiva',
          '2000-01-01', '2024-01-01', 'OTRO', '2025-01-01', 3)
      `;
      }
      return id;
    }

    async function crearSesion(id: string) {
      const sesion = randomUUID();
      const token = randomUUID();
      const csrf = randomUUID();
      const hash = (valor: string) =>
        createHash('sha256').update(valor).digest('hex');
      await prisma.$executeRaw`
      INSERT INTO usuario.sesiones (id_sesion, id_usuario, token_hash, csrf_token_hash, alcance_sesion)
      VALUES (${sesion}::uuid, ${id}::uuid, ${hash(token)}, ${hash(csrf)}, 'COMPLETA')
    `;
      const nombre = app.get(SessionCookieConfig).obtenerNombreCookie();
      return { id, sesion, cookie: `${nombre}=${token}`, csrf };
    }

    async function crearCohorte(estado: 'ACTIVA' | 'BORRADOR' = 'ACTIVA') {
      const id = randomUUID();
      await prisma.$executeRaw`
      INSERT INTO administrativo.cohortes (id_cohorte, nombre_cohorte, fecha_inicio_programa,
        fecha_fin_programa, id_cronograma, estado, creado_por)
      VALUES (${id}::uuid, ${'Cohorte RF-125 ' + id}, '2026-11-30', '2027-04-30',
        ${cronograma}::uuid, ${estado}::administrativo.estado_cohorte_enum, ${admin.id}::uuid)
    `;
      return id;
    }

    async function codigo(id: string) {
      const [fila] = await prisma.$queryRaw<{ codigo: string }[]>`
      SELECT administrativo.fn_obtener_codigo_participante(${id}::uuid) AS codigo
    `;
      return fila.codigo;
    }

    const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];
    const ruta = (id: string) => `${base}/${id}/participantes`;
    const listar = (id: string) =>
      request(servidor()).get(ruta(id)).set('Cookie', admin.cookie);
    const elegibles = (id: string) =>
      request(servidor())
        .get(`${ruta(id)}/elegibles`)
        .set('Cookie', admin.cookie);
    const asignar = (id: string, codigos: string[]) =>
      request(servidor())
        .post(ruta(id))
        .set('Cookie', admin.cookie)
        .set('X-CSRF-Token', admin.csrf)
        .send({ codigos_participante: codigos });
    const retirar = (id: string, codigoParticipante: string) =>
      request(servidor())
        .delete(`${ruta(id)}/${codigoParticipante}`)
        .set('Cookie', admin.cookie)
        .set('X-CSRF-Token', admin.csrf);
    const cambiarEstado = (id: string, estado: string) =>
      request(servidor())
        .patch(`${base}/${id}`)
        .set('Cookie', admin.cookie)
        .set('X-CSRF-Token', admin.csrf)
        .send({ estado });

    beforeAll(async () => {
      const url = new URL(urlLocal ?? '');
      if (
        url.hostname !== '127.0.0.1' ||
        !/^\/brisa_rf125_[a-z0-9_]+$/u.test(url.pathname)
      ) {
        throw new Error(
          'RF-125 requiere una base desechable brisa_rf125_* en localhost.',
        );
      }
      process.env.DATABASE_URL = url.toString();
      const modulo = await Test.createTestingModule({
        imports: [
          EventEmitterModule.forRoot({ global: true }),
          AdministrativoModule,
        ],
      }).compile();
      app = modulo.createNestApplication({ logger: false });
      app.use(cookieParser());
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
      prisma = app.get(PrismaService);
      const id = randomUUID();
      await prisma.$executeRaw`
      INSERT INTO usuario.usuarios (id_usuario, correo_electronico, contrasena_hash, rol, estado_registro,
        consentimiento_aceptado, registro_consumo_aceptado)
      VALUES (${id}::uuid, ${id + '@example.invalid'}, ${randomUUID()}, 'ADMINISTRATIVO',
        'REGISTRO_COMPLETO', true, true)
    `;
      admin = await crearSesion(id);
      estudiante = await crearSesion(await crearEstudiante(true));
      await prisma.$executeRaw`
      INSERT INTO cronograma.cronogramas (id_cronograma, nombre_cronograma, estado, fecha_activacion)
      VALUES (${cronograma}::uuid, 'Cronograma RF-125', 'ACTIVO', now())
    `;
    });

    afterAll(async () => {
      await app?.close();
      if (envAnterior === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = envAnterior;
    });

    it('emite códigos perezosos y asigna por lote como ACTIVO o PENDIENTE_VALIDACION', async () => {
      const id = await crearCohorte();
      const completo = await crearEstudiante(true);
      const incompleto = await crearEstudiante(false);
      const contarCodigos = () => prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM administrativo.seudonimos_participante
      WHERE id_usuario IN (${completo}::uuid, ${incompleto}::uuid)
    `;
      expect(await contarCodigos()).toEqual([{ total: 0 }]);

      const catalogo = await elegibles(id)
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(await contarCodigos()).toEqual([{ total: 2 }]);
      const sinAlias = await prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM administrativo.seudonimos_participante WHERE id_usuario = ${admin.id}::uuid
    `;
      expect(sinAlias).toEqual([{ total: 0 }]);
      const completoCodigo = await codigo(completo);
      const pendienteCodigo = await codigo(incompleto);
      expect(catalogo.body).toContainEqual({
        codigo_participante: completoCodigo,
      });
      expect(catalogo.body).toContainEqual({
        codigo_participante: pendienteCodigo,
      });
      expect(catalogo.text).not.toContain('@example.invalid');
      expect(catalogo.text).not.toContain(completo);

      const respuesta = await asignar(id, [
        pendienteCodigo,
        completoCodigo,
      ]).expect(201);
      expect(respuesta.body).toHaveLength(2);
      expect(respuesta.body).toContainEqual({
        codigo_participante: completoCodigo,
        estado: 'ACTIVO',
        estado_registro: 'COMPLETO',
        estado_consentimiento: 'ACEPTADO',
        estado_linea_base: 'REGISTRADA',
        motivos_pendiente: [],
      });
      expect(respuesta.body).toContainEqual({
        codigo_participante: pendienteCodigo,
        estado: 'PENDIENTE_VALIDACION',
        estado_registro: 'PENDIENTE',
        estado_consentimiento: 'NO_ACEPTADO',
        estado_linea_base: 'PENDIENTE',
        motivos_pendiente: [
          'REGISTRO_INCOMPLETO',
          'CONSENTIMIENTO_NO_ACEPTADO',
          'LINEA_BASE_NO_REGISTRADA',
        ],
      });
      const listado = await listar(id)
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(listado.body).toEqual(respuesta.body);
      const otroCatalogo = await elegibles(await crearCohorte()).expect(200);
      expect(otroCatalogo.body).not.toContainEqual({
        codigo_participante: completoCodigo,
      });
      expect(otroCatalogo.body).not.toContainEqual({
        codigo_participante: pendienteCodigo,
      });
    });

    it('conserva el estado pendiente cuando falta solo la línea base', async () => {
      const id = await crearCohorte();
      const alias = await codigo(
        await crearEstudiante(true, randomUUID(), false),
      );
      const respuesta = await asignar(id, [alias]).expect(201);
      expect(respuesta.body).toEqual([
        {
          codigo_participante: alias,
          estado: 'PENDIENTE_VALIDACION',
          estado_registro: 'COMPLETO',
          estado_consentimiento: 'ACEPTADO',
          estado_linea_base: 'NO_REGISTRADA',
          motivos_pendiente: ['LINEA_BASE_NO_REGISTRADA'],
        },
      ]);
    });

    it('revierte todo el lote cuando un código conocido ya está asignado', async () => {
      const id = await crearCohorte();
      const [primero, segundo] = [randomUUID(), randomUUID()].sort();
      const [libre, asignado] = [
        await codigo(await crearEstudiante(false, primero)),
        await codigo(await crearEstudiante(true, segundo)),
      ];
      await asignar(id, [asignado]).expect(201);
      const conflicto = await asignar(id, [libre, asignado]).expect(409);
      expect(conflicto.body).toMatchObject({
        codigo: 'PARTICIPANTE_YA_ASIGNADO',
        detalles: { codigo_participante: asignado },
      });
      const listado = (await listar(id).expect(200))
        .body as ParticipanteCohorte[];
      expect(
        listado.map(({ codigo_participante }) => codigo_participante),
      ).toEqual([asignado]);
      const auditoria = await prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM administrativo.bitacora_auditoria
      WHERE id_participante = ${primero}::uuid AND accion = 'GESTION_PARTICIPANTE_COHORTE' AND estado_accion = 'EXITOSA'
    `;
      expect(auditoria).toEqual([{ total: 0 }]);
    });

    it('retira, conserva historial y permite reasignar la misma membresía', async () => {
      const id = await crearCohorte();
      const participante = await crearEstudiante(true);
      const alias = await codigo(participante);
      await asignar(id, [alias]).expect(201);

      const retiro = await retirar(id, alias).expect(200);
      expect(retiro.body).toMatchObject({
        codigo_participante: alias,
        estado: 'INACTIVO',
      });
      expect((await listar(id).expect(200)).body).toEqual([
        retiro.body as ParticipanteCohorte,
      ]);
      expect((await retirar(id, alias).expect(404)).body).toMatchObject({
        codigo: 'PARTICIPANTE_NO_ASIGNADO',
      });
      expect((await elegibles(id).expect(200)).body).toContainEqual({
        codigo_participante: alias,
      });
      await asignar(id, [alias]).expect(201);

      const historial = await prisma.$queryRaw<{ estado: string }[]>`
      SELECT h.estado_nuevo::text AS estado
      FROM administrativo.cohorte_participantes cp
      JOIN administrativo.cohorte_participantes_historial h USING (id_cohorte_participante)
      WHERE cp.id_cohorte = ${id}::uuid AND cp.id_usuario = ${participante}::uuid AND cp.fecha_retiro IS NULL
        AND h.id_usuario_administrativo = ${admin.id}::uuid
      ORDER BY h.id_historial
    `;
      expect(historial.map(({ estado }) => estado)).toEqual([
        'ACTIVO',
        'INACTIVO',
        'ACTIVO',
      ]);
      const auditoria = await prisma.$queryRaw<{ operacion: string }[]>`
      SELECT detalle ->> 'operacion' AS operacion FROM administrativo.bitacora_auditoria
      WHERE id_participante = ${participante}::uuid AND id_sesion = ${admin.sesion}::uuid
        AND id_usuario_administrativo = ${admin.id}::uuid AND accion = 'GESTION_PARTICIPANTE_COHORTE'
        AND estado_accion = 'EXITOSA' AND registrado_diferido = false
      ORDER BY marca_temporal
    `;
      expect(auditoria.map(({ operacion }) => operacion)).toEqual([
        'ASIGNAR',
        'RETIRAR',
        'ASIGNAR',
      ]);
    });

    it('resuelve asignaciones concurrentes del mismo estudiante pendiente en una sola cohorte activa', async () => {
      const [a, b] = [await crearCohorte(), await crearCohorte()];
      const alias = await codigo(await crearEstudiante(false));
      const resultados = await Promise.all([
        asignar(a, [alias]),
        asignar(b, [alias]),
      ]);
      expect(resultados.map(({ status }) => status).sort()).toEqual([201, 409]);
      expect(
        resultados.find(({ status }) => status === 409)?.body,
      ).toMatchObject({
        codigo: 'PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA',
      });
    });

    it('impide reactivar una cohorte si alguna membresía ya quedó en otra activa', async () => {
      const [anterior, vigente] = [await crearCohorte(), await crearCohorte()];
      const alias = await codigo(await crearEstudiante(true));
      await asignar(anterior, [alias]).expect(201);
      await cambiarEstado(anterior, 'INACTIVA').expect(200);
      await asignar(vigente, [alias]).expect(201);
      const conflicto = await cambiarEstado(anterior, 'ACTIVA').expect(409);
      expect(conflicto.body).toMatchObject({
        codigo: 'PARTICIPANTE_EN_OTRA_COHORTE_ACTIVA',
      });

      await retirar(vigente, alias).expect(200);
      await cambiarEstado(anterior, 'ACTIVA').expect(200);
    });

    it('valida sesión, rol, CSRF, forma del lote y referencias', async () => {
      const id = await crearCohorte('BORRADOR');
      const activa = await crearCohorte();
      const alias = await codigo(await crearEstudiante(false));
      const datos = { codigos_participante: [alias] };
      await request(servidor()).get(ruta(id)).expect(401);
      await request(servidor())
        .get(`${ruta(id)}/elegibles`)
        .set('Cookie', estudiante.cookie)
        .expect(403);
      await request(servidor())
        .post(ruta(id))
        .set('Cookie', estudiante.cookie)
        .set('X-CSRF-Token', estudiante.csrf)
        .send(datos)
        .expect(403);
      await request(servidor())
        .post(ruta(id))
        .set('Cookie', admin.cookie)
        .send(datos)
        .expect(403);
      await request(servidor())
        .delete(`${ruta(id)}/${alias}`)
        .set('Cookie', admin.cookie)
        .expect(403);
      await asignar(activa, []).expect(400);
      await asignar(activa, [alias, alias]).expect(400);
      await asignar(activa, ['un correo@example.invalid']).expect(400);
      expect((await asignar(id, [alias]).expect(422)).body).toMatchObject({
        codigo: 'COHORTE_NO_ACTIVA',
      });
      expect(
        (await asignar(activa, ['INEXISTENTE']).expect(404)).body,
      ).toMatchObject({ codigo: 'PARTICIPANTE_NO_ENCONTRADO' });
      expect((await listar(randomUUID()).expect(404)).body).toMatchObject({
        codigo: 'COHORTE_NO_ENCONTRADA',
      });
      await elegibles(id).expect(200, []);
      await listar(activa).expect(200, []);
    });

    it('revierte la membresía y la emisión de códigos cuando falla la auditoría', async () => {
      const id = await crearCohorte();
      const asignado = await crearEstudiante(true);
      const alias = await codigo(asignado);
      const sinCodigo = await crearEstudiante(false);
      await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION administrativo.fn_prueba_fallar_rf125_auditoria() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo controlado de auditoría RF-125'; END $$
    `;
      await prisma.$executeRaw`
      CREATE TRIGGER trg_prueba_fallar_rf125_auditoria BEFORE INSERT ON administrativo.bitacora_auditoria
      FOR EACH ROW WHEN (NEW.estado_accion = 'EXITOSA' AND
        (NEW.accion = 'GESTION_PARTICIPANTE_COHORTE' OR NEW.recurso_afectado = 'PARTICIPANTES_ELEGIBLES_COHORTE'))
      EXECUTE FUNCTION administrativo.fn_prueba_fallar_rf125_auditoria()
    `;
      try {
        await asignar(id, [alias]).expect(500);
        const catalogo = await elegibles(id).expect(500);
        expect(catalogo.body).toMatchObject({
          codigo: 'ERROR_REGISTRO_AUDITORIA',
        });
      } finally {
        await prisma.$executeRaw`DROP TRIGGER trg_prueba_fallar_rf125_auditoria ON administrativo.bitacora_auditoria`;
        await prisma.$executeRaw`DROP FUNCTION administrativo.fn_prueba_fallar_rf125_auditoria()`;
      }
      await listar(id).expect(200, []);
      const seudonimos = await prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM administrativo.seudonimos_participante WHERE id_usuario = ${sinCodigo}::uuid
    `;
      expect(seudonimos).toEqual([{ total: 0 }]);
    });
  },
);
