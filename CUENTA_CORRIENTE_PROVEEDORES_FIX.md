# Cuenta Corriente Proveedores - Fix Documentation

## Issue Found
When creating a **Compra** (purchase), the backend is creating a **DEBITO** movement in the supplier's cuenta corriente, but it should be creating a **CREDITO** movement.

## Accounting Logic for Suppliers (Proveedores)

### Correct Accounting Rules:
1. **CREDITO** (Credit) = Purchase/Debt
   - When we buy from a supplier
   - **INCREASES** what we owe them
   - Formula impact: `saldo = totalCreditos - totalDebitos`
   - Positive saldo = we owe the supplier

2. **DEBITO** (Debit) = Payment  
   - When we pay the supplier
   - **DECREASES** what we owe them
   - Formula impact: subtracts from saldo
   - Negative saldo = supplier owes us (rare case)

### What Was Wrong:
- The saldo calculation formula was: `totalDebitos - totalCreditos` ❌
- This is backwards!
- Correct formula: `totalCreditos - totalDebitos` ✅

## Frontend Fixes Applied

### 1. Fixed Saldo Calculation (Line ~204)
```typescript
const getSaldoTotal = () => {
  // Positive balance = we owe the supplier
  const totalDebitos = movimientos
    .filter(m => m.tipo === 'DEBITO')
    .reduce((sum, m) => sum + (m.importe ?? 0), 0);
  
  const totalCreditos = movimientos
    .filter(m => m.tipo === 'CREDITO')
    .reduce((sum, m) => sum + (m.importe ?? 0), 0);
  
  return totalCreditos - totalDebitos; // ✅ FIXED
};
```

### 2. Fixed Card Colors & Labels (Line ~286)
```typescript
<Typography variant="h4" color={getSaldoTotal() > 0 ? 'error.main' : 'success.main'}>
  ${getSaldoTotal().toLocaleString()}
</Typography>
<Typography variant="caption" color="text.secondary">
  {getSaldoTotal() > 0 ? 'Deuda pendiente' : getSaldoTotal() < 0 ? 'A favor nuestro' : 'Sin deuda'}
</Typography>
```
- Positive saldo (red) = we owe them
- Negative saldo (green) = they owe us
- Zero = no debt

### 3. Fixed MenuItem Order (Line ~423)
Put CREDITO first (most common action = purchases):
```typescript
<MenuItem value="CREDITO">Crédito - Compra/Deuda (+)</MenuItem>
<MenuItem value="DEBITO">Débito - Pago al proveedor (-)</MenuItem>
```

## Backend Fix Required

### Location to Check:
Look for the service/controller that handles **Compra creation** and automatically creates a cuenta corriente movement.

### What to Fix:
When a `Compra` is created (or estado changes to `RECIBIDA`), the backend should:

```java
// WRONG ❌
CuentaCorrienteProveedor movimiento = new CuentaCorrienteProveedor();
movimiento.setTipo(TipoMovimiento.DEBITO); // ❌ WRONG!

// CORRECT ✅
CuentaCorrienteProveedor movimiento = new CuentaCorrienteProveedor();
movimiento.setTipo(TipoMovimiento.CREDITO); // ✅ Compra = CREDITO
movimiento.setImporte(compra.getTotal());
movimiento.setConcepto("Compra " + compra.getNumero());
movimiento.setCompraId(compra.getId());
```

### Files to Search in Backend:
- `CompraService.java`
- `CompraController.java`
- `CuentaCorrienteProveedorService.java`
- Any listener/event handler for Compra creation
- Search for: `TipoMovimiento.DEBITO` in compra-related code

### SQL Query to Fix Existing Data (if needed):
```sql
-- Find all movements linked to compras that are incorrectly marked as DEBITO
SELECT * FROM cuenta_corriente_proveedor 
WHERE compra_id IS NOT NULL 
AND tipo = 'DEBITO';

-- Fix them to CREDITO
UPDATE cuenta_corriente_proveedor 
SET tipo = 'CREDITO' 
WHERE compra_id IS NOT NULL 
AND tipo = 'DEBITO';

-- Recalculate saldos (you may need to write a script for this)
```

## Testing Steps

### 1. After Backend Fix:
1. Create a new purchase (Compra) for a supplier
2. Go to Cuenta Corriente Proveedores
3. Select that supplier
4. Verify the movement appears as **CREDITO**
5. Verify the saldo **increases** (positive, red = debt)

### 2. Test Payment:
1. Create a manual DEBITO movement (payment)
2. Verify the saldo **decreases**

### 3. Expected Flow:
```
Initial: Saldo = $0
Purchase $1000 (CREDITO) → Saldo = $1000 (we owe them)
Payment $300 (DEBITO) → Saldo = $700 (still owe them)
Payment $700 (DEBITO) → Saldo = $0 (paid off)
```

## Summary
- Frontend: ✅ Fixed saldo calculation and UI
- Backend: ⚠️ Needs fix to create CREDITO (not DEBITO) when Compra is created
- The accounting logic is now correct: purchases increase debt, payments decrease debt
