-- Database Migration: Add Lead Support to Presupuestos and Documentos Comerciales
-- Execute these statements in order

-- =============================================================================
-- 1. ADD LEAD_ID COLUMN TO PRESUPUESTOS TABLE
-- =============================================================================

-- Add lead_id column (nullable)
ALTER TABLE presupuestos
ADD COLUMN lead_id BIGINT NULL;

-- Add index for better query performance
CREATE INDEX idx_presupuesto_lead ON presupuestos(lead_id);

-- Make cliente_id nullable (was previously NOT NULL)
ALTER TABLE presupuestos
MODIFY COLUMN cliente_id BIGINT NULL;

-- Add check constraint to ensure either cliente_id OR lead_id is present (optional, can be handled in application)
-- Note: MySQL 8.0.16+ supports CHECK constraints
ALTER TABLE presupuestos
ADD CONSTRAINT chk_presupuesto_cliente_or_lead
CHECK (
    (cliente_id IS NOT NULL AND lead_id IS NULL) OR
    (cliente_id IS NULL AND lead_id IS NOT NULL)
);

-- =============================================================================
-- 2. ADD LEAD_ID COLUMN TO DOCUMENTOS_COMERCIALES TABLE
-- =============================================================================

-- Add lead_id column (nullable)
ALTER TABLE documentos_comerciales
ADD COLUMN lead_id BIGINT NULL;

-- Add index for better query performance
CREATE INDEX idx_documento_lead ON documentos_comerciales(lead_id);

-- Make cliente_id nullable (was previously NOT NULL)
ALTER TABLE documentos_comerciales
MODIFY COLUMN cliente_id BIGINT NULL;

-- Add check constraint to ensure either cliente_id OR lead_id is present (optional)
-- Note: MySQL 8.0.16+ supports CHECK constraints
ALTER TABLE documentos_comerciales
ADD CONSTRAINT chk_documento_cliente_or_lead
CHECK (
    (cliente_id IS NOT NULL AND lead_id IS NULL) OR
    (cliente_id IS NULL AND lead_id IS NOT NULL)
);

-- =============================================================================
-- 3. VERIFY THE CHANGES
-- =============================================================================

-- View presupuestos table structure
DESCRIBE presupuestos;

-- View documentos_comerciales table structure
DESCRIBE documentos_comerciales;

-- View constraints (MySQL 8.0+)
SELECT
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM
    INFORMATION_SCHEMA.CHECK_CONSTRAINTS
WHERE
    TABLE_NAME IN ('presupuestos', 'documentos_comerciales');

-- =============================================================================
-- 4. ROLLBACK SCRIPT (if needed)
-- =============================================================================

-- Uncomment the following if you need to rollback the changes:

/*
-- Remove constraints
ALTER TABLE presupuestos DROP CONSTRAINT IF EXISTS chk_presupuesto_cliente_or_lead;
ALTER TABLE documentos_comerciales DROP CONSTRAINT IF EXISTS chk_documento_cliente_or_lead;

-- Remove indexes
DROP INDEX IF EXISTS idx_presupuesto_lead ON presupuestos;
DROP INDEX IF EXISTS idx_documento_lead ON documentos_comerciales;

-- Remove lead_id columns
ALTER TABLE presupuestos DROP COLUMN IF EXISTS lead_id;
ALTER TABLE documentos_comerciales DROP COLUMN IF EXISTS lead_id;

-- Restore cliente_id as NOT NULL (only if all rows have cliente_id)
-- WARNING: This will fail if there are any rows with NULL cliente_id
ALTER TABLE presupuestos MODIFY COLUMN cliente_id BIGINT NOT NULL;
ALTER TABLE documentos_comerciales MODIFY COLUMN cliente_id BIGINT NOT NULL;
*/

-- =============================================================================
-- 5. NOTES
-- =============================================================================

/*
IMPORTANT NOTES:

1. CHECK Constraints:
   - CHECK constraints are supported in MySQL 8.0.16 and later
   - If you're using an older version of MySQL, remove the CHECK constraint
     statements and handle validation in the application layer

2. Data Migration:
   - All existing presupuestos and documentos_comerciales have cliente_id set
   - No data migration is needed for existing records
   - New records will use either cliente_id OR lead_id

3. Foreign Keys:
   - We intentionally did NOT add a foreign key constraint for lead_id
   - This is because the Lead table might be in a different schema/database
   - Or you may want to handle referential integrity at the application level
   - If you want to add FK constraint, use:
     ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuesto_lead
         FOREIGN KEY (lead_id) REFERENCES leads(id);
     ALTER TABLE documentos_comerciales ADD CONSTRAINT fk_documento_lead
         FOREIGN KEY (lead_id) REFERENCES leads(id);

4. Testing:
   - Before running in production, test in a development/staging environment
   - Verify that existing presupuestos still load correctly
   - Test creating presupuestos with both clientes and leads
   - Test the validation that prevents creating Nota de Pedido from lead-based presupuestos

5. Backup:
   - Always backup your database before running migrations
   - mysqldump -u username -p database_name > backup_before_migration.sql
*/
