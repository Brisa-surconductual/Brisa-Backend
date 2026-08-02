import { MotivoCierre } from "../enums/motivo-cierre-enum";
import {EstadoAplicacion} from "../enums/estado-aplicacion-enum";

export class Sesion{
    constructor(
        readonly id_sesion:string,
        readonly id_usuario:string,
        readonly fecha_inicio_sesion:Date,
        readonly fecha_ultima_interaccion:Date,
        readonly limite_inactividad_minutos: number,
        readonly estado_aplicacion: EstadoAplicacion,
        readonly activa:Boolean, 
        readonly fecha_cierre_sesion:Date,
        readonly motivo_cierre_sesion:MotivoCierre
    ){}
}