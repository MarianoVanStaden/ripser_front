# 🔧 FIX URGENTE: Backend No Popula documentoComercial en Entregas

## ❌ **Problema Actual**

Cuando se consultan las entregas vía **GET `/api/entregas-viaje`**, el backend devuelve:

```json
{
  "id": 31,
  "viajeId": 27,
  "documentoComercial": null,  // ❌ Debería tener el objeto o al menos el ID
  "direccionEntrega": "Mariano - Ver detalles de factura",
  "fechaEntrega": "2025-10-11T...",
  "estado": "PENDIENTE"
}
```

**Pero la entrega SÍ tiene un documento comercial asociado** (se creó con `ventaId: 34`).

---

## 🎯 **Root Cause**

El backend tiene dos problemas:

1. **El DTO no incluye `documentoComercialId`**
2. **La entidad no está cargando la relación** (`documentoComercial: null` incluso cuando existe)

---

## ✅ **Solución 1: Agregar `documentoComercialId` al DTO (RECOMENDADO)**

Esta es la solución **más eficiente** porque solo envía el ID en vez del objeto completo.

### **Paso 1: Actualizar `EntregaViajeDTO`**

```java
package com.ripser_back.dto.logistica;

import com.ripser_back.enums.EstadoEntrega;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntregaViajeDTO {
    
    private Long id;
    
    @NotNull(message = "El viaje es obligatorio")
    private Long viajeId;
    
    // ✅ AGREGAR: ID del documento comercial
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
}
```

---

### **Paso 2: Actualizar `EntregaViajeController` - Método GET**

```java
@GetMapping
public ResponseEntity<List<EntregaViajeDTO>> getAllEntregas() {
    List<EntregaViaje> entregas = entregaViajeRepository.findAll();
    
    List<EntregaViajeDTO> dtos = entregas.stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(dtos);
}

@GetMapping("/{id}")
public ResponseEntity<EntregaViajeDTO> getEntregaById(@PathVariable Long id) {
    Optional<EntregaViaje> entrega = entregaViajeRepository.findById(id);
    return entrega
        .map(e -> ResponseEntity.ok(convertToDTO(e)))
        .orElse(ResponseEntity.notFound().build());
}

@GetMapping("/viaje/{viajeId}")
public ResponseEntity<List<EntregaViajeDTO>> getEntregasByViaje(@PathVariable Long viajeId) {
    List<EntregaViaje> entregas = entregaViajeRepository.findByViaje_Id(viajeId);
    
    List<EntregaViajeDTO> dtos = entregas.stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(dtos);
}

// ✅ AGREGAR: Método helper para convertir Entity → DTO
private EntregaViajeDTO convertToDTO(EntregaViaje entrega) {
    EntregaViajeDTO dto = new EntregaViajeDTO();
    
    dto.setId(entrega.getId());
    dto.setViajeId(entrega.getViaje().getId());
    
    // ✅ IMPORTANTE: Incluir el documentoComercialId si existe
    if (entrega.getDocumentoComercial() != null) {
        dto.setDocumentoComercialId(entrega.getDocumentoComercial().getId());
    }
    
    // Incluir ordenServicioId si existe
    if (entrega.getOrdenServicio() != null) {
        dto.setOrdenServicioId(entrega.getOrdenServicio().getId());
    }
    
    dto.setDireccionEntrega(entrega.getDireccionEntrega());
    dto.setFechaEntrega(entrega.getFechaEntrega());
    dto.setEstado(entrega.getEstado());
    dto.setObservaciones(entrega.getObservaciones());
    dto.setReceptorNombre(entrega.getReceptorNombre());
    dto.setReceptorDni(entrega.getReceptorDni());
    
    return dto;
}
```

---

### **Paso 3: Actualizar el Método POST (Crear Entrega)**

```java
@PostMapping
public ResponseEntity<EntregaViajeDTO> createEntrega(@Valid @RequestBody EntregaViajeDTO dto) {
    EntregaViaje entrega = new EntregaViaje();

    // Set viaje
    if (dto.getViajeId() != null) {
        Viaje viaje = viajeRepository.findById(dto.getViajeId())
                .orElseThrow(() -> new EntityNotFoundException("Viaje no encontrado con id: " + dto.getViajeId()));
        entrega.setViaje(viaje);
    }

    // Set documento comercial
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
    
    // ✅ Devolver DTO con todos los IDs poblados
    return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(nuevaEntrega));
}
```

---

### **Paso 4: Verificar la Entidad `EntregaViaje`**

Asegúrate de que la relación esté configurada correctamente:

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
    
    // ✅ Verificar que use FetchType.EAGER o que el DTO maneje correctamente el lazy loading
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_comercial_id", nullable = true)
    private DocumentoComercial documentoComercial;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_servicio_id", nullable = true)
    private OrdenServicio ordenServicio;
    
    // ... resto de campos
}
```

---