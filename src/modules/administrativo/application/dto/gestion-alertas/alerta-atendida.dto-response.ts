/** Respuesta 200 de `POST /admin/alertas/:id_alerta/atender` (RF-147). */
export interface AlertaAtendidaDtoResponse {
  id_alerta: string;
  estado: 'ATENDIDA';
  fecha_atencion: string;
}
