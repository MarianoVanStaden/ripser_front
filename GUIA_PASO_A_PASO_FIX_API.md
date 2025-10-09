# 🛠️ Guía Paso a Paso: Agregar /api a los Endpoints del Backend

## 📋 Resumen

Necesitas editar **3 archivos Java** en tu proyecto backend Spring Boot para agregar el prefijo `/api` a los `@RequestMapping`.

---

## 📁 Archivos a Editar

### 1️⃣ **EmpleadoController.java**

**Ubicación:** `src/main/java/com/ripser_back/controllers/EmpleadoController.java`

**Buscar la línea 34:**
```java
@RestController

@RequestMapping("/empleados")
public class EmpleadoController {
```

**Cambiar a:**
```java
@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
```

**También elimina la línea vacía entre las anotaciones para que quede:**
```java
@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
```

---

### 2️⃣ **VehiculoController.java**

**Ubicación:** `src/main/java/com/ripser_back/controllers/VehiculoController.java`

**Buscar:**
```java
@RestController
@RequestMapping("/vehiculos")

public class VehiculoController {
```

**Cambiar a:**
```java
@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {
```

---

### 3️⃣ **ViajeController.java**

**Ubicación:** `src/main/java/com/ripser_back/controllers/ViajeController.java`

**Buscar la línea 45:**
```java
@RestController
@RequestMapping("/viajes")

public class ViajeController {
```

**Cambiar a:**
```java
@RestController
@RequestMapping("/api/viajes")
public class ViajeController {
```

---

## ✅ Verificación Antes de Continuar

Después de editar los 3 archivos, verifica que quedaron así:

### EmpleadoController.java (línea 34)
```java
@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
```

### VehiculoController.java
```java
@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {
```

### ViajeController.java (línea 45)
```java
@RestController
@RequestMapping("/api/viajes")
public class ViajeController {
```

---

## 🔄 Pasos para Aplicar los Cambios

### En IntelliJ IDEA / Eclipse:

1. **Guarda todos los archivos** (Ctrl+S o Cmd+S)

2. **Detén el servidor** Spring Boot:
   - En IntelliJ: Click en el botón rojo "Stop" □
   - En Eclipse: Click en "Terminate" en la consola
   - En terminal: Presiona `Ctrl+C`

3. **Limpia y recompila** (Opcional pero recomendado):
   ```bash
   mvn clean install
   ```
   O en el IDE: Build → Rebuild Project

4. **Reinicia el servidor** Spring Boot:
   - En IntelliJ: Click en "Run" ▶
   - En Eclipse: Click derecho → Run As → Spring Boot App
   - En terminal: 
     ```bash
     mvn spring-boot:run
     ```

5. **Verifica que el servidor esté corriendo**:
   - Deberías ver en la consola:
     ```
     Tomcat started on port(s): 8080 (http)
     Started RipserApplication in X.XXX seconds
     ```

---

## 🧪 Pruebas Después del Cambio

### Prueba 1: Verifica Endpoints en el Navegador

Abre estas URLs en tu navegador (reemplaza 8080 con tu puerto si es diferente):

**Antes del cambio (ya no deberían funcionar):**
- ❌ http://localhost:8080/empleados
- ❌ http://localhost:8080/vehiculos
- ❌ http://localhost:8080/viajes

**Después del cambio (deberían funcionar ahora):**
- ✅ http://localhost:8080/api/empleados
- ✅ http://localhost:8080/api/vehiculos
- ✅ http://localhost:8080/api/viajes

**Respuesta esperada:** JSON con los datos o error de autenticación (401) si requiere login.

---

### Prueba 2: Verifica el Frontend

1. **Abre el frontend** en el navegador: http://localhost:5173

2. **Navega a:** Logística → Armado Viajes

3. **Abre la consola** del navegador (F12)

4. **Busca estos mensajes:**
   ```
   ✅ Viajes cargados: X [Array(X)]
   ✅ Vehículos cargados: Y [Array(Y)]
   ✅ Empleados cargados: Z [Array(Z)]
   ✅ Entregas cargadas: W [Array(W)]
   ```

5. **Click en "Nuevo Viaje"**

6. **Verifica que los Autocomplete se llenen:**
   - Campo "Conductor" debe mostrar empleados
   - Campo "Vehículo" debe mostrar vehículos

---

## 🎯 Resultado Esperado

### ANTES del cambio:
```
❌ No hay empleados (conductores) cargados
❌ No hay vehículos cargados
```

### DESPUÉS del cambio:
```
✅ 10 empleados disponibles
✅ 3 vehículos disponibles
```

---

## ⚠️ Troubleshooting

### Problema: "404 Not Found" en los nuevos endpoints

**Causa:** El servidor no se reinició correctamente.

**Solución:**
1. Detén completamente el servidor
2. Espera 5 segundos
3. Inicia nuevamente
4. Verifica los logs para confirmar que inició sin errores

---

### Problema: "CORS error" en el navegador

**Causa:** La configuración CORS puede necesitar actualización.

**Solución:**
Verifica que tu `WebConfig.java` tenga:
```java
registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:5173")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        .allowCredentials(true);
```

---

### Problema: Los endpoints antiguos siguen funcionando

**Causa:** El servidor está usando una versión en caché.

**Solución:**
```bash
mvn clean
mvn install
mvn spring-boot:run
```

---

## 📝 Notas Importantes

1. **No toques EntregaViajeController** - Ya tiene `/api/entregas-viaje` correctamente

2. **Estos cambios son SOLO en el backend** - El frontend ya está correcto

3. **Después del cambio:**
   - Los endpoints antiguos (`/empleados`, etc.) dejarán de funcionar
   - Los nuevos endpoints (`/api/empleados`, etc.) funcionarán
   - El frontend se conectará correctamente

4. **Si tienes Postman/Insomnia:**
   - Actualiza tus colecciones para usar `/api/` en las URLs

---

## ✅ Checklist Final

Marca cada item cuando lo completes:

- [ ] ✏️ Editado `EmpleadoController.java` → `@RequestMapping("/api/empleados")`
- [ ] ✏️ Editado `VehiculoController.java` → `@RequestMapping("/api/vehiculos")`
- [ ] ✏️ Editado `ViajeController.java` → `@RequestMapping("/api/viajes")`
- [ ] 💾 Guardados todos los archivos
- [ ] 🛑 Detenido el servidor Spring Boot
- [ ] 🔄 Reiniciado el servidor Spring Boot
- [ ] ✅ Verificado que el servidor inició correctamente
- [ ] 🌐 Probado http://localhost:8080/api/empleados en navegador
- [ ] 🌐 Probado http://localhost:8080/api/vehiculos en navegador
- [ ] 🌐 Probado http://localhost:8080/api/viajes en navegador
- [ ] 🖥️ Abierto frontend en http://localhost:5173
- [ ] 📊 Verificado consola muestra "✅ Empleados cargados"
- [ ] 📊 Verificado consola muestra "✅ Vehículos cargados"
- [ ] 🎯 Probado crear nuevo viaje con conductores y vehículos

---

## 🎉 ¡Éxito!

Si completaste todos los pasos del checklist, los conductores y vehículos ahora deberían aparecer en el frontend.

Si aún tienes problemas, comparte:
1. Los logs del servidor backend al iniciarse
2. Los logs de la consola del navegador (F12)
3. Screenshots del error

---

**Creado:** 2024-12-08  
**Próxima acción:** Editar los 3 archivos Java y reiniciar el servidor
