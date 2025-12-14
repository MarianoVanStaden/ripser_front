# FIX: ClassCastException en Queries de Métricas

## 🐛 Error Identificado

```
java.lang.ClassCastException: class [Ljava.lang.Object; cannot be cast to class java.lang.Number
```

## 📍 Causa Probable

El error ocurre cuando una query JPQL retorna múltiples columnas (`Object[]`) pero el código espera un valor único (`Long`, `Double`, etc.).

**Queries problemáticas típicas:**
```java
// ❌ INCORRECTO - Retorna Object[] con 2 elementos
@Query("SELECT COUNT(l), SUM(l.valorEstimado) FROM Lead l WHERE ...")
Long contarLeads(...);

// ✅ CORRECTO - Usar solo COUNT
@Query("SELECT COUNT(l) FROM Lead l WHERE ...")
Long contarLeads(...);

// ✅ CORRECTO - O usar Object[] como retorno
@Query("SELECT COUNT(l), SUM(l.valorEstimado) FROM Lead l WHERE ...")
Object[] contarYSumar(...);
```

## 🔍 Queries a Revisar en LeadRepository.java

Buscar estas queries que probablemente están mal:

1. **Queries con múltiples funciones agregadas:**
```java
// Si la query tiene AVG(...), SUM(...) juntos
@Query("SELECT AVG(DATEDIFF(...)), MIN(...), MAX(...) ...")
```

2. **Queries con COALESCE que retornan múltiples valores:**
```java
@Query("SELECT COALESCE(AVG(...), 0), COALESCE(MIN(...), 0) ...")
```

## 🛠️ Solución Recomendada

### Opción 1: Separar en múltiples queries simples

```java
// En lugar de:
@Query("SELECT AVG(DATEDIFF(l.fechaConversion, l.fechaCreacion)), " +
       "MIN(DATEDIFF(l.fechaConversion, l.fechaCreacion)), " +
       "MAX(DATEDIFF(l.fechaConversion, l.fechaCreacion)) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' ...")
Object[] obtenerTiemposConversion(...);

// Hacer:
@Query("SELECT COALESCE(AVG(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0.0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' ...")
Double obtenerPromedioConversion(...);

@Query("SELECT COALESCE(MIN(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' ...")
Integer obtenerMinimoConversion(...);

@Query("SELECT COALESCE(MAX(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' ...")
Integer obtenerMaximoConversion(...);
```

### Opción 2: Usar un constructor DTO en la query

```java
@Query("SELECT new com.ripser_back.dto.metricas.TiempoConversionRawDTO(" +
       "COALESCE(AVG(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0.0), " +
       "COALESCE(MIN(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0), " +
       "COALESCE(MAX(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0)) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' ...")
TiempoConversionRawDTO obtenerTiemposConversion(...);
```

### Opción 3: Cambiar el tipo de retorno a Object[]

```java
@Query("SELECT COALESCE(AVG(...), 0.0), COALESCE(MIN(...), 0), COALESCE(MAX(...), 0) ...")
Object[] obtenerTiemposConversion(...);

// En el Service:
Object[] result = repository.obtenerTiemposConversion(...);
Double promedio = ((Number) result[0]).doubleValue();
Integer minimo = ((Number) result[1]).intValue();
Integer maximo = ((Number) result[2]).intValue();
```

## 📝 Queries Específicas a Corregir

Revisar **LeadRepository.java** líneas donde tenemos:

1. `obtenerTiempoPromedioConversion` - Si retorna múltiples valores
2. `obtenerValorEstimadoTotal` - Verificar tipo de retorno
3. Cualquier query con múltiples `COALESCE` o agregaciones

## ✅ Pasos Inmediatos

1. Abrir `LeadRepository.java`
2. Buscar todas las `@Query` que tienen múltiples `SELECT` con funciones agregadas
3. Aplicar una de las 3 soluciones anteriores
4. Recompilar: `mvn clean compile`
5. Probar el endpoint: `GET /api/leads/metricas?fechaInicio=2024-01-01&fechaFin=2024-12-31`

## 🎯 Ejemplo de Fix Completo

**ANTES (❌ Error):**
```java
@Query("SELECT AVG(DATEDIFF(l.fechaConversion, l.fechaCreacion)), " +
       "MIN(DATEDIFF(l.fechaConversion, l.fechaCreacion)), " +
       "MAX(DATEDIFF(l.fechaConversion, l.fechaCreacion)) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' " +
       "AND l.fechaConversion BETWEEN :fechaInicio AND :fechaFin")
Double obtenerTiempoPromedioConversion(@Param("fechaInicio") LocalDate fechaInicio,
                                       @Param("fechaFin") LocalDate fechaFin);
```

**DESPUÉS (✅ Correcto):**
```java
@Query("SELECT COALESCE(AVG(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0.0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' " +
       "AND l.fechaConversion BETWEEN :fechaInicio AND :fechaFin")
Double obtenerTiempoPromedioConversion(@Param("fechaInicio") LocalDate fechaInicio,
                                       @Param("fechaFin") LocalDate fechaFin);

@Query("SELECT COALESCE(MIN(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' " +
       "AND l.fechaConversion BETWEEN :fechaInicio AND :fechaFin")
Integer obtenerTiempoMinimoConversion(@Param("fechaInicio") LocalDate fechaInicio,
                                      @Param("fechaFin") LocalDate fechaFin);

@Query("SELECT COALESCE(MAX(DATEDIFF(l.fechaConversion, l.fechaCreacion)), 0) " +
       "FROM Lead l WHERE l.estadoLead = 'CONVERTIDO' " +
       "AND l.fechaConversion BETWEEN :fechaInicio AND :fechaFin")
Integer obtenerTiempoMaximoConversion(@Param("fechaInicio") LocalDate fechaInicio,
                                      @Param("fechaFin") LocalDate fechaFin);
```

---

**Urgente:** Necesitas corregir las queries en el backend antes de que el sistema de métricas funcione.
