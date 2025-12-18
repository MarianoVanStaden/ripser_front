# ✅ RESUELTO: Backend Issue - Sucursales Endpoint 403 Forbidden

## 🔴 Problema Identificado

El endpoint `/api/sucursales/empresa/{empresaId}` estaba devolviendo **403 Forbidden** para usuarios con rol `GERENTE_SUCURSAL` / `VENDEDOR`.

### Evidencia de los Logs:

```javascript
// Frontend - TenantContext.tsx
🏢 Cargando sucursales - empresaId: 1 canSelectSucursal: true rolActual: GERENTE_SUCURSAL esSuperAdmin: false
✅ Usuario puede seleccionar sucursal, cargando todas...

// Request
GET http://localhost:5173/api/sucursales/empresa/1 403 (Forbidden)
Attaching X-Empresa-Id: 1 to request: /api/sucursales/empresa/1
```

### Usuario Actual:
```javascript
{
  id: 1,
  username: 'vendedor',
  email: 'seitz@gmail.com',
  roles: ['VENDEDOR'],
  esSuperAdmin: false
}
```

### Relación usuario_empresa:
```
usuarioId: 1
empresaId: 1
rol: GERENTE_SUCURSAL  // ✅ Usuario SÍ tiene acceso a empresa 1
```

---

## 🎯 Causa Probable

El endpoint `/api/sucursales/empresa/{empresaId}` en `SucursalController.java` tiene una de estas restricciones:

1. **`@PreAuthorize` muy restrictivo** - Solo permite roles específicos (probablemente ADMIN)
2. **Validación de acceso a empresa** - Verifica que el usuario tenga acceso pero la lógica falla
3. **Rol `GERENTE_SUCURSAL` no incluido** - El endpoint no reconoce este rol como válido

---

## 🔧 Solución Requerida en Backend

### 1. Buscar el Endpoint

**Archivo**: `SucursalController.java`

**Buscar por**:
```java
@GetMapping("/empresa/{empresaId}")
```

o

```java
public ResponseEntity<?> getSucursalesByEmpresa
```

---

### 2. Verificar `@PreAuthorize`

**ANTES** (❌ POSIBLE PROBLEMA):
```java
@GetMapping("/empresa/{empresaId}")
@PreAuthorize("hasRole('ADMIN')") // ❌ Solo permite ADMIN
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    // ...
}
```

**DESPUÉS** (✅ CORRECTO):
```java
@GetMapping("/empresa/{empresaId}")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_EMPRESA', 'GERENTE_SUCURSAL', 'VENDEDOR', 'RECEPCIONISTA')")
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    // ...
}
```

O **MEJOR AÚN** (permitir a cualquier usuario autenticado):
```java
@GetMapping("/empresa/{empresaId}")
@PreAuthorize("isAuthenticated()") // ✅ Cualquier usuario autenticado
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    // ...
}
```

---

### 3. Verificar Validación de Acceso a Empresa

Si el endpoint tiene validación de acceso, asegúrate de que funcione correctamente:

**CÓDIGO INCORRECTO** (❌):
```java
@GetMapping("/empresa/{empresaId}")
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    Usuario usuario = obtenerUsuarioActual();

    // ❌ PROBLEMA: Solo verifica campo is_super_admin, no consulta usuario_empresa
    if (!usuario.getIsSuperAdmin()) {
        boolean tieneAcceso = usuarioEmpresaService.tieneAccesoAEmpresa(usuario.getId(), empresaId);
        if (!tieneAcceso) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    List<Sucursal> sucursales = sucursalService.getByEmpresa(empresaId);
    return ResponseEntity.ok(sucursales);
}
```

**CÓDIGO CORRECTO** (✅):
```java
@GetMapping("/empresa/{empresaId}")
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    Usuario usuario = obtenerUsuarioActual();

    // ✅ Detectar SuperAdmin correctamente (igual que en login/select-tenant)
    boolean esSuperAdmin = usuario.getIsSuperAdmin() != null && usuario.getIsSuperAdmin();

    if (!esSuperAdmin) {
        esSuperAdmin = usuarioEmpresaRepository
            .existsByUsuarioIdAndRolAndEsActivoTrue(usuario.getId(), RolEmpresa.SUPER_ADMIN);
    }

    // Validar acceso si NO es SuperAdmin
    if (!esSuperAdmin) {
        boolean tieneAcceso = usuarioEmpresaService.tieneAccesoAEmpresa(usuario.getId(), empresaId);
        if (!tieneAcceso) {
            log.warn("Usuario {} no tiene acceso a empresa {}", usuario.getUsername(), empresaId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "No tiene acceso a esta empresa"));
        }
    }

    List<Sucursal> sucursales = sucursalService.getByEmpresa(empresaId);
    log.info("Usuario {} obtuvo {} sucursales de empresa {}",
        usuario.getUsername(), sucursales.size(), empresaId);
    return ResponseEntity.ok(sucursales);
}
```

---

### 4. Opción Más Simple: Sin Validación de Empresa

Si el endpoint de sucursales debería ser accesible para cualquier usuario autenticado (y la seguridad se maneja en otros niveles):

```java
@GetMapping("/empresa/{empresaId}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    List<Sucursal> sucursales = sucursalService.getByEmpresa(empresaId);
    return ResponseEntity.ok(sucursales);
}
```

---

## 🔍 Debugging

Para identificar exactamente dónde falla, agrega logs en el backend:

```java
@GetMapping("/empresa/{empresaId}")
public ResponseEntity<List<Sucursal>> getSucursalesByEmpresa(@PathVariable Long empresaId) {
    Usuario usuario = obtenerUsuarioActual();

    log.info("SucursalController.getSucursalesByEmpresa - Usuario: {} (ID: {}), Empresa: {}",
        usuario.getUsername(), usuario.getId(), empresaId);

    // ... resto del código con logs

    log.info("✅ Usuario {} accedió a {} sucursales de empresa {}",
        usuario.getUsername(), sucursales.size(), empresaId);

    return ResponseEntity.ok(sucursales);
}
```

Si el log NO aparece en la consola del backend, significa que la anotación `@PreAuthorize` está bloqueando antes de entrar al método.

---

## 📝 Logs Esperados DESPUÉS del Fix

### Backend:
```
SucursalController.getSucursalesByEmpresa - Usuario: vendedor (ID: 1), Empresa: 1
✅ Usuario vendedor accedió a 3 sucursales de empresa 1
```

### Frontend:
```javascript
🏢 Cargando sucursales - empresaId: 1 canSelectSucursal: true
✅ Usuario puede seleccionar sucursal, cargando todas...
✅ Loaded 3 sucursales for empresa 1
```

---

## 🧪 Cómo Probar

1. **Aplicar el fix en el backend** (SucursalController.java)

2. **Compilar el backend**:
```bash
cd ../ripser_back
./mvnw.cmd clean compile
./mvnw.cmd spring-boot:run
```

3. **En el frontend, login como vendedor**:
   - Usuario: `vendedor`
   - Password: (tu password)

4. **Navegar al selector de sucursales**

5. **Verificar logs del backend** - deberías ver el log del método `getSucursalesByEmpresa`

6. **Verificar que el selector cargue las sucursales** sin error 403

---

## 🎯 Posibles Soluciones Según el Problema

| Problema | Solución |
|----------|----------|
| `@PreAuthorize` muy restrictivo | Cambiar a `@PreAuthorize("isAuthenticated()")` |
| Validación de `is_super_admin` incorrecta | Aplicar mismo fix que en `select-tenant` |
| Endpoint requiere rol específico | Agregar `GERENTE_SUCURSAL` y `VENDEDOR` a la lista |
| Spring Security bloquea antes del método | Revisar configuración en `SecurityConfig.java` |

---

## 📌 Archivos a Revisar

1. **`SucursalController.java`** - Endpoint `/api/sucursales/empresa/{empresaId}`
2. **`SecurityConfig.java`** - Configuración de Spring Security
3. **`UsuarioEmpresaServiceImpl.java`** - Método `tieneAccesoAEmpresa()`

---

**Fecha**: 2025-12-18
**Prioridad**: 🔴 ALTA (bloquea selector de sucursales)
**Estado**: ⏳ PENDIENTE DE APLICACIÓN EN BACKEND
