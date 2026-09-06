import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import {
  construirTopicoModuloEventoContenido,
  EventoContenidoPublisher,
} from '../../src/modules/cronograma/application/ports/evento-contenido.publisher';
import { AutorizarConsumoEventoContenidoService } from '../../src/modules/cronograma/application/service/autorizar-consumo-evento-contenido.service';
import { InicializarCronogramaUsuarioUseCase } from '../../src/modules/cronograma/application/use-cases/inicializar-cronograma-usuario.use-case';
import { PublicarEventosCambioEstadoUseCase } from '../../src/modules/cronograma/application/use-cases/publicar-eventos-cambio-estado.use-case';
import { CondicionesInicializacionUsuario } from '../../src/modules/cronograma/domain/entities/condiciones-inicializacion-usuario.entity';
import { ContenidoEstadoPendiente } from '../../src/modules/cronograma/domain/entities/contenido-estado-pendiente.entity';
import { Cronograma } from '../../src/modules/cronograma/domain/entities/cronograma.entity';
import { EventoContenido } from '../../src/modules/cronograma/domain/entities/evento-contenido.entity';
import { EstadoContenido } from '../../src/modules/cronograma/domain/enums/estado-contenido.enum';
import { EstadoCronograma } from '../../src/modules/cronograma/domain/enums/estado-cronograma.enum';
import { CondicionesInicializacionUsuarioRepository } from '../../src/modules/cronograma/domain/repositories/condiciones-inicializacion-usuario.repository';
import { CronogramaUsuarioRepository } from '../../src/modules/cronograma/domain/repositories/cronograma-usuario.repository';
import { CronogramaRepository } from '../../src/modules/cronograma/domain/repositories/cronograma.repository';
import { EventoContenidoRepository } from '../../src/modules/cronograma/domain/repositories/evento-contenido.repository';
import { PublicarEventosContenidoCron } from '../../src/modules/cronograma/infrastructure/cron/publicar-eventos-contenido.cron';
import { NestEventoContenidoPublisher } from '../../src/modules/cronograma/infrastructure/messaging/nest-evento-contenido.publisher';
import { EstadoRegistro } from '../../src/modules/usuarios/domain/enums/estado-registro.enum';
import { Rol } from '../../src/modules/usuarios/domain/enums/rol.enum';

describe('Cronograma - procesos internos (e2e)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000001';
  const idCronograma = '00000000-0000-4000-8000-000000000002';

  it('RF-17 inicializa una sola asignación contra el cronograma base activo', async () => {
    const condicionesRepository = {
      buscarPorUsuario: jest
        .fn()
        .mockResolvedValue(
          new CondicionesInicializacionUsuario(
            idUsuario,
            Rol.ESTUDIANTE,
            EstadoRegistro.REGISTRO_COMPLETO,
            true,
            '00000000-0000-4000-8000-000000000003',
            true,
          ),
        ),
      buscarUsuariosElegiblesSinCronograma: jest.fn(),
    };
    const cronogramaRepository = {
      buscarBaseActiva: jest
        .fn()
        .mockResolvedValue(
          new Cronograma(
            idCronograma,
            'Cronograma base',
            EstadoCronograma.ACTIVO,
            true,
            new Date('2026-08-01T00:00:00.000Z'),
            new Date('2026-07-01T00:00:00.000Z'),
            new Date('2026-08-01T00:00:00.000Z'),
          ),
        ),
      existeBaseConfigurado: jest.fn(),
      buscarPorId: jest.fn(),
    };
    const cronogramaUsuarioRepository = {
      buscarPorUsuario: jest.fn().mockResolvedValue(null),
      crear: jest.fn().mockResolvedValue(undefined),
    };
    const modulo = await Test.createTestingModule({
      providers: [
        InicializarCronogramaUsuarioUseCase,
        {
          provide: CondicionesInicializacionUsuarioRepository,
          useValue: condicionesRepository,
        },
        { provide: CronogramaRepository, useValue: cronogramaRepository },
        {
          provide: CronogramaUsuarioRepository,
          useValue: cronogramaUsuarioRepository,
        },
      ],
    }).compile();
    const useCase = modulo.get(InicializarCronogramaUsuarioUseCase);

    const resultado = await useCase.execute(
      idUsuario,
      new Date('2026-09-04T12:00:00.000Z'),
    );

    expect(resultado.estado_operacion).toBe('INICIALIZADO');
    expect(cronogramaUsuarioRepository.crear).toHaveBeenCalledTimes(1);
    await modulo.close();
  });

  it('RF-15 recorre el job, registra la salida y entrega al módulo autorizado', async () => {
    const idContenido = '00000000-0000-4000-8000-000000000004';
    const idContenidoCronograma = '00000000-0000-4000-8000-000000000005';
    const moduloChat = {
      id_modulo: '00000000-0000-4000-8000-000000000006',
      codigo_modulo: 'CHAT',
      nombre_modulo: 'Chat',
    };
    let eventoRegistrado: EventoContenido | null = null;
    const eventoRepository = {
      buscarCambiosPendientes: jest
        .fn()
        .mockResolvedValue([
          new ContenidoEstadoPendiente(
            idContenidoCronograma,
            idContenido,
            idCronograma,
            EstadoContenido.ACTIVO,
            EstadoContenido.PROGRAMADO,
          ),
        ]),
      buscarModulosDestinoPorContenido: jest
        .fn()
        .mockResolvedValue(new Map([[idContenido, [moduloChat]]])),
      registrarSiNoExiste: jest.fn((evento: EventoContenido) => {
        eventoRegistrado = evento.marcarPersistido(10n);
        return Promise.resolve(eventoRegistrado);
      }),
      buscarEntregasPendientes: jest.fn(() =>
        Promise.resolve(
          eventoRegistrado
            ? [{ evento: eventoRegistrado, modulo: moduloChat }]
            : [],
        ),
      ),
      marcarEntregaPublicada: jest.fn().mockResolvedValue(undefined),
      registrarFalloEntrega: jest.fn().mockResolvedValue(undefined),
    };
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        PublicarEventosCambioEstadoUseCase,
        PublicarEventosContenidoCron,
        AutorizarConsumoEventoContenidoService,
        {
          provide: EventoContenidoRepository,
          useValue: eventoRepository,
        },
        {
          provide: EventoContenidoPublisher,
          useClass: NestEventoContenidoPublisher,
        },
      ],
    }).compile();
    await modulo.init();
    const recibido = jest.fn<void, [EventoContenido]>();
    modulo
      .get(EventEmitter2)
      .on(construirTopicoModuloEventoContenido('CHAT'), recibido);

    await modulo.get(PublicarEventosContenidoCron).ejecutar();

    expect(eventoRepository.registrarSiNoExiste).toHaveBeenCalledTimes(1);
    expect(recibido).toHaveBeenCalledTimes(1);
    expect(eventoRepository.marcarEntregaPublicada).toHaveBeenCalledWith(
      10n,
      moduloChat.id_modulo,
      expect.any(Date),
    );
    expect(eventoRepository.registrarFalloEntrega).not.toHaveBeenCalled();
    await modulo.close();
  });
});
