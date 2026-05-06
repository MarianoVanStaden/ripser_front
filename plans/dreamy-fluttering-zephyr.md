# Plan: arreglar IT `LeadDeduplicacaoIT` tras V54/V55

## Context

CI rompió en `LeadDeduplicacaoIT` con dos tipos de errores tras los cambios de las migraciones V54 (rubro) y V55 (soft-delete):

```
JDBC exception ... [Unknown column 'l1_0.deleted_at' in 'field list']
JDBC exception ... [Unable to find column position by name: rubro]
```

**Causa raíz:** este IT no usa Flyway. Levanta MySQL 8.0 vía Testcontainers con `ddl-auto=none` y arma el schema con un script manual:

[ripser_back/src/test/resources/test-schema/leads-dedup-schema.sql](../../ripser_back/src/test/resources/test-schema/leads-dedup-schema.sql)

Cuando agregamos columnas a `Lead` y `Cliente` (entidades JPA), Hibernate las incluye en cada `SELECT` autogenerado. Como el schema script no fue actualizado, MySQL no tiene esas columnas y falla al ejecutar las queries.

Concretamente faltan:
- `leads`: `rubro`, `rubro_detalle`, `deleted_at`
- `clientes`: `rubro`, `rubro_detalle`

(`telefono_alternativo` ya estaba en el script en ambas tablas, no requiere cambio.)

## Cambio

**Único archivo a editar:** `ripser_back/src/test/resources/test-schema/leads-dedup-schema.sql`

### En `CREATE TABLE leads`

Agregar tres columnas nuevas — junto a las relacionadas para mantener orden lógico:

- `rubro VARCHAR(30)` — agrupar con otros enums (cerca de `prioridad`/`canal`).
- `rubro_detalle VARCHAR(200)` — al lado de `rubro`.
- `deleted_at TIMESTAMP NULL DEFAULT NULL` — al final, junto a `fecha_creacion`/`fecha_actualizacion`.

### En `CREATE TABLE clientes`

- `rubro VARCHAR(30)` — cerca de `segmento`.
- `rubro_detalle VARCHAR(200)` — al lado de `rubro`.

(Cliente NO necesita `deleted_at`: el soft-delete solo aplica a Lead por ahora.)

### Tipos elegidos

Mantienen consistencia con las migraciones de producción:

- `rubro VARCHAR(30)` — coincide con [V54_0_0__add_rubro_to_lead_cliente.sql](../../ripser_back/src/main/resources/db/migration/V54_0_0__add_rubro_to_lead_cliente.sql) y con `@Column(length = 30)` en las entidades.
- `rubro_detalle VARCHAR(200)` — idem.
- `deleted_at TIMESTAMP NULL DEFAULT NULL` — idem [V55_0_0__leads_soft_delete.sql](../../ripser_back/src/main/resources/db/migration/V55_0_0__leads_soft_delete.sql).

No se agregan índices al schema de tests porque el IT no testea performance — solo correctitud de queries.

## Por qué no hace falta tocar nada más

- El IT inserta filas con `INSERT INTO leads (id, empresa_id, nombre, telefono, canal, estado_lead) VALUES (...)`. No menciona las columnas nuevas. Como las nuevas son nullable sin default no nulo, los inserts existentes siguen funcionando (las columnas quedan en NULL).
- La query JPQL `findByTelefonoNormalizadoExcluding` selecciona la entidad completa, y al expandir Hibernate emite SELECT con todas las columnas mapeadas. Con las columnas en MySQL, ese SELECT pasa.
- La query nativa `findByTelefonoNormalizado` de `ClienteRepository` proyecta sobre la entidad Cliente. Con `rubro` y `rubro_detalle` en la tabla, el mapeo posicional (que Hibernate hace por nombre con `addEntity`) encuentra cada columna.
- El soft-delete `@Filter("deletedLeadFilter")` se evalúa pero como `SoftDeleteFilterAspect` solo se activa cuando se invoca un método de `@Service`, y este IT golpea el repositorio directamente, el filter no se enciende → no hay riesgo de WHERE adicional rompiendo asserts existentes.

## Verificación

```bash
cd ripser_back
./mvnw verify -Dit.test=LeadDeduplicacaoIT
```

Esperado: los 14 tests del IT pasan (los 10 que estaban en error + los 4 que ya pasaban). Tiempo aproximado: 1–2 min con la imagen `mysql:8.0` ya cacheada por Testcontainers.

Si el IT corre con limpieza de DB entre tests (`@Transactional` rollback), no hace falta limpiar manualmente.
