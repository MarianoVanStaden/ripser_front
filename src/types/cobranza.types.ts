// ==================== ENUMS ====================

export const EstadoGestionCobranza = {
  NUEVA: 'NUEVA',
  EN_GESTION: 'EN_GESTION',
  PROMETIO_PAGO: 'PROMETIO_PAGO',
  ACUERDO_CUOTAS: 'ACUERDO_CUOTAS',
  EN_LEGAL: 'EN_LEGAL',
  RECUPERADA: 'RECUPERADA',
  INCOBRABLE: 'INCOBRABLE',
} as const;
export type EstadoGestionCobranza = typeof EstadoGestionCobranza[keyof typeof EstadoGestionCobranza];

export const PrioridadCobranza = {
  ALTA: 'ALTA',
  MEDIA: 'MEDIA',
  BAJA: 'BAJA',
} as const;
export type PrioridadCobranza = typeof PrioridadCobranza[keyof typeof PrioridadCobranza];

export const TipoAccionCobranza = {
  LLAMADA: 'LLAMADA',
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  VISITA_DOMICILIO: 'VISITA_DOMICILIO',
  CARTA_DOCUMENTO: 'CARTA_DOCUMENTO',
  NOTIFICACION_LEGAL: 'NOTIFICACION_LEGAL',
  ACUERDO_PAGO: 'ACUERDO_PAGO',
  OTRO: 'OTRO',
} as const;
export type TipoAccionCobranza = typeof TipoAccionCobranza[keyof typeof TipoAccionCobranza];

export const ResultadoAccionCobranza = {
  CONTACTADO: 'CONTACTADO',
  NO_CONTESTA: 'NO_CONTESTA',
  NUMERO_EQUIVOCADO: 'NUMERO_EQUIVOCADO',
  PROMETIO_PAGO: 'PROMETIO_PAGO',
  ACUERDO_PARCIAL: 'ACUERDO_PARCIAL',
  NEGO_PAGO: 'NEGO_PAGO',
  SIN_FONDOS: 'SIN_FONDOS',
  VISITA_REALIZADA: 'VISITA_REALIZADA',
  SIN_RESULTADO: 'SIN_RESULTADO',
} as const;
export type ResultadoAccionCobranza = typeof ResultadoAccionCobranza[keyof typeof ResultadoAccionCobranza];

export const TipoRecordatorioCobranza = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  TAREA: 'TAREA',
  NOTIFICACION: 'NOTIFICACION',
  WHATSAPP: 'WHATSAPP',
  LLAMADA: 'LLAMADA',
} as const;
export type TipoRecordatorioCobranza = typeof TipoRecordatorioCobranza[keyof typeof TipoRecordatorioCobranza];

// ==================== LABELS ====================

export const ESTADO_GESTION_COBRANZA_LABELS: Record<EstadoGestionCobranza, string> = {
  NUEVA: 'Nueva',
  EN_GESTION: 'En Gestión',
  PROMETIO_PAGO: 'Prometió Pago',
  ACUERDO_CUOTAS: 'Acuerdo Cuotas',
  EN_LEGAL: 'En Legal',
  RECUPERADA: 'Recuperada',
  INCOBRABLE: 'Incobrable',
};

export const PRIORIDAD_COBRANZA_LABELS: Record<PrioridadCobranza, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

export const TIPO_ACCION_COBRANZA_LABELS: Record<TipoAccionCobranza, string> = {
  LLAMADA: 'Llamada',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  EMAIL: 'Email',
  VISITA_DOMICILIO: 'Visita Domicilio',
  CARTA_DOCUMENTO: 'Carta Documento',
  NOTIFICACION_LEGAL: 'Notificación Legal',
  ACUERDO_PAGO: 'Acuerdo de Pago',
  OTRO: 'Otro',
};

export const RESULTADO_ACCION_COBRANZA_LABELS: Record<ResultadoAccionCobranza, string> = {
  CONTACTADO: 'Contactado',
  NO_CONTESTA: 'No Contesta',
  NUMERO_EQUIVOCADO: 'Número Equivocado',
  PROMETIO_PAGO: 'Prometió Pago',
  ACUERDO_PARCIAL: 'Acuerdo Parcial',
  NEGO_PAGO: 'Negó Pago',
  SIN_FONDOS: 'Sin Fondos',
  VISITA_REALIZADA: 'Visita Realizada',
  SIN_RESULTADO: 'Sin Resultado',
};

export const TIPO_RECORDATORIO_COBRANZA_LABELS: Record<TipoRecordatorioCobranza, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  TAREA: 'Tarea',
  NOTIFICACION: 'Notificación',
  WHATSAPP: 'WhatsApp',
  LLAMADA: 'Llamada',
};

// ==================== COLORS ====================

export const ESTADO_GESTION_COBRANZA_COLORS: Record<EstadoGestionCobranza, string> = {
  NUEVA: '#2196F3',
  EN_GESTION: '#FF9800',
  PROMETIO_PAGO: '#9C27B0',
  ACUERDO_CUOTAS: '#00BCD4',
  EN_LEGAL: '#F44336',
  RECUPERADA: '#4CAF50',
  INCOBRABLE: '#9E9E9E',
};

export const PRIORIDAD_COBRANZA_COLORS: Record<PrioridadCobranza, string> = {
  ALTA: '#F44336',
  MEDIA: '#FF9800',
  BAJA: '#9CA3AF',
};

// Estados válidos para cerrar una gestión
export const ESTADOS_CIERRE: EstadoGestionCobranza[] = [
  EstadoGestionCobranza.RECUPERADA,
  EstadoGestionCobranza.INCOBRABLE,
  EstadoGestionCobranza.EN_LEGAL,
  EstadoGestionCobranza.ACUERDO_CUOTAS,
  EstadoGestionCobranza.PROMETIO_PAGO,
];

// ==================== DTOs ====================

export interface GestionCobranzaDTO {
  id: number;
  empresaId: number;
  prestamoId: number;
  clienteNombre: string;
  clienteApellido: string;
  clienteTelefono: string;
  diasVencido: number;
  estado: EstadoGestionCobranza;
  prioridad: PrioridadCobranza | null;
  agenteId: number | null;
  activa: boolean;
  montoPendiente: number;
  diasVencidoApertura: number;
  fechaApertura: string;
  fechaCierre: string | null;
  fechaProximaGestion: string | null;
  fechaPrometePago: string | null;
  montoPrometido: number | null;
  observaciones: string | null;
  totalAcciones: number;
  recordatoriosPendientes: number;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateGestionCobranzaDTO {
  prestamoId: number;
  agenteId?: number;
  prioridad?: PrioridadCobranza;
  montoPendiente?: number;
  fechaProximaGestion?: string;
  observaciones?: string;
}

export interface UpdateGestionCobranzaDTO {
  estado?: EstadoGestionCobranza;
  prioridad?: PrioridadCobranza;
  agenteId?: number;
  fechaProximaGestion?: string;
  fechaPrometePago?: string;
  montoPrometido?: number;
  observaciones?: string;
}

export interface AccionCobranzaDTO {
  id: number;
  gestionId: number;
  prestamoId: number;
  usuarioId: number | null;
  tipo: TipoAccionCobranza;
  resultado: ResultadoAccionCobranza | null;
  fecha: string;
  descripcion: string | null;
  duracionMinutos: number | null;
  fechaPrometePago: string | null;
  fechaProximoContacto: string | null;
  fechaCreacion: string;
}

export interface CreateAccionCobranzaDTO {
  gestionId: number;
  tipo: TipoAccionCobranza;
  resultado?: ResultadoAccionCobranza;
  fecha?: string;
  descripcion?: string;
  duracionMinutos?: number;
  fechaPrometePago?: string;
  fechaProximoContacto?: string;
  actualizarGestion?: boolean;
}

export interface RecordatorioCobranzaDTO {
  id: number;
  gestionId: number;
  prestamoId: number;
  usuarioAsignadoId: number | null;
  fechaRecordatorio: string;
  hora: string | null;
  tipo: TipoRecordatorioCobranza;
  prioridad: PrioridadCobranza;
  mensaje: string | null;
  completado: boolean;
  fechaCompletado: string | null;
  fechaCreacion: string;
}

export interface CreateRecordatorioCobranzaDTO {
  gestionId: number;
  fechaRecordatorio: string;
  usuarioAsignadoId?: number;
  hora?: string;
  tipo?: TipoRecordatorioCobranza;
  prioridad?: PrioridadCobranza;
  mensaje?: string;
}

export interface ResumenCobranzaDTO {
  totalGestionesActivas: number;
  totalMontoPendiente: number;
  gestionesPorEstado: Record<EstadoGestionCobranza, number>;
  promesasIncumplidas: number;
  gestionesVencidasHoy: number;
  recordatoriosPendientesAgente: number;
}
