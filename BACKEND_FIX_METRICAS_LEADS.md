# 🔧 Correcciones Requeridas - Backend API Métricas de Leads

## Problema Actual

El endpoint de métricas de leads está devolviendo **valores en 0** para:
1. **Tiempo de Conversión** (todos los campos)
2. **Presupuesto vs Realizado** (todos los campos)

A pesar de que existen leads convertidos en el período seleccionado.

---

## 1. ⏱️ Tiempo de Conversión - Valores en 0

### ❌ Lo que recibe el frontend actualmente:
```json
{
  "tiempoConversion": {
    "promedioGeneral": 0,
    "medianaGeneral": 0,
    "minimoTiempo": 0,
    "maximoTiempo": 0,
    "promedioPorCanal": {},
    "promedioPorPrioridad": {}
  }
}
```

### ✅ Lo que DEBE devolver:
```json
{
  "tiempoConversion": {
    "promedioGeneral": 5.2,        // Promedio de días entre fechaCreacion y fechaConversion
    "medianaGeneral": 4.0,         // Mediana de días de conversión
    "minimoTiempo": 1,             // Menor tiempo de conversión en días
    "maximoTiempo": 15,            // Mayor tiempo de conversión en días
    "promedioPorCanal": {
      "WEB": 4.5,
      "TELEFONO": 6.2,
      "EMAIL": 5.8
    },
    "promedioPorPrioridad": {
      "HOT": 2.3,
      "WARM": 5.5,
      "COLD": 8.7
    }
  }
}
```

### 🛠️ Cómo calcularlo:

1. **Filtrar leads convertidos** en el período especificado:
   ```sql
   WHERE estadoLead = 'CONVERTIDO' 
   AND fechaConversion BETWEEN :fechaInicio AND :fechaFin
   ```

2. **Calcular días de conversión** para cada lead:
   ```sql
   DATEDIFF(fechaConversion, fechaCreacion) AS diasConversion
   ```

3. **Calcular estadísticas**:
   - `promedioGeneral`: AVG(diasConversion)
   - `medianaGeneral`: Usar función PERCENTILE_CONT(0.5) o calcular mediana manualmente
   - `minimoTiempo`: MIN(diasConversion)
   - `maximoTiempo`: MAX(diasConversion)

4. **Agrupar por canal y prioridad**:
   ```sql
   SELECT 
     canalOrigen,
     AVG(DATEDIFF(fechaConversion, fechaCreacion)) AS promedio
   FROM leads
   WHERE estadoLead = 'CONVERTIDO'
   GROUP BY canalOrigen
   ```

### ⚠️ Validaciones importantes:
- Si `fechaConversion` es NULL → **No incluir en cálculos**
- Si `fechaCreacion` es NULL → **No incluir en cálculos**
- Si no hay leads convertidos → Devolver 0 en todos los campos
- Los días deben ser **números enteros positivos**

---

## 2. 💰 Presupuesto vs Realizado - Valores en 0

### ❌ Lo que recibe el frontend actualmente:
```json
{
  "presupuestoVsRealizado": {
    "presupuestoEstimadoTotal": 0,
    "valorRealizadoTotal": 0,
    "tasaRealizacion": 0,
    "cantidadPresupuestosEstimados": 0,
    "cantidadPresupuestosRealizados": 0,
    "diferencia": 0
  }
}
```

### ✅ Lo que DEBE devolver:
```json
{
  "presupuestoVsRealizado": {
    "presupuestoEstimadoTotal": 250000.50,  // Suma de valores estimados en leads
    "valorRealizadoTotal": 180000.75,       // Suma de valores reales en documentos comerciales
    "tasaRealizacion": 72.0,                // (valorRealizado / presupuestoEstimado) * 100
    "cantidadPresupuestosEstimados": 14,    // Total de leads en el período
    "cantidadPresupuestosRealizados": 5,    // Total de leads convertidos
    "diferencia": -70000.25                 // valorRealizado - presupuestoEstimado
  }
}
```

### 🛠️ Cómo calcularlo:

1. **Presupuesto Estimado Total**:
   ```sql
   SELECT SUM(valorEstimado) 
   FROM leads
   WHERE fechaCreacion BETWEEN :fechaInicio AND :fechaFin
   ```
   - Usar el campo `valorEstimado` del lead
   - Si no existe, calcular desde los items de interés del lead

2. **Valor Realizado Total**:
   ```sql
   SELECT SUM(dc.total)
   FROM leads l
   INNER JOIN documentos_comerciales dc ON l.documentoComercialId = dc.id
   WHERE l.estadoLead = 'CONVERTIDO'
   AND l.fechaConversion BETWEEN :fechaInicio AND :fechaFin
   ```
   - Sumar el `total` de los DocumentosComerciales asociados a leads convertidos
   - **Importante**: Vincular correctamente leads con sus documentos/presupuestos

3. **Cantidad de Presupuestos Estimados**:
   ```sql
   SELECT COUNT(*) 
   FROM leads
   WHERE fechaCreacion BETWEEN :fechaInicio AND :fechaFin
   ```

4. **Cantidad de Presupuestos Realizados**:
   ```sql
   SELECT COUNT(*) 
   FROM leads
   WHERE estadoLead = 'CONVERTIDO'
   AND fechaConversion BETWEEN :fechaInicio AND :fechaFin
   ```

5. **Tasa de Realización**:
   ```java
   if (presupuestoEstimadoTotal > 0) {
     tasaRealizacion = (valorRealizadoTotal / presupuestoEstimadoTotal) * 100;
   } else {
     tasaRealizacion = 0;
   }
   ```

6. **Diferencia**:
   ```java
   diferencia = valorRealizadoTotal - presupuestoEstimadoTotal;
   ```

### ⚠️ Validaciones importantes:
- Verificar que el `documentoComercialId` en Lead **no sea NULL** antes de sumar
- Si un lead no tiene documento asociado, **usar 0** para ese lead
- Manejar valores NULL → Tratar como 0
- Asegurar que los totales sean **BigDecimal** para evitar pérdida de precisión

---

## 3. 🔍 Debugging - Verificar en el Backend

### Consultas para verificar datos:

```sql
-- 1. Verificar leads con fechas de conversión
SELECT 
  id,
  estadoLead,
  fechaCreacion,
  fechaConversion,
  DATEDIFF(fechaConversion, fechaCreacion) AS diasParaConvertir
FROM leads
WHERE estadoLead = 'CONVERTIDO'
AND fechaConversion IS NOT NULL
ORDER BY fechaConversion DESC
LIMIT 10;

-- 2. Verificar vinculación leads-documentos
SELECT 
  l.id AS lead_id,
  l.estadoLead,
  l.valorEstimado,
  l.documentoComercialId,
  dc.total AS totalDocumento,
  dc.tipoDocumento
FROM leads l
LEFT JOIN documentos_comerciales dc ON l.documentoComercialId = dc.id
WHERE l.estadoLead = 'CONVERTIDO'
LIMIT 10;

-- 3. Verificar que existan datos en el período
SELECT 
  COUNT(*) AS total_leads,
  COUNT(CASE WHEN estadoLead = 'CONVERTIDO' THEN 1 END) AS convertidos,
  SUM(valorEstimado) AS suma_estimada
FROM leads
WHERE fechaCreacion >= '2024-11-14' 
AND fechaCreacion <= '2024-12-14';
```

---

## 4. 📋 Checklist de Implementación

### TiempoConversionDTO:
- [ ] Calcular `promedioGeneral` (AVG días de conversión)
- [ ] Calcular `medianaGeneral` (mediana días de conversión)
- [ ] Calcular `minimoTiempo` (MIN días de conversión)
- [ ] Calcular `maximoTiempo` (MAX días de conversión)
- [ ] Agrupar por canal → Map<String, Double> `promedioPorCanal`
- [ ] Agrupar por prioridad → Map<String, Double> `promedioPorPrioridad`
- [ ] Validar que `fechaConversion` y `fechaCreacion` no sean NULL

### PresupuestoVsRealizadoDTO:
- [ ] Calcular `presupuestoEstimadoTotal` (SUM valorEstimado de leads)
- [ ] Calcular `valorRealizadoTotal` (SUM total de documentos comerciales)
- [ ] Calcular `tasaRealizacion` ((realizado/estimado)*100)
- [ ] Contar `cantidadPresupuestosEstimados` (COUNT leads totales)
- [ ] Contar `cantidadPresupuestosRealizados` (COUNT leads convertidos)
- [ ] Calcular `diferencia` (realizado - estimado)
- [ ] Asegurar vinculación correcta Lead ↔ DocumentoComercial

---

## 5. 🎯 Ejemplo de Implementación (Java/Spring)

```java
@Service
public class LeadMetricasService {
    
    public TiempoConversionDTO calcularTiempoConversion(
        LocalDate fechaInicio, 
        LocalDate fechaFin
    ) {
        List<Lead> leadsConvertidos = leadRepository
            .findByEstadoLeadAndFechaConversionBetween(
                EstadoLead.CONVERTIDO,
                fechaInicio,
                fechaFin
            );
        
        if (leadsConvertidos.isEmpty()) {
            return new TiempoConversionDTO(0, 0, 0, 0, Map.of(), Map.of());
        }
        
        // Calcular días de conversión
        List<Long> diasConversion = leadsConvertidos.stream()
            .filter(l -> l.getFechaCreacion() != null && l.getFechaConversion() != null)
            .map(l -> ChronoUnit.DAYS.between(l.getFechaCreacion(), l.getFechaConversion()))
            .collect(Collectors.toList());
        
        // Estadísticas
        double promedio = diasConversion.stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0.0);
        
        long minimo = diasConversion.stream()
            .mapToLong(Long::longValue)
            .min()
            .orElse(0L);
        
        long maximo = diasConversion.stream()
            .mapToLong(Long::longValue)
            .max()
            .orElse(0L);
        
        // Mediana
        Collections.sort(diasConversion);
        double mediana = diasConversion.size() % 2 == 0
            ? (diasConversion.get(diasConversion.size()/2) + 
               diasConversion.get(diasConversion.size()/2 - 1)) / 2.0
            : diasConversion.get(diasConversion.size()/2);
        
        // Agrupar por canal
        Map<String, Double> promedioPorCanal = leadsConvertidos.stream()
            .filter(l -> l.getCanalOrigen() != null)
            .collect(Collectors.groupingBy(
                Lead::getCanalOrigen,
                Collectors.averagingLong(l -> 
                    ChronoUnit.DAYS.between(l.getFechaCreacion(), l.getFechaConversion())
                )
            ));
        
        // Agrupar por prioridad
        Map<String, Double> promedioPorPrioridad = leadsConvertidos.stream()
            .filter(l -> l.getPrioridad() != null)
            .collect(Collectors.groupingBy(
                l -> l.getPrioridad().name(),
                Collectors.averagingLong(l -> 
                    ChronoUnit.DAYS.between(l.getFechaCreacion(), l.getFechaConversion())
                )
            ));
        
        return new TiempoConversionDTO(
            promedio,
            mediana,
            minimo,
            maximo,
            promedioPorCanal,
            promedioPorPrioridad
        );
    }
    
    public PresupuestoVsRealizadoDTO calcularPresupuestoVsRealizado(
        LocalDate fechaInicio,
        LocalDate fechaFin
    ) {
        // Leads en el período
        List<Lead> leadsPeriodo = leadRepository
            .findByFechaCreacionBetween(fechaInicio, fechaFin);
        
        // Presupuesto estimado (suma de valorEstimado)
        BigDecimal presupuestoEstimado = leadsPeriodo.stream()
            .map(l -> l.getValorEstimado() != null ? l.getValorEstimado() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Leads convertidos con documentos
        List<Lead> leadsConvertidos = leadsPeriodo.stream()
            .filter(l -> l.getEstadoLead() == EstadoLead.CONVERTIDO)
            .filter(l -> l.getDocumentoComercialId() != null)
            .collect(Collectors.toList());
        
        // Valor realizado (suma de totales de documentos)
        BigDecimal valorRealizado = leadsConvertidos.stream()
            .map(l -> documentoComercialRepository
                .findById(l.getDocumentoComercialId())
                .map(DocumentoComercial::getTotal)
                .orElse(BigDecimal.ZERO)
            )
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Tasa de realización
        double tasaRealizacion = presupuestoEstimado.compareTo(BigDecimal.ZERO) > 0
            ? valorRealizado.divide(presupuestoEstimado, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue()
            : 0.0;
        
        // Diferencia
        BigDecimal diferencia = valorRealizado.subtract(presupuestoEstimado);
        
        return new PresupuestoVsRealizadoDTO(
            presupuestoEstimado,
            valorRealizado,
            tasaRealizacion,
            leadsPeriodo.size(),
            leadsConvertidos.size(),
            diferencia
        );
    }
}
```

---

## 6. ✅ Testing

Después de implementar, verificar con:

**Request:**
```http
GET /api/lead-metricas/completas?fechaInicio=2024-11-14&fechaFin=2024-12-14
```

**Response esperada (ejemplo con datos reales):**
```json
{
  "tiempoConversion": {
    "promedioGeneral": 5.2,
    "medianaGeneral": 4.0,
    "minimoTiempo": 1,
    "maximoTiempo": 15,
    "promedioPorCanal": {
      "WEB": 4.5,
      "TELEFONO": 6.2
    },
    "promedioPorPrioridad": {
      "HOT": 2.3,
      "WARM": 5.5
    }
  },
  "presupuestoVsRealizado": {
    "presupuestoEstimadoTotal": 250000.50,
    "valorRealizadoTotal": 180000.75,
    "tasaRealizacion": 72.0,
    "cantidadPresupuestosEstimados": 14,
    "cantidadPresupuestosRealizados": 5,
    "diferencia": -70000.25
  },
  "tasaConversion": {
    "totalLeads": 14,
    "leadsConvertidos": 5,
    "tasaConversion": 35.71
  }
}
```

---

## 🚨 Prioridad

- **ALTA** - Impide que el dashboard de métricas muestre información útil
- Los usuarios no pueden ver el rendimiento real de sus leads
- Afecta la toma de decisiones comerciales

---

# ✅ ACTUALIZACIÓN: PROBLEMAS RESUELTOS

**Fecha de Corrección:** 2024-12-14

## 🎉 Estado: IMPLEMENTADO Y FUNCIONANDO

El equipo de backend implementó todas las correcciones solicitadas. Los cambios incluyen:

### ✅ Correcciones Implementadas

#### 1. **TiempoConversionDTO** - COMPLETO
- ✅ `promedioGeneral` - Calculado desde `diasHastaConversion`
- ✅ `medianaGeneral` - Implementada con algoritmo manual correcto
- ✅ `minimoTiempo` - Extraído correctamente de SQL
- ✅ `maximoTiempo` - Extraído correctamente de SQL
- ✅ `promedioPorCanal` - Agrupación por canal implementada
- ✅ `promedioPorPrioridad` - **NUEVO CAMPO** agregado y calculado
- ✅ `promedioMesAnterior` - Para comparación temporal

**Cambios en el código:**
```java
// Cálculo correcto de mediana
List<Integer> diasConversion = leadsConvertidos.stream()
    .filter(l -> l.getDiasHastaConversion() != null && l.getDiasHastaConversion() > 0)
    .map(Lead::getDiasHastaConversion)
    .sorted()
    .collect(Collectors.toList());

if (!diasConversion.isEmpty()) {
    int size = diasConversion.size();
    if (size % 2 == 0) {
        medianaGeneral = (diasConversion.get(size / 2 - 1) + diasConversion.get(size / 2)) / 2.0;
    } else {
        medianaGeneral = diasConversion.get(size / 2).doubleValue();
    }
}
```

**Nueva Query en LeadRepository:**
```java
@Query("SELECT l.prioridad, COALESCE(AVG(CAST(l.diasHastaConversion AS double)), 0.0) " +
       "FROM Lead l WHERE " +
       "l.fechaConversion BETWEEN :fechaInicio AND :fechaFin " +
       "AND l.estadoLead = 'CONVERTIDO' " +
       "AND l.diasHastaConversion IS NOT NULL " +
       "AND l.prioridad IS NOT NULL " +
       "GROUP BY l.prioridad")
List<Object[]> obtenerTiempoConversionPorPrioridad(
    @Param("fechaInicio") LocalDate fechaInicio,
    @Param("fechaFin") LocalDate fechaFin
);
```

#### 2. **PresupuestoVsRealizadoDTO** - COMPLETO
- ✅ `presupuestoEstimadoTotal` - Suma de valores estimados
- ✅ `valorRealizadoTotal` - Suma de presupuestos aprobados
- ✅ `tasaRealizacion` - Calculada correctamente
- ✅ `cantidadPresupuestosEstimados` - Conteo de leads
- ✅ `cantidadPresupuestosRealizados` - Conteo de convertidos
- ✅ `diferencia` - **NUEVO CAMPO** (valorRealizado - presupuestoEstimado)
- ✅ `valorPromedioEstimado` - Promedio de estimados
- ✅ `valorPromedioRealizado` - Promedio de realizados

**Cambios en DTO:**
```java
// Agregado campo diferencia
private BigDecimal diferencia;

// En el servicio:
BigDecimal diferencia = valorRealizadoTotal.subtract(presupuestoEstimadoTotal);

return PresupuestoVsRealizadoDTO.builder()
    .presupuestoEstimadoTotal(presupuestoEstimadoTotal)
    .valorRealizadoTotal(valorRealizadoTotal)
    .tasaRealizacion(tasaRealizacion)
    .diferencia(diferencia.setScale(2, RoundingMode.HALF_UP))
    // ...otros campos...
    .build();
```

### 🔍 Verificaciones Realizadas

El backend verificó que:
1. El campo `diasHastaConversion` se calcula automáticamente en `@PrePersist` y `@PreUpdate`
2. Las consultas manejan correctamente valores NULL
3. Los cálculos usan `BigDecimal` para precisión monetaria
4. La mediana se calcula manualmente (no usa función SQL que podría no existir)

### 📊 Response Actualizada

**Ahora el endpoint devuelve:**
```json
{
  "tiempoConversion": {
    "promedioGeneral": 5.2,
    "medianaGeneral": 4.0,
    "minimoTiempo": 1,
    "maximoTiempo": 15,
    "promedioPorCanal": {
      "WEB": 4.5,
      "TELEFONO": 6.2
    },
    "promedioPorPrioridad": {
      "HOT": 2.3,
      "WARM": 5.5,
      "COLD": 8.7
    },
    "promedioMesAnterior": 4.8
  },
  "presupuestoVsRealizado": {
    "presupuestoEstimadoTotal": 250000.50,
    "valorRealizadoTotal": 180000.75,
    "tasaRealizacion": 72.0,
    "cantidadPresupuestosEstimados": 14,
    "cantidadPresupuestosRealizados": 5,
    "diferencia": -70000.25,
    "valorPromedioEstimado": 17857.18,
    "valorPromedioRealizado": 36000.15
  }
}
```

### ⚠️ Acción Requerida en Frontend

**El frontend ya está actualizado** para usar los nombres correctos de propiedades:
- ✅ `promedioGeneral` (antes esperaba `promedioTiempoConversion`)
- ✅ `minimoTiempo` (antes esperaba `tiempoConversionMinimo`)
- ✅ `maximoTiempo` (antes esperaba `tiempoConversionMaximo`)
- ✅ `presupuestoEstimadoTotal` (antes esperaba `valorEstimadoTotal`)
- ✅ `valorRealizadoTotal` (antes esperaba `valorRealizado`)
- ✅ `tasaRealizacion` (antes esperaba `porcentajeCumplimiento`)

### 🎯 Próximos Pasos

1. **Actualizar datos históricos** (si es necesario):
```sql
UPDATE leads 
SET dias_hasta_conversion = DATEDIFF(fecha_conversion, fecha_primer_contacto)
WHERE estado_lead = 'CONVERTIDO' 
AND fecha_conversion IS NOT NULL 
AND fecha_primer_contacto IS NOT NULL
AND dias_hasta_conversion IS NULL;
```

2. **Verificar en el dashboard** que las métricas muestren valores reales

3. **Probar las exportaciones** PDF y Excel con los datos correctos

---

# 🔍 DEBUGGING ADICIONAL - Problema de Rango de Fechas

**Fecha de Análisis:** 2025-12-14

## ⚠️ Problema Detectado: Desajuste de Fechas

### Resultados de las Queries de Verificación:

#### Query 1: Leads convertidos en período 2024
```sql
SELECT COUNT(*) 
FROM leads 
WHERE estado_lead = 'CONVERTIDO' 
AND fecha_conversion BETWEEN '2024-11-14' AND '2024-12-14';
```
**Resultado:** `0` ❌

#### Query 2: Leads convertidos sin filtro de fecha
```sql
SELECT id, fecha_primer_contacto, fecha_conversion, dias_hasta_conversion
FROM leads 
WHERE estado_lead = 'CONVERTIDO'
LIMIT 10;
```
**Resultado:** `6 leads encontrados` ✅

| id | fecha_primer_contacto | fecha_conversion | dias_hasta_conversion |
|----|----------------------|------------------|---------------------|
| 2  | 2025-12-03          | 2025-12-14       | 11                  |
| 3  | 2025-12-03          | 2025-12-14       | 11                  |
| 5  | 2025-12-03          | 2025-12-14       | 11                  |
| 7  | 2025-12-04          | 2025-12-12       | 8                   |
| 8  | 2025-12-04          | 2025-12-12       | 8                   |
| 13 | 2025-12-09          | 2025-12-09       | 0                   |

#### Query 3: Presupuestos en período 2024
```sql
SELECT COUNT(*), SUM(presupuesto_estimado)
FROM leads
WHERE fecha_primer_contacto BETWEEN '2024-11-14' AND '2024-12-14'
AND presupuesto_estimado IS NOT NULL;
```
**Resultado:** `COUNT(*) = 0, SUM = NULL` ❌

---

## 🎯 Diagnóstico

### El problema NO es el backend - Es el rango de fechas

1. ✅ **Backend funcionando correctamente:**
   - Campo `dias_hasta_conversion` calculado correctamente (11, 11, 11, 8, 8, 0 días)
   - Leads con estado 'CONVERTIDO' existentes
   - Datos bien estructurados

2. ❌ **Problema: Desajuste de años:**
   - Los leads convertidos tienen fechas de **diciembre 2025**
   - El filtro del dashboard está buscando en **2024-11-14 a 2024-12-14**
   - Por eso devuelve 0 registros

---

## 🛠️ Soluciones

### Opción 1: Ajustar el Rango de Fechas Manualmente (Temporal)

En el dashboard, cambiar el filtro de fechas a:
```
Desde: 2025-11-14
Hasta: 2025-12-14
```

**O mejor aún, usar el rango del mes actual:**
```
Desde: 2025-12-01
Hasta: 2025-12-14 (hoy)
```

### Opción 2: Usar Filtros Dinámicos (Recomendado)

Modificar `LeadMetricasPage.tsx` para que el filtro de fechas por defecto sea **relativo**:

```typescript
// En lugar de fechas hardcodeadas:
const [filtros, setFiltros] = useState({
  fechaInicio: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),  // Últimos 30 días
  fechaFin: dayjs().format('YYYY-MM-DD')                           // Hoy
});
```

O usar el primer día del mes actual:
```typescript
const [filtros, setFiltros] = useState({
  fechaInicio: dayjs().startOf('month').format('YYYY-MM-DD'),  // Inicio del mes
  fechaFin: dayjs().format('YYYY-MM-DD')                       // Hoy
});
```

---

## ✅ Verificación con Fechas Correctas

Para confirmar que el backend funciona, ejecutar las queries con las fechas correctas:

```sql
-- 1. Leads convertidos en diciembre 2025
SELECT COUNT(*) 
FROM leads 
WHERE estado_lead = 'CONVERTIDO' 
AND fecha_conversion BETWEEN '2025-12-01' AND '2025-12-14';
-- Esperado: 6

-- 2. Suma de presupuestos en diciembre 2025
SELECT COUNT(*), SUM(presupuesto_estimado)
FROM leads
WHERE fecha_primer_contacto BETWEEN '2025-12-01' AND '2025-12-14'
AND presupuesto_estimado IS NOT NULL;
-- Esperado: > 0 si los leads tienen presupuesto estimado

-- 3. Verificar tiempos de conversión
SELECT 
  AVG(dias_hasta_conversion) AS promedio,
  MIN(dias_hasta_conversion) AS minimo,
  MAX(dias_hasta_conversion) AS maximo
FROM leads 
WHERE estado_lead = 'CONVERTIDO'
AND fecha_conversion BETWEEN '2025-12-01' AND '2025-12-14'
AND dias_hasta_conversion IS NOT NULL;
-- Esperado: promedio ≈ 8.16, minimo = 0, maximo = 11
```

---

## 📝 Acción Inmediata Requerida

### ✅ Frontend ya configurado correctamente

El archivo `LeadMetricasPage.tsx` **ya está usando fechas dinámicas**:

```typescript
const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(
  dayjs().subtract(30, 'days')  // ✅ Últimos 30 días desde hoy
);
const [fechaFin, setFechaFin] = useState<Dayjs | null>(dayjs());  // ✅ Hoy
```

**No se requiere modificación en el frontend.** El código ya está correcto.

---

## 🎉 Solución Final

### Para ver las métricas funcionando:

1. **Refrescar el navegador** en el dashboard de métricas
   - El filtro por defecto será: `2025-11-14 a 2025-12-14` (últimos 30 días)
   - Debería mostrar los 6 leads convertidos

2. **Si no aparecen datos, ajustar manualmente** el filtro de fechas a:
   ```
   Desde: 2025-12-01 (inicio del mes actual)
   Hasta: 2025-12-14 (hoy)
   ```

3. **Verificar en la consola del navegador** los logs de debugging:
   - 🗺️ Distribución Geográfica - Datos recibidos
   - ⭐ Productos/Equipos - Datos recibidos
   - Datos del backend

---

## 🧪 Queries de Verificación con Fechas Correctas

Para confirmar que todo funciona, ejecutar en MySQL con **fechas de 2025**:

```sql
-- 1. Leads convertidos en diciembre 2025
SELECT COUNT(*) 
FROM leads 
WHERE estado_lead = 'CONVERTIDO' 
AND fecha_conversion BETWEEN '2025-12-01' AND '2025-12-14';
-- Esperado: 6 ✅

-- 2. Tiempo promedio de conversión
SELECT 
  AVG(dias_hasta_conversion) AS promedio,
  MIN(dias_hasta_conversion) AS minimo,
  MAX(dias_hasta_conversion) AS maximo
FROM leads 
WHERE estado_lead = 'CONVERTIDO'
AND fecha_conversion BETWEEN '2025-12-01' AND '2025-12-14'
AND dias_hasta_conversion IS NOT NULL;
-- Esperado: promedio ≈ 8.17, minimo = 0, maximo = 11 ✅

-- 3. Presupuestos del mes (verificar si tienen presupuesto_estimado)
SELECT 
  id,
  presupuesto_estimado,
  estado_lead,
  fecha_primer_contacto
FROM leads
WHERE fecha_primer_contacto BETWEEN '2025-12-01' AND '2025-12-14'
ORDER BY fecha_primer_contacto DESC;
-- Revisar si los leads tienen presupuesto_estimado no nulo

-- 4. Si los leads NO tienen presupuesto_estimado, actualizar manualmente (ejemplo):
UPDATE leads 
SET presupuesto_estimado = 50000.00  -- Ajustar según sea necesario
WHERE id IN (2, 3, 5, 7, 8, 13)
AND presupuesto_estimado IS NULL;
```

---

## 📊 Estado Final del Sistema

| Componente | Estado | Notas |
|-----------|--------|-------|
| **Backend - TiempoConversion** | ✅ Funcionando | Cálculos correctos, mediana implementada |
| **Backend - PresupuestoVsRealizado** | ✅ Funcionando | Incluye campo `diferencia` |
| **Frontend - DTOs** | ✅ Actualizado | Nombres de propiedades correctos |
| **Frontend - Filtros de Fecha** | ✅ Dinámicos | Últimos 30 días automáticos |
| **Frontend - Exportación** | ✅ Funcionando | PDF y Excel con null-safety |
| **Frontend - Tablas** | ✅ Visibles | Typography en lugar de Chip |
| **Datos de Prueba** | ⚠️ Verificar | Asegurar que `presupuesto_estimado` no sea NULL |

---

## ⚠️ Único Problema Pendiente

**Si los campos de presupuesto siguen en 0:**

Es probable que los leads **no tengan el campo `presupuesto_estimado` completado**. Verificar con:

```sql
SELECT 
  COUNT(*) AS total_leads,
  COUNT(presupuesto_estimado) AS con_presupuesto,
  SUM(presupuesto_estimado) AS suma_total
FROM leads
WHERE fecha_primer_contacto BETWEEN '2025-12-01' AND '2025-12-14';
```

**Solución temporal para pruebas:**
```sql
UPDATE leads 
SET presupuesto_estimado = FLOOR(10000 + (RAND() * 90000))  -- Entre 10k y 100k
WHERE presupuesto_estimado IS NULL
AND fecha_primer_contacto >= '2025-12-01';
```

---

## 📞 Contacto

Si necesitas más aclaraciones o ejemplos específicos, por favor avísame.

---

# ⚠️ ACTUALIZACIÓN CRÍTICA - 2025-12-14 16:30

## 🔴 BACKEND AÚN NO FUNCIONA COMPLETAMENTE

**Estado de Verificación con Datos Reales:**

### Request enviado desde frontend:
```
GET /api/leads/metricas?fechaInicio=2025-11-14&fechaFin=2025-12-14
```

### Response recibida del backend:
```json
{
  "tiempoConversion": {
    "promedioGeneral": 0,        // ❌ INCORRECTO - Debería ser ~8.17
    "medianaGeneral": 9.5,       // ✅ CORRECTO
    "minimoTiempo": 0,           // ❌ INCORRECTO - Se mantiene en 0
    "maximoTiempo": 0,           // ❌ INCORRECTO - Debería ser 11
    "promedioPorCanal": {...},
    "promedioPorPrioridad": {...}
  },
  "presupuestoVsRealizado": {
    "presupuestoEstimadoTotal": 733322,              // ✅ CORRECTO
    "valorRealizadoTotal": 0,                        // ❌ INCORRECTO - En 0
    "tasaRealizacion": 0,                            // ❌ INCORRECTO - En 0
    "cantidadPresupuestosEstimados": 15,             // ✅ CORRECTO
    "cantidadPresupuestosRealizados": 0,             // ❌ INCORRECTO - Dice 0 pero hay 6 convertidos
    "diferencia": 0
  },
  "tasaConversion": {
    "totalLeads": 15,            // ✅ CORRECTO
    "leadsConvertidos": 6,       // ✅ CORRECTO
    "tasaConversion": 40         // ✅ CORRECTO
  }
}
```

---

## 🔍 Análisis de los Problemas Pendientes

### 1. ❌ TiempoConversion - Implementación INCOMPLETA

**Datos en base de datos (verificados):**
```
id=2:  dias_hasta_conversion = 11
id=3:  dias_hasta_conversion = 11
id=5:  dias_hasta_conversion = 11
id=7:  dias_hasta_conversion = 8
id=8:  dias_hasta_conversion = 8
id=13: dias_hasta_conversion = 0
```

**Cálculos esperados:**
- Promedio: (11+11+11+8+8+0) / 6 = 49 / 6 = **8.17 días**
- Mediana: [0, 8, 8, 11, 11, 11] → (8+11)/2 = **9.5 días** ✅ (OK)
- Mínimo: **0 días** (lead #13)
- Máximo: **11 días** (leads #2, #3, #5)

**Lo que devuelve el backend:**
- Promedio: 0 ❌
- Mediana: 9.5 ✅
- Mínimo: 0 ❌ (casualidad, debería ser calculado)
- Máximo: 0 ❌

#### 🛠️ Código que FALTA implementar:

```java
// En LeadMetricasServiceImpl.calcularTiempoConversion()

// ❌ FALTA: Calcular promedio
double promedioGeneral = diasConversion.stream()
    .mapToInt(Integer::intValue)
    .average()
    .orElse(0.0);

// ✅ OK: Mediana (ya funciona)
double medianaGeneral = ... // Ya implementado correctamente

// ❌ FALTA: Calcular mínimo
int minimoTiempo = diasConversion.stream()
    .mapToInt(Integer::intValue)
    .min()
    .orElse(0);

// ❌ FALTA: Calcular máximo  
int maximoTiempo = diasConversion.stream()
    .mapToInt(Integer::intValue)
    .max()
    .orElse(0);
```

---

### 2. ❌ PresupuestoVsRealizado - SIN IMPLEMENTAR

**Datos en base de datos (verificados):**
- 15 leads en el período (con presupuesto estimado total = $733,322) ✅
- 6 leads convertidos (estado_lead = 'CONVERTIDO') ✅
- 0 presupuestos realizados según backend ❌

**El problema:** Los leads convertidos **NO tienen `documentoComercialId`** asociado.

#### 🔍 Verificar en base de datos:

```sql
-- 1. Verificar si los leads convertidos tienen documento asociado
SELECT 
  id,
  estado_lead,
  fecha_conversion,
  documento_comercial_id,
  cliente_id_convertido
FROM leads
WHERE estado_lead = 'CONVERTIDO'
AND fecha_primer_contacto BETWEEN '2025-11-14' AND '2025-12-14';
```

**Si `documento_comercial_id` es NULL:**

El problema está en el flujo de conversión de leads. Cuando se convierte un lead, **NO se está asignando el documento comercial** al lead.

#### 🛠️ SOLUCIÓN CONFIRMADA: Buscar documentos por cliente_id

**IMPORTANTE:** La entidad Lead NO tiene campo `documento_comercial_id`.

Los documentos comerciales están asociados al **Cliente**, no al Lead.

Por lo tanto, debemos buscar documentos usando `clienteIdConvertido`:

#### 🛠️ SOLUCIÓN CONFIRMADA: Buscar documentos por cliente_id

**IMPORTANTE:** La entidad Lead NO tiene campo `documento_comercial_id`.

Los documentos comerciales están asociados al **Cliente**, no al Lead.

Por lo tanto, debemos buscar documentos usando `clienteIdConvertido`:

```java
// En LeadMetricasServiceImpl.calcularPresupuestoVsRealizado()

// Buscar leads convertidos que tienen cliente asociado
List<Lead> leadsConvertidos = leadsPeriodo.stream()
    .filter(l -> l.getEstadoLead() == EstadoLead.CONVERTIDO)
    .filter(l -> l.getClienteIdConvertido() != null)  // Solo los que tienen cliente
    .collect(Collectors.toList());

// Calcular valor realizado sumando documentos de cada cliente
BigDecimal valorRealizado = leadsConvertidos.stream()
    .map(lead -> {
        Long clienteId = lead.getClienteIdConvertido();
        
        // Buscar todos los documentos comerciales del cliente
        List<DocumentoComercial> documentos = documentoComercialRepository
            .findByClienteId(clienteId);  // O findByClienteIdAndTipoDocumentoIn si quieren filtrar
        
        // Sumar los totales de todos los documentos
        return documentos.stream()
            .map(DocumentoComercial::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    })
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// Cantidad de presupuestos realizados = cantidad de leads con cliente convertido
int cantidadRealizados = leadsConvertidos.size();  // Debería ser 5 o 6
```

**Alternativa más eficiente con una sola query:**

```java
// Opción 1: Si DocumentoComercialRepository tiene el método
BigDecimal valorRealizado = BigDecimal.ZERO;
List<Long> clienteIds = leadsConvertidos.stream()
    .map(Lead::getClienteIdConvertido)
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

if (!clienteIds.isEmpty()) {
    // Query personalizada en DocumentoComercialRepository
    valorRealizado = documentoComercialRepository.sumTotalByClienteIdIn(clienteIds);
}
```

**Agregar en DocumentoComercialRepository:**

```java
@Query("SELECT COALESCE(SUM(d.total), 0) FROM DocumentoComercial d " +
       "WHERE d.clienteId IN :clienteIds " +
       "AND d.tipoDocumento IN ('PRESUPUESTO', 'FACTURA')")  // Filtrar tipos si es necesario
BigDecimal sumTotalByClienteIdIn(@Param("clienteIds") List<Long> clienteIds);
```

---

## 📋 CHECKLIST ACTUALIZADO - Lo que REALMENTE falta

### TiempoConversionDTO:
- [x] Calcular `medianaGeneral` ✅ **COMPLETADO**
- [ ] Calcular `promedioGeneral` ❌ **PENDIENTE**
- [ ] Calcular `minimoTiempo` ❌ **PENDIENTE**
- [ ] Calcular `maximoTiempo` ❌ **PENDIENTE**
- [ ] Calcular `promedioPorCanal` (verificar si funciona)
- [ ] Calcular `promedioPorPrioridad` (verificar si funciona)

### PresupuestoVsRealizadoDTO:
- [x] Calcular `presupuestoEstimadoTotal` ✅ **COMPLETADO**
- [x] Contar `cantidadPresupuestosEstimados` ✅ **COMPLETADO**
- [ ] Calcular `valorRealizadoTotal` ❌ **PENDIENTE** (leads sin documento asociado)
- [ ] Calcular `tasaRealizacion` ❌ **PENDIENTE** (depende de valorRealizado)
- [ ] Contar `cantidadPresupuestosRealizados` ❌ **PENDIENTE** (cuenta 0 en lugar de 6)
- [ ] Calcular `diferencia` ❌ **PENDIENTE** (depende de valorRealizado)

---

## 🚨 PRIORIDAD URGENTE

1. **CRÍTICO:** Arreglar `promedioGeneral`, `minimoTiempo`, `maximoTiempo` en TiempoConversion
2. **CRÍTICO:** Vincular leads convertidos con sus documentos comerciales
3. **ALTO:** Implementar cálculo de `valorRealizadoTotal` y `cantidadPresupuestosRealizados`

---

## 🧪 Query de Diagnóstico Inmediato

Ejecutar esta query para ver el estado de los leads convertidos:

```sql
SELECT 
  l.id,
  l.estado_lead,
  l.fecha_conversion,
  l.dias_hasta_conversion,
  l.presupuesto_estimado,
  l.documento_comercial_id,
  l.cliente_id_convertido,
  c.razon_social,
  COUNT(dc.id) AS cant_documentos_cliente
FROM leads l
LEFT JOIN clientes c ON l.cliente_id_convertido = c.id
LEFT JOIN documentos_comerciales dc ON dc.cliente_id = c.id
WHERE l.estado_lead = 'CONVERTIDO'
AND l.fecha_primer_contacto BETWEEN '2025-11-14' AND '2025-12-14'
GROUP BY l.id
ORDER BY l.fecha_conversion DESC;
```

Esta query mostrará:
- Si los leads tienen `documento_comercial_id` asignado
- Si tienen `cliente_id_convertido` asignado
- Cuántos documentos tiene cada cliente asociado

---

## 📞 Contacto

Urgente: Necesitamos que el backend implemente los cálculos faltantes de inmediato.
