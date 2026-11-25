import {
  type ExecutionContext,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { CsrfSessionGuard } from '../../../../usuarios/presentation/guards/csrf-session.guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionScopeGuard } from '../../../../usuarios/presentation/guards/session-scope.guard';
import {
  ConfiguracionException,
  MENSAJE_SOLO_GLOBAL_NOTIFICACIONES,
  MENSAJE_SOLO_GLOBAL_UMBRALES,
} from '../../../application/exceptions/configuracion.exception';
import { ActualizarParametroNotificacionUseCase } from '../../../application/use-cases/configuracion/actualizar-parametro-notificacion.use-case';
import { ActualizarUmbralUseCase } from '../../../application/use-cases/configuracion/actualizar-umbral.use-case';
import { ConsultarParametrosNotificacionUseCase } from '../../../application/use-cases/configuracion/consultar-parametros-notificacion.use-case';
import { ConsultarUmbralesUseCase } from '../../../application/use-cases/configuracion/consultar-umbrales.use-case';
import { ConfiguracionSoloGlobalInterceptor } from '../../interceptors/configuracion-solo-global.interceptor';
import { ConfiguracionNotificacionesController } from './configuracion-notificaciones.controller';
import { ConfiguracionUmbralesController } from './configuracion-umbrales.controller';

const ID_ADMIN = '00000000-0000-4000-8000-0000000000ad';

/** SessionAuthGuard simulado; el rol llega en la cabecera x-test-role. */
const autenticar = (c: ExecutionContext): boolean => {
  const req = c.switchToHttp().getRequest<{
    headers: Record<string, string>;
    autenticacion?: unknown;
  }>();
  req.autenticacion = {
    usuario: {
      id_usuario: ID_ADMIN,
      rol: req.headers['x-test-role'] ?? 'ADMINISTRATIVO',
    },
    sesion: {
      id_sesion: '00000000-0000-4000-8000-0000000a0701',
      alcance_sesion: 'COMPLETA',
    },
  };
  return true;
};

/** CsrfSessionGuard simulado: exige la cabecera X-CSRF-Token. */
const csrf = (c: ExecutionContext): boolean =>
  Boolean(
    c.switchToHttp().getRequest<{ headers: Record<string, string> }>().headers[
      'x-csrf-token'
    ],
  );

describe('Configuración global RF-136 / RF-137 (HTTP)', () => {
  let app: INestApplication<App>;
  const consultarUmbrales = jest.fn();
  const actualizarUmbral = jest.fn();
  const consultarParametros = jest.fn();
  const actualizarParametro = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [
        ConfiguracionUmbralesController,
        ConfiguracionNotificacionesController,
      ],
      providers: [
        RolesGuard,
        SessionScopeGuard,
        ConfiguracionSoloGlobalInterceptor,
        {
          provide: ConsultarUmbralesUseCase,
          useValue: { execute: consultarUmbrales },
        },
        {
          provide: ActualizarUmbralUseCase,
          useValue: { execute: actualizarUmbral },
        },
        {
          provide: ConsultarParametrosNotificacionUseCase,
          useValue: { execute: consultarParametros },
        },
        {
          provide: ActualizarParametroNotificacionUseCase,
          useValue: { execute: actualizarParametro },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .overrideGuard(CsrfSessionGuard)
      .useValue({ canActivate: csrf })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    consultarUmbrales.mockReset().mockResolvedValue({
      items: [
        {
          tipo_umbral: 'CRAVING_ELEVADO',
          valor: 3,
          unidad_medida: 'puntaje',
          fecha_actualizacion: '2026-11-01T12:00:00Z',
        },
      ],
    });
    actualizarUmbral.mockReset().mockResolvedValue({
      tipo_umbral: 'CRAVING_ELEVADO',
      valor_anterior: 3,
      valor_vigente: 4,
      unidad_medida: 'puntaje',
      cambio_aplicado: true,
    });
    consultarParametros.mockReset().mockResolvedValue({
      LIMITE_DIARIO: { dias_habiles: 2, fines_semana: 3 },
      INTERVALO_MINIMO: { horas: 3 },
      FRANJAS_HORARIAS: [],
    });
    actualizarParametro.mockReset().mockResolvedValue({
      tipo_parametro: 'LIMITE_DIARIO',
      valor_anterior: { dias_habiles: 2, fines_semana: 3 },
      valor_vigente: { dias_habiles: 1, fines_semana: 3 },
      cambio_aplicado: true,
    });
  });

  afterAll(() => app?.close());

  const servidor = () => app.getHttpServer();
  const putUmbral = (body: object, ruta = 'craving_elevado') =>
    request(servidor())
      .put(`/admin/configuracion/umbrales/${ruta}`)
      .set('X-CSRF-Token', 'token')
      .send(body);
  const putParametro = (body: object, ruta = 'LIMITE_DIARIO') =>
    request(servidor())
      .put(`/admin/configuracion/notificaciones/${ruta}`)
      .set('X-CSRF-Token', 'token')
      .send(body);

  describe('umbrales (RF-136)', () => {
    it('GET 200 con los umbrales vigentes, sin caché', async () => {
      const r = await request(servidor())
        .get('/admin/configuracion/umbrales')
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(r.body).toEqual(await consultarUmbrales.mock.results[0].value);
    });

    it('PUT 200 normalizando el tipo y pasando el cuerpo al caso de uso', async () => {
      const r = await putUmbral({
        valor_nuevo: 4,
        valor_anterior_esperado: 3,
        justificacion_cambio: '  Pocas alertas.  ',
      }).expect(200);
      expect(r.body).toMatchObject({ cambio_aplicado: true, valor_vigente: 4 });
      expect(actualizarUmbral).toHaveBeenCalledWith(
        expect.objectContaining({ idUsuario: ID_ADMIN }),
        'CRAVING_ELEVADO',
        {
          valor_nuevo: 4,
          valor_anterior_esperado: 3,
          justificacion_cambio: 'Pocas alertas.',
        },
      );
    });

    it('acepta valores compuestos (rangos de progreso) sin validarlos en M-8', async () => {
      const rangos = [{ nivel: 'INICIAL', min: 0, max: 25 }];
      await putUmbral(
        { valor_nuevo: rangos, valor_anterior_esperado: [] },
        'CLASIFICACION_PROGRESO',
      ).expect(200);
      expect(actualizarUmbral).toHaveBeenCalledWith(
        expect.anything(),
        'CLASIFICACION_PROGRESO',
        expect.objectContaining({ valor_nuevo: rangos }),
      );
    });

    it('400 CONFIGURACION_SOLO_GLOBAL con el mensaje de umbrales', async () => {
      const r = await putUmbral({
        valor_nuevo: 4,
        valor_anterior_esperado: 3,
        codigo_participante: 'P-7F3A91C2',
      }).expect(400);
      expect(r.body).toEqual({
        status: 400,
        codigo: 'CONFIGURACION_SOLO_GLOBAL',
        mensaje: MENSAJE_SOLO_GLOBAL_UMBRALES,
      });
      expect(actualizarUmbral).not.toHaveBeenCalled();
    });

    it.each([
      ['sin valor_anterior_esperado', { valor_nuevo: 4 }],
      ['sin valor_nuevo', { valor_anterior_esperado: 3 }],
      [
        'con valor_nuevo null',
        { valor_nuevo: null, valor_anterior_esperado: 3 },
      ],
      [
        'con un campo desconocido',
        { valor_nuevo: 4, valor_anterior_esperado: 3, unidad: 'x' },
      ],
      [
        'con justificación demasiado larga',
        {
          valor_nuevo: 4,
          valor_anterior_esperado: 3,
          justificacion_cambio: 'a'.repeat(501),
        },
      ],
    ])('400 %s, sin llamar al caso de uso', async (_caso, body) => {
      await putUmbral(body).expect(400);
      expect(actualizarUmbral).not.toHaveBeenCalled();
    });

    it('reenvía el rechazo de M05 con su código y mensaje', async () => {
      actualizarUmbral.mockRejectedValue(
        new ConfiguracionException(
          'VALOR_UMBRAL_INVALIDO',
          400,
          'El valor ingresado no es válido para este umbral. Verifique el rango permitido.',
        ),
      );
      const r = await putUmbral({
        valor_nuevo: 9,
        valor_anterior_esperado: 3,
      }).expect(400);
      expect(r.body).toEqual({
        status: 400,
        codigo: 'VALOR_UMBRAL_INVALIDO',
        mensaje:
          'El valor ingresado no es válido para este umbral. Verifique el rango permitido.',
      });
    });

    it.each([
      ['CONFIGURACION_MODIFICADA' as const, 409],
      ['TIPO_UMBRAL_INEXISTENTE' as const, 404],
      ['ERROR_GUARDAR_UMBRAL' as const, 500],
      ['M05_NO_DISPONIBLE' as const, 503],
    ])('%s responde %i', async (codigo, status) => {
      actualizarUmbral.mockRejectedValue(ConfiguracionException.de(codigo));
      const r = await putUmbral({
        valor_nuevo: 4,
        valor_anterior_esperado: 3,
      }).expect(status);
      expect(r.body).toMatchObject({ status, codigo });
    });
  });

  describe('parámetros de notificación (RF-137)', () => {
    it('GET 200 con los tres parámetros en una sola vista', async () => {
      const r = await request(servidor())
        .get('/admin/configuracion/notificaciones')
        .expect(200)
        .expect('Cache-Control', 'no-store');
      expect(Object.keys(r.body as object)).toEqual([
        'LIMITE_DIARIO',
        'INTERVALO_MINIMO',
        'FRANJAS_HORARIAS',
      ]);
    });

    it('PUT 200 con el contrato', async () => {
      const r = await putParametro({
        valor_nuevo: { dias_habiles: 1, fines_semana: 3 },
        valor_anterior_esperado: { dias_habiles: 2, fines_semana: 3 },
        justificacion_cambio: 'Reducir carga.',
      }).expect(200);
      expect(r.body).toEqual({
        tipo_parametro: 'LIMITE_DIARIO',
        valor_anterior: { dias_habiles: 2, fines_semana: 3 },
        valor_vigente: { dias_habiles: 1, fines_semana: 3 },
        cambio_aplicado: true,
      });
    });

    it.each([
      [
        'id_usuario en la raíz',
        {
          valor_nuevo: { dias_habiles: 1, fines_semana: 3 },
          valor_anterior_esperado: { dias_habiles: 2, fines_semana: 3 },
          id_usuario: 'e0000000-0000-4000-8000-000000000003',
        },
      ],
      [
        'un usuario dentro de valor_nuevo',
        {
          valor_nuevo: {
            dias_habiles: 1,
            fines_semana: 3,
            id_participante: 'x',
          },
          valor_anterior_esperado: { dias_habiles: 2, fines_semana: 3 },
        },
      ],
      [
        'usuarios dentro de una franja',
        {
          valor_nuevo: [{ segmento: 'MANANA', usuarios: ['a'] }],
          valor_anterior_esperado: [],
        },
      ],
    ])(
      '400 CONFIGURACION_SOLO_GLOBAL con %s, con el mensaje de RF-137',
      async (_caso, body) => {
        const r = await putParametro(body).expect(400);
        expect(r.body).toEqual({
          status: 400,
          codigo: 'CONFIGURACION_SOLO_GLOBAL',
          mensaje: MENSAJE_SOLO_GLOBAL_NOTIFICACIONES,
        });
        expect(actualizarParametro).not.toHaveBeenCalled();
      },
    );

    it('400 CONFIGURACION_SOLO_GLOBAL si el usuario llega en la query', async () => {
      const r = await request(servidor())
        .put(
          '/admin/configuracion/notificaciones/INTERVALO_MINIMO?id_usuario=e0000000-0000-4000-8000-000000000003',
        )
        .set('X-CSRF-Token', 'token')
        .send({
          valor_nuevo: { horas: 4 },
          valor_anterior_esperado: { horas: 3 },
        })
        .expect(400);
      expect(r.body).toMatchObject({ codigo: 'CONFIGURACION_SOLO_GLOBAL' });
    });

    it('reenvía FRANJAS_SOLAPADAS (409) de M07', async () => {
      actualizarParametro.mockRejectedValue(
        new ConfiguracionException(
          'FRANJAS_SOLAPADAS',
          409,
          'Las franjas horarias no pueden solaparse.',
        ),
      );
      const r = await putParametro(
        { valor_nuevo: [], valor_anterior_esperado: [] },
        'FRANJAS_HORARIAS',
      ).expect(409);
      expect(r.body).toEqual({
        status: 409,
        codigo: 'FRANJAS_SOLAPADAS',
        mensaje: 'Las franjas horarias no pueden solaparse.',
      });
    });

    it('404 TIPO_PARAMETRO_INEXISTENTE', async () => {
      actualizarParametro.mockRejectedValue(
        ConfiguracionException.de('TIPO_PARAMETRO_INEXISTENTE'),
      );
      await putParametro(
        { valor_nuevo: 1, valor_anterior_esperado: 1 },
        'OTRO',
      ).expect(404);
    });
  });

  describe('acceso', () => {
    it('403 sin token CSRF, sin llamar al caso de uso', async () => {
      await request(servidor())
        .put('/admin/configuracion/umbrales/CRAVING_ELEVADO')
        .send({ valor_nuevo: 4, valor_anterior_esperado: 3 })
        .expect(403);
      expect(actualizarUmbral).not.toHaveBeenCalled();
    });

    it('COORDINADOR_PSI también puede configurar', async () => {
      await putParametro({
        valor_nuevo: { dias_habiles: 1, fines_semana: 3 },
        valor_anterior_esperado: { dias_habiles: 2, fines_semana: 3 },
      })
        .set('x-test-role', 'COORDINADOR_PSI')
        .expect(200);
    });

    it.each([
      ['GET', '/admin/configuracion/umbrales'],
      ['PUT', '/admin/configuracion/notificaciones/LIMITE_DIARIO'],
    ])('403 para un estudiante en %s %s', async (metodo, ruta) => {
      const r =
        metodo === 'GET'
          ? request(servidor()).get(ruta)
          : request(servidor())
              .put(ruta)
              .set('X-CSRF-Token', 'token')
              .send({ valor_nuevo: 1, valor_anterior_esperado: 1 });
      await r.set('x-test-role', 'ESTUDIANTE').expect(403);
      expect(actualizarParametro).not.toHaveBeenCalled();
    });
  });
});
