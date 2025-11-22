# Frontend Estado Asignación Implementation

## Overview
This document summarizes the frontend implementation of the equipment assignment estado system across all relevant pages. The backend has already implemented the full 5-estado flow with automatic transitions.

## Estado Flow
```
DISPONIBLE (stock) 
  ↓ asignarEquiposAFactura()
RESERVADO (in nota/factura manual)
  ↓ confirmarEquiposDeFactura()
FACTURADO (factura confirmed)
  ↓ (add to viaje)
EN_TRANSITO (in delivery)
  ↓ confirmarEntrega()
ENTREGADO (delivered to client)
```

## Color Scheme
- **DISPONIBLE**: Grey (`default` chip)
- **RESERVADO**: Orange (`warning` chip)
- **FACTURADO**: Blue (`info` chip)
- **EN_TRANSITO**: Purple (`secondary` chip)
- **ENTREGADO**: Green (`success` chip)

## Files Modified

### 1. EquiposList.tsx ✅
**Location**: `src/components/Fabricacion/EquiposList.tsx`

**Changes**:
- Added `EstadoAsignacionEquipo` type import
- Created helper functions:
  - `getEstadoAsignacionColor()` - Returns MUI chip color based on estado
  - `getEstadoAsignacionLabel()` - Returns user-friendly label
- Added new state: `estadoAsignacionFilter`
- Added new DataGrid column: `estadoAsignacion` (before `asignado` column)
  - Shows colored chips with estado
  - Infers estado from `estado + asignado` if backend doesn't provide it
- Added filter dropdown for estado asignación
- Updated filter logic to include estadoAsignacion filtering
- Added validations to action buttons:
  - **Edit**: Disabled for RESERVADO and higher estados
  - **Delete**: Disabled for RESERVADO and higher estados
  - **Assign**: Only enabled for COMPLETADO + DISPONIBLE equipos
  - **Unassign**: Disabled for FACTURADO and higher estados
- Added informative tooltips explaining why actions are disabled

**Validations**:
- ✅ Can't edit equipos that are RESERVADO or higher
- ✅ Can't delete equipos that are RESERVADO or higher
- ✅ Can only assign DISPONIBLE equipos
- ✅ Can't unassign equipos that are FACTURADO or higher

---

### 2. AsignarEquiposDialog.tsx ✅
**Location**: `src/components/Ventas/AsignarEquiposDialog.tsx`

**Changes**:
- Added `EstadoAsignacionEquipo` type import
- Created same helper functions as EquiposList
- Added estadoAsignacion filtering in `initializeAsignaciones()`:
  - Only shows DISPONIBLE equipos
  - Infers estado if backend doesn't provide it
  - Filters out RESERVADO, FACTURADO, EN_TRANSITO, and ENTREGADO equipos
- Updated equipment display in dropdown:
  - Shows fabrication estado badge (EN_PROCESO, COMPLETADO, CANCELADO)
  - Shows estadoAsignacion badge with appropriate color
  - Both badges displayed side-by-side
- Added console log to show filtered count

**Validations**:
- ✅ Only DISPONIBLE equipos appear in selection dropdown
- ✅ Visual indication of both fabrication estado and asignación estado
- ✅ Backend will validate and change estado to RESERVADO on assignment

---

### 3. NotasPedidoPage.tsx ✅
**Location**: `src/components/Ventas/NotasPedidoPage.tsx`

**Changes**:
- No direct changes needed
- Estado display is handled through `AsignarEquiposDialog` component
- When converting nota → factura, backend automatically changes estado to RESERVADO
- After confirmation, backend changes to FACTURADO

**Note**: This page shows document detalles, not individual equipos. Equipment estado tracking happens in the AsignarEquiposDialog.

---

### 4. TripsPage.tsx ✅
**Location**: `src/components/Logistica/TripsPage.tsx`

**Changes**:
- No changes needed
- This page only displays equipos that are already assigned to deliveries
- Equipment selection for trips happens in DeliveriesPage or through backend logic
- Backend should filter only FACTURADO equipos when creating entregas

**Note**: Equipment filtering should be enforced at the entrega creation level, not in trip visualization.

---

### 5. DeliveriesPage.tsx ✅
**Location**: `src/components/Logistica/DeliveriesPage.tsx`

**Changes**:
- Added `EstadoAsignacionEquipo` type import
- Created same helper functions for estado colors and labels
- Updated equipos table in details dialog:
  - Added new "Estado" column
  - Shows estadoAsignacion chip with color
  - Infers estado if not provided:
    - ENTREGADA delivery → ENTREGADO
    - PENDIENTE/EN_CAMINO delivery → EN_TRANSITO
- Updated `handleMarkAsDelivered()`:
  - Added comment explaining backend changes estado to ENTREGADO
  - Added success message informing user about estado change
- Visual feedback when confirming delivery

**Estado Behavior**:
- Equipment in active deliveries: **EN_TRANSITO**
- Equipment in confirmed deliveries: **ENTREGADO**
- Backend `confirmarEntrega()` API handles estado transition automatically

---

## Inference Logic
Since the backend may not always return `estadoAsignacion` (until SQL migration is run), the frontend infers estado using this logic:

```typescript
let estadoAsignacion = equipo.estadoAsignacion;

if (!estadoAsignacion && equipo.estado === 'COMPLETADO') {
  estadoAsignacion = equipo.asignado ? 'ENTREGADO' : 'DISPONIBLE';
}
```

**Inference rules**:
- If `estadoAsignacion` is provided by backend → use it
- If `estado === 'COMPLETADO'` and `asignado === true` → infer **ENTREGADO**
- If `estado === 'COMPLETADO'` and `asignado === false` → infer **DISPONIBLE**
- Otherwise → null/undefined

---

## Backend Integration Points

### API Endpoints Already Implemented ✅
1. **`POST /api/documento-comercial/asignar-equipos`**
   - Validates equipos are DISPONIBLE
   - Changes estado to RESERVADO
   
2. **`POST /api/documento-comercial/{id}/confirmar`**
   - Changes equipos estado to FACTURADO
   
3. **`POST /api/entregas-viaje/{id}/confirmar`**
   - Changes equipos estado to ENTREGADO
   - Creates warranties for facturas
   
4. **`GET /api/equipos-fabricados`**
   - Should return `estadoAsignacion` field (after SQL migration)

### SQL Migration Required
```sql
-- Already created in migration_estado_asignacion_equipos.sql
ALTER TABLE equipos_fabricados ADD COLUMN estado_asignacion VARCHAR(20);

UPDATE equipos_fabricados 
SET estado_asignacion = CASE 
  WHEN asignado = TRUE THEN 'ENTREGADO'
  ELSE 'DISPONIBLE'
END
WHERE estado = 'COMPLETADO';
```

**Status**: ⏳ Migration script ready but not yet executed

---

## Testing Checklist

### EquiposList.tsx
- [ ] Estado column displays correctly with colored chips
- [ ] Filter dropdown works for all 5 estados
- [ ] Edit button disabled for RESERVADO+ equipos
- [ ] Delete button disabled for RESERVADO+ equipos
- [ ] Assign button only enabled for DISPONIBLE equipos
- [ ] Unassign button disabled for FACTURADO+ equipos
- [ ] Tooltips show correct messages

### AsignarEquiposDialog.tsx
- [ ] Only DISPONIBLE equipos appear in dropdown
- [ ] Estado badges show correctly (fabrication + asignación)
- [ ] Non-DISPONIBLE equipos are filtered out
- [ ] Assignment succeeds and changes estado to RESERVADO

### DeliveriesPage.tsx
- [ ] Estado column shows in equipos table
- [ ] EN_TRANSITO estado for pending deliveries
- [ ] ENTREGADO estado after confirming delivery
- [ ] Success message appears after confirmation

### End-to-End Flow
- [ ] Create equipo (EN_PROCESO) → Complete (DISPONIBLE)
- [ ] Assign to factura manual (RESERVADO)
- [ ] Confirm factura (FACTURADO)
- [ ] Add to viaje/entrega (EN_TRANSITO)
- [ ] Confirm delivery (ENTREGADO)
- [ ] Verify estado changes reflect in all pages immediately

---

## Validation Summary

### Implemented Validations
1. ✅ **Only DISPONIBLE equipos can be assigned** (AsignarEquiposDialog)
2. ✅ **Can't edit equipos in RESERVADO+ estados** (EquiposList)
3. ✅ **Can't delete equipos in RESERVADO+ estados** (EquiposList)
4. ✅ **Can't unassign equipos in FACTURADO+ estados** (EquiposList)
5. ✅ **Visual feedback with colored chips** (All pages)
6. ✅ **Estado transitions handled by backend** (APIs)

### Backend Validations (Already Implemented)
- ✅ Validates DISPONIBLE before assignment
- ✅ Automatic estado transitions
- ✅ Repository queries for estado filtering
- ✅ DTO includes estadoAsignacion field

---

## Next Steps

### Immediate (Required before full testing)
1. **Execute SQL migration script** on database
2. **Restart backend** to load changes
3. **Test complete flow** from DISPONIBLE → ENTREGADO

### Optional Enhancements
1. Add estado change history tracking
2. Add bulk estado operations
3. Add estado statistics in dashboard
4. Add email notifications on estado changes
5. Add estado timeline in equipment detail view

---

## Known Issues / Limitations

1. **Inference Fallback**: Frontend infers estado until migration runs
   - **Impact**: Graphs show data but may not be 100% accurate
   - **Solution**: Execute SQL migration
   
2. **Real-time Updates**: Estado changes don't reflect without page reload
   - **Impact**: User must refresh to see estado changes
   - **Solution**: Implement WebSocket or polling for real-time updates
   
3. **Bulk Operations**: No bulk estado change operations
   - **Impact**: Must change estados one-by-one
   - **Solution**: Add bulk update API and UI

---

## Summary

### Files Modified: 3
1. `EquiposList.tsx` - ✅ Complete with validations
2. `AsignarEquiposDialog.tsx` - ✅ Complete with filtering
3. `DeliveriesPage.tsx` - ✅ Complete with estado display

### Files Reviewed (No Changes Needed): 2
1. `NotasPedidoPage.tsx` - Uses AsignarEquiposDialog
2. `TripsPage.tsx` - Display only, no selection

### Helper Functions Created: 2
1. `getEstadoAsignacionColor()` - Returns chip color
2. `getEstadoAsignacionLabel()` - Returns user-friendly label

### Validations Implemented: 5
1. Only DISPONIBLE equipos assignable
2. No edit for RESERVADO+
3. No delete for RESERVADO+
4. No unassign for FACTURADO+
5. Visual feedback with colors

### Backend Ready: ✅
- All endpoints implemented
- Estado transitions automatic
- DTO includes estadoAsignacion
- Migration script ready

### Status: 🟢 Ready for Testing
Once SQL migration is executed, the complete estado system will be fully operational.
