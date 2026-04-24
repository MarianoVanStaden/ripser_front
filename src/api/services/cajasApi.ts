import { cajasPesosApi } from './cajasPesosApi';
import { cajasAhorroApi } from './cajasAhorroApi';
import type { MetodoPago } from '../../types/prestamo.types';
import {
  MONEDAS_POR_METODO_PAGO,
  toCajaUnificada,
  type CajaUnificada,
} from '../../types/caja.types';

export const cajasApi = {
  /**
   * Devuelve todas las cajas activas (pesos + ahorro) compatibles con el método
   * de pago, unificadas en una lista. El filtrado por moneda se deriva de
   * MONEDAS_POR_METODO_PAGO — el frontend no envía consultas para monedas
   * que el método no soporta.
   */
  getByMetodoPago: async (
    metodoPago: MetodoPago,
    sucursalId?: number
  ): Promise<CajaUnificada[]> => {
    const monedas = MONEDAS_POR_METODO_PAGO[metodoPago];
    const [pesos, ahorro] = await Promise.all([
      monedas.includes('ARS')
        ? cajasPesosApi.getByMetodoPago(metodoPago, sucursalId)
        : Promise.resolve([]),
      monedas.includes('USD')
        ? cajasAhorroApi.getByMetodoPago(metodoPago, sucursalId)
        : Promise.resolve([]),
    ]);
    return [
      ...pesos.map((c) => toCajaUnificada(c, 'PESOS')),
      ...ahorro.map((c) => toCajaUnificada(c, 'AHORRO')),
    ];
  },
};
