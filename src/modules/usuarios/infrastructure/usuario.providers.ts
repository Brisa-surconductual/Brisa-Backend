import { UsuarioRepository } from "../domain/repositories/user.repository";
import { PrismaUsuarioRepository } from "./persistence/prisma-usuario.repository";
import {PasswordHasher} from "../aplication/ports/password-hasher";
import {BcryptPasswordHasher} from "./security/bycrptPassword"
import { PrismaSolicitudRecuperacionRepository } from "./persistence/prisma-solicitud-recuperacion.repository";
import { RecuperacionRepository } from "../domain/repositories/recuperacion.repository";
import { EmailService } from "../aplication/ports/email";
import {NodemailerEmailService} from "./email/nodemailer-email";
import { RecoveryTokenGenerator } from "../aplication/ports/passhwor-recovery-token-generator";


export const UsuarioInfraestructureProviders = [

    {

        provide: UsuarioRepository,
        useClass: PrismaUsuarioRepository,

    },

    {
        provide: PasswordHasher,
        useClass: BcryptPasswordHasher,
    },
    
    {
        provide: RecoveryTokenGenerator,
        useClass: BcryptPasswordHasher,
    },

    {
        provide: RecuperacionRepository,
        useClass: PrismaSolicitudRecuperacionRepository,
    },

    {
        provide: EmailService,
        useClass: NodemailerEmailService,
    }

];