# Gestión de Créditos Personales — Entrega, recálculo de cuotas y PDF

## Context

Hoy un Préstamo Personal recibe `fechaEntrega = LocalDate.now()` al crearse, sin importar cuándo el cliente recibe efectivamente el equipo. El cronograma de cuotas se calcula a partir de `primerVencimiento`, que es independiente de la entrega real, por lo que cualquier desfase de logística desplaza mora de hecho al cliente. No existen endpoints para corregir la fecha de entrega ni la fecha de vencimiento de una cuota, y no hay PDF que refleje el estado actual del crédito (sólo Ventas tiene PDF).

Este cambio:

1. Difiere `fechaEntrega` hasta que **Transporte confirma la entrega del equipo** (Control de Entregas / Entregas de Equipo).
2. Permite **editar manualmente** `fechaEntrega` y desplazar las cuotas pendientes el mismo Δdías.
3. Permite **editar la fecha de una cuota puntual** con opción de propagar el desplazamiento a las siguientes pendientes.
4. Agrega **exportación a PDF del estado actual del crédito** reutilizando el mismo look & feel del módulo Ventas.

Cada operación queda auditada en `HistorialPrestamo` (entidad ya existente, scope crédito, con `descripcion: TEXT`) con un evento tipado y un payload JSON que incluye el `motivo` exigido por negocio.

## Decisiones de diseño confirmadas

- **Linkage entrega ↔ préstamo:** transitivo via `EntregaViaje.documentoComercial` ↔ `PrestamoPersonal.documentoId`. No se agrega FK directa. Se enforce 1:1 con `UNIQUE (empresa_id, documento_id)` en `prestamos_personales` (MySQL permite múltiples NULL en UNIQUE, así que no rompe créditos sin documento asociado).
- **Re-confirmación de entrega:** *freeze on first confirm*. La primera vez que `EntregaViaje` pasa a `ENTREGADA` setea `fechaEntrega`. Flips posteriores se registran en `HistorialPrestamo` pero no modifican la fecha (un schedule manualmente editado no debe regresarse silenciosamente).
- **Anclaje de cuotas a la entrega:** regla de negocio "se paga a contraentrega el monto inicial y se inicializa el crédito en ese momento". Las cuotas se crean con `fechaVencimiento = null` ("pendientes de anclaje"). En la primera confirmación de entrega, las cuotas PENDIENTE se setean con `fechaVencimiento = fechaEntrega + (numeroCuota × período)` según `tipoFinanciacion`. PAGADA/PARCIAL/VENCIDA/REFINANCIADA quedan intactas. El operador puede también anclar manualmente desde la edición de fecha de entrega (mismo recálculo). Edición individual de una cuota requiere que el cronograma ya esté anclado.
- **Eliminado del create:** `primerVencimiento` ya no se pide en el form (`PrestamoFormDialog`). El campo sigue en el DTO por backward-compat — si un caller legacy lo manda, se respeta como anchor original.
- **Falla del hook entrega→crédito:** *log + proceed*. La confirmación de entrega no se rolea atrás si falla el side-effect del crédito; se loggea como evento ERROR en `HistorialPrestamo` para reconciliación. Mismo patrón que `crearGarantiasAlEntregar`.
- **Cuotas vencidas en shift masivo:** se saltan. Sólo `PENDIENTE` se mueve. `VENCIDA`, `PAGADA`, `PARCIAL`, `REFINANCIADA` se preservan en su fecha original (la mora es información histórica). Para mover una vencida individual existe el flujo de Parte 3.
- **Auditoría:** se reutiliza `HistorialPrestamo` (existe en [HistorialPrestamo.java](../../ripser_back/src/main/java/com/ripser_back/entities/HistorialPrestamo.java)). Se extiende el enum `TipoEventoHistorial` con tres valores nuevos. El `motivo` y el detalle estructurado se serializan como JSON en el campo `descripcion`. **No** se usa `AuditoriaMovimiento` (orientado a inventario/equipos).
- **Concurrencia:** se agrega `@Version` a `PrestamoPersonal` (columna `version INT NOT NULL DEFAULT 0`). Conflictos se mapean a `409 Conflict` en el GlobalExceptionHandler.
- **PDF:** frontend-only con jsPDF + jspdf-autotable. Reutiliza header/footer corporativo de [pdfExportUtils.ts](../src/utils/pdfExportUtils.ts) y los helpers de tabla/colores de [pdfService.ts](../src/services/pdfService.ts).

## Backend — cambios

### Migraciones Flyway (próxima versión: V57; última actual V56_0_0)

**`ripser_back/src/main/resources/db/migration/V57_0_0__prestamo_unique_documento.sql`**
```sql
-- Antes de aplicar: SELECT empresa_id, documento_id, COUNT(*) FROM prestamos_personales
-- WHERE documento_id IS NOT NULL GROUP BY 1,2 HAVING COUNT(*)>1;
-- Si hay duplicados, resolver manualmente antes del deploy.
ALTER TABLE prestamos_personales
  ADD CONSTRAINT uq_prestamo_documento_per_empresa
  UNIQUE (empresa_id, documento_id);
```

**`V57_0_1__prestamo_version_column.sql`**
```sql
ALTER TABLE prestamos_personales ADD COLUMN version INT NOT NULL DEFAULT 0;
```

**`V57_0_2__historial_prestamo_indexes.sql`** (opcional, perf)
```sql
CREATE INDEX idx_historial_prestamo_evento_fecha
  ON historial_prestamo (prestamo_id, tipo_evento, fecha_evento DESC);
```

`fecha_entrega` ya es nullable (campo es `LocalDate` en la entidad), no requiere migración.

### Enum

**`enums/TipoEventoHistorial.java`** — agregar:
```
ENTREGA_CONFIRMADA, EDICION_FECHA_ENTREGA, EDICION_FECHA_CUOTA
```

### Entidad

**`entities/PrestamoPersonal.java`** — agregar:
```java
@Version
@Column(nullable = false)
private Integer version;
```

### Repos

**`PrestamoPersonalRepository`** — agregar:
```java
Optional<PrestamoPersonal> findByEmpresaIdAndDocumentoId(Long empresaId, Long documentoId);
```
(El método existente `findByDocumentoId` se mantiene; el nuevo es tenant-aware para el hook de entrega.)

### DTOs nuevos

- `dto/prestamo/UpdateFechaEntregaDTO.java` → `{ LocalDate nuevaFecha @NotNull, String motivo @NotBlank @Size(max=1000), Boolean aplicarDesplazamientoCuotas }` (default `false`)
- `dto/prestamo/UpdateFechaVencimientoCuotaDTO.java` → `{ LocalDate nuevaFecha @NotNull, String motivo @NotBlank @Size(max=1000), Boolean propagarSiguientes }` (default `false`)

### Servicios

**`services/impl/PrestamoPersonalServiceImpl.java`**

- **Línea ~101**: eliminar `.fechaEntrega(LocalDate.now())` del builder de creación. `fechaEntrega` queda null. Escribir `HistorialPrestamo` con evento `CREACION` (si no existe ya).
- Nuevo método:
  ```java
  @Transactional
  public void marcarEntregaDesdeViaje(Long documentoComercialId, LocalDate fechaEntrega, Long entregaViajeId, Long usuarioId);
  ```
  - Lookup tenant-aware (`findByEmpresaIdAndDocumentoId`).
  - Si no hay préstamo → no-op + log info.
  - Si `prestamo.fechaEntrega != null` → freeze: log + escribir `HistorialPrestamo` con evento `ENTREGA_CONFIRMADA` y `descripcion = {"skipped":true,"motivoSkip":"alreadySet","entregaViajeId":...}`. No modifica nada.
  - Si está null → setea, persiste, escribe `HistorialPrestamo` con `descripcion = {"entregaViajeId":...,"documentoId":...,"fechaEntrega":"..."}`.
- Nuevo método:
  ```java
  @Transactional
  public PrestamoPersonalDTO actualizarFechaEntrega(Long prestamoId, UpdateFechaEntregaDTO dto, Long usuarioId);
  ```
  Lógica:
  1. Cargar préstamo, validar tenant.
  2. Si `prestamo.fechaEntrega == null && dto.aplicarDesplazamientoCuotas` → 400 "No se puede desplazar cuotas: fecha de entrega aún no establecida".
  3. Validación de rango: rechazar `nuevaFecha` > +12 meses desde hoy o < -36 meses (configurable).
  4. `delta = ChronoUnit.DAYS.between(actual, nuevaFecha)` (cuando actual no es null).
  5. Setear `fechaEntrega = nuevaFecha`.
  6. Si `aplicarDesplazamientoCuotas`: iterar cuotas y desplazar sólo las `PENDIENTE && !refinanciada`. Saltar `PAGADA`, `PARCIAL`, `VENCIDA`, `REFINANCIADA`. Recalcular `prestamo.vencimientoActual` a la nueva fecha de la primera cuota no paga.
  7. Escribir `HistorialPrestamo` evento `EDICION_FECHA_ENTREGA` con `descripcion = {"fechaAnterior":"...","fechaNueva":"...","deltaDias":N,"aplicarDesplazamiento":bool,"cuotasAfectadas":[ids],"motivo":"..."}`.
  8. Devolver DTO refrescado (con cuotas).

**`services/impl/CuotaPrestamoServiceImpl.java`** — nuevo método:
```java
@Transactional
public CuotaPrestamoDTO actualizarFechaVencimiento(Long prestamoId, Long cuotaId, UpdateFechaVencimientoCuotaDTO dto, Long usuarioId);
```
Lógica:
1. Cargar cuota, validar pertenencia a `prestamoId`.
2. Rechazar si `estado IN (PAGADA, PARCIAL, REFINANCIADA)`. Permitir `PENDIENTE` y `VENCIDA`.
3. `delta = nuevaFecha - actual`.
4. Setear `cuota.fechaVencimiento = nuevaFecha`.
5. Si `propagarSiguientes`: cargar todas con `numeroCuota > target.numeroCuota && estado == PENDIENTE`, desplazar Δ. **No** mueve PAGADA/PARCIAL aunque sean posteriores (no pisar pagos reales).
6. Recalcular `prestamo.vencimientoActual`.
7. Escribir `HistorialPrestamo` evento `EDICION_FECHA_CUOTA` con `descripcion = {"cuotaId":..,"numeroCuota":..,"fechaAnterior":"...","fechaNueva":"...","deltaDias":N,"propagar":bool,"cuotasAfectadas":[ids],"motivo":"..."}`.

### Controllers

**`controllers/EntregaViajeController.java`** — en `confirmarEntrega` (línea ~231-309), después de `actualizarEstadoEquiposAEntregado` (~línea 277), agregar bloque defensivo:
```java
if (estado == EstadoEntrega.ENTREGADA && documento != null) {
    try {
        prestamoPersonalService.marcarEntregaDesdeViaje(
            documento.getId(),
            fechaEntrega.toLocalDate(),
            entregaViaje.getId(),
            currentUserId
        );
    } catch (Exception e) {
        log.error("No se pudo actualizar fechaEntrega del préstamo asociado a documento {}", documento.getId(), e);
        // log + proceed: la entrega no se rolea
    }
}
```

**`controllers/PrestamoPersonalController.java`** — agregar:
```
PATCH /api/prestamos-personales/{id}/fecha-entrega
  body: UpdateFechaEntregaDTO  → 200 PrestamoPersonalDTO

PATCH /api/prestamos-personales/{id}/cuotas/{cuotaId}/fecha-vencimiento
  body: UpdateFechaVencimientoCuotaDTO  → 200 CuotaPrestamoDTO
```
(Si existe `CuotaPrestamoController` separado, ubicar el segundo allí; mantener path con prefijo `prestamoId` para consistencia.)

**`GlobalExceptionHandler`** — mapear `OptimisticLockException` / `ObjectOptimisticLockingFailureException` a `409 Conflict` con cuerpo `{"error":"VERSION_CONFLICT","message":"Otro usuario modificó este préstamo. Recargue."}` si no está ya hecho.

## Frontend — cambios

### Tipos

**`src/types/prestamo.types.ts`** — agregar:
```ts
export interface UpdateFechaEntregaDTO {
  nuevaFecha: string;          // ISO yyyy-MM-dd
  motivo: string;
  aplicarDesplazamientoCuotas: boolean;
}
export interface UpdateFechaVencimientoCuotaDTO {
  nuevaFecha: string;
  motivo: string;
  propagarSiguientes: boolean;
}
```
Extender `TipoEventoHistorial` literal con `'ENTREGA_CONFIRMADA' | 'EDICION_FECHA_ENTREGA' | 'EDICION_FECHA_CUOTA'`.

### API services

**`src/api/services/prestamoPersonalApi.ts`** — agregar:
```ts
actualizarFechaEntrega(id: number, dto: UpdateFechaEntregaDTO): Promise<PrestamoPersonalDTO>
```

**`src/api/services/cuotaPrestamoApi.ts`** — agregar:
```ts
actualizarFechaVencimiento(prestamoId: number, cuotaId: number, dto: UpdateFechaVencimientoCuotaDTO): Promise<CuotaPrestamoDTO>
```

### Componentes

**Nuevo `src/components/Prestamos/EditarFechaEntregaDialog.tsx`**
- DatePicker (MUI), TextField multiline para `motivo` (mín 5 chars), Checkbox "Desplazar cuotas pendientes en consecuencia".
- **Preview reactivo**: cuando hay `nuevaFecha` + checkbox activo, tabla de 2 columnas (Antes / Después) computada client-side: para cada cuota PENDIENTE, `nuevaVencimiento = original + (nuevaFecha - fechaEntregaActual)`. Las no-PENDIENTE aparecen greyed con chip "no se modifica".
- Si `prestamo.fechaEntrega == null`, deshabilita el checkbox con tooltip "Sólo disponible cuando hay fecha de entrega previa".
- `Alert severity="warning"` final con resumen antes del submit.
- `useMutation` + `queryClient.invalidateQueries(['prestamo', id])` y `['cuotas', prestamoId]`.
- En 409 → toast "Otro usuario modificó este préstamo, recargue".

**Nuevo `src/components/Prestamos/EditarFechaCuotaDialog.tsx`**
- Mismo patrón. Checkbox: "Aplicar el mismo desplazamiento a las cuotas siguientes pendientes".
- Preview: si propagación activa, tabla de cuotas siguientes PENDIENTE con Antes/Después.
- Bloquear apertura si `cuota.estado IN (PAGADA, PARCIAL, REFINANCIADA)`.

**`src/components/Prestamos/PrestamoDetailPage.tsx`** — integraciones:
- Header: ícono lápiz junto a `fechaEntrega` (gated `tieneRol(['ADMIN','ADMIN_EMPRESA'])`) → abre `EditarFechaEntregaDialog`. Si `fechaEntrega == null`, mostrar placeholder "Pendiente de entrega" en lugar de la fecha.
- Tabla de cuotas: columna nueva "Acciones" con ícono editar fecha por fila (gated, oculto en PAGADA/PARCIAL/REFINANCIADA).
- Header: botón "Exportar PDF" → llama `pdfService.generarCreditoPDF(prestamo, cuotas, cliente)`.

**`src/components/Prestamos/PrestamoFormDialog.tsx`** — verificado que **no** expone `fechaEntrega` en creación (sólo `PrestamoDetailPage` referencia el campo). Sin cambios.

### PDF

**`src/services/pdfService.ts`** — agregar:
```ts
generarCreditoPDF(
  prestamo: PrestamoPersonalDTO,
  cuotas: CuotaPrestamoDTO[],
  cliente: ClienteDTO
): jsPDF
```
Estructura (reutilizar helpers existentes en el archivo):
1. `addCorporateHeader(doc, 'Estado del Crédito Personal')` — de [pdfExportUtils.ts](../src/utils/pdfExportUtils.ts).
2. Bloque Cliente: nombre, documento, código Rojas, teléfono.
3. Bloque Crédito: nº préstamo, monto capital, tasa, cant. cuotas, tipo financiación, fecha creación, **fecha entrega o "Pendiente de entrega"**, estado, categoría.
4. autoTable de cuotas: # | Vencimiento | Monto | Pagado | Saldo | Estado | Días mora — colores de estado siguiendo paleta Ripser (`#144272`, `#CDE2EF`, rojo para vencida, verde para pagada).
5. Bloque Totales: total pagado, saldo pendiente, conteo pagadas/pendientes/vencidas, próximo vencimiento.
6. `addCorporateFooter(doc)`.
7. Filename: `credito-${prestamo.id}-${cliente.apellido||cliente.nombre}-${YYYYMMDD}.pdf`.

No es necesario refactor a util común: el patrón ya está en pdfService + pdfExportUtils. Sólo reutilizar.

### Logística (Parte 1)

No requiere cambio frontend. Opcional: si el backend incluye `prestamoActualizadoId` en la respuesta de `confirmarEntrega`, mostrar toast "Crédito #X: fecha de entrega actualizada".

## Casos borde cubiertos

| Caso | Manejo |
|---|---|
| Crédito sin documento asociado | `documentoId = null` → hook entrega no encuentra match, no-op |
| Entrega sin crédito asociado | `findByEmpresaIdAndDocumentoId` vacío, no-op |
| Múltiples créditos por documento | Bloqueado por `UNIQUE(empresa_id, documento_id)` (V57_0_0) |
| Re-confirmación de entrega | Freeze on first: side-effects sólo en la primera ENTREGADA |
| `NO_ENTREGADA` después de `ENTREGADA` | No toca `fechaEntrega`. Se loggea evento informativo |
| Cuota PAGADA en shift masivo | Saltada |
| Cuota PARCIAL en shift masivo | Saltada (la fecha es referencia económica del pago parcial) |
| Cuota VENCIDA en shift masivo | Saltada (mora preservada) |
| Cuota REFINANCIADA | Saltada |
| `fechaEntrega == null` + usuario activa shift | Frontend deshabilita checkbox; backend rechaza 400 |
| Edición concurrente | `@Version` → 409 al cliente perdedor |
| Falla del hook entrega→crédito | log + proceed; `HistorialPrestamo` queda sin entrada (a evaluar log de errores aparte) |
| Validación de rango de fecha | rechazar > +12 meses o < -36 meses |
| Cuota fechaVencimiento < fechaEntrega | Permitido con warning visual en el preview |
| Usuario sin permiso | UI oculta botones; backend valida con `usePermisos` equivalente server-side |

## Tests

**Backend (Mockito + `@SpringBootTest`):**
- `PrestamoPersonalServiceImplTest`
  - `create_doesNotSetFechaEntrega`
  - `marcarEntregaDesdeViaje_setsFecha_whenUnset`
  - `marcarEntregaDesdeViaje_freezesOnReConfirm`
  - `marcarEntregaDesdeViaje_noOpWhenNoCredit`
  - `actualizarFechaEntrega_shiftsOnlyPendientes`
  - `actualizarFechaEntrega_skipsVencidaPagadaParcial`
  - `actualizarFechaEntrega_rejectsShiftWhenFechaEntregaNull`
  - `actualizarFechaEntrega_writesHistorialEvent`
- `CuotaPrestamoServiceImplTest`
  - `actualizarFechaVencimiento_singleCuota`
  - `actualizarFechaVencimiento_propagatesToSubsequentPendientes`
  - `actualizarFechaVencimiento_doesNotMovePagadasInPropagation`
  - `actualizarFechaVencimiento_rejectsPagadaCuota`
- `EntregaViajeIntegrationTest`
  - Confirmar entrega con crédito asociado → fechaEntrega seteada
  - Confirmar entrega sin crédito → entrega ok, no error
  - Re-confirmar entrega → fechaEntrega no cambia
- `PrestamoPersonalControllerTest`
  - PATCH fecha-entrega 200 con audit
  - PATCH fecha-entrega 409 con `version` desactualizado
  - PATCH cuota fecha-vencimiento 200 con propagación

**Frontend (Vitest + RTL + MSW):**
- `EditarFechaEntregaDialog.test.tsx`: preview muestra sólo PENDIENTES desplazadas; submit deshabilitado sin motivo; checkbox disabled cuando no hay fechaEntrega
- `EditarFechaCuotaDialog.test.tsx`: cálculo de propagación correcto; bloqueo en estados cerrados
- `PrestamoDetailPage.test.tsx`: gating por rol de los íconos editar
- `pdfService.test.ts`: `generarCreditoPDF` produce un jsPDF con cantidad de páginas razonable para 24 cuotas

## Orden de implementación

1. Backend: enum + migraciones V57_0_0 / V57_0_1 / V57_0_2 + `@Version` en entidad + repo `findByEmpresaIdAndDocumentoId`.
2. Backend Parte 1: remover seteo de `fechaEntrega` en `create`, agregar `marcarEntregaDesdeViaje`, cablear en `EntregaViajeController.confirmarEntrega`. Tests.
3. Backend Parte 2: DTO + service method + endpoint + mapping 409. Tests.
4. Backend Parte 3: DTO + service method + endpoint. Tests.
5. Frontend: tipos + métodos en API services.
6. Frontend Parte 2 + 3: dialogs + integración en `PrestamoDetailPage`. Tests de componente.
7. Frontend Parte 4: `generarCreditoPDF` + botón "Exportar PDF". Test de servicio.
8. Smoke E2E manual en staging: crear crédito → confirmar entrega → ver fechaEntrega → editar fechaEntrega con shift → ver cuotas movidas → editar una cuota con propagación → exportar PDF → verificar 4 entradas en historial del préstamo.

## Archivos críticos a editar

**Backend (`ripser_back/`):**
- [src/main/java/com/ripser_back/entities/PrestamoPersonal.java](../../ripser_back/src/main/java/com/ripser_back/entities/PrestamoPersonal.java)
- [src/main/java/com/ripser_back/entities/HistorialPrestamo.java](../../ripser_back/src/main/java/com/ripser_back/entities/HistorialPrestamo.java) (sólo para confirmar shape de `descripcion`)
- [src/main/java/com/ripser_back/enums/TipoEventoHistorial.java](../../ripser_back/src/main/java/com/ripser_back/enums/TipoEventoHistorial.java)
- [src/main/java/com/ripser_back/repositories/PrestamoPersonalRepository.java](../../ripser_back/src/main/java/com/ripser_back/repositories/PrestamoPersonalRepository.java)
- [src/main/java/com/ripser_back/services/impl/PrestamoPersonalServiceImpl.java](../../ripser_back/src/main/java/com/ripser_back/services/impl/PrestamoPersonalServiceImpl.java) (línea ~101 + métodos nuevos)
- [src/main/java/com/ripser_back/services/impl/CuotaPrestamoServiceImpl.java](../../ripser_back/src/main/java/com/ripser_back/services/impl/CuotaPrestamoServiceImpl.java)
- [src/main/java/com/ripser_back/controllers/PrestamoPersonalController.java](../../ripser_back/src/main/java/com/ripser_back/controllers/PrestamoPersonalController.java)
- [src/main/java/com/ripser_back/controllers/EntregaViajeController.java](../../ripser_back/src/main/java/com/ripser_back/controllers/EntregaViajeController.java) (línea ~277 — bloque post-entrega)
- `src/main/java/com/ripser_back/dto/prestamo/UpdateFechaEntregaDTO.java` (nuevo)
- `src/main/java/com/ripser_back/dto/prestamo/UpdateFechaVencimientoCuotaDTO.java` (nuevo)
- `src/main/resources/db/migration/V57_0_0__prestamo_unique_documento.sql` (nuevo)
- `src/main/resources/db/migration/V57_0_1__prestamo_version_column.sql` (nuevo)
- `src/main/resources/db/migration/V57_0_2__historial_prestamo_indexes.sql` (nuevo)

**Frontend (`ripser_front/`):**
- [src/types/prestamo.types.ts](../src/types/prestamo.types.ts)
- [src/api/services/prestamoPersonalApi.ts](../src/api/services/prestamoPersonalApi.ts)
- [src/api/services/cuotaPrestamoApi.ts](../src/api/services/cuotaPrestamoApi.ts)
- [src/components/Prestamos/PrestamoDetailPage.tsx](../src/components/Prestamos/PrestamoDetailPage.tsx)
- `src/components/Prestamos/EditarFechaEntregaDialog.tsx` (nuevo)
- `src/components/Prestamos/EditarFechaCuotaDialog.tsx` (nuevo)
- [src/services/pdfService.ts](../src/services/pdfService.ts) (`generarCreditoPDF` nuevo)
- [src/utils/pdfExportUtils.ts](../src/utils/pdfExportUtils.ts) (sólo lectura — reutilizar header/footer)

## Verificación end-to-end

1. **Backend tests:** `cd ripser_back && ./mvnw test -Dtest='PrestamoPersonalServiceImplTest,CuotaPrestamoServiceImplTest,EntregaViajeIntegrationTest,PrestamoPersonalControllerTest'` (recordar JDK 21).
2. **Frontend tests:** `cd ripser_front && npm test -- EditarFechaEntregaDialog EditarFechaCuotaDialog PrestamoDetailPage pdfService`.
3. **Migraciones:** levantar backend en dev, verificar que Flyway aplica V57_0_0/0_1/0_2 sin error y que `SHOW INDEX FROM prestamos_personales` lista `uq_prestamo_documento_per_empresa`.
4. **Smoke manual:**
   - Crear préstamo personal asociado a una factura → verificar `fechaEntrega = null` en la UI ("Pendiente de entrega").
   - Crear viaje + entrega para esa factura, confirmar como ENTREGADA → recargar préstamo → `fechaEntrega` debe quedar igual a la fecha del confirm. Historial muestra `ENTREGA_CONFIRMADA`.
   - Volver a confirmar la misma entrega o flipear NO_ENTREGADA→ENTREGADA → `fechaEntrega` no cambia, historial muestra evento "skipped".
   - Editar `fechaEntrega` (+5 días) con checkbox "desplazar cuotas" activo y motivo → preview muestra Δ=5; submit → cuotas PENDIENTE corridas 5 días, las VENCIDA/PAGADA intactas. Historial: `EDICION_FECHA_ENTREGA`.
   - Editar fecha de cuota #3 (+2 días) con propagación → cuotas siguientes PENDIENTE +2; PAGADA intermedia no se mueve. Historial: `EDICION_FECHA_CUOTA`.
   - Click "Exportar PDF" → archivo con header Ripser, datos cliente, cuotas en tabla con estados coloreados, totales correctos.
   - Abrir el préstamo en dos tabs, editar `fechaEntrega` en ambas → la segunda recibe 409 con toast "Otro usuario modificó este préstamo, recargue".
