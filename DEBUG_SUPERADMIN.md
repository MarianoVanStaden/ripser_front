# Debug: SuperAdmin Issues

## Problema Reportado
- SuperAdmin no puede agregar nuevas empresas
- SuperAdmin no puede cambiar contexto

## Análisis del Código

### 1. EmpresasPage (src/components/Admin/EmpresasPage.tsx)
- **Línea 9**: `const { esSuperAdmin } = useAuth();`
- **Línea 132-136**: Botón "Nueva Empresa" solo se muestra si `esSuperAdmin === true`
- ✅ La lógica está correcta

### 2. TenantSelector (src/components/Tenant/TenantSelector.tsx)
- **Línea 15**: `const { empresaId, sucursalId, cambiarTenant, esSuperAdmin } = useTenant();`
- **Línea 40-44**: Si `esSuperAdmin`, carga TODAS las empresas activas
- **Línea 131-133**: Muestra badge "SUPER ADMIN" si `esSuperAdmin === true`
- ✅ La lógica está correcta

### 3. AuthContext (src/context/AuthContext.tsx)
- **Línea 34**: `const [esSuperAdmin, setEsSuperAdmin] = useState<boolean>(false);`
- **Línea 52**: `const isSuperAdmin = superAdmin === 'true';` (de localStorage)
- **Línea 89**: `const isSuperAdmin = res.esSuperAdmin || false;` (del login response)
- **Línea 181**: `esSuperAdmin` se expone en el contexto
- ✅ El contexto lo expone correctamente

### 4. TenantContext (src/context/TenantContext.tsx)
- **Línea 48-51**: Lee `esSuperAdmin` desde localStorage al inicializar
- **Línea 74-77**: Sincroniza desde localStorage periódicamente
- ✅ También expone `esSuperAdmin`

## Posibles Causas

### A. El backend no está devolviendo `esSuperAdmin: true`
**Verificación necesaria**:
1. Revisar respuesta del endpoint `/api/auth/login`
2. Verificar que el usuario tenga rol `SUPER_ADMIN` en la base de datos
3. Confirmar que `localStorage.getItem('esSuperAdmin')` === 'true'

### B. Doble contexto causando confusión
**Problema**: `esSuperAdmin` existe en AMBOS contextos
- `AuthContext.esSuperAdmin`
- `TenantContext.esSuperAdmin`

**EmpresasPage usa**: `useAuth().esSuperAdmin`
**TenantSelector usa**: `useTenant().esSuperAdmin`

Esto puede causar inconsistencias si no están sincronizados.

### C. El componente no se re-renderiza
Después del login, los valores pueden no estar actualizándose.

## Solución Propuesta

### Fix 1: Agregar Logs de Debug
Agregar console.logs para verificar el valor de `esSuperAdmin`:
- En EmpresasPage
- En TenantSelector
- Durante el login

### Fix 2: Unificar la fuente de verdad
Usar SOLO `AuthContext.esSuperAdmin` como fuente de verdad:
- Eliminar `esSuperAdmin` de TenantContext
- Actualizar TenantSelector para usar `useAuth()` en lugar de `useTenant()`

### Fix 3: Forzar actualización después del login
Asegurar que los componentes se re-rendericen después de que `esSuperAdmin` cambie.

## Próximos Pasos

1. Agregar logs temporales para debug
2. Verificar qué valor tiene `esSuperAdmin` en cada contexto
3. Identificar si el problema es:
   - Backend no devuelve el valor
   - Frontend no lo lee correctamente
   - Los componentes no se actualizan
