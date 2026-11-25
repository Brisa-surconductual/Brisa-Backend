import { isUUID } from 'class-validator';
import {
  CODIGO_INCONSISTENTE_M05,
  idAlertaMuestra,
  MockSeguimientoIndividualAdapter,
  muestraParticipante,
} from './mock-seguimiento-individual.adapter';

/** Códigos de muestra suficientes para cubrir varios niveles y escenarios. */
const CODIGOS = Array.from(
  { length: 40 },
  (_, i) => `P-${String(i).padStart(8, '0')}`,
);

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

  describe('muestraParticipante', () => {
    it('es determinista: el mismo código da siempre los mismos datos', () => {
      expect(muestraParticipante('P-7F3A91C2')).toEqual(
        muestraParticipante('P-7F3A91C2'),
      );
    });

    it('varía entre participantes (nivel, adherencia y escenario de alertas)', () => {
      const muestras = CODIGOS.map(muestraParticipante);
      expect(new Set(muestras.map((m) => m.nivel_progreso)).size).toBe(4);
      expect(
        new Set(muestras.map((m) => m.tasa_adherencia)).size,
      ).toBeGreaterThan(10);
      const activas = muestras.map(
        (m) => m.alertas.filter((a) => a.estado_resolucion === 'ACTIVA').length,
      );
      expect(new Set(activas)).toEqual(new Set([0, 1, 2]));
    });

    it('produce valores válidos para los contratos', () => {
      for (const m of CODIGOS.map(muestraParticipante)) {
        expect(m.tasa_adherencia).toBeGreaterThanOrEqual(0);
        expect(m.tasa_adherencia).toBeLessThanOrEqual(1);
        expect(['REDUCCION', 'ESTABLE', 'INCREMENTO']).toContain(
          m.tendencia_consumo,
        );
        expect(m.alertas.map((a) => a.fuente_alerta)).toEqual([
          'RF-68',
          'RF-63',
        ]);
      }
    });
  });

  it('el perfil (RF-128) se construye desde la muestra del participante', async () => {
    const m = muestraParticipante('P-7F3A91C2');
    await expect(
      adaptador.obtenerPerfilSeguimiento('P-7F3A91C2'),
    ).resolves.toEqual({
      codigo_participante: 'P-7F3A91C2',
      indicadores_adherencia: {
        tasa_adherencia: m.tasa_adherencia,
        dias_con_registro: m.dias_con_registro,
      },
      indicadores_progreso: {
        nivel_progreso: m.nivel_progreso,
        unidades_completadas: m.unidades_completadas,
      },
      tendencia_consumo: m.tendencia_consumo,
      alertas_activas: m.alertas
        .filter((a) => a.estado_resolucion === 'ACTIVA')
        .map((a) => ({
          id_alerta: a.id_alerta,
          tipo_alerta: a.tipo_alerta,
          fecha_generacion: a.fecha_generacion,
          estado_resolucion: 'ACTIVA',
        })),
      fecha_actualizacion: '2026-11-22T05:00:00Z',
    });
  });

  it('el historial (RF-129) devuelve las alertas de la muestra y respeta offset/limit', async () => {
    const m = muestraParticipante('P-1');
    const todas = await adaptador.obtenerAlertasParticipante('P-1', 0, 20);
    expect(todas).toEqual({
      codigo_participante: 'P-1',
      items: m.alertas,
      total: 2,
    });

    const segunda = await adaptador.obtenerAlertasParticipante('P-1', 1, 1);
    expect(segunda?.items.map((a) => a.tipo_alerta)).toEqual([
      'CRAVING_ELEVADO',
    ]);
    expect(segunda?.total).toBe(2);
  });

  it('el lote (RF-142) coincide con el perfil de cada participante, en una sola llamada', async () => {
    const codigos = CODIGOS.slice(0, 5);
    const lote = await adaptador.obtenerIndicadoresLote(codigos);
    expect(lote.map((f) => f.codigo_participante)).toEqual(codigos);
    for (const fila of lote) {
      const perfil = await adaptador.obtenerPerfilSeguimiento(
        fila.codigo_participante,
      );
      expect(fila.nivel_progreso).toBe(
        perfil?.indicadores_progreso.nivel_progreso,
      );
      expect(fila.tasa_adherencia).toBe(
        perfil?.indicadores_adherencia.tasa_adherencia,
      );
      expect(fila.alertas_activas.map((a) => a.id_alerta)).toEqual(
        perfil?.alertas_activas.map((a) => a.id_alerta),
      );
    }
  });

  it('el lote solo expone indicadores, nunca texto ni correo', async () => {
    const [fila] = await adaptador.obtenerIndicadoresLote(['P-1']);
    expect(Object.keys(fila).sort()).toEqual([
      'alertas_activas',
      'codigo_participante',
      'nivel_progreso',
      'tasa_adherencia',
    ]);
  });

  it('SIMULAR_M5_CAIDO: rechaza la llamada', async () => {
    process.env.SIMULAR_M5_CAIDO = 'true';
    await expect(adaptador.obtenerPerfilSeguimiento('P-1')).rejects.toThrow();
    await expect(
      adaptador.obtenerAlertasParticipante('P-1', 0, 20),
    ).rejects.toThrow();
    await expect(adaptador.obtenerIndicadoresLote(['P-1'])).rejects.toThrow();
  });

  it('SIMULAR_INCONSISTENCIA_M5: responde con otro participante', async () => {
    process.env.SIMULAR_INCONSISTENCIA_M5 = 'true';
    const perfil = await adaptador.obtenerPerfilSeguimiento('P-1');
    const alertas = await adaptador.obtenerAlertasParticipante('P-1', 0, 20);
    const lote = await adaptador.obtenerIndicadoresLote(['P-1', 'P-2']);
    expect(perfil?.codigo_participante).toBe(CODIGO_INCONSISTENTE_M05);
    expect(alertas?.codigo_participante).toBe(CODIGO_INCONSISTENTE_M05);
    expect(lote.map((f) => f.codigo_participante)).toEqual([
      CODIGO_INCONSISTENTE_M05,
      CODIGO_INCONSISTENTE_M05,
    ]);
  });

  it('SIMULAR_M5_SIN_DATOS: no tiene datos del participante', async () => {
    process.env.SIMULAR_M5_SIN_DATOS = 'true';
    await expect(adaptador.obtenerPerfilSeguimiento('P-1')).resolves.toBeNull();
    await expect(
      adaptador.obtenerAlertasParticipante('P-1', 0, 20),
    ).resolves.toBeNull();
    await expect(adaptador.obtenerIndicadoresLote(['P-1'])).resolves.toEqual(
      [],
    );
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

  it('obtenerAlerta (RF-147) devuelve la alerta de la muestra, sin distinguir mayúsculas en el id', async () => {
    const [inactividad] = muestraParticipante('P-1').alertas;
    await expect(
      adaptador.obtenerAlerta('P-1', inactividad.id_alerta.toUpperCase()),
    ).resolves.toEqual({ codigo_participante: 'P-1', alerta: inactividad });
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
