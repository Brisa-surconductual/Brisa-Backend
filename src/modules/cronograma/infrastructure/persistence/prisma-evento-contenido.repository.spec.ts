import { Prisma } from '@prisma/client';
import { EventoContenido } from '../../domain/entities/evento-contenido.entity';
import { EstadoContenido } from '../../domain/enums/estado-contenido.enum';
import { PrismaEventoContenidoRepository } from './prisma-evento-contenido.repository';

interface BuscarRecursosArgs {
  select: {
    recursos_modulos_destino: {
      where: { modulos_sistema: { activo: boolean } };
    };
  };
}

describe('PrismaEventoContenidoRepository (RF-15)', () => {
  const idContenidoCronograma = '00000000-0000-4000-8000-000000000001';
  const idContenido = '00000000-0000-4000-8000-000000000002';
  const idCronograma = '00000000-0000-4000-8000-000000000003';
  const idModulo = '00000000-0000-4000-8000-000000000010';
  const queryRaw = jest.fn<Promise<unknown[]>, [Prisma.Sql]>();
  const executeRaw = jest.fn<Promise<number>, [Prisma.Sql]>();
  const buscarRecursos = jest.fn<Promise<unknown[]>, [BuscarRecursosArgs]>();
  const prisma = {
    $queryRaw: queryRaw,
    $executeRaw: executeRaw,
    $transaction: jest.fn(
      (operacion: (transaccion: unknown) => Promise<unknown>) =>
        operacion({ $queryRaw: queryRaw, $executeRaw: executeRaw }),
    ),
    recursos_contenido: { findMany: buscarRecursos },
  };
  let repository: PrismaEventoContenidoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    executeRaw.mockResolvedValue(1);
    repository = new PrismaEventoContenidoRepository(prisma as never);
  });

  it('consulta la vista y compara con el último evento publicado', async () => {
    queryRaw.mockResolvedValue([
      {
        id_contenido_cronograma: idContenidoCronograma,
        id_contenido: idContenido,
        id_cronograma: idCronograma,
        estado_actual: 'ACTIVO',
        ultimo_estado_publicado: 'PROGRAMADO',
      },
    ]);

    const resultado = await repository.buscarCambiosPendientes(100);

    expect(resultado[0].estado_actual).toBe(EstadoContenido.ACTIVO);
    expect(resultado[0].ultimo_estado_publicado).toBe(
      EstadoContenido.PROGRAMADO,
    );
    expect(sqlEjecutado(0)).toContain('cronograma.v_contenidos_estado');
    expect(sqlEjecutado(0)).toContain('ORDER BY evento.id_evento DESC');
  });

  it('obtiene y deduplica solo los módulos activos asociados a los recursos', async () => {
    buscarRecursos.mockResolvedValue([
      recursoConDestino(),
      recursoConDestino(),
    ]);

    const resultado = await repository.buscarModulosDestinoPorContenido([
      idContenido,
    ]);

    expect(
      buscarRecursos.mock.calls[0][0].select.recursos_modulos_destino.where,
    ).toEqual({ modulos_sistema: { activo: true } });
    expect(resultado.get(idContenido)).toEqual([
      {
        id_modulo: idModulo,
        codigo_modulo: 'CHAT',
        nombre_modulo: 'Chat',
      },
    ]);
  });

  it('inserta de forma idempotente con ON CONFLICT DO NOTHING', async () => {
    queryRaw.mockResolvedValue([{ id_evento: 25n }]);

    const resultado = await repository.registrarSiNoExiste(evento());

    expect(sqlEjecutado(0)).toContain(
      'ON CONFLICT (id_contenido_cronograma, estado_nuevo) DO NOTHING',
    );
    expect(sqlEjecutado(0)).toContain('CAST(? AS jsonb)');
    expect(sqlActualizacion(0)).toContain(
      'INSERT INTO cronograma.entregas_evento_contenido',
    );
    expect(resultado?.id_evento).toBe(25n);
  });

  it('retorna null cuando la unicidad descarta el evento duplicado', async () => {
    queryRaw.mockResolvedValue([]);

    await expect(repository.registrarSiNoExiste(evento())).resolves.toBeNull();
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rehidrata las entregas pendientes de módulos activos', async () => {
    const eventoPersistido = evento().marcarPersistido(25n);
    queryRaw.mockResolvedValue([
      {
        id_evento: 25n,
        id_contenido_cronograma: idContenidoCronograma,
        id_cronograma: idCronograma,
        estado_anterior: 'PROGRAMADO',
        estado_nuevo: 'ACTIVO',
        fecha_cambio: eventoPersistido.fecha_cambio,
        version_evento: eventoPersistido.version_evento,
        payload: eventoPersistido.payload,
        id_modulo: idModulo,
      },
    ]);

    const resultado = await repository.buscarEntregasPendientes(500);

    expect(sqlEjecutado(0)).toContain('cronograma.entregas_evento_contenido');
    expect(sqlEjecutado(0)).toContain('modulo.activo = true');
    expect(resultado).toHaveLength(1);
    expect(resultado[0].evento.id_evento).toBe(25n);
    expect(resultado[0].modulo.id_modulo).toBe(idModulo);
  });

  it('marca el éxito o fallo sin modificar el evento inmutable', async () => {
    const fecha = new Date('2026-08-26T14:01:00.000Z');

    await repository.marcarEntregaPublicada(25n, idModulo, fecha);
    await repository.registrarFalloEntrega(
      26n,
      idModulo,
      fecha,
      'listener failed',
    );

    expect(sqlActualizacion(0)).toContain('SET fecha_publicacion = ?');
    expect(sqlActualizacion(0)).not.toContain(
      'UPDATE cronograma.eventos_contenido',
    );
    expect(sqlActualizacion(1)).toContain(
      'intentos_publicacion = intentos_publicacion + 1',
    );
    expect(sqlActualizacion(1)).toContain('ultimo_error = ?');
  });

  function evento(): EventoContenido {
    return EventoContenido.crear(
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
          id_modulo: idModulo,
          codigo_modulo: 'CHAT',
          nombre_modulo: 'Chat',
        },
      ],
      new Date('2026-08-26T14:00:00.000Z'),
    );
  }

  function recursoConDestino() {
    return {
      id_contenido: idContenido,
      recursos_modulos_destino: [
        {
          modulos_sistema: {
            id_modulo: idModulo,
            codigo_modulo: 'CHAT',
            nombre_modulo: 'Chat',
          },
        },
      ],
    };
  }

  function sqlEjecutado(indice: number): string {
    const consulta = queryRaw.mock.calls[indice][0];
    return consulta.strings.join('?').replace(/\s+/g, ' ').trim();
  }

  function sqlActualizacion(indice: number): string {
    const consulta = executeRaw.mock.calls[indice][0];
    return consulta.strings.join('?').replace(/\s+/g, ' ').trim();
  }
});
