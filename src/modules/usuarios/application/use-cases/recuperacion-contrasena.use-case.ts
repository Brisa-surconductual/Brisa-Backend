import { Injectable } from "@nestjs/common";
import { RecuperacionRepository } from "../../domain/repositories/recuperacion.repository";
import { SolicitudRecuperacion } from "../../domain/entities/solicitud-recuperacion.entity";
import { CorreoElectronico } from "../../domain/value-objects/correo_electronico.vo";
import { SolicitarRecuperacionDtoRequest } from "../dto/solicitar-recuperacion.dto-request";
import { SolicitarRecuperacionDtoResponse } from "../dto/solicitar-recuperacion.dto-response";
import {RecoveryTokenGenerator} from '../ports/passhwor-recovery-token-generator';
import {PasswordHasher} from '../ports/password-hasher';
import { EmailService } from "../ports/email";
import { RecoveryCodeHasher } from "../ports/recovery-code-hasher";
import { CodigoRecuperacionInvalidoException } from "../../domain/exeption/codigo-recuperacion-invaliado.exeption";

@Injectable()
export class RecuperacionUseCase {
    constructor(
        private readonly recuperacionRepository: RecuperacionRepository,
        private readonly recoveryTokenGenerator: RecoveryTokenGenerator,
        private readonly emailService: EmailService,
        private readonly recoveryCodeHasher: RecoveryCodeHasher
    ) {}

    async execute(solicitud: SolicitarRecuperacionDtoRequest, direccionIp: string): Promise<SolicitarRecuperacionDtoResponse> {
        
        const codigo = this.recoveryTokenGenerator.generarToken();
        const codigoHash = await this.recoveryCodeHasher.hash(codigo);
        
        const idUsuario = await this.recuperacionRepository.buscarIdUsuarioPorCorreo(solicitud.correoElectronico);
        if (!idUsuario) {
            throw new Error('El correo electrónico no está registrado en el sistema.');
        }

        const correoElectronico = new CorreoElectronico(solicitud.correoElectronico);
        
        
        
        const solicitudRecuperacion = SolicitudRecuperacion.crear(
            correoElectronico,
            direccionIp,
            idUsuario,
            codigoHash
        );

        await this.recuperacionRepository.crear(solicitudRecuperacion);

        await this.emailService.enviarRecuperacionContrasena(solicitud.correoElectronico, codigo);

        return  SolicitarRecuperacionDtoResponse.crear();
         
    }
}