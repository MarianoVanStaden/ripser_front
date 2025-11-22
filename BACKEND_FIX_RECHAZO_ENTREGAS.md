# Backend Fix: Manejo de Estados en Rechazo de Entregas

## 🚨 Problema Identificado

**Fecha:** 22 de Noviembre, 2025  
**Severidad:** MEDIA  
**Módulo:** Logística - Control de Entregas

### Descripción del Problema

Cuando se marca una entrega como **NO_ENTREGADA** (rechazada), el backend **NO está cambiando el estado de los equipos**. Esto causa que los equipos queden en un estado incorrecto:

**Flujo actual:**
```
1. Equipo: FACTURADO
2. Se crea entrega → Equipo pasa a: EN_TRANSITO
3. Se rechaza entrega → Equipo queda en: EN_TRANSITO ❌ (PROBLEMA)
```

**Problema:** El equipo queda "atascado" en estado `EN_TRANSITO` aunque la entrega falló.

---

## ✅ Solución Propuesta

### Opción 1: Revertir a FACTURADO (Recomendado)

Cuando una entrega se marca como `NO_ENTREGADA`, los equipos deberían volver al estado `FACTURADO` para permitir crear una nueva entrega con esos mismos equipos.

**Ventajas:**
- ✅ Los equipos vuelven a estar disponibles para re-entrega
- ✅ No requiere cambios en el enum ni en la base de datos
- ✅ Flujo lógico: Si no se entregó, vuelve al estado anterior
- ✅ Permite re-intentar la entrega sin complicaciones

**Flujo esperado:**
```
1. Equipo: FACTURADO
2. Se crea entrega → EN_TRANSITO
3. Se rechaza entrega → Vuelve a FACTURADO ✅
4. Se crea nueva entrega → EN_TRANSITO
5. Se confirma entrega → ENTREGADO ✅
```

### Opción 2: Crear estado NO_ENTREGADO (Alternativa)

Agregar un nuevo estado `NO_ENTREGADO` al enum para tener visibilidad explícita de qué equipos fallaron en la entrega.

**Ventajas:**
- ✅ Visibilidad clara de equipos con entregas fallidas
- ✅ Permite generar reportes de entregas fallidas
- ✅ Auditoría completa del ciclo de vida

**Desventajas:**
- ❌ Requiere migración SQL
- ❌ Requiere actualizar frontend
- ❌ Necesita lógica adicional para "liberar" esos equipos

---

## 🔧 Implementación Recomendada (Opción 1)

### Archivo a Modificar

**Ubicación:** `EntregaViajeController.java` o `EntregaViajeServiceImpl.java`

### Código Actual

```java
@Transactional
public void confirmarEntrega(Long entregaId, EstadoEntrega nuevoEstado, 
                             String receptorNombre, String receptorDni, 
                             String observaciones) {
    EntregaViaje entrega = entregaViajeRepository.findById(entregaId)
        .orElseThrow(() -> new EntityNotFoundException("Entrega no encontrada"));
    
    entrega.setEstado(nuevoEstado);
    entrega.setReceptorNombre(receptorNombre);
    entrega.setReceptorDni(receptorDni);
    entrega.setObservaciones(observaciones);
    
    if (nuevoEstado == EstadoEntrega.ENTREGADA) {
        // Obtener equipos de la factura
        List<EquipoFabricado> equipos = obtenerEquiposDeEntrega(entrega);
        
        // Cambiar estado a ENTREGADO
        equipos.forEach(equipo -> {
            equipo.setEstadoAsignacion(EstadoAsignacionEquipo.ENTREGADO);
            equipo.setFechaEntrega(LocalDateTime.now());
            equipoFabricadoRepository.save(equipo);
        });
        
        // Crear garantías
        if (entrega.getDocumentoComercial().getTipo() == TipoDocumento.FACTURA) {
            crearGarantiasParaFactura(entrega.getDocumentoComercial());
        }
    }
    
    // ❌ FALTA: No hay lógica para NO_ENTREGADA
    
    entregaViajeRepository.save(entrega);
}
```

### Código Propuesto (CON FIX)

```java
@Transactional
public void confirmarEntrega(Long entregaId, EstadoEntrega nuevoEstado, 
                             String receptorNombre, String receptorDni, 
                             String observaciones) {
    EntregaViaje entrega = entregaViajeRepository.findById(entregaId)
        .orElseThrow(() -> new EntityNotFoundException("Entrega no encontrada"));
    
    entrega.setEstado(nuevoEstado);
    entrega.setReceptorNombre(receptorNombre);
    entrega.setReceptorDni(receptorDni);
    entrega.setObservaciones(observaciones);
    
    // Obtener equipos de la entrega (común para ambos casos)
    List<EquipoFabricado> equipos = obtenerEquiposDeEntrega(entrega);
    
    if (nuevoEstado == EstadoEntrega.ENTREGADA) {
        // ✅ CASO 1: Entrega exitosa
        equipos.forEach(equipo -> {
            equipo.setEstadoAsignacion(EstadoAsignacionEquipo.ENTREGADO);
            equipo.setFechaEntrega(LocalDateTime.now());
            equipoFabricadoRepository.save(equipo);
        });
        
        // Crear garantías para facturas
        if (entrega.getDocumentoComercial() != null 
            && entrega.getDocumentoComercial().getTipo() == TipoDocumento.FACTURA) {
            crearGarantiasParaFactura(entrega.getDocumentoComercial());
        }
        
    } else if (nuevoEstado == EstadoEntrega.NO_ENTREGADA) {
        // ✅ CASO 2: Entrega rechazada - NUEVO FIX
        equipos.forEach(equipo -> {
            // Revertir a FACTURADO para permitir re-entrega
            equipo.setEstadoAsignacion(EstadoAsignacionEquipo.FACTURADO);
            equipoFabricadoRepository.save(equipo);
        });
        
        // Log para auditoría
        log.info("Entrega {} rechazada. {} equipos revertidos a estado FACTURADO", 
                 entregaId, equipos.size());
    }
    
    entregaViajeRepository.save(entrega);
}
```

### Método Helper Necesario

Si no existe, necesitas crear este método para obtener los equipos:

```java
private List<EquipoFabricado> obtenerEquiposDeEntrega(EntregaViaje entrega) {
    // Opción 1: Si guardas los equipos directamente en la entrega
    if (entrega.getEquipos() != null && !entrega.getEquipos().isEmpty()) {
        return entrega.getEquipos();
    }
    
    // Opción 2: Si obtienes equipos desde el documento comercial
    DocumentoComercial documento = entrega.getDocumentoComercial();
    if (documento == null) {
        return Collections.emptyList();
    }
    
    // Buscar equipos asignados a este documento
    List<DetalleDocumento> detallesEquipo = detalleDocumentoRepository
        .findByDocumentoAndTipoItem(documento, TipoItem.EQUIPO);
    
    List<EquipoFabricado> equipos = new ArrayList<>();
    for (DetalleDocumento detalle : detallesEquipo) {
        if (detalle.getEquiposIds() != null) {
            for (Long equipoId : detalle.getEquiposIds()) {
                equipoFabricadoRepository.findById(equipoId)
                    .ifPresent(equipos::add);
            }
        }
    }
    
    return equipos;
}
```

---

## 🧪 Tests Recomendados

```java
@Test
public void testRechazarEntrega_debeRevertirEquiposAFacturado() {
    // Given
    EntregaViaje entrega = crearEntregaConEquipos();
    List<EquipoFabricado> equipos = obtenerEquiposDeEntrega(entrega);
    
    // Verificar estado inicial: EN_TRANSITO
    equipos.forEach(equipo -> 
        assertEquals(EstadoAsignacionEquipo.EN_TRANSITO, equipo.getEstadoAsignacion())
    );
    
    // When
    entregaViajeService.confirmarEntrega(
        entrega.getId(),
        EstadoEntrega.NO_ENTREGADA,
        "N/A",
        "N/A",
        "Cliente no se encontraba en el domicilio"
    );
    
    // Then
    List<EquipoFabricado> equiposActualizados = obtenerEquiposDeEntrega(entrega);
    equiposActualizados.forEach(equipo -> {
        // ✅ Deben volver a FACTURADO
        assertEquals(EstadoAsignacionEquipo.FACTURADO, equipo.getEstadoAsignacion());
        // ✅ No deben tener fecha de entrega
        assertNull(equipo.getFechaEntrega());
    });
    
    // ✅ La entrega debe estar marcada como NO_ENTREGADA
    EntregaViaje entregaActualizada = entregaViajeRepository.findById(entrega.getId()).get();
    assertEquals(EstadoEntrega.NO_ENTREGADA, entregaActualizada.getEstado());
}

@Test
public void testConfirmarEntrega_debeCambiarEquiposAEntregado() {
    // Given
    EntregaViaje entrega = crearEntregaConEquipos();
    
    // When
    entregaViajeService.confirmarEntrega(
        entrega.getId(),
        EstadoEntrega.ENTREGADA,
        "Juan Pérez",
        "12345678",
        "Entrega sin novedades"
    );
    
    // Then
    List<EquipoFabricado> equipos = obtenerEquiposDeEntrega(entrega);
    equipos.forEach(equipo -> {
        // ✅ Deben estar en ENTREGADO
        assertEquals(EstadoAsignacionEquipo.ENTREGADO, equipo.getEstadoAsignacion());
        // ✅ Deben tener fecha de entrega
        assertNotNull(equipo.getFechaEntrega());
    });
}

@Test
public void testReintentarEntregaDespuesDeRechazo() {
    // Given
    EntregaViaje entrega1 = crearEntregaConEquipos();
    
    // Rechazar primera entrega
    entregaViajeService.confirmarEntrega(
        entrega1.getId(),
        EstadoEntrega.NO_ENTREGADA,
        "N/A",
        "N/A",
        "Primer intento fallido"
    );
    
    // Equipos deben estar en FACTURADO
    List<EquipoFabricado> equipos = obtenerEquiposDeEntrega(entrega1);
    equipos.forEach(equipo -> 
        assertEquals(EstadoAsignacionEquipo.FACTURADO, equipo.getEstadoAsignacion())
    );
    
    // When: Crear nueva entrega con los mismos equipos
    EntregaViaje entrega2 = crearNuevaEntrega(equipos);
    
    // Then: No debe lanzar excepción
    assertNotNull(entrega2);
    
    // Confirmar segunda entrega
    entregaViajeService.confirmarEntrega(
        entrega2.getId(),
        EstadoEntrega.ENTREGADA,
        "Juan Pérez",
        "12345678",
        "Segundo intento exitoso"
    );
    
    // Equipos ahora deben estar ENTREGADOS
    List<EquipoFabricado> equiposFinales = obtenerEquiposDeEntrega(entrega2);
    equiposFinales.forEach(equipo -> 
        assertEquals(EstadoAsignacionEquipo.ENTREGADO, equipo.getEstadoAsignacion())
    );
}
```

---

## 📊 Matriz de Estados Esperada (DESPUÉS DEL FIX)

| Acción Usuario | Estado Entrega | Estado Equipos | Puede Re-intentar |
|----------------|----------------|----------------|-------------------|
| Confirmar Entrega | ENTREGADA | ENTREGADO | ❌ No (ya entregado) |
| Rechazar Entrega | NO_ENTREGADA | **FACTURADO** ✅ | ✅ Sí (crear nueva entrega) |
| Sin acción | PENDIENTE | EN_TRANSITO | ✅ Sí (confirmar o rechazar) |

---

## 🔄 Flujo Completo Esperado

### Escenario 1: Entrega Exitosa
```
1. Crear entrega → Equipos: EN_TRANSITO
2. Confirmar entrega → Equipos: ENTREGADO ✅
3. Se crean garantías
```

### Escenario 2: Entrega Rechazada + Re-intento
```
1. Crear entrega #1 → Equipos: EN_TRANSITO
2. Rechazar entrega #1 → Equipos: FACTURADO ✅
3. Crear entrega #2 con mismos equipos → Equipos: EN_TRANSITO
4. Confirmar entrega #2 → Equipos: ENTREGADO ✅
```

### Escenario 3: Múltiples Rechazos
```
1. Crear entrega #1 → EN_TRANSITO
2. Rechazar entrega #1 → FACTURADO
3. Crear entrega #2 → EN_TRANSITO
4. Rechazar entrega #2 → FACTURADO
5. Crear entrega #3 → EN_TRANSITO
6. Confirmar entrega #3 → ENTREGADO ✅
```

---

## 📋 Checklist de Implementación

### Backend Changes
- [ ] Agregar lógica para caso `NO_ENTREGADA` en método `confirmarEntrega()`
- [ ] Cambiar estado de equipos a `FACTURADO` cuando se rechaza
- [ ] Asegurar que no se crean garantías en rechazos
- [ ] Agregar log de auditoría para rechazos
- [ ] Crear/verificar método `obtenerEquiposDeEntrega()`

### Tests
- [ ] Test: Rechazar entrega revierte equipos a FACTURADO
- [ ] Test: Confirmar entrega cambia equipos a ENTREGADO
- [ ] Test: Reintentar entrega después de rechazo funciona
- [ ] Test: Múltiples rechazos no causan problemas
- [ ] Test: No se crean garantías en rechazos

### Frontend (Ya Implementado ✅)
- [x] Modal de confirmación con campos del receptor
- [x] Modal de rechazo con motivo
- [x] Alert informativo sobre comportamiento de estados
- [x] Validaciones de campos requeridos

### Validación End-to-End
- [ ] Crear entrega en desarrollo
- [ ] Rechazar entrega
- [ ] Verificar equipos vuelven a FACTURADO (en BD y frontend)
- [ ] Crear nueva entrega con mismos equipos
- [ ] Confirmar entrega
- [ ] Verificar equipos pasan a ENTREGADO

---

## 🚀 Prioridad y Timing

**Prioridad:** MEDIA (No bloquea funcionalidad, pero crea inconsistencias)

**Complejidad:** BAJA (5-10 líneas de código)

**Tiempo estimado:** 30 minutos (código) + 30 minutos (tests)

**Riesgo:** BAJO (cambio aislado en un método)

---

## 📞 Preguntas para el Team

1. **¿Queremos trackear historial de intentos de entrega?**
   - Si sí: Considerar Opción 2 (estado NO_ENTREGADO)
   - Si no: Opción 1 es suficiente

2. **¿Hay límite de reintentos de entrega?**
   - Si sí: Agregar contador en entrega o documento

3. **¿Queremos notificar al usuario sobre rechazos?**
   - Si sí: Agregar notificación/email al rechazar

4. **¿El equipo puede estar en múltiples entregas pendientes?**
   - Si no: Agregar validación al crear entrega
   - Si sí: Revisar lógica de estados

---

## 📝 Documentación Relacionada

- **Frontend:** `DeliveriesPage.tsx` - Modales de confirmación/rechazo implementados ✅
- **Backend Enum:** `EstadoAsignacionEquipo.java` - Estados disponibles
- **Requerimientos:** `BACKEND_ESTADOS_EQUIPOS_REQUERIMIENTOS.md` - Doc principal de estados
- **Frontend Testing:** `ESTADO_ASIGNACION_TESTING_CHECKLIST.md` - Checklist de pruebas

---

**Última actualización:** 22 de Noviembre, 2025  
**Reportado por:** Frontend Team  
**Asignado a:** Backend Team  
**Estado:** PENDIENTE DE IMPLEMENTACIÓN
