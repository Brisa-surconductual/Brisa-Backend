export class lineaBaseHistorial{
    constructor(
        private readonly id_linea_base_historial:string,
        private readonly id_usuario:string,
        private readonly id_linea_base:string,
        private readonly campos_modificados:string[],
        private readonly fecha_modificacion:Date,
        private readonly datos_anteriores:JSON,
    ){}
}