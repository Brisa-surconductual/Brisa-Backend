import { HttpException } from '@nestjs/common';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import type { ParametrosNotificacionPort } from '../../ports/parametros-notificacion.port';
import { RechazoConfiguracionError } from '../../ports/rechazo-configuracion';
import type { UmbralesSeguimientoPort } from '../../ports/umbrales-seguimiento.port';
import type { AuditoriaService } from '../../services/auditoria.service';
import { ActualizarParametroNotificacionUseCase } from './actualizar-parametro-notificacion.use-case';
import { ActualizarUmbralUseCase } from './actualizar-umbral.use-case';
import { ConsultarParametrosNotificacionUseCase } from './consultar-parametros-notificacion.use-case';
import { ConsultarUmbralesUseCase } from './consultar-umbrales.use-case';

const ctx: ContextoAuditoria = {
  idUsuario: 'a0000000-0000-4000-8000-000000000002',
  idSesion: 's0000000-0000-4000-8000-000000000001',
  direccionIp: '127.0.0.1',
};

const errorDe = async (promesa: Promise<unknown>) => {
  const error = await promesa.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(HttpException);
  const http = error as HttpException;
  return { status: http.getStatus(), cuerpo: http.getResponse() };
};

const craving = {
  tipo_umbral: 'CRAVING_ELEVADO',
  valor: 3,
  unidad_medida: 'puntaje',
  fecha_actualizacion: '2026-11-01T12:00:00Z',
};

describe('Configuración de umbrales (RF-136)', () => {
  const listarUmbrales = jest.fn();
  const obtenerUmbral = jest.fn();
  const actualizarUmbral = jest.fn();
  const registrarDiferido = jest.fn();
  const puerto = {
    listarUmbrales,
    obtenerUmbral,
    actualizarUmbral,
  } as unknown as UmbralesSeguimientoPort;
  const auditoria = { registrarDiferido } as unknown as AuditoriaService;
  const actualizar = new ActualizarUmbralUseCase(puerto, auditoria);
  const consultar = new ConsultarUmbralesUseCase(puerto);

  beforeEach(() => {
    listarUmbrales.mockReset().mockResolvedValue([craving]);
    obtenerUmbral.mockReset().mockResolvedValue(craving);
    actualizarUmbral.mockReset().mockResolvedValue({
      valor_anterior: 3,
      valor_vigente: 4,
      fecha_actualizacion: '2026-11-25T15:00:00.000Z',
    });
    registrarDiferido.mockReset().mockResolvedValue('ENCOLADO');
  });

  afterEach(() => jest.useRealTimers());

  it('GET devuelve los umbrales vigentes de M05', async () => {
    await expect(consultar.execute()).resolves.toEqual({ items: [craving] });
  });

  it('GET 503 M05_NO_DISPONIBLE si M05 no responde', async () => {
    listarUmbrales.mockRejectedValue(new Error('caído'));
    await expect(errorDe(consultar.execute())).resolves.toMatchObject({
      status: 503,
      cuerpo: { codigo: 'M05_NO_DISPONIBLE' },
    });
  });

  it('aplica el cambio en M05 y lo audita en diferido con valor anterior y nuevo', async () => {
    await expect(
      actualizar.execute(ctx, 'CRAVING_ELEVADO', {
        valor_nuevo: 4,
        valor_anterior_esperado: 3,
        justificacion_cambio: 'Pocas alertas en la cohorte 2.',
      }),
    ).resolves.toEqual({
      tipo_umbral: 'CRAVING_ELEVADO',
      valor_anterior: 3,
      valor_vigente: 4,
      unidad_medida: 'puntaje',
      cambio_aplicado: true,
    });
    expect(actualizarUmbral).toHaveBeenCalledWith('CRAVING_ELEVADO', 4, 3, {
      id_usuario_administrativo: ctx.idUsuario,
    });
    expect(registrarDiferido).toHaveBeenCalledWith(ctx, {
      accion: 'CONFIGURACION_UMBRALES',
      recurso: 'UMBRAL_SEGUIMIENTO',
      severidad: 'ALTA',
      estado: 'EXITOSA',
      detalle: {
        tipo_umbral: 'CRAVING_ELEVADO',
        valor_anterior: 3,
        valor_nuevo: 4,
        unidad_medida: 'puntaje',
        justificacion_cambio: 'Pocas alertas en la cohorte 2.',
      },
    });
  });

  it('sin justificación la registra como null', async () => {
    await actualizar.execute(ctx, 'CRAVING_ELEVADO', {
      valor_nuevo: 4,
      valor_anterior_esperado: 3,
    });
    expect(registrarDiferido).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        detalle: expect.objectContaining({
          justificacion_cambio: null,
        }) as unknown,
      }),
    );
  });

  it('valor idéntico al vigente: 200 sin cambio, sin escribir ni auditar (aunque el esperado no coincida)', async () => {
    await expect(
      actualizar.execute(ctx, 'CRAVING_ELEVADO', {
        valor_nuevo: 3,
        valor_anterior_esperado: 2,
      }),
    ).resolves.toEqual({
      tipo_umbral: 'CRAVING_ELEVADO',
      valor_anterior: 3,
      valor_vigente: 3,
      unidad_medida: 'puntaje',
      cambio_aplicado: false,
    });
    expect(actualizarUmbral).not.toHaveBeenCalled();
    expect(registrarDiferido).not.toHaveBeenCalled();
  });

  it('409 CONFIGURACION_MODIFICADA si el esperado no es el vigente', async () => {
    await expect(
      errorDe(
        actualizar.execute(ctx, 'CRAVING_ELEVADO', {
          valor_nuevo: 4,
          valor_anterior_esperado: 2,
        }),
      ),
    ).resolves.toEqual({
      status: 409,
      cuerpo: {
        status: 409,
        codigo: 'CONFIGURACION_MODIFICADA',
        mensaje:
          'El valor cambió desde que lo consultó. Recargue y vuelva a intentarlo.',
      },
    });
    expect(actualizarUmbral).not.toHaveBeenCalled();
    expect(registrarDiferido).not.toHaveBeenCalled();
  });

  it('404 TIPO_UMBRAL_INEXISTENTE si M05 no define el tipo', async () => {
    obtenerUmbral.mockResolvedValue(null);
    await expect(
      errorDe(
        actualizar.execute(ctx, 'OTRO', {
          valor_nuevo: 1,
          valor_anterior_esperado: 0,
        }),
      ),
    ).resolves.toMatchObject({
      status: 404,
      cuerpo: { codigo: 'TIPO_UMBRAL_INEXISTENTE' },
    });
  });

  it.each([
    [400, 'VALOR_UMBRAL_INVALIDO', 'El valor ingresado no es válido...'],
    [409, 'CONFIGURACION_MODIFICADA', 'Cambió en M05.'],
    [404, 'TIPO_UMBRAL_INEXISTENTE', 'No existe en M05.'],
  ] as const)(
    'reenvía el rechazo %i %s de M05 tal cual, sin auditar',
    async (status, codigo, mensaje) => {
      actualizarUmbral.mockRejectedValue(
        new RechazoConfiguracionError(status, codigo, mensaje),
      );
      await expect(
        errorDe(
          actualizar.execute(ctx, 'CRAVING_ELEVADO', {
            valor_nuevo: 9,
            valor_anterior_esperado: 3,
          }),
        ),
      ).resolves.toEqual({ status, cuerpo: { status, codigo, mensaje } });
      expect(registrarDiferido).not.toHaveBeenCalled();
    },
  );

  it('500 con el mensaje de RF-136 si falla la persistencia, sin auditar', async () => {
    actualizarUmbral.mockRejectedValue(new Error('disco lleno'));
    await expect(
      errorDe(
        actualizar.execute(ctx, 'CRAVING_ELEVADO', {
          valor_nuevo: 4,
          valor_anterior_esperado: 3,
        }),
      ),
    ).resolves.toEqual({
      status: 500,
      cuerpo: {
        status: 500,
        codigo: 'ERROR_GUARDAR_UMBRAL',
        mensaje:
          'No fue posible guardar la configuración del umbral en este momento. Intente nuevamente más tarde.',
      },
    });
    expect(registrarDiferido).not.toHaveBeenCalled();
  });

  it('503 si M05 no responde al leer el valor vigente', async () => {
    jest.useFakeTimers();
    obtenerUmbral.mockReturnValue(new Promise(() => undefined));
    const resultado = errorDe(
      actualizar.execute(ctx, 'CRAVING_ELEVADO', {
        valor_nuevo: 4,
        valor_anterior_esperado: 3,
      }),
    );
    await jest.advanceTimersByTimeAsync(2_000);
    await expect(resultado).resolves.toMatchObject({
      status: 503,
      cuerpo: { codigo: 'M05_NO_DISPONIBLE' },
    });
  });

  it('si la auditoría queda pendiente, el cambio se conserva y responde 200', async () => {
    registrarDiferido.mockResolvedValue('PENDIENTE');
    await expect(
      actualizar.execute(ctx, 'CRAVING_ELEVADO', {
        valor_nuevo: 4,
        valor_anterior_esperado: 3,
      }),
    ).resolves.toMatchObject({ cambio_aplicado: true, valor_vigente: 4 });
  });
});

describe('Configuración de parámetros de notificación (RF-137)', () => {
  const vigentes = {
    LIMITE_DIARIO: { dias_habiles: 2, fines_semana: 3 },
    INTERVALO_MINIMO: { horas: 3 },
    FRANJAS_HORARIAS: [],
  };
  const obtenerParametros = jest.fn();
  const actualizarParametro = jest.fn();
  const registrarDiferido = jest.fn();
  const puerto = {
    obtenerParametros,
    actualizarParametro,
  } as unknown as ParametrosNotificacionPort;
  const actualizar = new ActualizarParametroNotificacionUseCase(puerto, {
    registrarDiferido,
  } as unknown as AuditoriaService);
  const consultar = new ConsultarParametrosNotificacionUseCase(puerto);

  beforeEach(() => {
    obtenerParametros.mockReset().mockResolvedValue(vigentes);
    actualizarParametro.mockReset().mockResolvedValue({
      valor_anterior: { dias_habiles: 2, fines_semana: 3 },
      valor_vigente: { dias_habiles: 1, fines_semana: 3 },
      fecha_actualizacion: '2026-11-25T15:00:00.000Z',
    });
    registrarDiferido.mockReset().mockResolvedValue('ENCOLADO');
  });

  it('GET devuelve los tres parámetros vigentes de M07', async () => {
    await expect(consultar.execute()).resolves.toEqual(vigentes);
  });

  it('GET 503 M07_NO_DISPONIBLE si M07 no responde', async () => {
    obtenerParametros.mockRejectedValue(new Error('caído'));
    await expect(errorDe(consultar.execute())).resolves.toMatchObject({
      status: 503,
      cuerpo: { codigo: 'M07_NO_DISPONIBLE' },
    });
  });

  it('aplica el cambio en M07 y lo audita como CONFIGURACION_NOTIFICACIONES', async () => {
    await expect(
      actualizar.execute(ctx, 'LIMITE_DIARIO', {
        valor_nuevo: { dias_habiles: 1, fines_semana: 3 },
        valor_anterior_esperado: { fines_semana: 3, dias_habiles: 2 },
        justificacion_cambio: 'Reducir carga.',
      }),
    ).resolves.toEqual({
      tipo_parametro: 'LIMITE_DIARIO',
      valor_anterior: { dias_habiles: 2, fines_semana: 3 },
      valor_vigente: { dias_habiles: 1, fines_semana: 3 },
      cambio_aplicado: true,
    });
    expect(registrarDiferido).toHaveBeenCalledWith(ctx, {
      accion: 'CONFIGURACION_NOTIFICACIONES',
      recurso: 'PARAMETRO_NOTIFICACION',
      severidad: 'ALTA',
      estado: 'EXITOSA',
      detalle: {
        tipo_parametro: 'LIMITE_DIARIO',
        valor_anterior: { dias_habiles: 2, fines_semana: 3 },
        valor_nuevo: { dias_habiles: 1, fines_semana: 3 },
        unidad_medida: 'notificaciones_por_dia',
        justificacion_cambio: 'Reducir carga.',
      },
    });
  });

  it('valor idéntico (aunque cambie el orden de las claves): sin cambio ni auditoría', async () => {
    await expect(
      actualizar.execute(ctx, 'INTERVALO_MINIMO', {
        valor_nuevo: { horas: 3 },
        valor_anterior_esperado: { horas: 3 },
      }),
    ).resolves.toMatchObject({ cambio_aplicado: false });
    expect(actualizarParametro).not.toHaveBeenCalled();
    expect(registrarDiferido).not.toHaveBeenCalled();
  });

  it('404 TIPO_PARAMETRO_INEXISTENTE para un parámetro fuera de RF-87/88/89, sin consultar M07', async () => {
    await expect(
      errorDe(
        actualizar.execute(ctx, 'CUPOS_PREVENCION', {
          valor_nuevo: 1,
          valor_anterior_esperado: 1,
        }),
      ),
    ).resolves.toMatchObject({
      status: 404,
      cuerpo: { codigo: 'TIPO_PARAMETRO_INEXISTENTE' },
    });
    expect(obtenerParametros).not.toHaveBeenCalled();
  });

  it('reenvía FRANJAS_SOLAPADAS (409) de M07 tal cual', async () => {
    actualizarParametro.mockRejectedValue(
      new RechazoConfiguracionError(
        409,
        'FRANJAS_SOLAPADAS',
        'Las franjas horarias no pueden solaparse.',
      ),
    );
    await expect(
      errorDe(
        actualizar.execute(ctx, 'FRANJAS_HORARIAS', {
          valor_nuevo: [{ segmento: 'MANANA' }],
          valor_anterior_esperado: [],
        }),
      ),
    ).resolves.toEqual({
      status: 409,
      cuerpo: {
        status: 409,
        codigo: 'FRANJAS_SOLAPADAS',
        mensaje: 'Las franjas horarias no pueden solaparse.',
      },
    });
    expect(registrarDiferido).not.toHaveBeenCalled();
  });

  it('500 con el mensaje de RF-137 si falla la persistencia', async () => {
    actualizarParametro.mockRejectedValue(new Error('disco lleno'));
    await expect(
      errorDe(
        actualizar.execute(ctx, 'INTERVALO_MINIMO', {
          valor_nuevo: { horas: 4 },
          valor_anterior_esperado: { horas: 3 },
        }),
      ),
    ).resolves.toEqual({
      status: 500,
      cuerpo: {
        status: 500,
        codigo: 'ERROR_GUARDAR_PARAMETRO',
        mensaje:
          'No fue posible guardar la configuración del parámetro en este momento. La configuración anterior se mantiene vigente. Intente nuevamente más tarde.',
      },
    });
  });
});
