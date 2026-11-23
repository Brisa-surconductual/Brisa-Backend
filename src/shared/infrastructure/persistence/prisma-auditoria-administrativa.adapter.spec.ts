import { PrismaService } from '../../../../prisma/prisma.service';
import { EventoAuditoriaAdministrativa } from '../../application/ports/auditoria-administrativa.port';
import { PrismaAuditoriaAdministrativaAdapter } from './prisma-auditoria-administrativa.adapter';

const sqlDe = (llamada: unknown[]): string =>
  (llamada[0] as TemplateStringsArray).join('?');

const evento: EventoAuditoriaAdministrativa = {
  actor: {
    idUsuario: '00000000-0000-4000-8000-0000000000ad',
    idSesionAutenticacion: '00000000-0000-4000-8000-0000000a0701',
    direccionIp: '203.0.113.7',
  },
  accion: 'CONSULTA_PARTICIPANTE',
  recursoAfectado: 'trazabilidad_sesion_chat',
  idRecurso: '00000000-0000-4000-8000-000000000001',
  idParticipante: '00000000-0000-4000-8000-000000000002',
  estado: 'EXITOSA',
  detalle: { operacion: 'CONSULTAR_TRAZABILIDAD_SESION' },
};

describe('PrismaAuditoriaAdministrativaAdapter (RF-123)', () => {
  const queryRaw = jest.fn<Promise<unknown>, unknown[]>();
  const adapter = new PrismaAuditoriaAdministrativaAdapter({
    $queryRaw: queryRaw,
  } as unknown as PrismaService);

  beforeEach(() =>
    queryRaw.mockReset().mockResolvedValue([{ id_auditoria: 'id-1' }]),
  );

  it('invoca la función existente con parámetros nominales, sin escribir en la tabla', async () => {
    expect(await adapter.registrar(evento)).toBe('id-1');

    const [llamada] = queryRaw.mock.calls;
    const sql = sqlDe(llamada);
    expect(sql).toContain('administrativo.fn_registrar_auditoria(');
    expect(sql).not.toMatch(/INSERT|UPDATE|DELETE/i);
    expect(sql).toContain('p_id_sesion => ?::uuid');
    expect(sql).toContain('p_accion => ?::administrativo.accion_admin_enum');
    expect(sql).toContain('p_estado => ?::administrativo.estado_accion_enum');
    expect(sql).toContain('p_diferido => false');
    // Severidad: la de la función (RF-123 no la define).
    expect(sql).not.toContain('p_severidad');
    expect(llamada.slice(1)).toEqual([
      evento.actor.idUsuario,
      evento.actor.idSesionAutenticacion,
      'CONSULTA_PARTICIPANTE',
      'trazabilidad_sesion_chat',
      evento.idRecurso,
      evento.idParticipante,
      '203.0.113.7',
      'EXITOSA',
      '{"operacion":"CONSULTAR_TRAZABILIDAD_SESION"}',
    ]);
  });

  it('propaga el error de la base de datos', async () => {
    queryRaw.mockRejectedValue(new Error('sin conexión'));

    await expect(adapter.registrar(evento)).rejects.toThrow('sin conexión');
  });

  it('sin identificador devuelto: error', async () => {
    queryRaw.mockResolvedValue([]);

    await expect(adapter.registrar(evento)).rejects.toThrow();
  });
});
