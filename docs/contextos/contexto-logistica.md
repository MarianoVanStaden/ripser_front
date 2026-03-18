# Contexto: Logistica

## Descripcion General
Modulo de logistica integral que abarca inventario (stock de productos y equipos por deposito, ubicaciones, recuentos, reconciliacion), distribucion (viajes, entregas de productos y equipos, legajo de vehiculos con incidencias), movimientos (transferencias entre depositos, auditoria completa) y configuracion de depositos. Es uno de los modulos mas extensos del sistema, con sub-modulos claramente diferenciados y multiples rutas legacy para retrocompatibilidad.

## Archivos del Modulo
- Componentes principales: `src/components/Logistica/StockPage.tsx`, `InventoryPage.tsx`, `StockEquiposPage.tsx`, `RecountTasksPage.tsx`, `TripsPage.tsx`, `DeliveriesPage.tsx`, `EntregasEquiposPage.tsx`, `IncidenciasVehiculoPage.tsx`
- Sub-directorio Depositos: `src/components/Logistica/Depositos/InventarioDepositoPage.tsx`, `ReconciliacionStockPage.tsx`, `UbicacionEquiposPage.tsx`, `TransferenciasPage.tsx`, `AuditoriaPage.tsx`, `DepositosPage.tsx`, `index.ts`
- API Services: `src/api/services/stockApi.ts` (stockMovementApi, warehouseApi, vehicleApi, tripApi, deliveryApi), `stockDepositoApi.ts`, `movimientoStockApi.ts`, `transferenciaApi.ts`, `depositoApi.ts`, `ubicacionEquipoApi.ts`, `reconciliacionApi.ts`, `viajeApi.ts`, `entregaViajeApi.ts`, `incidenciaVehiculoApi.ts`, `vehiculoApi.ts`, `auditoriaApi.ts`
- Hooks: No posee hooks dedicados; usa `usePagination` generico
- Types: Definidos en `src/types/index.ts` (Deposito, DepositoCreateDTO, StockDeposito, StockDepositoCreateDTO, UbicacionEquipo, UbicacionEquipoCreateDTO, MovimientoStock, MovimientoStockDeposito, MovimientoEquipo, TransferenciaDepositoDTO, TransferenciaCreateDTO, ConfirmarRecepcionDTO, ReconciliacionStockDTO, ReconciliacionDetalladaDTO, Viaje, ViajeCreateDTO, EntregaViaje, Vehiculo, VehiculoCreateDTO, IncidenciaVehiculoDTO, AuditoriaMovimientoDTO)
- Utils: No posee utils especificos

## Rutas

### Inventario
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /logistica/stock | StockPage | PrivateRoute |
| /logistica/inventario/depositos | InventarioDepositoPage | PrivateRoute |
| /logistica/inventario/stock-equipos | StockEquiposPage | PrivateRoute |
| /logistica/inventario/ubicaciones | UbicacionEquiposPage | PrivateRoute |
| /logistica/inventario/recuentos | RecountTasksPage | PrivateRoute |
| /logistica/inventario/reconciliacion | ReconciliacionStockPage | PrivateRoute |
| /logistica/inventario | InventoryPage | PrivateRoute |
| /logistica/inventario/stock-productos | StockPage | PrivateRoute |

### Distribucion
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /logistica/distribucion/viajes | TripsPage | PrivateRoute |
| /logistica/distribucion/entregas-productos | DeliveriesPage | PrivateRoute |
| /logistica/distribucion/entregas-equipos | EntregasEquiposPage | PrivateRoute |
| /logistica/vehiculos/incidencias | IncidenciasVehiculoPage | PrivateRoute |

### Movimientos
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /logistica/movimientos/transferencias | TransferenciasPage | PrivateRoute |
| /logistica/movimientos/auditoria | AuditoriaPage | PrivateRoute |

### Configuracion
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /logistica/configuracion/depositos | DepositosPage | PrivateRoute |

### Redirects Legacy
| Ruta antigua | Redirige a |
|-------------|------------|
| /logistica/stock | /logistica/inventario/stock-productos |
| /logistica/stock-equipos | /logistica/inventario/stock-equipos |
| /logistica/recuentos | /logistica/inventario/recuentos |
| /logistica/viajes | /logistica/distribucion/viajes |
| /logistica/entregas | /logistica/distribucion/entregas-productos |
| /logistica/entregas-equipos | /logistica/distribucion/entregas-equipos |
| /logistica/depositos | /logistica/configuracion/depositos |
| /logistica/inventario-deposito | /logistica/inventario/depositos |
| /logistica/ubicacion-equipos | /logistica/inventario/ubicaciones |
| /logistica/auditoria | /logistica/movimientos/auditoria |
| /logistica/transferencias | /logistica/movimientos/transferencias |
| /logistica/reconciliacion | /logistica/inventario/reconciliacion |

## Endpoints API Consumidos

### stockDepositoApi (`/api/stock-deposito`)
- `GET /api/stock-deposito` - Listar stock por deposito (paginado)
- `GET /api/stock-deposito/:id` - Stock por ID
- `GET /api/stock-deposito/producto/:productoId` - Stock por producto
- `GET /api/stock-deposito/deposito/:depositoId` - Stock por deposito
- `GET /api/stock-deposito/producto/:productoId/deposito/:depositoId` - Stock especifico
- `GET /api/stock-deposito/bajo-minimo` - Productos bajo stock minimo
- `GET /api/stock-deposito/sobre-maximo` - Productos sobre stock maximo
- `GET /api/stock-deposito/producto/:productoId/total` - Stock total de un producto
- `POST /api/stock-deposito` - Crear registro de stock
- `PUT /api/stock-deposito/:id` - Actualizar stock
- `DELETE /api/stock-deposito/:id` - Eliminar registro
- `PATCH /api/stock-deposito/:id/ajustar` - Ajustar cantidad
- `POST /api/stock-deposito/transferir` - Transferir entre depositos
- `POST /api/stock-deposito/reconciliar/:productoId` - Reconciliar stock de un producto

### movimientoStockApi (`/api/movimientos-stock`)
- `GET /api/movimientos-stock` - Listar movimientos (paginado)
- `GET /api/movimientos-stock/:id` - Movimiento por ID
- `GET /api/movimientos-stock/materia-prima/:materiaPrimaId` - Por materia prima
- `GET /api/movimientos-stock/tipo/:tipo` - Por tipo
- `GET /api/movimientos-stock/periodo` - Por periodo
- `GET /api/movimientos-stock/stock-calculado/producto/:productoId` - Stock calculado producto
- `GET /api/movimientos-stock/stock-calculado/materia-prima/:materiaPrimaId` - Stock calculado materia prima
- `POST /api/movimientos-stock` - Crear movimiento
- `PUT /api/movimientos-stock/:id` - Actualizar movimiento
- `DELETE /api/movimientos-stock/:id` - Eliminar movimiento
- `POST /api/movimientos-stock/iniciar-recuento` - Iniciar recuento de inventario
- `PUT /api/movimientos-stock/completar-recuento/:movimientoId` - Completar item de recuento
- `GET /api/movimientos-stock/recuentos-pendientes` - Recuentos pendientes

### transferenciaApi (`/api/transferencias`)
- `GET /api/transferencias` - Listar transferencias (paginado, con filtros)
- `GET /api/transferencias/:id` - Transferencia por ID
- `POST /api/transferencias` - Crear transferencia
- `POST /api/transferencias/:id/enviar` - Confirmar envio (PENDIENTE -> EN_TRANSITO)
- `POST /api/transferencias/:id/recibir` - Confirmar recepcion (EN_TRANSITO -> RECIBIDA)
- `POST /api/transferencias/:id/cancelar` - Cancelar transferencia

### depositoApi (`/api/depositos`)
- `GET /api/depositos` - Listar depositos (paginado)
- `GET /api/depositos/activos` - Depositos activos
- `GET /api/depositos/:id` - Deposito por ID
- `GET /api/depositos/codigo/:codigo` - Deposito por codigo
- `GET /api/depositos/sucursal/:sucursalId` - Depositos por sucursal
- `GET /api/depositos/compartidos` - Depositos compartidos
- `GET /api/depositos/disponibles/sucursal/:sucursalId` - Disponibles por sucursal
- `GET /api/depositos/principal` - Deposito principal
- `POST /api/depositos` - Crear deposito
- `PUT /api/depositos/:id` - Actualizar deposito
- `PATCH /api/depositos/:id/activar` - Activar deposito
- `PATCH /api/depositos/:id/desactivar` - Desactivar deposito

### ubicacionEquipoApi (`/api/ubicacion-equipo`)
- `GET /api/ubicacion-equipo` - Listar ubicaciones (paginado)
- `GET /api/ubicacion-equipo/:id` - Ubicacion por ID
- `GET /api/ubicacion-equipo/equipo/:equipoFabricadoId` - Ubicacion por equipo
- `GET /api/ubicacion-equipo/numero-heladera/:numeroHeladera` - Por numero de heladera
- `GET /api/ubicacion-equipo/deposito/:depositoId` - Equipos en deposito
- `GET /api/ubicacion-equipo/deposito/:depositoId/disponibles` - Disponibles en deposito
- `GET /api/ubicacion-equipo/deposito/:depositoId/tipo/:tipo` - Por deposito y tipo
- `GET /api/ubicacion-equipo/deposito/:depositoId/count` - Conteo por deposito
- `POST /api/ubicacion-equipo` - Crear ubicacion
- `PUT /api/ubicacion-equipo/:id` - Actualizar ubicacion
- `DELETE /api/ubicacion-equipo/:id` - Eliminar ubicacion
- `POST /api/ubicacion-equipo/mover` - Mover equipo entre depositos

### reconciliacionApi (`/api/stock/reconciliacion`)
- `POST /api/stock/reconciliacion/iniciar` - Iniciar reconciliacion mensual
- `POST /api/stock/reconciliacion/:id/ajustar-deposito` - Registrar ajuste de deposito
- `GET /api/stock/reconciliacion/:id/diferencias` - Calcular diferencias
- `POST /api/stock/reconciliacion/:id/finalizar-revision` - Finalizar revision
- `POST /api/stock/reconciliacion/:id/aprobar` - Aprobar y aplicar ajustes
- `POST /api/stock/reconciliacion/:id/cancelar` - Cancelar reconciliacion
- `GET /api/stock/reconciliacion/activa` - Reconciliacion activa
- `GET /api/stock/reconciliacion/existe-activa` - Verificar si existe activa
- `GET /api/stock/reconciliacion/:id` - Detalle de reconciliacion
- `GET /api/stock/reconciliacion/:id/ajustes` - Ajustes de una reconciliacion
- `GET /api/stock/reconciliacion/` - Listar reconciliaciones (paginado)
- `GET /api/stock/reconciliacion/historial` - Historial de reconciliaciones

### viajeApi (`/api/viajes`)
- `GET /api/viajes` - Listar viajes (paginado)
- `GET /api/viajes/:id` - Viaje por ID
- `POST /api/viajes` - Crear viaje
- `PUT /api/viajes/:id` - Actualizar viaje
- `DELETE /api/viajes/:id` - Eliminar viaje
- `GET /api/viajes/conductor/:conductorId` - Viajes por conductor
- `GET /api/viajes/vehiculo/:vehiculoId` - Viajes por vehiculo
- `PATCH /api/viajes/:id/estado` - Cambiar estado del viaje

### entregaViajeApi (`/api/entregas-viaje`)
- `GET /api/entregas-viaje` - Listar entregas
- `GET /api/entregas-viaje/:id` - Entrega por ID
- `POST /api/entregas-viaje` - Crear entrega
- `PUT /api/entregas-viaje/:id` - Actualizar entrega
- `DELETE /api/entregas-viaje/:id` - Eliminar entrega
- `GET /api/entregas-viaje/viaje/:viajeId` - Entregas por viaje
- `GET /api/entregas-viaje/venta/:ventaId` - Entregas por venta
- `GET /api/entregas-viaje/orden/:ordenId` - Entregas por orden de servicio
- `GET /api/entregas-viaje/estado/:estado` - Entregas por estado
- `GET /api/entregas-viaje/por-fecha` - Entregas por rango de fechas
- `PATCH /api/entregas-viaje/:id/entregar` - Marcar como entregada
- `PATCH /api/entregas-viaje/:id/no-entregar` - Marcar como no entregada
- `PATCH /api/entregas-viaje/:id/reprogramar` - Reprogramar entrega
- `POST /api/entregas-viaje/agregar-factura` - Agregar factura a entrega
- `GET /api/entregas-viaje/disponibles` - Entregas disponibles (sin factura)
- `GET /api/entregas-viaje/:id/detalles` - Detalles completos de entrega
- `POST /api/entregas-viaje/confirmar-entrega` - Confirmar entrega

### incidenciaVehiculoApi (`/api/incidencias-vehiculo`)
- `GET /api/incidencias-vehiculo/vehiculo/:vehiculoId` - Incidencias por vehiculo (paginado)
- `GET /api/incidencias-vehiculo/abiertas` - Incidencias abiertas
- `GET /api/incidencias-vehiculo/vencimientos` - Incidencias con vencimiento proximo
- `GET /api/incidencias-vehiculo/:id` - Incidencia por ID
- `POST /api/incidencias-vehiculo` - Crear incidencia
- `PUT /api/incidencias-vehiculo/:id` - Actualizar incidencia
- `DELETE /api/incidencias-vehiculo/:id` - Eliminar incidencia

### vehiculoApi (`/api/vehiculos`)
- `GET /api/vehiculos` - Listar vehiculos (paginado)
- `GET /api/vehiculos/:id` - Vehiculo por ID
- `POST /api/vehiculos` - Crear vehiculo
- `PUT /api/vehiculos/:id` - Actualizar vehiculo
- `DELETE /api/vehiculos/:id` - Eliminar vehiculo
- `GET /api/vehiculos/estado/:estado` - Vehiculos por estado

### auditoriaApi (`/auditoria/movimientos`)
- `GET /auditoria/movimientos` - Listar movimientos con filtros (paginado)
- `GET /auditoria/movimientos/producto/:productoId` - Movimientos de un producto
- `GET /auditoria/movimientos/equipo/:equipoFabricadoId` - Movimientos de un equipo
- `GET /auditoria/movimientos/export/pdf` - Exportar a PDF
- `GET /auditoria/movimientos/export/excel` - Exportar a Excel
- `GET /auditoria/movimientos/resumen` - Resumen de movimientos

## Tipos Principales

```typescript
interface Deposito {
  id: number;
  empresaId: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  esPrincipal: boolean;
  sucursalId?: number;
  sucursalNombre?: string;
}

interface StockDeposito {
  id: number;
  productoId: number;
  productoNombre: string;
  depositoId: number;
  depositoNombre: string;
  cantidad: number;
  stockMinimo: number;
  stockMaximo?: number;
  bajoMinimo: boolean;
  sobreMaximo: boolean;
}

interface TransferenciaDepositoDTO {
  id?: number;
  numero?: string;
  empresaId: number;
  depositoOrigenId: number;
  depositoDestinoId: number;
  estado: 'PENDIENTE' | 'EN_TRANSITO' | 'RECIBIDA' | 'CANCELADA';
  items: TransferenciaItemDTO[];
}

interface UbicacionEquipo {
  id: number;
  equipoFabricadoId: number;
  equipoNumeroHeladera: string;
  depositoId: number;
  depositoNombre: string;
  ubicacionInterna?: string;
}

interface Viaje {
  id: number;
  fechaViaje: string;
  destino: string;
  conductorId: number;
  vehiculoId: number;
  estado: EstadoViaje;
}

interface IncidenciaVehiculoDTO {
  id: number;
  vehiculoId: number;
  tipo: TipoIncidenciaVehiculo; // ACCIDENTE, INFRACCION_TRANSITO, FALLA_MECANICA, etc.
  gravedad: GravedadIncidencia; // LEVE, MODERADA, GRAVE, CRITICA
  estado: EstadoIncidencia; // ABIERTA, EN_PROCESO, RESUELTA, CERRADA
  fecha: string;
  descripcion: string;
}

interface ReconciliacionStockDTO {
  // Reconciliacion mensual de stock con flujo:
  // EN_PROCESO -> PENDIENTE_APROBACION -> COMPLETADA / CANCELADA
}
```

## Permisos y Roles
Modulo: **LOGISTICA** (inventario, movimientos, configuracion)

| Rol | Acceso |
|-----|--------|
| ADMIN | Acceso completo |
| OFICINA | Acceso completo |
| TALLER | Acceso completo |
| ADMIN_EMPRESA | Acceso completo |
| GERENTE_SUCURSAL | Acceso completo |
| VENDEDOR | Sin acceso |
| USER / USUARIO | Sin acceso |

Modulo: **TRANSPORTE** (distribucion, vehiculos)
- Aparece como seccion separada en el sidebar, pero usa las mismas rutas `/logistica/distribucion/` y `/logistica/vehiculos/`.
- Los permisos de TRANSPORTE se gestionan a traves del modulo LOGISTICA en `PERMISOS_POR_ROL`.

## Multi-tenant
- `Deposito` tiene `empresaId` y `sucursalId` opcional, permitiendo depositos compartidos entre sucursales o asignados a una sucursal especifica.
- `Vehiculo` tiene `empresaId` y `sucursalId`.
- Las transferencias incluyen `empresaId` para filtrado multi-tenant.
- La auditoria filtra movimientos por `empresaId`.
- El deposito principal (`esPrincipal: true`) es unico por empresa.

## Dependencias entre Modulos
- **Proveedores**: Las compras recibidas generan ingresos de stock a depositos.
- **Fabricacion**: Los equipos fabricados tienen ubicaciones en depositos. Los movimientos de tipo `SALIDA_FABRICACION` y `REINGRESO_CANCELACION_FABRICACION` conectan fabricacion con stock.
- **Ventas**: Las entregas de viaje se vinculan a ventas (`ventaId` / `documentoComercialId`) y ordenes de servicio (`ordenServicioId`).
- **Taller**: Las entregas pueden estar vinculadas a ordenes de servicio.
- **RRHH**: Los viajes requieren un conductor (empleado) y los movimientos registran el usuario que los realizo.

## Patrones Especificos
- **Reconciliacion mensual**: Flujo multi-paso para reconciliar stock fisico vs sistema: Iniciar -> Registrar ajustes por deposito -> Calcular diferencias -> Finalizar revision -> Aprobar (aplica ajustes automaticamente). Solo puede haber una reconciliacion activa a la vez.
- **Transferencias con confirmacion**: Flujo PENDIENTE -> EN_TRANSITO (envio) -> RECIBIDA (recepcion con cantidades recibidas). Permite cancelacion con motivo.
- **Recuento de inventario**: Se puede iniciar un recuento por categoria, que genera movimientos de tipo RECUENTO para cada producto. Cada item se completa individualmente registrando la cantidad real.
- **Auditoria exportable**: Los movimientos de auditoria soportan exportacion a PDF y Excel, con resumen estadistico de ingresos, egresos, transferencias y ajustes.
- **Incidencias de vehiculos**: Tipificadas (ACCIDENTE, INFRACCION_TRANSITO, FALLA_MECANICA, etc.) con niveles de gravedad y control de vencimientos de documentacion.
- **Sidebar**: Dos secciones: LOGISTICA (9 items: Gestion Stock, Inventario por Deposito, Stock de Equipos, Ubicacion Equipos, Recuento Manual, Tareas de Recuento, Reconciliacion Stock, Auditoria, Transferencias) y TRANSPORTE (4 items: Armado de Viajes, Control Entregas, Entregas Equipos, Legajo de Vehiculos).
