import { randomUUID } from 'node:crypto';
import { PasoConversacional } from '../ports/estado-conversacional.port';
import { EstadoConversacionalService } from './estado-conversacional.service';

describe('EstadoConversacionalService', () => {
  const servicio = new EstadoConversacionalService();
  const paso: PasoConversacional = {
    idSesion: randomUUID(),
    idUsuario: randomUUID(),
    idInteraccion: randomUUID(),
    idNodoOrigen: randomUUID(),
    idNodoDestino: randomUUID(),
    valor: 7,
    timestampInteraccion: '2026-11-20T15:00:00.123456Z',
    ahora: new Date('2026-11-20T15:00:01Z'),
    esTerminal: false,
  };

  function transaccion() {
    return {
      insertarPaso: jest.fn().mockResolvedValue(undefined),
      avanzarDesdeOrigen: jest.fn().mockResolvedValue(true),
      actualizarEstado: jest.fn().mockResolvedValue(undefined),
      validarHistorial: jest.fn().mockResolvedValue(true),
    };
  }

  it.each([false, true])(
    'registra el paso en orden (terminal: %s)',
    async (esTerminal) => {
      const tx = transaccion();
      const entrada = { ...paso, esTerminal };
      await servicio.registrarPaso(tx, entrada);

      expect(tx.insertarPaso).toHaveBeenCalledWith(entrada);
      expect(tx.avanzarDesdeOrigen).toHaveBeenCalledWith(entrada);
      expect(tx.actualizarEstado).toHaveBeenCalledWith(entrada);
      expect(tx.validarHistorial).toHaveBeenCalledWith(paso.idSesion);
      const orden = [
        tx.insertarPaso,
        tx.avanzarDesdeOrigen,
        tx.actualizarEstado,
        tx.validarHistorial,
      ].map((operacion) => operacion.mock.invocationCallOrder[0]);
      expect(orden).toEqual([...orden].sort((a, b) => a - b));
    },
  );

  it('devuelve 409 si el nodo actual ya no es el origen', async () => {
    const tx = transaccion();
    tx.avanzarDesdeOrigen.mockResolvedValue(false);
    await expect(servicio.registrarPaso(tx, paso)).rejects.toMatchObject({
      codigo: 'NODO_DESACTUALIZADO',
    });
    expect(tx.actualizarEstado).not.toHaveBeenCalled();
    expect(tx.validarHistorial).not.toHaveBeenCalled();
  });

  it('devuelve 422 si el historial no es consistente', async () => {
    const tx = transaccion();
    tx.validarHistorial.mockResolvedValue(false);
    await expect(servicio.registrarPaso(tx, paso)).rejects.toMatchObject({
      status: 422,
      response: { codigo: 'HISTORIAL_INCONSISTENTE' },
    });
  });

  it('propaga el fallo de escritura para revertir la transacción', async () => {
    const tx = transaccion();
    const fallo = new Error('error de persistencia');
    tx.insertarPaso.mockRejectedValue(fallo);
    await expect(servicio.registrarPaso(tx, paso)).rejects.toBe(fallo);
    expect(tx.avanzarDesdeOrigen).not.toHaveBeenCalled();
  });
});
