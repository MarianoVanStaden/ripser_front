# Frontend Changes for Presupuestos with Leads

## 1. Update FormData Interface and State

**File:** `src/components/Ventas/PresupuestosPage.tsx`

**Line ~91-107:** Replace the FormData interface and initialFormData:

```typescript
interface FormData {
  entityType: 'CLIENTE' | 'LEAD';  // Add this field
  clienteId: string;
  leadId: string;  // Add this field
  usuarioId: string;
  fechaEmision: string;
  observaciones: string;
  estado: EstadoDocumento;
  tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
}

const initialFormData: FormData = {
  entityType: 'CLIENTE',  // Default to CLIENTE
  clienteId: "",
  leadId: "",  // Add this field
  usuarioId: "",
  fechaEmision: new Date().toISOString().split("T")[0],
  observaciones: "",
  estado: EstadoDocumentoEnum.PENDIENTE,
  tipoIva: 'IVA_21',
};
```

## 2. Add Leads State and Import

**Line ~1-56:** Add lead imports at the top:

```typescript
import { leadApi } from "../../api/services/leadApi";
import type { LeadDTO } from "../../types/lead.types";
```

**Line ~150-179:** Add leads state variable:

```typescript
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [leads, setLeads] = useState<LeadDTO[]>([]);  // Add this line
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
```

## 3. Update fetchData to Include Leads

**Line ~217-253:** Update the fetchData function to fetch leads:

```typescript
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientesData, leadsData, usuariosData, presupuestosData, productosData, recetasData] = await Promise.all([
        clienteApi.getAll().catch((err) => {
          console.error("Error fetching clientes:", err);
          setError("Error al cargar clientes: " + (err.response?.data?.message || err.message));
          return [];
        }),
        leadApi.getAll().catch((err) => {  // Add this
          console.error("Error fetching leads:", err);
          setError("Error al cargar leads: " + (err.response?.data?.message || err.message));
          return [];
        }),
        usuarioApi.getAll().catch((err) => {
          console.error("Error fetching usuarios:", err);
          setError("Error al cargar usuarios: " + (err.response?.data?.message || err.message));
          return [];
        }),
        documentoApi.getByTipo("PRESUPUESTO").catch((err) => {
          console.error("Error fetching presupuestos:", err);
          const errorMessage = err.response?.status === 403
            ? "No tiene permisos para ver los presupuestos. Contacte al administrador."
            : "Error al cargar presupuestos: " + (err.response?.data?.message || err.message);
          setError(errorMessage);
          return [];
        }),
        productApi.getAll().catch((err) => {
          console.error("Error fetching productos:", err);
          setError("Error al cargar productos: " + (err.response?.data?.message || err.message));
          return [];
        }),
        recetaFabricacionApi.findDisponiblesParaVenta().catch((err) => {
          console.error("Error fetching recetas:", err);
          setError("Error al cargar recetas de equipos: " + (err.response?.data?.message || err.message));
          return [];
        }),
      ]);

      console.log("Fetched data:", { clientesData, leadsData, usuariosData, presupuestosData, productosData, recetasData });
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);  // Add this line
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      // ... rest of the function
```

## 4. Update Payload Construction

**Line ~578-600:** Update handleSavePresupuesto payload construction:

```typescript
    const payload: any = {
      usuarioId: Number(formData.usuarioId) || (user?.id ?? 0),
      observaciones: formData.observaciones,
      tipoIva: formData.tipoIva,
      detalles: detalles.map((d) => {
        const baseDetalle: any = {
          tipoItem: d.tipoItem,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descripcion: d.descripcion,
        };

        if (d.tipoItem === 'PRODUCTO') {
          baseDetalle.productoId = Number(d.productoId);
        } else if (d.tipoItem === 'EQUIPO') {
          baseDetalle.recetaId = Number(d.recetaId);
          baseDetalle.color = d.color || undefined;
          baseDetalle.medida = d.medida || undefined;
        }

        return baseDetalle;
      }),
    };

    // Add clienteId OR leadId based on entityType
    if (formData.entityType === 'CLIENTE') {
      payload.clienteId = Number(formData.clienteId);
    } else if (formData.entityType === 'LEAD') {
      payload.leadId = Number(formData.leadId);
    }

    // Validation
    if (!payload.clienteId && !payload.leadId) {
      setError("Debe seleccionar un Cliente o un Lead");
      return;
    }
```

## 5. Add Entity Type Selection UI

**Find the form dialog section** (search for "Cliente" TextField in the dialog):

Add radio buttons for entity type selection BEFORE the cliente/lead selector:

```typescript
<FormControl component="fieldset" sx={{ mb: 2 }}>
  <Typography variant="subtitle2" sx={{ mb: 1 }}>
    Tipo de Entidad
  </Typography>
  <RadioGroup
    row
    value={formData.entityType}
    onChange={(e) => {
      setFormData({
        ...formData,
        entityType: e.target.value as 'CLIENTE' | 'LEAD',
        // Clear the other field when switching
        ...(e.target.value === 'CLIENTE' ? { leadId: '' } : { clienteId: '' })
      });
      setHasUnsavedChanges(true);
    }}
  >
    <FormControlLabel value="CLIENTE" control={<Radio />} label="Cliente" />
    <FormControlLabel value="LEAD" control={<Radio />} label="Lead" />
  </RadioGroup>
</FormControl>

{/* Conditional rendering based on entityType */}
{formData.entityType === 'CLIENTE' ? (
  <TextField
    label="Cliente *"
    select
    fullWidth
    value={formData.clienteId}
    onChange={(e) => {
      setFormData({ ...formData, clienteId: e.target.value });
      setHasUnsavedChanges(true);
    }}
    margin="normal"
    disabled={readOnly}
    required
  >
    <MenuItem value="">
      <em>Seleccione un cliente</em>
    </MenuItem>
    {clientes.map((cliente) => (
      <MenuItem key={cliente.id} value={cliente.id.toString()}>
        {cliente.nombre} {cliente.apellido} {cliente.razonSocial && `- ${cliente.razonSocial}`}
      </MenuItem>
    ))}
  </TextField>
) : (
  <TextField
    label="Lead *"
    select
    fullWidth
    value={formData.leadId}
    onChange={(e) => {
      setFormData({ ...formData, leadId: e.target.value });
      setHasUnsavedChanges(true);
    }}
    margin="normal"
    disabled={readOnly}
    required
  >
    <MenuItem value="">
      <em>Seleccione un lead</em>
    </MenuItem>
    {leads.map((lead) => (
      <MenuItem key={lead.id} value={lead.id!.toString()}>
        {lead.nombre} {lead.apellido} - {lead.telefono}
        {lead.estadoLead && ` (${lead.estadoLead})`}
      </MenuItem>
    ))}
  </TextField>
)}
```

## 6. Update Table Display to Show Cliente or Lead

**Find the table rows section** and update the cliente name cell:

```typescript
<TableCell>
  {presupuesto.clienteNombre || presupuesto.leadNombre || 'Sin asignar'}
  {presupuesto.leadNombre && (
    <Chip
      label="Lead"
      size="small"
      color="warning"
      sx={{ ml: 1 }}
    />
  )}
</TableCell>
```

## 7. Add Conversion Validation Error Handling

**Add a new error state for conversion:**

```typescript
const [conversionError, setConversionError] = useState<{message: string; leadId?: number} | null>(null);
```

**Update the convertToNotaPedido function** (you'll need to find or create this function):

```typescript
const handleConvertToNotaPedido = async (presupuesto: DocumentoComercial) => {
  try {
    // Check if presupuesto has a lead
    if (presupuesto.leadId) {
      setConversionError({
        message: `Este presupuesto está asociado a un Lead (${presupuesto.leadNombre}). Debe convertir el Lead a Cliente antes de generar una Nota de Pedido.`,
        leadId: presupuesto.leadId
      });
      return;
    }

    // Proceed with conversion
    const notaPedido = await documentoApi.convertToNotaPedido({
      presupuestoId: presupuesto.id,
      metodoPago: 'EFECTIVO', // or get from user input
      tipoIva: presupuesto.tipoIva
    });

    setSnackbar({
      open: true,
      message: 'Nota de Pedido creada exitosamente',
      severity: 'success'
    });

    // Refresh data
    fetchData();
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Error al convertir a Nota de Pedido';

    // Check if it's the lead validation error from backend
    if (errorMessage.includes('Lead') && errorMessage.includes('Cliente')) {
      setConversionError({
        message: errorMessage,
        leadId: presupuesto.leadId
      });
    } else {
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  }
};
```

**Add a dialog to show the conversion error:**

```typescript
<Dialog
  open={Boolean(conversionError)}
  onClose={() => setConversionError(null)}
>
  <DialogTitle>No se puede crear Nota de Pedido</DialogTitle>
  <DialogContent>
    <Alert severity="warning" sx={{ mb: 2 }}>
      {conversionError?.message}
    </Alert>
    <Typography>
      Para continuar, debe:
    </Typography>
    <ol>
      <li>Convertir el Lead a Cliente primero</li>
      <li>Luego podrá generar la Nota de Pedido</li>
    </ol>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConversionError(null)}>
      Cancelar
    </Button>
    {conversionError?.leadId && (
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          // Navigate to lead conversion page
          window.location.href = `/leads/${conversionError.leadId}/convertir`;
        }}
      >
        Convertir Lead a Cliente
      </Button>
    )}
  </DialogActions>
</Dialog>
```

## 8. Update handleEditPresupuesto Function

**Find and update the edit handler** to properly set entityType:

```typescript
const handleEditPresupuesto = (presupuesto: DocumentoComercial, isReadOnly: boolean = false) => {
  setEditingPresupuesto(presupuesto);
  setReadOnly(isReadOnly);

  setFormData({
    entityType: presupuesto.leadId ? 'LEAD' : 'CLIENTE',  // Set based on what exists
    clienteId: presupuesto.clienteId?.toString() || "",
    leadId: presupuesto.leadId?.toString() || "",  // Add leadId
    usuarioId: presupuesto.usuarioId?.toString() || (user?.id ?? 0).toString(),
    fechaEmision: presupuesto.fechaEmision?.split("T")[0] || new Date().toISOString().split("T")[0],
    observaciones: presupuesto.observaciones || "",
    estado: presupuesto.estado,
    tipoIva: presupuesto.tipoIva || 'IVA_21',
  });

  // ... rest of the function
};
```

## Summary

These changes will:
1. Allow users to select between Cliente or Lead when creating a presupuesto
2. Display which presupuestos are linked to leads (with a chip indicator)
3. Prevent conversion of lead-based presupuestos to Nota de Pedido
4. Guide users to convert the lead to a cliente first
5. Properly handle all validation and error cases
