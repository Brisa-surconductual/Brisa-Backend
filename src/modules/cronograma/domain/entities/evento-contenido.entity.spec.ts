import { ContenidoEstadoPendiente } from './contenido-estado-pendiente.entity';
import {
  EventoContenido,
  VERSION_EVENTO_CONTENIDO,
} from './evento-contenido.entity';
import { EstadoContenido } from '../enums/estado-contenido.enum';
import { CambioEstadoContenidoInvalidoException } from '../exeption/cambio-estado-contenido-invalido.exception';
import { DatosEventoContenidoInvalidosException } from '../exeption/datos-evento-contenido-invalidos.exception';

describe('EventoContenido y transiciones de estado (RF-15)', () => {
  const contenido = {
    id_contenido_cronograma: '00000000-0000-4000-8000-000000000001',
    id_contenido: '00000000-0000-4000-8000-000000000002',
    id_cronograma: '00000000-0000-4000-8000-000000000003',
  };

  it('completa en orden las transiciones válidas cuando el job inicia tarde', () => {
    const pendiente = new ContenidoEstadoPendiente(
      contenido.id_contenido_cronograma,
      contenido.id_contenido,
      contenido.id_cronograma,
      EstadoContenido.FINALIZADO,
      null,
    );

    expect(pendiente.obtenerTransicionesPendientes()).toEqual([
      { estado_anterior: null, estado_nuevo: EstadoContenido.PROGRAMADO },
      {
        estado_anterior: EstadoContenido.PROGRAMADO,
        estado_nuevo: EstadoContenido.ACTIVO,
      },
      {
        estado_anterior: EstadoContenido.ACTIVO,
        estado_nuevo: EstadoContenido.FINALIZADO,
      },
    ]);
  });

  it('rechaza una regresión de estado con HTTP 400', () => {
    const pendiente = new ContenidoEstadoPendiente(
      contenido.id_contenido_cronograma,
      contenido.id_contenido,
      contenido.id_cronograma,
      EstadoContenido.ACTIVO,
      EstadoContenido.FINALIZADO,
    );

    expect(() => pendiente.obtenerTransicionesPendientes()).toThrow(
      CambioEstadoContenidoInvalidoException,
    );
    expect(new CambioEstadoContenidoInvalidoException().getStatus()).toBe(400);
  });

  it('impide crear directamente un evento que salte estados', () => {
    expect(() =>
      EventoContenido.crear(
        contenido,
        {
          estado_anterior: EstadoContenido.PROGRAMADO,
          estado_nuevo: EstadoContenido.FINALIZADO,
        },
        [],
        new Date('2026-08-26T14:00:00.000Z'),
      ),
    ).toThrow(CambioEstadoContenidoInvalidoException);
  });

  it('crea un payload v1 inmutable, sin nulos y sin módulos repetidos', () => {
    const fecha = new Date('2026-08-26T14:00:00.000Z');
    const evento = EventoContenido.crear(
      contenido,
      { estado_anterior: null, estado_nuevo: EstadoContenido.PROGRAMADO },
      [
        {
          id_modulo: '00000000-0000-4000-8000-000000000010',
          codigo_modulo: 'CHAT',
          nombre_modulo: 'Chat',
        },
        {
          id_modulo: '00000000-0000-4000-8000-000000000010',
          codigo_modulo: 'CHAT',
          nombre_modulo: 'Chat',
        },
      ],
      fecha,
    );

    expect(evento.version_evento).toBe(VERSION_EVENTO_CONTENIDO);
    expect(evento.payload).not.toHaveProperty('estado_anterior');
    expect(evento.payload.modulos_destino).toHaveLength(1);
    expect(JSON.stringify(evento.payload)).not.toContain(':null');
    expect(Object.isFrozen(evento.payload)).toBe(true);
    expect(Object.isFrozen(evento.payload.modulos_destino)).toBe(true);
    expect(Object.isFrozen(evento.payload.modulos_destino[0])).toBe(true);
  });

  it('rechaza datos incompletos con HTTP 422', () => {
    expect(() =>
      EventoContenido.crear(
        { ...contenido, id_contenido: '' },
        {
          estado_anterior: EstadoContenido.PROGRAMADO,
          estado_nuevo: EstadoContenido.ACTIVO,
        },
        [],
        new Date('2026-08-26T14:00:00.000Z'),
      ),
    ).toThrow(DatosEventoContenidoInvalidosException);
    expect(new DatosEventoContenidoInvalidosException().getStatus()).toBe(422);
  });

  it('no permite generar un evento sin módulos destino', () => {
    expect(() =>
      EventoContenido.crear(
        contenido,
        {
          estado_anterior: EstadoContenido.PROGRAMADO,
          estado_nuevo: EstadoContenido.ACTIVO,
        },
        [],
        new Date('2026-08-26T14:00:00.000Z'),
      ),
    ).toThrow(DatosEventoContenidoInvalidosException);
  });

  it('rehidrata sin alterar el payload inmutable guardado para reintentos', () => {
    const original = EventoContenido.crear(
      contenido,
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
      new Date('2026-08-26T14:00:00.000Z'),
    ).marcarPersistido(25n);

    const rehidratado = EventoContenido.rehidratar({
      id_evento: 25n,
      id_contenido_cronograma: original.id_contenido_cronograma,
      id_cronograma: original.id_cronograma,
      estado_anterior: original.estado_anterior,
      estado_nuevo: original.estado_nuevo,
      fecha_cambio: original.fecha_cambio,
      version_evento: original.version_evento,
      payload: original.payload,
    });

    expect(rehidratado.payload).toEqual(original.payload);
    expect(Object.isFrozen(rehidratado.payload)).toBe(true);
  });
});
