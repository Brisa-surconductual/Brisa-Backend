import { Prisma } from '@prisma/client';
import { PerfilRespuestaTransaccion } from '../../application/ports/procesar-respuesta.port';
import { CapturaPerfilRespuesta } from '../../domain/policies/captura-perfil-respuesta.policy';

export class PrismaPerfilRespuestaRepository implements PerfilRespuestaTransaccion {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async guardar(
    idUsuario: string,
    captura: CapturaPerfilRespuesta,
    fechaCaptura: Date,
    ahora: Date,
  ): Promise<void> {
    const dimension =
      captura.dimension === 'tipo_dependencia'
        ? {
            tipo_dependencia: captura.valor,
            fecha_captura_dependencia: fechaCaptura,
          }
        : { tipo_craving: captura.valor, fecha_captura_craving: fechaCaptura };
    // Solo escribe la dimensión capturada. La otra conserva su valor y fecha.
    // perfil_completo es GENERATED ALWAYS en PostgreSQL; no se escribe desde Prisma.
    const data = { ...dimension, fecha_actualizacion: ahora };
    await this.tx.perfil_clinico.upsert({
      where: { id_usuario: idUsuario },
      create: { id_usuario: idUsuario, ...data },
      update: data,
    });
  }
}
