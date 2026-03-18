# Contexto: Leads

## Descripcion General
El modulo de Leads gestiona el pipeline de prospectos comerciales, desde el primer contacto hasta la conversion a cliente. Soporta un tablero Kanban por estados, vista de tabla con filtros avanzados, metricas analiticas (embudo de ventas, conversion por canal, distribucion geografica, tendencias temporales), gestion global de recordatorios, y conversion automatica de lead a cliente. Los leads comparten permisos con el modulo CLIENTES y aparecen en su seccion del sidebar.

## Archivos del Modulo
- Paginas: `src/pages/leads/LeadsPage.tsx`, `src/pages/leads/LeadsTablePage.tsx`, `src/pages/leads/LeadDetailPage.tsx`, `src/pages/leads/LeadFormPage.tsx`, `src/pages/leads/LeadMetricasPage.tsx`, `src/pages/leads/ConvertLeadPage.tsx`, `src/pages/leads/GestionGlobalRecordatoriosPage.tsx`, `src/pages/leads/index.ts`
- Componentes: `src/components/leads/LeadFilters.tsx`, `src/components/leads/LeadStatusBadge.tsx`, `src/components/leads/LeadPriorityBadge.tsx`, `src/components/leads/CanalBadge.tsx`, `src/components/leads/InteraccionesTimeline.tsx`, `src/components/leads/PriorityQuickEdit.tsx`, `src/components/leads/ProximoRecordatorio.tsx`, `src/components/leads/RecordatorioStatusBadge.tsx`, `src/components/leads/index.ts`
- API Services: `src/api/services/leadApi.ts`, `src/api/services/leadMetricasApi.ts`, `src/api/services/recordatorioLeadApi.ts`
- Hooks: `src/hooks/useLeads.ts`, `src/hooks/useRecordatoriosLeads.ts`
- Types: `src/types/lead.types.ts`
- Utils: `src/utils/leadValidations.ts`, `src/utils/metricasExportUtils.ts`

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /leads | LeadsPage | PrivateRoute |
| /leads/table | LeadsTablePage | PrivateRoute |
| /leads/metricas | LeadMetricasPage | PrivateRoute |
| /leads/recordatorios | GestionGlobalRecordatoriosPage | PrivateRoute |
| /leads/nuevo | LeadFormPage | PrivateRoute |
| /leads/:id | LeadDetailPage | PrivateRoute |
| /leads/:id/editar | LeadFormPage | PrivateRoute |
| /leads/:id/convertir | ConvertLeadPage | PrivateRoute |

## Endpoints API Consumidos

### leadApi (`/api/leads`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/leads` | Listar leads paginados con filtros (estados, canales, provincias, prioridad, usuarioId, busqueda, fechaDesde, fechaHasta, sucursalId, clienteOrigenId) |
| GET | `/api/leads/{id}` | Obtener lead por ID |
| GET | `/api/leads/proximos-seguimiento` | Leads con seguimiento proximo |
| POST | `/api/leads` | Crear nuevo lead |
| PUT | `/api/leads/{id}` | Actualizar lead |
| DELETE | `/api/leads/{id}` | Eliminar lead |
| POST | `/api/leads/{id}/convertir` | Convertir lead a cliente |
| GET | `/api/leads/{leadId}/interacciones` | Historial de interacciones del lead |
| POST | `/api/leads/{leadId}/interacciones` | Agregar interaccion |
| PUT | `/api/leads/{leadId}/interacciones/{interaccionId}` | Actualizar interaccion |
| DELETE | `/api/leads/{leadId}/interacciones/{interaccionId}` | Eliminar interaccion |
| GET | `/api/leads/{leadId}/recordatorios` | Recordatorios del lead |
| POST | `/api/leads/{leadId}/recordatorios` | Crear recordatorio |
| PUT | `/api/leads/{leadId}/recordatorios/{recordatorioId}` | Actualizar recordatorio |
| DELETE | `/api/leads/{leadId}/recordatorios/{recordatorioId}` | Eliminar recordatorio |
| PATCH | `/api/leads/{leadId}/recordatorios/{recordatorioId}/marcar-enviado` | Marcar recordatorio como completado |
| GET | `/api/dashboard/leads/statistics` | Estadisticas del dashboard |

### leadMetricasApi (`/api/leads/metricas`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/leads/metricas` | Metricas completas con filtros (fechaInicio, fechaFin, sucursalId, usuarioAsignadoId) |
| GET | `/api/leads/metricas/comparacion-mensual` | Comparacion de metricas por mes |

### recordatorioLeadApi (`/api/recordatorios`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/recordatorios` | Listar recordatorios globales paginados con filtros (enviado, fechaDesde, fechaHasta, usuarioId, prioridad, tipo, sucursalId) |
| GET | `/api/recordatorios/conteos` | Conteos globales (totalPendientes, vencidos, hoy) |
| PATCH | `/api/recordatorios/{recordatorioId}/marcar-enviado` | Marcar recordatorio como enviado |
| PUT | `/api/recordatorios/{recordatorioId}` | Actualizar recordatorio |

## Tipos Principales

### LeadDTO
```typescript
interface LeadDTO {
  id?: number;
  empresaId?: number;
  sucursalId?: number;
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
  productoInteresId?: number;
  productoInteresNombre?: string;
  recetaInteresId?: number;
  presupuestoEstimado?: number;
  prioridad?: PrioridadLeadEnum;
  score?: number;
  notas?: string;
  motivoRechazo?: string;
  fechaConversion?: string;
  diasHastaConversion?: number;
  clienteIdConvertido?: number;
  clienteOrigenId?: number;
  recordatorios?: RecordatorioLeadDTO[];
}
```

### EstadoLeadEnum
`PRIMER_CONTACTO | MOSTRO_INTERES | CLIENTE_POTENCIAL | CLIENTE_POTENCIAL_CALIFICADO | CONVERTIDO | VENTA | PERDIDO | DESCARTADO`

### PrioridadLeadEnum
`HOT | WARM | COLD`

### CanalEnum
`WEB | TELEFONO | EMAIL | WHATSAPP | REFERIDO | FACEBOOK | INSTAGRAM | RECOMPRA`

### InteraccionLeadDTO
```typescript
interface InteraccionLeadDTO {
  id?: number;
  leadId: number;
  tipo: TipoInteraccionEnum; // LLAMADA, EMAIL, WHATSAPP, REUNION, VISITA, OTRO
  fecha: string;
  descripcion: string;
  resultado?: ResultadoInteraccionEnum; // EXITOSO, SIN_RESPUESTA, REAGENDAR, NO_INTERESADO, INTERESADO
  duracionMinutos?: number;
  proximaAccion?: string;
  notasProximaAccion?: string;
}
```

### RecordatorioLeadDTO
```typescript
interface RecordatorioLeadDTO {
  id?: number;
  leadId: number;
  empresaId?: number;
  sucursalId?: number;
  fechaRecordatorio: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  tipo: TipoRecordatorioEnum; // EMAIL, SMS, TAREA, NOTIFICACION, WHATSAPP, LLAMADA
  mensaje?: string;
  prioridad?: PrioridadRecordatorioEnum; // ALTA, MEDIA, BAJA
  enviado?: boolean;
}
```

### ConversionLeadRequest / ConversionLeadResponse
```typescript
interface ConversionLeadRequest {
  productoCompradoId?: number;
  montoConversion?: number;
  emailCliente?: string;
  direccionCliente?: string;
  ciudadCliente?: string;
}

interface ConversionLeadResponse {
  clienteId: number;
  leadId: number;
  fechaConversion: string;
  mensaje: string;
}
```

### LeadMetricasResponseDTO (respuesta completa de metricas)
Contiene:
- `tasaConversion`: TasaConversionDTO (total, convertidos, tasa, variacion)
- `embudoVentas`: EmbudoVentasDTO[] (estado, cantidad, porcentaje, orden)
- `metricasPorCanal`: MetricaPorCanalDTO[] (canal, leads, convertidos, tasa)
- `metricasPorPrioridad`: MetricaPorPrioridadDTO[] (prioridad, cantidad, convertidos, tasa)
- `tiempoConversion`: TiempoConversionDTO (promedio, mediana, minimo, maximo, por canal, por prioridad)
- `distribucionGeografica`: MetricaGeograficaDTO[] (provincia, leads, convertidos, tasa)
- `productosInteres`: ProductosInteresDTO (productos y equipos mas solicitados)
- `metricasPorVendedor`: MetricaPorVendedorDTO[] (vendedor, leads, convertidos, tasa, valor)
- `tendenciasTemporales`: TendenciasTemporalesDTO (leads y conversiones por mes)
- `presupuestoVsRealizado`: PresupuestoVsRealizadoDTO (estimado vs realizado)

## Permisos y Roles
- **Modulo**: CLIENTES (comparte permisos con el modulo de clientes)
- **Roles con acceso**: ADMIN, OFICINA, VENDEDOR, ADMIN_EMPRESA, GERENTE_SUCURSAL

## Multi-tenant
- `LeadDTO` incluye `empresaId` y `sucursalId` para aislamiento multi-tenant.
- Los filtros de `leadApi.getAll()` aceptan `sucursalId` para segmentar leads por sucursal.
- `leadMetricasApi` acepta `sucursalId` y `usuarioAsignadoId` como filtros.
- `recordatorioLeadApi` filtra por `sucursalId` y `usuarioId`.
- El header `X-Empresa-Id` asegura aislamiento por empresa.

## Dependencias entre Modulos
- **Clientes**: La conversion de un lead crea un nuevo cliente en el sistema. El campo `clienteOrigenId` permite vincular un lead a un cliente existente (para recompras).
- **Ventas**: El `VentasDashboard` consume datos de leads y metricas de leads para el dashboard de CRM integrado.
- **Productos/Inventario**: Los leads referencian productos de interes (`productoInteresId`) y recetas de fabricacion (`recetaInteresId`).
- **Usuarios**: Los leads se asignan a vendedores via `usuarioAsignadoId`.

## Patrones Especificos
- **Hook useLeads**: Gestiona lista paginada de leads con `loadLeads(filters, page, size)`, `createLead()`, `updateLead()`, `deleteLead()`. Incluye `useLead(id)` para cargar un lead individual.
- **Hook useRecordatoriosLeads**: Sistema robusto con fallback. Primero intenta el endpoint global `/api/recordatorios`, si falla (403/404), carga recordatorios via leads individuales (`loadViaLeads`). Soporta `marcarCompletado()`, `reprogramar()`, `crearInteraccion()`, `crearRecordatorio()`.
- **Validaciones**: `leadValidations.ts` valida campos obligatorios (nombre, telefono, canal, estado) y conversion (email, monto > 0). Incluye utilidades de formato (`formatPhone`, `formatDate`, `formatCurrency`).
- **Exportacion de metricas**: `metricasExportUtils.ts` exporta metricas a PDF (con encabezado corporativo Ripser usando jsPDF y jspdf-autotable) y a Excel (usando xlsx). Incluye tablas de embudo de ventas, metricas por canal, distribucion geografica, etc.
- **Componentes visuales**: Badges de color para estado (`LeadStatusBadge`), prioridad (`LeadPriorityBadge`) y canal (`CanalBadge`). Timeline de interacciones (`InteraccionesTimeline`). Edicion rapida de prioridad (`PriorityQuickEdit`).
- **Constantes de UI**: Colores (`ESTADO_COLORS`, `PRIORIDAD_COLORS`), labels (`ESTADO_LABELS`, `PRIORIDAD_LABELS`, `CANAL_LABELS`), e iconos (`CANAL_ICONS`, `TIPO_INTERACCION_ICONS`) definidos en `lead.types.ts`.
- **En sidebar**: Los leads aparecen bajo la seccion CLIENTES, no tienen su propia seccion independiente.
- **Ordenamiento de recordatorios**: Se ordenan por fecha y luego por prioridad del lead (HOT primero) y score (mayor primero).
