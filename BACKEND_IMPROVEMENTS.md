# Backend Improvements - Search Enhancements

## 1. Implementar búsqueda de teléfono en `/api/clientes/search`

### Problema Actual
El endpoint `/api/clientes/search` no busca por teléfono, limitando la funcionalidad de filtrado en el frontend.

### Solución Recomendada

**Endpoint:** `GET /api/clientes/search`

Modificar la query para buscar en múltiples campos:

```sql
SELECT c FROM Cliente c
WHERE 
  LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
  OR LOWER(c.apellido) LIKE LOWER(CONCAT('%', :q, '%'))
  OR LOWER(c.razonSocial) LIKE LOWER(CONCAT('%', :q, '%'))
  OR LOWER(c.cuit) LIKE LOWER(CONCAT('%', :q, '%'))
  OR REPLACE(REPLACE(REPLACE(c.telefono, '-', ''), ' ', ''), '(', '') LIKE REPLACE(REPLACE(REPLACE(:q, '-', ''), ' ', ''), '(', '')
  OR LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%'))
```

### Beneficios
- ✅ Búsqueda de teléfono funciona sin depender del frontend
- ✅ Elimina la necesidad de traer 100+ resultados para filtrar localmente
- ✅ Mejora performance (menos datos transferidos)
- ✅ Consistente con el comportamiento de Leads

---

## 2. Mejorar DTO de Leads en respuesta paginada

### Problema Actual
`LeadListItemDTO` devuelve información limitada. Necesitamos más campos para mejorar la UI.

### Campos a agregar a `LeadListItemDTO`
- `email` - para mostrar en la lista (opcional)
- `estado` - estado del lead (NUEVO, EN_SEGUIMIENTO, CONVERTIDO, etc.)
- `prioridad` - para badge visual (ALTA, NORMAL, BAJA)
- `inicialesNombre` - iniciales para avatar (puede computarse en backend)

### Ejemplo mejorado:
```java
public class LeadListItemDTO {
    private Long id;
    private String nombre;
    private String apellido;
    private String telefono;
    private String email;  // NUEVO
    private String estado;  // NUEVO (ej: EN_SEGUIMIENTO)
    private String prioridad;  // NUEVO (ej: ALTA)
    // ... resto de campos
}
```

---

## 3. Endpoint de búsqueda específica para Leads

**Endpoint:** `GET /api/leads/search` (si no existe)

Similar a `/api/clientes/search`, debería buscar en:
- nombre, apellido, teléfono, email

---

## Impacto en Frontend

Con estos cambios en el backend, el frontend puede:
1. ✅ Eliminar filtrado local de teléfono (más confiable)
2. ✅ Mostrar mejor información en dropdowns
3. ✅ Unificar UI/UX entre clientes y leads
4. ✅ Mejorar performance (menos datos innecesarios)

---

## Tickets sugeridos

- [ ] [BACKEND] Agregar búsqueda de teléfono a `/api/clientes/search`
- [ ] [BACKEND] Mejorar `LeadListItemDTO` con email, estado, prioridad
- [ ] [BACKEND] Crear `/api/leads/search` si no existe
