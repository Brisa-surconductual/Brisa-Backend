import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  construirTopicoModuloEventoContenido,
  EventoContenidoPublisher,
} from '../../application/ports/evento-contenido.publisher';
import { AutorizarConsumoEventoContenidoService } from '../../application/service/autorizar-consumo-evento-contenido.service';
import { PublicarEventosCambioEstadoUseCase } from '../../application/use-cases/publicar-eventos-cambio-estado.use-case';
import { ContenidoEstadoPendiente } from '../../domain/entities/contenido-estado-pendiente.entity';
import { EventoContenido } from '../../domain/entities/evento-contenido.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { ModuloEventoNoAutorizadoException } from '../../domain/exeption/modulo-evento-no-autorizado.exception';
import { PublicacionEventoContenidoException } from '../../domain/exeption/publicacion-evento-contenido.exception';
import { EventoContenidoRepository } from '../../domain/repositories/evento-contenido.repository';
import { NestEventoContenidoPublisher } from './nest-evento-contenido.publisher';

describe('RF-15 - integración Nest con bus interno', () => {
  const idContenido = '00000000-0000-4000-8000-000000000002';
  const repository = {
    buscarCambiosPendientes: jest.fn(),
    buscarModulosDestinoPorContenido: jest.fn(),
    registrarSiNoExiste: jest.fn(),
    buscarEntregasPendientes: jest.fn(),
    marcarEntregaPublicada: jest.fn(),
    registrarFalloEntrega: jest.fn(),
  };
  let modulo: TestingModule;
  let useCase: PublicarEventosCambioEstadoUseCase;
  let eventEmitter: EventEmitter2;
  let autorizacion: AutorizarConsumoEventoContenidoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    modulo = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        PublicarEventosCambioEstadoUseCase,
        AutorizarConsumoEventoContenidoService,
        {
          provide: EventoContenidoRepository,
          useValue: repository,
        },
        {
          provide: EventoContenidoPublisher,
          useClass: NestEventoContenidoPublisher,
        },
      ],
    }).compile();
    await modulo.init();

    useCase = modulo.get(PublicarEventosCambioEstadoUseCase);
    eventEmitter = modulo.get(EventEmitter2);
    autorizacion = modulo.get(AutorizarConsumoEventoContenidoService);
  });

  afterEach(async () => {
    await modulo.close();
  });

  it('persiste, distribuye por canales autorizados y niega otro módulo con 403', async () => {
    const recibidoChat = jest.fn<void, [EventoContenido]>();
    const recibidoDiario = jest.fn<void, [EventoContenido]>();
    const recibidoGamificacion = jest.fn<void, [EventoContenido]>();
    eventEmitter.on(construirTopicoModuloEventoContenido('CHAT'), recibidoChat);
    eventEmitter.on(
      construirTopicoModuloEventoContenido('DIARIO'),
      recibidoDiario,
    );
    eventEmitter.on(
      construirTopicoModuloEventoContenido('GAMIFI'),
      recibidoGamificacion,
    );
    repository.buscarCambiosPendientes.mockResolvedValue([
      new ContenidoEstadoPendiente(
        '00000000-0000-4000-8000-000000000001',
        idContenido,
        '00000000-0000-4000-8000-000000000003',
        EstadoContenido.ACTIVO,
        EstadoContenido.PROGRAMADO,
      ),
    ]);
    repository.buscarModulosDestinoPorContenido.mockResolvedValue(
      new Map([
        [
          idContenido,
          [
            {
              id_modulo: '00000000-0000-4000-8000-000000000010',
              codigo_modulo: 'CHAT',
              nombre_modulo: 'Chat',
            },
            {
              id_modulo: '00000000-0000-4000-8000-000000000011',
              codigo_modulo: 'DIARIO',
              nombre_modulo: 'Diario',
            },
          ],
        ],
      ]),
    );
    repository.registrarSiNoExiste.mockImplementation(
      (evento: EventoContenido) => {
        const registrado = evento.marcarPersistido(1n);
        repository.buscarEntregasPendientes.mockResolvedValue(
          registrado.payload.modulos_destino.map((modulo) => ({
            evento: registrado,
            modulo,
          })),
        );
        return Promise.resolve(registrado);
      },
    );
    repository.buscarEntregasPendientes.mockResolvedValue([]);
    repository.marcarEntregaPublicada.mockResolvedValue(undefined);
    repository.registrarFalloEntrega.mockResolvedValue(undefined);

    const resultado = await useCase.execute(
      new Date('2026-08-26T14:00:00.000Z'),
    );
    const eventoPublicado = recibidoChat.mock.calls[0][0];

    expect(resultado.eventos_publicados).toBe(1);
    expect(recibidoChat).toHaveBeenCalledTimes(1);
    expect(recibidoDiario).toHaveBeenCalledTimes(1);
    expect(recibidoGamificacion).not.toHaveBeenCalled();
    expect(() => autorizacion.validar('GAMIFI', eventoPublicado)).toThrow(
      ModuloEventoNoAutorizadoException,
    );
    expect(new ModuloEventoNoAutorizadoException().getStatus()).toBe(403);
  });

  it('mantiene pendiente la entrega cuando el módulo no tiene consumidor registrado', async () => {
    const moduloDestino = {
      id_modulo: '00000000-0000-4000-8000-000000000010',
      codigo_modulo: 'CHAT',
      nombre_modulo: 'Chat',
    };
    const evento = EventoContenido.crear(
      {
        id_contenido_cronograma: '00000000-0000-4000-8000-000000000001',
        id_contenido: idContenido,
        id_cronograma: '00000000-0000-4000-8000-000000000003',
      },
      {
        estado_anterior: EstadoContenido.PROGRAMADO,
        estado_nuevo: EstadoContenido.ACTIVO,
      },
      [moduloDestino],
      new Date('2026-08-26T14:00:00.000Z'),
    ).marcarPersistido(2n);

    repository.buscarCambiosPendientes.mockResolvedValue([]);
    repository.buscarModulosDestinoPorContenido.mockResolvedValue(new Map());
    repository.buscarEntregasPendientes.mockResolvedValue([
      { evento, modulo: moduloDestino },
    ]);
    repository.registrarFalloEntrega.mockResolvedValue(undefined);

    const resultado = await useCase.execute(
      new Date('2026-08-26T14:00:00.000Z'),
    );

    expect(resultado).toMatchObject({
      eventos_publicados: 0,
      entregas_publicadas: 0,
      entregas_fallidas: 1,
    });
    expect(repository.marcarEntregaPublicada).not.toHaveBeenCalled();
    expect(repository.registrarFalloEntrega).toHaveBeenCalledWith(
      2n,
      moduloDestino.id_modulo,
      expect.any(Date),
      new PublicacionEventoContenidoException().message,
    );
  });
});
