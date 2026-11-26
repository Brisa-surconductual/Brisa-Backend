import { normalizarCodigoParticipante } from '../../domain/policies/codigo-participante.policy';
import {
  codificarCursorSesiones,
  decodificarCursorSesiones,
} from './cursor-sesiones-participante';

describe('Cursor del listado de sesiones (RF-38)', () => {
  const cursor = {
    fechaUltimaInteraccion: '2026-11-20T14:20:00.123456Z',
    idSesion: '00000000-0000-4000-8000-000000000001',
  };

  it('ida y vuelta conserva los microsegundos', () => {
    const texto = codificarCursorSesiones(cursor);

    expect(texto).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodificarCursorSesiones(texto)).toEqual(cursor);
  });

  it.each([
    ['no es base64url JSON', 'no-es-un-cursor'],
    ['JSON sin campos', Buffer.from('{}').toString('base64url')],
    [
      'fecha sin microsegundos',
      codificarCursorSesiones({
        ...cursor,
        fechaUltimaInteraccion: '2026-11-20T14:20:00.000Z',
      }),
    ],
    [
      'id que no es UUID',
      codificarCursorSesiones({ ...cursor, idSesion: 'x' }),
    ],
    ['un arreglo', Buffer.from('[1]').toString('base64url')],
  ])('rechaza un cursor alterado: %s', (_, texto) => {
    expect(decodificarCursorSesiones(texto)).toBeNull();
  });
});

describe('Código seudonimizado A7', () => {
  it('acepta el formato P- + 8 hexadecimales y lo normaliza a mayúscula', () => {
    expect(normalizarCodigoParticipante('P-1A2B3C4D')).toBe('P-1A2B3C4D');
    expect(normalizarCodigoParticipante('p-1a2b3c4d')).toBe('P-1A2B3C4D');
  });

  it.each([
    ['un UUID interno', '00000000-0000-4000-8000-000000000002'],
    ['letras no hexadecimales', 'P-1A2B3C4Z'],
    ['longitud distinta', 'P-1A2B3C4'],
    ['sin prefijo', '1A2B3C4D'],
    ['vacío', ''],
    ['no texto', 7],
  ])('rechaza %s', (_, valor) => {
    expect(normalizarCodigoParticipante(valor)).toBeNull();
  });
});
