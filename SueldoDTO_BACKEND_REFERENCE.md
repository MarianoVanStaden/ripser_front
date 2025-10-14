# SueldoDTO Backend Reference

## Problema Detectado
El frontend de SueldosPage no muestra los sueldos de la base de datos porque probablemente hay un **mismatch entre el DTO del backend y el tipo esperado en el frontend**.

## Frontend Type (src/types/index.ts)
```typescript
interface Sueldo {
  id: number;
  empleado: Empleado;  // ← Espera objeto completo
  periodo: string;
  sueldoBasico: number;
  bonificaciones: number;
  horasExtras: number;
  comisiones: number;
  totalBruto: number;
  descuentosLegales: number;
  descuentosOtros: number;
  totalDescuentos: number;
  sueldoNeto: number;
  fechaPago?: string;
  observaciones?: string;
}
```

## SueldoDTO Backend Recomendado

Para que funcione correctamente con el frontend (como LegajoDTO), tu `SueldoDTO.java` debería verse así:

```java
package com.ripser_back.dto.empleado;

import com.fasterxml.jackson.annotation.JsonFormat;
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
public class SueldoDTO {
    
    private Long id;
    
    @NotNull(message = "El empleado es obligatorio")
    private Long empleadoId;
    
    @NotNull(message = "El período es obligatorio")
    private String periodo; // YYYY-MM format
    
    @NotNull(message = "El sueldo básico es obligatorio")
    @PositiveOrZero
    private BigDecimal sueldoBasico;
    
    @PositiveOrZero
    private BigDecimal bonificaciones;
    
    @PositiveOrZero
    private BigDecimal horasExtras;
    
    @PositiveOrZero
    private BigDecimal comisiones;
    
    private BigDecimal totalBruto;
    
    @PositiveOrZero
    private BigDecimal descuentosLegales;
    
    @PositiveOrZero
    private BigDecimal descuentosOtros;
    
    private BigDecimal totalDescuentos;
    
    private BigDecimal sueldoNeto;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaPago;
    
    private String observaciones;
    
    // Campos adicionales del empleado para el frontend
    private String empleadoNombre;
    private String empleadoApellido;
    private String empleadoDni;
    
    // Objeto empleado completo (como en LegajoDTO)
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

## SueldoService - Método convertToDTO

En tu `SueldoService.java`, agrega este método (similar al de LegajoService):

```java
private SueldoDTO convertToDTO(Sueldo sueldo) {
    SueldoDTO dto = new SueldoDTO();
    dto.setId(sueldo.getId());
    dto.setEmpleadoId(sueldo.getEmpleado().getId());
    dto.setPeriodo(sueldo.getPeriodo());
    dto.setSueldoBasico(sueldo.getSueldoBasico());
    dto.setBonificaciones(sueldo.getBonificaciones());
    dto.setHorasExtras(sueldo.getHorasExtras());
    dto.setComisiones(sueldo.getComisiones());
    dto.setTotalBruto(sueldo.getTotalBruto());
    dto.setDescuentosLegales(sueldo.getDescuentosLegales());
    dto.setDescuentosOtros(sueldo.getDescuentosOtros());
    dto.setTotalDescuentos(sueldo.getTotalDescuentos());
    dto.setSueldoNeto(sueldo.getSueldoNeto());
    dto.setFechaPago(sueldo.getFechaPago());
    dto.setObservaciones(sueldo.getObservaciones());
    
    // Campos adicionales del empleado
    Empleado emp = sueldo.getEmpleado();
    dto.setEmpleadoNombre(emp.getNombre());
    dto.setEmpleadoApellido(emp.getApellido());
    dto.setEmpleadoDni(emp.getDni());
    
    // Objeto empleado completo
    SueldoDTO.EmpleadoSimpleDTO empleadoDTO = new SueldoDTO.EmpleadoSimpleDTO();
    empleadoDTO.setId(emp.getId());
    empleadoDTO.setNombre(emp.getNombre());
    empleadoDTO.setApellido(emp.getApellido());
    empleadoDTO.setDni(emp.getDni());
    empleadoDTO.setEmail(emp.getEmail());
    empleadoDTO.setTelefono(emp.getTelefono());
    dto.setEmpleado(empleadoDTO);
    
    return dto;
}
```

Y úsalo en todos los métodos que devuelven SueldoDTO:

```java
@Override
public List<SueldoDTO> getAll() {
    return sueldoRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
}

@Override
public SueldoDTO getById(Long id) {
    Sueldo sueldo = sueldoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sueldo no encontrado con id: " + id));
    return convertToDTO(sueldo);
}

// ... aplica a todos los métodos que devuelven SueldoDTO
```

## Solución Aplicada en Frontend

Ya actualicé `SueldosPage.tsx` para mapear la respuesta del backend:

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const [sueldosData, empleadosData] = await Promise.all([
      sueldoApi.getAll(),
      employeeApi.getAllList()
    ]);
    
    console.log('Sueldos raw data:', sueldosData);
    console.log('Empleados data:', empleadosData);
    
    // Mapear los sueldos para incluir el objeto empleado completo
    const sueldosConEmpleado = Array.isArray(sueldosData) 
      ? sueldosData.map((sueldo: any) => {
          const empleado = empleadosData.find((e: any) => e.id === sueldo.empleadoId);
          return {
            ...sueldo,
            empleado: empleado || {
              id: sueldo.empleadoId,
              nombre: sueldo.empleadoNombre || '',
              apellido: sueldo.empleadoApellido || '',
              dni: sueldo.empleadoDni || ''
            }
          };
        })
      : [];
    
    console.log('Sueldos mapped:', sueldosConEmpleado);
    
    setSueldos(sueldosConEmpleado);
    setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
  } catch (err) {
    setError('Error al cargar los datos');
    console.error('Error loading data:', err);
    setSueldos([]);
    setEmpleados([]);
  } finally {
    setLoading(false);
  }
};
```

## Próximos Pasos

1. **Actualiza tu SueldoDTO.java** con la estructura recomendada arriba
2. **Actualiza SueldoService.java** para usar `convertToDTO()`
3. **Verifica en consola** los logs que agregamos: "Sueldos raw data" y "Sueldos mapped"
4. **Confirma que los sueldos aparecen** en la tabla del frontend

## Debugging

Si después de actualizar el backend sigues sin ver datos:

1. Abre la consola del navegador (F12)
2. Busca los logs "Sueldos raw data" y "Sueldos mapped"
3. Verifica la estructura de los datos
4. Compárteme la salida de los logs para ajustar el mapeo si es necesario
