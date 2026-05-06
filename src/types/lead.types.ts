// Import shared enums
import type { ProvinciaEnum } from './shared.enums';
import type { RubroEnum } from './rubro.types';
export { ProvinciaEnum, PROVINCIA_LABELS } from './shared.enums';

// Enums as const objects (compatible with erasableSyntaxOnly)
export const CanalEnum = {
  WEB: 'WEB',
  TELEFONO: 'TELEFONO',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  REFERIDO: 'REFERIDO',
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  RECOMPRA: 'RECOMPRA'
} as const;

export type CanalEnum = typeof CanalEnum[keyof typeof CanalEnum];

export const EstadoLeadEnum = {
  PRIMER_CONTACTO: 'PRIMER_CONTACTO',
  MOSTRO_INTERES: 'MOSTRO_INTERES',
  CLIENTE_POTENCIAL: 'CLIENTE_POTENCIAL',
  CLIENTE_POTENCIAL_CALIFICADO: 'CLIENTE_POTENCIAL_CALIFICADO',
  VENTA: 'VENTA',
  CONVERTIDO: 'CONVERTIDO',
  DESCARTADO: 'DESCARTADO',
  PERDIDO: 'PERDIDO',
  LEAD_DUPLICADO: 'LEAD_DUPLICADO',
  PRECIO_ELEVADO: 'PRECIO_ELEVADO',
  COMPRA_ANULADA: 'COMPRA_ANULADA'
} as const;

export type EstadoLeadEnum = typeof EstadoLeadEnum[keyof typeof EstadoLeadEnum];

export const PrioridadLeadEnum = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD'
} as const;

export type PrioridadLeadEnum = typeof PrioridadLeadEnum[keyof typeof PrioridadLeadEnum];

// Próximo recordatorio embebido en LeadListItem (proyección reducida del listado).
export interface ProximoRecordatorioDTO {
  id: number;
  fechaRecordatorio: string; // ISO yyyy-mm-dd
  tipo?: string;
  prioridad?: string;
}

// Proyección reducida usada por GET /api/leads. Para detalle (form, edición)
// se sigue usando LeadDTO completo via GET /api/leads/{id}.
export interface LeadListItemDTO {
  id: number;
  sucursalId?: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  rubro?: RubroEnum;
  provincia?: ProvinciaEnum;
  canal: CanalEnum;
  estadoLead: EstadoLeadEnum;
  prioridad?: PrioridadLeadEnum;
  fechaPrimerContacto?: string;
  fechaUltimoContacto?: string;
  usuarioAsignadoId?: number;
  productoInteresNombre?: string;
  equipoFabricadoInteresNombre?: string;
  modeloEquipoInteres?: string;
  // Campos opcionales legacy que algunos backends devuelven; el JSX los chequea
  // con fallbacks. Si no vienen, el render cae al siguiente campo disponible.
  modeloRecetaInteres?: string;
  equipoInteresadoNombre?: string;
  clienteOrigenId?: number;
  proximoRecordatorio?: ProximoRecordatorioDTO | null;
}

// DTOs
export interface LeadDTO {
  id?: number;
  empresaId?: number;
  sucursalId?: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  telefonoAlternativo?: string;
  rubro?: RubroEnum;
  rubroDetalle?: string;
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
  colorRecetaInteresId?: number;
  medidaRecetaInteresId?: number;
  // Legacy fields (mantener por compatibilidad con backend)
  equipoFabricadoInteresId?: number;
  equipoFabricadoInteresNombre?: string;
  cantidadEquipoInteres?: number;
  modeloEquipoInteres?: string;
  /** Request side: foreign-key id to the colores catalog. */
  colorEquipoInteresId?: number;
  /** Response side: full color metadata loaded by the backend. */
  colorEquipoInteres?: import('./index').ColorEquipo;
  /** Request side: foreign-key id to the medidas catalog. */
  medidaEquipoInteresId?: number;
  /** Response side: full measure metadata loaded by the backend. */
  medidaEquipoInteres?: import('./index').MedidaEquipo;
  equipoInteresadoId?: number;
  equipoInteresadoNombre?: string;
  presupuestoEstimado?: number;
  prioridad?: PrioridadLeadEnum;
  score?: number;
  notas?: string;
  motivoRechazo?: string;
  fechaConversion?: string;
  diasHastaConversion?: number;
  clienteIdConvertido?: number;
  clienteOrigenId?: number;
  creadoPorId?: number;
  modificadoPorId?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  dias?: number; // calculado automáticamente
  recordatorios?: RecordatorioLeadDTO[];
  /** Marca de soft delete. null = vigente; ISO timestamp = en papelera. */
  deletedAt?: string;
  /** ID del usuario que ejecutó el soft-delete. */
  deletedById?: number;
  /** Username de quien borró, hidratado por el backend en /api/leads/papelera. */
  deletedByUsername?: string;
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
  OTRO: 'OTRO',
  NOTA: 'NOTA',
  CAMBIO_ESTADO: 'CAMBIO_ESTADO'
} as const;

export type TipoInteraccionEnum = typeof TipoInteraccionEnum[keyof typeof TipoInteraccionEnum];

export const ResultadoInteraccionEnum = {
  EXITOSA: 'EXITOSA',
  SIN_RESPUESTA: 'SIN_RESPUESTA',
  REAGENDAR: 'REAGENDAR',
  NO_INTERESADO: 'NO_INTERESADO',
  INTERESADO: 'INTERESADO',
  CONVERTIDO: 'CONVERTIDO'
} as const;

export type ResultadoInteraccionEnum = typeof ResultadoInteraccionEnum[keyof typeof ResultadoInteraccionEnum];

export interface InteraccionLeadDTO {
  id?: number;
  leadId: number;
  sucursalId?: number;
  tipo: TipoInteraccionEnum;
  fecha: string; // LocalDateTime ISO format
  descripcion: string;
  resultado?: ResultadoInteraccionEnum | null;
  duracionMinutos?: number | null;
  proximaAccion?: string | null; // LocalDate YYYY-MM-DD
  notasProximaAccion?: string | null;
  realizadoPorId?: number | null;
  fechaCreacion?: string; // LocalDateTime ISO format
  estadoAnterior?: EstadoLeadEnum | null;
  estadoNuevo?: EstadoLeadEnum | null;
}

// Recordatorios del Lead
export const TipoRecordatorioEnum = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  TAREA: 'TAREA',
  NOTIFICACION: 'NOTIFICACION',
  WHATSAPP: 'WHATSAPP',
  LLAMADA: 'LLAMADA'
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
  sucursalId?: number;
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
  sucursalId?: number;
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
  PRIMER_CONTACTO: '#3B82F6',
  MOSTRO_INTERES: '#8B5CF6',
  CLIENTE_POTENCIAL: '#F59E0B',
  CLIENTE_POTENCIAL_CALIFICADO: '#10B981',
  VENTA: '#059669',
  CONVERTIDO: '#059669',
  DESCARTADO: '#6B7280',
  PERDIDO: '#EF4444',
  LEAD_DUPLICADO: '#94A3B8',  // Gris azulado — descartado sin impacto en KPIs
  PRECIO_ELEVADO: '#F97316',  // Naranja — objeción de precio
  COMPRA_ANULADA: '#DC2626',  // Rojo intenso — caída de última instancia
};

export const ESTADO_LABELS: Record<EstadoLeadEnum, string> = {
  PRIMER_CONTACTO: 'Primer Contacto',
  MOSTRO_INTERES: 'Mostró Interés',
  CLIENTE_POTENCIAL: 'Cliente Potencial',
  CLIENTE_POTENCIAL_CALIFICADO: 'Cliente Potencial Calificado',
  VENTA: 'Venta',
  CONVERTIDO: 'Convertido',
  DESCARTADO: 'Descartado',
  PERDIDO: 'Perdido',
  LEAD_DUPLICADO: 'Lead Duplicado',
  PRECIO_ELEVADO: 'Rechazó por Precio Elevado',
  COMPRA_ANULADA: 'Compra Anulada',
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
  REFERIDO: 'Referido',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  RECOMPRA: 'Recompra'
};

export const CANAL_ICONS: Record<CanalEnum, string> = {
  WEB: '🌐',
  TELEFONO: '📞',
  EMAIL: '📧',
  WHATSAPP: '💬',
  REFERIDO: '🤝',
  FACEBOOK: '📘',
  INSTAGRAM: '📸',
  RECOMPRA: '🔄'
};

export const TIPO_INTERACCION_LABELS: Record<TipoInteraccionEnum, string> = {
  LLAMADA: 'Llamada',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  REUNION: 'Reunión',
  VISITA: 'Visita',
  OTRO: 'Otro',
  NOTA: 'Nota',
  CAMBIO_ESTADO: 'Cambio de estado'
};

export const TIPO_INTERACCION_ICONS: Record<TipoInteraccionEnum, string> = {
  LLAMADA: '📞',
  EMAIL: '📧',
  WHATSAPP: '💬',
  REUNION: '🤝',
  VISITA: '🚗',
  OTRO: '📋',
  NOTA: '📝',
  CAMBIO_ESTADO: '🔄'
};

// Error estructurado que devuelve el backend cuando se detecta teléfono duplicado (HTTP 409).
export interface DuplicatePhoneError {
  tipo: 'TELEFONO_DUPLICADO';
  existingId: number;
  existingType: 'LEAD' | 'CLIENTE';
  existingNombre: string;
  telefono: string;
}

// Respuesta de GET /api/leads/check-telefono — chequeo no destructivo en vivo
// (lo dispara el front en blur del campo). Mismos campos que DuplicatePhoneError
// más el flag `exists`; cuando es false, el resto viene en null.
export interface TelefonoCheckResponse {
  exists: boolean;
  existingId: number | null;
  existingType: 'LEAD' | 'CLIENTE' | null;
  existingNombre: string | null;
  telefono: string | null;
}

export const RESULTADO_INTERACCION_LABELS: Record<ResultadoInteraccionEnum, string> = {
  EXITOSA: 'Exitosa',
  SIN_RESPUESTA: 'Sin Respuesta',
  REAGENDAR: 'Reagendar',
  NO_INTERESADO: 'No Interesado',
  INTERESADO: 'Interesado',
  CONVERTIDO: 'Convertido'
};

export const RESULTADO_INTERACCION_COLORS: Record<ResultadoInteraccionEnum, string> = {
  EXITOSA: '#10B981',
  SIN_RESPUESTA: '#6B7280',
  REAGENDAR: '#F59E0B',
  NO_INTERESADO: '#EF4444',
  INTERESADO: '#3B82F6',
  CONVERTIDO: '#8B5CF6'
};
