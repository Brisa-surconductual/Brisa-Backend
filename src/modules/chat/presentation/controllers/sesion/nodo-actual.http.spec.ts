import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Rol } from '../../../../usuarios/domain/enums/rol.enum';
import { AlcanceSesion } from '../../../../usuarios/domain/enums/alcance-sesion.enum';
import { SessionAuthGuard } from '../../../../usuarios/presentation/guards/session-auth.guard';
import { ConsultarNodoActualUseCase } from '../../../application/use-cases/sesion/consultar-nodo-actual.use-case';
import { NodoConversacional } from '../../../domain/entities/flujo/nodo-conversacional.entity';
import { SesionConversacional } from '../../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../../domain/enums/modalidad-conversacional-enum';
import { ArbolConversacionalRepository } from '../../../domain/repositories/arbol-conversacional.repository';
import { SesionConversacionalRepository } from '../../../domain/repositories/sesion-conversacional.repository';
import { DomainExceptionFilter } from '../../filters/domain-exception.filter';
import { NodoActualController } from './nodo-actual.controller';
import { PresentarNodoActualService } from '../../../application/services/presentar-nodo-actual.service';
import { presentadorNodoPrueba } from '../../../application/support/testing/presentacion-nodo.fixture';

describe('RF-26 GET /chat/sesiones/:id_sesion/nodo-actual (HTTP)', () => {
  const idSesion = '26000000-0000-4000-8000-000000000001';
  const idUsuario = '26000000-0000-4000-8000-000000000002';
  const idNodo = '26000000-0000-4000-8000-000000000003';
  const idFlujo = '26000000-0000-4000-8000-000000000004';
  const fecha = new Date('2026-11-05T10:00:00Z');
  const contenido = {
    texto: '  Mensaje\nactual. ',
    instrucciones: 'Lee con calma.',
    multimedia: [
      { tipo: 'IMAGEN', url: 'https://example.test/uno.png' },
      { tipo: 'VIDEO', url: 'https://example.test/dos.mp4' },
    ],
  };
  const nodo = new NodoConversacional(
    idNodo,
    idFlujo,
    'tipo',
    'MENSAJE',
    contenido,
    false,
    2,
    null,
    'administrador',
    fecha,
    fecha,
  );
  const sesiones = {
    buscarPorIdYUsuario: jest.fn(),
    guardar: jest.fn(),
    buscarUltimaReanudable: jest.fn(),
  };
  const arboles = { buscarNodo: jest.fn() };
  const lecturas = { consultarReglas: jest.fn(), consultarRecursos: jest.fn() };
  const firmar = { lectura: jest.fn() };
  let app: INestApplication<App>;
  let autenticacion: {
    usuario: { id_usuario: string; rol: Rol };
    sesion: { alcance_sesion: AlcanceSesion };
  } | null;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [NodoActualController],
      providers: [
        ConsultarNodoActualUseCase,
        {
          provide: PresentarNodoActualService,
          useValue: presentadorNodoPrueba(lecturas, firmar),
        },
        { provide: SesionConversacionalRepository, useValue: sesiones },
        { provide: ArbolConversacionalRepository, useValue: arboles },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          if (!autenticacion) throw new UnauthorizedException();
          const req = context
            .switchToHttp()
            .getRequest<{ autenticacion: unknown }>();
          req.autenticacion = autenticacion;
          return true;
        },
      })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });
  beforeEach(() => {
    jest.resetAllMocks();
    lecturas.consultarReglas.mockResolvedValue([]);
    lecturas.consultarRecursos.mockResolvedValue([]);
    autenticacion = {
      usuario: { id_usuario: idUsuario, rol: Rol.ESTUDIANTE },
      sesion: { alcance_sesion: AlcanceSesion.COMPLETA },
    };
    sesiones.buscarPorIdYUsuario.mockImplementation(
      (sesion: string, usuario: string) =>
        Promise.resolve(
          sesion === idSesion && usuario === idUsuario
            ? new SesionConversacional(
                idSesion,
                idUsuario,
                idFlujo,
                1,
                ModalidadConversacional.GRUPAL,
                null,
                null,
                idNodo,
                'PAUSADA',
                fecha,
                fecha,
              )
            : null,
        ),
    );
    arboles.buscarNodo.mockResolvedValue(nodo);
  });
  afterEach(() => {
    expect(sesiones.guardar).not.toHaveBeenCalled();
    expect(sesiones.buscarUltimaReanudable).not.toHaveBeenCalled();
  });
  afterAll(async () => app.close());

  it('responde 200 sin CSRF, con contenido íntegro y sin datos clínicos ni otros nodos', async () => {
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(200)
      .expect('Cache-Control', 'no-store')
      .expect({
        idSesion,
        estadoSesion: 'PAUSADA',
        nodo: {
          idNodo,
          tipoNodo: 'MENSAJE',
          orden: 2,
          esTerminal: true,
          entrada: null,
          bloques: [
            { orden: 1, tipo: 'TEXTO', texto: contenido.texto },
            { orden: 2, tipo: 'INSTRUCCION', texto: contenido.instrucciones },
            ...contenido.multimedia.map((m, i) => ({
              orden: i + 3,
              tipo: m.tipo,
              url: m.url,
              expiraEn: null,
              mimeType: null,
              textoAlternativo: null,
              duracionSegundos: null,
            })),
          ],
        },
      });
    expect(arboles.buscarNodo).toHaveBeenCalledWith(idNodo);
  });
  it('toma al propietario de la sesión autenticada e ignora id_usuario de la query', async () => {
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .query({ id_usuario: 'otro-usuario' })
      .expect(200);
    expect(sesiones.buscarPorIdYUsuario).toHaveBeenCalledWith(
      idSesion,
      idUsuario,
    );
  });
  it('no expone sesiones ajenas', async () => {
    autenticacion!.usuario.id_usuario = '26000000-0000-4000-8000-000000000099';
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(404);
    expect(result.body).toMatchObject({ codigo: 'SESION_NO_ENCONTRADA' });
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('responde 404 para una sesión inexistente', async () => {
    const result = await request(app.getHttpServer())
      .get('/chat/sesiones/26000000-0000-4000-8000-000000000088/nodo-actual')
      .expect(404);
    expect(result.body).toMatchObject({ codigo: 'SESION_NO_ENCONTRADA' });
  });
  it('rechaza un UUID inválido antes de consultar', async () => {
    await request(app.getHttpServer())
      .get('/chat/sesiones/no-es-uuid/nodo-actual')
      .expect(400);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('responde 401 sin autenticación', async () => {
    autenticacion = null;
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(401);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('responde 403 para un administrador', async () => {
    autenticacion!.usuario.rol = Rol.ADMINISTRATIVO;
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(403);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('responde 403 con alcance limitado', async () => {
    autenticacion!.sesion.alcance_sesion = AlcanceSesion.LIMITADA;
    await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(403);
    expect(sesiones.buscarPorIdYUsuario).not.toHaveBeenCalled();
  });
  it('conserva el error 404 de un nodo inexistente', async () => {
    arboles.buscarNodo.mockResolvedValue(null);
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(404);
    expect(result.body).toMatchObject({
      statusCode: 404,
      codigo: 'NODO_INEXISTENTE',
      mensaje: 'No se pudo recuperar el contenido del chat.',
    });
  });
  it('informa ERROR_CONFIGURACION sin reiniciar la conversación', async () => {
    sesiones.buscarPorIdYUsuario.mockResolvedValue(
      SesionConversacional.registrarErrorConfiguracion(
        {
          idSesion,
          idUsuario,
          modalidadActiva: ModalidadConversacional.GRUPAL,
          tipoDependencia: null,
          tipoCraving: null,
        },
        fecha,
      ),
    );
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(409);
    expect(result.body).toMatchObject({ codigo: 'SESION_ERROR_CONFIGURACION' });
    expect(arboles.buscarNodo).not.toHaveBeenCalled();
  });
  it('retorna un 500 controlado si falla la base, sin filtrar su mensaje', async () => {
    arboles.buscarNodo.mockRejectedValue(
      new Error('detalle privado de PostgreSQL'),
    );
    const result = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(500);
    expect(result.body).toMatchObject({
      statusCode: 500,
      codigo: 'CONTENIDO_NO_DISPONIBLE',
      mensaje: 'El contenido del nodo no está disponible.',
    });
    expect(result.text).not.toContain('PostgreSQL');
  });
  it('expone la ruta /api y conserva el alias usado por el proxy', async () => {
    const conApi = await request(app.getHttpServer())
      .get(`/api/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(200);
    const sinApi = await request(app.getHttpServer())
      .get(`/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(200);
    expect(conApi.body).toEqual(sinApi.body);
  });
  it('respeta exactamente el sobre de error confirmado para una sesión ajena', async () => {
    const r = await request(app.getHttpServer())
      .get(
        '/api/chat/sesiones/26000000-0000-4000-8000-000000000099/nodo-actual',
      )
      .expect(404);
    expect(r.body).toEqual({
      statusCode: 404,
      codigo: 'SESION_NO_ENCONTRADA',
      mensaje: 'No se pudo recuperar el contenido del chat.',
    });
  });
  it('normaliza también errores de autenticación', async () => {
    autenticacion = null;
    const r = await request(app.getHttpServer())
      .get(`/api/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(401);
    expect(r.body as unknown).toMatchObject({
      statusCode: 401,
      codigo: null,
    });
    expect(r.body as unknown).not.toHaveProperty('message');
    expect(typeof (r.body as { mensaje: unknown }).mensaje).toBe('string');
  });
  it('entrega exactamente el contrato confirmado, con imagen firmada y escala', async () => {
    const idRecurso = '26000000-0000-4000-8000-000000000010';
    const datos = {
      bloques: [
        { orden: 3, tipo: 'IMAGEN', idRecurso },
        { orden: 1, tipo: 'TEXTO', texto: 'Pregunta' },
        { orden: 2, tipo: 'INSTRUCCION', texto: 'Instrucción' },
      ],
      entrada: {
        tipo: 'ESCALA',
        min: 1,
        max: 10,
        paso: 1,
        etiquetas: { min: 'Nada', max: 'Muchísimo' },
      },
    };
    arboles.buscarNodo.mockResolvedValue(
      new NodoConversacional(
        idNodo,
        idFlujo,
        'tipo',
        'PREGUNTA',
        datos,
        false,
        4,
        'contenido',
        'actor',
        fecha,
        fecha,
      ),
    );
    sesiones.buscarPorIdYUsuario.mockResolvedValue(
      new SesionConversacional(
        idSesion,
        idUsuario,
        idFlujo,
        1,
        ModalidadConversacional.GRUPAL,
        null,
        null,
        idNodo,
        'ACTIVA',
        fecha,
        fecha,
      ),
    );
    lecturas.consultarReglas.mockResolvedValue([
      { obligatorio: true, valorMin: 1, valorMax: 10, valoresPermitidos: [] },
    ]);
    lecturas.consultarRecursos.mockResolvedValue([
      {
        idRecurso,
        tipo: 'IMAGEN',
        orden: 1,
        texto: null,
        claveAlmacenamiento: 'cronograma/recursos/contenido/objeto',
        mimeType: 'image/webp',
        textoAlternativo: 'Imagen',
        duracionSegundos: null,
      },
    ]);
    firmar.lectura.mockResolvedValue({
      url: 'https://bucket.example.test/imagen?firma=nueva',
      expiraEn: '2099-11-06T17:10:00.000Z',
    });
    const r = await request(app.getHttpServer())
      .get(`/api/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(200);
    expect(r.body).toEqual({
      idSesion,
      estadoSesion: 'ACTIVA',
      nodo: {
        idNodo,
        tipoNodo: 'PREGUNTA',
        orden: 4,
        esTerminal: false,
        bloques: [
          { orden: 1, tipo: 'TEXTO', texto: 'Pregunta' },
          { orden: 2, tipo: 'INSTRUCCION', texto: 'Instrucción' },
          {
            orden: 3,
            tipo: 'IMAGEN',
            url: 'https://bucket.example.test/imagen?firma=nueva',
            expiraEn: '2099-11-06T17:10:00.000Z',
            mimeType: 'image/webp',
            textoAlternativo: 'Imagen',
            duracionSegundos: null,
          },
        ],
        entrada: {
          tipo: 'ESCALA',
          obligatorio: true,
          min: 1,
          max: 10,
          paso: 1,
          opciones: null,
          etiquetas: { min: 'Nada', max: 'Muchísimo' },
          maxCaracteres: null,
        },
      },
    });
    expect(firmar.lectura).toHaveBeenCalledWith(
      'cronograma/recursos/contenido/objeto',
    );
    expect(datos.bloques[0].orden).toBe(3);
  });
  it('no firma una referencia privada ajena al contenido del nodo', async () => {
    arboles.buscarNodo.mockResolvedValue(
      nodo.actualizar({
        contenido: {
          bloques: [{ orden: 1, tipo: 'VIDEO', idRecurso: 'ajeno' }],
        },
      }),
    );
    const r = await request(app.getHttpServer())
      .get(`/api/chat/sesiones/${idSesion}/nodo-actual`)
      .expect(500);
    expect(r.body).toEqual({
      statusCode: 500,
      codigo: 'CONTENIDO_NO_DISPONIBLE',
      mensaje: 'El contenido del nodo no está disponible.',
    });
    expect(firmar.lectura).not.toHaveBeenCalled();
  });
});
