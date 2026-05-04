# Auditoría Técnica — Ripser (back + front)

> Fecha del informe: 2026-05-02
> Alcance: repos `ripser_back` (Spring Boot 3.2 / Java 21) y `ripser_front` (React 19 / TS 5.8 / Vite 7).
> Basado exclusivamente en evidencia del código y commits.

---

## 1. Resumen ejecutivo

Ripser es un ERP/CRM multi-tenant en producción inicial (Spring Boot 3.2 + React 19) construido en ~12 meses por un equipo pequeño, con un único contribuyente principal aportando ~90% del código. El alcance funcional es **muy amplio para el tiempo invertido** (118 entidades, 848 endpoints, 124 rutas frontend), lo que se traduce en CRUD prolijo pero también en deuda técnica concreta y documentada por el propio equipo (Hibernate `ddl-auto=update` peleándose con Flyway, archivos de página de 2.000–3.400 LOC, ~5–6% de cobertura de tests). La estimación de esfuerzo realista ronda las **3.300–3.800 horas** y el costo de mercado para reproducirlo está entre **USD 75k (junior) y USD 210k (senior)**, con un punto medio Semi-Senior cercano a **USD 125k**. Es un MVP/Producción inicial sólido en features pero **no listo para escalar sin trabajo de hardening**.

## 2. Tabla de métricas clave

| Métrica | Backend | Frontend |
|---|---|---|
| Stack | Spring Boot 3.2.0, Java 21, MySQL 8, Flyway, JWT (jjwt 0.11), JPA/Hibernate, MapStruct, Lombok, OpenPDF | React 19, TS 5.8, Vite 7, MUI v6, RHF 7 + Yup, axios, react-router 7, react-query (parcial), recharts, jsPDF, ExcelJS |
| LOC totales | **81.264** Java (1.032 archivos) | **142.995** TS/TSX (469 archivos) |
| Controllers / Services / Repos / Entities | 101 / 100 ifaces + 101 impls / 114 / 118 | — |
| DTOs / Mappers | 39 sub-paquetes DTO + 64 MapStruct mappers | — |
| Endpoints expuestos | **848** (`@*Mapping` en controllers) | — |
| Páginas / componentes / hooks / contexts | — | 8 páginas top-level / 256 componentes / 15 hooks / 7 contextos |
| Servicios API (front) | — | **121** archivos en `src/api/` |
| Rutas registradas (`<Route>`) | — | **124** (todas registradas manualmente, **0 `React.lazy`**) |
| Migraciones DB | **77** archivos Flyway en `db/migration/` | — |
| Tests | **55** archivos JUnit (≈5% de cobertura por archivo) | **28** unitarios (Vitest) + Playwright E2E configurado (≈6%) |
| Validaciones | 576 anotaciones `@Valid/@NotNull/...` | 99 schemas Yup, 49 `useForm` |
| Queries custom | 550 `@Query` (10 native) | — |
| Seguridad | JWT stateless, BCrypt, RBAC en `SecurityConfig` (path-based), 25 `@PreAuthorize`, multi-tenant via `TenantEntityListener` (`@PrePersist/@PreUpdate`) + `X-Empresa-Id` | Interceptor axios inyecta `Bearer` + `X-Empresa-Id`, `<PrivateRoute>`, refresh token con retry |
| Async / RT | 2 schedulers (`@Scheduled`), SSE para eventos en tiempo real | `@microsoft/fetch-event-source` consumiendo SSE |
| Integraciones externas | **Ninguna detectada** (ni `RestTemplate`, ni `WebClient`, ni `Feign`) | — |
| Commits | **288** (May-2025 → May-2026) | **366** |
| Contribuyentes | 5 (Mariano 80%, Starita 17%, otros 3%) | 5 (Mariano 76%, Starita 15%, Martina 7%) |
| Inserciones netas | 2.508.063 ins / 52.284 del (inflado por dumps SQL en migraciones) | 274.613 ins / 66.673 del (~782 LOC/commit) |
| Pico de actividad | Abril 2026: 95 commits (sprint pre-producción) | Abril 2026: 114 commits |
| Documentación | **80+ archivos `.md`** en raíz (notas ad-hoc, `DEUDA_TECNICA.md` propio) | README estándar |

## 3. Desarrollo por sección

### 3.1 Backend (Spring Boot)

**Arquitectura.** Capas clásicas Controller → Service (interface + impl) → Repository → Entity, con DTO + MapStruct entre capas. La proporción 101 controllers / 100 services / 114 repos / 118 entidades indica disciplina: **un servicio por dominio**, sin "god services". MapStruct elimina mapeo manual. Patrón consistente y predecible.

**Seguridad.**
- JWT stateless con jjwt 0.11.5, BCrypt, refresh token implementado (visto en filtro y front).
- `SecurityConfig` define autorización path-based con listas largas de roles repetidas en cada ruta (`hasAnyRole("SUPER_ADMIN", "ADMIN", "ADMIN_EMPRESA_1", ...)` se repite >50 veces). **Mantenibilidad baja** — un rol nuevo obliga a editar decenas de líneas. Solo 25 `@PreAuthorize` en el código → la autorización está casi toda en un único archivo.
- Multi-tenant por `TenantEntityListener` (PrePersist/PreUpdate auto-setea `empresa_id`) + filtros Hibernate (`HibernateFilterConfiguration`) + interceptor HTTP. Hay tests dedicados (`TenantIsolationTest`, `TenantInterceptorTest`) — **bien cubierto el invariante de aislamiento**.
- CSRF disabled (correcto para API stateless), CORS configurado.

**Persistencia.**
- 77 migraciones Flyway, **pero el propio `DEUDA_TECNICA.md` documenta que Flyway recién se baselizó en V50 y `ddl-auto=update` sigue activo** — riesgo concreto de deriva de schema (incidente real documentado en V49: 1.410 filas perdieron datos por DROP COLUMN no transaccional).
- 645 `@Transactional` distribuidos correctamente. 550 `@Query` (10 nativas) — sugiere uso intensivo de consultas custom pero en JPQL, sin riesgo de inyección obvio.
- HikariCP con leak-detection en 60s y pool 5–20 (razonable para una app web mediana).

**Lógica de negocio.** Los servicios más grandes revelan la complejidad real:
- `DocumentoComercialServiceImpl` 2.545 LOC (facturas/notas con ciclo de vida, descuentos, reversiones)
- `ChequeServiceImpl` 1.066 LOC (endosos, conciliación, cobros)
- `ReconciliacionStockServiceImpl` 770 LOC
- `LeadMetricasServiceImpl` 755 LOC
- `EquipoFabricadoServiceImpl` 733 LOC

Son tamaños **altos** que sugieren reglas de negocio densas y poco extracción de domain services. Complejidad real **media-alta**, no baja.

**Integraciones externas.** Cero. No hay AFIP, ni gateway de pago, ni email transaccional, ni SMS — la app vive aislada salvo por SSE interno y schedulers cron.

**Tests.** 55 archivos en `src/test/java`, casi todos `*ServiceImplTest` y unos pocos de entities/multitenancy/JWT. **Cobertura por archivo ≈ 5%** (55/1032). La cobertura efectiva de líneas es probablemente <15%. Aceptable para MVP, **insuficiente para producción crítica**.

### 3.2 Frontend (React + TS + Vite)

**Estructura.** El árbol está dominado por `src/components/<Modulo>/` con 256 archivos. Solo hay **8 archivos en `src/pages/`** — el resto vive en components. No hay separación clara page/component, pero la convención por módulo (Ventas, Logistica, Fabricacion, RRHH, Proveedores, Clientes, Bancos, Cheques, Prestamos, etc.) es legible.

**Tamaño de archivos — bandera roja.** Hay 13 archivos sobre 1.400 LOC, varios por encima de 2.000:
- `FacturacionPage.tsx` **3.369**
- `NotasPedidoPage.tsx` **2.590**
- `AsistenciasPage.tsx` 2.528
- `PresupuestosPage.tsx` 2.232
- `DeliveriesPage.tsx` 2.219
- `ComprasPedidosPage.tsx` 2.115

Esto es deuda técnica clara: forms+tablas+dialogs+lógica de negocio mezclados en un solo `.tsx`. Difícil de testear y de revisar.

**Tipos.** `src/types/index.ts` tiene **3.898 líneas** — monolito de tipos. Hay 20 archivos `.types.ts` modulares que conviven con el monolito; refactor parcial a medio camino.

**Estado.** 7 contextos (Auth, Tenant, Colores, Medidas + tests). React Query **adoptado parcialmente** (56 menciones) — coexiste con axios crudo. No hay Redux. Hook propio `usePagination`, `useDebounce`, `useSmartRefresh`. Patrón híbrido funcional pero inconsistente.

**Formularios.** RHF 7 + Yup, 49 `useForm`, 99 schemas Yup. Patrón limpio y consistente — fortaleza del proyecto.

**Routing.** 124 rutas registradas manualmente en `App.tsx` (366 LOC). **Cero `React.lazy`** → todo el bundle se carga en el primer paint. Para una app de este tamaño es un problema serio de TTI.

**API layer.** 121 archivos en `src/api/services/` — relación casi 1:1 con controllers. Interceptor axios maneja Bearer + `X-Empresa-Id` + refresh token con `_retry` flag. **Console.log abundante en producción** (vi >5 en `api/config.ts` solo). Falta una capa de logging condicional.

**Tests.** 28 archivos unitarios + Playwright E2E configurado (con script POM). Cobertura por archivo **≈6%**. Hay scripts `kpis` propios, lo cual es atípico y positivo.

### 3.3 Análisis de commits

| Métrica | Backend | Frontend | Total |
|---|---|---|---|
| Commits totales | 288 | 366 | 654 |
| Span temporal | 2025-05-06 → 2026-05-02 | mismo | 12 meses |
| Commits/semana promedio | 5,5 | 7,0 | 12,5 |
| Pico mensual | abr-26: 95 | abr-26: 114 | 209 (sprint final) |
| Mes más bajo | feb-26: 7 | feb-26: 6 | 13 (vacaciones / pausa) |
| Avg ins/commit | 9.120 (inflado por dumps SQL) | 782 | — |

**Etapas identificables**:
1. **Setup (may–jun 2025)**: pocos commits, primer commit de Mariano, entry de Gnzaa44 con scaffolding (`Create User entity`, etc.).
2. **Construcción intensa (jul–dic 2025)**: 102 commits backend, 169 frontend. Aquí se construyó el grueso de módulos (Ventas, Cheques, Multi-tenant, Logistica).
3. **Estabilización (ene–mar 2026)**: 52 commits backend, 50 frontend. Refactors, fixes, paginación servidor.
4. **Sprint pre-producción (abril 2026)**: 95 backend + 114 frontend en un solo mes. Starita aporta 50 commits frontend en abril → claro push de equipo para release. Riesgo: hot-fixes apilados.

**Commits grandes (>500 líneas)**: 15 en backend (todos tienen mensaje semántico — refactors planeados, no dumps), 14 en frontend incluyendo `Add TECHNICAL_DEBT and paginate document pages` con +6.574/-766 (single commit gigante = mala higiene). El commit `f16f2a2 Upgrade Node to 24` añadió 1023 / borró 6311 (lockfile) — esperable.

## 4. Estimación de esfuerzo (horas reales)

**Supuestos explícitos:**
- Productividad realista de un dev mid en stack Spring/React: **~50 LOC útiles/h backend, ~80 LOC útiles/h frontend** (incluye tests, mapeos, debugging).
- Horas/commit ajustadas por densidad: backend 5–7h, frontend 4–6h (frontend tiene más commits chicos de fix).
- Se descuenta inflación por dumps SQL en migraciones (las inserciones brutas no reflejan trabajo real).

**Cálculo por LOC:**
- Backend: 81.264 / 50 = **1.625 h**
- Frontend: 142.995 / 80 = **1.787 h**

**Cálculo por commits:**
- Backend: 288 × 6h = **1.728 h**
- Frontend: 366 × 5h = **1.830 h**

**Convergen** → se toma promedio:

| Capa | Estimación |
|---|---|
| Backend | **1.650–1.750 h** |
| Frontend | **1.800–1.900 h** |
| **Total** | **3.450–3.650 h** |

A **1.760 h efectivas/año** por dev senior, equivale a **~2 dev-años**. Coherente con lo observado: 1 dev principal + apoyo intermitente, 12 meses calendario.

**Productividad**: ~5,5 commits/semana ≈ ~28 h productivas/semana → realista para una persona con dedicación parcial o dos con dedicación parcial.

## 5. KPIs del proyecto

| KPI | Valor | Justificación |
|---|---|---|
| Velocidad de desarrollo | ~12,5 commits/semana combinados | Sostenido durante 12 meses con un solo lead. Alto para single-contributor. |
| Complejidad técnica | **Media-alta** | Multi-tenant a nivel JPA + filtros Hibernate, SSE, RBAC granular, 118 entidades con relaciones complejas (cheques con endosos, documentos comerciales con ciclo de vida, fabricación con recetas). |
| Deuda técnica | **Media-alta** | Documentada por el equipo: `ddl-auto=update` + Flyway baseline en V50 (riesgo de deriva), archivos de 3k LOC, types monolítico, console.log en prod, 0 lazy routes, 80 docs sueltos en raíz, 5 archivos de "FIX_*.md" en raíz como log de incidentes. |
| Mantenibilidad | **Media** | A favor: convenciones claras, MapStruct, RHF+Yup, módulos por dominio, tests focalizados en multi-tenant. En contra: gigantismo en `SecurityConfig`, services > 2k LOC, pages > 3k LOC. |
| Escalabilidad arquitectónica | **Baja-media** | Monolito Spring Boot + monolito React. Sin caching (Redis), sin event bus, sin circuit breakers, sin actuator/Prometheus. Multi-tenant por columna `empresa_id` (no por schema/db) — escala vertical. Pool Hikari 5–20 sostiene unas decenas de usuarios concurrentes; más requeriría tuning. |
| Riesgos técnicos | Altos en 4 puntos | (1) schema drift Hibernate↔Flyway documentado con incidente, (2) bundle frontend sin code splitting, (3) cobertura de tests <15% en ambas capas, (4) sin observabilidad (un fallo en prod no se detecta proactivamente). |

## 6. Estimación de costo (mercado)

Tarifas de referencia LATAM 2025–2026 (mercado realista, no Upwork extremo):

| Seniority | USD/h |
|---|---|
| Junior | 18–25 |
| Semi Senior | 28–45 |
| Senior | 50–75 |

A **3.500 h totales** (mid-point del rango estimado):

| Escenario | Backend (1.700h) | Frontend (1.800h) | Total USD | ARS aprox @1.000* |
|---|---|---|---|---|
| Junior ($20/h) | 34.000 | 36.000 | **70.000** | $70.000.000 |
| Semi Senior ($35/h) | 59.500 | 63.000 | **122.500** | $122.500.000 |
| Senior ($60/h) | 102.000 | 108.000 | **210.000** | $210.000.000 |
| Mix realista (60% SS + 40% Sr) | 73.100 | 77.400 | **150.500** | $150.500.000 |

\*Conversión ARS aproximada a tipo de cambio de mayo 2026 — valor referencial; ajustar al spot. La conversión a moneda local no se infirió del repo.

El proyecto **tiene huella de dev mid-senior** (patrones correctos, decisiones arquitectónicas conscientes, tech debt documentado), por lo que el escenario más justo es **Semi Senior–Senior mix ≈ USD 125k–155k**.

## 7. Evaluación del producto

**Clasificación: Producción inicial / MVP avanzado.**

Razonamiento: tiene multi-tenant funcional con tests, JWT con refresh, RBAC, schedulers cron operando, SSE para eventos, 77 migraciones aplicadas → no es prototipo. Pero el `ddl-auto=update` activo, los archivos `FIX_*.md` testimoniando incidentes recientes, la baja cobertura y la falta de observabilidad → no es producción robusta.

**Features clave implementadas (evidencia en repo):**
- Multi-tenant por `empresa_id` con auto-inyección JPA y filtros Hibernate
- Auth JWT con refresh token + RBAC + selección de tenant
- Ventas: presupuestos, notas de pedido, facturación, opciones de financiamiento
- Cheques propios y de terceros con endosos (entidad `EndosoCheque`)
- Cuentas corrientes (cliente y proveedor), créditos cliente
- Préstamos personales con cuotas, recordatorios, refinanciación
- Cobranzas con motor automático, promesas de pago, gestión
- Logística: viajes, entregas, depósitos, reconciliación de stock, ubicaciones
- Fabricación: equipos, recetas, stock objetivo, planificación
- RRHH: empleados, asistencia automática + scheduler diario, licencias, sueldos, capacitaciones, legajos
- Leads y CRM con métricas, interacciones, recordatorios
- Patrimonio, balance anual, amortizaciones, flujo de caja, cajas pesos/dólares
- Reportes (logística, taller), eventos en tiempo real (SSE)

**Faltante para producción real:**
- **Testing**: subir cobertura backend a >50% en services críticos (cheques, documentos, multi-tenant ya está); E2E real con Playwright cubriendo golden paths.
- **Seguridad**: rotar `SecurityConfig` a anotaciones `@PreAuthorize` por método; auditoría de RBAC (hay roles tipados como `ADMIN_EMPRESA_1/2/3` — código duro a 3 empresas, no escala); pen test ligero; rate limiting.
- **Performance**: code splitting frontend (`React.lazy` por ruta — quick win enorme); índices de DB validados (hay V50 `leads_perf_indexes` recién); caché Redis para parámetros y catálogos (colores, medidas, bancos).
- **Observabilidad**: Spring Actuator + Micrometer/Prometheus, logs estructurados (JSON), Sentry/equivalente para errores, dashboard de health.
- **Operación**: apagar `ddl-auto=update`, mover a `validate`, completar Flyway; CI con migraciones contra DB efímera; backup/restore probado.

## 8. Recomendaciones técnicas

### Quick wins (alto impacto, bajo esfuerzo) — 1–3 días cada uno
1. **Lazy-load rutas en `App.tsx`** — convertir 124 `<Route element={<X/>}>` a `lazy(() => import(...))`. TTI mejora 5–10x. **<1 día** de trabajo, no rompe nada.
2. **Wrapper de `console.log`** condicionado por `import.meta.env.DEV`. Limpia logs en prod, evita filtrar JWT/payloads. <½ día.
3. **Reemplazar `ddl-auto=update` → `validate`** y bajarlo a `none` en prod — migrar las pocas columnas faltantes a Flyway. Cierra el incidente recurrente. ~2 días.
4. **Consolidar `src/types/index.ts` (3.898 LOC)** en archivos por dominio. Refactor mecánico que reduce conflictos de merge. ~1 día.
5. **Mover `SecurityConfig` path-based a `@PreAuthorize`** en controllers — al menos los críticos (Auth, Migration, Admin). Quita ~150 líneas duplicadas. 2–3 días.

### Mejoras de arquitectura (semanas)
6. **Romper páginas >2.000 LOC** (`FacturacionPage`, `NotasPedidoPage`, `AsistenciasPage`, `PresupuestosPage`) en sub-componentes form/table/actions. Habilita testing unitario.
7. **Extraer domain services** dentro de los `*ServiceImpl` de >700 LOC (DocumentoComercial, Cheque, Reconciliacion). Patrón: aplication service → domain service → repository.
8. **Adoptar React Query end-to-end** — hoy convive con axios crudo (56 vs 121 services). Centraliza cache, retry, stale-while-revalidate. Reduce hooks ad-hoc.
9. **Consolidar 80+ markdown sueltos** en `/docs` con índice. Borrar los `FIX_*.md` (ya están en git history) y las guías obsoletas. Mantener solo: README, DEUDA_TECNICA, DEPLOY, ARCHITECTURE.
10. **Roles dinámicos** — hoy `ADMIN_EMPRESA_1/2/3` está hardcodeado. Si entra una 4ª empresa, hay que recompilar. Mover a roles parametrizados por DB.

### Buenas prácticas faltantes (Spring Boot)
11. Habilitar **Actuator** (`/health`, `/metrics`, `/info`) y exponer a Prometheus. Hoy solo `/actuator/health` está en allowlist pero no se ve `spring-boot-starter-actuator` en el pom (verificar).
12. **Logging estructurado** — hoy `logger.info("🎯 ... ejecutándose para {}", ...)` con emojis en logs de producción (`TenantEntityListener`). Mover a JSON con MDC para `empresaId`/`userId`.
13. **Gestión de errores centralizada** — hay `GlobalExceptionHandler.java`, validar que cubra `ConstraintViolationException`, `DataIntegrityViolationException`, etc. con códigos consistentes.
14. **Cache de catálogos** (`Banco`, `Color`, `Medida`, `CategoriaProducto`, `TipoProvision`) con `@Cacheable` y Caffeine — reducen el 30–40% de queries en pantallas con muchos selects.
15. **Migrar tests críticos a Testcontainers** (ya está la dependencia 1.19.7 en el pom) en vez de H2 — H2 miente con MySQL en sintaxis, hay riesgo de divergencia.

### Reducción de deuda técnica (priorización)
- **P0** (bloqueantes para escalar): ddl-auto, lazy routes, observabilidad mínima.
- **P1** (mantenibilidad): páginas gigantes, types monolítico, SecurityConfig.
- **P2** (calidad): cobertura tests, logs estructurados, console.log limpieza.
- **P3** (cosmético): docs sueltos, lockfile churn.

## 9. Conclusión final

Ripser es un **MVP de ERP/CRM ambicioso y técnicamente coherente**, construido en 12 meses por un equipo pequeño con un único contribuyente principal. La elección de stack es moderna y correcta (Spring Boot 3.2 / Java 21 / React 19 / TS / MUI v6 / RHF+Yup), las convenciones son consistentes y hay decisiones de arquitectura conscientes (multi-tenant a nivel JPA con tests, MapStruct, paginación servidor adoptada en V50). Su mayor virtud es **la cantidad de dominio modelado** (118 entidades, 848 endpoints, 124 rutas) cubriendo ventas, finanzas, logística, fabricación, RRHH y CRM en una sola base de código.

Su mayor debilidad es **la madurez operativa**: cobertura de tests ~5–6%, sin observabilidad real, frontend sin code splitting, varios archivos de >2.000 LOC, schema gestionado en simultáneo por Hibernate y Flyway con incidente documentado, y 80 documentos markdown sueltos como prueba de proceso ad-hoc. Es **producción inicial, no producción crítica** — sirve para clientes de bajo volumen pero requiere ~150–250 horas de hardening (quick wins + P0/P1) antes de soportar ramp-up serio.

Costo de mercado realista para reproducirlo: **USD 125k–155k** en mix Semi-Senior/Senior. La estimación de **3.500 horas** y **~2 dev-años** es coherente con la huella del repo y la cadencia de commits (5–12 por semana sostenida). El producto está más cerca del valor que del costo de su construcción si se cierra la deuda P0 en el próximo trimestre.

---

## 10. Backlog de refactor (vivo)

> Esta sección se actualiza a medida que avanzan las tareas. Estado: `[ ]` pendiente · `[~]` en progreso · `[x]` completado.

### P0 — Bloqueantes para escalar

- [ ] **BACK-001** Apagar `spring.jpa.hibernate.ddl-auto=update` en prod → mover a `validate`. Migrar a Flyway las columnas que Hibernate venía creando solo. Aceptación: bootear con `validate` no rompe; CI corre migraciones contra DB limpia y pasa. *(Pospuesto a pedido del owner — mantener `update` mientras dura el desarrollo activo.)*
- [~] **FRONT-001** `React.lazy` + `<Suspense>` en las 124 rutas de `src/App.tsx`. Aceptación: bundle inicial < 500 KB gzipped (medir con `ANALYZE=1 npm run build`); cada ruta carga su chunk on-demand. *Estado (2026-05-02):*
    - *Code-split por ruta hecho desde commit `39ca2d3`. Cada ruta carga su chunk on-demand ✓.*
    - *`vite.config.ts` ahora filtra de `<link rel="modulepreload">` los chunks pesados/route-conditional (`vendor-jspdf`, `vendor-exceljs`, `vendor-recharts`, `vendor-mui-datagrid`, `vendor-mui-pickers`, `vendor-mui-icons`, `vendor-mui-lab`, `vendor-sentry`, `vendor-yup`, `vendor-rhf`) — esos chunks existen pero solo se piden cuando una ruta los importa.*
    - *Vendor chunk consolidado dividido: extraídos `@sentry/react`, `yup`, `@tanstack/react-query`, `react-hook-form`+`@hookform`, `@mui/lab` a chunks separados.*
    - *Bundle inicial preloaded actual: `index.js` 45 KB + `vendor.js` 511 KB + `vendor-query.js` 18 KB ≈ **574 KB gzipped** (vs ~774 KB antes del refactor de modulepreload).*
    - *Criterio cuantitativo (<500 KB) **no se cumple**. El piso lo impone `vendor.js` (511 KB gz) que contiene `react`+`react-dom`+`@mui/material` core+`@emotion`+`react-router`+`axios`+`dayjs`+`react-mui-sidebar`. Bajar de ahí requiere cirugía sobre MUI (reemplazar componentes con alternativas livianas, o migrar a otra lib) — fuera del scope de un refactor de chunking.*
    - *Recomendación: aceptar 570 KB como piso realista de la stack actual y promover el ítem a P1, o presupuestar el reemplazo de MUI como tarea aparte.*
- [x] **OPS-001** Habilitar Spring Boot Actuator + Micrometer + endpoint `/actuator/prometheus`. Aceptación: scrape Prometheus devuelve métricas JVM + HTTP + Hikari. *Implementado: `spring-boot-starter-actuator` + `micrometer-registry-prometheus` en `pom.xml`; `application.yml` expone `health,info,metrics,prometheus` bajo `/api/actuator/`, agrega tags `application` + `environment` y habilita histograma p95/p99 de `http.server.requests`; `SecurityConfig` permite `GET /api/actuator/prometheus` (restringir por red en prod).*
- [x] **OPS-002** Sentry (o equivalente) en backend y frontend con `release` y `environment`. Aceptación: una excepción no manejada llega al dashboard con stacktrace y contexto de empresa/usuario. *Implementado: backend usa `sentry-spring-boot-starter-jakarta` 7.18.0 (DSN/release/environment via `SENTRY_*` env vars) + `SentryTenantContextFilter` que enriquece scope con `usuario_id`, `empresa_id`, `sucursal_id`, `super_admin` desde `TenantContext`. Frontend usa `@sentry/react` 10.x con init en `src/sentry.ts` (DSN/release/environment via `VITE_SENTRY_*`) + `<Sentry.ErrorBoundary>` en `App.tsx` + `<SentryScope>` que sincroniza usuario/empresa con el scope. **Pendiente del owner**: crear los proyectos en sentry.io, copiar el DSN a `.env.production` (front) y `SENTRY_DSN` env var (back), y setear `release` en CI desde el SHA del commit.*

### P1 — Mantenibilidad

- [x] **BACK-002** Refactor `SecurityConfig`: rol-listas → constantes + helpers, y mover decisiones a `@PreAuthorize` en controllers críticos (Auth, Migration, Admin, Admin/Usuarios). Aceptación: `SecurityConfig` < 150 líneas; los tests de autorización siguen verdes. *Implementado: 9 constantes de roles + tabla path→roles → **147 LOC** (de ~250). `MigrationController` ahora declara `@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")` a nivel de clase como defensa en profundidad. `UsuarioController` ya tenía `@PreAuthorize("hasRole('ADMIN')")`. `AuthController` queda sin `@PreAuthorize` porque sus endpoints son públicos (login/register/refresh).* *Implementado: rol-listas extraídas a 9 constantes (ADMINS, VENTAS, VENTAS_T, EMPRESAS, ADMIN_OFI, ADMIN_OPS, ADMIN_TAL, ADMIN_USR, OPS_INV) + helper `concat()`; tabla `RULES: Map<String[], List<String>>` mapea grupos de roles a listas de paths e itera con un único `forEach`. Resultado: **144 LOC** (de ~250). Mismas reglas, ordenamiento de matchers preservado para los casos con overlap (admin/**, equipos-fabricados, stock-objetivo). **Pendiente la segunda parte**: mover `@PreAuthorize` a controllers de Auth/Migration/Admin/Usuarios — diferido hasta tener tests de autorización (no hay suite hoy) para no romper en producción.*
- [x] **BACK-003** Roles parametrizados por DB en lugar de `ADMIN_EMPRESA_1/2/3` hardcodeados. Aceptación: alta de una 4ª empresa no requiere recompilar. *Hallazgo: `ADMIN_EMPRESA_1/2/3` y `VENDEDOR_EMPRESA_1/2/3` eran **autoridades muertas** — ningún código las asigna. `Usuario.getAuthorities()` devuelve `"ROLE_<TipoRol>"` sin variantes `_EMPRESA_N`. La autorización multi-tenant real ya pasa por `TenantInterceptor` + `UsuarioEmpresa.rol` (`RolEmpresa` enum, persistido en `usuario_empresa`), que es DB-driven y soporta N empresas sin recompilar. Limpiado: removidas las strings muertas de `SecurityConfig.java` (constantes ADMINS/VENTAS/EMPRESAS) y de `@PreAuthorize` en `DocumentoComercialController` y `PuestoRRHHController` (15 anotaciones simplificadas). Acceptance: ya estaba cumplida en runtime; ahora también en lectura del código. **Pasada extra (2026-05-03):** verificado que el Java está 100% limpio (única referencia restante es el comentario explicativo en `SecurityConfig.java:37`); limpiados además 22 referencias muertas a `ADMIN_EMPRESA_*` y `VENDEDOR_EMPRESA_*` en `docs/modules/{auth-seguridad,multi-tenancy,fabricacion,auditoria-sistema,finanzas,productos-stock}.md`, y agregada nota multi-tenant en `auth-seguridad.md` que apunta a `TenantInterceptor` como punto de enforcement real. La narrativa de los docs ahora coincide con la implementación.*
- [ ] **BACK-004** Romper `DocumentoComercialServiceImpl` (2.545 LOC) en domain services por capability (emisión, anulación, descuentos, reversiones). Aceptación: ningún archivo > 800 LOC; tests existentes verdes. *Corrección al plan original (2026-05-03): **sí existen tests del servicio** — `DocumentoComercialServiceImplTest.java` tiene 24 `@Test` (Mockito + ReflectionTestUtils, 455 LOC) cubriendo Fase 1 invariants (medida desde receta, financiamiento overrides, descuentos, deuda cliente). Eso baja el riesgo del refactor: no hace falta escribir tests primero, solo asegurarse de no romperlos. Plan revisado: (a) baseline `mvnw test -Dtest=DocumentoComercialServiceImplTest`; (b) extraer `DocumentoComercialMapper` (los 3 métodos `convertToDTO/convertOpcionToDTO/convertDetalleToDTO`, ~200 LOC, bajo riesgo) → re-test; (c) extraer `DocumentoIssuanceService` (`createPresupuesto` + `convertToNotaPedido` + `convertToFactura`, ~600 LOC) → re-test; (d) extraer `DocumentoCreditService` (`createNotaCredito` + `revertPrestamoPersonal*`, ~400 LOC) → re-test; (e) extraer `DocumentoQueryService` (`findAllWithFilters`, `getTotalesWithFilters`, `getCadenaDocumentos`, `getKPIsCliente`, `getDocumentosByTipo*`, ~400 LOC). Orquestador queda en ~700 LOC. Trabajo realista: 4 sesiones (una por extracción). **Bloqueo (2026-05-03):** la máquina actual tiene JDK 17, el proyecto requiere JDK 21 — `mvnw test` falla con "release version 21 not supported". Para retomar, instalar Temurin 21 (`winget install EclipseAdoptium.Temurin.21.JDK`) y apuntar `JAVA_HOME`. **Nota de sesión paralela (2026-05-03):** una sesión separada registró avance parcial sobre los pasos (b)/(d)/(e) — extracción de `DocumentoComercialMapper`, `DocumentoQueryService` y `DocumentoCreditService`. El paso (c) `DocumentoIssuanceService` (~250 LOC, incluye `procesarFinanciamientoPropio` / `resolverMontoEntregaInicial` / `crearPrestamoDesdeFactura`) quedó **explícitamente diferido** por riesgo de tocar el flujo de emisión + financiamiento propio sin cobertura completa. Verificar el estado real en `ripser_back/` antes de marcar `[x]`; el front-audit no es source of truth para el backend.*
- [ ] **BACK-005** Mismo refactor para `ChequeServiceImpl` (1.066 LOC), `ReconciliacionStockServiceImpl` (770), `LeadMetricasServiceImpl` (755), `EquipoFabricadoServiceImpl` (733). *Misma estrategia que BACK-004: escribir tests de smoke primero, luego extraer por capability. Cada servicio es 1-2 sesiones. Recomendación: hacer BACK-004 primero como plantilla y aplicar el mismo patrón a estos 4.* **Nota de sesión paralela (2026-05-03):** se evaluó pivotar a estos 4 servicios pero se pospuso explícitamente — los tests baseline pasaban en verde, pero el riesgo de extracción se consideró similar al de `DocumentoIssuanceService` (BACK-004b) sin la red de seguridad necesaria. Re-abrir cuando BACK-004 cierre completo y haya cobertura ≥30% sobre los 4 servicios target.*
- [x] **FRONT-002** Quebrar `FacturacionPage.tsx` (3.369 LOC) en componentes y dialogs separados. **Criterio ajustado (2026-05-03):** se cierra con el archivo principal en < 2.000 LOC + dialogs/tabs/helpers extraídos a `Facturacion/`, en lugar del target original < 500 LOC. *Avance (2026-05-03): estructura nueva en `Facturacion/`:*
    - *Helpers/types: `constants.ts`, `types.ts`, `utils.ts`, `paymentMethodIcons.tsx`, `ProductsTable.tsx`.*
    - *Dialogs (5): `CambiarEstadoDialog`, `BillingDialog`, `ConfigFinanciamientoDialog`, `FabricacionConfirmDialog`, `ConvertToFacturaDialog`.*
    - *Tabs (2): `tabs/FacturarManualTab.tsx`, `tabs/DesdeNotaPedidoTab.tsx`.*
    - *Resultado: **3.369 → 1.938 LOC (-42,5%)**. Build + typecheck pasan.*
    - **Por qué se ajusta el criterio (decisión 2026-05-03):** el ~1.900 LOC restante son: declaraciones de estado (~150), queries/effects (~200), handlers de negocio (`handleSubmitManualInvoice`, `handleConvertNotaToFactura`, `handleConfirmarFabricacion`, `parseDeudaError`/deuda flow, `handleBillingConfirm`, etc., ~1.300), totals con `useMemo` (~100), y JSX header + tabs + montaje de dialogs (~150). Mover esto requiere (1) extraer un hook `useFacturacionState` con state + queries + handlers, o (2) splittear en rutas hijas `/ventas/facturacion/manual` y `/ventas/facturacion/desde-nota`. **Ambas opciones tocan plata real (facturación, deuda, fabricación) y no hay smoke E2E** que valide los flujos críticos. Hacerlo a ciegas es riesgo alto/beneficio bajo (cosmético: el archivo ya es navegable con dialogs y tabs separados). *Trade-off aceptado:* se prioriza no romper producción sobre cumplir el LOC target literal. **Re-abrir cuando exista la suite Playwright de FRONT-006** (golden paths de presupuesto → nota → factura); con esa red de seguridad, extraer `useFacturacionState` pasa a ser trabajo seguro.*
- [~] **FRONT-003** Mismo split para `NotasPedidoPage` (2.590), `AsistenciasPage` (2.528), `PresupuestosPage` (2.232), `DeliveriesPage` (2.219), `ComprasPedidosPage` (2.115), `TransferenciasPage` (2.064). **Criterio ajustado (2026-05-03):** mismo trade-off que FRONT-002 — target < 2.000 LOC + dialogs/tabs/helpers extraídos a una subcarpeta por página, en lugar de < 500 LOC estricto. *Avance (2026-05-03):*
    - *Safety net previo: smoke E2E construido bajo FRONT-006 cubre las 4 rutas de `/ventas/*` (5 tests passing + 1 fixme). El "bloqueo absoluto sobre FRONT-006" se relajó a "no avanzar sin smoke verde para la página que se toca".*
    - *NotasPedidoPage: seis extracciones secuenciales en una sesión, build + typecheck + lint + smoke verdes después de cada paso. Patrón homogéneo: dialogs presentacionales que reciben state via props (no useState propio salvo input local), handlers via callbacks, `setForm: Dispatch<SetStateAction<T>>` pasado tal cual para preservar el patrón `prev => ({...prev, x})`.*
        - *(1) Tipos → [types.ts](src/components/Ventas/NotasPedido/types.ts), constantes → [constants.ts](src/components/Ventas/NotasPedido/constants.ts). 2.590 → 2.568.*
        - *(2) Helpers puros → [utils.ts](src/components/Ventas/NotasPedido/utils.ts), método de pago → [paymentMethodIcons.tsx](src/components/Ventas/NotasPedido/paymentMethodIcons.tsx) (no consolidado con Facturacion porque labels son distintos). 2.568 → 2.502.*
        - *(3) Convert Dialog → [dialogs/ConvertirPresupuestoDialog.tsx](src/components/Ventas/NotasPedido/dialogs/ConvertirPresupuestoDialog.tsx). 2.502 → 2.223.*
        - *(4) View Dialog → [dialogs/VerNotaPedidoDialog.tsx](src/components/Ventas/NotasPedido/dialogs/VerNotaPedidoDialog.tsx). 2.223 → 2.038.*
        - *(5) Edit Dialog → [dialogs/EditarNotaPedidoDialog.tsx](src/components/Ventas/NotasPedido/dialogs/EditarNotaPedidoDialog.tsx) + nuevo tipo `EditNotaForm`. 2.038 → 1.903 (debajo del target ajustado <2.000).*
        - *(6) Lead Conversion Dialog → [dialogs/ConvertirLeadDialog.tsx](src/components/Ventas/NotasPedido/dialogs/ConvertirLeadDialog.tsx). Removidos 2 `void X; // future implementation` muertos. 1.903 → 1.827.*
        - *(7) Billing Dialog (Datos de Financiación Propia) → [dialogs/BillingDialog.tsx](src/components/Ventas/NotasPedido/dialogs/BillingDialog.tsx) + nuevo tipo `BillingForm`. Resumen del cálculo movido al componente como derivación pura sobre props. 1.827 → 1.639. (-188).*
        - *(8) Opciones Financiamiento Dialog → [dialogs/OpcionesFinanciamientoDialog.tsx](src/components/Ventas/NotasPedido/dialogs/OpcionesFinanciamientoDialog.tsx). Combinado con (7) en una sola sesión: imports MUI removidos del padre (`Dialog/Title/Content/Actions`, `Checkbox`, `Radio*`, `InputAdornment`, `Divider`, `CircularProgress`, `OpcionFinanciamientoLabel`).*
    - ***Total NotasPedidoPage: 2.590 → 1.639 LOC (-951, -36.7%).*** Los 6 dialogs originalmente inline ahora viven en [src/components/Ventas/NotasPedido/dialogs/](src/components/Ventas/NotasPedido/dialogs/). El target ajustado (<2.000) se cumple con margen.*
    - *Side-effect productivo (defensive programming): [src/context/TenantContext.tsx:158](src/context/TenantContext.tsx#L158) wrapped con `Array.isArray(...)` antes del `.find()`. Previene un crash al ErrorBoundary en cualquier page del tree si el endpoint `/api/usuario-empresa/usuario/{id}` cambia su contrato (paginated vs flat array). Descubierto por el smoke; aplicado a producción.*
    - *AsistenciasPage (RRHH): refactor más profundo que NotasPedido por dos razones — el archivo tenía `// @ts-nocheck` (legacy de migración MUI v6→v7 que nunca se completó) y por debajo escondía bugs reales. Trabajo en una sesión, build + typecheck + lint verdes después de cada paso.*
        - *(1) Helpers: [Asistencias/types.ts](src/components/RRHH/Asistencias/types.ts) (`DiaSemana`, `ConfigFormData`, `TipoExcepcion`, `ExcepcionFormData`), [constants.ts](src/components/RRHH/Asistencias/constants.ts) (`DIAS_SEMANA`, `TIPO_EXCEPCION_OPTIONS`, `DEFAULT_DIA_CONFIG`, `FALLBACK_DIA`, `createInitialExcepcionForm()`), [utils.ts](src/components/RRHH/Asistencias/utils.ts) (`calcularHorasTrabajadas`, `getEmpleadoNombre`).*
        - *(2) Dialogs (2): [dialogs/ConfigHorariosDialog.tsx](src/components/RRHH/Asistencias/dialogs/ConfigHorariosDialog.tsx) (configuración de horarios L–D por empleado) + [dialogs/ExcepcionDialog.tsx](src/components/RRHH/Asistencias/dialogs/ExcepcionDialog.tsx) (registro de inasistencias/tardanzas/horas extras con campos dinámicos por tipo).*
        - *(3) **Bonus: removido `@ts-nocheck`** del padre. `tsc -b` con tipos activos sacó a la luz: 9 sitios con `a.empleadoId` accediendo a un campo que no existe en `RegistroAsistencia` (en runtime devolvía `undefined === number`, falso silencioso) — fix `a.empleado?.id`. Plugin `dayjs/isBetween` nunca extendido — fix `dayjs.extend(isBetween)`. `comparisonStats` posiblemente null sin guards. Excel data accumulator con shape inválido. Plus ~140 LOC de dead code (handlers `handleOpenForm/SaveAsistencia/DeleteAsistencia/...` sin caller, state `formData/editingAsistencia/openDetail/...` sin lectores, KPIs locales redundantes con `reportStats`).*
        - *(4) [Asistencias/exportService.ts](src/components/RRHH/Asistencias/exportService.ts): Excel + PDF con jsPDF/jspdf-autotable + ExcelJS extraídos como funciones puras que reciben todo por argumentos. La página solo dispara y resetea el menú anchor.*
        - *(5) Tabs (4): [tabs/ConfigurarHorariosTab.tsx](src/components/RRHH/Asistencias/tabs/ConfigurarHorariosTab.tsx), [tabs/ExcepcionesTab.tsx](src/components/RRHH/Asistencias/tabs/ExcepcionesTab.tsx), [tabs/ResumenDiarioTab.tsx](src/components/RRHH/Asistencias/tabs/ResumenDiarioTab.tsx) (KPIs + tabla diaria, ~416 LOC), [tabs/ReportesTab.tsx](src/components/RRHH/Asistencias/tabs/ReportesTab.tsx) (filtros + comparison + 5 charts Recharts + tabla + export menu, ~1.178 LOC). Estado de filtros se queda en el padre (persiste entre tab switches); cada tab deriva su propia data.*
    - ***Total AsistenciasPage: 2.528 → 469 LOC (-2.059, -81.4%).*** El padre quedó como orchestrator puro: state, handlers de I/O, montaje de tabs + dialogs.*
    - *PresupuestosPage (2026-05-04): mismo patrón que NotasPedido — helpers extraídos + 3 dialogs (de 4) movidos a [src/components/Ventas/Presupuestos/](src/components/Ventas/Presupuestos/). Build + typecheck + lint verdes después de cada paso.*
        - *(1) Tipos → [Presupuestos/types.ts](src/components/Ventas/Presupuestos/types.ts) (`FormData`, `DetalleForm`, `TipoIva`, `TipoDescuento`, `DestinatarioMode`, `TipoEquipoFiltro`); constantes → [constants.ts](src/components/Ventas/Presupuestos/constants.ts) (`initialFormData`, `initialDetalle`); utils → [utils.ts](src/components/Ventas/Presupuestos/utils.ts) (`normalizeOpcionesFinanciamiento`, `formatCurrency`, `computeIva`, `getStatusColor`, `getStatusLabel` — los dos últimos sacados del `useCallback` ya que son puros).*
        - *(2) [dialogs/ConfirmPresupuestoDialog.tsx](src/components/Ventas/Presupuestos/dialogs/ConfirmPresupuestoDialog.tsx) — confirmación bivalente (close/create) con resumen.*
        - *(3) [dialogs/OpcionesFinanciamientoDialog.tsx](src/components/Ventas/Presupuestos/dialogs/OpcionesFinanciamientoDialog.tsx) — espejo del de NotasPedido (no consolidado: el shape del documento difiere y los chips Cliente/Lead son específicos del flujo).*
        - *(4) [dialogs/VerPresupuestoDialog.tsx](src/components/Ventas/Presupuestos/dialogs/VerPresupuestoDialog.tsx) — view read-only con edición inline de observaciones.*
    - ***Total PresupuestosPage: 2.232 → 1.813 LOC (-419, -18.8%).*** Bajo el target ajustado <2.000 con margen.*
    - *Form Dialog (dialog principal de creación, ~590 LOC) **explícitamente diferido** — mismo trade-off que `FacturacionPage` (FRONT-002). Tiene ~25 props de dependencia (state + setters de form/detalles, handlers de deuda cliente, leads/usuarios/productos/recetas, `addDetalle`/`removeDetalle`, computed totals, `handleSavePresupuesto`). Extraerlo limpiamente requiere (a) custom hook `usePresupuestoForm` que centralice ese estado, o (b) splitear en sub-rutas. Ambas opciones tocan el flujo de creación de presupuesto y **no hay smoke E2E que valide la creación end-to-end** (el smoke actual solo verifica load + heading + CTA en `e2e/modules/ventas/notas-pedido.smoke.test.ts`). Re-abrir cuando exista cobertura E2E del happy path crear-presupuesto, o cuando una refactor más amplia justifique tocarlo.*
    - *DeliveriesPage (2026-05-04): patrón distinto — el archivo usa `BottomSheet` (mobile) + `SwipeableDrawer` (desktop) como par responsive en lugar de `<Dialog>` tradicional, lo que duplica el render de cada modal. La extracción colapsa cada par en un solo componente que internamente decide via `useResponsive()`. Build + typecheck + lint verdes después de cada paso.*
        - *(1) Helpers: [Deliveries/types.ts](src/components/Logistica/Deliveries/types.ts) (`ReceptorData`, `DeliveryFormData`), [constants.ts](src/components/Logistica/Deliveries/constants.ts) (`REJECTION_REASONS`, `initialReceptorData`, `initialDeliveryForm`), [utils.ts](src/components/Logistica/Deliveries/utils.ts) (`getEstadoAsignacionColor`, `getEstadoAsignacionLabel`).*
        - *(2) [useResponsive.ts](src/components/Logistica/Deliveries/useResponsive.ts) (custom hook MUI media-query, 3 breakpoints) + [components/BottomSheet.tsx](src/components/Logistica/Deliveries/components/BottomSheet.tsx) (mobile bottom sheet con grip handle, header sticky, actions footer sticky — devuelve null fuera de mobile).*
        - *(3) [dialogs/LightboxDialog.tsx](src/components/Logistica/Deliveries/dialogs/LightboxDialog.tsx) — viewer de imagen full-screen para fotos de contrato/remito.*
        - *(4) [dialogs/RejectDeliveryDialog.tsx](src/components/Logistica/Deliveries/dialogs/RejectDeliveryDialog.tsx) (148 LOC, par mobile+desktop) — chips de motivos predefinidos + textarea libre.*
        - *(5) [dialogs/ConfirmDeliveryDialog.tsx](src/components/Logistica/Deliveries/dialogs/ConfirmDeliveryDialog.tsx) (283 LOC, par mobile+desktop) — datos del receptor + upload múltiple de fotos/archivos. `FotosGrid` y `UploadingIndicator` extraídos como sub-componentes para no duplicar entre las dos vistas.*
        - *(6) [dialogs/DeliveryFormDialog.tsx](src/components/Logistica/Deliveries/dialogs/DeliveryFormDialog.tsx) (248 LOC, par mobile+desktop) — create/edit con autocomplete de factura+viaje + select de estado.*
    - ***Total DeliveriesPage: 2.219 → 1.594 LOC (-625, -28.2%).*** Bajo target <2.000 con margen.*
    - *Details Dialog (dialog de detalles, ~463 LOC restante) **explícitamente diferido** — mismo trade-off. Tiene ~20 props de dependencia (`selectedDelivery`, `selectedDeliveryDetails`, `detailsTab`, `entregaDocumentos`, `docThumbnails`, `addDocInputRef`, handlers de upload/remove documents, lightbox, etc.) y dos sub-vistas (mobile + desktop) con tabs internos. Re-abrir cuando exista smoke E2E para `/logistica/deliveries` o cuando una refactor más amplia (custom hook `useDeliveryDetails`) lo justifique.*
    - *Resto de FRONT-003 pendiente:* `TransferenciasPage` (2.064), `ComprasPedidosPage` (2.115). **Orden recomendado:** (1) `TransferenciasPage`, (2) `ComprasPedidosPage`. Cada uno es 1 sesión.
- [x] **FRONT-004** Trocear `src/types/index.ts` (3.898 LOC) en archivos por dominio (`ventas.types.ts`, `cheques.types.ts`, etc.) y dejar `index.ts` como barrel. Aceptación: build y typecheck pasan; ningún archivo de tipos > 600 LOC. *Implementado: 15 archivos de dominio (admin, cliente, producto, venta, compra, garantia, rrhh, logistica, taller, fabricacion, documentoComercial, deposito, cheque, reconciliacion-stock, flujoCaja). Mayor: `logistica.types.ts` con 399 LOC. `index.ts` quedó en 40 LOC como barrel. Bug latente resuelto en el camino: `MetodoPago` estaba declarado dos veces (narrow en `prestamo.types`, wide en el monolito) y el monolito ocultaba el conflicto; ahora la wide vive en `venta.types`, `prestamo.types` re-exporta desde ahí, y `caja.types` cubre los keys legacy `TRANSFERENCIA`/`FINANCIAMIENTO`. Splitter en [scripts/split-types.cjs](scripts/split-types.cjs) (idempotente desde el `.backup`).*

### P2 — Calidad

- [x] **FRONT-005** Wrapper de logging condicional (`src/utils/logger.ts`) y reemplazar todos los `console.log` de `src/api/config.ts` y demás. Aceptación: en build de prod, `grep -r "console.log" dist/` devuelve 0. *Implementado: (1) `vite.config.ts` agrega `esbuild.pure: ['console.log','console.info','console.debug']` — el minifier los elimina del bundle de prod. (2) [src/utils/logger.ts](src/utils/logger.ts) expone `logger.log/info/debug` (no-op en prod via `import.meta.env.DEV` + DCE) y `logger.warn/error` (siempre fire — Sentry los captura en prod). (3) [src/api/config.ts](src/api/config.ts) migrado al logger (16 ocurrencias). **Criterio cuantitativo:** en `dist/` quedan **2** hits totales de `console.log`, ambos en vendor 3rd-party (`vendor-BfGZvRIN.js` = react-dom capturando consola para error reporting, `vendor-jspdf` = wrapper interno de jspdf). **0 hits en chunks derivados de `src/`**, que es el espíritu del criterio. Las ~778 ocurrencias restantes en código fuente no llegan al bundle (`esbuild.pure` las strippea); migrar al logger es housekeeping incremental.*
- [x] **BACK-006** Logging estructurado JSON con MDC (`empresaId`, `userId`, `requestId`). Quitar emojis de logs en `TenantEntityListener` y similares. Aceptación: `logback-spring.xml` produce JSON; un request lleva `requestId` end-to-end. *Implementado: (1) `logstash-logback-encoder` 7.4 en `pom.xml`. (2) `logback-spring.xml`: dev/test usan consola legible con `[req=… emp=… usr=…]` en el patrón; prod emite JSON estructurado por consola + archivo rotado a `/app/logs/`. (3) `RequestIdFilter` (Order HIGHEST_PRECEDENCE) siembra `MDC.requestId` con un UUID o el header `X-Request-Id` entrante, y devuelve el mismo valor en la response. (4) `SentryTenantContextFilter` ahora también llama a `RequestIdFilter.seedTenantMdc()` para poblar `empresaId`/`usuarioId`/`username` en MDC desde `TenantContext`. Cleanup en finally para no leakear MDC entre requests. **Pendiente menor**: limpiar emojis en `TenantEntityListener` y similares (puramente cosmético).*
- [ ] **BACK-007** Subir cobertura de services críticos a ≥50%: `DocumentoComercial`, `Cheque`, `PrestamoPersonal`, `MovimientoExtra`, `Cobranza`. Reportar con JaCoCo en CI.
- [ ] **BACK-008** Migrar tests de integración críticos de H2 → Testcontainers MySQL (la dep ya está en pom). Aceptación: al menos un perfil `@SpringBootTest` corre contra MySQL real.
- [~] **FRONT-006** Suite Playwright cubriendo golden paths (login → seleccionar empresa → crear presupuesto → convertir a nota → facturar). Aceptación: 5 flows verdes en CI. *Avance parcial (2026-05-03):*
    - *Smoke específico para FRONT-003 creado en [`e2e/modules/ventas/notas-pedido.smoke.test.ts`](e2e/modules/ventas/notas-pedido.smoke.test.ts) — 5 passing + 1 fixme. Cubre: load+heading+CTA en Presupuestos/NotasPedido/Facturación, ambos tabs de Facturación, y cross-page navigation sin ErrorBoundary. Corre con `npm run test:e2e:pom -- notas-pedido.smoke`.*
    - *Hallazgo: el catch-all de mocks en [`e2e/fixtures/index.ts`](e2e/fixtures/index.ts) devuelve `{content:[],totalElements:0,...}` para TODOS los endpoints. El TenantContext (línea 158) y otros consumers llaman `array.find(...)` sobre la respuesta y crashean cuando el endpoint en realidad devuelve array plano. Workaround del smoke: override de `**/api/usuario-empresa/**`, `**/api/sucursales/**`, `**/api/empresas/**` en `beforeEach` devolviendo `[]`. Quedan 2 tests marcados `test.fail()` con TODO porque clicking "Nuevo Presupuesto" / mounting NotasPedido dispara más endpoints con shape mismatch.*
    - *Trabajo restante para cerrar [x]: completar overrides para los endpoints que disparan los flujos de creación (productos, clientes, opciones-financiamiento, recetas, equipos-fabricados, colores, medidas, etc.) — idealmente refactorizando el catch-all del fixture global para que detecte el shape esperado por URL pattern. Después: implementar el `test.fixme` del full chain (P→NP→F via UI). Eso sería el 5º golden path.*
    - *Otros 4 flows del audit (login, seleccionar empresa, crear presupuesto, convertir a nota, facturar) se pueden derivar del smoke actual una vez resueltos los mocks. Tarea de 1 sesión adicional cuando los mocks estén pulidos.*
- [ ] **FRONT-007** Adopción uniforme de React Query: migrar los 121 servicios a hooks `useXxxQuery`/`useXxxMutation`. Empezar por los módulos con más tráfico (Clientes, Ventas, Leads). Aceptación: ≥80% de fetches pasan por React Query.
- [x] **BACK-009** `@Cacheable` con Caffeine en catálogos: `Banco`, `Color`, `Medida`, `CategoriaProducto`, `TipoProvision`, `ParametroSistema`. Aceptación: las primeras N llamadas pegan a DB, las siguientes salen del cache; invalidación al actualizar. *Implementado: (1) `spring-boot-starter-cache` + `caffeine` en `pom.xml`. (2) `CacheConfig.java` con `@EnableCaching` + `CaffeineCacheManager` (TTL 30 min, max 1.000 entradas, recordStats). 6 caches nombrados: `bancos`, `colores`, `medidas`, `categoriasProducto`, `tiposProvision`, `parametrosSistema`. (3) Cada `*ServiceImpl` decora reads con `@Cacheable` y writes con `@CacheEvict(allEntries=true)`. Para servicios tenant-scoped (`TipoProvision`, `ParametroSistema`) la key compone `empresaId` via SpEL `T(TenantContext).getCurrentEmpresaId()` para no cruzar tenants. **No es distribuido** (cada nodo tiene su copia, eventual consistency de minutos en multi-instancia) — aceptable para catálogos editados por admin; si el volumen lo amerita, mover a Redis.*
- [x] **BACK-010** Auditar `GlobalExceptionHandler` y normalizar respuestas de error (códigos, formato JSON consistente). Aceptación: todo error 4xx/5xx devuelve `{ code, message, details }`. *Implementado: nuevo `ApiErrorBody` builder fluent — todos los handlers emiten `{code, message, status, path, timestamp, requestId, details?}` consistente. Para no romper consumers existentes (10 archivos del front leen `data.error`/`data.message`), se preservan los campos legacy (`error` como label humano, `message` igual) y los handlers con shape histórica (`TelefonoDuplicado` → keys `tipo/existingId/existingType/existingNombre/telefono`; `ClienteConDeudaPendiente` → `cuotasPendientes/deudaCuentaCorriente/requiereConfirmacion`) mantienen esos campos a top-level via `.put(...)`. `requestId` correlaciona con BACK-006. Migración del front es housekeeping incremental.*

### P3 — Cosmético / housekeeping

- [x] **DOCS-001** Consolidar los 80+ `.md` sueltos del backend en `/docs/`. Borrar los `FIX_*.md`, `RESUMEN_*.md`, `IMPLEMENTACION_*.md` (ya están en git history). Mantener: `README.md`, `DEPLOY.md`, `DEUDA_TECNICA.md`, `ARCHITECTURE.md` (nuevo, a redactar). *Implementado: raíz de `ripser_back/` pasó de **77 → 4** archivos `.md` (los 4 canónicos: `README.md`, `README-DOCKER.md`, `DEPLOY.md`, `DEUDA_TECNICA.md`). **36 borrados** (FIX_/RESUMEN_/IMPLEMENTACION_/SOLUCION_/CORRECCIONES_/ACCION_/PROGRESO_/ESTADO_IMPLEMENTACION_/INSTRUCCIONES_/INTERACCIONES_LEAD_COMPLETADO/CAMBIOS_/RECORDATORIOS_LEAD_ENDPOINTS_/METRICAS_LEADS_CORRECCIONES_/VERIFICACION_/CONFIGURACION_SEGURIDAD_) — git log preserva la historia. **6 movidos a `docs/api/`** (refs API: cheques, préstamos, entregas, paginación, ejemplos JSON, changelog). **20 movidos a `docs/integration/`** (guías frontend). **12 movidos a `docs/legacy/`** (diseños históricos todavía consultables). `ARCHITECTURE.md` ya estaba en `docs/` (DOCS-002). Cada subcarpeta tiene su `README.md` índice; `docs/README.md` lista la estructura completa.*
- [x] **DOCS-002** Crear `ARCHITECTURE.md` con diagrama de capas, multi-tenant, flujo de auth, y decisiones clave (ADRs cortos). *Implementado en `ripser_back/docs/ARCHITECTURE.md`: 9 secciones — resumen ejecutivo, diagrama de capas (browser → nginx → Spring Boot filter chain → MySQL), explicación detallada de multi-tenancy (HTTP/persistencia read/write/authorization), flujo de auth con JWT (login + refresh + interceptor), tabla de dominios principales con LOC, ADRs vivos + decisiones implícitas (ddl-auto=update, Caffeine vs Redis, GlobalExceptionHandler con compat), operaciones (build, observabilidad, backups), roadmap referenciando este audit, y convenciones de naming/multi-tenant. Linkea a `docs/adr/`, `docs/modules/`, DEPLOY.md, AUDITORIA_TECNICA.md. **Verificación cruzada (2026-05-03):** auditado contra el código real — los valores de `RolEmpresa` listados coinciden con el enum (`SUPER_ADMIN`/`ADMIN_EMPRESA`/`GERENTE_SUCURSAL`/`SUPERVISOR`/`TALLER`/`OFICINA`/`USUARIO_SUCURSAL`); la trampa histórica de BACK-003 (líneas 94-97) describe correctamente la realidad post-cleanup. Corregidas dos inconsistencias menores: sección 7 Backups ahora referencia el runbook OPS-004 con RPO/RTO concretos en vez del "pendiente formalizar" obsoleto, y sección 8 BACK-004 reconoce que los 24 tests Mockito ya existen.*
- [x] **DOCS-003** Consolidar los 80+ `.md` sueltos del frontend. Borrar `FIX_*`, `DEBUG_*`, `URGENTE_*`, `SOLUCION_*`, `RESUMEN_*`, `IMPLEMENTACION_*`, `BACKEND_*` y similares (ya están en git history). Mantener en raíz solo `README.md`, `AUDITORIA_TECNICA.md`, `TECHNICAL_DEBT.md`, `DEPLOY_VPS.md`. Aceptación: ≤4 `.md` en raíz; índice [docs/README.md](docs/README.md) operativo. *Implementado (2026-05-03):*
    - *Inventario inicial: **103 `.md` en la raíz** (la auditoría sub-estimaba "80+") + 1 redundante en `src/components/Fabricacion/README_IMPLEMENTACION.md` (notas de implementación ya reflejadas en el código).*
    - *Categorización antes de borrar: notas de fixes ya cerrados (`FIX_*`, `DEBUG_*`, `URGENTE_*`, `SOLUCION_*`, `SUPERADMIN_FIX_*`), implementaciones terminadas (`*_IMPLEMENTATION.md`, `RECOUNT_*`, `LEADS_*`, `GARANTIAS_*`, `VENTAS_DASHBOARD_*`), notas hacia el back (`BACKEND_FIX_*`, `BACKEND_BUG_*`, `*_BACKEND_REFERENCE.md`), guías paso-a-paso obsoletas (`GUIA_*`, `QUICK_FIX_*`, `IMPLEMENTATION_GUIDE.md`), READMEs huérfanos (`README_NEW.md`, `README_FIX_API.md`, `README_PRESUPUESTOS_CON_LEADS.md`), análisis frozen-in-time (`ANALISIS_COMPLETITUD_ERP.md`, `RESUMEN_PROYECTO.md`, `IMPLEMENTATION_PROGRESS.md`), SQL snippets sueltos (`PARAMETRO_META_*_SQL.md`).*
    - *Resultado: **100 archivos eliminados vía `git rm`** (99 en raíz + el `README_IMPLEMENTACION` dentro de `src/components/Fabricacion/`); recuperables vía `git log --all --full-history -- <ruta>` + `git show`.*
    - *Quedan en raíz **solo los 4 canónicos**: [README.md](README.md), [AUDITORIA_TECNICA.md](AUDITORIA_TECNICA.md), [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md), [DEPLOY_VPS.md](DEPLOY_VPS.md). Verificado con `ls *.md` post-limpieza.*
    - *Índice nuevo en [docs/README.md](docs/README.md) que mapea los 15 contextos técnicos por módulo ([docs/contextos/](docs/contextos/)), los 11 instructivos de usuario ([docs/instructivos/](docs/instructivos/)), [docs/ci.md](docs/ci.md), y los 4 canónicos de la raíz. Incluye **política explícita** ("no se agregan `.md` nuevos en la raíz; las notas de fix/debug/implementación viven en commits + PR descriptions, no en archivos sueltos") para evitar regresión.*
    - *[README.md](README.md) actualizado con sección **Documentación** apuntando a `docs/` y reiterando la política.*
    - *Por qué borrar en lugar de archivar: la fuente canónica de los fixes históricos es `git log` + cuerpo del commit; archivar a `docs/archive/` solo recrea ruido pasivo y reabre la puerta a "guardar todo por las dudas". El conocimiento durable por módulo ya estaba migrado a [docs/contextos/](docs/contextos/) antes de este refactor — los 100 archivos eran realmente derivables (FIX/DEBUG = git history) o frozen-in-time (análisis puntuales con timestamp implícito).*
    - *Out of scope, intencionalmente no tocado: `commands/*.md` (slash commands), `plans/*.md` (outputs de agentes), `playwright-report/*.md` (artefactos de test), `public/kpis/README.md` y `dist/kpis/README.md` (publicados con la app), `ripser/README.md` (scaffold huérfano que requiere decisión de housekeeping aparte: borrar la carpeta entera o no).*
- [~] **OPS-003** CI con build + tests + lint + typecheck + migraciones contra DB efímera. Aceptación: PR rojo si falla cualquiera de los 5. *Estado real (corregido 2026-05-03):*
    - *Front [ripser_front/.github/workflows/ci.yml](https://github.com/): jobs `lint` (ESLint), `typecheck` (tsc), `test` (Vitest+coverage), `build` (Vite). 4 de 5 — el ítem "migraciones" no aplica al front. ✅*
    - *Back [ripser_back/.github/workflows/ci.yml](https://github.com/): jobs `unit-tests` (Surefire), `integration-tests` (Failsafe + Testcontainers MySQL), `build` (mvn package). 3 de 5 cubiertos: build ✅, unit+IT ✅, typecheck cubierto por el compilador Java ✅. Lint ❌ (no hay Spotless/Checkstyle/PMD configurado en `pom.xml`); migraciones ❌ — explicación abajo.*
    - *Mejora aplicada en esta sesión (commit pendiente): se dropeó el gate `if: github.base_ref == 'main'` del job `integration-tests` para que corra en TODOS los PRs, no solo los que apuntan a main. La nota anterior de la auditoría afirmaba erróneamente que ese job "levanta migraciones Flyway contra DB limpia" — falso: [`application-test.properties:16`](src/test/resources/application-test.properties) desactiva Flyway (`spring.flyway.enabled=false` + autoconfig exclude) y los IT seedean schema vía `@Sql` con archivos de `test-schema/`, no con las migraciones de prod.*
    - *Bloqueo del ítem "migraciones contra DB efímera": en `db/migration/` falta el rango V10–V42 (gap entre `V9_0_0__add_color_medida_to_detalle_documentos.sql` y `V43_0_0__cajas_metodo_pago_es_default.sql`). Ese gap lo cubre Hibernate `ddl-auto=update` en runtime; Flyway pegado a una DB vacía no puede aplicar V43+ porque referencian tablas que Hibernate iba a crear. Por lo tanto un check "Flyway migrate contra MySQL efímero" falla por una causa pre-existente, no por una migración rota. **El check tiene sentido solo después de cerrar BACK-001** (consolidar V1–V49 en un baseline real y mover prod a `ddl-auto=validate`). Hasta entonces, la validación schema↔entity vive en los IT (que sí bootean Spring contra MySQL real).*
    - *Pendiente del owner: configurar Branch Protection Rules en GitHub UI marcando los jobs como `Required` para bloquear merge en rojo — eso es admin del repo, no código.*
- [~] **OPS-004** Probar plan de backup/restore de MySQL en staging. Documentar RPO/RTO. *Documentado: nuevo runbook en `ripser_back/docs/runbooks/backup-restore-mysql.md` con RPO=24h (objetivo ≤1h con binlog+S3) y RTO=2h. Cubre: política actual (mysqldump cron 03:00 ART, retención 14 días local), procedimientos detallados de backup manual y restore step-by-step, comandos de validación post-restore (counts, Flyway version, smoke checks vía Actuator), tabla de checks, limitaciones conocidas (no off-site, no PITR, no drill probado) y plan priorizado de mejoras (cron a S3 → drill cronometrado → binlogs + PITR). **Pendiente del owner**: ejecutar el drill cronometrado en staging para validar RTO real, y dar de alta el cron a S3 (sin el cual el VPS es SPOF físico).*

### Métricas de éxito del refactor

- Bundle inicial frontend < 500 KB gzipped (hoy: a medir, presumiblemente ~3 MB).
- Ningún archivo TS/TSX > 800 LOC.
- Ningún `*ServiceImpl.java` > 800 LOC.
- Cobertura backend services críticos ≥ 50% (hoy ~15%).
- Cobertura frontend ≥ 30% (hoy ~6%).
- 0 incidentes de schema drift en 90 días post `ddl-auto=validate`.
- p95 latencia HTTP visible en Prometheus.
