# 🔧 Fix: Agregar prefijo /api a los Controllers

## Problema Identificado

Los endpoints del backend NO tienen el prefijo `/api/` pero el frontend SÍ lo espera:

- ❌ Backend: `/empleados`, `/vehiculos`, `/viajes`
- ✅ Frontend: `/api/empleados`, `/api/vehiculos`, `/api/viajes`

---

## Solución: Actualizar Controllers

### 1. **EmpleadoController.java**

**Cambiar:**
```java
@RestController
@RequestMapping("/empleados")
public class EmpleadoController {
```

**Por:**
```java
@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
```

---

### 2. **VehiculoController.java**

**Cambiar:**
```java
@RestController
@RequestMapping("/vehiculos")
public class VehiculoController {
```

**Por:**
```java
@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {
```

---

### 3. **ViajeController.java**

**Cambiar:**
```java
@RestController
@RequestMapping("/viajes")
public class ViajeController {
```

**Por:**
```java
@RestController
@RequestMapping("/api/viajes")
public class ViajeController {
```

---

### 4. **EntregaViajeController.java**

✅ **Ya está correcto:**
```java
@RestController
@RequestMapping("/api/entregas-viaje")
public class EntregaViajeController {
```

---

## Verificación

Después de estos cambios, los endpoints serán:

- ✅ `GET /api/empleados`
- ✅ `GET /api/vehiculos`
- ✅ `GET /api/viajes`
- ✅ `GET /api/entregas-viaje` (ya estaba bien)

---

## Reiniciar Backend

Después de hacer los cambios:

1. Detén el servidor Spring Boot
2. Recompila el proyecto
3. Inicia el servidor nuevamente
4. Prueba en el frontend

---

## Alternativa: Configuración Global (Opcional)

Si prefieres una configuración global en vez de cambiar cada controller:

**application.properties:**
```properties
server.servlet.context-path=/api
```

Pero entonces tendrías que cambiar **todos** los controllers a:
```java
@RequestMapping("/empleados")  // Sin /api
```

Y los endpoints serían automáticamente: `/api/empleados`

---

**Recomendación:** Usa la Opción 1 (cambiar cada `@RequestMapping` individualmente) porque es más explícito y el `EntregaViajeController` ya lo tiene así.
