# Módulo de Préstamos — Instructivo de Usuario

## Descripción general

El módulo de Préstamos gestiona los créditos otorgados a clientes para la compra de equipos u otros productos a plazo. Permite registrar cuotas, seguir el estado de cada préstamo, controlar vencimientos y gestionar refinanciaciones.

---

## Pantallas disponibles

### 1. Resumen de Préstamos

Panel principal con indicadores globales del portfolio de créditos.

**Acceso:** Menú Préstamos → Resumen

**Contenido del panel:**
- Total de préstamos activos
- Monto total otorgado
- Monto cobrado acumulado
- Saldo pendiente total
- Préstamos por estado
- Cuotas vencidas (cantidad y monto)
- Cuotas próximas a vencer (7 días)

---

### 2. Listado de Préstamos

Lista completa de todos los préstamos con filtros.

**Acceso:** Menú Préstamos → Lista

**Acciones disponibles:**
- Buscar por cliente
- Filtrar por estado, tipo de financiación y categoría
- Ver detalle de cada préstamo
- Acceder a refinanciación

---

### 3. Detalle del Préstamo

Vista completa de un préstamo individual.

**Información disponible:**
- Datos del cliente
- Tipo de financiación y condiciones
- Tabla de cuotas con estado de cada una
- Historial de pagos
- Monto pagado vs. saldo pendiente
- Días de mora (si aplica)
- Observaciones

**Acciones disponibles:**
- Registrar pago de cuota
- Ver cuotas vencidas
- Refinanciar el préstamo

---

### 4. Refinanciación

Proceso para reestructurar un préstamo en mora o por solicitud del cliente.

**Acceso:** Desde el detalle del préstamo → Refinanciar

**Proceso:**
1. El sistema muestra el saldo pendiente y cuotas en mora
2. Se define el nuevo plan de pagos (cuotas, monto, fechas)
3. Las cuotas anteriores pasan a estado REFINANCIADA
4. Se genera un nuevo cronograma de pagos

---

## Tipos de financiación

| Tipo | Descripción |
|------|-------------|
| SEMANAL | Pagos semanales |
| QUINCENAL | Pagos cada quince días |
| MENSUAL | Pagos mensuales |
| PLAN_PP | Plan de pagos especial |
| CONTADO | Pago único diferido |
| CHEQUES | Pago con cheques a fecha |

---

## Estados del préstamo

| Estado | Descripción |
|--------|-------------|
| ACTIVO | En vigencia, pagándose normalmente |
| FINALIZADO | Cancelado en su totalidad |
| EN_MORA | Con cuotas vencidas sin pagar |
| EN_LEGAL | Derivado a gestión legal |
| CANCELADO | Dado de baja sin completar el pago |
| REFINANCIADO | Reestructurado con nuevo plan de pagos |

---

## Categorías de riesgo

| Categoría | Descripción |
|-----------|-------------|
| NORMAL | Al día o con leve atraso |
| PAGO_CON_MORA | Pagando pero con atraso |
| ALTO_RIESGO | Mora significativa |
| LEGALES | Derivado a instancia legal |

---

## Estados de cada cuota

| Estado | Descripción |
|--------|-------------|
| PENDIENTE | Aún no vencida |
| PAGADA | Cobrada en su totalidad |
| VENCIDA | Fecha superada sin pago |
| PARCIAL | Pagada parcialmente |
| REFINANCIADA | Incluida en un nuevo plan |

---

## Flujo de un préstamo

```
1. Otorgamiento del préstamo
   └── Se genera desde una venta con método de pago FINANCIAMIENTO
   └── O se crea manualmente en el módulo

2. Generación de cuotas
   └── El sistema calcula el cronograma según tipo y cantidad de cuotas

3. Cobro de cuotas
   └── Registrar pago al vencer cada cuota
   └── Puede ser pago total o parcial

4. Seguimiento de mora
   └── El sistema calcula automáticamente los días de vencimiento
   └── Si supera el umbral → pasa a EN_MORA

5. Gestión de mora
   └── Módulo de Cobranzas toma la gestión
   └── Puede refinanciarse o derivarse a instancia legal

6. Cierre
   └── Al pagar la última cuota → estado FINALIZADO
```

---

## Preguntas frecuentes

**¿Cómo se crea un préstamo?**
Se genera automáticamente cuando una venta utiliza el método de pago FINANCIAMIENTO y se configura la opción de financiamiento. También puede crearse manualmente desde el módulo.

**¿Qué pasa si el cliente paga una cuota después del vencimiento?**
El sistema registra el pago con la fecha real y calcula los días de mora. Si tenía otras cuotas pendientes, éstas pueden seguir activas.

**¿Qué diferencia hay entre CANCELADO y FINALIZADO?**
FINALIZADO significa que el cliente pagó todo. CANCELADO significa que el préstamo fue dado de baja (por devolución, acuerdo, etc.) sin completar el pago normal.

**¿Puedo refinanciar un préstamo que no está en mora?**
Sí, la refinanciación puede aplicarse a cualquier préstamo activo, no solo los que están en mora.
