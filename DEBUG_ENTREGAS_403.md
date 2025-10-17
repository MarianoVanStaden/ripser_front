# 🔐 Análisis Detallado: Error 403 en Entregas Múltiples

## 🎯 Mejoras Implementadas en TripsPage

Se ha agregado **logging exhaustivo** para diagnosticar por qué las entregas 2+ fallan con 403 Forbidden.

---

## 📊 Nuevo Output de Consola

Ahora verás información detallada de cada entrega:

### ✅ Entrega Exitosa (Primera)
```
📦 [1/3] Creando entrega:
   Payload: {
     "viajeId": 123,
     "ventaId": 45,
     "direccionEntrega": "Calle Falsa 123",
     "fechaEntrega": "2024-12-08T14:00:00.000Z",
     "observaciones": "Entregar en horario comercial",
     "estado": "PENDIENTE"
   }
   Timestamp: 2024-12-08T10:30:00.123Z

✅ [1/3] Entrega creada exitosamente!
   ID creado: 1001
   Response completo: { id: 1001, viajeId: 123, ... }

⏳ Esperando 500ms antes de crear la siguiente entrega...
```

### ❌ Entrega Fallida (Segunda/Tercera)
```
📦 [2/3] Creando entrega:
   Payload: { ... }
   Timestamp: 2024-12-08T10:30:00.678Z

❌ [2/3] ERROR al crear entrega:
   Status: 403
   Status Text: Forbidden
   Error Data: { message: "Access Denied", error: "Forbidden" }
   Error Message: Request failed with status code 403
   Headers: { ... }
   Delivery data que falló: { ... }
   Payload que se envió: { viajeId: 123, ventaId: 46, ... }

   🔐 Error 403 - Verificando autenticación:
   Token presente: true
   Token value: eyJhbGciOiJIUzI1NiIsInR5cCI6...
   Refresh token presente: true

⏳ Esperando 500ms antes de intentar la siguiente entrega...
```

### 📊 Resumen Final
```
========== RESULTADO FINAL ==========
   ✅ Entregas creadas exitosamente: 1
   ❌ Entregas fallidas: 2
   📈 Tasa de éxito: 33%

⚠️ ANÁLISIS DE ERRORES:
   [2] Status 403: Access Denied
   [3] Status 403: Access Denied

🔐 PROBLEMA DE AUTENTICACIÓN DETECTADO:
   - 2 entregas fallaron con 403 Forbidden
   - Posibles causas:
     1. El backend invalida el token después de la primera petición POST
     2. Hay rate limiting en el backend
     3. El rol/permiso solo permite crear 1 entrega a la vez
     4. Hay algún CSRF token que no se está enviando correctamente

📊 Todas las entregas fallaron con el mismo error (403)
   Esto sugiere un problema sistemático, no aleatorio.
=====================================
```

---

## 🔍 Causas Probables del 403

### 1️⃣ Problema de Permisos (70% probable)

**¿Qué revisar en el backend?**

#### SecurityConfig.java
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                // ¿Está correctamente configurado?
                .requestMatchers("/api/entregas-viaje/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .csrf().disable() // ← ¿Está deshabilitado CSRF?
            .build();
    }
}
```

#### EntregaViajeController.java
```java
@RestController
@RequestMapping("/api/entregas-viaje")
public class EntregaViajeController {
    
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')") // ← ¿Está muy restrictivo?
    public ResponseEntity<EntregaViaje> createEntrega(@Valid @RequestBody EntregaViaje entrega) {
        // ...
    }
}
```

**¿Qué puede estar pasando?**
- El token se verifica correctamente en la primera petición
- Algo cambia el contexto de seguridad después del primer POST
- Hay una validación adicional que solo falla en entregas subsecuentes

---

### 2️⃣ Rate Limiting (20% probable)

**¿Qué revisar?**

#### application.properties
```properties
# Buscar configuraciones de rate limiting
resilience4j.ratelimiter.instances.api.limitForPeriod=1
resilience4j.ratelimiter.instances.api.limitRefreshPeriod=1s
```

#### Dependency en pom.xml
```xml
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-ratelimiter</artifactId>
</dependency>
```

**Test:** Aumentar delay a 2000ms (2 segundos):
```typescript
await new Promise(resolve => setTimeout(resolve, 2000));
```

Si funciona con 2 segundos → Es rate limiting

---

### 3️⃣ Validación de Negocio (10% probable)

**Ejemplos de validaciones que pueden causar 403:**

```java
// EntregaViajeService.java
public EntregaViaje create(EntregaViaje entrega) {
    // Validación: Solo 1 entrega por viaje
    if (entregaRepository.countByViajeId(entrega.getViajeId()) > 0) {
        throw new AccessDeniedException("El viaje ya tiene una entrega");
    }
    
    // Validación: No duplicar entrega para la misma venta
    if (entregaRepository.existsByVentaId(entrega.getVentaId())) {
        throw new AccessDeniedException("Ya existe una entrega para esta venta");
    }
    
    // Validación: Usuario solo puede crear entregas de sus propios viajes
    Viaje viaje = viajeRepository.findById(entrega.getViajeId());
    if (!viaje.getConductorId().equals(currentUserId)) {
        throw new AccessDeniedException("No puedes crear entregas para viajes de otros usuarios");
    }
}
```

---

## 🧪 Tests de Diagnóstico

### Test 1: Aumentar Delay
**Cambio en código:**
```typescript
// Línea donde está el delay actual
await new Promise(resolve => setTimeout(resolve, 2000)); // Era 500
```

**Si funciona:** Es rate limiting  
**Si falla:** Es otro problema

---

### Test 2: Crear Entregas Manualmente

1. Crea un viaje **sin entregas**
2. Ve a la página de **Entregas** (DeliveriesPage)
3. Crea entrega #1 manualmente → ¿Funciona? ✅
4. Crea entrega #2 manualmente → ¿Funciona? ✅ o ❌
5. Crea entrega #3 manualmente → ¿Funciona? ✅ o ❌

**Si todas funcionan:** El problema es timing/concurrencia  
**Si la 2da/3ra fallan:** El problema es validación de negocio

---

### Test 3: Verificar Token

**En la consola del navegador:**
```javascript
// Antes de crear el viaje
console.log('Token inicial:', localStorage.getItem('auth_token'));

// Después de crear el viaje y las entregas
console.log('Token final:', localStorage.getItem('auth_token'));

// ¿Es el mismo token?
```

**Si cambió:** El backend está invalidando/rotando el token  
**Si es igual:** El problema no es el token

---

## 🛠️ Debugging en Backend

### Agregar Logs en el Controller

```java
@PostMapping
public ResponseEntity<EntregaViaje> createEntrega(@Valid @RequestBody EntregaViaje entrega) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    
    log.info("═══════════════════════════════════════");
    log.info("📦 POST /api/entregas-viaje recibido");
    log.info("👤 Usuario: {}", auth != null ? auth.getName() : "NULL");
    log.info("🎭 Roles: {}", auth != null ? auth.getAuthorities() : "NULL");
    log.info("📋 Payload: {}", entrega);
    log.info("🔢 Entregas existentes para viaje {}: {}", 
        entrega.getViajeId(), 
        entregaRepository.countByViajeId(entrega.getViajeId()));
    log.info("═══════════════════════════════════════");
    
    // ... resto del código
}
```

### Agregar Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        log.error("🔐 ACCESS DENIED: {}", ex.getMessage());
        log.error("🌐 Request: {}", request.getDescription(false));
        log.error("📍 Stack trace:", ex);
        
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(Map.of(
                "error", "Forbidden",
                "message", ex.getMessage(),
                "timestamp", LocalDateTime.now()
            ));
    }
}
```

---

## 📋 Información Necesaria para Diagnóstico Final

Por favor comparte:

### 1. **Logs del Frontend**
Copia TODO el output de la consola al crear un viaje con 3 entregas, incluyendo:
- Los logs de cada entrega (1/3, 2/3, 3/3)
- El análisis de errores final
- El token value (primeros 30 caracteres está bien)

### 2. **Logs del Backend**
Copia los logs de Spring Boot en el momento del 403:
```bash
# En tu terminal de Spring Boot, busca líneas como:
2024-12-08 10:30:01.234 INFO  c.r.c.EntregaViajeController - POST /api/entregas-viaje recibido
2024-12-08 10:30:01.456 WARN  o.s.s.a.i.a.MethodSecurityInterceptor - Access is denied
2024-12-08 10:30:01.567 ERROR o.s.web.servlet.mvc.method.annotation.ExceptionHandler - ...
```

### 3. **Configuración de Seguridad**
Comparte el contenido de:
- `SecurityConfig.java`
- La anotación en `EntregaViajeController.java` (si tiene `@PreAuthorize`)

### 4. **Comportamiento Observado**
- ¿La primera entrega SIEMPRE funciona?
- ¿Las entregas 2 y 3 SIEMPRE fallan con 403?
- ¿O es aleatorio?

---

## 💡 Workarounds Temporales

Mientras investigas el problema:

### Opción A: Aumentar Delay
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
```

### Opción B: Crear Solo 1 Entrega por Viaje
```typescript
// Limitar entregas temporalmente
if (tripDeliveries.length > 1) {
  alert('Temporalmente solo se puede agregar 1 entrega por viaje. Crea el viaje y agrega más entregas después.');
  return;
}
```

### Opción C: Crear Viaje Sin Entregas
1. Crear el viaje sin entregas
2. Ir a DeliveriesPage
3. Crear entregas una por una

---

## 🎯 Próximos Pasos

1. ✅ **Implementado:** Logging exhaustivo en frontend
2. ⏳ **Pendiente:** Ejecutar test y copiar logs completos
3. ⏳ **Pendiente:** Revisar backend (SecurityConfig, Controller, Service)
4. ⏳ **Pendiente:** Aplicar fix según diagnóstico

---

**Estado:** Esperando logs del frontend y backend para diagnóstico final  
**Fecha:** 2024-12-08
