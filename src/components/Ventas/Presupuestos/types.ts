// FRONT-003: extracted from PresupuestosPage.tsx — types kept colocated to
// the page that owns them (not promoted to /src/types/ because they're not
// shared across modules).
import type { EstadoDocumento, TipoItemDocumento } from '../../../types';

export type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';

export type TipoDescuento = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

/**
 * Form state for the "Crear/Editar Presupuesto" dialog.  Mirrors the
 * columns the backend expects when persisting a presupuesto.  Cliente y
 * Lead son mutuamente excluyentes — la UI alterna por `destinatarioMode`.
 */
export interface FormData {
  clienteId: string;
  leadId: string;
  usuarioId: string;
  fechaEmision: string;
  observaciones: string;
  estado: EstadoDocumento;
  tipoIva: TipoIva;
  descuentoTipo: TipoDescuento;
  descuentoValor: number;
}

/**
 * Single line item in the Presupuesto form.  Discriminates on `tipoItem`:
 *   - PRODUCTO: usa `productoId`
 *   - EQUIPO:   usa `recetaId` + `colorId` (medida viene de la receta)
 *
 * Color/medida names are cached for display; the backend is source of
 * truth via the IDs.
 */
export interface DetalleForm {
  id?: number;
  tipoItem: TipoItemDocumento;
  productoId?: string;
  recetaId?: string;
  /** FK to the colores catalog (see ColoresContext). */
  colorId?: number;
  /** Cached display name of the color, populated from the response or
   *  the cached catalog. The backend is the source of truth via colorId. */
  colorNombre?: string;
  /** Cached medida id and display name. Derived from the recipe; never user-editable. */
  medidaId?: number;
  medidaNombre?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export type DestinatarioMode = 'CLIENTE' | 'LEAD';

export type TipoEquipoFiltro = '' | 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO';
