# Quick Reference: Estado Asignación

## Estado Values & Colors

| Estado | Label | Chip Color | MUI Color | Hex Color |
|--------|-------|------------|-----------|-----------|
| DISPONIBLE | Disponible | Grey | `default` | #9e9e9e |
| RESERVADO | Reservado | Orange | `warning` | #ff9800 |
| FACTURADO | Facturado | Blue | `info` | #2196f3 |
| EN_TRANSITO | En Tránsito | Purple | `secondary` | #9c27b0 |
| ENTREGADO | Entregado | Green | `success` | #4caf50 |

## Estado Flow Diagram

```
┌─────────────┐
│ DISPONIBLE  │ ← Equipo completado, listo para venta
└──────┬──────┘
       │ asignarEquiposAFactura()
       ↓
┌─────────────┐
│  RESERVADO  │ ← Asignado a nota/factura manual
└──────┬──────┘
       │ confirmarEquiposDeFactura()
       ↓
┌─────────────┐
│ FACTURADO   │ ← Factura confirmada
└──────┬──────┘
       │ add to entrega
       ↓
┌─────────────┐
│ EN_TRANSITO │ ← En viaje/entrega
└──────┬──────┘
       │ confirmarEntrega()
       ↓
┌─────────────┐
│ ENTREGADO   │ ← Entregado al cliente
└─────────────┘
```

## Validation Matrix

| Action | DISPONIBLE | RESERVADO | FACTURADO | EN_TRANSITO | ENTREGADO |
|--------|------------|-----------|-----------|-------------|-----------|
| **Edit** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Delete** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Assign** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Unassign** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **View** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

## Backend Endpoints

### 1. Assign Equipos (DISPONIBLE → RESERVADO)
```typescript
POST /api/documento-comercial/asignar-equipos
Body: { documentoId: number, equiposIds: number[] }
Result: Changes estado to RESERVADO
```

### 2. Confirm Factura (RESERVADO → FACTURADO)
```typescript
POST /api/documento-comercial/{id}/confirmar
Result: Changes estado to FACTURADO
```

### 3. Confirm Delivery (FACTURADO → ENTREGADO)
```typescript
POST /api/entregas-viaje/{id}/confirmar
Body: { estado: 'ENTREGADA', receptorNombre, receptorDni, observaciones }
Result: Changes estado to ENTREGADO + creates warranties
```

## Helper Functions (Copy-Paste)

```typescript
import type { EstadoAsignacionEquipo } from '../../types';

const getEstadoAsignacionColor = (estado: EstadoAsignacionEquipo | null | undefined): 'default' | 'warning' | 'info' | 'secondary' | 'success' => {
  if (!estado) return 'default';
  const colorMap: Record<EstadoAsignacionEquipo, 'default' | 'warning' | 'info' | 'secondary' | 'success'> = {
    DISPONIBLE: 'default',
    RESERVADO: 'warning',
    FACTURADO: 'info',
    EN_TRANSITO: 'secondary',
    ENTREGADO: 'success',
  };
  return colorMap[estado] || 'default';
};

const getEstadoAsignacionLabel = (estado: EstadoAsignacionEquipo | null | undefined): string => {
  if (!estado) return 'No especificado';
  const labelMap: Record<EstadoAsignacionEquipo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    FACTURADO: 'Facturado',
    EN_TRANSITO: 'En Tránsito',
    ENTREGADO: 'Entregado',
  };
  return labelMap[estado] || estado;
};
```

## Usage Examples

### Display Estado Chip
```tsx
<Chip
  label={getEstadoAsignacionLabel(equipo.estadoAsignacion)}
  size="small"
  color={getEstadoAsignacionColor(equipo.estadoAsignacion)}
/>
```

### Filter by Estado
```typescript
const equiposDisponibles = equipos.filter(e => {
  let estadoAsignacion = e.estadoAsignacion;
  
  // Infer if not provided
  if (!estadoAsignacion && e.estado === 'COMPLETADO') {
    estadoAsignacion = e.asignado ? 'ENTREGADO' : 'DISPONIBLE';
  }
  
  return estadoAsignacion === 'DISPONIBLE';
});
```

### Validate Action
```typescript
const canEdit = !estadoAsignacion || estadoAsignacion === 'DISPONIBLE';
const canDelete = !estadoAsignacion || estadoAsignacion === 'DISPONIBLE';
const canAssign = estadoAsignacion === 'DISPONIBLE';
const canUnassign = estadoAsignacion && !['FACTURADO', 'EN_TRANSITO', 'ENTREGADO'].includes(estadoAsignacion);
```

## Troubleshooting

### Estado not showing?
1. Check if backend returns `estadoAsignacion` field
2. Use inference logic if migration not run yet
3. Verify DTO includes field in API response

### Wrong color displayed?
1. Check estado value matches enum exactly
2. Verify helper function is imported
3. Check MUI theme supports color variant

### Validation not working?
1. Verify estadoAsignacion value
2. Check button is wrapped in `<span>` for disabled tooltip
3. Ensure validation logic matches estado

## Migration Script

```sql
-- Add column
ALTER TABLE equipos_fabricados 
ADD COLUMN estado_asignacion VARCHAR(20);

-- Set initial values
UPDATE equipos_fabricados 
SET estado_asignacion = CASE 
  WHEN asignado = TRUE THEN 'ENTREGADO'
  ELSE 'DISPONIBLE'
END
WHERE estado = 'COMPLETADO';

-- Add index for performance
CREATE INDEX idx_equipos_estado_asignacion 
ON equipos_fabricados(estado_asignacion);
```

## Testing Commands

```bash
# Check if migration applied
SELECT COUNT(*) FROM equipos_fabricados WHERE estado_asignacion IS NOT NULL;

# View estado distribution
SELECT estado_asignacion, COUNT(*) 
FROM equipos_fabricados 
GROUP BY estado_asignacion;

# Find equipos ready to assign
SELECT * FROM equipos_fabricados 
WHERE estado = 'COMPLETADO' 
AND estado_asignacion = 'DISPONIBLE';
```

## Common Issues

### Issue: "Can't assign equipment"
**Cause**: Equipment is not DISPONIBLE
**Solution**: Check equipment estado in EquiposList, only assign DISPONIBLE equipos

### Issue: "Estado shows null"
**Cause**: SQL migration not executed
**Solution**: Run migration script or use inference logic

### Issue: "Edit button disabled"
**Cause**: Equipment is RESERVADO or higher
**Solution**: This is correct behavior - can't edit assigned/sold equipment

### Issue: "Estado doesn't update after action"
**Cause**: Page not refreshed after backend change
**Solution**: Reload page or implement real-time updates

## Quick Checks

```typescript
// ✅ Good: Only DISPONIBLE equipos
const equipos = await api.get('/equipos-disponibles');

// ❌ Bad: Allowing all estados
const equipos = await api.get('/equipos'); // Don't use for assignment

// ✅ Good: Validation before assign
if (equipo.estadoAsignacion === 'DISPONIBLE') {
  await assignEquipo(equipo.id);
}

// ❌ Bad: No validation
await assignEquipo(equipo.id); // Might fail!

// ✅ Good: Show estado with color
<Chip label={getEstadoAsignacionLabel(estado)} color={getEstadoAsignacionColor(estado)} />

// ❌ Bad: Raw estado value
<span>{estado}</span> // Not user-friendly
```
