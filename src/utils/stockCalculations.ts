import type { ProductoDTO, StockDeposito } from '../types';

/**
 * Calcula el stock disponible (no asignado a depósitos) de un producto.
 * Fórmula backend: stockTotal - Σ(stockPorDeposito)
 *
 * @param producto - Producto con stockActual
 * @param stockDepositos - Array de todos los StockDeposito del sistema
 * @returns Stock disponible (no asignado) del producto
 */
export function calcularStockDisponible(
  producto: ProductoDTO,
  stockDepositos: StockDeposito[]
): number {
  const stockAsignado = stockDepositos
    .filter(sd => sd.productoId === producto.id)
    .reduce((sum, sd) => sum + (sd.cantidad || 0), 0);

  return Math.max(0, (producto.stockActual || 0) - stockAsignado);
}

/**
 * Calcula el total de stock asignado a depósitos para un producto específico.
 *
 * @param productoId - ID del producto
 * @param stockDepositos - Array de todos los StockDeposito del sistema
 * @returns Total de stock asignado en todos los depósitos
 */
export function calcularStockAsignado(
  productoId: number,
  stockDepositos: StockDeposito[]
): number {
  return stockDepositos
    .filter(sd => sd.productoId === productoId)
    .reduce((sum, sd) => sum + (sd.cantidad || 0), 0);
}

/**
 * Valida si se puede asignar una cantidad de stock a un depósito.
 *
 * @param cantidad - Cantidad que se desea asignar
 * @param stockDisponible - Stock disponible (no asignado) del producto
 * @returns Objeto con validación y mensaje de error si aplica
 */
export function validarAsignacionStock(
  cantidad: number,
  stockDisponible: number
): { valid: boolean; error?: string } {
  if (cantidad <= 0) {
    return { valid: false, error: 'La cantidad debe ser mayor a 0' };
  }

  if (cantidad > stockDisponible) {
    return {
      valid: false,
      error: `Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${cantidad}`
    };
  }

  return { valid: true };
}

/**
 * Determina el tipo de alerta de stock para un StockDeposito.
 *
 * @param stockDeposito - Registro de stock en un depósito específico
 * @returns Tipo de alerta o null si el stock está en rango normal
 */
export function getAlertaStock(
  stockDeposito: StockDeposito
): 'BAJO_MINIMO' | 'SOBRE_MAXIMO' | null {
  if (stockDeposito.stockMinimo && stockDeposito.cantidad < stockDeposito.stockMinimo) {
    return 'BAJO_MINIMO';
  }
  if (stockDeposito.stockMaximo && stockDeposito.cantidad > stockDeposito.stockMaximo) {
    return 'SOBRE_MAXIMO';
  }
  return null;
}

/**
 * Formatea un mensaje de error del backend sin modificarlo.
 * Prioriza el mensaje del backend sobre cualquier otra fuente.
 *
 * @param error - Error capturado de axios o cualquier excepción
 * @returns Mensaje de error formateado
 */
export function formatearErrorBackend(error: any): string {
  // Prioridad 1: mensaje del backend en response.data.message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  // Prioridad 2: error.message genérico
  if (error.message) {
    return error.message;
  }
  // Fallback
  return 'Error desconocido';
}

/**
 * Detecta problemas de sincronización entre stock total y stock en depósitos.
 * Verifica que stockActual = Σ(stockDeposito.cantidad)
 *
 * @param producto - Producto con stockActual
 * @param stockDepositos - Array de todos los StockDeposito del sistema
 * @returns Resultado de sincronización con mensaje descriptivo si hay problema
 */
export function detectarDesincronizacion(
  producto: ProductoDTO,
  stockDepositos: StockDeposito[]
): { sincronizado: boolean; diferencia: number; mensaje?: string } {
  const stockAsignado = calcularStockAsignado(producto.id, stockDepositos);
  const diferencia = (producto.stockActual || 0) - stockAsignado;

  if (diferencia < 0) {
    return {
      sincronizado: false,
      diferencia,
      mensaje: `⚠️ ALERTA: Los depósitos tienen MÁS stock (${stockAsignado}) que el producto (${producto.stockActual}). Diferencia: ${Math.abs(diferencia)}`
    };
  }

  return { sincronizado: true, diferencia };
}
