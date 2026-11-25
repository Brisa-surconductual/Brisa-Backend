import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';
import {
  type INestApplication,
  type ExecutionContext,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { SessionTokenHasher } from '../../../usuarios/application/ports/session-token-hasher';
import { SessionAuthGuard } from '../../../usuarios/presentation/guards/session-auth.guard';
import type { AuthenticatedSessionRequest } from '../../../usuarios/presentation/http/authenticated-session-request';
import { GestionContenidoException } from '../../application/exceptions/gestion-contenido.exception';
import {
  BitacoraRepository,
  ColaAuditoriaPort,
} from '../../application/ports/auditoria.port';
import { ContenidoNarrativoPort } from '../../application/ports/contenido-narrativo.port';
import { MensajesNotificacionPort } from '../../application/ports/mensajes-notificacion.port';
import { AuditoriaService } from '../../application/services/auditoria.service';
import { GestionarContenidoNarrativoUseCase } from '../../application/use-cases/gestionar-contenido-narrativo.use-case';
import { GestionarMensajesNotificacionUseCase } from '../../application/use-cases/gestionar-mensajes-notificacion.use-case';
import { GestionContenidoInfrastructureProviders } from '../../infrastructure/gestion-contenido.providers';
import { ContenidoNarrativoController } from './contenido-narrativo.controller';
import { MensajesNotificacionController } from './mensajes-notificacion.controller';

const ACTOR = 'e37c76d5-933c-4da6-9efe-be72a425fea9';
const SESION = 'd49cb8b3-b36f-4914-9377-51161f580d55';
const ID = 'dd8f3987-28b1-4e21-afaf-7dbfcacf4e03';
const UNIDAD = '24657d92-cbc9-480f-90ce-7095d611a286';
const MENSAJES = '/admin/notificaciones/mensajes';
const TERMINOS = '/admin/notificaciones/terminos-restringidos';
const CAPITULOS = '/admin/narrativa/capitulos';
const LOGROS = '/admin/narrativa/logros';
const REGLAS = '/admin/narrativa/reglas-nivel/2';
const COBERTURA = '/admin/narrativa/cobertura';
const mensaje = {
  tipo_mensaje: 'MOTIVACIONAL',
  contenido_mensaje: 'Avanza a tu ritmo.',
};
const capitulo = {
  fase: 'INICIO',
  titulo_capitulo: 'El inicio',
  id_unidad_temporal: UNIDAD,
};
const logro = {
  nombre_logro: 'Primer paso',
  descripcion_logro: 'Un paso a la vez',
  recurso_visual_logro: 'logros/primero.png',
  condicion_desbloqueo: 'CAPITULO_COMPLETADO',
  id_referencia: ID,
};
const terminos = {
  terminos: ['vapeo'],
  fecha_actualizacion: '2026-11-23T03:30:00Z',
  aplica_retroactivamente: false as const,
};

jest.setTimeout(60_000);

function simular<F extends (...args: never[]) => unknown>() {
  return jest.fn<ReturnType<F>, Parameters<F>>();
}

const mensajes = {
  listar: simular<MensajesNotificacionPort['listar']>(),
  crear: simular<MensajesNotificacionPort['crear']>(),
  editar: simular<MensajesNotificacionPort['editar']>(),
  activar: simular<MensajesNotificacionPort['activar']>(),
  inactivar: simular<MensajesNotificacionPort['inactivar']>(),
  obtenerTerminos: simular<MensajesNotificacionPort['obtenerTerminos']>(),
  actualizarTerminos: simular<MensajesNotificacionPort['actualizarTerminos']>(),
} satisfies jest.Mocked<MensajesNotificacionPort>;
const narrativa = {
  listarCapitulos: simular<ContenidoNarrativoPort['listarCapitulos']>(),
  crearCapitulo: simular<ContenidoNarrativoPort['crearCapitulo']>(),
  editarCapitulo: simular<ContenidoNarrativoPort['editarCapitulo']>(),
  publicarCapitulo: simular<ContenidoNarrativoPort['publicarCapitulo']>(),
  inactivarCapitulo: simular<ContenidoNarrativoPort['inactivarCapitulo']>(),
  listarLogros: simular<ContenidoNarrativoPort['listarLogros']>(),
  crearLogro: simular<ContenidoNarrativoPort['crearLogro']>(),
  editarLogro: simular<ContenidoNarrativoPort['editarLogro']>(),
  activarLogro: simular<ContenidoNarrativoPort['activarLogro']>(),
  inactivarLogro: simular<ContenidoNarrativoPort['inactivarLogro']>(),
  guardarReglaNivel: simular<ContenidoNarrativoPort['guardarReglaNivel']>(),
  consultarCobertura: simular<ContenidoNarrativoPort['consultarCobertura']>(),
} satisfies jest.Mocked<ContenidoNarrativoPort>;
const encolar = jest
  .fn<Promise<void>, [RegistroAuditoria]>()
  .mockResolvedValue(undefined);

function autenticar(ctx: ExecutionContext): boolean {
  const req = ctx.switchToHttp().getRequest<AuthenticatedSessionRequest>();
  const rol = req.header('x-prueba-rol');
  if (!rol) throw new UnauthorizedException();
  const alcance = req.header('x-prueba-alcance') ?? 'COMPLETA';
  req.autenticacion = {
    usuario: { id_usuario: ACTOR, rol },
    sesion: {
      id_sesion: SESION,
      alcance_sesion: alcance,
      csrf_token_hash: 'prueba',
    },
  } as AuthenticatedSessionRequest['autenticacion'];
  return true;
}

async function iniciar(conFuentes: boolean) {
  const modulo = Test.createTestingModule({
    controllers: [MensajesNotificacionController, ContenidoNarrativoController],
    providers: [
      GestionarMensajesNotificacionUseCase,
      GestionarContenidoNarrativoUseCase,
      AuditoriaService,
      { provide: BitacoraRepository, useValue: {} },
      { provide: ColaAuditoriaPort, useValue: { encolar } },
      {
        provide: SessionTokenHasher,
        useValue: {
          compare: (csrf: string, esperado: string) =>
            Promise.resolve(csrf === esperado),
        },
      },
      ...GestionContenidoInfrastructureProviders,
    ],
  })
    .overrideGuard(SessionAuthGuard)
    .useValue({ canActivate: autenticar });
  if (conFuentes) {
    modulo.overrideProvider(MensajesNotificacionPort).useValue(mensajes);
    modulo.overrideProvider(ContenidoNarrativoPort).useValue(narrativa);
  }
  const app = (await modulo.compile()).createNestApplication({ logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(0, '127.0.0.1');
  return app;
}

describe('Contratos HTTP RF-138 y RF-139', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer() as Server);
  const autorizar = {
    'x-prueba-rol': 'ADMINISTRATIVO',
    'x-csrf-token': 'prueba',
  };

  beforeAll(async () => {
    app = await iniciar(true);
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aplica sesión, alcance y rol a lecturas y exige CSRF al escribir', async () => {
    await http().get(MENSAJES).expect(401);
    await http().get(COBERTURA).set('x-prueba-rol', 'ESTUDIANTE').expect(403);
    await http()
      .get(MENSAJES)
      .set({ ...autorizar, 'x-prueba-alcance': 'LIMITADA' })
      .expect(403);
    await http()
      .post(MENSAJES)
      .set('x-prueba-rol', 'ADMINISTRATIVO')
      .send(mensaje)
      .expect(403);
    expect(mensajes.crear).not.toHaveBeenCalled();
    expect(narrativa.consultarCobertura).not.toHaveBeenCalled();
    expect(encolar).not.toHaveBeenCalled();
  });

  it('pasa filtros y paginación al proveedor de mensajes', async () => {
    const pagina = { items: [], total: 0, limit: 20, offset: 40 };
    mensajes.listar.mockResolvedValueOnce(pagina);
    await http()
      .get(MENSAJES)
      .query({ tipo_mensaje: 'MOTIVACIONAL', estado: 'ACTIVO', offset: 40 })
      .set('x-prueba-rol', 'COORDINADOR_PSI')
      .expect(200, pagina);
    expect(mensajes.listar).toHaveBeenCalledWith({
      tipo_mensaje: 'MOTIVACIONAL',
      estado: 'ACTIVO',
      offset: 40,
      limit: 20,
    });
    await http().get(MENSAJES).query({ limit: 0 }).set(autorizar).expect(400);
    expect(mensajes.listar).toHaveBeenCalledTimes(1);
    expect(encolar).not.toHaveBeenCalled();
  });

  it('crea borrador, edita, bloquea activación y aplica las transiciones de mensajes', async () => {
    const borrador = { id_mensaje: ID, estado: 'BORRADOR' } as const;
    const activo = { id_mensaje: ID, estado: 'ACTIVO' } as const;
    const inactivo = { id_mensaje: ID, estado: 'INACTIVO' } as const;
    mensajes.crear.mockResolvedValueOnce(borrador);
    mensajes.editar.mockResolvedValueOnce(borrador);
    mensajes.activar
      .mockRejectedValueOnce(
        new GestionContenidoException('TERMINOS_RESTRINGIDOS', ['vapeo']),
      )
      .mockResolvedValueOnce(activo);
    mensajes.inactivar.mockResolvedValueOnce(inactivo);

    await http()
      .post(MENSAJES)
      .set(autorizar)
      .send({ ...mensaje, justificacion_cambio: 'Nuevo banco' })
      .expect(201, borrador);
    await http()
      .patch(MENSAJES + '/' + ID)
      .set(autorizar)
      .send({ contenido_mensaje: 'Texto actualizado' })
      .expect(200, borrador);
    const bloqueada = await http()
      .post(MENSAJES + '/' + ID + '/activar')
      .set(autorizar)
      .send({})
      .expect(400);
    expect(bloqueada.body).toEqual({
      status: 400,
      codigo: 'TERMINOS_RESTRINGIDOS',
      mensaje:
        'El mensaje no puede activarse porque su contenido contiene términos restringidos.',
      terminos_detectados: ['vapeo'],
    });
    expect(encolar).toHaveBeenCalledTimes(2);
    await http()
      .post(MENSAJES + '/' + ID + '/activar')
      .set(autorizar)
      .expect(200, activo);
    await http()
      .post(MENSAJES + '/' + ID + '/inactivar')
      .set(autorizar)
      .expect(200, inactivo);

    expect(mensajes.activar).toHaveBeenNthCalledWith(1, ACTOR, ID);
    expect(encolar).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        idUsuario: ACTOR,
        idSesion: SESION,
        id_recurso: ID,
        accion: 'GESTION_MENSAJES_NOTIFICACION',
        estado_accion: 'EXITOSA',
        detalle: {
          accion_solicitada: 'CREAR_MENSAJE',
          justificacion_cambio: 'Nuevo banco',
        },
      }),
    );
    expect(encolar).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        detalle: expect.objectContaining({
          accion_solicitada: 'ACTIVAR_MENSAJE',
          resultado_validacion_terminos: true,
        }) as unknown,
      }),
    );
    expect(encolar).toHaveBeenCalledTimes(4);
  });

  it('reemplaza y consulta la lista de términos sin retroactividad y rechaza un arreglo inválido', async () => {
    mensajes.actualizarTerminos.mockResolvedValueOnce(terminos);
    mensajes.obtenerTerminos.mockResolvedValueOnce(terminos);
    await http()
      .put(TERMINOS)
      .set(autorizar)
      .send({ terminos: [1] })
      .expect(400)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'LISTA_TERMINOS_INVALIDA' }),
      );
    await http()
      .put(TERMINOS)
      .set(autorizar)
      .send({ terminos: ['vapeo'] })
      .expect(200, terminos);
    await http().get(TERMINOS).set(autorizar).expect(200, terminos);
    expect(mensajes.actualizarTerminos).toHaveBeenCalledTimes(1);
    expect(encolar).toHaveBeenCalledTimes(1);
    expect(encolar).toHaveBeenCalledWith(
      expect.objectContaining({
        recurso_afectado: 'TERMINOS_RESTRINGIDOS',
        detalle: expect.objectContaining({
          accion_solicitada: 'ACTUALIZAR_TERMINOS_RESTRINGIDOS',
        }) as unknown,
      }),
    );
  });

  it('rechaza campos o identificadores inválidos y conserva el 404 del proveedor', async () => {
    mensajes.editar.mockRejectedValueOnce(
      new GestionContenidoException('MENSAJE_NO_ENCONTRADO'),
    );
    await http()
      .post(MENSAJES)
      .set(autorizar)
      .send({ ...mensaje, tipo_mensaje: 'OTRO' })
      .expect(400)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'MENSAJE_INCOMPLETO' }),
      );
    await http()
      .patch(MENSAJES + '/invalido')
      .set(autorizar)
      .send({ contenido_mensaje: 'Ajuste' })
      .expect(400);
    await http()
      .patch(MENSAJES + '/' + ID)
      .set(autorizar)
      .send({ justificacion_cambio: 'Sin campos' })
      .expect(400);
    await http()
      .patch(MENSAJES + '/' + ID)
      .set(autorizar)
      .send({ contenido_mensaje: 'Ajuste', estado: 'ACTIVO' })
      .expect(400);
    await http()
      .post(MENSAJES + '/' + ID + '/activar')
      .set(autorizar)
      .send({ accion_solicitada: 'ACTIVAR_MENSAJE' })
      .expect(400);
    await http()
      .patch(MENSAJES + '/' + ID)
      .set(autorizar)
      .send({ contenido_mensaje: 'Ajuste' })
      .expect(404)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'MENSAJE_NO_ENCONTRADO' }),
      );
    expect(mensajes.editar).toHaveBeenCalledTimes(1);
    expect(mensajes.activar).not.toHaveBeenCalled();
    expect(encolar).not.toHaveBeenCalled();
  });

  it('mantiene el 409 de capítulos usados y el 422 de publicación sin unidad', async () => {
    narrativa.editarCapitulo.mockRejectedValueOnce(
      new GestionContenidoException('CAPITULO_EN_USO'),
    );
    narrativa.publicarCapitulo.mockRejectedValueOnce(
      new GestionContenidoException('CAPITULO_SIN_UNIDAD_TEMPORAL'),
    );
    await http()
      .patch(CAPITULOS + '/' + ID)
      .set(autorizar)
      .send({ texto_historia: 'Nuevo' })
      .expect(409)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'CAPITULO_EN_USO' }),
      );
    await http()
      .post(CAPITULOS + '/' + ID + '/publicar')
      .set(autorizar)
      .expect(422)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'CAPITULO_SIN_UNIDAD_TEMPORAL' }),
      );
    expect(encolar).not.toHaveBeenCalled();
  });

  it('consulta, crea, edita, publica e inactiva capítulos sin condicionar las operaciones a la cobertura', async () => {
    const borrador = { id_capitulo: ID, estado: 'BORRADOR' } as const;
    const publicado = { id_capitulo: ID, estado: 'PUBLICADO' } as const;
    const inactivo = { id_capitulo: ID, estado: 'INACTIVO' } as const;
    narrativa.listarCapitulos.mockResolvedValueOnce({
      items: [
        { ...publicado, ...capitulo, fase: 'INICIO', orden: 1, en_uso: false },
      ],
    });
    narrativa.crearCapitulo.mockResolvedValueOnce(borrador);
    narrativa.editarCapitulo.mockResolvedValueOnce(borrador);
    narrativa.publicarCapitulo.mockResolvedValueOnce(publicado);
    narrativa.inactivarCapitulo.mockResolvedValueOnce(inactivo);
    await http().get(CAPITULOS).set(autorizar).expect(200);
    await http()
      .post(CAPITULOS)
      .set(autorizar)
      .send(capitulo)
      .expect(201, borrador);
    await http()
      .patch(CAPITULOS + '/' + ID)
      .set(autorizar)
      .send({ texto_historia: 'Continuación' })
      .expect(200, borrador);
    await http()
      .post(CAPITULOS + '/' + ID + '/publicar')
      .set(autorizar)
      .expect(200, publicado);
    await http()
      .post(CAPITULOS + '/' + ID + '/inactivar')
      .set(autorizar)
      .expect(200, inactivo);
    expect(narrativa.consultarCobertura).not.toHaveBeenCalled();
    expect(encolar).toHaveBeenCalledTimes(4);
    expect(encolar).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        accion: 'GESTION_CONTENIDO_NARRATIVO',
        id_recurso: ID,
        detalle: expect.objectContaining({
          accion_solicitada: 'PUBLICAR_CAPITULO',
        }) as unknown,
      }),
    );
  });

  it('propaga los errores de referencia y recurso visual del proveedor de logros', async () => {
    narrativa.crearLogro.mockRejectedValueOnce(
      new GestionContenidoException('REFERENCIA_NARRATIVA_INVALIDA'),
    );
    narrativa.activarLogro.mockRejectedValueOnce(
      new GestionContenidoException('RECURSO_VISUAL_INVALIDO'),
    );
    await http()
      .post(LOGROS)
      .set(autorizar)
      .send(logro)
      .expect(422)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'REFERENCIA_NARRATIVA_INVALIDA' }),
      );
    await http()
      .post(LOGROS + '/' + ID + '/activar')
      .set(autorizar)
      .send({})
      .expect(422)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'RECURSO_VISUAL_INVALIDO' }),
      );
    expect(encolar).not.toHaveBeenCalled();
  });

  it('gestiona logros y reglas de nivel y conserva claves y acciones de auditoría', async () => {
    const borrador = { id_logro_narrativo: ID, estado: 'BORRADOR' } as const;
    const activo = { id_logro_narrativo: ID, estado: 'ACTIVO' } as const;
    const inactivo = { id_logro_narrativo: ID, estado: 'INACTIVO' } as const;
    const conteos = { capitulos_requeridos: 4, logros_requeridos: 2 };
    const regla = {
      nivel_gamificacion: 2,
      ...conteos,
      estado: 'ACTIVA',
    } as const;
    narrativa.listarLogros.mockResolvedValueOnce({ items: [] });
    narrativa.crearLogro.mockResolvedValueOnce(borrador);
    narrativa.editarLogro.mockResolvedValueOnce(borrador);
    narrativa.activarLogro.mockResolvedValueOnce(activo);
    narrativa.inactivarLogro.mockResolvedValueOnce(inactivo);
    narrativa.guardarReglaNivel.mockResolvedValueOnce(regla);
    await http().get(LOGROS).set(autorizar).expect(200, { items: [] });
    await http().post(LOGROS).set(autorizar).send(logro).expect(201, borrador);
    await http()
      .patch(LOGROS + '/' + ID)
      .set(autorizar)
      .send({ nombre_logro: 'Un nuevo paso' })
      .expect(200, borrador);
    await http()
      .post(LOGROS + '/' + ID + '/activar')
      .set(autorizar)
      .expect(200, activo);
    await http()
      .post(LOGROS + '/' + ID + '/inactivar')
      .set(autorizar)
      .expect(200, inactivo);
    await http()
      .put(REGLAS)
      .set(autorizar)
      .send({ capitulos_requeridos: 4 })
      .expect(400)
      .expect(({ body }) =>
        expect(body).toMatchObject({ codigo: 'REGLA_NIVEL_INCOMPLETA' }),
      );
    await http().put(REGLAS).set(autorizar).send(conteos).expect(200, regla);
    expect(narrativa.guardarReglaNivel).toHaveBeenCalledWith(ACTOR, 2, conteos);
    expect(encolar).toHaveBeenCalledTimes(5);
    expect(encolar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id_recurso: null,
        recurso_afectado: 'REGLA_NIVEL_NARRATIVO',
        detalle: expect.objectContaining({
          accion_solicitada: 'CONFIGURAR_REGLA_NIVEL',
          nivel_gamificacion: 2,
        }) as unknown,
      }),
    );
  });

  it('entrega la cobertura como consulta de solo lectura', async () => {
    const cobertura = {
      total_capitulos_definidos: 2,
      total_capitulos_publicados: 1,
      capitulos_pendientes: [
        { id_capitulo: ID, orden: 2, estado: 'BORRADOR' as const },
      ],
    };
    narrativa.consultarCobertura.mockResolvedValueOnce(cobertura);
    await http().get(COBERTURA).set(autorizar).expect(200, cobertura);
    expect(narrativa.consultarCobertura).toHaveBeenCalledTimes(1);
    expect(encolar).not.toHaveBeenCalled();
  });

  it('sin proveedores responde 503 con el módulo correspondiente y sin simular cambios', async () => {
    const sinFuentes = await iniciar(false);
    try {
      const api = request(sinFuentes.getHttpServer() as Server);
      await api
        .post(MENSAJES)
        .set(autorizar)
        .send(mensaje)
        .expect(503)
        .expect(({ body }) =>
          expect(body).toMatchObject({
            codigo: 'MODULO_NOTIFICACIONES_NO_DISPONIBLE',
          }),
        );
      await api
        .get(COBERTURA)
        .set(autorizar)
        .expect(503)
        .expect(({ body }) =>
          expect(body).toMatchObject({
            codigo: 'MODULO_NARRATIVO_NO_DISPONIBLE',
          }),
        );
      expect(encolar).not.toHaveBeenCalled();
    } finally {
      await sinFuentes.close();
    }
  });
});
