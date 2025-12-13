# Presupuestos con Leads - Implementation Guide

## Overview

This implementation allows creating presupuestos (budgets/quotes) with either **Clientes** (customers) or **Leads** (prospects). When converting a presupuesto to a Nota de Pedido (sales order), the system will validate that it's associated with a Cliente, not a Lead. If it's still a Lead, the user will be prompted to convert the Lead to Cliente first.

## Files Created

I've created three comprehensive guides for you:

1. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Backend changes with detailed code snippets
2. **[FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md)** - Frontend changes with React component updates
3. **[DATABASE_MIGRATION.sql](./DATABASE_MIGRATION.sql)** - SQL migration scripts

## Implementation Steps

### Step 1: Database Migration

1. **Backup your database first!**
   ```bash
   mysqldump -u username -p database_name > backup_before_migration.sql
   ```

2. **Run the migration script:**
   - Open your MySQL client
   - Connect to your database
   - Execute the script: `DATABASE_MIGRATION.sql`
   - Verify the changes worked correctly

**What it does:**
- Adds `lead_id` column to `presupuestos` table
- Adds `lead_id` column to `documentos_comerciales` table
- Makes `cliente_id` nullable in both tables
- Adds indexes for performance
- Adds CHECK constraints to ensure either cliente_id OR lead_id is present (MySQL 8.0.16+)

### Step 2: Backend Changes

Follow the instructions in [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md).

**Key files to modify in `C:\Users\maria\ripser_back`:**

1. **Entities:**
   - `src/main/java/com/ripser_back/entities/Presupuesto.java`
   - `src/main/java/com/ripser_back/entities/DocumentoComercial.java`

2. **DTOs:**
   - `src/main/java/com/ripser_back/dtos/CreatePresupuestoDTO.java`
   - `src/main/java/com/ripser_back/dtos/PresupuestoDTO.java`
   - `src/main/java/com/ripser_back/dtos/DocumentoComercialDTO.java`

3. **Services:**
   - `src/main/java/com/ripser_back/services/impl/PresupuestoServiceImpl.java`
   - `src/main/java/com/ripser_back/services/impl/DocumentoComercialServiceImpl.java`

4. **Repositories:**
   - `src/main/java/com/ripser_back/repositories/PresupuestoRepository.java`
   - `src/main/java/com/ripser_back/repositories/DocumentoComercialRepository.java`

5. **Controllers:**
   - `src/main/java/com/ripser_back/controllers/DocumentoComercialController.java`

**Important:** Pay special attention to the `convertToNotaPedido` method in `DocumentoComercialServiceImpl.java`. This is where the validation happens to prevent converting lead-based presupuestos.

### Step 3: Frontend Changes

Follow the instructions in [FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md).

**Key file to modify:**
- `src/components/Ventas/PresupuestosPage.tsx`

**Key changes:**
1. Add `leadId` and `entityType` to FormData interface
2. Fetch leads data alongside clientes
3. Add radio buttons to select between Cliente/Lead
4. Conditionally render cliente or lead selector
5. Update payload to send either clienteId or leadId
6. Add error handling for conversion validation
7. Add dialog to guide users to convert lead to cliente

**Already completed:**
- ✅ TypeScript types updated in `src/types/index.ts`
- ✅ `DocumentoComercial` interface now includes `leadId` and `leadNombre`
- ✅ `CreatePresupuestoRequest` interface updated

### Step 4: Testing

After implementing all changes:

1. **Test presupuesto creation with Cliente:**
   - Create a new presupuesto
   - Select "Cliente" radio button
   - Choose a cliente from the dropdown
   - Add line items
   - Save and verify it appears in the list

2. **Test presupuesto creation with Lead:**
   - Create a new presupuesto
   - Select "Lead" radio button
   - Choose a lead from the dropdown
   - Add line items
   - Save and verify it appears with a "Lead" chip indicator

3. **Test conversion validation:**
   - Try to convert a presupuesto with Lead to Nota de Pedido
   - Verify error message appears
   - Verify button to "Convert Lead to Cliente" is shown

4. **Test the complete flow:**
   - Create presupuesto with Lead
   - Convert the Lead to Cliente (using existing lead conversion page)
   - Now convert the presupuesto to Nota de Pedido (should work)

5. **Test validation:**
   - Try creating presupuesto without selecting either Cliente or Lead (should fail)
   - Verify can't save with empty selection

## Architecture Decisions

### Why allow presupuestos with Leads?

In a sales process, you often want to create quotes for prospects (Leads) before they become customers (Clientes). This allows:
- Sales team to create formal quotes during negotiation
- Tracking of proposed deals even before conversion
- Better sales pipeline visibility

### Why prevent Nota de Pedido for Leads?

A Nota de Pedido represents a confirmed sales order - this should only exist for actual customers (Clientes), not prospects. This enforces:
- Clean data model
- Proper sales process (Lead → Cliente → Sale)
- Compliance with business rules

### Why validate at both frontend and backend?

- **Frontend validation:** Better UX, immediate feedback to users
- **Backend validation:** Security, data integrity, API contract enforcement

## Database Design

```
Lead (prospect)
    ↓ can have multiple presupuestos
Presupuesto (quote) ← has either cliente_id OR lead_id
    ↓ conversion only allowed if has cliente_id
Nota de Pedido (sales order) ← requires cliente_id
    ↓
Factura (invoice)
```

## API Changes

### New Request Format

**Create Presupuesto with Cliente:**
```json
{
  "clienteId": 123,
  "usuarioId": 5,
  "tipoIva": "IVA_21",
  "detalles": [...]
}
```

**Create Presupuesto with Lead:**
```json
{
  "leadId": 456,
  "usuarioId": 5,
  "tipoIva": "IVA_21",
  "detalles": [...]
}
```

### Error Responses

**Attempting to convert lead-based presupuesto:**
```json
{
  "status": 400,
  "message": "No se puede crear una Nota de Pedido para un presupuesto asociado a un Lead. Debe convertir el Lead a Cliente primero.",
  "timestamp": "2025-12-12T..."
}
```

## Troubleshooting

### Issue: CHECK constraint error

**Solution:** Your MySQL version doesn't support CHECK constraints (pre-8.0.16). Comment out the CHECK constraint lines in the migration script and rely on application-level validation.

### Issue: Can't modify backend files

**Solution:** The backend files are experiencing permission issues. You may need to:
1. Close your IDE and reopen it
2. Ensure the backend project isn't running
3. Check file permissions
4. Try editing the files directly in your IDE instead of through Claude Code

### Issue: Frontend shows both Cliente and Lead selectors

**Solution:** Check that the conditional rendering is correct - it should use `formData.entityType === 'CLIENTE'` for the ternary operator.

### Issue: Presupuestos not showing lead names

**Solution:** Verify that the backend is properly populating `leadNombre` in the DTO mapping method.

## Support

If you encounter issues:
1. Check the implementation guides for detailed code snippets
2. Verify database migrations completed successfully
3. Check backend logs for validation errors
4. Check browser console for frontend errors
5. Verify API responses in Network tab

## Next Steps

After implementing these changes, you may want to consider:
1. Adding bulk actions to convert multiple leads to clientes
2. Adding a "Presupuestos" tab in the Lead detail page
3. Adding analytics for conversion rates (Lead → Presupuesto → Cliente → Nota de Pedido)
4. Adding email functionality to send presupuestos to leads

---

**Note:** Due to permission issues with editing the backend files directly, I've provided comprehensive guides instead. You'll need to apply these changes manually by copying the code snippets into the respective files.
