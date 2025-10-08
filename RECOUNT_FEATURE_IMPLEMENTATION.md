# 📊 Inventory Recount Feature - Full Implementation

## Overview

This document details the complete implementation of the inventory recount feature, which allows warehouse managers to initiate physical inventory counts and track discrepancies.

---

## 🎯 Backend Implementation (Spring Boot)

### 1. **Create DTOs**

#### `RecuentoRequest.java`
```java
package com.ripser.dto;

import lombok.Data;

@Data
public class RecuentoRequest {
    private Long categoriaId;  // null = toda la bodega
    private String notas;
    private Long usuarioId;
}
```

#### `RecuentoResponse.java`
```java
package com.ripser.dto;

import lombok.Data;
import java.util.List;

@Data
public class RecuentoResponse {
    private Long recuentoId;
    private Integer totalProductos;
    private String categoriaSeleccionada;
    private String notas;
    private String fechaInicio;
    private List<MovimientoStockDTO> movimientos;
}
```

---

### 2. **Add Recount Type to MovimientoStock**

Update `TipoMovimiento` enum if needed:

```java
public enum TipoMovimiento {
    ENTRADA,
    SALIDA,
    AJUSTE,
    RECUENTO  // Add this if not exists
}
```

---

### 3. **Create Controller Endpoint**

Add to `MovimientoStockController.java`:

```java
package com.ripser.controller;

import com.ripser.dto.RecuentoRequest;
import com.ripser.dto.RecuentoResponse;
import com.ripser.service.MovimientoStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movimientos-stock")
@RequiredArgsConstructor
public class MovimientoStockController {

    private final MovimientoStockService movimientoStockService;

    /**
     * Inicia un recuento de inventario
     * @param request datos del recuento
     * @return detalles del recuento iniciado
     */
    @PostMapping("/iniciar-recuento")
    public ResponseEntity<RecuentoResponse> iniciarRecuento(
            @RequestBody RecuentoRequest request) {
        
        RecuentoResponse response = movimientoStockService.iniciarRecuento(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Completa un item de recuento
     * @param movimientoId ID del movimiento de recuento
     * @param cantidadReal cantidad física contada
     * @return movimiento actualizado
     */
    @PutMapping("/completar-recuento/{movimientoId}")
    public ResponseEntity<MovimientoStock> completarRecuento(
            @PathVariable Long movimientoId,
            @RequestParam Integer cantidadReal) {
        
        MovimientoStock updated = movimientoStockService.completarRecuento(
            movimientoId, cantidadReal);
        return ResponseEntity.ok(updated);
    }

    /**
     * Obtiene movimientos de recuento pendientes
     * @return lista de recuentos pendientes
     */
    @GetMapping("/recuentos-pendientes")
    public ResponseEntity<List<MovimientoStock>> getRecuentosPendientes() {
        List<MovimientoStock> pendientes = movimientoStockService
            .findByTipoAndStockActualIsNull(TipoMovimiento.RECUENTO);
        return ResponseEntity.ok(pendientes);
    }
}
```

---

### 4. **Create Service Methods**

Add to `MovimientoStockService.java`:

```java
package com.ripser.service;

import com.ripser.dto.RecuentoRequest;
import com.ripser.dto.RecuentoResponse;
import com.ripser.entity.MovimientoStock;
import com.ripser.entity.Producto;
import com.ripser.entity.CategoriaProducto;
import com.ripser.repository.MovimientoStockRepository;
import com.ripser.repository.ProductoRepository;
import com.ripser.repository.CategoriaProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovimientoStockService {

    private final MovimientoStockRepository movimientoStockRepository;
    private final ProductoRepository productoRepository;
    private final CategoriaProductoRepository categoriaProductoRepository;

    /**
     * Inicia un recuento de inventario
     */
    @Transactional
    public RecuentoResponse iniciarRecuento(RecuentoRequest request) {
        
        // 1. Obtener productos a recontar
        List<Producto> productos;
        CategoriaProducto categoria = null;
        
        if (request.getCategoriaId() != null) {
            categoria = categoriaProductoRepository.findById(request.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
            productos = productoRepository.findByCategoriaProductoId(request.getCategoriaId());
        } else {
            productos = productoRepository.findAll();
        }

        // 2. Crear movimientos de recuento para cada producto
        List<MovimientoStock> movimientos = new ArrayList<>();
        LocalDateTime ahora = LocalDateTime.now();
        
        for (Producto producto : productos) {
            MovimientoStock movimiento = new MovimientoStock();
            movimiento.setProducto(producto);
            movimiento.setTipo(TipoMovimiento.RECUENTO);
            movimiento.setStockAnterior(producto.getStockActual());
            movimiento.setStockActual(null); // Se completará cuando se cuente
            movimiento.setCantidad(0); // Se calculará al completar
            movimiento.setConcepto("Recuento de inventario: " + 
                (request.getNotas() != null ? request.getNotas() : "Recuento general"));
            movimiento.setNumeroComprobante("REC-" + ahora.format(
                java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            movimiento.setFecha(ahora);
            movimiento.setUsuarioId(request.getUsuarioId());
            
            movimientos.add(movimientoStockRepository.save(movimiento));
        }

        // 3. Crear respuesta
        RecuentoResponse response = new RecuentoResponse();
        response.setRecuentoId(ahora.toEpochSecond(java.time.ZoneOffset.UTC));
        response.setTotalProductos(productos.size());
        response.setCategoriaSeleccionada(
            categoria != null ? categoria.getNombre() : "Toda la bodega");
        response.setNotas(request.getNotas());
        response.setFechaInicio(ahora.toString());
        // Solo incluir IDs en vez de objetos completos para reducir payload
        response.setMovimientos(movimientos.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList()));

        return response;
    }

    /**
     * Completa un item de recuento
     */
    @Transactional
    public MovimientoStock completarRecuento(Long movimientoId, Integer cantidadReal) {
        
        MovimientoStock movimiento = movimientoStockRepository.findById(movimientoId)
            .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        if (!TipoMovimiento.RECUENTO.equals(movimiento.getTipo())) {
            throw new RuntimeException("Este movimiento no es un recuento");
        }

        if (movimiento.getStockActual() != null) {
            throw new RuntimeException("Este recuento ya fue completado");
        }

        // Actualizar el movimiento
        movimiento.setStockActual(cantidadReal);
        movimiento.setCantidad(cantidadReal - movimiento.getStockAnterior());
        
        // Actualizar stock del producto
        Producto producto = movimiento.getProducto();
        producto.setStockActual(cantidadReal);
        productoRepository.save(producto);

        // Si hay diferencia, crear un ajuste automático
        if (movimiento.getCantidad() != 0) {
            MovimientoStock ajuste = new MovimientoStock();
            ajuste.setProducto(producto);
            ajuste.setTipo(TipoMovimiento.AJUSTE);
            ajuste.setStockAnterior(movimiento.getStockAnterior());
            ajuste.setStockActual(cantidadReal);
            ajuste.setCantidad(movimiento.getCantidad());
            ajuste.setConcepto("Ajuste automático por recuento: " + 
                movimiento.getNumeroComprobante());
            ajuste.setNumeroComprobante("ADJ-AUTO-" + movimientoId);
            ajuste.setFecha(LocalDateTime.now());
            ajuste.setUsuarioId(movimiento.getUsuarioId());
            
            movimientoStockRepository.save(ajuste);
        }

        return movimientoStockRepository.save(movimiento);
    }

    /**
     * Obtiene movimientos por tipo y stock actual nulo
     */
    public List<MovimientoStock> findByTipoAndStockActualIsNull(TipoMovimiento tipo) {
        return movimientoStockRepository.findByTipoAndStockActualIsNull(tipo);
    }

    private MovimientoStockDTO convertToDTO(MovimientoStock movimiento) {
        // Implement DTO conversion logic
        MovimientoStockDTO dto = new MovimientoStockDTO();
        dto.setId(movimiento.getId());
        dto.setProductoId(movimiento.getProducto().getId());
        dto.setProductoNombre(movimiento.getProducto().getNombre());
        dto.setTipo(movimiento.getTipo().name());
        dto.setStockAnterior(movimiento.getStockAnterior());
        dto.setStockActual(movimiento.getStockActual());
        dto.setCantidad(movimiento.getCantidad());
        dto.setConcepto(movimiento.getConcepto());
        dto.setNumeroComprobante(movimiento.getNumeroComprobante());
        dto.setFecha(movimiento.getFecha());
        return dto;
    }
}
```

---

### 5. **Update Repository**

Add to `MovimientoStockRepository.java`:

```java
package com.ripser.repository;

import com.ripser.entity.MovimientoStock;
import com.ripser.entity.TipoMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, Long> {
    
    // Existing methods...
    
    /**
     * Encuentra movimientos de recuento pendientes (sin stockActual)
     */
    List<MovimientoStock> findByTipoAndStockActualIsNull(TipoMovimiento tipo);
    
    /**
     * Encuentra movimientos por producto y tipo
     */
    List<MovimientoStock> findByProductoIdAndTipo(Long productoId, TipoMovimiento tipo);
}
```

---

### 6. **Add to ProductoRepository**

```java
package com.ripser.repository;

import com.ripser.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    
    // Existing methods...
    
    /**
     * Encuentra productos por categoría
     */
    List<Producto> findByCategoriaProductoId(Long categoriaId);
}
```

---

## 🎨 Frontend Implementation

### Files to Update/Create:

1. ✅ `movimientoStockApi.ts` - Add recount API methods
2. ✅ `InventoryPage.tsx` - Update to call real API
3. ✅ `RecountTasksPage.tsx` - New page for managing recount tasks
4. ✅ Add route in App.tsx

---

## 📋 Testing Checklist

### Backend Testing:
- [ ] POST `/api/movimientos-stock/iniciar-recuento` creates movements
- [ ] Verify movements have `stockActual = null` initially
- [ ] PUT `/api/movimientos-stock/completar-recuento/{id}` updates stock
- [ ] Verify automatic adjustment creation when difference exists
- [ ] GET `/api/movimientos-stock/recuentos-pendientes` returns pending recounts

### Frontend Testing:
- [ ] "Iniciar Recuento" button opens dialog
- [ ] Can select category or "Toda la bodega"
- [ ] Backend creates recount movements successfully
- [ ] Success message shows number of products
- [ ] Recount tasks page shows pending items
- [ ] Can complete individual recount items
- [ ] Stock updates after completing recount
- [ ] Automatic adjustment appears in adjustments table

---

## 🚀 Deployment Steps

1. **Backend**:
   - Add DTOs
   - Update controller
   - Implement service methods
   - Update repositories
   - Run database migrations if needed
   - Test endpoints with Postman

2. **Frontend**:
   - Update API service
   - Update InventoryPage
   - Create RecountTasksPage
   - Add route
   - Test UI flow

3. **Integration Testing**:
   - Test full flow from start to finish
   - Verify stock updates correctly
   - Check adjustment creation

---

## 📊 Database Schema Changes

If `stockActual` column in `movimientos_stock` doesn't allow NULL, run migration:

```sql
ALTER TABLE movimientos_stock 
MODIFY COLUMN stock_actual INT NULL;
```

This allows pending recounts to have `stockActual = NULL` until completed.

---

## 🎯 Future Enhancements

- [ ] Batch complete multiple recounts
- [ ] Print recount sheets (PDF)
- [ ] Barcode scanning integration
- [ ] Recount history and reports
- [ ] Schedule automatic recounts
- [ ] Mobile app for warehouse staff
- [ ] Email notifications when recount is initiated
- [ ] Variance analysis reports

---

**Status**: Ready for implementation ✅  
**Last Updated**: October 8, 2025
