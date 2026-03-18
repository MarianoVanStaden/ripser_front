# Auditoría de Tests — ripser_front

Auditar la cobertura de tests del proyecto frontend React + TypeScript.

---

## PASO 0 — Verificar framework de testing

Si no hay framework de testing configurado (Vitest, @testing-library/react), configurarlo primero:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Agregar en `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.ts',
}
```

Crear `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

---

## PASO 1 — Escanear cobertura

1. Recorré todos los archivos en `src/components/`, `src/pages/`, `src/hooks/` y `src/utils/`
2. Para cada archivo verificá si existe un test correspondiente:
   - `__tests__/{Archivo}.test.tsx` (colocated)
   - `{Archivo}.test.tsx` o `{Archivo}.spec.tsx` (sibling)
3. Generá un reporte con:
   - Archivos sin ningún test
   - Archivos con tests incompletos (funciones o casos no cubiertos)

---

## PASO 2 — Crear tests faltantes

Priorizar en este orden:

1. **Hooks con lógica de negocio:**
   - `usePermisos` (matriz PERMISOS_POR_ROL, tienePermiso, tieneRol)
   - `useLeads` (fetching, paginación, filtrado)
   - `useClienteSearch` (debounce, búsqueda)
   - `usePagination`

2. **Utilidades críticas:**
   - `utils/permissions.ts` (canAccessMultipleEmpresas, isSuperAdmin, etc.)
   - `utils/stockCalculations.ts` (cálculos de stock)
   - `utils/priceCalculations.ts` (cálculos de precio)
   - `utils/flujoCajaUtils.ts` (flujo de caja)
   - `utils/leadValidations.ts` (validaciones de leads)

3. **API Services** (mockear axios):
   - Servicios con lógica compleja o transformaciones de datos
   - Verificar que los endpoints y headers (Authorization, X-Empresa-Id) se configuren correctamente

4. **Componentes con formularios o mutaciones:**
   - Formularios que mutan datos (crear, editar, eliminar)
   - Dialogs de confirmación/eliminación
   - Componentes con lógica de permisos (usePermisos)

5. **Lógica multi-tenant:**
   - Verificar que `useTenant` provea empresaId correctamente
   - Verificar que el interceptor de axios adjunte X-Empresa-Id

---

## PASO 3 — Ejecutar y reportar

```bash
npx vitest run
```

Reportar:
- ✅ Tests que pasan
- ❌ Tests que fallan (con detalle)
- 📊 Porcentaje de cobertura por área (hooks, utils, components, services)
