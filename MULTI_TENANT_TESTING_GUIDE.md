# 🧪 Guía de Pruebas - Multi-Tenant

**Fecha:** 30 de Noviembre, 2025
**Estado del Frontend:** ✅ Configurado
**Estado del Backend:** ✅ Endpoint implementado

---

## 📋 Checklist de Integración

### Frontend ✅

- [x] Tipos TypeScript actualizados (`SelectTenantRequest`, `AuthResponse`)
- [x] Servicio `authApi.selectTenant()` implementado
- [x] Servicio `empresaService` usando API configurada
- [x] Servicio `sucursalService` usando API configurada
- [x] Servicio `usuarioEmpresaService` usando API configurada
- [x] Context `TenantContext` con función `cambiarTenant()`
- [x] Interceptor de Axios enviando token automáticamente
- [x] Componente `TenantSelector` con manejo de errores mejorado
- [x] Componente `EmpresasPage` para gestión de empresas
- [x] Componente `SucursalesPage` para gestión de sucursales
- [x] Rutas configuradas en `App.tsx`
- [x] Items de menú en Sidebar

### Backend (según documentación)

- [x] Endpoint `/api/auth/select-tenant` implementado
- [x] Validación de autenticación
- [x] Validación de permisos (ADMIN vs usuario normal)
- [x] Generación de JWT con `empresaId` y `sucursalId`
- [x] Manejo de errores (400, 401, 403, 500)

---

## 🧪 Plan de Pruebas

### 1. Verificación de Autenticación

**Objetivo:** Confirmar que el token se envía correctamente.

**Pasos:**
1. Iniciar sesión en la aplicación
2. Abrir DevTools → Network
3. Navegar a "Administración" → "Empresas"
4. Verificar en la pestaña Network que la request a `/api/empresas` incluye:
   ```
   Headers:
   Authorization: Bearer eyJhbGciOi...
   ```

**Resultado esperado:** ✅ El header `Authorization` está presente en todas las requests.

---

### 2. Prueba de Listado de Empresas

**Objetivo:** Verificar que el usuario puede ver las empresas.

**Pasos:**
1. Navegar a "Administración" → "Empresas"
2. Verificar que aparece la lista de empresas

**Resultado esperado:**
- ✅ Si eres ADMIN: Ves todas las empresas
- ✅ Si eres usuario normal: Ves solo las empresas a las que tienes acceso

**Errores comunes:**
- ❌ Error 500: Problema de serialización en el backend (agregar `@JsonIgnoreProperties`)
- ❌ Error 403: No tienes permisos para ver empresas
- ❌ Lista vacía: No hay empresas creadas o no tienes acceso

---

### 3. Prueba de Listado de Sucursales

**Objetivo:** Verificar que el usuario puede ver las sucursales de una empresa.

**Pasos:**
1. Navegar a "Administración" → "Sucursales"
2. Seleccionar una empresa del dropdown
3. Verificar que aparecen las sucursales de esa empresa

**Resultado esperado:** ✅ Se cargan las sucursales correctamente.

**Errores comunes:**
- ❌ Error 500: Problema de serialización Hibernate (agregar `@JsonIgnoreProperties` a `Sucursal.java`)
- ❌ Lista vacía: La empresa no tiene sucursales creadas

---

### 4. Prueba de Cambio de Contexto (Tenant Switching)

**Objetivo:** Verificar que el usuario puede cambiar entre empresas/sucursales.

**Pasos:**
1. Navegar a "Administración" → "Cambiar Contexto"
2. Seleccionar una empresa del dropdown
3. Opcionalmente seleccionar una sucursal
4. Hacer clic en "Aplicar Cambios"
5. Observar DevTools → Console y Network

**Resultado esperado:**
- ✅ Request POST a `/api/auth/select-tenant` con status 200
- ✅ Mensaje en consola: "Attaching token to request"
- ✅ La página se recarga automáticamente
- ✅ El contexto se actualiza (empresaId y sucursalId en localStorage)

**Errores posibles:**

#### Error 400 - Bad Request
```json
{
  "error": "empresaId es requerido"
}
```
**Causa:** No se seleccionó ninguna empresa.
**Solución:** El frontend ya valida esto, pero verificar que `selectedEmpresa` no sea null.

---

#### Error 401 - Unauthorized
```json
{
  "error": "Usuario no autenticado"
}
```
**Causa:** Token expirado o inválido.
**Solución:**
- Verificar que el token se está enviando en el header
- Verificar que el token no ha expirado
- Si expiró, el sistema debería redirigir al login

**En el frontend:**
El componente `TenantSelector` mostrará:
```
Su sesión ha expirado. Por favor, inicie sesión nuevamente.
```
Y redirigirá automáticamente al login después de 2 segundos.

---

#### Error 403 - Forbidden
```json
{
  "error": "No tiene acceso a la empresa seleccionada"
}
```
**Causa:** El usuario intenta cambiar a una empresa a la cual no tiene acceso asignado.

**Solución:**
- Si eres ADMIN: Esto no debería pasar, los ADMIN tienen acceso a todo
- Si eres usuario normal: Debes tener un registro en la tabla `usuario_empresa` con estado ACTIVO para esa empresa
- Contactar al administrador para que te asigne acceso

**En el frontend:**
El componente `TenantSelector` mostrará:
```
No tiene acceso a la empresa seleccionada. Contacte al administrador para obtener permisos.
```

---

#### Error 500 - Internal Server Error
```json
{
  "error": "Error al cambiar tenant",
  "message": "Descripción detallada del error"
}
```
**Causa:** Error en el backend al procesar el cambio de tenant.

**Posibles causas:**
1. Error al generar el JWT
2. Error al verificar acceso en la base de datos
3. Problema con el JwtTokenProvider

**Solución:**
- Revisar los logs del backend
- Verificar que el método `generateTokenWithTenant()` esté implementado correctamente
- Verificar que el repositorio `usuarioEmpresaRepository` exista y funcione

**En el frontend:**
El componente `TenantSelector` mostrará:
```
Error del servidor: [mensaje específico del backend]
```

---

### 5. Verificación del Nuevo Token

**Objetivo:** Confirmar que el nuevo token incluye los claims correctos.

**Pasos:**
1. Después de cambiar de contexto, abrir DevTools → Console
2. Buscar el log: `[JWT] { sub: ..., roles: ..., exp: ... }`
3. Verificar que incluye `empresaId` y `sucursalId`

**Resultado esperado:**
```javascript
[JWT] {
  sub: "maria.gonzalez",
  roles: ["ADMIN", "USER"],
  exp: "2025-11-30T...",
  empresaId: 1,
  sucursalId: 2,
  esSuperAdmin: true
}
```

**Verificación adicional:**
```javascript
// En la consola del navegador:
console.log({
  empresaId: localStorage.getItem('empresaId'),
  sucursalId: localStorage.getItem('sucursalId'),
  esSuperAdmin: localStorage.getItem('esSuperAdmin'),
  accessToken: localStorage.getItem('auth_token')?.substring(0, 20) + '...'
});
```

---

## 🔍 Debugging

### Ver el Estado Actual del Tenant

Abre la consola del navegador y ejecuta:

```javascript
// Ver datos de localStorage
console.log('=== TENANT CONTEXT ===');
console.log('Empresa ID:', localStorage.getItem('empresaId'));
console.log('Sucursal ID:', localStorage.getItem('sucursalId'));
console.log('Es Super Admin:', localStorage.getItem('esSuperAdmin'));
console.log('Token:', localStorage.getItem('auth_token')?.substring(0, 30) + '...');

// Decodificar JWT (solo para debugging, no es seguro)
const token = localStorage.getItem('auth_token');
if (token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(base64));
  console.log('JWT Payload:', payload);
}
```

### Ver Requests en Vivo

En DevTools → Network:
1. Filtrar por "XHR"
2. Observar cada request y verificar:
   - ✅ Status: 200 (éxito)
   - ✅ Headers → Authorization: Bearer ...
   - ✅ Response: datos correctos

---

## 📊 Casos de Prueba Completos

### Caso 1: Usuario ADMIN cambia de empresa

**Precondiciones:**
- Usuario con rol ADMIN autenticado
- Al menos 2 empresas creadas

**Pasos:**
1. Login como ADMIN
2. Ir a "Cambiar Contexto"
3. Seleccionar Empresa A
4. Click "Aplicar Cambios"

**Resultado esperado:**
- ✅ Status 200
- ✅ Nuevo token con empresaId de Empresa A
- ✅ Página se recarga
- ✅ Contexto actualizado

---

### Caso 2: Usuario ADMIN cambia de empresa y sucursal

**Precondiciones:**
- Usuario con rol ADMIN autenticado
- Empresa con sucursales creadas

**Pasos:**
1. Login como ADMIN
2. Ir a "Cambiar Contexto"
3. Seleccionar Empresa A
4. Seleccionar Sucursal 1
5. Click "Aplicar Cambios"

**Resultado esperado:**
- ✅ Status 200
- ✅ Nuevo token con empresaId y sucursalId
- ✅ Página se recarga
- ✅ Contexto actualizado

---

### Caso 3: Usuario normal cambia a empresa con acceso

**Precondiciones:**
- Usuario normal autenticado (sin rol ADMIN)
- Usuario tiene registro en `usuario_empresa` con estado ACTIVO para Empresa A

**Pasos:**
1. Login como usuario normal
2. Ir a "Cambiar Contexto"
3. Seleccionar Empresa A (donde tiene acceso)
4. Click "Aplicar Cambios"

**Resultado esperado:**
- ✅ Status 200
- ✅ Nuevo token generado
- ✅ Contexto cambiado correctamente

---

### Caso 4: Usuario normal intenta cambiar a empresa SIN acceso

**Precondiciones:**
- Usuario normal autenticado (sin rol ADMIN)
- Usuario NO tiene registro en `usuario_empresa` para Empresa B

**Pasos:**
1. Login como usuario normal
2. Ir a "Cambiar Contexto"
3. Intentar seleccionar Empresa B (sin acceso)
4. Click "Aplicar Cambios"

**Resultado esperado:**
- ❌ Status 403
- ❌ Mensaje: "No tiene acceso a la empresa seleccionada"
- ❌ El contexto NO cambia

---

### Caso 5: Token expirado

**Precondiciones:**
- Usuario autenticado con token que está por expirar

**Pasos:**
1. Esperar a que el token expire
2. Intentar cambiar de contexto

**Resultado esperado:**
- ❌ Status 401
- ❌ Mensaje: "Su sesión ha expirado"
- ✅ Redirección automática al login después de 2 segundos

**Nota:** El interceptor en `config.ts` debería intentar refrescar el token automáticamente antes de que expire.

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: "Type definition error: ByteBuddyInterceptor"

**Síntoma:**
Error 500 al cargar empresas o sucursales con mensaje:
```
Type definition error: [simple type, class org.hibernate.proxy.pojo.bytebuddy.ByteBuddyInterceptor]
```

**Causa:**
Hibernate lazy loading + Jackson serialization problem.

**Solución en Backend:**
Agregar a tus entidades `Empresa.java`, `Sucursal.java`, `UsuarioEmpresa.java`:

```java
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Empresa {
    // ...
}
```

---

### Problema: CORS aún bloqueando requests

**Síntoma:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solución:**
Verificar que tu `SecurityConfig.java` tenga:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList(
        "http://localhost:*",
        "http://127.0.0.1:*"
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

---

### Problema: El frontend muestra empresas pero el cambio de contexto falla

**Síntoma:**
- ✅ `/api/empresas` funciona (200)
- ❌ `/api/auth/select-tenant` falla (403 o 500)

**Posibles causas:**
1. El endpoint no está configurado en SecurityConfig
2. Falta implementar el método en AuthController
3. Error en la lógica de validación de permisos

**Solución:**
Revisar la documentación completa del endpoint y verificar la implementación en el backend.

---

## 📝 Notas Importantes

1. **Recarga de Página:**
   - El cambio de contexto recarga la página automáticamente (`window.location.reload()`)
   - Esto asegura que todos los datos se actualicen con el nuevo contexto
   - Si no quieres recargar, puedes actualizar solo el estado global de React

2. **Persistencia del Contexto:**
   - El contexto se guarda en `localStorage`
   - Sobrevive a recargas de página
   - Se limpia al hacer logout

3. **Super Admin:**
   - Los usuarios ADMIN tienen acceso a todas las empresas
   - No necesitan registros en `usuario_empresa`
   - El flag `esSuperAdmin` se determina por el rol `ADMIN`

4. **Seguridad:**
   - El backend SIEMPRE valida los permisos
   - No confíes solo en validaciones del frontend
   - El JWT contiene el contexto de tenant para todas las requests

---

## ✅ Resumen de Verificación

Antes de dar por completa la integración, verificar:

- [ ] Login funciona y guarda el token
- [ ] El token se envía en todas las requests (ver DevTools)
- [ ] Listado de empresas funciona (sin error 500)
- [ ] Listado de sucursales funciona (sin error 500)
- [ ] Cambio de contexto funciona para ADMIN
- [ ] Cambio de contexto funciona para usuario con acceso
- [ ] Cambio de contexto falla correctamente (403) para usuario sin acceso
- [ ] Errores se muestran con mensajes claros al usuario
- [ ] El nuevo token incluye empresaId y sucursalId
- [ ] Los datos se filtran correctamente por tenant
- [ ] Logout limpia el contexto correctamente

---

**¡Si todos los checks están en ✅, la integración multi-tenant está completa y funcional!**
