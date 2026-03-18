# Contexto: Prestamos

## Descripcion General
Modulo de gestion de prestamos personales a clientes. Permite crear prestamos con cuotas automaticas, registrar pagos, dar seguimiento mediante interacciones (llamadas, emails, visitas, etc.) y configurar recordatorios de vencimiento. Incluye un dashboard de resumen con KPIs financieros y categorizacion de riesgo de los prestamos (Normal, Legales, Pago con Mora, Alto Riesgo).

## Archivos del Modulo
- Componentes:
  - `src/components/Prestamos/PrestamosResumenPage.tsx` - Dashboard con KPIs de prestamos
  - `src/components/Prestamos/PrestamosListPage.tsx` - Listado paginado con filtros por estado/categoria
  - `src/components/Prestamos/PrestamoDetailPage.tsx` - Detalle con tabs: cuotas, seguimientos, recordatorios
  - `src/components/Prestamos/PrestamoFormDialog.tsx` - Formulario crear/editar prestamo
  - `src/components/Prestamos/RegistrarPagoDialog.tsx` - Dialog para registrar pago de cuota
  - `src/components/Prestamos/SeguimientoFormDialog.tsx` - Dialog para registrar interaccion de seguimiento
  - `src/components/Prestamos/RecordatorioFormDialog.tsx` - Dialog para crear recordatorio de cuota
  - `src/components/Prestamos/index.ts` - Barrel exports
- API Services:
  - `src/api/services/prestamoPersonalApi.ts`
  - `src/api/services/cuotaPrestamoApi.ts`
  - `src/api/services/seguimientoPrestamoApi.ts`
  - `src/api/services/recordatorioCuotaApi.ts`
- Hooks:
  - `src/hooks/usePagination.ts` (compartido)
  - `src/hooks/useDebounce.ts` (compartido)
- Types:
  - `src/types/prestamo.types.ts`
- Utils:
  - `src/utils/priceCalculations.ts` (formatPrice, compartido)

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /prestamos/resumen | PrestamosResumenPage | PrivateRoute |
| /prestamos/lista | PrestamosListPage | PrivateRoute |
| /prestamos/:id | PrestamoDetailPage | PrivateRoute |

## Endpoints API Consumidos
### prestamoPersonalApi (base: `/api/prestamos-personales`)
- `GET /api/prestamos-personales` - Listado paginado de prestamos
- `GET /api/prestamos-personales/{id}` - Obtener prestamo por ID
- `POST /api/prestamos-personales` - Crear nuevo prestamo
- `PUT /api/prestamos-personales/{id}` - Actualizar prestamo
- `DELETE /api/prestamos-personales/{id}` - Eliminar prestamo
- `GET /api/prestamos-personales/activos` - Prestamos activos
- `GET /api/prestamos-personales/resumen` - Resumen/KPIs
- `GET /api/prestamos-personales/cliente/{clienteId}` - Por cliente
- `GET /api/prestamos-personales/categoria/{categoria}` - Por categoria
- `GET /api/prestamos-personales/estado/{estado}` - Por estado
- `PATCH /api/prestamos-personales/{id}/estado` - Cambiar estado
- `PATCH /api/prestamos-personales/{id}/categoria` - Cambiar categoria

### cuotaPrestamoApi (base: `/api/cuotas-prestamo`)
- `GET /api/cuotas-prestamo/prestamo/{prestamoId}` - Cuotas de un prestamo
- `POST /api/cuotas-prestamo/pago` - Registrar pago de cuota
- `GET /api/cuotas-prestamo/proximas-vencer` - Cuotas proximas a vencer (param: dias)
- `GET /api/cuotas-prestamo/vencidas` - Cuotas vencidas

### seguimientoPrestamoApi (base: `/api/seguimientos-prestamo`)
- `GET /api/seguimientos-prestamo/prestamo/{prestamoId}` - Seguimientos de un prestamo
- `POST /api/seguimientos-prestamo` - Crear seguimiento

### recordatorioCuotaApi (base: `/api/recordatorios-cuota`)
- `GET /api/recordatorios-cuota/cuota/{cuotaId}` - Recordatorios de una cuota
- `GET /api/recordatorios-cuota/{id}` - Recordatorio por ID
- `POST /api/recordatorios-cuota` - Crear recordatorio
- `PUT /api/recordatorios-cuota/{id}` - Actualizar recordatorio
- `DELETE /api/recordatorios-cuota/{id}` - Eliminar recordatorio
- `PATCH /api/recordatorios-cuota/{id}/enviado` - Marcar como enviado
- `PATCH /api/recordatorios-cuota/{id}/pagado` - Marcar como pagado
- `GET /api/recordatorios-cuota/pendientes` - Recordatorios pendientes

## Tipos Principales
```typescript
// Enums
TipoFinanciacion: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'PLAN_PP' | 'CONTADO' | 'CHEQUES'
EstadoPrestamo: 'ACTIVO' | 'FINALIZADO' | 'EN_MORA' | 'EN_LEGAL' | 'CANCELADO'
CategoriaPrestamo: 'NORMAL' | 'LEGALES' | 'PAGO_CON_MORA' | 'ALTO_RIESGO'
EstadoCuota: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'PARCIAL'
TipoInteraccionPrestamo: 'LLAMADA' | 'EMAIL' | 'WHATSAPP' | 'REUNION' | 'VISITA' | 'VIDEOLLAMADA'

// DTOs principales
PrestamoPersonalDTO {
  id, empresaId, clienteId, clienteNombre, tipoFinanciacion,
  cantidadCuotas, valorCuota, montoTotal, cuotaActual, diasVencido,
  estado, categoria, cuotasPagadas, cuotasPendientes, montoPagado, saldoPendiente
}

CuotaPrestamoDTO {
  id, prestamoId, numeroCuota, montoCuota, montoPagado,
  fechaVencimiento, fechaPago, estado
}

SeguimientoPrestamoDTO {
  id, prestamoId, usuarioId, tipo, fecha, descripcion, resultado, proximaAccion
}

ResumenPrestamosDTO {
  totalPrestamos, prestamosActivos, prestamosEnMora, prestamosEnLegal,
  montoTotalPrestado, montoTotalCobrado, montoTotalPendiente,
  cuotasVencidas, cuotasProximasAVencer
}
```

## Permisos y Roles
Modulo: `PRESTAMOS` en la matriz `PERMISOS_POR_ROL`:
- **ADMIN**: Acceso total (tiene acceso a todos los modulos)
- **OFICINA**: Acceso a PRESTAMOS
- **ADMIN_EMPRESA**: Acceso a PRESTAMOS
- **GERENTE_SUCURSAL**: Acceso a PRESTAMOS

Roles sin acceso: VENDEDOR, TALLER, USER/USUARIO.

## Multi-tenant
- `PrestamoPersonalDTO` incluye `empresaId` - el backend filtra automaticamente por la empresa activa del usuario.
- La sucursal no se filtra directamente en prestamos; opera a nivel empresa.
- El API base (`src/api/config.ts`) inyecta headers de tenant automaticamente.

## Dependencias entre Modulos
- **Clientes**: Los prestamos se vinculan a `clienteId`. Se usa `clienteNombre` y `codigoClienteRojas`.
- **Cobranzas**: Modulo fuertemente acoplado. Desde el detalle de prestamo se puede navegar a la gestion de cobranza asociada. Los prestamos en mora generan gestiones de cobranza.
- **Ventas**: El tipo de financiacion `CHEQUES` se conecta con el sistema de cheques.
- **Leads**: El tipo `TipoRecordatorioEnum` se importa desde `lead.types.ts`.

## Patrones Especificos
- **Paginacion server-side**: `PrestamosListPage` usa `usePagination` hook con `PageResponse<T>` del backend.
- **Debounce en busqueda**: Busqueda con `useDebounce(searchTerm, 300)`.
- **Filtros por URL**: Lee `estado` y `categoria` de `searchParams` para permitir navegacion directa desde el resumen.
- **Tabs en detalle**: `PrestamoDetailPage` organiza cuotas, seguimientos y recordatorios en tabs.
- **Labels y colores mapeados**: Cada enum tiene su mapa de labels (`ESTADO_PRESTAMO_LABELS`) y colores (`ESTADO_PRESTAMO_COLORS`) para UI consistente.
- **Cambio de estado/categoria via PATCH**: Operaciones ligeras que no requieren enviar el objeto completo.
