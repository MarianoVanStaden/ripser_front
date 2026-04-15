# Módulo de Producción — Instructivo de Usuario

## Descripción general

El módulo de Producción (Fabricación) gestiona la creación de equipos fabricados por la empresa: heladeras, coolboxes y exhibidores. Incluye la definición de recetas de producción (estructura de materiales), el seguimiento de cada unidad fabricada, la aplicación de terminaciones y la planificación de stock.

---

## Pantallas disponibles

### 1. Tablero de Producción

Panel principal con indicadores de fabricación: equipos por estado, tipos producidos, eficiencia del proceso y métricas del período.

**Acceso:** Menú Producción → Tablero de Producción

---

### 2. Estructura de Producción (Recetas)

Las **recetas** son las fichas técnicas de cada modelo de equipo: qué materiales se necesitan y en qué cantidades para fabricarlo.

**Acceso:** Menú Producción → Estructura de Producción

**Acciones disponibles:**
- Crear nueva receta
- Editar receta existente
- Activar / desactivar receta
- Ver detalle con lista de materiales (BOM) y costos
- Filtrar por tipo de equipo y estado

**Campos principales de una receta:**
- Código y nombre
- Tipo de equipo: HELADERA, COOLBOX, EXHIBIDOR, OTRO
- Modelo, medida y color (opcionales para recetas base)
- Precio de venta y costo de fabricación
- Disponible para venta (indica si este modelo puede ofrecerse en ventas)
- Lista de ingredientes/materiales: producto, cantidad, costo unitario

**Receta base vs. receta con terminación:**
- **Receta base**: sin color definido — representa el equipo sin terminación superficial
- **Receta con color**: incluye el color específico — representa el modelo terminado

---

### 3. Equipos Fabricados

Registro de todas las unidades físicas producidas o en proceso de producción.

**Acceso:** Menú Producción → Equipos Fabricados

**Acciones disponibles:**
- Registrar nuevo equipo (individual o en lote)
- Editar datos del equipo
- Cambiar estado del equipo
- Aplicar terminación (color, revestimiento)
- Asignar / desasignar a cliente
- Marcar como entregado
- Filtrar por tipo, estado, estado de asignación
- Ver historial completo de estados de cada equipo

**Campos principales de un equipo:**
- Número de heladera (identificador único, puede generarse automáticamente)
- Tipo: HELADERA, COOLBOX, EXHIBIDOR, OTRO
- Modelo, equipo, medida, color
- Receta utilizada
- Estado de fabricación
- Estado de asignación
- Responsable de fabricación
- Cliente asignado (si corresponde)

---

### 4. Estados de fabricación

Cada equipo recorre los siguientes estados durante su ciclo de vida:

```
PENDIENTE → EN_PROCESO → FABRICADO_SIN_TERMINACION → COMPLETADO
                                                    ↓
                                            (Aplicar terminación)
```

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Orden creada, sin iniciar fabricación |
| EN_PROCESO | Equipo en línea de producción |
| FABRICADO_SIN_TERMINACION | Estructura lista, falta aplicar terminación (pintura, revestimiento) |
| COMPLETADO | Equipo terminado y listo para uso/venta |
| CANCELADO | Producción cancelada |

**Transiciones permitidas:**
- PENDIENTE → EN_PROCESO: Iniciar fabricación
- EN_PROCESO → FABRICADO_SIN_TERMINACION o COMPLETADO: Finalizar fabricación
- FABRICADO_SIN_TERMINACION → COMPLETADO: Aplicar terminación
- Cualquier estado → CANCELADO: Cancelar

---

### 5. Estados de asignación

Indica la situación comercial del equipo fabricado:

| Estado | Descripción |
|--------|-------------|
| DISPONIBLE | Listo para ser vendido |
| RESERVADO | Reservado para una Nota de Pedido |
| FACTURADO | Asignado a una factura emitida |
| EN_TRANSITO | En camino al cliente |
| ENTREGADO | Entregado al cliente final |
| PENDIENTE_TERMINACION | Reservado pero sin terminación lista aún |

---

### 6. Aplicar Terminación

Cuando un equipo llega al estado FABRICADO_SIN_TERMINACION, se le puede aplicar la terminación superficial (color, pintura, revestimiento).

**Acciones:**
- Seleccionar equipo sin terminación
- Indicar tipo de terminación y color
- El equipo pasa a estado COMPLETADO

Podés ver todos los equipos sin terminación usando el filtro correspondiente en la lista de equipos.

---

### 7. Registro por lote

Al crear equipos, podés fabricar múltiples unidades del mismo modelo en una sola operación (batch). El sistema genera un número de heladera para cada unidad.

**Opciones al crear:**
- Número de heladera: automático (el sistema asigna) o manual
- Cantidad: número de unidades del mismo modelo a fabricar

---

### 8. Reportes de Estados

Análisis del estado actual de la producción.

**Contenido:**
- Cantidad de equipos por estado de fabricación
- Cantidad de equipos por tipo
- Equipos disponibles vs. asignados vs. entregados
- Evolución en el tiempo

---

### 9. Stock Planificación (Stock Preventivo)

Herramienta para planificar la producción en base a objetivos de stock.

**Acceso:** Menú Producción → Stock Preventivo

**Funcionalidad:**
1. Definir un **objetivo de stock** por receta (cuántas unidades deberías tener disponibles)
2. El sistema evalúa el stock actual vs. el objetivo
3. Si hay déficit, sugiere cuántas unidades fabricar
4. Desde ahí podés generar una orden de producción

**Acciones disponibles:**
- Crear / editar objetivo de stock por receta
- Ver evaluación: stock actual, objetivo, diferencia
- Generar orden de fabricación cuando la acción sugerida es FABRICAR
- Ver link al módulo de equipos cuando hay unidades sin terminación (acción: TERMINAR_BASE)

**Interpretación de la evaluación:**
| Acción Sugerida | Significado |
|-----------------|-------------|
| FABRICAR | Stock actual está por debajo del objetivo |
| TERMINAR_BASE | Hay unidades fabricadas sin terminación que cubren el déficit |
| OK | Stock dentro del objetivo |

**Nota:** Si la diferencia es negativa (superávit), no es un error — significa que tenés más stock del objetivo definido.

---

## Flujo completo de fabricación

```
1. Definir Receta
   └── Cargar materiales, costos, tipo y modelo del equipo

2. Crear Equipo(s)
   └── Individual o en lote
   └── Asignar receta, modelo, medida, color
   └── Estado inicial: PENDIENTE

3. Iniciar Fabricación
   └── Estado: PENDIENTE → EN_PROCESO

4. Completar Fabricación
   └── Si tiene terminación: EN_PROCESO → COMPLETADO
   └── Si no tiene terminación: EN_PROCESO → FABRICADO_SIN_TERMINACION

5. Aplicar Terminación (si corresponde)
   └── Estado: FABRICADO_SIN_TERMINACION → COMPLETADO

6. Equipo disponible para venta
   └── Estado de asignación: DISPONIBLE

7. Asignación a venta
   └── Se reserva desde una Nota de Pedido → estado: RESERVADO
   └── Se factura → estado: FACTURADO
   └── Se entrega → estado: ENTREGADO
```

---

## Integración con el módulo de Ventas

Cuando se crea una Nota de Pedido o Factura que incluye ítems de tipo **EQUIPO**, el sistema muestra los equipos fabricados disponibles para asignarlos a esa venta.

- Al reservar para una nota de pedido: estado de asignación → RESERVADO
- Al facturar: estado de asignación → FACTURADO
- El número de heladera queda registrado en la factura

---

## Tipos de equipo

| Código | Descripción |
|--------|-------------|
| HELADERA | Heladera industrial o comercial |
| COOLBOX | Caja fría |
| EXHIBIDOR | Exhibidor refrigerado |
| OTRO | Otro tipo de equipo |

---

## Preguntas frecuentes

**¿Qué es el número de heladera?**
Es el identificador único de cada unidad física fabricada. Se puede generar automáticamente o asignar manualmente. Es el número que se usa para rastrear el equipo durante toda su vida útil.

**¿Puedo fabricar un equipo sin receta?**
Sí, el campo de receta es opcional. Podés crear un equipo directamente especificando tipo, modelo y demás datos.

**¿Qué significa "Sin color / Base"?**
Indica que el equipo no tiene terminación superficial definida. Es el estado "crudo" del equipo antes de la pintura o revestimiento.

**¿Cómo sé cuántos equipos tengo disponibles para vender?**
Usá el filtro de Estado de Asignación = DISPONIBLE en la lista de Equipos Fabricados, o consultá el dashboard de producción.

**¿Puedo cancelar una fabricación ya iniciada?**
Sí, cualquier equipo puede pasar al estado CANCELADO desde cualquier estado de fabricación.

**¿Qué pasa con el stock de materiales al fabricar?**
Los materiales definidos en la receta se descuentan del inventario al iniciar o completar la fabricación (según configuración del sistema).
