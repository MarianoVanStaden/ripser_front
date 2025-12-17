# 📋 REQUERIMIENTOS BACKEND - Sistema de Logística Multi-Depósito

## 🎯 OBJETIVO
Implementar un sistema completo de gestión de stock y equipos por depósito con trazabilidad total de movimientos.

---

## 📦 1. MODELO DE DATOS

### 1.1. Nuevas Tablas

#### **Tabla: `distribucion_deposito_compra`**
```sql
CREATE TABLE distribucion_deposito_compra (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    detalle_compra_id BIGINT NOT NULL,
    deposito_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    cantidad_recibida INT DEFAULT 0,
    cantidad_pendiente INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detalle_compra_id) REFERENCES detalle_compra(id) ON DELETE CASCADE,
    FOREIGN KEY (deposito_id) REFERENCES deposito(id),
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_recibida_menor_igual CHECK (cantidad_recibida <= cantidad)
);

CREATE INDEX idx_distribucion_detalle ON distribucion_deposito_compra(detalle_compra_id);
CREATE INDEX idx_distribucion_deposito ON distribucion_deposito_compra(deposito_id);
```

#### **Tabla: `transferencia_deposito`**
```sql
CREATE TABLE transferencia_deposito (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) UNIQUE NOT NULL,
    empresa_id BIGINT NOT NULL,
    deposito_origen_id BIGINT NOT NULL,
    deposito_destino_id BIGINT NOT NULL,
    fecha_transferencia TIMESTAMP NOT NULL,
    fecha_recepcion TIMESTAMP,
    estado VARCHAR(20) NOT NULL, -- PENDIENTE, EN_TRANSITO, RECIBIDA, CANCELADA
    observaciones TEXT,
    usuario_solicitud_id BIGINT NOT NULL,
    usuario_recepcion_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    FOREIGN KEY (deposito_origen_id) REFERENCES deposito(id),
    FOREIGN KEY (deposito_destino_id) REFERENCES deposito(id),
    FOREIGN KEY (usuario_solicitud_id) REFERENCES usuario(id),
    FOREIGN KEY (usuario_recepcion_id) REFERENCES usuario(id),
    CONSTRAINT chk_depositos_diferentes CHECK (deposito_origen_id != deposito_destino_id)
);

CREATE INDEX idx_transferencia_empresa ON transferencia_deposito(empresa_id);
CREATE INDEX idx_transferencia_origen ON transferencia_deposito(deposito_origen_id);
CREATE INDEX idx_transferencia_destino ON transferencia_deposito(deposito_destino_id);
CREATE INDEX idx_transferencia_estado ON transferencia_deposito(estado);
```

#### **Tabla: `transferencia_item`**
```sql
CREATE TABLE transferencia_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transferencia_id BIGINT NOT NULL,
    producto_id BIGINT,
    equipo_fabricado_id BIGINT,
    cantidad_solicitada INT NOT NULL,
    cantidad_recibida INT DEFAULT 0,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transferencia_id) REFERENCES transferencia_deposito(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    FOREIGN KEY (equipo_fabricado_id) REFERENCES equipo_fabricado(id),
    CONSTRAINT chk_item_tipo CHECK (
        (producto_id IS NOT NULL AND equipo_fabricado_id IS NULL) OR
        (producto_id IS NULL AND equipo_fabricado_id IS NOT NULL)
    ),
    CONSTRAINT chk_cantidad_transferencia CHECK (cantidad_solicitada > 0)
);

CREATE INDEX idx_transferencia_item ON transferencia_item(transferencia_id);
```

#### **Tabla: `auditoria_movimiento`**
```sql
CREATE TABLE auditoria_movimiento (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa_id BIGINT NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- PRODUCTO, EQUIPO
    producto_id BIGINT,
    producto_nombre VARCHAR(255),
    producto_codigo VARCHAR(100),
    equipo_fabricado_id BIGINT,
    equipo_numero VARCHAR(100),
    tipo_movimiento VARCHAR(50) NOT NULL, -- INGRESO, EGRESO, TRANSFERENCIA, AJUSTE, CONSUMO
    deposito_origen_id BIGINT,
    deposito_origen_nombre VARCHAR(255),
    deposito_destino_id BIGINT,
    deposito_destino_nombre VARCHAR(255),
    cantidad INT,
    documento_referencia VARCHAR(100),
    compra_id BIGINT,
    transferencia_id BIGINT,
    venta_id BIGINT,
    motivo TEXT,
    observaciones TEXT,
    usuario_id BIGINT,
    usuario_nombre VARCHAR(255),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    FOREIGN KEY (equipo_fabricado_id) REFERENCES equipo_fabricado(id),
    FOREIGN KEY (deposito_origen_id) REFERENCES deposito(id),
    FOREIGN KEY (deposito_destino_id) REFERENCES deposito(id),
    FOREIGN KEY (compra_id) REFERENCES compra(id),
    FOREIGN KEY (transferencia_id) REFERENCES transferencia_deposito(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE INDEX idx_auditoria_empresa ON auditoria_movimiento(empresa_id);
CREATE INDEX idx_auditoria_tipo ON auditoria_movimiento(tipo);
CREATE INDEX idx_auditoria_tipo_movimiento ON auditoria_movimiento(tipo_movimiento);
CREATE INDEX idx_auditoria_fecha ON auditoria_movimiento(fecha_movimiento);
CREATE INDEX idx_auditoria_producto ON auditoria_movimiento(producto_id);
CREATE INDEX idx_auditoria_equipo ON auditoria_movimiento(equipo_fabricado_id);
CREATE INDEX idx_auditoria_deposito_origen ON auditoria_movimiento(deposito_origen_id);
CREATE INDEX idx_auditoria_deposito_destino ON auditoria_movimiento(deposito_destino_id);
```

#### **Tabla: `recepcion_compra`**
```sql
CREATE TABLE recepcion_compra (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    compra_id BIGINT NOT NULL,
    detalle_compra_id BIGINT NOT NULL,
    deposito_id BIGINT NOT NULL,
    cantidad_recibida INT NOT NULL,
    fecha_recepcion TIMESTAMP NOT NULL,
    usuario_recepcion_id BIGINT NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compra(id),
    FOREIGN KEY (detalle_compra_id) REFERENCES detalle_compra(id),
    FOREIGN KEY (deposito_id) REFERENCES deposito(id),
    FOREIGN KEY (usuario_recepcion_id) REFERENCES usuario(id)
);

CREATE INDEX idx_recepcion_compra ON recepcion_compra(compra_id);
CREATE INDEX idx_recepcion_detalle ON recepcion_compra(detalle_compra_id);
CREATE INDEX idx_recepcion_deposito ON recepcion_compra(deposito_id);
```

### 1.2. Modificaciones a Tablas Existentes

#### **Tabla: `compra`**
```sql
ALTER TABLE compra
ADD COLUMN requiere_distribucion BOOLEAN DEFAULT TRUE,
ADD COLUMN distribucion_completa BOOLEAN DEFAULT FALSE;
```

#### **Tabla: `stock_deposito`**
```sql
-- Agregar índices para optimizar consultas
CREATE INDEX idx_stock_producto_deposito ON stock_deposito(producto_id, deposito_id);
CREATE INDEX idx_stock_bajo_minimo ON stock_deposito(bajo_minimo);
```

---

## 🔧 2. ENDPOINTS REQUERIDOS

### 2.1. Compras con Distribución

#### **POST** `/api/compras` (MODIFICAR EXISTENTE)
Agregar soporte para distribución por depósito.

**Request Body:**
```json
{
  "proveedorId": 1,
  "fechaEntrega": "2024-12-31",
  "observaciones": "Compra urgente",
  "metodoPago": "TRANSFERENCIA_BANCARIA",
  "detalles": [
    {
      "productoId": 10,
      "cantidad": 100,
      "costoUnitario": 50.0,
      "distribucionDepositos": [
        {
          "depositoId": 1,
          "cantidad": 60
        },
        {
          "depositoId": 2,
          "cantidad": 40
        }
      ]
    }
  ]
}
```

**Validaciones:**
- ✅ La suma de cantidades en `distribucionDepositos` debe ser igual a `cantidad`
- ✅ Todos los depósitos deben existir y estar activos
- ✅ Si no se especifica distribución, asignar al depósito principal

**Response:** `CompraDTO` con distribución incluida

---

#### **POST** `/api/compras/{compraId}/recibir`
Registrar recepción de compra con distribución por depósito.

**Request Body:**
```json
{
  "fechaRecepcion": "2024-12-20T10:30:00",
  "recepciones": [
    {
      "detalleCompraId": 123,
      "depositoId": 1,
      "cantidadRecibida": 60,
      "esRecepcionParcial": false
    },
    {
      "detalleCompraId": 123,
      "depositoId": 2,
      "cantidadRecibida": 40,
      "esRecepcionParcial": false
    }
  ],
  "observaciones": "Recepción completa sin novedades"
}
```

**Proceso:**
1. Validar que las cantidades recibidas coincidan con la distribución planificada
2. Actualizar `stock_deposito` para cada depósito
3. Crear registros en `recepcion_compra`
4. Crear movimientos en `auditoria_movimiento` tipo `INGRESO`
5. Sincronizar `producto.stockActual` (suma de todos los depósitos)
6. Actualizar estado de compra a `RECIBIDA` o `PARCIAL_RECIBIDA`

**Response:**
```json
{
  "success": true,
  "message": "Compra recibida correctamente",
  "movimientosCreados": 2
}
```

---

#### **POST** `/api/compras/{compraId}/recibir-parcial`
Registrar recepción parcial.

Similar al endpoint anterior pero permite recibir menos cantidad de la planificada.

---

### 2.2. Transferencias entre Depósitos

#### **GET** `/api/transferencias`
Obtener todas las transferencias.

**Query Params:**
- `empresaId` (opcional)
- `estado` (opcional): PENDIENTE, EN_TRANSITO, RECIBIDA, CANCELADA
- `depositoOrigenId` (opcional)
- `depositoDestinoId` (opcional)
- `fechaDesde` (opcional)
- `fechaHasta` (opcional)

**Response:** `TransferenciaDepositoDTO[]`

---

#### **GET** `/api/transferencias/{id}`
Obtener detalle de una transferencia.

**Response:**
```json
{
  "id": 1,
  "numero": "TRANS-00001",
  "empresaId": 1,
  "depositoOrigenId": 1,
  "depositoOrigenNombre": "Depósito Central",
  "depositoDestinoId": 2,
  "depositoDestinoNombre": "Depósito Sucursal A",
  "fechaTransferencia": "2024-12-20T10:00:00",
  "fechaRecepcion": null,
  "estado": "EN_TRANSITO",
  "items": [
    {
      "id": 1,
      "productoId": 10,
      "productoNombre": "Producto A",
      "productoCodigo": "PROD-A",
      "cantidadSolicitada": 50,
      "cantidadRecibida": 0,
      "observaciones": null
    }
  ],
  "observaciones": "Transferencia urgente",
  "usuarioSolicitudId": 5,
  "usuarioSolicitudNombre": "Juan Pérez",
  "usuarioRecepcionId": null,
  "usuarioRecepcionNombre": null,
  "fechaCreacion": "2024-12-20T09:30:00",
  "fechaActualizacion": "2024-12-20T10:00:00"
}
```

---

#### **POST** `/api/transferencias`
Crear nueva transferencia.

**Request Body:**
```json
{
  "depositoOrigenId": 1,
  "depositoDestinoId": 2,
  "fechaTransferencia": "2024-12-20T10:00:00",
  "items": [
    {
      "productoId": 10,
      "cantidad": 50
    },
    {
      "equipoFabricadoId": 5
    }
  ],
  "observaciones": "Transferencia urgente"
}
```

**Validaciones:**
- ✅ Depósitos origen y destino deben ser diferentes
- ✅ Depósitos deben existir y estar activos
- ✅ Stock suficiente en depósito origen para productos
- ✅ Equipo debe estar en depósito origen

**Response:** `TransferenciaDepositoDTO` creada con estado `PENDIENTE`

---

#### **POST** `/api/transferencias/{id}/enviar`
Confirmar envío de transferencia (cambiar estado a EN_TRANSITO).

**Proceso:**
1. Validar estado actual es `PENDIENTE`
2. Descontar stock del depósito origen
3. Crear movimientos en `auditoria_movimiento` tipo `EGRESO` para origen
4. Cambiar estado a `EN_TRANSITO`

**Response:**
```json
{
  "success": true,
  "message": "Transferencia enviada correctamente",
  "transferenciaId": 1
}
```

---

#### **POST** `/api/transferencias/{id}/recibir`
Confirmar recepción en depósito destino.

**Request Body:**
```json
{
  "fechaRecepcion": "2024-12-21T14:00:00",
  "items": [
    {
      "id": 1,
      "cantidadRecibida": 50,
      "observaciones": "Recibido en perfecto estado"
    }
  ]
}
```

**Proceso:**
1. Validar estado actual es `EN_TRANSITO`
2. Sumar stock al depósito destino
3. Crear movimientos en `auditoria_movimiento` tipo `INGRESO` para destino
4. Actualizar `ubicacion_equipo` para equipos transferidos
5. Cambiar estado a `RECIBIDA`

**Response:**
```json
{
  "success": true,
  "message": "Transferencia recibida correctamente",
  "itemsRecibidos": 1
}
```

---

#### **POST** `/api/transferencias/{id}/cancelar`
Cancelar transferencia.

**Request Body:**
```json
{
  "motivo": "Cancelada por error en solicitud"
}
```

**Validaciones:**
- ✅ Solo se puede cancelar si estado es `PENDIENTE` o `EN_TRANSITO`
- ✅ Si estado es `EN_TRANSITO`, reintegrar stock al depósito origen

**Response:**
```json
{
  "success": true,
  "message": "Transferencia cancelada correctamente"
}
```

---

### 2.3. Auditoría de Movimientos

#### **GET** `/api/auditoria/movimientos`
Obtener historial de movimientos con filtros avanzados.

**Query Params:**
- `empresaId` (requerido)
- `tipo` (opcional): PRODUCTO, EQUIPO
- `tipoMovimiento` (opcional): INGRESO, EGRESO, TRANSFERENCIA, AJUSTE, CONSUMO
- `productoId` (opcional)
- `equipoFabricadoId` (opcional)
- `depositoId` (opcional): filtra por origen O destino
- `depositoOrigenId` (opcional)
- `depositoDestinoId` (opcional)
- `fechaDesde` (opcional): ISO 8601
- `fechaHasta` (opcional): ISO 8601
- `usuarioId` (opcional)
- `documentoReferencia` (opcional): busca por número de documento
- `page` (opcional): número de página (default: 0)
- `size` (opcional): tamaño de página (default: 50)

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "empresaId": 1,
      "tipo": "PRODUCTO",
      "productoId": 10,
      "productoNombre": "Producto A",
      "productoCodigo": "PROD-A",
      "equipoFabricadoId": null,
      "equipoNumero": null,
      "tipoMovimiento": "INGRESO",
      "depositoOrigenId": null,
      "depositoOrigenNombre": null,
      "depositoDestinoId": 1,
      "depositoDestinoNombre": "Depósito Central",
      "cantidad": 60,
      "documentoReferencia": "COMPRA-00123",
      "compraId": 123,
      "transferenciaId": null,
      "ventaId": null,
      "motivo": "Recepción de compra",
      "observaciones": null,
      "usuarioId": 5,
      "usuarioNombre": "Juan Pérez",
      "fechaMovimiento": "2024-12-20T10:35:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 50
  },
  "totalElements": 1,
  "totalPages": 1
}
```

---

#### **GET** `/api/auditoria/movimientos/producto/{productoId}`
Obtener todos los movimientos de un producto específico.

**Query Params:**
- `fechaDesde` (opcional)
- `fechaHasta` (opcional)
- `depositoId` (opcional)

**Response:** Lista de `AuditoriaMovimientoDTO`

---

#### **GET** `/api/auditoria/movimientos/equipo/{equipoFabricadoId}`
Obtener todos los movimientos de un equipo específico.

**Response:** Lista de `AuditoriaMovimientoDTO`

---

#### **GET** `/api/auditoria/movimientos/export/pdf`
Exportar reporte de auditoría en PDF.

**Query Params:** Los mismos que `/api/auditoria/movimientos`

**Response:** Archivo PDF (Content-Type: application/pdf)

---

#### **GET** `/api/auditoria/movimientos/export/excel`
Exportar reporte de auditoría en Excel.

**Query Params:** Los mismos que `/api/auditoria/movimientos`

**Response:** Archivo Excel (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

### 2.4. Stock Global con Discriminación

#### **GET** `/api/stock-deposito/global/{productoId}`
Obtener stock global de un producto con discriminación por depósito.

**Response:**
```json
{
  "productoId": 10,
  "productoNombre": "Producto A",
  "productoCodigo": "PROD-A",
  "stockTotal": 150,
  "stockMinimo": 20,
  "stockPorDeposito": [
    {
      "id": 1,
      "productoId": 10,
      "depositoId": 1,
      "depositoNombre": "Depósito Central",
      "cantidad": 90,
      "stockMinimo": 15,
      "stockMaximo": 200,
      "bajoMinimo": false,
      "sobreMaximo": false
    },
    {
      "id": 2,
      "productoId": 10,
      "depositoId": 2,
      "depositoNombre": "Depósito Sucursal A",
      "cantidad": 60,
      "stockMinimo": 10,
      "stockMaximo": 100,
      "bajoMinimo": false,
      "sobreMaximo": false
    }
  ],
  "bajoMinimo": false,
  "depositosBajoMinimo": []
}
```

---

#### **GET** `/api/stock-deposito/resumen`
Obtener resumen de stock por depósito para todos los productos.

**Query Params:**
- `empresaId` (requerido)
- `depositoId` (opcional): filtrar por depósito específico
- `soloAlertasBajoMinimo` (opcional): boolean

**Response:**
```json
{
  "totalProductos": 50,
  "totalDepositos": 3,
  "alertasBajoMinimo": 5,
  "stockPorDeposito": [
    {
      "depositoId": 1,
      "depositoNombre": "Depósito Central",
      "totalProductos": 30,
      "productosConStock": 28,
      "alertasBajoMinimo": 2,
      "valorTotalStock": 45000.00
    }
  ]
}
```

---

#### **POST** `/api/stock-deposito/transferir` (ACTUALIZAR EXISTENTE)
Agregar metadatos de auditoría.

**Request Body:**
```json
{
  "productoId": 10,
  "depositoOrigenId": 1,
  "depositoDestinoId": 2,
  "cantidad": 20,
  "observaciones": "Reubicación por necesidad de sucursal",
  "usuarioId": 5
}
```

**Proceso:**
1. Validar stock suficiente en origen
2. Descontar de origen
3. Sumar en destino
4. Crear movimiento en `auditoria_movimiento` tipo `TRANSFERENCIA`
5. Sincronizar stock global

---

### 2.5. Sincronización y Reconciliación

#### **POST** `/api/stock-deposito/sincronizar-global/{productoId}`
Sincronizar stock global de un producto (suma de todos los depósitos).

**Proceso:**
1. Sumar stock de todos los depósitos para el producto
2. Actualizar `producto.stockActual`
3. Devolver resultado de la sincronización

**Response:**
```json
{
  "productoId": 10,
  "stockGlobalAnterior": 145,
  "stockGlobalNuevo": 150,
  "diferencia": 5,
  "sincronizado": true
}
```

---

#### **POST** `/api/stock-deposito/reconciliar`
Proceso de reconciliación masiva (ejecutar periódicamente vía cron job).

**Proceso:**
1. Para cada producto en la empresa
2. Sumar stock de todos los depósitos
3. Comparar con `producto.stockActual`
4. Si hay diferencia, crear log de inconsistencia
5. Corregir automáticamente si `autoFix=true`

**Query Params:**
- `empresaId` (requerido)
- `autoFix` (opcional): boolean, default false

**Response:**
```json
{
  "totalProductosRevisados": 50,
  "inconsistenciasEncontradas": 2,
  "inconsistenciasCorregidas": 2,
  "productos": [
    {
      "productoId": 10,
      "productoNombre": "Producto A",
      "stockGlobal": 150,
      "stockSumaDepositos": 150,
      "diferencia": 0,
      "corregido": false
    },
    {
      "productoId": 11,
      "productoNombre": "Producto B",
      "stockGlobal": 100,
      "stockSumaDepositos": 95,
      "diferencia": 5,
      "corregido": true
    }
  ]
}
```

---

## 🔒 3. VALIDACIONES Y REGLAS DE NEGOCIO

### 3.1. Validaciones en Compras

```java
@Service
public class CompraValidator {

    public void validarDistribucion(List<DetalleCompraDTO> detalles) {
        for (DetalleCompraDTO detalle : detalles) {
            int cantidadTotal = detalle.getCantidad();
            int cantidadDistribuida = detalle.getDistribucionDepositos()
                .stream()
                .mapToInt(DistribucionDepositoDTO::getCantidad)
                .sum();

            if (cantidadDistribuida != cantidadTotal) {
                throw new ValidationException(
                    String.format(
                        "La distribución del producto %s debe sumar %d, pero suma %d",
                        detalle.getProductoNombre(),
                        cantidadTotal,
                        cantidadDistribuida
                    )
                );
            }

            // Validar depósitos existen y están activos
            for (DistribucionDepositoDTO dist : detalle.getDistribucionDepositos()) {
                Deposito deposito = depositoRepository.findById(dist.getDepositoId())
                    .orElseThrow(() -> new EntityNotFoundException(
                        "Depósito no encontrado: " + dist.getDepositoId()
                    ));

                if (!deposito.isActivo()) {
                    throw new ValidationException(
                        "El depósito " + deposito.getNombre() + " está inactivo"
                    );
                }
            }
        }
    }
}
```

### 3.2. Validaciones en Transferencias

```java
@Service
public class TransferenciaValidator {

    public void validarTransferencia(TransferenciaDepositoDTO dto) {
        // 1. Depósitos diferentes
        if (dto.getDepositoOrigenId().equals(dto.getDepositoDestinoId())) {
            throw new ValidationException(
                "El depósito origen y destino deben ser diferentes"
            );
        }

        // 2. Depósitos existen y activos
        Deposito origen = validarDeposito(dto.getDepositoOrigenId());
        Deposito destino = validarDeposito(dto.getDepositoDestinoId());

        // 3. Mismo empresa
        if (!origen.getEmpresaId().equals(destino.getEmpresaId())) {
            throw new ValidationException(
                "No se puede transferir entre depósitos de diferentes empresas"
            );
        }

        // 4. Stock suficiente para productos
        for (TransferenciaItemDTO item : dto.getItems()) {
            if (item.getProductoId() != null) {
                StockDeposito stock = stockDepositoRepository
                    .findByProductoIdAndDepositoId(
                        item.getProductoId(),
                        dto.getDepositoOrigenId()
                    )
                    .orElseThrow(() -> new ValidationException(
                        "No hay stock del producto en el depósito origen"
                    ));

                if (stock.getCantidad() < item.getCantidadSolicitada()) {
                    throw new ValidationException(
                        String.format(
                            "Stock insuficiente. Disponible: %d, Solicitado: %d",
                            stock.getCantidad(),
                            item.getCantidadSolicitada()
                        )
                    );
                }
            }
        }

        // 5. Equipo está en depósito origen
        for (TransferenciaItemDTO item : dto.getItems()) {
            if (item.getEquipoFabricadoId() != null) {
                UbicacionEquipo ubicacion = ubicacionEquipoRepository
                    .findByEquipoFabricadoId(item.getEquipoFabricadoId())
                    .orElseThrow(() -> new ValidationException(
                        "El equipo no tiene ubicación asignada"
                    ));

                if (!ubicacion.getDepositoId().equals(dto.getDepositoOrigenId())) {
                    throw new ValidationException(
                        "El equipo no está en el depósito origen"
                    );
                }
            }
        }
    }

    private Deposito validarDeposito(Long depositoId) {
        Deposito deposito = depositoRepository.findById(depositoId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Depósito no encontrado: " + depositoId
            ));

        if (!deposito.isActivo()) {
            throw new ValidationException(
                "El depósito " + deposito.getNombre() + " está inactivo"
            );
        }

        return deposito;
    }
}
```

### 3.3. Transacciones

**IMPORTANTE:** Todas las operaciones que afecten stock deben ser transaccionales y atómicas.

```java
@Service
@Transactional
public class StockService {

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void recibirCompra(RecepcionCompraDTO dto) {
        try {
            // 1. Validar compra existe
            Compra compra = compraRepository.findById(dto.getCompraId())
                .orElseThrow(() -> new EntityNotFoundException("Compra no encontrada"));

            // 2. Procesar cada recepción
            for (RecepcionItemDTO item : dto.getRecepciones()) {
                // 2.1. Actualizar o crear stock_deposito
                StockDeposito stock = stockDepositoRepository
                    .findByProductoIdAndDepositoId(item.getProductoId(), item.getDepositoId())
                    .orElseGet(() -> crearNuevoStockDeposito(item.getProductoId(), item.getDepositoId()));

                stock.setCantidad(stock.getCantidad() + item.getCantidadRecibida());
                stockDepositoRepository.save(stock);

                // 2.2. Crear registro de recepción
                RecepcionCompra recepcion = new RecepcionCompra();
                recepcion.setCompraId(dto.getCompraId());
                recepcion.setDetalleCompraId(item.getDetalleCompraId());
                recepcion.setDepositoId(item.getDepositoId());
                recepcion.setCantidadRecibida(item.getCantidadRecibida());
                recepcion.setFechaRecepcion(dto.getFechaRecepcion());
                recepcionCompraRepository.save(recepcion);

                // 2.3. Registrar en auditoría
                auditoriaService.registrarMovimiento(
                    AuditoriaMovimientoDTO.builder()
                        .tipo("PRODUCTO")
                        .productoId(item.getProductoId())
                        .tipoMovimiento("INGRESO")
                        .depositoDestinoId(item.getDepositoId())
                        .cantidad(item.getCantidadRecibida())
                        .documentoReferencia("COMPRA-" + compra.getNumero())
                        .compraId(compra.getId())
                        .usuarioId(getCurrentUserId())
                        .build()
                );
            }

            // 3. Sincronizar stock global
            Set<Long> productosAfectados = dto.getRecepciones()
                .stream()
                .map(RecepcionItemDTO::getProductoId)
                .collect(Collectors.toSet());

            for (Long productoId : productosAfectados) {
                sincronizarStockGlobal(productoId);
            }

            // 4. Actualizar estado de compra
            actualizarEstadoCompra(compra);

        } catch (Exception e) {
            // La transacción se revertirá automáticamente
            log.error("Error al recibir compra", e);
            throw e;
        }
    }

    private void sincronizarStockGlobal(Long productoId) {
        int stockTotal = stockDepositoRepository
            .findByProductoId(productoId)
            .stream()
            .mapToInt(StockDeposito::getCantidad)
            .sum();

        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        producto.setStockActual(stockTotal);
        productoRepository.save(producto);
    }
}
```

---

## 📊 4. DTOS REQUERIDOS

### 4.1. DTOs de Compra

```java
@Data
@Builder
public class DistribucionDepositoDTO {
    private Long id;
    private Long depositoId;
    private String depositoNombre;
    private Integer cantidad;
    private Integer cantidadRecibida;
    private Integer cantidadPendiente;
}

@Data
@Builder
public class DetalleCompraConDistribucionDTO {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoCodigo;
    private Integer cantidad;
    private BigDecimal costoUnitario;
    private BigDecimal subtotal;
    private List<DistribucionDepositoDTO> distribucionDepositos;

    // Campos para productos nuevos
    private String nombreProductoTemporal;
    private String descripcionProductoTemporal;
    private String codigoProductoTemporal;
    private Long categoriaProductoId;
    private Boolean esProductoNuevo;
}

@Data
@Builder
public class RecepcionCompraDTO {
    private Long compraId;
    private LocalDateTime fechaRecepcion;
    private List<RecepcionItemDTO> recepciones;
    private String observaciones;
    private Long usuarioRecepcionId;
}

@Data
@Builder
public class RecepcionItemDTO {
    private Long detalleCompraId;
    private Long productoId;
    private Long depositoId;
    private Integer cantidadRecibida;
    private Boolean esRecepcionParcial;
    private String observaciones;
}
```

### 4.2. DTOs de Transferencia

```java
@Data
@Builder
public class TransferenciaDepositoDTO {
    private Long id;
    private String numero;
    private Long empresaId;
    private Long depositoOrigenId;
    private String depositoOrigenNombre;
    private Long depositoDestinoId;
    private String depositoDestinoNombre;
    private LocalDateTime fechaTransferencia;
    private LocalDateTime fechaRecepcion;
    private EstadoTransferencia estado;
    private List<TransferenciaItemDTO> items;
    private String observaciones;
    private Long usuarioSolicitudId;
    private String usuarioSolicitudNombre;
    private Long usuarioRecepcionId;
    private String usuarioRecepcionNombre;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}

@Data
@Builder
public class TransferenciaItemDTO {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoCodigo;
    private Long equipoFabricadoId;
    private String equipoNumero;
    private Integer cantidadSolicitada;
    private Integer cantidadRecibida;
    private String observaciones;
}

@Data
@Builder
public class ConfirmarRecepcionDTO {
    private Long transferenciaId;
    private LocalDateTime fechaRecepcion;
    private List<ItemRecepcionDTO> items;
    private Long usuarioRecepcionId;
}

@Data
@Builder
public class ItemRecepcionDTO {
    private Long id; // ID del TransferenciaItem
    private Integer cantidadRecibida;
    private String observaciones;
}

public enum EstadoTransferencia {
    PENDIENTE,
    EN_TRANSITO,
    RECIBIDA,
    CANCELADA
}
```

### 4.3. DTOs de Auditoría

```java
@Data
@Builder
public class AuditoriaMovimientoDTO {
    private Long id;
    private Long empresaId;
    private String tipo; // PRODUCTO, EQUIPO
    private Long productoId;
    private String productoNombre;
    private String productoCodigo;
    private Long equipoFabricadoId;
    private String equipoNumero;
    private String tipoMovimiento; // INGRESO, EGRESO, TRANSFERENCIA, AJUSTE, CONSUMO
    private Long depositoOrigenId;
    private String depositoOrigenNombre;
    private Long depositoDestinoId;
    private String depositoDestinoNombre;
    private Integer cantidad;
    private String documentoReferencia;
    private Long compraId;
    private Long transferenciaId;
    private Long ventaId;
    private String motivo;
    private String observaciones;
    private Long usuarioId;
    private String usuarioNombre;
    private LocalDateTime fechaMovimiento;
}

@Data
@Builder
public class ResumenStockDepositoDTO {
    private Integer totalProductos;
    private Integer totalDepositos;
    private Integer alertasBajoMinimo;
    private List<ResumenDepositoDTO> stockPorDeposito;
}

@Data
@Builder
public class ResumenDepositoDTO {
    private Long depositoId;
    private String depositoNombre;
    private Integer totalProductos;
    private Integer productosConStock;
    private Integer alertasBajoMinimo;
    private BigDecimal valorTotalStock;
}

@Data
@Builder
public class StockGlobalProductoDTO {
    private Long productoId;
    private String productoNombre;
    private String productoCodigo;
    private Integer stockTotal;
    private Integer stockMinimo;
    private List<StockDepositoDTO> stockPorDeposito;
    private Boolean bajoMinimo;
    private List<String> depositosBajoMinimo;
}
```

---

## 🔄 5. SERVICIOS Y LÓGICA DE NEGOCIO

### 5.1. AuditoriaService

```java
@Service
@Transactional
public class AuditoriaService {

    @Autowired
    private AuditoriaMovimientoRepository auditoriaRepository;

    @Autowired
    private DepositoRepository depositoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EquipoFabricadoRepository equipoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public AuditoriaMovimiento registrarMovimiento(AuditoriaMovimientoDTO dto) {
        AuditoriaMovimiento auditoria = new AuditoriaMovimiento();

        auditoria.setEmpresaId(dto.getEmpresaId());
        auditoria.setTipo(dto.getTipo());
        auditoria.setTipoMovimiento(dto.getTipoMovimiento());
        auditoria.setCantidad(dto.getCantidad());
        auditoria.setDocumentoReferencia(dto.getDocumentoReferencia());
        auditoria.setMotivo(dto.getMotivo());
        auditoria.setObservaciones(dto.getObservaciones());
        auditoria.setFechaMovimiento(
            dto.getFechaMovimiento() != null
                ? dto.getFechaMovimiento()
                : LocalDateTime.now()
        );

        // Producto
        if (dto.getProductoId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoId())
                .orElse(null);
            if (producto != null) {
                auditoria.setProductoId(producto.getId());
                auditoria.setProductoNombre(producto.getNombre());
                auditoria.setProductoCodigo(producto.getCodigo());
            }
        }

        // Equipo
        if (dto.getEquipoFabricadoId() != null) {
            EquipoFabricado equipo = equipoRepository.findById(dto.getEquipoFabricadoId())
                .orElse(null);
            if (equipo != null) {
                auditoria.setEquipoFabricadoId(equipo.getId());
                auditoria.setEquipoNumero(equipo.getNumeroHeladera());
            }
        }

        // Depósitos
        if (dto.getDepositoOrigenId() != null) {
            Deposito deposito = depositoRepository.findById(dto.getDepositoOrigenId())
                .orElse(null);
            if (deposito != null) {
                auditoria.setDepositoOrigenId(deposito.getId());
                auditoria.setDepositoOrigenNombre(deposito.getNombre());
            }
        }

        if (dto.getDepositoDestinoId() != null) {
            Deposito deposito = depositoRepository.findById(dto.getDepositoDestinoId())
                .orElse(null);
            if (deposito != null) {
                auditoria.setDepositoDestinoId(deposito.getId());
                auditoria.setDepositoDestinoNombre(deposito.getNombre());
            }
        }

        // Referencias
        auditoria.setCompraId(dto.getCompraId());
        auditoria.setTransferenciaId(dto.getTransferenciaId());
        auditoria.setVentaId(dto.getVentaId());

        // Usuario
        if (dto.getUsuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElse(null);
            if (usuario != null) {
                auditoria.setUsuarioId(usuario.getId());
                auditoria.setUsuarioNombre(usuario.getNombre() + " " + usuario.getApellido());
            }
        }

        return auditoriaRepository.save(auditoria);
    }

    public Page<AuditoriaMovimiento> buscarMovimientos(
        AuditoriaMovimientoFiltroDTO filtros,
        Pageable pageable
    ) {
        // Implementar búsqueda con Specification o QueryDSL
        // para soportar todos los filtros dinámicos
        return auditoriaRepository.findAll(
            crearSpecification(filtros),
            pageable
        );
    }

    private Specification<AuditoriaMovimiento> crearSpecification(
        AuditoriaMovimientoFiltroDTO filtros
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filtros.getEmpresaId() != null) {
                predicates.add(cb.equal(root.get("empresaId"), filtros.getEmpresaId()));
            }

            if (filtros.getTipo() != null) {
                predicates.add(cb.equal(root.get("tipo"), filtros.getTipo()));
            }

            if (filtros.getTipoMovimiento() != null) {
                predicates.add(cb.equal(root.get("tipoMovimiento"), filtros.getTipoMovimiento()));
            }

            if (filtros.getProductoId() != null) {
                predicates.add(cb.equal(root.get("productoId"), filtros.getProductoId()));
            }

            if (filtros.getEquipoFabricadoId() != null) {
                predicates.add(cb.equal(root.get("equipoFabricadoId"), filtros.getEquipoFabricadoId()));
            }

            if (filtros.getDepositoId() != null) {
                predicates.add(
                    cb.or(
                        cb.equal(root.get("depositoOrigenId"), filtros.getDepositoId()),
                        cb.equal(root.get("depositoDestinoId"), filtros.getDepositoId())
                    )
                );
            }

            if (filtros.getFechaDesde() != null) {
                predicates.add(
                    cb.greaterThanOrEqualTo(root.get("fechaMovimiento"), filtros.getFechaDesde())
                );
            }

            if (filtros.getFechaHasta() != null) {
                predicates.add(
                    cb.lessThanOrEqualTo(root.get("fechaMovimiento"), filtros.getFechaHasta())
                );
            }

            if (filtros.getUsuarioId() != null) {
                predicates.add(cb.equal(root.get("usuarioId"), filtros.getUsuarioId()));
            }

            if (filtros.getDocumentoReferencia() != null) {
                predicates.add(
                    cb.like(
                        cb.lower(root.get("documentoReferencia")),
                        "%" + filtros.getDocumentoReferencia().toLowerCase() + "%"
                    )
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

### 5.2. TransferenciaService

```java
@Service
@Transactional
public class TransferenciaService {

    @Autowired
    private TransferenciaDepositoRepository transferenciaRepository;

    @Autowired
    private TransferenciaItemRepository itemRepository;

    @Autowired
    private StockDepositoRepository stockRepository;

    @Autowired
    private UbicacionEquipoRepository ubicacionEquipoRepository;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private StockService stockService;

    @Autowired
    private TransferenciaValidator validator;

    public TransferenciaDeposito crear(TransferenciaDepositoDTO dto) {
        // Validar
        validator.validarTransferencia(dto);

        // Crear transferencia
        TransferenciaDeposito transferencia = new TransferenciaDeposito();
        transferencia.setNumero(generarNumero());
        transferencia.setEmpresaId(dto.getEmpresaId());
        transferencia.setDepositoOrigenId(dto.getDepositoOrigenId());
        transferencia.setDepositoDestinoId(dto.getDepositoDestinoId());
        transferencia.setFechaTransferencia(dto.getFechaTransferencia());
        transferencia.setEstado(EstadoTransferencia.PENDIENTE);
        transferencia.setObservaciones(dto.getObservaciones());
        transferencia.setUsuarioSolicitudId(dto.getUsuarioSolicitudId());

        transferencia = transferenciaRepository.save(transferencia);

        // Crear items
        for (TransferenciaItemDTO itemDto : dto.getItems()) {
            TransferenciaItem item = new TransferenciaItem();
            item.setTransferenciaId(transferencia.getId());
            item.setProductoId(itemDto.getProductoId());
            item.setEquipoFabricadoId(itemDto.getEquipoFabricadoId());
            item.setCantidadSolicitada(itemDto.getCantidadSolicitada());
            item.setCantidadRecibida(0);
            item.setObservaciones(itemDto.getObservaciones());

            itemRepository.save(item);
        }

        return transferencia;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void confirmarEnvio(Long transferenciaId) {
        TransferenciaDeposito transferencia = transferenciaRepository.findById(transferenciaId)
            .orElseThrow(() -> new EntityNotFoundException("Transferencia no encontrada"));

        if (transferencia.getEstado() != EstadoTransferencia.PENDIENTE) {
            throw new ValidationException(
                "Solo se puede enviar una transferencia en estado PENDIENTE"
            );
        }

        List<TransferenciaItem> items = itemRepository.findByTransferenciaId(transferenciaId);

        for (TransferenciaItem item : items) {
            if (item.getProductoId() != null) {
                // Descontar stock del depósito origen
                StockDeposito stock = stockRepository
                    .findByProductoIdAndDepositoId(
                        item.getProductoId(),
                        transferencia.getDepositoOrigenId()
                    )
                    .orElseThrow(() -> new ValidationException(
                        "No hay stock del producto en depósito origen"
                    ));

                if (stock.getCantidad() < item.getCantidadSolicitada()) {
                    throw new ValidationException(
                        "Stock insuficiente para transferir"
                    );
                }

                stock.setCantidad(stock.getCantidad() - item.getCantidadSolicitada());
                stockRepository.save(stock);

                // Registrar movimiento EGRESO
                auditoriaService.registrarMovimiento(
                    AuditoriaMovimientoDTO.builder()
                        .empresaId(transferencia.getEmpresaId())
                        .tipo("PRODUCTO")
                        .productoId(item.getProductoId())
                        .tipoMovimiento("EGRESO")
                        .depositoOrigenId(transferencia.getDepositoOrigenId())
                        .cantidad(item.getCantidadSolicitada())
                        .documentoReferencia(transferencia.getNumero())
                        .transferenciaId(transferencia.getId())
                        .usuarioId(transferencia.getUsuarioSolicitudId())
                        .build()
                );

                // Sincronizar stock global
                stockService.sincronizarStockGlobal(item.getProductoId());
            }
        }

        transferencia.setEstado(EstadoTransferencia.EN_TRANSITO);
        transferenciaRepository.save(transferencia);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void confirmarRecepcion(ConfirmarRecepcionDTO dto) {
        TransferenciaDeposito transferencia = transferenciaRepository
            .findById(dto.getTransferenciaId())
            .orElseThrow(() -> new EntityNotFoundException("Transferencia no encontrada"));

        if (transferencia.getEstado() != EstadoTransferencia.EN_TRANSITO) {
            throw new ValidationException(
                "Solo se puede recibir una transferencia en estado EN_TRANSITO"
            );
        }

        for (ItemRecepcionDTO itemDto : dto.getItems()) {
            TransferenciaItem item = itemRepository.findById(itemDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Item no encontrado"));

            item.setCantidadRecibida(itemDto.getCantidadRecibida());
            item.setObservaciones(itemDto.getObservaciones());
            itemRepository.save(item);

            if (item.getProductoId() != null) {
                // Sumar stock en depósito destino
                StockDeposito stock = stockRepository
                    .findByProductoIdAndDepositoId(
                        item.getProductoId(),
                        transferencia.getDepositoDestinoId()
                    )
                    .orElseGet(() -> {
                        StockDeposito nuevoStock = new StockDeposito();
                        nuevoStock.setProductoId(item.getProductoId());
                        nuevoStock.setDepositoId(transferencia.getDepositoDestinoId());
                        nuevoStock.setCantidad(0);
                        return nuevoStock;
                    });

                stock.setCantidad(stock.getCantidad() + itemDto.getCantidadRecibida());
                stockRepository.save(stock);

                // Registrar movimiento INGRESO
                auditoriaService.registrarMovimiento(
                    AuditoriaMovimientoDTO.builder()
                        .empresaId(transferencia.getEmpresaId())
                        .tipo("PRODUCTO")
                        .productoId(item.getProductoId())
                        .tipoMovimiento("INGRESO")
                        .depositoDestinoId(transferencia.getDepositoDestinoId())
                        .cantidad(itemDto.getCantidadRecibida())
                        .documentoReferencia(transferencia.getNumero())
                        .transferenciaId(transferencia.getId())
                        .usuarioId(dto.getUsuarioRecepcionId())
                        .build()
                );

                // Sincronizar stock global
                stockService.sincronizarStockGlobal(item.getProductoId());

            } else if (item.getEquipoFabricadoId() != null) {
                // Actualizar ubicación del equipo
                UbicacionEquipo ubicacion = ubicacionEquipoRepository
                    .findByEquipoFabricadoId(item.getEquipoFabricadoId())
                    .orElseThrow(() -> new EntityNotFoundException(
                        "Ubicación del equipo no encontrada"
                    ));

                ubicacion.setDepositoId(transferencia.getDepositoDestinoId());
                ubicacion.setFechaActualizacion(LocalDateTime.now());
                ubicacionEquipoRepository.save(ubicacion);

                // Registrar movimiento de equipo
                auditoriaService.registrarMovimiento(
                    AuditoriaMovimientoDTO.builder()
                        .empresaId(transferencia.getEmpresaId())
                        .tipo("EQUIPO")
                        .equipoFabricadoId(item.getEquipoFabricadoId())
                        .tipoMovimiento("TRANSFERENCIA")
                        .depositoOrigenId(transferencia.getDepositoOrigenId())
                        .depositoDestinoId(transferencia.getDepositoDestinoId())
                        .documentoReferencia(transferencia.getNumero())
                        .transferenciaId(transferencia.getId())
                        .usuarioId(dto.getUsuarioRecepcionId())
                        .build()
                );
            }
        }

        transferencia.setEstado(EstadoTransferencia.RECIBIDA);
        transferencia.setFechaRecepcion(dto.getFechaRecepcion());
        transferencia.setUsuarioRecepcionId(dto.getUsuarioRecepcionId());
        transferenciaRepository.save(transferencia);
    }

    private String generarNumero() {
        // Generar número secuencial: TRANS-00001
        Long count = transferenciaRepository.count();
        return String.format("TRANS-%05d", count + 1);
    }
}
```

---

## ⚙️ 6. CONFIGURACIÓN Y DEPLOYMENT

### 6.1. Properties Requeridas

```properties
# application.properties

# Habilitar transacciones
spring.jpa.properties.hibernate.enable_lazy_load_no_trans=false
spring.jpa.properties.hibernate.jdbc.batch_size=20

# Configuración de pool de conexiones para alta concurrencia
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

# Timeout para transacciones (30 segundos)
spring.transaction.default-timeout=30

# Nivel de aislamiento por defecto
spring.jpa.properties.hibernate.connection.isolation=2
```

### 6.2. Scheduled Jobs

```java
@Component
@EnableScheduling
public class StockReconciliationJob {

    @Autowired
    private StockService stockService;

    @Autowired
    private EmpresaRepository empresaRepository;

    // Ejecutar reconciliación todos los días a las 2 AM
    @Scheduled(cron = "0 0 2 * * *")
    public void reconciliarStockGlobal() {
        log.info("Iniciando reconciliación de stock global");

        List<Empresa> empresas = empresaRepository.findAll();

        for (Empresa empresa : empresas) {
            try {
                stockService.reconciliarStockEmpresa(empresa.getId(), true);
                log.info("Reconciliación completada para empresa: {}", empresa.getId());
            } catch (Exception e) {
                log.error("Error en reconciliación para empresa: {}", empresa.getId(), e);
            }
        }

        log.info("Reconciliación de stock global finalizada");
    }
}
```

---

## 📋 7. TESTING

### 7.1. Tests Unitarios Críticos

```java
@SpringBootTest
@Transactional
public class StockServiceTest {

    @Autowired
    private StockService stockService;

    @Test
    public void testRecibirCompra_debeActualizarStockCorrectamente() {
        // Arrange
        RecepcionCompraDTO dto = crearRecepcionCompraDTO();

        // Act
        stockService.recibirCompra(dto);

        // Assert
        StockDeposito stock = stockRepository.findByProductoIdAndDepositoId(
            dto.getRecepciones().get(0).getProductoId(),
            dto.getRecepciones().get(0).getDepositoId()
        ).orElseThrow();

        assertEquals(60, stock.getCantidad());
    }

    @Test
    public void testTransferencia_debeDescontarYSumarCorrectamente() {
        // Arrange
        TransferenciaDepositoDTO dto = crearTransferenciaDTO();
        Long transferenciaId = transferenciaService.crear(dto).getId();

        // Act
        transferenciaService.confirmarEnvio(transferenciaId);
        transferenciaService.confirmarRecepcion(crearRecepcionDTO(transferenciaId));

        // Assert
        StockDeposito stockOrigen = stockRepository.findByProductoIdAndDepositoId(
            dto.getItems().get(0).getProductoId(),
            dto.getDepositoOrigenId()
        ).orElseThrow();

        StockDeposito stockDestino = stockRepository.findByProductoIdAndDepositoId(
            dto.getItems().get(0).getProductoId(),
            dto.getDepositoDestinoId()
        ).orElseThrow();

        assertEquals(40, stockOrigen.getCantidad()); // 100 - 60
        assertEquals(60, stockDestino.getCantidad()); // 0 + 60
    }

    @Test(expected = ValidationException.class)
    public void testTransferencia_conStockInsuficiente_debeLanzarExcepcion() {
        // Arrange
        TransferenciaDepositoDTO dto = crearTransferenciaConCantidadExcesiva();
        Long transferenciaId = transferenciaService.crear(dto).getId();

        // Act & Assert
        transferenciaService.confirmarEnvio(transferenciaId);
    }
}
```

### 7.2. Tests de Integración

```java
@SpringBootTest
@AutoConfigureMockMvc
public class CompraControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    public void testRecibirCompra_debeRetornar200YActualizarStock() throws Exception {
        // Arrange
        RecepcionCompraDTO dto = crearRecepcionCompraDTO();

        // Act & Assert
        mockMvc.perform(
            post("/api/compras/{compraId}/recibir", dto.getCompraId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.movimientosCreados").value(2));
    }
}
```

---

## 📝 8. DOCUMENTACIÓN SWAGGER

Asegurar que todos los endpoints estén documentados con Swagger/OpenAPI.

```java
@RestController
@RequestMapping("/api/compras")
@Tag(name = "Compras", description = "API para gestión de compras con distribución por depósito")
public class CompraController {

    @Operation(
        summary = "Recibir compra",
        description = "Registra la recepción de una compra con distribución por depósito y actualiza el stock"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Compra recibida correctamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Compra no encontrada"),
        @ApiResponse(responseCode = "409", description = "Conflicto en cantidades")
    })
    @PostMapping("/{compraId}/recibir")
    public ResponseEntity<RecepcionResponseDTO> recibirCompra(
        @PathVariable Long compraId,
        @Valid @RequestBody RecepcionCompraDTO dto
    ) {
        // Implementation
    }
}
```

---

## ⏱️ 9. ESTIMACIÓN DE ESFUERZO

| Tarea | Esfuerzo (días) | Prioridad |
|-------|-----------------|-----------|
| Crear tablas y migraciones | 1 | Alta |
| Implementar entidades JPA | 1 | Alta |
| Crear DTOs | 0.5 | Alta |
| Implementar AuditoriaService | 1 | Alta |
| Implementar CompraService (recepción) | 2 | Alta |
| Implementar TransferenciaService | 3 | Alta |
| Implementar endpoints de Compra | 1 | Alta |
| Implementar endpoints de Transferencia | 2 | Alta |
| Implementar endpoints de Auditoría | 1.5 | Media |
| Validadores y reglas de negocio | 2 | Alta |
| Tests unitarios | 3 | Media |
| Tests de integración | 2 | Media |
| Documentación Swagger | 0.5 | Media |
| Scheduled jobs (reconciliación) | 1 | Media |
| **TOTAL** | **21.5 días** | |

---

## 🚀 10. PLAN DE IMPLEMENTACIÓN RECOMENDADO

### Sprint 1 (1 semana)
- ✅ Crear estructura de base de datos
- ✅ Implementar entidades y DTOs
- ✅ Implementar AuditoriaService
- ✅ Implementar validadores básicos

### Sprint 2 (1 semana)
- ✅ Implementar CompraService con recepción
- ✅ Endpoints de compra con distribución
- ✅ Tests unitarios de compras

### Sprint 3 (1.5 semanas)
- ✅ Implementar TransferenciaService completo
- ✅ Endpoints de transferencias
- ✅ Tests unitarios de transferencias

### Sprint 4 (1 semana)
- ✅ Implementar endpoints de auditoría
- ✅ Scheduled jobs
- ✅ Tests de integración
- ✅ Documentación Swagger

---

## 📞 CONTACTO Y SOPORTE

Para cualquier duda o aclaración sobre estos requerimientos, contactar al equipo de frontend.

**Importante:** Mantener comunicación constante durante la implementación para ajustar detalles según sea necesario.
