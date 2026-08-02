import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ExpirarCodigosUseCase } from "../../application/use-cases/expirar-codigos.use-case";

@Injectable()
export class ExpirarCodigosCron {
    
    private readonly logger = new Logger(ExpirarCodigosCron.name);

    constructor(
        private readonly expirarCodigosUseCase: ExpirarCodigosUseCase
    ) {}

    @Cron("*/1 * * * *")
    async ejecutar(): Promise<void> {
       const codigos = await this.expirarCodigosUseCase.execute();

        if (codigos > 0){
            this.logger.log(`Se han expirado ${codigos} códigos de recuperación.`);
        }

        return;
    }
}