import { EstadoCodigo } from '../enums/estado-codigo-enum';

export class solicitudRecuperacion {
  constructor(
    private readonly id_solictud_recuperacion: string,
    private correo_electronico: string,
    private id_usuario: string,
    private dirrecion_ip: string,
    private codigo_hash: string,
    private fecha_solicitud: Date,
    private fecha_expiracion: Date,
    private estado_codigo: EstadoCodigo,
  ) {}
}
