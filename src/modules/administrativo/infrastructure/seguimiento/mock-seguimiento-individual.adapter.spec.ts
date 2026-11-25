import { isUUID } from 'class-validator';
import {
  CODIGO_INCONSISTENTE_M05,
  idAlertaMuestra,
  MockSeguimientoIndividualAdapter,
} from './mock-seguimiento-individual.adapter';

describe('MockSeguimientoIndividualAdapter', () => {
  const adaptador = new MockSeguimientoIndividualAdapter();
  const variables = [
    'SIMULAR_M5_CAIDO',
    'SIMULAR_INCONSISTENCIA_M5',
    'SIMULAR_M5_SIN_DATOS',
    'MOCK_M5_DELAY_MS',
  ] as const;
  const anteriores = Object.fromEntries(
    variables.map((v) => [v, process.env[v]]),
  );

  beforeEach(() => {
    for (const v of variables) delete process.env[v];
    process.env.MOCK_M5_DELAY_MS = '0';
  });

  afterAll(() => {
    for (const v of variables) {
      if (anteriores[v] === undefined) delete process.env[v];
      else process.env[v] = anteriores[v];
    }
  });

  it('devuelve el perfil del contrato 200 para el participante solicitado', async () => {
    await expect(
      adaptador.obtenerPerfilSeguimiento('P-7F3A91C2'),
    ).resolves.toEqual({
      codigo_participante: 'P-7F3A91C2',
      indicadores_adherencia: { tasa_adherencia: 0.68, dias_con_registro: 17 },
      indicadores_progreso: {
        nivel_progreso: 'EN_AVANCE',
        unidades_completadas: 4,
      },
      tendencia_consumo: 'REDUCCION',
      alertas_activas: [
        {
          id_alerta: idAlertaMuestra('P-7F3A91C2', 'inactividad'),
          tipo_alerta: 'INACTIVIDAD',
          fecha_generacion: '2026-11-20T14:00:00Z',
          estado_resolucion: 'ACTIVA',
        },
      ],
      fecha_actualizacion: '2026-11-22T05:00:00Z',
    });
  });

  it('devuelve las alertas del contrato 200 y respeta offset/limit', async () => {
    const todas = await adaptador.obtenerAlertasParticipante('P-1', 0, 20);
    expect(todas?.total).toBe(2);
    expect(
      todas?.items.map((a) => [a.fuente_alerta, a.estado_resolucion]),
    ).toEqual([
      ['RF-68', 'ACTIVA'],
      ['RF-63', 'ATENDIDA'],
    ]);

    const segunda = await adaptador.obtenerAlertasParticipante('P-1', 1, 1);
    expect(segunda?.items.map((a) => a.tipo_alerta)).toEqual([
      'CRAVING_ELEVADO',
    ]);
    expect(segunda?.total).toBe(2);
  });

  it('SIMULAR_M5_CAIDO: rechaza la llamada', async () => {
    process.env.SIMULAR_M5_CAIDO = 'true';
    await expect(adaptador.obtenerPerfilSeguimiento('P-1')).rejects.toThrow();
    await expect(
      adaptador.obtenerAlertasParticipante('P-1', 0, 20),
    ).rejects.toThrow();
  });

  it('SIMULAR_INCONSISTENCIA_M5: responde con otro participante', async () => {
    process.env.SIMULAR_INCONSISTENCIA_M5 = 'true';
    const perfil = await adaptador.obtenerPerfilSeguimiento('P-1');
    const alertas = await adaptador.obtenerAlertasParticipante('P-1', 0, 20);
    expect(perfil?.codigo_participante).toBe(CODIGO_INCONSISTENTE_M05);
    expect(alertas?.codigo_participante).toBe(CODIGO_INCONSISTENTE_M05);
  });

  it('SIMULAR_M5_SIN_DATOS: no tiene datos del participante', async () => {
    process.env.SIMULAR_M5_SIN_DATOS = 'true';
    await expect(adaptador.obtenerPerfilSeguimiento('P-1')).resolves.toBeNull();
    await expect(
      adaptador.obtenerAlertasParticipante('P-1', 0, 20),
    ).resolves.toBeNull();
  });

  it('simula el retardo de red configurado', async () => {
    process.env.MOCK_M5_DELAY_MS = '30';
    const inicio = Date.now();
    await adaptador.obtenerPerfilSeguimiento('P-1');
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(25);
  });

  it('genera ids de alerta UUID, estables y distintos por participante', () => {
    const a = idAlertaMuestra('P-AAAAAAAA', 'inactividad');
    expect(isUUID(a)).toBe(true);
    expect(idAlertaMuestra('P-AAAAAAAA', 'inactividad')).toBe(a);
    expect(idAlertaMuestra('P-BBBBBBBB', 'inactividad')).not.toBe(a);
    expect(idAlertaMuestra('P-AAAAAAAA', 'craving')).not.toBe(a);
  });

  it('obtenerAlerta devuelve una alerta del participante, sin distinguir mayúsculas en el id', async () => {
    const id = idAlertaMuestra('P-1', 'inactividad');
    await expect(
      adaptador.obtenerAlerta('P-1', id.toUpperCase()),
    ).resolves.toEqual({
      codigo_participante: 'P-1',
      alerta: expect.objectContaining({
        id_alerta: id,
        tipo_alerta: 'INACTIVIDAD',
        estado_resolucion: 'ACTIVA',
      }) as unknown,
    });
  });

  it('obtenerAlerta devuelve null para una alerta de otro participante o inexistente', async () => {
    await expect(
      adaptador.obtenerAlerta('P-1', idAlertaMuestra('P-2', 'inactividad')),
    ).resolves.toBeNull();
    await expect(
      adaptador.obtenerAlerta('P-1', '00000000-0000-4000-8000-000000000000'),
    ).resolves.toBeNull();
  });

  it('obtenerAlerta respeta los flags de simulación', async () => {
    const id = idAlertaMuestra('P-1', 'craving');
    process.env.SIMULAR_INCONSISTENCIA_M5 = 'true';
    await expect(adaptador.obtenerAlerta('P-1', id)).resolves.toMatchObject({
      codigo_participante: CODIGO_INCONSISTENTE_M05,
    });
    process.env.SIMULAR_M5_CAIDO = 'true';
    await expect(adaptador.obtenerAlerta('P-1', id)).rejects.toThrow();
  });
});
