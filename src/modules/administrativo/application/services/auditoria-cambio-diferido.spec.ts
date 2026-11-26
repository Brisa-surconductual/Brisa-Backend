import type { RegistroAuditoria } from '../../domain/entities/auditoria/registro-auditoria.entity';
import type { Prisma } from '@prisma/client';
import { setTimeout as esperar } from 'node:timers/promises';
import { AuditoriaService } from './auditoria.service';

jest.mock('node:timers/promises', () => ({ setTimeout: jest.fn() }));

const ctx = {
  idUsuario: 'actor',
  idSesion: 'sesion',
  direccionIp: '127.0.0.1',
};
const accion = () => ({
  accion: 'GESTION_MENSAJES_NOTIFICACION' as const,
  recurso: 'MENSAJE_NOTIFICACION',
});
const tx = {} as Prisma.TransactionClient;

function preparar() {
  const encolar = jest
    .fn<Promise<void>, [RegistroAuditoria]>()
    .mockResolvedValue(undefined);
  const insertar = jest.fn().mockResolvedValue(undefined);
  const enTransaccion = <T>(
    consulta: (cliente: Prisma.TransactionClient) => Promise<T>,
  ) => consulta(tx);
  const auditoria = new AuditoriaService(
    {
      enTransaccion,
      insertar,
      listar: jest.fn(),
    },
    { encolar },
  );
  return { auditoria, encolar, insertar };
}

const esperarFondo = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

describe('Auditoría diferida posterior a un cambio confirmado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(esperar).mockResolvedValue(undefined);
  });

  it('no intenta auditar una escritura rechazada por el proveedor', async () => {
    const { auditoria, encolar, insertar } = preparar();
    const error = new Error('escritura rechazada');
    await expect(
      auditoria.ejecutarDiferido(ctx, () => Promise.reject(error), accion),
    ).rejects.toBe(error);
    expect(encolar).not.toHaveBeenCalled();
    expect(insertar).not.toHaveBeenCalled();
  });

  it('si Redis se recupera, reencola con el mismo identificador sin volver a ejecutar el cambio', async () => {
    const { auditoria, encolar, insertar } = preparar();
    encolar.mockRejectedValueOnce(new Error('cola no disponible'));
    const operacion = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('guardado');

    await expect(
      auditoria.ejecutarDiferido(ctx, operacion, accion),
    ).resolves.toBe('guardado');
    await esperarFondo();

    expect(operacion).toHaveBeenCalledTimes(1);
    expect(encolar).toHaveBeenCalledTimes(2);
    expect(encolar.mock.calls[1][0]).toBe(encolar.mock.calls[0][0]);
    expect(insertar).not.toHaveBeenCalled();
  });

  it('si la cola sigue caída, reintenta el registro con el mismo UUID en la bitácora', async () => {
    const { auditoria, encolar, insertar } = preparar();
    encolar.mockRejectedValue(new Error('cola no disponible'));
    insertar.mockRejectedValueOnce(
      new Error('PostgreSQL temporalmente no disponible'),
    );
    const operacion = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('guardado');

    await expect(
      auditoria.ejecutarDiferido(ctx, operacion, accion),
    ).resolves.toBe('guardado');
    await esperarFondo();

    expect(operacion).toHaveBeenCalledTimes(1);
    expect(jest.mocked(esperar).mock.calls.map(([ms]) => ms)).toEqual([
      1000, 2000,
    ]);
    const registro: unknown = encolar.mock.calls[0][0];
    expect(insertar.mock.calls).toEqual([
      [tx, registro, true],
      [tx, registro, true],
    ]);
  });
});
