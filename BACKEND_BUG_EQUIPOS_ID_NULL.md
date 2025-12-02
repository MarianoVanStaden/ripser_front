# 🐛 BUG CRÍTICO: Endpoint `/api/equipos-fabricados` devuelve `id: null`

**Fecha:** 2 de Diciembre, 2025
**Prioridad:** 🔴 ALTA
**Estado:** Requiere corrección en BACKEND

---

## 📋 Problema

El endpoint `GET /api/equipos-fabricados` está devolviendo equipos con **`id: null`**.

### Evidencia:

```json
{
  "id": null,              // ❌ PROBLEMA: ID es null
  "empresaId": 1,
  "tipo": "HELADERA",
  "modelo": "AX1",
  "numeroHeladera": "HEL-0043",
  "color": "BLANCO",
  "cantidad": 1,
  "asignado": false,
  "estado": "EN_PROCESO",
  "fechaCreacion": "2025-12-02T10:30:00",
  "responsableNombre": "Juan Perez"
}
```

### Logs del Frontend:
```javascript
📊 params.row: {id: null, empresaId: 1, tipo: 'HELADERA', ...}
🆔 params.row.id: null
```

---

## 🎯 Endpoints Afectados

### ❌ Endpoint con problema:
- **`GET /api/equipos-fabricados`** (lista paginada)
- **Retorna:** `Page<EquipoFabricadoListDTO>`
- **Problema:** Campo `id` es `null`

### ✅ Endpoints que funcionan correctamente:
- **`GET /api/equipos-fabricados/{id}`** (individual por ID)
- **`GET /api/equipos-fabricados/numero/{numeroHeladera}`** (individual por número)
- Estos SÍ devuelven el campo `id` correctamente

---

## 🔍 Causa Probable

El problema está en la **proyección o mapeo del DTO** `EquipoFabricadoListDTO`.

### Posibles causas:

1. **Proyección de JPA mal configurada:**
   ```java
   // ❌ INCORRECTO: falta mapear 'id'
   @Query("SELECT new com.example.dto.EquipoFabricadoListDTO(" +
          "e.tipo, e.modelo, e.numeroHeladera, e.color, " +
          "e.cantidad, e.asignado, e.estado, e.fechaCreacion) " +
          "FROM EquipoFabricado e")
   Page<EquipoFabricadoListDTO> findAllProjected(Pageable pageable);
   ```

2. **Constructor del DTO sin `id`:**
   ```java
   // ❌ INCORRECTO: constructor sin id
   public EquipoFabricadoListDTO(TipoEquipo tipo, String modelo, ...) {
       // falta this.id = id;
   }
   ```

3. **Mapper que no incluye `id`:**
   ```java
   // ❌ INCORRECTO: mapper no mapea id
   public static EquipoFabricadoListDTO toListDTO(EquipoFabricado entity) {
       EquipoFabricadoListDTO dto = new EquipoFabricadoListDTO();
       // dto.setId(entity.getId()); ← FALTA ESTO
       dto.setTipo(entity.getTipo());
       // ...
   }
   ```

---

## ✅ Solución en Backend

### Opción 1: Corregir la Query JPQL

```java
@Query("SELECT new com.example.dto.EquipoFabricadoListDTO(" +
       "e.id, " +  // ✅ AGREGAR EL ID AQUÍ
       "e.empresaId, " +
       "e.tipo, " +
       "e.modelo, " +
       "e.numeroHeladera, " +
       "e.color, " +
       "e.medida, " +
       "e.cantidad, " +
       "e.asignado, " +
       "e.estado, " +
       "e.estadoAsignacion, " +
       "e.fechaCreacion, " +
       "e.fechaFinalizacion, " +
       "r.nombre, " +  // responsable
       "c.nombre) " +  // cliente
       "FROM EquipoFabricado e " +
       "LEFT JOIN e.responsable r " +
       "LEFT JOIN e.cliente c " +
       "WHERE e.empresaId = :empresaId")
Page<EquipoFabricadoListDTO> findAllByEmpresaId(@Param("empresaId") Long empresaId, Pageable pageable);
```

### Opción 2: Corregir el Constructor del DTO

```java
public class EquipoFabricadoListDTO {
    private Long id;  // ✅ Debe estar presente
    private Long empresaId;
    private TipoEquipo tipo;
    private String modelo;
    // ... otros campos

    // ✅ Constructor CON id
    public EquipoFabricadoListDTO(
        Long id,           // ✅ AGREGAR ID COMO PRIMER PARÁMETRO
        Long empresaId,
        TipoEquipo tipo,
        String modelo,
        String numeroHeladera,
        String color,
        String medida,
        Integer cantidad,
        Boolean asignado,
        EstadoFabricacion estado,
        EstadoAsignacionEquipo estadoAsignacion,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaFinalizacion,
        String responsableNombre,
        String clienteNombre
    ) {
        this.id = id;  // ✅ ASIGNAR EL ID
        this.empresaId = empresaId;
        this.tipo = tipo;
        this.modelo = modelo;
        // ... resto de asignaciones
    }
}
```

### Opción 3: Corregir el Mapper

```java
public class EquipoFabricadoMapper {

    public static EquipoFabricadoListDTO toListDTO(EquipoFabricado entity) {
        EquipoFabricadoListDTO dto = new EquipoFabricadoListDTO();

        dto.setId(entity.getId());  // ✅ AGREGAR ESTA LÍNEA
        dto.setEmpresaId(entity.getEmpresaId());
        dto.setTipo(entity.getTipo());
        dto.setModelo(entity.getModelo());
        dto.setNumeroHeladera(entity.getNumeroHeladera());
        dto.setColor(entity.getColor());
        dto.setMedida(entity.getMedida());
        dto.setCantidad(entity.getCantidad());
        dto.setAsignado(entity.isAsignado());
        dto.setEstado(entity.getEstado());
        dto.setEstadoAsignacion(entity.getEstadoAsignacion());
        dto.setFechaCreacion(entity.getFechaCreacion());
        dto.setFechaFinalizacion(entity.getFechaFinalizacion());

        if (entity.getResponsable() != null) {
            dto.setResponsableNombre(entity.getResponsable().getNombre());
        }

        if (entity.getCliente() != null) {
            dto.setClienteNombre(entity.getCliente().getNombre());
        }

        return dto;
    }
}
```

---

## 🔧 Workaround Temporal en Frontend

He implementado un **workaround temporal** que:

1. **Usa `numeroHeladera` como identificador** en lugar de `id`
2. **Hace 2 peticiones:**
   - Primera: `GET /api/equipos-fabricados/numero/{numeroHeladera}` para obtener el equipo completo con ID
   - Segunda: `PATCH /api/equipos-fabricados/{id}/completar` usando el ID obtenido

### Código del Workaround:

```typescript
// equipoFabricadoApi.ts
completarFabricacionPorNumero: async (numeroHeladera: string) => {
  // Step 1: Get equipo by numeroHeladera to get the real ID
  const equipoResponse = await api.get(`/api/equipos-fabricados/numero/${numeroHeladera}`);
  const equipoId = equipoResponse.data.id;

  // Step 2: Use that ID to complete
  const response = await api.patch(`/api/equipos-fabricados/${equipoId}/completar`);
  return response.data;
}
```

**⚠️ Esta solución es temporal y NO debe usarse en producción.** Hace 2 peticiones HTTP cuando debería hacer solo 1.

---

## 📝 Cómo Verificar la Corrección

### 1. Ejecutar el endpoint:
```bash
GET http://localhost:8080/api/equipos-fabricados?page=0&size=10
Headers:
  Authorization: Bearer {token}
  X-Empresa-Id: 1
```

### 2. Verificar la respuesta:
```json
{
  "content": [
    {
      "id": 123,         // ✅ DEBE SER UN NÚMERO, NO NULL
      "empresaId": 1,
      "tipo": "HELADERA",
      "modelo": "AX1",
      "numeroHeladera": "HEL-0043",
      // ... otros campos
    }
  ],
  "totalElements": 50,
  "totalPages": 5
}
```

### 3. Verificar en logs del frontend:
```javascript
// Debería mostrar:
📊 params.row: {id: 123, empresaId: 1, tipo: 'HELADERA', ...}
🆔 params.row.id: 123  // ✅ NO NULL
```

---

## 🎯 Impacto

### Funcionalidades Afectadas:
- ❌ **Completar fabricación** de equipos
- ❌ **Cancelar fabricación** de equipos
- ❌ **Editar equipos** desde la lista
- ❌ **Eliminar equipos** desde la lista
- ❌ **Asignar/Desasignar** clientes desde la lista
- ❌ **Ver detalle** de equipos desde la lista

### Funcionalidades que SÍ funcionan:
- ✅ Listar equipos (se muestran correctamente)
- ✅ Crear nuevos equipos
- ✅ Buscar equipo individual por número
- ✅ Ver detalle de equipo (si se accede directamente por URL)

---

## 🚀 Pasos para Corregir

1. **Localizar el archivo del Controller o Repository:**
   - `EquipoFabricadoController.java`
   - `EquipoFabricadoRepository.java`
   - `EquipoFabricadoService.java`

2. **Buscar el método que maneja `GET /api/equipos-fabricados`:**
   ```java
   @GetMapping
   public ResponseEntity<Page<EquipoFabricadoListDTO>> findAll(
       Pageable pageable,
       @RequestHeader("X-Empresa-Id") Long empresaId
   ) {
       // ...
   }
   ```

3. **Revisar la Query JPQL o el Mapper** usado en ese método

4. **Agregar el campo `id` al constructor/query/mapper**

5. **Probar el endpoint** y verificar que `id` ya no sea `null`

6. **Remover el workaround del frontend** una vez corregido

---

## 📊 Estado Actual

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Backend | 🔴 Requiere corrección | Agregar `id` al DTO de listado |
| Frontend | 🟡 Workaround activo | Remover workaround después de corrección |
| Funcionalidad | 🟡 Funciona con workaround | Probar después de corrección |

---

## 📞 Contacto

Si necesitas ayuda para corregir el backend, proporciona:
1. El código del método `findAll` en el Controller
2. El código del Repository/Service que hace la query
3. El código completo del `EquipoFabricadoListDTO`

---

**Implementado por:** Claude Code
**Fecha:** 2 de Diciembre, 2025
**Prioridad:** 🔴 CRÍTICA - Corregir lo antes posible
