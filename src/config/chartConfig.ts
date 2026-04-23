/**
 * Paleta y defaults compartidos para los gráficos de la app (recharts).
 *
 * Antes esto contenía también opciones de Chart.js; tras la migración a
 * recharts los options son props del componente, así que acá sólo quedan
 * los colores y un peineta de settings comunes.
 */

export const chartColors = {
  // Colores para métodos de pago
  efectivo: '#4CAF50',
  transferencia: '#2196F3',
  cheque: '#FF9800',
  tarjetaCredito: '#9C27B0',
  tarjetaDebito: '#00BCD4',
  financiacion: '#FFC107',
  otro: '#9E9E9E',

  // Colores para ingresos/egresos
  ingresos: '#4CAF50',
  egresos: '#F44336',
  flujoNeto: '#2196F3',

  // Variantes translúcidas — útiles para áreas bajo líneas (`<Area>`)
  ingresosAlpha: 'rgba(76, 175, 80, 0.2)',
  egresosAlpha: 'rgba(244, 67, 54, 0.2)',
  flujoNetoAlpha: 'rgba(33, 150, 243, 0.2)',
};

/** Colores rotativos para datasets arbitrarios (Pie slices, series dinámicas). */
export const categoricalPalette = [
  '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350',
  '#29b6f6', '#9ccc65', '#ffca28', '#8d6e63', '#26a69a',
  '#ec407a', '#78909c',
];

/** Formatea un número ARS para tooltips y ejes de recharts. */
export const formatARS = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return '$' + n.toLocaleString('es-AR');
};
