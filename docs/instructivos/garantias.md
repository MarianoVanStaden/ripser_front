# Módulo de Garantías — Instructivo de Usuario

## Descripción general

El módulo de Garantías gestiona las garantías otorgadas sobre los productos y equipos vendidos. Permite registrar garantías activas, gestionar reclamos de los clientes y generar reportes sobre el costo y estado de las garantías.

---

## Pantallas disponibles

### 1. Registro de Garantías

Lista y administración de todas las garantías emitidas.

**Acceso:** Menú Garantías → Registro de Garantías

**Acciones disponibles:**
- Crear nueva garantía manualmente
- Ver listado de garantías (activas, vencidas, etc.)
- Buscar garantía por cliente, producto o número
- Acceder al detalle de cada garantía
- Anular garantía con motivo

---

### 2. Seguimiento de Reclamos

Gestión de los reclamos presentados bajo garantía.

**Acceso:** Menú Garantías → Seguimiento Reclamos

**Acciones disponibles:**
- Registrar nuevo reclamo de garantía
- Seguir el estado de reclamos en curso
- Registrar la resolución del reclamo
- Filtrar por estado, tipo de solución y fecha

---

### 3. Reporte de Garantías

Informe de métricas y estadísticas sobre garantías y reclamos.

**Acceso:** Menú Garantías → Reporte

**Contenido:**
- Cantidad de garantías activas / vencidas / anuladas
- Cantidad de reclamos por estado
- Costo acumulado de garantías (reparaciones, reemplazos)
- Distribución por tipo de solución

---

## Tipos de garantía

| Tipo | Descripción |
|------|-------------|
| MANUFACTURER | Garantía de fábrica del fabricante |
| EXTENDED | Garantía extendida contratada por el cliente |
| SERVICE | Garantía de servicio técnico |

---

## Estados de una garantía

| Estado | Descripción |
|--------|-------------|
| ACTIVE | Vigente, dentro del período |
| EXPIRED | Vencida por fecha |
| VOIDED | Anulada manualmente |
| CLAIMED | Con reclamo activo |

---

## Datos de una garantía

**Campos principales:**
- Número de garantía (identificador único)
- Cliente y venta asociada
- Producto cubierto
- Tipo de garantía
- Fecha de inicio y fecha de vencimiento
- Descripción de la cobertura
- Condición de IVA: IVA 21%, IVA 10.5%, Exento

---

## Reclamos de garantía

Cuando un cliente presenta un problema con un producto cubierto:

### Registrar un reclamo

**Campos:**
- Número de reclamo (automático)
- Garantía asociada
- Fecha del reclamo
- Descripción del problema
- Estado del reclamo
- Empleado responsable

**Tipos de solución:**
| Solución | Descripción |
|----------|-------------|
| REPAIR | Reparación del producto |
| REPLACEMENT | Reemplazo por unidad nueva |
| REFUND | Devolución de dinero |
| REMOTE_SUPPORT | Asistencia técnica remota |

### Estados del reclamo

| Estado | Descripción |
|--------|-------------|
| PENDING | Reclamo recibido, sin evaluar |
| IN_PROGRESS | En proceso de resolución |
| RESOLVED | Resuelto |
| REJECTED | Rechazado (fuera de cobertura u otro motivo) |

---

## Flujo de un reclamo de garantía

```
1. Cliente reporta el problema
   └── Se verifica que la garantía esté vigente y cubra el caso

2. Apertura del reclamo
   └── Se crea el reclamo → estado: PENDING
   └── Se asigna empleado responsable

3. Evaluación y resolución
   └── Se determina el tipo de solución
   └── Estado → IN_PROGRESS

4. Cierre del reclamo
   └── Se registra la solución aplicada y fecha
   └── Estado → RESOLVED o REJECTED
   └── Se registra el costo incurrido

5. Actualización de la garantía
   └── Si el reclamo fue aceptado → garantía en estado CLAIMED
   └── Si se reemplazó el producto, puede generarse una nueva garantía
```

---

## Preguntas frecuentes

**¿Se generan garantías automáticamente al vender?**
Las garantías pueden asociarse a ventas. Dependiendo del producto, pueden emitirse automáticamente o de forma manual.

**¿Un cliente puede tener más de un reclamo sobre la misma garantía?**
Sí, siempre que la garantía esté vigente.

**¿Cómo sé si una garantía está por vencer?**
El reporte muestra las garantías próximas a vencer. También podés filtrar por fecha en el listado.

**¿Qué pasa si el reclamo es rechazado?**
Se registra el motivo del rechazo en la resolución del reclamo. La garantía permanece en estado ACTIVE (no se consume).
