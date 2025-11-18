# Backend: Implementar Enums para Color y Medida de Equipos

## Resumen
El frontend ahora usa **enums estrictos** para `color` y `medida` de equipos en lugar de strings libres. Esto elimina ambigüedades como "verde" vs "verdoso" o "1,4m" vs "1.4m".

## Cambios en el Frontend
✅ Se crearon los tipos:
- `ColorEquipo`: 21 colores predefinidos (BLANCO, NEGRO, ROJO, AZUL, etc.)
- `MedidaEquipo`: 13 medidas predefinidas (0.8m, 1.0m, 1.2m, ..., 3.0m)

✅ Actualizadas las interfaces:
- `DetalleDocumento`
- `DetalleDocumentoDTO`
- `EquipoFabricadoDTO`
- `EquipoFabricadoCreateDTO`
- `EquipoFabricadoUpdateDTO`

✅ UI mejorada:
- Select boxes (combo boxes) en lugar de campos de texto libre
- Opción "Sin especificar" para casos donde no se requiere

## Cambios Requeridos en el Backend

### 1. Crear Enums en Java

```java
// ColorEquipo.java
package com.ripser.enums;

public enum ColorEquipo {
    BLANCO,
    NEGRO,
    NEGRA,
    GRIS,
    PLATA,
    ROJO,
    AZUL,
    VERDE,
    AMARILLO,
    NARANJA,
    VIOLETA,
    ROSA,
    MARRON,
    BEIGE,
    CELESTE,
    TURQUESA,
    DORADO,
    PLATEADO,
    BRONCE,
    COBRE,
    INOXIDABLE
}
```

```java
// MedidaEquipo.java
package com.ripser.enums;

public enum MedidaEquipo {
    M_0_8("0.8m"),
    M_1_0("1.0m"),
    M_1_2("1.2m"),
    M_1_4("1.4m"),
    M_1_5("1.5m"),
    M_1_6("1.6m"),
    M_1_8("1.8m"),
    M_2_0("2.0m"),
    M_2_2("2.2m"),
    M_2_4("2.4m"),
    M_2_5("2.5m"),
    M_2_8("2.8m"),
    M_3_0("3.0m");

    private final String valor;

    MedidaEquipo(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    public static MedidaEquipo fromString(String text) {
        for (MedidaEquipo m : MedidaEquipo.values()) {
            if (m.valor.equalsIgnoreCase(text)) {
                return m;
            }
        }
        return null;
    }

    @Override
    public String toString() {
        return this.valor;
    }
}
```

### 2. Actualizar Entidades

```java
// EquipoFabricado.java
@Entity
@Table(name = "equipos_fabricados")
public class EquipoFabricado {
    // ... otros campos

    @Enumerated(EnumType.STRING)
    @Column(name = "color", length = 50)
    private ColorEquipo color;

    @Enumerated(EnumType.STRING)
    @Column(name = "medida", length = 10)
    private MedidaEquipo medida;

    // getters y setters
}
```

```java
// DetalleDocumento.java
@Entity
@Table(name = "detalle_documento_comercial")
public class DetalleDocumento {
    // ... otros campos

    @Enumerated(EnumType.STRING)
    @Column(name = "color", length = 50)
    private ColorEquipo color;

    @Enumerated(EnumType.STRING)
    @Column(name = "medida", length = 10)
    private MedidaEquipo medida;

    // getters y setters
}
```

### 3. Actualizar DTOs

```java
// EquipoFabricadoDTO.java
public class EquipoFabricadoDTO {
    // ... otros campos

    private ColorEquipo color;
    private MedidaEquipo medida;

    // getters y setters
}
```

```java
// DetalleDocumentoDTO.java
public class DetalleDocumentoDTO {
    // ... otros campos

    private ColorEquipo color;
    private MedidaEquipo medida;

    // getters y setters
}
```

### 4. Actualizar Mappers

Los mappers deberían funcionar automáticamente si los DTOs y entidades usan los mismos tipos enum. Si estás usando MapStruct o similar, puede que necesites configuración adicional para serializar/deserializar correctamente.

### 5. Migración de Base de Datos

**IMPORTANTE**: Si ya tienes datos existentes con valores de string libre, necesitas migrarlos.

#### Opción A: Migración Manual (Recomendado)

```sql
-- Primero, revisa los valores existentes
SELECT DISTINCT color FROM equipos_fabricados WHERE color IS NOT NULL;
SELECT DISTINCT medida FROM equipos_fabricados WHERE medida IS NOT NULL;
SELECT DISTINCT color FROM detalle_documento_comercial WHERE color IS NOT NULL;
SELECT DISTINCT medida FROM detalle_documento_comercial WHERE medida IS NOT NULL;

-- Normaliza los valores existentes (ejemplo)
UPDATE equipos_fabricados
SET color = 'BLANCO'
WHERE UPPER(color) IN ('BLANCO', 'WHITE', 'BLANCA');

UPDATE equipos_fabricados
SET medida = '1.4m'
WHERE medida IN ('1,4m', '1.4', '1,4', '140cm');

-- Repite para otros valores...

-- Finalmente, establece NULL para valores que no matchean
UPDATE equipos_fabricados
SET color = NULL
WHERE color NOT IN ('BLANCO', 'NEGRO', 'NEGRA', 'GRIS', ...);

UPDATE equipos_fabricados
SET medida = NULL
WHERE medida NOT IN ('0.8m', '1.0m', '1.2m', ...);
```

#### Opción B: Script de Migración con Flyway/Liquibase

```sql
-- V1_15__migrate_color_medida_enums.sql

-- Tabla temporal para mapeo
CREATE TEMPORARY TABLE color_mapping (
    old_value VARCHAR(100),
    new_value VARCHAR(50)
);

INSERT INTO color_mapping VALUES
('blanco', 'BLANCO'),
('blanca', 'BLANCO'),
('white', 'BLANCO'),
('negro', 'NEGRO'),
('negra', 'NEGRA'),
('black', 'NEGRO'),
('rojo', 'ROJO'),
('red', 'ROJO'),
-- ... más mappings

CREATE TEMPORARY TABLE medida_mapping (
    old_value VARCHAR(100),
    new_value VARCHAR(10)
);

INSERT INTO medida_mapping VALUES
('1,4m', '1.4m'),
('1.4', '1.4m'),
('140cm', '1.4m'),
('1,6m', '1.6m'),
('1.6', '1.6m'),
-- ... más mappings

-- Actualizar equipos_fabricados
UPDATE equipos_fabricados e
SET color = (
    SELECT new_value
    FROM color_mapping
    WHERE LOWER(e.color) = LOWER(old_value)
)
WHERE EXISTS (
    SELECT 1 FROM color_mapping
    WHERE LOWER(e.color) = LOWER(old_value)
);

UPDATE equipos_fabricados e
SET medida = (
    SELECT new_value
    FROM medida_mapping
    WHERE REPLACE(LOWER(e.medida), ' ', '') = REPLACE(LOWER(old_value), ' ', '')
)
WHERE EXISTS (
    SELECT 1 FROM medida_mapping
    WHERE REPLACE(LOWER(e.medida), ' ', '') = REPLACE(LOWER(old_value), ' ', '')
);

-- Repetir para detalle_documento_comercial
UPDATE detalle_documento_comercial d
SET color = (
    SELECT new_value
    FROM color_mapping
    WHERE LOWER(d.color) = LOWER(old_value)
)
WHERE EXISTS (
    SELECT 1 FROM color_mapping
    WHERE LOWER(d.color) = LOWER(old_value)
);

UPDATE detalle_documento_comercial d
SET medida = (
    SELECT new_value
    FROM medida_mapping
    WHERE REPLACE(LOWER(d.medida), ' ', '') = REPLACE(LOWER(old_value), ' ', '')
)
WHERE EXISTS (
    SELECT 1 FROM medida_mapping
    WHERE REPLACE(LOWER(d.medida), ' ', '') = REPLACE(LOWER(old_value), ' ', '')
);
```

### 6. Validación en Controladores (Opcional)

Si quieres validación adicional a nivel de API:

```java
// En tu controlador o service
public void validarColor(ColorEquipo color) {
    if (color == null) {
        return; // Permitir null
    }
    // El enum ya garantiza que sea un valor válido
}

public void validarMedida(MedidaEquipo medida) {
    if (medida == null) {
        return; // Permitir null
    }
    // El enum ya garantiza que sea un valor válido
}
```

### 7. Serialización JSON

Asegúrate de que Jackson esté configurado correctamente para serializar los enums:

```java
// MedidaEquipo será serializado como "1.4m" en lugar de "M_1_4"
// Esto ya debería funcionar con @JsonValue o toString()

@JsonValue
public String getValor() {
    return valor;
}
```

Para ColorEquipo, la serialización por defecto (nombre del enum) debería ser suficiente.

## Testing

### Tests de Integración
```java
@Test
public void testCrearEquipoConColorYMedida() {
    EquipoFabricadoCreateDTO dto = new EquipoFabricadoCreateDTO();
    dto.setColor(ColorEquipo.BLANCO);
    dto.setMedida(MedidaEquipo.M_1_4);
    // ... otros campos

    EquipoFabricadoDTO result = equipoService.create(dto);

    assertEquals(ColorEquipo.BLANCO, result.getColor());
    assertEquals(MedidaEquipo.M_1_4, result.getMedida());
}

@Test
public void testBuscarEquipoPorColorYMedida() {
    List<EquipoFabricadoDTO> equipos = equipoService.findByColorAndMedida(
        ColorEquipo.ROJO,
        MedidaEquipo.M_2_0
    );

    assertFalse(equipos.isEmpty());
    equipos.forEach(e -> {
        assertEquals(ColorEquipo.ROJO, e.getColor());
        assertEquals(MedidaEquipo.M_2_0, e.getMedida());
    });
}
```

## Beneficios

1. **Consistencia de datos**: No más variaciones como "verde", "Verde", "VERDE", "verdoso"
2. **Validación automática**: Spring/Jackson rechazará valores inválidos
3. **Mejor búsqueda**: Queries más eficientes y exactas
4. **Autocomplete en IDE**: Los desarrolladores ven las opciones disponibles
5. **Evita errores de tipeo**: No se pueden crear equipos con medidas inventadas
6. **Reportes más confiables**: Datos normalizados facilitan análisis

## Consideraciones

- **Valores NULL permitidos**: Tanto color como medida son opcionales
- **Backward compatibility**: Si tienes APIs públicas, considera deprecar los endpoints que usan strings
- **Documentación**: Actualiza la documentación de API (Swagger/OpenAPI) para mostrar los valores permitidos

## Próximos Pasos

1. ✅ Implementar enums en backend
2. ✅ Migrar datos existentes
3. ✅ Actualizar tests
4. ✅ Verificar serialización JSON
5. ✅ Probar integración frontend-backend
6. ✅ Actualizar documentación de API
