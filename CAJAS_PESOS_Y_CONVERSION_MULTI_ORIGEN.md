# Cajas en Pesos + Conversión multi-origen a USD

Feature end-to-end que reemplaza el flujo de conversión de amortizaciones basado en un "fondo teórico de pesos" por uno basado en **cajas en pesos reales** (efectivo, Mercado Pago, bancos, etc.) con saldo y ledger propios.

## Motivación

El flujo anterior `POST /api/cajas-ahorro/convertir-amortizacion` tomaba pesos de un fondo interno a la amortización — no de cajas reales. Resultado: los pesos "desaparecían" de los balances sin dejar trazabilidad en un saldo. El nuevo flujo modela las cajas en pesos como entidades de primera clase con saldo y movimientos auditables.

## Fases

### Fase 1 — Módulo CajasPesos

Nuevo módulo de administración de cajas en pesos, espejo estructural de `CajaAhorroDolares`.

**Rutas:**
- `/admin/cajas-pesos` — listado tipo grid de cards.
- `/admin/cajas-pesos/:id` — detalle + ledger paginado de movimientos.

**Operaciones desde la UI:**
- Alta / edición / desactivación de caja.
- Depósito (inicial o recurrente) y extracción.

**Tipos de movimiento (`TipoMovimientoCajaPesos`):** `DEPOSITO`, `EXTRACCION`, `AJUSTE`, `CONVERSION_AMORTIZACION`.

### Fase 2 — Conversión multi-origen pesos → USD

Rediseño del dialog **"Convertir amortización → USD"** en `/admin/cajas-ahorro`.

- El usuario selecciona amortización → define tipo de cambio → elige caja USD destino → agrega filas dinámicas de cajas pesos origen.
- UI muestra en vivo: `Disponible amortización`, `Total ingresado`, `Diferencia`, `USD a acreditar`.
- Submit bloqueado hasta que suma de orígenes == monto a convertir, sin errores por fila, TC válido, destino elegido.

Endpoint nuevo: `POST /api/admin/amortizaciones/{id}/convertir-usd`.

Soporta **conversiones parciales acumulativas**: el total acumulado de conversiones no puede superar `amortizacionMensual.montoAmortizadoPesos`.

## Archivos tocados / nuevos (frontend)

### Types + API
- `src/types/cajasPesos.types.ts` — **nuevo**. `CajaPesos`, `MovimientoCajaPesos`, `TipoMovimientoCajaPesos`, DTOs.
- `src/types/index.ts` — re-export del módulo nuevo.
- `src/types/amortizacion.types.ts` — agrega `ConvertirAmortizacionMultiDTO`, `OrigenConversionItemDTO`, `ConversionAmortizacionResponseDTO`, `OrigenEjecutadoPesosDTO`.
- `src/types/cajasAhorro.types.ts` — **remueve** `ConvertirAmortizacionDTO` (flujo viejo).
- `src/api/services/cajasPesosApi.ts` — **nuevo**. CRUD + depositar/extraer + getMovimientos.
- `src/api/services/cajasAhorroApi.ts` — **remueve** `convertirAmortizacion`.
- `src/api/services/amortizacionApi.ts` — agrega `convertirUsd(amortizacionId, dto)`.

### UI CajasPesos (nueva)
- `src/components/Admin/CajasPesos/CajasPesosListPage.tsx`
- `src/components/Admin/CajasPesos/CajaPesosMovimientosPage.tsx`
- `src/components/Admin/CajasPesos/dialogs/CajaPesosFormDialog.tsx`
- `src/components/Admin/CajasPesos/dialogs/DepositarPesosDialog.tsx`
- `src/components/Admin/CajasPesos/dialogs/ExtraerPesosDialog.tsx`
- `src/components/Admin/CajasPesos/index.ts`

### UI Conversión (rehecha)
- `src/components/Admin/CajasAhorro/dialogs/ConvertirAmortizacionDialog.tsx` — **reescrito** con filas dinámicas de cajas pesos origen.

### Wiring
- `src/App.tsx` — rutas `admin/cajas-pesos` y `admin/cajas-pesos/:id`.
- `src/components/Layout/Sidebar.tsx` — entrada "Cajas en Pesos" en el menú Administración.

## Cómo probarlo

1. Desplegar backend → Flyway aplica `V41_0_0` (cajas pesos) y `V41_1_0` (conversión multi-origen).
2. Ir a **Admin → Cajas en Pesos**.
3. Crear cajas representativas ("Caja efectivo", "Mercado Pago", "Banco Galicia") y depositar su saldo inicial.
4. Ir a **Admin → Cajas de Ahorro USD** y clickear **"Convertir amortización → USD"**.
5. Seleccionar período y amortización. En el paso 2 aparecen los selectores de cajas pesos origen.
6. Agregar filas (una por caja) hasta que la suma coincida con el monto disponible → confirmar.
7. Verificar:
   - Las cajas pesos origen bajan su saldo.
   - La caja USD destino sube en `montoPesosTotal / TC`.
   - En `/admin/cajas-pesos/:id` aparece un movimiento `Conversión → USD` por cada origen.
   - En la caja USD destino aparece un movimiento `Conversión amort.` con el monto en USD.

## Endpoints afectados

| Endpoint | Cambio |
|---|---|
| `POST /api/admin/amortizaciones/{id}/convertir-usd` | **Nuevo** — recibe `{montoPesosTotal, tipoCambio, destinoCajaUsdId, origenes[], descripcion}`. |
| `GET /api/cajas-pesos` etc. | **Nuevos** — CRUD de cajas pesos + ledger. |
| `POST /api/cajas-ahorro/convertir-amortizacion` | **Eliminado** — era el flujo viejo con origen "fondo teórico". |

## Notas de diseño

- **Concurrencia**: conversión usa `PESSIMISTIC_WRITE` sobre la amortización, todas las cajas pesos origen (ordenadas por id) y la caja USD destino. Orden determinístico evita deadlocks.
- **BigDecimal** escala 2, `HALF_UP` en todos los cálculos monetarios.
- **Continuidad de reportes**: el backend sigue generando un `MovimientoExtra` DEBITO por origen (además del movimiento en la caja pesos) para que los reportes existentes de flujo de caja no cambien.
- **Tenant**: validado explícitamente en el service además del filtro de Hibernate.
- **Overdraft permitido**: las cajas (USD y pesos) funcionan como cuentas corrientes — pueden quedar en saldo negativo (deuda) tras extracciones, conversiones o ejecuciones. No hay validación de "saldo suficiente" ni en backend ni en frontend. La UI colorea saldos negativos en rojo y el total acumulado en "Reservas en USD" muestra "(en deuda)" cuando es negativo.
- **No hay "EjecutarAmortizacion"** acá: existe un endpoint `/{id}/ejecutar` separado (N cajas USD → 1 caja USD) para otro flujo distinto que no toca este cambio.
