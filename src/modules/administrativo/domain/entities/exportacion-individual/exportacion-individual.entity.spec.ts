import { nombreArchivoIndividual } from '../../value-objects/nombre-archivo-exportacion.vo';
import {
  accionExportacionIndividual,
  COLUMNAS_EXPORTACION_INDIVIDUAL,
  type FilaExportacionIndividual,
  generarCsvIndividual,
} from './exportacion-individual.entity';

const fila = (
  cambios: Partial<FilaExportacionIndividual> = {},
): FilaExportacionIndividual => ({
  orden_unidad_temporal: 3,
  nombre_unidad: 'Semana 3',
  fecha_inicio_unidad: '2026-10-19',
  fecha_fin_unidad: '2026-10-25',
  nivel_progreso: 'EN_AVANCE',
  tasa_adherencia: 0.71,
  craving_promedio: 4.2,
  alertas_generadas: 1,
  alertas_atendidas: 1,
  ...cambios,
});

describe('Exportación CSV individual (RF-145)', () => {
  it('genera BOM, el encabezado del contrato y la fila de ejemplo, con CRLF', () => {
    const csv = generarCsvIndividual([fila()]);
    expect(csv).toBe(
      '\uFEFF' +
        'orden_unidad_temporal,nombre_unidad,fecha_inicio_unidad,fecha_fin_unidad,nivel_progreso,tasa_adherencia,craving_promedio,alertas_generadas,alertas_atendidas\r\n' +
        '3,Semana 3,2026-10-19,2026-10-25,EN_AVANCE,0.71,4.2,1,1\r\n',
    );
  });

  it('las columnas son fijas: sin seudónimo ni texto de diario o chat', () => {
    expect(COLUMNAS_EXPORTACION_INDIVIDUAL).toHaveLength(9);
    expect(COLUMNAS_EXPORTACION_INDIVIDUAL.join(',')).not.toMatch(
      /codigo|participante|correo|texto|diario|chat|mensaje/u,
    );
  });

  it('los campos fuera de la lista blanca nunca llegan al archivo', () => {
    const conExtra = {
      ...fila(),
      texto_diario: 'secreto',
      codigo_participante: 'P-7F3A91C2',
    } as FilaExportacionIndividual;
    const csv = generarCsvIndividual([conExtra]);
    expect(csv).not.toContain('secreto');
    expect(csv).not.toContain('P-7F3A91C2');
  });

  it('marca como "No disponible" los indicadores sin dato', () => {
    const csv = generarCsvIndividual([
      fila({
        nivel_progreso: null,
        tasa_adherencia: null,
        craving_promedio: null,
      }),
    ]);
    expect(csv.split('\r\n')[1]).toBe(
      '3,Semana 3,2026-10-19,2026-10-25,No disponible,No disponible,No disponible,1,1',
    );
  });

  it('escapa según RFC 4180 y neutraliza fórmulas en el nombre de la unidad', () => {
    const csv = generarCsvIndividual([
      fila({ nombre_unidad: 'Semana "3", fase A' }),
      fila({ nombre_unidad: '=HYPERLINK("x")' }),
    ]);
    const [, primera, segunda] = csv.split('\r\n');
    expect(primera).toContain('"Semana ""3"", fase A"');
    expect(segunda).toContain('"\'=HYPERLINK(""x"")"');
  });

  it('sin filas solo deja el encabezado', () => {
    expect(generarCsvIndividual([])).toBe(
      '\uFEFF' + COLUMNAS_EXPORTACION_INDIVIDUAL.join(',') + '\r\n',
    );
  });

  it('audita EXPORTACION_DATOS con severidad ALTA y tipo EXPORTACION_INDIVIDUAL', () => {
    expect(accionExportacionIndividual()).toEqual({
      accion: 'EXPORTACION_DATOS',
      recurso: 'EXPORTACION_CSV_INDIVIDUAL',
      severidad: 'ALTA',
      detalle: { tipo: 'EXPORTACION_INDIVIDUAL' },
    });
  });

  it('el nombre del archivo usa la fecha de Colombia y no identifica al participante', () => {
    // 23 de noviembre 03:00 UTC = 22 de noviembre en Bogotá.
    expect(nombreArchivoIndividual(new Date('2026-11-23T03:00:00Z'))).toBe(
      'seguimiento_individual_20261122.csv',
    );
  });
});
