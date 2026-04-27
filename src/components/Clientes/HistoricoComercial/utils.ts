import type {
  DocumentoComercial,
  EstadoDocumento,
  TipoDocumento,
} from '../../../types';

/**
 * Color/variant para el chip de tipo de documento.
 */
export type TipoChipColor = 'info' | 'warning' | 'success' | 'error' | 'default';

export interface TipoChipProps {
  label: string;
  color: TipoChipColor;
}

/**
 * Color para el chip de estado del documento.
 */
export type EstadoChipColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface EstadoChipProps {
  label: string;
  color: EstadoChipColor;
}

/**
 * KPIs computados a partir del listado de documentos comerciales del cliente.
 */
export interface HistoricoKPIs {
  totalFacturado: number;
  cantidadPresupuestos: number;
  cantidadNotasPedido: number;
  cantidadFacturas: number;
  cantidadNotasCredito: number;
  ticketPromedioFacturas: number;
  tasaConversionPresupuestoFactura: number; // 0..1
}

const ARS_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
});

const ARS_FORMATTER_INTEGER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/**
 * Formatea un monto en ARS. Usa 0 decimales cuando el monto es entero,
 * 2 decimales en caso contrario.
 */
export function formatARS(value: number | null | undefined): string {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (Number.isInteger(v)) {
    return ARS_FORMATTER_INTEGER.format(v);
  }
  return ARS_FORMATTER.format(v);
}

/**
 * Devuelve label y color de chip por tipo de documento.
 */
export function getTipoChipProps(tipo: TipoDocumento): TipoChipProps {
  switch (tipo) {
    case 'PRESUPUESTO':
      return { label: 'Presupuesto', color: 'info' };
    case 'NOTA_PEDIDO':
      return { label: 'Nota de Pedido', color: 'warning' };
    case 'FACTURA':
      return { label: 'Factura', color: 'success' };
    case 'NOTA_CREDITO':
      return { label: 'Nota de Crédito', color: 'error' };
    default:
      return { label: String(tipo), color: 'default' };
  }
}

/**
 * Devuelve label y color de chip por estado del documento.
 */
export function getEstadoChipProps(estado: EstadoDocumento): EstadoChipProps {
  switch (estado) {
    case 'PENDIENTE':
      return { label: 'Pendiente', color: 'warning' };
    case 'APROBADO':
      return { label: 'Aprobado', color: 'info' };
    case 'CONFIRMADA':
      return { label: 'Confirmada', color: 'primary' };
    case 'FACTURADA':
      return { label: 'Facturada', color: 'success' };
    case 'PAGADA':
      return { label: 'Pagada', color: 'success' };
    case 'RECHAZADO':
      return { label: 'Rechazado', color: 'error' };
    case 'VENCIDA':
      return { label: 'Vencida', color: 'error' };
    default:
      return { label: String(estado), color: 'default' };
  }
}

/**
 * Indica si una factura debe contarse como vigente para los KPIs (excluye anuladas/rechazadas).
 */
function esFacturaVigente(doc: DocumentoComercial): boolean {
  if (doc.tipoDocumento !== 'FACTURA') return false;
  return doc.estado !== 'RECHAZADO';
}

/** Ventana en días para emparejar una factura sin cadena con un presupuesto del mismo cliente. */
const VENTANA_MATCH_DIAS = 60;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Calcula KPIs sobre el listado de documentos comerciales del cliente.
 *
 * Nota: este cálculo es un *fallback* del cliente cuando el endpoint server-side
 * `/cliente/{id}/kpis-comerciales` no está disponible. La fuente de verdad es el back.
 *
 * Reglas:
 * - totalFacturado: suma de totales de facturas vigentes (no rechazadas).
 * - tasaConversionPresupuestoFactura:
 *   1) Cuenta presupuestos que se trazan vía cadena (`documentoOrigenId`) hasta una factura.
 *   2) Heurística adicional: si una factura no tiene origen, intenta emparejarla con un
 *      presupuesto del mismo cliente de igual total emitido en una ventana ±60 días.
 *      Cada presupuesto se consume sólo una vez para evitar doble conteo.
 */
export function calcularKPIs(documentos: DocumentoComercial[]): HistoricoKPIs {
  let totalFacturado = 0;
  let cantidadPresupuestos = 0;
  let cantidadNotasPedido = 0;
  let cantidadFacturas = 0;
  let cantidadNotasCredito = 0;
  let cantidadFacturasVigentes = 0;

  const presupuestosFacturados = new Set<number>();

  for (const doc of documentos) {
    switch (doc.tipoDocumento) {
      case 'PRESUPUESTO':
        cantidadPresupuestos += 1;
        break;
      case 'NOTA_PEDIDO':
        cantidadNotasPedido += 1;
        break;
      case 'FACTURA':
        cantidadFacturas += 1;
        if (esFacturaVigente(doc)) {
          totalFacturado += doc.total ?? 0;
          cantidadFacturasVigentes += 1;
        }
        break;
      case 'NOTA_CREDITO':
        cantidadNotasCredito += 1;
        break;
      default:
        break;
    }
  }

  const docsById = new Map<number, DocumentoComercial>();
  for (const doc of documentos) docsById.set(doc.id, doc);

  // 1) Conversión vía cadena explícita: FACTURA -> origen NOTA_PEDIDO -> origen PRESUPUESTO
  const facturasSinOrigen: DocumentoComercial[] = [];
  for (const doc of documentos) {
    if (doc.tipoDocumento !== 'FACTURA' || !esFacturaVigente(doc)) continue;
    let cursor: DocumentoComercial | undefined = doc;
    let safety = 0;
    let matched = false;
    while (cursor && cursor.documentoOrigenId && safety < 10) {
      const origen = docsById.get(cursor.documentoOrigenId);
      if (!origen) break;
      if (origen.tipoDocumento === 'PRESUPUESTO') {
        presupuestosFacturados.add(origen.id);
        matched = true;
        break;
      }
      cursor = origen;
      safety += 1;
    }
    if (!matched) facturasSinOrigen.push(doc);
  }

  // 2) Heurística para facturas sin cadena: emparejar con un presupuesto del mismo total
  //    emitido dentro de una ventana de ±60 días. Cada presupuesto se consume una sola vez.
  if (facturasSinOrigen.length > 0 && cantidadPresupuestos > 0) {
    const presupuestosDisponibles = documentos
      .filter(
        (d) => d.tipoDocumento === 'PRESUPUESTO' && !presupuestosFacturados.has(d.id),
      )
      .sort(
        (a, b) =>
          new Date(a.fechaEmision).getTime() - new Date(b.fechaEmision).getTime(),
      );

    for (const factura of facturasSinOrigen) {
      const tFact = new Date(factura.fechaEmision).getTime();
      if (Number.isNaN(tFact)) continue;
      const idx = presupuestosDisponibles.findIndex((p) => {
        if (p.total !== factura.total) return false;
        const tPres = new Date(p.fechaEmision).getTime();
        if (Number.isNaN(tPres)) return false;
        return Math.abs(tFact - tPres) <= VENTANA_MATCH_DIAS * MS_POR_DIA;
      });
      if (idx >= 0) {
        presupuestosFacturados.add(presupuestosDisponibles[idx].id);
        presupuestosDisponibles.splice(idx, 1);
      }
    }
  }

  const ticketPromedioFacturas =
    cantidadFacturasVigentes > 0 ? totalFacturado / cantidadFacturasVigentes : 0;

  const tasaConversionPresupuestoFactura =
    cantidadPresupuestos > 0
      ? presupuestosFacturados.size / cantidadPresupuestos
      : 0;

  return {
    totalFacturado,
    cantidadPresupuestos,
    cantidadNotasPedido,
    cantidadFacturas,
    cantidadNotasCredito,
    ticketPromedioFacturas,
    tasaConversionPresupuestoFactura,
  };
}

/**
 * Formatea una fecha ISO en formato corto es-AR (dd/mm/yyyy).
 */
export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR').format(date);
}

/**
 * Formatea una fecha ISO en formato largo es-AR (incluye hora).
 */
export function formatFechaLarga(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Devuelve un label legible para un MetodoPago.
 */
export function formatMetodoPago(mp: string | null | undefined): string {
  if (!mp) return '-';
  return mp
    .split('_')
    .map((s) => s.charAt(0) + s.slice(1).toLowerCase())
    .join(' ');
}
