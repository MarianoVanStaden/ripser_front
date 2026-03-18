# Contexto: Garantias

## Descripcion General
Modulo de gestion de garantias de equipos fabricados. Permite registrar garantias asociadas a ventas y equipos, gestionar reclamos con seguimiento del proceso de resolucion (reparacion local, reparacion remota, reemplazo) y generar reportes estadisticos del modulo. Los tipos del API real (GarantiaDTO/ReclamoGarantiaDTO) conviven con tipos legacy (Warranty/WarrantyClaim) definidos en `types/index.ts`.

## Archivos del Modulo
- Componentes:
  - `src/components/Garantia/GarantiasPage.tsx` - Listado de garantias con filtros por estado y equipo
  - `src/components/Garantia/ReclamosGarantiaPage.tsx` - Listado de reclamos con filtros por estado y garantia
  - `src/components/Garantia/GarantiaReportPage.tsx` - Reportes y estadisticas de garantias/reclamos
  - `src/components/Garantia/GarantiaFormDialog.tsx` - Formulario crear garantia
  - `src/components/Garantia/GarantiaDetailPage.tsx` - Detalle de una garantia
  - `src/components/Garantia/ReclamoFormDialog.tsx` - Formulario crear/editar reclamo
- API Services:
  - `src/api/services/garantiaApi.ts` (incluye tipos GarantiaDTO, GarantiaCreateDTO)
  - `src/api/services/reclamoGarantiaApi.ts` (incluye tipos ReclamoGarantiaDTO, ReclamoGarantiaCreateDTO, ReclamoGarantiaUpdateDTO)
- Hooks: Ninguno especifico del modulo
- Types:
  - `src/api/services/garantiaApi.ts` - GarantiaDTO, GarantiaCreateDTO (tipos inline)
  - `src/api/services/reclamoGarantiaApi.ts` - ReclamoGarantiaDTO, ReclamoGarantiaCreateDTO, ReclamoGarantiaUpdateDTO (tipos inline)
  - `src/types/index.ts` - Warranty, WarrantyClaim (tipos legacy), alias Garantia = Warranty, ReclamoGarantia = WarrantyClaim
- Utils:
  - Usa `dayjs` para formateo de fechas

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /garantias/registro | GarantiasPage | PrivateRoute |
| /garantias/reclamos | ReclamosGarantiaPage | PrivateRoute |
| /garantias/reporte | GarantiaReportPage | PrivateRoute |

## Endpoints API Consumidos
### garantiaApi (base: `/api/garantias`)
- `GET /api/garantias` - Listado paginado de garantias
- `GET /api/garantias/{id}` - Garantia por ID
- `POST /api/garantias` - Crear garantia
- `PUT /api/garantias/{id}/anular` - Anular garantia
- `GET /api/garantias/equipo-fabricado/{equipoFabricadoId}` - Garantias por equipo fabricado
- `GET /api/garantias/venta/{ventaId}` - Garantias por venta

### reclamoGarantiaApi (base: `/api/reclamos-garantia`)
- `GET /api/reclamos-garantia` - Listado paginado de reclamos
- `GET /api/reclamos-garantia/{id}` - Reclamo por ID
- `POST /api/reclamos-garantia` - Crear reclamo
- `PUT /api/reclamos-garantia/{id}` - Actualizar reclamo
- `DELETE /api/reclamos-garantia/{id}` - Eliminar reclamo
- `GET /api/reclamos-garantia/garantia/{garantiaId}` - Reclamos de una garantia

## Tipos Principales
```typescript
// Tipos del API real (usados por los componentes)
GarantiaDTO {
  id, equipoFabricadoId, equipoFabricadoModelo, ventaId, numeroSerie,
  fechaCompra, fechaVencimiento,
  estado: 'VIGENTE' | 'VENCIDA' | 'ANULADA',
  observaciones, reclamos
}

ReclamoGarantiaDTO {
  id, garantiaId, garantiaNumeroSerie, garantiaEquipoModelo,
  numeroReclamo, fechaReclamo, descripcionProblema,
  tipoSolucion: 'REPARACION_LOCAL' | 'REPARACION_REMOTA' | 'REEMPLAZO',
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO',
  solucionAplicada, fechaResolucion, costoSolucion,
  tecnicoId, tecnicoNombre, tecnicoApellido
}

// Tipos legacy (en types/index.ts) - no usados directamente por componentes de garantia
Warranty { id, productId, clientId, warrantyNumber, startDate, endDate, status, type, claims }
WarrantyClaim { id, warrantyId, claimNumber, claimDate, description, status, solution, cost }
WarrantyStatus: 'ACTIVE' | 'EXPIRED' | 'VOIDED' | 'CLAIMED'
WarrantyType: 'MANUFACTURER' | 'EXTENDED' | 'SERVICE'

// Aliases
type Garantia = Warranty
type ReclamoGarantia = WarrantyClaim
```

## Permisos y Roles
Modulo: `GARANTIAS` en la matriz `PERMISOS_POR_ROL`:
- **ADMIN**: Acceso total (tiene acceso a todos los modulos)
- **OFICINA**: Acceso a GARANTIAS
- **VENDEDOR**: Acceso a GARANTIAS
- **TALLER**: Acceso a GARANTIAS
- **ADMIN_EMPRESA**: Acceso a GARANTIAS
- **GERENTE_SUCURSAL**: Acceso a GARANTIAS

Roles sin acceso: USER/USUARIO.

## Multi-tenant
- Las garantias estan vinculadas a equipos fabricados y ventas, que a su vez pertenecen a una empresa.
- El backend filtra por `empresaId` automaticamente via los headers de tenant del API client.
- No se aplica filtro adicional por sucursal en este modulo.

## Dependencias entre Modulos
- **Produccion / Equipos Fabricados**: Las garantias se crean sobre `equipoFabricadoId`. `GarantiasPage` usa `equipoFabricadoApi` para obtener equipos disponibles.
- **Ventas**: Cada garantia se vincula a una `ventaId`. `GarantiasPage` carga facturas usando `documentoApi`.
- **Taller**: Los reclamos pueden asignar un `tecnicoId` para la resolucion.
- **RRHH / Empleados**: El tecnico asignado a un reclamo es un empleado del sistema.

## Patrones Especificos
- **Tipos inline en API services**: A diferencia de otros modulos, los tipos DTO se definen dentro de los archivos de API (`garantiaApi.ts` y `reclamoGarantiaApi.ts`) en lugar de en un archivo de tipos separado.
- **Dual type system**: Existen tipos legacy (`Warranty`/`WarrantyClaim` en `types/index.ts`) y tipos del API real (`GarantiaDTO`/`ReclamoGarantiaDTO`). Los componentes actuales usan los tipos del API.
- **API base diferente**: Los servicios de garantia importan de `'../api'` (no `'../config'` como otros modulos), indicando que pueden usar una instancia diferente de axios.
- **Paginacion client-side**: `GarantiasPage` y `ReclamosGarantiaPage` usan `TablePagination` con datos filtrados en memoria, a diferencia del patron server-side de Prestamos.
- **Reportes con filtro temporal**: `GarantiaReportPage` incluye filtro de periodo (30, 90, 180, 365 dias o todos) para estadisticas.
