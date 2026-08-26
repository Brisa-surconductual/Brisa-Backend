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
import { EventoContenidoRepository } from '../../domain/repositories/evento-contenido.repository';
import { NestEventoContenidoPublisher } from './nest-evento-contenido.publisher';

describe('RF-15 - integración Nest con bus interno', () => {
  const idContenido = '00000000-0000-4000-8000-000000000002';
  const repository = {
    buscarCambiosPendientes: jest.fn(),
    buscarModulosDestinoPorContenido: jest.fn(),
    registrarSiNoExiste: jest.fn(),
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
      (evento: EventoContenido) => Promise.resolve(evento.marcarPersistido(1n)),
    );

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
});
