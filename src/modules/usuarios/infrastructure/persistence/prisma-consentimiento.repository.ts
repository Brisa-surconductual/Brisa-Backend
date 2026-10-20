import { Injectable } from "@nestjs/common";
import { ConsentimientosRepository } from "../../domain/repositories/consetimientos.repository";
import { PrismaService } from "prisma/prisma.service";
import { Consentimiento } from '../../domain/entities/consentimientos.entity';
import { ConsentimientoMapper } from "../mappers/consentimiento.mapper";
@Injectable()
export class PrismaConsentimientoRepository implements ConsentimientosRepository {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async findVigentes(): Promise<Consentimiento[]> {
    const records = await this.prisma.consentimientos.findMany({
      where: {
        vigente: true,
      },
    });

    return records.map((record) =>
      ConsentimientoMapper.toDomain({
        ...record,
        motivo_invalidacion: record.motivo_invalidacion ?? "",
      }),
    );
  }

  async buscarPorId(id_consentimiento: string): Promise<Consentimiento | null> {
    const consentimiento = await this.prisma.consentimientos.findUnique({
      where: {
        id_consentimiento,
      },
    });
    if (!consentimiento) return null;

    return ConsentimientoMapper.toDomain({
      ...consentimiento,
      motivo_invalidacion: consentimiento.motivo_invalidacion ?? "",
    });
  }
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

