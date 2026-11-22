import { Inject, Injectable, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PerfilClinicoVigente,
  PerfilClinicoVigentePort,
} from '../../src/modules/chat/application/ports/perfil-clinico-vigente.port';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { DomainException } from '../../src/modules/chat/domain/exceptions/domain.exception';
import { PrismaPerfilClinicoVigenteAdapter } from '../../src/modules/chat/infrastructure/persistence/prisma-perfil-clinico-vigente.adapter';

/*
 * RF-39B · integración (consumidor que simula a M05).
 *
 * Nivel: inyección de dependencias real de NestJS y adaptador real de
 * ChatModule, con PrismaService sustituido por un doble que devuelve filas
 * con la forma de `chat.v_perfil_clinico_vigente`. No abre conexiones ni
 * escribe datos. Verifica la exportación del puerto, su consumo desde otro
 * módulo y el contrato que recibe M05; NO verifica la vista SQL. Esa
 * verificación está en `perfil-clinico-vigente.e2e-spec.ts`, que requiere
 * una base local desechable `brisa_rf39b_*`.
 *
 * Los identificadores son sintéticos; no hay datos de estudiantes reales.
 */

@Injectable()
class ConsumidorSeguimientoSimulado {
  constructor(
    @Inject(PerfilClinicoVigentePort)
    readonly perfil: PerfilClinicoVigentePort,
  ) {}
}

@Module({
  imports: [ChatModule],
  providers: [ConsumidorSeguimientoSimulado],
})
class ModuloSeguimientoSimulado {}

const ID_GRUPAL = '39b00000-0000-4000-8000-000000000001';
const ID_COMPLETO = '39b00000-0000-4000-8000-000000000002';
const ID_PERSONALIZADA = '39b00000-0000-4000-8000-000000000003';

const fila = (
  idUsuario: string,
  campos: Partial<Record<keyof PerfilClinicoVigente, unknown>>,
) => ({
  id_usuario: idUsuario,
  tipo_dependencia: 'PENDIENTE_PERFIL',
  tipo_craving: 'PENDIENTE_PERFIL',
  modalidad_terapeutica_activa: 'GRUPAL',
  estado_perfil_clinico: 'PENDIENTE',
  fecha_clasificacion: null,
  fuente_clasificacion: 'CHAT',
  ...campos,
});

describe('RF-39B · consumidor de M05 con el puerto exportado por ChatModule', () => {
  const consultar = jest.fn();
  let modulo: TestingModule;
  let puerto: PerfilClinicoVigentePort;

  beforeAll(async () => {
    modulo = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({ global: true }),
        ModuloSeguimientoSimulado,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: consultar })
      .compile();
    puerto = modulo.get(ConsumidorSeguimientoSimulado).perfil;
  });

  afterAll(() => modulo?.close());

  beforeEach(() => consultar.mockReset());

  describe('exportación e inyección', () => {
    it('un módulo externo que importa ChatModule recibe el adaptador real', () => {
      expect(puerto).toBeInstanceOf(PrismaPerfilClinicoVigenteAdapter);
      expect(typeof puerto.obtener).toBe('function');
    });

    it('sin importar ChatModule el puerto no se puede resolver', async () => {
      @Module({ providers: [ConsumidorSeguimientoSimulado] })
      class ModuloSinChat {}

      await expect(
        Test.createTestingModule({ imports: [ModuloSinChat] }).compile(),
      ).rejects.toThrow(/PerfilClinicoVigentePort/);
    });

    it('consulta la vista prevista con el UUID como parámetro', async () => {
      consultar.mockResolvedValue([fila(ID_GRUPAL, {})]);

      await puerto.obtener(ID_GRUPAL);

      const [plantilla, ...parametros] = consultar.mock.calls[0] as [
        TemplateStringsArray,
        ...unknown[],
      ];
      expect(plantilla.join('?')).toMatch(
        /FROM chat\.v_perfil_clinico_vigente/,
      );
      expect(parametros).toEqual([ID_GRUPAL]);
    });
  });

  it('escenario 1: GRUPAL sin perfil clínico devuelve PENDIENTE_PERFIL y estado PENDIENTE', async () => {
    consultar.mockResolvedValue([fila(ID_GRUPAL, {})]);

    await expect(puerto.obtener(ID_GRUPAL)).resolves.toEqual({
      id_usuario: ID_GRUPAL,
      tipo_dependencia: 'PENDIENTE_PERFIL',
      tipo_craving: 'PENDIENTE_PERFIL',
      modalidad_terapeutica_activa: 'GRUPAL',
      estado_perfil_clinico: 'PENDIENTE',
      fecha_clasificacion: null,
      fuente_clasificacion: 'CHAT',
    });
  });

  it('escenario 2: perfil completo se entrega sin reemplazar valores, con su fecha y fuente', async () => {
    const fecha = new Date('2026-11-20T16:10:00Z');
    consultar.mockResolvedValue([
      fila(ID_COMPLETO, {
        tipo_dependencia: 'TOLERANCIA',
        tipo_craving: 'POSITIVO',
        estado_perfil_clinico: 'ACTIVO',
        fecha_clasificacion: fecha,
      }),
    ]);

    const perfil = await puerto.obtener(ID_COMPLETO);

    expect(perfil).toEqual({
      id_usuario: ID_COMPLETO,
      tipo_dependencia: 'TOLERANCIA',
      tipo_craving: 'POSITIVO',
      modalidad_terapeutica_activa: 'GRUPAL',
      estado_perfil_clinico: 'ACTIVO',
      fecha_clasificacion: fecha,
      fuente_clasificacion: 'CHAT',
    });
    expect(JSON.stringify(perfil)).not.toContain('PENDIENTE_PERFIL');
  });

  it('escenario 3: PERSONALIZADA devuelve las dimensiones reales del catálogo', async () => {
    consultar.mockResolvedValue([
      fila(ID_PERSONALIZADA, {
        tipo_dependencia: 'ABSTINENCIA_FISICA',
        tipo_craving: 'NEGATIVO',
        modalidad_terapeutica_activa: 'PERSONALIZADA',
        estado_perfil_clinico: 'ACTIVO',
        fecha_clasificacion: new Date('2026-11-21T09:00:00Z'),
      }),
    ]);

    const perfil = await puerto.obtener(ID_PERSONALIZADA);

    expect(perfil.modalidad_terapeutica_activa).toBe('PERSONALIZADA');
    expect(['ABSTINENCIA_FISICA', 'TOLERANCIA']).toContain(
      perfil.tipo_dependencia,
    );
    expect(['POSITIVO', 'NEGATIVO']).toContain(perfil.tipo_craving);
    expect(perfil).toMatchObject({
      id_usuario: ID_PERSONALIZADA,
      tipo_dependencia: 'ABSTINENCIA_FISICA',
      tipo_craving: 'NEGATIVO',
      estado_perfil_clinico: 'ACTIVO',
    });
  });

  describe('errores de dominio', () => {
    it('SIN_SESION_CONVERSACIONAL cuando la vista no devuelve al estudiante', async () => {
      consultar.mockResolvedValue([]);

      const error: unknown = await puerto
        .obtener(ID_GRUPAL)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(DomainException);
      expect(error).toMatchObject({
        codigo: 'SIN_SESION_CONVERSACIONAL',
        tipo: 'NO_PROCESABLE',
      });
    });

    it.each([
      ['una dependencia fuera de catálogo', { tipo_dependencia: 'ALTA' }],
      ['un craving fuera de catálogo', { tipo_craving: 'EMOCIONAL' }],
      ['la falta de modalidad vigente', { modalidad_terapeutica_activa: null }],
    ])('VALOR_CLINICO_INVALIDO ante %s', async (_caso, campos) => {
      consultar.mockResolvedValue([fila(ID_GRUPAL, campos)]);

      const error: unknown = await puerto
        .obtener(ID_GRUPAL)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(DomainException);
      expect(error).toMatchObject({
        codigo: 'VALOR_CLINICO_INVALIDO',
        tipo: 'SOLICITUD_INVALIDA',
      });
    });
  });
});
