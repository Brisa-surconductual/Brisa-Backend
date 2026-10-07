import { Injectable } from "@nestjs/common";
import { ConsentimientosRepository } from "../../domain/repositories/consetimientos.repository";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class PrismaConsentimientoRepository implements ConsentimientosRepository {
    constructor(
        private readonly prisma: PrismaService, 
    ) {}
    async obtenerIdConsitimientoVigente(): Promise<string | null> {
        const idConsentimiento = await this.prisma.consentimientos.findFirst({
            where: {
                vigente: true,
            },
            select: {
                id_consentimiento: true,
            },
        });
            if (idConsentimiento) {
                return idConsentimiento.id_consentimiento;
            }
            return null;
    }   
}

