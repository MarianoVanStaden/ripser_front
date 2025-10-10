# 🔥 SOLUCIÓN: Venta not found with id: 40

## ❌ **Problema Identificado**

El error real NO es un problema de permisos (403). El backend está lanzando:

```
java.lang.RuntimeException: Venta not found with id: 40
```

**Pero el usuario ve 403 Forbidden** porque el `ExceptionHandler` global está mal configurado.

---

## 🎯 **Diagnóstico**

### **Lo que sucede:**

1. Frontend envía:
```json
{
  "viajeId": 20,
  "ventaId": 40,  // ← Esta venta NO existe en la base de datos
  "direccionEntrega": "...",
  "fechaEntrega": "...",
  "estado": "PENDIENTE"
}
```

2. Backend intenta buscar la venta:
```java
Venta venta = ventaRepository.findById(40)
    .orElseThrow(() -> new RuntimeException("Venta not found with id: 40"));
```

3. **La venta 40 no existe**, entonces lanza `RuntimeException`

4. El `@ControllerAdvice` o `ExceptionHandler` captura la excepción y devuelve **403** (código de estado incorrecto)

---

## ✅ **Soluciones**

### **Solución 1: Hacer ventaId Opcional (Recomendado)**

Si las entregas no siempre están asociadas a una venta/factura:

**EntregaViajeService.java:**
```java
@Service
public class EntregaViajeService {
    
    @Autowired
    private EntregaViajeRepository entregaRepository;
    
    @Autowired
    private VentaRepository ventaRepository;
    
    @Autowired
    private ViajeRepository viajeRepository;
    
    public EntregaViaje create(EntregaViajeDTO dto) {
        EntregaViaje entrega = new EntregaViaje();
        
        // ✅ Validar y asignar venta solo si ventaId está presente
        if (dto.getVentaId() != null) {
            Venta venta = ventaRepository.findById(dto.getVentaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Venta/Factura no encontrada con ID: " + dto.getVentaId()
                ));
            entrega.setVenta(venta);
        }
        
        // Validar y asignar viaje (obligatorio)
        Viaje viaje = viajeRepository.findById(dto.getViajeId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Viaje no encontrado con ID: " + dto.getViajeId()
            ));
        entrega.setViaje(viaje);
        
        // Asignar el resto de campos
        entrega.setDireccionEntrega(dto.getDireccionEntrega());
        entrega.setFechaEntrega(dto.getFechaEntrega());
        entrega.setObservaciones(dto.getObservaciones());
        entrega.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoEntrega.PENDIENTE);
        
        return entregaRepository.save(entrega);
    }
}
```

**EntregaViaje.java (Entity):**
```java
@Entity
@Table(name = "entrega_viaje")
public class EntregaViaje {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "viaje_id", nullable = false)
    private Viaje viaje;
    
    @ManyToOne
    @JoinColumn(name = "venta_id", nullable = true) // ← Hacer nullable
    private Venta venta;
    
    // Resto de campos...
}
```

---

### **Solución 2: Crear Custom Exception y Mejorar ExceptionHandler**

**ResourceNotFoundException.java:**
```java
package com.ripser.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

**GlobalExceptionHandler.java:**
```java
package com.ripser.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    // ✅ Manejar recursos no encontrados como 404
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Resource Not Found");
        response.put("message", ex.getMessage());
        response.put("status", 404);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    // ✅ Manejar errores de validación como 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Bad Request");
        response.put("message", ex.getMessage());
        response.put("status", 400);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    // ⚠️ RuntimeException genérica - NO usar 403
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Internal Server Error");
        response.put("message", ex.getMessage());
        response.put("status", 500);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

**Luego actualizar EntregaViajeService.java:**
```java
// En vez de RuntimeException, usar ResourceNotFoundException
Venta venta = ventaRepository.findById(dto.getVentaId())
    .orElseThrow(() -> new ResourceNotFoundException(
        "Venta not found with id: " + dto.getVentaId()
    ));
```

---

### **Solución 3: Verificar Datos en la Base de Datos**

**Ejecutar en SQL:**

```sql
-- Ver todas las ventas disponibles
SELECT id, fecha_venta, total, cliente_id, estado 
FROM venta 
ORDER BY id DESC 
LIMIT 20;

-- Verificar si existe la venta 40
SELECT * FROM venta WHERE id = 40;

-- Ver los IDs disponibles para entregas
SELECT v.id, v.fecha_venta, v.total, c.nombre AS cliente
FROM venta v
LEFT JOIN cliente c ON v.cliente_id = c.id
WHERE v.estado = 'PENDIENTE' OR v.estado = 'CONFIRMADA'
ORDER BY v.id DESC;
```

**Si la venta 40 no existe:**
- ¿De dónde viene el ID 40 en el frontend?
- ¿Está usando datos viejos/cache?
- ¿El Autocomplete de facturas está mostrando IDs incorrectos?

---

## 🔧 **Fix Inmediato para Probar**

### **Opción A: Cambiar el ID en el Frontend (Temporal)**

Busca un ID de venta que SÍ exista en tu base de datos y prueba con ese.

### **Opción B: Hacer ventaId Opcional en el Backend**

Aplica la **Solución 1** arriba para permitir entregas sin venta asociada.

---

## 📝 **Checklist de Validación**

Después de aplicar las soluciones, verificar:

```bash
# 1. Reiniciar el backend
# 2. Verificar en la consola del backend que se inició correctamente
# 3. Probar desde el frontend
# 4. Si falla, revisar logs del backend para ver la excepción real
# 5. Si funciona, ver la respuesta JSON del backend
```

---

## 🎯 **Próximos Pasos**

1. **INMEDIATO**: Aplicar **Solución 1** (hacer ventaId opcional) o **Solución 2** (custom exceptions)
2. Verificar que la tabla `venta` tiene registros con:
   ```sql
   SELECT COUNT(*) FROM venta;
   SELECT id FROM venta ORDER BY id DESC LIMIT 10;
   ```
3. Reiniciar backend y probar
4. Revisar logs del backend (no solo del frontend) para ver stack trace completo

---

## 🚨 **Nota Importante**

El **403 Forbidden** es un **código de estado incorrecto** para "recurso no encontrado". 

**Códigos HTTP correctos:**
- `404 Not Found` → Cuando el recurso no existe (venta 40)
- `400 Bad Request` → Cuando los datos del request son inválidos
- `403 Forbidden` → Cuando el usuario NO tiene permisos (pero el recurso existe)
- `401 Unauthorized` → Cuando NO está autenticado

**Tu backend está usando 403 para errores que NO son de permisos.**
