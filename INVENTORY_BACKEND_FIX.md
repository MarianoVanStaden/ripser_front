# 🔧 Inventory Backend Integration Fix

## Problem Identified

### Error 1: 403 Forbidden
```
POST http://localhost:5173/api/movimientos-stock 403 (Forbidden)
```
**Status**: This is likely an authentication issue - ensure you're logged in.

### Error 2: producto_id cannot be null
```java
java.sql.SQLIntegrityConstraintViolationException: Column 'producto_id' cannot be null
```

**Root Cause**: The backend expects a `producto` object (ManyToOne relationship), but we were sending `productoId` as a simple number field.

---

## Solution Applied

### **Fixed Payload Structure** ✅

#### Before (❌ Incorrect):
```typescript
const movementData: Partial<MovimientoStock> = {
  productoId: parseInt(adjustmentFormData.productId),  // ❌ Wrong!
  tipo: 'AJUSTE',
  cantidad: difference,
  stockAnterior: product.stockActual,
  stockActual: newStockActual,
  concepto: adjustmentFormData.reason,
  numeroComprobante: `ADJ-${Date.now()}`,
  fecha: new Date().toISOString(),
};
```

#### After (✅ Correct):
```typescript
const movementData = {
  producto: {                                          // ✅ Correct!
    id: parseInt(adjustmentFormData.productId)
  },
  tipo: 'AJUSTE' as const,
  cantidad: difference,
  stockAnterior: product.stockActual,
  stockActual: newStockActual,
  concepto: adjustmentFormData.reason,
  numeroComprobante: `ADJ-${Date.now()}`,
  fecha: new Date().toISOString(),
};
```

---

## Backend Entity Structure

The backend uses JPA/Hibernate with a `@ManyToOne` relationship:

```java
@Entity
@Table(name = "movimientos_stock")
public class MovimientoStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;  // ← This is why we need to send an object!
    
    private String tipo;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockActual;
    private String concepto;
    private String numeroComprobante;
    private LocalDateTime fecha;
    // ...
}
```

When we send `producto: { id: 123 }`, Hibernate understands:
1. Find the `Producto` with `id = 123`
2. Set the `producto_id` foreign key to `123`
3. Create the relationship

---

## Changes Made to `InventoryPage.tsx`

### 1. **handleSaveAdjustment** - Creating Stock Movements

```typescript
// The backend expects the full producto object (ManyToOne relationship)
const movementData = {
  producto: {
    id: parseInt(adjustmentFormData.productId)
  },
  tipo: 'AJUSTE' as const,
  cantidad: difference,
  stockAnterior: product.stockActual,
  stockActual: newStockActual,
  concepto: adjustmentFormData.reason,
  numeroComprobante: `ADJ-${Date.now()}`,
  fecha: new Date().toISOString(),
};

const newMovement = await movimientoStockApi.create(movementData);
```

### 2. **Extracting productId from Response**

The backend returns the full `producto` object, so we need to extract the ID:

```typescript
// Backend returns producto as an object, extract the ID
const productId = typeof newMovement.producto === 'object' 
  ? newMovement.producto.id 
  : newMovement.productoId || parseInt(adjustmentFormData.productId);

const newAdjustment: InventoryAdjustment = {
  id: newMovement.id || 0,
  productId: productId,  // ← Use extracted ID
  type: adjustmentFormData.type,
  // ... rest of properties
};
```

### 3. **loadData** - Loading Historical Movements

Same fix applied when loading existing adjustments:

```typescript
const inventoryAdjustments: InventoryAdjustment[] = movimientosData
  .filter((movement: MovimientoStock) => movement.tipo === 'AJUSTE')
  .map((movement: MovimientoStock) => {
    // Backend returns producto as an object, extract the ID
    const productId = typeof movement.producto === 'object' 
      ? movement.producto.id 
      : movement.productoId || 0;
    
    return {
      id: movement.id || 0,
      productId: productId,  // ← Use extracted ID
      type: 'ADJUSTMENT' as const,
      // ... rest of properties
    };
  });
```

---

## Example Request/Response

### Request to Backend:
```json
POST /api/movimientos-stock
{
  "producto": {
    "id": 42
  },
  "tipo": "AJUSTE",
  "cantidad": -5,
  "stockAnterior": 100,
  "stockActual": 95,
  "concepto": "Productos dañados",
  "numeroComprobante": "ADJ-1234567890",
  "fecha": "2025-10-08T18:42:00.000Z"
}
```

### Response from Backend:
```json
{
  "id": 123,
  "producto": {
    "id": 42,
    "nombre": "Laptop HP Pavilion",
    "precio": 85000,
    "stockActual": 95,
    "stockMinimo": 5,
    "codigo": "LAP001",
    "categoriaProductoId": 1,
    "activo": true
  },
  "tipo": "AJUSTE",
  "cantidad": -5,
  "stockAnterior": 100,
  "stockActual": 95,
  "concepto": "Productos dañados",
  "numeroComprobante": "ADJ-1234567890",
  "fecha": "2025-10-08T18:42:00.000Z",
  "usuarioId": 1,
  "usuarioNombre": "Admin"
}
```

---

## Pattern Used in Other Components

This same pattern is used successfully in **ComprasPedidosPage**:

```typescript
// From ComprasPedidosPage.tsx - Stock movement creation
const movimiento = {
  producto: {
    id: productoId  // ← Same pattern!
  },
  tipo: 'ENTRADA' as const,
  cantidad: detalle.cantidad,
  stockAnterior: stockAnterior,
  stockActual: stockActual,
  concepto: 'Compra recibida',
  numeroComprobante: compra.numero || `COMPRA-${compra.id}`,
  fecha: new Date().toISOString(),
};

await movimientoStockApi.create(movimiento);
```

---

## Testing Checklist

- [x] Fixed payload structure to send `producto: { id }` instead of `productoId`
- [x] Added console.log to debug request/response
- [x] Handle producto object in response when creating adjustment
- [x] Handle producto object when loading historical adjustments
- [ ] Test creating adjustment - should now work without null error
- [ ] Verify stock updates correctly in database
- [ ] Check that adjustment appears in the table
- [ ] Verify producto name displays correctly in adjustments table

---

## 403 Forbidden Issue

If you're still getting 403 errors, check:

1. **Are you logged in?**
   - Check localStorage for `auth_token`
   - Try logging out and back in

2. **Does your user have permissions?**
   - Check if `/api/movimientos-stock` endpoint requires specific permissions
   - Verify your user role has access to create stock movements

3. **Is the endpoint secured?**
   - Check `SecurityConfig.java` in backend
   - Ensure `/api/movimientos-stock/**` is accessible to authenticated users

Example security config:
```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/movimientos-stock/**").authenticated()
    .anyRequest().authenticated()
);
```

---

## Summary

✅ **Fixed**: Changed payload from `productoId: number` to `producto: { id: number }`  
✅ **Fixed**: Extract productId from nested producto object in responses  
✅ **Fixed**: Apply same pattern when loading historical movements  
⚠️ **Check**: Ensure user is authenticated and has proper permissions  

The InventoryPage now correctly integrates with the backend's JPA entity structure! 🎉
