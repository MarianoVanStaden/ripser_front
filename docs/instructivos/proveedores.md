# Módulo de Proveedores — Instructivo de Usuario

## Descripción general

El módulo de Proveedores gestiona las relaciones comerciales con los proveedores de la empresa: alta y mantenimiento de proveedores, órdenes de compra, recepción de mercadería, distribución de stock y seguimiento de cuenta corriente.

---

## Pantallas disponibles

### 1. Gestión de Proveedores

Alta, edición y baja de proveedores.

**Acceso:** Menú Proveedores → Gestión Proveedores

**Acciones disponibles:**
- Crear nuevo proveedor
- Editar datos de un proveedor existente
- Activar / desactivar / bloquear proveedor
- Buscar por nombre, CUIT, ciudad o provincia
- Gestionar catálogo de productos del proveedor (con precio por proveedor)

**Campos principales:**
- Razón social
- CUIT
- Email, teléfono, dirección, ciudad, provincia, código postal
- Estado: ACTIVO, INACTIVO, BLOQUEADO

**Estados del proveedor:**
| Estado | Descripción |
|--------|-------------|
| ACTIVO | Operativo, se puede comprar |
| INACTIVO | Sin actividad, no se puede comprar |
| BLOQUEADO | Bloqueado por deuda u otro motivo |

**Catálogo de productos por proveedor:**
Desde la gestión del proveedor podés vincular los productos que ese proveedor provee, con su precio específico. Esto facilita la carga de órdenes de compra.

---

### 2. Compras / Pedidos

Gestión de órdenes de compra: creación, seguimiento y recepción de mercadería.

**Acciones disponibles:**
- Crear nueva orden de compra
- Editar orden en estado PENDIENTE
- Marcar orden como recibida (total o parcialmente)
- Distribuir stock recibido a múltiples depósitos
- Cancelar orden de compra
- Filtrar por proveedor, estado y rango de fechas
- Ver lista de órdenes pendientes de recepción

**Estados de la orden de compra:**
| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Orden creada, esperando entrega |
| RECIBIDA | Mercadería recibida en su totalidad |
| PARCIAL | Recibida parcialmente |
| CANCELADA | Cancelada antes de la entrega |
| RECHAZADA | Rechazada en la recepción |

**Campos principales al crear:**
- Proveedor
- Número de orden (automático o manual)
- Fecha de entrega estimada
- Ítems: producto, cantidad, costo unitario
  - Se pueden incluir productos temporales (sin código en sistema)
- Método de pago
- Observaciones

---

### 3. Recepción de Compras

Al recibir la mercadería de una orden de compra:

**Recepción total:**
- La orden pasa a estado RECIBIDA
- El stock se suma automáticamente

**Recepción parcial:**
- Indicás qué cantidades llegaron por ítem
- La orden queda en estado PARCIAL
- Podés recibir el resto en una operación posterior

**Distribución manual de stock:**
Después de recibir, podés distribuir las unidades recibidas entre diferentes depósitos (sucursales o almacenes) de forma manual.

---

### 4. Cuenta Corriente de Proveedores

Registro de las transacciones económicas con cada proveedor (deudas y pagos).

**Acciones disponibles:**
- Ver saldo actual por proveedor
- Consultar historial de movimientos (débitos y créditos)
- Registrar pagos a proveedores
- Filtrar por proveedor y período

**Tipos de movimiento:**
| Tipo | Descripción |
|------|-------------|
| DÉBITO | Deuda generada por una compra |
| CRÉDITO | Pago realizado al proveedor |

Cada movimiento está asociado a la compra o comprobante correspondiente.

---

### 5. Contactos / Condiciones

Registro de contactos realizados con cada proveedor y condiciones pactadas.

**Acciones disponibles:**
- Registrar un nuevo contacto (llamada, reunión, email, etc.)
- Registrar resultado del contacto y próximo seguimiento
- Consultar historial de contactos por proveedor

**Campos principales:**
- Fecha del contacto
- Tipo de contacto (llamada, visita, email, etc.)
- Descripción y resultado
- Fecha del próximo contacto
- Usuario responsable

---

### 6. Historial de Compras

Vista histórica y analítica de todas las compras realizadas.

**Contenido:**
- Listado de compras por período, proveedor o estado
- Tendencias de compra
- Comparativas de costos

---

### 7. Evaluación de Proveedores

Métricas de desempeño de cada proveedor.

**Indicadores evaluados:**
- Cumplimiento de plazos de entrega
- Calidad de la mercadería recibida
- Historial de recepciones parciales o rechazos
- Rating general del proveedor

---

## Flujo completo de una compra

```
1. Crear Orden de Compra
   └── Seleccionar proveedor, cargar ítems con cantidades y precios

2. Enviar pedido al proveedor
   └── (Fuera del sistema) El proveedor entrega la mercadería

3. Recibir mercadería
   └── Recepción total o parcial
   └── El stock se actualiza automáticamente

4. Distribuir stock (opcional)
   └── Asignar unidades recibidas a diferentes depósitos

5. Registrar pago al proveedor
   └── Se registra en Cuenta Corriente del proveedor

6. Cerrar orden
   └── Estado final: RECIBIDA
```

---

## Productos temporales en compras

Si en una compra llega un producto que aún no está dado de alta en el sistema, podés cargarlo como **producto temporal** con:
- Nombre
- Descripción
- Código provisional

Luego podés asociarlo al producto real cuando se dé de alta en el inventario.

---

## Preguntas frecuentes

**¿Puedo cargar una compra sin una orden de compra previa?**
Sí, el sistema permite registrar compras directamente.

**¿Qué pasa si llega menos mercadería de la pedida?**
Usás la opción de recepción parcial, indicando las cantidades reales recibidas. La orden queda en estado PARCIAL hasta completarse.

**¿Cómo distribuyo el stock recibido entre depósitos?**
Después de recepcionar, usás la función de distribución manual para asignar cantidades a cada depósito.

**¿El saldo de cuenta corriente se actualiza automáticamente?**
Sí. Al registrar una compra se genera un DÉBITO automático. Al registrar un pago se genera el CRÉDITO correspondiente.
