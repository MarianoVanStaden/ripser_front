# Plan: fix permisos COBRANZAS + segundo teléfono y rubro en Lead/Cliente

## Context

Dos cambios independientes se entregan juntos porque el usuario los pidió en el mismo mensaje:

1. **Bug**: usuarios con rol `COBRANZAS` no pueden cargar sucursales (403 en `/api/sucursales/empresa/{id}` y `/api/sucursales/{id}`). Esto rompe páginas como `/ventas/registro` y `/clientes/gestion` (rutas que el rol tiene en su allowlist) porque el selector de sucursal no carga. Causa: el commit `b10b763` agregó COBRANZAS al grupo `VENTAS` de `SecurityConfig` pero olvidó el grupo `EMPRESAS`, que es el que cubre `/api/empresas/**` y `/api/sucursales/**`.

2. **Feature**: agregar segundo teléfono y rubro (segmento de actividad) a Lead y Cliente, con propagación en la conversión Lead → Cliente. El usuario vende heladeras y necesita segmentar por rubro del comprador (panadería, rotisería, almacén, etc.) para análisis y campañas.

**Decisiones tomadas con el usuario:**

- Para "segundo teléfono" reuso el campo existente `telefonoAlternativo` (ya está en la entidad Lead, en la entidad Cliente y en la columna `telefono_alternativo` de ambas tablas). Solo está sin exponer en los formularios y en algunos DTOs. Sin migración nueva por este lado.
- `rubro` es campo **nuevo y separado** de `segmento` (que se usa para tier comercial: VIP/PREMIUM/STANDARD/BASICO).
- `rubro` es **opcional** en alta de Lead y de Cliente.
- Con `rubro = OTRO` se habilita un input libre `rubroDetalle` para describir el rubro particular (ej. "heladerías", "carnicería"). El campo `rubroDetalle` también acepta texto cuando rubro tiene cualquier otro valor (free text complementario).

---

## Cambio 1 — Fix backend permisos COBRANZAS

**Archivo:** [ripser_back/src/main/java/com/ripser_back/security/config/SecurityConfig.java:44](../../ripser_back/src/main/java/com/ripser_back/security/config/SecurityConfig.java#L44)

Agregar `"COBRANZAS"` al array `EMPRESAS`:

```java
private static final String[] EMPRESAS = {"SUPER_ADMIN","ADMIN","GERENTE_SUCURSAL","VENDEDOR","OFICINA","USER","COBRANZAS"};
```

Eso habilita `/api/empresas/**` y `/api/sucursales/**` (línea 66 de SecurityConfig) para el rol.

---

## Cambio 2 — Modelo backend (entity + enum + migración + DTOs)

### 2.1 Nuevo enum `Rubro`

**Archivo nuevo:** `ripser_back/src/main/java/com/ripser_back/enums/Rubro.java`

Valores: `PANADERIA, ROTISERIA, POLIRUBRO, ALMACEN, RESTAURANT, HELADERIAS, OTRO`. Patrón idéntico a `CanalEnum`.

### 2.2 Migración Flyway

**Archivo nuevo:** `ripser_back/src/main/resources/db/migration/V54_0_0__add_rubro_to_lead_cliente.sql`

```sql
ALTER TABLE leads
    ADD COLUMN rubro VARCHAR(30),
    ADD COLUMN rubro_detalle VARCHAR(200);

ALTER TABLE clientes
    ADD COLUMN rubro VARCHAR(30),
    ADD COLUMN rubro_detalle VARCHAR(200);
```

(Sin default ni `NOT NULL` — campos opcionales; existing rows quedan en NULL.)

### 2.3 Entidades

- **[Lead.java:97](../../ripser_back/src/main/java/com/ripser_back/entities/Lead.java#L97)** — después de `telefonoAlternativo`, agregar:
  ```java
  @Enumerated(EnumType.STRING)
  @Column(length = 30)
  private Rubro rubro;

  @Column(name = "rubro_detalle", length = 200)
  private String rubroDetalle;
  ```

- **[Cliente.java:95](../../ripser_back/src/main/java/com/ripser_back/entities/Cliente.java#L95)** — equivalente, después de `telefonoAlternativo` (antes del bloque `// ==================== DIRECCIÓN ====================`).

### 2.4 DTOs

- **[LeadDTO.java](../../ripser_back/src/main/java/com/ripser_back/dto/LeadDTO.java)** — agregar `telefonoAlternativo`, `rubro`, `rubroDetalle`. **Nota:** la entidad ya tiene `telefonoAlternativo` pero el DTO no lo expone hoy. Hay que agregarlo. Sin `@NotBlank` (todos opcionales). MapStruct los autodetecta por igual nombre, no hace falta tocar `LeadMapper`.

- **[ClienteDTO.java](../../ripser_back/src/main/java/com/ripser_back/dto/cliente/ClienteDTO.java)** — agregar `telefonoAlternativo`, `rubro` (`Rubro`), `rubroDetalle`.

- **[CreateClienteDTO.java](../../ripser_back/src/main/java/com/ripser_back/dto/cliente/CreateClienteDTO.java)** — agregar:
  ```java
  @Size(max = 20, message = "El teléfono alternativo no puede exceder los 20 caracteres")
  private String telefonoAlternativo;

  private Rubro rubro;

  @Size(max = 200, message = "El detalle del rubro no puede exceder los 200 caracteres")
  private String rubroDetalle;
  ```

### 2.5 Conversión Lead → Cliente

**[LeadServiceImpl.convertirLeadACliente()](../../ripser_back/src/main/java/com/ripser_back/services/impl/LeadServiceImpl.java#L508)** — después de la línea 519 (`setTelefono`) agregar:

```java
nuevoCliente.setTelefonoAlternativo(lead.getTelefonoAlternativo());
nuevoCliente.setRubro(lead.getRubro());
nuevoCliente.setRubroDetalle(lead.getRubroDetalle());
```

Si el `request` (ConversionLeadRequest) llegara a tener overrides de estos campos (no es lo planeado para esta entrega), se aplican después; por ahora la conversión solo copia desde Lead.

---

## Cambio 3 — Frontend

### 3.1 Tipos compartidos

**Archivo nuevo:** `src/types/rubro.types.ts`

```typescript
export type RubroEnum =
  | 'PANADERIA'
  | 'ROTISERIA'
  | 'POLIRUBRO'
  | 'ALMACEN'
  | 'RESTAURANT'
  | 'HELADERIAS'
  | 'OTRO';

export const RUBRO_OPTIONS: { value: RubroEnum; label: string }[] = [
  { value: 'PANADERIA',  label: 'Panadería' },
  { value: 'ROTISERIA',  label: 'Rotisería' },
  { value: 'POLIRUBRO',  label: 'Polirubro' },
  { value: 'ALMACEN',    label: 'Almacén' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'HELADERIAS', label: 'Heladerías' },
  { value: 'OTRO',       label: 'Otro (especificar)' },
];

export const RUBRO_LABELS: Record<RubroEnum, string> =
  Object.fromEntries(RUBRO_OPTIONS.map(o => [o.value, o.label])) as Record<RubroEnum, string>;
```

### 3.2 Tipos Lead/Cliente

- **[src/types/lead.types.ts:78-137](../src/types/lead.types.ts#L78)** (interface `LeadDTO`) — `telefonoAlternativo` ya está. Agregar:
  ```typescript
  rubro?: RubroEnum;
  rubroDetalle?: string;
  ```

- **[src/types/cliente.types.ts:8](../src/types/cliente.types.ts#L8)** (interface `Cliente`) — `telefonoAlternativo` ya está. Agregar `rubro?: RubroEnum; rubroDetalle?: string;`.

- **[src/types/cliente.types.ts:105](../src/types/cliente.types.ts#L105)** (interface `CreateClienteRequest`) — agregar `telefonoAlternativo?: string; rubro?: RubroEnum; rubroDetalle?: string;`.

### 3.3 Formulario de Lead

**[src/pages/leads/LeadFormPage.tsx:548-558](../src/pages/leads/LeadFormPage.tsx#L548)** — el TextField de `telefono` está dentro de un `Grid item xs=12 md=6`. Inmediatamente después agregar tres ítems en la misma grilla:

1. `telefonoAlternativo` — TextField igual al de telefono pero opcional, label "Teléfono alternativo".
2. `rubro` — `TextField select` o `Select` MUI con opciones de `RUBRO_OPTIONS` (mismo patrón que el dropdown de Provincia, líneas 574-592).
3. `rubroDetalle` — TextField libre. Siempre visible (también sirve como detalle complementario a cualquier rubro), pero con label dinámico: cuando `rubro === 'OTRO'` el label es "Detalle del rubro (requerido)" y el helperText pide especificar; en otro caso label "Detalle (opcional)". Nada bloqueante en submit.

Validación: el archivo ya usa `errors` con shape `{ campo: mensaje }`. Agregar checks defensivos en `validate()` (si existe) para `rubroDetalle` cuando `rubro === 'OTRO'` y está vacío — error inline, sin disable del submit (matching project convention).

### 3.4 Formulario de Cliente

**[src/components/Clientes/ClienteFormPage.tsx](../src/components/Clientes/ClienteFormPage.tsx)** — patrón idéntico al de Lead. El form ya usa `handleFormChange` con name attribute (líneas 91-101). Agregar los tres campos a continuación del `telefono` existente, en una sección "Datos de contacto" si ya existe; si no, agruparlos cerca del teléfono.

### 3.5 Conversión Lead → Cliente

**[src/pages/leads/ConvertLeadPage.tsx](../src/pages/leads/ConvertLeadPage.tsx)** — el backend ya copia `telefonoAlternativo`, `rubro` y `rubroDetalle` automáticamente. No se requiere cambio funcional en el formulario de conversión. Mejora opcional: en la sección read-only de "Datos del Lead" agregar líneas para mostrar `Teléfono alternativo`, `Rubro` y `Detalle` para que el comercial vea qué se va a copiar antes de confirmar (ver patrón de despliegue read-only existente alrededor de las líneas 200+).

### 3.6 Vista de detalle

- **[src/pages/leads/LeadDetailPage.tsx](../src/pages/leads/LeadDetailPage.tsx)** — en la card "Datos de contacto" / "Información", agregar dos filas: "Teléfono alternativo" y "Rubro" (con `rubroDetalle` entre paréntesis si existe). Usar `RUBRO_LABELS[lead.rubro]` para mostrar la etiqueta humana.
- **[src/components/Clientes/ClienteDetailPage.tsx:260-270](../src/components/Clientes/ClienteDetailPage.tsx#L260)** — equivalente.

### 3.7 Tablas

- **[src/pages/leads/LeadsTablePage.tsx:567](../src/pages/leads/LeadsTablePage.tsx#L567)** — opcional: agregar columna "Rubro" (no ordenable, mostrar como Chip pequeño con `RUBRO_LABELS[lead.rubro]`). Si la tabla ya está densa, omitir la columna pero mostrar el rubro en el tooltip de la fila o en el detalle expandible.
- **[src/components/Clientes/ClientesPage.tsx:319](../src/components/Clientes/ClientesPage.tsx#L319)** — equivalente.

`telefonoAlternativo` no se muestra en tablas (queda en el detalle).

---

## Archivos a tocar (resumen)

**Backend (8 archivos, 2 nuevos):**

| Archivo | Cambio |
|---|---|
| `security/config/SecurityConfig.java` | +COBRANZAS en EMPRESAS |
| `enums/Rubro.java` | NUEVO |
| `db/migration/V54_0_0__add_rubro_to_lead_cliente.sql` | NUEVO |
| `entities/Lead.java` | +rubro, rubroDetalle |
| `entities/Cliente.java` | +rubro, rubroDetalle |
| `dto/LeadDTO.java` | +telefonoAlternativo, rubro, rubroDetalle |
| `dto/cliente/ClienteDTO.java` | +telefonoAlternativo, rubro, rubroDetalle |
| `dto/cliente/CreateClienteDTO.java` | +telefonoAlternativo, rubro, rubroDetalle |
| `services/impl/LeadServiceImpl.java` | conversión copia 3 campos |

**Frontend (8 archivos, 1 nuevo):**

| Archivo | Cambio |
|---|---|
| `src/types/rubro.types.ts` | NUEVO |
| `src/types/lead.types.ts` | +rubro, rubroDetalle |
| `src/types/cliente.types.ts` | +rubro, rubroDetalle, telefonoAlternativo en CreateClienteRequest |
| `src/pages/leads/LeadFormPage.tsx` | +inputs telefonoAlt, rubro, rubroDetalle |
| `src/components/Clientes/ClienteFormPage.tsx` | idem |
| `src/pages/leads/ConvertLeadPage.tsx` | display read-only de los 3 campos del lead (opcional) |
| `src/pages/leads/LeadDetailPage.tsx` | display rubro + telefonoAlt |
| `src/components/Clientes/ClienteDetailPage.tsx` | display rubro + telefonoAlt |
| `src/pages/leads/LeadsTablePage.tsx` | columna rubro (opcional) |
| `src/components/Clientes/ClientesPage.tsx` | columna rubro (opcional) |

Hay cambios no commiteados pre-existentes en `LeadDetailPage.tsx`, `LeadFormPage.tsx` y `LeadsTablePage.tsx`. Los preservo y agrego encima.

---

## Verificación end-to-end

**Backend (requiere JDK 21 — verificar `java -version` antes):**

1. `cd ripser_back && ./mvnw spring-boot:run`
2. Flyway aplica V54_0_0 al levantar — confirmar en logs: `Migrating schema "public" to version "54.0.0"`.
3. `psql` (o cliente DB) → `\d leads` y `\d clientes` deben mostrar columnas `rubro` y `rubro_detalle`.

**Front:**

4. `cd ripser_front && npm run dev`
5. **Test fix permisos COBRANZAS:** loguear con usuario rol Cobranzas → ir a `/ventas/registro` → DevTools Network: `GET /api/sucursales/empresa/{id}` debe devolver 200, no 403. El selector de sucursal carga.
6. **Test alta de Lead:** `/leads/nuevo` → cargar telefono, telefonoAlternativo, seleccionar `rubro = HELADERIAS`, escribir `rubroDetalle = "compra freezers vitrina"`. Guardar. En la fila de la tabla aparece chip "Heladerías".
7. **Test conversión:** abrir el lead recién creado → "Convertir a Cliente" → completar formulario → confirmar. Ir al cliente creado → la card de detalle muestra `Teléfono alternativo`, `Rubro: Heladerías`, `Detalle: compra freezers vitrina`. Verificar también en DB:
   ```sql
   SELECT telefono, telefono_alternativo, rubro, rubro_detalle
   FROM clientes WHERE lead_id = <ID_DEL_LEAD>;
   ```
8. **Test alta directa de Cliente:** `/clientes/nuevo` → cargar `rubro = OTRO` + `rubroDetalle = "carnicería"`. Guardar. Detalle muestra "Otro (especificar): carnicería".
9. **Test edición:** abrir un Lead/Cliente existente (sin rubro), agregar uno, guardar, recargar — persistido.

**Tests a correr:**

10. `cd ripser_front && npm test` — ningún test debería romperse. Si hay tests sobre LeadFormPage/ClienteFormPage, ajustar mocks para incluir los 3 campos nuevos.
11. Backend: `./mvnw test` — los tests de `LeadService` que verifican conversión deben seguir pasando (los nuevos campos son opcionales, no rompen existing assertions).
