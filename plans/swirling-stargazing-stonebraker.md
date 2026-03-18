# Plan: Adaptar Commands y Crear Contextos de Módulos

## Contexto

El directorio `commands/` contiene 5 archivos de comandos escritos para el proyecto "AlquiloTodo" (full-stack con MySQL, `server/controllers/`, `.jsx`). Este proyecto (**ripser_front**) es un frontend React 19 + TypeScript con Vite, MUI, Context API, y backend separado (Java RipserApp). Los comandos necesitan adaptarse a esta arquitectura, y el usuario quiere además archivos de contexto `.md` por módulo para acelerar el onboarding al trabajar con AI.

---

## Parte 1: Crear directorio de contextos — `docs/contextos/`

Crear `docs/contextos/` con 15 archivos de contexto (uno por módulo). No en la raíz del proyecto.

### Archivos a crear:

| Archivo | Módulo | Archivos clave del src |
|---------|--------|----------------------|
| `contexto-auth-multitenant.md` | Auth & Multi-tenant | `context/AuthContext.tsx`, `context/TenantContext.tsx`, `api/config.ts`, `components/Auth/`, `hooks/usePermisos.ts`, `utils/permissions.ts` |
| `contexto-dashboard.md` | Dashboard | `components/Dashboard/` (Dashboard, AdminDashboard, VendedorDashboard, etc.) |
| `contexto-ventas.md` | Ventas | `components/Ventas/`, APIs: ventaApi, presupuestoApi, facturaApi, opcionFinanciamientoApi |
| `contexto-clientes.md` | Clientes | `components/Clientes/`, APIs: clienteApi, contactoClienteApi, creditoClienteApi, cuentaCorrienteApi |
| `contexto-leads.md` | Leads | `pages/leads/`, `components/leads/`, hooks: useLeads, useRecordatoriosLeads, types: lead.types.ts |
| `contexto-proveedores.md` | Proveedores | `components/Proveedores/`, APIs: proveedorApi, compraApi, evaluacionProveedorApi |
| `contexto-rrhh.md` | RRHH | `components/RRHH/`, APIs: employeeApi, puestoApi, asistenciaApi, licenciaApi, sueldoApi, legajoApi |
| `contexto-logistica.md` | Logística | `components/Logistica/` (+ `Depositos/`), APIs: stockApi, transferenciaApi, reconciliacionApi |
| `contexto-taller.md` | Taller | `components/Taller/`, APIs: ordenServicioApi, tareaServicioApi, materialUtilizadoApi |
| `contexto-fabricacion.md` | Fabricación | `components/Fabricacion/`, APIs: recetaFabricacionApi, equipoFabricadoApi |
| `contexto-prestamos.md` | Préstamos | `components/Prestamos/`, APIs: prestamoPersonalApi, cuotaPrestamoApi |
| `contexto-cobranzas.md` | Cobranzas | `components/Prestamos/Cobranzas/`, APIs: gestionCobranzaApi, types: cobranza.types.ts |
| `contexto-garantias.md` | Garantías | `components/Garantia/`, APIs: garantiaApi, reclamoGarantiaApi |
| `contexto-admin-finanzas.md` | Admin & Finanzas | `components/Admin/`, `Bancos/`, `Cheques/`, `CuentasBancarias/`, APIs: adminFlujoCajaApi, balanceAnualApi, bancoApi, chequeApi |
| `contexto-layout-navegacion.md` | Layout & Navegación | `components/Layout/Sidebar.tsx`, `Layout.tsx`, `CommandPalette.tsx` |

### Template para cada contexto:

```markdown
# Contexto: {Nombre}

## Descripción General
2-3 oraciones del propósito del módulo.

## Archivos del Módulo
- Componentes: `src/components/{Modulo}/`
- API Services: `src/api/services/{xxx}Api.ts`
- Hooks: hooks relevantes
- Types: tipos relevantes en `src/types/`

## Rutas
| Ruta | Componente | Protección |
|------|-----------|------------|

## Endpoints API Consumidos
- GET/POST/PUT/DELETE /api/{recurso}

## Tipos Principales
Interfaces clave con campos más importantes.

## Permisos y Roles
Roles con acceso según PERMISOS_POR_ROL en usePermisos.ts:
ADMIN, OFICINA, VENDEDOR, TALLER, USER, ADMIN_EMPRESA, GERENTE_SUCURSAL

## Multi-tenant
Cómo aplica empresaId/sucursalId.

## Dependencias entre Módulos
Relaciones con otros módulos.

## Patrones Específicos
Particularidades del módulo.
```

---

## Parte 2: Adaptar los 5 archivos de comandos

### 2.1 `commands/audit-tests.md`

**Cambios:**
- Titulo: `# Auditoría de Tests — ripser_front`
- Agregar paso preliminar: "Si no hay framework de testing (Vitest + @testing-library/react), configurarlo primero"
- Escanear `src/components/` Y `src/pages/`
- Tests como `*.test.tsx` / `*.spec.tsx`
- Reemplazar "sucursal_id" → "multi-tenant (useTenant, X-Empresa-Id)"
- Reemplazar "endpoints POST/PUT/DELETE" → "componentes con formularios, dialogs de eliminación, acciones de mutación"
- Priorizar: hooks con lógica (`usePermisos`, `useLeads`), utils (`permissions.ts`, `stockCalculations.ts`), API services
- `npm test` → `npx vitest run` (o el runner configurado)

### 2.2 `commands/fix-bug.md`

**Cambios:**
- PASO 2: Reemplazar `CLAUDE.md` y `prompt-{modulo}.md` → `docs/contextos/contexto-{modulo}.md`
- PASO 3: Eliminar causas backend (SQL, queries, ID_SESSION). Agregar causas frontend:
  - Estado de React (useState, useEffect, re-renders)
  - Contexto (AuthContext, TenantContext desactualizado)
  - Tipado TypeScript (null/undefined no manejado)
  - Llamada API (endpoint incorrecto, payload, header X-Empresa-Id)
  - Routing (ruta incorrecta, ProtectedRoute)
  - Renderizado MUI (props, breakpoints, theme)
  - Permisos frontend (usePermisos)
  - Validación de formulario (Yup, react-hook-form)
- PASO 4: Eliminar convenciones MySQL. Agregar: mantener tipos TS, verificar `npx tsc --noEmit`
- PASO 5: Tests `.tsx` con `@testing-library/react`, path: `src/components/{Modulo}/__tests__/`
- PASO 6: Agregar `npx tsc --noEmit` además de tests

### 2.3 `commands/generar-prompt.md` (REESCRITURA COMPLETA)

**Nuevo título:** `# Nuevo Módulo Completo — ripser_front`

**PASO 1 — Recopilar info:**
1. Nombre del módulo
2. Funcionalidades (CRUD, listado, filtros, detalle, formulario)
3. Lógica especial (estados, cálculos, flujos)
4. Ruta y sección del menú
5. Endpoints del backend RipserApp que consume
6. Roles con acceso
7. Revisar `src/types/` para tipos existentes
8. Generar `docs/contextos/contexto-{modulo}.md`

**PASO 2 — Implementar (todo frontend):**

- **Tipos:** Crear `src/types/{modulo}.types.ts`, exportar desde `src/types/index.ts`
- **API Service:** Crear `src/api/services/{modulo}Api.ts` siguiendo patrón de `clienteApi.ts` (importar `api` desde `../config`)
- **Componentes:** Crear `src/components/{Modulo}/{Modulo}Page.tsx` (.tsx, TypeScript strict, MUI)
- **Hook:** Crear `src/hooks/use{Modulo}.ts` si la lógica es compleja
- **Integración:**
  - Agregar rutas en [App.tsx](src/App.tsx) con `<PrivateRoute>`
  - Agregar items en [Sidebar.tsx](src/components/Layout/Sidebar.tsx)
  - Agregar módulo al type `Modulo` en `src/types/` y a `PERMISOS_POR_ROL` en [usePermisos.ts](src/hooks/usePermisos.ts)
  - Actualizar `docs/contextos/contexto-{modulo}.md`

**PASO 3 — Verificación:**
- `npx tsc --noEmit`
- `npm run build`
- Verificar ruta en navegador

### 2.4 `commands/refactor.md`

**Cambios:**
- Título: `# Refactor — ripser_front`
- PASO 1: Reemplazar `CLAUDE.md` → `docs/contextos/contexto-{modulo}.md`
- PASO 2: Reemplazar checklist completo:

  **Seguridad** (eliminar SQL injection/sucursal_id):
  - Datos sensibles en console.log (tokens, passwords)
  - Uso de `dangerouslySetInnerHTML`
  - Inputs inyectados en DOM sin sanitizar
  - Headers de auth (Bearer) y multi-tenant (X-Empresa-Id) correctos

  **Calidad de código** (mantener y extender):
  - Lógica duplicada → extraer a hook/util
  - Componentes > 300 líneas
  - console.log de debug, código muerto
  - Tipos `any` innecesarios, `as any` evitables

  **API y Estado** (reemplaza "Base de datos"):
  - Llamadas API directas vs usar service
  - Estado loading/error/vacío
  - Dependencias de useEffect correctas
  - Race conditions (abortController)

  **Frontend/UI** (expandir):
  - Separación lógica/presentación
  - MUI v6 props correctas
  - Reutilización de `common/` y `shared/`
  - Permisos verificados con usePermisos

- PASO 4-5: Tests `.tsx`, verificar con `npx tsc --noEmit && npm run build`

### 2.5 `commands/revisar-seguridad.md` (REESCRITURA COMPLETA)

**Nuevo título:** `# Auditoría de Seguridad — ripser_front`

**Secciones nuevas:**

1. **Multi-tenant (X-Empresa-Id):** Verificar [config.ts](src/api/config.ts) adjunte header, ningún componente hardcodee empresaId, sessionStorage para aislamiento por tab, limpieza en logout

2. **XSS** (reemplaza SQL Injection): Buscar `dangerouslySetInnerHTML`, inyección en href/src, `document.write`, `innerHTML`, `eval()`, `Function()`, `setTimeout(string)`

3. **Autenticación y Autorización:** Todas las rutas en App.tsx con `<PrivateRoute>`, validación JWT al cargar, refresh token correcto, `usePermisos` para RBAC, buscar rutas sin protección

4. **Tokens y Datos Sensibles:** No tokens hardcodeados, `.env` en `.gitignore`, no console.log con tokens completos, no tokens en URL params, no secrets en bundle de producción

5. **Validación de Inputs:** react-hook-form + Yup: campos requeridos, longitudes máximas, formatos (email, CUIT), numéricos no negativos, selects controlados

6. **Dependencias:** `npm audit`, verificar CVEs conocidos

**Escanear:** `src/components/`, `src/api/`, `src/context/`, `src/hooks/` (no `server/`)
**Reporte:** Mismo formato (Críticos, Advertencias, OK) referenciando `.tsx`/`.ts`

---

## Parte 3: Orden de ejecución

1. Crear `docs/contextos/` y los 15 archivos de contexto
2. Adaptar `commands/refactor.md` (cambios moderados)
3. Adaptar `commands/fix-bug.md` (cambios moderados)
4. Adaptar `commands/audit-tests.md` (cambios moderados)
5. Reescribir `commands/revisar-seguridad.md` (reescritura completa)
6. Reescribir `commands/generar-prompt.md` (reescritura completa)

---

## Verificación

- Revisar que ningún comando referencie "AlquiloTodo", MySQL, `server/`, `.jsx`, `sucursal_id`, `ID_SESSION`
- Revisar que todos los comandos referencien `docs/contextos/` en lugar de `CLAUDE.md` o `prompt-{modulo}.md`
- Verificar que cada contexto liste correctamente las rutas de App.tsx, los API services, y los permisos de usePermisos.ts
- Los archivos mantienen el idioma español consistente con el proyecto

---

## Archivos críticos a consultar durante la implementación

| Archivo | Para qué |
|---------|----------|
| [App.tsx](src/App.tsx) | Extraer todas las rutas por módulo |
| [Sidebar.tsx](src/components/Layout/Sidebar.tsx) | Estructura de navegación y secciones |
| [usePermisos.ts](src/hooks/usePermisos.ts) | Matriz PERMISOS_POR_ROL (roles → módulos) |
| [config.ts](src/api/config.ts) | Interceptores JWT y X-Empresa-Id |
| [AuthContext.tsx](src/context/AuthContext.tsx) | Flujo de autenticación |
| [TenantContext.tsx](src/context/TenantContext.tsx) | Lógica multi-tenant |
| `src/types/index.ts` | Tipos principales (3,805 líneas) |
| `src/api/services/` | 93 API services para mapear a cada módulo |
