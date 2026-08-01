import { Injectable } from "@nestjs/common";
import { RecuperacionRepository } from "../../domain/repositories/recuperacion.repository";
import { SolicitudRecuperacion } from "../../domain/entities/solicitud-recuperacion.entity";
import { CorreoElectronico } from "../../domain/value-objects/correo_electronico.vo";
import { SolicitarRecuperacionDtoRequest } from "../dto/solicitar-recuperacion.dto-request";
import { SolicitarRecuperacionDtoResponse } from "../dto/solicitar-recuperacion.dto-response";
import {RecoveryTokenGenerator} from '../ports/passhwor-recovery-token-generator';
import {PasswordHasher} from '../ports/password-hasher';
import { EmailService } from "../ports/email";

@Injectable()
export class RecuperacionUseCase {
    constructor(
        private readonly recuperacionRepository: RecuperacionRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly recoveryTokenGenerator: RecoveryTokenGenerator,
        private readonly emailService: EmailService,
    ) {}

    async execute(solicitud: SolicitarRecuperacionDtoRequest, direccionIp: string): Promise<SolicitarRecuperacionDtoResponse> {
        
        const token = this.recoveryTokenGenerator.generarToken();
        const tokenHash = await this.passwordHasher.hash(token);

        
        const idUsuario = await this.recuperacionRepository.buscarIdUsuarioPorCorreo(solicitud.correoElectronico);
        if (!idUsuario) {
            throw new Error('El correo electrónico no está registrado en el sistema.');
        }

        const correoElectronico = new CorreoElectronico(solicitud.correoElectronico);
        
        const solicitudRecuperacion = SolicitudRecuperacion.crear(
            correoElectronico,
            direccionIp,
            idUsuario,
            tokenHash
        );

        await this.recuperacionRepository.crear(solicitudRecuperacion);

        await this.emailService.enviarRecuperacionContrasena(solicitud.correoElectronico, token);

        return  SolicitarRecuperacionDtoResponse.crear();
         
    }
}