// Materiales compuestos (sub-ensambles): composición, producción y desglose de stock.

export interface ComponenteProductoDTO {
  id?: number;
  productoComponenteId: number;
  productoComponenteNombre?: string;
  productoComponenteCodigo?: string;
  cantidad: number;
  productoComponenteStock?: number;
  componenteEsCompuesto?: boolean;
}

export interface DesgloseStockProductoDTO {
  productoId: number;
  nombre: string;
  codigo?: string;
  libre: number;
  embebido: number;
  total: number;
  esCompuesto: boolean;
  unidadMedida?: string;
  factorConversion?: number | null;
}

export interface SetComposicionDTO {
  componentes: Array<{ productoComponenteId: number; cantidad: number }>;
}

export interface AjustarStockDTO {
  nuevoStock: number;
  motivo?: string | null;
}
