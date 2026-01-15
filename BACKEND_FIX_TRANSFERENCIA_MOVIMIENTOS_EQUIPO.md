# Fix: Registrar Movimientos de Equipos en Transferencias

## Problema
Cuando se realiza una transferencia de equipos entre depósitos desde el módulo de Transferencias, los movimientos no quedan registrados en el historial de movimientos del equipo. Solo se registran los movimientos hechos directamente desde "Ubicación de Equipos -> Mover a Otro Depósito".

## Causa
El servicio `TransferenciaDepositoService` no está creando registros en la tabla `movimiento_equipo` cuando se confirma el envío o recepción de una transferencia que incluye equipos.

## Solución

### 1. Inyectar dependencias necesarias en TransferenciaDepositoService

```java
@Service
@RequiredArgsConstructor
public class TransferenciaDepositoServiceImpl implements TransferenciaDepositoService {
    
    private final TransferenciaDepositoRepository transferenciaRepository;
    private final TransferenciaItemRepository transferenciaItemRepository;
    private final StockDepositoRepository stockDepositoRepository;
    private final DepositoRepository depositoRepository;
    
    // AGREGAR ESTAS INYECCIONES:
    private final MovimientoEquipoRepository movimientoEquipoRepository;
    private final UbicacionEquipoRepository ubicacionEquipoRepository;
    private final EquipoFabricadoRepository equipoFabricadoRepository;
    
    // ... resto del código
}
```

### 2. Modificar el método confirmarEnvio()

Cuando se confirma el envío de una transferencia, para cada equipo incluido se debe:
- Crear un registro de movimiento
- Actualizar la ubicación del equipo

```java
@Override
@Transactional
public TransferenciaDepositoDTO confirmarEnvio(Long transferenciaId, Long usuarioId) {
    TransferenciaDeposito transferencia = transferenciaRepository.findById(transferenciaId)
        .orElseThrow(() -> new EntityNotFoundException("Transferencia no encontrada"));
    
    if (transferencia.getEstado() != EstadoTransferencia.PENDIENTE) {
        throw new IllegalStateException("Solo se pueden enviar transferencias en estado PENDIENTE");
    }
    
    // Actualizar estado de la transferencia
    transferencia.setEstado(EstadoTransferencia.EN_TRANSITO);
    transferencia.setFechaEnvio(LocalDateTime.now());
    
    // Procesar cada item de la transferencia
    for (TransferenciaItem item : transferencia.getItems()) {
        
        // Si es un EQUIPO, registrar el movimiento y actualizar ubicación
        if (item.getEquipoFabricado() != null) {
            EquipoFabricado equipo = item.getEquipoFabricado();
            
            // 1. Crear registro de movimiento
            MovimientoEquipo movimiento = new MovimientoEquipo();
            movimiento.setEquipoFabricado(equipo);
            movimiento.setTipoMovimiento(TipoMovimientoEquipo.TRANSFERENCIA);
            movimiento.setDepositoOrigen(transferencia.getDepositoOrigen());
            movimiento.setDepositoDestino(transferencia.getDepositoDestino());
            movimiento.setFechaMovimiento(LocalDateTime.now());
            movimiento.setUsuarioId(usuarioId);
            movimiento.setObservaciones("Transferencia #" + transferencia.getNumero() + " - Envío confirmado");
            movimiento.setEmpresaId(transferencia.getEmpresaId());
            movimientoEquipoRepository.save(movimiento);
            
            // 2. Actualizar ubicación del equipo (moverlo al depósito destino)
            UbicacionEquipo ubicacion = ubicacionEquipoRepository
                .findByEquipoFabricadoId(equipo.getId())
                .orElse(null);
            
            if (ubicacion != null) {
                ubicacion.setDeposito(transferencia.getDepositoDestino());
                ubicacion.setFechaActualizacion(LocalDateTime.now());
                ubicacion.setUsuarioRegistroId(usuarioId);
                ubicacionEquipoRepository.save(ubicacion);
            }
        }
        
        // Si es un PRODUCTO, descontar del stock origen
        if (item.getProducto() != null) {
            // ... lógica existente para productos ...
        }
    }
    
    TransferenciaDeposito saved = transferenciaRepository.save(transferencia);
    return mapper.toDTO(saved);
}
```

### 3. Alternativa: Registrar en confirmarRecepcion()

Si prefieres registrar el movimiento al momento de la recepción (cuando el equipo "llega" físicamente):

```java
@Override
@Transactional
public TransferenciaDepositoDTO confirmarRecepcion(Long transferenciaId, RecepcionTransferenciaDTO recepcionDTO) {
    TransferenciaDeposito transferencia = transferenciaRepository.findById(transferenciaId)
        .orElseThrow(() -> new EntityNotFoundException("Transferencia no encontrada"));
    
    if (transferencia.getEstado() != EstadoTransferencia.EN_TRANSITO) {
        throw new IllegalStateException("Solo se pueden recibir transferencias EN_TRANSITO");
    }
    
    // Actualizar estado
    transferencia.setEstado(EstadoTransferencia.RECIBIDA);
    transferencia.setFechaRecepcion(LocalDateTime.now());
    transferencia.setUsuarioRecepcionId(recepcionDTO.getUsuarioRecepcionId());
    
    // Procesar items recibidos
    for (ItemRecepcionDTO itemRecepcion : recepcionDTO.getItems()) {
        TransferenciaItem item = transferenciaItemRepository.findById(itemRecepcion.getDetalleId())
            .orElseThrow(() -> new EntityNotFoundException("Item no encontrado"));
        
        item.setCantidadRecibida(itemRecepcion.getCantidadRecibida());
        item.setObservaciones(itemRecepcion.getObservaciones());
        transferenciaItemRepository.save(item);
        
        // Si es EQUIPO y fue recibido correctamente
        if (item.getEquipoFabricado() != null && itemRecepcion.getCantidadRecibida() > 0) {
            EquipoFabricado equipo = item.getEquipoFabricado();
            
            // Crear registro de movimiento
            MovimientoEquipo movimiento = new MovimientoEquipo();
            movimiento.setEquipoFabricado(equipo);
            movimiento.setTipoMovimiento(TipoMovimientoEquipo.TRANSFERENCIA);
            movimiento.setDepositoOrigen(transferencia.getDepositoOrigen());
            movimiento.setDepositoDestino(transferencia.getDepositoDestino());
            movimiento.setFechaMovimiento(LocalDateTime.now());
            movimiento.setUsuarioId(recepcionDTO.getUsuarioRecepcionId());
            movimiento.setObservaciones("Transferencia #" + transferencia.getNumero() + " - Recepción confirmada");
            movimiento.setEmpresaId(transferencia.getEmpresaId());
            movimientoEquipoRepository.save(movimiento);
            
            // Actualizar ubicación del equipo
            UbicacionEquipo ubicacion = ubicacionEquipoRepository
                .findByEquipoFabricadoId(equipo.getId())
                .orElse(null);
            
            if (ubicacion != null) {
                ubicacion.setDeposito(transferencia.getDepositoDestino());
                ubicacion.setFechaActualizacion(LocalDateTime.now());
                ubicacion.setUsuarioRegistroId(recepcionDTO.getUsuarioRecepcionId());
                ubicacionEquipoRepository.save(ubicacion);
            }
        }
        
        // Si es PRODUCTO, agregar al stock destino
        if (item.getProducto() != null) {
            // ... lógica existente para productos ...
        }
    }
    
    TransferenciaDeposito saved = transferenciaRepository.save(transferencia);
    return mapper.toDTO(saved);
}
```

### 4. Verificar/Crear el Enum TipoMovimientoEquipo

Asegúrate de que el enum incluya el tipo TRANSFERENCIA:

```java
public enum TipoMovimientoEquipo {
    INGRESO_INICIAL,      // Cuando se registra ubicación por primera vez
    TRASLADO,             // Movimiento manual desde Ubicación de Equipos
    TRANSFERENCIA,        // Movimiento por transferencia entre depósitos
    ASIGNACION,           // Cuando se asigna a un cliente
    DEVOLUCION,           // Cuando el cliente devuelve el equipo
    BAJA,                 // Cuando el equipo se da de baja
    MANTENIMIENTO         // Cuando va a reparación/mantenimiento
}
```

### 5. Verificar el Repository

Asegúrate de que exista el método en el repository:

```java
public interface UbicacionEquipoRepository extends JpaRepository<UbicacionEquipo, Long> {
    
    Optional<UbicacionEquipo> findByEquipoFabricadoId(Long equipoFabricadoId);
    
    List<UbicacionEquipo> findByDepositoId(Long depositoId);
    
    // ... otros métodos
}
```

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `TransferenciaDepositoServiceImpl.java` | Inyectar `MovimientoEquipoRepository`, `UbicacionEquipoRepository` |
| `TransferenciaDepositoServiceImpl.java` | En `confirmarEnvio()` o `confirmarRecepcion()`: crear `MovimientoEquipo` y actualizar `UbicacionEquipo` para cada equipo |
| `TipoMovimientoEquipo.java` | Agregar `TRANSFERENCIA` si no existe |

## Decisión de Diseño

**¿Cuándo registrar el movimiento?**

- **En confirmarEnvio()**: El equipo "sale" del depósito origen. Útil si quieres trackear el momento exacto de salida.
- **En confirmarRecepcion()**: El equipo "llega" al depósito destino. Más preciso porque confirma que efectivamente llegó.

**Recomendación**: Registrar en `confirmarEnvio()` y actualizar la ubicación. Si la transferencia se cancela después del envío, se puede crear otro movimiento de "devolución" o "cancelación".
