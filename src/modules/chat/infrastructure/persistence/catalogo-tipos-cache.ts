/**
 * Los catálogos `tipo_nodo` y `tipo_entrada` son tablas casi fijas: se leían
 * con un viaje a la base en cada nodo y en cada respuesta. Se guardan en
 * memoria con una vida corta para no pagar esa consulta en cada petición.
 * Un id desconocido fuerza una recarga, de modo que un tipo nuevo se ve de
 * inmediato; solo un cambio de nombre tarda hasta `VIDA_MS` en reflejarse.
 */
const VIDA_MS = 5 * 60 * 1000;

type FilaCatalogo = { nombre: string };
type Lector = {
  findMany(args: {
    select: Record<string, true>;
  }): Promise<Array<Record<string, string>>>;
};

class CacheCatalogo {
  private nombres = new Map<string, string>();
  private cargadoEn = 0;

  constructor(
    private readonly campoId: string,
    private readonly leer: (cliente: never) => Lector,
  ) {}

  async nombre(cliente: unknown, id: string): Promise<string | undefined> {
    if (!this.vigente() || !this.nombres.has(id)) await this.recargar(cliente);
    return this.nombres.get(id);
  }

  private vigente(): boolean {
    return Date.now() - this.cargadoEn < VIDA_MS;
  }

  private async recargar(cliente: unknown): Promise<void> {
    const filas = await this.leer(cliente as never).findMany({
      select: { [this.campoId]: true, nombre: true },
    });
    this.nombres = new Map(filas.map((f) => [f[this.campoId], f.nombre]));
    this.cargadoEn = Date.now();
  }

  /** Solo para pruebas. */
  vaciar(): void {
    this.nombres = new Map();
    this.cargadoEn = 0;
  }
}

export const cacheTipoNodo = new CacheCatalogo(
  'id_tipo_nodo',
  (c: { tipo_nodo: Lector }) => c.tipo_nodo,
);
export const cacheTipoEntrada = new CacheCatalogo(
  'id_tipo_entrada',
  (c: { tipo_entrada: Lector }) => c.tipo_entrada,
);

/** Agrega `tipo_nodo.nombre` a filas de `nodos` leídas sin `include`. */
export async function conTipoNodo<T extends { id_tipo_nodo: string }>(
  cliente: unknown,
  filas: T[],
): Promise<Array<T & { tipo_nodo: FilaCatalogo }>> {
  return Promise.all(
    filas.map(async (fila) => {
      const nombre = await cacheTipoNodo.nombre(cliente, fila.id_tipo_nodo);
      if (nombre === undefined)
        throw new Error('El nodo referencia un tipo de nodo inexistente.');
      return { ...fila, tipo_nodo: { nombre } };
    }),
  );
}
