import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { S3_CLIENT } from '../../../cronograma/infrastructure/storage/s3-client.provider';
import { FirmarRecursoNodoPort } from '../../application/ports/presentacion-nodo-actual.port';

/** Solo firma GET del bucket configurado; no decide qué estudiante accede. */
@Injectable()
export class S3FirmarRecursoNodoAdapter implements FirmarRecursoNodoPort {
  constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}

  async lectura(claveAlmacenamiento: string) {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    const segundos = Number(
      process.env.AWS_S3_READ_EXPIRATION_SECONDS ?? '300',
    );
    if (
      !bucket ||
      !Number.isInteger(segundos) ||
      segundos < 60 ||
      segundos > 3600 ||
      !claveAlmacenamiento ||
      claveAlmacenamiento.includes('..') ||
      claveAlmacenamiento.startsWith('/')
    ) {
      throw new Error('Almacenamiento de lectura no disponible.');
    }
    const fecha = new Date(Math.floor(Date.now() / 1000) * 1000);
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: claveAlmacenamiento }),
      { expiresIn: segundos, signingDate: fecha },
    );
    return {
      url,
      expiraEn: new Date(fecha.getTime() + segundos * 1000).toISOString(),
    };
  }
}
