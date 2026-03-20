# Refactor — ripser_front
Actuá como un Security Engineer Senior especializado en React + Vite + multi-tenant SaaS.

Tenés acceso a todo el código del workspace.

NO supongas: si algo no está, decilo explícitamente.

Analizar y mejorar el código sin cambiar el comportamiento. Seguir los pasos en orden.

---

## PASO 1 — Identificar el archivo o módulo

Si el usuario no lo especificó, preguntar:
- **¿Qué archivo o módulo querés refactorizar?**

Leer el archivo completo antes de continuar. Leer también el contexto del módulo en `docs/contextos/contexto-{modulo}.md`.

---

## PASO 2 — Análisis previo

Antes de tocar código, generar un reporte de lo que se encontró:

### Seguridad
- [ ] ¿Hay datos sensibles (tokens, passwords) expuestos en `console.log`?
- [ ] ¿Hay uso de `dangerouslySetInnerHTML` sin sanitizar?
- [ ] ¿Hay inputs del usuario que se inyectan directamente en el DOM?
- [ ] ¿Se usan correctamente los headers de autenticación (Bearer token) y multi-tenant (X-Empresa-Id)?

### Calidad de código
- [ ] ¿Hay lógica duplicada que se puede extraer a un hook custom o utilidad en `src/utils/`?
- [ ] ¿Hay componentes demasiado largos (+300 líneas)?
- [ ] ¿Hay `console.log` de debug que no deberían estar en producción?
- [ ] ¿Hay código comentado que ya no se usa?
- [ ] ¿Hay variables o funciones con nombres poco descriptivos?
- [ ] ¿Los tipos TypeScript son correctos y no usan `any` innecesariamente?
- [ ] ¿Hay `as any` type assertions que se podrían evitar con tipos correctos?

### API y Estado
- [ ] ¿Hay llamadas a la API directamente en el componente en lugar de usar el service de `src/api/services/`?
- [ ] ¿El estado de loading, error y datos vacíos está correctamente manejado?
- [ ] ¿Los efectos (`useEffect`) tienen dependencias correctas?
- [ ] ¿Hay race conditions en llamadas asíncronas? (¿se usa AbortController o cleanup?)
- [ ] ¿Se usa el patrón de paginación correcto? (`usePagination` hook)

### Frontend / UI
- [ ] ¿El componente mezcla lógica de negocio con presentación?
- [ ] ¿Falta manejo de estados de carga o error?
- [ ] ¿Los componentes MUI usan las props correctas de la versión instalada (MUI v6)?
- [ ] ¿Se reutilizan componentes de `src/components/common/` y `src/components/shared/` donde corresponde?
- [ ] ¿Los permisos por rol están verificados con `usePermisos`?

Confirmar el reporte al usuario antes de continuar:
*"Encontré estos puntos a mejorar: {lista}. ¿Procedo con todos o preferís priorizar alguno?"*

---

## PASO 3 — Aplicar mejoras

Por cada problema identificado y aprobado:
- Aplicar el cambio de forma aislada y clara
- No cambiar el comportamiento observable del código
- Mantener las convenciones del proyecto (TypeScript strict, MUI v6, Context API)
- Si se extrae una función, darle un nombre descriptivo consistente con el estilo del archivo

Orden de prioridad:
1. Primero los problemas de **seguridad** (siempre)
2. Luego **duplicación de lógica** (mayor impacto)
3. Luego **legibilidad** (nombres, componentes largos, tipos)
4. Por último **limpieza** (console.logs, código muerto)

---

## PASO 4 — Verificar que no se rompió nada

```bash
npx tsc --noEmit
npm run build
```

Si la compilación falla después del refactor, el refactor introdujo un cambio incompatible — revisar y corregir antes de continuar.

Si hay tests configurados:
```bash
npx vitest run
```

---

## PASO 5 — Agregar tests si faltan

Si el archivo refactorizado no tiene tests, crearlos en `src/components/{Modulo}/__tests__/{Componente}.test.tsx` o `src/hooks/__tests__/{hook}.test.ts` cubriendo:
- Casos de éxito principales
- Validaciones de input
- Aislamiento multi-tenant (verificar que useTenant y X-Empresa-Id estén presentes)

---

## PASO 6 — Resumen final

```
## Refactor completado

**Archivo:** {ruta}

**Cambios aplicados:**
- {cambio 1}
- {cambio 2}
- ...

**Problemas de seguridad corregidos:** {cantidad}
**TypeScript:** ✅ sin errores
**Build:** ✅ exitoso
**Tests:** ✅ X pasando (o "no configurados")
```
