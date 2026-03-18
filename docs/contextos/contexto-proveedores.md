# Contexto: Proveedores

## Descripcion General
Modulo de gestion integral de proveedores que abarca el alta y administracion de proveedores, compras/pedidos con recepcion y distribucion por deposito, cuenta corriente, contactos y condiciones comerciales, historial de compras y evaluacion de desempeno con criterios multiples. Opera bajo el modelo multi-tenant filtrado por empresaId.

## Archivos del Modulo
- Componentes: `src/components/Proveedores/SuppliersPage.tsx`, `ComprasPedidosPage.tsx`, `CuentaCorrienteProveedoresPage.tsx`, `ContactosCondicionesPage.tsx`, `HistorialComprasPage.tsx`, `EvaluacionDesempenoPage.tsx`, `index.ts`
- API Services: `src/api/services/proveedorApi.ts`, `compraApi.ts`, `evaluacionProveedorApi.ts`, `cuentaCorrienteProveedorApi.ts`, `contactoApi.ts`
- Hooks: No posee hooks dedicados; usa `usePagination` generico
- Types: Definidos en `src/types/index.ts` (Proveedor, ProveedorDTO, CreateProveedorDTO, Compra, CompraDTO, CreateCompraDTO, CuentaCorrienteProveedor, CreateMovimientoProveedorPayload, EvaluacionProveedorDTO, EvaluacionCreateDTO, EstadisticasEvaluacionDTO, RecepcionCompraDTO, DistribucionManualDTO)
- Utils: No posee utils especificos

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /proveedores/gestion | SuppliersPage | PrivateRoute |
| /proveedores/compras | ComprasPedidosPage | PrivateRoute |
| /proveedores/cuenta-corriente | CuentaCorrienteProveedoresPage | PrivateRoute |
| /proveedores/contactos | ContactosCondicionesPage | PrivateRoute |
| /proveedores/historial | HistorialComprasPage | PrivateRoute |
| /proveedores/evaluacion | EvaluacionDesempenoPage | PrivateRoute |

## Endpoints API Consumidos

### proveedorApi (`/api/proveedores`)
- `GET /api/proveedores` - Listar proveedores (paginado)
- `GET /api/proveedores/:id` - Obtener proveedor por ID
- `POST /api/proveedores` - Crear proveedor
- `PUT /api/proveedores/:id` - Actualizar proveedor
- `DELETE /api/proveedores/:id` - Eliminar proveedor

### compraApi (`/api/compras`)
- `GET /api/compras` - Listar compras (paginado)
- `GET /api/compras/:id` - Obtener compra por ID
- `GET /api/compras/proveedor/:proveedorId` - Compras por proveedor
- `GET /api/compras/estado/:estado` - Compras por estado
- `GET /api/compras/total-proveedor/:proveedorId` - Total compras en rango de fechas
- `POST /api/compras` - Crear compra
- `PUT /api/compras/:id` - Actualizar compra
- `DELETE /api/compras/:id` - Eliminar compra
- `POST /api/compras/:compraId/recibir` - Recibir compra con distribucion por deposito
- `POST /api/compras/:compraId/recibir-parcial` - Recepcion parcial
- `GET /api/compras/pendientes-recepcion` - Compras pendientes de recepcion
- `GET /api/compras/:compraId/recepciones` - Detalle de recepciones
- `POST /api/compras/:compraId/distribuir-manual` - Distribucion manual de stock

### evaluacionProveedorApi (`/api/evaluaciones-proveedores`)
- `POST /api/evaluaciones-proveedores` - Crear evaluacion
- `GET /api/evaluaciones-proveedores/proveedor/:proveedorId` - Evaluaciones por proveedor
- `GET /api/evaluaciones-proveedores/proveedor/:proveedorId/paginado` - Evaluaciones paginadas
- `GET /api/evaluaciones-proveedores/proveedor/:proveedorId/estadisticas` - Estadisticas de evaluacion
- `GET /api/evaluaciones-proveedores/proveedor/:proveedorId/criterio/:criterio` - Evaluaciones por criterio
- `GET /api/evaluaciones-proveedores/proveedor/:proveedorId/ultimas` - Ultimas 5 evaluaciones
- `GET /api/evaluaciones-proveedores/:id` - Evaluacion por ID
- `GET /api/evaluaciones-proveedores` - Todas las evaluaciones (paginado)
- `DELETE /api/evaluaciones-proveedores/:id` - Eliminar evaluacion (soft delete)

### cuentaCorrienteProveedorApi (`/api/cuenta-corriente-proveedor`)
- `GET /api/cuenta-corriente-proveedor` - Listar movimientos (paginado)
- `GET /api/cuenta-corriente-proveedor/:id` - Movimiento por ID
- `GET /api/cuenta-corriente-proveedor/proveedor/:proveedorId` - Movimientos por proveedor
- `POST /api/cuenta-corriente-proveedor` - Crear movimiento
- `DELETE /api/cuenta-corriente-proveedor/:id` - Eliminar movimiento

## Tipos Principales

```typescript
interface Proveedor {
  id: number;
  nombre?: string;
  razonSocial?: string;
  cuit?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: string;
  saldoActual?: number;
}

interface CuentaCorrienteProveedor {
  id: number;
  proveedorId: number;
  proveedorNombre?: string;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  saldo: number;
  compraId?: number;
}

interface EvaluacionProveedorDTO {
  id: number;
  proveedorId: number;
  calificacion: number; // 0.00 a 5.00
  criterio: 'CALIDAD' | 'PUNTUALIDAD' | 'PRECIO' | 'SERVICIO' | 'COMUNICACION' | 'FLEXIBILIDAD';
  fechaEvaluacion: string;
  evaluadoPor: string;
}

interface CompraDTO {
  id: number;
  proveedorId: number;
  numero?: string;
  fechaCreacion: string;
  fechaEntrega: string;
  estado: string;
  metodoPago?: MetodoPago;
  detalles: DetalleCompraDTO[];
}
```

## Permisos y Roles
Modulo: **PROVEEDORES**

| Rol | Acceso |
|-----|--------|
| ADMIN | Acceso completo |
| OFICINA | Acceso completo |
| ADMIN_EMPRESA | Acceso completo |
| GERENTE_SUCURSAL | Acceso completo |
| VENDEDOR | Sin acceso |
| TALLER | Sin acceso |
| USER / USUARIO | Sin acceso |

## Multi-tenant
- Las entidades Proveedor no tienen `empresaId` directo en la interfaz frontend, pero el backend filtra por el contexto del tenant autenticado.
- Las compras se asocian a proveedores que pertenecen al tenant activo.
- La cuenta corriente del proveedor se filtra implicitamente por la empresa del usuario.

## Dependencias entre Modulos
- **Logistica**: La recepcion de compras genera movimientos de stock y distribucion a depositos (`RecepcionCompraDTO`, `DistribucionManualDTO`). Las compras recibidas alimentan el stock por deposito.
- **Productos**: Los detalles de compra referencian `productoId` y pueden crear productos temporales nuevos durante la compra.
- **Administracion/Finanzas**: Los movimientos de cuenta corriente del proveedor impactan en flujo de caja y posicion patrimonial.

## Patrones Especificos
- **Recepcion con distribucion**: Las compras soportan recepcion total y parcial con distribucion automatica o manual a depositos multiples.
- **Evaluacion multi-criterio**: Sistema de evaluacion con 6 criterios (CALIDAD, PUNTUALIDAD, PRECIO, SERVICIO, COMUNICACION, FLEXIBILIDAD) con calificaciones de 0.00 a 5.00 y estadisticas agregadas.
- **Productos temporales en compras**: Permite crear items con `esProductoNuevo: true` y campos `nombreProductoTemporal`, `codigoProductoTemporal` para registrar compras de productos aun no dados de alta.
- **Sidebar**: Seccion PROVEEDORES con 6 items de navegacion.
