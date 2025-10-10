# 🔧 FIX: EntregaViaje debe usar DocumentoComercial en lugar de Venta

## ❌ **Problema Identificado**

El frontend envía `ventaId` con el **ID de `documento_comercial` (facturas)**:

```typescript
// Frontend - TripsPage.tsx línea 304
ventaId: delivery.facturaId, // facturaId es el ID de DocumentoComercial
```

Pero el backend busca en la tabla **`venta`**:

```java
// Backend - EntregaViajeController.java
Venta venta = ventaRepository.findById(dto.getVentaId())
    .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con id: " + dto.getVentaId()));
```

**Resultado:** `Venta no encontrada con id: 34` → Error 404

---

## 🎯 **Root Cause**

Tu sistema tiene **dos entidades diferentes**:

1. **`DocumentoComercial`** → Facturas/Presupuestos/Notas de Pedido (la que muestra el frontend)
2. **`Venta`** → Registro de ventas realizadas (diferente tabla)

Los IDs **NO coinciden** entre estas dos tablas.

---

## ✅ **Solución 1: Cambiar Backend para usar DocumentoComercial (RECOMENDADO)**

### **Paso 1: Modificar la Entidad `EntregaViaje`**

**EntregaViaje.java:**
```java
package com.ripser_back.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "entrega_viaje")
public class EntregaViaje {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "viaje_id", nullable = false)
    private Viaje viaje;
    
    // ✅ CAMBIAR: En vez de Venta, usar DocumentoComercial
    @ManyToOne
    @JoinColumn(name = "documento_comercial_id", nullable = true)
    private DocumentoComercial documentoComercial;
    
    @ManyToOne
    @JoinColumn(name = "orden_servicio_id", nullable = true)
    private OrdenServicio ordenServicio;
    
    @Column(name = "direccion_entrega", nullable = false)
    private String direccionEntrega;
    
    @Column(name = "fecha_entrega", nullable = false)
    private LocalDateTime fechaEntrega;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoEntrega estado;
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(name = "receptor_nombre")
    private String receptorNombre;
    
    @Column(name = "receptor_dni")
    private String receptorDni;
    
    // Getters y Setters
    public DocumentoComercial getDocumentoComercial() {
        return documentoComercial;
    }
    
    public void setDocumentoComercial(DocumentoComercial documentoComercial) {
        this.documentoComercial = documentoComercial;
    }
    
    // ... resto de getters/setters
}
```

---

### **Paso 2: Actualizar el DTO `EntregaViajeDTO`**

**EntregaViajeDTO.java:**
```java
package com.ripser_back.dto.logistica;

import com.ripser_back.enums.EstadoEntrega;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class EntregaViajeDTO {
    
    private Long id;
    
    @NotNull(message = "El viaje es obligatorio")
    private Long viajeId;
    
    // ✅ CAMBIAR: documentoComercialId en vez de ventaId
    private Long documentoComercialId;
    
    private Long ordenServicioId;
    
    @NotNull(message = "La dirección de entrega es obligatoria")
    private String direccionEntrega;
    
    @NotNull(message = "La fecha de entrega es obligatoria")
    private LocalDateTime fechaEntrega;
    
    private EstadoEntrega estado;
    private String observaciones;
    private String receptorNombre;
    private String receptorDni;
    
    // Getters y Setters
    public Long getDocumentoComercialId() {
        return documentoComercialId;
    }
    
    public void setDocumentoComercialId(Long documentoComercialId) {
        this.documentoComercialId = documentoComercialId;
    }
    
    // ... resto de getters/setters
}
```

---

### **Paso 3: Actualizar el Controller `EntregaViajeController`**

**EntregaViajeController.java:**
```java
@PostMapping
public ResponseEntity<EntregaViaje> createEntrega(@Valid @RequestBody EntregaViajeDTO dto) {
    EntregaViaje entrega = new EntregaViaje();

    // Set viaje
    if (dto.getViajeId() != null) {
        Viaje viaje = viajeRepository.findById(dto.getViajeId())
                .orElseThrow(() -> new EntityNotFoundException("Viaje no encontrado con id: " + dto.getViajeId()));
        entrega.setViaje(viaje);
    }

    // ✅ CAMBIAR: Usar documentoComercialId
    if (dto.getDocumentoComercialId() != null) {
        DocumentoComercial documento = documentoComercialRepository.findById(dto.getDocumentoComercialId())
                .orElseThrow(() -> new EntityNotFoundException("Documento comercial no encontrado con id: " + dto.getDocumentoComercialId()));
        entrega.setDocumentoComercial(documento);
    }

    // Set orden servicio
    if (dto.getOrdenServicioId() != null) {
        OrdenServicio ordenServicio = ordenServicioRepository.findById(dto.getOrdenServicioId())
                .orElseThrow(() -> new EntityNotFoundException("OrdenServicio no encontrada con id: " + dto.getOrdenServicioId()));
        entrega.setOrdenServicio(ordenServicio);
    }

    entrega.setDireccionEntrega(dto.getDireccionEntrega());
    entrega.setFechaEntrega(dto.getFechaEntrega());
    entrega.setEstado(dto.getEstado() != null ? dto.getEstado() : EstadoEntrega.PENDIENTE);
    entrega.setObservaciones(dto.getObservaciones());
    entrega.setReceptorNombre(dto.getReceptorNombre());
    entrega.setReceptorDni(dto.getReceptorDni());

    EntregaViaje nuevaEntrega = entregaViajeRepository.save(entrega);
    return ResponseEntity.status(HttpStatus.CREATED).body(nuevaEntrega);
}
```

---

### **Paso 4: Agregar `DocumentoComercialRepository` al Controller**

**EntregaViajeController.java (arriba):**
```java
@RestController
@RequestMapping("/api/entregas-viaje")
@Validated
public class EntregaViajeController {

    @Autowired
    private EntregaViajeRepository entregaViajeRepository;

    @Autowired
    private ViajeRepository viajeRepository;

    // ✅ AGREGAR: Repository de DocumentoComercial
    @Autowired
    private DocumentoComercialRepository documentoComercialRepository;

    @Autowired
    private OrdenServicioRepository ordenServicioRepository;
    
    // ... resto del código
}
```

---

### **Paso 5: Actualizar el Repository `EntregaViajeRepository`**

**EntregaViajeRepository.java:**
```java
package com.ripser_back.repositories;

import com.ripser_back.entities.EntregaViaje;
import com.ripser_back.enums.EstadoEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EntregaViajeRepository extends JpaRepository<EntregaViaje, Long> {
    
    List<EntregaViaje> findByViaje_Id(Long viajeId);
    
    // ✅ CAMBIAR: findByDocumentoComercial_Id
    List<EntregaViaje> findByDocumentoComercial_Id(Long documentoComercialId);
    
    List<EntregaViaje> findByOrdenServicio_Id(Long ordenId);
    
    List<EntregaViaje> findByEstado(EstadoEntrega estado);
    
    List<EntregaViaje> findByFechaEntregaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
```

---

### **Paso 6: Actualizar el Endpoint GET**

**EntregaViajeController.java:**
```java
// ✅ CAMBIAR: Endpoint para obtener entregas por documento comercial
@GetMapping("/documento/{documentoId}")
public ResponseEntity<List<EntregaViaje>> getEntregasByDocumento(@PathVariable Long documentoId) {
    List<EntregaViaje> entregas = entregaViajeRepository.findByDocumentoComercial_Id(documentoId);
    return ResponseEntity.ok(entregas);
}

// ❌ REMOVER (si ya no usas Venta):
// @GetMapping("/venta/{ventaId}")
// public ResponseEntity<List<EntregaViaje>> getEntregasByVenta...
```

---

### **Paso 7: Migración de Base de Datos (SQL)**

```sql
-- Opción A: Si la columna venta_id no se usa, renombrarla
ALTER TABLE entrega_viaje 
RENAME COLUMN venta_id TO documento_comercial_id;

-- Opción B: Si necesitas mantener ambas columnas
ALTER TABLE entrega_viaje 
ADD COLUMN documento_comercial_id BIGINT;

ALTER TABLE entrega_viaje
ADD CONSTRAINT fk_entrega_documento 
FOREIGN KEY (documento_comercial_id) 
REFERENCES documento_comercial(id);

-- Migrar datos existentes (si venta_id contenía IDs de documentos)
-- UPDATE entrega_viaje SET documento_comercial_id = venta_id WHERE venta_id IS NOT NULL;

-- Luego, si quieres eliminar venta_id:
-- ALTER TABLE entrega_viaje DROP COLUMN venta_id;
```

---

## ✅ **Solución 2: Mapear DocumentoComercial → Venta en el Frontend**

Si cada `DocumentoComercial` tiene un campo `ventaId`, puedes mapear en el frontend antes de enviar.

**TripsPage.tsx:**
```typescript
// Línea 304 - cambiar:
ventaId: delivery.factura?.ventaId || delivery.facturaId,
```

Pero esto **solo funciona si DocumentoComercial tiene un campo `ventaId`** que apunta a la tabla `venta`.

---

## 🎯 **Recomendación**

Usa **Solución 1** (cambiar backend para usar `DocumentoComercial`) porque:

✅ El frontend ya está cargando `DocumentoComercial` (facturas)  
✅ El Autocomplete muestra facturas de `documento_comercial`  
✅ Es más consistente con el flujo actual  
✅ Evita mapeos complicados  

---

## 📝 **Checklist de Validación**

Después de aplicar la Solución 1:

```bash
# 1. Aplicar los cambios en el código Java
# 2. Ejecutar migración SQL (renombrar columna)
# 3. Reiniciar el backend
# 4. Verificar en Postman/frontend
```

**Test en Postman:**
```json
POST /api/entregas-viaje
{
  "viajeId": 23,
  "documentoComercialId": 34,
  "direccionEntrega": "Test Address",
  "fechaEntrega": "2025-10-25T12:00:00",
  "estado": "PENDIENTE"
}
```

Debería devolver **201 Created** si el `documento_comercial` con ID 34 existe.

---

## 🚨 **Nota Importante**

**NO** necesitas cambiar el frontend si aplicas la Solución 1. Solo necesitas:

1. Renombrar `ventaId` → `documentoComercialId` en el **DTO** del backend
2. Cambiar la **entidad** para usar `DocumentoComercial` en vez de `Venta`
3. Actualizar el **Repository** y **Controller**

El frontend ya está enviando el ID correcto (`delivery.facturaId`), solo que el backend lo está interpretando mal.
