export function fechaRespuestaValida(valor: string, formato: unknown): boolean {
  if (formato === 'HORA')
    return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(valor);
  const fecha = valor.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const parsed = new Date(`${fecha}T00:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== fecha
  )
    return false;
  if (formato === 'FECHA' || (formato === undefined && valor.length === 10))
    return valor.length === 10;
  return (
    /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/.test(
      valor,
    ) && Number.isFinite(Date.parse(valor))
  );
}
