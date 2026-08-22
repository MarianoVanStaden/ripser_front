# UX Mobile Review — ripser_front

> **Estado (2026-08-22): IMPLEMENTADO.** Fases 1 y 2 completas y verificadas (`tsc -b` + `npm run build` + `playwright --list` limpios). Fase 3 parcial: bottom nav por rol de campo ✔, `@ts-nocheck` de Taller removido ✔, reduced-motion/limpieza CSS ✔, ScrollMemory ✔. Pendientes explícitos: cola offline de escrituras (requiere idempotencia en `ripser_back`), filtros `estado`/`garantiaId` en `GET /api/reclamos-garantia` (bloquea la paginación server-side de Reclamos), sweep completo de `aria-label`, y alineación MUI v7. Vendor eager: 435→393 KB gz.
> Fecha: 2026-08-22 · Pasada de **diagnóstico** (sin modificar código).
> Alcance: experiencia mobile 360–430px, foco en personal de campo (transporte/entregas > post-venta > leads > ventas > compras > admin).
> Metodología: Fase 0 de reconocimiento (theme, layout raíz, Vite/PWA, antecedentes) + 5 barridos con evidencia `ruta:línea`. Cada hallazgo está marcado como **[V]** verificado en código o **[H]** hipótesis a validar en runtime.
> Antecedentes: no se repiten los hallazgos ya cerrados de `AUDITORIA_TECNICA.md` (FRONT-001 code-split por ruta ✔, modulePreload filtrado ✔, Sentry ✔). Se actualiza su estado donde corresponde.

---

## 1. Resumen ejecutivo

La app **no es mobile-first: es un desktop que a veces colapsa bien**. Hay islas excelentes (Deliveries/Trips con cards + `BottomSheet`, `ComunicacionesInicialesPage` con card-view y targets de 44px, `VentasDashboard`, la ficha pública QR) que demuestran que el equipo sabe hacerlo — pero el 90% del código no consulta breakpoints (46/432 `.tsx` usan `useMediaQuery`; `src/pages/` entero tiene **cero**), 86% de los 214 dialogs no son `fullScreen`, y el patrón dominante de datos es tabla MUI de 800–1370px con scroll horizontal.
Los 3 problemas de mayor impacto:
1. **La confirmación de entrega — el flujo de campo más crítico — permite doble submit en 3G** (riesgo de cobro/entrega duplicada) y no persiste nada si se cae la señal o se recarga la app.
2. **La app es hostil a la red mala**: sin runtime caching de API, sin detección de offline, `networkMode` default, axios timeout 10s sin retry, y un service worker `autoUpdate`+`skipWaiting` que **recarga la página sin avisar en medio de un formulario** cuando sale un deploy.
3. **Tablas y touch**: 134 tablas manuales sin fallback card ni `columnVisibilityModel` (usado en 1 solo archivo), ~2000 `size="small"`, 358 tooltips hover-only como única fuente de significado, y acciones destructivas pegadas a comunes — incluida **Cancelar orden de servicio sin confirmación**.

---

## 2. Tabla de hallazgos

Severidad: **P0** bloquea tarea de campo · **P1** fricción severa / pérdida de datos · **P2** degradación notable · **P3** pulido. Esfuerzo: S < 1 día · M 1–3 días · L > 3 días.

| # | Hallazgo | Eje | Módulo | Sev | Impacto en usuario | Esf | Evidencia |
|---|---|---|---|---|---|---|---|
| 1 | Confirmar entrega sin guard de doble submit (botón solo valida `receptor.nombre`); el handler padre tampoco tiene flag | Estados/Forms | Transporte | **P0** | Doble tap en 3G ⇒ entrega/cobro duplicado | S | `Logistica/Deliveries/dialogs/ConfirmDeliveryDialog.tsx:145,288`, `Logistica/DeliveriesPage.tsx:575-633` |
| 2 | SW `autoUpdate`+`skipWaiting`+`clientsClaim` sin UI de update: un deploy recarga la app sin aviso | PWA | Global | **P0** | Operario pierde el formulario a medio llenar | S | `vite.config.ts:46,74-75`; 0 usos de `useRegisterSW` en `src/` |
| 3 | Cero manejo de offline: sin `runtimeCaching` de API, sin `navigator.onLine`, `networkMode` default, axios sin manejo de error de red | Estados/PWA | Global | **P0** | Sin señal: errores genéricos o spinner eterno; datos y fotos solo en memoria | M | `vite.config.ts:71-82`, `src/main.tsx:9-17`, `src/api/config.ts:36-42` (timeout 10s) |
| 4 | `IncidenciasVehiculoPage` (pantalla de campo real del chofer) sin nada responsive, IconButtons ~34px, destructivo pegado, info en tooltips | Layout/Touch | Transporte | **P0** | Reportar una incidencia desde el camión es casi imposible en 360px | M | `Logistica/IncidenciasVehiculoPage.tsx:689-718,891-909` |
| 5 | Foto de entrega: si cae la señal entre `confirmarEntrega` y el loop de uploads, la entrega queda ENTREGADA sin evidencia; `File[]` solo en `useState`, recarga = pérdida total | Estados | Transporte | **P1** | Evidencia fotográfica incompleta; retrabajo manual | L | `Logistica/DeliveriesPage.tsx:584-615,180` |
| 6 | Cancelar orden de servicio dispara directo desde IconButton, **sin ConfirmDialog** (a diferencia de Garantías/Tareas) | Touch | Post-venta | **P1** | Cancelación irreversible por mistap en tabla con scroll-x | S | `Taller/OrdenesServicioPage.tsx:291,512` |
| 7 | 86% de los 214 dialogs sin `fullScreen` mobile; no existe wrapper común; backdrop-close sin guard pierde lo tipeado (Garantía, Reclamo, leads, ventas) | Overlays | Transversal | **P1** | Forms flotantes con teclado tapando campos; mistap en backdrop = pérdida de datos | M | inventario: `fullScreen` en 31/173 archivos; `Garantia/GarantiaFormDialog.tsx:137`, `ReclamoFormDialog.tsx:155` |
| 8 | Tablas anchas sin fallback card: Reclamos `minWidth:1370` (10 col), Garantías `1180` (9 col), RegistroVentas `900`, Trabajos/Órdenes `800`; solo 1 archivo usa `columnVisibilityModel`; 0 virtualización | Tablas | Transversal | **P1** | 3.8× de pan horizontal con el pulgar para operar | L | `Garantia/ReclamosGarantiaPage.tsx:335`, `GarantiasPage.tsx:371`, `Ventas/RegistroVentasPage.tsx:914-926`; inventario |
| 9 | `type="tel"` = **0 usos en todo el repo**; `inputMode` en 9 ocurrencias; `autoComplete` en 3; campos de monto/km con `type="number"` | Formularios | Leads/Transp. | **P1** | Vendedor teclea teléfonos con teclado alfabético; spinners en km/montos | S | `pages/leads/LeadFormPage.tsx:583-602`, `ConvertLeadPage.tsx:550-578`, `PreViajeChecklistDialog.tsx:288,352` |
| 10 | `ConvertLeadPage` sin guard síncrono anti doble-submit (sí lo tiene `LeadFormPage` con `savingRef`) | Estados | Leads | **P1** | Doble tap ⇒ cliente duplicado | S | `pages/leads/ConvertLeadPage.tsx:192-245,824` vs `LeadFormPage.tsx:87,294-303` |
| 11 | Ficha pública QR: teléfono de soporte placeholder `tel:+541234567890` en producción + `alert()` nativo en error de PDF | Robustez | Post-venta | **P1** | Cliente final llama a un número inválido | S | `Public/PublicFichaEquipoPage.tsx:599,110` |
| 12 | Acciones de fila: hasta 5 `IconButton size="small"` pegados, destructivo junto a común, significado solo en Tooltip (hover) — Leads, Órdenes, Garantías, Trips | Touch | Transversal | **P1** | Mistap Anular↔Reclamar / Eliminar↔Editar; íconos indescifrables en touch | M | `pages/leads/LeadsTablePage.tsx:827-878`, `Taller/OrdenesServicioPage.tsx:463-518`, `Garantia/GarantiasPage.tsx:489-522` |
| 13 | `AsignacionTareasPage.handleSaveTarea` sin flag `saving` ⇒ doble tap crea dos tareas | Estados | Post-venta | **P1** | Datos duplicados | S | `Taller/AsignacionTareasPage.tsx:182,772` |
| 14 | Reclamos: `findAll({ size: 1000 })` ×2 con filtro/paginación client-side; dashboards piden `size: 500/1000` | Performance | Post-venta | **P2** | Payloads gigantes en 3G, riesgo en gama baja | M | `Garantia/ReclamosGarantiaPage.tsx:60-61,99-104`, `pages/post-venta/PostVentaDashboard.tsx:129` |
| 15 | `html2canvas` importado estático en `pdfExportUtils` cae al chunk `vendor` **eager** (no está en `manualChunks`) | Performance | Global | **P2** | ~40-50 KB gz de más en el first paint 3G | S | `src/utils/pdfExportUtils.ts:2`, `vite.config.ts:146-180`; confirmado en `dist/assets/vendor-*.js` |
| 16 | `AuthContext` y `TenantContext` con `value` objeto literal sin `useMemo` (ColoresContext sí memoiza) | Performance | Global | **P2** | Re-render global de todos los consumidores en cada cambio | S | `context/AuthContext.tsx:320-333`, `TenantContext.tsx:457-476`, patrón correcto en `ColoresContext.tsx:59-65` |
| 17 | Sin `ScrollRestoration` (router legacy `<Routes>`); volver de detalle a listado pierde posición (LeadsTable persiste filtros pero no scroll del virtualizer) | Navegación | Leads+ | **P2** | El vendedor vuelve del lead 40 y arranca arriba | M | grep 0 matches; `pages/leads/LeadsTablePage.tsx:212-226,286` |
| 18 | `Layout.tsx` inicializa `sidebarOpen=true` sin forzar `false` en mobile [H: drawer temporal abierto al entrar] | Navegación | Global | **P2** | Primer paint en teléfono tapado por el menú | S | `components/Layout/Layout.tsx:19`, `Sidebar.tsx:396` |
| 19 | Sin bottom navigation ni FAB consistente; única nav = hamburguesa arriba-izquierda (fuera de thumb zone); buscador global solo Ctrl+K | Navegación | Global | **P2** | Módulos de campo navegan con la mano contraria | L | `Sidebar.tsx:370-392,125-134`; grep `BottomNavigation` = 0 |
| 20 | Snackbars fragmentados: 23 implementaciones locales, `anchorOrigin` inconsistente (bottom/center, bottom/right, top/…), sin provider global; algunos chocan con FAB | Overlays | Transversal | **P2** | Feedback impredecible; éxito como Dialog animado en Órdenes | M | inventario; `Taller/OrdenesServicioPage.tsx:1242-1260` |
| 21 | Sin empty state en la lista mobile de entregas (mapea directo, vacío = pantalla en blanco) | Estados | Transporte | **P2** | El chofer no distingue "sin entregas" de "no cargó" | S | `Logistica/DeliveriesPage.tsx:1224-1229` |
| 22 | `@dnd-kit` solo `PointerSensor`, sin `TouchSensor` ni `activationConstraint` (drag compite con scroll táctil); mitigado por fallback de flechas | Touch | Logística | **P2** | Reordenar paradas en teléfono es errático | S | `Logistica/tripWizard/SortableDeliveryList.tsx:17-23` |
| 23 | `DatePicker` desktop en todos lados (0 `MobileDatePicker`); `FechaField` no fuerza variante mobile | Formularios | Transversal | **P2** | Picker chico y denso en táctil | S | `common/FechaField.tsx`; inventario 15 imports |
| 24 | Contraste: `#757575` sobre `#f5f5f5` ≈ 4.05:1 (< 4.5 AA), con `text.secondary` usado 1440 veces; crítico bajo sol directo | A11y | Global | **P2** | Texto secundario ilegible en exteriores | S | `src/theme/index.ts:38-41` |
| 25 | 63 `aria-label` para 422 IconButtons; `prefers-reduced-motion` solo en CSS de plantilla; `@ts-nocheck` en las 3 páginas de Taller | A11y/Deuda | Transversal | **P2** | Screen reader sin nombres; errores de tipo ocultos | M | inventario; `Taller/*Page.tsx:2` |
| 26 | Sin `viewport-fit=cover` ni `env(safe-area-inset-*)` en todo el repo; AppBar fija + logout al fondo del drawer [H: solapan notch/home-indicator en iOS] | Layout | Global | **P3** | Elementos bajo zonas del sistema en iPhone | S | `index.html:8`; grep = 0 |
| 27 | `dayjs.locale('es')` y `LocalizationProvider` repetidos por página (no globales); 4 helpers de moneda distintos sin `Intl.NumberFormat` cacheado | Consistencia | Transversal | **P3** | Locale frágil por orden de import; formateo inconsistente | S | `pages/ventas/VentasDashboard.tsx:67,447`, `utils/financiamiento.ts:78`, `utils/flujoCajaUtils.ts:440`, `utils/leadValidations.ts:102` |
| 28 | Restos de plantilla Vite en `index.css` (dark colors, `h1 3.2em`) y `console.log` en prod (`Sidebar.tsx:247`, `LeadFormPage.tsx:357`, Taller) | Deuda UI | Global | **P3** | Flash potencial, ruido | S | `index.css:6-8,41-44` |
| 29 | `<img>` de fotos de entrega sin `loading="lazy"`/`decoding="async"` (3 archivos, todos Deliveries) | Performance | Transporte | **P3** | Descarga eager de fotos con datos móviles | S | `Logistica/Deliveries/EntregaDocumentosCard.tsx`, `dialogs/ConfirmDeliveryDialog.tsx`, `LightboxDialog.tsx` |
| 30 | Mezcla MUI material v6 / system v7 / x-* v8: **no se detectaron inconsistencias concretas de tema o breakpoints en esta pasada** [H]; el riesgo es de tipos/duplicación de `@mui/system` en bundle | Consistencia | Global | **P3** | Potencial drift al actualizar | M | `package.json`; validar con `npm ls @mui/system` |

Nota eje 8 (Web Vitals): con first paint ≈ **520 KB gz** (`vendor` 435 + `index` 47 + `vendor-sentry` 38, medidos en `dist/`), en 3G + CPU 4× la estimación es LCP 6–9s en primera visita (el precache del SW lo amortiza en visitas siguientes) e INP degradado en las tablas de 500–1000 filas sin virtualizar (#14, #8). CLS bajo: no hay imágenes sin dimensión en flujos principales. **[H]** — validar con Lighthouse (ver §7).

---

## 3. Detalle de P0/P1

### #1 — Doble submit en confirmación de entrega (P0)

**Qué está mal.** En `ConfirmDeliveryDialog.tsx` el botón Confirmar solo se deshabilita con `disabled={!receptor.nombre.trim()}` (`:145` mobile, `:288` desktop). La prop `uploading` existe pero solo pinta un spinner (`:212`), no bloquea. El handler padre `handleConfirmDelivery` (`DeliveriesPage.tsx:575-633`) tampoco tiene flag. En 3G el POST tarda segundos y el operario re-toca.
**Por qué importa.** `confirmarEntrega` toca dinero (cobro en entrega) y estado; un duplicado es un incidente de caja/CC — la categoría de bug que en este proyecto ya obligó a saneos manuales en prod.
**Solución** (patrón `savingRef` que ya existe en `LeadFormPage.tsx:87` — reusar, no inventar):

```tsx
// DeliveriesPage.tsx — dentro del componente
const confirmingRef = useRef(false);
const [confirming, setConfirming] = useState(false);

const handleConfirmDelivery = async (data: ConfirmDeliveryData) => {
  if (confirmingRef.current) return;   // guard síncrono: gana al re-render
  confirmingRef.current = true;
  setConfirming(true);
  try {
    await entregaApi.confirmarEntrega(selectedDelivery!.id, data);
    // ...loop de uploads existente...
  } catch (err) {
    setError(parseApiError(err));      // NO cerrar el diálogo (ya es así — mantener)
  } finally {
    confirmingRef.current = false;
    setConfirming(false);
  }
};
```

```tsx
// ConfirmDeliveryDialog.tsx — nueva prop obligatoria
interface ConfirmDeliveryDialogProps {
  // ...existentes...
  submitting: boolean;
}

<Button
  variant="contained"
  onClick={handleConfirm}
  disabled={submitting || uploading || !receptor.nombre.trim()}
  startIcon={submitting ? <CircularProgress size={18} /> : undefined}
  sx={{ minHeight: 48 }}
>
  {submitting ? 'Confirmando…' : 'Confirmar entrega'}
</Button>
```

Y bloquear el dismiss durante el envío (el `BottomSheet`/`SwipeableDrawer` hoy se cierra por swipe/backdrop): `onClose={() => { if (!submitting && !uploading) onClose(); }}` — mismo patrón que ya usa `KmEmpleadosPage.tsx:413`.
**Alternativas.** (a) Migrar a `useMutation` con `isPending` — más correcto a largo plazo (retry, estado estandarizado) pero toca todo el flujo de escrituras del módulo, que hoy es 100% async manual (`grep useMutation` = 0 en Logística); (b) idempotency key en el backend — la red de seguridad definitiva para dinero, pero es tarea de `ripser_back`. **Recomiendo** el guard ahora (S, cero riesgo) y anotar (b) como follow-up backend. Aplicar el mismo fix a `RejectDeliveryDialog.tsx:67,136`.
**Riesgo desktop.** Nulo — solo agrega `disabled` durante una mutación en curso.

### #2 — Service worker recarga sin aviso (P0)

**Qué está mal.** `vite.config.ts:46,74-75`: `registerType: 'autoUpdate'` + `skipWaiting: true` + `clientsClaim: true`, y no hay ningún `useRegisterSW` en `src/`. Al publicar un deploy, el SW nuevo toma control y el reload descarta el estado de la SPA.
**Por qué importa.** Todos los formularios de campo viven en `useState` (hallazgo #5): un deploy a las 11:00 le borra el checklist al chofer que lo estaba llenando. Es pérdida de datos inducida por nosotros.
**Solución.** Pasar a `prompt` y ofrecer el update:

```ts
// vite.config.ts
VitePWA({
  registerType: 'prompt',
  // quitar skipWaiting/clientsClaim del workbox: con 'prompt', el SW nuevo
  // espera a que el usuario acepte
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    cleanupOutdatedCaches: true,
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    navigateFallbackDenylist: [/^\/api\//],
  },
  // ...manifest igual...
}),
```

```tsx
// src/components/common/ReloadPrompt.tsx
import { Snackbar, Button } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <Snackbar
      open={needRefresh}
      message="Hay una versión nueva de Ripser"
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      action={
        <>
          <Button color="inherit" size="small" onClick={() => setNeedRefresh(false)}>
            Después
          </Button>
          <Button color="secondary" size="small" onClick={() => updateServiceWorker(true)}>
            Actualizar
          </Button>
        </>
      }
    />
  );
}
```

Montarlo una vez dentro de `<Router>` en `App.tsx`. (`virtual:pwa-register/react` es API estándar de `vite-plugin-pwa`; agregar `"vite-plugin-pwa/react"` a `types` en `tsconfig.app.json` si TS no resuelve el virtual module.)
**Alternativas.** Mantener `autoUpdate` pero solo aplicar en `visibilitychange`/navegación — más código y sigue habiendo ventana de pérdida. **Recomiendo** `prompt`: es el default seguro para apps con formularios largos.
**Riesgo desktop.** Bajo: los usuarios de escritorio ven un snackbar en vez de recarga silenciosa. Interactúa con el `lazyWithReload` de `App.tsx:30-60` (chunks viejos tras deploy): con `prompt`, el HTML viejo sigue sirviéndose desde precache hasta aceptar, lo que **reduce** los chunk-load errors, no los aumenta.

### #3 — Red mala: sin offline, sin retry, sin feedback (P0)

**Qué está mal.** Tres capas, todas verificadas: (1) el SW no cachea API (`navigateFallbackDenylist` y cero `runtimeCaching` — `vite.config.ts:71-82`); (2) `QueryClient` con `retry: 1` y sin `networkMode` (`main.tsx:12-17`) — offline las queries quedan `paused` sin feedback; (3) axios `timeout: 10000` sin distinción de error de red (`api/config.ts:36-42`) — en 3G real un GET pesado (los `size: 1000` del hallazgo #14) revienta a los 10s con error genérico. No hay ningún listener de `navigator.onLine` en el repo.
**Por qué importa.** El perfil crítico es conectividad intermitente. Hoy "sin señal" se ve como "la app está rota".
**Solución (fase 1 — feedback y resiliencia de lectura; la cola offline de escritura es estructural, ver roadmap):**

```ts
// src/hooks/useOnlineStatus.ts
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export const useOnlineStatus = (): boolean =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
```

```tsx
// src/components/common/OfflineBanner.tsx — montar junto a ImpersonationBanner en App.tsx
import { Alert, Collapse } from '@mui/material';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <Collapse in={!online}>
      <Alert severity="warning" sx={{ borderRadius: 0 }}>
        Sin conexión — los datos que cargues no se enviarán hasta recuperar señal.
      </Alert>
    </Collapse>
  );
}
```

```ts
// src/main.tsx — endurecer defaults para 3G
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      networkMode: 'offlineFirst', // sirve cache si hay; reintenta al volver online
    },
    mutations: {
      retry: 0,          // NUNCA reintentar mutaciones automáticamente: tocan dinero
      networkMode: 'online',
    },
  },
});
```

```ts
// vite.config.ts — runtime cache SOLO de GETs de catálogo/lectura, nunca de escrituras
workbox: {
  // ...existente...
  runtimeCaching: [
    {
      urlPattern: ({ url, request }) =>
        request.method === 'GET' && url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-get',
        networkTimeoutSeconds: 8,
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 12 },
        cacheableResponse: { statuses: [200] },
      },
    },
  ],
},
```

Y en `api/config.ts`, normalizar el error de red para que las pantallas puedan distinguirlo: en el interceptor de response, si `!error.response` (network/timeout), rechazar con un error tipado `{ kind: 'network' }` y mensaje en español.
**Alternativas.** `networkMode: 'always'` (falla inmediato offline, feedback más honesto pero sin auto-recuperación) vs `offlineFirst` (recomendado: muestra el cache del SW y reintenta). Cola de mutaciones offline con IndexedDB (`persistQueryClient` + mutation defaults): es lo correcto para confirmar entregas sin señal, pero exige idempotencia backend primero — Fase 3.
**Riesgo desktop.** `NetworkFirst` con timeout 8s puede servir datos de hasta 12h si el backend está caído — aceptable y visible (mostrar `dataUpdatedAt` donde importe). No cachear nunca POST/PUT.

### #4 — IncidenciasVehiculoPage no responsive (P0) + #8 patrón de tablas (P1)

**Qué está mal.** La pantalla donde el chofer reporta una incidencia (`IncidenciasVehiculoPage.tsx`, 1343 LOC) no tiene una sola línea responsive: filtros `minWidth:130/180` en fila (`:891-909`), tabla con descripción truncada legible solo por Tooltip (`:689-694`), acciones `size="small"` ~34px con Eliminar pegado a Editar (`:704-718`). Es el caso extremo del patrón general (#8): 134 tablas manuales, cero card-view salvo `ComunicacionesInicialesPage` y Deliveries.
**Por qué importa.** Es una tarea que ocurre *en la ruta*, con guantes y sol. Hoy exige zoom + pan.
**Solución: un patrón único reutilizable, no 20 fixes.** El repo ya tiene las dos mitades: la card-view de `ComunicacionesInicialesPage.tsx:304-345` y el `useResponsive` de `Deliveries/useResponsive.ts`. Extraer un componente genérico:

```tsx
// src/components/common/ResponsiveDataView.tsx
import { ReactNode } from 'react';
import { Stack, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveDataViewProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  /** Card por item en < md. Targets ≥44px, acción primaria abajo-derecha. */
  renderCard: (item: T) => ReactNode;
  /** Tabla existente en ≥ md (se pasa tal cual, sin tocar desktop). */
  renderTable: () => ReactNode;
  emptyState: ReactNode;
  breakpoint?: 'sm' | 'md';
}

export function ResponsiveDataView<T>({
  items, getKey, renderCard, renderTable, emptyState, breakpoint = 'md',
}: ResponsiveDataViewProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));

  if (items.length === 0) return <>{emptyState}</>;
  if (!isMobile) return <>{renderTable()}</>;
  return (
    <Stack spacing={1.5}>
      {items.map((item) => <div key={getKey(item)}>{renderCard(item)}</div>)}
    </Stack>
  );
}
```

La tabla desktop existente se pasa como `renderTable` sin modificarla — **cero regresión desktop por construcción**. La card mobile muestra 3–4 campos prioritarios + acciones como botones con texto (resuelve de paso #12 y los tooltips hover-only). Orden de adopción: Incidencias → Reclamos → Garantías → RegistroVentas → Órdenes/Trabajos.
**Alternativas.** (a) `columnVisibilityModel` por breakpoint — solo aplica a los 3 DataGrid (Fabricación); para las 134 tablas manuales no existe. (b) Scroll horizontal "mejorado" (`StickyScrollTable`) — ya existe y es exactamente lo que no funciona con una mano. (c) Virtualizar con `@tanstack/react-virtual` — complementario para listas >200 filas (ya hay precedente en `LeadsTablePage.tsx:286`), no sustituto del card layout. **Recomiendo** (ResponsiveDataView) + paginación server-side donde hoy hay `size:1000` (#14).
**Riesgo desktop.** Nulo si `renderTable` es la tabla actual sin cambios.

### #6 — Cancelar orden sin confirmación (P1)

**Qué está mal.** `OrdenesServicioPage.tsx:512`: el IconButton Cancelar (rojo, `size="small"`, quinto de una fila de 5 en una tabla con scroll-x) llama `handleCambiarEstado(:291)` directo. Garantías (`GarantiasPage.tsx:581-604`) y Tareas (`AsignacionTareasPage.tsx:959-984`) sí confirman con el `ConfirmDialog` existente.
**Solución.** Reusar el mismo `ConfirmDialog` del módulo:

```tsx
const [ordenACancelar, setOrdenACancelar] = useState<OrdenServicio | null>(null);

// en la celda de acciones: onClick={() => setOrdenACancelar(orden)}

<ConfirmDialog
  open={ordenACancelar !== null}
  title="Cancelar orden de servicio"
  message={`¿Cancelar la orden #${ordenACancelar?.numero} de ${ordenACancelar?.clienteNombre}? Esta acción no se puede deshacer.`}
  confirmLabel="Cancelar orden"
  confirmColor="error"
  loading={cambiandoEstado}
  onConfirm={() => ordenACancelar && handleCambiarEstado(ordenACancelar.id, 'CANCELADA')}
  onClose={() => setOrdenACancelar(null)}
/>
```

(Ajustar props al shape real del `ConfirmDialog` común — verificar firma antes de implementar.) Aplicar el mismo criterio a Iniciar/Finalizar solo si son costosos de revertir; si no, dejarlos directos (KISS).
**Riesgo desktop.** Un click extra para cancelar — deseable también en desktop.

### #7 — Dialogs: wrapper responsive + guard de backdrop (P1)

**Qué está mal.** 173 archivos abren `<Dialog>`; solo 31 usan `fullScreen`. Los forms de Garantía/Reclamo/leads/ventas quedan flotando con el teclado virtual tapando campos, y el backdrop-close descarta lo tipeado sin preguntar.
**Solución.** Un wrapper único (mismo espíritu que `FechaField`):

```tsx
// src/components/common/ResponsiveDialog.tsx
import { Dialog, DialogProps, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveDialogProps extends Omit<DialogProps, 'fullScreen'> {
  /** Bloquea backdrop/escape (submit en curso o form con cambios). */
  disableDismiss?: boolean;
}

export default function ResponsiveDialog({
  disableDismiss = false, onClose, ...props
}: ResponsiveDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      {...props}
      fullScreen={fullScreen}
      onClose={(event, reason) => {
        if (disableDismiss && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        onClose?.(event, reason);
      }}
    />
  );
}
```

Adopción incremental: reemplazo drop-in de `<Dialog>` empezando por los forms de campo (Garantía, Reclamo, Incidencias, dialogs de leads). `disableDismiss` se pasa `true` mientras `saving`/`isDirty`. Para flujos de campo tipo bottom-sheet ya existe `SwipeableDrawer`/`BottomSheet` en Logística — no duplicar: el wrapper es para el resto de la app.
**Alternativas.** Confirmar "¿descartar cambios?" al cerrar con `isDirty` (RHF lo da gratis) — más fino, más trabajo; dejarlo para forms largos concretos.
**Riesgo desktop.** `fullScreen` solo activa `< sm` (600px) — desktop no cambia. `disableDismiss` en desktop también evita perder datos por click afuera: mejora, no regresión.

### #9 — Teclados: `type="tel"` / `inputMode` (P1)

**Qué está mal.** Cero `type="tel"` en el repo; los teléfonos de `LeadFormPage.tsx:583-602` y `ConvertLeadPage.tsx:570-578` abren teclado alfabético. Montos/km usan `type="number"` (spinners, coma/punto errático en Android).
**Solución.** Barrido mecánico con dos recetas:

```tsx
// Teléfonos
<TextField label="Teléfono" type="tel" autoComplete="tel"
  inputProps={{ inputMode: 'tel' }} {...register('telefono')} />

// Montos y decimales (km, litros, horas): NO type="number"
<TextField label="Monto" inputProps={{ inputMode: 'decimal' }} />

// Enteros (DNI, cantidad) — patrón que YA existe en ConfirmDeliveryDialog.tsx:174
<TextField label="DNI" inputProps={{ inputMode: 'numeric' }} />
```

Prioridad: LeadForm/ConvertLead (teléfonos, CUIT `inputMode:'numeric'`), PreViajeChecklist `:288,352`, Incidencias `:442`, Km `:433-461`, Hospedajes `:464`, Reclamo `:239`. Nota: quitar `type="number"` en campos con lógica de `valueAsNumber` requiere revisar el parseo (string con coma) — hacerlo campo por campo, no con sed.
**Riesgo desktop.** `inputMode` no afecta desktop; quitar spinners de `type="number"` es neutro o positivo.

### #10/#13 — Guards de submit faltantes (P1)

`ConvertLeadPage.tsx:192-245` y `AsignacionTareasPage.tsx:182`: copiar literal el patrón `savingRef` de `LeadFormPage.tsx:87,294-303` (guard síncrono + `disabled` + spinner). Convertir lead crea cliente (duplicado = dedup manual, ya hubo scripts de dedup de clientes en este proyecto); crear tarea duplicada es retrabajo. Esfuerzo S cada uno, riesgo nulo.

### #11 — Ficha pública QR: teléfono placeholder (P1)

`PublicFichaEquipoPage.tsx:599`: `href="tel:+541234567890"` es un placeholder que un **cliente final** puede marcar. Mover a env (`VITE_SOPORTE_TEL`, mismo mecanismo que `VITE_QR_BASE_URL` en `FichaEquipoPage.tsx:33`) y **ocultar el botón si no está definido**. De paso: `alert()` de `:110` → Snackbar, y convertir el import estático de `pdfService` (`:30`, arrastra jspdf al chunk de la ruta pública) en `await import('../../services/pdfService')` dentro de `handleDescargarPDF` — el que escanea el QR solo quiere *ver* la ficha. Esfuerzo S.

### #5 — Fotos de entrega sin persistencia (P1, estructural)

Secuencia actual (`DeliveriesPage.tsx:584-615`): confirmar → subir fotos en loop; si cae la señal en el medio, la entrega queda ENTREGADA sin evidencia (hay warning con reintento manual — degradación consciente, pero frágil). Los `File[]` viven en `useState` (`:180`): recarga (¡o el deploy de #2!) = pérdida total. **Solución completa** = cola de subidas en IndexedDB con reintento al volver online (y detrás, idempotencia backend). Es Fase 3 (L); el mitigador barato de Fase 1 es #2 (no recargar solo) + banner offline de #3 + mantener el diálogo abierto en error (ya se hace).

---

## 4. Quick wins (< 1 día c/u, alto impacto)

1. **Guard de doble submit** en ConfirmDelivery/Reject (#1), ConvertLead (#10), AsignacionTareas (#13) — patrón `savingRef` ya existente.
2. **ConfirmDialog en Cancelar orden** (#6).
3. **SW a `registerType: 'prompt'` + `ReloadPrompt`** (#2).
4. **Teléfono de soporte real (env) + quitar `alert()` + jspdf dinámico en la ficha QR** (#11).
5. **`type="tel"`/`inputMode` en los ~15 campos identificados** (#9).
6. **`html2canvas` a `manualChunks`** (`if (id.includes('/html2canvas/')) return 'vendor-html2canvas'`) — −40/50 KB gz del first paint (#15).
7. **`useMemo` en el `value` de AuthContext y TenantContext** (copiar `ColoresContext.tsx:59-65`) (#16).
8. **`sidebarOpen` inicial `false` en mobile** (`useMediaQuery` en `Layout.tsx:19`) (#18).
9. **Empty state en lista mobile de entregas** (#21).
10. **`TouchSensor` + `activationConstraint: { delay: 150, tolerance: 8 }`** en `SortableDeliveryList.tsx` (#22).
11. **`OfflineBanner` + `useOnlineStatus`** (#3, parte 1).
12. **Subir `text.secondary` a `#616161`** en el theme (4.95:1, pasa AA) (#24).
13. **`loading="lazy" decoding="async"`** en los 3 `<img>` de Deliveries (#29).

## 5. Cambios estructurales

- **`ResponsiveDataView`** y migración de las 5–6 tablas de campo (#4/#8) — el cambio de mayor impacto UX del informe.
- **`ResponsiveDialog`** y adopción incremental (#7).
- **Resiliencia de red completa**: `networkMode`/retry en QueryClient, `runtimeCaching` GET, error de red tipado en axios (#3) → luego cola offline de escrituras con idempotencia backend (#5).
- **Sistema de feedback único**: provider de snackbar global (el propio `Snackbar` de MUI con un context chico; no hace falta lib nueva) reemplazando las 23 implementaciones locales (#20).
- **Acciones de fila mobile**: dentro de la card de `ResponsiveDataView`, botones con texto; en tablas desktop, colapsar >3 acciones en `Menu` overflow (#12).
- **Navegación de campo**: evaluar `BottomNavigation` solo para los roles TRANSPORTE/CONDUCTOR/POST_VENTA (3–4 destinos), manteniendo el drawer para el resto (#19). Decisión de producto — validar con los usuarios antes de construir.
- **Migración a React Query de las escrituras de campo** (Logística/Taller/Garantías) — se alinea con la migración ya en curso (Etapa 6.4).
- **Quitar `@ts-nocheck` de las 3 páginas de Taller** (#25) — prerequisito para refactorizarlas con confianza.

## 6. Roadmap

**Criterio de priorización:** primero lo que **pierde datos o dinero** en el flujo de campo (P0/P1 de transporte y post-venta), después lo que hace las pantallas de campo **operables con una mano**, por último pulido y módulos de escritorio. Orden de módulos: transporte > post-venta > leads > ventas; `compras`/`admin` quedan explícitamente **fuera de alcance mobile** en este roadmap (usuarios desktop).

- **Fase 1 — "Que no pierda datos" (≈1 semana).** Todos los quick wins §4. Cierra: doble submits, cancelar sin confirmar, SW que recarga, teclados, ficha QR, perf barata.
- **Fase 2 — "Operable con una mano" (2–3 semanas).** `ResponsiveDataView` + migración de Incidencias, Reclamos, Garantías, Órdenes, RegistroVentas; `ResponsiveDialog` en los forms de esos módulos; snackbar global; server-side pagination donde hay `size:1000`; runtime caching + `networkMode`; specs Playwright mobile (ver §7).
- **Fase 3 — "Campo sin señal" (evaluar ROI antes).** Cola offline de confirmación de entrega y checklist (IndexedDB + reintento + idempotencia backend); `BottomNavigation` por rol; virtualización de listas largas; a11y sistemática (aria-labels, reduced-motion); alineación de versiones MUI (v7 full) como tarea propia.

## 7. Plan de validación

- **Viewports**: 360×800 (Android chico), 390×844 (iPhone 13/14), 430×932 (iPhone Pro Max), 768×1024 (tablet). Chrome DevTools device mode + throttling **3G rápido + CPU 4×**.
- **Lighthouse mobile** sobre `/` (login → dashboard), `/logistica/distribucion/entregas-productos` y `/public/equipos/:n/ficha`. Baseline antes de Fase 1 y medición después de #15 (esperado: −40/50 KB gz en first paint). Objetivos realistas con el piso de vendor documentado en `AUDITORIA_TECNICA.md` (FRONT-001): LCP < 4s en 3G en visita cacheada por SW.
- **axe DevTools** en las 5 pantallas de campo migradas + verificación manual de contraste tras #24, y escalado de fuente del SO al 200% (el theme no fija px en html — debería aguantar; validar tablas).
- **Prueba de red**: DevTools → Offline a mitad de (a) confirmar entrega con 2 fotos, (b) checklist pre-viaje, (c) crear incidencia. Criterio: nunca pantalla en blanco, nunca datos perdidos silenciosamente, banner offline visible.
- **Playwright mobile** — agregar projects al harness existente (`e2e/playwright.config.ts` hoy solo tiene `Desktop Chrome`):

```ts
// e2e/playwright.config.ts — nuevos projects
import { defineConfig, devices } from '@playwright/test';

projects: [
  // ...setup/auth/smoke/chromium existentes...
  {
    name: 'mobile-android',
    use: { ...devices['Pixel 5'] },
    dependencies: ['auth'],
    testMatch: /.*\.mobile\.spec\.ts/,
  },
  {
    name: 'mobile-ios',
    use: { ...devices['iPhone 13'] },
    dependencies: ['auth'],
    testMatch: /.*\.mobile\.spec\.ts/,
  },
],
```

  Specs mínimos (`*.mobile.spec.ts`, flujos de campo hoy sin cobertura E2E): confirmar entrega (happy path + doble-tap en Confirmar ⇒ un solo POST, interceptando con `page.route`), checklist pre-viaje completo, crear incidencia de vehículo, crear reclamo de garantía, abrir ficha pública QR sin auth. Aserciones transversales: sin overflow horizontal (`document.documentElement.scrollWidth <= innerWidth`) y acciones primarias visibles sin scroll-x.

---

## Apéndice — inventario cuantitativo (base de la evidencia)

| Métrica | Valor |
|---|---|
| `.tsx` totales / con `useMediaQuery` | 432 / 46 (10,6%) — `src/pages/` entero: 0 |
| Tablas MUI `<Table>` / `DataGrid` | 134 archivos / 3 (solo Fabricación, ~19 col en `EquiposList`) |
| `columnVisibilityModel` / virtualización | 1 archivo (`LeadsTablePage`) / 0 usos de `@tanstack/react-virtual` en tablas* |
| `<Dialog>` / con `fullScreen` / `SwipeableDrawer` | 173 archivos / 31 / 11 (todos Logística) |
| `size="small"` / `IconButton` / `Tooltip` / `aria-label` | 2000 (273 arch.) / 422 (157 arch.) / 358 (123 arch.) / 63 (32 arch.) |
| `inputMode` / `type="tel"` / `autoComplete` | 9 / **0** / 3 |
| Snackbars locales / toast global / FAB | 23 archivos, 4 `anchorOrigin` distintos / no existe / 3 |
| QueryClient | `main.tsx:9` — retry 1, staleTime 5min, sin `networkMode` |
| Offline / `navigator.onLine` / runtimeCaching API | 0 / 0 / 0 |
| First paint (dist real, gz) | vendor 435 KB + index 47 KB + sentry 38 KB ≈ **520 KB** |
| E2E mobile | 0 projects con devices mobile |

\* `useVirtualizer` sí se usa en `LeadsTablePage.tsx:286` (scroll infinito del listado de leads) — única instancia.

Islas de referencia (patrones a copiar, no reinventar): `ComunicacionesInicialesPage.tsx` (card-view + 44px + React Query server-side), `Deliveries/useResponsive.ts` + `ConfirmDeliveryDialog` (BottomSheet, `inputMode="numeric"`, `capture="environment"`), `PreViajeChecklistDialog.tsx` (fullScreen + guard `saving`), `LeadFormPage.tsx:87` (`savingRef`), `ColoresContext.tsx:59` (`useMemo` del value), `usePublicEquipo.ts:88-124` (errores 404/429/red diferenciados).
