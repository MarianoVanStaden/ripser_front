# Deuda técnica — performance de listados grandes

Este documento registra optimizaciones identificadas durante el Nivel 1 de
performance pero **no implementadas todavía**, junto con sus triggers de
activación. Se complementa con `ripser_back/DEUDA_TECNICA.md` para los ítems
de backend.

> **Regla:** antes de atacar cualquier ítem de Nivel 2 o 3, **medir** con
> Chrome DevTools (Performance + Network) y métricas reales de usuarios,
> identificar el cuello de botella concreto, y aplicar **solo** la solución
> que ataca ese cuello.

---

## Heredado del Nivel 1 (no se hizo end-to-end)

### Cursor-based pagination en listados (backend)

- **Qué es:** reemplazar `Page<T>` con OFFSET por cursor sobre `(fecha_primer_contacto, id)` o `id`. Respuesta: `{ data, nextCursor, hasMore }`.
- **Por qué es deuda:** OFFSET es O(N) en MySQL — para `OFFSET 90000 LIMIT 100` el motor recorre 90 100 filas y descarta 90 000. Con índices apropiados es aceptable hasta cientos de miles.
- **Trigger:** `EXPLAIN ANALYZE` muestra OFFSET caro, o **tablas que superen 500 k filas** por tenant. Hoy leads ~17 k → no aplica.
- **Esfuerzo:** ~2 días (cambia firma de respuesta de `getAllLeads`, `getAllClientes`, `getAllDocumentos` + frontend de cada uno).
- **Impacto:** scroll y paginación O(1) independiente del offset.

### Proyección DTO específica para listado

- **Qué es:** `LeadListItemDTO` distinto de `LeadDTO`. Hoy `getAllLeads` devuelve `LeadDTO` completo (27 campos) por fila — incluye campos solo necesarios en el detalle.
- **Por qué es deuda:** payload más pesado de lo necesario. Con gzip se mitiga, pero JSON.parse y serialización siguen costando.
- **Trigger:** payload de la primera página > 200 KB comprimido, o tiempo de render > 500 ms con DataGrid virtualizado.
- **Esfuerzo:** ~4 horas (DTO + mapper + actualizar consumo del frontend a usar `productoInteresNombre` etc. desde el DTO chico).
- **Impacto:** payload ~40-60 % menor.

### Campo `tieneRecordatoriosPendientes` en `LeadListItemDTO`

- **Qué es:** que el listado de leads incluya un boolean (o el próximo recordatorio) computado por un `LEFT JOIN` o subquery, en vez de hacer un fetch separado de recordatorios.
- **Por qué es deuda:** hoy el frontend hace una query "peek" a `/api/recordatorios?enviado=false&size=500` y matchea por `leadId`. Si hay > 500 recordatorios pendientes, los leads que están más abajo en el scroll pierden el badge.
- **Trigger:** > 500 recordatorios pendientes simultáneos por tenant, o badge incorrecto en feedback de usuarios.
- **Esfuerzo:** ~3 horas (query con subquery EXISTS + campo en DTO + mapper).
- **Impacto:** elimina la query secundaria, badge siempre correcto.

### Refactor de páginas de Documentos Comerciales (COMPLETADO)

- **Estado:** las 5 páginas (`RegistroVentasPage`, `PresupuestosPage`, `NotasPedidoPage`, `NotasCreditoPage`, `FacturacionPage`) ya usan `useQuery` con paginación server-side. `NotasCreditoPage` migró su Autocomplete de "cargar todas las facturas" a typeahead server-side con búsqueda debounced.
- **Backend:** endpoints `/api/documentos` y `/api/documentos/tipo/{tipo}` aceptan `tipos` (multi), `estado`/`estados` (multi), `clienteId`, `fechaDesde`, `fechaHasta`, `busqueda`. Sort whitelist + cap 500 + default sort estable.
- **Limitaciones funcionales conocidas que quedaron documentadas en código:**
  - **`RegistroVentasPage`:** filtro `paymentMethodFilter` se sigue aplicando client-side (el backend no soporta filtrar por `metodoPago`). Solo afecta la página visible. Si se vuelve necesario, agregar `metodoPago` al `findAllWithFilters` del repository (~30 min).
  - **`RegistroVentasPage`:** los totales (`totalRevenue`, `averageOrderValue`) se calculan sobre la página visible, no sobre el dataset filtrado completo. Antes era exacto porque cargaba todo. Si se necesita el total real, agregar endpoint `/api/documentos/totales` que devuelva agregaciones con los mismos filtros (~2h backend + 30min frontend).
  - **`NotasPedidoPage`:** dropdown del filtro de cliente se construye a partir de los clientes presentes en la página visible. Si un cliente no aparece en la página actual, no figura en el dropdown. Solución: endpoint dedicado `/api/clientes-con-documentos?tipo=NOTA_PEDIDO`.
  - **`PresupuestosPage`:** la búsqueda matchea contra `numeroDocumento` y `nombre del cliente` server-side, pero NO contra `nombre del lead`. Para presupuestos asignados a leads, el filtro de búsqueda no encuentra por nombre del lead. Solución: extender el LIKE en `findByTipoWithFilters` con un join opcional a `lead.nombre`.
  - **`PresupuestosPage`:** dropdown de leads en el formulario carga los primeros 500 leads no convertidos al abrir el dialog. Si hay más, faltan. Solución: convertir a typeahead server-side (similar a `useClienteSearch`).
- **Impacto medido:** apertura instantánea (<200ms con cache caliente, <1s en cold start), filtros y búsqueda en server, scroll/paginación O(1).

### Refactor de InventoryPage (productos)

- **Qué es:** `InventoryPage.tsx` carga `productApi.getAll({page:0, size:10000})` + `movimientoStockApi.getAll()` (sin paginación) al mount.
- **Por qué es deuda:** un tenant con > 1000 productos paga el round-trip completo en cada apertura. Los movimientos de stock son aún peor — la tabla crece con cada operación.
- **Trigger:** > 500 productos por empresa, o tiempo de apertura > 2s reportado por usuarios.
- **Esfuerzo:** ~6 horas (la página es más simple que las de documentos).
- **Plan:** `useInfiniteQuery` sobre `productApi.getAll` con filtros server-side (categoría, búsqueda, activo). Movimientos: cargar solo los del producto seleccionado o paginar separado.
- **Impacto:** apertura < 1s independiente del catálogo.

### `JpaSpecificationExecutor` para queries dinámicas

- **Qué es:** reemplazar el `@Query` JPQL con muchos `IS NULL OR` por `Specification<Lead>` componible.
- **Por qué es deuda:** la query JPQL actual funciona pero crece linealmente al agregar filtros. Las Specifications generan SQL con sólo las cláusulas activas → mejor plan de ejecución.
- **Trigger:** se necesitan más filtros dinámicos (rango de fechas, score, etc.) y la query actual se vuelve insostenible.
- **Esfuerzo:** ~4 horas.
- **Impacto:** queries más limpias y planes de ejecución mejores cuando faltan filtros.

---

## Nivel 2 — UX "instantánea" (offline-friendly)

### Caché local en IndexedDB con delta sync

- **Qué es:** Dexie.js o RxDB en el frontend. Backend expone `GET /api/leads?changedSince=<timestamp>` que devuelve creados, modificados y eliminados (soft delete con `deleted_at`). El cliente persiste el catálogo y lo refresca con deltas.
- **Por qué es deuda:** la primera carga sigue golpeando el server. Con caché local la grilla abre instantánea.
- **Trigger:**
  - Tiempo de carga percibido sigue siendo lento tras Nivel 1, **o**
  - Se necesita modo offline (vendedores en sucursales con red intermitente).
- **Estrategia de conflictos:** definir last-write-wins por timestamp o versionado optimista por `version` column.
- **Esfuerzo:** ~5–8 días (frontend + backend + soft-delete schema).
- **Impacto:** apertura < 100 ms (lectura de IndexedDB), tolerancia a red intermitente.

### Prefetching de módulos frecuentes

- **Qué es:** tras el login, en background, `queryClient.prefetchInfiniteQuery` para leads y clientes. Plus prefetch en hover sobre items del menú.
- **Por qué es deuda:** hoy la primera apertura de cada módulo siempre paga el round-trip.
- **Trigger:** módulos con tiempo de apertura > 500 ms en p50 según RUM.
- **Esfuerzo:** ~2 horas.
- **Impacto:** apertura instantánea para módulos prefetched.

### Streaming NDJSON (carga progresiva)

- **Qué es:** el backend devuelve un stream NDJSON (`application/x-ndjson`) y el frontend pinta filas a medida que llegan.
- **Por qué es deuda:** los primeros 100 leads ya pintan rápido con la paginación actual. Streaming añade complejidad (no se puede `JSON.parse` el cuerpo entero).
- **Trigger:** se necesita pintar > 1000 filas en < 500 ms (poco probable con virtualización ya implementada).
- **Esfuerzo:** ~3 días.
- **Impacto:** percepción "instantánea" en datasets grandes.

---

## Nivel 3 — Optimizaciones puntuales

### Web Workers (Comlink) para procesamiento pesado

- **Qué es:** mover cálculos/transformaciones pesadas del cliente a un Web Worker.
- **Trigger:** se detectan bloqueos del hilo principal > 50 ms en Performance tab durante cálculos client-side (export Excel grande, agregaciones).
- **Esfuerzo:** ~2 días.

### Búsqueda full-text en MySQL

- **Qué es:** índice `FULLTEXT` sobre `(nombre, telefono, email)` y reemplazar `LIKE %x%` por `MATCH ... AGAINST`. Alternativa: Meilisearch / Typesense / Elasticsearch.
- **Por qué es deuda:** MySQL **no tiene** `pg_trgm` (es Postgres-only). El `LIKE %x%` actual no usa índice — aceptable para 17 k filas, no para 200 k.
- **Trigger:** búsqueda > 500 ms en p95, o se piden features de fuzzy / relevancia.
- **Esfuerzo:** ~1 día (FULLTEXT) / ~5 días (Meilisearch).

### Vistas materializadas y particionado en DB

- **Trigger:** `EXPLAIN ANALYZE` muestra queries de agregación lentas (> 1 s), o una tabla supera varios millones de filas.

### HTTP/2 o HTTP/3 + CDN para assets

- **Trigger:** RTT alto o multiplexing se vuelve cuello de botella (improbable con un solo origen y conexión persistente).

### Migración a server-side row model de DataGrid Pro/AG Grid

- **Qué es:** si los volúmenes superan los cientos de miles de registros por usuario, usar un row model que pague licencia y entregue features avanzadas (group by, pivot, export streaming).
- **Trigger:** > 500 k filas por tenant.
- **Hoy elegimos:** `@tanstack/react-virtual` + `<Table>` MUI. DataGrid Community no soporta infinite scroll (es feature de Pro). Migrar a Pro/AG Grid implica licencia y reescritura.

---

## Deuda heredada del backend (no relacionada con perf, registrada por contexto)

### Activar Flyway (hoy NO está activo)

- **Estado actual:** existe `ripser_back/src/main/resources/db/migration/V*.sql` con ~50 archivos versionados, pero **Flyway no está en `pom.xml`** ni configurado. Los `.sql` son hoy documentación / scripts manuales. El schema vive de `spring.jpa.hibernate.ddl-auto=update` + scripts SQL corridos a mano.
- **Riesgo:**
  - Drift entre dev / staging / prod: cada entorno aplica scripts en órdenes distintos.
  - Hibernate no crea índices que requieran sintaxis específica (FULLTEXT, parciales, etc.).
  - Cambios destructivos (drop column) los tiene que correr alguien manualmente.
- **Plan:**
  1. Agregar `org.flywaydb:flyway-core` y `org.flywaydb:flyway-mysql` al `pom.xml`.
  2. Calcular el baseline real: dump del schema actual de prod, marcar como `V0__baseline.sql`.
  3. Configurar `spring.flyway.baseline-on-migrate=true` y `baseline-version=0` en la primera ejecución.
  4. Verificar que las migraciones existentes (V1…V50) sean idempotentes o consolidarlas.
  5. Switch `ddl-auto` a `validate` para garantizar que todo cambio pase por migración.
- **Trigger:** próximo refactor de schema, o incidente por drift entre entornos.
- **Esfuerzo:** ~2 días (baseline + corrección de migraciones que ya se aplicaron a mano).
- **Impacto:** schema versionado, deploys reproducibles, posibilidad de aplicar índices desde `V*.sql` en lugar de declararlos en `@Table(indexes=…)`.

### `spring.jpa.hibernate.ddl-auto=update`

- **Riesgo:** Hibernate puede modificar el schema en startup. Una vez activo Flyway, conviene fijar `ddl-auto=validate` para forzar que todos los cambios pasen por migración versionada.
- **Trigger:** después de activar Flyway (ítem anterior).
- **Esfuerzo:** ~2 horas (corregir cualquier mismatch).

---

## Cómo agregar un ítem nuevo

Mantener este formato para que sea evaluable contra criterios objetivos:

- **Qué es:** descripción técnica concreta.
- **Por qué es deuda:** qué cuello de botella ataca y qué se sacrifica al no hacerlo.
- **Trigger:** condición medible que dispara la implementación.
- **Esfuerzo:** estimación en horas/días.
- **Impacto:** ganancia esperada cuantificada cuando sea posible.
