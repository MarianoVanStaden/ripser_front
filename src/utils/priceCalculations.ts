import { parametroSistemaApi } from '../api/services/parametroSistemaApi';

export const PRECIO_PARAMETROS = {
  PORCENTAJE_GANANCIA: 'PORCENTAJE_GANANCIA',
  REDONDEO_PRECIO: 'REDONDEO_PRECIO',
};

const DEFAULTS = {
  porcentajeGanancia: 27.671993,
  redondeo: 100,
};

export interface PriceCalculationParams {
  porcentajeGanancia: number;
  redondeo: number;
}

export const loadPriceCalculationParams = async (): Promise<PriceCalculationParams> => {
  let porcentajeGanancia = DEFAULTS.porcentajeGanancia;
  let redondeo = DEFAULTS.redondeo;

  try {
    const porcentajeParam = await parametroSistemaApi.getByClave(PRECIO_PARAMETROS.PORCENTAJE_GANANCIA);
    porcentajeGanancia = parseFloat(porcentajeParam.valor);
  } catch (error) {
    console.warn(`No se encontro ${PRECIO_PARAMETROS.PORCENTAJE_GANANCIA}, usando valor por defecto (${DEFAULTS.porcentajeGanancia}%)`);
  }

  try {
    const redondeoParam = await parametroSistemaApi.getByClave(PRECIO_PARAMETROS.REDONDEO_PRECIO);
    redondeo = parseInt(redondeoParam.valor, 10);
  } catch (error) {
    console.warn(`No se encontro ${PRECIO_PARAMETROS.REDONDEO_PRECIO}, usando valor por defecto (${DEFAULTS.redondeo})`);
  }

  return { porcentajeGanancia, redondeo };
};

export const calculateSellingPrice = (
  costo: number,
  porcentajeGanancia: number,
  redondeo: number
): number => {
  if (costo <= 0 || !isFinite(costo)) {
    return 0;
  }

  const precioSinRedondear = costo * (1 + porcentajeGanancia / 100);

  if (redondeo <= 0) {
    return Math.round(precioSinRedondear * 100) / 100;
  }

  return Math.round(precioSinRedondear / redondeo) * redondeo;
};

export const calculateMarginPercentage = (costo: number, precio: number): number => {
  if (costo <= 0) return 0;
  return ((precio - costo) / costo) * 100;
};

export const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return '-';
  return `$${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
