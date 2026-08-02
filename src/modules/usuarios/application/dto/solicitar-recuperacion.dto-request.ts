 import { IsDate, IsEmail, IsString } from 'class-validator';
  import {EstadoCodigo} from "../../domain/enums/estado-codigo-enum";


export class SolicitarRecuperacionDtoRequest {

    @IsEmail()
    correoElectronico!: string
}