import { UsuarioRepository } from "../domain/repositories/user.repository";
import { PrismaUsuarioRepository } from "./persistence/prisma-usuario.repository";
import {PasswordHasher} from "../application/ports/password-hasher";
import {BcryptPasswordHasher} from "./security/bycrptPassword"
import { PrismaSolicitudRecuperacionRepository } from "./persistence/prisma-solicitud-recuperacion.repository";
import { RecuperacionRepository } from "../domain/repositories/recuperacion.repository";
import { EmailService } from "../application/ports/email";
import {NodemailerEmailService} from "./email/nodemailer-email";
import { RecoveryTokenGenerator } from "../application/ports/passhwor-recovery-token-generator";
import {ExpirarCodigosCron} from "./cron/expirar-codigos.cron";
import { RecoveryCodeHasher } from "../application/ports/recovery-code-hasher";
import { Sha256RecoveryCodeHasher } from "./security/sha256-recovery-code-hasher";

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
    },

    {
        provide: RecoveryCodeHasher,
        useClass: Sha256RecoveryCodeHasher,
    },

     ExpirarCodigosCron
];