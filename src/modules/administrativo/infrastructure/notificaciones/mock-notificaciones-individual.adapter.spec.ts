import type { NotificacionesIndividualPort } from '../../application/ports/notificaciones-individual.port';
import {
  ID_USUARIO_INCONSISTENTE_M07,
  MockNotificacionesIndividualAdapter,
} from './mock-notificaciones-individual.adapter';

const ID_USUARIO = 'e0000000-0000-4000-8000-000000000003';
const PERIODO = { fecha_inicio: '2026-10-01', fecha_fin: '2026-11-22' };

describe('MockNotificacionesIndividualAdapter', () => {
  // Por el puerto: el mock ignora el periodo, pero el contrato lo recibe.
  const adaptador: NotificacionesIndividualPort =
    new MockNotificacionesIndividualAdapter();
  const variables = [
    'SIMULAR_M7_CAIDO',
    'SIMULAR_INCONSISTENCIA_M7',
    'SIMULAR_M7_SIN_DATOS',
    'SIMULAR_M7_SIN_ENTREGAS',
    'MOCK_M7_DELAY_MS',
  ] as const;
  const anteriores = Object.fromEntries(
    variables.map((v) => [v, process.env[v]]),
  );

  beforeEach(() => {
    for (const v of variables) delete process.env[v];
    process.env.MOCK_M7_DELAY_MS = '0';
  });

  afterAll(() => {
    for (const v of variables) {
      if (anteriores[v] === undefined) delete process.env[v];
      else process.env[v] = anteriores[v];
    }
  });

  it('devuelve los datos de muestra del contrato para el usuario solicitado', async () => {
    await expect(
      adaptador.obtenerInteraccion(ID_USUARIO, PERIODO),
    ).resolves.toEqual({
      id_usuario: ID_USUARIO,
      total_notificaciones_enviadas: 120,
      total_notificaciones_entregadas: 114,
      total_notificaciones_abiertas: 70,
      total_notificaciones_descartadas: 44,
      total_sesiones_desde_notificacion: 31,
      tasa_apertura: 0.61,
      tasa_conversion: 0.27,
      tasa_descarte: 'NO_CALCULABLE',
    });
  });

  it('SIMULAR_M7_SIN_ENTREGAS: envíos sin entregas y tasas no calculables', async () => {
    process.env.SIMULAR_M7_SIN_ENTREGAS = 'true';
    await expect(
      adaptador.obtenerInteraccion(ID_USUARIO, PERIODO),
    ).resolves.toMatchObject({
      total_notificaciones_enviadas: 6,
      total_notificaciones_entregadas: 0,
      tasa_apertura: 'NO_CALCULABLE',
      tasa_conversion: 'NO_CALCULABLE',
      tasa_descarte: 'NO_CALCULABLE',
    });
  });

  it('SIMULAR_M7_CAIDO: falla como un módulo que no responde', async () => {
    process.env.SIMULAR_M7_CAIDO = 'true';
    await expect(
      adaptador.obtenerInteraccion(ID_USUARIO, PERIODO),
    ).rejects.toThrow('M07 no disponible');
  });

  it('SIMULAR_INCONSISTENCIA_M7: responde por otro usuario', async () => {
    process.env.SIMULAR_INCONSISTENCIA_M7 = 'true';
    await expect(
      adaptador.obtenerInteraccion(ID_USUARIO, PERIODO),
    ).resolves.toMatchObject({ id_usuario: ID_USUARIO_INCONSISTENTE_M07 });
  });

  it('SIMULAR_M7_SIN_DATOS: sin historial', async () => {
    process.env.SIMULAR_M7_SIN_DATOS = 'true';
    await expect(
      adaptador.obtenerInteraccion(ID_USUARIO, PERIODO),
    ).resolves.toBeNull();
  });
});
