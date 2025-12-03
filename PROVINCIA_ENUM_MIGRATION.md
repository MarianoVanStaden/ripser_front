# Migración de Provincia a Enum

## Resumen
Se migró el campo `provincia` de tipo `string` a `ProvinciaEnum` en todas las entidades y formularios del sistema para garantizar la consistencia de datos y evitar errores de validación con el backend.

## Problema Original
El backend de Spring Boot utiliza un enum Java `com.ripser_back.enums.Provincia` con valores como:
- `BUENOS_AIRES`
- `CABA`
- `RIO_NEGRO`
- etc.

Anteriormente, el frontend enviaba el **label** de la provincia (ej: "Río Negro") en lugar del **valor del enum** (ej: "RIO_NEGRO"), causando el error:
```
No enum constant com.ripser_back.enums.Provincia.Río Negro
```

## Solución Implementada

### 1. Enum Compartido
Se creó `ProvinciaEnum` en `src/types/shared.enums.ts`:

```typescript
export const ProvinciaEnum = {
  BUENOS_AIRES: 'BUENOS_AIRES',
  CABA: 'CABA',
  CATAMARCA: 'CATAMARCA',
  CHACO: 'CHACO',
  CHUBUT: 'CHUBUT',
  CORDOBA: 'CORDOBA',
  CORRIENTES: 'CORRIENTES',
  ENTRE_RIOS: 'ENTRE_RIOS',
  FORMOSA: 'FORMOSA',
  JUJUY: 'JUJUY',
  LA_PAMPA: 'LA_PAMPA',
  LA_RIOJA: 'LA_RIOJA',
  MENDOZA: 'MENDOZA',
  MISIONES: 'MISIONES',
  NEUQUEN: 'NEUQUEN',
  RIO_NEGRO: 'RIO_NEGRO',
  SALTA: 'SALTA',
  SAN_JUAN: 'SAN_JUAN',
  SAN_LUIS: 'SAN_LUIS',
  SANTA_CRUZ: 'SANTA_CRUZ',
  SANTA_FE: 'SANTA_FE',
  SANTIAGO_DEL_ESTERO: 'SANTIAGO_DEL_ESTERO',
  TIERRA_DEL_FUEGO: 'TIERRA_DEL_FUEGO',
  TUCUMAN: 'TUCUMAN',
} as const;

export type ProvinciaEnum = typeof ProvinciaEnum[keyof typeof ProvinciaEnum];
```

### 2. Mapeo de Labels
Se creó `PROVINCIA_LABELS` para mostrar nombres legibles al usuario:

```typescript
export const PROVINCIA_LABELS: Record<ProvinciaEnum, string> = {
  BUENOS_AIRES: 'Buenos Aires',
  CABA: 'Ciudad Autónoma de Buenos Aires',
  CATAMARCA: 'Catamarca',
  // ... resto de provincias
  RIO_NEGRO: 'Río Negro',
  // ...
};
```

### 3. Actualización de Tipos
Se actualizó el tipo de `provincia` en las interfaces:

**`src/types/index.ts`:**
```typescript
export interface Cliente {
  // ...
  provincia?: ProvinciaEnum;
  // ...
}

export interface CreateClienteRequest {
  // ...
  provincia?: ProvinciaEnum;
  // ...
}

export interface CreateProveedorDTO {
  // ...
  provincia?: ProvinciaEnum;
  // ...
}
```

**`src/types/lead.types.ts`:**
```typescript
export interface LeadDTO {
  // ...
  provincia?: ProvinciaEnum;
  // ...
}
```

### 4. Formularios Actualizados
Se actualizaron los siguientes componentes para usar `Select` con `MenuItem` en lugar de `TextField`:

#### ClienteFormPage.tsx
```typescript
<TextField
  select
  label="Provincia"
  value={formData.provincia || ''}
  onChange={(e) => setFormData({ ...formData, provincia: e.target.value as ProvinciaEnum })}
  fullWidth
>
  <MenuItem value="">Seleccionar provincia</MenuItem>
  {Object.entries(PROVINCIA_LABELS).map(([key, label]) => (
    <MenuItem key={key} value={key}>
      {label}
    </MenuItem>
  ))}
</TextField>
```

#### SuppliersPage.tsx
```typescript
<TextField
  select
  label="Provincia"
  value={formData.provincia || ''}
  onChange={(e) => setFormData({ ...formData, provincia: e.target.value as ProvinciaEnum })}
  fullWidth
>
  <MenuItem value="">Seleccionar provincia</MenuItem>
  {Object.entries(PROVINCIA_LABELS).map(([key, label]) => (
    <MenuItem key={key} value={key}>
      {label}
    </MenuItem>
  ))}
</TextField>
```

#### LeadFormPage.tsx
Ya estaba correctamente implementado desde el inicio.

### 5. Vistas de Detalle
Se actualizaron las páginas de detalle para mostrar el label:

**ClienteDetailPage.tsx:**
```typescript
<Typography>
  <strong>Provincia:</strong> {cliente.provincia ? PROVINCIA_LABELS[cliente.provincia] : 'No especificada'}
</Typography>
```

**LeadDetailPage.tsx:**
Ya estaba correctamente implementado.

**ConvertLeadPage.tsx:**
Ya estaba correctamente implementado.

### 6. Tablas y Listados
Se actualizaron las celdas de tabla para mostrar labels:

**SuppliersPage.tsx:**
```typescript
<TableCell>{supplier.provincia ? PROVINCIA_LABELS[supplier.provincia] : '-'}</TableCell>
```

**LeadsPage.tsx:**
Ya estaba correctamente implementado.

## Archivos Modificados

1. ✅ `src/types/shared.enums.ts` - Creado con ProvinciaEnum y PROVINCIA_LABELS
2. ✅ `src/types/index.ts` - Cliente, CreateClienteRequest, CreateProveedorDTO
3. ✅ `src/types/lead.types.ts` - LeadDTO
4. ✅ `src/components/Clientes/ClienteFormPage.tsx` - Formulario con Select
5. ✅ `src/components/Clientes/ClienteDetailPage.tsx` - Muestra labels
6. ✅ `src/components/Proveedores/SuppliersPage.tsx` - Formulario y tabla con Select/labels
7. ✅ `src/pages/leads/LeadFormPage.tsx` - Ya correcto
8. ✅ `src/pages/leads/LeadDetailPage.tsx` - Ya correcto
9. ✅ `src/pages/leads/ConvertLeadPage.tsx` - Ya correcto
10. ✅ `src/pages/leads/LeadsPage.tsx` - Ya correcto

## Patrón de Uso

### En formularios (envío de datos):
```typescript
// Estado
const [formData, setFormData] = useState<CreateClienteRequest>({
  provincia: undefined as ProvinciaEnum | undefined,
  // ...
});

// Select
<TextField
  select
  value={formData.provincia || ''}
  onChange={(e) => setFormData({ ...formData, provincia: e.target.value as ProvinciaEnum })}
>
  <MenuItem value="">Seleccionar provincia</MenuItem>
  {Object.entries(PROVINCIA_LABELS).map(([key, label]) => (
    <MenuItem key={key} value={key}>{label}</MenuItem>
  ))}
</TextField>
```

### En vistas (mostrar datos):
```typescript
{cliente.provincia ? PROVINCIA_LABELS[cliente.provincia] : 'No especificada'}
```

### En filtros:
```typescript
// El value del MenuItem debe ser el enum, pero el texto mostrado es el label
{uniqueProvincias.map((provincia) => (
  <MenuItem key={provincia} value={provincia}>
    {provincia && PROVINCIA_LABELS[provincia as ProvinciaEnum] || provincia}
  </MenuItem>
))}
```

## Validación
- ✅ TypeScript compila sin errores
- ✅ Todos los formularios envían valores del enum (no labels)
- ✅ Todas las vistas muestran labels legibles
- ✅ Compatible con backend Java enum

## Testing Recomendado

1. **Crear Cliente**: Seleccionar una provincia y verificar que se guarde correctamente
2. **Editar Cliente**: Verificar que la provincia se carga correctamente en el Select
3. **Ver Detalle**: Verificar que se muestra el nombre legible de la provincia
4. **Filtrar por Provincia**: Verificar que los filtros funcionan correctamente
5. **Crear/Editar Proveedor**: Mismas validaciones que cliente
6. **Sistema de Leads**: Crear, editar, convertir leads con provincia

## Beneficios

1. ✅ **Type Safety**: TypeScript previene asignaciones incorrectas
2. ✅ **Consistencia**: El enum garantiza valores válidos
3. ✅ **Compatibilidad Backend**: Los valores coinciden exactamente con el enum Java
4. ✅ **UX**: Los usuarios ven nombres legibles en lugar de constantes técnicas
5. ✅ **Mantenibilidad**: Un solo lugar para definir provincias
6. ✅ **Sin Errores 400**: Backend valida correctamente los valores

## Notas Importantes

⚠️ **Nunca enviar el label de PROVINCIA_LABELS al backend**, siempre enviar el valor del enum (la key).

✅ **Correcto**: `provincia: "RIO_NEGRO"`  
❌ **Incorrecto**: `provincia: "Río Negro"`

El patrón `Object.entries(PROVINCIA_LABELS).map(([key, label]) => ...)` garantiza que el `value` del `MenuItem` sea la key (enum) y el texto visible sea el label.
