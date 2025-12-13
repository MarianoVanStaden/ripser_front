-- Migration: Make cliente_id nullable in documentos_comerciales table
-- This allows creating presupuestos with leads instead of clients

-- Make cliente_id nullable
ALTER TABLE documentos_comerciales 
MODIFY COLUMN cliente_id BIGINT NULL;

-- Add check constraint to ensure either cliente_id or lead_id is present
-- (Optional - uncomment if you want to enforce this at DB level)
-- ALTER TABLE documentos_comerciales
-- ADD CONSTRAINT chk_cliente_or_lead 
-- CHECK (cliente_id IS NOT NULL OR lead_id IS NOT NULL);

-- Verify the change
DESCRIBE documentos_comerciales;
