# Módulo de RRHH — Instructivo de Usuario

## Descripción general

El módulo de Recursos Humanos centraliza la gestión del personal de la empresa: alta de empleados, control de asistencia, licencias, capacitaciones, liquidación de sueldos y legajos.

---

## Pantallas disponibles

### 1. Empleados

Alta, edición y gestión del plantel de empleados.

**Acceso:** Menú RRHH → Empleados

**Acciones disponibles:**
- Crear nuevo empleado
- Editar datos del empleado
- Cambiar estado (activo, inactivo, licencia)
- Buscar por nombre, DNI o puesto
- Ver detalle completo del empleado

**Campos principales:**
- Nombre, apellido, DNI
- Email y teléfono
- Dirección
- Fecha de nacimiento
- Fecha de ingreso / egreso
- Puesto asignado
- Salario base
- Sucursal
- Estado: ACTIVO, INACTIVO, LICENCIA

---

### 2. Usuarios del Sistema

Gestión de las cuentas de acceso al sistema vinculadas a empleados.

**Acceso:** Menú RRHH → Usuarios

**Acciones disponibles:**
- Crear cuenta de usuario para un empleado
- Asignar roles y permisos
- Activar / desactivar usuario
- Consultar último acceso

---

### 3. Puestos

Definición de los puestos de trabajo con sus responsabilidades y estructura.

**Acceso:** Menú RRHH → Puestos

**Acciones disponibles:**
- Crear nuevo puesto
- Editar descripción, salario base, departamento
- Ver detalle del puesto con tareas y subtareas
- Activar / desactivar puesto
- Historial de versiones del puesto

**Campos principales:**
- Nombre del puesto
- Departamento
- Descripción
- Objetivo general
- Salario base de referencia
- Requisitos del puesto
- Listado de tareas (con subtareas)
- Estado: activo / inactivo

---

### 4. Asistencia

Control de entrada y salida del personal.

**Acceso:** Menú RRHH → Asistencia

**Acciones disponibles:**
- Registrar entrada y salida de empleados
- Ver listado de asistencias del día / semana / mes
- Consultar horas trabajadas y horas extras por empleado
- Filtrar por empleado y rango de fechas
- Agregar observaciones

**Campos:**
- Empleado
- Fecha
- Hora de entrada / salida
- Horas trabajadas (calculado)
- Horas extras (calculado)
- Observaciones

---

### 5. Licencias

Gestión de ausencias y permisos del personal.

**Acceso:** Menú RRHH → Licencias

**Acciones disponibles:**
- Crear solicitud de licencia
- Aprobar o rechazar solicitudes
- Ver calendario de licencias del equipo
- Filtrar por tipo, estado y empleado

**Tipos de licencia:**
| Tipo | Descripción |
|------|-------------|
| VACACIONES | Días de vacaciones anuales |
| ENFERMEDAD | Baja por motivos de salud |
| PERSONAL | Día personal o trámites |
| MATERNIDAD | Licencia por maternidad/paternidad |

**Estados de una licencia:**
| Estado | Descripción |
|--------|-------------|
| SOLICITADA | Pedida por el empleado, pendiente de aprobación |
| APROBADA | Aprobada por responsable |
| RECHAZADA | No aprobada |

**Campos principales:**
- Empleado
- Tipo de licencia
- Fecha de inicio y fin
- Cantidad de días
- Con/sin goce de haberes
- Estado

---

### 6. Capacitaciones

Registro de cursos y formaciones realizadas por los empleados.

**Acceso:** Menú RRHH → Capacitaciones

**Acciones disponibles:**
- Registrar nueva capacitación para un empleado
- Ver historial de capacitaciones por empleado
- Filtrar por institución, fecha o nombre del curso

**Campos principales:**
- Empleado
- Nombre del curso / capacitación
- Institución
- Fecha de inicio y fin
- Duración en horas
- Certificado obtenido (sí/no)
- Costo

---

### 7. Sueldos

Liquidación y registro de sueldos del personal.

**Acceso:** Menú RRHH → Sueldos

**Acciones disponibles:**
- Generar liquidación de sueldo para un empleado
- Ver liquidaciones por período
- Consultar detalle de cada liquidación
- Filtrar por empleado y período

**Componentes de la liquidación:**
| Concepto | Descripción |
|----------|-------------|
| Sueldo básico | Salario base del puesto |
| Bonificaciones | Adicionales por desempeño u otros |
| Horas extras | Calculado desde asistencia |
| Comisiones | Por ventas u objetivos |
| **Total bruto** | Suma de haberes |
| Descuentos legales | Aportes jubilatorios, obra social, etc. |
| **Sueldo neto** | Total a percibir |

**Período:** Año y mes (formato YYYY-MM)

---

### 8. Legajos

Carpeta digital de cada empleado con su historial laboral y documentación.

**Acceso:** Menú RRHH → Legajos

**Acciones disponibles:**
- Ver legajo completo de cada empleado
- Registrar motivo de baja
- Adjuntar documentación
- Consultar historial de cambios de puesto o salario

**Campos del legajo:**
- Número de legajo
- Empleado
- Fecha de alta
- Motivo de baja (si aplica)
- Documentos adjuntos

---

## Flujo de alta de un empleado

```
1. Crear empleado
   └── Cargar datos personales, contacto, puesto y salario

2. Asignar puesto
   └── Seleccionar puesto existente o crear uno nuevo

3. Crear usuario (si necesita acceso al sistema)
   └── Vincular con el empleado
   └── Asignar roles y permisos

4. Registrar asistencia
   └── Desde la pantalla de Asistencia, por día

5. Gestión continua
   └── Solicitar / aprobar licencias
   └── Registrar capacitaciones
   └── Liquidar sueldo mensualmente
   └── Mantener legajo actualizado
```

---

## Preguntas frecuentes

**¿Todos los empleados necesitan usuario del sistema?**
No. Solo los que operen con el sistema. Un empleado de producción puede no tener acceso al sistema.

**¿Las horas extras se calculan automáticamente?**
Sí, siempre que se registren los horarios de entrada y salida correctamente en Asistencia.

**¿Puedo registrar licencias pasadas?**
Sí, podés cargar licencias con fecha retroactiva.

**¿Qué es el goce de haberes en licencias?**
Indica si el empleado cobra su sueldo normalmente durante la licencia (con goce) o no percibe haberes (sin goce).

**¿Cómo funciona el versionado de puestos?**
Cada vez que se modifica la descripción o estructura de un puesto, el sistema guarda una versión histórica para mantener el registro de los cambios.
