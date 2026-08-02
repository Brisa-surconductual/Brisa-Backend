import { Injectable } from '@nestjs/common';
import { RecuperacionRepository } from '../../domain/repositories/recuperacion.repository';

@Injectable()
export class ExpirarCodigosUseCase {
    constructor(
        private readonly recuperacionRepository: RecuperacionRepository,
    ) {}

    async execute(): Promise<number> {
        return this.recuperacionRepository.expirarCodigosVencidos();
    }
}
