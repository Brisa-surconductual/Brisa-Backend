import { Injectable } from "@nestjs/common";
import { PasswordHasher } from "../../aplication/ports/password-hasher";
import {RecoveryTokenGenerator} from "../../aplication/ports/passhwor-recovery-token-generator";
import * as bcrypt from 'bcrypt';
import {randomInt} from 'crypto';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher, RecoveryTokenGenerator {

    generarToken(): string {
        const codigo = randomInt(0, 1_000_000)
        return codigo.toString().padStart(6, '0');
    }
    
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}