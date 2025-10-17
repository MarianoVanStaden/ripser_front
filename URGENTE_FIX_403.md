# ⚡ ACCIÓN URGENTE: Fix 403 en POST /api/entregas-viaje

## 🔴 Problema

El endpoint `POST /api/entregas-viaje` devuelve **403 Forbidden** pero `GET` funciona correctamente.

**Evidencia:**
- ✅ `GET /api/entregas-viaje` → Funciona
- ❌ `POST /api/entregas-viaje` → 403 Forbidden
- ✅ `POST /api/viajes` → Funciona
- ✅ Token JWT válido está presente

---

## ✅ Solución Más Probable

### **EntregaViajeController.java tiene `@PreAuthorize` muy restrictivo**

**Busca esto en tu código:**

```java
@PostMapping
@PreAuthorize("hasRole('ROLE_ADMIN')") // ← PROBLEMA: Solo ADMIN
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

**Cámbialo a:**

```java
@PostMapping
@PreAuthorize("hasAnyRole('USER', 'ADMIN')") // ← SOLUCIÓN: Permitir USER también
public ResponseEntity<EntregaViaje> createEntrega(@RequestBody EntregaViaje entrega) {
    // ...
}
```

---

## 🔧 Verificaciones Adicionales

### 1. SecurityConfig.java

Asegúrate que tengas:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable()) // ← IMPORTANTE
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/entregas-viaje/**")
                .hasAnyRole("USER", "ADMIN") // ← Permitir ambos
            .anyRequest().authenticated()
        )
        .build();
}
```

---

### 2. Verificar Rol del Usuario

```sql
-- Ver qué rol tiene tu usuario
SELECT u.username, r.name 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.username = 'tu_usuario';
```

Debe tener `ROLE_USER` o `ROLE_ADMIN`.

---

## 🧪 Test

Después del cambio, prueba:

```bash
curl -X POST http://localhost:8080/api/entregas-viaje \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "viajeId": 20,
    "ventaId": 40,
    "direccionEntrega": "Test",
    "fechaEntrega": "2025-10-10T15:18:00.000Z",
    "estado": "PENDIENTE"
  }'
```

**Resultado esperado:** `201 Created` en vez de `403 Forbidden`

---

## ⚡ Pasos para Aplicar

1. Edita `EntregaViajeController.java`
2. Cambia `@PreAuthorize` según indicado arriba
3. Guarda el archivo
4. Reinicia el servidor Spring Boot
5. Prueba desde el frontend

**Tiempo estimado:** 2 minutos

---

**Urgencia:** ALTA  
**Impacto:** Bloquea creación de entregas en producción
