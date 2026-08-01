import { estado_codigo_enum } from "prisma/generated/edge";
import { SolicitudRecuperacion} from "../../domain/entities/solicitud-recuperacion.entity";
import { $Enums } from "@prisma/client";

export class SolicitudRecuperacionMapper {

    static toPrisma(solicitudRecuperacion: SolicitudRecuperacion): any {
        return {
        id_solicitud: solicitudRecuperacion.idSolicitudRecuperacion,
        correo_electronico: solicitudRecuperacion.correoElectronico.getValue(),
        id_usuario: solicitudRecuperacion.idUsuario,
        direccion_ip: solicitudRecuperacion.direccionIp,
        codigo_hash: solicitudRecuperacion.codigoHash,
        fecha_solicitud: solicitudRecuperacion.fechaSolicitud,
        fecha_expiracion: solicitudRecuperacion.fechaExpiracion,
        estado_codigo: solicitudRecuperacion.estadoCodigo as $Enums.estado_codigo_enum,
        };
    }

}