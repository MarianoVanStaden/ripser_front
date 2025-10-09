# 🔍 Debugging Guide - TripsPage Conductores y Vehículos

## ✅ SOLUCIÓN ENCONTRADA

**El problema era:** Los endpoints del backend NO tienen el prefijo `/api/` pero el frontend SÍ lo espera.

- ❌ Backend actual: `/empleados`, `/vehiculos`, `/viajes`
- ✅ Frontend espera: `/api/empleados`, `/api/vehiculos`, `/api/viajes`

### **Fix Requerido en Backend:**

Actualizar los `@RequestMapping` en cada controller:

**EmpleadoController.java:**
```java
@RequestMapping("/api/empleados")  // Agregar /api
```

**VehiculoController.java:**
```java
@RequestMapping("/api/vehiculos")  // Agregar /api
```

**ViajeController.java:**
```java
@RequestMapping("/api/viajes")  // Agregar /api
```

**Ver archivo:** `BACKEND_FIX_API_PREFIX.md` para detalles completos.

---

## Problema Original Reportado
Los conductores (empleados) y vehículos no se están mostrando en los Autocomplete de la página de Viajes.

---

## ✅ Cambios Realizados

### 1. **Mejor Logging en loadData()**
Ahora cada recurso se carga individualmente con logging específico:

```typescript
✅ Viajes cargados: X
✅ Vehículos cargados: Y  
✅ Empleados cargados: Z
✅ Entregas cargadas: W
```

Si alguno falla, verás:
```typescript
❌ Error cargando vehículos: [error details]
❌ Error cargando empleados: [error details]
```

### 2. **Helper Text en Autocomplete**
Los campos ahora muestran:
- `⚠️ No hay empleados cargados` si `drivers.length === 0`
- `⚠️ No hay vehículos cargados` si `vehicles.length === 0`
- `X empleados disponibles` si hay datos
- `Y vehículos disponibles` si hay datos

### 3. **Alert de Advertencia**
Si no hay empleados o vehículos, se muestra un alert amarillo explicando qué falta.

---

## 🔧 Pasos para Debugging

### Paso 1: Abrir DevTools Console
1. Presiona **F12** en tu navegador
2. Ve a la pestaña **Console**
3. Navega a **Logística → Armado Viajes**
4. Observa los logs:

**Logs esperados:**
```
✅ Viajes cargados: 5 [Array(5)]
✅ Vehículos cargados: 3 [Array(3)]
✅ Empleados cargados: 10 [Array(10)]
✅ Entregas cargadas: 15 [Array(15)]
```

**Si ves errores:**
```
❌ Error cargando vehículos: Error: Request failed with status code 404
```

### Paso 2: Verificar Endpoints del Backend

Asegúrate que estos endpoints existan y funcionen:

#### **Empleados (Conductores)**
```
GET /api/empleados?page=0&size=10000
```

**Respuesta esperada:**
```json
{
  "content": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "dni": "12345678",
      ...
    }
  ],
  "totalElements": 10,
  ...
}
```

O simplemente un array:
```json
[
  {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    ...
  }
]
```

#### **Vehículos**
```
GET /api/vehiculos
```

**Respuesta esperada:**
```json
[
  {
    "id": 1,
    "marca": "Ford",
    "modelo": "Ranger",
    "patente": "ABC123",
    "anio": 2020,
    ...
  }
]
```

### Paso 3: Verificar en Network Tab
1. **F12** → pestaña **Network**
2. Filtra por **XHR** o **Fetch**
3. Recarga la página
4. Busca las llamadas:
   - `/api/empleados?page=0&size=10000`
   - `/api/vehiculos`
   - `/api/viajes`
   - `/api/entregas-viaje`

5. Verifica:
   - **Status Code**: Debe ser `200 OK`
   - **Response**: Debe tener datos en formato array o paginado

---

## 🛠️ Posibles Problemas y Soluciones

### Problema 1: Backend No Está Corriendo
**Síntoma:** 
```
❌ Error cargando empleados: Network Error
❌ Error cargando vehículos: Network Error
```

**Solución:**
- Inicia el backend Spring Boot
- Verifica que esté en el puerto correcto (probablemente `http://localhost:8080`)
- Revisa `src/api/config.ts` para verificar la `baseURL`

---

### Problema 2: Endpoints No Existen (404)
**Síntoma:**
```
❌ Error cargando vehículos: Request failed with status code 404
```

**Solución:**
- El backend no tiene el endpoint `/api/vehiculos`
- Necesitas crear el controller en Spring Boot:

```java
@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {
    
    @GetMapping
    public ResponseEntity<List<Vehiculo>> getAllVehiculos() {
        // Implementar
    }
}
```

---

### Problema 3: CORS Error
**Síntoma:**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/vehiculos' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solución:**
Agrega configuración CORS en Spring Boot:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true);
    }
}
```

---

### Problema 4: Respuesta Paginada vs Array
**Síntoma:**
Los vehículos no se muestran pero el request es exitoso.

**Causa:**
El backend devuelve formato paginado de Spring Data:
```json
{
  "content": [...],
  "totalElements": 5,
  "totalPages": 1,
  ...
}
```

**Solución actual en el código:**
```typescript
// employeeApi.getAllList ya maneja esto:
return response.data.content || response.data;
```

**Si vehículos también es paginado, actualiza vehiculoApi.ts:**
```typescript
getAll: async (): Promise<Vehiculo[]> => {
  const response = await api.get('/vehiculos');
  return response.data.content || response.data; // Maneja ambos formatos
},
```

---

### Problema 5: Token Expirado (401/403)
**Síntoma:**
```
❌ Error cargando empleados: Request failed with status code 401
```

**Solución:**
- Cierra sesión y vuelve a iniciar
- El interceptor JWT debería renovar automáticamente
- Verifica que el token no haya expirado en `localStorage`

---

## 🧪 Pruebas Directas

### Prueba Manual con curl/Postman

#### Test 1: Vehículos
```bash
curl http://localhost:8080/api/vehiculos
```

Debe devolver JSON con vehículos.

#### Test 2: Empleados
```bash
curl http://localhost:8080/api/empleados?page=0&size=100
```

Debe devolver JSON con empleados.

---

## 📊 Estado Actual del Código

### ✅ Lo que está funcionando:
- Llamadas a API con mejor error handling
- Logging detallado en console
- Mensajes de ayuda en UI cuando no hay datos
- Manejo de arrays vacíos sin crashes

### 🔄 Lo que debes verificar:
1. **Backend está corriendo** en `http://localhost:8080`
2. **Endpoints existen:**
   - `GET /api/vehiculos`
   - `GET /api/empleados`
3. **Datos existen en la base de datos:**
   - Hay registros en tabla `vehiculos`
   - Hay registros en tabla `empleados`
4. **CORS está configurado** correctamente

---

## 🎯 Próximos Pasos

1. **Abre la página** de Viajes
2. **Abre la consola** (F12)
3. **Lee los logs** que aparecen
4. **Comparte los logs** si sigues teniendo problemas

Ejemplo de qué compartir:
```
✅ Viajes cargados: 0 []
❌ Error cargando vehículos: AxiosError {...}
✅ Empleados cargados: 0 []
```

Con esa información podré identificar exactamente cuál es el problema.

---

## 📞 Checklist Rápido

- [ ] Backend corriendo en puerto 8080
- [ ] Endpoint `/api/vehiculos` existe y devuelve datos
- [ ] Endpoint `/api/empleados` existe y devuelve datos
- [ ] No hay errores CORS en consola
- [ ] No hay errores 401/403 (autenticación)
- [ ] Base de datos tiene registros de vehículos
- [ ] Base de datos tiene registros de empleados
- [ ] Frontend está en `http://localhost:5173`

---

**Última actualización:** 2024-12-08
