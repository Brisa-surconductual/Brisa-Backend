import { NodoConversacional } from '../../domain/entities/flujo/nodo-conversacional.entity';
import {
  EstadoSesionConversacional,
  SesionConversacional,
} from '../../domain/entities/sesion/sesion-conversacional.entity';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { RecuperarSesionTransaccion } from '../ports/recuperar-sesion-conversacional.port';
import { RecuperarSesionConversacionalService } from './recuperar-sesion-conversacional.service';

describe('RecuperarSesionConversacionalService (RF-32)', () => {
  const fecha = new Date('2026-11-20T10:00:00Z');
  const sesion = (
    idNodo: string | null,
    estado: EstadoSesionConversacional = 'ACTIVA',
  ) =>
    new SesionConversacional(
      'sesion',
      'usuario',
      'flujo',
      3,
      ModalidadConversacional.GRUPAL,
      null,
      null,
      idNodo,
      estado,
      fecha,
      fecha,
    );
  const nodo = new NodoConversacional(
    'destino',
    'flujo',
    'tipo',
    'PREGUNTA',
    { texto: 'Continúa' },
    false,
    2,
    null,
    'admin',
    fecha,
    fecha,
  );
  const historial = { interacciones: [], hayMas: false };
  const tx = {
    bloquearSesion: jest.fn(),
    buscarNodo: jest.fn(),
    buscarUltimoDestino: jest.fn(),
    guardarReanudacion: jest.fn(),
    consultarHistorial: jest.fn(),
  };
  const servicio = new RecuperarSesionConversacionalService({
    ejecutar: <T>(
      operacion: (transaccion: RecuperarSesionTransaccion) => Promise<T>,
    ) => operacion(tx),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    tx.bloquearSesion.mockResolvedValue(sesion(nodo.idNodo));
    tx.buscarNodo.mockResolvedValue(nodo);
    tx.buscarUltimoDestino.mockResolvedValue(nodo.idNodo);
    tx.consultarHistorial.mockResolvedValue(historial);
  });

  it('recupera la sesión del propietario sin reescribir un puntero válido', async () => {
    await expect(
      servicio.recuperar('sesion', 'usuario'),
    ).resolves.toMatchObject({
      recuperadaDesdeHistorial: false,
      nodo,
      historial,
    });
    expect(tx.bloquearSesion).toHaveBeenCalledWith('sesion', 'usuario');
    expect(tx.consultarHistorial).toHaveBeenCalledWith({
      idSesion: 'sesion',
      antesDe: null,
      limite: 20,
    });
    expect(tx.guardarReanudacion).not.toHaveBeenCalled();
  });

  it.each([null, 'desactualizado'])(
    'restaura el puntero %s desde el destino registrado y reactiva una pausa',
    async (puntero) => {
      const anterior = sesion(puntero, 'PAUSADA');
      tx.bloquearSesion.mockResolvedValue(anterior);
      const resultado = await servicio.recuperar('sesion', 'usuario');
      expect(resultado).toMatchObject({
        recuperadaDesdeHistorial: true,
        sesion: {
          idNodoActual: nodo.idNodo,
          estadoActual: 'ACTIVA',
          versionArbolUtilizada: 3,
          fechaUltimaInteraccion: fecha,
        },
      });
      expect(tx.guardarReanudacion).toHaveBeenCalledWith(
        resultado?.sesion,
        anterior,
      );
      expect(tx.guardarReanudacion.mock.invocationCallOrder[0]).toBeLessThan(
        tx.consultarHistorial.mock.invocationCallOrder[0],
      );
    },
  );

  it('devuelve el error de configuración y conserva la sesión existente', async () => {
    tx.bloquearSesion.mockResolvedValue(sesion(null, 'ERROR_CONFIGURACION'));
    await expect(servicio.recuperar('sesion', 'usuario')).rejects.toMatchObject(
      { codigo: 'SESION_ERROR_CONFIGURACION' },
    );
    expect(tx.buscarUltimoDestino).not.toHaveBeenCalled();
    expect(tx.guardarReanudacion).not.toHaveBeenCalled();
  });

  it('permite iniciar otra sesión si la anterior terminó mientras se esperaba el bloqueo', async () => {
    tx.bloquearSesion.mockResolvedValue(sesion(nodo.idNodo, 'COMPLETADA'));
    await expect(servicio.recuperar('sesion', 'usuario')).resolves.toBeNull();
    expect(tx.consultarHistorial).not.toHaveBeenCalled();
  });

  it('devuelve ESTADO_INCONSISTENTE si faltan el puntero y un destino comprobable', async () => {
    tx.bloquearSesion.mockResolvedValue(sesion(null));
    tx.buscarUltimoDestino.mockResolvedValue(null);
    await expect(servicio.recuperar('sesion', 'usuario')).rejects.toMatchObject(
      { codigo: 'ESTADO_INCONSISTENTE' },
    );
    expect(tx.guardarReanudacion).not.toHaveBeenCalled();
  });

  it('rechaza un historial que sigue siendo inconsistente después de reparar el puntero', async () => {
    tx.bloquearSesion.mockResolvedValue(sesion(null));
    tx.consultarHistorial.mockResolvedValue(null);
    await expect(servicio.recuperar('sesion', 'usuario')).rejects.toMatchObject(
      { codigo: 'ESTADO_INCONSISTENTE' },
    );
    expect(tx.guardarReanudacion).toHaveBeenCalledTimes(1);
  });
});
