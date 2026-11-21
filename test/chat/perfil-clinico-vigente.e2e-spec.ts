import { Inject, Injectable, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PerfilClinicoVigentePort } from '../../src/modules/chat/application/ports/perfil-clinico-vigente.port';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { ModalidadConversacional } from '../../src/modules/chat/domain/enums/modalidad-conversacional-enum';
import {
  DimensionPerfilClinico,
  TipoCravingClinico,
} from '../../src/modules/chat/domain/enums/perfil-clinico.enum';
import { PrismaPerfilRespuestaRepository } from '../../src/modules/chat/infrastructure/persistence/prisma-perfil-respuesta.repository';

@Injectable()
class ConsumidorSeguimiento {
  constructor(
    @Inject(PerfilClinicoVigentePort)
    readonly perfil: PerfilClinicoVigentePort,
  ) {}
}

@Module({ imports: [ChatModule], providers: [ConsumidorSeguimiento] })
class ModuloSeguimientoPrueba {}

const urlPruebas = process.env.RF39B_TEST_DATABASE_URL;
const describirIntegracion = urlPruebas ? describe : describe.skip;

jest.setTimeout(30_000);

describirIntegracion('RF-39B con el puerto de ChatModule y PostgreSQL', () => {
  let prisma: PrismaClient;
  let modulo: TestingModule;
  let puerto: PerfilClinicoVigentePort;

  beforeAll(async () => {
    const url = new URL(urlPruebas ?? '');
    if (
      url.hostname !== '127.0.0.1' ||
      !/^\/brisa_rf39b_[a-z0-9_]+$/.test(url.pathname)
    ) {
      throw new Error(
        'RF-39B requiere una base local desechable brisa_rf39b_*.',
      );
    }
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url.toString() }),
    });
    await prisma.$connect();
    modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        ModuloSeguimientoPrueba,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    puerto = modulo.get(ConsumidorSeguimiento).perfil;
  });

  afterAll(async () => {
    await modulo?.close();
    await prisma?.$disconnect();
  });

  async function estudiante() {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO usuario.usuarios
        (id_usuario, correo_electronico, contrasena_hash, estado_registro)
      VALUES (${id}::uuid, ${`${id}@example.invalid`}, 'fixture-rf39b', 'REGISTRO_COMPLETO')
    `;
    await prisma.$executeRaw`
      INSERT INTO chat.tipo_terapia (id_usuario, modalidad)
      VALUES (${id}::uuid, 'GRUPAL')
    `;
    return id;
  }

  async function crearSesion(
    idUsuario: string,
    estado: 'ACTIVA' | 'PAUSADA' | 'COMPLETADA' | 'ERROR_CONFIGURACION',
  ) {
    const idSesion = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO chat.sesiones (id_sesion, id_usuario, modalidad_activa)
      VALUES (${idSesion}::uuid, ${idUsuario}::uuid, 'GRUPAL')
    `;
    await prisma.$executeRaw`
      INSERT INTO chat.estado_sesiones (id_sesion, estado_actual)
      VALUES (${idSesion}::uuid, ${estado}::chat.estado_sesion_enum)
    `;
    return idSesion;
  }

  it('devuelve el perfil pendiente de una sesión activa y conserva la dimensión conocida', async () => {
    const id = await estudiante();
    const idSesion = await crearSesion(id, 'ACTIVA');

    await expect(puerto.obtener(id)).resolves.toEqual({
      id_usuario: id,
      tipo_dependencia: 'PENDIENTE_PERFIL',
      tipo_craving: 'PENDIENTE_PERFIL',
      modalidad_terapeutica_activa: 'GRUPAL',
      estado_perfil_clinico: 'PENDIENTE',
      fecha_clasificacion: null,
      fuente_clasificacion: 'CHAT',
    });

    await prisma.$transaction((tx) =>
      new PrismaPerfilRespuestaRepository(tx).capturarDimension({
        idUsuario: id,
        idSesion,
        idNodo: randomUUID(),
        dimension: DimensionPerfilClinico.TIPO_CRAVING,
        valor: TipoCravingClinico.NEGATIVO,
        modalidadSesion: ModalidadConversacional.GRUPAL,
      }),
    );
    const perfil = await puerto.obtener(id);
    expect(perfil).toMatchObject({
      tipo_dependencia: 'PENDIENTE_PERFIL',
      tipo_craving: 'NEGATIVO',
      estado_perfil_clinico: 'PENDIENTE',
    });
    expect(perfil.fecha_clasificacion).toBeInstanceOf(Date);
  });

  it('lee la clasificación y modalidad vigentes sin depender de eventos ni de la modalidad de la sesión', async () => {
    const id = await estudiante();
    const idSesion = await crearSesion(id, 'COMPLETADA');
    await crearSesion(id, 'COMPLETADA');
    await expect(puerto.obtener(id)).resolves.toMatchObject({
      estado_perfil_clinico: 'NO_CLASIFICADO',
      modalidad_terapeutica_activa: 'GRUPAL',
      fecha_clasificacion: null,
    });

    const fecha = new Date('2026-11-20T16:10:00Z');
    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO chat.perfil_clinico
          (id_usuario, tipo_dependencia, tipo_craving, fecha_actualizacion)
        VALUES (${id}::uuid, 'TOLERANCIA', 'POSITIVO', ${fecha})
      `,
      prisma.$executeRaw`
        UPDATE chat.tipo_terapia SET fecha_vigencia_hasta = now()
        WHERE id_usuario = ${id}::uuid AND fecha_vigencia_hasta IS NULL
      `,
      prisma.$executeRaw`
        INSERT INTO chat.tipo_terapia (id_usuario, modalidad)
        VALUES (${id}::uuid, 'PERSONALIZADA')
      `,
    ]);

    await expect(puerto.obtener(id)).resolves.toMatchObject({
      tipo_dependencia: 'TOLERANCIA',
      tipo_craving: 'POSITIVO',
      modalidad_terapeutica_activa: 'PERSONALIZADA',
      estado_perfil_clinico: 'ACTIVO',
      fecha_clasificacion: fecha,
    });
    await expect(
      prisma.$queryRaw`
        SELECT c.modalidad_activa::text, e.estado_actual::text
        FROM chat.sesiones c JOIN chat.estado_sesiones e USING (id_sesion)
        WHERE c.id_sesion = ${idSesion}::uuid
      `,
    ).resolves.toEqual([
      { modalidad_activa: 'GRUPAL', estado_actual: 'COMPLETADA' },
    ]);
    await expect(
      prisma.$queryRaw`SELECT id_usuario FROM chat.v_perfil_clinico_vigente WHERE id_usuario = ${id}::uuid`,
    ).resolves.toEqual([{ id_usuario: id }]);
  });

  it('rechaza consultar si no hay sesión activa o completada', async () => {
    const id = await estudiante();
    await expect(puerto.obtener(id)).rejects.toMatchObject({
      codigo: 'SIN_SESION_CONVERSACIONAL',
    });
    await crearSesion(id, 'PAUSADA');
    await crearSesion(id, 'ERROR_CONFIGURACION');
    await expect(puerto.obtener(id)).rejects.toMatchObject({
      codigo: 'SIN_SESION_CONVERSACIONAL',
    });
  });

  it('reporta una modalidad faltante sin usar la modalidad histórica de la sesión', async () => {
    const id = await estudiante();
    await crearSesion(id, 'ACTIVA');
    await prisma.$executeRaw`
      UPDATE chat.tipo_terapia SET fecha_vigencia_hasta = now()
      WHERE id_usuario = ${id}::uuid
    `;

    await expect(puerto.obtener(id)).rejects.toMatchObject({
      codigo: 'VALOR_CLINICO_INVALIDO',
    });
  });

  it('restringe la consulta a estudiantes con registro completo', async () => {
    const id = await estudiante();
    await crearSesion(id, 'ACTIVA');
    await prisma.$executeRaw`
      UPDATE usuario.usuarios SET estado_registro = 'PENDIENTE_CONSENTIMIENTO'
      WHERE id_usuario = ${id}::uuid
    `;
    await expect(puerto.obtener(id)).rejects.toMatchObject({
      codigo: 'SIN_SESION_CONVERSACIONAL',
    });

    await prisma.$executeRaw`
      UPDATE usuario.usuarios SET estado_registro = 'REGISTRO_COMPLETO', rol = 'ADMINISTRATIVO'
      WHERE id_usuario = ${id}::uuid
    `;
    await expect(puerto.obtener(id)).rejects.toMatchObject({
      codigo: 'SIN_SESION_CONVERSACIONAL',
    });
  });

  it('la vista exige permisos del invocador y no concede acceso a roles públicos', async () => {
    await expect(
      prisma.$queryRaw`
        SELECT 'security_invoker=true' = ANY(c.reloptions) AS invocador,
               NOT EXISTS (
                   SELECT FROM aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
                   LEFT JOIN pg_roles r ON r.oid = a.grantee
                   WHERE a.grantee = 0 OR r.rolname IN ('anon', 'authenticated')
               ) AS privada
        FROM pg_class c
        WHERE c.oid = 'chat.v_perfil_clinico_vigente'::regclass
      `,
    ).resolves.toEqual([{ invocador: true, privada: true }]);
  });
});
