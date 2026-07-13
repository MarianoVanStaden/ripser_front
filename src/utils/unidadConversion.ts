// Conversión física ↔ inventario para materiales de receta.
// stock_actual vive en unidades de INVENTARIO/compra (rollo, bolsa); las recetas se cargan
// en unidad FÍSICA (m, kg, l) y se convierten con factorConversion (contenido por unidad).

// Etiqueta corta de la unidad física en la que se carga la receta.
const UNIDAD_LABEL: Record<string, string> = {
  M2: 'm²', MT2: 'm²', METROS: 'm', KG: 'kg', KILOS: 'kg', LITROS: 'l', UNIDAD: 'u.',
};

/** "METROS" → "m", "KG" → "kg". Devuelve '' si no hay unidad. */
export const unidadFisicaLabel = (u?: string | null): string =>
  u ? (UNIDAD_LABEL[u] ?? u.toLowerCase()) : '';

/**
 * Equivalencia de una cantidad física a unidades de inventario/compra:
 * "≈ 0,0444 Rollo". Devuelve null cuando no aplica conversión (sin factor o UNIDAD).
 */
export const formatEquivalencia = (
  cantidad: number,
  unidadMedida?: string | null,
  unidadInventario?: string | null,
  factorConversion?: number | null,
): string | null => {
  if (!factorConversion || factorConversion <= 0 || unidadMedida === 'UNIDAD') return null;
  const enStock = cantidad / factorConversion;
  const unidad = unidadInventario || 'u. compra';
  return `≈ ${enStock.toLocaleString('es-AR', { maximumFractionDigits: 6 })} ${unidad}`;
};
