# Fix Requerido: AuthController.selectTenant

## 🔴 Problema Identificado

El endpoint `/api/auth/select-tenant` está calculando `esSuperAdmin: false` porque solo verifica el campo `is_super_admin` de la tabla `usuario`, pero **NO** consulta la tabla `usuario_empresa` como lo hace el login.

### Evidencia del Log:
```
AuthController.selectTenant - Usuario: admin (ID: 4), email: admin@example.com,
isSuperAdmin field: null, esSuperAdmin calculated: false
```

### Base de Datos:
```sql
-- Tabla usuario
id: 4, username: 'admin', is_super_admin: NULL

-- Tabla usuario_empresa
id: 9, usuario_id: 4, empresa_id: 1, rol: 'SUPER_ADMIN', es_activo: 1
```

El usuario **SÍ tiene** rol `SUPER_ADMIN` en `usuario_empresa`, pero el endpoint no lo está detectando.

---

## ✅ Solución Requerida

### AuthController.java (método selectTenant)

**ANTES** (❌ INCORRECTO):
```java
@PostMapping("/select-tenant")
public ResponseEntity<?> selectTenant(@RequestBody SelectTenantRequest request, @AuthenticationPrincipal UserDetails userDetails) {
    Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

    // ❌ Solo verifica el campo, no la tabla usuario_empresa
    boolean esSuperAdmin = usuario.getIsSuperAdmin() != null && usuario.getIsSuperAdmin();

    log.info("AuthController.selectTenant - Usuario: {} (ID: {}), email: {}, isSuperAdmin field: {}, esSuperAdmin calculated: {}",
        usuario.getUsername(), usuario.getId(), usuario.getEmail(), usuario.getIsSuperAdmin(), esSuperAdmin);

    // Verificar acceso si NO es super admin
    if (!esSuperAdmin) {
        boolean tieneAcceso = usuarioEmpresaService.tieneAccesoAEmpresa(usuario.getId(), request.getEmpresaId());
        if (!tieneAcceso) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "No tiene acceso a la empresa seleccionada"));
        }
    }

    // ...resto del código
}
```

**DESPUÉS** (✅ CORRECTO):
```java
@PostMapping("/select-tenant")
public ResponseEntity<?> selectTenant(@RequestBody SelectTenantRequest request, @AuthenticationPrincipal UserDetails userDetails) {
    Usuario usuario = usuarioRepository.findByUsername(userDetails.getUsername())
        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

    // ✅ MISMO CÓDIGO QUE EN JwtService.buildToken()
    // Determinar si es super admin de dos fuentes:
    // 1. Campo is_super_admin (legacy)
    // 2. Rol SUPER_ADMIN en usuario_empresa (autoritativo)
    boolean esSuperAdmin = usuario.getIsSuperAdmin() != null && usuario.getIsSuperAdmin();

    // Si no es super admin por el campo, verificar las relaciones usuario_empresa
    if (!esSuperAdmin) {
        try {
            esSuperAdmin = usuarioEmpresaRepository
                .existsByUsuarioIdAndRolAndEsActivoTrue(usuario.getId(), RolEmpresa.SUPER_ADMIN);
            log.info("AuthController.selectTenant - Usuario: {} (ID: {}), isSuperAdmin field: {}, tiene rol SUPER_ADMIN en usuario_empresa: {}",
                usuario.getUsername(), usuario.getId(), usuario.getIsSuperAdmin(), esSuperAdmin);
        } catch (Exception e) {
            log.warn("AuthController.selectTenant - Error al verificar rol SUPER_ADMIN para usuario {}: {}",
                usuario.getId(), e.getMessage());
        }
    } else {
        log.info("AuthController.selectTenant - Usuario: {} (ID: {}) es SuperAdmin por campo isSuperAdmin",
            usuario.getUsername(), usuario.getId());
    }

    // Verificar acceso si NO es super admin
    if (!esSuperAdmin) {
        boolean tieneAcceso = usuarioEmpresaService.tieneAccesoAEmpresa(usuario.getId(), request.getEmpresaId());
        if (!tieneAcceso) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "No tiene acceso a la empresa seleccionada"));
        }
    } else {
        log.info("AuthController.selectTenant - SuperAdmin {} puede acceder a CUALQUIER empresa (ID: {})",
            usuario.getUsername(), request.getEmpresaId());
    }

    // ...resto del código
}
```

---

## 📍 Ubicación del Archivo

**Archivo**: Probablemente `AuthController.java` o `AuthServiceImpl.java`

**Buscar por**:
```java
@PostMapping("/select-tenant")
```

o

```java
public ResponseEntity<?> selectTenant
```

---

## 🔧 Cambios Necesarios

### 1. Inyectar UsuarioEmpresaRepository

Si `AuthController` no tiene acceso a `UsuarioEmpresaRepository`, agrégalo:

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioEmpresaRepository usuarioEmpresaRepository; // ✅ AGREGAR
    private final UsuarioEmpresaService usuarioEmpresaService;
    // ...

    public AuthController(
        AuthService authService,
        UsuarioRepository usuarioRepository,
        UsuarioEmpresaRepository usuarioEmpresaRepository, // ✅ AGREGAR
        UsuarioEmpresaService usuarioEmpresaService
        // ...
    ) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.usuarioEmpresaRepository = usuarioEmpresaRepository; // ✅ AGREGAR
        this.usuarioEmpresaService = usuarioEmpresaService;
        // ...
    }
}
```

### 2. Actualizar la lógica de detección

Reemplazar la línea:
```java
boolean esSuperAdmin = usuario.getIsSuperAdmin() != null && usuario.getIsSuperAdmin();
```

Con el bloque completo mostrado arriba.

---

## 📝 Logs Esperados DESPUÉS del Fix

### Backend:
```
AuthController.selectTenant - Usuario: admin (ID: 4), isSuperAdmin field: null, tiene rol SUPER_ADMIN en usuario_empresa: true
AuthController.selectTenant - SuperAdmin admin puede acceder a CUALQUIER empresa (ID: 1)
```

### Frontend:
```
✅ Tenant cambiado exitosamente
🔄 Recargando aplicación...
```

---

## 🧪 Cómo Probar

1. **Aplicar el fix en el backend** (AuthController.java)

2. **Compilar el backend**:
```bash
cd ../ripser_back
./mvnw.cmd clean compile
./mvnw.cmd spring-boot:run
```

3. **En el frontend, login como admin**:
   - Usuario: `admin`
   - Password: `000`

4. **Ir al tenant selector** y seleccionar cualquier empresa

5. **Clic en "Aplicar Cambios"**

6. **Verificar logs del backend** - deberías ver:
```
AuthController.selectTenant - Usuario: admin (ID: 4), isSuperAdmin field: null, tiene rol SUPER_ADMIN en usuario_empresa: true
AuthController.selectTenant - SuperAdmin admin puede acceder a CUALQUIER empresa (ID: X)
```

7. **Verificar que el cambio de tenant funcione** sin error 403

---

## 🎯 Resultado Esperado

Después de este fix:

1. ✅ SuperAdmin puede cambiar contexto a CUALQUIER empresa
2. ✅ No recibe error 403 "No tiene acceso a la empresa seleccionada"
3. ✅ El log muestra correctamente que es SuperAdmin
4. ✅ Consistencia entre `/api/auth/login` y `/api/auth/select-tenant`

---

## 📊 Resumen de Endpoints que Necesitan el Fix

| Endpoint | Estado | Archivo |
|----------|--------|---------|
| `/api/auth/login` | ✅ CORREGIDO | `JwtService.java` |
| `/api/auth/select-tenant` | ❌ PENDIENTE | `AuthController.java` |
| Otros endpoints que usan `esSuperAdmin` | ⚠️ REVISAR | Varios |

**Recomendación**: Extraer la lógica de detección a un método helper para reutilizar:

```java
// En una clase Service o Helper
public static boolean isUserSuperAdmin(Usuario usuario, UsuarioEmpresaRepository repo) {
    boolean esSuperAdmin = usuario.getIsSuperAdmin() != null && usuario.getIsSuperAdmin();

    if (!esSuperAdmin) {
        try {
            esSuperAdmin = repo.existsByUsuarioIdAndRolAndEsActivoTrue(
                usuario.getId(), RolEmpresa.SUPER_ADMIN
            );
        } catch (Exception e) {
            log.warn("Error verificando rol SUPER_ADMIN para usuario {}: {}",
                usuario.getId(), e.getMessage());
        }
    }

    return esSuperAdmin;
}
```

Luego usar en ambos lugares:
```java
// En JwtService
boolean esSuperAdmin = AuthHelper.isUserSuperAdmin(usuario, usuarioEmpresaRepository);

// En AuthController
boolean esSuperAdmin = AuthHelper.isUserSuperAdmin(usuario, usuarioEmpresaRepository);
```

---

**Fecha**: 2025-12-18
**Prioridad**: 🔴 ALTA (bloquea funcionalidad SuperAdmin)
**Estado**: ✅ COMPLETADO - Fix aplicado al backend
