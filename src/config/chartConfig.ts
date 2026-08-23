/**
 * Paleta y defaults compartidos para los gráficos de la app (recharts).
 *
 * Antes esto contenía también opciones de Chart.js; tras la migración a
 * recharts los options son props del componente, así que acá sólo quedan
 * los colores y un peineta de settings comunes.
 *
 * Los colores son tokens del theme (CSS vars, ver src/theme/chartTokens.ts):
 * válidos como fill/stroke SVG y siguen el esquema claro/oscuro activo.
 */

import { CHART_SERIES } from '../theme/chartTokens';

// Series con semántica de estado (ingresos/egresos) usan los tokens de status
// para conservar el significado verde=entra, rojo=sale.
const SUCCESS = 'var(--mui-palette-status-success-fg)';
const DANGER = 'var(--mui-palette-status-danger-fg)';
const INFO = 'var(--mui-palette-status-info-fg)';

export const chartColors = {
  // Colores para métodos de pago (categóricos: índice estable de CHART_SERIES)
  efectivo: CHART_SERIES[2],
  transferencia: CHART_SERIES[0],
  cheque: CHART_SERIES[1],
  tarjetaCredito: CHART_SERIES[3],
  tarjetaDebito: CHART_SERIES[5],
  financiacion: CHART_SERIES[4],
  otro: CHART_SERIES[7],

  // Colores para ingresos/egresos
  ingresos: SUCCESS,
  egresos: DANGER,
  flujoNeto: INFO,

  // Variantes translúcidas — útiles para áreas bajo líneas (`<Area>`)
  ingresosAlpha: `color-mix(in srgb, ${SUCCESS} 20%, transparent)`,
  egresosAlpha: `color-mix(in srgb, ${DANGER} 20%, transparent)`,
  flujoNetoAlpha: `color-mix(in srgb, ${INFO} 20%, transparent)`,
};

/** Colores rotativos para datasets arbitrarios (Pie slices, series dinámicas). */
export const categoricalPalette: readonly string[] = CHART_SERIES;

/** Formatea un número ARS para tooltips y ejes de recharts. */
export const formatARS = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return '$' + n.toLocaleString('es-AR');
};
