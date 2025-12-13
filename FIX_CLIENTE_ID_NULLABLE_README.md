# Fix: Cliente ID Nullable & Duplicate Keys

## Problema 1: Column 'cliente_id' cannot be null

### Causa
El campo `cliente_id` en la tabla `documentos_comerciales` no permite valores NULL, pero necesitamos crear presupuestos para leads que aún no son clientes.

### Solución Backend

#### 1. Ejecutar migración SQL
Ejecuta el archivo `FIX_CLIENTE_ID_NULLABLE.sql` en tu base de datos:

```sql
ALTER TABLE documentos_comerciales 
MODIFY COLUMN cliente_id BIGINT NULL;
```

#### 2. Verificar Entity en el backend
Asegúrate de que la entidad `DocumentoComercial` tenga `cliente_id` como nullable:

```java
@Entity
@Table(name = "documentos_comerciales")
public class DocumentoComercial {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = true)  // ← Debe ser nullable = true
    private Cliente cliente;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = true)
    private Lead lead;
    
    // Resto del código...
}
```

#### 3. Agregar validación en el servicio (opcional pero recomendado)
```java
@Service
public class DocumentoComercialService {
    
    public DocumentoComercial crearPresupuesto(DocumentoComercialDTO dto) {
        // Validar que al menos uno esté presente
        if (dto.getClienteId() == null && dto.getLeadId() == null) {
            throw new IllegalArgumentException("Debe especificar un cliente o un lead");
        }
        
        // No permitir ambos al mismo tiempo
        if (dto.getClienteId() != null && dto.getLeadId() != null) {
            throw new IllegalArgumentException("No puede especificar cliente y lead simultáneamente");
        }
        
        // Resto del código...
    }
}
```

## Problema 2: Duplicate Keys in Autocomplete

### Causa
Múltiples leads tienen el mismo nombre "Manuela", lo que genera claves duplicadas en React porque usaba solo el nombre como identificador.

### Solución Frontend
Agregué `getOptionKey` al componente Autocomplete para generar claves únicas combinando el tipo y el ID:

```tsx
<Autocomplete
  getOptionKey={(option) => `${option.type}-${option.id}`}
  // resto del código...
/>
```

Esto genera claves como:
- `cliente-5`
- `lead-2`
- `lead-3`

Garantizando unicidad incluso con nombres duplicados.

## Testing

### 1. Verificar migración de BD
```sql
-- Verificar que cliente_id es nullable
DESCRIBE documentos_comerciales;
-- Debe mostrar: cliente_id | bigint | YES

-- Verificar datos existentes
SELECT COUNT(*) FROM documentos_comerciales WHERE cliente_id IS NULL AND lead_id IS NOT NULL;
```

### 2. Probar creación de presupuesto con lead
1. Abre el formulario de nuevo presupuesto
2. Selecciona un Lead (no un Cliente) del Autocomplete
3. Agrega productos/equipos
4. Guarda
5. Verifica que se crea correctamente sin error de `cliente_id`

### 3. Verificar que no hay warnings en consola
- No debe aparecer el warning de "duplicate keys"
- El Autocomplete debe funcionar correctamente con múltiples leads del mismo nombre

## Cambios Realizados

### Archivos modificados:
1. ✅ `FIX_CLIENTE_ID_NULLABLE.sql` - Migración SQL
2. ✅ `src/components/Ventas/PresupuestosPage.tsx` - Fix duplicate keys

### Archivos que debes revisar en el backend:
1. Entity `DocumentoComercial.java` - Verificar `nullable = true`
2. Service/Controller - Agregar validación cliente/lead
