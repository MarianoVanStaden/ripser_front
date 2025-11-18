# Fix: DetalleDocumento color and medida not showing in frontend

## Problem
When viewing presupuestos, notas de pedido, or facturas in the detail dialog, the **color** and **medida** fields are not displayed for EQUIPO type items, even though:
- The frontend UI has columns for these fields
- The TypeScript interfaces include these fields
- The user confirmed the data exists (e.g., color="VIOLETA", medida="1,6m" visible in Fabricacion module)

## Root Cause
The backend `DetalleDocumentoDTO` or the mapper that converts `DetalleDocumento` entity to DTO is **not populating** the `color` and `medida` fields when returning document details.

## Frontend Evidence
The frontend correctly handles these fields:

### PresupuestosPage.tsx
- **Table headers** (line 1249-1250): Shows "Color" and "Medida" columns
- **Table cells** (line 1303-1315): Displays `detalle.color` and `detalle.medida` in read-only mode
- **State mapping** (line 521-522): Maps `color` and `medida` from API response to local state

### NotasPedidoPage.tsx
- **Table headers** (line 854-855): Shows "Color" and "Medida" columns
- **Table cells** (line 874-875): Displays `detalle.color` and `detalle.medida`

### TypeScript Interfaces (types/index.ts)
```typescript
export interface DetalleDocumento {
  // ...
  color?: string;      // Line 1935
  medida?: string;     // Line 1936
  // ...
}

export interface DetalleDocumentoDTO {
  // ...
  color?: string;      // Line 1963
  medida?: string;     // Line 1964
  // ...
}
```

## Backend Fix Required

### 1. Check DetalleDocumento Entity
Ensure the entity has the fields:
```java
@Entity
@Table(name = "detalle_documento_comercial")
public class DetalleDocumento {
    // ...
    
    @Column(name = "color")
    private String color;
    
    @Column(name = "medida")
    private String medida;
    
    // Add getters and setters if missing
}
```

### 2. Check DetalleDocumentoDTO
Ensure the DTO has the fields:
```java
public class DetalleDocumentoDTO {
    // ...
    private String color;
    private String medida;
    
    // Add getters and setters if missing
}
```

### 3. Fix the Mapper
The mapper that converts `DetalleDocumento` entity to `DetalleDocumentoDTO` must populate these fields:

```java
// In DetalleDocumentoMapper or similar
public static DetalleDocumentoDTO toDTO(DetalleDocumento detalle) {
    DetalleDocumentoDTO dto = new DetalleDocumentoDTO();
    // ... existing mappings
    
    // ADD THESE LINES:
    dto.setColor(detalle.getColor());
    dto.setMedida(detalle.getMedida());
    
    return dto;
}
```

### 4. Verify Save Operations
When creating/updating presupuestos with equipos, ensure color and medida are saved:

```java
// In DocumentoComercialService or similar
public DocumentoComercial createPresupuesto(CreatePresupuestoRequest request) {
    // ...
    for (DetalleDocumentoDTO detalleDTO : request.getDetalles()) {
        DetalleDocumento detalle = new DetalleDocumento();
        // ... existing mappings
        
        // ADD THESE LINES:
        if (detalleDTO.getTipoItem() == TipoItemDocumento.EQUIPO) {
            detalle.setColor(detalleDTO.getColor());
            detalle.setMedida(detalleDTO.getMedida());
        }
        
        detalles.add(detalle);
    }
    // ...
}
```

## Testing
After applying the backend fix:

1. Create a new presupuesto with an EQUIPO item:
   - Select equipo type
   - Fill in color (e.g., "VIOLETA")
   - Fill in medida (e.g., "1,6m")
   - Save

2. View the presupuesto details:
   - Click "Ver" (eye icon) on the presupuesto
   - Verify the table shows:
     - ✅ Tipo: HELADERA
     - ✅ Modelo: GH1
     - ✅ **Color: VIOLETA** (should now appear)
     - ✅ **Medida: 1,6m** (should now appear)
     - ✅ Cantidad: 1

3. Test same flow for:
   - Notas de Pedido
   - Facturas

## Related Files
- **Frontend**: `src/components/Ventas/PresupuestosPage.tsx` (lines 1249-1315, 521-522)
- **Frontend**: `src/components/Ventas/NotasPedidoPage.tsx` (lines 854-855, 874-875)
- **Frontend**: `src/types/index.ts` (lines 1920-1980)
- **Backend**: `DetalleDocumento.java` (entity)
- **Backend**: `DetalleDocumentoDTO.java` (DTO)
- **Backend**: `DetalleDocumentoMapper.java` (mapper)
- **Backend**: `DocumentoComercialServiceImpl.java` (service)

## Database Check
Verify the database table has the columns:
```sql
SELECT color, medida 
FROM detalle_documento_comercial 
WHERE tipo_item = 'EQUIPO' 
LIMIT 10;
```

If the columns don't exist, add them:
```sql
ALTER TABLE detalle_documento_comercial 
ADD COLUMN color VARCHAR(100),
ADD COLUMN medida VARCHAR(100);
```

## Status
- ⚠️ **BLOCKING**: This is a user-facing issue affecting daily operations
- 🔧 **Fix Required**: Backend mapper needs to populate color and medida fields
- 📋 **Priority**: HIGH - Users cannot see equipment specifications they've entered
