# Guía de Integración: Frontend con API Real de Entregas

## 📋 Resumen del Backend Real

Según la documentación del backend, la estructura es:

### Tabla: `entregas_viaje`
```
- id
- viaje_id (FK a viajes)
- documento_comercial_id (FK a documentos_comerciales - OPCIONAL)
- orden_servicio_id (FK a ordenes - OPCIONAL)
- direccion_entrega
- fecha_entrega
- estado (PENDIENTE, ENTREGADA, NO_ENTREGADA)
- observaciones
- receptor_nombre
- receptor_dni
```

## 🔄 Flujo Real vs Flujo Diseñado

### ❌ Flujo Diseñado (SQL_INTEGRACION_VIAJES_ENTREGAS.sql)
```
entrega_viaje_detalle table (diseñada pero NO implementada en backend)
├── Relaciona: viaje + factura + equipo individual
├── Stored procedures: sp_agregar_factura_a_viaje
└── Vista: vista_equipos_pendientes_viaje
```

### ✅ Flujo Real del Backend
```
entregas_viaje table (ya existe y está implementada)
├── Una entrega puede tener una factura asociada
├── NO hay relación directa equipo-individual en la tabla
└── La asociación equipos-factura está en detalle_documentos.equipos_fabricados_ids
```

## 🎯 Flujos de Trabajo Reales

### Caso 1: Entrega Inmediata (Ya implementado en frontend actual)
```
1. Usuario en EntregasEquiposPage ve facturas con equipos FACTURADOS
2. Click "Entrega Inmediata"
3. Frontend llama equipoFabricadoApi.marcarComoEntregado() para cada equipo
4. Estado cambia: FACTURADO → ENTREGADO
```

### Caso 2: Asociar Factura a Entrega Existente (NUEVO - usar API real)
```
1. Backend YA tiene entregas creadas (en viajes)
2. GET /api/entregas-viaje/disponibles → Entregas sin factura asignada
3. POST /api/entregas-viaje/agregar-factura → Asocia factura a entrega
   Body: { entregaId, documentoComercialId }
4. POST /api/entregas-viaje/confirmar-entrega → Confirma entrega y crea garantías
   Body: { entregaId, estado: 'ENTREGADA', receptorNombre, receptorDni, observaciones }
```

## 🔧 Cambios Necesarios en Frontend

### 1. EntregasEquiposPage.tsx - Mantener funcionalidad actual
El flujo actual funciona bien para entrega inmediata:
- ✅ Muestra facturas con equipos FACTURADOS
- ✅ Botón "Entrega Inmediata" marca equipos como ENTREGADO
- ✅ No necesita cambios

### 2. Agregar Nueva Pestaña: "Entregas Programadas"
Nueva sección para manejar entregas de viajes:

```tsx
// Tabs
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Entregas Inmediatas" />
  <Tab label="Entregas Programadas" />
</Tabs>

// Tab 1: Mantener actual (facturas → entrega inmediata)
// Tab 2: Nuevo (entregas disponibles → asociar factura → confirmar)
```

### 3. Nuevo Componente: EntregasViajesPage.tsx
Manejo completo del flujo de entregas programadas:

```tsx
// 1. Listar entregas disponibles (sin factura)
const entregasDisponibles = await entregaViajeApi.getDisponibles();

// 2. Asociar factura a entrega
await entregaViajeApi.agregarFactura(entregaId, facturaId);

// 3. Confirmar entrega (crea garantías automáticamente)
await entregaViajeApi.confirmarEntrega(
  entregaId,
  'ENTREGADA',
  receptorNombre,
  receptorDni,
  observaciones
);
```

## 📊 Componentes Actualizados

### TripsPage.tsx (Armado de Viajes)
```tsx
// Mostrar entregas del viaje con detalles
const viaje = await viajeApi.getById(id);
const entregas = await entregaViajeApi.getByViaje(viaje.id);

// Por cada entrega, mostrar:
entregas.map(entrega => {
  const detalles = await entregaViajeApi.getDetalles(entrega.id);
  // detalles.equipos → Lista de equipos de la factura
  // detalles.clienteNombre → Nombre del cliente
  // detalles.direccionEntrega → Dirección
});
```

### DeliveriesPage.tsx (Control de Entregas)
```tsx
// Mostrar entregas pendientes del viaje
const entregas = await entregaViajeApi.getByEstado('PENDIENTE');

// Confirmar entrega individual
await entregaViajeApi.confirmarEntrega(
  entrega.id,
  'ENTREGADA', // o 'NO_ENTREGADA'
  receptorNombre,
  receptorDni,
  observaciones
);

// Backend automáticamente:
// - Marca estado como ENTREGADA
// - Crea garantías de equipos (si es factura)
// - Cambia equipos a ENTREGADO
```

## 🚀 Plan de Implementación

### Fase 1: Actualizar API Services ✅
- [x] Agregar 4 nuevos métodos a entregaViajeApi.ts
  - agregarFactura()
  - getDisponibles()
  - getDetalles()
  - confirmarEntrega()

### Fase 2: Mantener EntregasEquiposPage Actual
- [x] Funcionalidad actual de "Entrega Inmediata" funciona correctamente
- [ ] Opcional: Quitar botón "Agregar a Viaje" (no funciona con backend real)

### Fase 3: Actualizar TripsPage
- [ ] Mostrar entregas asociadas al viaje
- [ ] Mostrar equipos de cada entrega (via getDetalles)
- [ ] Permitir asignar conductor/vehículo

### Fase 4: Actualizar DeliveriesPage
- [ ] Listar entregas PENDIENTES del viaje actual
- [ ] Botón "Confirmar Entrega" por cada entrega
- [ ] Dialog para capturar receptor, DNI, observaciones
- [ ] Llamar confirmarEntrega() → Backend crea garantías automáticamente

### Fase 5: Nueva Funcionalidad - Asociar Facturas a Entregas
- [ ] Crear EntregasDisponiblesPage o agregar tab en EntregasEquiposPage
- [ ] Listar entregas sin factura (getDisponibles)
- [ ] Selector de facturas
- [ ] Botón "Asociar Factura" → agregarFactura()

## ⚠️ Notas Importantes

1. **SQL_INTEGRACION_VIAJES_ENTREGAS.sql NO es necesario**
   - El backend ya tiene su propia estructura
   - La tabla `entrega_viaje_detalle` NO existe en el backend real
   - Los stored procedures diseñados NO aplican

2. **equipos_fabricados_ids sigue siendo la fuente de verdad**
   - Los equipos están en `detalle_documentos.equipos_fabricados_ids`
   - El backend usa este campo para saber qué equipos crear garantías

3. **Backend maneja la lógica de garantías**
   - Al confirmar entrega de factura, el backend crea garantías automáticamente
   - Frontend solo llama `confirmarEntrega()`

4. **Estados de equipos se manejan indirectamente**
   - Frontend: `equipoFabricadoApi.marcarComoEntregado()` (entrega inmediata)
   - Backend: `confirmarEntrega()` automáticamente cambia estado a ENTREGADO

## 🎯 Siguiente Paso Inmediato

Remover del EntregasEquiposPage el botón y diálogo "Agregar a Viaje" ya que:
- No funciona con la API real
- El flujo real requiere que las entregas YA existan
- Las entregas se crean desde TripsPage primero, luego se asocian facturas

¿Proceder con la limpieza del código?
