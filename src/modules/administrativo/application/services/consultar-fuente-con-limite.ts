const TIEMPO_LIMITE_FUENTE_MS = 2_000;

export async function consultarFuenteConLimite<T>(
  consultar: () => Promise<T>,
  indisponible: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const limite = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(indisponible), TIEMPO_LIMITE_FUENTE_MS);
    });
    return await Promise.race([consultar(), limite]);
  } catch {
    return indisponible;
  } finally {
    clearTimeout(timer);
  }
}
