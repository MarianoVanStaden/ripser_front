# 🐛 BUG CRÍTICO: Error al Convertir Nota de Pedido a Factura - `empresa_id` null

**Fecha:** 2 de Diciembre, 2025
**Prioridad:** 🔴 ALTA
**Estado:** Requiere corrección en BACKEND

---

## 📋 Problema

Al intentar convertir una Nota de Pedido a Factura **con equipos asignados**, el backend intenta actualizar la tabla `documentos_comerciales` pero falla con un error de constraint porque el campo `empresa_id` es `null`.

### Evidencia:

#### Error del Backend:
```
Column 'empresa_id' cannot be null
could not execute statement [Column 'empresa_id' cannot be null]
[update documentos_comerciales set empresa_id=?,opcion_financiamiento_seleccionada_id=? where id=?]
```

#### Logs del Frontend:
```javascript
🔍 AsignarEquiposDialog - Asignaciones a enviar:
  - Detalle ID 296 (Heladera 1):
    Cantidad requerida: 2
    Equipos seleccionados (2): [98, 99]

POST http://localhost:5173/api/documentos/factura 500 (Internal Server Error)

ERROR: Column 'empresa_id' cannot be null

❌ Server error: {
  message: 'Error interno: could not execute statement [Column 'empresa_id' cannot be null]
  [update documentos_comerciales set empresa_id=?,opcion_financiamiento_seleccionada_id=? where id=?]',
  status: 500
}
```

---

## 🎯 Endpoint Afectado

### ❌ Endpoint con problema:
- **`POST /api/documentos/factura`** (conversión de Nota de Pedido a Factura)
- **Request Body:**
  ```typescript
  {
    notaPedidoId: number;
    descuento?: number;
    equiposAsignaciones?: { [detalleId: number]: number[] };
  }
  ```
- **Ejemplo:**
  ```json
  {
    "notaPedidoId": 123,
    "descuento": 0,
    "equiposAsignaciones": {
      "296": [98, 99]
    }
  }
  ```
- **Problema:** Backend intenta hacer `UPDATE documentos_comerciales SET empresa_id=?, ...` con `empresa_id = null`

---

## 🔍 Causa Probable

El problema ocurre durante la conversión de Nota de Pedido a Factura cuando hay **equipos asignados**. El backend está intentando actualizar el documento pero el campo `empresa_id` no está siendo seteado correctamente.

### Posibles causas en el código backend:

#### 1. **No se copia el `empresa_id` desde la Nota de Pedido**

```java
// ❌ INCORRECTO: No se copia empresa_id al crear factura
public DocumentoComercial convertirNotaPedidoAFactura(ConvertToFacturaDTO dto) {
    NotaPedido notaPedido = findById(dto.getNotaPedidoId());

    Factura factura = new Factura();
    factura.setNumeroDocumento(generarNumeroFactura());
    factura.setClienteId(notaPedido.getClienteId());
    factura.setUsuarioId(notaPedido.getUsuarioId());
    // ❌ FALTA: factura.setEmpresaId(notaPedido.getEmpresaId());
    factura.setEstado(EstadoDocumento.EMITIDO);

    // Si se asignan equipos...
    if (dto.getEquiposAsignaciones() != null) {
        asignarEquipos(factura, dto.getEquiposAsignaciones());
    }

    return documentoRepository.save(factura);
}
```

#### 2. **No se lee el `empresa_id` del header o JWT**

```java
// ❌ INCORRECTO: No se usa el header X-Empresa-Id
@PostMapping("/factura")
public ResponseEntity<DocumentoComercialDTO> convertToFactura(
    @RequestBody ConvertToFacturaDTO dto
    // ❌ FALTA: @RequestHeader("X-Empresa-Id") Long empresaId
) {
    DocumentoComercial factura = documentoService.convertirAFactura(dto);
    return ResponseEntity.ok(toDTO(factura));
}
```

#### 3. **Transacción corrupta al asignar equipos**

```java
// ❌ INCORRECTO: Se pierden datos al hacer flush en transacción
@Transactional
public void asignarEquipos(Factura factura, Map<Long, List<Long>> equiposAsignaciones) {
    for (Map.Entry<Long, List<Long>> entry : equiposAsignaciones.entrySet()) {
        Long detalleId = entry.getKey();
        List<Long> equipoIds = entry.getValue();

        for (Long equipoId : equipoIds) {
            EquipoFabricado equipo = equipoRepository.findById(equipoId).orElseThrow();
            equipo.setDocumentoId(factura.getId());
            equipo.setEstadoAsignacion(EstadoAsignacionEquipo.FACTURADO);
            equipoRepository.save(equipo);
        }
    }

    // ❌ PROBLEMA: Si aquí se hace flush, puede perderse el empresa_id de factura
    entityManager.flush();

    // Intentar actualizar factura DESPUÉS puede causar que empresa_id sea null
    factura.setOpcionFinanciamientoSeleccionadaId(opcionId);
    documentoRepository.save(factura);  // ❌ Aquí falla con empresa_id = null
}
```

---

## ✅ Solución en Backend

### Opción 1: Copiar empresa_id de la Nota de Pedido (RECOMENDADO)

```java
@Service
public class DocumentoService {

    @Transactional
    public DocumentoComercial convertirNotaPedidoAFactura(
        ConvertToFacturaDTO dto,
        @RequestHeader("X-Empresa-Id") Long empresaId  // ✅ Recibir del header
    ) {
        NotaPedido notaPedido = findNotaPedidoById(dto.getNotaPedidoId());

        // Validar que la nota de pedido pertenece a la empresa
        if (!notaPedido.getEmpresaId().equals(empresaId)) {
            throw new ForbiddenException("No tiene permisos sobre esta nota de pedido");
        }

        // ✅ Crear factura CON empresa_id
        Factura factura = new Factura();
        factura.setTipoDocumento(TipoDocumento.FACTURA);
        factura.setNumeroDocumento(generarNumeroFactura(empresaId));
        factura.setClienteId(notaPedido.getClienteId());
        factura.setUsuarioId(notaPedido.getUsuarioId());
        factura.setEmpresaId(empresaId);  // ✅ IMPORTANTE: Setear empresa_id
        factura.setEstado(EstadoDocumento.EMITIDO);
        factura.setFechaEmision(LocalDateTime.now());
        factura.setMontoTotal(notaPedido.getMontoTotal());
        factura.setTipoIva(notaPedido.getTipoIva());

        // Copiar detalles
        for (DetalleDocumento detalle : notaPedido.getDetalles()) {
            DetalleDocumento nuevoDetalle = new DetalleDocumento();
            nuevoDetalle.setDocumento(factura);
            nuevoDetalle.setTipoItem(detalle.getTipoItem());
            nuevoDetalle.setRecetaId(detalle.getRecetaId());
            nuevoDetalle.setCantidad(detalle.getCantidad());
            nuevoDetalle.setPrecioUnitario(detalle.getPrecioUnitario());
            nuevoDetalle.setSubtotal(detalle.getSubtotal());
            factura.getDetalles().add(nuevoDetalle);
        }

        // ✅ Guardar ANTES de asignar equipos
        factura = documentoRepository.save(factura);

        // Asignar equipos si los hay
        if (dto.getEquiposAsignaciones() != null && !dto.getEquiposAsignaciones().isEmpty()) {
            asignarEquiposAFactura(factura.getId(), dto.getEquiposAsignaciones());
        }

        // Actualizar estado de nota de pedido
        notaPedido.setEstado(EstadoDocumento.FACTURADO);
        notaPedidoRepository.save(notaPedido);

        return factura;
    }

    @Transactional
    private void asignarEquiposAFactura(Long facturaId, Map<Long, List<Long>> equiposAsignaciones) {
        Factura factura = documentoRepository.findById(facturaId)
            .orElseThrow(() -> new NotFoundException("Factura no encontrada"));

        for (Map.Entry<Long, List<Long>> entry : equiposAsignaciones.entrySet()) {
            Long detalleId = entry.getKey();
            List<Long> equipoIds = entry.getValue();

            DetalleDocumento detalle = factura.getDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Detalle no encontrado"));

            for (Long equipoId : equipoIds) {
                EquipoFabricado equipo = equipoRepository.findById(equipoId)
                    .orElseThrow(() -> new NotFoundException("Equipo no encontrado"));

                // Validar que equipo pertenece a la misma empresa
                if (!equipo.getEmpresaId().equals(factura.getEmpresaId())) {
                    throw new ForbiddenException("Equipo no pertenece a esta empresa");
                }

                // Validar que equipo está disponible
                if (!equipo.getEstadoAsignacion().equals(EstadoAsignacionEquipo.DISPONIBLE)) {
                    throw new ValidationException("Equipo " + equipo.getNumeroHeladera() + " no está disponible");
                }

                // Asignar equipo
                equipo.setDocumentoId(facturaId);
                equipo.setDetalleDocumentoId(detalleId);
                equipo.setClienteId(factura.getClienteId());
                equipo.setEstadoAsignacion(EstadoAsignacionEquipo.FACTURADO);
                equipoRepository.save(equipo);
            }
        }
    }
}
```

### Opción 2: Asegurar que empresa_id NUNCA sea null en el Controller

```java
@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    @PostMapping("/factura")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<DocumentoComercialDTO> convertToFactura(
        @RequestBody ConvertToFacturaDTO dto,
        @RequestHeader("X-Empresa-Id") Long empresaId  // ✅ IMPORTANTE: Recibir header
    ) {
        // ✅ Validar que empresaId no sea null
        if (empresaId == null) {
            throw new BadRequestException("Header X-Empresa-Id es requerido");
        }

        DocumentoComercial factura = documentoService.convertirNotaPedidoAFactura(dto, empresaId);

        return ResponseEntity.ok(documentoMapper.toDTO(factura));
    }
}
```

### Opción 3: Usar @PrePersist / @PreUpdate en la entidad

```java
@Entity
@Table(name = "documentos_comerciales")
public class DocumentoComercial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    // Otros campos...

    @PrePersist
    @PreUpdate
    public void validateEmpresaId() {
        // ✅ Validar que empresa_id NUNCA sea null antes de guardar
        if (this.empresaId == null) {
            throw new IllegalStateException(
                "empresa_id no puede ser null al guardar DocumentoComercial"
            );
        }
    }
}
```

---

## 🔧 Validaciones Recomendadas

### 1. Validar empresa_id en toda la cadena
```java
// Controller
if (empresaId == null) {
    throw new BadRequestException("X-Empresa-Id requerido");
}

// Service
if (!notaPedido.getEmpresaId().equals(empresaId)) {
    throw new ForbiddenException("Sin permisos sobre esta nota de pedido");
}

// Al crear factura
factura.setEmpresaId(empresaId);  // NUNCA null

// Al asignar equipos
if (!equipo.getEmpresaId().equals(factura.getEmpresaId())) {
    throw new ForbiddenException("Equipo no pertenece a esta empresa");
}
```

### 2. Tests unitarios
```java
@Test
public void testConvertToFactura_shouldCopyEmpresaId() {
    // Arrange
    NotaPedido nota = createNotaPedido(empresaId: 1L);
    ConvertToFacturaDTO dto = new ConvertToFacturaDTO(nota.getId());

    // Act
    Factura factura = documentoService.convertirAFactura(dto, 1L);

    // Assert
    assertNotNull(factura.getEmpresaId());
    assertEquals(1L, factura.getEmpresaId());
}

@Test
public void testConvertToFactura_withEquipos_shouldNotLoseEmpresaId() {
    // Arrange
    NotaPedido nota = createNotaPedido(empresaId: 1L);
    List<Long> equipoIds = List.of(98L, 99L);
    Map<Long, List<Long>> asignaciones = Map.of(296L, equipoIds);
    ConvertToFacturaDTO dto = new ConvertToFacturaDTO(nota.getId(), asignaciones);

    // Act
    Factura factura = documentoService.convertirAFactura(dto, 1L);

    // Assert
    assertNotNull(factura.getEmpresaId());
    assertEquals(1L, factura.getEmpresaId());
}
```

---

## 📝 Cómo Verificar la Corrección

### 1. Ejecutar el endpoint:
```bash
POST http://localhost:8080/api/documentos/factura
Headers:
  Authorization: Bearer {token}
  X-Empresa-Id: 1
  Content-Type: application/json
Body:
  {
    "notaPedidoId": 123,
    "descuento": 0,
    "equiposAsignaciones": {
      "296": [98, 99]
    }
  }
```

### 2. Verificar la respuesta:
```json
{
  "id": 456,
  "tipoDocumento": "FACTURA",
  "numeroDocumento": "FACT-0001",
  "empresaId": 1,           // ✅ NO DEBE SER NULL
  "clienteId": 10,
  "usuarioId": 5,
  "estado": "EMITIDO",
  "fechaEmision": "2025-12-02T14:30:00",
  "montoTotal": 250000.00,
  "detalles": [
    {
      "id": 789,
      "tipoItem": "EQUIPO",
      "cantidad": 2,
      "precioUnitario": 125000.00,
      "subtotal": 250000.00
    }
  ]
}
```

### 3. Verificar en base de datos:
```sql
-- Verificar que la factura tiene empresa_id
SELECT id, tipo_documento, numero_documento, empresa_id, cliente_id, estado
FROM documentos_comerciales
WHERE id = 456;

-- ✅ empresa_id NO debe ser NULL

-- Verificar que los equipos fueron asignados correctamente
SELECT id, numero_heladera, documento_id, detalle_documento_id, cliente_id, estado_asignacion, empresa_id
FROM equipos_fabricados
WHERE id IN (98, 99);

-- ✅ documento_id = 456
-- ✅ detalle_documento_id = 789
-- ✅ cliente_id = 10
-- ✅ estado_asignacion = 'FACTURADO'
-- ✅ empresa_id debe coincidir con el de la factura
```

---

## 🎯 Impacto

### Funcionalidades Afectadas:
- ❌ **Conversión de Nota de Pedido a Factura** con equipos asignados
- ❌ **Facturación de equipos fabricados**
- ❌ **Flujo completo de venta con equipos**
- ❌ **Asignación de equipos a clientes vía factura**

### Funcionalidades que SÍ funcionan:
- ✅ Creación de Presupuestos
- ✅ Conversión de Presupuesto a Nota de Pedido
- ✅ Conversión de Nota de Pedido a Factura **SIN equipos**
- ✅ Creación manual de equipos
- ✅ Listado de documentos

---

## 🚀 Pasos para Corregir

1. **Localizar el archivo del Service o Controller:**
   - `DocumentoService.java`
   - `DocumentoController.java`
   - `EquipoFabricadoService.java`

2. **Buscar el método `convertirNotaPedidoAFactura`:**
   ```java
   @Transactional
   public DocumentoComercial convertirNotaPedidoAFactura(ConvertToFacturaDTO dto) {
       // ...
   }
   ```

3. **Asegurar que se copia el `empresa_id`:**
   - Desde la Nota de Pedido origen
   - O desde el header `X-Empresa-Id`
   - O desde el contexto de seguridad JWT

4. **Agregar validaciones:**
   - Validar que `empresa_id` nunca sea null
   - Validar permisos (usuario tiene acceso a esa empresa)
   - Validar que equipos pertenecen a la misma empresa

5. **Probar el endpoint** con Postman o similar

6. **Verificar en base de datos** que `empresa_id` se guarda correctamente

---

## 📊 Estado Actual

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Backend | 🔴 Requiere corrección | Agregar `empresa_id` al crear/actualizar factura |
| Frontend | 🟢 Funcional | Envía datos correctamente |
| Funcionalidad | 🔴 Bloqueada | No se puede facturar con equipos |

---

## 🔍 Información de Debug

### Request enviado por el frontend:
```javascript
// AsignarEquiposDialog.tsx:199
console.log('🔍 AsignarEquiposDialog - Asignaciones a enviar:');
// Output:
{
  "notaPedidoId": 123,
  "descuento": 0,
  "equiposAsignaciones": {
    "296": [98, 99]
  }
}
```

### Headers enviados:
```javascript
// config.ts - Request interceptor
{
  "Authorization": "Bearer eyJhbGc...",
  "X-Empresa-Id": "1",
  "Content-Type": "application/json"
}
```

### Error recibido:
```json
{
  "timestamp": "2025-12-02T14:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Error interno: could not execute statement [Column 'empresa_id' cannot be null] [update documentos_comerciales set empresa_id=?,opcion_financiamiento_seleccionada_id=? where id=?]",
  "path": "/api/documentos/factura"
}
```

---

## ⚠️ Workaround Temporal

**NO existe workaround del lado del frontend** para este problema. Es un bug del backend que DEBE corregirse.

### ¿Por qué no hay workaround?

1. El frontend ya está enviando todos los datos correctamente
2. El header `X-Empresa-Id` se está enviando en todas las peticiones
3. El problema está en la lógica del backend al crear/actualizar la factura
4. No es posible "forzar" el `empresa_id` desde el frontend

---

## 📞 Contacto

Si necesitas ayuda para corregir el backend, proporciona:
1. El código del método `convertirNotaPedidoAFactura` en el Service
2. El código del Controller para el endpoint `POST /api/documentos/factura`
3. El código de asignación de equipos a facturas
4. La definición de la entidad `DocumentoComercial` (especialmente validaciones)

---

**Documentado por:** Claude Code
**Fecha:** 2 de Diciembre, 2025
**Prioridad:** 🔴 CRÍTICA - Bloquea facturación de equipos
