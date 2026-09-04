import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { TipoRecurso } from '../../domain/enums/tipo-recurso.enum';
import { S3AlmacenamientoRecursosAdapter } from './s3-almacenamiento-recursos.adapter';

describe('S3AlmacenamientoRecursosAdapter', () => {
  const idContenido = '00000000-0000-4000-8000-000000000001';
  const entornoOriginal = { ...process.env };
  let s3: S3Client;
  let adapter: S3AlmacenamientoRecursosAdapter;

  beforeEach(() => {
    process.env.AWS_S3_BUCKET = 'brisa-recursos-pruebas';
    process.env.AWS_S3_RESOURCE_PREFIX = 'cronograma/recursos';
    process.env.AWS_S3_UPLOAD_EXPIRATION_SECONDS = '300';
    s3 = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKIATEST',
        secretAccessKey: 'secret-test',
      },
    });
    adapter = new S3AlmacenamientoRecursosAdapter(s3);
  });

  afterAll(() => {
    process.env = entornoOriginal;
  });

  it('firma un PUT para el único bucket y prefijo configurados', async () => {
    const resultado = await adapter.crearUrlSubida({
      idContenido,
      tipoRecurso: TipoRecurso.IMAGEN,
      mimeType: 'image/png',
      tamanoBytes: 1024,
    });

    expect(resultado.claveAlmacenamiento).toMatch(
      new RegExp(`^cronograma/recursos/${idContenido}/[0-9a-f-]{36}$`, 'i'),
    );
    expect(resultado.url).toContain('brisa-recursos-pruebas');
    expect(resultado.url).toContain('X-Amz-Signature=');
    expect(resultado).toMatchObject({
      metodo: 'PUT',
      encabezados: { 'Content-Type': 'image/png' },
      expiraEnSegundos: 300,
    });
  });

  it('consulta MIME y tamaño mediante HeadObject', async () => {
    const send = jest.spyOn(s3, 'send').mockResolvedValue({
      ContentType: 'image/png',
      ContentLength: 1024,
    } as never);
    const clave = claveValida();

    const resultado = await adapter.obtenerMetadatos({
      idContenido,
      claveAlmacenamiento: clave,
    });

    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    expect(resultado).toEqual({ mimeType: 'image/png', tamanoBytes: 1024 });
  });

  it('rechaza una clave ajena al contenido sin consultar AWS', async () => {
    const send = jest.spyOn(s3, 'send');

    const resultado = await adapter.obtenerMetadatos({
      idContenido,
      claveAlmacenamiento: 'otro-prefijo/00000000-0000-4000-8000-000000000099',
    });

    expect(resultado).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it('trata un 404 de S3 como archivo no cargado', async () => {
    jest.spyOn(s3, 'send').mockRejectedValue({
      name: 'NotFound',
      $metadata: { httpStatusCode: 404 },
    });

    await expect(
      adapter.obtenerMetadatos({
        idContenido,
        claveAlmacenamiento: claveValida(),
      }),
    ).resolves.toBeNull();
  });

  it('retorna 503 si falta la configuración del bucket', async () => {
    delete process.env.AWS_S3_BUCKET;

    await expect(
      adapter.crearUrlSubida({
        idContenido,
        tipoRecurso: TipoRecurso.IMAGEN,
        mimeType: 'image/png',
        tamanoBytes: 1024,
      }),
    ).rejects.toMatchObject({ status: 503 });
  });

  function claveValida(): string {
    return `cronograma/recursos/${idContenido}/00000000-0000-4000-8000-000000000010`;
  }
});
