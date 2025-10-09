# 📸 Inventory Recount - User Guide

## 🎯 What is Inventory Recount?

**Inventory Recount** (Recuento de Inventario) is a physical verification process where warehouse staff count actual stock to ensure it matches the system records. When differences are found, the system automatically adjusts the inventory.

---

## 🚀 How to Use

### Step 1: Initiate a Recount

1. Navigate to **Logística → Inventario** (Inventory page)
2. Click the **"Iniciar Recuento"** button
3. In the dialog:
   - **Select Category** (optional): Choose a specific category or leave blank for all products
   - **Notes** (optional): Add any relevant notes (e.g., "Annual recount Q4 2024")
4. Click **"Iniciar"**

**What happens:**
- System creates recount tasks for all products in the selected category
- Each task stores the current system stock as "expected quantity"
- Success message shows total products to count

**Example Success Message:**
```
✅ Recuento iniciado exitosamente

• Total de productos: 127
• Categoría: Toda la bodega
• Fecha: 08/12/2024 14:30

Los movimientos de recuento han sido creados.
Dirígete a la página de "Tareas de Recuento" para completar el conteo físico.
```

---

### Step 2: Complete Recount Tasks

1. Navigate to **Logística → Tareas de Recuento**
2. You'll see a table with all pending recount tasks:
   - **SKU**: Product code
   - **Producto**: Product name
   - **Stock Esperado**: What the system thinks is in stock
   - **Notas**: Recount notes
   - **Comprobante**: Document number (e.g., REC-20241208143000)
   - **Acciones**: "Contar" button

3. Click **"Contar"** for a product
4. In the dialog:
   - See product details and expected stock
   - Enter the **physical count** (what you actually found)
   - System shows if there's a difference
5. Click **"Completar Recuento"**

**What happens:**
- System updates the product's stock to the physical count
- If there's a difference, an automatic adjustment is created
- Task is removed from pending list

---

## 🎨 Visual Examples

### Scenario 1: Stock Matches ✅

**System Expected:** 50 units  
**Physical Count:** 50 units  
**Difference:** 0

**Result:**
```
✅ La cantidad coincide con el stock esperado
```

No adjustment needed. Stock remains 50.

---

### Scenario 2: Stock Shortage ⚠️

**System Expected:** 50 units  
**Physical Count:** 45 units  
**Difference:** -5 units

**Result:**
```
⚠️ Diferencia detectada: -5 unidades

Se creará automáticamente un ajuste de inventario.
```

**What happens:**
- Product stock updated to 45
- Automatic adjustment movement created:
  - Tipo: AJUSTE
  - Cantidad: -5
  - Concepto: "Ajuste automático por recuento: REC-20241208143000"

---

### Scenario 3: Stock Surplus ⚠️

**System Expected:** 50 units  
**Physical Count:** 57 units  
**Difference:** +7 units

**Result:**
```
⚠️ Diferencia detectada: +7 unidades

Se creará automáticamente un ajuste de inventario.
```

**What happens:**
- Product stock updated to 57
- Automatic adjustment movement created:
  - Tipo: AJUSTE
  - Cantidad: +7
  - Concepto: "Ajuste automático por recuento: REC-20241208143000"

---

## 📊 Understanding the Recount Process

```
┌─────────────────────────────────────────┐
│  1. INITIATE RECOUNT                    │
│  (Inventory Page)                       │
│                                         │
│  Select category → Add notes → Start   │
└──────────────┬──────────────────────────┘
               │
               │ Backend creates tasks
               │ tipo = RECUENTO
               │ stockActual = null (pending)
               ▼
┌─────────────────────────────────────────┐
│  2. PENDING TASKS                       │
│  (Recount Tasks Page)                   │
│                                         │
│  Product A: Expected 50 → Count: ___   │
│  Product B: Expected 30 → Count: ___   │
│  Product C: Expected 75 → Count: ___   │
└──────────────┬──────────────────────────┘
               │
               │ Staff counts physically
               │ Enters actual quantity
               ▼
┌─────────────────────────────────────────┐
│  3. COMPLETE TASK                       │
│                                         │
│  Expected: 50                           │
│  Counted: 45                            │
│  Difference: -5                         │
└──────────────┬──────────────────────────┘
               │
               │ Backend processing
               ▼
┌─────────────────────────────────────────┐
│  4. AUTOMATIC ADJUSTMENT                │
│                                         │
│  • Update Producto.stockActual = 45    │
│  • Update MovimientoStock.stockActual  │
│  • Create AJUSTE movement if diff ≠ 0 │
│  • Remove from pending tasks           │
└─────────────────────────────────────────┘
```

---

## 🔍 Where to Find Information

### Inventory Page
- **Current Stock**: See all products with their stock levels
- **Recent Adjustments**: View recent manual adjustments
- **Initiate Recount**: Start a new physical count

### Recount Tasks Page
- **Pending Tasks**: All products waiting to be physically counted
- **Expected vs Actual**: See what system expects and what you count
- **Complete Tasks**: Enter physical counts one by one

### Stock Movements
After completing recounts, you can see:
- **RECUENTO movements**: Record of the physical count
- **AJUSTE movements**: Automatic adjustments from differences

---

## ❓ Common Questions

### Q: What if I make a mistake entering the count?
**A:** Contact your supervisor. The adjustment is already created, so a manager would need to create a corrective adjustment.

### Q: Can I pause a recount and continue later?
**A:** Yes! Pending tasks remain until completed. You can do them one at a time over multiple sessions.

### Q: What if the difference is very large?
**A:** The system will still create the adjustment, but a warning is shown. Investigate why there's a large discrepancy before completing.

### Q: Can I recount just one category?
**A:** Yes! When initiating, select the specific category. This is useful for partial audits.

### Q: What happens to sales during a recount?
**A:** Sales can continue normally. The recount updates stock to the physical count regardless of transactions during the count.

---

## 🎯 Best Practices

1. **Plan Ahead**: Choose a quiet time for recounts (early morning, end of shift)
2. **By Category**: Do recounts by category to organize the work
3. **Two Person Rule**: Have one person count and another verify
4. **Document Issues**: Use the notes field to explain large differences
5. **Regular Schedule**: Do full recounts quarterly, category recounts monthly
6. **Investigate**: Don't just accept large differences - find the root cause

---

## 🛠️ Troubleshooting

### "Error al iniciar el recuento"
- **Cause**: Backend server not responding
- **Solution**: Check if backend is running, verify internet connection

### "Error al cargar las tareas de recuento"
- **Cause**: API endpoint not implemented or database error
- **Solution**: Contact IT support, check backend logs

### "No hay tareas de recuento pendientes"
- **Cause**: All recounts completed or none initiated
- **Solution**: This is normal! Go to Inventory page to start a new recount

---

## 📞 Support

For technical issues or questions:
- **IT Support**: support@ripser.com
- **Documentation**: See `RECOUNT_FEATURE_IMPLEMENTATION.md` for technical details
- **Training**: Contact warehouse manager for hands-on training

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Module**: Logística → Inventario
