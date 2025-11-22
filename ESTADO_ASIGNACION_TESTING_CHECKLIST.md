# Estado Asignación Testing Checklist

## Pre-Testing Setup

### Database Migration
- [ ] Backup current database
- [ ] Execute `migration_estado_asignacion_equipos.sql`
- [ ] Verify `estado_asignacion` column exists in `equipos_fabricados` table
- [ ] Verify initial values set correctly (COMPLETADO + asignado=true → ENTREGADO, else DISPONIBLE)
- [ ] Check index created: `idx_equipos_estado_asignacion`

### Backend Verification
- [ ] Restart Spring Boot application
- [ ] Verify enum `EstadoAsignacionEquipo` has 5 values
- [ ] Test `/api/equipos-fabricados` returns `estadoAsignacion` field
- [ ] Test `asignarEquiposAFactura()` validates DISPONIBLE
- [ ] Test `confirmarEquiposDeFactura()` changes to FACTURADO
- [ ] Test `confirmarEntrega()` changes to ENTREGADO

### Frontend Verification
- [ ] Frontend build succeeds without errors
- [ ] No TypeScript compilation errors
- [ ] No console errors on page load
- [ ] All pages load correctly

---

## EquiposList Page Tests

### Display Tests
- [ ] **Estado Column Visible**: New "Estado Asignación" column appears in DataGrid
- [ ] **Colored Chips**: Each estado shows correct color:
  - Grey for DISPONIBLE
  - Orange for RESERVADO
  - Blue for FACTURADO
  - Purple for EN_TRANSITO
  - Green for ENTREGADO
- [ ] **Estado Labels**: Labels are user-friendly (e.g., "En Tránsito" not "EN_TRANSITO")
- [ ] **Filter Dropdown**: "Estado Asignación" filter shows all 5 options

### Filter Tests
- [ ] **Filter by DISPONIBLE**: Shows only available equipos
- [ ] **Filter by RESERVADO**: Shows only reserved equipos
- [ ] **Filter by FACTURADO**: Shows only invoiced equipos
- [ ] **Filter by EN_TRANSITO**: Shows only equipos in transit
- [ ] **Filter by ENTREGADO**: Shows only delivered equipos
- [ ] **Filter "Todos"**: Shows all equipos regardless of estado
- [ ] **Combined Filters**: Estado + Tipo filters work together
- [ ] **Combined Filters**: Estado + Estado Fabricación filters work together

### Validation Tests - DISPONIBLE Equipo
- [ ] **Edit Button**: Enabled ✅
- [ ] **Delete Button**: Enabled ✅
- [ ] **Assign Button**: Enabled (if COMPLETADO) ✅
- [ ] **Unassign Button**: N/A (not assigned yet)
- [ ] **Tooltip**: "Editar" / "Eliminar" / "Asignar Cliente"

### Validation Tests - RESERVADO Equipo
- [ ] **Edit Button**: Disabled ❌
- [ ] **Delete Button**: Disabled ❌
- [ ] **Assign Button**: N/A (already assigned)
- [ ] **Unassign Button**: Enabled ✅
- [ ] **Tooltip**: Shows reason for disabled state

### Validation Tests - FACTURADO Equipo
- [ ] **Edit Button**: Disabled ❌
- [ ] **Delete Button**: Disabled ❌
- [ ] **Assign Button**: N/A (already assigned)
- [ ] **Unassign Button**: Disabled ❌
- [ ] **Tooltip**: Shows "No se puede editar/eliminar/desasignar (Estado: Facturado)"

### Validation Tests - EN_TRANSITO Equipo
- [ ] **Edit Button**: Disabled ❌
- [ ] **Delete Button**: Disabled ❌
- [ ] **Unassign Button**: Disabled ❌
- [ ] **Tooltip**: Shows "Estado: En Tránsito"

### Validation Tests - ENTREGADO Equipo
- [ ] **Edit Button**: Disabled ❌
- [ ] **Delete Button**: Disabled ❌
- [ ] **Unassign Button**: Disabled ❌
- [ ] **Tooltip**: Shows "Estado: Entregado"

---

## AsignarEquiposDialog Tests

### Display Tests
- [ ] **Estado Badges**: Each equipo shows both fabrication estado and asignación estado
- [ ] **Color Coding**: Asignación estado chips use correct colors
- [ ] **Side-by-Side**: Both badges visible without overlap

### Filtering Tests
- [ ] **Only DISPONIBLE**: Dropdown only shows DISPONIBLE equipos
- [ ] **No RESERVADO**: RESERVADO equipos don't appear
- [ ] **No FACTURADO**: FACTURADO equipos don't appear
- [ ] **No EN_TRANSITO**: EN_TRANSITO equipos don't appear
- [ ] **No ENTREGADO**: ENTREGADO equipos don't appear

### Color/Medida + Estado Filtering
- [ ] **Color Match**: Only shows equipos matching selected color AND DISPONIBLE
- [ ] **Medida Match**: Only shows equipos matching selected medida AND DISPONIBLE
- [ ] **Both Match**: Color + Medida + DISPONIBLE filter works together

### Assignment Flow
- [ ] **Select Equipo**: Can select DISPONIBLE equipo from dropdown
- [ ] **Confirm Assignment**: "Confirmar Asignación" button works
- [ ] **Backend Call**: POST to `/api/documento-comercial/asignar-equipos` succeeds
- [ ] **Estado Change**: Backend changes estado to RESERVADO
- [ ] **UI Refresh**: After assignment, equipo no longer appears in future dialogs

---

## NotasPedidoPage Tests

### Estado Display via Dialog
- [ ] **Open Nota**: Viewing nota details shows correct information
- [ ] **Convert to Factura**: "Facturar" button works
- [ ] **AsignarEquiposDialog**: Opens with nota's equipos
- [ ] **Estado Display**: Equipos show current estado in dialog
- [ ] **After Conversion**: Nota disappears from list (estado = FACTURADA)

---

## TripsPage Tests

### Equipment Display
- [ ] **Equipos Visible**: Equipos list shows in trip details
- [ ] **Numbers Displayed**: Equipment numbers (numeroHeladera) visible
- [ ] **Count Accurate**: Equipment count matches actual number

**Note**: No estado filtering needed here - display only

---

## DeliveriesPage Tests

### Display Tests
- [ ] **Estado Column**: "Estado" column appears in equipos table
- [ ] **Colored Chips**: Each equipo shows estado chip with correct color
- [ ] **EN_TRANSITO**: Pending deliveries show equipos as EN_TRANSITO
- [ ] **ENTREGADO**: Confirmed deliveries show equipos as ENTREGADO

### Delivery Confirmation Flow
- [ ] **Open Delivery**: Click delivery to view details
- [ ] **See Equipos**: Equipos table shows all equipment
- [ ] **Estado Visible**: Each equipo shows current estado
- [ ] **Click Confirm**: "Confirmar Entrega" button works
- [ ] **Enter Data**: Receptor nombre/DNI prompts appear
- [ ] **Backend Call**: POST to `/api/entregas-viaje/{id}/confirmar` succeeds
- [ ] **Success Message**: "Entrega confirmada. Los equipos ahora están en estado ENTREGADO."
- [ ] **Estado Change**: After confirmation, equipos show ENTREGADO
- [ ] **Warranties Created**: Backend creates guarantees (check guarantees table)

---

## End-to-End Flow Test

### Complete Equipment Lifecycle
1. **Create Equipment**
   - [ ] Create new equipo (estado: EN_PROCESO)
   - [ ] Verify shows in EquiposList with EN_PROCESO

2. **Complete Equipment**
   - [ ] Mark as COMPLETADO
   - [ ] Verify estadoAsignacion = DISPONIBLE
   - [ ] Verify shows grey chip in EquiposList
   - [ ] Verify Edit/Delete buttons enabled

3. **Assign to Nota/Factura**
   - [ ] Open FacturacionPage or NotasPedidoPage
   - [ ] Create new nota/factura manual
   - [ ] Add EQUIPO item
   - [ ] Open AsignarEquiposDialog
   - [ ] Select the DISPONIBLE equipo
   - [ ] Confirm assignment
   - [ ] Backend changes estado to RESERVADO

4. **Verify RESERVADO Estado**
   - [ ] Return to EquiposList
   - [ ] Refresh page
   - [ ] Verify equipo shows orange RESERVADO chip
   - [ ] Verify Edit/Delete buttons disabled
   - [ ] Verify Unassign button enabled

5. **Confirm Factura**
   - [ ] Return to document
   - [ ] Click "Confirmar Factura"
   - [ ] Backend changes estado to FACTURADO

6. **Verify FACTURADO Estado**
   - [ ] Return to EquiposList
   - [ ] Refresh page
   - [ ] Verify equipo shows blue FACTURADO chip
   - [ ] Verify Unassign button disabled

7. **Create Delivery**
   - [ ] Go to DeliveriesPage
   - [ ] Create new entrega with the factura
   - [ ] Backend should change estado to EN_TRANSITO (future feature)

8. **Verify EN_TRANSITO Estado**
   - [ ] Open delivery details
   - [ ] Verify equipo shows purple EN_TRANSITO chip

9. **Confirm Delivery**
   - [ ] Click "Confirmar Entrega"
   - [ ] Enter receptor data
   - [ ] Confirm
   - [ ] Backend changes estado to ENTREGADO

10. **Verify ENTREGADO Estado**
    - [ ] Return to EquiposList
    - [ ] Refresh page
    - [ ] Verify equipo shows green ENTREGADO chip
    - [ ] Verify all action buttons disabled except View
    - [ ] Check GarantiasPage - warranty should be created

---

## Performance Tests

- [ ] **Page Load Time**: Pages load in < 2 seconds
- [ ] **Filter Response**: Filter changes apply in < 500ms
- [ ] **Large Dataset**: DataGrid handles 1000+ equipos without lag
- [ ] **Multiple Filters**: Combining filters doesn't slow down UI

---

## Edge Cases

### No Estado Provided (Pre-Migration)
- [ ] **Inference Works**: Shows DISPONIBLE for completed non-assigned
- [ ] **Inference Works**: Shows ENTREGADO for completed assigned
- [ ] **Inference Works**: Shows null/default for non-completed

### Invalid Estado Value
- [ ] **Unknown Estado**: Defaults to grey chip with raw value
- [ ] **Null Estado**: Shows "No especificado"

### Concurrent Operations
- [ ] **Two Users**: User A assigns equipo, User B can't see it in dialog after refresh
- [ ] **Estado Conflict**: Backend validates and rejects invalid estado transitions

---

## Regression Tests

### Existing Functionality
- [ ] **Create Equipo**: Still works as before
- [ ] **Edit Equipo**: Works for DISPONIBLE equipos
- [ ] **Delete Equipo**: Works for DISPONIBLE equipos
- [ ] **Complete Equipo**: Still works
- [ ] **Cancel Equipo**: Still works
- [ ] **Assign Client**: Works for DISPONIBLE + COMPLETADO
- [ ] **Unassign Client**: Works for DISPONIBLE/RESERVADO

### Document Flow
- [ ] **Create Presupuesto**: Still works
- [ ] **Create Nota**: Still works
- [ ] **Create Factura**: Still works with equipment assignment
- [ ] **Factura Confirmation**: Changes estado correctly

### Deliveries Flow
- [ ] **Create Entrega**: Still works
- [ ] **Assign to Viaje**: Still works
- [ ] **Confirm Delivery**: Changes estado and creates warranties

---

## Browser Compatibility

- [ ] **Chrome**: All features work
- [ ] **Firefox**: All features work
- [ ] **Edge**: All features work
- [ ] **Safari**: All features work (if applicable)

---

## Accessibility

- [ ] **Keyboard Navigation**: Can navigate with Tab key
- [ ] **Screen Reader**: Estado labels readable by screen reader
- [ ] **Color Blind**: Chips have labels, not just colors
- [ ] **Tooltips**: Informative tooltips on disabled buttons

---

## Documentation

- [ ] **README Updated**: Implementation summary documented
- [ ] **API Docs**: Endpoint changes documented
- [ ] **User Guide**: Estado flow explained for users
- [ ] **Quick Reference**: Helper functions and examples available

---

## Sign-Off

### Developer
- [ ] All code committed
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] All tests passing

### QA
- [ ] All checklist items verified
- [ ] Edge cases tested
- [ ] Performance acceptable
- [ ] No critical bugs found

### Product Owner
- [ ] Feature matches requirements
- [ ] User experience acceptable
- [ ] Ready for production deployment

---

## Deployment Checklist

- [ ] **Backup Database**: Full backup before migration
- [ ] **Run Migration**: Execute SQL script in production
- [ ] **Restart Backend**: Restart Spring Boot app
- [ ] **Deploy Frontend**: Deploy new frontend build
- [ ] **Smoke Test**: Quick test of critical flows
- [ ] **Monitor Logs**: Check for errors in first hour
- [ ] **User Communication**: Notify users of new feature

---

## Rollback Plan

### If Issues Occur
1. [ ] **Revert Frontend**: Deploy previous frontend version
2. [ ] **Keep Database**: Migration is safe to keep (backward compatible)
3. [ ] **Backend Optional**: Can keep running, estado will be ignored by old frontend

### Critical Issues Only
1. [ ] **Restore Database**: From backup (loses estado data)
2. [ ] **Revert Backend**: Deploy previous version
3. [ ] **Investigate**: Review logs and fix issues
4. [ ] **Re-deploy**: With fixes applied

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Track estado transition counts

### First Week
- [ ] Verify all estado flows working
- [ ] Check data consistency
- [ ] Confirm warranties created
- [ ] Review any support tickets

---

## Success Metrics

- [ ] **Zero Critical Bugs**: No blocking issues
- [ ] **User Adoption**: Users understand estado system
- [ ] **Data Integrity**: All estado transitions valid
- [ ] **Performance**: No degradation in page load times
- [ ] **Support Tickets**: Minimal questions about new feature

---

## Notes

**Testing Date**: _______________

**Tester Name**: _______________

**Environment**: [ ] DEV [ ] QA [ ] STAGING [ ] PROD

**Database Version**: _______________

**Frontend Version**: _______________

**Backend Version**: _______________

**Issues Found**: 
```
[List any issues found during testing]
```

**Additional Comments**:
```
[Any additional notes or observations]
```
