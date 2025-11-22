# Guía de Verificación - Estado Asignación Testing

## 🚨 Error Encontrado y Corregido

### Error 1: `setSuccess is not defined` ✅ CORREGIDO
**Archivo**: `DeliveriesPage.tsx` línea 357

**Problema**: Intenté usar `setSuccess()` que no existía en el componente.

**Solución**: Cambiado a usar `setError(null)` + `alert()` para mostrar mensaje de éxito.

---

### Error 2: Backend No Disponible ⚠️ REQUIERE ACCIÓN
**Error**: `ERR_CONNECTION_REFUSED` en todas las llamadas API

**Causa**: El backend de Spring Boot no está corriendo.

**Solución**:

#### Paso 1: Verificar si el backend está corriendo
```bash
# En Windows PowerShell
Get-Process -Name "java" -ErrorAction SilentlyContinue
```

#### Paso 2: Navegar al directorio del backend
```bash
cd C:\ruta\a\tu\proyecto\backend
# Ejemplo: cd C:\Users\maria\ripser_backend
```

#### Paso 3: Iniciar el backend
```bash
# Opción 1: Con Maven
mvn spring-boot:run

# Opción 2: Con Gradle
gradle bootRun

# Opción 3: Si tienes el JAR compilado
java -jar target/ripser-backend-0.0.1-SNAPSHOT.jar
```

#### Paso 4: Verificar que esté corriendo
El backend debería mostrar algo como:
```
Tomcat started on port(s): 8080 (http)
Started RipserApplication in X.XXX seconds
```

#### Paso 5: Verificar la URL de la API
Abre el navegador y ve a:
```
http://localhost:8080/api/equipos-fabricados
```

Deberías ver un JSON con datos o un array vacío.

---

## 📋 Checklist Pre-Testing

Antes de probar el flujo completo, asegúrate de:

- [ ] **Backend corriendo** en puerto 8080
  - Verificar con: `http://localhost:8080/actuator/health` (si tienes actuator)
  - O directamente: `http://localhost:8080/api/equipos-fabricados`

- [ ] **Frontend corriendo** en puerto 5173
  - Verificar con: `http://localhost:5173`
  - Deberías ver la aplicación cargada

- [ ] **Base de datos MySQL** corriendo
  - Verificar con: `mysql -u root -p` y luego `USE ripser_db;`
  - O usar MySQL Workbench

- [ ] **Migración SQL ejecutada**
  - Verificar que la columna exista:
    ```sql
    DESCRIBE equipos_fabricados;
    ```
  - Buscar: `estado_asignacion` en la lista de columnas

---

## 🔍 Verificación Rápida de Estado

### 1. Verificar que el backend devuelve `estadoAsignacion`

Abre el navegador o usa PowerShell:

```powershell
# Obtener un equipo y ver su estructura
Invoke-RestMethod -Uri "http://localhost:8080/api/equipos-fabricados?page=0&size=1" -Headers @{Authorization="Bearer TU_TOKEN"}
```

**Esperado**: Deberías ver un campo `estadoAsignacion` en el JSON.

### 2. Verificar columnas en la base de datos

```sql
SELECT id, numero_heladera, estado, asignado, estado_asignacion 
FROM equipos_fabricados 
LIMIT 5;
```

**Esperado**: Ver valores como `DISPONIBLE`, `RESERVADO`, `FACTURADO`, etc.

### 3. Verificar frontend muestra la columna

1. Ir a `http://localhost:5173`
2. Login
3. Ir a **Fabricación → Equipos**
4. Buscar columna "Estado Asignación"
5. Verificar chips de colores

---

## 🧪 Flujo de Testing Simplificado

Una vez que el backend esté corriendo:

### Test 1: Visualización de Estados
1. ✅ Abrir **Equipos** (Fabricación → Equipos)
2. ✅ Verificar columna "Estado Asignación" visible
3. ✅ Verificar filtro dropdown con 5 opciones
4. ✅ Probar filtro y verificar que funciona

### Test 2: Validaciones en Equipos
1. ✅ Buscar equipo DISPONIBLE
2. ✅ Verificar botón "Editar" habilitado
3. ✅ Buscar equipo RESERVADO (o crear uno)
4. ✅ Verificar botón "Editar" deshabilitado
5. ✅ Hover sobre botón y ver tooltip

### Test 3: Asignación de Equipos
1. ✅ Ir a **Ventas → Facturación Manual**
2. ✅ Crear nueva factura
3. ✅ Agregar item tipo EQUIPO
4. ✅ Abrir "Asignar Equipos"
5. ✅ Verificar solo aparecen DISPONIBLES
6. ✅ Seleccionar y confirmar
7. ✅ Volver a Equipos
8. ✅ Verificar equipo ahora está RESERVADO (naranja)

### Test 4: Confirmar Factura
1. ✅ En la factura creada, click "Confirmar"
2. ✅ Volver a Equipos
3. ✅ Verificar equipo ahora está FACTURADO (azul)

### Test 5: Confirmar Entrega
1. ✅ Ir a **Logística → Control de Entregas**
2. ✅ Buscar entrega con equipos
3. ✅ Ver detalle y verificar equipos muestran estado
4. ✅ Click "Confirmar Entrega"
5. ✅ Ingresar datos receptor
6. ✅ Ver mensaje: "Entrega confirmada. Los equipos ahora están en estado ENTREGADO"
7. ✅ Volver a Equipos
8. ✅ Verificar equipo ahora está ENTREGADO (verde)

---

## ⚡ Solución Rápida si Backend no Arranca

### Error: Puerto 8080 en uso
```powershell
# Encontrar proceso en puerto 8080
Get-NetTCPConnection -LocalPort 8080 | Select-Object OwningProcess

# Matar proceso
Stop-Process -Id PROCESS_ID -Force
```

### Error: Base de datos no conecta
1. Verificar MySQL está corriendo:
   ```powershell
   Get-Service -Name "MySQL*"
   ```

2. Iniciar si está detenido:
   ```powershell
   Start-Service -Name "MySQL80" # O el nombre de tu servicio
   ```

3. Verificar credenciales en `application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/ripser_db
   spring.datasource.username=root
   spring.datasource.password=tu_password
   ```

### Error: Migración SQL no aplicada
```sql
-- Verificar si la columna existe
SHOW COLUMNS FROM equipos_fabricados LIKE 'estado_asignacion';

-- Si no existe, ejecutar:
ALTER TABLE equipos_fabricados ADD COLUMN estado_asignacion VARCHAR(20);

-- Poblar con datos iniciales
UPDATE equipos_fabricados 
SET estado_asignacion = CASE 
  WHEN asignado = TRUE THEN 'ENTREGADO'
  ELSE 'DISPONIBLE'
END
WHERE estado = 'COMPLETADO' AND estado_asignacion IS NULL;
```

---

## 📞 Siguiente Paso

1. **Inicia el backend**: `mvn spring-boot:run` (en el directorio del backend)
2. **Espera a que cargue completamente**
3. **Refresca el frontend**: F5 en el navegador
4. **Prueba el flujo**: Empieza con Test 1 (Visualización)

---

## 🆘 Si Sigues con Problemas

Comparte:
1. Logs del backend (últimas 20 líneas)
2. Versión de Java: `java -version`
3. Versión de Maven: `mvn -version`
4. ¿La migración SQL se ejecutó? (salida del comando)
5. ¿Qué muestra `DESCRIBE equipos_fabricados;`?

---

**Última actualización**: 21 Nov 2025
**Error corregido**: `setSuccess is not defined` → Usar `alert()` en su lugar
**Próximo paso**: Iniciar backend y probar flujo completo
