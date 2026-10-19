import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class CuerpoVacioPipe implements PipeTransform<unknown, void> {
  transform(value: unknown): void {
    if (value === undefined) return;
    if (
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).length > 0
    ) {
      throw new BadRequestException('Esta operación requiere un cuerpo vacío.');
    }
  }
}
