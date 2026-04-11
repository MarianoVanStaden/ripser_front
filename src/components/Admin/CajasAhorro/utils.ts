const ARG = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUSD = (n: number): string => `USD ${ARG.format(n)}`;

export const formatPesos = (n: number): string => `$ ${ARG.format(n)}`;

export const extractError = (err: unknown): string => {
  const e = err as { response?: { data?: unknown }; message?: string };
  const data = e?.response?.data;
  if (typeof data === 'string' && data.length > 0) return data;
  if (typeof data === 'object' && data !== null) {
    return (data as { message?: string }).message ?? 'Error desconocido';
  }
  return e?.message ?? 'Error desconocido';
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const todayString = (): string => new Date().toISOString().split('T')[0];

export const formatFecha = (iso: string): string => {
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};
