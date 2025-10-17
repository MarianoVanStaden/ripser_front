# 🚨 FIX URGENTE: PuestoDTO Incompleto

## 🎯 Problema

Tu `PuestoDTO` solo tiene 3 campos:
```java
public class PuestoDTO {
    private Long id;
    private String nombre;      // ✅
    private String descripcion; // ✅
    // ❌ FALTAN: departamento y salarioBase
}
```

Pero la entidad `Puesto` tiene 5 campos:
```java
@Entity
public class Puesto {
    private Long id;
    private String nombre;
    private String descripcion;
    private String departamento;     // ❌ NO ESTÁ EN EL DTO
    private BigDecimal salarioBase;  // ❌ NO ESTÁ EN EL DTO
}
```

**Resultado**: El frontend envía `departamento` y `salarioBase`, pero el backend los ignora porque no existen en el DTO.

## ✅ Solución: PuestoDTO Completo

Reemplaza tu `PuestoDTO.java` con esto:

```java
package com.ripser_back.dto.empleado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class PuestoDTO {
    
    private Long id;
    
    @NotBlank(message = "El nombre del puesto es obligatorio")
    private String nombre;
    
    private String descripcion;
    
    private String departamento;  // 🔥 AGREGADO
    
    @PositiveOrZero(message = "El salario base debe ser positivo o cero")
    private BigDecimal salarioBase;  // 🔥 AGREGADO

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public BigDecimal getSalarioBase() {
        return salarioBase;
    }

    public void setSalarioBase(BigDecimal salarioBase) {
        this.salarioBase = salarioBase;
    }
}
```

## 🔄 Alternativa con Lombok

Si usas Lombok (que ya tienes en tu proyecto):

```java
package com.ripser_back.dto.empleado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PuestoDTO {
    
    private Long id;
    
    @NotBlank(message = "El nombre del puesto es obligatorio")
    private String nombre;
    
    private String descripcion;
    
    private String departamento;
    
    @PositiveOrZero(message = "El salario base debe ser positivo o cero")
    private BigDecimal salarioBase;
}
```

## ✅ Verificar PuestoMapper

Asegúrate de que tu `PuestoMapper.java` mapee todos los campos:

```java
package com.ripser_back.mappers;

import com.ripser_back.dto.empleado.PuestoDTO;
import com.ripser_back.entities.Puesto;
import org.springframework.stereotype.Component;

@Component
public class PuestoMapper {
    
    public PuestoDTO toDTO(Puesto puesto) {
        if (puesto == null) {
            return null;
        }
        
        PuestoDTO dto = new PuestoDTO();
        dto.setId(puesto.getId());
        dto.setNombre(puesto.getNombre());
        dto.setDescripcion(puesto.getDescripcion());
        dto.setDepartamento(puesto.getDepartamento());       // 🔥 ASEGURAR
        dto.setSalarioBase(puesto.getSalarioBase());         // 🔥 ASEGURAR
        return dto;
    }
    
    public Puesto toEntity(PuestoDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Puesto puesto = new Puesto();
        puesto.setId(dto.getId());
        puesto.setNombre(dto.getNombre());
        puesto.setDescripcion(dto.getDescripcion());
        puesto.setDepartamento(dto.getDepartamento());       // 🔥 ASEGURAR
        puesto.setSalarioBase(dto.getSalarioBase());         // 🔥 ASEGURAR
        return puesto;
    }
}
```

## 🎯 Qué Hacer Ahora

1. **Actualiza `PuestoDTO.java`** con los campos `departamento` y `salarioBase`
2. **Verifica `PuestoMapper.java`** que mapee todos los campos
3. **Reinicia el backend**
4. **Prueba crear un puesto** desde el frontend
5. ✅ Debería guardar departamento y salarioBase correctamente

## 🔍 Explicación del Problema

```java
// ❌ ANTES: El frontend enviaba
{
  "nombre": "Compras",
  "descripcion": "...",
  "departamento": "Administración",  // ← Backend lo ignora
  "salarioBase": 50000               // ← Backend lo ignora
}

// Backend recibía en PuestoDTO
{
  nombre: "Compras",
  descripcion: "...",
  // departamento y salarioBase NO existen en el DTO
}

// Mapper creaba Puesto con
Puesto {
  nombre: "Compras",
  descripcion: "...",
  departamento: NULL,    // ❌
  salarioBase: NULL      // ❌
}

// ✅ DESPUÉS: Con DTO completo
PuestoDTO {
  nombre: "Compras",
  descripcion: "...",
  departamento: "Administración",  // ✅ Existe en el DTO
  salarioBase: 50000               // ✅ Existe en el DTO
}

Puesto {
  nombre: "Compras",
  descripcion: "...",
  departamento: "Administración",  // ✅
  salarioBase: 50000               // ✅
}
```

## 📋 Checklist

- [ ] Agregar `departamento` al PuestoDTO
- [ ] Agregar `salarioBase` al PuestoDTO
- [ ] Agregar getters y setters (o usar @Data de Lombok)
- [ ] Verificar que PuestoMapper mapee ambos campos
- [ ] Reiniciar backend
- [ ] Probar crear un puesto con departamento y salario
- [ ] Verificar en BD que los valores se guardan correctamente

## 🚀 Resultado Esperado

Después del fix, podrás:
- ✅ Crear puestos con departamento y salario base
- ✅ Ver los valores correctamente en el frontend
- ✅ Los valores se guardan en la base de datos
- ✅ Puedes editar departamento y salario
