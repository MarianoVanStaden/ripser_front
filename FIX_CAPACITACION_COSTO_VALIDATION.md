# 🚨 FIX: Validación de Costo en Capacitaciones

## 🎯 Error Actual

```
Validation failed for argument [0]
Field error in object 'capacitacionDTO' on field 'costo': rejected value [0]
default message [El costo debe ser positivo]
```

## ❌ Problema

Tu `CapacitacionDTO.java` actual tiene:

```java
@Positive  // ❌ Requiere que costo > 0
private BigDecimal costo;
```

Pero el frontend puede enviar `costo: 0` para capacitaciones gratuitas.

## ✅ Solución

Cambia `@Positive` a `@PositiveOrZero` en tu DTO:

```java
package com.ripser_back.dto.empleado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;

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
    
    @PositiveOrZero(message = "Las horas deben ser positivas o cero")
    private Integer horas;
    
    private Boolean certificado;
    
    @PositiveOrZero(message = "El costo debe ser positivo o cero")  // 🔥 CAMBIO AQUÍ
    private BigDecimal costo;
    
    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmpleadoId() {
        return empleadoId;
    }

    public void setEmpleadoId(Long empleadoId) {
        this.empleadoId = empleadoId;
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

    public String getInstitucion() {
        return institucion;
    }

    public void setInstitucion(String institucion) {
        this.institucion = institucion;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public Integer getHoras() {
        return horas;
    }

    public void setHoras(Integer horas) {
        this.horas = horas;
    }

    public Boolean getCertificado() {
        return certificado;
    }

    public void setCertificado(Boolean certificado) {
        this.certificado = certificado;
    }

    public BigDecimal getCosto() {
        return costo;
    }

    public void setCosto(BigDecimal costo) {
        this.costo = costo;
    }
}
```

## 🔄 Alternativa: Usar Lombok

Si tienes Lombok, simplifica el DTO:

```java
package com.ripser_back.dto.empleado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

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
    
    @PositiveOrZero(message = "Las horas deben ser positivas o cero")
    private Integer horas;
    
    private Boolean certificado;
    
    @PositiveOrZero(message = "El costo debe ser positivo o cero")
    private BigDecimal costo;
}
```

## 🎯 Qué Hacer

1. **Abre** `CapacitacionDTO.java`
2. **Busca** la línea con `@Positive` sobre el campo `costo`
3. **Cambia** a `@PositiveOrZero`
4. **Reinicia** el backend
5. **Prueba** crear una capacitación desde el frontend

## 📋 Diferencia entre Validaciones

| Anotación | Acepta 0 | Acepta Positivos | Acepta Negativos |
|-----------|----------|------------------|------------------|
| `@Positive` | ❌ NO | ✅ SÍ | ❌ NO |
| `@PositiveOrZero` | ✅ SÍ | ✅ SÍ | ❌ NO |
| `@Negative` | ❌ NO | ❌ NO | ✅ SÍ |
| `@NegativeOrZero` | ✅ SÍ | ❌ NO | ✅ SÍ |

## 🚀 Después del Fix

Podrás crear capacitaciones con:
- ✅ Costo = 0 (capacitaciones gratuitas)
- ✅ Costo > 0 (capacitaciones pagas)
- ❌ Costo < 0 (no permitido)

## 🐛 Logs del Error

```
Field error in object 'capacitacionDTO' on field 'costo': 
rejected value [0]; 
codes [Positive.capacitacionDTO.costo,Positive.costo,Positive.java.math.BigDecimal,Positive]
default message [El costo debe ser positivo]
```

Este error indica claramente que el valor `[0]` fue rechazado por la validación `@Positive`.
