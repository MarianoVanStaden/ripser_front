import type { ProvinciaEnum } from './shared.enums';
import type { ProductoSimple } from './producto.types';
import type { MetodoPago, Venta } from './venta.types';
import type { OpcionFinanciamientoDTO, DocumentoComercial } from './documentoComercial.types';
import type { User } from './admin.types';
// Cliente, contactos, cuenta corriente y KPIs de cliente.

export interface Cliente {
  id: number;
  empresaId: number;        // Multi-tenant: empresa ID
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  telefonoAlternativo?: string;
  whatsapp?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: ProvinciaEnum;
  codigoPostal?: string;
  tipo: TipoCliente;
  estado: EstadoCliente;
  segmento?: SegmentoCliente;
  esClienteCorporativo?: boolean;
  limiteCredito?: number;
  saldoActual: number;
  diasCredito?: number;
  condicionPago?: CondicionPago;
  totalCompras?: number;
  cantidadCompras?: number;
  ticketPromedio?: number;
  lifetimeValue?: number;
  fechaUltimaCompra?: string;
  diasDesdeUltimaCompra?: number;
  frecuenciaCompraDias?: number;
  leadId?: number;
  fechaConversion?: string;
  productoComprado?: ProductoSimple;
  montoConversion?: number;
  canalAdquisicion?: string;
  aceptaMarketing?: boolean;
  preferenciaContacto?: PreferenciaContacto;
  horarioPreferidoContacto?: string;
  calificacion?: number; // 0.00 to 5.00
  observaciones?: string;
  usuarioAsignadoId?: number;
  creadoPorId?: number;
  modificadoPorId?: number;
  fechaAlta: string; // ISO 8601 string
  fechaActualizacion?: string; // ISO 8601 string
  fechaBaja?: string;
  enRiesgoChurn?: boolean;
  segmentoAutomatico?: SegmentoCliente;
  contactos?: ContactoCliente[];
  cuentaCorriente?: CuentaCorriente[];
  ventas?: Venta[];
}

export type SegmentoCliente = 'VIP' | 'PREMIUM' | 'STANDARD' | 'BASICO';
export type CondicionPago = 'CONTADO' | 'CREDITO';
export type PreferenciaContacto = 'TELEFONO' | 'EMAIL' | 'WHATSAPP';

export interface ContactoCliente {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  fechaContacto: string;
  tipoContacto: TipoContacto;
  descripcion: string;
  resultado?: string;
  proximoContacto?: string;
  usuarioId?: number;
  usuario?: User;
}

// Current Account entity
export interface CuentaCorriente {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
  saldo: number;
  documentoComercialId?: number;
  documentoComercial?: DocumentoComercial;
  opcionFinanciamientoId?: number;
  opcionFinanciamiento?: OpcionFinanciamientoDTO;
  metodoPago?: MetodoPago;
  chequeId?: number;
  usuarioNombre?: string | null;
}

// Client related enums
export type TipoCliente = 'PERSONA_FISICA' | 'PERSONA_JURIDICA';
export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'MOROSO';
export type TipoContacto = 'VISITA' | 'LLAMADA' | 'EMAIL';
export type TipoMovimiento = 'DEBITO' | 'CREDITO';

// Create Client Request
export interface CreateClienteRequest {
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: ProvinciaEnum;
  codigoPostal?: string;
  tipo: TipoCliente;
  estado: EstadoCliente;
  limiteCredito: number;
  calificacion?: number;
}

// Create Contact Request
export interface CreateContactoClienteRequest {
  clienteId: number;
  fechaContacto: string;
  tipoContacto: TipoContacto;
  descripcion: string;
  resultado?: string;
  proximoContacto?: string;
}

// Create Current Account Movement Request
export interface CreateCuentaCorrienteRequest {
  clienteId: number;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
}
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  documentType: 'DNI' | 'CUIT' | 'PASSPORT';
  documentNumber: string;
  clientType: 'INDIVIDUAL' | 'COMPANY';
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  observations: string;
  createdAt: string;
  updatedAt: string;
}
export interface DocumentoCliente {
  id: number;
  clienteId: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanioBytes: number;
  descripcion?: string;
  categoria: string;
  fechaSubida: string;
  subidoPor: string;
}
export interface KPIsClienteDTO {
  totalFacturado: number;
  cantidadPresupuestos: number;
  cantidadNotasPedido: number;
  cantidadFacturas: number;
  cantidadNotasCredito: number;
  ticketPromedioFacturas: number;
  /** Tasa 0..1: presupuestos del cliente que terminaron en factura. */
  tasaConversionPresupuestoFactura: number;
}
