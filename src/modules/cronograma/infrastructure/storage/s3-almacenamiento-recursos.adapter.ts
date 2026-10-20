import {
  HeadObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AlmacenamientoRecursosPort,
  MetadatosObjetoAlmacenado,
  SolicitudObjetoAlmacenado,
  SolicitudUrlSubidaRecurso,
  UrlSubidaRecurso,
} from '../../application/ports/almacenamiento-recursos.port';
import { AlmacenamientoRecursoNoDisponibleException } from '../../domain/exeption/recurso-contenido/almacenamiento-recurso-no-disponible.exception';
import { S3_CLIENT } from './s3-client.provider';

interface ConfiguracionS3Recursos {
  bucket: string;
  prefijo: string;
  expiracionSegundos: number;
}

@Injectable()
export class S3AlmacenamientoRecursosAdapter implements AlmacenamientoRecursosPort {
  constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}

  async crearUrlSubida(
    solicitud: SolicitudUrlSubidaRecurso,
  ): Promise<UrlSubidaRecurso> {
    const config = this.obtenerConfiguracion();
    const clave = `${config.prefijo}/${solicitud.idContenido.toLowerCase()}/${randomUUID()}`;

    try {
      const url = await getSignedUrl(
        this.s3,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: clave,
          ContentType: solicitud.mimeType,
        }),
        { expiresIn: config.expiracionSegundos },
      );

      return {
        claveAlmacenamiento: clave,
        url,
        metodo: 'PUT',
        encabezados: { 'Content-Type': solicitud.mimeType },
        expiraEnSegundos: config.expiracionSegundos,
      };
    } catch {
      throw new AlmacenamientoRecursoNoDisponibleException();
    }
  }

  async obtenerMetadatos(
    solicitud: SolicitudObjetoAlmacenado,
  ): Promise<MetadatosObjetoAlmacenado | null> {
    const config = this.obtenerConfiguracion();
    if (!this.clavePerteneceAlContenido(solicitud, config.prefijo)) {
      return null;
    }

    try {
      const resultado = await this.s3.send(
        new HeadObjectCommand({
          Bucket: config.bucket,
          Key: solicitud.claveAlmacenamiento,
        }),
      );

      return {
        mimeType: resultado.ContentType?.trim().toLowerCase() || null,
        tamanoBytes:
          resultado.ContentLength !== undefined &&
          Number.isSafeInteger(resultado.ContentLength)
            ? resultado.ContentLength
            : null,
      };
    } catch (error: unknown) {
      if (this.esNoEncontrado(error)) {
        return null;
      }
      throw new AlmacenamientoRecursoNoDisponibleException();
    }
  }

  async eliminarObjeto(solicitud: SolicitudObjetoAlmacenado): Promise<void> {
    const config = this.obtenerConfiguracion();
    if (!this.clavePerteneceAlContenido(solicitud, config.prefijo)) {
      throw new AlmacenamientoRecursoNoDisponibleException();
    }
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: solicitud.claveAlmacenamiento,
        }),
      );
    } catch {
      throw new AlmacenamientoRecursoNoDisponibleException();
    }
  }

  private obtenerConfiguracion(): ConfiguracionS3Recursos {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    const prefijo = (
      process.env.AWS_S3_RESOURCE_PREFIX || 'cronograma/recursos'
    )
      .trim()
      .replace(/^\/+|\/+$/g, '');
    const expiracionSegundos = Number(
      process.env.AWS_S3_UPLOAD_EXPIRATION_SECONDS || '300',
    );

    if (
      !bucket ||
      !prefijo ||
      prefijo.includes('..') ||
      !Number.isInteger(expiracionSegundos) ||
      expiracionSegundos < 60 ||
      expiracionSegundos > 3600
    ) {
      throw new AlmacenamientoRecursoNoDisponibleException();
    }

    return { bucket, prefijo, expiracionSegundos };
  }

  private clavePerteneceAlContenido(
    solicitud: SolicitudObjetoAlmacenado,
    prefijo: string,
  ): boolean {
    const inicio = `${prefijo}/`;
    const [idContenido, identificador, ...segmentosExtra] =
      solicitud.claveAlmacenamiento.slice(inicio.length).split('/');

    return (
      solicitud.claveAlmacenamiento.startsWith(inicio) &&
      idContenido?.toLowerCase() === solicitud.idContenido.toLowerCase() &&
      segmentosExtra.length === 0 &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identificador ?? '',
      )
    );
  }

  private esNoEncontrado(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const errorS3 = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };
    return (
      errorS3.name === 'NotFound' ||
      errorS3.name === 'NoSuchKey' ||
      errorS3.$metadata?.httpStatusCode === 404
    );
  }
}
