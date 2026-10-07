export class lineaBaseHistorial{
    constructor(
        readonly id_linea_base_historial:string,
        readonly id_usuario:string,
        readonly id_linea_base:string,
        readonly campos_modificados:string[],
        readonly fecha_modificacion:Date,
        readonly datos_anteriores:JSON,
    ){}
}