# Nuevo Módulo Completo — ripser_front

Este comando guía la creación de un módulo frontend completo en React + TypeScript + MUI.
Seguir los pasos en orden.

---

## PASO 1 — Recopilar información del módulo

Antes de escribir cualquier código, recopilar toda la información necesaria:

1. Preguntar al usuario: **¿Cuál es el nombre del módulo?**
2. Preguntar: **¿Qué funcionalidades principales debe tener?** (CRUD, listado con filtros, detalle, formulario, dashboard, etc.)
3. Preguntar: **¿Tiene lógica especial?** (estados, cálculos, flujos de aprobación, integración con otros módulos)
4. Preguntar: **¿Desde dónde se accede?** (ruta URL, sección del menú lateral)
5. Preguntar: **¿Qué endpoints del backend (RipserApp) consume?** (listar rutas API: GET, POST, PUT, DELETE)
6. Preguntar: **¿Qué roles tienen acceso?** (ADMIN, OFICINA, VENDEDOR, TALLER, ADMIN_EMPRESA, GERENTE_SUCURSAL)

Con esa información, revisar `src/types/` para identificar tipos existentes que se puedan reusar.

Generar y guardar el archivo de contexto `docs/contextos/contexto-{modulo}.md` con la estructura estándar:

```markdown
# Contexto: {Nombre}

## Descripción General
## Archivos del Módulo
## Rutas
## Endpoints API Consumidos
## Tipos Principales
## Permisos y Roles
## Multi-tenant
## Dependencias entre Módulos
## Patrones Específicos
```

Confirmar al usuario que el archivo de contexto fue guardado antes de continuar.

---

## PASO 2 — Implementar el módulo

Con el contexto generado como referencia, implementar siguiendo este checklist:

### Tipos TypeScript
- Crear `src/types/{modulo}.types.ts` con las interfaces del módulo
- Exportar los tipos desde `src/types/index.ts`
- Usar tipos estrictos (evitar `any`)

### API Service
- Crear `src/api/services/{modulo}Api.ts`
- Importar `api` desde `../config` (axios instance con interceptors de JWT y X-Empresa-Id)
- Seguir el patrón CRUD estándar del proyecto:

```ts
import api from '../config';
import type { MiEntidad, MiEntidadFormData } from '../../types';

const BASE = '/api/{modulo}';

export const {modulo}Api = {
  getAll: (params?: Record<string, any>) =>
    api.get(BASE, { params }),

  getById: (id: number) =>
    api.get(`${BASE}/${id}`),

  create: (data: MiEntidadFormData) =>
    api.post(BASE, data),

  update: (id: number, data: Partial<MiEntidadFormData>) =>
    api.put(`${BASE}/${id}`, data),

  delete: (id: number) =>
    api.delete(`${BASE}/${id}`),
};
```

### Componentes React
- Crear directorio `src/components/{Modulo}/`
- Crear `{Modulo}Page.tsx` — página principal con listado (DataGrid o tabla MUI)
- Crear formularios/dialogs según necesidad
- Crear `index.ts` para exports del módulo

**Patrones a seguir:**
- TypeScript strict (`.tsx`, tipado explícito, sin `any`)
- MUI v6 components (DataGrid, Dialog, TextField, Button, etc.)
- `useTenant()` para obtener empresaId cuando aplique
- `usePermisos()` para verificar acceso al módulo
- Estados de loading, error y datos vacíos manejados
- Skeleton loaders o CircularProgress mientras carga
- Snackbar/Toast para feedback de acciones
- Dialog de confirmación para acciones destructivas (eliminar)

### Hook custom (si la lógica es compleja)
- Crear `src/hooks/use{Modulo}.ts` si hay lógica de negocio reutilizable
- Encapsular fetching, paginación, filtrado

### Integración

1. **Rutas** — Agregar en `src/App.tsx`:
```tsx
import { {Modulo}Page } from './components/{Modulo}';

// Dentro de <Routes>, como hijo de la ruta Layout
<Route path="{modulo}/gestion" element={<PrivateRoute><{Modulo}Page /></PrivateRoute>} />
```

2. **Navegación** — Agregar sección en `src/components/Layout/Sidebar.tsx`:
```ts
// En el array navigation[]
{
  title: '{MODULO}',
  modulo: '{MODULO}',
  items: [
    { text: 'Gestión {Módulo}', icon: <AssignmentIcon />, path: '/{modulo}/gestion' },
  ],
},
```

3. **Permisos** — Agregar el módulo a la matriz de permisos:
   - En `src/types/index.ts`: agregar `'{MODULO}'` al type `Modulo`
   - En `src/hooks/usePermisos.ts`: agregar `'{MODULO}'` a los roles correspondientes en `PERMISOS_POR_ROL`
   - En la lista de módulos de ADMIN (que tiene acceso a todo)

4. **Contexto** — Actualizar `docs/contextos/contexto-{modulo}.md` con los archivos creados

---

## PASO 3 — Verificación final

```bash
npx tsc --noEmit
npm run build
```

Reportar:
- ✅ TypeScript compila sin errores
- ✅ Build exitoso
- ✅ Ruta accesible en el navegador
- ✅ Módulo aparece en el sidebar para los roles configurados
- ✅ Contexto actualizado en `docs/contextos/`

Si hay tests configurados:
```bash
npx vitest run
```

Reportar:
- ✅ Tests que pasan
- ❌ Tests que fallan (con detalle)
