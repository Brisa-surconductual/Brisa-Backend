import { generarCsvCohorte, nombreArchivoCohorte } from './exportacion-cohorte';
import type { VistaConductualExportable } from './exportacion-cohorte';

const conductual: VistaConductualExportable = {
  id_cohorte: 'cohorte-prueba',
  estado: 'DISPONIBLE',
  estado_agregacion: 'ACTUALIZADO',
  ultimo_timestamp_disponible: '2026-11-23T11:10:00.000Z',
  motivo_sin_datos: null,
  mensaje: null,
  datos: {
    fecha_actualizacion: '2026-11-23T11:10:00.000Z',
    total_usuarios_activos: 5,
    distribucion_niveles_progreso: [{ nivel: 'INICIAL', total_usuarios: 0 }],
    tasa_adherencia_promedio: 0.123456789,
    alertas_inactividad_pendientes: 0,
    alertas_craving_pendientes: null,
  },
};

describe('Archivo CSV de RF-144', () => {
  it('conserva el nombre con acentos, las comillas, las comas y los saltos RFC 4180', () => {
    const csv = generarCsvCohorte(
      'Cohorte "Estándar", Bogotá\r\nPrograma',
      conductual,
      null,
    );
    const esperado =
      '"Cohorte ""Estándar"", Bogotá\r\nPrograma",DISPONIBLE,2026-11-23T11:10:00.000Z,5,0,No disponible,No disponible,No disponible,0.123456789,0,No disponible,NO_DISPONIBLE,No disponible,No disponible,No disponible,No disponible,No disponible,No disponible\r\n';
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('\r\n' + esperado);
  });

  it.each(['=A1', '+Cohorte', '-Cohorte', '@Cohorte', '  =A1', '\tCohorte'])(
    'neutraliza el contenido de fórmula en un campo de texto (%s)',
    (nombre) => {
      const csv = generarCsvCohorte(nombre, conductual, null);
      expect(csv.split('\r\n')[1]).toMatch(/^"'/u);
      expect(csv).toContain(nombre);
    },
  );

  it('usa la fecha de Colombia al cruzar medianoche UTC', () => {
    expect(nombreArchivoCohorte(new Date('2026-11-25T04:59:00Z'))).toBe(
      'indicadores_cohorte_activa_20261124.csv',
    );
    expect(nombreArchivoCohorte(new Date('2026-11-25T05:00:00Z'))).toBe(
      'indicadores_cohorte_activa_20261125.csv',
    );
  });
});
