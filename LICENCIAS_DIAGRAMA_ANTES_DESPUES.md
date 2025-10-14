# 🔄 Licencias: Diagrama Antes vs Después

## ❌ ANTES (Con Error)

```
Frontend (LicenciasPage.tsx)
│
│ POST /api/licencias
│ Body: { empleadoId: 1, tipo: "VACACIONES", ... }
│
▼
LicenciaController.java
│
│ @PostMapping
│ save(@RequestBody LicenciaDTO dto) {
│   Licencia licencia = mapper.toEntity(dto);  // ⚠️ PROBLEMA AQUÍ
│   return mapper.toDTO(service.save(licencia));
│ }
│
▼
LicenciaMapper.java (MapStruct)
│
│ toEntity(dto) {
│   licencia.setTipo(dto.getTipo());
│   licencia.setFechaInicio(dto.getFechaInicio());
│   // ... otros campos ...
│   // ❌ NO asigna empleado.setEmpleado(...)
│   // Solo intenta: licencia.setEmpleadoId(...) → NO EXISTE
│ }
│
▼
Database
│
│ INSERT INTO licencias (empleado_id, ...) VALUES (NULL, ...)
│ ❌ ERROR: Column 'empleado_id' cannot be null
```

---

## ✅ DESPUÉS (Correcto)

```
Frontend (LicenciasPage.tsx)
│
│ POST /api/licencias
│ Body: { empleadoId: 1, tipo: "VACACIONES", ... }
│
▼
LicenciaController.java
│
│ @PostMapping
│ save(@RequestBody LicenciaDTO dto) {
│   Licencia licencia = service.save(dto);  // ✅ Service maneja todo
│   return service.convertToDTO(licencia);
│ }
│
▼
LicenciaService.java
│
│ save(LicenciaDTO dto) {
│   
│   // 1️⃣ Buscar el Empleado real en BD
│   Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
│       .orElseThrow(...);
│   
│   // 2️⃣ Crear/buscar Licencia
│   Licencia licencia = new Licencia();
│   
│   // 3️⃣ ✅ ASIGNAR OBJETO COMPLETO
│   licencia.setEmpleado(empleado);
│   
│   // 4️⃣ Setear otros campos
│   licencia.setTipo(dto.getTipo());
│   licencia.setFechaInicio(dto.getFechaInicio());
│   // ...
│   
│   // 5️⃣ Guardar
│   return licenciaRepository.save(licencia);
│ }
│
▼
Database
│
│ INSERT INTO licencias (empleado_id, tipo, ...) VALUES (1, 'VACACIONES', ...)
│ ✅ SUCCESS: empleado_id tiene valor correcto
```

---

## 🔑 Diferencia Clave

### ❌ **Mapper.toEntity()** (MapStruct)
```java
// NO funciona para relaciones JPA
Licencia licencia = mapper.toEntity(dto);
// Resultado: empleado_id = NULL ❌
```

### ✅ **Service.save()** (Manual)
```java
// Funciona correctamente
Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId()).orElseThrow();
licencia.setEmpleado(empleado);
// Resultado: empleado_id = 1 ✅
```

---

## 📊 Comparación de Código

| Aspecto | ANTES (Mapper) | DESPUÉS (Service) |
|---------|----------------|-------------------|
| **Controller** | `mapper.toEntity(dto)` | `service.save(dto)` |
| **Conversión** | Automática (MapStruct) | Manual (Service) |
| **Relaciones** | ❌ Ignora `@ManyToOne` | ✅ Asigna objeto completo |
| **empleado_id** | `NULL` | Valor correcto |
| **Resultado** | 💥 Error 500 | ✅ Success 201 |

---

## 🎯 Por Qué MapStruct No Funciona Aquí

### MapStruct es bueno para:
- ✅ DTOs planos (sin relaciones)
- ✅ Conversiones simples campo-a-campo
- ✅ Respuestas (Entity → DTO)

### MapStruct NO es bueno para:
- ❌ Relaciones JPA (`@ManyToOne`, `@OneToMany`)
- ❌ Creación de entidades con FK
- ❌ Lógica de negocio

### Por eso en este caso:
```java
// ❌ NO USAR
Licencia licencia = mapper.toEntity(dto);

// ✅ USAR
Licencia licencia = service.save(dto); // Service busca Empleado y asigna objeto
```

---

## 🔧 Patrón Aplicado en Todo el Sistema

Este mismo patrón se debe usar en:

| Entidad | Controller | Service | Estado |
|---------|-----------|---------|--------|
| **Capacitaciones** | ✅ Usa service | ✅ Implementado | ✅ Funciona |
| **Sueldos** | ✅ Usa service | ✅ Implementado | ✅ Funciona |
| **Asistencias** | ✅ Usa service | ✅ Implementado | ✅ Funciona |
| **Licencias** | ❌ Usa mapper | ⚠️ Pendiente | 💥 Error 500 |
| **Puestos** | ❌ Usa mapper | ⚠️ Pendiente | ⚠️ Null values |
| **Legajos** | ? | ? | ? |

---

## 📝 Checklist de Implementación

### Backend
- [ ] Crear método `LicenciaService.save(LicenciaDTO dto)`
- [ ] Crear método `LicenciaService.convertToDTO(Licencia)`
- [ ] Actualizar `LicenciaController.save()` para usar service
- [ ] Actualizar `LicenciaController.update()` para usar service
- [ ] Actualizar `LicenciaController.findAll()` para usar `convertToDTO()`
- [ ] Compilar: `mvn clean compile`

### Testing
- [ ] Probar POST `/api/licencias` con Postman
- [ ] Verificar INSERT en logs sin errores
- [ ] Verificar `empleado_id` tiene valor en BD
- [ ] Probar GET `/api/licencias` devuelve DTOs correctos
- [ ] Probar PUT `/api/licencias/{id}`
- [ ] Probar desde frontend (LicenciasPage)

### Frontend (Ya está bien)
- [x] Envía `empleadoId` como número
- [x] Validación de campos obligatorios
- [x] Console.log para debugging

---

## 🚀 Próximos Pasos

1. **Implementar LicenciaService.save()** siguiendo el documento `URGENTE_FIX_LICENCIAS_BACKEND.md`
2. **Actualizar LicenciaController** para usar el service
3. **Compilar backend**: `mvn clean compile`
4. **Probar en Postman** primero
5. **Probar desde frontend** (LicenciasPage)
6. **Aplicar mismo patrón a Puestos** (si es necesario)
7. **Aplicar mismo patrón a Legajos** (si es necesario)

---

## 💡 Lección Aprendida

> **MapStruct no puede manejar relaciones JPA automáticamente.**
> 
> Cuando tu DTO tiene `empleadoId` (Long) pero tu Entity necesita `empleado` (Empleado object), 
> debes usar un **Service Layer** que:
> 1. Busque la entidad relacionada en BD
> 2. Asigne el objeto completo
> 3. Guarde la entidad
> 
> No confíes en mappers automáticos para esto. ✅
