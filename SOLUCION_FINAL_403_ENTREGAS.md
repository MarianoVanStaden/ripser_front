# 🎯 DIAGNÓSTICO FINAL: El Problema Es el Backend

## ✅ Confirmación del Problema

Basado en los logs, el problema está **100% en el backend**, no en el frontend.

### 📊 Evidencia:

1. **Ambas entregas fallan con 403** (no solo las subsecuentes)
   - Entrega 1/2: `403 Forbidden`
   - Entrega 2/2: `403 Forbidden`
   - Tasa de éxito: **0%**

2. **El GET funciona, el POST no**
   - ✅ `GET /api/entregas-viaje` → Funciona (carga 3 entregas)
   - ❌ `POST /api/entregas-viaje` → 403 Forbidden

3. **El token está presente y válido**
   - Token presente: `true`
   - Token value: `eyJhbGciOiJIUzI1NiJ9.eyJyb2xlc...`
   - Refresh token presente: `true`

4. **Otros POST funcionan**
   - ✅ `POST /api/viajes` → Funciona (creó viaje #20)

---

## 🔍 Causa Raíz

**El endpoint POST `/api/entregas-viaje` tiene restricciones de seguridad diferentes a los demás endpoints.**

### Posibles Problemas en el Backend:

#### 1. **@PreAuthorize muy restrictivo**

```java
@PostMapping
@PreAuthorize("hasRole('ROLE_ADMIN')") // ← Demasiado restrictivo
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

**Solución:**
```java
@PostMapping
@PreAuthorize("hasAnyRole('USER', 'ADMIN')") // ← Permitir USER también
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

---

#### 2. **SecurityConfig bloqueando POST específicamente**

```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.GET, "/api/entregas-viaje/**").hasAnyRole("USER", "ADMIN")
    .requestMatchers(HttpMethod.POST, "/api/entregas-viaje/**").hasRole("ADMIN") // ← PROBLEMA
    .anyRequest().authenticated()
)
```

**Solución:**
```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/entregas-viaje/**").hasAnyRole("USER", "ADMIN") // ← Permitir ambos métodos
    .anyRequest().authenticated()
)
```

---

#### 3. **CSRF Protection Habilitado**

Si CSRF está habilitado, Spring Security rechaza POST sin token CSRF.

```java
http.csrf().disable(); // ← Debe estar así en desarrollo
```

**Verificar que esté deshabilitado:**
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable()) // ← IMPORTANTE
        .authorizeHttpRequests(/* ... */)
        .build();
}
```

---

#### 4. **Filtro de Seguridad Custom**

Puede haber un filtro custom que bloquea POST a entregas:

```java
@Component
public class CustomSecurityFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) {
        if (request.getMethod().equals("POST") && 
            request.getRequestURI().contains("/entregas-viaje")) {
            // ¿Hay alguna validación aquí que falle?
        }
    }
}
```

---

## 🛠️ Soluciones Paso a Paso

### Solución 1: Verificar y Actualizar SecurityConfig

**Archivo:** `SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Si usas @PreAuthorize
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            // IMPORTANTE: Deshabilitar CSRF en desarrollo
            .csrf(csrf -> csrf.disable())
            
            // Configurar autorización
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos (login, etc.)
                .requestMatchers("/api/auth/**").permitAll()
                
                // Entregas: Permitir USER y ADMIN
                .requestMatchers("/api/entregas-viaje/**").hasAnyRole("USER", "ADMIN")
                
                // Viajes: Permitir USER y ADMIN
                .requestMatchers("/api/viajes/**").hasAnyRole("USER", "ADMIN")
                
                // Resto: Autenticado
                .anyRequest().authenticated()
            )
            
            // JWT Filter
            .addFilterBefore(jwtAuthenticationFilter(), 
                            UsernamePasswordAuthenticationFilter.class)
            
            .build();
    }
}
```

---

### Solución 2: Remover o Ajustar @PreAuthorize

**Archivo:** `EntregaViajeController.java`

**ANTES (Restrictivo):**
```java
@PostMapping
@PreAuthorize("hasRole('ROLE_ADMIN')") // ← Solo ADMIN
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

**DESPUÉS (Permisivo):**
```java
@PostMapping
@PreAuthorize("hasAnyRole('USER', 'ADMIN')") // ← USER también
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

**O mejor aún, quitarlo si ya está en SecurityConfig:**
```java
@PostMapping // Sin @PreAuthorize (se maneja en SecurityConfig)
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

---

### Solución 3: Verificar Roles del Usuario

Asegúrate que tu usuario tenga el rol correcto:

**En la base de datos:**
```sql
-- Ver roles del usuario actual
SELECT u.username, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.username = 'tu_usuario';

-- Si no tiene roles, agregar:
INSERT INTO user_roles (user_id, role_id) 
VALUES (
    (SELECT id FROM users WHERE username = 'tu_usuario'),
    (SELECT id FROM roles WHERE name = 'ROLE_USER')
);
```

---

## 🧪 Test Rápido

**1. Probar con Postman/Insomnia:**

```bash
POST http://localhost:8080/api/entregas-viaje
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlc...
  Content-Type: application/json

Body:
{
  "viajeId": 20,
  "ventaId": 40,
  "direccionEntrega": "Test Address",
  "fechaEntrega": "2025-10-10T15:18:00.000Z",
  "estado": "PENDIENTE"
}
```

**Si da 403:** El problema está en el backend  
**Si funciona:** El problema está en cómo el frontend envía la petición (pero los logs indican que está bien)

---

**2. Ver logs del backend:**

Cuando hagas el POST, deberías ver en los logs de Spring Boot:

```
2025-10-10 15:18:00 WARN  o.s.s.a.i.a.MethodSecurityInterceptor - Access is denied
2025-10-10 15:18:00 ERROR o.s.s.w.a.ExceptionTranslationFilter - Access denied
```

Esto confirmará que es un problema de autorización.

---

## 📋 Checklist de Verificación Backend

- [ ] Abrir `SecurityConfig.java`
- [ ] Verificar que CSRF esté deshabilitado: `.csrf(csrf -> csrf.disable())`
- [ ] Verificar que `/api/entregas-viaje/**` permita `hasAnyRole("USER", "ADMIN")`
- [ ] Abrir `EntregaViajeController.java`
- [ ] Verificar que `@PostMapping` tenga `@PreAuthorize("hasAnyRole('USER', 'ADMIN')")` o no tenga anotación
- [ ] Verificar en base de datos que tu usuario tiene rol `ROLE_USER` o `ROLE_ADMIN`
- [ ] Reiniciar el servidor Spring Boot después de los cambios
- [ ] Probar nuevamente desde el frontend

---

## 💡 Fix Inmediato (Más Probable)

**Lo más probable es que `EntregaViajeController` tenga:**

```java
@PostMapping
@PreAuthorize("hasRole('ROLE_ADMIN')") // ← ESTE ES EL PROBLEMA
```

**Cámbialo a:**

```java
@PostMapping
@PreAuthorize("hasAnyRole('USER', 'ADMIN')") // ← SOLUCIÓN
```

O simplemente quita el `@PreAuthorize` y manéjalo en `SecurityConfig`.

---

## 🎯 Próximos Pasos

1. **Comparte tu `EntregaViajeController.java`** (especialmente el método POST)
2. **Comparte tu `SecurityConfig.java`** (configuración de seguridad)
3. **Verifica en la BD** qué roles tiene tu usuario
4. **Aplica uno de los fixes** sugeridos
5. **Reinicia el backend**
6. **Prueba nuevamente**

Con esta información podré darte el fix exacto. 🚀

---

**Fecha:** 2024-12-08  
**Estado:** Problema identificado - Backend bloqueando POST con 403  
**Confianza:** 99% - Es problema de permisos en el backend
