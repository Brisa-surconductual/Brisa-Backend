import { detectarCamposRestringidos } from './campos-restringidos.policy';

const PERMITIDOS = new Set([
  'nivel_progreso',
  'adherencia_min',
  'orden_campo',
  'limit',
]);

describe('detectarCamposRestringidos (RF-142 FA3)', () => {
  it.each([
    [{ incluir_texto: 'true' }, ['incluir_texto']],
    [
      { texto_diario: '1', mensajes_chat: '1' },
      ['texto_diario', 'mensajes_chat'],
    ],
    [{ correo: '1' }, ['correo']],
    [{ EMAIL: 'x' }, ['EMAIL']],
    [{ contenido_sesion: '1' }, ['contenido_sesion']],
    [{ campos: 'codigo,texto_diario' }, ['campos']],
    [{ incluir: ['nivel', 'mensajes'] }, ['incluir']],
  ])('detecta %j', (entrada, esperado) => {
    expect(detectarCamposRestringidos(entrada, PERMITIDOS)).toEqual(esperado);
  });

  it('no marca los parámetros permitidos ni los desconocidos inocuos', () => {
    expect(
      detectarCamposRestringidos(
        {
          nivel_progreso: 'EN_AVANCE',
          adherencia_min: '0.2',
          orden_campo: 'tasa_adherencia',
          limit: '20',
          pagina: '2',
        },
        PERMITIDOS,
      ),
    ).toEqual([]);
  });

  it.each([null, undefined, 'texto', ['texto_diario']])(
    'ignora entradas que no son objetos (%j)',
    (entrada) => {
      expect(detectarCamposRestringidos(entrada, PERMITIDOS)).toEqual([]);
    },
  );
});
