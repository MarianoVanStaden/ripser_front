# RegistroAsistenciaDTO Backend Reference

## Problema Detectado
AsistenciasPage no muestra los registros de asistencia de la base de datos y genera error al guardar porque hay **mismatch entre el DTO del backend y el tipo esperado en el frontend**.

## Error Original
```
Uncaught TypeError: Cannot read properties of undefined (reading 'id')
    at AsistenciasPage.tsx:291:75
```

## Frontend Type (src/types/index.ts)
```typescript
interface RegistroAsistencia {
  id: number;
  empleado: Empleado;  // ← Espera objeto completo
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horasTrabajadas: number;
  horasExtras: number;
  observaciones?: string;
}
```

## RegistroAsistenciaDTO Backend Recomendado

Tu `RegistroAsistenciaDTO.java` debería tener esta estructura:

```java
package com.ripser_back.dto.empleado;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroAsistenciaDTO {
    
    private Long id;
    
    @NotNull(message = "El empleado es obligatorio")
    private Long empleadoId;
    
    @NotNull(message = "La fecha es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fecha;
    
    @NotNull(message = "La hora de entrada es obligatoria")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaEntrada;
    
    @NotNull(message = "La hora de salida es obligatoria")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime horaSalida;
    
    @PositiveOrZero
    private Double horasTrabajadas;
    
    @PositiveOrZero
    private Double horasExtras;
    
    private String observaciones;
    
    // Campos adicionales del empleado para el frontend
    private String empleadoNombre;
    private String empleadoApellido;
    private String empleadoDni;
    
    // Objeto empleado completo (como en LegajoDTO y SueldoDTO)
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

## RegistroAsistenciaMapper - Método toDTO

En tu `RegistroAsistenciaMapper.java`, actualiza el método `toDTO()`:

```java
package com.ripser_back.mappers;

import com.ripser_back.dto.empleado.RegistroAsistenciaDTO;
import com.ripser_back.entities.Empleado;
import com.ripser_back.entities.RegistroAsistencia;
import org.springframework.stereotype.Component;

@Component
public class RegistroAsistenciaMapper {
    
    public RegistroAsistenciaDTO toDTO(RegistroAsistencia entity) {
        if (entity == null) {
            return null;
        }
        
        RegistroAsistenciaDTO dto = new RegistroAsistenciaDTO();
        dto.setId(entity.getId());
        dto.setEmpleadoId(entity.getEmpleado().getId());
        dto.setFecha(entity.getFecha());
        dto.setHoraEntrada(entity.getHoraEntrada());
        dto.setHoraSalida(entity.getHoraSalida());
        dto.setHorasTrabajadas(entity.getHorasTrabajadas());
        dto.setHorasExtras(entity.getHorasExtras());
        dto.setObservaciones(entity.getObservaciones());
        
        // Campos adicionales del empleado
        Empleado emp = entity.getEmpleado();
        dto.setEmpleadoNombre(emp.getNombre());
        dto.setEmpleadoApellido(emp.getApellido());
        dto.setEmpleadoDni(emp.getDni());
        
        // Objeto empleado completo
        RegistroAsistenciaDTO.EmpleadoSimpleDTO empleadoDTO = new RegistroAsistenciaDTO.EmpleadoSimpleDTO();
        empleadoDTO.setId(emp.getId());
        empleadoDTO.setNombre(emp.getNombre());
        empleadoDTO.setApellido(emp.getApellido());
        empleadoDTO.setDni(emp.getDni());
        empleadoDTO.setEmail(emp.getEmail());
        empleadoDTO.setTelefono(emp.getTelefono());
        dto.setEmpleado(empleadoDTO);
        
        return dto;
    }
    
    public RegistroAsistencia toEntity(RegistroAsistenciaDTO dto) {
        if (dto == null) {
            return null;
        }
        
        RegistroAsistencia entity = new RegistroAsistencia();
        
        // Si es una actualización, preservar el ID
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        
        // El empleado debe ser obtenido del servicio/repositorio
        // IMPORTANTE: Esto debe hacerse en el servicio, no en el mapper
        // entity.setEmpleado(...); // Se asigna en el servicio
        
        entity.setFecha(dto.getFecha());
        entity.setHoraEntrada(dto.getHoraEntrada());
        entity.setHoraSalida(dto.getHoraSalida());
        entity.setHorasTrabajadas(dto.getHorasTrabajadas());
        entity.setHorasExtras(dto.getHorasExtras());
        entity.setObservaciones(dto.getObservaciones());
        
        return entity;
    }
}
```

## RegistroAsistenciaServiceImpl - Actualizar save()

En tu servicio, asegúrate de asignar el empleado correctamente:

```java
@Override
public RegistroAsistencia save(RegistroAsistencia registroAsistencia) {
    // Si viene con empleadoId pero sin objeto empleado
    if (registroAsistencia.getEmpleado() == null || registroAsistencia.getEmpleado().getId() == null) {
        throw new IllegalArgumentException("Debe especificar un empleado válido");
    }
    
    // Verificar que el empleado existe
    Empleado empleado = empleadoRepository.findById(registroAsistencia.getEmpleado().getId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Empleado no encontrado con id: " + registroAsistencia.getEmpleado().getId()));
    
    registroAsistencia.setEmpleado(empleado);
    
    return registroAsistenciaRepository.save(registroAsistencia);
}
```

O mejor aún, modifica el `toEntity()` para aceptar el `empleadoRepository`:

```java
@Service
public class RegistroAsistenciaMapper {
    
    @Autowired
    private EmpleadoRepository empleadoRepository;
    
    public RegistroAsistencia toEntity(RegistroAsistenciaDTO dto) {
        if (dto == null) {
            return null;
        }
        
        RegistroAsistencia entity = new RegistroAsistencia();
        
        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        
        // Obtener empleado del repositorio
        if (dto.getEmpleadoId() != null) {
            Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                        "Empleado no encontrado con id: " + dto.getEmpleadoId()));
            entity.setEmpleado(empleado);
        }
        
        entity.setFecha(dto.getFecha());
        entity.setHoraEntrada(dto.getHoraEntrada());
        entity.setHoraSalida(dto.getHoraSalida());
        entity.setHorasTrabajadas(dto.getHorasTrabajadas());
        entity.setHorasExtras(dto.getHorasExtras());
        entity.setObservaciones(dto.getObservaciones());
        
        return entity;
    }
}
```

## Solución Aplicada en Frontend

Ya actualicé `AsistenciasPage.tsx` con el mapeo necesario:

```typescript
const loadAsistenciasByPeriodo = async () => {
  try {
    setError(null);
    const data = await registroAsistenciaApi.getByPeriodo(fechaDesde, fechaHasta);
    
    console.log('Asistencias raw data:', data);
    console.log('Empleados disponibles:', empleados);
    
    // Mapear las asistencias para incluir el objeto empleado completo
    const asistenciasConEmpleado = Array.isArray(data)
      ? data.map((asistencia: any) => {
          const empleado = empleados.find((e: any) => e.id === asistencia.empleadoId);
          return {
            ...asistencia,
            empleado: empleado || {
              id: asistencia.empleadoId,
              nombre: asistencia.empleadoNombre || '',
              apellido: asistencia.empleadoApellido || '',
              dni: asistencia.empleadoDni || ''
            }
          };
        })
      : [];
    
    console.log('Asistencias mapped:', asistenciasConEmpleado);
    
    setAsistencias(asistenciasConEmpleado);
  } catch (err) {
    setError('Error al cargar las asistencias');
    console.error('Error loading asistencias:', err);
    setAsistencias([]);
  }
};
```

## Safety Checks Agregados

✅ Filtros: `if (!a.empleado) return false;`
✅ Estadísticas: `.filter(a => a.empleado?.id).map(a => a.empleado.id)`
✅ Form: `empleadoId: asistencia.empleado?.id?.toString() || ''`
✅ Tabla: `{asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A'}`
✅ Dialog: `{selected && selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}`

## Próximos Pasos

1. **Actualiza RegistroAsistenciaDTO.java** con la estructura recomendada
2. **Actualiza RegistroAsistenciaMapper.java** con el método toDTO mejorado
3. **Verifica el método save()** en el servicio para asignar el empleado correctamente
4. **Prueba en el frontend** y verifica los logs en consola
5. **Comparte los logs** si sigues teniendo problemas

## Debugging

1. Abre la consola del navegador (F12)
2. Ve a la página de Asistencias
3. Busca los logs: "Asistencias raw data" y "Asistencias mapped"
4. Verifica la estructura de los datos
5. Compárteme la salida si necesitas ayuda adicional
