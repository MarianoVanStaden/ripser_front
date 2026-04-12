# Módulo de Taller — Instructivo de Usuario

## Descripción general

El módulo de Taller gestiona el servicio técnico de la empresa: órdenes de trabajo, asignación de tareas a técnicos, materiales utilizados y seguimiento de trabajos realizados. Permite controlar tiempos, costos de mano de obra y materiales en cada intervención.

---

## Pantallas disponibles

### 1. Órdenes de Servicio

Gestión principal de trabajos técnicos a realizar o en curso.

**Acceso:** Menú Taller → Órdenes de Servicio

**Acciones disponibles:**
- Crear nueva orden de servicio
- Editar una orden existente
- Cambiar estado de la orden
- Asignar técnico responsable
- Ver tareas y materiales asociados
- Registrar cierre del trabajo
- Buscar y filtrar por cliente, estado o fecha

**Campos principales:**
- Número de orden (automático)
- Cliente
- Descripción del trabajo solicitado
- Fecha de creación y fecha estimada de finalización
- Estado
- Técnico responsable
- Costo de mano de obra
- Costo de materiales
- Total estimado y final
- Observaciones

---

### 2. Estados de una Orden de Servicio

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Ingresada, sin asignar ni iniciar |
| EN_PROCESO | Trabajo en curso |
| FINALIZADA | Trabajo terminado |
| CANCELADA | Cancelada sin realizarse |

---

### 3. Asignación de Tareas

Desglose de las tareas específicas dentro de una orden de servicio.

**Acceso:** Menú Taller → Asignación de Tareas

**Acciones disponibles:**
- Agregar tareas a una orden
- Asignar cada tarea a un empleado/técnico
- Registrar horas estimadas y reales
- Cambiar estado de cada tarea
- Ver carga de trabajo por técnico

**Campos de una tarea:**
- Descripción
- Horas estimadas
- Horas reales trabajadas
- Empleado asignado
- Fecha de inicio y fin
- Estado: PENDIENTE, EN_PROCESO, COMPLETADA
- Observaciones

---

### 4. Control de Materiales

Registro de los materiales y piezas utilizados en cada orden de servicio.

**Acceso:** Menú Taller → Control de Materiales

**Acciones disponibles:**
- Agregar materiales a una orden
- Indicar cantidad y precio unitario
- Ver costo total de materiales por orden
- Descontar automáticamente del inventario al confirmar uso

**Campos:**
- Orden de servicio
- Producto (del inventario)
- Cantidad utilizada
- Precio unitario
- Subtotal

---

### 5. Trabajos Realizados

Historial de todas las órdenes finalizadas.

**Acceso:** Menú Taller → Trabajos Realizados

**Contenido:**
- Listado de órdenes cerradas
- Filtros por período, cliente o técnico
- Costo total de materiales y mano de obra por trabajo
- Historial de servicio del cliente

---

### 6. Configuración del Taller

Parámetros y opciones de configuración del módulo.

**Acceso:** Menú Taller → Configuración

**Opciones:**
- Tipos de servicio predefinidos
- Valores de hora de mano de obra
- Categorías de trabajo

---

## Cálculo de costos en una orden

Cada orden tiene dos componentes de costo:

| Componente | Cómo se calcula |
|------------|----------------|
| Mano de obra | Horas reales × tarifa por hora del técnico |
| Materiales | Suma de (cantidad × precio unitario) de cada ítem |
| **Total** | Mano de obra + Materiales |

---

## Flujo de una orden de servicio

```
1. Ingreso del trabajo
   └── Se crea la orden con descripción del problema y cliente
   └── Estado: PENDIENTE

2. Asignación de técnico
   └── Se asigna el responsable de la orden

3. Desglose en tareas
   └── Se divide el trabajo en tareas específicas
   └── Se estiman horas por tarea

4. Ejecución
   └── El técnico actualiza el estado de sus tareas
   └── Estado de la orden: EN_PROCESO
   └── Se registran materiales utilizados

5. Cierre
   └── Todas las tareas en COMPLETADA
   └── Se registran horas reales y costos finales
   └── Estado de la orden: FINALIZADA

6. Facturación (si corresponde)
   └── El total de la orden puede pasarse al módulo de ventas para facturar
```

---

## Preguntas frecuentes

**¿Se descuenta el stock automáticamente al usar materiales?**
Sí. Al confirmar los materiales utilizados en una orden, el sistema descuenta las cantidades del inventario.

**¿Puedo tener más de un técnico en una orden?**
Sí. Podés asignar diferentes técnicos a distintas tareas dentro de la misma orden.

**¿Cómo se registran las horas extra o las demoras?**
Al completar cada tarea, se ingresa el tiempo real trabajado. Si difiere de la estimación, el sistema calcula el costo real de mano de obra con las horas reales.

**¿Las órdenes de garantía se gestionan acá?**
Las reparaciones bajo garantía pueden gestionarse como órdenes de taller. El módulo de Garantías registra el reclamo, y Taller ejecuta el trabajo técnico.
