import type { TipoItemDocumento } from '../../../types';

export type CartItem = {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioManualmenteModificado?: boolean;
  tipoItem: TipoItemDocumento;
  // PRODUCTO fields (optional when tipoItem is EQUIPO)
  productoId?: number;
  productoNombre?: string;
  // EQUIPO fields (optional when tipoItem is PRODUCTO)
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  recetaTipo?: string;
  colorId?: number;
  colorNombre?: string;
  medidaId?: number;
  medidaNombre?: string;
  // Stock validation fields
  stockDisponible?: number;
  stockVerificado?: boolean;
  requiereFabricacion?: boolean;
};

export type NotaCartItem = {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoItem?: 'PRODUCTO' | 'EQUIPO';
  // PRODUCTO fields (optional when tipoItem is EQUIPO)
  productoId?: number;
  productoNombre?: string;
  // EQUIPO fields (optional when tipoItem is PRODUCTO)
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  recetaTipo?: string;
  descripcionEquipo?: string;
  colorId?: number;
  colorNombre?: string;
  medidaId?: number;
  medidaNombre?: string;
  // Stock validation fields
  stockDisponible?: number;
  stockVerificado?: boolean;
};
