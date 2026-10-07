import { ConflictException } from "@nestjs/common";



export class contenidoCronogramadoEstadoInavilitadoParaEliminacionException extends ConflictException	 {
        constructor(estado: string) {
            super(
                `El contenido psicoeducativo se encuentra en estado ${estado} y no puede ser eliminado.`,
            );
        }


}