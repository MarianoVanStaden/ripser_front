# Contexto: Ventas

## Descripcion General
El modulo de Ventas cubre todo el ciclo comercial: desde la generacion de presupuestos, pasando por notas de pedido, facturacion, notas de credito, hasta el registro de ventas y la gestion de cheques. Incluye un dashboard de ventas propio (que tambien funciona como dashboard de leads/CRM), opciones de financiamiento configurables, y herramientas de informes con exportacion a PDF y Excel.

## Archivos del Modulo
- Componentes: `src/components/Ventas/PresupuestosPage.tsx`, `src/components/Ventas/NotasPedidoPage.tsx`, `src/components/Ventas/FacturacionPage.tsx`, `src/components/Ventas/NotasCreditoPage.tsx`, `src/components/Ventas/RegistroVentasPage.tsx`, `src/components/Ventas/InformesVentasPage.tsx`, `src/components/Ventas/OpcionesFinanciamientoPage.tsx`, `src/components/Ventas/OpcionesFinanciamientoManager.tsx`, `src/components/Ventas/ConfiguracionFinanciamiento.tsx`, `src/components/Ventas/AsignarEquiposDialog.tsx`, `src/components/Ventas/ReservarBaseDialog.tsx`
- Paginas: `src/pages/ventas/VentasDashboard.tsx`
- API Services: `src/api/services/ventaApi.ts`, `src/api/services/presupuestoApi.ts`, `src/api/services/facturaApi.ts`, `src/api/services/chequeApi.ts`, `src/api/services/opcionFinanciamientoApi.ts`, `src/api/services/opcionFinanciamientoTemplateApi.ts`
- Hooks: `useAuth()`, `useTenant()`
- Types: `Venta`, `Presupuesto`, `Factura`, `Cheque`, `OpcionFinanciamientoDTO`, `PresupuestoStatus` (desde `src/types`)

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /ventas/dashboard | VentasDashboard | PrivateRoute |
| /ventas/presupuestos | PresupuestosPage | PrivateRoute |
| /ventas/notas-pedido | NotasPedidoPage | PrivateRoute |
| /ventas/facturacion | FacturacionPage | PrivateRoute |
| /ventas/notas-credito | NotasCreditoPage | PrivateRoute |
| /ventas/registro | RegistroVentasPage | PrivateRoute |
| /ventas/informes | InformesVentasPage | PrivateRoute |
| /ventas/cheques | ChequesPage | PrivateRoute |
| /ventas/opciones-financiamiento | OpcionesFinanciamientoPage | PrivateRoute |
| /ventas/configuracion-financiamiento | ConfiguracionFinanciamiento | PrivateRoute |

## Endpoints API Consumidos

### ventaApi (`/ventas`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/ventas` | Listar ventas con filtros (sucursalId, estado, fechaInicio, fechaFin) |
| GET | `/ventas/{id}` | Obtener venta por ID |
| GET | `/ventas/cliente/{clienteId}` | Ventas por cliente |
| GET | `/ventas/estado/{estado}` | Ventas por estado |
| GET | `/ventas/total-periodo` | Total de ventas en un periodo |
| POST | `/ventas` | Crear nueva venta |
| PUT | `/ventas/{id}` | Actualizar venta |

### presupuestoApi (`/api/presupuestos`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/presupuestos` | Listar presupuestos con filtros (sucursalId, estado) |
| GET | `/api/presupuestos/{id}` | Obtener presupuesto por ID |
| POST | `/api/presupuestos` | Crear presupuesto |
| PUT | `/api/presupuestos/{id}` | Actualizar presupuesto |
| DELETE | `/api/presupuestos/{id}` | Eliminar presupuesto |
| GET | `/api/presupuestos/cliente/{clienteId}` | Presupuestos por cliente |
| GET | `/api/presupuestos/estado/{estado}` | Presupuestos por estado |
| GET | `/api/presupuestos/vencidos` | Presupuestos vencidos |

### facturaApi (`/api/facturas`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/facturas` | Listar facturas con filtros |
| GET | `/api/facturas/{id}` | Obtener factura por ID |
| GET | `/api/facturas/cliente/{clienteId}` | Facturas por cliente |
| GET | `/api/facturas/estado/{estado}` | Facturas por estado |
| GET | `/api/facturas/vencidas` | Facturas vencidas |
| POST | `/api/facturas` | Crear factura |
| PUT | `/api/facturas/{id}` | Actualizar factura |

### chequeApi (`/api/cheques`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/cheques` | Listar cheques paginados |
| GET | `/api/cheques/all` | Listar todos sin paginacion |
| GET | `/api/cheques/{id}` | Obtener cheque por ID |
| POST | `/api/cheques` | Crear cheque |
| PUT | `/api/cheques/{id}` | Actualizar cheque |
| DELETE | `/api/cheques/{id}` | Eliminar cheque (logico) |
| PATCH | `/api/cheques/{id}/estado` | Cambiar estado |
| PUT | `/api/cheques/{id}/depositar` | Depositar cheque |
| PUT | `/api/cheques/{id}/cobrar` | Cobrar cheque |
| PUT | `/api/cheques/{id}/rechazar` | Rechazar cheque |
| PUT | `/api/cheques/{id}/anular` | Anular cheque |
| GET | `/api/cheques/{id}/historial` | Historial de estados |
| GET | `/api/cheques/estado/{estado}` | Cheques por estado |
| GET | `/api/cheques/tipo/{tipo}` | Cheques por tipo |
| GET | `/api/cheques/banco/{banco}` | Cheques por banco |
| GET | `/api/cheques/cliente/{clienteId}` | Cheques por cliente |
| GET | `/api/cheques/proveedor/{proveedorId}` | Cheques por proveedor |
| GET | `/api/cheques/vencidos` | Cheques vencidos |
| GET | `/api/cheques/proximos-vencer` | Cheques proximos a vencer |
| GET | `/api/cheques/depositados-para-cobrar` | Cheques depositados para cobrar |
| GET | `/api/cheques/buscar` | Busqueda con multiples filtros |
| GET | `/api/cheques/estadisticas/monto-por-estado` | Estadisticas de monto por estado |
| GET | `/api/cheques/estadisticas/monto-en-cartera` | Monto total en cartera |
| GET | `/api/cheques/estadisticas/count-por-estado` | Conteo por estado |
| POST | `/api/cheques/{id}/endosar` | Endosar cheque a proveedor |
| GET | `/api/cheques/{id}/endosos` | Listar endosos de un cheque |
| GET | `/api/cheques/{id}/cadena-endosos` | Cadena completa de endosos |
| GET | `/api/cheques/disponibles-endoso` | Cheques disponibles para endosar |

### opcionFinanciamientoApi (`/api/opciones-financiamiento`)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/opciones-financiamiento/documento/{documentoId}` | Opciones por documento |
| GET | `/api/opciones-financiamiento/{id}` | Obtener opcion por ID |
| POST | `/api/opciones-financiamiento/documento/{documentoId}` | Crear opcion |
| PUT | `/api/opciones-financiamiento/{id}` | Actualizar opcion |
| DELETE | `/api/opciones-financiamiento/{id}` | Eliminar opcion |
| DELETE | `/api/opciones-financiamiento/documento/{documentoId}` | Eliminar todas las opciones de un documento |

## Tipos Principales

### Venta
```typescript
interface Venta {
  id?: number;
  clienteId: number;
  sucursalId?: number;
  estado?: string;
  fechaVenta?: string;
  total?: number;
  // ... campos adicionales
}
```

### VentaFilterParams
```typescript
interface VentaFilterParams {
  sucursalId?: number | null;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
```

### PresupuestoFilterParams
```typescript
interface PresupuestoFilterParams {
  sucursalId?: number | null;
  estado?: PresupuestoStatus;
}
```

## Permisos y Roles
- **Modulo**: VENTAS
- **Roles con acceso**: ADMIN, OFICINA, VENDEDOR, ADMIN_EMPRESA, GERENTE_SUCURSAL

## Multi-tenant
- Todos los servicios de ventas aceptan `sucursalId` como parametro de filtro para consultas por sucursal.
- El header `X-Empresa-Id` es enviado automaticamente por el interceptor de Axios para filtrar datos por empresa.
- Los cheques pueden estar asociados a clientes o proveedores, y se filtran por el contexto de empresa.

## Dependencias entre Modulos
- **Clientes**: Los presupuestos, facturas, ventas y cheques estan vinculados a clientes por `clienteId`.
- **Proveedores**: Los cheques pueden estar asociados a proveedores y soportan endoso a proveedores.
- **Logistica/Inventario**: Los presupuestos y ventas referencian productos.
- **Dashboard**: El VentasDashboard consume datos de leads (`leadApi`, `leadMetricasApi`) ademas de ventas, funcionando como un dashboard de CRM integrado.

## Patrones Especificos
- **Financiamiento**: Las opciones de financiamiento son configurables por documento (presupuesto/factura) con templates reutilizables (`opcionFinanciamientoTemplateApi`).
- **Ciclo de vida de cheques**: Los cheques tienen un ciclo de estados completo (RECIBIDO -> EN_CARTERA -> DEPOSITADO -> COBRADO/RECHAZADO/ANULADO) con historial de cambios.
- **Endoso de cheques**: Los cheques de terceros pueden ser endosados a proveedores, con cadena de endosos rastreable.
- **AsignarEquiposDialog**: Dialogo para asignar equipos fabricados a un presupuesto/venta.
- **ReservarBaseDialog**: Dialogo para reservar equipos base de inventario.
- **VentasDashboard**: Es una pagina standalone en `src/pages/ventas/` que combina metricas de ventas con metricas de leads, usa `leadApi` y `leadMetricasApi`.
- **Seccion en sidebar**: VENTAS (10 items): Dashboard Ventas, Presupuestos, Notas de Pedido, Facturacion, Notas de Credito, Registro de Ventas, Informes, Cheques, Opciones de Financiamiento, Configuracion Financiamiento.
