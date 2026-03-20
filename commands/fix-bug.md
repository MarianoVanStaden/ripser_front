# Fix Bug — ripser_front

Actuá como un Security Engineer Senior especializado en React + Vite + multi-tenant SaaS.

Tenés acceso a todo el código del workspace.

NO supongas: si algo no está, decilo explícitamente.

Seguir este proceso en orden. No saltar pasos.

---

## PASO 1 — Entender el bug

Preguntar al usuario si no está claro:
- **¿Qué comportamiento se espera?**
- **¿Qué comportamiento se observa?**
- **¿En qué módulo o archivo ocurre?**
- **¿Se puede reproducir siempre o es intermitente?**

---

## PASO 2 — Reproducir

Antes de tocar código:
- Leer el archivo afectado completo
- Leer el contexto del módulo en `docs/contextos/contexto-{modulo}.md`
- Identificar exactamente en qué línea o función está el problema
- Confirmar al usuario: *"El bug está en {archivo} línea {X} porque {razón}"*

---

## PASO 3 — Identificar causa raíz

No corregir el síntoma, corregir la causa. Analizar:
- ¿Es un problema de **estado de React**? (useState incorrecto, useEffect con dependencias faltantes, re-renders innecesarios)
- ¿Es un problema de **contexto**? (AuthContext o TenantContext no disponible, desactualizado, o no envuelve el componente)
- ¿Es un problema de **tipado TypeScript**? (tipo incorrecto, null/undefined no manejado, `as any` escondiendo un error)
- ¿Es un problema de **llamada API**? (endpoint incorrecto, payload mal formado, header X-Empresa-Id faltante, respuesta no manejada)
- ¿Es un problema de **routing**? (ruta incorrecta, parámetro faltante, PrivateRoute/SuperAdminRoute mal configurado)
- ¿Es un problema de **renderizado MUI**? (props incorrectas, breakpoint, variante de theme, componente deprecado en MUI v6)
- ¿Es un problema de **permisos**? (usePermisos no autoriza el módulo, rol no incluido en PERMISOS_POR_ROL)
- ¿Es un problema de **validación de formulario**? (schema Yup incorrecto, react-hook-form no registra el campo, defaultValues faltantes)
- ¿Es un problema de **lógica de negocio**? (cálculo incorrecto en utils, filtro faltante, condición mal evaluada)

---

## PASO 4 — Corregir

Aplicar la corrección mínima necesaria:
- No refactorizar código no relacionado al bug
- Mantener el estilo y convenciones del archivo existente
- Mantener los tipos TypeScript actualizados si se modifica el shape de datos
- Si la corrección toca el API service, verificar que el tipo de respuesta coincida con `src/types/`
- Verificar que `npx tsc --noEmit` pase sin errores de tipos

---

## PASO 5 — Agregar test para este caso

Crear o actualizar el test en `src/components/{Modulo}/__tests__/{Componente}.test.tsx` o `src/hooks/__tests__/{hook}.test.ts`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('debería {comportamiento esperado}', async () => {
  // arrange: render component con providers necesarios
  // act: interacción del usuario o trigger del bug
  // assert: verificar resultado esperado
});
```

El test debe fallar con el código anterior y pasar con la corrección.

---

## PASO 6 — Verificar que no se rompió nada

```bash
npx tsc --noEmit
npx vitest run
```

Reportar:
- ✅ Tests que pasan
- ❌ Tests que fallan (con detalle)
- ✅ TypeScript compila sin errores
- Confirmar que el bug está corregido y nada más se rompió

---

## PASO 7 — Resumen

Al finalizar, reportar al usuario:

```
## Bug corregido

**Causa raíz:** {explicación en una línea}
**Archivo modificado:** {ruta}
**Cambio aplicado:** {descripción breve del cambio}
**Test agregado:** {nombre del test}
**TypeScript:** ✅ sin errores
**Tests totales:** ✅ X pasando
```
