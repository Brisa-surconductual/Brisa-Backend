import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  accionExportacionIndividual,
  type FilaExportacionIndividual,
  generarCsvIndividual,
  TIPO_EXPORTACION_INDIVIDUAL,
} from '../../../domain/entities/exportacion-individual/exportacion-individual.entity';
import { EstadoResolucionAlerta } from '../../../domain/enums/estado-resolucion-alerta.enum';
import { SeguimientoIndividualRepository } from '../../../domain/repositories/seguimiento-individual.repository';
import type { ContextoAuditoria } from '../../../domain/results/contexto-auditoria';
import { nombreArchivoIndividual } from '../../../domain/value-objects/nombre-archivo-exportacion.vo';
import { ExportacionIndividualException } from '../../exceptions/exportacion-individual.exception';
import { SeguimientoIndividualException } from '../../exceptions/seguimiento-individual.exception';
import {
  type HistorialCuantitativoM05,
  SeguimientoIndividualPort,
} from '../../ports/seguimiento-individual.port';
import { AuditoriaService } from '../../services/auditoria.service';
import { consultarFuenteConLimite } from '../../services/consultar-fuente-con-limite';
import { SeguimientoIndividualService } from '../../services/seguimiento-individual.service';

const M05_NO_DISPONIBLE = Symbol('m05-no-disponible');

export interface ArchivoExportado {
  nombre: string;
  contenido: Buffer;
}

/**
 * RF-145: exporta en CSV el historial cuantitativo por unidad temporal de un
 * participante, para interconsultas. Requiere permiso individual vigente (lo
 * verifica el guard).
 *
 * El orden es obligatorio: el CSV se genera dentro de `auditoria.ejecutar`, que
 * registra EXPORTACION_DATOS (severidad ALTA, tipo EXPORTACION_INDIVIDUAL) en la
 * misma transacción; el archivo solo se devuelve después de confirmar la
 * bitácora. Si la auditoría falla, la exportación se aborta con 500 y no se
 * envía nada.
 */
@Injectable()
export class ExportarSeguimientoIndividualUseCase {
  private readonly logger = new Logger(
    ExportarSeguimientoIndividualUseCase.name,
  );

  constructor(
    private readonly seguimiento: SeguimientoIndividualPort,
    private readonly reglas: SeguimientoIndividualService,
    private readonly repositorio: SeguimientoIndividualRepository,
    private readonly auditoria: AuditoriaService,
  ) {}

  async ejecutar(
    ctx: ContextoAuditoria,
    codigoParticipante: string,
    camposDescartados: string[],
  ): Promise<ArchivoExportado> {
    if (camposDescartados.length > 0)
      this.logger.warn(
        `ALERTA CRÍTICA: Intento de solicitar campos de texto restringidos (diario/chat) en exportación individual de PII. Usuario: ${ctx.idUsuario ?? 'desconocido'}, Participante: ${codigoParticipante}. Petición sanitizada.`,
      );

    const accion = accionExportacionIndividual();
    try {
      return await this.auditoria.ejecutar(ctx, accion, async (tx) => {
        const idParticipante = await this.repositorio.buscarIdParticipante(
          tx,
          codigoParticipante,
        );
        if (!idParticipante)
          throw new ExportacionIndividualException(
            'PARTICIPANTE_NO_ENCONTRADO',
          );
        accion.idParticipante = idParticipante;

        const historial = await this.pedirHistorial(codigoParticipante);
        this.validarPertenencia(historial, codigoParticipante);
        if (historial.unidades.length === 0)
          throw new ExportacionIndividualException('SIN_INDICADORES');

        // RF-129: atendida en M-8 o, si no, el estado que informa M05.
        const estados = new Map(
          (
            await this.reglas.resolverEstados(
              tx,
              idParticipante,
              historial.unidades.flatMap((unidad) => unidad.alertas),
            )
          ).map((alerta) => [alerta.id_alerta, alerta.estado_resolucion]),
        );

        // Lista blanca: cada fila se arma campo por campo; nada de M05 se esparce.
        const filas: FilaExportacionIndividual[] = historial.unidades.map(
          (unidad) => ({
            orden_unidad_temporal: unidad.orden_unidad_temporal,
            nombre_unidad: unidad.nombre_unidad,
            fecha_inicio_unidad: unidad.fecha_inicio_unidad,
            fecha_fin_unidad: unidad.fecha_fin_unidad,
            nivel_progreso: unidad.nivel_progreso ?? null,
            tasa_adherencia: unidad.tasa_adherencia ?? null,
            craving_promedio: unidad.craving_promedio ?? null,
            alertas_generadas: unidad.alertas.length,
            alertas_atendidas: unidad.alertas.filter(
              (alerta) =>
                estados.get(alerta.id_alerta) ===
                EstadoResolucionAlerta.ATENDIDA,
            ).length,
          }),
        );

        const nombre = nombreArchivoIndividual();
        const contenido = Buffer.from(generarCsvIndividual(filas), 'utf8');
        accion.detalle = {
          tipo: TIPO_EXPORTACION_INDIVIDUAL,
          nombre_archivo: nombre,
          tamano_bytes: contenido.length,
          unidades_exportadas: filas.length,
          ...(camposDescartados.length > 0 && {
            campos_descartados: camposDescartados,
          }),
        };
        return { nombre, contenido };
      });
    } catch (error) {
      // 4xx y M05 caído se informan tal cual; cualquier otro fallo (incluida la
      // auditoría) aborta la exportación sin enviar el archivo.
      if (
        error instanceof HttpException &&
        (error.getStatus() < 500 || error.getStatus() === 503)
      )
        throw error;
      throw new ExportacionIndividualException('EXPORTACION_ABORTADA', {
        cause: error,
      });
    }
  }

  private async pedirHistorial(
    codigoParticipante: string,
  ): Promise<HistorialCuantitativoM05> {
    const historial = await consultarFuenteConLimite<
      HistorialCuantitativoM05 | null | typeof M05_NO_DISPONIBLE
    >(
      () => this.seguimiento.obtenerHistorialCuantitativo(codigoParticipante),
      M05_NO_DISPONIBLE,
    );
    if (historial === M05_NO_DISPONIBLE)
      throw new ExportacionIndividualException('M05_NO_DISPONIBLE');
    if (!historial) throw new ExportacionIndividualException('SIN_INDICADORES');
    return historial;
  }

  /** M05 debe responder por el participante pedido (409 si no). */
  private validarPertenencia(
    historial: HistorialCuantitativoM05,
    codigoParticipante: string,
  ): void {
    try {
      this.reglas.validarPertenencia(
        historial.codigo_participante,
        codigoParticipante,
      );
    } catch (error) {
      if (error instanceof SeguimientoIndividualException)
        throw new ExportacionIndividualException(
          'INCONSISTENCIA_PARTICIPANTE',
          { cause: error },
        );
      throw error;
    }
  }
}
