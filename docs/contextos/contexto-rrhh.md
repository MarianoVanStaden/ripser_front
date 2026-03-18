# Contexto: RRHH

## Descripcion General
Modulo de Recursos Humanos que gestiona el ciclo de vida completo del empleado: alta/baja, legajos digitales con documentos adjuntos, puestos de trabajo con tareas/subtareas versionadas, control de asistencia con configuracion de horarios, licencias, capacitaciones, liquidacion de sueldos y administracion de usuarios del sistema. Opera bajo el modelo multi-tenant con `empresaId` y `sucursalId`.

## Archivos del Modulo
- Componentes: `src/components/RRHH/EmpleadosPage.tsx`, `UsuariosPage.tsx`, `PuestosPage.tsx`, `PuestoDetailPage.tsx`, `PuestoFormDialog.tsx`, `TareaFormDialog.tsx`, `SubtareaFormDialog.tsx`, `AsistenciasPage.tsx`, `LicenciasPage.tsx`, `CapacitacionesPage.tsx`, `SueldosPage.tsx`, `LegajosPage.tsx`, `index.ts`
- API Services: `src/api/services/employeeApi.ts`, `puestoApi.ts`, `registroAsistenciaApi.ts`, `configuracionAsistenciaApi.ts`, `licenciaApi.ts`, `capacitacionApi.ts`, `sueldoApi.ts`, `legajoApi.ts`, `documentoLegajoApi.ts`, `documentoEmpleadoApi.ts`, `usuarioApi.ts`
- Hooks: `src/hooks/usePagination.ts` (generico)
- Types: Definidos en `src/types/index.ts` (Empleado, EmpleadoCreateDTO, EmpleadoUpdateDTO, RegistroAsistencia, Licencia, Capacitacion, Sueldo, Legajo, DocumentoLegajo, DocumentoEmpleado, UploadResponse, Usuario, PuestoListDTO, PuestoResponseDTO, CreatePuestoDTO, UpdatePuestoDTO, PuestoVersionDTO, TareaPuestoDTO, SubtareaPuestoDTO); `src/api/services/configuracionAsistenciaApi.ts` (ConfiguracionAsistenciaDTO, HorarioDiaDTO)
- Utils: No posee utils especificos

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /rrhh/empleados | EmpleadosPage | PrivateRoute |
| /rrhh/usuarios | UsuariosPage | PrivateRoute |
| /rrhh/puestos | PuestosPage | PrivateRoute |
| /rrhh/puestos/:id | PuestoDetailPage | PrivateRoute |
| /rrhh/asistencia | AsistenciasPage | PrivateRoute |
| /rrhh/licencias | LicenciasPage | PrivateRoute |
| /rrhh/capacitaciones | CapacitacionesPage | PrivateRoute |
| /rrhh/sueldos | SueldosPage | PrivateRoute |
| /rrhh/legajos | LegajosPage | PrivateRoute |

## Endpoints API Consumidos

### employeeApi (`/api/empleados`)
- `GET /api/empleados` - Listar empleados (paginado)
- `GET /api/empleados` (size=10000) - Listar todos los empleados (no paginado, compatibilidad)
- `GET /api/empleados/:id` - Obtener empleado por ID
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Eliminar empleado
- `GET /api/empleados/dni/:dni` - Buscar por DNI
- `GET /api/empleados/estado/:estado` - Buscar por estado
- `PATCH /api/empleados/:id/estado` - Cambiar estado del empleado

### puestoApi (`/api/rrhh/puestos`)
- `GET /api/rrhh/puestos` - Listar puestos (paginado)
- `GET /api/rrhh/puestos/activos` - Puestos activos
- `GET /api/rrhh/puestos/departamentos` - Listar departamentos
- `GET /api/rrhh/puestos/departamento/:departamento` - Puestos por departamento
- `GET /api/rrhh/puestos/:id` - Detalle de puesto
- `POST /api/rrhh/puestos` - Crear puesto
- `PUT /api/rrhh/puestos/:id` - Actualizar puesto
- `DELETE /api/rrhh/puestos/:id` - Eliminar puesto
- `PUT /api/rrhh/puestos/:id/activar` - Activar puesto
- `GET /api/rrhh/puestos/:puestoId/versiones` - Historial de versiones
- `GET /api/rrhh/puestos/:puestoId/versiones/:version` - Version especifica
- `GET /api/rrhh/puestos/:puestoId/pdf` - Descargar PDF del puesto
- `POST /api/rrhh/puestos/:puestoId/tareas` - Agregar tarea
- `PUT /api/rrhh/puestos/:puestoId/tareas/:tareaId` - Actualizar tarea
- `DELETE /api/rrhh/puestos/:puestoId/tareas/:tareaId` - Eliminar tarea
- `PUT /api/rrhh/puestos/:puestoId/tareas/reorder` - Reordenar tareas
- `POST /api/rrhh/puestos/:puestoId/tareas/:tareaId/subtareas` - Agregar subtarea
- `PUT /api/rrhh/puestos/:puestoId/tareas/:tareaId/subtareas/:subtareaId` - Actualizar subtarea
- `DELETE /api/rrhh/puestos/:puestoId/tareas/:tareaId/subtareas/:subtareaId` - Eliminar subtarea

### registroAsistenciaApi (`/api/registro-asistencia`)
- `GET /api/registro-asistencia` - Listar registros (paginado)
- `GET /api/registro-asistencia/:id` - Registro por ID
- `GET /api/registro-asistencia/empleado/:empleadoId` - Registros por empleado
- `GET /api/registro-asistencia/periodo` - Registros por periodo (fechaInicio, fechaFin)
- `GET /api/registro-asistencia/empleado/:empleadoId/periodo` - Por empleado y periodo
- `GET /api/registro-asistencia/empleado/:empleadoId/total-horas` - Total horas trabajadas
- `POST /api/registro-asistencia` - Crear registro
- `PUT /api/registro-asistencia/:id` - Actualizar registro
- `DELETE /api/registro-asistencia/:id` - Eliminar registro

### configuracionAsistenciaApi (`/api/configuracion-asistencia`)
- `GET /api/configuracion-asistencia` - Listar configuraciones
- `GET /api/configuracion-asistencia/:id` - Configuracion por ID
- `GET /api/configuracion-asistencia/empleado/:empleadoId` - Configuracion del empleado
- `POST /api/configuracion-asistencia` - Crear configuracion personalizada
- `POST /api/configuracion-asistencia/horario-estandar/:empleadoId` - Crear horario estandar (L-V 8:00-17:00)
- `PUT /api/configuracion-asistencia/:id` - Actualizar configuracion
- `DELETE /api/configuracion-asistencia/:id` - Eliminar configuracion

### licenciaApi (`/api/licencias`)
- `GET /api/licencias` - Listar licencias
- `GET /api/licencias/:id` - Licencia por ID
- `GET /api/licencias/empleado/:empleadoId` - Licencias por empleado
- `GET /api/licencias/tipo/:tipo` - Licencias por tipo
- `GET /api/licencias/estado/:estado` - Licencias por estado
- `GET /api/licencias/activas` - Licencias activas por fecha
- `POST /api/licencias` - Crear licencia
- `PUT /api/licencias/:id` - Actualizar licencia
- `DELETE /api/licencias/:id` - Eliminar licencia

### capacitacionApi (`/api/capacitaciones`)
- `GET /api/capacitaciones` - Listar capacitaciones
- `GET /api/capacitaciones/:id` - Capacitacion por ID
- `GET /api/capacitaciones/empleado/:empleadoId` - Capacitaciones por empleado
- `GET /api/capacitaciones/institucion/:institucion` - Por institucion
- `GET /api/capacitaciones/periodo` - Por periodo (fechaInicio, fechaFin)
- `POST /api/capacitaciones` - Crear capacitacion
- `PUT /api/capacitaciones/:id` - Actualizar capacitacion
- `DELETE /api/capacitaciones/:id` - Eliminar capacitacion

### sueldoApi (`/api/sueldos`)
- `GET /api/sueldos` - Listar sueldos (paginado)
- `GET /api/sueldos/:id` - Sueldo por ID
- `GET /api/sueldos/empleado/:empleadoId` - Sueldos por empleado
- `GET /api/sueldos/periodo/:periodo` - Sueldos por periodo
- `GET /api/sueldos/periodo-range` - Sueldos por rango de periodos
- `GET /api/sueldos/pendientes-pago` - Sueldos pendientes de pago
- `POST /api/sueldos` - Crear sueldo
- `PUT /api/sueldos/:id` - Actualizar sueldo
- `DELETE /api/sueldos/:id` - Eliminar sueldo

### legajoApi (`/api/legajos`)
- `GET /api/legajos` - Listar legajos (paginado)
- `GET /api/legajos/:id` - Legajo por ID
- `GET /api/legajos/empleado/:empleadoId` - Legajo por empleado
- `GET /api/legajos/numero/:numeroLegajo` - Legajo por numero
- `GET /api/legajos/activos` - Legajos activos
- `GET /api/legajos/inactivos` - Legajos inactivos
- `POST /api/legajos` - Crear legajo
- `PUT /api/legajos/:id` - Actualizar legajo
- `DELETE /api/legajos/:id` - Eliminar legajo

### documentoLegajoApi (`/api/documentos-legajo`)
- `POST /api/documentos-legajo/upload` - Subir documento (multipart/form-data)
- `GET /api/documentos-legajo/legajo/:legajoId` - Documentos por legajo
- `GET /api/documentos-legajo/:id` - Documento por ID
- `GET /api/documentos-legajo/download/:id` - Descargar documento
- `DELETE /api/documentos-legajo/:id` - Eliminar documento

### documentoEmpleadoApi (`/api/empleados/:empleadoId/documentos`)
- `POST /api/empleados/:empleadoId/documentos` - Subir documento (multipart/form-data)
- `GET /api/empleados/:empleadoId/documentos` - Documentos por empleado (con filtro opcional por categoria)
- `GET /api/empleados/:empleadoId/documentos/:id` - Documento por ID
- `GET /api/empleados/:empleadoId/documentos/:id/download` - Descargar documento
- `DELETE /api/empleados/:empleadoId/documentos/:id` - Eliminar documento
- `GET /api/empleados/:empleadoId/documentos/categorias` - Listar categorias disponibles

## Tipos Principales

```typescript
interface Empleado {
  id: number;
  empresaId: number;
  sucursalId?: number;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  estado: EstadoEmpleado;
  puesto?: Puesto;
  salario: number;
  fechaIngreso?: string;
  fechaEgreso?: string;
}

interface Sueldo {
  id: number;
  empleado: Empleado;
  periodo: string; // YYYY-MM
  sueldoBasico: number;
  bonificaciones: number;
  horasExtras: number;
  comisiones: number;
  totalBruto: number;
  descuentosLegales: number;
  descuentosOtros: number;
  totalDescuentos: number;
  sueldoNeto: number;
  fechaPago?: string;
}

interface Legajo {
  id: number;
  empleado: Empleado;
  numeroLegajo: string;
  fechaAlta: string;
  activo: boolean;
}

interface Licencia {
  id: number;
  empleado: Empleado;
  tipo: TipoLicencia;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  goceHaber: boolean;
  estado: EstadoLicencia;
}

interface ConfiguracionAsistenciaDTO {
  id?: number;
  empleadoId: number;
  activo?: boolean;
  lunes?: HorarioDiaDTO;  // { horaEntrada, horaSalida, trabaja }
  // ... mismo patron para cada dia de la semana
}
```

## Permisos y Roles
Modulo: **RRHH**

| Rol | Acceso |
|-----|--------|
| ADMIN | Acceso completo |
| ADMIN_EMPRESA | Acceso completo |
| GERENTE_SUCURSAL | Acceso completo |
| OFICINA | Sin acceso |
| VENDEDOR | Sin acceso |
| TALLER | Sin acceso |
| USER / USUARIO | Sin acceso |

## Multi-tenant
- `Empleado` tiene `empresaId` y `sucursalId` opcional, lo que permite filtrar empleados por empresa y por sucursal.
- El backend filtra automaticamente segun el tenant del usuario autenticado.
- Los sueldos, legajos, licencias y capacitaciones se acceden a traves del empleado, heredando el filtro multi-tenant.

## Dependencias entre Modulos
- **Taller**: Las tareas de servicio se asignan a empleados (`empleadoId`). Las ordenes de servicio tienen un `responsableId` que referencia a un empleado.
- **Logistica/Distribucion**: Los viajes requieren un conductor (`conductorId`) que es un empleado.
- **Fabricacion**: Los equipos fabricados pueden tener un `responsableId` (empleado responsable de la fabricacion).
- **Administracion**: Los usuarios del sistema se gestionan desde RRHH y se vinculan a roles que determinan permisos en todo el sistema.

## Patrones Especificos
- **Puestos versionados**: El sistema de puestos soporta versionado historico, permitiendo consultar versiones anteriores de la descripcion del puesto, sus tareas y subtareas.
- **Estructura jerarquica de puestos**: Puesto > Tareas > Subtareas, con reordenamiento drag-and-drop de tareas.
- **Exportacion PDF de puestos**: Permite descargar la descripcion completa del puesto en formato PDF.
- **Configuracion de horarios flexible**: Cada empleado puede tener horarios personalizados por dia de la semana, o usar el horario estandar (L-V 8:00-17:00).
- **Documentos duales**: Existen dos sistemas de documentos: `documentoLegajoApi` (vinculado al legajo) y `documentoEmpleadoApi` (vinculado directamente al empleado), ambos con upload multipart y descarga de archivos.
- **Sidebar**: Seccion RRHH con 8 items de navegacion (Empleados, Usuarios del Sistema, Legajos, Sueldos, Asistencia, Capacitaciones, Puestos, Licencias).
