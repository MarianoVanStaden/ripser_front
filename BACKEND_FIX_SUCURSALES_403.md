# ✅ FIX: Error 403 Forbidden en /api/sucursales/empresa/{empresaId}

## 🔴 Problema Identificado

El endpoint `/api/sucursales/empresa/1` estaba devolviendo **403 Forbidden** cuando usuarios con roles `VENDEDOR`, `GERENTE_SUCURSAL` u `OFICINA` intentaban cargar el selector de sucursales.

### Error en el Frontend:
```
GET http://localhost:5173/api/sucursales/empresa/1 403 (Forbidden)
❌ Error al cargar sucursales para auto-selección
```

### Contexto del Usuario:
- **Usuario**: vendedor (ID: 1)
- **Email**: seitz@gmail.com
- **Rol**: VENDEDOR / GERENTE_SUCURSAL
- **esSuperAdmin**: false
- **canSelectSucursal**: true ✅

## 🔍 Causa Raíz

En el archivo `SecurityConfig.java`, la configuración de seguridad para el endpoint de sucursales estaba muy restrictiva:

```java
// ❌ ANTES - Solo permitía ciertos roles
.requestMatchers("/api/sucursales/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ADMIN_EMPRESA_1", "ADMIN_EMPRESA_2", "ADMIN_EMPRESA_3", "USER")
```

**Roles faltantes:**
- `VENDEDOR`
- `GERENTE_SUCURSAL`
- `OFICINA`
- `VENDEDOR_EMPRESA_1`, `VENDEDOR_EMPRESA_2`, `VENDEDOR_EMPRESA_3`

## ✅ Solución Implementada

### Archivo Modificado:
`src/main/java/com/ripser_back/security/config/SecurityConfig.java`

### Cambios Realizados:

```java
// ✅ DESPUÉS - Permite todos los roles que necesitan acceso
.requestMatchers("/api/empresas/**").hasAnyRole(
    "SUPER_ADMIN", 
    "ADMIN", 
    "ADMIN_EMPRESA_1", "ADMIN_EMPRESA_2", "ADMIN_EMPRESA_3",
    "VENDEDOR_EMPRESA_1", "VENDEDOR_EMPRESA_2", "VENDEDOR_EMPRESA_3",
    "GERENTE_SUCURSAL", 
    "VENDEDOR", 
    "OFICINA", 
    "USER"
)

.requestMatchers("/api/sucursales/**").hasAnyRole(
    "SUPER_ADMIN", 
    "ADMIN", 
    "ADMIN_EMPRESA_1", "ADMIN_EMPRESA_2", "ADMIN_EMPRESA_3",
    "VENDEDOR_EMPRESA_1", "VENDEDOR_EMPRESA_2", "VENDEDOR_EMPRESA_3",
    "GERENTE_SUCURSAL", 
    "VENDEDOR", 
    "OFICINA", 
    "USER"
)
```

## 🎯 Roles del Sistema

El sistema maneja dos esquemas de roles:

### 1. Roles Legacy de Spring Security:
- `SUPER_ADMIN` - Super administrador global
- `ADMIN` - Administrador general
- `VENDEDOR` - Usuario vendedor
- `OFICINA` - Usuario de oficina
- `TALLER` - Usuario de taller
- `USER` - Usuario básico

### 2. Roles Multi-Tenant por Empresa:
- `ADMIN_EMPRESA_1`, `ADMIN_EMPRESA_2`, `ADMIN_EMPRESA_3`
- `VENDEDOR_EMPRESA_1`, `VENDEDOR_EMPRESA_2`, `VENDEDOR_EMPRESA_3`

### 3. Roles Jerárquicos (RolEmpresa enum):
- `SUPER_ADMIN` (nivel 0)
- `ADMIN_EMPRESA` (nivel 1)
- `GERENTE_SUCURSAL` (nivel 2) - ⭐ **Puede seleccionar sucursales**
- `SUPERVISOR` (nivel 3)
- `USUARIO_SUCURSAL` (nivel 4)

## 📋 Pasos Siguientes

### 1. Reiniciar el Backend
```bash
# Detener la aplicación actual (Ctrl+C en la terminal)
# Luego ejecutar:
mvn clean install
mvn spring-boot:run
```

### 2. Verificar en el Frontend
1. Hacer login con el usuario `vendedor`
2. Verificar que el selector de sucursales cargue correctamente
3. Confirmar que no aparezca el error 403

### 3. Pruebas Recomendadas
- ✅ Usuario con rol `VENDEDOR` puede ver sucursales
- ✅ Usuario con rol `GERENTE_SUCURSAL` puede ver sucursales
- ✅ Usuario con rol `OFICINA` puede ver sucursales
- ✅ El filtrado por sucursal funciona correctamente
- ✅ Los permisos se respetan según el rol

## 🔒 Seguridad

Esta modificación **NO compromete la seguridad** porque:

1. **Todos los usuarios ya están autenticados** (pasan por JWT)
2. **El filtro de tenant** se encarga de mostrar solo las sucursales de la empresa del usuario
3. **Los roles tienen permisos adecuados** según la jerarquía definida en `RolEmpresa`
4. **GERENTE_SUCURSAL tiene acceso a módulos operativos** según el enum (VENTAS, CLIENTES, etc.)

## 🎉 Resultado Esperado

Después de reiniciar el backend:

```
✅ GET http://localhost:5173/api/sucursales/empresa/1 200 (OK)
✅ Sucursales cargadas correctamente
✅ Selector de sucursales visible
✅ Usuario puede trabajar normalmente
```

## 📝 Notas Adicionales

Si en el futuro aparece el mismo problema con otros endpoints, verificar:

1. Los roles permitidos en `SecurityConfig.java`
2. Los roles asignados al usuario en la base de datos
3. El token JWT contiene los roles correctos
4. Los headers `X-Empresa-Id` y `X-Sucursal-Id` se envían correctamente

---

**Fecha de fix**: 2025-01-18  
**Responsable**: GitHub Copilot  
**Impacto**: Medio - Afecta selector de sucursales para roles operativos  
**Prioridad**: Alta - Funcionalidad básica del sistema multi-tenant
