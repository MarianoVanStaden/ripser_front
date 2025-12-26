# 🔧 Backend Fix Required: Tenant Filtering for DocumentoComercial

## ❌ Problema Detectado

Cuando un **SuperAdmin** cambia el contexto de empresa (de empresa ID=1 a empresa ID=2), los documentos comerciales (facturas, presupuestos, notas de pedido, etc.) **siguen mostrando datos de la empresa anterior** en lugar de filtrar por la nueva empresa seleccionada.

### Síntomas:
- El frontend envía correctamente el header `X-Empresa-Id: 2`
- El backend devuelve documentos de empresa ID=1 en lugar de ID=2
- El cambio de contexto no afecta los datos mostrados en el Dashboard y módulo de Ventas

---

## 🔍 Diagnóstico del Frontend

El frontend está funcionando correctamente:

### 1. Llamada a `select-tenant`
```typescript
// TenantContext.tsx
const data = await authApi.selectTenant({
  empresaId: newEmpresaId,  // 2
  sucursalId: newSucursalId
});

// Actualiza localStorage
localStorage.setItem('empresaId', newEmpresaId.toString()); // "2"
```

### 2. Header en cada request
```typescript
// api/config.ts - Interceptor de Axios
const empresaId = localStorage.getItem('empresaId'); // "2"

if (empresaId) {
  config.headers['X-Empresa-Id'] = empresaId;
  console.log('🏢 Attaching X-Empresa-Id:', empresaId); // "2"
}
```

### 3. Verificación en DevTools
En la pestaña Network del navegador, cada request a `/api/documentos/*` incluye:
```
Request Headers:
  Authorization: Bearer eyJ...
  X-Empresa-Id: 2
```

**Conclusión: El problema está en el backend, no en el frontend.**

---

## ✅ Solución Requerida en Backend

### Paso 1: Verificar/Agregar @Filter en DocumentoComercial

**Archivo**: `DocumentoComercial.java`

```java
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Entity
@Table(name = "documento_comercial")
@FilterDef(
    name = "tenantFilter", 
    parameters = @ParamDef(name = "empresaId", type = Long.class)
)
@Filter(
    name = "tenantFilter", 
    condition = "empresa_id = :empresaId"
)
public class DocumentoComercial {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;
    
    // ... resto de campos
}
```

### Paso 2: Verificar/Corregir HibernateFilterConfiguration

**Archivo**: `HibernateFilterConfiguration.java`

```java
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
@RequiredArgsConstructor
public class HibernateFilterConfiguration implements HandlerInterceptor {

    private final EntityManager entityManager;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            // 1. Leer X-Empresa-Id del header
            String empresaIdHeader = request.getHeader("X-Empresa-Id");
            
            if (empresaIdHeader != null && !empresaIdHeader.isEmpty()) {
                Long empresaId = Long.parseLong(empresaIdHeader);
                
                // 2. Obtener la sesión de Hibernate
                Session session = entityManager.unwrap(Session.class);
                
                // 3. Habilitar el filtro con el empresaId
                session.enableFilter("tenantFilter")
                       .setParameter("empresaId", empresaId);
                
                log.debug("✅ Tenant filter enabled for empresaId: {}", empresaId);
            } else {
                log.warn("⚠️ No X-Empresa-Id header found in request: {}", request.getRequestURI());
            }
        } catch (NumberFormatException e) {
            log.error("❌ Invalid X-Empresa-Id header value: {}", request.getHeader("X-Empresa-Id"));
        } catch (Exception e) {
            log.error("❌ Error enabling tenant filter: {}", e.getMessage(), e);
        }
        
        return true;
    }
}
```

### Paso 3: Registrar el Interceptor

**Archivo**: `WebMvcConfig.java` (o similar)

```java
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final HibernateFilterConfiguration hibernateFilterConfiguration;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(hibernateFilterConfiguration)
                .addPathPatterns("/api/**")  // Aplicar a todas las rutas API
                .excludePathPatterns("/api/auth/**");  // Excluir rutas de autenticación
    }
}
```

---

## 🔄 Alternativa: Usar JWT empresaId Claim

Si el backend ya incluye `empresaId` en el JWT token después de `select-tenant`, pueden usar eso en lugar del header:

### Opción A: Extraer empresaId del JWT

```java
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    try {
        // Obtener el empresaId del contexto de seguridad (del JWT)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null && auth.getPrincipal() instanceof UserDetails) {
            // Asumiendo que UserDetails personalizado tiene getEmpresaId()
            CustomUserDetails user = (CustomUserDetails) auth.getPrincipal();
            Long empresaId = user.getEmpresaId();
            
            if (empresaId != null) {
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter("tenantFilter")
                       .setParameter("empresaId", empresaId);
                log.debug("✅ Tenant filter enabled from JWT for empresaId: {}", empresaId);
            }
        }
    } catch (Exception e) {
        log.error("❌ Error enabling tenant filter: {}", e.getMessage());
    }
    return true;
}
```

### Opción B: Incluir empresaId en el JWT (en AuthService)

```java
// AuthService.java - método selectTenant
public LoginResponse selectTenant(SelectTenantRequest request, Usuario usuario) {
    // ... validaciones ...
    
    // Generar nuevo token CON el empresaId incluido
    Map<String, Object> claims = new HashMap<>();
    claims.put("empresaId", request.getEmpresaId());
    claims.put("sucursalId", request.getSucursalId());
    claims.put("roles", usuario.getRoles());
    
    String newToken = jwtService.generateToken(claims, usuario);
    
    return new LoginResponse(newToken, refreshToken, usuario, true);
}
```

---

## 📋 Checklist de Verificación

Después de aplicar los cambios, verificar:

- [ ] La entidad `DocumentoComercial` tiene `@FilterDef` y `@Filter`
- [ ] La entidad tiene el campo `empresa_id` mapeado correctamente
- [ ] El interceptor `HibernateFilterConfiguration` está registrado
- [ ] El interceptor lee el header `X-Empresa-Id` correctamente
- [ ] El filtro `tenantFilter` se habilita sin errores (no `UnknownFilterException`)
- [ ] Las queries SQL generadas incluyen `WHERE empresa_id = ?`

### Test Manual:

1. Login como SuperAdmin
2. Ir a Dashboard → ver datos de empresa 1
3. Cambiar contexto a empresa 2 (Tenant Selector)
4. Verificar que Dashboard muestra datos de empresa 2
5. Revisar logs del backend: `✅ Tenant filter enabled for empresaId: 2`

---

## 🔍 Debugging en Backend

Agregar logs para verificar:

```java
// En DocumentoComercialController o Service
@GetMapping("/tipo/{tipo}")
public List<DocumentoComercialDTO> getByTipo(@PathVariable String tipo) {
    // Log para debugging
    String empresaIdHeader = request.getHeader("X-Empresa-Id");
    log.info("📥 GET /documentos/tipo/{} - X-Empresa-Id header: {}", tipo, empresaIdHeader);
    
    List<DocumentoComercial> documentos = documentoRepository.findByTipoDocumento(tipo);
    
    // Log para verificar filtrado
    log.info("📤 Returning {} documentos", documentos.size());
    documentos.forEach(d -> log.debug("  - Doc ID: {}, EmpresaId: {}", d.getId(), d.getEmpresa().getId()));
    
    return documentos.stream().map(this::toDTO).toList();
}
```

---

## ⚠️ Entidades Adicionales que Podrían Necesitar @Filter

Si otras entidades también deben filtrarse por empresa:

- `Cliente`
- `Producto`
- `Venta`
- `NotaPedido`
- `Presupuesto`
- `OrdenServicio`
- `Equipo`
- `Lead`
- `Usuario` (si son por empresa)

Aplicar el mismo patrón `@FilterDef` + `@Filter` a cada una.

---

## 📞 Contacto para Dudas

Si el equipo de backend tiene dudas sobre la implementación, pueden verificar:

1. **Logs del frontend** (F12 → Console): Muestra qué header se envía
2. **Request Headers** (F12 → Network → Request): Confirmar `X-Empresa-Id`
3. **Logs del backend**: Verificar que el interceptor recibe el header correcto

**El frontend está enviando correctamente:**
```
X-Empresa-Id: 2
```

**El backend debe filtrar las queries SQL para incluir:**
```sql
SELECT * FROM documento_comercial WHERE ... AND empresa_id = 2
```
