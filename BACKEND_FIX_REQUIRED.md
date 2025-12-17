# Corrección requerida en el Backend

## Problema identificado

El usuario `adminempresa@gmail.com` tiene el rol `ADMIN_EMPRESA` en la base de datos, pero el backend está retornando `esSuperAdmin: true` en la respuesta del login.

## Datos del usuario en BD
- Email: `adminempresa@gmail.com`
- Rol en UsuarioEmpresa: `ADMIN_EMPRESA`
- Estado: Activo

## Respuesta incorrecta del backend
```json
{
  "username": "adminempresa",
  "email": "adminempresa@gmail.com",
  "roles": [...],
  "esSuperAdmin": true,  // ❌ INCORRECTO - debería ser false
  "empresaId": X,
  "sucursalId": Y
}
```

## Corrección necesaria

### 1. Revisar el endpoint de login

**Archivo:** Probablemente `AuthController.java` o similar

El backend debe determinar `esSuperAdmin` basándose en:

```java
// Lógica correcta
boolean esSuperAdmin = usuarioEmpresa.getRol() == RolEmpresa.SUPER_ADMIN;

// O si se usa el rol del Usuario directamente:
boolean esSuperAdmin = usuario.getRoles().stream()
    .anyMatch(role -> role.getNombre().equals("ROLE_SUPER_ADMIN"));
```

**IMPORTANTE:** El flag `esSuperAdmin` debe ser `true` SOLO para usuarios con rol `SUPER_ADMIN`, no para `ADMIN_EMPRESA`.

### 2. Revisar el endpoint select-tenant

**Endpoint:** `POST /api/auth/select-tenant`

También debe incluir la lógica correcta:

```java
@PostMapping("/select-tenant")
public ResponseEntity<LoginResponse> selectTenant(@RequestBody SelectTenantRequest request) {
    // Obtener el usuario autenticado
    Usuario usuario = getCurrentUser();

    // Obtener la relación usuario-empresa
    UsuarioEmpresa usuarioEmpresa = usuarioEmpresaRepository
        .findByUsuarioIdAndEmpresaId(usuario.getId(), request.getEmpresaId())
        .orElseThrow(() -> new RuntimeException("No tiene acceso a esta empresa"));

    // Validar que el usuario tenga acceso a la empresa
    if (!usuarioEmpresa.isEsActivo()) {
        throw new RuntimeException("Usuario no activo en esta empresa");
    }

    // Determinar esSuperAdmin CORRECTAMENTE
    boolean esSuperAdmin = usuarioEmpresa.getRol() == RolEmpresa.SUPER_ADMIN;

    // Generar nuevo token con el contexto
    String newToken = jwtUtils.generateToken(
        usuario,
        request.getEmpresaId(),
        request.getSucursalId(),
        esSuperAdmin
    );

    return ResponseEntity.ok(LoginResponse.builder()
        .accessToken(newToken)
        .empresaId(request.getEmpresaId())
        .sucursalId(request.getSucursalId())
        .esSuperAdmin(esSuperAdmin)  // ⚠️ DEBE reflejar el rol REAL
        .build());
}
```

### 3. Matriz de roles esperada

| Rol en BD | esSuperAdmin | Descripción |
|-----------|--------------|-------------|
| SUPER_ADMIN | `true` | Acceso total al sistema |
| ADMIN_EMPRESA | `false` | Admin de una empresa específica |
| GERENTE_SUCURSAL | `false` | Gerente de sucursal |
| SUPERVISOR | `false` | Supervisor |
| USUARIO_SUCURSAL | `false` | Usuario estándar |

### 4. Verificación

Después de corregir, probar el login con:

```bash
POST /api/auth/login
{
  "usernameOrEmail": "adminempresa@gmail.com",
  "password": "..."
}
```

**Respuesta esperada:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "id": X,
  "username": "adminempresa",
  "email": "adminempresa@gmail.com",
  "roles": ["ROLE_ADMIN"],
  "empresaId": Y,
  "sucursalId": Z,
  "esSuperAdmin": false  // ✅ CORRECTO para ADMIN_EMPRESA
}
```

### 5. Posibles lugares donde está el error

1. **AuthService/AuthController** - al generar la respuesta del login
2. **JwtUtils** - al generar/decodificar el token
3. **Usuario entity** - si tiene un campo `superAdmin` mal configurado
4. **Método helper** - si existe un método `isSuperAdmin()` que está mal implementado

## Testing

Para verificar que la corrección funciona:

1. Login con usuario SUPER_ADMIN → debe retornar `esSuperAdmin: true`
2. Login con usuario ADMIN_EMPRESA → debe retornar `esSuperAdmin: false`
3. Cambio de contexto → debe mantener el valor correcto de `esSuperAdmin`

## Logs para debugging

Agregar estos logs en el backend para confirmar:

```java
log.info("Usuario: {} - Rol: {} - EsSuperAdmin: {}",
    usuario.getUsername(),
    usuarioEmpresa.getRol(),
    esSuperAdmin);
```
