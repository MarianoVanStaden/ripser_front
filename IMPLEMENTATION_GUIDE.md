# Implementation Guide: Presupuestos with Leads

This guide outlines all the changes needed to allow creating presupuestos with Leads and enforce Cliente conversion before creating Nota de Pedido.

## Database Changes

### 1. Add leadId column to presupuestos table

```sql
-- Migration script
ALTER TABLE presupuestos
ADD COLUMN lead_id BIGINT NULL,
ADD INDEX idx_presupuesto_lead (lead_id),
MODIFY COLUMN cliente_id BIGINT NULL;

-- Add check constraint (optional, can be handled in application logic)
ALTER TABLE presupuestos
ADD CONSTRAINT chk_presupuesto_cliente_or_lead
CHECK ((cliente_id IS NOT NULL AND lead_id IS NULL) OR (cliente_id IS NULL AND lead_id IS NOT NULL));
```

### 2. Add leadId column to documentos_comerciales table

```sql
-- Migration script
ALTER TABLE documentos_comerciales
ADD COLUMN lead_id BIGINT NULL,
ADD INDEX idx_documento_lead (lead_id),
MODIFY COLUMN cliente_id BIGINT NULL;

-- Add check constraint (optional)
ALTER TABLE documentos_comerciales
ADD CONSTRAINT chk_documento_cliente_or_lead
CHECK ((cliente_id IS NOT NULL AND lead_id IS NULL) OR (cliente_id IS NULL AND lead_id IS NOT NULL));
```

## Backend Changes

### 1. Entity: Presupuesto.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\entities\Presupuesto.java`

Add after the `cliente` field (around line 43):

```java
    @ManyToOne
    @JoinColumn(name = "cliente_id")  // Remove nullable = false
    private Cliente cliente;

    @Column(name = "lead_id")
    private Long leadId;
```

### 2. Entity: DocumentoComercial.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\entities\DocumentoComercial.java`

Find the `cliente` field and modify:

```java
    @ManyToOne
    @JoinColumn(name = "cliente_id")  // Remove nullable = false if present
    private Cliente cliente;

    @Column(name = "lead_id")
    private Long leadId;
```

### 3. DTO: CreatePresupuestoDTO.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\dtos\CreatePresupuestoDTO.java`

Modify to make clienteId optional and add leadId:

```java
    private Long clienteId;  // Make nullable
    private Long leadId;     // Add new field

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotEmpty(message = "Debe incluir al menos un detalle")
    private List<DetalleDocumentoDTO> detalles;

    // Add validation method
    public boolean isValid() {
        return (clienteId != null && leadId == null) || (clienteId == null && leadId != null);
    }
```

### 4. DTO: PresupuestoDTO.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\dtos\PresupuestoDTO.java`

Add fields:

```java
    private Long clienteId;
    private String clienteNombre;  // Keep existing
    private Long leadId;           // Add new
    private String leadNombre;     // Add new
```

### 5. DTO: DocumentoComercialDTO.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\dtos\DocumentoComercialDTO.java`

Add fields:

```java
    private Long clienteId;
    private String clienteNombre;
    private Long leadId;           // Add new
    private String leadNombre;     // Add new
```

### 6. Service Implementation: PresupuestoServiceImpl.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\services\impl\PresupuestoServiceImpl.java`

Update the `createPresupuesto` method:

```java
@Override
@Transactional
public PresupuestoDTO createPresupuesto(CreatePresupuestoDTO createDTO) {
    // Validation: Must have either clienteId OR leadId
    if ((createDTO.getClienteId() == null && createDTO.getLeadId() == null) ||
        (createDTO.getClienteId() != null && createDTO.getLeadId() != null)) {
        throw new IllegalArgumentException("Debe proporcionar un Cliente o un Lead, pero no ambos");
    }

    Presupuesto presupuesto = new Presupuesto();

    // Set cliente or lead
    if (createDTO.getClienteId() != null) {
        Cliente cliente = clienteRepository.findById(createDTO.getClienteId())
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        presupuesto.setCliente(cliente);
    } else {
        // Validate lead exists
        leadRepository.findById(createDTO.getLeadId())
            .orElseThrow(() -> new ResourceNotFoundException("Lead no encontrado"));
        presupuesto.setLeadId(createDTO.getLeadId());
    }

    // ... rest of the method
}
```

Update the DTO mapping method:

```java
private PresupuestoDTO convertToDTO(Presupuesto presupuesto) {
    PresupuestoDTO dto = new PresupuestoDTO();
    // ... existing mappings

    if (presupuesto.getCliente() != null) {
        dto.setClienteId(presupuesto.getCliente().getId());
        dto.setClienteNombre(presupuesto.getCliente().getNombre() + " " + presupuesto.getCliente().getApellido());
    } else if (presupuesto.getLeadId() != null) {
        dto.setLeadId(presupuesto.getLeadId());
        // Fetch lead name
        leadRepository.findById(presupuesto.getLeadId()).ifPresent(lead -> {
            dto.setLeadNombre(lead.getNombre() + " " + lead.getApellido());
        });
    }

    return dto;
}
```

### 7. Service Implementation: DocumentoComercialServiceImpl.java

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\services\impl\DocumentoComercialServiceImpl.java`

Update the `createPresupuesto` method (similar to above):

```java
@Override
@Transactional
public DocumentoComercialDTO createPresupuesto(CreatePresupuestoDTO dto) {
    // Validation: Must have either clienteId OR leadId
    if ((dto.getClienteId() == null && dto.getLeadId() == null) ||
        (dto.getClienteId() != null && dto.getLeadId() != null)) {
        throw new IllegalArgumentException("Debe proporcionar un Cliente o un Lead, pero no ambos");
    }

    DocumentoComercial documento = new DocumentoComercial();
    documento.setTipoDocumento(TipoDocumento.PRESUPUESTO);

    // Set cliente or lead
    if (dto.getClienteId() != null) {
        Cliente cliente = clienteRepository.findById(dto.getClienteId())
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + dto.getClienteId()));
        documento.setCliente(cliente);
    } else {
        // Validate lead exists
        leadRepository.findById(dto.getLeadId())
            .orElseThrow(() -> new ResourceNotFoundException("Lead no encontrado con ID: " + dto.getLeadId()));
        documento.setLeadId(dto.getLeadId());
    }

    // ... rest of the method
}
```

**CRITICAL:** Update the `convertToNotaPedido` method to validate that the presupuesto has a Cliente:

```java
@Override
@Transactional
public DocumentoComercialDTO convertToNotaPedido(ConvertToNotaPedidoDTO dto) {
    // Get the presupuesto
    DocumentoComercial presupuesto = documentoRepository.findById(dto.getPresupuestoId())
        .orElseThrow(() -> new ResourceNotFoundException("Presupuesto no encontrado con ID: " + dto.getPresupuestoId()));

    // Validate that presupuesto type is PRESUPUESTO
    if (presupuesto.getTipoDocumento() != TipoDocumento.PRESUPUESTO) {
        throw new IllegalStateException("El documento no es un presupuesto");
    }

    // CRITICAL VALIDATION: Check if presupuesto has a Cliente (not a Lead)
    if (presupuesto.getLeadId() != null) {
        throw new IllegalStateException("No se puede crear una Nota de Pedido para un presupuesto asociado a un Lead. Debe convertir el Lead a Cliente primero.");
    }

    if (presupuesto.getCliente() == null) {
        throw new IllegalStateException("El presupuesto debe tener un Cliente asociado para crear una Nota de Pedido");
    }

    // ... rest of the conversion logic
}
```

### 8. Repository: Add LeadRepository injection

In both service implementations, add:

```java
@Autowired
private LeadRepository leadRepository;
```

### 9. Repository: PresupuestoRepository.java

Add method to find by leadId:

```java
List<Presupuesto> findByLeadId(Long leadId);
```

### 10. Repository: DocumentoComercialRepository.java

Add method:

```java
List<DocumentoComercial> findByLeadId(Long leadId);
List<DocumentoComercial> findByLeadIdAndTipoDocumento(Long leadId, TipoDocumento tipo);
```

### 11. Controller: Add endpoint to get presupuestos by Lead

**File:** `C:\Users\maria\ripser_back\src\main\java\com\ripser_back\controllers\DocumentoComercialController.java`

Add method:

```java
@GetMapping("/lead/{leadId}")
public ResponseEntity<List<DocumentoComercialDTO>> getDocumentosByLead(@PathVariable Long leadId) {
    List<DocumentoComercialDTO> documentos = documentoService.getDocumentosByLead(leadId);
    return ResponseEntity.ok(documentos);
}

@GetMapping("/lead/{leadId}/tipo/{tipo}")
public ResponseEntity<List<DocumentoComercialDTO>> getDocumentosByLeadAndTipo(
        @PathVariable Long leadId,
        @PathVariable TipoDocumento tipo) {
    List<DocumentoComercialDTO> documentos = documentoService.getDocumentosByLeadAndTipo(leadId, tipo);
    return ResponseEntity.ok(documentos);
}
```

Add corresponding service methods in DocumentoComercialService and implementation.

## Frontend Changes

See the updated files in the frontend codebase.

## Testing Checklist

- [ ] Create presupuesto with Cliente (existing functionality)
- [ ] Create presupuesto with Lead (new functionality)
- [ ] Try to create presupuesto without Cliente or Lead (should fail)
- [ ] Try to create presupuesto with both Cliente and Lead (should fail)
- [ ] Convert presupuesto with Cliente to Nota de Pedido (should work)
- [ ] Try to convert presupuesto with Lead to Nota de Pedido (should show validation error)
- [ ] Error message should guide user to convert Lead to Cliente
- [ ] Verify presupuestos display correctly showing Cliente or Lead name
- [ ] Test filtering presupuestos by Lead
- [ ] Test the complete flow: Lead → Presupuesto → Convert Lead to Cliente → Convert Presupuesto to Nota de Pedido
