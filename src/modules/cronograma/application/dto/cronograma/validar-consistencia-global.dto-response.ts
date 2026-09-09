import { IsString } from 'class-validator';


export class ValidarConsistenciaGlobalDtoResponse {
    @IsString()
    mensaje!: string;

    static mensajeValidacionExitosa(): ValidarConsistenciaGlobalDtoResponse {
        const response = new ValidarConsistenciaGlobalDtoResponse();
        response.mensaje = 'La validación de consistencia global del cronograma fue exitosa.';
        return response;
    }

}