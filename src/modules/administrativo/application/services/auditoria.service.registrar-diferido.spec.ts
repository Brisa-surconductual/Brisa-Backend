import type { Prisma } from '@prisma/client';
import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';
import type { ContextoAuditoria } from '../../domain/results/contexto-auditoria';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService.registrarDiferido (RF-136, RF-137)', () => {
  const tx = {} as Prisma.TransactionClient;
  const ctx: ContextoAuditoria = {
    idUsuario: 'a0000000-0000-4000-8000-000000000002',
    idSesion: 's0000000-0000-4000-8000-000000000001',
    direccionIp: '127.0.0.1',
  };
  const evento = {
    accion: 'CONFIGURACION_UMBRALES' as const,
    recurso: 'UMBRAL_SEGUIMIENTO',
    estado: 'EXITOSA' as const,
    severidad: 'ALTA' as const,
    detalle: {
      tipo_umbral: 'CRAVING_ELEVADO',
      valor_anterior: 3,
      valor_nuevo: 4,
      unidad_medida: 'puntaje',
      justificacion_cambio: null,
    },
  };

  const encolar = jest.fn<Promise<void>, [RegistroAuditoria]>();
  const insertar = jest.fn<
    Promise<void>,
    [Prisma.TransactionClient, RegistroAuditoria, boolean]
  >();
  const servicio = new AuditoriaService(
    {
      enTransaccion: <T>(op: (t: Prisma.TransactionClient) => Promise<T>) =>
        op(tx),
      insertar,
      listar: jest.fn(),
    },
    { encolar },
  );

  beforeEach(() => {
    encolar.mockReset().mockResolvedValue(undefined);
    insertar.mockReset().mockResolvedValue(undefined);
  });

  it('encola el registro completo en auditoria-diferida', async () => {
    await expect(servicio.registrarDiferido(ctx, evento)).resolves.toBe(
      'ENCOLADO',
    );
    expect(encolar).toHaveBeenCalledWith(
      expect.objectContaining({
        id_auditoria: expect.any(String) as unknown,
        idUsuario: ctx.idUsuario,
        accion: 'CONFIGURACION_UMBRALES',
        recurso_afectado: 'UMBRAL_SEGUIMIENTO',
        estado_accion: 'EXITOSA',
        severidad: 'ALTA',
        detalle: evento.detalle,
      }),
    );
    expect(insertar).not.toHaveBeenCalled();
  });

  it('si no puede encolar, inserta directo como diferido (idempotente) con el mismo id', async () => {
    encolar.mockRejectedValue(new Error('Redis caído'));
    await expect(servicio.registrarDiferido(ctx, evento)).resolves.toBe(
      'REGISTRADO_DIRECTO',
    );
    const [[encolado]] = encolar.mock.calls;
    expect(insertar).toHaveBeenCalledWith(tx, encolado, true);
  });

  it('si también falla la bitácora, queda PENDIENTE y no lanza', async () => {
    encolar.mockRejectedValue(new Error('Redis caído'));
    insertar.mockRejectedValue(new Error('base caída'));
    await expect(servicio.registrarDiferido(ctx, evento)).resolves.toBe(
      'PENDIENTE',
    );
  });
});
