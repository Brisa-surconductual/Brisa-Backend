import { BloquesNodoActual } from '../../domain/policies/bloques-nodo-actual.policy';
import { PrepararEntradaNodoActualService } from './preparar-entrada-nodo-actual.service';
import { PresentarBloquesNodoActualService } from './presentar-bloques-nodo-actual.service';
import { RecursoNodoActual } from '../ports/presentacion-nodo-actual.port';

describe('Presentación RF-26: bloques y entrada', () => {
  const entrada = new PrepararEntradaNodoActualService();
  const recurso: RecursoNodoActual = {
    idRecurso: 'recurso',
    tipo: 'VIDEO',
    orden: 1,
    texto: null,
    claveAlmacenamiento: 'cronograma/recursos/contenido/video',
    mimeType: 'video/mp4',
    duracionSegundos: 45,
    textoAlternativo: 'Video',
  };
  const firmar = { lectura: jest.fn() };
  const bloques = new PresentarBloquesNodoActualService(firmar);
  it('renueva una URL S3 histórica solo si su clave pertenece al contenido autorizado', async () => {
    const anterior = `https://bucket.test/${recurso.claveAlmacenamiento}?X-Amz-Signature=anterior`;
    const c = { bloques: [{ orden: 1, tipo: 'VIDEO', url: anterior }] };
    expect((await bloques.preparar(c, [recurso]))[0].url).toBe(
      'https://bucket.test/video?firma=nueva',
    );
    await expect(bloques.preparar(c, [])).rejects.toThrow();
  });
  it('presenta recursos asociados aunque el JSON anterior declare multimedia vacía', async () => {
    expect(
      (
        await bloques.preparar({ texto: 'Inicio', multimedia: [] }, [recurso])
      ).map((b) => b.tipo),
    ).toEqual(['TEXTO', 'VIDEO']);
  });
  it('no presenta URLs con credenciales ni recursos de texto vacíos', async () => {
    await expect(
      bloques.preparar(
        {
          bloques: [
            {
              orden: 1,
              tipo: 'IMAGEN',
              url: 'https://identidad@public.test/imagen',
            },
          ],
        },
        [],
      ),
    ).rejects.toThrow();
    await expect(
      bloques.preparar({}, [{ ...recurso, tipo: 'TEXTO', texto: '' }]),
    ).rejects.toThrow();
  });
  beforeEach(() =>
    firmar.lectura.mockReset().mockResolvedValue({
      url: 'https://bucket.test/video?firma=nueva',
      expiraEn: new Date(Date.now() + 300000).toISOString(),
    }),
  );
  it('ordena una copia y conserva el texto original', () => {
    const originales = [
      { orden: 2, tipo: 'TEXTO', texto: '  Segundo\n' },
      { orden: 1, tipo: 'INSTRUCCION', texto: 'Primero' },
    ];
    expect(new BloquesNodoActual().preparar({ bloques: originales })).toEqual([
      originales[1],
      originales[0],
    ]);
    expect(originales[0].orden).toBe(2);
  });
  it('adapta contenido anterior sin exigir una migración del JSON', async () => {
    const r = await bloques.preparar(
      {
        texto: 'Hola',
        instrucciones: 'Lee',
        multimedia: [{ url: 'https://public.test/foto.webp' }],
      },
      [],
    );
    expect(r.map((b) => b.tipo)).toEqual(['TEXTO', 'INSTRUCCION', 'IMAGEN']);
  });
  it('firma el video autorizado con metadata real del catálogo', async () => {
    const r = await bloques.preparar(
      { bloques: [{ orden: 1, tipo: 'VIDEO', idRecurso: 'recurso' }] },
      [recurso],
    );
    expect(r[0]).toMatchObject({
      tipo: 'VIDEO',
      url: 'https://bucket.test/video?firma=nueva',
      mimeType: 'video/mp4',
      duracionSegundos: 45,
    });
    expect(r[0]).not.toHaveProperty('claveAlmacenamiento');
  });
  it('renueva los enlaces sin modificar el JSON guardado', async () => {
    const c = {
      bloques: [
        {
          orden: 1,
          tipo: 'VIDEO',
          claveAlmacenamiento: recurso.claveAlmacenamiento,
          expiraEn: '2000-01-01T00:00:00Z',
        },
      ],
    };
    await bloques.preparar(c, [recurso]);
    await bloques.preparar(c, [recurso]);
    expect(firmar.lectura).toHaveBeenCalledTimes(2);
    expect(c.bloques[0].expiraEn).toBe('2000-01-01T00:00:00Z');
  });
  it('no permite firmar una clave de otro contenido', async () => {
    await expect(
      bloques.preparar(
        {
          bloques: [{ orden: 1, tipo: 'VIDEO', claveAlmacenamiento: 'ajena' }],
        },
        [recurso],
      ),
    ).rejects.toThrow();
    expect(firmar.lectura).not.toHaveBeenCalled();
  });
  it.each([
    'javascript:alert(1)',
    'http://public.test/recurso',
    'data:image/png;base64,abc',
  ])('rechaza URL insegura %s', async (url) => {
    await expect(
      bloques.preparar({ bloques: [{ orden: 1, tipo: 'IMAGEN', url }] }, []),
    ).rejects.toThrow();
  });
  it('rechaza URL vencida sin referencia renovable', async () => {
    await expect(
      bloques.preparar(
        {
          bloques: [
            {
              orden: 1,
              tipo: 'IMAGEN',
              url: 'https://public.test/foto',
              expiraEn: '2000-01-01T00:00:00Z',
            },
          ],
        },
        [],
      ),
    ).rejects.toThrow();
  });
  it.each([{}, { texto: '' }, { bloques: [] }, { bloques: null }])(
    'detecta contenido vacío %p',
    async (c) => {
      await expect(bloques.preparar(c, [])).rejects.toThrow();
    },
  );
  it('incorpora recursos del cronograma sin duplicar bloques explícitos', async () => {
    expect(
      (await bloques.preparar({ texto: 'Inicio' }, [recurso])).map(
        (b) => b.tipo,
      ),
    ).toEqual(['TEXTO', 'VIDEO']);
    expect(
      await bloques.preparar(
        { bloques: [{ orden: 1, tipo: 'TEXTO', texto: 'Solo texto' }] },
        [recurso],
      ),
    ).toHaveLength(1);
  });
  it('no inventa entrada en un mensaje', () =>
    expect(entrada.preparar({}, [])).toBeNull());
  it('mantiene cero y false explícitos en la configuración', () => {
    expect(
      entrada.preparar(
        {
          entrada: {
            tipo: 'ESCALA',
            obligatorio: false,
            min: 0,
            max: 10,
            paso: 1,
          },
        },
        [],
      ),
    ).toMatchObject({
      tipo: 'ESCALA',
      obligatorio: false,
      min: 0,
      max: 10,
      paso: 1,
    });
  });
  it.each([
    'BOOLEANO',
    'FECHA_HORA',
    'TEXTO_LIBRE',
    'NUMERICO',
    'SELECCION_UNICA',
    'SELECCION_MULTIPLE',
  ])('presenta %s sin validar ninguna respuesta', (tipo) => {
    expect(entrada.preparar({ entrada: { tipo } }, [])?.tipo).toBe(tipo);
  });
  it('toma alternativas de las reglas existentes y conserva etiquetas', () => {
    const r = entrada.preparar(
      {
        entrada: {
          tipo_entrada: 'SELECCION_UNICA',
          opciones: [{ valor: 'a', etiqueta: 'Primera' }],
        },
      },
      [
        {
          obligatorio: true,
          valorMin: null,
          valorMax: null,
          valoresPermitidos: ['a'],
        },
      ],
    );
    expect(r?.opciones).toEqual([{ valor: 'a', etiqueta: 'Primera' }]);
  });
});
