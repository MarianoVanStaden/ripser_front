# Módulo de Logística — Instructivo de Usuario

## Descripción general

El módulo de Logística gestiona el inventario de productos (por depósito), los movimientos de stock, las transferencias entre depósitos, las entregas a clientes y el transporte. Incluye también herramientas de auditoría y reconciliación de inventario.

---

## Estructura del módulo

El módulo está dividido en cuatro secciones principales:

| Sección | Qué gestiona |
|---------|-------------|
| **Inventario** | Stock de productos, equipos y recuentos |
| **Distribución / Transporte** | Viajes, entregas de productos y equipos |
| **Movimientos** | Transferencias entre depósitos, auditoría |
| **Configuración** | Alta y gestión de depósitos |

---

## SECCIÓN: INVENTARIO

### 1. Stock de Productos

Vista del stock disponible de todos los productos del catálogo.

**Acceso:** Menú Logística → Stock

**Acciones disponibles:**
- Ver stock actual por producto
- Consultar mínimos y alertas de reposición
- Filtrar por categoría, depósito o producto
- Ver historial de movimientos de un producto

---

### 2. Inventario por Depósito

Vista del stock desagregado por depósito/almacén.

**Acceso:** Menú Logística → Inventario → Depósitos

**Acciones disponibles:**
- Seleccionar un depósito y ver su stock completo
- Comparar stock entre depósitos
- Ver productos en cero o bajo mínimo
- Exportar inventario del depósito

---

### 3. Stock de Equipos Fabricados

Vista del inventario de equipos físicos (heladeras, coolboxes, etc.) por depósito.

**Acceso:** Menú Logística → Inventario → Stock Equipos

**Acciones disponibles:**
- Ver equipos disponibles por tipo y depósito
- Filtrar por modelo, color, medida y estado de asignación
- Ver el número de heladera de cada unidad

---

### 4. Ubicaciones de Equipos

Localización exacta de cada equipo dentro de un depósito.

**Acceso:** Menú Logística → Inventario → Ubicaciones

**Acciones disponibles:**
- Ver en qué depósito, sección, estante y posición está cada equipo
- Actualizar la ubicación física de un equipo
- Buscar un equipo por número de heladera

**Campos de ubicación:**
- Depósito
- Sección
- Estante
- Posición

---

### 5. Recuentos de Inventario

Herramienta para realizar recuentos físicos periódicos y detectar diferencias con el stock del sistema.

**Acceso:** Menú Logística → Inventario → Recuentos

**Acciones disponibles:**
- Crear nueva tarea de recuento
- Cargar cantidades contadas físicamente
- Ver diferencias vs. stock del sistema
- Aprobar o rechazar el recuento

---

### 6. Reconciliación de Stock

Proceso formal para corregir las diferencias detectadas en un recuento.

**Acceso:** Menú Logística → Inventario → Reconciliación

**Acciones disponibles:**
- Ver diferencias pendientes de reconciliación
- Aprobar ajustes de stock (positivos o negativos)
- Registrar motivo de cada ajuste
- Ver historial de reconciliaciones

---

## SECCIÓN: DISTRIBUCIÓN Y TRANSPORTE

### 7. Viajes (Planificación de rutas)

Gestión de los viajes de reparto: planificación, asignación de conductor y vehículo, y seguimiento.

**Acceso:** Menú Transporte → Viajes

**Acciones disponibles:**
- Planificar nuevo viaje
- Asignar conductor y vehículo
- Agregar entregas al viaje
- Iniciar / completar / cancelar viaje
- Ver historial de viajes

**Estados del viaje:**
| Estado | Descripción |
|--------|-------------|
| PLANIFICADO | Armado, pendiente de salida |
| EN_CURSO | El vehículo está en ruta |
| COMPLETADO | Viaje finalizado |
| CANCELADO | Cancelado antes de salir |

**Campos principales:**
- Número de viaje
- Fecha del viaje
- Destino
- Conductor asignado
- Vehículo asignado
- Entregas incluidas
- Observaciones

---

### 8. Entregas de Productos

Gestión de la entrega de productos (del catálogo de inventario) a clientes.

**Acceso:** Menú Transporte → Entregas de Productos

**Acciones disponibles:**
- Crear nueva entrega asociada a un pedido/venta
- Confirmar entrega con firma del receptor
- Ver historial de entregas
- Filtrar por estado, cliente y fecha

**Estados de entrega:**
| Estado | Descripción |
|--------|-------------|
| SCHEDULED | Programada para una fecha |
| IN_TRANSIT | En camino (el viaje salió) |
| DELIVERED | Entregada y confirmada |
| FAILED | Intento fallido de entrega |
| CANCELLED | Cancelada |

---

### 9. Entregas de Equipos

Gestión específica de la entrega de equipos fabricados (heladeras, coolboxes, etc.).

**Acceso:** Menú Transporte → Entregas de Equipos

**Acciones disponibles:**
- Registrar entrega de equipo al cliente
- Confirmar entrega con nombre y DNI del receptor
- Ver equipos pendientes de entrega
- Ver historial de entregas por equipo o cliente

Al confirmar la entrega:
- El equipo pasa al estado de asignación: **ENTREGADO**
- Se registra nombre del receptor, DNI y fecha

---

### 10. Incidencias de Vehículos

Registro de incidentes o problemas de los vehículos de la flota.

**Acceso:** Menú Transporte → Incidencias de Vehículos

**Acciones disponibles:**
- Registrar nueva incidencia para un vehículo
- Ver historial de incidencias por vehículo
- Gestionar el estado de cada incidencia (abierta / cerrada)

---

## SECCIÓN: MOVIMIENTOS

### 11. Transferencias entre Depósitos

Movimiento de mercadería o equipos de un depósito a otro.

**Acceso:** Menú Logística → Movimientos → Transferencias

**Acciones disponibles:**
- Crear nueva transferencia
- Indicar producto/equipo, cantidad, origen y destino
- Ver transferencias pendientes y completadas
- Aprobar la recepción en el depósito destino

**Campos:**
- Depósito origen y destino
- Producto o equipo
- Cantidad
- Motivo de la transferencia
- Estado (pendiente / completada)

---

### 12. Auditoría

Registro histórico de todos los movimientos de stock para trazabilidad.

**Acceso:** Menú Logística → Movimientos → Auditoría

**Contenido:**
- Historial completo de entradas, salidas, transferencias y ajustes
- Filtrar por producto, depósito, tipo de movimiento y fecha
- Trazabilidad completa de cada unidad

---

## SECCIÓN: CONFIGURACIÓN

### 13. Depósitos / Almacenes

Alta y configuración de los depósitos (almacenes o sucursales con stock).

**Acceso:** Menú Logística → Configuración → Depósitos

**Acciones disponibles:**
- Crear nuevo depósito
- Editar nombre, dirección y descripción
- Activar / desactivar depósito
- Definir si es el depósito principal

**Campos:**
- Código (identificador corto)
- Nombre
- Dirección
- Sucursal asociada
- Es depósito principal (sí/no)
- Estado: activo / inactivo

---

## Flujo de una entrega de equipo

```
1. Se factura el equipo en Ventas
   └── El equipo pasa a estado FACTURADO

2. Se planifica el viaje
   └── Se crea el viaje con conductor y vehículo
   └── Se agregan las entregas del día

3. Salida del vehículo
   └── Estado del viaje: EN_CURSO
   └── Estado del equipo: EN_TRANSITO

4. Confirmación de entrega
   └── Se registra receptor (nombre y DNI)
   └── Estado del equipo: ENTREGADO
   └── Estado del viaje: COMPLETADO (cuando finalizan todas las entregas)
```

---

## Preguntas frecuentes

**¿Qué diferencia hay entre "Entregas de Productos" y "Entregas de Equipos"?**
Entregas de Productos son para artículos de inventario general (remeras, accesorios, etc.). Entregas de Equipos son para las unidades físicas fabricadas (heladeras, coolboxes) que tienen número propio.

**¿Puedo transferir stock entre depósitos sin un viaje?**
Sí. Las transferencias internas entre depósitos se gestionan desde Movimientos → Transferencias, sin necesidad de crear un viaje.

**¿Cómo corrijo un error en el stock?**
Usá el flujo de Recuento → Reconciliación para corregir diferencias de forma trazable y auditada.

**¿Puedo saber dónde está físicamente un equipo dentro del depósito?**
Sí. Desde Inventario → Ubicaciones podés consultar y actualizar la ubicación exacta (depósito, sección, estante, posición).
