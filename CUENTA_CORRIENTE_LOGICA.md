# 📊 Lógica de Cuenta Corriente - Explicación

## 🎯 Resumen Rápido

### Para CLIENTES (lo que te deben)
- **DÉBITO (+)**: Cliente **debe** dinero → Aumenta saldo → Ejemplo: Venta
- **CRÉDITO (-)**: Cliente **paga** → Disminuye saldo → Ejemplo: Pago recibido
- **Fórmula**: `Saldo = Débitos - Créditos`

### Para PROVEEDORES (lo que tú debes)
- **DÉBITO (-)**: Tú **pagas** al proveedor → Disminuye saldo → Ejemplo: Pago realizado
- **CRÉDITO (+)**: Tú **debes** al proveedor → Aumenta saldo → Ejemplo: Compra
- **Fórmula**: `Saldo = Débitos - Créditos`

---

## 📚 Explicación Detallada

### Cuenta Corriente de CLIENTES

**Perspectiva**: Dinero que tus clientes te deben (Cuentas por Cobrar)

#### DÉBITO (Aumenta el saldo a favor tuyo)
- **Qué significa**: El cliente ahora te debe MÁS dinero
- **Ejemplos**:
  - ✅ Realizas una venta a crédito
  - ✅ Agregas intereses por mora
  - ✅ Cargos adicionales o recargos
  - ✅ Notas de débito

**Registro**: 
```
Cliente compra productos por $1,000
→ DÉBITO: +$1,000
→ Saldo del cliente: $1,000 (te debe)
```

#### CRÉDITO (Disminuye el saldo a favor tuyo)
- **Qué significa**: El cliente te debe MENOS dinero
- **Ejemplos**:
  - ✅ El cliente realiza un pago
  - ✅ Aplicación de descuentos
  - ✅ Devoluciones o bonificaciones
  - ✅ Notas de crédito

**Registro**:
```
Cliente paga $500
→ CRÉDITO: -$500
→ Saldo del cliente: $500 (te debe menos)
```

#### Ejemplo Completo - Clientes
```
Saldo Inicial: $0

1. Venta a crédito: $10,000
   → DÉBITO: +$10,000
   → Saldo: $10,000 (cliente te debe)

2. Cliente paga: $3,000
   → CRÉDITO: -$3,000
   → Saldo: $7,000 (cliente te debe)

3. Nueva venta: $2,000
   → DÉBITO: +$2,000
   → Saldo: $9,000 (cliente te debe)

4. Cliente paga: $9,000
   → CRÉDITO: -$9,000
   → Saldo: $0 (cuenta saldada)
```

**Cálculo del Saldo**:
```
Total Débitos:  $10,000 + $2,000 = $12,000
Total Créditos: $3,000 + $9,000 = $12,000
Saldo Actual:   $12,000 - $12,000 = $0
```

---

### Cuenta Corriente de PROVEEDORES

**Perspectiva**: Dinero que tú le debes a tus proveedores (Cuentas por Pagar)

#### CRÉDITO (Aumenta el saldo que debes)
- **Qué significa**: Ahora debes MÁS dinero al proveedor
- **Ejemplos**:
  - ✅ Realizas una compra a crédito
  - ✅ El proveedor agrega intereses
  - ✅ Cargos adicionales de flete
  - ✅ Notas de débito del proveedor (crédito para ti)

**Registro**:
```
Compras mercadería por $5,000
→ CRÉDITO: +$5,000
→ Saldo: $5,000 (le debes al proveedor)
```

#### DÉBITO (Disminuye el saldo que debes)
- **Qué significa**: Ahora debes MENOS dinero al proveedor
- **Ejemplos**:
  - ✅ Pagas al proveedor
  - ✅ Descuentos aplicados
  - ✅ Devoluciones al proveedor
  - ✅ Notas de crédito del proveedor (débito para ti)

**Registro**:
```
Pagas al proveedor $2,000
→ DÉBITO: -$2,000
→ Saldo: $3,000 (le debes menos)
```

#### Ejemplo Completo - Proveedores
```
Saldo Inicial: $0

1. Compra de mercadería: $15,000
   → CRÉDITO: +$15,000
   → Saldo: $15,000 (le debes al proveedor)

2. Pagas al proveedor: $5,000
   → DÉBITO: -$5,000
   → Saldo: $10,000 (le debes)

3. Nueva compra: $3,000
   → CRÉDITO: +$3,000
   → Saldo: $13,000 (le debes)

4. Pagas al proveedor: $13,000
   → DÉBITO: -$13,000
   → Saldo: $0 (cuenta saldada)
```

**Cálculo del Saldo**:
```
Total Créditos (compras): $15,000 + $3,000 = $18,000
Total Débitos (pagos):    $5,000 + $13,000 = $18,000
Saldo Actual:             $18,000 - $18,000 = $0
```

---

## ⚡ Fórmulas Rápidas

### Clientes (Cuentas por Cobrar)
```
Saldo = Total Débitos - Total Créditos
```
- **Saldo Positivo (+)**: El cliente te debe
- **Saldo Negativo (-)**: Tienes saldo a favor del cliente (poco común)

### Proveedores (Cuentas por Pagar)
```
Saldo = Total Débitos - Total Créditos
```
- **Saldo Positivo (+)**: El proveedor te debe (poco común - pagaste de más)
- **Saldo Negativo (-)**: Tú le debes al proveedor

---

## 🔍 Por Qué Esta Lógica?

Esta es la **lógica contable estándar** utilizada en todo el mundo:

### Principio de Partida Doble
Cada transacción tiene DOS lados:

**Ejemplo - Venta a Cliente**:
```
Tu libro contable:
  Débito:  Cuentas por Cobrar (Cliente) +$1,000
  Crédito: Ingresos por Ventas           +$1,000
```

**Ejemplo - Compra a Proveedor**:
```
Tu libro contable:
  Débito:  Inventario/Compras            +$1,000
  Crédito: Cuentas por Pagar (Proveedor) +$1,000
```

---

## 📱 En la Interfaz del Sistema

### Cuenta Corriente - Clientes
```
┌─────────────────────────────────────────┐
│ Nuevo Movimiento                        │
├─────────────────────────────────────────┤
│ Tipo de Movimiento:                     │
│ [▼] Débito - Cliente debe (+)           │
│     Crédito - Cliente paga (-)          │
│                                         │
│ ℹ️ Débito: Cliente debe (ej: venta)     │
│    Crédito: Cliente paga (ej: pago)     │
└─────────────────────────────────────────┘
```

### Cuenta Corriente - Proveedores
```
┌─────────────────────────────────────────┐
│ Nuevo Movimiento                        │
├─────────────────────────────────────────┤
│ Tipo de Movimiento:                     │
│ [▼] Débito - Pago al proveedor (-)      │
│     Crédito - Compra/Deuda (+)          │
│                                         │
│ ℹ️ Débito: Pago al proveedor (-)        │
│    Crédito: Compra/deuda (+)            │
└─────────────────────────────────────────┘
```

---

## ✅ Cambios Implementados

### En CuentaCorrientePage.tsx (Clientes)
1. **Cálculo de Saldo**: Ahora calcula desde movimientos en lugar de `selectedCliente?.saldoActual`
2. **Etiquetas Mejoradas**: 
   - "Débito - Cliente debe (+)"
   - "Crédito - Cliente paga (-)"
3. **Tooltip Explicativo**: Agrega contexto sobre qué significa cada tipo

### En CuentaCorrienteProveedoresPage.tsx (Proveedores)
1. **Cálculo de Saldo**: Calcula desde movimientos con la misma fórmula
2. **Etiquetas Mejoradas**:
   - "Débito - Pago al proveedor (-)"
   - "Crédito - Compra/Deuda (+)"
3. **Tooltip Explicativo**: Explica la perspectiva del proveedor

---

## 🎓 Notas Importantes

### La Fórmula es la Misma
```
Saldo = Total Débitos - Total Créditos
```

**Pero la INTERPRETACIÓN cambia**:

| Tipo Cuenta | Débito significa | Crédito significa | Saldo+ significa | Saldo- significa |
|-------------|------------------|-------------------|------------------|------------------|
| **Clientes** | Cliente debe más | Cliente paga | Te deben | Saldo a favor cliente |
| **Proveedores** | Tú pagas | Tú debes más | Te deben (pagaste de más) | Le debes |

### Integración Automática con Compras
Cuando se crea una Compra (en ComprasPedidosPage):
- Se crea automáticamente un movimiento **CRÉDITO** en Cuenta Corriente del Proveedor
- Aumenta el saldo que le debes al proveedor
- No necesitas crear el movimiento manualmente

### Integración Automática con Ventas
Cuando se crea una Venta:
- Se crea automáticamente un movimiento **DÉBITO** en Cuenta Corriente del Cliente
- Aumenta el saldo que el cliente te debe
- No necesitas crear el movimiento manualmente

---

## 🐛 Solución de Problemas

### "El saldo siempre muestra $0"
✅ **Solucionado**: Ahora calcula desde movimientos en lugar de depender del backend

### "Los símbolos (+/-) están confusos"
✅ **Solucionado**: Agregamos descripciones claras:
- Clientes: "Cliente debe (+)" / "Cliente paga (-)"
- Proveedores: "Pago al proveedor (-)" / "Compra/Deuda (+)"

### "No sé cuándo usar DÉBITO o CRÉDITO"
✅ **Solucionado**: Agregamos tooltip con ejemplos en cada formulario

---

**Última actualización**: Octubre 2025  
**Versión**: 2.0
