# 🚨 SOLUCIÓN URGENTE: Capacitaciones Backend

## 🎯 Error Actual

```
Column 'empleado_id' cannot be null
```

**Causa**: El controller recibe un DTO con `empleadoId`, pero intenta guardar directamente la entidad sin convertir el `empleadoId` en un objeto `Empleado`.

## ✅ Solución Inmediata

### Opción 1: Service Layer (RECOMENDADO)

#### 1. Crear `CapacitacionService.java`

```java
package com.ripser_back.services;

import com.ripser_back.dto.empleado.CapacitacionDTO;
import com.ripser_back.entities.Capacitacion;
import com.ripser_back.entities.Empleado;
import com.ripser_back.repositories.CapacitacionRepository;
import com.ripser_back.repositories.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CapacitacionService {
    
    @Autowired
    private CapacitacionRepository capacitacionRepository;
    
    @Autowired
    private EmpleadoRepository empleadoRepository;
    
    public List<CapacitacionDTO> getAll() {
        return capacitacionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public CapacitacionDTO getById(Long id) {
        Capacitacion capacitacion = capacitacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Capacitación no encontrada con id: " + id));
        return convertToDTO(capacitacion);
    }
    
    public List<CapacitacionDTO> getByEmpleado(Long empleadoId) {
        return capacitacionRepository.findByEmpleadoId(empleadoId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<CapacitacionDTO> getByInstitucion(String institucion) {
        return capacitacionRepository.findByInstitucion(institucion).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<CapacitacionDTO> getByPeriodo(LocalDate fechaInicio, LocalDate fechaFin) {
        return capacitacionRepository.findByFechaFinBetween(fechaInicio, fechaFin).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public CapacitacionDTO create(CapacitacionDTO dto) {
        // 🔥 AQUÍ ESTÁ LA SOLUCIÓN: Buscar el empleado y asignarlo
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + dto.getEmpleadoId()));
        
        Capacitacion capacitacion = new Capacitacion();
        capacitacion.setEmpleado(empleado);  // 🔥 CLAVE: Asignar el objeto completo
        capacitacion.setNombre(dto.getNombre());
        capacitacion.setDescripcion(dto.getDescripcion());
        capacitacion.setInstitucion(dto.getInstitucion());
        capacitacion.setFechaInicio(dto.getFechaInicio());
        capacitacion.setFechaFin(dto.getFechaFin());
        capacitacion.setHoras(dto.getHoras());
        capacitacion.setCertificado(dto.isCertificado());
        capacitacion.setCosto(dto.getCosto());
        
        Capacitacion saved = capacitacionRepository.save(capacitacion);
        return convertToDTO(saved);
    }
    
    public CapacitacionDTO update(Long id, CapacitacionDTO dto) {
        Capacitacion capacitacion = capacitacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Capacitación no encontrada con id: " + id));
        
        // Buscar el empleado
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + dto.getEmpleadoId()));
        
        capacitacion.setEmpleado(empleado);
        capacitacion.setNombre(dto.getNombre());
        capacitacion.setDescripcion(dto.getDescripcion());
        capacitacion.setInstitucion(dto.getInstitucion());
        capacitacion.setFechaInicio(dto.getFechaInicio());
        capacitacion.setFechaFin(dto.getFechaFin());
        capacitacion.setHoras(dto.getHoras());
        capacitacion.setCertificado(dto.isCertificado());
        capacitacion.setCosto(dto.getCosto());
        
        Capacitacion updated = capacitacionRepository.save(capacitacion);
        return convertToDTO(updated);
    }
    
    public void delete(Long id) {
        if (!capacitacionRepository.existsById(id)) {
            throw new RuntimeException("Capacitación no encontrada con id: " + id);
        }
        capacitacionRepository.deleteById(id);
    }
    
    private CapacitacionDTO convertToDTO(Capacitacion capacitacion) {
        CapacitacionDTO dto = new CapacitacionDTO();
        dto.setId(capacitacion.getId());
        dto.setEmpleadoId(capacitacion.getEmpleado().getId());
        dto.setNombre(capacitacion.getNombre());
        dto.setDescripcion(capacitacion.getDescripcion());
        dto.setInstitucion(capacitacion.getInstitucion());
        dto.setFechaInicio(capacitacion.getFechaInicio());
        dto.setFechaFin(capacitacion.getFechaFin());
        dto.setHoras(capacitacion.getHoras());
        dto.setCertificado(capacitacion.getCertificado());
        dto.setCosto(capacitacion.getCosto());
        return dto;
    }
}
```

#### 2. Actualizar `CapacitacionController.java`

```java
package com.ripser_back.controllers;

import com.ripser_back.dto.empleado.CapacitacionDTO;
import com.ripser_back.services.CapacitacionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/capacitaciones")
@Validated
public class CapacitacionController {

    @Autowired
    private CapacitacionService capacitacionService;  // 🔥 Cambió: usa service en vez de repository

    @GetMapping
    public ResponseEntity<List<CapacitacionDTO>> getAllCapacitaciones() {
        List<CapacitacionDTO> capacitaciones = capacitacionService.getAll();
        return ResponseEntity.ok(capacitaciones);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapacitacionDTO> getCapacitacionById(@PathVariable Long id) {
        CapacitacionDTO capacitacion = capacitacionService.getById(id);
        return ResponseEntity.ok(capacitacion);
    }

    @GetMapping("/empleado/{empleadoId}")
    public ResponseEntity<List<CapacitacionDTO>> getCapacitacionesByEmpleado(@PathVariable Long empleadoId) {
        List<CapacitacionDTO> capacitaciones = capacitacionService.getByEmpleado(empleadoId);
        return ResponseEntity.ok(capacitaciones);
    }

    @GetMapping("/institucion/{institucion}")
    public ResponseEntity<List<CapacitacionDTO>> getCapacitacionesByInstitucion(@PathVariable String institucion) {
        List<CapacitacionDTO> capacitaciones = capacitacionService.getByInstitucion(institucion);
        return ResponseEntity.ok(capacitaciones);
    }

    @GetMapping("/periodo")
    public ResponseEntity<List<CapacitacionDTO>> getCapacitacionesByPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        List<CapacitacionDTO> capacitaciones = capacitacionService.getByPeriodo(fechaInicio, fechaFin);
        return ResponseEntity.ok(capacitaciones);
    }

    @PostMapping
    public ResponseEntity<CapacitacionDTO> createCapacitacion(@Valid @RequestBody CapacitacionDTO capacitacionDTO) {
        // 🔥 Cambió: recibe DTO, el service se encarga de convertir a entidad
        CapacitacionDTO nuevaCapacitacion = capacitacionService.create(capacitacionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevaCapacitacion);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CapacitacionDTO> updateCapacitacion(
            @PathVariable Long id, 
            @Valid @RequestBody CapacitacionDTO capacitacionDTO) {
        CapacitacionDTO capacitacionActualizada = capacitacionService.update(id, capacitacionDTO);
        return ResponseEntity.ok(capacitacionActualizada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCapacitacion(@PathVariable Long id) {
        capacitacionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Opción 2: Fix Rápido en Controller (NO RECOMENDADO)

Si necesitas un fix inmediato mientras creas el service:

```java
@PostMapping
public ResponseEntity<Capacitacion> createCapacitacion(@Valid @RequestBody CapacitacionDTO dto) {
    // Fix temporal: buscar el empleado y crear la entidad manualmente
    Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
            .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
    
    Capacitacion capacitacion = new Capacitacion();
    capacitacion.setEmpleado(empleado);  // 🔥 Asignar el objeto empleado
    capacitacion.setNombre(dto.getNombre());
    capacitacion.setDescripcion(dto.getDescripcion());
    capacitacion.setInstitucion(dto.getInstitucion());
    capacitacion.setFechaInicio(dto.getFechaInicio());
    capacitacion.setFechaFin(dto.getFechaFin());
    capacitacion.setHoras(dto.getHoras());
    capacitacion.setCertificado(dto.isCertificado());
    capacitacion.setCosto(dto.getCosto());
    
    Capacitacion saved = capacitacionRepository.save(capacitacion);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
}
```

## 🎯 Qué Hacer Ahora

### PASO 1: Implementa la Opción 1 (RECOMENDADO)
1. Crea `CapacitacionService.java` con el código de arriba
2. Actualiza `CapacitacionController.java` para usar el service
3. Prueba en el frontend

### PASO 2: O usa el Fix Rápido
1. Agrega `@Autowired private EmpleadoRepository empleadoRepository;` al controller
2. Cambia el método `createCapacitacion` con el código de la Opción 2
3. Haz lo mismo con `updateCapacitacion`

## 📋 Checklist

- [ ] Crear `CapacitacionService.java`
- [ ] Actualizar `CapacitacionController.java`
- [ ] Probar POST en el frontend
- [ ] Probar PUT en el frontend
- [ ] Verificar que GET devuelve DTOs correctamente

## 🔍 Por Qué Fallaba

```java
// ❌ ANTES: Controller recibía esto del frontend
{
  "empleadoId": 5,
  "nombre": "Java Spring Boot",
  // ...
}

// ❌ Y lo intentaba guardar directamente como entidad
Capacitacion.empleado = null  // ❌ empleado_id = NULL en BD

// ✅ AHORA: Service busca el empleado primero
Empleado empleado = empleadoRepository.findById(5);
Capacitacion.empleado = empleado;  // ✅ empleado_id = 5 en BD
```

## 🚀 Después del Fix

El frontend ya está listo, solo necesitas implementar el backend y funcionará perfectamente:
- ✅ Crear capacitaciones
- ✅ Actualizar capacitaciones  
- ✅ Ver lista de capacitaciones
- ✅ Eliminar capacitaciones
