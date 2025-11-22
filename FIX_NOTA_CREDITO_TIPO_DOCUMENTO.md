# 🚨 FIX URGENTE: Error al Crear Nota de Crédito

**Fecha:** 22 de Noviembre, 2025  
**Severidad:** ALTA - Bloquea funcionalidad  
**Módulo:** Ventas - Notas de Crédito

---

## 🐛 Error Reportado

```
Error interno: could not execute statement 
[Data truncated for column 'tipo_documento' at row 1] 
[insert into documentos_comerciales (..., tipo_documento, ...)]
```

**Contexto**: Al intentar crear una Nota de Crédito desde el frontend, el backend lanza error 500.

---

## 🔍 Diagnóstico

### Causa del Error

El error **"Data truncated for column 'tipo_documento'"** indica que:

1. **El valor que se intenta insertar es demasiado largo** para la columna `tipo_documento`
2. **El valor no coincide con el enum esperado** en la base de datos

### Análisis Técnico

#### En el Backend (Java)
El backend está intentando insertar:
```java
notaCredito.setTipoDocumento(TipoDocumento.NOTA_CREDITO);
```

#### En la Base de Datos (MySQL/PostgreSQL)
La columna `tipo_documento` probablemente:
- **Tiene un tamaño muy pequeño** (ej: VARCHAR(10) o VARCHAR(20))
- **O el enum no incluye** `'NOTA_CREDITO'`

---

## ✅ Solución

### Opción 1: Verificar y Actualizar Enum en Base de Datos (RECOMENDADO)

#### Paso 1: Verificar el tipo de columna actual
```sql
-- Para MySQL
SHOW COLUMNS FROM documentos_comerciales WHERE Field = 'tipo_documento';

-- Para PostgreSQL
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'documentos_comerciales' 
  AND column_name = 'tipo_documento';
```

**Resultado esperado**:
```
tipo_documento | enum('PRESUPUESTO','NOTA_PEDIDO','FACTURA') | ...
```

#### Paso 2: Actualizar el enum para incluir NOTA_CREDITO

**Para MySQL:**
```sql
ALTER TABLE documentos_comerciales 
MODIFY COLUMN tipo_documento 
ENUM('PRESUPUESTO', 'NOTA_PEDIDO', 'FACTURA', 'NOTA_CREDITO') 
NOT NULL;
```

**Para PostgreSQL:**
```sql
-- Opción A: Agregar valor al enum existente
ALTER TYPE tipo_documento_enum ADD VALUE 'NOTA_CREDITO';

-- Opción B: Si es VARCHAR, aumentar el tamaño
ALTER TABLE documentos_comerciales 
ALTER COLUMN tipo_documento TYPE VARCHAR(20);
```

---

### Opción 2: Cambiar a VARCHAR si no es Enum

Si la columna es VARCHAR pero muy corta:

```sql
-- Aumentar tamaño de VARCHAR
ALTER TABLE documentos_comerciales 
MODIFY COLUMN tipo_documento VARCHAR(20) NOT NULL;
-- O más largo si es necesario:
-- VARCHAR(50)
```

---

## 🔧 Verificación Después del Fix

### 1. Verificar la estructura actualizada
```sql
SHOW COLUMNS FROM documentos_comerciales WHERE Field = 'tipo_documento';
```

**Debe mostrar**:
- **MySQL Enum**: `enum('PRESUPUESTO','NOTA_PEDIDO','FACTURA','NOTA_CREDITO')`
- **O VARCHAR**: `varchar(20)` o mayor

### 2. Probar inserción manual
```sql
INSERT INTO documentos_comerciales (
  tipo_documento,
  cliente_id,
  usuario_id,
  numero_documento,
  fecha_emision,
  estado,
  tipo_iva,
  subtotal,
  iva,
  total,
  metodo_pago
) VALUES (
  'NOTA_CREDITO',
  1,
  1,
  'NC-TEST-001',
  NOW(),
  'PENDIENTE',
  'IVA_21',
  1000.00,
  210.00,
  1210.00,
  'EFECTIVO'
);
```

**Si funciona**: ✅ El enum está correcto

**Si falla con el mismo error**: ❌ Revisar nuevamente la columna

### 3. Eliminar el registro de prueba
```sql
DELETE FROM documentos_comerciales WHERE numero_documento = 'NC-TEST-001';
```

---

## 📋 Checklist de Implementación

### Backend Database
- [ ] Conectarse a la base de datos
- [ ] Ejecutar query de verificación (`SHOW COLUMNS`)
- [ ] Identificar el problema (enum faltante o VARCHAR corto)
- [ ] Ejecutar ALTER TABLE correspondiente
- [ ] Verificar cambio con `SHOW COLUMNS` nuevamente
- [ ] Probar inserción manual de test
- [ ] Eliminar registro de test

### Backend Application
- [ ] Verificar que `TipoDocumento.java` enum incluya `NOTA_CREDITO`
- [ ] Reiniciar servidor backend (si usa cache de metadata)
- [ ] Revisar logs de Hibernate/JPA para warnings

### Frontend Testing
- [ ] Ir a Ventas → Notas de Crédito
- [ ] Seleccionar una factura
- [ ] Seleccionar equipos
- [ ] Ingresar motivo
- [ ] Crear nota de crédito
- [ ] Verificar que se cree sin errores
- [ ] Verificar que aparezca el diálogo de éxito

---

## 🎯 Ejemplos de Comandos por Base de Datos

### MySQL

```sql
-- 1. Ver columna actual
SHOW COLUMNS FROM documentos_comerciales WHERE Field = 'tipo_documento';

-- 2. Actualizar enum
ALTER TABLE documentos_comerciales 
MODIFY COLUMN tipo_documento 
ENUM('PRESUPUESTO', 'NOTA_PEDIDO', 'FACTURA', 'NOTA_CREDITO') 
NOT NULL;

-- 3. Verificar cambio
SHOW COLUMNS FROM documentos_comerciales WHERE Field = 'tipo_documento';
```

### PostgreSQL

```sql
-- 1. Ver columna actual
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'documentos_comerciales' 
  AND column_name = 'tipo_documento';

-- 2. Si es un tipo enum personalizado
ALTER TYPE tipo_documento_enum ADD VALUE IF NOT EXISTS 'NOTA_CREDITO';

-- 3. Si es VARCHAR, aumentar tamaño
ALTER TABLE documentos_comerciales 
ALTER COLUMN tipo_documento TYPE VARCHAR(20);

-- 4. Verificar cambio
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'documentos_comerciales' 
  AND column_name = 'tipo_documento';
```

---

## 🚨 Casos Especiales

### Si el enum es usado por múltiples tablas

Si hay otras tablas que usan el mismo enum:

**MySQL:**
```sql
-- Buscar todas las tablas con la columna
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME = 'tipo_documento';

-- Actualizar cada tabla que lo necesite
ALTER TABLE documentos_comerciales MODIFY COLUMN tipo_documento ENUM(...);
ALTER TABLE otra_tabla MODIFY COLUMN tipo_documento ENUM(...);
```

**PostgreSQL:**
```sql
-- El enum type es global, solo se modifica una vez
ALTER TYPE tipo_documento_enum ADD VALUE IF NOT EXISTS 'NOTA_CREDITO';

-- Todas las tablas que usan ese tipo se actualizan automáticamente
```

### Si hay datos existentes que pueden fallar

```sql
-- Verificar valores actuales
SELECT DISTINCT tipo_documento 
FROM documentos_comerciales;

-- Resultado esperado:
-- PRESUPUESTO
-- NOTA_PEDIDO
-- FACTURA

-- Si hay valores raros, limpiarlos primero:
UPDATE documentos_comerciales 
SET tipo_documento = 'PRESUPUESTO' 
WHERE tipo_documento NOT IN ('PRESUPUESTO', 'NOTA_PEDIDO', 'FACTURA');
```

---

## 🔍 Debugging Adicional

### Verificar Enum en el Backend (Java)

```java
// En TipoDocumento.java o similar
public enum TipoDocumento {
    PRESUPUESTO,
    NOTA_PEDIDO,
    FACTURA,
    NOTA_CREDITO  // ← Debe existir
}
```

### Verificar Entity Mapping

```java
// En DocumentoComercial.java
@Entity
@Table(name = "documentos_comerciales")
public class DocumentoComercial {
    
    @Enumerated(EnumType.STRING)  // ← Importante: debe ser STRING
    @Column(name = "tipo_documento", nullable = false)
    private TipoDocumento tipoDocumento;
    
    // ...
}
```

**IMPORTANTE**: Debe ser `EnumType.STRING`, NO `EnumType.ORDINAL`

### Verificar Logs del Backend

```bash
# Buscar el error completo
tail -f application.log | grep -i "tipo_documento"

# O si usa Docker
docker logs backend-container | grep -i "tipo_documento"
```

---

## 📊 Comparación Antes/Después

### ANTES (❌ Error)
```
tipo_documento: ENUM('PRESUPUESTO', 'NOTA_PEDIDO', 'FACTURA')
                                                    ↑
                                          Falta NOTA_CREDITO
```

**Al intentar insertar `'NOTA_CREDITO'`**:
```
ERROR: Data truncated for column 'tipo_documento' at row 1
```

### DESPUÉS (✅ Fix)
```
tipo_documento: ENUM('PRESUPUESTO', 'NOTA_PEDIDO', 'FACTURA', 'NOTA_CREDITO')
                                                               ↑
                                                        Agregado ✅
```

**Al intentar insertar `'NOTA_CREDITO'`**:
```
SUCCESS: 1 row inserted
```

---

## 🎯 Testing Final

### Script de Test Completo

```sql
-- 1. Verificar estructura
SHOW COLUMNS FROM documentos_comerciales WHERE Field = 'tipo_documento';

-- 2. Insertar nota de crédito de prueba
INSERT INTO documentos_comerciales (
  tipo_documento, cliente_id, usuario_id, numero_documento,
  fecha_emision, estado, tipo_iva, subtotal, iva, total, metodo_pago
) VALUES (
  'NOTA_CREDITO', 1, 1, 'NC-TEST-001',
  NOW(), 'PENDIENTE', 'IVA_21', 1000.00, 210.00, 1210.00, 'EFECTIVO'
);

-- 3. Verificar inserción
SELECT * FROM documentos_comerciales WHERE numero_documento = 'NC-TEST-001';

-- 4. Limpiar
DELETE FROM documentos_comerciales WHERE numero_documento = 'NC-TEST-001';
```

### Test desde Frontend

1. **Login** en el sistema
2. **Ir a** Ventas → Notas de Crédito
3. **Seleccionar** una factura del dropdown
4. **Seleccionar** equipos a devolver (checkbox)
5. **Seleccionar** motivo del dropdown
6. **Escribir** observaciones (opcional)
7. **Click** en "Crear Nota de Crédito"
8. **Verificar**:
   - ✅ No aparece error 500
   - ✅ Aparece diálogo de éxito
   - ✅ Muestra número de NC generada
   - ✅ Muestra monto del crédito
   - ✅ Botón "Ver en Cuenta Corriente" funciona

---

## 📞 Soporte

### Si el problema persiste después del fix:

1. **Verificar logs del backend**:
```bash
grep -A 10 "tipo_documento" /var/log/backend/application.log
```

2. **Verificar versión de la base de datos**:
```sql
SELECT VERSION();
```

3. **Verificar permisos del usuario**:
```sql
SHOW GRANTS FOR CURRENT_USER;
```

4. **Verificar si hay triggers o constraints**:
```sql
SHOW CREATE TABLE documentos_comerciales;
```

---

## ✅ Resumen Ejecutivo

**Problema**: La columna `tipo_documento` no acepta el valor `'NOTA_CREDITO'`

**Causa**: Enum en la base de datos no incluye `NOTA_CREDITO`

**Solución**: Agregar `'NOTA_CREDITO'` al enum con `ALTER TABLE`

**Tiempo estimado**: 5 minutos

**Riesgo**: BAJO (solo agrega un valor, no modifica datos existentes)

**Impacto**: ALTO (desbloquea funcionalidad de notas de crédito)

---

**Última actualización:** 22 de Noviembre, 2025  
**Reportado por:** Usuario Frontend  
**Asignado a:** DBA / Backend Team  
**Estado:** 🚨 URGENTE - EN ESPERA DE FIX DE BASE DE DATOS
