import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PrismaSesionConversacionalRepository } from './prisma-sesion-conversacional.repository';
import { PrismaSeudonimoParticipanteAdapter } from './prisma-seudonimo-participante.adapter';

/** Texto SQL de una llamada a $queryRaw (plantilla etiquetada). */
const sqlDe = (llamada: unknown[]): string =>
  (llamada[0] as TemplateStringsArray).join('?');
const parametrosDe = (llamada: unknown[]): unknown[] => llamada.slice(1);

describe('PrismaSesionConversacionalRepository.listarPorUsuario (RF-38)', () => {
  const idUsuario = '00000000-0000-4000-8000-000000000002';
  const queryRaw = jest.fn<Promise<unknown>, unknown[]>();
  const transaction = jest.fn();
  const prisma = {
    $transaction: transaction,
  } as unknown as PrismaService;
  const repository = new PrismaSesionConversacionalRepository(prisma);

  const fila = (n: number) => ({
    id_sesion: `00000000-0000-4000-8000-00000000000${n}`,
    id_usuario: idUsuario,
    modalidad: 'GRUPAL',
    estado: 'COMPLETADA',
    fecha_inicio: new Date('2026-11-20T14:00:00.000Z'),
    fecha_ultima_interaccion: new Date('2026-11-20T14:20:00.123Z'),
    marca_orden: `2026-11-20T14:20:00.12345${n}Z`,
  });

  beforeEach(() => {
    queryRaw.mockReset();
    transaction
      .mockReset()
      .mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
        fn({ $queryRaw: queryRaw }),
      );
  });

  it('lee página y total en la misma transacción RepeatableRead', async () => {
    queryRaw
      .mockResolvedValueOnce([fila(3), fila(2), fila(1)])
      .mockResolvedValueOnce([{ total: 7 }]);

    const pagina = await repository.listarPorUsuario(idUsuario, 2, null);

    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
    expect(pagina.total).toBe(7);
    expect(pagina.hayMas).toBe(true);
    expect(pagina.sesiones.map((s) => s.idSesion)).toEqual([
      fila(3).id_sesion,
      fila(2).id_sesion,
    ]);
    expect(pagina.sesiones[1]).toMatchObject({
      idUsuario,
      modalidad: 'GRUPAL',
      estado: 'COMPLETADA',
      marcaOrden: '2026-11-20T14:20:00.123452Z',
    });
  });

  it('filtra por el usuario, ordena de forma determinista y pide límite + 1', async () => {
    queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    const pagina = await repository.listarPorUsuario(idUsuario, 20, null);
    const [listado, conteo] = queryRaw.mock.calls;

    expect(pagina).toEqual({ sesiones: [], total: 0, hayMas: false });
    expect(sqlDe(listado)).toContain('WHERE s.id_usuario = ?::uuid');
    expect(sqlDe(listado)).toContain(
      'ORDER BY s.fecha_ultima_interaccion DESC, s.id_sesion DESC',
    );
    expect(parametrosDe(listado)).toEqual([idUsuario, null, null, null, 21]);
    expect(sqlDe(conteo)).toContain('WHERE s.id_usuario = ?::uuid');
    expect(parametrosDe(conteo)).toEqual([idUsuario]);
  });

  it('continúa después del cursor con la marca exacta (keyset)', async () => {
    queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);
    const cursor = {
      fechaUltimaInteraccion: '2026-11-20T14:20:00.123456Z',
      idSesion: '00000000-0000-4000-8000-000000000001',
    };

    await repository.listarPorUsuario(idUsuario, 5, cursor);
    const [listado] = queryRaw.mock.calls;

    expect(sqlDe(listado)).toContain(
      '(s.fecha_ultima_interaccion, s.id_sesion)',
    );
    expect(parametrosDe(listado)).toEqual([
      idUsuario,
      cursor.fechaUltimaInteraccion,
      cursor.fechaUltimaInteraccion,
      cursor.idSesion,
      6,
    ]);
  });
});

describe('PrismaSeudonimoParticipanteAdapter.resolver (RF-38)', () => {
  const queryRaw = jest.fn<Promise<unknown>, unknown[]>();
  const adapter = new PrismaSeudonimoParticipanteAdapter({
    $queryRaw: queryRaw,
  } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('lee la tabla de seudónimos sin crear códigos', async () => {
    queryRaw.mockResolvedValue([{ id_usuario: 'u-1' }]);

    expect(await adapter.resolver('P-1A2B3C4D')).toBe('u-1');
    const [llamada] = queryRaw.mock.calls;
    expect(sqlDe(llamada)).toContain(
      'FROM administrativo.seudonimos_participante',
    );
    expect(sqlDe(llamada)).not.toContain('fn_obtener_codigo_participante');
    expect(sqlDe(llamada)).not.toMatch(/INSERT|UPDATE|DELETE/i);
    expect(parametrosDe(llamada)).toEqual(['P-1A2B3C4D']);
  });

  it('código inexistente: null', async () => {
    queryRaw.mockResolvedValue([]);

    expect(await adapter.resolver('P-FFFFFFFF')).toBeNull();
  });
});
