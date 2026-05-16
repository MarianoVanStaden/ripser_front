# Deuda técnica — Manual de Puestos, Empleados y Carreras

> Última actualización: 2026-05-15
> Alcance: ítems no entregados, decisiones pospuestas y mejoras conocidas durante la implementación de F0+F1 del Manual de Puestos extendido. Las prioridades son indicativas (P0 = bloqueante / P3 = nice-to-have).

## 0. Validación inmediata (P0)

- [ ] **Compilar el backend.** `cd ripser_back && ./mvnw compile`. Hasta no correrlo no podemos garantizar que todas las nuevas entidades / FKs / colecciones lookean bien con el DDL. El back se generó referenciando entidades creadas por un agente en paralelo; el flujo es razonable pero el compilador es la única autoridad.
- [ ] **Smoke test del front.** `cd ripser_front && pnpm dev` y abrir `/admin/catalogos-rrhh`. Verificar que los 13 tabs cargan y que el CRUD funciona contra cada `/api/catalogos/<x>`. El TanStack/React Query no se usa acá (los componentes hacen fetch directo con `useEffect`); está alineado al patrón de `ColoresPage`.
- [ ] **Validar nombres de constraints / índices.** El agente que generó los 9 catálogos restantes anotó que **no leyó el DDL** y dedujo los nombres por convención. Si `spring.jpa.hibernate.ddl-auto = validate` en algún profile, va a fallar. Si está en `update` o `none`, no pasa nada. Confirmar el setting actual y, si es validate, alinear los names.

## 1. Backend F1 — restos (P1)

### 1.1 `PuestoPdfService` con layout del Excel
- Estado: stub viejo intacto. Sigue funcionando para los campos básicos (nombre, departamento, salario, tareas/subtareas) pero **no renderea** mision, objetivos, responsabilidades, habilidades, conocimientos, contactos, competencias, riesgos, EPP, requerimientos, reemplazos, FKs de catálogo, ni fecha de revisión.
- Tamaño estimado: ~300 LOC en `services/impl/PuestoPdfService.java`.
- Diseño sugerido: tablas anidadas con iText / OpenPDF replicando el layout del `.xlsm` original. Considerar inyectar `PuestoResponseAssembler` para tener el modelo armado en vez de leer la entidad directamente.

### 1.2 Endpoints bulk-replace por categoría
- Hoy se hace todo vía `PUT /api/rrhh/puestos/{id}` con `UpdatePuestoDTO`. Funciona, pero exige que el front mande el puesto entero.
- Opcional: agregar `PUT /api/rrhh/puestos/{id}/competencias`, `/riesgos`, `/epp`, `/contactos`, etc. con un payload menor para sincronizar una sola categoría. Servicio ya tiene `PuestoChildSyncer` listo — sólo hay que exponer un endpoint por categoría.

### 1.3 Cutover del campo legacy `Puesto.departamento` (String)
- Coexiste con `departamentoRef` (FK). El String se mantuvo para compat con queries existentes (`findByEmpresaIdAndDepartamento`, `findDistinctDepartamentosByEmpresaId`, `findByDepartamento`).
- Pendiente: detectar todos los consumers de `Puesto.departamento` String, migrarlos a la FK, deprecar el campo y eventualmente borrarlo en una migración futura.

### 1.4 `PuestoVersion` snapshot — consideraciones
- Ahora guardo el `PuestoResponseDTO` completo serializado a JSON. Es lo correcto pero ojo:
  - El tamaño por versión va a crecer ~10× respecto al snapshot viejo (ahora ~20-50KB por versión).
  - Si MySQL/MariaDB tiene `max_allowed_packet` chico podrían cortarse — verificar.
  - Considerar compresión (zstd) o columna `JSONB` con índices selectivos en un futuro.

### 1.5 Mappers de catálogos — MapStruct
- Decidí no usar MapStruct para los catálogos y mapear inline en `AbstractCatalogoCrudServiceImpl` + `CatalogoMappingHelper`. Funciona pero rompe la convención del proyecto (Banco, Empleado, etc. todos usan MapStruct).
- Opcional: agregar 13 mappers MapStruct minimalistas. Lo dejé inline porque los catálogos casi no tienen campos planos extra y MapStruct con `@MappedSuperclass` + herencia se vuelve molesto.

### 1.6 `Puesto.departamento` (String) en el Sidebar / filtros del front
- `puestoApi.getDepartamentos()` y `puestoApi.getByDepartamento()` aún consultan el campo legacy. Una vez hecho el cutover (1.3) hay que migrar también el front.

### 1.7 Tests
- Cero tests escritos para todo lo nuevo. Mínimo a agregar:
  - `@DataJpaTest` por catálogo verificando que el `find*ByEmpresaId` filtra correctamente.
  - Integration test del flujo create→update→snapshot del Puesto extendido.
  - Unit test del `PuestoChildSyncer.syncCompetencias` validando que el `Set` rechaza duplicados.

## 2. Frontend F1 — restos (P1)

### 2.1 `PuestoFormDialog` tabbed
- **El form actual** (`PuestoFormDialog.tsx`) sigue exponiendo sólo los campos viejos (nombre, descripcion, departamento String, salarioBase, requisitos, objetivoGeneral, motivoCambio). No expone ni FKs ni listas ni M:N.
- Diseño objetivo: 11 tabs siguiendo el Excel:
  1. **Identificación** — nombre, área (FK), departamento (FK), sector (FK), unidad de negocio, lugar de trabajo, banda jerárquica, nivel jerárquico, CIUO, volumen de dotación, reportaA.
  2. **Misión + Objetivos** — texto único `mision` + lista dinámica de objetivos.
  3. **Tareas** — reuso del flujo existente (`TareaFormDialog` / `SubtareaFormDialog`).
  4. **Responsabilidad y Autoridad** — lista con toggle RESPONSABILIDAD / AUTORIDAD.
  5. **Competencias** — selector múltiple del catálogo + nivel requerido 1-5.
  6. **Habilidades y Conocimientos** — dos listas planas.
  7. **Interacción Social** — contactos INTERNO/EXTERNO + reportaA/supervisaA preview.
  8. **Riesgos y EPP** — selectores múltiples + flag "obligatorio".
  9. **Requerimientos** — selects de nivel educación, tipo formación, nivel experiencia + texto libre observaciones.
  10. **Reemplazos** — multi-select de puestos.
  11. **Revisión** — fecha revisión + motivo de cambio (sólo en edit).
- Tamaño estimado: ~600 LOC totales, probablemente partido en 5 archivos (orquestador + 4 sub-componentes para las listas reutilizables).

### 2.2 `PuestoDetailPage` extendido
- Hoy muestra sólo los campos viejos en un layout simple. Hay que sumar accordions/secciones para todo lo nuevo, espejando el form. Estimo ~250 LOC.

### 2.3 Sidebar para usuarios RRHH
- El item "Catálogos RRHH" lo agregué bajo la sección de Admin actual. Si el rol `RECURSOS_HUMANOS` no ve esa sección, hay que duplicarlo bajo una sección "RRHH > Configuración". Revisar `Sidebar.tsx` y los permisos.

### 2.4 Validación de unicidad por código en el dialog
- `CatalogoTablaCRUD.handleSave` muestra "Ya existe otro registro con código X" sólo si el back devuelve 409 o un mensaje con "ya existe". Aceptable para MVP pero frágil — si el back devuelve 400, el usuario verá un genérico. Mejor: que el back devuelva siempre 409 para conflictos de unicidad.

### 2.5 Loading global de catálogos
- Cada tab del `CatalogosRRHHPage` fetchea su lista en mount. Tabs jerárquicos (Departamento, Sector, Competencia) **fetchan adicionalmente** el catálogo padre. Sin caching → si el usuario salta entre tabs vuelve a pegar. Mejorable con React Query o un Context simple. Bajo prio: las listas son chicas (<100 items).

### 2.6 Hack de typing en `CatalogosRRHHPage`
- Usé un helper `useDummyType()` para forzar al inferidor de TS a aceptar los tipos de `CatalogoTablaCRUD<LugarTrabajo, ...>` sin escribir todos los imports inline. Es feo. Refactor cuando se toque el archivo: imports directos en cada tab.

## 3. F2 — Importer del Excel del Manual (P1)

- Estado: diseñado en la fase de planificación; **no implementado**.
- Componentes faltantes:
  - **`scripts/excel-importer/import_manual_puestos.py`** (Python con `openpyxl`) — parsea las hojas "Tablas y Datos", "Bases" y "Competencias" y genera SQL seed idempotente con `INSERT ... ON DUPLICATE KEY UPDATE`.
  - **Seed SQL** (`V20260516_01__seed_manual_puestos.sql`) generado para `empresa_id=1` con los 29 puestos del manual + catálogos referenciados.
  - **Endpoint backend opcional**: `POST /api/puestos/import-xlsm` (multipart) con modo dry-run + commit. Permitiría reusar el importer desde la UI en vez de tener que correr Python a mano.
  - **Wizard frontend**: `ImportadorManualWizard.tsx` con drag&drop + preview de diff (creados / actualizados / catálogos nuevos).
- Estimado: 2 días-persona.

## 4. F3 — Empleados, historial y gap analysis (P2)

- Estado: DDL ya aplicado para `historial_puesto_empleado` y `empleado_competencia`. Sin entidades JPA, sin controllers, sin UI.
- Faltante:
  - `HistorialPuestoEmpleado` entity + repo + service. Hook en `EmpleadoServiceImpl.cambiarPuesto()` que cierre el registro vigente (fecha_hasta = hoy) y abra uno nuevo con `snapshot_puesto` (JSON del PuestoResponseDTO en ese momento).
  - `EmpleadoCompetencia` entity + repo + service. Endpoint `GET /api/empleados/{id}/gap-analysis?puestoObjetivoId=X` que retorna matriz {competencia, nivel_requerido, nivel_actual, gap}.
  - Frontend: `EmpleadoDetailPage` con tab "Trayectoria" (timeline de historial) y tab "Competencias" (radar chart con recharts).
- Estimado: 4 días-persona.

## 5. F4 — Carreras Profesionales (P2)

- Estado: DDL ya aplicado para `carreras_profesionales`, `nodos_carrera`, `transiciones_carrera`, `planes_carrera`, `planes_carrera_pasos`, `empleado_plan_carrera`. Cero código.
- Faltante:
  - Entities + repos + service + controller para las 6 tablas.
  - Endpoint `GET /api/carreras/{id}/grafo` retornando `{ nodos, transiciones }` para el visor.
  - Validación de DAG en `PUT /api/carreras/{id}/grafo` (Tarjan o topological sort) para rechazar ciclos.
  - Frontend: `CarreraGrafoEditor` con react-flow (nuevo dep), drag&drop de Puestos al grafo, panel de planes curados, asignación a empleado.
- Estimado: 5 días-persona.

## 6. F5 — Reportes y dashboard (P3)

- Endpoint `GET /api/reportes/manual-puestos` con métricas: cobertura del manual (% puestos con todos los campos completos), revisiones vencidas, puestos sin titular, dotación por área, etc.
- Tarjetas + gráficos en `DashboardRRHH`.
- Export Excel respetando el layout del `.xlsm` original (uso de `ApachePOI`).
- Estimado: 2 días-persona.

## 7. Decisiones registradas / "rationale"

### 7.1 No usamos Hibernate Envers
- El sistema ya tiene `PuestoVersion` con snapshot JSON. Envers sería más completo (auto-historial de TODOS los campos sin código) pero el refactor de migraciones + reentrenamiento del equipo no justifica el costo para v1. Reconsiderar en v3.

### 7.2 `@MappedSuperclass` para catálogos (CatalogoBaseEntity)
- Decidido para evitar 1700 LOC duplicados entre 13 catálogos casi idénticos. El proyecto histórico no usa `@MappedSuperclass`; esta es la primera. Si genera fricción (problemas con MapStruct, herencia, etc.), considerar volver a clases concretas con copy/paste explícito.

### 7.3 Snapshot del PuestoVersion = PuestoResponseDTO serializado
- Antes el snapshot era un `Map<String, Object>` hand-rolled. Cambié a `objectMapper.writeValueAsString(responseAssembler.assemble(puesto))` para tener una sola fuente de verdad: lo que muestra el detail page = lo que se snapshotea. Trade-off: cualquier nuevo campo de `PuestoResponseDTO` entra al snapshot automáticamente, lo cual también significa que **agregar campos sensibles al DTO los persiste en snapshots históricos**. Revisar antes de exponer salarios detallados, datos personales, etc.

### 7.4 `Puesto.departamento` String coexiste con `departamentoRef` FK
- Estricto por compat: 6+ consumers (queries, dashboard, filtros del front) leen el String. Cutover en una fase separada — ver 1.3.

### 7.5 Catálogos sin paginación
- Asumimos < 100 items por catálogo por empresa. Si una empresa carga 500+ riesgos, la página se vuelve lenta. Bajo prio.

### 7.6 Resolución de FK no permite "limpiar" (set null) sin re-modelado
- `PuestoFkResolver.applyCatalogoFks` ignora valores null (no toca la FK). Si el usuario quiere quitar el área de un puesto, no hay forma desde el DTO actual. Solución: usar `Optional<Long>` o un patrón de sentinela explícito. No urgente — el patrón en el sistema es "una vez asignado, siempre asignado".

### 7.7 Bulk replace = "null no toca / array reemplaza"
- Es la convención de `syncObjetivos`, `syncCompetencias`, etc. Documentar en el contrato del UpdatePuestoDTO (en el TSDoc del front ya está; agregar también al JavaDoc del back).

## 8. Quality issues conocidos

- [ ] **No corrí `./mvnw compile` ni `pnpm tsc --noEmit`** — la única validación fue lectura cruzada. Probable que haya 5-15 errores menores (import faltante, signature mismatch). Ningún error de diseño esperado.
- [ ] **Lombok `@AllArgsConstructor` removido** de algunas entidades de catálogo por un linter del usuario (UnidadNegocio, Area, Epp, TipoFormacion). Es inofensivo pero deja inconsistente: las demás entidades tienen el constructor. Considerar pasar de `@AllArgsConstructor` (que es boilerplate inútil con `@Setter`) a sólo `@NoArgsConstructor` en todos los catálogos.
- [ ] **DDL del importer no committeado.** El archivo `V20260516_01__seed_manual_puestos.sql` que se generó en una pasada anterior **no está en el repo** — se perdió en compaction del contexto. Hay que regenerarlo cuando arranquemos F2.

## 9. Convenciones a propagar

- **Multi-tenant en todo lo nuevo**: `empresa_id NOT NULL` + `@EntityListeners(TenantEntityListener.class)` + `implements TenantAware` + queries explícitas con `findByEmpresaId`.
- **Soft delete**: `activo BOOLEAN`. Nunca borrar físicamente.
- **Códigos únicos por empresa**: `UNIQUE (empresa_id, codigo)` en todos los catálogos. El front impone que el código es inmutable (input disabled en edit).
- **Patron sync = clear + repopulate** aprovecha `orphanRemoval=true` en `Puesto.{objetivos|...}`. Si se replica en otra entidad, agregar `orphanRemoval` y `cascade=ALL` o no va a funcionar.
- **DTOs con id+nombre para FKs**: evita lookups en el front. Lo hace `PuestoResponseAssembler`; mantenerlo si se agrega más front.

## 10. Quick wins post-merge

1. Correr `./mvnw compile` y arreglar lo que aparezca (5-30 min).
2. Si la DB es nueva, popular catálogos manualmente vía la UI (Áreas, Departamentos, Sectores, etc.) — toma ~15 min.
3. Cargar 1 puesto de prueba con todos los campos para validar create/update end-to-end.
4. Hacer `git commit` separando F0 backend, F0 frontend, F1 backend, F1 frontend para que el log quede legible.
