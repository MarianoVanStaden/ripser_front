# CapacitacionDTO Backend Reference

## 🎯 Problema Detectado

El `CapacitacionController` devuelve la **entidad JPA directa** sin usar un DTO, lo que causa:

1. **Problemas de serialización** con las relaciones bidireccionales (`@JsonManagedReference` / `@JsonBackReference`)
2. **Lazy loading issues** si la relación con Empleado no está cargada
3. **Inconsistencia** con el resto de las APIs que usan DTOs

## ❌ Código Actual (Problemático)

```java
@RestController
@RequestMapping("/api/capacitaciones")
public class CapacitacionController {
    
    @Autowired
    private CapacitacionRepository capacitacionRepository;
    
    @GetMapping
    public ResponseEntity<List<Capacitacion>> getAllCapacitaciones() {
        return ResponseEntity.ok(capacitacionRepository.findAll());  // ❌ Devuelve entidad directa
    }
    
    @PostMapping
    public ResponseEntity<Capacitacion> createCapacitacion(@Valid @RequestBody Capacitacion capacitacion) {
        Capacitacion saved = capacitacionRepository.save(capacitacion);  // ❌ Recibe/devuelve entidad
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    // ... otros endpoints igual
}
```

## ✅ Solución: Crear DTO y Service Layer

### 1. **CapacitacionDTO.java**

Crea este archivo en `com.ripser_back.dto.empleado`:

```java
package com.ripser_back.dto.empleado;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapacitacionDTO {
    
    private Long id;
    
    @NotNull(message = "El empleado es obligatorio")
    private Long empleadoId;
    
    @NotBlank(message = "El nombre de la capacitación es obligatorio")
    private String nombre;
    
    private String descripcion;
    
    @NotBlank(message = "La institución es obligatoria")
    private String institucion;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaInicio;
    
    @NotNull(message = "La fecha de fin es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaFin;
    
    @PositiveOrZero
    private Integer horas;
    
    private Boolean certificado;
    
    @PositiveOrZero
    private BigDecimal costo;
    
    // Campos adicionales del empleado para el frontend
    private String empleadoNombre;
    private String empleadoApellido;
    private String empleadoDni;
    
    // Objeto empleado completo (opcional pero recomendado)
    private EmpleadoSimpleDTO empleado;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmpleadoSimpleDTO {
        private Long id;
        private String nombre;
        private String apellido;
        private String dni;
        private String email;
        private String telefono;
    }
}
```

### 2. **CapacitacionService.java**

Crea un servicio para manejar la lógica de negocio:

```java
package com.ripser_back.services;

import com.ripser_back.dto.empleado.CapacitacionDTO;
import com.ripser_back.entities.Capacitacion;
import com.ripser_back.entities.Empleado;
import com.ripser_back.exceptions.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("Capacitación no encontrada con id: " + id));
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
        // Validar que el empleado existe
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado con id: " + dto.getEmpleadoId()));
        
        // Crear la entidad
        Capacitacion capacitacion = new Capacitacion();
        capacitacion.setEmpleado(empleado);
        capacitacion.setNombre(dto.getNombre());
        capacitacion.setDescripcion(dto.getDescripcion());
        capacitacion.setInstitucion(dto.getInstitucion());
        capacitacion.setFechaInicio(dto.getFechaInicio());
        capacitacion.setFechaFin(dto.getFechaFin());
        capacitacion.setHoras(dto.getHoras());
        capacitacion.setCertificado(dto.getCertificado() != null ? dto.getCertificado() : false);
        capacitacion.setCosto(dto.getCosto());
        
        Capacitacion saved = capacitacionRepository.save(capacitacion);
        return convertToDTO(saved);
    }
    
    public CapacitacionDTO update(Long id, CapacitacionDTO dto) {
        // Verificar que existe
        Capacitacion capacitacion = capacitacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Capacitación no encontrada con id: " + id));
        
        // Validar que el empleado existe
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado con id: " + dto.getEmpleadoId()));
        
        // Actualizar
        capacitacion.setEmpleado(empleado);
        capacitacion.setNombre(dto.getNombre());
        capacitacion.setDescripcion(dto.getDescripcion());
        capacitacion.setInstitucion(dto.getInstitucion());
        capacitacion.setFechaInicio(dto.getFechaInicio());
        capacitacion.setFechaFin(dto.getFechaFin());
        capacitacion.setHoras(dto.getHoras());
        capacitacion.setCertificado(dto.getCertificado());
        capacitacion.setCosto(dto.getCosto());
        
        Capacitacion updated = capacitacionRepository.save(capacitacion);
        return convertToDTO(updated);
    }
    
    public void delete(Long id) {
        if (!capacitacionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Capacitación no encontrada con id: " + id);
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
        
        // Campos adicionales del empleado
        Empleado emp = capacitacion.getEmpleado();
        dto.setEmpleadoNombre(emp.getNombre());
        dto.setEmpleadoApellido(emp.getApellido());
        dto.setEmpleadoDni(emp.getDni());
        
        // Objeto empleado completo (opcional)
        CapacitacionDTO.EmpleadoSimpleDTO empleadoDTO = new CapacitacionDTO.EmpleadoSimpleDTO();
        empleadoDTO.setId(emp.getId());
        empleadoDTO.setNombre(emp.getNombre());
        empleadoDTO.setApellido(emp.getApellido());
        empleadoDTO.setDni(emp.getDni());
        empleadoDTO.setEmail(emp.getEmail());
        empleadoDTO.setTelefono(emp.getTelefono());
        dto.setEmpleado(empleadoDTO);
        
        return dto;
    }
}
```

### 3. **CapacitacionController.java - Actualizado**

Reemplaza tu controller actual con este:

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
    private CapacitacionService capacitacionService;

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

## 🔍 Solución Temporal en Frontend (Ya Aplicada)

Mientras actualizas el backend, ya he agregado mapeo en `CapacitacionesPage.tsx`:

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const [capacitacionesData, empleadosData] = await Promise.all([
      capacitacionApi.getAll(),
      employeeApi.getAllList()
    ]);
    
    console.log('Capacitaciones raw data:', capacitacionesData);
    console.log('Empleados data:', empleadosData);
    
    // Mapear para asegurar que empleado existe
    const capacitacionesConEmpleado = Array.isArray(capacitacionesData)
      ? capacitacionesData.map((capacitacion: any) => {
          const empleado = empleadosData.find((e: any) => e.id === capacitacion.empleado?.id);
          return {
            ...capacitacion,
            empleado: empleado || capacitacion.empleado || {
              id: capacitacion.empleadoId || capacitacion.empleado?.id,
              nombre: capacitacion.empleadoNombre || capacitacion.empleado?.nombre || '',
              apellido: capacitacion.empleadoApellido || capacitacion.empleado?.apellido || '',
              dni: capacitacion.empleadoDni || capacitacion.empleado?.dni || ''
            }
          };
        })
      : [];
    
    console.log('Capacitaciones mapped:', capacitacionesConEmpleado);
    
    setCapacitaciones(capacitacionesConEmpleado);
    setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
  } catch (err) {
    setError('Error al cargar los datos');
    console.error('Error loading data:', err);
    setCapacitaciones([]);
    setEmpleados([]);
  } finally {
    setLoading(false);
  }
};
```

## 📋 Checklist de Implementación Backend

- [ ] Crear `CapacitacionDTO.java` con estructura recomendada
- [ ] Crear `CapacitacionService.java` con método `convertToDTO()`
- [ ] Actualizar `CapacitacionController.java` para usar el servicio y DTO
- [ ] Agregar `@Transactional` en el servicio
- [ ] Probar endpoints con Postman/Thunder Client
- [ ] Verificar que el frontend carga los datos correctamente

## 🐛 Debugging

1. **Abre la consola del navegador** (F12)
2. **Ve a la página de Capacitaciones**
3. **Busca los logs**:
   - "Capacitaciones raw data:" → Ver estructura del backend
   - "Capacitaciones mapped:" → Ver resultado del mapeo
4. **Verifica** que los datos se muestran en la tabla
5. **Comparte** los logs si algo no funciona

## ⚠️ Problemas Comunes

### Problema 1: Error de serialización Jackson
```
Could not write JSON: Infinite recursion (StackOverflowError)
```
**Solución**: Usar DTOs en lugar de entidades directas.

### Problema 2: Lazy loading exception
```
LazyInitializationException: could not initialize proxy - no Session
```
**Solución**: Agregar `@Transactional` en el servicio y usar DTOs.

### Problema 3: Empleado null en frontend
```
Cannot read properties of undefined (reading 'id')
```
**Solución**: Ya aplicada en frontend con mapeo + safety checks.

## 🎯 Beneficios del Enfoque DTO

1. ✅ **Control total** sobre qué datos se exponen en la API
2. ✅ **Evita problemas** de serialización circular
3. ✅ **Valida datos** antes de llegar a la capa de persistencia
4. ✅ **Consistencia** con el resto de tus APIs
5. ✅ **Mejor performance** al cargar solo los datos necesarios
