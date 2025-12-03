// Import shared enums
import type { ProvinciaEnum } from './shared.enums';
export { ProvinciaEnum, PROVINCIA_LABELS } from './shared.enums';

// Enums as const objects (compatible with erasableSyntaxOnly)
export const CanalEnum = {
  WEB: 'WEB',
  TELEFONO: 'TELEFONO',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  REDES_SOCIALES: 'REDES_SOCIALES',
  REFERIDO: 'REFERIDO',
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM'
} as const;

export type CanalEnum = typeof CanalEnum[keyof typeof CanalEnum];

export const EstadoLeadEnum = {
  PRIMER_CONTACTO: 'PRIMER_CONTACTO',
  EN_SEGUIMIENTO: 'EN_SEGUIMIENTO',
  CALIFICADO: 'CALIFICADO',
  PROPUESTA_ENVIADA: 'PROPUESTA_ENVIADA',
  NEGOCIACION: 'NEGOCIACION',
  CONVERTIDO: 'CONVERTIDO',
  PERDIDO: 'PERDIDO',
  DESCARTADO: 'DESCARTADO',
  // Legacy states for backward compatibility
  MOSTRO_INTERES: 'MOSTRO_INTERES',
  CLIENTE_POTENCIAL: 'CLIENTE_POTENCIAL',
  CLIENTE_POTENCIAL_CALIFICADO: 'CLIENTE_POTENCIAL_CALIFICADO',
  VENTA: 'VENTA'
} as const;

export type EstadoLeadEnum = typeof EstadoLeadEnum[keyof typeof EstadoLeadEnum];

export const PrioridadLeadEnum = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD'
} as const;

export type PrioridadLeadEnum = typeof PrioridadLeadEnum[keyof typeof PrioridadLeadEnum];

// DTOs
export interface LeadDTO {
  id?: number;
  empresaId?: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  telefonoAlternativo?: string;
  email?: string;
  provincia?: ProvinciaEnum;
  ciudad?: string;
  canal: CanalEnum;
  origenDetalle?: string;
  estadoLead: EstadoLeadEnum;
  fechaPrimerContacto?: string; // formato: "YYYY-MM-DD"
  fechaUltimoContacto?: string;
  fechaProximoSeguimiento?: string;
  usuarioAsignadoId?: number;
  // Producto de interés
  productoInteresId?: number;
  productoInteresNombre?: string;
  cantidadProductoInteres?: number;
  // Receta de fabricación de interés (usuario edita modelo, color, medida)
  recetaInteresId?: number;
  recetaInteresNombre?: string;
  cantidadRecetaInteres?: number;
  modeloRecetaInteres?: string;
  colorRecetaInteres?: string;
  medidaRecetaInteres?: string;
  // Legacy fields (mantener por compatibilidad con backend)
  equipoFabricadoInteresId?: number;
  equipoFabricadoInteresNombre?: string;
  cantidadEquipoInteres?: number;
  modeloEquipoInteres?: string;
  colorEquipoInteres?: string;
  medidaEquipoInteres?: string;
  equipoInteresadoId?: number;
  equipoInteresadoNombre?: string;
  presupuestoEstimado?: number;
  prioridad?: PrioridadLeadEnum;
  score?: number;
  notas?: string;
  motivoRechazo?: string;
  fechaConversion?: string;
  diasHastaConversion?: number;
  creadoPorId?: number;
  modificadoPorId?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  dias?: number; // calculado automáticamente
  recordatorios?: RecordatorioLeadDTO[];
}

export interface ConversionLeadRequest {
  productoCompradoId?: number;
  montoConversion?: number;
  emailCliente?: string;
  direccionCliente?: string;
  ciudadCliente?: string;
}

export interface ConversionLeadResponse {
  clienteId: number;
  leadId: number;
  fechaConversion: string;
  productoComprado?: string;
  montoConversion?: number;
  mensaje: string;
}

// Interacciones del Lead
export const TipoInteraccionEnum = {
  LLAMADA: 'LLAMADA',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  REUNION: 'REUNION',
  VISITA: 'VISITA',
  VIDEOLLAMADA: 'VIDEOLLAMADA'
} as const;

export type TipoInteraccionEnum = typeof TipoInteraccionEnum[keyof typeof TipoInteraccionEnum];

export const ResultadoInteraccionEnum = {
  EXITOSA: 'EXITOSA',
  SIN_RESPUESTA: 'SIN_RESPUESTA',
  RECHAZADA: 'RECHAZADA',
  PENDIENTE: 'PENDIENTE'
} as const;

export type ResultadoInteraccionEnum = typeof ResultadoInteraccionEnum[keyof typeof ResultadoInteraccionEnum];

export interface InteraccionLeadDTO {
  id?: number;
  leadId: number;
  empresaId?: number;
  tipo: TipoInteraccionEnum;
  fecha: string; // ISO format
  descripcion: string;
  resultado?: ResultadoInteraccionEnum;
  duracionMinutos?: number;
  usuarioId?: number;
  usuarioNombre?: string;
  proximaAccion?: string;
  fechaProximaAccion?: string;
  fechaCreacion?: string;
}

// Recordatorios del Lead
export const TipoRecordatorioEnum = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  TAREA: 'TAREA',
  NOTIFICACION: 'NOTIFICACION'
} as const;

export type TipoRecordatorioEnum = typeof TipoRecordatorioEnum[keyof typeof TipoRecordatorioEnum];

export const PrioridadRecordatorioEnum = {
  ALTA: 'ALTA',
  MEDIA: 'MEDIA',
  BAJA: 'BAJA'
} as const;

export type PrioridadRecordatorioEnum = typeof PrioridadRecordatorioEnum[keyof typeof PrioridadRecordatorioEnum];

export interface RecordatorioLeadDTO {
  id?: number;
  leadId: number;
  empresaId?: number;
  fechaRecordatorio: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  tipo: TipoRecordatorioEnum;
  mensaje?: string;
  prioridad?: PrioridadRecordatorioEnum;
  enviado?: boolean;
  fechaEnvio?: string;
  usuarioId?: number;
  fechaCreacion?: string;
}

// Filtros
export interface LeadFilterState {
  estados?: EstadoLeadEnum[];
  canales?: CanalEnum[];
  provincias?: ProvinciaEnum[];
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}

// Validaciones
export interface ValidationErrors {
  [key: string]: string;
}

// Constantes
export const ESTADO_COLORS: Record<EstadoLeadEnum, string> = {
  PRIMER_CONTACTO: '#3B82F6', // Azul
  EN_SEGUIMIENTO: '#8B5CF6', // Púrpura
  CALIFICADO: '#10B981', // Verde
  PROPUESTA_ENVIADA: '#F59E0B', // Amarillo
  NEGOCIACION: '#F97316', // Naranja
  CONVERTIDO: '#059669', // Verde oscuro
  PERDIDO: '#EF4444', // Rojo
  DESCARTADO: '#6B7280', // Gris
  // Legacy states
  MOSTRO_INTERES: '#8B5CF6', // Púrpura
  CLIENTE_POTENCIAL: '#F59E0B', // Amarillo
  CLIENTE_POTENCIAL_CALIFICADO: '#10B981', // Verde
  VENTA: '#059669' // Verde oscuro
};

export const ESTADO_LABELS: Record<EstadoLeadEnum, string> = {
  PRIMER_CONTACTO: 'Primer Contacto',
  EN_SEGUIMIENTO: 'En Seguimiento',
  CALIFICADO: 'Calificado',
  PROPUESTA_ENVIADA: 'Propuesta Enviada',
  NEGOCIACION: 'Negociación',
  CONVERTIDO: 'Convertido',
  PERDIDO: 'Perdido',
  DESCARTADO: 'Descartado',
  // Legacy states
  MOSTRO_INTERES: 'Mostró Interés',
  CLIENTE_POTENCIAL: 'Cliente Potencial',
  CLIENTE_POTENCIAL_CALIFICADO: 'Cliente Potencial Calificado',
  VENTA: 'Venta'
};

export const PRIORIDAD_COLORS: Record<PrioridadLeadEnum, string> = {
  HOT: '#EF4444', // Rojo
  WARM: '#F59E0B', // Amarillo/Naranja
  COLD: '#3B82F6' // Azul
};

export const PRIORIDAD_LABELS: Record<PrioridadLeadEnum, string> = {
  HOT: 'Caliente 🔥',
  WARM: 'Tibio ⚡',
  COLD: 'Frío ❄️'
};

export const CANAL_LABELS: Record<CanalEnum, string> = {
  WEB: 'Web',
  TELEFONO: 'Teléfono',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  REDES_SOCIALES: 'Redes Sociales',
  REFERIDO: 'Referido',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram'
};

export const CANAL_ICONS: Record<CanalEnum, string> = {
  WEB: '🌐',
  TELEFONO: '📞',
  EMAIL: '📧',
  WHATSAPP: '💬',
  REDES_SOCIALES: '📱',
  REFERIDO: '🤝',
  FACEBOOK: '📘',
  INSTAGRAM: '📸'
};
