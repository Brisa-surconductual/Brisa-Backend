import { ModalidadConversacional } from '../../enums/modalidad-conversacional-enum';
import { SesionNoPausableException } from '../../exceptions/sesion.exceptions';
import {
  EstadoSesionConversacional,
  SesionConversacional,
} from './sesion-conversacional.entity';

const inicio = new Date('2026-11-20T09:00:00.000Z');
const ultima = new Date('2026-11-20T09:30:00.000Z');

function sesion(
  estado: EstadoSesionConversacional,
  modalidad = ModalidadConversacional.GRUPAL,
): SesionConversacional {
  return new SesionConversacional(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    1,
    modalidad,
    null,
    null,
    '00000000-0000-4000-8000-000000000004',
    estado,
    inicio,
    ultima,
  );
}

describe('SesionConversacional.pausar (RF-31 / RF-43)', () => {
  it('pasa de ACTIVA a PAUSADA conservando el nodo y la última interacción', () => {
    const pausada = sesion('ACTIVA').pausar();

    expect(pausada.estadoActual).toBe('PAUSADA');
    expect(pausada.idNodoActual).toBe('00000000-0000-4000-8000-000000000004');
    expect(pausada.fechaUltimaInteraccion).toBe(ultima);
    expect(pausada.fechaInicio).toBe(inicio);
  });

  it('la sesión pausada se reanuda en el mismo nodo (RF-32)', () => {
    const reanudada = sesion('ACTIVA').pausar().reanudar();

    expect(reanudada.estadoActual).toBe('ACTIVA');
    expect(reanudada.idNodoActual).toBe('00000000-0000-4000-8000-000000000004');
  });

  it.each<EstadoSesionConversacional>([
    'PAUSADA',
    'COMPLETADA',
    'ERROR_CONFIGURACION',
  ])('no pausa una sesión %s', (estado) => {
    expect(() => sesion(estado).pausar()).toThrow(SesionNoPausableException);
  });

  it('identifica la sesión SOS', () => {
    expect(sesion('ACTIVA', ModalidadConversacional.SOS).esSos).toBe(true);
    expect(sesion('ACTIVA').esSos).toBe(false);
  });
});
