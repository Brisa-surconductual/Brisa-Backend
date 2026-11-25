import { RechazoConfiguracionError } from '../../application/ports/rechazo-configuracion';
import type { UmbralesSeguimientoPort } from '../../application/ports/umbrales-seguimiento.port';
import { MockUmbralesSeguimientoAdapter } from './mock-umbrales-seguimiento.adapter';

const ACTOR = {
  id_usuario_administrativo: 'a0000000-0000-4000-8000-0000000000ad',
};

const RANGOS_POR_DEFECTO = [
  { nivel: 'INICIAL', min: 0, max: 25 },
  { nivel: 'EN_AVANCE', min: 25, max: 50 },
  { nivel: 'AVANZADO', min: 50, max: 75 },
  { nivel: 'COMPLETADO', min: 75, max: 100 },
];

describe('MockUmbralesSeguimientoAdapter (M05, RF-79)', () => {
  const variables = [
    'SIMULAR_M5_CAIDO',
    'SIMULAR_FALLO_GUARDADO_M5',
    'MOCK_M5_DELAY_MS',
  ] as const;
  const anteriores = Object.fromEntries(
    variables.map((v) => [v, process.env[v]]),
  );
  let adaptador: UmbralesSeguimientoPort;

  beforeEach(() => {
    for (const v of variables) delete process.env[v];
    process.env.MOCK_M5_DELAY_MS = '0';
    adaptador = new MockUmbralesSeguimientoAdapter();
  });

  afterAll(() => {
    for (const v of variables) {
      if (anteriores[v] === undefined) delete process.env[v];
      else process.env[v] = anteriores[v];
    }
  });

  const rechazoDe = async (promesa: Promise<unknown>) => {
    const error = await promesa.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RechazoConfiguracionError);
    const { status, codigo } = error as RechazoConfiguracionError;
    return { status, codigo };
  };

  it('arranca con los valores por defecto de RF-63, RF-68 y RF-70', async () => {
    await expect(adaptador.listarUmbrales()).resolves.toEqual([
      expect.objectContaining({
        tipo_umbral: 'CRAVING_ELEVADO',
        valor: 3,
        unidad_medida: 'puntaje',
      }),
      expect.objectContaining({
        tipo_umbral: 'INACTIVIDAD',
        valor: 7,
        unidad_medida: 'dias',
      }),
      expect.objectContaining({
        tipo_umbral: 'CLASIFICACION_PROGRESO',
        valor: RANGOS_POR_DEFECTO,
        unidad_medida: 'porcentaje',
      }),
    ]);
  });

  it('devuelve null para un tipo que RF-79 no define', async () => {
    await expect(adaptador.obtenerUmbral('OTRO')).resolves.toBeNull();
  });

  it('persiste el cambio y devuelve el valor anterior y el vigente', async () => {
    await expect(
      adaptador.actualizarUmbral('INACTIVIDAD', 5, 7, ACTOR),
    ).resolves.toMatchObject({ valor_anterior: 7, valor_vigente: 5 });
    await expect(adaptador.obtenerUmbral('INACTIVIDAD')).resolves.toMatchObject(
      { valor: 5 },
    );
  });

  it.each([
    ['CRAVING_ELEVADO', 0],
    ['CRAVING_ELEVADO', 6],
    ['CRAVING_ELEVADO', 2.5],
    ['CRAVING_ELEVADO', '4'],
    ['INACTIVIDAD', 0],
    ['INACTIVIDAD', -3],
    ['INACTIVIDAD', 1.5],
  ])('400 VALOR_UMBRAL_INVALIDO para %s = %j', async (tipo, valor) => {
    const vigente = (await adaptador.obtenerUmbral(tipo))?.valor;
    await expect(
      rechazoDe(adaptador.actualizarUmbral(tipo, valor, vigente, ACTOR)),
    ).resolves.toEqual({ status: 400, codigo: 'VALOR_UMBRAL_INVALIDO' });
  });

  it.each([
    ['incompletos (3 niveles)', RANGOS_POR_DEFECTO.slice(0, 3)],
    [
      'con hueco',
      [
        { nivel: 'INICIAL', min: 0, max: 20 },
        { nivel: 'EN_AVANCE', min: 25, max: 50 },
        { nivel: 'AVANZADO', min: 50, max: 75 },
        { nivel: 'COMPLETADO', min: 75, max: 100 },
      ],
    ],
    [
      'que no llegan a 100',
      [
        { nivel: 'INICIAL', min: 0, max: 25 },
        { nivel: 'EN_AVANCE', min: 25, max: 50 },
        { nivel: 'AVANZADO', min: 50, max: 75 },
        { nivel: 'COMPLETADO', min: 75, max: 1 },
      ],
    ],
    ['en otro orden', [...RANGOS_POR_DEFECTO].reverse()],
    ['que no son una lista', { INICIAL: 25 }],
  ])('400 para rangos de progreso %s', async (_caso, valor) => {
    await expect(
      rechazoDe(
        adaptador.actualizarUmbral(
          'CLASIFICACION_PROGRESO',
          valor,
          RANGOS_POR_DEFECTO,
          ACTOR,
        ),
      ),
    ).resolves.toEqual({ status: 400, codigo: 'VALOR_UMBRAL_INVALIDO' });
  });

  it('acepta rangos de progreso contiguos que cubren 0–100', async () => {
    const nuevos = [
      { nivel: 'INICIAL', min: 0, max: 20 },
      { nivel: 'EN_AVANCE', min: 20, max: 60 },
      { nivel: 'AVANZADO', min: 60, max: 90 },
      { nivel: 'COMPLETADO', min: 90, max: 100 },
    ];
    await expect(
      adaptador.actualizarUmbral(
        'CLASIFICACION_PROGRESO',
        nuevos,
        RANGOS_POR_DEFECTO,
        ACTOR,
      ),
    ).resolves.toMatchObject({ valor_vigente: nuevos });
  });

  it('409 CONFIGURACION_MODIFICADA si el esperado ya no es el vigente (compare-and-set)', async () => {
    await expect(
      rechazoDe(adaptador.actualizarUmbral('CRAVING_ELEVADO', 4, 2, ACTOR)),
    ).resolves.toEqual({ status: 409, codigo: 'CONFIGURACION_MODIFICADA' });
  });

  it('404 al intentar guardar un tipo inexistente', async () => {
    await expect(
      rechazoDe(adaptador.actualizarUmbral('OTRO', 1, null, ACTOR)),
    ).resolves.toEqual({ status: 404, codigo: 'TIPO_UMBRAL_INEXISTENTE' });
  });

  it('SIMULAR_FALLO_GUARDADO_M5: falla con un error que no es un rechazo y no cambia nada', async () => {
    process.env.SIMULAR_FALLO_GUARDADO_M5 = 'true';
    const error = await adaptador
      .actualizarUmbral('CRAVING_ELEVADO', 4, 3, ACTOR)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(RechazoConfiguracionError);
    await expect(
      adaptador.obtenerUmbral('CRAVING_ELEVADO'),
    ).resolves.toMatchObject({ valor: 3 });
  });

  it('SIMULAR_M5_CAIDO: M05 no responde', async () => {
    process.env.SIMULAR_M5_CAIDO = 'true';
    await expect(adaptador.listarUmbrales()).rejects.toThrow(
      'M05 no disponible',
    );
  });

  it('no expone su estado interno (las lecturas son copias)', async () => {
    const [, , progreso] = await adaptador.listarUmbrales();
    (progreso.valor as { max: number }[])[0].max = 99;
    await expect(
      adaptador.obtenerUmbral('CLASIFICACION_PROGRESO'),
    ).resolves.toMatchObject({ valor: RANGOS_POR_DEFECTO });
  });
});
