export class cirreSesionConsistente{
    constructor(
        private readonly activa: boolean,
        private readonly fecha_cierre_sesion: Date,
        private readonly motivo_cierre_sesion: string

    ){
        if(!activa && !fecha_cierre_sesion && !motivo_cierre_sesion){
            throw new Error("Si la sesión no está activa, se debe proporcionar la fecha de cierre y el motivo del cierre.");
        }   
    
    }
}