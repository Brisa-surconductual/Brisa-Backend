import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RolesGuard } from '../../../../../shared/presentation/guards/role-guard';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { SessionTokenHasher } from '../../../../usuarios/application/ports/session-token-hasher';
import {
  ProcesarRespuestaPort,
  ComprobarFormatoRespuestaPort,
  TransaccionRespuesta,
} from '../../../application/ports/procesar-respuesta.port';
import { ProcesarRespuestaUseCase } from '../../../application/use-cases/sesion/procesar-respuesta.use-case';
import {
  idsRespuesta as ids,
  nodoRespuesta,
  reglaRespuesta,
  transicionRespuesta,
} from '../../../application/support/testing/respuesta-fixtures';
import { transaccionRespuestaPrueba } from '../../../application/support/testing/transaccion-respuesta.fixture';
import {
  ConflictoRespuestaConversacionalException,
  RespuestaConversacionalNoEncontradaException,
} from '../../../domain/exceptions/respuesta.exceptions';
import { OperadorCondicion as Op } from '../../../domain/enums/operador-condicional.enum';
import { TipoDatoValidacion as Dato } from '../../../domain/enums/tipo-dato-validacion-enum';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { FormatoRespuestaAdapter } from '../../../infrastructure/validation/formato-respuesta.adapter';
import { DomainExceptionFilter } from '../../filters/domain-exception.filter';
import { RespuestasConversacionalesController } from './respuestas-conversacionales.controller';

describe('RF-27/28/29 POST respuestas (HTTP)', () => {
  let app: INestApplication<App>;
  let tx: ReturnType<typeof transaccionRespuestaPrueba>;
  let ejecutar: jest.SpyInstance;
  const persistencia: ProcesarRespuestaPort = {
    ejecutar: <T>(operacion: (t: TransaccionRespuesta) => Promise<T>) =>
      operacion(tx),
  };
  const autenticar = (c: ExecutionContext) => {
    const req = c.switchToHttp().getRequest<{
      headers: Record<string, string>;
      autenticacion?: unknown;
    }>();
    if (req.headers['x-test-auth'] === 'ausente')
      throw new UnauthorizedException();
    req.autenticacion = {
      usuario: {
        id_usuario: ids.usuario,
        rol: req.headers['x-test-role'] ?? 'ESTUDIANTE',
      },
      sesion: {
        alcance_sesion: req.headers['x-test-scope'] ?? 'COMPLETA',
        csrf_token_hash: 'hash-local',
      },
    };
    return true;
  };
  const ruta = '/api/chat/sesiones/' + ids.sesion + '/respuestas';
  const body = () => ({
    idRespuesta: ids.interaccion,
    idNodo: ids.nodo,
    tipoEntrada: 'NUMERICO',
    valor: 5,
    capturadaEn: '2026-11-06T11:49:00-05:00',
    conectividad: 'EN_LINEA',
  });
  const post = (datos: unknown) =>
    request(app.getHttpServer())
      .post(ruta)
      .set('X-CSRF-Token', 'csrf-local')
      .send(datos as object);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [RespuestasConversacionalesController],
      providers: [
        ProcesarRespuestaUseCase,
        RolesGuard,
        { provide: ProcesarRespuestaPort, useValue: persistencia },
        {
          provide: ComprobarFormatoRespuestaPort,
          useClass: FormatoRespuestaAdapter,
        },
        {
          provide: SessionTokenHasher,
          useValue: {
            compare: (t: string, h: string) =>
              t === 'csrf-local' && h === 'hash-local',
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: autenticar })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });
  beforeEach(() => {
    tx = transaccionRespuestaPrueba();
    ejecutar = jest.spyOn(persistencia, 'ejecutar');
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(() => app?.close());

  it('procesa con actor autenticado y CSRF real, sin envoltura data', async () => {
    const r = await post(body())
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(r.body).toEqual({
      idRespuesta: ids.interaccion,
      resultado: 'VALIDA',
      transicion: {
        idNodoOrigen: ids.nodo,
        idNodoDestino: ids.destino,
        esTerminal: false,
      },
      estadoSesion: 'ACTIVA',
    });
    expect(tx.contexto.bloquearSesion).toHaveBeenCalledWith(
      ids.sesion,
      ids.usuario,
    );
    expect(tx.registro.guardar).toHaveBeenCalledTimes(1);
  });
  it('acepta exactamente el ejemplo de ESCALA del contrato', async () => {
    tx.contexto.buscarNodo.mockResolvedValueOnce(
      nodoRespuesta({ tipo: 'ESCALA', min: 1, max: 10, paso: 1 }),
    );
    await post({ ...body(), tipoEntrada: 'ESCALA', valor: 7 }).expect(200);
    const guardado: unknown = tx.registro.guardar.mock.calls[0][0];
    expect(guardado).toMatchObject({
      solicitud: {
        idRespuesta: ids.interaccion,
        fechaCaptura: new Date('2026-11-06T16:49:00Z'),
      },
    });
  });
  it('conserva el alias sin /api utilizado por el proxy', async () => {
    await request(app.getHttpServer())
      .post('/chat/sesiones/' + ids.sesion + '/respuestas')
      .set('X-CSRF-Token', 'csrf-local')
      .send(body())
      .expect(200);
  });
  it.each([undefined, 'incorrecto'])(
    'rechaza CSRF %s antes de procesar',
    async (csrf) => {
      const req = request(app.getHttpServer()).post(ruta);
      if (csrf) req.set('X-CSRF-Token', csrf);
      const r = await req.send(body()).expect(403);
      expect(r.body as unknown).toHaveProperty('mensaje');
      expect(ejecutar).not.toHaveBeenCalled();
    },
  );
  it('rechaza usuario no autenticado', async () => {
    const r = await request(app.getHttpServer())
      .post(ruta)
      .set('x-test-auth', 'ausente')
      .send(body())
      .expect(401);
    expect(r.body as unknown).toMatchObject({ statusCode: 401, codigo: null });
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([
    ['x-test-role', 'ADMINISTRATIVO'],
    ['x-test-scope', 'LIMITADA'],
  ])('rechaza %s=%s con guards reales', async (header, valor) => {
    await request(app.getHttpServer())
      .post(ruta)
      .set(header, valor)
      .set('X-CSRF-Token', 'csrf-local')
      .send(body())
      .expect(403);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([
    ['idNodo', 'no-uuid'],
    ['idRespuesta', 'no-uuid'],
    ['conectividad', 'OFFLINE'],
    ['capturadaEn', 'ayer'],
    ['capturadaEn', '2026-11-06'],
    ['capturadaEn', '2026-11-06T11:49:00'],
    ['idUsuario', ids.usuario],
    ['id_interaccion_cliente', ids.interaccion],
  ])('rechaza DTO inválido %s=%s', async (campo, valor) => {
    const r = await post({ ...body(), [campo]: valor }).expect(400);
    expect(r.body as unknown).toHaveProperty('mensaje');
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it('valida UUID de sesión', async () => {
    await request(app.getHttpServer())
      .post('/api/chat/sesiones/no-uuid/respuestas')
      .set('X-CSRF-Token', 'csrf-local')
      .send(body())
      .expect(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([null, -1, 11, '5', {}, ['5']])(
    'respuesta inválida %p no se guarda ni avanza',
    async (valor) => {
      const r = await post({ ...body(), valor }).expect(400);
      expect(r.body as unknown).toMatchObject({
        statusCode: 400,
        campo: 'valor',
      });
      expect(tx.registro.guardar).not.toHaveBeenCalled();
    },
  );
  it('devuelve exactamente el error FUERA_DE_RANGO', async () => {
    const r = await post({ ...body(), valor: 11 }).expect(400);
    expect(r.body).toEqual({
      statusCode: 400,
      codigo: 'FUERA_DE_RANGO',
      mensaje: 'El valor ingresado está fuera del rango permitido.',
      campo: 'valor',
    });
  });
  it('rechaza ausencia de valor aunque null pueda representar una respuesta opcional', async () => {
    const sinValor: Partial<ReturnType<typeof body>> = body();
    delete sinValor.valor;
    const r = await post(sinValor).expect(400);
    expect(r.body as unknown).toMatchObject({
      codigo: 'RESPUESTA_OBLIGATORIA',
      campo: 'valor',
    });
    expect(tx.registro.guardar).not.toHaveBeenCalled();
  });
  it.each(['TEXTO_LIBRE', 'SELECCION_UNICA', null, undefined])(
    'rechaza tipoEntrada no permitido %s',
    async (tipoEntrada) => {
      const r = await post({ ...body(), tipoEntrada }).expect(400);
      expect(r.body as unknown).toMatchObject({
        codigo: 'TIPO_ENTRADA_NO_PERMITIDO',
        campo: 'tipoEntrada',
      });
      expect(tx.registro.guardar).not.toHaveBeenCalled();
    },
  );
  it('oculta detalles de infraestructura cuando falla la persistencia', async () => {
    tx.registro.guardar.mockRejectedValue(
      new Error('detalle privado de PostgreSQL'),
    );
    const r = await post(body()).expect(500);
    expect(r.body as unknown).toMatchObject({ statusCode: 500, codigo: null });
    expect(JSON.stringify(r.body)).not.toContain('PostgreSQL');
  });
  it.each([
    [
      new ConflictoRespuestaConversacionalException(
        'La conversación avanzó.',
        'NODO_DESACTUALIZADO',
      ),
      409,
    ],
    [
      new RespuestaConversacionalNoEncontradaException(
        'No se pudo recuperar el contenido del chat.',
        'SESION_NO_ENCONTRADA',
      ),
      404,
    ],
  ] as const)(
    'conserva errores de dominio y su formato',
    async (error, estado) => {
      ejecutar.mockRejectedValueOnce(error);
      const r = await post(body()).expect(estado);
      expect(r.body).toEqual({
        statusCode: estado,
        codigo: error.codigo,
        mensaje: error.message,
      });
    },
  );
  it('nodo terminal no escribe una nueva respuesta', async () => {
    tx.contexto.buscarTransiciones.mockResolvedValue([]);
    const r = await post(body()).expect(409);
    expect(r.body as unknown).toHaveProperty('codigo', 'NODO_TERMINAL');
    expect(tx.registro.guardar).not.toHaveBeenCalled();
  });
  it('devuelve un reenvío desde su resultado original, sin repetir validación ni escrituras', async () => {
    const original = {
      idRespuesta: ids.interaccion,
      resultado: 'VALIDA',
      estadoSesion: 'ACTIVA',
      transicion: {
        idNodoOrigen: ids.nodo,
        idNodoDestino: ids.destino,
        esTerminal: false,
      },
    };
    tx.registro.buscarResultado.mockResolvedValue({
      idSesion: ids.sesion,
      resultado: original,
    });
    const r = await post(body()).expect(200);
    expect(r.body).toEqual(original);
    expect(tx.contexto.buscarNodo).not.toHaveBeenCalled();
    expect(tx.perfil.capturarDimension).not.toHaveBeenCalled();
    expect(tx.registro.guardar).not.toHaveBeenCalled();
  });
  it.each([
    ['OPCION_UNICA', 'a', Dato.SELECCION, ['a']],
    ['MULTISELECCION', ['a', 'b'], Dato.SELECCION, ['a', 'b']],
    ['ESCALA', 7, Dato.NUMERICO, []],
    ['NUMERICO', 0, Dato.NUMERICO, []],
    ['FECHA_HORA', '2026-11-06T11:49:00-05:00', Dato.FECHA, []],
    ['BOOLEANO', false, Dato.SELECCION, ['false', 'true']],
    ['TEXTO_LIBRE', 'Respuesta libre', Dato.TEXTO, []],
    ['CONTINUAR', null, Dato.TEXTO, []],
  ] as const)(
    'procesa %s de extremo HTTP a caso de uso',
    async (tipo, valor, tipoDato, permitidos) => {
      tx.contexto.buscarNodo.mockResolvedValueOnce(nodoRespuesta({ tipo }));
      tx.contexto.buscarTransiciones.mockResolvedValue([
        transicionRespuesta(
          { valor },
          Op.IGUALDAD,
          reglaRespuesta({
            tipoDato,
            obligatorio: tipo !== 'CONTINUAR',
            valoresPermitidos: [...permitidos],
          }),
        ),
      ]);
      await post({ ...body(), tipoEntrada: tipo, valor }).expect(200);
      expect(tx.registro.guardar).toHaveBeenCalledTimes(1);
    },
  );

  describe('RF-27B captura clínica dentro del POST', () => {
    const configurar = () => {
      const n = nodoRespuesta({ tipo: 'OPCION_UNICA' });
      n.contenido.capturaPerfil = { dimension: 'TIPO_DEPENDENCIA' };
      tx.contexto.buscarNodo.mockResolvedValueOnce(n);
      tx.contexto.buscarTransiciones.mockResolvedValue([
        transicionRespuesta(
          { campo: 'es_valida', valor: true },
          Op.IGUALDAD,
          reglaRespuesta({
            tipoDato: Dato.SELECCION,
            valoresPermitidos: ['ABSTINENCIA_FISICA', 'TOLERANCIA'],
          }),
        ),
      ]);
      return {
        ...body(),
        tipoEntrada: 'OPCION_UNICA',
        valor: 'ABSTINENCIA_FISICA',
      };
    };

    it.each([true, false])(
      'continúa con aplicado=%s sin exponer el resultado clínico al frontend',
      async (aplicado) => {
        const datos = configurar();
        tx.perfil.capturarDimension.mockResolvedValue({
          aplicado,
          dimension: 'TIPO_DEPENDENCIA',
          valorVigente: aplicado ? 'ABSTINENCIA_FISICA' : 'TOLERANCIA',
          perfilCompleto: false,
        });
        const r = await post(datos).expect(200);
        expect(tx.perfil.capturarDimension).toHaveBeenCalledWith({
          idUsuario: ids.usuario,
          idSesion: ids.sesion,
          idNodo: ids.nodo,
          dimension: 'TIPO_DEPENDENCIA',
          valor: 'ABSTINENCIA_FISICA',
          modalidadSesion: ModalidadConversacional.GRUPAL,
        });
        expect(tx.registro.guardar).toHaveBeenCalledTimes(1);
        expect(r.body as unknown).toEqual({
          idRespuesta: ids.interaccion,
          resultado: 'VALIDA',
          transicion: {
            idNodoOrigen: ids.nodo,
            idNodoDestino: ids.destino,
            esTerminal: false,
          },
          estadoSesion: 'ACTIVA',
        });
      },
    );

    it.each(['POSITIVO', 'BAJA', 'TOLERANCIA ', 'OTRO'])(
      'valor clínico inválido %s responde 400 sin capturar ni avanzar',
      async (valor) => {
        const r = await post({ ...configurar(), valor }).expect(400);
        expect(r.body as unknown).toMatchObject({
          codigo: 'VALOR_NO_PERMITIDO',
          campo: 'valor',
        });
        expect(tx.perfil.capturarDimension).not.toHaveBeenCalled();
        expect(tx.registro.guardar).not.toHaveBeenCalled();
      },
    );

    it('usa la modalidad fijada en la sesión y rechaza PERSONALIZADA con 409', async () => {
      const datos = configurar();
      tx.contexto.bloquearSesion.mockResolvedValue({
        estadoActual: 'ACTIVA',
        idNodoActual: ids.nodo,
        idFlujoConversacional: ids.flujo,
        modalidadActiva: ModalidadConversacional.PERSONALIZADA,
      });
      const r = await post(datos).expect(409);
      expect(r.body as unknown).toMatchObject({
        codigo: 'CAPTURA_FUERA_DE_GRUPAL',
      });
      expect(tx.perfil.capturarDimension).not.toHaveBeenCalled();
      expect(tx.registro.guardar).not.toHaveBeenCalled();
    });

    it('propaga ERROR_PERFIL sin datos privados ni avance', async () => {
      const datos = configurar();
      tx.perfil.capturarDimension.mockRejectedValue(
        new Error('detalle privado de Supabase'),
      );
      const r = await post(datos).expect(500);
      expect(r.body as unknown).toMatchObject({
        statusCode: 500,
        codigo: 'ERROR_PERFIL',
      });
      expect(JSON.stringify(r.body)).not.toContain('Supabase');
      expect(tx.registro.guardar).not.toHaveBeenCalled();
    });

    it('una respuesta ordinaria nunca intenta capturar el perfil', async () => {
      await post(body()).expect(200);
      expect(tx.perfil.capturarDimension).not.toHaveBeenCalled();
    });
  });
});
