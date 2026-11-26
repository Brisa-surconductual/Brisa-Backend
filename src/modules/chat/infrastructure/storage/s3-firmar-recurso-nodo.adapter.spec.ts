import { S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { S3FirmarRecursoNodoAdapter } from './s3-firmar-recurso-nodo.adapter';

describe('S3FirmarRecursoNodoAdapter', () => {
  const anterior = {
    bucket: process.env.AWS_S3_BUCKET,
    ttl: process.env.AWS_S3_READ_EXPIRATION_SECONDS,
  };
  let s3: S3Client;
  let adapter: S3FirmarRecursoNodoAdapter;
  beforeEach(() => {
    process.env.AWS_S3_BUCKET = 'brisa-recursos-pruebas';
    delete process.env.AWS_S3_READ_EXPIRATION_SECONDS;
    s3 = new S3Client({
      region: 'us-east-1',
      credentials: { accessKeyId: randomUUID(), secretAccessKey: randomUUID() },
    });
    adapter = new S3FirmarRecursoNodoAdapter(s3);
  });
  afterEach(() => {
    s3.destroy();
    if (anterior.bucket === undefined) delete process.env.AWS_S3_BUCKET;
    else process.env.AWS_S3_BUCKET = anterior.bucket;
    if (anterior.ttl === undefined)
      delete process.env.AWS_S3_READ_EXPIRATION_SECONDS;
    else process.env.AWS_S3_READ_EXPIRATION_SECONDS = anterior.ttl;
  });
  it('firma GET con vencimiento coherente, sin descargar ni subir objetos', async () => {
    const enviar = jest.spyOn(s3, 'send');
    const r = await adapter.lectura('cronograma/recursos/contenido/imagen');
    const url = new URL(r.url);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    const inicio = url.searchParams.get('X-Amz-Date')!;
    const fecha = `${inicio.slice(0, 4)}-${inicio.slice(4, 6)}-${inicio.slice(6, 8)}T${inicio.slice(9, 11)}:${inicio.slice(11, 13)}:${inicio.slice(13, 15)}Z`;
    expect(Date.parse(r.expiraEn)).toBe(Date.parse(fecha) + 300000);
    expect(enviar).not.toHaveBeenCalled();
  });
  it.each(['0', '59', '3601', 'no-numero'])(
    'rechaza vencimiento inválido %s',
    async (ttl) => {
      process.env.AWS_S3_READ_EXPIRATION_SECONDS = ttl;
      await expect(adapter.lectura('clave')).rejects.toThrow();
    },
  );
  it('rechaza claves inseguras o ausencia de bucket', async () => {
    await expect(adapter.lectura('../privado')).rejects.toThrow();
    delete process.env.AWS_S3_BUCKET;
    await expect(adapter.lectura('clave')).rejects.toThrow();
  });
});
