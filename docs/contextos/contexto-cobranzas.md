# Contexto: Cobranzas

## Descripcion General
Modulo de gestion de cobranzas para prestamos en mora. Permite abrir gestiones de cobranza sobre prestamos impagos, registrar acciones de contacto (llamadas, visitas, WhatsApp, cartas documento, etc.), programar recordatorios de seguimiento y gestionar el ciclo de vida de la deuda desde la apertura hasta la recuperacion o declaracion de incobrable. Esta fisicamente ubicado dentro de la carpeta Prestamos pero funciona como seccion independiente en el sidebar.

## Archivos del Modulo
- Componentes:
  - `src/components/Prestamos/Cobranzas/CobranzasResumenPage.tsx` - Dashboard con KPIs de cobranza
  - `src/components/Prestamos/Cobranzas/CobranzasListPage.tsx` - Listado de gestiones con filtros y toggle activas/historial
  - `src/components/Prestamos/Cobranzas/GestionCobranzaDetailPage.tsx` - Detalle con tabs: acciones, recordatorios
  - `src/components/Prestamos/Cobranzas/NuevaGestionDialog.tsx` - Dialog para crear nueva gestion de cobranza
  - `src/components/Prestamos/Cobranzas/RegistrarAccionDialog.tsx` - Dialog para registrar accion de contacto
  - `src/components/Prestamos/Cobranzas/RecordatorioCobranzaDialog.tsx` - Dialog para crear recordatorio
  - `src/components/Prestamos/Cobranzas/index.ts` - Barrel exports
- API Services:
  - `src/api/services/gestionCobranzaApi.ts` - API unificada (gestiones, acciones, recordatorios)
- Hooks:
  - `src/hooks/usePagination.ts` (compartido)
  - `src/hooks/useDebounce.ts` (compartido)
- Types:
  - `src/types/cobranza.types.ts`
- Utils:
  - `src/utils/priceCalculations.ts` (formatPrice, compartido)

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /cobranzas/resumen | CobranzasResumenPage | PrivateRoute |
| /cobranzas/lista | CobranzasListPage | PrivateRoute |
| /cobranzas/:id | GestionCobranzaDetailPage | PrivateRoute |

## Endpoints API Consumidos
### gestionCobranzaApi - Gestiones (base: `/api/gestiones-cobranza`)
- `GET /api/gestiones-cobranza` - Listado paginado de gestiones activas
- `GET /api/gestiones-cobranza/historial` - Listado paginado de historial completo
- `GET /api/gestiones-cobranza/{id}` - Gestion por ID
- `GET /api/gestiones-cobranza/prestamo/{prestamoId}` - Gestiones de un prestamo
- `GET /api/gestiones-cobranza/prestamo/{prestamoId}/activa` - Gestion activa de un prestamo
- `GET /api/gestiones-cobranza/resumen` - Resumen/KPIs (param opcional: usuarioId)
- `POST /api/gestiones-cobranza` - Crear nueva gestion
- `PUT /api/gestiones-cobranza/{id}` - Actualizar gestion
- `PATCH /api/gestiones-cobranza/{id}/cerrar` - Cerrar gestion (param: estado)

### gestionCobranzaApi - Acciones (base: `/api/acciones-cobranza`)
- `GET /api/acciones-cobranza/gestion/{gestionId}` - Acciones de una gestion
- `POST /api/acciones-cobranza` - Registrar accion
- `DELETE /api/acciones-cobranza/{id}` - Eliminar accion

### gestionCobranzaApi - Recordatorios (base: `/api/recordatorios-cobranza`)
- `GET /api/recordatorios-cobranza/gestion/{gestionId}` - Recordatorios de una gestion
- `GET /api/recordatorios-cobranza/pendientes` - Recordatorios pendientes (todos)
- `GET /api/recordatorios-cobranza/pendientes/usuario/{usuarioId}` - Pendientes por usuario
- `POST /api/recordatorios-cobranza` - Crear recordatorio
- `PATCH /api/recordatorios-cobranza/{id}/completar` - Marcar como completado
- `DELETE /api/recordatorios-cobranza/{id}` - Eliminar recordatorio

## Tipos Principales
```typescript
// Enums
EstadoGestionCobranza: 'NUEVA' | 'EN_GESTION' | 'PROMETIO_PAGO' | 'ACUERDO_CUOTAS' | 'EN_LEGAL' | 'RECUPERADA' | 'INCOBRABLE'
PrioridadCobranza: 'ALTA' | 'MEDIA' | 'BAJA'
TipoAccionCobranza: 'LLAMADA' | 'WHATSAPP' | 'SMS' | 'EMAIL' | 'VISITA_DOMICILIO' | 'CARTA_DOCUMENTO' | 'NOTIFICACION_LEGAL' | 'ACUERDO_PAGO' | 'OTRO'
ResultadoAccionCobranza: 'CONTACTADO' | 'NO_CONTESTA' | 'NUMERO_EQUIVOCADO' | 'PROMETIO_PAGO' | 'ACUERDO_PARCIAL' | 'NEGO_PAGO' | 'SIN_FONDOS' | 'VISITA_REALIZADA' | 'SIN_RESULTADO'
TipoRecordatorioCobranza: 'EMAIL' | 'SMS' | 'TAREA' | 'NOTIFICACION' | 'WHATSAPP' | 'LLAMADA'

// DTOs principales
GestionCobranzaDTO {
  id, empresaId, prestamoId, clienteNombre, clienteApellido, clienteTelefono,
  diasVencido, estado, prioridad, agenteId, activa, montoPendiente,
  fechaApertura, fechaCierre, fechaProximaGestion, fechaPrometePago,
  montoPrometido, totalAcciones, recordatoriosPendientes
}

AccionCobranzaDTO {
  id, gestionId, prestamoId, usuarioId, tipo, resultado, fecha,
  descripcion, duracionMinutos, fechaPrometePago, fechaProximoContacto
}

RecordatorioCobranzaDTO {
  id, gestionId, prestamoId, usuarioAsignadoId, fechaRecordatorio,
  hora, tipo, prioridad, mensaje, completado
}

ResumenCobranzaDTO {
  totalGestionesActivas, totalMontoPendiente, gestionesPorEstado,
  promesasIncumplidas, gestionesVencidasHoy, recordatoriosPendientesAgente
}

// Estados validos para cerrar una gestion
ESTADOS_CIERRE: [RECUPERADA, INCOBRABLE, EN_LEGAL, ACUERDO_CUOTAS, PROMETIO_PAGO]
```

## Permisos y Roles
Modulo en sidebar: `COBRANZAS`. Sin embargo, `COBRANZAS` NO esta listado como valor del tipo `Modulo` en `src/types/index.ts` ni aparece en la matriz `PERMISOS_POR_ROL` de `usePermisos.ts`. Esto significa que la seccion COBRANZAS del sidebar no se muestra para ningun rol, salvo que el usuario sea `ADMIN` (que tiene acceso a todo via la verificacion `roles.includes('ADMIN')` que retorna `true` antes de consultar la matriz).

En la practica, los roles con acceso serian:
- **ADMIN**: Acceso garantizado (bypass de la matriz)
- Otros roles: Necesitarian que se agregue `'COBRANZAS'` al tipo `Modulo` y a `PERMISOS_POR_ROL`

Nota: Esto parece ser un bug o una funcionalidad pendiente de completar.

## Multi-tenant
- `GestionCobranzaDTO` incluye `empresaId` - el backend filtra por empresa activa.
- El filtrado por sucursal no aplica directamente en cobranzas.
- Los recordatorios pueden asignarse a un `usuarioAsignadoId` especifico.

## Dependencias entre Modulos
- **Prestamos** (dependencia fuerte): Cada gestion de cobranza esta vinculada a un `prestamoId`. Se puede crear una gestion desde la vista de prestamo. El `GestionCobranzaDetailPage` muestra un enlace para abrir el prestamo asociado (`/prestamos/{prestamoId}`).
- **Clientes**: Los datos del cliente (nombre, apellido, telefono) vienen denormalizados en el DTO de gestion.
- La carpeta de componentes esta fisicamente dentro de `src/components/Prestamos/Cobranzas/`, reflejando la dependencia conceptual.

## Patrones Especificos
- **API unificada**: `gestionCobranzaApi.ts` agrupa tres recursos (gestiones, acciones, recordatorios) en un solo servicio con tres bases URL distintas.
- **Toggle activas/historial**: `CobranzasListPage` alterna entre `getAll()` (activas) y `getHistorial()` (todas) usando un switch `soloActivas`.
- **Iconos por tipo de accion**: Cada `TipoAccionCobranza` tiene un icono MUI asociado para representacion visual en la timeline de acciones.
- **Cierre de gestion**: Solo se permite cerrar con un estado de `ESTADOS_CIERRE` (RECUPERADA, INCOBRABLE, EN_LEGAL, ACUERDO_CUOTAS, PROMETIO_PAGO).
- **Prioridad con colores**: ALTA (rojo), MEDIA (naranja), BAJA (gris) para categorizacion visual.
- **Paginacion server-side**: Usa el mismo patron `usePagination` + `PageResponse<T>` que Prestamos.
