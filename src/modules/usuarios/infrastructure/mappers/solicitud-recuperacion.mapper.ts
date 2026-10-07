import { SolicitudRecuperacion } from "../../domain/entities/solicitud-recuperacion.entity";
import { EstadoCodigo } from "../../domain/enums/estado-codigo-enum";
import { CorreoElectronico } from "../../domain/value-objects/correo_electronico.vo";
import { $Enums } from "@prisma/client";

export class SolicitudRecuperacionMapper {
    static toDomain(solicitud: {
        id_solicitud: string;
        correo_electronico: string;
        id_usuario: string | null;
        direccion_ip: string;
        codigo_hash: string | null;
        fecha_solicitud: Date;
        fecha_expiracion: Date | null;
        estado_codigo: $Enums.estado_codigo_enum | null;
    }): SolicitudRecuperacion {

        if (!solicitud.id_usuario || !solicitud.codigo_hash || !solicitud.fecha_expiracion || !solicitud.estado_codigo) {
            throw new Error("Solicitud de recuperación inválida: faltan campos requeridos.");
        }

        return new SolicitudRecuperacion(
            solicitud.id_solicitud,
            new CorreoElectronico(solicitud.correo_electronico),
            solicitud.id_usuario,
            solicitud.direccion_ip,
            solicitud.codigo_hash,
            solicitud.fecha_solicitud,
            solicitud.fecha_expiracion,
            solicitud.estado_codigo as unknown as EstadoCodigo,
        );
    }

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