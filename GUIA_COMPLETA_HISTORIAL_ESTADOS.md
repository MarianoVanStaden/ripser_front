# 🚀 Guía Rápida: Implementación Completa del Historial de Estados

## ✅ ESTADO ACTUAL DEL FRONTEND

El frontend **YA ESTÁ COMPLETAMENTE CONFIGURADO** con los siguientes cambios:

### 1️⃣ **Tipos TypeScript Actualizados** ✅
```typescript
// src/types/index.ts
export interface HistorialEstadoEquipo {
  id: number;
  equipoFabricadoId: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  observaciones?: string;
  usuarioNombre?: string;      // ✅ NUEVO
  documentoId?: number;         // ✅ NUEVO
  tipoDocumento?: string;       // ✅ NUEVO
}
```

### 2️⃣ **API Client Configurado** ✅
```typescript
// src/api/services/equipoFabricadoApi.ts

// GET /api/equipos-fabricados/{id}/historial-estados
// Ya implementado en: src/api/historialEstadoEquipoApi.ts

// PUT /api/equipos-fabricados/{id}/estado-asignacion
updateEstadoAsignacion: async (equipoId: number, nuevoEstado: string) => {
  const response = await api.put<EquipoFabricadoDTO>(
    `/api/equipos-fabricados/${equipoId}/estado-asignacion`,
    { estadoAsignacion: nuevoEstado }
  );
  return response.data;
}
```

### 3️⃣ **Componente EquipoDetail Mejorado** ✅
- ✅ Timeline visual con estados
- ✅ Muestra usuario que hizo el cambio
- ✅ Muestra documento asociado (tipo y ID)
- ✅ Muestra observaciones
- ✅ Botón "Cambiar Estado" manual
- ✅ Dialog de confirmación de cambio de estado
- ✅ Validaciones de estado
- ✅ Recarga automática después del cambio

---

## ⚠️ LO QUE FALTA: BACKEND

### Archivos que Debes Crear en el Backend:

#### 📁 **1. HistorialEstadoEquipo.java** (Entity)
```
Ubicación: src/main/java/com/ripser/api/entity/HistorialEstadoEquipo.java
```

#### 📁 **2. HistorialEstadoEquipoDTO.java**
```
Ubicación: src/main/java/com/ripser/api/dto/HistorialEstadoEquipoDTO.java
```

#### 📁 **3. HistorialEstadoEquipoRepository.java**
```
Ubicación: src/main/java/com/ripser/api/repository/HistorialEstadoEquipoRepository.java
```

#### 📁 **4. HistorialEstadoEquipoService.java**
```
Ubicación: src/main/java/com/ripser/api/service/HistorialEstadoEquipoService.java
```

#### 📁 **5. Actualizar EquipoFabricadoController.java**
```
Agregar 2 nuevos endpoints:
- GET /api/equipos-fabricados/{id}/historial-estados
- PUT /api/equipos-fabricados/{id}/estado-asignacion
```

#### 📁 **6. Script SQL**
```sql
CREATE TABLE IF NOT EXISTS historial_estado_equipo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipo_fabricado_id BIGINT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    fecha_cambio DATETIME NOT NULL,
    observaciones VARCHAR(500),
    usuario_nombre VARCHAR(200),
    documento_id BIGINT,
    tipo_documento VARCHAR(50),
    FOREIGN KEY (equipo_fabricado_id) REFERENCES equipo_fabricado(id) ON DELETE CASCADE
);

CREATE INDEX idx_historial_equipo_fabricado ON historial_estado_equipo(equipo_fabricado_id);
CREATE INDEX idx_historial_fecha ON historial_estado_equipo(fecha_cambio DESC);
```

---

## 🎯 CÓMO USAR EL SISTEMA (UNA VEZ COMPLETO)

### Escenario 1: Ver Historial de un Equipo

1. Ve a **Producción → Equipos Fabricados**
2. Busca el equipo que quieres ver (ej: HEL-0022)
3. Haz clic en el equipo
4. Scroll hacia abajo hasta "Historial de Estados de Asignación"
5. Verás un **Timeline visual** con todos los cambios:
   - ✅ Fecha y hora de cada cambio
   - ✅ Estado anterior → Estado nuevo
   - ✅ Usuario que hizo el cambio
   - ✅ Documento asociado (ej: FACTURA #200)
   - ✅ Observaciones

### Escenario 2: Cambiar Estado Manualmente

1. Estando en el detalle del equipo
2. Haz clic en el botón **"Cambiar Estado"** (ícono de History)
3. Selecciona el nuevo estado del dropdown:
   - DISPONIBLE
   - RESERVADO
   - FACTURADO
   - ENTREGADO
4. Haz clic en "Cambiar"
5. El sistema:
   - ✅ Actualiza el estado
   - ✅ Registra el cambio en el historial
   - ✅ Recarga automáticamente
   - ✅ Muestra el nuevo estado en el Timeline

---

## 🔍 SOLUCIÓN A TU PROBLEMA ACTUAL

### Tu Situación:
- ✅ Facturaste 2 equipos
- ❌ Están en "estado pendiente" (probablemente no en FACTURADO)
- ❌ No aparecen en EntregasEquiposPage

### Solución Temporal (HASTA QUE FUNCIONE EL BACKEND):

#### Opción A: Directo en la Base de Datos (RÁPIDO)
```sql
-- Ver el estado actual de tus equipos
SELECT id, numero_heladera, estado_asignacion, asignado
FROM equipo_fabricado
WHERE id IN (22, 23); -- Reemplaza con los IDs de tus equipos

-- Cambiar a FACTURADO
UPDATE equipo_fabricado
SET estado_asignacion = 'FACTURADO',
    asignado = true
WHERE id IN (22, 23); -- Reemplaza con los IDs de tus equipos

-- Verificar cambio
SELECT id, numero_heladera, estado_asignacion, asignado
FROM equipo_fabricado
WHERE id IN (22, 23);
```

Después de ejecutar esto:
1. Refresca la página de **Logística → Entregas de Equipos**
2. Tu factura debería aparecer con los 2 equipos

#### Opción B: Implementar el Backend (RECOMENDADO)
1. Sigue la guía en `BACKEND_FIX_EQUIPOS_ENDPOINTS.md`
2. Crea los 6 archivos Java
3. Ejecuta el script SQL
4. Reinicia el backend
5. Usa el botón "Cambiar Estado" desde el frontend

---

## 📊 FLUJO COMPLETO ESPERADO

### Estado Ideal de tus Equipos:

```
CREACIÓN:
└─ Equipo creado → DISPONIBLE

RESERVA:
└─ Nota de Pedido creada → RESERVADO

FACTURACIÓN:
└─ Factura creada → FACTURADO ✅ (Aquí deberían estar tus equipos)

ENTREGA:
└─ Confirmación de entrega → ENTREGADO
```

### Tu Caso:
```
1. Factura creada ✅
2. Equipos deberían estar en FACTURADO ❌ (pero están en "pendiente")
3. EntregasEquiposPage busca FACTURADO ❌ (no encuentra tus equipos)
```

### Solución:
```
1. Cambiar equipos a FACTURADO (SQL o Frontend cuando funcione)
2. Equipos aparecen en EntregasEquiposPage ✅
3. Confirmar entrega → ENTREGADO ✅
```

---

## 🧪 TESTING

### Test 1: Verificar Estado de Equipos
```sql
SELECT 
    ef.id,
    ef.numero_heladera,
    ef.estado_asignacion,
    ef.asignado,
    ef.cliente_id,
    c.nombre as cliente_nombre
FROM equipo_fabricado ef
LEFT JOIN cliente c ON ef.cliente_id = c.id
WHERE ef.id IN (22, 23); -- Tus equipos
```

### Test 2: Ver Facturas con Equipos
```sql
SELECT 
    d.id as factura_id,
    d.numero_documento,
    d.tipo_documento,
    dd.equipo_fabricados_ids,
    ef.estado_asignacion
FROM documento d
INNER JOIN detalle_documento dd ON d.id = dd.documento_id
INNER JOIN equipo_fabricado ef ON ef.id = ANY(dd.equipo_fabricados_ids)
WHERE d.tipo_documento = 'FACTURA'
AND ef.estado_asignacion = 'FACTURADO';
```

### Test 3: Verificar Historial (después de implementar backend)
```sql
SELECT * FROM historial_estado_equipo
WHERE equipo_fabricado_id IN (22, 23)
ORDER BY fecha_cambio DESC;
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Frontend (✅ COMPLETO)
- [x] Tipos TypeScript actualizados
- [x] API client configurado
- [x] Timeline visual implementado
- [x] Botón "Cambiar Estado" agregado
- [x] Dialog de cambio de estado
- [x] Validaciones implementadas
- [x] Recarga automática
- [x] Manejo de errores

### Backend (⏳ PENDIENTE)
- [ ] Crear tabla `historial_estado_equipo`
- [ ] Crear entity `HistorialEstadoEquipo`
- [ ] Crear DTO `HistorialEstadoEquipoDTO`
- [ ] Crear repository `HistorialEstadoEquipoRepository`
- [ ] Crear service `HistorialEstadoEquipoService`
- [ ] Agregar endpoints en `EquipoFabricadoController`
- [ ] Probar endpoints en Postman
- [ ] Verificar permisos de roles

### Datos (⏳ PENDIENTE)
- [ ] Cambiar equipos facturados a estado FACTURADO
- [ ] Verificar que aparezcan en EntregasEquiposPage
- [ ] Probar flujo completo de entrega

---

## 🎓 PARA ENTENDER MEJOR

### ¿Por qué no aparecen mis equipos?

**EntregasEquiposPage hace esto:**
```typescript
// 1. Obtiene todas las facturas
const facturas = await documentoApi.getByTipo('FACTURA');

// 2. Para cada factura, obtiene los IDs de equipos
const equiposIds = factura.detalles
  .filter(d => d.tipoItem === 'EQUIPO')
  .flatMap(d => d.equiposFabricadosIds || []);

// 3. Carga cada equipo
const equipos = await Promise.all(
  equiposIds.map(id => equipoFabricadoApi.findById(id))
);

// 4. FILTRA solo los FACTURADOS
const equiposPorEntregar = equipos.filter(
  e => e.estadoAsignacion === 'FACTURADO'  // ⚠️ AQUÍ SE FILTRA
);

// 5. Si no hay equipos FACTURADOS, la factura no se muestra
```

### ¿Qué significa "estado pendiente"?

Probablemente tu equipo tenga un estado diferente:
- ❌ `null` o vacío
- ❌ `DISPONIBLE`
- ❌ `RESERVADO`
- ❌ Cualquier cosa que NO sea `FACTURADO`

### ¿Cómo lo arreglo YA?

**Método más rápido (SQL):**
```sql
UPDATE equipo_fabricado
SET estado_asignacion = 'FACTURADO'
WHERE id IN (
  SELECT DISTINCT ef.id
  FROM equipo_fabricado ef
  INNER JOIN documento d ON d.cliente_id = ef.cliente_id
  WHERE d.tipo_documento = 'FACTURA'
  AND d.id = 200  -- ID de tu factura
);
```

Cambia `200` por el ID de tu factura y ejecuta en MySQL.

---

## 🆘 SI NECESITAS AYUDA

### Problema: "No puedo cambiar el estado desde el frontend"
**Causa:** Faltan endpoints en el backend  
**Solución:** Implementa los archivos del backend según `BACKEND_FIX_EQUIPOS_ENDPOINTS.md`

### Problema: "Los equipos no aparecen en la página de entregas"
**Causa:** Los equipos no están en estado FACTURADO  
**Solución:** Ejecuta el UPDATE SQL de arriba

### Problema: "Error 403 Forbidden"
**Causa:** Tu usuario no tiene permisos  
**Solución:** Agrega tu rol en `@PreAuthorize()` del controller

### Problema: "El historial no se muestra"
**Causa:** La tabla `historial_estado_equipo` no existe  
**Solución:** Ejecuta el script SQL de creación de tabla

---

## 📞 PRÓXIMOS PASOS

1. **AHORA MISMO**: Ejecuta el UPDATE SQL para cambiar tus equipos a FACTURADO
2. **HOY**: Implementa los endpoints del backend
3. **MAÑANA**: Prueba el flujo completo
4. **DESPUÉS**: Capacita al equipo sobre el nuevo sistema

---

**Última actualización**: 2025-11-20  
**Estado Frontend**: ✅ COMPLETO  
**Estado Backend**: ⏳ PENDIENTE  
**Estado Datos**: ⚠️ REQUIERE AJUSTE
