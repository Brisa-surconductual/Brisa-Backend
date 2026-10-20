import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Cronograma } from '../../domain/entities/cronograma.entity';
import { EstadoCronograma } from '../../domain/enums/estado-cronograma.enum';
import { EstructuraActivacionCronograma } from '../../domain/repositories/activacion-cronograma.repository';
import { ValidarConsistenciaCronogramaService } from './validad-consistencia-global-cronograma.service';

export function estructuraValida(): EstructuraActivacionCronograma {
  const fecha = new Date('2026-01-01T00:00:00Z');
  return {
    cronograma: new Cronograma(
      'flujo',
      'Base',
      EstadoCronograma.INACTIVO,
      true,
      fecha,
      fecha,
      fecha,
    ),
    unidades: [
      {
        id_unidad_temporal: 'unidad',
        orden_unidad: 1,
        fecha_inicio: fecha,
        fecha_fin: new Date('2026-01-08T00:00:00Z'),
        contenidos_cronograma: [
          {
            contenidos: {
              nombre_contenido: 'Contenido completo',
              recursos_contenido: [
                {
                  recursos_modulos_destino: [
                    { modulos_sistema: { activo: true } },
                  ],
                },
              ],
            },
            orden_contenido: 1,
            fecha_inicio_disponibilidad: fecha,
            fecha_fin_disponibilidad: new Date('2026-01-07T00:00:00Z'),
          },
        ],
      },
    ],
  };
}

describe('Consistencia global antes de activar', () => {
  it.each(['sin recursos', 'sin módulos', 'módulos inactivos'])(
    'rechaza un contenido %s',
    (caso) => {
      const estructura = estructuraValida();
      const contenido =
        estructura.unidades[0].contenidos_cronograma[0].contenidos;
      if (caso === 'sin recursos') contenido.recursos_contenido = [];
      if (caso === 'sin módulos')
        contenido.recursos_contenido[0].recursos_modulos_destino = [];
      if (caso === 'módulos inactivos')
        contenido.recursos_contenido[0].recursos_modulos_destino[0].modulos_sistema.activo = false;
      expect(() => validador.validar(estructura)).toThrow(
        UnprocessableEntityException,
      );
    },
  );
  const validador = new ValidarConsistenciaCronogramaService();
  it('admite una plantilla histórica porque su inicio se desplaza por usuario', () => {
    expect(() => validador.validar(estructuraValida())).not.toThrow();
  });
  it('rechaza cronograma ya activo', () => {
    const estructura = estructuraValida();
    estructura.cronograma = {
      ...estructura.cronograma,
      estado: EstadoCronograma.ACTIVO,
    };
    expect(() => validador.validar(estructura)).toThrow(ConflictException);
  });
  it('rechaza cronograma sin unidades', () => {
    expect(() =>
      validador.validar({ ...estructuraValida(), unidades: [] }),
    ).toThrow(UnprocessableEntityException);
  });
  it('rechaza cronograma sin contenido', () => {
    const estructura = estructuraValida();
    estructura.unidades[0].contenidos_cronograma = [];
    expect(() => validador.validar(estructura)).toThrow(
      UnprocessableEntityException,
    );
  });
  it('rechaza unidades solapadas', () => {
    const estructura = estructuraValida();
    estructura.unidades.push({ ...estructura.unidades[0], orden_unidad: 2 });
    expect(() => validador.validar(estructura)).toThrow(ConflictException);
  });
  it('conserva el orden de contenido por unidad y admite unidades consecutivas', () => {
    const estructura = estructuraValida();
    estructura.unidades.push({
      ...estructura.unidades[0],
      id_unidad_temporal: 'otra',
      orden_unidad: 2,
      fecha_inicio: new Date('2026-01-08T00:00:00Z'),
      fecha_fin: new Date('2026-01-15T00:00:00Z'),
      contenidos_cronograma: [
        {
          contenidos: {
            nombre_contenido: 'Otro contenido completo',
            recursos_contenido: [
              {
                recursos_modulos_destino: [
                  { modulos_sistema: { activo: true } },
                ],
              },
            ],
          },
          orden_contenido: 1,
          fecha_inicio_disponibilidad: new Date('2026-01-08T00:00:00Z'),
          fecha_fin_disponibilidad: new Date('2026-01-14T00:00:00Z'),
        },
      ],
    });
    expect(() => validador.validar(estructura)).not.toThrow();
  });
  it.each([
    'sin fechas',
    'fuera de rango',
    'fechas invertidas',
    'orden ausente',
    'orden repetido',
  ])('rechaza contenido %s', (caso) => {
    const estructura = estructuraValida();
    const unidad = estructura.unidades[0];
    const contenido = unidad.contenidos_cronograma[0];
    if (caso === 'sin fechas') contenido.fecha_inicio_disponibilidad = null;
    if (caso === 'fuera de rango')
      contenido.fecha_fin_disponibilidad = new Date('2026-01-10');
    if (caso === 'fechas invertidas')
      contenido.fecha_fin_disponibilidad = new Date('2025-12-01');
    if (caso === 'orden ausente') contenido.orden_contenido = null;
    if (caso === 'orden repetido')
      unidad.contenidos_cronograma.push({ ...contenido });
    expect(() => validador.validar(estructura)).toThrow();
  });
  it('rechaza fechas inválidas de unidad', () => {
    const estructura = estructuraValida();
    estructura.unidades[0].fecha_fin = estructura.unidades[0].fecha_inicio;
    expect(() => validador.validar(estructura)).toThrow(BadRequestException);
  });
});
