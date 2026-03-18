# Contexto: Fabricacion

## Descripcion General
Modulo de produccion y fabricacion de equipos (heladeras, coolbox, exhibidores) que gestiona recetas de fabricacion con detalles de materiales e insumos, fabricacion de equipos con flujo de estados (incluyendo fabricacion base y terminacion/revestimiento), dashboard de produccion, reportes de estados, costeo de recetas y planificacion preventiva de stock con objetivos configurables. Opera bajo el modelo multi-tenant con `empresaId`.

## Archivos del Modulo
- Componentes principales: `src/components/Fabricacion/DashboardFabricacion.tsx`, `RecetasList.tsx`, `RecetaDetail.tsx`, `RecetaForm.tsx`, `EquiposList.tsx`, `EquipoDetail.tsx`, `EquipoForm.tsx`, `ReportesEstadosPage.tsx`, `RecetaCosteoSection.tsx`, `AplicarTerminacionDialog.tsx`, `index.ts`
- Sub-directorio StockPlanificacion: `src/components/Fabricacion/StockPlanificacion/StockPlanificacionPage.tsx`, `index.ts`
  - Componentes: `StockPlanificacion/components/AccionSugeridaIndicator.tsx`, `EvaluacionBadge.tsx`, `GenerarOrdenDialog.tsx`, `StockObjetivoForm.tsx`, `StockObjetivoTable.tsx`
  - Hooks: `StockPlanificacion/hooks/useStockObjetivo.ts`
- API Services: `src/api/services/recetaFabricacionApi.ts`, `recetaItemApi.ts`, `equipoFabricadoApi.ts`, `movimientoStockFabricacionApi.ts`, `productoTerminadoApi.ts`, `stockObjetivoApi.ts`
- Types: `src/types/stockPlanificacion.types.ts`, tipos en `src/types/index.ts` (RecetaFabricacionDTO, RecetaFabricacionListDTO, RecetaFabricacionCreateDTO, RecetaFabricacionUpdateDTO, DetalleRecetaDTO, DetalleRecetaCreateDTO, CosteoRecetaDTO, EquipoFabricadoDTO, EquipoFabricadoListDTO, EquipoFabricadoCreateDTO, EquipoFabricadoUpdateDTO, EstadoFabricacion, TipoEquipo, MedidaEquipo, EstadoAsignacionEquipo, ValidacionStockDTO, EquipoCreationResponseDTO, FabricacionBaseRequestDTO, AplicarTerminacionDTO, EtapaTerminacionDTO, HistorialFabricacionDTO, TipoTerminacion, MovimientoStock)
- Utils: No posee utils especificos
- Documentacion: `src/components/Fabricacion/README_IMPLEMENTACION.md`

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /fabricacion/dashboard | DashboardFabricacion | PrivateRoute |
| /fabricacion/recetas | RecetasList | PrivateRoute |
| /fabricacion/recetas/:id | RecetaDetail | PrivateRoute |
| /fabricacion/recetas/nueva | RecetaForm | PrivateRoute |
| /fabricacion/recetas/editar/:id | RecetaForm | PrivateRoute |
| /fabricacion/equipos | EquiposList | PrivateRoute |
| /fabricacion/equipos/:id | EquipoDetail | PrivateRoute |
| /fabricacion/equipos/nuevo | EquipoForm | PrivateRoute |
| /fabricacion/equipos/editar/:id | EquipoForm | PrivateRoute |
| /fabricacion/reportes-estados | ReportesEstadosPage | PrivateRoute |
| /fabricacion/stock-planificacion | StockPlanificacionPage | PrivateRoute |

## Endpoints API Consumidos

### recetaFabricacionApi (`/api/recetas-fabricacion`)
- `GET /api/recetas-fabricacion` - Listar recetas (paginado)
- `GET /api/recetas-fabricacion/activas` - Recetas activas
- `GET /api/recetas-fabricacion/:id` - Receta por ID
- `GET /api/recetas-fabricacion/codigo/:codigo` - Receta por codigo
- `POST /api/recetas-fabricacion` - Crear receta
- `PUT /api/recetas-fabricacion/:id` - Actualizar receta
- `PATCH /api/recetas-fabricacion/:id/desactivar` - Desactivar receta
- `PATCH /api/recetas-fabricacion/:id/activar` - Activar receta
- `GET /api/recetas-fabricacion/tipo/:tipoEquipo` - Recetas por tipo de equipo
- `GET /api/recetas-fabricacion/producto/:productoId` - Recetas por producto
- `POST /api/recetas-fabricacion/:recetaId/detalles` - Agregar detalle/ingrediente
- `PUT /api/recetas-fabricacion/:recetaId/detalles/:detalleId` - Actualizar detalle
- `DELETE /api/recetas-fabricacion/:recetaId/detalles/:detalleId` - Eliminar detalle
- `GET /api/recetas-fabricacion/disponibles-venta` - Recetas disponibles para venta
- `PATCH /api/recetas-fabricacion/:id/recalcular-costos` - Recalcular costos usando precios actuales de productos
- `GET /api/recetas-fabricacion/:id/costeo` - Obtener desglose completo de costos

### recetaItemApi (`/api/recetas`)
- `GET /api/recetas/producto/:productoId` - Items de receta por producto
- `POST /api/recetas` - Crear item de receta
- `DELETE /api/recetas/producto/:productoId` - Eliminar receta por producto
- `DELETE /api/recetas/:id` - Eliminar item de receta

### equipoFabricadoApi (`/api/equipos-fabricados`)
- `GET /api/equipos-fabricados` - Listar equipos (paginado)
- `GET /api/equipos-fabricados/:id` - Equipo por ID
- `GET /api/equipos-fabricados/numero/:numeroHeladera` - Equipo por numero de heladera
- `POST /api/equipos-fabricados` - Crear equipo
- `POST /api/equipos-fabricados/batch` - Crear lote de equipos
- `PUT /api/equipos-fabricados/:id` - Actualizar equipo
- `DELETE /api/equipos-fabricados/:id` - Eliminar equipo
- `GET /api/equipos-fabricados/tipo/:tipo` - Equipos por tipo
- `GET /api/equipos-fabricados/estado/:estado` - Equipos por estado
- `GET /api/equipos-fabricados/disponibles` - Equipos disponibles
- `GET /api/equipos-fabricados/no-asignados` - Equipos no asignados
- `GET /api/equipos-fabricados/receta/:recetaId` - Equipos por receta
- `GET /api/equipos-fabricados/cliente/:clienteId` - Equipos por cliente
- `GET /api/equipos-fabricados/responsable/:responsableId` - Equipos por responsable
- `GET /api/equipos-fabricados/completados` - Equipos completados entre fechas
- `PATCH /api/equipos-fabricados/:id/asignar/:clienteId` - Asignar equipo a cliente
- `PATCH /api/equipos-fabricados/:id/desasignar` - Desasignar equipo
- `PATCH /api/equipos-fabricados/:id/marcar-entregado` - Marcar como entregado
- `PATCH /api/equipos-fabricados/:id/completar` - Completar fabricacion
- `PATCH /api/equipos-fabricados/:id/iniciar-fabricacion` - Iniciar fabricacion (PENDIENTE -> EN_PROCESO)
- `PATCH /api/equipos-fabricados/:id/cancelar` - Cancelar fabricacion
- `POST /api/equipos-fabricados/validar-stock` - Validar stock antes de fabricar
- `GET /api/equipos-fabricados/:id/validar-stock` - Validar stock de equipo existente
- `GET /api/equipos-fabricados/disponibles-venta/receta/:recetaId` - Equipos disponibles para venta por receta
- `PUT /api/equipos-fabricados/:id/estado-asignacion` - Cambiar estado de asignacion
- `POST /api/equipos-fabricados/base` - Fabricar equipo base (sin terminacion)
- `GET /api/equipos-fabricados/sin-terminacion` - Equipos sin terminacion
- `GET /api/equipos-fabricados/sin-terminacion/receta/:recetaId` - Sin terminacion por receta
- `POST /api/equipos-fabricados/reservar-para-nota` - Reservar equipo para nota de pedido
- `PATCH /api/equipos-fabricados/:id/aplicar-terminacion` - Aplicar terminacion (color/revestimiento)
- `GET /api/equipos-fabricados/:id/etapas-terminacion` - Etapas de terminacion
- `GET /api/equipos-fabricados/:id/historial` - Historial de fabricacion
- `PATCH /api/equipos-fabricados/:id/completar-base` - Completar base con terminaciones
- `PATCH /api/equipos-fabricados/:id/liberar-reserva` - Liberar reserva
- `GET /api/equipos-fabricados/pendientes-terminacion` - Equipos pendientes de terminacion
- `POST /api/equipos-fabricados/resolver-para-pedido` - Resolver stock para un pedido (P1/P2/P3)
- `GET /api/equipos-fabricados/bases-disponibles/count` - Conteo de bases disponibles

### movimientoStockFabricacionApi (`/api/movimientos-stock`)
- `GET /api/movimientos-stock` - Todos los movimientos
- `GET /api/movimientos-stock/equipo-fabricado/:equipoId` - Movimientos por equipo fabricado
- `GET /api/movimientos-stock/producto/:productoId` - Movimientos por producto
- `GET /api/movimientos-stock/tipo/:tipo` - Movimientos por tipo
- Filtro local: SALIDA_FABRICACION, REINGRESO_CANCELACION_FABRICACION

### productoTerminadoApi (`/api/productos`)
- `GET /api/productos` - Listar productos
- `GET /api/productos/activos` - Productos activos
- `GET /api/productos/:id` - Producto por ID
- `GET /api/productos/codigo/:codigo` - Producto por codigo
- `GET /api/productos/categoria/:categoriaId` - Productos por categoria
- `GET /api/productos/buscar/:nombre` - Buscar por nombre
- `GET /api/productos/bajo-stock` - Productos bajo stock
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### stockObjetivoApi (`/api/stock-objetivo`)
- `GET /api/stock-objetivo` - Listar objetivos de stock
- `GET /api/stock-objetivo/:id` - Objetivo por ID
- `GET /api/stock-objetivo/evaluacion` - Evaluacion de todos los objetivos en tiempo real
- `GET /api/stock-objetivo/:id/evaluacion` - Evaluacion de un objetivo especifico
- `POST /api/stock-objetivo` - Crear objetivo
- `PUT /api/stock-objetivo/:id` - Actualizar objetivo
- `POST /api/stock-objetivo/:id/generar-orden` - Generar orden de fabricacion preventiva

## Tipos Principales

```typescript
interface RecetaFabricacionDTO {
  id: number;
  codigo: string;
  nombre: string;
  tipoEquipo: TipoEquipo; // 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO'
  modelo?: string;
  medida?: string;
  color?: string;
  costoFabricacion: number;
  precioVenta?: number;
  disponibleParaVenta?: boolean;
  activo: boolean;
  detalles: DetalleRecetaDTO[];
}

interface EquipoFabricadoDTO {
  id: number;
  empresaId: number;
  recetaId?: number;
  tipo: TipoEquipo;
  modelo: string;
  medida?: MedidaEquipo;
  color?: string;
  numeroHeladera: string;
  cantidad: number;
  estado: EstadoFabricacion; // 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | 'FABRICADO_SIN_TERMINACION'
  estadoAsignacion?: EstadoAsignacionEquipo; // 'DISPONIBLE' | 'RESERVADO' | 'FACTURADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'PENDIENTE_TERMINACION'
  asignado: boolean;
  responsableId?: number;
  clienteId?: number;
}

interface CosteoRecetaDTO {
  recetaId: number;
  codigo: string;
  nombre: string;
  costoMaterial: number;
  costoManoObra: number;
  costoVariosMateriales: number;
  costosFijos: number;
  costoVenta: number;
  costoTraslado: number;
  costoTotalFabricacion: number;
  ganancia: number;
  precioSugerido: number;
}

// stockPlanificacion.types.ts
interface StockObjetivoResponseDTO {
  id: number;
  tipo: TipoEquipo;
  modelo: string;
  medida: MedidaEquipo;
  color?: string;
  cantidadObjetivo: number;
  activo: boolean;
}

interface EvaluacionStockDTO {
  stockObjetivoId: number;
  tipo: TipoEquipo;
  modelo: string;
  medida: MedidaEquipo;
  color?: string;
  cantidadObjetivo: number;
  stockDisponible: number;
  stockBaseDisponible: number;
  stockEnProduccion: number;
  diferencia: number;
  cantidadAFabricar: number;
  accionSugerida: 'FABRICAR' | 'TERMINAR_BASE' | 'OK';
}

type AplicarTerminacionDTO = {
  tipoTerminacion: 'COLOR_PINTURA' | 'GALVANIZADO' | 'TAPIZADO' | 'PLASTIFICADO' | 'OTRO';
  valor: string;
  completarAlTerminar: boolean;
  responsableId?: number;
  observaciones?: string;
}
```

## Permisos y Roles
Modulo: **PRODUCCION**

| Rol | Acceso |
|-----|--------|
| ADMIN | Acceso completo |
| ADMIN_EMPRESA | Acceso completo |
| OFICINA | Sin acceso |
| VENDEDOR | Sin acceso |
| TALLER | Sin acceso |
| GERENTE_SUCURSAL | Sin acceso |
| USER / USUARIO | Sin acceso |

## Multi-tenant
- `EquipoFabricadoDTO` tiene `empresaId` para filtrado multi-tenant.
- Las recetas y productos se filtran implicitamente por la empresa del usuario autenticado.
- Los objetivos de stock (`stockObjetivoApi`) operan dentro del contexto del tenant activo.

## Dependencias entre Modulos
- **Logistica/Stock**: La fabricacion consume materiales del stock (movimientos tipo `SALIDA_FABRICACION`). La cancelacion reingresa materiales (`REINGRESO_CANCELACION_FABRICACION`). Los equipos fabricados tienen ubicaciones en depositos.
- **Ventas**: Las recetas marcadas como `disponibleParaVenta` aparecen en el catalogo de ventas. Los equipos completados pueden reservarse para notas de pedido (`resolverParaPedido`).
- **Clientes**: Los equipos pueden asignarse a clientes (`asignarEquipo`).
- **RRHH**: Los equipos tienen `responsableId` (empleado que supervisa la fabricacion).
- **Proveedores/Compras**: Los productos (materias primas) usados en recetas se adquieren a traves de compras a proveedores.

## Patrones Especificos
- **Flujo de fabricacion en dos etapas (Base + Terminacion)**: Se fabrica primero la base (estructura metalica) y luego se aplica la terminacion (color/revestimiento). Estados: PENDIENTE -> EN_PROCESO -> FABRICADO_SIN_TERMINACION -> (aplicar terminacion) -> COMPLETADO.
- **Resolucion automatica de stock para pedidos (P1/P2/P3)**: Al recibir un pedido, el sistema intenta: P1) usar equipo COMPLETADO con color correcto, P2) usar base FABRICADO_SIN_TERMINACION y asignar color esperado, P3) crear nuevo equipo PENDIENTE para la cola de fabricacion.
- **Workarounds por bug de backend**: Varios metodos (`iniciarFabricacionPorNumero`, `completarFabricacionPorNumero`, `aplicarTerminacionPorNumero`, `deletePorNumero`) resuelven el ID real del equipo via `numeroHeladera` porque el backend retorna `id: null` en DTOs de lista.
- **Validacion de stock pre-fabricacion**: Antes de iniciar la fabricacion, se puede validar si hay stock suficiente de todos los materiales necesarios.
- **Costeo detallado**: Las recetas tienen un sistema de costeo que desglosa costoMaterial, costoManoObra, costoVariosMateriales, costosFijos, costoVenta, costoTraslado para calcular costoTotalFabricacion, ganancia y precioSugerido.
- **Stock preventivo con evaluacion en tiempo real**: Los objetivos de stock se evaluan comparando cantidadObjetivo vs stockDisponible + stockBaseDisponible + stockEnProduccion, sugiriendo acciones (FABRICAR, TERMINAR_BASE, OK).
- **Sidebar**: Seccion PRODUCCION con 5 items (Tablero de Produccion, Estructura de Produccion, Equipos Fabricados, Reportes de Estados, Stock Preventivo).
