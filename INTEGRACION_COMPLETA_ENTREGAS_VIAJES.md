# 🚚 Sistema Integrado de Entregas y Viajes

## 📋 Descripción General

Sistema completo que conecta la **facturación de equipos** con su **entrega física**, permitiendo dos modalidades:
1. **Entrega Inmediata**: Sin viaje asociado
2. **Entrega Programada**: Agrupando múltiples entregas en un viaje

---

## 🔄 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────────┘

1. VENTAS - Facturación
   ├─ Usuario crea factura con productos tipo EQUIPO
   ├─ AsignarEquiposDialog abre automáticamente
   ├─ Usuario selecciona equipos específicos del stock
   └─ Backend: Equipos DISPONIBLE → FACTURADO
   
2. LOGÍSTICA - Entregas de Equipos (Nuevo)
   ├─ Muestra facturas con equipos FACTURADOS
   ├─ Usuario tiene 2 opciones:
   │
   ├─ A) ENTREGA INMEDIATA
   │  ├─ Confirma entrega directamente
   │  ├─ Registra receptor y observaciones
   │  └─ Equipos: FACTURADO → ENTREGADO ✅
   │
   └─ B) AGREGAR A VIAJE
      ├─ Selecciona viaje existente O crea nuevo
      ├─ Factura se vincula al viaje
      └─ Equipos quedan FACTURADOS (pendientes)

3. LOGÍSTICA - Armado de Viajes
   ├─ Vista de viajes planificados
   ├─ Muestra equipos por entregar en cada viaje
   ├─ Asigna conductor + vehículo
   ├─ Define ruta y orden de paradas
   └─ Estado: PLANIFICADO

4. LOGÍSTICA - Control de Entregas
   ├─ Vista del conductor en terreno
   ├─ Lista de paradas del viaje
   ├─ Confirma entrega equipo por equipo
   ├─ Registra receptor, foto, firma
   ├─ Equipos: FACTURADO → ENTREGADO ✅
   └─ Al completar todas: Viaje COMPLETADO

5. TRAZABILIDAD - Historial de Estados
   ├─ Timeline visual de cada equipo
   └─ Muestra todos los cambios de estado
```

---

## 📊 Estructura de Base de Datos

### Tablas Principales

#### 1. `entrega_viaje_detalle`
```sql
- id                      : ID único
- viaje_id                : FK a entregas_viaje
- factura_id              : FK a documentos_comerciales
- equipo_fabricado_id     : FK a equipos_fabricados
- orden_entrega           : Orden en la ruta
- estado_entrega          : PENDIENTE | EN_RUTA | ENTREGADO | RECHAZADO
- receptor_nombre         : Quién recibió
- receptor_dni            : DNI del receptor
- fecha_entrega_real      : Cuándo se entregó
- direccion_entrega       : Dirección de entrega
- observaciones           : Notas
- foto_entrega_url        : URL de la foto
- firma_digital_url       : URL de la firma
```

#### 2. `entregas_viaje` (Actualizada)
```sql
- id                      : ID único
- fecha_viaje             : Fecha del viaje
- estado_viaje            : PLANIFICADO | EN_RUTA | COMPLETADO | CANCELADO
- conductor_id            : FK a empleados
- vehiculo_id             : FK a vehiculos
- total_equipos           : Total a entregar
- equipos_entregados      : Ya entregados
- hora_inicio             : Inicio del viaje
- hora_fin                : Fin del viaje
```

### Vistas

#### `vista_viajes_resumen`
```sql
SELECT viaje_id, fecha_viaje, estado_viaje, conductor_nombre,
       vehiculo_patente, total_equipos, equipos_entregados,
       total_facturas, total_paradas, paradas_completadas
FROM entregas_viaje + entrega_viaje_detalle + empleados + vehiculos
```

#### `vista_equipos_pendientes_viaje`
```sql
SELECT equipos FACTURADOS que NO están en ningún viaje PENDIENTE o EN_RUTA
```

### Procedimientos Almacenados

#### `sp_agregar_factura_a_viaje(viaje_id, factura_id, orden)`
- Extrae todos los equipos FACTURADOS de la factura
- Crea entradas en `entrega_viaje_detalle`
- Actualiza `total_equipos` del viaje

#### `sp_confirmar_entrega_equipo(detalle_id, receptor, observaciones, usuario_id)`
- Marca `estado_entrega = 'ENTREGADO'`
- Cambia equipo a `estado_asignacion = 'ENTREGADO'`
- Registra en `historial_estado_equipo`
- Actualiza `equipos_entregados` del viaje
- Si todos entregados → Viaje COMPLETADO

---

## 💻 Frontend - Componentes

### 1. EntregasEquiposPage.tsx (Modificado)

**Ubicación**: `src/components/Logistica/EntregasEquiposPage.tsx`

**Características**:
- ✅ Lista facturas con equipos FACTURADOS
- ✅ Botón "Entrega Inmediata" → Confirma y marca ENTREGADO
- ✅ Botón "Agregar a Viaje" → Abre dialog
- ✅ Dialog permite:
  - Seleccionar viaje existente
  - Crear nuevo viaje
- ✅ Llama a `/api/entregas-viaje/agregar-factura`

### 2. TripsPage.tsx (Por Actualizar)

**Pendiente**:
- Mostrar detalles de equipos por viaje
- Vista de paradas ordenadas
- Asignación de conductor/vehículo
- Estado del viaje

### 3. DeliveriesPage.tsx (Por Actualizar)

**Pendiente**:
- Vista de paradas del viaje
- Confirmar entrega individual de equipos
- Captura de foto/firma
- Manejo de rechazos/reprogramaciones

---

## 🔌 Backend - Endpoints Requeridos

### Nuevos Endpoints

#### POST `/api/entregas-viaje/agregar-factura`
```java
@PostMapping("/agregar-factura")
public ResponseEntity<?> agregarFacturaAViaje(@RequestBody AgregarFacturaViajeDTO dto) {
    // Llama al procedimiento almacenado
    jdbcTemplate.call("sp_agregar_factura_a_viaje", dto.getViajeId(), dto.getFacturaId(), dto.getOrdenEntrega());
    return ResponseEntity.ok().build();
}
```

#### GET `/api/entregas-viaje/disponibles`
```java
@GetMapping("/disponibles")
public ResponseEntity<List<ViajeDTO>> getViajesDisponibles() {
    // Retorna viajes PLANIFICADOS o EN_RUTA
    return ResponseEntity.ok(viajeService.getDisponibles());
}
```

#### GET `/api/entregas-viaje/{id}/detalles`
```java
@GetMapping("/{id}/detalles")
public ResponseEntity<List<EntregaViajeDetalleDTO>> getDetallesViaje(@PathVariable Long id) {
    // Retorna todos los equipos del viaje con su estado
    return ResponseEntity.ok(viajeService.getDetallesViaje(id));
}
```

#### POST `/api/entregas-viaje/confirmar-entrega`
```java
@PostMapping("/confirmar-entrega")
public ResponseEntity<?> confirmarEntrega(@RequestBody ConfirmarEntregaEquipoDTO dto) {
    // Llama al procedimiento almacenado
    jdbcTemplate.call("sp_confirmar_entrega_equipo", 
        dto.getDetalleId(), dto.getReceptorNombre(), dto.getReceptorDni(), 
        dto.getObservaciones(), dto.getUsuarioId());
    return ResponseEntity.ok().build();
}
```

#### GET `/api/viajes/resumen`
```java
@GetMapping("/resumen")
public ResponseEntity<List<ViajeResumenDTO>> getResumenViajes() {
    // Usa la vista vista_viajes_resumen
    return ResponseEntity.ok(viajeService.getResumen());
}
```

---

## 🎯 Casos de Uso

### Caso 1: Entrega Inmediata (Sin Viaje)

**Escenario**: Cliente retira en planta

```
Usuario → Logística → Entregas de Equipos
1. Ve factura FAC-39 con 2 equipos FACTURADOS
2. Click "Entrega Inmediata"
3. Ingresa: Receptor: "Juan Pérez", DNI: "12345678"
4. Confirma
5. Sistema marca equipos → ENTREGADO
6. Factura desaparece de la lista
```

### Caso 2: Entrega Programada (Con Viaje)

**Escenario**: Entrega a domicilio con otros pedidos

```
Usuario → Logística → Entregas de Equipos
1. Ve factura FAC-39 con 2 equipos FACTURADOS
2. Click "Agregar a Viaje"
3. Selecciona "Viaje del 21/11/2025"
4. Confirma
5. Sistema vincula factura al viaje
6. Equipos quedan FACTURADOS (pendientes)

Conductor → Control de Entregas
7. Abre su viaje asignado
8. Ve lista de paradas
9. Llega a domicilio del cliente
10. Confirma entrega: Receptor: "María López"
11. Saca foto de la entrega
12. Firma digital del receptor
13. Confirma
14. Sistema marca equipos → ENTREGADO
```

### Caso 3: Entrega Rechazada

**Escenario**: Cliente ausente

```
Conductor → Control de Entregas
1. Llega a domicilio
2. Cliente no está
3. Selecciona "Rechazar Entrega"
4. Motivo: "Cliente ausente"
5. Observaciones: "Vecino indica que vuelve a las 18hs"
6. Confirma
7. Sistema marca estado_entrega → RECHAZADO
8. Equipos quedan FACTURADOS
9. Se puede reprogramar para otro día
```

---

## 📱 UI/UX - Mockups

### EntregasEquiposPage

```
┌────────────────────────────────────────────────────────┐
│  Entregas de Equipos                          [🔍]     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  📦 FAC-39 - Supermercado El Ahorro                   │
│  👤 Cliente: Supermercado El Ahorro                    │
│  📦 2 equipos por entregar                             │
│  📅 Fecha: 20/11/2025                                  │
│                                                         │
│  [✅ Entrega Inmediata]  [🚚 Agregar a Viaje]  [▼]    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ #22 HEL-0022 | Heladera Vertical | FACTURADO  │  │
│  │ #23 HEL-0023 | Heladera Vertical | FACTURADO  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Dialog: Agregar a Viaje

```
┌────────────────────────────────────────────────────────┐
│  Agregar Factura a Viaje de Entrega          [✖]     │
├────────────────────────────────────────────────────────┤
│  ℹ️ Factura: FAC-39                                    │
│     Cliente: Supermercado El Ahorro                    │
│     Equipos: 2                                         │
│                                                         │
│  [Seleccionar Viaje Existente] [+ Crear Nuevo Viaje]  │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ ☑ | Fecha      | Estado     | Conductor       │   │
│  ├────────────────────────────────────────────────┤   │
│  │ ✓ | 21/11/2025 | PLANIFICADO | Pedro García   │   │
│  │   | 22/11/2025 | PLANIFICADO | Sin asignar    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ℹ️ Los equipos quedarán en FACTURADO hasta que se     │
│     confirme la entrega desde Control de Entregas.     │
│                                                         │
│              [Cancelar]  [Agregar a Viaje]             │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Ejecutar script SQL `SQL_INTEGRACION_VIAJES_ENTREGAS.sql`
- [ ] Crear DTOs: `AgregarFacturaViajeDTO`, `ConfirmarEntregaEquipoDTO`
- [ ] Crear endpoints en `EntregaViajeController`
- [ ] Probar procedimientos almacenados
- [ ] Verificar permisos de roles

### Frontend
- [x] Agregar tipos TypeScript
- [x] Modificar `EntregasEquiposPage` con botón "Agregar a Viaje"
- [x] Crear dialog de selección de viaje
- [ ] Actualizar `TripsPage` para mostrar detalles de equipos
- [ ] Actualizar `DeliveriesPage` para confirmar entregas individuales
- [ ] Agregar API client para nuevos endpoints
- [ ] Probar flujo completo

### Testing
- [ ] Caso 1: Entrega Inmediata funciona correctamente
- [ ] Caso 2: Agregar factura a viaje existente
- [ ] Caso 3: Crear nuevo viaje y agregar factura
- [ ] Caso 4: Confirmar entrega desde Control de Entregas
- [ ] Caso 5: Rechazar entrega y reprogramar
- [ ] Caso 6: Ver historial de estados de equipos

---

## 🚀 Próximos Pasos

1. **AHORA**: Ejecuta el script SQL
   ```bash
   mysql -u root -p ripser_db < SQL_INTEGRACION_VIAJES_ENTREGAS.sql
   ```

2. **Backend**: Implementa los endpoints faltantes

3. **Frontend**: Actualiza TripsPage y DeliveriesPage

4. **Testing**: Prueba el flujo completo

---

## 📞 Soporte

Si tienes dudas sobre alguna parte de la integración:
- Revisa la documentación de cada componente
- Verifica los logs del backend
- Usa las vistas SQL para debugging
- Consulta el historial de estados de equipos

---

**Fecha de creación**: 2025-11-20  
**Versión**: 1.0  
**Estado**: ✅ Frontend Listo | ⏳ Backend Pendiente
