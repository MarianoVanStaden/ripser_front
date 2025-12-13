# BACKEND FIX: Migración Automática de Presupuestos en Conversión de Leads

## 🐛 Problema Identificado

Cuando se convierte un lead a cliente, los presupuestos asociados al lead **NO se actualizan automáticamente** para vincularse al nuevo cliente.

### Síntomas:
1. ✅ Lead se convierte exitosamente a cliente
2. ❌ Presupuestos mantienen `leadId` en lugar de actualizarse a `clienteId`
3. ❌ No se pueden crear Notas de Pedido porque el sistema detecta que es un lead
4. ❌ El lead ya está convertido, no se puede volver a convertir
5. 🔴 **Presupuestos quedan "huérfanos" y no se pueden procesar**

## 🎯 Solución Requerida en Backend

### Ubicación del código:
`LeadServiceImpl.java` → método `convertir()`

### Código a agregar:

```java
@Service
public class LeadServiceImpl implements LeadService {
    
    @Autowired
    private DocumentoComercialRepository documentoComercialRepository;
    
    @Override
    @Transactional
    public ConversionLeadResponse convertir(Long leadId, ConversionLeadRequest request) {
        // ... código existente de conversión del lead ...
        
        Lead lead = leadRepository.findById(leadId)
            .orElseThrow(() -> new EntityNotFoundException("Lead no encontrado"));
        
        // Crear el nuevo cliente
        Cliente nuevoCliente = new Cliente();
        // ... mapeo de datos del lead al cliente ...
        nuevoCliente = clienteRepository.save(nuevoCliente);
        
        // 🔧 AGREGAR ESTE CÓDIGO:
        // Migrar automáticamente TODOS los presupuestos del lead al nuevo cliente
        List<DocumentoComercial> presupuestosDelLead = documentoComercialRepository
            .findByLeadId(leadId);
        
        log.info("Migrando {} presupuestos del lead {} al cliente {}", 
            presupuestosDelLead.size(), leadId, nuevoCliente.getId());
        
        for (DocumentoComercial presupuesto : presupuestosDelLead) {
            // Actualizar referencias
            presupuesto.setCliente(nuevoCliente);
            presupuesto.setClienteId(nuevoCliente.getId());
            presupuesto.setClienteNombre(nuevoCliente.getNombre() + " " + 
                (nuevoCliente.getApellido() != null ? nuevoCliente.getApellido() : ""));
            
            // Limpiar referencias al lead
            presupuesto.setLead(null);
            presupuesto.setLeadId(null);
            presupuesto.setLeadNombre(null);
            
            documentoComercialRepository.save(presupuesto);
        }
        
        // Actualizar el lead con el ID del cliente convertido
        lead.setEstadoLead(EstadoLeadEnum.CONVERTIDO);
        lead.setFechaConversion(LocalDate.now());
        lead.setClienteIdConvertido(nuevoCliente.getId()); // Guardar referencia
        leadRepository.save(lead);
        
        // ... resto del código de respuesta ...
        
        return response;
    }
}
```

### Cambios necesarios en la entidad Lead:

```java
@Entity
@Table(name = "leads")
public class Lead {
    // ... campos existentes ...
    
    /**
     * ID del cliente creado cuando este lead fue convertido
     * Permite rastrear la relación lead → cliente
     */
    @Column(name = "cliente_id_convertido")
    private Long clienteIdConvertido;
    
    // Getters y setters
    public Long getClienteIdConvertido() {
        return clienteIdConvertido;
    }
    
    public void setClienteIdConvertido(Long clienteIdConvertido) {
        this.clienteIdConvertido = clienteIdConvertido;
    }
}
```

### Migración SQL requerida:

```sql
-- Agregar columna para guardar cliente_id_convertido en leads
ALTER TABLE leads 
ADD COLUMN cliente_id_convertido BIGINT NULL;

-- Agregar índice para búsquedas rápidas
CREATE INDEX idx_leads_cliente_convertido 
ON leads(cliente_id_convertido);

-- Agregar foreign key constraint (opcional)
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_cliente_convertido 
FOREIGN KEY (cliente_id_convertido) REFERENCES clientes(id);
```

### Método adicional en DocumentoComercialRepository:

```java
public interface DocumentoComercialRepository extends JpaRepository<DocumentoComercial, Long> {
    // ... métodos existentes ...
    
    /**
     * Encuentra todos los documentos comerciales asociados a un lead
     * @param leadId ID del lead
     * @return Lista de documentos comerciales
     */
    List<DocumentoComercial> findByLeadId(Long leadId);
    
    /**
     * Cuenta cuántos presupuestos tiene un lead
     * Útil para validaciones
     */
    @Query("SELECT COUNT(d) FROM DocumentoComercial d WHERE d.leadId = :leadId AND d.tipoDocumento = 'PRESUPUESTO'")
    Long countPresupuestosByLeadId(@Param("leadId") Long leadId);
}
```

## ✅ Validación y Testing

### Test unitario recomendado:

```java
@Test
@Transactional
public void testConvertirLead_DebeActualizarPresupuestosAutomaticamente() {
    // Arrange
    Lead lead = crearLeadDePrueba();
    leadRepository.save(lead);
    
    // Crear 3 presupuestos asociados al lead
    DocumentoComercial presupuesto1 = crearPresupuesto(lead);
    DocumentoComercial presupuesto2 = crearPresupuesto(lead);
    DocumentoComercial presupuesto3 = crearPresupuesto(lead);
    documentoComercialRepository.saveAll(Arrays.asList(presupuesto1, presupuesto2, presupuesto3));
    
    ConversionLeadRequest request = new ConversionLeadRequest();
    request.setEmailCliente("test@example.com");
    
    // Act
    ConversionLeadResponse response = leadService.convertir(lead.getId(), request);
    
    // Assert
    // 1. Verificar que se creó el cliente
    assertNotNull(response.getClienteId());
    
    // 2. Verificar que el lead tiene referencia al cliente
    Lead leadActualizado = leadRepository.findById(lead.getId()).get();
    assertEquals(EstadoLeadEnum.CONVERTIDO, leadActualizado.getEstadoLead());
    assertEquals(response.getClienteId(), leadActualizado.getClienteIdConvertido());
    
    // 3. Verificar que los presupuestos se actualizaron
    List<DocumentoComercial> presupuestosActualizados = 
        documentoComercialRepository.findByClienteId(response.getClienteId());
    
    assertEquals(3, presupuestosActualizados.size(), 
        "Los 3 presupuestos deben estar asociados al nuevo cliente");
    
    // 4. Verificar que NO hay presupuestos con el leadId
    List<DocumentoComercial> presupuestosConLead = 
        documentoComercialRepository.findByLeadId(lead.getId());
    
    assertEquals(0, presupuestosConLead.size(), 
        "No debe haber presupuestos asociados al lead después de la conversión");
    
    // 5. Verificar que cada presupuesto tiene los datos correctos
    presupuestosActualizados.forEach(p -> {
        assertNotNull(p.getClienteId(), "Debe tener clienteId");
        assertNull(p.getLeadId(), "No debe tener leadId");
        assertNotNull(p.getClienteNombre(), "Debe tener nombre del cliente");
    });
}
```

## 📋 Checklist de Implementación

- [ ] Agregar columna `cliente_id_convertido` a tabla `leads`
- [ ] Actualizar entidad `Lead` con nuevo campo
- [ ] Agregar método `findByLeadId()` en `DocumentoComercialRepository`
- [ ] Implementar migración de presupuestos en `LeadServiceImpl.convertir()`
- [ ] Actualizar `ConversionLeadResponse` para incluir info de presupuestos migrados (opcional)
- [ ] Crear test unitario para validar migración
- [ ] Probar conversión con leads que tengan 0, 1 y múltiples presupuestos
- [ ] Verificar que Notas de Pedido se pueden crear después de la conversión
- [ ] Documentar en API docs el comportamiento de migración automática

## 🔄 Retrocompatibilidad

Para leads ya convertidos antes de este fix:

```java
/**
 * Script de migración para presupuestos huérfanos
 * Ejecutar UNA VEZ después de implementar el fix
 */
@Service
public class MigracionPresupuestosService {
    
    @Transactional
    public void migrarPresupuestosHuerfanos() {
        // Buscar todos los leads convertidos
        List<Lead> leadsConvertidos = leadRepository.findByEstadoLead(EstadoLeadEnum.CONVERTIDO);
        
        int totalMigrados = 0;
        
        for (Lead lead : leadsConvertidos) {
            if (lead.getClienteIdConvertido() != null) {
                List<DocumentoComercial> presupuestos = 
                    documentoComercialRepository.findByLeadId(lead.getId());
                
                if (!presupuestos.isEmpty()) {
                    Cliente cliente = clienteRepository.findById(lead.getClienteIdConvertido())
                        .orElse(null);
                    
                    if (cliente != null) {
                        for (DocumentoComercial p : presupuestos) {
                            p.setCliente(cliente);
                            p.setClienteId(cliente.getId());
                            p.setClienteNombre(cliente.getNombre() + " " + 
                                (cliente.getApellido() != null ? cliente.getApellido() : ""));
                            p.setLead(null);
                            p.setLeadId(null);
                            p.setLeadNombre(null);
                        }
                        documentoComercialRepository.saveAll(presupuestos);
                        totalMigrados += presupuestos.size();
                    }
                }
            }
        }
        
        log.info("✅ Migración completada: {} presupuestos actualizados", totalMigrados);
    }
}
```

## 🎯 Resultado Esperado

Después de implementar este fix:

1. ✅ Lead se convierte a cliente
2. ✅ **Todos los presupuestos del lead se actualizan automáticamente al cliente**
3. ✅ Se pueden crear Notas de Pedido inmediatamente
4. ✅ No hay presupuestos "huérfanos"
5. ✅ Trazabilidad completa (lead guarda ID del cliente creado)

## 📞 Contacto

Si necesitas ayuda con la implementación, contacta al equipo de frontend.
