# FIX: NumberFormatException en Queries de Métricas

## 🐛 Nuevo Error Identificado

```
java.lang.NumberFormatException: Character array is missing "e" notation exponential mark.
HTTP 400 BAD_REQUEST
```

## 📍 Causa

Este error ocurre cuando las queries JPQL retornan valores numéricos con **tipos incompatibles** o cuando se intenta convertir entre tipos de manera incorrecta.

## 🔍 Problemas Comunes en JPQL

### 1. COALESCE con tipos incompatibles

```java
// ❌ INCORRECTO - Mezcla Double con Integer
@Query("SELECT COALESCE(AVG(l.valorEstimado), 0) FROM Lead l")
Double obtenerPromedio();

// ✅ CORRECTO - Usar 0.0 para Double
@Query("SELECT COALESCE(AVG(l.valorEstimado), 0.0) FROM Lead l")
Double obtenerPromedio();
```

### 2. SUM con valores NULL

```java
// ❌ INCORRECTO - SUM puede retornar NULL
@Query("SELECT SUM(l.valorEstimado) FROM Lead l")
BigDecimal obtenerTotal();

// ✅ CORRECTO - Usar COALESCE
@Query("SELECT COALESCE(SUM(l.valorEstimado), 0.0) FROM Lead l")
BigDecimal obtenerTotal();
```

### 3. División por cero en cálculos

```java
// ❌ INCORRECTO - Puede dividir por 0
@Query("SELECT (COUNT(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 END) * 100.0) / COUNT(l) ...")

// ✅ CORRECTO - Validar antes de dividir
@Query("SELECT CASE WHEN COUNT(l) > 0 THEN " +
       "(COUNT(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 END) * 100.0) / COUNT(l) " +
       "ELSE 0.0 END ...")
```

## 🛠️ Soluciones por Query

### Query 1: Tasa de Conversión (puede causar división por cero)

**ANTES:**
```java
@Query("SELECT (COUNT(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 END) * 100.0) / COUNT(l) " +
       "FROM Lead l WHERE l.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
Double obtenerTasaConversion(...);
```

**DESPUÉS:**
```java
@Query("SELECT CASE WHEN COUNT(l) > 0 THEN " +
       "(CAST(COUNT(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 END) AS double) * 100.0) / COUNT(l) " +
       "ELSE 0.0 END " +
       "FROM Lead l WHERE l.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
Double obtenerTasaConversion(...);
```

### Query 2: Tiempo Promedio de Conversión

**ANTES:**
```java
@Query("SELECT AVG(DATEDIFF(l.fechaConversion, l.fechaCreacion)) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO'")
Double obtenerPromedioConversion();
```

**DESPUÉS:**
```java
@Query("SELECT COALESCE(AVG(CAST(DATEDIFF(l.fechaConversion, l.fechaCreacion) AS double)), 0.0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' " +
       "AND l.fechaConversion BETWEEN :fechaInicio AND :fechaFin")
Double obtenerPromedioConversion(@Param("fechaInicio") LocalDate fechaInicio,
                                 @Param("fechaFin") LocalDate fechaFin);
```

### Query 3: Valor Estimado Total

**ANTES:**
```java
@Query("SELECT SUM(l.valorEstimado) FROM Lead l")
BigDecimal obtenerValorTotal();
```

**DESPUÉS:**
```java
@Query("SELECT COALESCE(SUM(l.valorEstimado), 0) FROM Lead l " +
       "WHERE l.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
BigDecimal obtenerValorTotal(@Param("fechaInicio") LocalDate fechaInicio,
                             @Param("fechaFin") LocalDate fechaFin);
```

## 📝 Checklist de Correcciones

Para **TODAS** las queries en `LeadRepository.java`:

- [ ] Todas las `AVG()` tienen `COALESCE(..., 0.0)` con Double
- [ ] Todas las `SUM()` tienen `COALESCE(..., 0)` o `COALESCE(..., 0.0)`
- [ ] Todas las divisiones validan que el divisor > 0
- [ ] Usar `CAST(... AS double)` para asegurar tipo Double
- [ ] Todas las queries que usan `DATEDIFF` tienen `COALESCE`
- [ ] Los tipos de retorno en Java coinciden con el tipo en SQL

## 🔧 Template de Query Segura

```java
@Query("SELECT COALESCE(" +
           "CASE WHEN COUNT(l) > 0 THEN " +
               "CAST(COUNT(CASE WHEN [condicion] THEN 1 END) AS double) * 100.0 / COUNT(l) " +
           "ELSE 0.0 END, " +
       "0.0) " +
       "FROM Lead l " +
       "WHERE l.fechaCreacion BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId)")
Double obtenerMetricaSegura(@Param("fechaInicio") LocalDate fechaInicio,
                           @Param("fechaFin") LocalDate fechaFin,
                           @Param("sucursalId") Long sucursalId);
```

## ✅ Pasos de Corrección

1. Abrir `LeadRepository.java`
2. Por cada `@Query`:
   - Agregar `COALESCE` a todas las funciones agregadas
   - Usar `CAST(... AS double)` para operaciones decimales
   - Validar divisiones con `CASE WHEN divisor > 0`
   - Asegurar tipos compatibles en COALESCE
3. Recompilar: `mvn clean compile`
4. Reiniciar Spring Boot
5. Probar endpoint

## 🎯 Ejemplo Completo de Query Corregida

```java
// Calcular tasa de conversión por canal
@Query("SELECT l.canal, " +
       "CAST(COUNT(l) AS long), " +
       "CAST(COUNT(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 END) AS long), " +
       "CASE WHEN COUNT(l) > 0 THEN " +
           "CAST(COUNT(CASE WHEN l.estadoLead = 'CONVERTIDO' THEN 1 END) AS double) * 100.0 / CAST(COUNT(l) AS double) " +
       "ELSE 0.0 END, " +
       "COALESCE(AVG(CAST(DATEDIFF(l.fechaConversion, l.fechaCreacion) AS double)), 0.0) " +
       "FROM Lead l " +
       "WHERE l.fechaCreacion BETWEEN :fechaInicio AND :fechaFin " +
       "AND (:sucursalId IS NULL OR l.sucursalId = :sucursalId) " +
       "GROUP BY l.canal")
List<Object[]> obtenerMetricasPorCanal(@Param("fechaInicio") LocalDate fechaInicio,
                                       @Param("fechaFin") LocalDate fechaFin,
                                       @Param("sucursalId") Long sucursalId);
```

---

**Clave:** Usar `CAST`, `COALESCE` y validar divisiones en **TODAS** las queries.
