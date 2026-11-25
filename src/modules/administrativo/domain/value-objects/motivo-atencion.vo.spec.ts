import { MotivoAtencionInvalidoException } from '../exceptions/gestion-alerta.exceptions';
import { MotivoAtencion } from './motivo-atencion.vo';

describe('MotivoAtencion', () => {
  it('recorta espacios y conserva el texto', () => {
    expect(
      MotivoAtencion.crear('  Se contactó al participante por teléfono.  ')
        .valor,
    ).toBe('Se contactó al participante por teléfono.');
  });

  it('acepta los límites de 10 y 500 caracteres', () => {
    expect(MotivoAtencion.crear('a'.repeat(10)).valor).toHaveLength(10);
    expect(MotivoAtencion.crear('a'.repeat(500)).valor).toHaveLength(500);
  });

  it.each([
    ['ausente', undefined],
    ['nulo', null],
    ['vacío', ''],
    ['solo espacios', '            '],
    ['demasiado corto', 'revisado'],
    ['demasiado largo', 'a'.repeat(501)],
    ['no textual', 123],
  ])('rechaza un motivo %s', (_caso, valor) => {
    expect(() => MotivoAtencion.crear(valor)).toThrow(
      MotivoAtencionInvalidoException,
    );
  });
});
