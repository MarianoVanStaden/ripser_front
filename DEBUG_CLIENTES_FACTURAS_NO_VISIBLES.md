# 🐛 DEBUG: Clientes y Facturas No Se Muestran en Tabla de Viajes

## 📋 **Problema Reportado**

Cuando creas un viaje con entregas asociadas a facturas, la tabla muestra:
```
#26  Sin clientes  Sin facturas  ...
```

Pero las entregas SÍ existen (muestra "1 entregas").

---

## 🔍 **Diagnóstico con Logs Agregados**

He agregado logs de debug en el código para identificar el problema. 

### **Cómo Verificar:**

1. **Abre la consola del navegador** (F12 → Console)

2. **Recarga la página de Viajes**

3. **Busca estos logs:**

```
✅ Entregas cargadas: X [...]
🔍 Primera entrega (para ver estructura): { ... }
🔍 Campos de IDs en entregas: [...]
```

4. **Cuando veas un viaje en la tabla, busca:**

```
🔍 Entregas del viaje #26: [...]
🔍 ventaIds encontrados: [...]
🔍 IDs de facturas encontrados para viaje #26: [...]
🔍 Facturas encontradas para viaje #26: [...]
```

---

## 🎯 **Posibles Causas**

### **Causa 1: Backend ya aplicó el fix y usa `documentoComercialId`**

Si el backend cambió `ventaId` por `documentoComercialId`, las entregas ahora se ven así:

```json
{
  "id": 1,
  "viajeId": 26,
  "documentoComercialId": 34,  // ← Nuevo campo
  "direccionEntrega": "...",
  "estado": "PENDIENTE"
}
```

**Solución aplicada:** El código ahora busca en ambos campos:
```typescript
const facturaId = d.ventaId || d.documentoComercialId;
```

---

### **Causa 2: Backend no devuelve el ID de factura/documento**

Si las entregas devueltas por el backend no incluyen `ventaId` ni `documentoComercialId`:

```json
{
  "id": 1,
  "viajeId": 26,
  // ❌ No hay ventaId ni documentoComercialId
  "direccionEntrega": "...",
  "estado": "PENDIENTE"
}
```

**Fix necesario en el backend:**

El DTO `EntregaViaje` debe incluir el campo en la respuesta:

```java
// EntregaViajeDTO.java
public class EntregaViajeDTO {
    private Long id;
    private Long viajeId;
    private Long documentoComercialId; // ← Debe estar presente
    // ... otros campos
    
    // Getters y Setters
}
```

Y el Controller debe mapearlo:

```java
@GetMapping
public ResponseEntity<List<EntregaViajeDTO>> getAllEntregas() {
    List<EntregaViaje> entregas = entregaViajeRepository.findAll();
    
    List<EntregaViajeDTO> dtos = entregas.stream()
        .map(e -> {
            EntregaViajeDTO dto = new EntregaViajeDTO();
            dto.setId(e.getId());
            dto.setViajeId(e.getViaje().getId());
            
            // ✅ IMPORTANTE: Incluir el documentoComercialId
            if (e.getDocumentoComercial() != null) {
                dto.setDocumentoComercialId(e.getDocumentoComercial().getId());
            }
            
            dto.setDireccionEntrega(e.getDireccionEntrega());
            dto.setFechaEntrega(e.getFechaEntrega());
            dto.setEstado(e.getEstado());
            // ... otros campos
            
            return dto;
        })
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(dtos);
}
```

---

### **Causa 3: El backend devuelve objeto `venta` anidado en vez de `ventaId`**

Si el backend devuelve:

```json
{
  "id": 1,
  "viajeId": 26,
  "venta": {  // ← Objeto completo en vez de solo el ID
    "id": 40,
    "total": 1200,
    ...
  },
  "direccionEntrega": "..."
}
```

**Fix en el frontend (aplicar si los logs muestran esto):**

```typescript
const facturaIds = tripDeliveries
  .map(d => {
    // Intentar obtener el ID de varias formas
    return d.ventaId || 
           d.documentoComercialId || 
           d.venta?.id ||  // ← Agregar esto
           // @ts-ignore
           d.documentoComercial?.id;
  })
  .filter((id): id is number => id !== undefined && id !== null);
```

---

### **Causa 4: Las facturas no se están cargando correctamente**

Verifica en la consola:

```
✅ Facturas cargadas: 26 [...]
```

Si ves `0` facturas, el problema es que no se están cargando los documentos comerciales.

**Fix:** Verificar el endpoint `/api/documentos/tipo/FACTURA` en el backend.

---

## ✅ **Pasos para Resolver**

### **Paso 1: Ver los logs**

1. Abre la consola del navegador
2. Recarga la página de Viajes
3. Copia todos los logs que empiecen con `🔍` o `✅`
4. Compártelos para diagnosticar el problema exacto

### **Paso 2: Según los logs, aplicar el fix correcto**

| Lo que ves en los logs | Solución |
|------------------------|----------|
| `documentoComercialId: 34` | ✅ **Ya está arreglado** en el código (debería funcionar automáticamente) |
| `ventaId: undefined, documentoComercialId: undefined` | ❌ **Backend no devuelve el ID** → Aplicar fix en el Controller del backend |
| `venta: { id: 34, ... }` | ✅ **Necesita agregar** `d.venta?.id` en el código frontend |
| `Facturas cargadas: 0` | ❌ **Endpoint de facturas falla** → Verificar `/api/documentos/tipo/FACTURA` |

### **Paso 3: Verificar que funciona**

Después de aplicar el fix:

1. Recarga la página
2. Los logs deberían mostrar:
   ```
   🔍 IDs de facturas encontrados para viaje #26: [34, 51]
   🔍 Facturas encontradas para viaje #26: ['FAC-001', 'FAC-002']
   ```
3. La tabla debería mostrar los clientes y facturas

---

## 🎯 **Resultado Esperado**

Después del fix, la tabla debería mostrar:

```
#26  👤 Cliente A     📄 FAC-001      Cristian    Toyota     MENDOZA
     👤 Cliente B     $1,200          Venezuela   Hilux
     2 clientes       📄 FAC-002
                      $850
                      2 facturas
```

---

## 📞 **Qué Compartir para Ayuda**

Si el problema persiste, comparte:

1. **Logs de la consola** (los que empiezan con 🔍)
2. **Response del endpoint** `/api/entregas-viaje` (Network tab en DevTools)
3. **¿El backend ya aplicó el fix de `documentoComercialId`?** (Sí/No)
