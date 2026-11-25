import type { EstadoAccion } from '../enums/estado-accion.enum';

/** Fila de la bitácora tal como se consulta (RF-123). */
export interface EntradaBitacora {
  id_auditoria: string;
  accion: string;
  recurso_afectado: string;
  id_recurso: string | null;
  direccion_ip: string;
  marca_temporal: Date;
  estado_accion: EstadoAccion;
}
