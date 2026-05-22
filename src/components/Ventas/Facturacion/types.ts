import type { TipoItemDocumento } from '../../../types';

export type CartItem = {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioManualmenteModificado?: boolean;
  tipoItem: TipoItemDocumento;
  descripcion?: string; // used for ENVIO items
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
  // Pre-assigned equipment from OrdenServicio
  preAsignadoEquipoId?: number;
  ordenServicioNumero?: string;
};

export type NotaCartItem = {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoItem?: TipoItemDocumento;
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
