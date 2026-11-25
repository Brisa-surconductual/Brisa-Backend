import {
  AlertaNoActivaException,
  AlertaYaAtendidaException,
} from '../exceptions/gestion-alerta.exceptions';
import { asegurarAlertaAtendible } from './atencion-alerta.policy';

describe('asegurarAlertaAtendible', () => {
  it.each(['ACTIVA', 'PENDIENTE', null, undefined] as const)(
    'permite atender una alerta en estado %s',
    (estado) => {
      expect(() => asegurarAlertaAtendible(estado, false)).not.toThrow();
    },
  );

  it('rechaza una alerta ya atendida en M-8 aunque M05 la informe activa', () => {
    expect(() => asegurarAlertaAtendible('ACTIVA', true)).toThrow(
      AlertaYaAtendidaException,
    );
  });

  it.each(['ATENDIDA', 'RESUELTA'] as const)(
    'rechaza como ya atendida una alerta %s en M05',
    (estado) => {
      expect(() => asegurarAlertaAtendible(estado, false)).toThrow(
        AlertaYaAtendidaException,
      );
    },
  );

  it.each(['EN_REVISION', 'DESCARTADA'] as const)(
    'rechaza como no activa una alerta %s',
    (estado) => {
      expect(() => asegurarAlertaAtendible(estado, false)).toThrow(
        AlertaNoActivaException,
      );
    },
  );
});
