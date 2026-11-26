import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ProcesarRespuestaPort,
  TransaccionRespuesta,
} from '../../application/ports/procesar-respuesta.port';
import { PrismaContextoRespuestaRepository } from './prisma-contexto-respuesta.repository';
import { PrismaRegistroRespuestaRepository } from './prisma-registro-respuesta.repository';
import { PrismaPerfilRespuestaRepository } from './prisma-perfil-respuesta.repository';
import { PrismaEstadoConversacionalRepository } from './prisma-estado-conversacional.repository';
import { PrismaVariablesRespuestaRepository } from './prisma-variables-respuesta.repository';

@Injectable()
export class PrismaProcesarRespuestaRepository implements ProcesarRespuestaPort {
  constructor(private readonly prisma: PrismaService) {}

  ejecutar<T>(operacion: (tx: TransaccionRespuesta) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      (tx) =>
        operacion({
          contexto: new PrismaContextoRespuestaRepository(tx),
          registro: new PrismaRegistroRespuestaRepository(tx),
          perfil: new PrismaPerfilRespuestaRepository(tx),
          estado: new PrismaEstadoConversacionalRepository(tx),
          variables: new PrismaVariablesRespuestaRepository(tx),
        }),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        // La apertura de una conexión del pool también cuenta en el maxWait.
        maxWait: 10000,
        timeout: 10000,
      },
    );
  }
}
