# Contexto: Taller

## Descripcion General
Modulo de gestion de taller de servicio tecnico que administra ordenes de servicio con asignacion de tareas a empleados, control de materiales utilizados por orden, seguimiento de trabajos realizados y configuracion general del taller. Incluye reportes de productividad por empleado y consumo de materiales. Las ordenes se vinculan a clientes y pueden generar entregas a traves del modulo de logistica.

## Archivos del Modulo
- Componentes: `src/components/Taller/OrdenesServicioPage.tsx`, `ControlMaterialesPage.tsx`, `AsignacionTareasPage.tsx`, `TrabajosRealizadosPage.tsx`, `ConfiguracionTallerPage.tsx`
- API Services: `src/api/services/ordenServicioApi.ts`, `tareaServicioApi.ts`, `materialUtilizadoApi.ts`, `reportesTallerApi.ts`, `serviceApi.ts`
- Hooks: No posee hooks dedicados; usa `usePagination` generico
- Types: Definidos en `src/types/index.ts` (OrdenServicio, TareaServicio, MaterialUtilizado, Service, ServiceAppointment, CreateServiceRequest, CreateServiceAppointmentRequest)
- Utils: No posee utils especificos

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /taller/ordenes | OrdenesServicioPage | PrivateRoute |
| /taller/materiales | ControlMaterialesPage | PrivateRoute |
| /taller/tareas | AsignacionTareasPage | PrivateRoute |
| /taller/trabajos | TrabajosRealizadosPage | PrivateRoute |
| /taller/configuracion | ConfiguracionTallerPage | PrivateRoute |

## Endpoints API Consumidos

### ordenServicioApi (`/api/ordenes-servicio`)
- `GET /api/ordenes-servicio` - Listar ordenes (paginado)
- `GET /api/ordenes-servicio/:id` - Orden por ID
- `POST /api/ordenes-servicio` - Crear orden de servicio
- `PUT /api/ordenes-servicio/:id` - Actualizar orden
- `DELETE /api/ordenes-servicio/:id` - Eliminar orden
- `GET /api/ordenes-servicio/cliente/:clienteId` - Ordenes por cliente
- `GET /api/ordenes-servicio/estado/:estado` - Ordenes por estado
- `GET /api/ordenes-servicio/responsable/:responsableId` - Ordenes por responsable
- `GET /api/ordenes-servicio/retrasadas` - Ordenes retrasadas
- `GET /api/ordenes-servicio/por-fecha` - Ordenes por rango de fechas
- `PATCH /api/ordenes-servicio/:id/estado` - Cambiar estado de la orden

### tareaServicioApi (`/api/tareas-servicio`)
- `GET /api/tareas-servicio` - Listar tareas (respuesta paginada, extrae content)
- `GET /api/tareas-servicio/:id` - Tarea por ID
- `POST /api/tareas-servicio` - Crear tarea
- `PUT /api/tareas-servicio/:id` - Actualizar tarea
- `DELETE /api/tareas-servicio/:id` - Eliminar tarea
- `GET /api/tareas-servicio/orden/:ordenId` - Tareas por orden de servicio
- `GET /api/tareas-servicio/empleado/:empleadoId` - Tareas por empleado
- `GET /api/tareas-servicio/estado/:estado` - Tareas por estado
- `GET /api/tareas-servicio/empleado/:empleadoId/en-proceso` - Tareas en proceso por empleado
- `PATCH /api/tareas-servicio/:id/iniciar` - Iniciar tarea
- `PATCH /api/tareas-servicio/:id/completar` - Completar tarea (con horasReales opcional)

### materialUtilizadoApi (`/api/materiales-utilizados`)
- `GET /api/materiales-utilizados` - Listar materiales (respuesta paginada, extrae content)
- `GET /api/materiales-utilizados/:id` - Material por ID
- `POST /api/materiales-utilizados` - Registrar material utilizado
- `PUT /api/materiales-utilizados/:id` - Actualizar material
- `DELETE /api/materiales-utilizados/:id` - Eliminar material
- `GET /api/materiales-utilizados/orden/:ordenId` - Materiales por orden
- `GET /api/materiales-utilizados/producto/:productoId` - Materiales por producto
- `GET /api/materiales-utilizados/producto/:productoId/consumo` - Cantidad consumida por periodo

### reportesTallerApi (`/api/reportes/taller`)
- `GET /api/reportes/taller/ordenes-por-estado` - Reporte de ordenes agrupadas por estado
- `GET /api/reportes/taller/productividad-empleados` - Reporte de productividad por empleado (periodo)
- `GET /api/reportes/taller/materiales-mas-utilizados` - Reporte de materiales mas usados (periodo)

### serviceApi (`/services`)
- `GET /services` - Listar servicios
- `GET /services/:id` - Servicio por ID
- `POST /services` - Crear servicio
- `PUT /services/:id` - Actualizar servicio
- `DELETE /services/:id` - Eliminar servicio
- `GET /services/active` - Servicios activos

### serviceAppointmentApi (`/service-appointments`)
- `GET /service-appointments` - Listar citas
- `GET /service-appointments/:id` - Cita por ID
- `POST /service-appointments` - Crear cita
- `PUT /service-appointments/:id` - Actualizar cita
- `DELETE /service-appointments/:id` - Eliminar cita
- `GET /service-appointments/client/:clientId` - Citas por cliente
- `GET /service-appointments/date/:date` - Citas por fecha

## Tipos Principales

```typescript
interface OrdenServicio {
  id: number;
  numeroOrden: string;
  clienteId: number;
  clienteNombre?: string;
  fechaCreacion: string;
  fechaEstimada?: string;
  fechaFinalizacion?: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';
  descripcionTrabajo: string;
  costoManoObra: number;
  costoMateriales: number;
  total: number;
  responsableId?: number;
  responsableNombre?: string;
  materiales: MaterialUtilizado[];
  tareas: TareaServicio[];
}

interface TareaServicio {
  id: number;
  ordenServicioId: number;
  descripcion: string;
  horasEstimadas: number;
  horasReales: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA';
  empleadoId?: number;
  empleado?: Empleado;
  fechaInicio?: string;
  fechaFin?: string;
}

interface MaterialUtilizado {
  id: number;
  ordenServicioId: number;
  productoId: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
```

## Permisos y Roles
Modulo: **TALLER**

| Rol | Acceso |
|-----|--------|
| ADMIN | Acceso completo |
| TALLER | Acceso completo |
| ADMIN_EMPRESA | Acceso completo |
| OFICINA | Sin acceso |
| VENDEDOR | Sin acceso |
| GERENTE_SUCURSAL | Sin acceso |
| USER / USUARIO | Sin acceso |

## Multi-tenant
- Las ordenes de servicio no tienen `empresaId` directo en la interfaz frontend, pero el backend filtra por el contexto del tenant autenticado.
- Los materiales y tareas se asocian a ordenes, heredando el filtro multi-tenant.
- Los empleados asignados como responsables o ejecutores de tareas deben pertenecer a la misma empresa.

## Dependencias entre Modulos
- **Clientes**: Las ordenes de servicio se crean para un `clienteId` especifico.
- **RRHH**: Las tareas se asignan a empleados (`empleadoId`), y las ordenes tienen un responsable (`responsableId`) que es un empleado.
- **Logistica**: Los materiales utilizados referencian `productoId` (productos del stock). Las ordenes de servicio pueden tener entregas de viaje asociadas. Los materiales consumidos afectan el stock.
- **Productos**: Los materiales registran el consumo de productos existentes en el catalogo.

## Patrones Especificos
- **Flujo de estados de tarea**: PENDIENTE -> EN_PROCESO (iniciar) -> COMPLETADA (completar con horasReales). Se puede consultar las tareas en proceso de un empleado especifico.
- **Flujo de estados de orden**: PENDIENTE -> EN_PROCESO -> FINALIZADA | CANCELADA. Se pueden detectar ordenes retrasadas.
- **Costos calculados**: La orden de servicio agrega `costoManoObra` + `costoMateriales` = `total`. Los materiales tienen `cantidad * precioUnitario = subtotal`.
- **Reportes de productividad**: El modulo genera reportes de productividad por empleado y consumo de materiales por periodo.
- **Respuestas paginadas con extraccion**: `tareaServicioApi` y `materialUtilizadoApi` extraen el array `content` de respuestas paginadas del backend, retornando arrays planos al consumidor.
- **Sidebar**: Seccion TALLER con 5 items (Ordenes Servicio, Control Materiales, Asignacion Tareas, Trabajos Realizados, Configuracion).
