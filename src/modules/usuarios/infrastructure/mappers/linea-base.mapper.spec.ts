import { LineaBase } from '../../domain/entities/linea-bases.entity';
import { MotivoConsumo } from '../../domain/enums/motivo-consumo-enum';
import { NivelAcademico } from '../../domain/enums/nivel-academico-enum';
import { frecuenciaConsumo } from '../../domain/value-objects/frecuencia-consumo.vo';
import { semestreCursado } from '../../domain/value-objects/semestre-cursado.vo';
import { LineaBaseMapper } from './linea-base.mapper';

describe('LineaBaseMapper', () => {
  it('convierte semestre y frecuencia a números para Prisma', () => {
    const lineaBase = new LineaBase(
      '00000000-0000-4000-8000-000000000010',
      '00000000-0000-4000-8000-000000000001',
      'Bogotá',
      'Universidad de prueba',
      'Ingeniería de Sistemas',
      new semestreCursado(5),
      NivelAcademico.PREGRADO,
      new Date('2024-01-10T00:00:00.000Z'),
      new Date('2026-07-20T00:00:00.000Z'),
      MotivoConsumo.CURIOSIDAD,
      new frecuenciaConsumo(2),
      new Date('2026-08-04T12:00:00.000Z'),
      new Date('2026-08-04T12:00:00.000Z'),
      new Date('2002-05-15T00:00:00.000Z'),
    );

    const resultado = LineaBaseMapper.toPrisma(lineaBase);

    expect(resultado.semestre_cursado).toBe(5);
    expect(resultado.frecuencia_consumo).toBe(2);
  });
});
