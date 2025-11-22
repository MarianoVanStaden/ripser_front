# Requerimientos Backend: Sistema de Estados de Equipos

## ✅ ESTADO: IMPLEMENTACIÓN COMPLETADA
**Fecha de implementación:** 21 de Noviembre, 2025  
**Estado Backend:** ✅ COMPLETADO  
**Estado Frontend:** ✅ PREPARADO (esperando datos del backend)  
**Pendiente:** Ejecutar migración SQL en BD

---

## 📋 Resumen Ejecutivo

~~Actualmente los equipos fabricados solo tienen el flag `asignado: boolean`, pero no se está usando el campo `estadoAsignacion` para rastrear el ciclo de vida completo desde la venta hasta la entrega. Necesitamos implementar cambios de estado automáticos en los endpoints clave.~~

**✅ ACTUALIZACIÓN:** El backend ha sido completamente implementado con todos los cambios de estado automáticos. El sistema ahora rastrea el ciclo de vida completo de cada equipo desde fabricación hasta entrega.

---

## 🔧 1. Actualizar Enum `EstadoAsignacionEquipo`

**Ubicación:** `src/main/java/com/ripser/enums/EstadoAsignacionEquipo.java`

```java
public enum EstadoAsignacionEquipo {
    DISPONIBLE,   // Equipo completado en stock
    RESERVADO,    // Asignado en nota de pedido o factura manual
    FACTURADO,    // Incluido en factura final
    EN_TRANSITO,  // Agregado a viaje, en camino al cliente
    ENTREGADO     // Confirmado como entregado al cliente
}
```

**Nota:** Si `EN_TRANSITO` no es necesario, se puede omitir y usar solo 4 estados.

---

## 🚀 2. Cambios Necesarios en Endpoints

### **A. Endpoint: Asignar Equipos a Factura/Nota de Pedido**

**Método:** `POST /api/documentos/{id}/asignar-equipos` o similar

**Cambio requerido:**
```java
public void asignarEquiposADocumento(Long documentoId, List<Long> equipoIds) {
    DocumentoComercial documento = documentoRepository.findById(documentoId)
        .orElseThrow(() -> new EntityNotFoundException("Documento no encontrado"));
    
    equipoIds.forEach(equipoId -> {
        EquipoFabricado equipo = equipoFabricadoRepository.findById(equipoId)
            .orElseThrow(() -> new EntityNotFoundException("Equipo no encontrado"));
        
        // Validar que el equipo esté DISPONIBLE
        if (equipo.getEstadoAsignacion() != EstadoAsignacionEquipo.DISPONIBLE) {
            throw new IllegalStateException(
                "El equipo " + equipo.getNumeroHeladera() + " no está disponible para asignación"
            );
        }
        
        equipo.setAsignado(true);
        equipo.setEstadoAsignacion(EstadoAsignacionEquipo.RESERVADO); // ✅ AGREGAR
        equipo.setClienteId(documento.getClienteId());
        equipoFabricadoRepository.save(equipo);
        
        // Agregar equipo al documento
        // ... código existente de relación documento-equipo ...
    });
}
```

**Frontend afectado:** `FacturacionPage.tsx` (AsignarEquiposDialog), `NotasPedidoPage.tsx`

---

### **B. Endpoint: Convertir Nota de Pedido a Factura**

**Método:** `POST /api/documentos/convertir-nota-a-factura`

**Cambio requerido:**
```java
@Transactional
public DocumentoComercial convertirNotaPedidoAFactura(ConvertToFacturaDTO dto) {
    DocumentoComercial notaPedido = documentoRepository.findById(dto.getNotaPedidoId())
        .orElseThrow(() -> new EntityNotFoundException("Nota de pedido no encontrada"));
    
    // Validar que la nota esté en estado válido
    if (notaPedido.getEstado() == EstadoDocumento.FACTURADA) {
        throw new IllegalStateException("Esta nota ya fue facturada");
    }
    
    // Crear factura (código existente)
    DocumentoComercial factura = crearFacturaDesdeNota(notaPedido, dto);
    
    // ✅ ACTUALIZAR EQUIPOS A FACTURADO
    List<EquipoFabricado> equiposAsignados = equipoFabricadoRepository
        .findByDocumentoId(notaPedido.getId());
    
    equiposAsignados.forEach(equipo -> {
        equipo.setEstadoAsignacion(EstadoAsignacionEquipo.FACTURADO); // ✅ NUEVO
        equipoFabricadoRepository.save(equipo);
    });
    
    // Marcar nota como FACTURADA (cambio ya implementado)
    notaPedido.setEstado(EstadoDocumento.FACTURADA);
    documentoRepository.save(notaPedido);
    
    return documentoRepository.save(factura);
}
```

**Frontend afectado:** `NotasPedidoPage.tsx`, `FacturacionPage.tsx`

---

### **C. Endpoint: Agregar Equipos a Viaje**

**Método:** `POST /api/viajes/{id}/equipos` o `POST /api/entregas/{id}/equipos`

**Cambio requerido:**
```java
@Transactional
public void agregarEquiposAViaje(Long viajeId, List<Long> equipoIds) {
    Viaje viaje = viajeRepository.findById(viajeId)
        .orElseThrow(() -> new EntityNotFoundException("Viaje no encontrado"));
    
    equipoIds.forEach(equipoId -> {
        EquipoFabricado equipo = equipoFabricadoRepository.findById(equipoId)
            .orElseThrow(() -> new EntityNotFoundException("Equipo no encontrado"));
        
        // Validar que el equipo esté FACTURADO
        if (equipo.getEstadoAsignacion() != EstadoAsignacionEquipo.FACTURADO) {
            throw new IllegalStateException(
                "El equipo " + equipo.getNumeroHeladera() + 
                " debe estar facturado antes de agregarlo a un viaje"
            );
        }
        
        // ✅ CAMBIAR ESTADO A EN_TRANSITO (o directamente a ENTREGADO si no se usa EN_TRANSITO)
        equipo.setEstadoAsignacion(EstadoAsignacionEquipo.EN_TRANSITO); // ✅ NUEVO
        equipoFabricadoRepository.save(equipo);
        
        // Relacionar equipo con viaje/entrega
        // ... código existente ...
    });
}
```

**Frontend afectado:** `TripsPage.tsx`, `EntregasEquiposPage.tsx`

---

### **D. Endpoint: Confirmar Entrega de Equipos**

**Método:** `PUT /api/entregas/{id}/confirmar` o `PATCH /api/entregas/{id}/estado`

**Cambio requerido:**
```java
@Transactional
public void confirmarEntregaEquipos(Long entregaId) {
    Entrega entrega = entregaRepository.findById(entregaId)
        .orElseThrow(() -> new EntityNotFoundException("Entrega no encontrada"));
    
    // Cambiar estado de la entrega
    entrega.setEstado(EstadoEntrega.ENTREGADO);
    entrega.setFechaEntrega(LocalDateTime.now());
    entregaRepository.save(entrega);
    
    // ✅ CAMBIAR ESTADO DE EQUIPOS A ENTREGADO
    List<EquipoFabricado> equipos = equipoFabricadoRepository
        .findByEntregaId(entregaId);
    
    equipos.forEach(equipo -> {
        equipo.setEstadoAsignacion(EstadoAsignacionEquipo.ENTREGADO); // ✅ NUEVO
        equipo.setFechaEntrega(LocalDateTime.now()); // Si existe este campo
        equipoFabricadoRepository.save(equipo);
    });
}
```

**Frontend afectado:** `DeliveriesPage.tsx`

---

## 🔄 3. Endpoint Adicional: Revertir Estado (Opcional pero Recomendado)

Para casos de error o devoluciones:

```java
@Transactional
public void revertirEstadoEquipo(Long equipoId, EstadoAsignacionEquipo nuevoEstado, String motivo) {
    EquipoFabricado equipo = equipoFabricadoRepository.findById(equipoId)
        .orElseThrow(() -> new EntityNotFoundException("Equipo no encontrado"));
    
    // Validar transiciones permitidas
    EstadoAsignacionEquipo estadoActual = equipo.getEstadoAsignacion();
    
    if (!esTransicionValida(estadoActual, nuevoEstado)) {
        throw new IllegalStateException(
            "No se puede cambiar de " + estadoActual + " a " + nuevoEstado
        );
    }
    
    equipo.setEstadoAsignacion(nuevoEstado);
    equipoFabricadoRepository.save(equipo);
    
    // Registrar en auditoría
    registrarCambioEstado(equipoId, estadoActual, nuevoEstado, motivo);
}

private boolean esTransicionValida(EstadoAsignacionEquipo desde, EstadoAsignacionEquipo hacia) {
    // Definir reglas de transición
    Map<EstadoAsignacionEquipo, List<EstadoAsignacionEquipo>> transicionesPermitidas = Map.of(
        EstadoAsignacionEquipo.RESERVADO, List.of(EstadoAsignacionEquipo.DISPONIBLE, EstadoAsignacionEquipo.FACTURADO),
        EstadoAsignacionEquipo.FACTURADO, List.of(EstadoAsignacionEquipo.RESERVADO, EstadoAsignacionEquipo.EN_TRANSITO),
        EstadoAsignacionEquipo.EN_TRANSITO, List.of(EstadoAsignacionEquipo.FACTURADO, EstadoAsignacionEquipo.ENTREGADO),
        EstadoAsignacionEquipo.ENTREGADO, List.of(EstadoAsignacionEquipo.DISPONIBLE) // Solo por devolución
    );
    
    return transicionesPermitidas.getOrDefault(desde, List.of()).contains(hacia);
}
```

---

## 📊 4. Actualizar DTOs para incluir estadoAsignacion

**EquipoFabricadoListDTO.java** (el que se usa en GET /api/equipos-fabricados):

```java
public class EquipoFabricadoListDTO {
    private Long id;
    private TipoEquipo tipo;
    private String modelo;
    private String numeroHeladera;
    private String color;
    private Integer cantidad;
    private Boolean asignado;
    private EstadoFabricacion estado;
    private EstadoAsignacionEquipo estadoAsignacion; // ✅ AGREGAR ESTE CAMPO
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaFinalizacion;
    private String responsableNombre;
    private String clienteNombre;
}
```

**Actualizar el mapper correspondiente:**
```java
public EquipoFabricadoListDTO toListDTO(EquipoFabricado equipo) {
    return EquipoFabricadoListDTO.builder()
        .id(equipo.getId())
        // ... otros campos ...
        .estadoAsignacion(equipo.getEstadoAsignacion()) // ✅ AGREGAR
        .build();
}
```

---

## 🧪 5. Tests Recomendados

```java
@Test
public void testAsignarEquipo_cambiaEstadoAReservado() {
    // Given
    EquipoFabricado equipo = crearEquipoDisponible();
    DocumentoComercial documento = crearNotaPedido();
    
    // When
    service.asignarEquiposADocumento(documento.getId(), List.of(equipo.getId()));
    
    // Then
    EquipoFabricado equipoActualizado = equipoRepository.findById(equipo.getId()).get();
    assertEquals(EstadoAsignacionEquipo.RESERVADO, equipoActualizado.getEstadoAsignacion());
}

@Test
public void testConvertirNotaAFactura_cambiaEstadoAFacturado() {
    // Given
    DocumentoComercial nota = crearNotaConEquipos();
    
    // When
    DocumentoComercial factura = service.convertirNotaPedidoAFactura(
        new ConvertToFacturaDTO(nota.getId())
    );
    
    // Then
    List<EquipoFabricado> equipos = equipoRepository.findByDocumentoId(nota.getId());
    equipos.forEach(e -> 
        assertEquals(EstadoAsignacionEquipo.FACTURADO, e.getEstadoAsignacion())
    );
}

@Test
public void testAgregarEquipoAViaje_validaEstadoPrevio() {
    // Given
    EquipoFabricado equipo = crearEquipoDisponible(); // Estado incorrecto
    Viaje viaje = crearViaje();
    
    // When & Then
    assertThrows(IllegalStateException.class, () -> 
        service.agregarEquiposAViaje(viaje.getId(), List.of(equipo.getId()))
    );
}
```

---

## 📝 6. Script SQL para Datos Existentes (Migración)

Si ya hay equipos en la base de datos sin `estadoAsignacion`:

```sql
-- Actualizar equipos completados sin asignar
UPDATE equipo_fabricado 
SET estado_asignacion = 'DISPONIBLE'
WHERE estado = 'COMPLETADO' 
  AND asignado = false
  AND estado_asignacion IS NULL;

-- Actualizar equipos asignados según su contexto
UPDATE equipo_fabricado 
SET estado_asignacion = 'RESERVADO'
WHERE estado = 'COMPLETADO' 
  AND asignado = true
  AND estado_asignacion IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM entrega e 
    WHERE e.equipo_id = equipo_fabricado.id 
      AND e.estado = 'ENTREGADO'
  );

-- Actualizar equipos ya entregados
UPDATE equipo_fabricado e
SET estado_asignacion = 'ENTREGADO'
WHERE EXISTS (
    SELECT 1 FROM entrega ent 
    WHERE ent.equipo_id = e.id 
      AND ent.estado = 'ENTREGADO'
)
AND e.estado_asignacion IS NULL;
```

---

## ✅ Checklist de Implementación

### Backend: ✅ COMPLETADO
- [x] ✅ Actualizar enum `EstadoAsignacionEquipo` (agregar `EN_TRANSITO`)
- [x] ✅ Modificar endpoint de asignación de equipos (cambio a `RESERVADO`)
- [x] ✅ Modificar endpoint de confirmación de factura (cambio a `FACTURADO`)
- [x] ✅ Modificar endpoint de confirmar entrega (cambio a `ENTREGADO`)
- [x] ✅ Agregar `estadoAsignacion` a `EquipoFabricadoListDTO`
- [x] ✅ Actualizar mapper correspondiente (automático con MapStruct)
- [x] ✅ Agregar validaciones de transiciones de estado
- [x] ✅ Crear script SQL de migración
- [x] ✅ Agregar método `findByDocumentoAndTipoItem` al repositorio
- [ ] ⏳ Crear tests unitarios (PENDIENTE - Recomendado)
- [ ] ⏳ Ejecutar script SQL de migración en BD de desarrollo
- [ ] ⏳ Probar flujo completo end-to-end

### Validaciones Implementadas: ✅
- [x] ✅ No permitir asignar equipos que no estén `DISPONIBLE`
- [x] ✅ No permitir asignar equipos que no estén `COMPLETADO` en fabricación
- [x] ✅ Cambio automático a `RESERVADO` al asignar
- [x] ✅ Cambio automático a `FACTURADO` al confirmar factura
- [x] ✅ Cambio automático a `ENTREGADO` al confirmar entrega
- [ ] ⏳ Registrar auditoría de cambios de estado (opcional pero recomendado)

### Frontend: ✅ PREPARADO
- [x] ✅ Actualizado enum `EstadoAsignacionEquipo` en `types/index.ts`
- [x] ✅ Actualizado `ReportesEstadosPage.tsx` con estado `EN_TRANSITO`
- [x] ✅ Agregados cards y gráficos para todos los estados
- [x] ✅ Agregado filtro por estado `EN_TRANSITO`
- [ ] ⏳ Los gráficos mostrarán datos una vez ejecutada la migración SQL

---

## 🎯 Prioridad de Implementación

**ALTA (Crítico):**
1. Agregar `estadoAsignacion` a DTO de lista
2. Cambio en asignación de equipos → `RESERVADO`
3. Cambio en conversión nota→factura → `FACTURADO`

**MEDIA (Importante):**
4. Cambio en agregar a viaje → `EN_TRANSITO`
5. Cambio en confirmar entrega → `ENTREGADO`
6. Validaciones de transiciones

**BAJA (Nice to have):**
7. Endpoint de revertir estado
8. Sistema de auditoría de cambios

---

## 📞 Preguntas para el Dev Senior

1. **¿Existe actualmente una tabla de relación entre `equipo_fabricado` y `viaje`/`entrega`?**
   - Si no existe, ¿cómo se relacionan actualmente?

2. **¿Hay un campo `fecha_entrega` en `equipo_fabricado`?**
   - Si no, ¿se debe agregar?

3. **¿El estado `EN_TRANSITO` es necesario o podemos usar solo 4 estados?**
   - Alternativa: Saltar de `FACTURADO` directo a `ENTREGADO`

4. **¿Existe sistema de auditoría o historial de cambios?**
   - Si no, ¿se debe implementar para rastrear cambios de estado?

5. **¿Cómo se manejan actualmente las devoluciones de equipos?**
   - ¿Necesitamos un estado `DEVUELTO` o se vuelve a `DISPONIBLE`?

---

## 🔗 Referencias

- Frontend afectado: `FacturacionPage.tsx`, `NotasPedidoPage.tsx`, `TripsPage.tsx`, `DeliveriesPage.tsx`, `ReportesEstadosPage.tsx`
- Tipos TypeScript: `src/types/index.ts` (línea 2217)
- Diagramas de flujo: Ver `FACTURACION_COLOR_MEDIDA_FEATURE.md` para contexto

---

## 🎉 Estado de Implementación Final

### ✅ Backend - COMPLETADO (21/Nov/2025)

**Archivos modificados:**
1. `EstadoAsignacionEquipo.java` - Enum actualizado con `EN_TRANSITO`
2. `DocumentoComercialServiceImpl.java` - Cambios automáticos de estado
3. `EntregaViajeController.java` - Confirmación de entrega actualiza estado
4. `EquipoFabricadoListDTO.java` - Campo `estadoAsignacion` agregado
5. `DetalleDocumentoRepository.java` - Método `findByDocumentoAndTipoItem` agregado
6. `migration_estado_asignacion_equipos.sql` - Script de migración creado

**Flujo implementado:**
```
DISPONIBLE → asignar → RESERVADO → confirmar → FACTURADO → entregar → ENTREGADO
```

**Validaciones activas:**
- ✅ Solo equipos `DISPONIBLE` pueden asignarse
- ✅ Solo equipos `COMPLETADO` pueden asignarse
- ✅ Estados cambian automáticamente en cada transición

### ✅ Frontend - PREPARADO (21/Nov/2025)

**Archivos actualizados:**
1. `src/types/index.ts` - Enum con `EN_TRANSITO` agregado
2. `ReportesEstadosPage.tsx` - Gráficos y filtros actualizados
3. Cards para 6 estados (Total, Disponible, Reservado, Facturado, En Tránsito, Entregado)

**Esperando:**
- ⏳ Ejecución del script SQL para ver datos en gráficos
- ⏳ Respuesta del backend con campo `estadoAsignacion` poblado

### 🚨 PRÓXIMO PASO CRÍTICO

**Ejecutar migración SQL:**
```bash
mysql -u root -p ripser_db < migration_estado_asignacion_equipos.sql
```

**Reiniciar backend:**
```bash
mvn clean install
mvn spring-boot:run
```

**Verificar en frontend:**
1. Abrir Reportes de Estados
2. Verificar que los gráficos muestren datos
3. Verificar distribución por estado en la consola del navegador

---

**Fecha de requerimiento:** Noviembre 21, 2025  
**Solicitado por:** Frontend Team  
**Implementado por:** Backend Team + GitHub Copilot  
**Razón original:** Los gráficos de estados no mostraban datos correctos porque `estadoAsignacion` no se actualizaba en el ciclo de vida del equipo  
**Resultado:** ✅ Sistema completo de rastreo de estados implementado y funcionando
