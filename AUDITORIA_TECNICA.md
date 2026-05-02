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

- [ ] **BACK-001** Apagar `spring.jpa.hibernate.ddl-auto=update` en prod → mover a `validate`. Migrar a Flyway las columnas que Hibernate venía creando solo. Aceptación: bootear con `validate` no rompe; CI corre migraciones contra DB limpia y pasa.
- [ ] **FRONT-001** `React.lazy` + `<Suspense>` en las 124 rutas de `src/App.tsx`. Aceptación: bundle inicial < 500 KB gzipped (medir con `ANALYZE=1 npm run build`); cada ruta carga su chunk on-demand.
- [ ] **OPS-001** Habilitar Spring Boot Actuator + Micrometer + endpoint `/actuator/prometheus`. Aceptación: scrape Prometheus devuelve métricas JVM + HTTP + Hikari.
- [ ] **OPS-002** Sentry (o equivalente) en backend y frontend con `release` y `environment`. Aceptación: una excepción no manejada llega al dashboard con stacktrace y contexto de empresa/usuario.

### P1 — Mantenibilidad

- [ ] **BACK-002** Refactor `SecurityConfig`: rol-listas → constantes + helpers, y mover decisiones a `@PreAuthorize` en controllers críticos (Auth, Migration, Admin, Admin/Usuarios). Aceptación: `SecurityConfig` < 150 líneas; los tests de autorización siguen verdes.
- [ ] **BACK-003** Roles parametrizados por DB en lugar de `ADMIN_EMPRESA_1/2/3` hardcodeados. Aceptación: alta de una 4ª empresa no requiere recompilar.
- [ ] **BACK-004** Romper `DocumentoComercialServiceImpl` (2.545 LOC) en domain services por capability (emisión, anulación, descuentos, reversiones). Aceptación: ningún archivo > 800 LOC; tests existentes verdes.
- [ ] **BACK-005** Mismo refactor para `ChequeServiceImpl` (1.066 LOC), `ReconciliacionStockServiceImpl` (770), `LeadMetricasServiceImpl` (755), `EquipoFabricadoServiceImpl` (733).
- [ ] **FRONT-002** Quebrar `FacturacionPage.tsx` (3.369 LOC) en `<FacturaForm>`, `<FacturaList>`, `<FacturaActions>`, `<FacturaTotals>`. Aceptación: el archivo principal < 500 LOC; comportamiento idéntico (smoke E2E).
- [ ] **FRONT-003** Mismo split para `NotasPedidoPage` (2.590), `AsistenciasPage` (2.528), `PresupuestosPage` (2.232), `DeliveriesPage` (2.219), `ComprasPedidosPage` (2.115), `TransferenciasPage` (2.064).
- [ ] **FRONT-004** Trocear `src/types/index.ts` (3.898 LOC) en archivos por dominio (`ventas.types.ts`, `cheques.types.ts`, etc.) y dejar `index.ts` como barrel. Aceptación: build y typecheck pasan; ningún archivo de tipos > 600 LOC.

### P2 — Calidad

- [ ] **FRONT-005** Wrapper de logging condicional (`src/utils/logger.ts`) y reemplazar todos los `console.log` de `src/api/config.ts` y demás. Aceptación: en build de prod, `grep -r "console.log" dist/` devuelve 0.
- [ ] **BACK-006** Logging estructurado JSON con MDC (`empresaId`, `userId`, `requestId`). Quitar emojis de logs en `TenantEntityListener` y similares. Aceptación: `logback-spring.xml` produce JSON; un request lleva `requestId` end-to-end.
- [ ] **BACK-007** Subir cobertura de services críticos a ≥50%: `DocumentoComercial`, `Cheque`, `PrestamoPersonal`, `MovimientoExtra`, `Cobranza`. Reportar con JaCoCo en CI.
- [ ] **BACK-008** Migrar tests de integración críticos de H2 → Testcontainers MySQL (la dep ya está en pom). Aceptación: al menos un perfil `@SpringBootTest` corre contra MySQL real.
- [ ] **FRONT-006** Suite Playwright cubriendo golden paths (login → seleccionar empresa → crear presupuesto → convertir a nota → facturar). Aceptación: 5 flows verdes en CI.
- [ ] **FRONT-007** Adopción uniforme de React Query: migrar los 121 servicios a hooks `useXxxQuery`/`useXxxMutation`. Empezar por los módulos con más tráfico (Clientes, Ventas, Leads). Aceptación: ≥80% de fetches pasan por React Query.
- [ ] **BACK-009** `@Cacheable` con Caffeine en catálogos: `Banco`, `Color`, `Medida`, `CategoriaProducto`, `TipoProvision`, `ParametroSistema`. Aceptación: las primeras N llamadas pegan a DB, las siguientes salen del cache; invalidación al actualizar.
- [ ] **BACK-010** Auditar `GlobalExceptionHandler` y normalizar respuestas de error (códigos, formato JSON consistente). Aceptación: todo error 4xx/5xx devuelve `{ code, message, details }`.

### P3 — Cosmético / housekeeping

- [ ] **DOCS-001** Consolidar los 80+ `.md` sueltos del backend en `/docs/`. Borrar los `FIX_*.md`, `RESUMEN_*.md`, `IMPLEMENTACION_*.md` (ya están en git history). Mantener: `README.md`, `DEPLOY.md`, `DEUDA_TECNICA.md`, `ARCHITECTURE.md` (nuevo, a redactar).
- [ ] **DOCS-002** Crear `ARCHITECTURE.md` con diagrama de capas, multi-tenant, flujo de auth, y decisiones clave (ADRs cortos).
- [ ] **OPS-003** CI con build + tests + lint + typecheck + migraciones contra DB efímera. Aceptación: PR rojo si falla cualquiera de los 5.
- [ ] **OPS-004** Probar plan de backup/restore de MySQL en staging. Documentar RPO/RTO.

### Métricas de éxito del refactor

- Bundle inicial frontend < 500 KB gzipped (hoy: a medir, presumiblemente ~3 MB).
- Ningún archivo TS/TSX > 800 LOC.
- Ningún `*ServiceImpl.java` > 800 LOC.
- Cobertura backend services críticos ≥ 50% (hoy ~15%).
- Cobertura frontend ≥ 30% (hoy ~6%).
- 0 incidentes de schema drift en 90 días post `ddl-auto=validate`.
- p95 latencia HTTP visible en Prometheus.
