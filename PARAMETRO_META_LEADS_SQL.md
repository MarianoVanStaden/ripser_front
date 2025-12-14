# Parámetro de Meta de Leads - Configuración

## Descripción
Este parámetro `META_MENSUAL_LEADS` se utiliza para configurar la meta mensual de leads en el dashboard de métricas.

## ⚡ Opción 1: Crear desde la Interfaz (RECOMENDADO)

1. Ve a **Administración** → **Parámetros del Sistema**
2. Si el parámetro no existe, verás una alerta azul con un botón
3. Haz clic en **"Crear Parámetro META_MENSUAL_LEADS"**
4. El formulario se pre-llenará automáticamente con:
   - **Clave**: `META_MENSUAL_LEADS`
   - **Valor**: `30` (valor por defecto para empresa mediana)
   - **Descripción**: Meta mensual de leads nuevos...
   - **Tipo**: INTEGER
5. Haz clic en **Guardar**

## 🛠️ Opción 2: Script SQL (Alternativo)

Si prefieres crearlo directamente en la base de datos:

```sql
-- Insertar parámetro de meta mensual de leads
-- Valor por defecto: 30 leads/mes (coherente para empresa mediana)
INSERT INTO parametro_sistema (clave, valor, descripcion, tipo, fecha_actualizacion)
VALUES (
    'META_MENSUAL_LEADS',
    '30',
    'Meta mensual de leads nuevos para la empresa. Usado en el cálculo de cumplimiento de objetivos en el dashboard de métricas.',
    'INTEGER',
    CURRENT_TIMESTAMP
)
ON CONFLICT (clave) DO UPDATE
SET 
    valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    tipo = EXCLUDED.tipo,
    fecha_actualizacion = CURRENT_TIMESTAMP;
```

**Nota**: Después de ejecutar el script, refresca la página de Parámetros del Sistema.

## Uso en el Frontend

El parámetro se carga automáticamente en la página de métricas (`LeadMetricasPage.tsx`) mediante:

```typescript
const loadParametrosMeta = async () => {
  try {
    const paramMeta = await parametroSistemaApi.getByClave('META_MENSUAL_LEADS');
    if (paramMeta && paramMeta.valor) {
      setMetaMensualLeads(Number(paramMeta.valor));
    }
  } catch (err) {
    // Si no existe el parámetro, usar valor por defecto (30 para empresa mediana)
    console.log('Parámetro META_MENSUAL_LEADS no configurado, usando valor por defecto');
  }
};
```

## Configuración para el Administrador

### Modificar el Valor

Puedes modificar este parámetro en cualquier momento desde:
1. Menú **Administración** → **Parámetros del Sistema**
2. Buscar la categoría **"META"** o usar la búsqueda
3. Editar el valor directamente en la tabla (aparecerá un ícono de guardar)
4. O hacer clic en el ícono de editar para abrir el formulario completo

### Valores Recomendados

El valor debe ajustarse según el tamaño y capacidad de tu empresa:

| Tipo de Empresa | Leads/Mes Sugeridos |
|----------------|---------------------|
| Pequeña        | 10-20               |
| Mediana        | 30-50               |
| Grande         | 100+                |

## Notas

- El valor debe ser un número entero positivo
- Se utiliza para mostrar información contextual en el dashboard
- No afecta la funcionalidad del sistema, solo proporciona referencia visual
