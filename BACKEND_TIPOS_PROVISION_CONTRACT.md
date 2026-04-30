# Tipos de Provisión – Contrato Backend (ripser_back)

El frontend ya consume este contrato. Hay que implementarlo en `ripser_back`
antes de mergear el cambio del frontend.

## 1. Nueva tabla `tipos_provision`

Catálogo por empresa. Reemplaza el enum hardcoded `TipoProvision`
(`AGUINALDO|VACACIONES|SAC|OTRO`).

```sql
CREATE TABLE tipos_provision (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  empresa_id      BIGINT NOT NULL,
  codigo          VARCHAR(30) NOT NULL,            -- mayúsculas, único por empresa
  nombre          VARCHAR(80) NOT NULL,
  cuenta_en_patrimonio BOOLEAN NOT NULL DEFAULT TRUE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tipos_provision_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
  UNIQUE KEY uk_tipos_provision_empresa_codigo (empresa_id, codigo)
);
```

### Seed por cada empresa existente

Para no romper datos legacy, sembrar los 4 tipos actuales:

| codigo     | nombre     | cuenta_en_patrimonio |
|------------|------------|----------------------|
| AGUINALDO  | Aguinaldo  | true                 |
| VACACIONES | Vacaciones | true                 |
| SAC        | SAC        | true                 |
| OTRO       | Otro       | false                |

## 2. Migración de `provisiones_mensuales`

Agregar `tipo_id` (FK), llenarlo desde el `tipo` string actual mapeando
contra el catálogo recién sembrado, luego dropear la columna `tipo`.

```sql
ALTER TABLE provisiones_mensuales
  ADD COLUMN tipo_id BIGINT NULL AFTER sucursal_id,
  ADD CONSTRAINT fk_provisiones_tipo FOREIGN KEY (tipo_id) REFERENCES tipos_provision(id);

UPDATE provisiones_mensuales pm
JOIN tipos_provision tp
  ON tp.empresa_id = pm.empresa_id AND tp.codigo = pm.tipo
SET pm.tipo_id = tp.id;

ALTER TABLE provisiones_mensuales
  MODIFY COLUMN tipo_id BIGINT NOT NULL,
  DROP COLUMN tipo;
```

## 3. Endpoints REST

### `/api/tipos-provision`

| Método | Path                       | Body                               | Respuesta              |
|--------|----------------------------|------------------------------------|------------------------|
| GET    | `/api/tipos-provision`     | query: `activo?: boolean`          | `TipoProvisionDTO[]`   |
| GET    | `/api/tipos-provision/{id}`|                                    | `TipoProvisionDTO`     |
| POST   | `/api/tipos-provision`     | `CrearTipoProvisionDTO`            | `TipoProvisionDTO` (201) |
| PATCH  | `/api/tipos-provision/{id}`| `ActualizarTipoProvisionDTO`       | `TipoProvisionDTO`     |

- POST debe responder 409 si `(empresa_id, codigo)` ya existe.
- PATCH no permite cambiar `codigo` (solo `nombre`, `cuentaEnPatrimonio`, `activo`).
- No hay borrado físico — se desactiva con `activo=false`.

### `/api/provisiones` (renombrar paths)

URL actual con `tipo` string → ahora con `tipoId`:

| Antes                                              | Ahora                                                  |
|----------------------------------------------------|--------------------------------------------------------|
| `POST /api/provisiones/{tipo}/{anio}/mes/{mes}`    | `POST /api/provisiones/tipo/{tipoId}/{anio}/mes/{mes}` |
| `PUT  /api/provisiones/{tipo}/{anio}/mes/{mes}/pago` | `PUT /api/provisiones/tipo/{tipoId}/{anio}/mes/{mes}/pago` |
| `GET  /api/provisiones/{tipo}/{anio}/resumen`      | `GET  /api/provisiones/tipo/{tipoId}/{anio}/resumen`   |

`GET /api/provisiones/{anio}/mes/{mes}` se mantiene igual.

### Forma de los DTOs

```ts
// TipoProvisionDTO
{
  id: number,
  empresaId: number,
  codigo: string,
  nombre: string,
  cuentaEnPatrimonio: boolean,
  activo: boolean,
  fechaCreacion: string  // ISO
}

// ProvisionMensualDTO (nuevo: campos denormalizados de tipo)
{
  id, empresaId, sucursalId,
  tipoId: number,
  tipoCodigo: string,
  tipoNombre: string,
  cuentaEnPatrimonio: boolean,
  anio, mes,
  montoProvisionado, montoAcumuladoPeriodo, montoPagado, saldoPendiente,
  observaciones, fechaCreacion
}

// ResumenProvisionAnualDTO
{
  tipoId: number,
  tipoCodigo: string,
  tipoNombre: string,
  cuentaEnPatrimonio: boolean,
  anio, empresaId,
  totalProvisionado, totalPagado, saldoPendienteTotal,
  detalle: ProvisionMensualDTO[]
}
```

Los campos `tipoCodigo`, `tipoNombre`, `cuentaEnPatrimonio` van denormalizados
en la respuesta para evitar joins extra del lado del cliente.

## 4. Posición Patrimonial

Agregar al cálculo y al DTO el nuevo campo:

```ts
// PosicionPatrimonialDTO
{
  ...,
  cuentasXPagarPesos: number,
  provisionesRRHHPesos: number,   // ← NUEVO
  totalPasivosPesos: number,
  ...
}
```

### Regla de cálculo

```
provisionesRRHHPesos =
  Σ saldoPendiente de provisiones_mensuales
    WHERE tipo.cuentaEnPatrimonio = TRUE
      AND empresaId = <empresa actual>
      AND (sucursalId = <filtro> OR sucursalId IS NULL si aplica el alcance)

totalPasivosPesos = cuentasXPagarPesos + provisionesRRHHPesos
patrimonioNetoPesos = totalActivosPesos - totalPasivosPesos
```

El filtro `cuentaEnPatrimonio` se aplica **en el backend** — el frontend
no decide qué incluir.

## 5. Orden de despliegue

1. Migración SQL: crear `tipos_provision`, sembrar, agregar `tipo_id` en `provisiones_mensuales`, backfill, drop `tipo`.
2. Endpoints `/api/tipos-provision` (CRUD).
3. Endpoints `/api/provisiones/tipo/{tipoId}/...` (rename + denormalización en respuestas).
4. Endpoint posición patrimonial: incluir `provisionesRRHHPesos` y sumarlo a `totalPasivosPesos`.
5. Mergear este branch del frontend.
