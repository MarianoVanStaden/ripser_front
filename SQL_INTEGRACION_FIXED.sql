-- ============================================
-- FIX: INTEGRACION VIAJES - Sin dependencias de columnas
-- Ejecutar este script en tu cliente MySQL (HeidiSQL, phpMyAdmin, etc.)
-- ============================================

-- 1️⃣ TABLA: Detalle de entregas por viaje (sin cambios)
CREATE TABLE IF NOT EXISTS entrega_viaje_detalle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    viaje_id BIGINT NOT NULL,
    factura_id BIGINT NOT NULL,
    equipo_fabricado_id BIGINT NOT NULL,
    orden_entrega INT NOT NULL DEFAULT 1,
    estado_entrega ENUM('PENDIENTE', 'EN_RUTA', 'ENTREGADO', 'RECHAZADO', 'REPROGRAMADO') DEFAULT 'PENDIENTE',
    
    -- Datos de entrega
    receptor_nombre VARCHAR(200),
    receptor_dni VARCHAR(20),
    fecha_entrega_planificada DATETIME,
    fecha_entrega_real DATETIME,
    
    -- Ubicación
    direccion_entrega VARCHAR(500),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Observaciones y evidencias
    observaciones VARCHAR(1000),
    motivo_rechazo VARCHAR(500),
    foto_entrega_url VARCHAR(500),
    firma_digital_url VARCHAR(500),
    
    -- Auditoría
    usuario_confirmacion_id BIGINT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (viaje_id) REFERENCES entregas_viaje(id) ON DELETE CASCADE,
    FOREIGN KEY (factura_id) REFERENCES documentos_comerciales(id),
    FOREIGN KEY (equipo_fabricado_id) REFERENCES equipos_fabricados(id),
    
    -- Índices
    INDEX idx_viaje (viaje_id),
    INDEX idx_factura (factura_id),
    INDEX idx_equipo (equipo_fabricado_id),
    INDEX idx_estado (estado_entrega),
    INDEX idx_fecha_planificada (fecha_entrega_planificada)
);

-- 2️⃣ ACTUALIZAR: Tabla entregas_viaje
-- Agregar columnas sin especificar AFTER (evita errores si no existen las referencias)
ALTER TABLE entregas_viaje
ADD COLUMN IF NOT EXISTS fecha_viaje DATE;

ALTER TABLE entregas_viaje
ADD COLUMN IF NOT EXISTS estado_viaje ENUM('PLANIFICADO', 'EN_RUTA', 'COMPLETADO', 'CANCELADO') DEFAULT 'PLANIFICADO';

ALTER TABLE entregas_viaje
ADD COLUMN IF NOT EXISTS total_equipos INT DEFAULT 0;

ALTER TABLE entregas_viaje
ADD COLUMN IF NOT EXISTS equipos_entregados INT DEFAULT 0;

ALTER TABLE entregas_viaje
ADD COLUMN IF NOT EXISTS hora_inicio DATETIME;

ALTER TABLE entregas_viaje
ADD COLUMN IF NOT EXISTS hora_fin DATETIME;

-- 3️⃣ VISTA: Resumen de viajes con estadísticas
CREATE OR REPLACE VIEW vista_viajes_resumen AS
SELECT 
    ev.id as viaje_id,
    ev.fecha_viaje,
    ev.estado_viaje,
    ev.conductor_id,
    CONCAT(COALESCE(e.nombre, ''), ' ', COALESCE(e.apellido, '')) as conductor_nombre,
    ev.vehiculo_id,
    v.patente as vehiculo_patente,
    ev.total_equipos,
    ev.equipos_entregados,
    COUNT(DISTINCT evd.factura_id) as total_facturas,
    COUNT(DISTINCT evd.id) as total_paradas,
    COUNT(DISTINCT CASE WHEN evd.estado_entrega = 'ENTREGADO' THEN evd.id END) as paradas_completadas,
    COUNT(DISTINCT CASE WHEN evd.estado_entrega = 'PENDIENTE' THEN evd.id END) as paradas_pendientes,
    COUNT(DISTINCT CASE WHEN evd.estado_entrega = 'RECHAZADO' THEN evd.id END) as paradas_rechazadas,
    ev.observaciones,
    ev.hora_inicio,
    ev.hora_fin
FROM entregas_viaje ev
LEFT JOIN empleados e ON ev.conductor_id = e.id
LEFT JOIN vehiculos v ON ev.vehiculo_id = v.id
LEFT JOIN entrega_viaje_detalle evd ON ev.id = evd.viaje_id
GROUP BY ev.id;

-- 4️⃣ VISTA: Equipos pendientes de asignar a viaje
CREATE OR REPLACE VIEW vista_equipos_pendientes_viaje AS
SELECT 
    ef.id as equipo_id,
    ef.numero_heladera,
    ef.estado_asignacion,
    ef.cliente_id,
    c.nombre as cliente_nombre,
    c.direccion as cliente_direccion,
    c.telefono as cliente_telefono,
    d.id as factura_id,
    d.numero_documento,
    d.fecha_emision as fecha_factura,
    dd.id as detalle_id
FROM equipos_fabricados ef
INNER JOIN clientes c ON ef.cliente_id = c.id
INNER JOIN detalle_documentos dd ON FIND_IN_SET(ef.id, REPLACE(REPLACE(dd.equipos_fabricados_ids, '[', ''), ']', '')) > 0
INNER JOIN documentos_comerciales d ON dd.documento_id = d.id
WHERE ef.estado_asignacion = 'FACTURADO'
AND d.tipo_documento = 'FACTURA'
AND NOT EXISTS (
    SELECT 1 
    FROM entrega_viaje_detalle evd 
    WHERE evd.equipo_fabricado_id = ef.id
    AND evd.estado_entrega IN ('PENDIENTE', 'EN_RUTA')
);

-- 5️⃣ PROCEDIMIENTO: Agregar equipos de una factura a un viaje
DELIMITER //

CREATE PROCEDURE sp_agregar_factura_a_viaje(
    IN p_viaje_id BIGINT,
    IN p_factura_id BIGINT,
    IN p_orden_entrega INT
)
BEGIN
    DECLARE v_cliente_direccion VARCHAR(500);
    DECLARE v_equipo_id BIGINT;
    DECLARE done INT DEFAULT FALSE;
    
    -- Cursor para obtener todos los equipos FACTURADOS de la factura
    DECLARE cur_equipos CURSOR FOR
        SELECT ef.id
        FROM equipos_fabricados ef
        INNER JOIN detalle_documentos dd ON FIND_IN_SET(ef.id, REPLACE(REPLACE(dd.equipos_fabricados_ids, '[', ''), ']', '')) > 0
        WHERE dd.documento_id = p_factura_id
        AND ef.estado_asignacion = 'FACTURADO';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Obtener dirección del cliente de la factura
    SELECT c.direccion INTO v_cliente_direccion
    FROM documentos_comerciales d
    INNER JOIN clientes c ON d.cliente_id = c.id
    WHERE d.id = p_factura_id;
    
    -- Abrir cursor e insertar cada equipo
    OPEN cur_equipos;
    
    read_loop: LOOP
        FETCH cur_equipos INTO v_equipo_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Insertar detalle de entrega
        INSERT INTO entrega_viaje_detalle (
            viaje_id,
            factura_id,
            equipo_fabricado_id,
            orden_entrega,
            estado_entrega,
            direccion_entrega
        ) VALUES (
            p_viaje_id,
            p_factura_id,
            v_equipo_id,
            p_orden_entrega,
            'PENDIENTE',
            v_cliente_direccion
        );
        
    END LOOP;
    
    CLOSE cur_equipos;
    
    -- Actualizar total de equipos en el viaje
    UPDATE entregas_viaje
    SET total_equipos = (
        SELECT COUNT(*) 
        FROM entrega_viaje_detalle 
        WHERE viaje_id = p_viaje_id
    )
    WHERE id = p_viaje_id;
    
END //

DELIMITER ;

-- 6️⃣ PROCEDIMIENTO: Confirmar entrega de un equipo
DELIMITER //

CREATE PROCEDURE sp_confirmar_entrega_equipo(
    IN p_detalle_id BIGINT,
    IN p_receptor_nombre VARCHAR(200),
    IN p_receptor_dni VARCHAR(20),
    IN p_observaciones VARCHAR(1000),
    IN p_usuario_id BIGINT
)
BEGIN
    DECLARE v_equipo_id BIGINT;
    DECLARE v_viaje_id BIGINT;
    
    -- Obtener IDs
    SELECT equipo_fabricado_id, viaje_id 
    INTO v_equipo_id, v_viaje_id
    FROM entrega_viaje_detalle
    WHERE id = p_detalle_id;
    
    -- Actualizar detalle de entrega
    UPDATE entrega_viaje_detalle
    SET estado_entrega = 'ENTREGADO',
        receptor_nombre = p_receptor_nombre,
        receptor_dni = p_receptor_dni,
        fecha_entrega_real = NOW(),
        observaciones = p_observaciones,
        usuario_confirmacion_id = p_usuario_id
    WHERE id = p_detalle_id;
    
    -- Cambiar estado del equipo a ENTREGADO
    UPDATE equipos_fabricados
    SET estado_asignacion = 'ENTREGADO'
    WHERE id = v_equipo_id;
    
    -- Registrar en historial
    INSERT INTO historial_estado_equipo (
        equipo_fabricado_id,
        estado_anterior,
        estado_nuevo,
        fecha_cambio,
        observaciones,
        documento_id
    ) VALUES (
        v_equipo_id,
        'FACTURADO',
        'ENTREGADO',
        NOW(),
        CONCAT('Entregado en viaje. Receptor: ', p_receptor_nombre),
        NULL
    );
    
    -- Actualizar contador de equipos entregados en el viaje
    UPDATE entregas_viaje
    SET equipos_entregados = (
        SELECT COUNT(*) 
        FROM entrega_viaje_detalle 
        WHERE viaje_id = v_viaje_id
        AND estado_entrega = 'ENTREGADO'
    )
    WHERE id = v_viaje_id;
    
    -- Si todos los equipos fueron entregados, marcar viaje como completado
    UPDATE entregas_viaje
    SET estado_viaje = 'COMPLETADO',
        hora_fin = NOW()
    WHERE id = v_viaje_id
    AND equipos_entregados >= total_equipos;
    
END //

DELIMITER ;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver estructura de entregas_viaje
SHOW COLUMNS FROM entregas_viaje;

-- Ver todos los viajes con estadísticas
SELECT * FROM vista_viajes_resumen;

-- Ver equipos pendientes de asignar a viaje
SELECT * FROM vista_equipos_pendientes_viaje;
