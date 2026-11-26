import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  LIMITE_REPORTES_CLIENTE,
  VENTANA_REPORTES_CLIENTE_SEGUNDOS,
} from '../../application/errores-conversacionales';
import {
  ContextoErrorConversacional,
  ErrorBackendConversacional,
  ErrorClienteConversacional,
  RegistroErroresConversacionalesRepository,
} from '../../domain/repositories/registro-errores-conversacionales.repository';

@Injectable()
export class PrismaRegistroErroresConversacionalesRepository implements RegistroErroresConversacionalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrarBackend(error: ErrorBackendConversacional): Promise<void> {
    await this.prisma.$transaction(
      (tx) => this.insertar(tx, error, 'BACKEND', error.statusHttp),
      { maxWait: 500, timeout: 1500 },
    );
  }

  registrarCliente(
    error: ErrorClienteConversacional,
  ): Promise<'REGISTRADO' | 'LIMITE' | 'SESION_NO_ENCONTRADA'> {
    return this.prisma.$transaction(
      async (tx) => {
        // La misma cuota se aplica en todas las instancias del backend.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(37, hashtext(${error.idUsuario.toLowerCase()}))`;
        const [ventana] = await tx.$queryRaw<{ cantidad: number }[]>`
        SELECT count(*)::int AS cantidad FROM chat.registro_errores
        WHERE origen = 'CLIENTE' AND id_usuario = ${error.idUsuario}::uuid
          AND fecha_error > statement_timestamp() - make_interval(secs => ${VENTANA_REPORTES_CLIENTE_SEGUNDOS}::int)`;
        if (ventana.cantidad >= LIMITE_REPORTES_CLIENTE) return 'LIMITE';
        return (await this.insertar(tx, error, 'CLIENTE', null)) === 1
          ? 'REGISTRADO'
          : 'SESION_NO_ENCONTRADA';
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private insertar(
    tx: Prisma.TransactionClient,
    error: ContextoErrorConversacional,
    origen: 'BACKEND' | 'CLIENTE',
    status: number | null,
  ): Promise<number> {
    return tx.$executeRaw`
      INSERT INTO chat.registro_errores (x_request_id, origen, codigo, status_http, id_usuario, id_sesion, id_nodo)
      SELECT ${error.xRequestId}, ${origen}, ${error.codigo}, ${status}::smallint,
             u.id_usuario, s.id_sesion, s.id_nodo_actual
      FROM (VALUES (1)) AS origen_peticion(id)
      LEFT JOIN usuario.usuarios u ON u.id_usuario = ${error.idUsuario}::uuid
      LEFT JOIN chat.sesiones s ON s.id_sesion = ${error.idSesion}::uuid AND s.id_usuario = u.id_usuario
      WHERE ${origen} = 'BACKEND' OR (u.id_usuario IS NOT NULL AND (${error.idSesion}::uuid IS NULL OR s.id_sesion IS NOT NULL))`;
  }
}
