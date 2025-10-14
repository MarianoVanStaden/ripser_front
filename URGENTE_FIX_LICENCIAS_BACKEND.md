# 🚨 URGENTE: Fix Licencias - Column 'empleado_id' cannot be null

## 📋 Error Actual

```
Column 'empleado_id' cannot be null
POST /api/licencias - 500 Internal Server Error
```

### Causa Raíz
El `LicenciaController` está usando `mapper.toEntity(dto)` directamente, pero el mapper **NO asigna el objeto `Empleado`** - solo intenta setear `empleadoId` que es un campo transient.

## ✅ Solución: Service Layer con Conversión Completa

---

## 📁 Archivos a Modificar

### 1️⃣ **LicenciaDTO.java** (Verificar estructura)

```java
package com.ripser_back.dto.empleado;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

@Data
public class LicenciaDTO {
    private Long id;
    
    @NotNull(message = "El empleado es obligatorio")
    private Long empleadoId;  // Frontend envía esto
    
    @NotBlank(message = "El tipo de licencia es obligatorio")
    private String tipo;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaInicio;
    
    @NotNull(message = "La fecha de fin es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaFin;
    
    @Positive(message = "Los días deben ser positivos")
    private Integer dias;
    
    private String motivo;
    
    private Boolean goceHaber; // true = con goce, false = sin goce
    
    private String estado; // "PENDIENTE", "APROBADA", "RECHAZADA"
    
    // Para respuestas (opcional, si quieres enviar info del empleado al frontend)
    private EmpleadoSimpleDTO empleado;
    
    @Data
    public static class EmpleadoSimpleDTO {
        private Long id;
        private String nombre;
        private String apellido;
    }
}
```

---

### 2️⃣ **LicenciaService.java** (CREAR/ACTUALIZAR)

```java
package com.ripser_back.services;

import com.ripser_back.dto.empleado.LicenciaDTO;
import com.ripser_back.entities.Empleado;
import com.ripser_back.entities.Licencia;
import com.ripser_back.repositories.EmpleadoRepository;
import com.ripser_back.repositories.LicenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LicenciaService {

    @Autowired
    private LicenciaRepository licenciaRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    public List<Licencia> findAll() {
        return licenciaRepository.findAll();
    }

    public Licencia findById(Long id) {
        return licenciaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Licencia no encontrada con id: " + id));
    }

    /**
     * MÉTODO CRÍTICO: Convierte DTO a Entidad asignando el objeto Empleado completo
     */
    public Licencia save(LicenciaDTO dto) {
        Licencia licencia;
        
        if (dto.getId() != null) {
            // Actualización: buscar licencia existente
            licencia = findById(dto.getId());
        } else {
            // Creación: nueva licencia
            licencia = new Licencia();
        }
        
        // 🔥 IMPORTANTE: Buscar y asignar el objeto Empleado completo
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
            .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + dto.getEmpleadoId()));
        
        licencia.setEmpleado(empleado);
        
        // Setear los demás campos
        licencia.setTipo(dto.getTipo());
        licencia.setFechaInicio(dto.getFechaInicio());
        licencia.setFechaFin(dto.getFechaFin());
        licencia.setDias(dto.getDias());
        licencia.setMotivo(dto.getMotivo());
        licencia.setGoceHaber(dto.getGoceHaber());
        licencia.setEstado(dto.getEstado());
        
        return licenciaRepository.save(licencia);
    }

    /**
     * Convierte Entidad a DTO (para respuestas al frontend)
     */
    public LicenciaDTO convertToDTO(Licencia licencia) {
        LicenciaDTO dto = new LicenciaDTO();
        dto.setId(licencia.getId());
        dto.setEmpleadoId(licencia.getEmpleado().getId());
        dto.setTipo(licencia.getTipo());
        dto.setFechaInicio(licencia.getFechaInicio());
        dto.setFechaFin(licencia.getFechaFin());
        dto.setDias(licencia.getDias());
        dto.setMotivo(licencia.getMotivo());
        dto.setGoceHaber(licencia.getGoceHaber());
        dto.setEstado(licencia.getEstado());
        
        // Opcional: agregar info del empleado para el frontend
        if (licencia.getEmpleado() != null) {
            LicenciaDTO.EmpleadoSimpleDTO empDTO = new LicenciaDTO.EmpleadoSimpleDTO();
            empDTO.setId(licencia.getEmpleado().getId());
            empDTO.setNombre(licencia.getEmpleado().getNombre());
            empDTO.setApellido(licencia.getEmpleado().getApellido());
            dto.setEmpleado(empDTO);
        }
        
        return dto;
    }

    public void deleteById(Long id) {
        licenciaRepository.deleteById(id);
    }
}
```

---

### 3️⃣ **LicenciaController.java** (ACTUALIZAR)

```java
package com.ripser_back.controllers;

import com.ripser_back.dto.empleado.LicenciaDTO;
import com.ripser_back.entities.Licencia;
import com.ripser_back.services.LicenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/licencias")
public class LicenciaController {

    @Autowired
    private LicenciaService service;

    @GetMapping
    public List<LicenciaDTO> findAll() {
        return service.findAll().stream()
            .map(service::convertToDTO)
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public LicenciaDTO findById(@PathVariable Long id) {
        Licencia licencia = service.findById(id);
        return service.convertToDTO(licencia);
    }

    @PostMapping
    public LicenciaDTO save(@Valid @RequestBody LicenciaDTO dto) {
        // ✅ El service maneja la conversión y asignación del Empleado
        Licencia licencia = service.save(dto);
        return service.convertToDTO(licencia);
    }

    @PutMapping("/{id}")
    public LicenciaDTO update(@PathVariable Long id, @Valid @RequestBody LicenciaDTO dto) {
        dto.setId(id); // Asegurar que el ID esté seteado
        Licencia licencia = service.save(dto);
        return service.convertToDTO(licencia);
    }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable Long id) {
        service.deleteById(id);
    }
}
```

---

### 4️⃣ **LicenciaMapper.java** (OPCIONAL - Puedes eliminar o dejarlo para otros usos)

Si usas MapStruct, el mapper ya no es necesario en el controller porque el service maneja todo:

```java
package com.ripser_back.mappers;

import com.ripser_back.dto.empleado.LicenciaDTO;
import com.ripser_back.entities.Licencia;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LicenciaMapper {
    
    // Solo usar si necesitas mapeo simple sin relaciones
    @Mapping(target = "empleadoId", source = "empleado.id")
    LicenciaDTO toDTO(Licencia licencia);
    
    // NO USAR en controller - el service maneja esto mejor
    @Mapping(target = "empleado", ignore = true) // Se asigna en el service
    Licencia toEntity(LicenciaDTO dto);
}
```

---

## 🔧 Pasos de Implementación

### 1. **Verificar LicenciaDTO.java**
- Debe tener campo `empleadoId` (Long) con `@NotNull`
- Opcional: campo `empleado` (EmpleadoSimpleDTO) para respuestas

### 2. **Actualizar LicenciaService.java**
- Agregar método `save(LicenciaDTO dto)` que:
  1. Busca el `Empleado` por `dto.getEmpleadoId()`
  2. Crea/busca la `Licencia`
  3. Asigna `licencia.setEmpleado(empleado)`
  4. Setea todos los demás campos
  5. Guarda en BD
- Agregar método `convertToDTO(Licencia licencia)` para respuestas

### 3. **Actualizar LicenciaController.java**
- Cambiar `mapper.toEntity(dto)` → `service.save(dto)`
- Cambiar `mapper.toDTO(licencia)` → `service.convertToDTO(licencia)`
- Agregar `@Valid` en `@RequestBody`

### 4. **Compilar**
```bash
mvn clean compile
```

### 5. **Probar en Postman**
```json
POST /api/licencias
{
  "empleadoId": 1,
  "tipo": "VACACIONES",
  "fechaInicio": "2025-10-15",
  "fechaFin": "2025-10-25",
  "dias": 10,
  "motivo": "Vacaciones anuales",
  "goceHaber": true,
  "estado": "PENDIENTE"
}
```

---

## 🎯 Resultado Esperado

### ✅ Backend Log
```
Hibernate: insert into licencias (dias, empleado_id, estado, fecha_fin, fecha_inicio, goce_haber, motivo, tipo) values (?, ?, ?, ?, ?, ?, ?, ?)
```
**SIN ERRORES** - `empleado_id` tendrá el valor correcto.

### ✅ Frontend Console
```javascript
Licencia created successfully: {
  id: 1,
  empleadoId: 1,
  tipo: "VACACIONES",
  estado: "PENDIENTE",
  empleado: {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez"
  }
}
```

---

## 🔍 Debugging

Si sigue fallando:

1. **Verificar EmpleadoRepository existe:**
```java
empleadoRepository.findById(dto.getEmpleadoId())
```

2. **Verificar Licencia entity tiene empleado:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "empleado_id", nullable = false)
private Empleado empleado;
```

3. **Verificar frontend envía empleadoId:**
```typescript
console.log('Sending licencia:', licenciaData);
// Debe tener: { empleadoId: 1, tipo: "...", ... }
```

---

## 📝 Resumen de Cambios

| Archivo | Acción | Líneas Clave |
|---------|--------|--------------|
| `LicenciaDTO.java` | Verificar | `@NotNull Long empleadoId` |
| `LicenciaService.java` | **CREAR** método `save(DTO)` | Busca Empleado + asigna relación |
| `LicenciaController.java` | **CAMBIAR** | `service.save(dto)` en vez de mapper |
| `LicenciaMapper.java` | Opcional | Puede eliminarse del controller |

---

## 🚀 Mismo Patrón que Capacitaciones

Esta es la **misma solución** que aplicamos para:
- ✅ Capacitaciones (URGENTE_FIX_CAPACITACIONES_BACKEND.md)
- ✅ Sueldos (SueldoDTO_BACKEND_REFERENCE.md)
- ✅ Asistencias (RegistroAsistenciaDTO_BACKEND_REFERENCE.md)

**Todos necesitan service layer para manejar relaciones JPA correctamente.** 🎯
