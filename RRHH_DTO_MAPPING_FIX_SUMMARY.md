# 🔧 Fix Completo: RRHH Module - DTO Mapping Issues

## 🎯 Problema General

Todas las páginas del módulo RRHH que trabajan con relaciones de Empleado tienen el **mismo problema**:

- **Backend**: Devuelve DTOs con `empleadoId`, `empleadoNombre`, `empleadoApellido`, etc. (campos separados)
- **Frontend**: Espera un objeto `empleado: Empleado` completo

Esto causa errores tipo `Cannot read properties of undefined (reading 'id')` cuando el frontend intenta acceder a `registro.empleado.id`.

## ✅ Páginas Afectadas y Estado

| Página | Estado | Solución Aplicada |
|--------|--------|-------------------|
| **PuestosPage** | ✅ Fijo | Safety checks en salarioBase |
| **AsistenciasPage** | ✅ RECIÉN ARREGLADO | Mapeo completo + safety checks |
| **LicenciasPage** | ⚠️ Revisar | Probablemente necesita el mismo fix |
| **CapacitacionesPage** | ✅ RECIÉN ARREGLADO | Mapeo completo + safety checks |
| **SueldosPage** | ✅ RECIÉN ARREGLADO | Mapeo completo + safety checks |
| **LegajosPage** | ✅ Fijo | Mapeo completo + safety checks + filtro empleados sin legajo |

## 🔨 Solución Implementada

### 1. **AsistenciasPage.tsx** ✅ COMPLETADO

#### Cambios en `loadAsistenciasByPeriodo()`:
```typescript
const loadAsistenciasByPeriodo = async () => {
  try {
    setError(null);
    const data = await registroAsistenciaApi.getByPeriodo(fechaDesde, fechaHasta);
    
    console.log('Asistencias raw data:', data);
    console.log('Empleados disponibles:', empleados);
    
    // ✅ MAPEO: Convierte empleadoId → empleado object
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

#### Safety Checks Agregados:
1. **Filtros** (línea ~158):
   ```typescript
   const filteredAsistencias = asistencias.filter(a => {
     if (!a.empleado) return false;  // ✅ Nuevo
     // ...
   });
   ```

2. **Estadísticas** (línea ~318):
   ```typescript
   const empleadosUnicos = new Set(
     filteredAsistencias
       .filter(a => a.empleado?.id)  // ✅ Nuevo
       .map(a => a.empleado.id)
   ).size;
   ```

3. **Form** (línea ~173):
   ```typescript
   empleadoId: asistencia.empleado?.id?.toString() || '',  // ✅ Cambió
   ```

4. **Tabla** (línea ~523):
   ```typescript
   {asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A'}  // ✅ Nuevo
   ```

5. **Dialog Delete** (línea ~711):
   ```typescript
   {selected && selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}  // ✅ Cambió
   ```

### 2. **SueldosPage.tsx** ✅ COMPLETADO

#### Cambios en `loadData()`:
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
    
    // ✅ MAPEO: Convierte empleadoId → empleado object
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

Los safety checks ya existían en SueldosPage ✅

### 3. **LegajosPage.tsx** ✅ YA ESTABA ARREGLADO

Ya tenía el mapeo completo y además agregamos el filtro de empleados sin legajo.

## 📋 Archivos de Referencia Creados

1. **SueldoDTO_BACKEND_REFERENCE.md**
   - Estructura recomendada para `SueldoDTO.java`
   - Método `convertToDTO()` para `SueldoService.java`

2. **RegistroAsistenciaDTO_BACKEND_REFERENCE.md**
   - Estructura recomendada para `RegistroAsistenciaDTO.java`
   - Método `toDTO()` mejorado para `RegistroAsistenciaMapper.java`
   - Actualización de `toEntity()` para buscar empleado

3. **CapacitacionDTO_BACKEND_REFERENCE.md** ⚠️ NUEVO
   - **CRÍTICO**: CapacitacionController devuelve entidad directa sin DTO
   - Estructura completa para `CapacitacionDTO.java`
   - Código completo para crear `CapacitacionService.java`
   - Controller actualizado con service layer
   - Soluciona problemas de serialización Jackson y lazy loading

## 🎯 Próximas Acciones Requeridas

### Frontend (✅ COMPLETADO)
- [x] AsistenciasPage mapeo y safety checks
- [x] SueldosPage mapeo y safety checks
- [x] CapacitacionesPage mapeo y safety checks  
- [x] LegajosPage mapeo y filtro empleados sin legajo
- [x] Logs de debugging agregados

### Backend (⚠️ PENDIENTE - TU PARTE)

Necesitas actualizar 3 DTOs en el backend para incluir el objeto `empleado` completo:

#### 1. **SueldoDTO.java**
```java
// Agregar estos campos:
private String empleadoNombre;
private String empleadoApellido;
private String empleadoDni;
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
```

#### 2. **RegistroAsistenciaDTO.java**
```java
// Agregar los mismos campos que en SueldoDTO
```

#### 3. **CapacitacionDTO.java** ⚠️ CRÍTICO
```java
// Necesita crear DTO completo + Service layer
// Ver CapacitacionDTO_BACKEND_REFERENCE.md
```

#### 4. **LicenciaDTO.java** (si existe, probablemente necesita el mismo fix)
```java
// Agregar los mismos campos que en SueldoDTO
```

Luego, en los servicios/mappers:
- `SueldoService.java` → Método `convertToDTO()`
- `RegistroAsistenciaMapper.java` → Método `toDTO()`
- `CapacitacionService.java` → **CREAR NUEVO** con método `convertToDTO()`
- `LicenciaService.java` o `LicenciaMapper.java` → Método `toDTO()`

Ver los archivos `*_BACKEND_REFERENCE.md` para los detalles completos.

## 🐛 Debugging

Para verificar que funciona:

1. **Abre el frontend** en cada página (Asistencias, Sueldos)
2. **Abre la consola** del navegador (F12)
3. **Busca los logs**:
   - "Asistencias raw data:" / "Sueldos raw data:"
   - "Asistencias mapped:" / "Sueldos mapped:"
4. **Verifica** que `mapped` tenga el objeto `empleado` completo
5. **Comparte** los logs si algo no funciona

## 📊 Resumen del Patrón

Este patrón se repite en **TODAS** las entidades con relación a Empleado:

```typescript
// ❌ Backend devuelve:
{
  id: 1,
  empleadoId: 5,
  empleadoNombre: "Juan",
  empleadoApellido: "Pérez",
  // ... otros campos
}

// ✅ Frontend necesita:
{
  id: 1,
  empleado: {
    id: 5,
    nombre: "Juan",
    apellido: "Pérez",
    dni: "12345678",
    // ... más campos
  },
  // ... otros campos
}
```

**Solución**: Mapear en `loadData()` o `loadAsistencias()` usando el array de empleados.

## ⚡ Próxima Página a Revisar

**LicenciasPage** probablemente tiene el mismo problema. Si ves errores similares, aplica el mismo patrón de mapeo.
