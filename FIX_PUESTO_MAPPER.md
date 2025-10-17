# 🚨 FIX: PuestoMapper no mapea departamento y salarioBase

## 🎯 Problema

El backend **guarda** correctamente en la BD:
```sql
departamento: "Administración"
salarioBase: 50000
```

Pero el frontend **recibe**:
```json
{
  "id": 1,
  "nombre": "Vendedor",
  "descripcion": "Vendedor",
  "departamento": null,  // ❌
  "salarioBase": null    // ❌
}
```

**Causa**: MapStruct no está generando correctamente el mapper con todos los campos.

## ✅ Solución: Mapper Manual

Reemplaza tu `PuestoMapper.java` con un mapper **manual** (más confiable):

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
        dto.setDepartamento(puesto.getDepartamento());     // 🔥 EXPLÍCITO
        dto.setSalarioBase(puesto.getSalarioBase());       // 🔥 EXPLÍCITO
        
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
        puesto.setDepartamento(dto.getDepartamento());     // 🔥 EXPLÍCITO
        puesto.setSalarioBase(dto.getSalarioBase());       // 🔥 EXPLÍCITO
        
        return puesto;
    }
}
```

## 🔄 Alternativa: Forzar Recompilación de MapStruct

Si prefieres seguir usando MapStruct:

1. **Limpia el proyecto**:
   ```bash
   mvn clean
   ```

2. **Recompila**:
   ```bash
   mvn compile
   ```

3. **Verifica** que MapStruct generó la implementación en `target/generated-sources/annotations/`

4. **Reinicia** el servidor

## 🎯 Qué Hacer Ahora

### Opción 1: Mapper Manual (RECOMENDADO - 2 minutos)
1. Reemplaza `PuestoMapper.java` con el código de arriba
2. Cambia `@Mapper(componentModel = "spring")` a `@Component`
3. Cambia `interface` a `class`
4. Reinicia el backend
5. Recarga el frontend

### Opción 2: Fix MapStruct (5 minutos)
1. Ejecuta `mvn clean compile`
2. Verifica `target/generated-sources/annotations/`
3. Si no se generó correctamente, usa la Opción 1

## 📋 Verificación

Después del fix, al hacer GET `/api/puestos` deberías ver:

```json
[
  {
    "id": 1,
    "nombre": "Vendedor",
    "descripcion": "Vendedor",
    "departamento": "Ventas",      // ✅ No null
    "salarioBase": 50000           // ✅ No null
  }
]
```

## 🔍 Por Qué Falló MapStruct

MapStruct genera el código en tiempo de compilación. Si:
- No se ejecutó `mvn compile` después de agregar los campos al DTO
- Hubo un error en la generación
- Los tipos no coinciden exactamente

Entonces genera un mapper **incompleto** que solo mapea los campos que existían antes.

## 🚀 Después del Fix

1. Reinicia el backend
2. Recarga la página de Puestos en el frontend
3. Verifica en la consola: "Puestos raw data"
4. Deberías ver `departamento` y `salarioBase` con valores
