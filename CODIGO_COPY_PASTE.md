# 📋 Código Copy-Paste Listo

## EmpleadoController.java

**Encuentra estas líneas (aproximadamente línea 34):**
```java
@RestController

@RequestMapping("/empleados")
public class EmpleadoController {
```

**Reemplaza con este código:**
```java
@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
```

---

## VehiculoController.java

**Encuentra estas líneas:**
```java
@RestController
@RequestMapping("/vehiculos")

public class VehiculoController {
```

**Reemplaza con este código:**
```java
@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {
```

---

## ViajeController.java

**Encuentra estas líneas (aproximadamente línea 45):**
```java
@RestController
@RequestMapping("/viajes")

public class ViajeController {
```

**Reemplaza con este código:**
```java
@RestController
@RequestMapping("/api/viajes")
public class ViajeController {
```

---

## 💡 Tip

En tu IDE (IntelliJ/Eclipse):

1. Presiona `Ctrl+F` (o `Cmd+F` en Mac)
2. Busca: `@RequestMapping("/empleados")`
3. Cambia a: `@RequestMapping("/api/empleados")`
4. Repite para `/vehiculos` y `/viajes`

---

**Después guarda todo y reinicia el servidor Spring Boot.**
