# Error del Backend: Filtro de Tenancy no Configurado

## Problema Identificado

Al crear un usuario con sucursal asignada, el backend está fallando con el siguiente error:

```
org.hibernate.UnknownFilterException: No filter named 'tenantFilter'
at com.ripser_back.config.HibernateFilterConfiguration.preHandle
```

## Detalles del Error

### Stack Trace Clave
```
2025-12-17T12:28:17.496-03:00 ERROR 33864 --- [turnos-api] [nio-8080-exec-1] c.r.config.HibernateFilterConfiguration  : Error al habilitar filtro tenantFilter

org.hibernate.UnknownFilterException: No filter named 'tenantFilter'
	at org.hibernate.internal.SessionFactoryImpl.getFilterDefinition(SessionFactoryImpl.java:1041)
	at org.hibernate.engine.spi.LoadQueryInfluencers.enableFilter(LoadQueryInfluencers.java:200)
	at org.hibernate.internal.SessionImpl.enableFilter(SessionImpl.java:1920)
	at com.ripser_back.config.HibernateFilterConfiguration.preHandle(HibernateFilterConfiguration.java:43)
```

### Endpoint que Falla
- **Método**: `PUT /api/usuario-empresa/{id}`
- **Status**: 500 Internal Server Error
- **Contexto**: Al actualizar `sucursalDefectoId` después de crear la asignación usuario-empresa

## Causa Raíz

El interceptor `HibernateFilterConfiguration` está intentando habilitar un filtro de Hibernate llamado `tenantFilter` que:
1. No existe o no está definido en las entidades
2. No está registrado en la configuración de Hibernate
3. Está mal nombrado (diferente del nombre real del filtro)

## Solución en el Backend

### Opción 1: Verificar y Corregir el Nombre del Filtro

**Archivo a Revisar**: `HibernateFilterConfiguration.java` (línea 43)

```java
// Código actual (probablemente)
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    try {
        // ...
        entityManager.enableFilter("tenantFilter"); // ❌ Nombre incorrecto
        // ...
    } catch (Exception e) {
        log.error("Error al habilitar filtro tenantFilter", e);
    }
    return true;
}
```

**Corrección**: Usar el nombre correcto del filtro definido en las entidades. Revisar las anotaciones `@FilterDef` en las entidades para encontrar el nombre correcto. Ejemplo:

```java
// Buscar en las entidades algo como:
@Entity
@FilterDef(name = "empresaFilter", parameters = @ParamDef(name = "empresaId", type = Long.class))
@Filter(name = "empresaFilter", condition = "empresa_id = :empresaId")
public class UsuarioEmpresa {
    // ...
}
```

Si el filtro se llama `empresaFilter`, entonces:

```java
entityManager.enableFilter("empresaFilter"); // ✅ Nombre correcto
```

### Opción 2: Agregar Validación para Evitar el Error

Si el filtro no siempre está disponible, agregar validación:

```java
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    try {
        Session session = entityManager.unwrap(Session.class);
        SessionFactory sessionFactory = session.getSessionFactory();

        // Verificar si el filtro existe antes de habilitarlo
        if (sessionFactory.getFilterDefinition("tenantFilter") != null) {
            entityManager.enableFilter("tenantFilter")
                .setParameter("empresaId", empresaId);
        } else {
            log.warn("Filtro 'tenantFilter' no está definido, saltando...");
        }
    } catch (Exception e) {
        log.error("Error al habilitar filtro tenantFilter", e);
        // No lanzar excepción para no bloquear la request
    }
    return true;
}
```

### Opción 3: Definir el Filtro en las Entidades

Si el filtro no existe, agregarlo a la entidad `UsuarioEmpresa`:

```java
@Entity
@Table(name = "usuario_empresa")
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "empresaId", type = Long.class)
)
@Filter(
    name = "tenantFilter",
    condition = "empresa_id = :empresaId"
)
public class UsuarioEmpresa {
    // ...
}
```

## Solución Temporal en el Frontend (Ya Implementada)

Para evitar el error del `PUT`, el frontend ahora envía `sucursalDefectoId` directamente en el `POST` inicial:

**Antes** (2 llamadas):
```typescript
// 1. Crear asignación
POST /api/usuario-empresa
{
  usuarioId: 15,
  empresaId: 1,
  sucursalId: 3,
  rol: "USUARIO_SUCURSAL"
}

// 2. Actualizar con sucursal defecto (❌ FALLA)
PUT /api/usuario-empresa/8
{
  sucursalDefectoId: 3
}
```

**Ahora** (1 llamada):
```typescript
// Crear asignación con sucursal defecto
POST /api/usuario-empresa
{
  usuarioId: 15,
  empresaId: 1,
  sucursalId: 3,
  sucursalDefectoId: 3,  // ✅ Enviado directamente
  rol: "USUARIO_SUCURSAL"
}
```

## Cambios Necesarios en el Backend

### 1. Actualizar el DTO de Asignación

**Archivo**: `AsignarUsuarioDTO.java`

```java
public class AsignarUsuarioDTO {
    private Long usuarioId;
    private Long empresaId;
    private Long sucursalId;
    private Long sucursalDefectoId;  // ⬅️ AGREGAR ESTE CAMPO
    private RolEmpresa rol;
    private String observaciones;

    // Getters y Setters
}
```

### 2. Actualizar el Service para Aceptar sucursalDefectoId

**Archivo**: `UsuarioEmpresaService.java`

```java
public UsuarioEmpresa asignarUsuario(AsignarUsuarioDTO dto) {
    UsuarioEmpresa usuarioEmpresa = new UsuarioEmpresa();
    usuarioEmpresa.setUsuarioId(dto.getUsuarioId());
    usuarioEmpresa.setEmpresaId(dto.getEmpresaId());
    usuarioEmpresa.setSucursalId(dto.getSucursalId());
    usuarioEmpresa.setSucursalDefectoId(dto.getSucursalDefectoId()); // ⬅️ AGREGAR
    usuarioEmpresa.setRol(dto.getRol());
    usuarioEmpresa.setObservaciones(dto.getObservaciones());
    usuarioEmpresa.setEsActivo(true);
    usuarioEmpresa.setFechaAsignacion(LocalDateTime.now());

    return usuarioEmpresaRepository.save(usuarioEmpresa);
}
```

## Testing

Después de implementar las correcciones:

1. **Crear usuario con sucursal**:
```bash
POST /api/admin/usuarios
{
  "username": "testuser",
  "email": "test@test.com",
  "password": "12345678",
  "nombre": "Test",
  "apellido": "User",
  "rolEmpresa": "USUARIO_SUCURSAL",
  "empresaId": 1,
  "sucursalId": 3,
  "sucursalDefectoId": 3
}
```

2. **Verificar que se guarden ambos campos**:
```bash
GET /api/usuario-empresa/usuario/{usuarioId}
```

Respuesta esperada:
```json
[
  {
    "id": 8,
    "usuarioId": 15,
    "empresaId": 1,
    "sucursalId": 3,
    "sucursalDefectoId": 3,  // ✅ Debe estar presente
    "rol": "USUARIO_SUCURSAL",
    "esActivo": true
  }
]
```

## Problema Adicional: Nombre y Apellido No se Guardan

Los logs muestran que el frontend envía correctamente `nombre` y `apellido`:

```javascript
📝 Datos del formulario a enviar: {
  apellido: "Bennet",
  email: "vendedor4@mail.com.ar",
  empresaId: 1,
  nombre: "Juliana",  // ✅ Se envía
  // ...
}
```

Pero no se guardan en la base de datos. Verificar en el backend:

### Revisar el DTO de Creación de Usuario

**Archivo**: `CreateUsuarioDTO.java` o similar

```java
public class CreateUsuarioDTO {
    private String username;
    private String password;
    private String email;
    private String nombre;    // ⬅️ Verificar que existe
    private String apellido;  // ⬅️ Verificar que existe
    private List<String> roles;

    // Getters y Setters
}
```

### Revisar el Service de Creación

**Archivo**: `UsuarioService.java`

```java
public Usuario createUsuario(CreateUsuarioDTO dto) {
    Usuario usuario = new Usuario();
    usuario.setUsername(dto.getUsername());
    usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
    usuario.setEmail(dto.getEmail());
    usuario.setNombre(dto.getNombre());      // ⬅️ VERIFICAR
    usuario.setApellido(dto.getApellido());  // ⬅️ VERIFICAR
    usuario.setEnabled(true);
    // ...

    return usuarioRepository.save(usuario);
}
```

## Resumen de Tareas para el Backend

- [ ] Corregir el nombre del filtro en `HibernateFilterConfiguration.java` o agregar validación
- [ ] Agregar campo `sucursalDefectoId` en `AsignarUsuarioDTO`
- [ ] Actualizar el servicio de asignación para guardar `sucursalDefectoId`
- [ ] Verificar que `nombre` y `apellido` se estén guardando en el DTO y Service de creación de usuario
- [ ] Probar la creación de usuarios con todos los campos
