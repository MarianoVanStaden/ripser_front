// Enums as const objects (compatible with erasableSyntaxOnly)
export const CanalEnum = {
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  WHATSAPP: 'WHATSAPP',
  WEB: 'WEB',
  REFERIDO: 'REFERIDO'
} as const;

export type CanalEnum = typeof CanalEnum[keyof typeof CanalEnum];

export const EstadoLeadEnum = {
  PRIMER_CONTACTO: 'PRIMER_CONTACTO',
  MOSTRO_INTERES: 'MOSTRO_INTERES',
  CLIENTE_POTENCIAL: 'CLIENTE_POTENCIAL',
  CLIENTE_POTENCIAL_CALIFICADO: 'CLIENTE_POTENCIAL_CALIFICADO',
  VENTA: 'VENTA',
  DESCARTADO: 'DESCARTADO',
  CONVERTIDO: 'CONVERTIDO'
} as const;

export type EstadoLeadEnum = typeof EstadoLeadEnum[keyof typeof EstadoLeadEnum];

export const ProvinciaEnum = {
  BUENOS_AIRES: 'BUENOS_AIRES',
  CABA: 'CABA',
  CATAMARCA: 'CATAMARCA',
  CHACO: 'CHACO',
  CHUBUT: 'CHUBUT',
  CORDOBA: 'CORDOBA',
  CORRIENTES: 'CORRIENTES',
  ENTRE_RIOS: 'ENTRE_RIOS',
  FORMOSA: 'FORMOSA',
  JUJUY: 'JUJUY',
  LA_PAMPA: 'LA_PAMPA',
  LA_RIOJA: 'LA_RIOJA',
  MENDOZA: 'MENDOZA',
  MISIONES: 'MISIONES',
  NEUQUEN: 'NEUQUEN',
  RIO_NEGRO: 'RIO_NEGRO',
  SALTA: 'SALTA',
  SAN_JUAN: 'SAN_JUAN',
  SAN_LUIS: 'SAN_LUIS',
  SANTA_CRUZ: 'SANTA_CRUZ',
  SANTA_FE: 'SANTA_FE',
  SANTIAGO_DEL_ESTERO: 'SANTIAGO_DEL_ESTERO',
  TIERRA_DEL_FUEGO: 'TIERRA_DEL_FUEGO',
  TUCUMAN: 'TUCUMAN'
} as const;

export type ProvinciaEnum = typeof ProvinciaEnum[keyof typeof ProvinciaEnum];

// DTOs
export interface LeadDTO {
  id?: number;
  nombre: string;
  telefono: string;
  provincia?: ProvinciaEnum;
  canal: CanalEnum;
  estadoLead: EstadoLeadEnum;
  fechaPrimerContacto?: string; // formato: "YYYY-MM-DD"
  dias?: number; // calculado automáticamente
  equipoInteresadoId?: number;
  equipoInteresadoNombre?: string;
  recordatorio1Fecha?: string;
  recordatorio1Enviado?: boolean;
  recordatorio2Fecha?: string;
  recordatorio2Enviado?: boolean;
  fechaConversion?: string;
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
  MOSTRO_INTERES: '#8B5CF6', // Púrpura
  CLIENTE_POTENCIAL: '#F59E0B', // Amarillo
  CLIENTE_POTENCIAL_CALIFICADO: '#10B981', // Verde
  VENTA: '#059669', // Verde oscuro
  DESCARTADO: '#EF4444', // Rojo
  CONVERTIDO: '#06B6D4' // Cyan
};

export const ESTADO_LABELS: Record<EstadoLeadEnum, string> = {
  PRIMER_CONTACTO: 'Primer Contacto',
  MOSTRO_INTERES: 'Mostró Interés',
  CLIENTE_POTENCIAL: 'Cliente Potencial',
  CLIENTE_POTENCIAL_CALIFICADO: 'Cliente Potencial Calificado',
  VENTA: 'Venta',
  DESCARTADO: 'Descartado',
  CONVERTIDO: 'Convertido'
};

export const CANAL_LABELS: Record<CanalEnum, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  WHATSAPP: 'WhatsApp',
  WEB: 'Web',
  REFERIDO: 'Referido'
};

export const CANAL_ICONS: Record<CanalEnum, string> = {
  FACEBOOK: '📘',
  INSTAGRAM: '📸',
  WHATSAPP: '💬',
  WEB: '🌐',
  REFERIDO: '🤝'
};

export const PROVINCIA_LABELS: Record<ProvinciaEnum, string> = {
  BUENOS_AIRES: 'Buenos Aires',
  CABA: 'Ciudad Autónoma de Buenos Aires',
  CATAMARCA: 'Catamarca',
  CHACO: 'Chaco',
  CHUBUT: 'Chubut',
  CORDOBA: 'Córdoba',
  CORRIENTES: 'Corrientes',
  ENTRE_RIOS: 'Entre Ríos',
  FORMOSA: 'Formosa',
  JUJUY: 'Jujuy',
  LA_PAMPA: 'La Pampa',
  LA_RIOJA: 'La Rioja',
  MENDOZA: 'Mendoza',
  MISIONES: 'Misiones',
  NEUQUEN: 'Neuquén',
  RIO_NEGRO: 'Río Negro',
  SALTA: 'Salta',
  SAN_JUAN: 'San Juan',
  SAN_LUIS: 'San Luis',
  SANTA_CRUZ: 'Santa Cruz',
  SANTA_FE: 'Santa Fe',
  SANTIAGO_DEL_ESTERO: 'Santiago del Estero',
  TIERRA_DEL_FUEGO: 'Tierra del Fuego',
  TUCUMAN: 'Tucumán'
};
