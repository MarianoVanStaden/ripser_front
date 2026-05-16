# Deuda técnica — Manual de Puestos, Empleados y Carreras

> Última actualización: 2026-05-16
> Alcance: ítems no entregados, decisiones pospuestas y mejoras conocidas durante la implementación. Prioridades: P0 = bloqueante / P3 = nice-to-have.

## Estado actual (snapshot)

| Componente | Estado |
|---|---|
| Backend F0 — Catálogos (13) | ✅ Compila en VPS |
| Backend F1 — Manual de Puestos extendido | ✅ Compila en VPS |
| Frontend F0 — `/admin/catalogos-rrhh` | ✅ `tsc --noEmit` clean — deuda 2.2–2.5 resuelta |
| Frontend F1 — `PuestoFormDialog` (10 tabs) + `PuestoDetailPage` (tab "Manual") | ✅ `tsc --noEmit` clean |
| Seed universal de catálogos (`sql/seed_catalogos_rrhh.sql`) | ✅ Corrido en VPS — 75 registros verificados |
| Importer Excel (29 puestos + catálogos específicos de RIPSER) | ✅ `sql/seed_ripser_catalogos_puestos.sql` generado |
| Backend F2-F4 (importer endpoint, empleados, carreras) | ⏳ Pendiente |
| `PuestoPdfService` con layout Excel | ✅ Implementado — todas las secciones del Manual |

## 0. Validación inmediata (P0)

- [x] **Compilar el backend.** ✅ Listo en VPS.
- [x] **`tsc --noEmit` en el front.** ✅ Pasa.
- [x] **Correr seed universal.** ✅ Ejecutado. Conteo verificado: unidades_negocio=1, lugares_trabajo=1, areas=8, bandas_jerarquicas=5, niveles_jerarquicos=6, niveles_educacion=5, tipos_formacion=5, niveles_experiencia=6, competencias=18, riesgos=11, epp=10.
- [ ] **Smoke E2E navegador.** Login → `/admin/catalogos-rrhh` → ver que cargan los 13 tabs. Después `/rrhh/puestos` → crear puesto usando los catálogos.
- [ ] **Validar `spring.jpa.hibernate.ddl-auto`.** Si está en `validate`, alinear nombres de constraints/índices con el DDL real. Si está en `update` o `none`, ignorar.

## 1. Backend F1 — restos (P1)

### 1.1 ~~`PuestoPdfService` con layout del Excel~~ ✅
- Reescrito completamente. Inyecta `PuestoResponseAssembler` (constructor injection). Renderea: identificación (tabla 4 columnas con todas las FKs), misión, objetivo general, objetivos específicos, R&A (separados por tipo), habilidades/conocimientos (tabla 2 col), interacción social, competencias (tabla con nivel), riesgos (tabla con severidad), EPP, requerimientos, reemplazos, tareas + subtareas, footer con versión + fecha revisión. Diseño: secciones con fondo azul claro, filas alternadas en tablas.

### 1.2 Endpoints bulk-replace por categoría (opcional)
- Hoy el `PUT /api/rrhh/puestos/{id}` ya hace replace selectivo. Agregar endpoints `PUT /{id}/competencias`, `/riesgos`, `/epp`, `/contactos`, etc. sólo cuando el front lo necesite por performance.

### 1.3 Cutover del campo legacy `Puesto.departamento` (String)
- Coexiste con `departamentoRef` (FK). El String se mantuvo para compat con `findByEmpresaIdAndDepartamento`, `findDistinctDepartamentosByEmpresaId`, `findByDepartamento`, y el filtro del front en `PuestosPage`.
- Pendiente: migrar consumers a la FK, deprecar el campo, borrarlo en migración futura.

### 1.4 `PuestoVersion` snapshot — tamaño
- Ahora guarda el `PuestoResponseDTO` completo serializado a JSON. Va a crecer ~10× respecto al snapshot viejo (~20-50KB por versión). Verificar `max_allowed_packet` en MySQL/MariaDB. Considerar compresión zstd o `JSONB` con índices selectivos en el futuro.

### 1.5 Mappers MapStruct para catálogos
- Decidí no usarlos y mapear inline en `AbstractCatalogoCrudServiceImpl` + `CatalogoMappingHelper`. Funciona pero rompe convención del proyecto (Banco, Empleado usan MapStruct). Bajo prio.

### 1.6 Tests — parcialmente implementado
- ✅ `PuestoChildSyncerTest.java` — 12 tests: `syncObjetivos` (noop/clear/replace/autoOrden), `syncCompetencias` (happy path, duplicado, empresa ajena, noop, clear), `syncRiesgos` (duplicado), `syncReemplazos` (noop, self-ref, dedup, empresa ajena), guard TenantContext.
- ✅ `AreaServiceImplTest.java` — 10 tests del patrón `AbstractCatalogoCrudServiceImpl`: findAll con filtro activo/total, findById, create con unicidad de código, soft-delete, guard TenantContext.
- ⏳ Pendiente: integration test flujo create→update→snapshot (necesita @SpringBootTest + DB embebida).

## 2. Frontend F1 — restos (P2)

### 2.1 ~~Carga de catálogos en `PuestoFormDialog`~~ ✅
- Implementado caché de módulo con TTL 5 min en `src/api/services/catalogosCache.ts`. Los 13 catálogos se cachean; `puestos activos` se sigue pidiendo fresco. `CatalogoTablaCRUD` invalida el caché en save/delete.

### 2.2 ~~Sidebar para usuarios RRHH~~ ✅
- Ítem duplicado en la sección RRHH con `modulo: 'RRHH'`. Path `/admin/catalogos-rrhh` agregado a `rrhhAllowedPaths`. Admins lo ven en ADMINISTRACIÓN; RRHH-only lo ven en RRHH.

### 2.3 ~~Mensaje 409 vs 400 en `CatalogoTablaCRUD`~~ ✅
- Detección ampliada y case-insensitive: cubre 409, mensajes "ya existe", "duplicate entry" y "unique constraint". El back idealmente debería retornar 409 siempre, pero el front ya es robusto.

### 2.4 ~~Hack de typing en `CatalogosRRHHPage`~~ ✅
- Reemplazado por imports directos (`LugarTrabajo`, `Riesgo`, `NivelEducacion`, `NivelExperiencia`, `Sector`). `useDummyType()` eliminado.

### 2.5 ~~`PuestoDetailPage.tsx` tiene `@ts-nocheck`~~ ✅
- Removido `@ts-nocheck`. `Grid item xs/sm/md` migrado a `Grid2 as Grid` con prop `size`. `tsc --noEmit` limpio.

### 2.6 `puestoApi.getDepartamentos()` y `getByDepartamento()` aún apuntan al String legacy
- Una vez hecho el cutover backend (1.3), migrar también estos consumers.

## 3. F2 — Importer del Excel (P1)

### 3.1 ~~Importer del Excel~~ ✅
- Generado `sql/seed_ripser_catalogos_puestos.sql` (1768 líneas, UTF-8) desde los dos CSVs exportados del `.xlsm`.
- **Parte 1 — Catálogos RIPSER**: 4 áreas (DIR/ADM/MKT/OPS), 6 departamentos, 18 sectores, 3 lugares de trabajo (Taller Guanahani, Taller Savio, Varios), 14 competencias, 4 riesgos, 10 EPP.
- **Parte 2 — 29 Puestos**: misión, 3 objetivos, tareas (hasta 15), R&A, habilidades, conocimientos, contactos, competencias M:N, riesgos M:N, EPP M:N. FK lookups por código (idempotente con INSERT IGNORE + WHERE NOT EXISTS).
- Encoding: CSV estaba en CP850 (DOS Latin America); convertido a UTF-8 antes de generar SQL.
- **Para correr**: en VPS ejecutar `sql/seed_catalogos_rrhh.sql` primero, luego `sql/seed_ripser_catalogos_puestos.sql`.

### 3.2 Endpoint backend opcional
- `POST /api/puestos/import-xlsm` (multipart) con modo dry-run + commit. Permitiría reusar el importer desde la UI en vez de tener que correr Python a mano.

### 3.3 Wizard frontend
- `ImportadorManualWizard.tsx` con drag&drop + preview de diff (creados / actualizados / catálogos nuevos).

**Estimado total F2: 2 días-persona.**

## 4. F3 — Empleados, historial y gap analysis (P2)

- DDL ya aplicado para `historial_puesto_empleado` y `empleado_competencia`. **Cero código JPA.**
- Faltante:
  - `HistorialPuestoEmpleado` entity + repo + service. Hook en `EmpleadoServiceImpl.cambiarPuesto()` que cierre el registro vigente (fecha_hasta = hoy) y abra uno nuevo con `snapshot_puesto` (JSON del PuestoResponseDTO en ese momento).
  - `EmpleadoCompetencia` entity + repo + service. Endpoint `GET /api/empleados/{id}/gap-analysis?puestoObjetivoId=X` que retorna matriz {competencia, nivel_requerido, nivel_actual, gap}.
  - Frontend: `EmpleadoDetailPage` con tab "Trayectoria" (timeline) y tab "Competencias" (radar chart con recharts ya está como dep).

**Estimado: 4 días-persona.**

## 5. F4 — Carreras Profesionales (P2)

- DDL ya aplicado: `carreras_profesionales`, `nodos_carrera`, `transiciones_carrera`, `planes_carrera`, `planes_carrera_pasos`, `empleado_plan_carrera`. **Cero código.**
- Faltante:
  - Entities + repos + service + controllers para las 6 tablas.
  - Endpoint `GET /api/carreras/{id}/grafo` retornando `{ nodos, transiciones }`.
  - Validación de DAG en `PUT /api/carreras/{id}/grafo` (Tarjan o topological sort) para rechazar ciclos.
  - Frontend: `CarreraGrafoEditor` con `react-flow` (nuevo dep), drag&drop de Puestos al grafo, panel de planes curados, asignación a empleado.

**Estimado: 5 días-persona.**

## 6. F5 — Reportes y dashboard (P3)

- `GET /api/reportes/manual-puestos` con métricas: cobertura del manual (% puestos con todos los campos), revisiones vencidas, puestos sin titular, dotación por área, etc.
- Tarjetas + gráficos en `DashboardRRHH`.
- Export Excel respetando el layout del `.xlsm` original (Apache POI).

**Estimado: 2 días-persona.**

## 7. Decisiones registradas / "rationale"

### 7.1 No usamos Hibernate Envers
- El sistema ya tiene `PuestoVersion` con snapshot JSON. Envers sería más completo pero el refactor de migraciones + reentrenamiento no justifica el costo para v1.

### 7.2 `@MappedSuperclass CatalogoBaseEntity` para los 13 catálogos
- Decidido para evitar ~1700 LOC duplicados. Primera vez que el proyecto usa `@MappedSuperclass`. Si genera fricción, volver a clases concretas.

### 7.3 Snapshot de `PuestoVersion` = `PuestoResponseDTO` serializado
- Una sola fuente de verdad: lo que muestra el detail page = lo que se snapshotea. Trade-off: cualquier campo nuevo del DTO entra al snapshot automáticamente, lo cual significa que agregar campos sensibles (salarios detallados, datos personales) los persiste en snapshots históricos. **Revisar antes de exponer datos sensibles en el DTO.**

### 7.4 `Puesto.departamento` (String) coexiste con `departamentoRef` (FK)
- Compat: 6+ consumers leen el String. Cutover en fase separada — ver 1.3.

### 7.5 Catálogos sin paginación
- Asumimos < 100 items por catálogo por empresa. Si una empresa carga 500+ riesgos, la página se vuelve lenta.

### 7.6 `PuestoFkResolver` no permite "limpiar" FKs (set null)
- Ignora valores null para no pisar la FK. Si el usuario quiere desasignar el área de un puesto, no hay forma desde el DTO actual. Solución futura: patrón de sentinela explícito (`Optional<Long>` o `JsonNullable<Long>`). No urgente.

### 7.7 Bulk replace = "null no toca / array reemplaza"
- Convención de `PuestoChildSyncer.sync*`. Documentado en el TSDoc del front y JavaDoc del back.

### 7.8 Departamentos del Sidebar
- El item "Catálogos RRHH" lo metí en la sección Admin. Si los usuarios RRHH no ven Admin, hay que mover o duplicar el ítem.

## 8. Quality issues conocidos

- [x] ~~**Lombok `@AllArgsConstructor` removido**~~ — No es un defecto. Area, UnidadNegocio, Epp, TipoFormacion no tienen campos propios; añadir `@AllArgsConstructor` generaría un constructor duplicado con `@NoArgsConstructor`. Estado actual es correcto.
- [x] ~~DDL del importer no committeado~~ — Se reemplazó por el seed universal `sql/seed_catalogos_rrhh.sql`.
- [x] ~~**PuestoDetailPage usa `@ts-nocheck`**~~ — Resuelto en 2.5.

## 9. Convenciones a propagar

- **Multi-tenant en todo lo nuevo**: `empresa_id NOT NULL` + `@EntityListeners(TenantEntityListener.class)` + `implements TenantAware` + queries explícitas con `findByEmpresaId`.
- **Soft delete**: `activo BOOLEAN`. Nunca borrar físicamente.
- **Códigos únicos por empresa**: `UNIQUE (empresa_id, codigo)` en todos los catálogos. El front impone que el código es inmutable (input disabled en edit).
- **Patron sync = clear + repopulate** aprovecha `orphanRemoval=true` en `Puesto.{objetivos|...}`. Si se replica en otra entidad, agregar `orphanRemoval` y `cascade=ALL`.
- **DTOs con id+nombre para FKs**: lo hace `PuestoResponseAssembler`; mantener si se agrega más front.

## 10. Quick wins post-merge

1. Correr `sql/seed_catalogos_rrhh.sql` en el VPS.
2. Loguearse, ir a `/admin/catalogos-rrhh`, validar que los 13 tabs muestran los items sembrados.
3. Crear 1 puesto de prueba usando los catálogos (Área = "Producción", Banda = "D-2", Nivel Jerárquico = "Supervisión", etc.). Verificar que:
   - Las FKs encadenadas filtran (al elegir Área se filtran Departamentos, etc.).
   - El detail page muestra correctamente todo en el tab "Manual".
   - El PDF se descarga (aunque le falten secciones).
4. Hacer `git commit` separando F0 backend / F0 frontend / F1 backend / F1 frontend / Seed + Deuda técnica para que el log quede legible.
5. Si todo OK, conseguir el `.xlsm` actualizado y arrancar el importer (F2).
