import { IsString } from 'class-validator';

export class crearContenidoCronogramaDtoResponse {
    @IsString()
    mensaje!: string;

    static crear(posicion: number): crearContenidoCronogramaDtoResponse {
        const response = new crearContenidoCronogramaDtoResponse();
        response.mensaje = "Contenido asociado al cronograma correctamente en la posición " + posicion;
        return response;
    }

}