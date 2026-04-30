# Deuda técnica — performance de listados grandes

Este documento registra optimizaciones identificadas durante el Nivel 1 de
performance, junto con sus triggers de activación. Se complementa con
`ripser_back/DEUDA_TECNICA.md` para los ítems de backend.

> **Regla:** antes de atacar cualquier ítem de Nivel 2 o 3, **medir** con
> Chrome DevTools (Performance + Network) y métricas reales de usuarios,
> identificar el cuello de botella concreto, y aplicar **solo** la solución
> que ataca ese cuello.

---

## Nivel 1 (estado: COMPLETADO)

### Refactor de listados con paginación server-side ✓

- **Leads** (`LeadsTablePage`): `useInfiniteQuery` + `@tanstack/react-virtual`. Backend devuelve `LeadListItemDTO` (proyección reducida con `proximoRecordatorio` embebido) en lugar de `LeadDTO` completo.
- **Clientes** (`ClientesPage`): paginación server-side existente arreglada (filtros que el backend ignoraba ahora se respetan).
- **Documentos comerciales** (5 páginas: `RegistroVentas`, `Presupuestos`, `NotasPedido`, `NotasCredito`, `Facturacion`): `useQuery` con paginación + filtros server-side. `NotasCreditoPage` migrada a typeahead de facturas.
- **Productos** (`InventoryPage`): paginación server-side con filtro de categoría. Movimientos de stock paginados por separado.
- **Equipos fabricados** (`EquiposList`): ya estaba bien, solo se agregaron índices compuestos.

### Filtros server-side ✓

- Documentos: `tipos[]`, `estado`/`estados[]`, `metodoPago`, `clienteId`, `fechaDesde/Hasta`, `busqueda` (LIKE sobre `numeroDocumento` + `cliente.nombre` + `lead.nombre` para presupuestos).
- Leads: `estados[]`, `canales[]`, `provincias[]`, `prioridad`, `usuarioId`, `clienteOrigenId`, `busqueda`.
- Clientes: `tipo`, `estado`, `sucursalId`, `term`.
- Productos: `categoriaId`, `activo`, `busqueda`.
- Whitelist de campos de orden + cap de pageSize (max 500) en todos los controllers.

### Endpoints de soporte ✓

- `GET /api/documentos/totales` — agregaciones (count, totalRevenue, avg) sobre los mismos filtros que el listado. Antes RegistroVentas calculaba esto client-side cargando todo el dataset.
- `GET /api/documentos/clientes-con-documentos?tipo=…` — DISTINCT clientes para llenar dropdowns sin pre-cargar el catálogo.
- `PATCH /api/leads/{id}/prioridad` — actualización rápida sin necesitar `LeadDTO` completo.

### Typeahead server-side ✓

- `useClienteSearch` (preexistente).
- `useLeadSearch` nuevo, usado en `PresupuestosPage` (antes cargaba 500 leads al abrir el dialog).
- `NotasCreditoPage` Autocomplete de facturas (antes cargaba todas).

### Índices de BD ✓

Todos declarados en `@Table(indexes={...})` para que Hibernate los aplique en el próximo arranque (Flyway hoy NO los aplicaría aunque estén en `V*.sql` — ver punto siguiente):

- `leads`: `(empresa_id, sucursal_id, estado_lead, fecha_primer_contacto)`, `(empresa_id, usuario_asignado_id, fecha_primer_contacto)`, `(empresa_id, prioridad, fecha_primer_contacto)`, `(empresa_id, fecha_primer_contacto, id)`.
- `clientes`: `(empresa_id, estado/tipo/sucursal_id, nombre)`.
- `documentos_comerciales`: `(empresa_id, tipo_documento, fecha_emision/estado)`, `(empresa_id, cliente_id, fecha_emision)`, `(empresa_id, estado, fecha_emision)`.
- `productos`: `(empresa_id, nombre)`, `(empresa_id, categoria_producto_id, nombre)`.
- `equipos_fabricados`: `(empresa_id, estado_asignacion, asignado)`, `(empresa_id, cliente_id)`, `(empresa_id, estado, fecha_creacion)`.

### gzip HTTP ✓

`server.compression.enabled=true` en `application.yml` y `application.properties`.

### Flyway activado con baseline ✓

- `flyway-core` y `flyway-mysql` agregados al `pom.xml`.
- Configuración: `baseline-on-migrate=true`, `baseline-version=50`, `out-of-order=true`. La primera ejecución registra el baseline; las V1..V50 históricas no se re-aplican (el schema ya existe). A partir de la V51 nueva, Flyway aplica automáticamente.
- `ddl-auto` se mantiene en `update` por ahora — cambiar a `validate` queda como ítem aparte (ver abajo) tras validar Flyway en staging.

---

## Heredado del Nivel 1 (deferred — trigger no aplica hoy)

### Cursor-based pagination en listados (backend)

- **Qué es:** reemplazar `Page<T>` con OFFSET por cursor sobre `(fecha_primer_contacto, id)` o `id`. Respuesta: `{ data, nextCursor, hasMore }`.
- **Por qué es deuda:** OFFSET es O(N) en MySQL — para `OFFSET 90000 LIMIT 100` el motor recorre 90 100 filas y descarta 90 000.
- **Trigger:** `EXPLAIN ANALYZE` muestra OFFSET caro, o **tablas que superen 500 k filas** por tenant. Hoy leads ~17 k → no aplica.
- **Esfuerzo:** ~2 días (cambia firma de respuesta + frontend de cada listado).

### `JpaSpecificationExecutor` para queries dinámicas

- **Qué es:** reemplazar el `@Query` JPQL con muchos `IS NULL OR` por `Specification<Lead>` componible.
- **Trigger:** se necesitan más filtros dinámicos y la query JPQL actual se vuelve insostenible.
- **Esfuerzo:** ~4 horas.

### Switch `ddl-auto` a `validate`

- **Riesgo actual:** `update` permite que Hibernate modifique schema en startup, lo que genera drift entre entornos.
- **Plan:** después de 1-2 sprints con Flyway activo y sin sorpresas, fijar `JPA_DDL_AUTO=validate`. Cualquier cambio de schema pasa entonces obligatoriamente por una migración `V*.sql`.
- **Trigger:** Flyway estable en staging y prod por ≥ 2 sprints.
- **Esfuerzo:** ~2 horas (corregir cualquier mismatch entre entidades y schema real).

---

## Nivel 2 — UX "instantánea" (offline-friendly)

### Caché local en IndexedDB con delta sync

- **Qué es:** Dexie.js o RxDB. Backend expone `GET /api/leads?changedSince=<timestamp>` que devuelve creados/modificados/eliminados (soft delete con `deleted_at`).
- **Trigger:** tiempo de carga percibido sigue lento tras Nivel 1, **o** se necesita modo offline.
- **Esfuerzo:** ~5–8 días.
- **Impacto:** apertura < 100 ms, tolerancia a red intermitente.

### Prefetching de módulos frecuentes

- **Qué es:** tras login, `queryClient.prefetchInfiniteQuery` para leads y clientes. Plus prefetch en hover sobre menú.
- **Trigger:** módulos con tiempo de apertura > 500 ms en p50 según RUM.
- **Esfuerzo:** ~2 horas.

### Streaming NDJSON

- **Trigger:** se necesita pintar > 1000 filas en < 500 ms (improbable con virtualización ya implementada).
- **Esfuerzo:** ~3 días.

---

## Nivel 3 — Optimizaciones puntuales

### Web Workers (Comlink) para procesamiento pesado

- **Trigger:** bloqueos del hilo principal > 50 ms en cálculos client-side (export Excel grande, etc.).
- **Esfuerzo:** ~2 días.

### Búsqueda full-text en MySQL

- **Qué es:** índice `FULLTEXT` sobre `(nombre, telefono, email)` y `MATCH ... AGAINST`. Alternativa: Meilisearch / Typesense.
- **Trigger:** búsqueda > 500 ms en p95 o se piden features de fuzzy/relevancia.
- **Esfuerzo:** ~1 día (FULLTEXT) / ~5 días (Meilisearch).

### Vistas materializadas y particionado

- **Trigger:** `EXPLAIN ANALYZE` muestra agregaciones lentas (> 1 s) o tabla > millones de filas.

### HTTP/2 / HTTP/3 + CDN

- **Trigger:** RTT alto o multiplexing como cuello de botella (improbable con un origen).

### Migración a server-side row model de DataGrid Pro/AG Grid

- **Trigger:** > 500 k filas por tenant.

---

## Cómo agregar un ítem nuevo

Mantener este formato para que sea evaluable contra criterios objetivos:

- **Qué es:** descripción técnica concreta.
- **Por qué es deuda:** qué cuello de botella ataca.
- **Trigger:** condición medible que dispara la implementación.
- **Esfuerzo:** estimación en horas/días.
- **Impacto:** ganancia esperada.
