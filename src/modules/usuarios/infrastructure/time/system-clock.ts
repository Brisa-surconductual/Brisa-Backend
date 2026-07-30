import { Injectable } from '@nestjs/common';
import { Reloj } from '../../application/ports/reloj';

@Injectable()
export class SystemClock implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
