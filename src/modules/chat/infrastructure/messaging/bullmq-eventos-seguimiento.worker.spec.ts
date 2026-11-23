import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTO_SESION_FINALIZADA } from '../../application/ports/evento-sesion-finalizada';
import {
  EVENTO_SOS_ACTIVADO,
  EventoSeguimientoChat,
} from '../../application/ports/evento-sos-activado';
import {
  EstadoIntervencionSos,
  EstadoSesionAnteriorSos,
} from '../../domain/enums/intervencion-sos.enum';
import { ModalidadConversacional } from '../../domain/enums/modalidad-conversacional-enum';
import { PrismaEventosSeguimientoRepository } from '../persistence/prisma-eventos-seguimiento.repository';
import {
  BullMqEventosSeguimientoWorker,
  TOPICO_POR_TIPO,
} from './bullmq-eventos-seguimiento.worker';

const sos: EventoSeguimientoChat = {
  id_evento: '00000000-0000-4000-8000-000000000001',
  tipo: 'CHAT_SOS_ACTIVADO',
  version: '1.0',
  id_usuario: '00000000-0000-4000-8000-000000000002',
  id_intervencion: '00000000-0000-4000-8000-000000000003',
  timestamp_craving: '2026-11-20T09:40:00.000Z',
  tipo_craving: null,
  duracion_intervencion: 15,
  estado_intervencion: EstadoIntervencionSos.INCOMPLETA,
  nivel_craving: 5,
  estado_sesion_anterior: EstadoSesionAnteriorSos.ACTIVA,
};

const cierre: EventoSeguimientoChat = {
  id_evento: '00000000-0000-4000-8000-000000000004',
  tipo: 'CHAT_SESION_FINALIZADA',
  version: '1.0',
  id_usuario: '00000000-0000-4000-8000-000000000002',
  id_sesion: '00000000-0000-4000-8000-000000000005',
  modalidad: ModalidadConversacional.GRUPAL,
  tipo_dependencia: null,
  tipo_craving: null,
  origen_evento: 'CIERRE_SESION',
  timestamp: '2026-11-20T09:40:00.000Z',
};

describe('BullMqEventosSeguimientoWorker · ruteo por tipo (RF-39 / RF-43)', () => {
  let eventos: EventEmitter2;
  let repositorio: jest.Mocked<PrismaEventosSeguimientoRepository>;
  let worker: BullMqEventosSeguimientoWorker;
  const entregar = (evento: EventoSeguimientoChat) =>
    (
      worker as unknown as {
        entregar(e: EventoSeguimientoChat): Promise<void>;
      }
    ).entregar(evento);

  beforeEach(() => {
    eventos = new EventEmitter2();
    repositorio = {
      estaPendiente: jest.fn().mockResolvedValue(true),
      marcarEntregado: jest.fn().mockResolvedValue(undefined),
      marcarError: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PrismaEventosSeguimientoRepository>;
    worker = new BullMqEventosSeguimientoWorker(repositorio, eventos);
  });

  it('cada tipo tiene su tópico', () => {
    expect(TOPICO_POR_TIPO).toEqual({
      CHAT_SESION_FINALIZADA: EVENTO_SESION_FINALIZADA,
      CHAT_SOS_ACTIVADO: EVENTO_SOS_ACTIVADO,
    });
  });

  it('entrega CHAT_SOS_ACTIVADO en chat.sos-activado y lo marca entregado', async () => {
    const recibido = jest.fn();
    const otro = jest.fn();
    eventos.on(EVENTO_SOS_ACTIVADO, recibido);
    eventos.on(EVENTO_SESION_FINALIZADA, otro);

    await entregar(sos);

    expect(recibido).toHaveBeenCalledWith(sos);
    expect(otro).not.toHaveBeenCalled();
    expect(repositorio.marcarEntregado).toHaveBeenCalledWith(sos.id_evento);
  });

  it('CHAT_SESION_FINALIZADA sigue en chat.sesion-finalizada', async () => {
    const recibido = jest.fn();
    eventos.on(EVENTO_SESION_FINALIZADA, recibido);

    await entregar(cierre);

    expect(recibido).toHaveBeenCalledWith(cierre);
  });

  it('sin listener de M05 para el tópico, marca error y reintenta', async () => {
    eventos.on(EVENTO_SESION_FINALIZADA, jest.fn());

    await expect(entregar(sos)).rejects.toThrow();

    expect(repositorio.marcarError).toHaveBeenCalledWith([sos.id_evento]);
    expect(repositorio.marcarEntregado).not.toHaveBeenCalled();
  });
});
