# 🚀 Quick Fix - Agregar /api a Backend (Cheat Sheet)

## 📝 3 Cambios Rápidos

### 1. EmpleadoController.java (línea ~34)
```diff
- @RequestMapping("/empleados")
+ @RequestMapping("/api/empleados")
```

### 2. VehiculoController.java
```diff
- @RequestMapping("/vehiculos")
+ @RequestMapping("/api/vehiculos")
```

### 3. ViajeController.java (línea ~45)
```diff
- @RequestMapping("/viajes")
+ @RequestMapping("/api/viajes")
```

---

## ⚡ Comandos Rápidos

```bash
# Detener servidor (Ctrl+C en terminal)

# Limpiar y recompilar
mvn clean install

# Reiniciar servidor
mvn spring-boot:run
```

---

## 🧪 Test Rápido

**En navegador, prueba:**
- http://localhost:8080/api/empleados ← Debe devolver JSON
- http://localhost:8080/api/vehiculos ← Debe devolver JSON
- http://localhost:8080/api/viajes ← Debe devolver JSON

**En frontend (F12 Console):**
```
✅ Empleados cargados: 10 [...]
✅ Vehículos cargados: 3 [...]
✅ Viajes cargados: 5 [...]
```

---

## ✅ Checklist Mínimo

- [ ] Editados 3 archivos Java
- [ ] Servidor reiniciado
- [ ] Endpoints con `/api` funcionan
- [ ] Frontend carga empleados y vehículos

**¡Listo!** 🎉
