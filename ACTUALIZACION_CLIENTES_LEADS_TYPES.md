# ✅ Actualización de Interfaces - Clientes y Leads

**Fecha:** 3 de Diciembre, 2025
**Estado:** Completado ✅

---

## 📋 Resumen

Se actualizaron las interfaces TypeScript del frontend para reflejar los cambios realizados en el backend de Clientes y Leads, incluyendo:

- ✅ Nuevos estados y campos en Leads
- ✅ Nuevos campos de métricas en Clientes
- ✅ Segmentación de clientes (VIP, PREMIUM, STANDARD, BASICO)
- ✅ Gestión de riesgo de churn
- ✅ Interacciones y recordatorios de Leads
- ✅ Prioridades de Leads (HOT, WARM, COLD)

---

## 🔄 Archivos Modificados

### 1. **src/types/lead.types.ts** ✅

#### Estados de Lead Actualizados
```typescript
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
```

#### Canales Actualizados
```typescript
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
```

#### Prioridades de Lead (NUEVO)
```typescript
export const PrioridadLeadEnum = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD'
} as const;

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
```

#### Interface LeadDTO Actualizada
```typescript
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
  fechaPrimerContacto?: string;
  fechaUltimoContacto?: string;
  fechaProximoSeguimiento?: string;
  usuarioAsignadoId?: number;
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
}
```

#### Interacciones de Lead (NUEVO)
```typescript
export interface InteraccionLeadDTO {
  id?: number;
  leadId: number;
  empresaId?: number;
  tipo: TipoInteraccionEnum; // LLAMADA, EMAIL, WHATSAPP, REUNION, VISITA, NOTA
  fecha: string;
  descripcion: string;
  resultado?: ResultadoInteraccionEnum; // EXITOSA, SIN_RESPUESTA, RECHAZADA, PENDIENTE
  duracionMinutos?: number;
  usuarioId?: number;
  usuarioNombre?: string;
  proximaAccion?: string;
  fechaProximaAccion?: string;
  fechaCreacion?: string;
}
```

#### Recordatorios de Lead (NUEVO)
```typescript
export interface RecordatorioLeadDTO {
  id?: number;
  leadId: number;
  empresaId?: number;
  fechaRecordatorio: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  tipo: TipoRecordatorioEnum; // TAREA, LLAMADA, EMAIL, REUNION
  mensaje: string;
  prioridad?: PrioridadRecordatorioEnum; // ALTA, MEDIA, BAJA
  enviado?: boolean;
  fechaEnvio?: string;
  usuarioId?: number;
  fechaCreacion?: string;
}
```

---

### 2. **src/types/index.ts** ✅

#### Interface Cliente Actualizada
```typescript
export interface Cliente {
  id: number;
  empresaId: number;
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

  // Métricas de Cliente (NUEVOS)
  totalCompras?: number;
  cantidadCompras?: number;
  ticketPromedio?: number;
  lifetimeValue?: number;
  fechaUltimaCompra?: string;
  diasDesdeUltimaCompra?: number;
  frecuenciaCompraDias?: number;

  // Relación con Lead (NUEVO)
  leadId?: number;
  fechaConversion?: string;
  productoComprado?: ProductoSimple;
  montoConversion?: number;
  canalAdquisicion?: string;

  // Preferencias y Contacto (NUEVO)
  aceptaMarketing?: boolean;
  preferenciaContacto?: PreferenciaContacto;
  horarioPreferidoContacto?: string;
  calificacion?: number;
  observaciones?: string;

  // Gestión (NUEVO)
  usuarioAsignadoId?: number;
  creadoPorId?: number;
  modificadoPorId?: number;
  fechaAlta: string;
  fechaActualizacion?: string;
  fechaBaja?: string;

  // Churn Management (NUEVO)
  enRiesgoChurn?: boolean;
  segmentoAutomatico?: SegmentoCliente;

  // Relaciones
  contactos?: ContactoCliente[];
  cuentaCorriente?: CuentaCorriente[];
  ventas?: Venta[];
  creditos?: CreditoCliente[];
}
```

#### Nuevos Types
```typescript
export interface ProductoSimple {
  id: number;
  nombre: string;
  precio: number;
}

export type SegmentoCliente = 'VIP' | 'PREMIUM' | 'STANDARD' | 'BASICO';
export type CondicionPago = 'CONTADO' | 'CREDITO';
export type PreferenciaContacto = 'TELEFONO' | 'EMAIL' | 'WHATSAPP';
```

---

## 🎨 Colores y Labels Actualizados

### Estados de Lead
| Estado | Color | Label |
|--------|-------|-------|
| PRIMER_CONTACTO | #3B82F6 (Azul) | Primer Contacto |
| EN_SEGUIMIENTO | #8B5CF6 (Púrpura) | En Seguimiento |
| CALIFICADO | #10B981 (Verde) | Calificado |
| PROPUESTA_ENVIADA | #F59E0B (Amarillo) | Propuesta Enviada |
| NEGOCIACION | #F97316 (Naranja) | Negociación |
| CONVERTIDO | #059669 (Verde oscuro) | Convertido |
| PERDIDO | #EF4444 (Rojo) | Perdido |
| DESCARTADO | #6B7280 (Gris) | Descartado |

### Canales de Adquisición
| Canal | Icono | Label |
|-------|-------|-------|
| WEB | 🌐 | Web |
| TELEFONO | 📞 | Teléfono |
| EMAIL | 📧 | Email |
| WHATSAPP | 💬 | WhatsApp |
| REFERIDO | 🤝 | Referido |
| FACEBOOK | 📘 | Facebook |
| INSTAGRAM | 📸 | Instagram |

---

## 🆕 Nuevas Funcionalidades Soportadas

### Para Leads:
1. ✅ **Sistema de Prioridades** (HOT, WARM, COLD)
2. ✅ **Scoring de Leads** (0-100 puntos)
3. ✅ **Historial de Interacciones** con tipos y resultados
4. ✅ **Sistema de Recordatorios** con prioridades
5. ✅ **Seguimiento de Conversión** con días hasta conversión
6. ✅ **Origen detallado** del lead (campo `origenDetalle`)
7. ✅ **Asignación de usuarios** responsables

### Para Clientes:
1. ✅ **Segmentación Automática** (VIP, PREMIUM, STANDARD, BASICO)
2. ✅ **Métricas de Valor**:
   - Ticket promedio
   - Lifetime Value (LTV)
   - Frecuencia de compra
3. ✅ **Gestión de Riesgo de Churn**
4. ✅ **Trazabilidad de Conversión** desde Lead
5. ✅ **Preferencias de Contacto**
6. ✅ **Clientes Corporativos** (flag especial)
7. ✅ **Condiciones de Pago y Crédito**

---

## 📊 Endpoints Nuevos Disponibles

### Leads
```
GET  /api/leads                           - Listar todos
POST /api/leads                           - Crear nuevo
GET  /api/leads/{id}                      - Obtener por ID
PUT  /api/leads/{id}                      - Actualizar
DELETE /api/leads/{id}                    - Eliminar
POST /api/leads/{id}/convertir            - Convertir a Cliente
GET  /api/leads/{id}/interacciones        - Historial interacciones
POST /api/leads/{id}/interacciones        - Agregar interacción
GET  /api/leads/{id}/recordatorios        - Lista recordatorios
POST /api/leads/{id}/recordatorios        - Crear recordatorio
GET  /api/dashboard/leads/statistics      - Estadísticas dashboard
```

### Clientes
```
GET  /api/clientes                        - Listar todos
POST /api/clientes                        - Crear nuevo
GET  /api/clientes/{id}                   - Obtener por ID
PUT  /api/clientes/{id}                   - Actualizar
DELETE /api/clientes/{id}                 - Eliminar
GET  /api/clientes/en-riesgo-churn        - Clientes en riesgo
POST /api/clientes/{id}/actualizar-metricas - Recalcular métricas
GET  /api/dashboard/clientes/statistics   - Estadísticas dashboard
```

---

## ✅ Checklist de Implementación

### Tipos y Interfaces ✅
- [x] Actualizar `EstadoLeadEnum` con nuevos estados
- [x] Actualizar `CanalEnum` con nuevos canales
- [x] Agregar `PrioridadLeadEnum`
- [x] Actualizar interface `LeadDTO`
- [x] Agregar interface `InteraccionLeadDTO`
- [x] Agregar interface `RecordatorioLeadDTO`
- [x] Actualizar interface `Cliente`
- [x] Agregar types de segmentación
- [x] Actualizar colores y labels

### Componentes Pendientes (Por Implementar)
- [ ] Actualizar `LeadsList` para mostrar prioridades
- [ ] Crear componente `LeadInteracciones`
- [ ] Crear componente `LeadRecordatorios`
- [ ] Actualizar `ClientesList` para mostrar segmento
- [ ] Crear componente `ClientesEnRiesgoChurn`
- [ ] Actualizar Dashboard con nuevas métricas
- [ ] Crear badges de prioridad de leads
- [ ] Crear badges de segmento de clientes

---

## 🎯 Próximos Pasos

1. **Actualizar APIs** en `src/api/services/`:
   - `leadApi.ts` - Agregar métodos para interacciones y recordatorios
   - `clientApi.ts` - Agregar método para clientes en riesgo

2. **Crear Componentes UI**:
   - `LeadPriorityBadge.tsx` - Badge de prioridad con colores
   - `ClienteSegmentoBadge.tsx` - Badge de segmentación
   - `ChurnRiskIndicator.tsx` - Indicador de riesgo de churn

3. **Actualizar Formularios**:
   - `LeadForm` - Agregar campos de prioridad, score, etc.
   - `ClienteForm` - Agregar campos de segmento, preferencias, etc.

4. **Dashboard Updates**:
   - Agregar métricas de leads por prioridad
   - Agregar métricas de clientes por segmento
   - Mostrar alertas de clientes en riesgo de churn

---

## 📝 Notas Importantes

### Retrocompatibilidad
- ✅ Se mantuvieron estados legacy de leads para compatibilidad
- ✅ Todos los campos nuevos son opcionales (`?`)
- ✅ No se eliminaron campos existentes

### Migraciones Necesarias
Si hay datos legacy, considerar:
1. Migrar estados antiguos a nuevos estados
2. Calcular métricas de clientes existentes
3. Asignar segmentos automáticos

---

**Implementado por:** Claude Code
**Fecha:** 3 de Diciembre, 2025
**Estado:** ✅ Completado - Listo para usar en componentes
