# Parámetro de Meta de Presupuesto Mensual

## Descripción

El dashboard de métricas de leads ahora incluye un KPI de **"Cumplimiento de Meta de Ventas"** que compara el valor realizado de conversiones contra una meta mensual de facturación configurable.

## ¿Qué hace este parámetro?

- **Clave**: `META_PRESUPUESTO_MENSUAL`
- **Propósito**: Define la meta mensual de facturación en pesos ($) para comparar el desempeño real de ventas
- **Valor por defecto**: $1,000,000 (si no se configura)
- **Uso**: Se compara contra `presupuestoVsRealizado.valorRealizadoTotal` para calcular el % de cumplimiento

## Tarjeta KPI Resultante

```
Cumplimiento de Meta de Ventas
182% (verde porque superó el 100%)
Realizado: $1,332,210
Meta mensual: $1,000,000
"X de Y presupuestos convertidos"
```

### Colores según cumplimiento:
- **Verde** ✅: >= 100% de la meta
- **Amarillo** ⚠️: >= 70% y < 100% de la meta
- **Rojo** ❌: < 70% de la meta

## SQL para crear el parámetro

```sql
-- Insertar parámetro de meta de presupuesto mensual
-- AJUSTA EL VALOR según la meta de facturación mensual de tu empresa

INSERT INTO parametro_sistema (
    empresa_id,
    clave,
    valor,
    descripcion,
    tipo_dato,
    categoria,
    modificable_usuario,
    fecha_creacion,
    fecha_actualizacion
)
VALUES (
    1,  -- Ajustar según tu empresa_id
    'META_PRESUPUESTO_MENSUAL',
    '1000000',  -- Meta de $1,000,000 mensuales - AJUSTAR SEGÚN TU EMPRESA
    'Meta mensual de facturación en pesos para el dashboard de métricas de leads',
    'NUMBER',
    'METRICAS',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

## Configuración recomendada según tamaño de empresa:

### Empresa Pequeña:
```sql
valor = '300000'  -- $300,000/mes
```

### Empresa Mediana:
```sql
valor = '1000000'  -- $1,000,000/mes
```

### Empresa Grande:
```sql
valor = '5000000'  -- $5,000,000/mes
```

## Cómo modificar el parámetro

```sql
-- Actualizar la meta mensual
UPDATE parametro_sistema
SET valor = '1500000',  -- Nueva meta: $1,500,000
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE clave = 'META_PRESUPUESTO_MENSUAL'
  AND empresa_id = 1;  -- Ajustar según tu empresa_id
```

## Verificar que existe:

```sql
SELECT *
FROM parametro_sistema
WHERE clave = 'META_PRESUPUESTO_MENSUAL';
```

## Notas importantes:

1. El valor debe ser un número sin separadores de miles ni símbolos ($)
2. El frontend lo formatea automáticamente con separadores de miles
3. Si el parámetro no existe, el frontend usa $1,000,000 como default
4. Puedes tener diferentes metas por empresa (empresa_id)
5. Este parámetro se puede modificar mensualmente según objetivos comerciales

## Relación con otros parámetros:

Este parámetro trabaja junto con:
- `META_MENSUAL_LEADS`: Meta de cantidad de leads mensuales
- Juntos permiten visualizar tanto la cantidad como el valor de las conversiones
