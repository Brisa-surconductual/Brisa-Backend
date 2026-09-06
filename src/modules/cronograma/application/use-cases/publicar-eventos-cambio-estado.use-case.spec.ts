import { ContenidoEstadoPendiente } from '../../domain/entities/contenido-estado-pendiente.entity';
import { EventoContenido } from '../../domain/entities/evento-contenido.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { EventoContenidoDuplicadoException } from '../../domain/exeption/evento-contenido-duplicado.exception';
import { PublicarEventosCambioEstadoUseCase } from './publicar-eventos-cambio-estado.use-case';

describe('PublicarEventosCambioEstadoUseCase (RF-15)', () => {
  const idContenidoCronograma = '00000000-0000-4000-8000-000000000001';
  const idContenido = '00000000-0000-4000-8000-000000000002';
  const idCronograma = '00000000-0000-4000-8000-000000000003';
  const fecha = new Date('2026-08-26T14:00:00.000Z');
  const repository = {
    buscarCambiosPendientes: jest.fn(),
    buscarModulosDestinoPorContenido: jest.fn(),
    registrarSiNoExiste: jest.fn(),
    buscarEntregasPendientes: jest.fn(),
    marcarEntregaPublicada: jest.fn(),
    registrarFalloEntrega: jest.fn(),
  };
  const publisher = { publicar: jest.fn() };
  let useCase: PublicarEventosCambioEstadoUseCase;
  let eventosRegistrados: EventoContenido[];

  beforeEach(() => {
    jest.clearAllMocks();
    eventosRegistrados = [];
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
          ],
        ],
      ]),
    );
    repository.registrarSiNoExiste.mockImplementation(
      (evento: EventoContenido) => {
        const registrado = evento.marcarPersistido(
          BigInt(eventosRegistrados.length + 1),
        );
        eventosRegistrados.push(registrado);
        return Promise.resolve(registrado);
      },
    );
    repository.buscarEntregasPendientes.mockImplementation(() =>
      Promise.resolve(
        eventosRegistrados.flatMap((evento) =>
          evento.payload.modulos_destino.map((modulo) => ({ evento, modulo })),
        ),
      ),
    );
    repository.marcarEntregaPublicada.mockResolvedValue(undefined);
    repository.registrarFalloEntrega.mockResolvedValue(undefined);
    publisher.publicar.mockResolvedValue(undefined);
    useCase = new PublicarEventosCambioEstadoUseCase(repository, publisher);
  });

  it('persiste y publica únicamente la secuencia válida pendiente', async () => {
    repository.buscarCambiosPendientes.mockResolvedValue([
      pendiente(EstadoContenido.FINALIZADO, EstadoContenido.PROGRAMADO),
    ]);

    const resultado = await useCase.execute(fecha);

    expect(repository.registrarSiNoExiste).toHaveBeenCalledTimes(2);
    const eventos = repository.registrarSiNoExiste.mock.calls.map(
      ([evento]: [EventoContenido]) => evento,
    );
    expect(eventos.map((evento) => evento.estado_nuevo)).toEqual([
      EstadoContenido.ACTIVO,
      EstadoContenido.FINALIZADO,
    ]);
    expect(publisher.publicar).toHaveBeenCalledTimes(2);
    expect(resultado).toEqual({
      contenidos_revisados: 1,
      eventos_publicados: 2,
      eventos_duplicados: 0,
      cambios_invalidos: 0,
      contenidos_sin_modulos: 0,
      entregas_publicadas: 2,
      entregas_fallidas: 0,
    });
  });

  it('no publica un INSERT descartado por ON CONFLICT', async () => {
    repository.buscarCambiosPendientes.mockResolvedValue([
      pendiente(EstadoContenido.ACTIVO, EstadoContenido.PROGRAMADO),
    ]);
    repository.registrarSiNoExiste.mockResolvedValue(null);

    const resultado = await useCase.execute(fecha);

    expect(publisher.publicar).not.toHaveBeenCalled();
    expect(resultado.eventos_duplicados).toBe(1);
    expect(resultado.eventos_publicados).toBe(0);
    expect(new EventoContenidoDuplicadoException().getStatus()).toBe(409);
  });

  it('omite una regresión inválida sin bloquear los demás contenidos', async () => {
    repository.buscarCambiosPendientes.mockResolvedValue([
      pendiente(EstadoContenido.ACTIVO, EstadoContenido.FINALIZADO),
    ]);

    const resultado = await useCase.execute(fecha);

    expect(repository.registrarSiNoExiste).not.toHaveBeenCalled();
    expect(resultado.cambios_invalidos).toBe(1);
  });

  it('conserva como pendiente una entrega fallida para reintentarla', async () => {
    repository.buscarCambiosPendientes.mockResolvedValue([
      pendiente(EstadoContenido.ACTIVO, EstadoContenido.PROGRAMADO),
    ]);
    publisher.publicar.mockRejectedValue(new Error('listener failed'));

    const resultado = await useCase.execute(fecha);

    expect(repository.registrarFalloEntrega).toHaveBeenCalledWith(
      1n,
      '00000000-0000-4000-8000-000000000010',
      expect.any(Date),
      'listener failed',
    );
    expect(repository.marcarEntregaPublicada).not.toHaveBeenCalled();
    expect(resultado.eventos_publicados).toBe(0);
    expect(resultado.entregas_fallidas).toBe(1);
  });

  it('reintenta entregas antiguas aunque no haya nuevos cambios de estado', async () => {
    repository.buscarCambiosPendientes.mockResolvedValue([]);
    const evento = EventoContenido.crear(
      {
        id_contenido_cronograma: idContenidoCronograma,
        id_contenido: idContenido,
        id_cronograma: idCronograma,
      },
      {
        estado_anterior: EstadoContenido.PROGRAMADO,
        estado_nuevo: EstadoContenido.ACTIVO,
      },
      [
        {
          id_modulo: '00000000-0000-4000-8000-000000000010',
          codigo_modulo: 'CHAT',
          nombre_modulo: 'Chat',
        },
      ],
      fecha,
    ).marcarPersistido(25n);
    repository.buscarEntregasPendientes.mockResolvedValue([
      { evento, modulo: evento.payload.modulos_destino[0] },
    ]);

    const resultado = await useCase.execute(fecha);

    expect(publisher.publicar).toHaveBeenCalledWith(
      evento,
      evento.payload.modulos_destino[0],
    );
    expect(repository.marcarEntregaPublicada).toHaveBeenCalledWith(
      25n,
      '00000000-0000-4000-8000-000000000010',
      expect.any(Date),
    );
    expect(resultado.eventos_publicados).toBe(1);
  });

  it('aplaza el evento mientras el contenido no tenga módulos activos', async () => {
    repository.buscarCambiosPendientes.mockResolvedValue([
      pendiente(EstadoContenido.ACTIVO, EstadoContenido.PROGRAMADO),
    ]);
    repository.buscarModulosDestinoPorContenido.mockResolvedValue(
      new Map([[idContenido, []]]),
    );

    const resultado = await useCase.execute(fecha);

    expect(repository.registrarSiNoExiste).not.toHaveBeenCalled();
    expect(resultado.contenidos_sin_modulos).toBe(1);
  });

  function pendiente(
    actual: EstadoContenido,
    ultimo: EstadoContenido | null,
  ): ContenidoEstadoPendiente {
    return new ContenidoEstadoPendiente(
      idContenidoCronograma,
      idContenido,
      idCronograma,
      actual,
      ultimo,
    );
  }
});
