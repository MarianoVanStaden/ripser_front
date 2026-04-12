# Módulo de Ventas — Instructivo de Usuario

## Descripción general

El módulo de Ventas gestiona todo el ciclo comercial: desde la elaboración de un presupuesto hasta la facturación final y el cobro. Incluye herramientas para configurar financiamiento, gestionar cheques y consultar informes.

---

## Pantallas disponibles

### 1. Dashboard de Ventas
Panel principal con indicadores clave (KPIs): ventas del período, ingresos, documentos pendientes y métricas de rendimiento comercial.

**Acceso:** Menú Ventas → Dashboard de Ventas

---

### 2. Presupuestos

Permite crear y gestionar cotizaciones para clientes o leads.

**Acciones disponibles:**
- Crear nuevo presupuesto (cliente existente o lead)
- Editar presupuesto en estado PENDIENTE
- Aprobar o rechazar presupuesto
- Convertir presupuesto aprobado en Nota de Pedido
- Generar PDF del presupuesto
- Filtrar por estado, cliente y rango de fechas

**Estados posibles:**
| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Recién creado, sin confirmar |
| APROBADO | Aprobado internamente |
| CONFIRMADA | Confirmado por el cliente |
| FACTURADA | Ya tiene factura asociada |
| VENCIDA | Superó la fecha de vencimiento |
| RECHAZADO | Rechazado por cliente o internamente |

**Campos principales al crear:**
- Cliente o lead
- Fecha de emisión y vencimiento
- Método de pago
- Ítems: productos del stock o equipos fabricados (con modelo, medida y color)
- Opciones de financiamiento (si aplica)
- Observaciones

---

### 3. Notas de Pedido

Órdenes de venta confirmadas, generalmente originadas desde un presupuesto aprobado.

**Acciones disponibles:**
- Crear nota de pedido directamente
- Convertir desde un presupuesto aprobado
- Asignar equipos fabricados disponibles a los ítems de tipo EQUIPO
- Reservar equipos para la nota (estado: RESERVADO)
- Confirmar deuda del cliente antes de facturar
- Convertir nota de pedido en Factura
- Generar PDF

**Flujo típico:**
```
Presupuesto APROBADO → Nota de Pedido → Factura
```

---

### 4. Facturación

Gestión de facturas de venta. Las facturas se generan a partir de Notas de Pedido.

**Acciones disponibles:**
- Generar factura desde nota de pedido
- Asignar números de heladera/equipo a los ítems de tipo EQUIPO
- Verificar límite de crédito del cliente antes de confirmar
- Registrar método de pago y condiciones de financiamiento
- Consultar historial de facturas por cliente, fecha o estado

**Importante:**
- Al facturar ítems tipo EQUIPO, se deben asignar los equipos fabricados disponibles (por número de heladera)
- El sistema valida el saldo en cuenta corriente del cliente
- Si el cliente tiene deuda, se muestra una confirmación antes de continuar

---

### 5. Notas de Crédito

Documentos que registran devoluciones o ajustes sobre facturas ya emitidas.

**Acciones disponibles:**
- Generar nota de crédito a partir de una factura existente
- Indicar motivo y monto
- Consultar historial de notas de crédito

---

### 6. Registro de Ventas

Vista consolidada de todas las ventas registradas en el sistema.

**Acciones disponibles:**
- Consultar ventas por período
- Filtrar por cliente, empleado, método de pago y estado
- Ver detalle de cada venta (ítems, totales, asignaciones)

---

### 7. Informes

Reportes y análisis de ventas.

**Contenido:**
- Ventas por período (diario, semanal, mensual)
- Ventas por cliente o empleado
- Comparativas y tendencias

---

### 8. Cheques

Gestión de cheques recibidos como medio de pago.

**Acciones disponibles:**
- Registrar cheque recibido
- Seguimiento del estado del cheque (pendiente, acreditado, rechazado)
- Asociar cheque a una venta

---

### 9. Opciones de Financiamiento

Configuración y selección de planes de pago para los documentos de venta.

**Acciones disponibles:**
- Crear opciones de financiamiento (cuotas, interés, porcentaje de entrega)
- Asignar opciones a presupuestos o notas de pedido
- Configurar financiamiento propio o refinanciado

**Campos principales:**
- Cantidad de cuotas
- Tasa de interés
- Porcentaje de anticipo/entrega
- Tipo: financiación propia o refinanciada

---

## Flujo completo de una venta

```
1. Crear Presupuesto
   └── Cargar cliente/lead, ítems (productos o equipos), condiciones de pago

2. Aprobar Presupuesto
   └── Revisión interna → estado APROBADO

3. Convertir a Nota de Pedido
   └── El cliente confirma → se genera la Nota de Pedido

4. Asignar Equipos (si hay ítems de tipo EQUIPO)
   └── Seleccionar equipos fabricados disponibles (por número de heladera)

5. Validar Deuda del Cliente
   └── El sistema verifica saldo en cuenta corriente

6. Convertir a Factura
   └── Se genera la factura final con equipos asignados

7. Cobro
   └── Registrar pago (efectivo, transferencia, cheque, financiamiento, etc.)
```

---

## Métodos de pago disponibles

- Efectivo
- Tarjeta de crédito
- Tarjeta de débito
- Transferencia bancaria
- Cheque
- Financiamiento
- Cuenta corriente

---

## Ítems en documentos: PRODUCTO vs EQUIPO

| Tipo | Descripción |
|------|-------------|
| PRODUCTO | Artículo del inventario general (con stock) |
| EQUIPO | Unidad fabricada (heladera, coolbox, exhibidor) con número propio |

Para ítems tipo EQUIPO, al facturar se deben asignar los números de heladera de las unidades fabricadas disponibles.

---

## Preguntas frecuentes

**¿Puedo crear una factura sin pasar por presupuesto?**
Sí, se puede crear una Nota de Pedido directamente y luego generar la factura desde allí.

**¿Qué pasa si el cliente tiene deuda?**
El sistema muestra una advertencia. Podés confirmar igualmente o detener la operación para regularizar primero.

**¿Cómo se generan PDFs?**
Desde la vista de Presupuestos o Notas de Pedido, usando el botón de descarga/impresión en cada documento.

**¿Puedo editar una factura ya emitida?**
No. Para ajustes posteriores a la factura se usa una Nota de Crédito.
