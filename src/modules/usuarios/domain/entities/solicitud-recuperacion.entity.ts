import { randomUUID } from "crypto";
import {EstadoCodigo} from "../enums/estado-codigo-enum";
import { CorreoElectronico } from "../value-objects/correo_electronico.vo";


export class SolicitudRecuperacion{

    constructor(
        readonly idSolicitudRecuperacion:string,
        readonly correoElectronico:CorreoElectronico,
        readonly idUsuario:string,
        readonly direccionIp:string,
        readonly codigoHash:string,
        readonly fechaSolicitud:Date,
        readonly fechaExpiracion:Date,
        readonly estadoCodigo: EstadoCodigo = EstadoCodigo.ACTIVO
    ){}

    static crear(
        correoElectronico:CorreoElectronico,
        dirrecionIp:string,
        idUsuario:string,
        codigoHash:string,

    ): SolicitudRecuperacion{
        return new SolicitudRecuperacion(
            randomUUID(),
            correoElectronico,
            idUsuario,
            dirrecionIp,
            codigoHash,
            new Date(),
            new Date(Date.now() + 15 * 60 * 1000), 
            EstadoCodigo.ACTIVO
        );
    }

    static cambiarEstadoCodigo(solicitud: SolicitudRecuperacion, nuevoEstado: EstadoCodigo): SolicitudRecuperacion {
        return new SolicitudRecuperacion(
            solicitud.idSolicitudRecuperacion,
            solicitud.correoElectronico,
            solicitud.idUsuario,
            solicitud.direccionIp,
            solicitud.codigoHash,
            solicitud.fechaSolicitud,
            solicitud.fechaExpiracion,
            nuevoEstado
        );
    
    }



}