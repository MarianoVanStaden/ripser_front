# CORRECCIONES ESPECÍFICAS PARA LeadRepository.java

## 🔧 Queries que necesitan corrección

### 1. obtenerMetricasPorCanal (líneas ~119-127)

**PROBLEMA:** Mezcla `BigDecimal` (presupuestoEstimado) con `0.0` (double)

**CAMBIAR:**
```java
@Query("SELECT l.canal, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN l.presupuestoEstimado ELSE 0.0 END), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.canal " +
       "ORDER BY COUNT(l) DESC")
```

**POR:**
```java
@Query("SELECT l.canal, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN l.presupuestoEstimado ELSE 0 END), 0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.canal " +
       "ORDER BY COUNT(l) DESC")
```

**CAMBIO:** `ELSE 0.0` → `ELSE 0` y `0.0` → `0` en COALESCE

---

### 2. obtenerPerformancePorVendedor (líneas ~201-212)

**PROBLEMA:** Similar, mezcla BigDecimal con double

**CAMBIAR:**
```java
@Query("SELECT l.usuarioAsignadoId, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN l.presupuestoEstimado ELSE 0.0 END), 0.0), " +
       "COALESCE(AVG(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN CAST(l.diasHastaConversion AS double) ELSE NULL END), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.usuarioAsignadoId IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.usuarioAsignadoId " +
       "ORDER BY COUNT(l) DESC")
```

**POR:**
```java
@Query("SELECT l.usuarioAsignadoId, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN l.presupuestoEstimado ELSE 0 END), 0), " +
       "COALESCE(AVG(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN CAST(l.diasHastaConversion AS double) ELSE NULL END), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.usuarioAsignadoId IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.usuarioAsignadoId " +
       "ORDER BY COUNT(l) DESC")
```

**CAMBIO:** Línea 4: `ELSE 0.0 END), 0.0)` → `ELSE 0 END), 0)`

---

### 3. obtenerPresupuestoEstimadoTotal (líneas ~256-263)

**PROBLEMA:** `0.0` con BigDecimal

**CAMBIAR:**
```java
@Query("SELECT COALESCE(SUM(l.presupuestoEstimado), 0.0), " +
       "COUNT(l), " +
       "COALESCE(AVG(l.presupuestoEstimado), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.presupuestoEstimado IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId)")
```

**POR:**
```java
@Query("SELECT COALESCE(SUM(l.presupuestoEstimado), 0), " +
       "COUNT(l), " +
       "COALESCE(AVG(l.presupuestoEstimado), 0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.presupuestoEstimado IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId)")
```

**CAMBIO:** Todos los `0.0` → `0`

---

## 📝 Regla General

**Para campos BigDecimal:**
- ✅ Usar `ELSE 0` (Integer)
- ✅ Usar `COALESCE(..., 0)` (Integer)
- ❌ NO usar `0.0` (Double)

**Para campos numéricos calculados (AVG, CAST AS double):**
- ✅ Usar `ELSE 0.0` (Double)
- ✅ Usar `COALESCE(..., 0.0)` (Double)

---

## ✅ Pasos de Corrección

1. Buscar en LeadRepository.java las líneas mencionadas
2. Reemplazar `0.0` por `0` solo en operaciones con `presupuestoEstimado`
3. Mantener `0.0` en operaciones con `CAST(...AS double)` o `AVG` de campos Integer
4. Guardar archivo
5. Recompilar: `mvn clean compile`
6. Reiniciar Spring Boot
7. Probar endpoint: `GET http://localhost:8080/RipserApp/api/leads/metricas?fechaInicio=2024-01-01&fechaFin=2024-12-31`

---

## 🎯 Resumen de Cambios

| Query | Línea Aprox | Cambio |
|-------|------------|--------|
| obtenerMetricasPorCanal | ~123 | `ELSE 0.0 END), 0.0)` → `ELSE 0 END), 0)` |
| obtenerPerformancePorVendedor | ~205 | `ELSE 0.0 END), 0.0)` → `ELSE 0 END), 0)` (solo línea 4) |
| obtenerPresupuestoEstimadoTotal | ~256-258 | Todos `0.0` → `0` |

Total: **3 queries** con **5 cambios** de `0.0` a `0`
