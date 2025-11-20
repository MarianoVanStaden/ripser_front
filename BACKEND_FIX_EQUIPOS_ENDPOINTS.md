# Fix Backend: Endpoints de Equipos Fabricados

## ⚠️ PROBLEMA DETECTADO

Los siguientes endpoints están retornando **403 Forbidden**:
- `GET /api/equipos-fabricados/{id}/historial-estados`
- `PUT /api/equipos-fabricados/{id}/estado-asignacion`

Esto significa que **faltan en el backend** o **no tienen los permisos configurados**.

---

## 🔧 SOLUCIÓN: Agregar Endpoints al Backend

### 1️⃣ EquipoFabricadoController.java

Agrega estos dos métodos en tu `EquipoFabricadoController`:

```java
package com.ripser.api.controller;

import com.ripser.api.dto.HistorialEstadoEquipoDTO;
import com.ripser.api.service.HistorialEstadoEquipoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipos-fabricados")
@CrossOrigin(origins = "*")
public class EquipoFabricadoController {

    // ... tus otros métodos existentes ...
    
    @Autowired
    private HistorialEstadoEquipoService historialEstadoEquipoService;

    /**
     * Endpoint 1: Obtener historial de estados de un equipo
     * GET /api/equipos-fabricados/{id}/historial-estados
     */
    @GetMapping("/{id}/historial-estados")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'GERENTE', 'LOGISTICA', 'PRODUCCION')")
    public ResponseEntity<List<HistorialEstadoEquipoDTO>> getHistorialEstados(@PathVariable Long id) {
        try {
            List<HistorialEstadoEquipoDTO> historial = historialEstadoEquipoService.getHistorialByEquipoId(id);
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Endpoint 2: Cambiar estado de asignación manualmente
     * PUT /api/equipos-fabricados/{id}/estado-asignacion
     * Body: { "estadoAsignacion": "FACTURADO" }
     */
    @PutMapping("/{id}/estado-asignacion")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'LOGISTICA')")
    public ResponseEntity<EquipoFabricadoDTO> updateEstadoAsignacion(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        try {
            String nuevoEstado = request.get("estadoAsignacion");
            if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            EquipoFabricado equipo = equipoFabricadoService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Equipo no encontrado"));

            // Validar estado válido
            EstadoAsignacionEquipo estadoEnum;
            try {
                estadoEnum = EstadoAsignacionEquipo.valueOf(nuevoEstado);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }

            // Cambiar estado
            equipo.setEstadoAsignacion(estadoEnum);
            EquipoFabricado equipoActualizado = equipoFabricadoService.save(equipo);

            // Registrar en historial
            historialEstadoEquipoService.registrarCambioEstado(
                    equipoActualizado,
                    estadoEnum,
                    "Cambio manual de estado"
            );

            // Convertir a DTO y devolver
            EquipoFabricadoDTO dto = equipoFabricadoMapper.toDTO(equipoActualizado);
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
```

---

### 2️⃣ HistorialEstadoEquipoService.java

Si no existe, crea este servicio:

```java
package com.ripser.api.service;

import com.ripser.api.dto.HistorialEstadoEquipoDTO;
import com.ripser.api.entity.EquipoFabricado;
import com.ripser.api.entity.EstadoAsignacionEquipo;
import com.ripser.api.entity.HistorialEstadoEquipo;
import com.ripser.api.repository.HistorialEstadoEquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class HistorialEstadoEquipoService {

    @Autowired
    private HistorialEstadoEquipoRepository historialRepository;

    /**
     * Obtener historial de un equipo
     */
    public List<HistorialEstadoEquipoDTO> getHistorialByEquipoId(Long equipoId) {
        List<HistorialEstadoEquipo> historial = historialRepository.findByEquipoFabricadoIdOrderByFechaCambioDesc(equipoId);
        return historial.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Registrar cambio de estado
     */
    public void registrarCambioEstado(
            EquipoFabricado equipo,
            EstadoAsignacionEquipo nuevoEstado,
            String observaciones
    ) {
        HistorialEstadoEquipo historial = new HistorialEstadoEquipo();
        historial.setEquipoFabricado(equipo);
        historial.setEstadoAnterior(equipo.getEstadoAsignacion());
        historial.setEstadoNuevo(nuevoEstado);
        historial.setFechaCambio(LocalDateTime.now());
        historial.setObservaciones(observaciones);
        historialRepository.save(historial);
    }

    /**
     * Convertir entidad a DTO
     */
    private HistorialEstadoEquipoDTO toDTO(HistorialEstadoEquipo historial) {
        HistorialEstadoEquipoDTO dto = new HistorialEstadoEquipoDTO();
        dto.setId(historial.getId());
        dto.setEquipoFabricadoId(historial.getEquipoFabricado().getId());
        dto.setEstadoAnterior(historial.getEstadoAnterior() != null ? historial.getEstadoAnterior().name() : null);
        dto.setEstadoNuevo(historial.getEstadoNuevo().name());
        dto.setFechaCambio(historial.getFechaCambio());
        dto.setObservaciones(historial.getObservaciones());
        return dto;
    }
}
```

---

### 3️⃣ HistorialEstadoEquipoRepository.java

```java
package com.ripser.api.repository;

import com.ripser.api.entity.HistorialEstadoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialEstadoEquipoRepository extends JpaRepository<HistorialEstadoEquipo, Long> {
    
    List<HistorialEstadoEquipo> findByEquipoFabricadoIdOrderByFechaCambioDesc(Long equipoFabricadoId);
}
```

---

### 4️⃣ HistorialEstadoEquipoDTO.java

```java
package com.ripser.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HistorialEstadoEquipoDTO {
    private Long id;
    private Long equipoFabricadoId;
    private String estadoAnterior;
    private String estadoNuevo;
    private LocalDateTime fechaCambio;
    private String observaciones;
}
```

---

### 5️⃣ HistorialEstadoEquipo.java (Entidad)

Si no existe, crea la entidad:

```java
package com.ripser.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_estado_equipo")
@Data
public class HistorialEstadoEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_fabricado_id", nullable = false)
    private EquipoFabricado equipoFabricado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 50)
    private EstadoAsignacionEquipo estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", length = 50, nullable = false)
    private EstadoAsignacionEquipo estadoNuevo;

    @Column(name = "fecha_cambio", nullable = false)
    private LocalDateTime fechaCambio;

    @Column(name = "observaciones", length = 500)
    private String observaciones;
}
```

---

### 6️⃣ Script SQL - IMPORTANTE: Ejecutar en este orden

#### A) Primero: Agregar columna estado_asignacion (si no existe)

```sql
-- Verificar si la columna existe
DESCRIBE equipos_fabricados;

-- Agregar columna estado_asignacion
ALTER TABLE equipos_fabricados
ADD COLUMN estado_asignacion VARCHAR(50) DEFAULT 'DISPONIBLE' AFTER asignado;

-- Actualizar equipos existentes
UPDATE equipos_fabricados
SET estado_asignacion = 'DISPONIBLE'
WHERE asignado = FALSE OR cliente_id IS NULL;

UPDATE equipos_fabricados
SET estado_asignacion = 'RESERVADO'
WHERE asignado = TRUE AND cliente_id IS NOT NULL;
```

#### B) Segundo: Crear tabla de historial

```sql
CREATE TABLE IF NOT EXISTS historial_estado_equipo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipo_fabricado_id BIGINT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones VARCHAR(500),
    usuario_nombre VARCHAR(200),
    documento_id BIGINT,
    tipo_documento VARCHAR(50),
    FOREIGN KEY (equipo_fabricado_id) REFERENCES equipos_fabricados(id) ON DELETE CASCADE
);

-- Índices para mejorar consultas
CREATE INDEX idx_historial_equipo_fabricado ON historial_estado_equipo(equipo_fabricado_id);
CREATE INDEX idx_historial_fecha ON historial_estado_equipo(fecha_cambio DESC);
```

#### C) Tercero: Registrar historial inicial (opcional)

```sql
INSERT INTO historial_estado_equipo (
    equipo_fabricado_id,
    estado_anterior,
    estado_nuevo,
    fecha_cambio,
    observaciones
)
SELECT 
    id,
    NULL,
    estado_asignacion,
    fecha_creacion,
    'Estado inicial al migrar'
FROM equipos_fabricados
WHERE estado_asignacion IS NOT NULL;
```

---

## ✅ VERIFICACIÓN

Después de agregar estos archivos:

1. **Reinicia el backend**
2. **Prueba en Postman:**
   ```
   GET http://localhost:8080/api/equipos-fabricados/22/historial-estados
   Headers: Authorization: Bearer <tu-token>
   ```
3. **Prueba cambio de estado:**
   ```
   PUT http://localhost:8080/api/equipos-fabricados/22/estado-asignacion
   Headers: 
     Authorization: Bearer <tu-token>
     Content-Type: application/json
   Body:
   {
     "estadoAsignacion": "FACTURADO"
   }
   ```

---

## 🎯 PERMISOS REQUERIDOS

### Historial (GET):
- ✅ ADMIN
- ✅ VENDEDOR
- ✅ GERENTE
- ✅ LOGISTICA
- ✅ PRODUCCION

### Cambiar Estado (PUT):
- ✅ ADMIN
- ✅ GERENTE
- ✅ LOGISTICA

Si tu usuario no tiene estos roles, agrega tu rol en `@PreAuthorize()`.

---

## 📋 CHECKLIST

- [ ] Crear `HistorialEstadoEquipo` entity
- [ ] Crear `HistorialEstadoEquipoDTO`
- [ ] Crear `HistorialEstadoEquipoRepository`
- [ ] Crear `HistorialEstadoEquipoService`
- [ ] Agregar métodos en `EquipoFabricadoController`
- [ ] Ejecutar script SQL para crear tabla
- [ ] Reiniciar backend
- [ ] Probar endpoints en Postman
- [ ] Verificar en frontend que funcione

---

## 🔄 FLUJO COMPLETO

```
FRONTEND:
1. Usuario abre EquipoDetail
2. Llama: GET /api/equipos-fabricados/{id}/historial-estados
3. Usuario hace clic en "Cambiar Estado"
4. Llama: PUT /api/equipos-fabricados/{id}/estado-asignacion

BACKEND:
1. Recibe petición PUT
2. Valida estado nuevo
3. Actualiza equipo.estadoAsignacion
4. Registra en historial_estado_equipo
5. Devuelve equipo actualizado

FRONTEND:
1. Recibe equipo actualizado
2. Recarga historial
3. Muestra Timeline actualizado ✅
```
