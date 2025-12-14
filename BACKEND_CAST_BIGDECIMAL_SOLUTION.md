# SOLUCIÓN DEFINITIVA: CAST BigDecimal to Double

## 🎯 Problema Real

El error `NumberFormatException: Character array is missing "e" notation exponential mark` ocurre porque:

1. `presupuestoEstimado` es `BigDecimal` en la entidad Lead
2. `AVG(BigDecimal)` y `SUM(BigDecimal)` retornan BigDecimal con notación científica
3. El Service intenta convertir a `Double` y falla

## ✅ SOLUCIÓN: Usar CAST en TODAS las operaciones con presupuestoEstimado

### Query 1: obtenerMetricasPorCanal

```java
@Query("SELECT l.canal, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CAST(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN l.presupuestoEstimado ELSE 0 END AS double)), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.canal " +
       "ORDER BY COUNT(l) DESC")
List<Object[]> obtenerMetricasPorCanal(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin,
    @Param("sucursalId") Long sucursalId
);
```

**CAMBIO CLAVE:** `CAST(CASE WHEN ... THEN l.presupuestoEstimado ELSE 0 END AS double)` antes del SUM

### Query 2: obtenerPerformancePorVendedor

```java
@Query("SELECT l.usuarioAsignadoId, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CAST(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN l.presupuestoEstimado ELSE 0 END AS double)), 0.0), " +
       "COALESCE(AVG(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN CAST(l.diasHastaConversion AS double) ELSE NULL END), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.usuarioAsignadoId IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.usuarioAsignadoId " +
       "ORDER BY COUNT(l) DESC")
List<Object[]> obtenerPerformancePorVendedor(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin,
    @Param("sucursalId") Long sucursalId
);
```

**CAMBIO CLAVE:** Línea 4 usa `CAST(... AS double)` alrededor del CASE completo

### Query 3: obtenerPresupuestoEstimadoTotal

```java
@Query("SELECT COALESCE(CAST(SUM(l.presupuestoEstimado) AS double), 0.0), " +
       "COUNT(l), " +
       "COALESCE(CAST(AVG(l.presupuestoEstimado) AS double), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.presupuestoEstimado IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId)")
Object[] obtenerPresupuestoEstimadoTotal(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin,
    @Param("sucursalId") Long sucursalId
);
```

**CAMBIOS:**
- Línea 1: `CAST(SUM(l.presupuestoEstimado) AS double)` 
- Línea 3: `CAST(AVG(l.presupuestoEstimado) AS double)`

### Query 4: obtenerMetricasPorPrioridad (AGREGAR valorEstimado)

Esta query probablemente también necesita el valor estimado. Si no está, agregar:

```java
@Query("SELECT l.prioridad, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(AVG(CAST(l.presupuestoEstimado AS double)), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "AND l.prioridad IS NOT NULL " +
       "GROUP BY l.prioridad")
List<Object[]> obtenerMetricasPorPrioridad(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin,
    @Param("sucursalId") Long sucursalId
);
```

**AGREGAR:** Línea 4 con `CAST(l.presupuestoEstimado AS double)`

### Query 5: obtenerDistribucionGeografica (AGREGAR valorEstimado)

```java
@Query("SELECT l.provincia, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CAST(l.presupuestoEstimado AS double)), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.provincia IS NOT NULL " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.provincia " +
       "ORDER BY COUNT(l) DESC")
List<Object[]> obtenerDistribucionGeografica(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin,
    @Param("sucursalId") Long sucursalId
);
```

**AGREGAR:** Línea 3 con `CAST(l.presupuestoEstimado AS double)`

### Query 6: obtenerProductosMasSolicitados (AGREGAR valorEstimado)

```java
@Query("SELECT p.id, p.nombre, COUNT(l), " +
       "SUM(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 ELSE 0 END), " +
       "COALESCE(SUM(CAST(l.presupuestoEstimado AS double)), 0.0) " +
       "FROM Lead l JOIN l.productoInteres p WHERE " +
       "l.fechaPrimerContacto BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY p.id, p.nombre " +
       "ORDER BY COUNT(l) DESC")
List<Object[]> obtenerProductosMasSolicitados(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin,
    @Param("sucursalId") Long sucursalId
);
```

**AGREGAR:** Línea 3 con `CAST(l.presupuestoEstimado AS double)`

## 📋 Resumen de Cambios

**5 queries necesitan modificación:**

1. **obtenerMetricasPorCanal** → `CAST(CASE WHEN ... presupuestoEstimado ... AS double)`
2. **obtenerPerformancePorVendedor** → `CAST(CASE WHEN ... presupuestoEstimado ... AS double)`
3. **obtenerPresupuestoEstimadoTotal** → `CAST(SUM(...) AS double)` y `CAST(AVG(...) AS double)`
4. **obtenerMetricasPorPrioridad** → Agregar 4ta columna: `CAST(l.presupuestoEstimado AS double)`
5. **obtenerDistribucionGeografica** → Agregar 4ta columna: `CAST(l.presupuestoEstimado AS double)`
6. **obtenerProductosMasSolicitados** → Agregar 5ta columna: `CAST(l.presupuestoEstimado AS double)`

## 🔧 Patrón General

**SIEMPRE que uses presupuestoEstimado:**

```java
// ❌ INCORRECTO
SUM(l.presupuestoEstimado)

// ✅ CORRECTO
SUM(CAST(l.presupuestoEstimado AS double))

// ❌ INCORRECTO  
AVG(l.presupuestoEstimado)

// ✅ CORRECTO
AVG(CAST(l.presupuestoEstimado AS double))

// ❌ INCORRECTO
CASE WHEN ... THEN l.presupuestoEstimado ELSE 0 END

// ✅ CORRECTO
CAST(CASE WHEN ... THEN l.presupuestoEstimado ELSE 0 END AS double)
```

## ✅ Testing

Después de aplicar los cambios:

```bash
# 1. Recompilar
mvn clean compile

# 2. Reiniciar Spring Boot

# 3. Probar endpoint
curl "http://localhost:8080/RipserApp/api/leads/metricas?fechaInicio=2024-01-01&fechaFin=2024-12-31"
```

**Esto debería resolver el error 400 y retornar JSON válido.**
