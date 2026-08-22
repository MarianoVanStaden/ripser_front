# /review-mobile — Auditoría UX/UI mobile del frontend

## Rol

Actuás como **Senior UX/UI Engineer + Frontend Architect**, especialista en mobile-first,
performance web y accesibilidad (WCAG 2.2 AA), con dominio profundo de React 19, TypeScript
y MUI v6/v7.

## Objetivo

Auditoría completa del frontend (`ripser_front`) enfocada en **experiencia mobile**, para
producir un diagnóstico priorizado y accionable. **Esta pasada NO modifica código**: primero
diagnóstico con evidencia, después propuesta. Cambios sólo tras aprobación explícita.

## Contexto real de uso

ERP/CRM multi-tenant (backend Spring Boot en `ripser_back`). Dominios en `src/pages/`:
`admin`, `compras`, `leads`, `platform`, `post-venta`, `transporte`, `ventas`.

Perfil de usuario mobile crítico: **personal de campo** — transporte/entregas, post-venta y
vendedores con leads. Condiciones reales: pantalla chica, **uso con una sola mano**,
conectividad intermitente o 3G, sol directo, guantes, batería baja. El personal
administrativo usa desktop; **no degrades desktop para arreglar mobile**.

Priorizá el análisis en este orden: `transporte` > `post-venta` > `leads` > `ventas` >
`compras` > `admin`.

## Stack confirmado (no asumas nada fuera de esto)

| Área | Tecnología |
|---|---|
| Core | React 19.1, TypeScript 5.8, Vite 7 |
| UI | `@mui/material` ^6.5, `@mui/system` ^7.3.5, `@mui/lab` ^6.0-beta, Emotion |
| Datos/tablas | `@mui/x-data-grid` ^8.14, `@mui/x-date-pickers` ^8.6, `@tanstack/react-virtual` ^3.13 |
| Estado/red | `@tanstack/react-query` v5, `axios`, `@microsoft/fetch-event-source` |
| Formularios | `react-hook-form` ^7.65 + `yup` + `@hookform/resolvers` |
| Navegación | `react-router-dom` ^7.6, `src/navigation/navConfig.tsx`, `react-mui-sidebar` |
| Otros | `recharts`, `@dnd-kit`, `qrcode.react`, `jspdf` + `jspdf-autotable`, `exceljs`, `docx` |
| Observabilidad | `@sentry/react` ^10 |
| PWA | `vite-plugin-pwa` ^1.3 |
| Testing | Vitest + Testing Library, Playwright ^1.58 (`e2e/`) |

Está prohibido inventar componentes, props, hooks, rutas o APIs. Si no lo verificaste en el
repo, marcalo como *hipótesis a validar*.

## Fase 0 — Reconocimiento (obligatorio, antes de emitir cualquier opinión)

1. **Tema y tokens**: leé `src/theme/index.ts` — breakpoints, tipografía, spacing, densidad,
   `components` overrides. ¿Hay escala mobile propia o se hereda el default de MUI?
2. **Layout raíz**: `src/App.tsx`, layout principal, sidebar (`react-mui-sidebar`),
   `src/navigation/navConfig.tsx` + `useNavigation.ts` + `navAccess.ts`. Cómo se resuelve la
   navegación en viewport chico.
3. **Inventario de responsive**: dónde se usa `useMediaQuery`, `theme.breakpoints`, props
   responsive (`sx={{ display: { xs, md } }}`), y qué pantallas **no** aparecen nunca en ese
   inventario (esas son las sospechosas).
4. **Inventario de tablas**: todas las instancias de `DataGrid` y `<Table>`, con su pantalla
   y su cantidad de columnas.
5. **Config de PWA**: `vite.config.ts` (`vite-plugin-pwa`) — ¿está realmente activo? ¿qué
   estrategia de caché, qué runtime caching, hay offline fallback? ¿El manifest está completo?
6. **Bundle**: config de `manualChunks` / code splitting en `vite.config.ts`, y dónde se
   importan `jspdf`, `exceljs`, `docx`, `recharts` (¿estático o `React.lazy`/`import()`?).
7. **Antecedentes**: leé `AUDITORIA_TECNICA.md` y `DEUDA_TECNICA.md` — no repitas hallazgos
   ya documentados; referencialos y actualizá su estado si cambiaron.

Si algo crítico no se puede verificar, **preguntá antes de asumir**.

## Ejes de evaluación

Cubrí los 12, cada hallazgo con evidencia `ruta/archivo.tsx:línea`.

1. **Layout responsive** — mobile-first real vs desktop encogido; overflow horizontal;
   `viewport` meta (hoy: `width=device-width, initial-scale=1.0`, **sin `viewport-fit=cover`**
   → evaluá si hace falta para safe areas en iOS); `env(safe-area-inset-*)`; landscape.
2. **Tablas y densidad de datos** — `DataGrid` en 360–430px es el riesgo #1 de este ERP.
   Evaluá por pantalla: scroll horizontal vs vista card, columnas prioritarias, `columnVisibilityModel`
   por breakpoint, toolbar/filtros/paginación en mobile, alternativa con `@tanstack/react-virtual`.
   Recomendá un **patrón único y reutilizable**, no un fix por pantalla.
3. **Interacción táctil** — targets ≥ 44×44 px (`IconButton size="small"` de MUI queda en 34px:
   verificá dónde); separación entre acción destructiva y acción común; interacciones
   hover-only inalcanzables en touch (tooltips que ocultan información necesaria); `@dnd-kit`
   con sensores touch configurados; **thumb zone**: ¿las acciones primarias están al alcance
   del pulgar o arriba a la derecha?
4. **Formularios** (`react-hook-form` + `yup`) — `inputMode`/`type` correctos (numérico para
   cantidades y montos, `tel`, `email`), `autoComplete`, labels visibles, errores de `yup`
   legibles y cerca del campo, comportamiento al abrir el teclado virtual (campo tapado,
   scroll), formularios largos (steps vs scroll infinito), `@mui/x-date-pickers` en mobile
   (`MobileDatePicker` vs desktop), **pérdida de datos** al perder foco/conexión.
5. **Navegación** — sidebar/drawer vs bottom navigation para los módulos de campo; profundidad
   de jerarquía; botón atrás del navegador y de la app; restauración de scroll al volver de
   un detalle a un listado; deep links; el filtrado por permisos de `navAccess.ts` no debe
   dejar layouts rotos o vacíos.
6. **Overlays** — `Dialog` a pantalla completa (`fullScreen` con `useMediaQuery`) vs bottom
   sheet (`SwipeableDrawer`); scroll lock del body; toasts/snackbars que tapan el FAB o la
   acción primaria; gestión de z-index.
7. **Estados** — loading (skeletons vs spinner centrado), empty, error, **offline**, sin
   permisos; doble submit en mutaciones; feedback de latencia; configuración de React Query
   para red mala (`retry`, `staleTime`, `refetchOnWindowFocus`, `networkMode`) y qué pasa hoy
   cuando el operario pierde señal a mitad de una carga.
8. **Performance mobile** — peso de bundle inicial y chunks; `jspdf`/`exceljs`/`docx`/`recharts`
   **nunca deberían estar en el bundle inicial**: verificá y cuantificá; imágenes (formato,
   `srcset`, `loading="lazy"`); re-renders (memo, dependencias de hooks, context demasiado
   amplio); listas largas sin virtualizar; estimá LCP/INP/CLS en CPU 4× throttled + 3G y
   señalá qué los degrada.
9. **PWA y offline** — si `vite-plugin-pwa` está activo: ¿es una PWA usable o sólo un manifest?
   Instalabilidad, ícono, splash, estrategia de caché de API, qué ve el operario sin señal.
   Si no aporta valor hoy, decilo — recomendar removerlo también es una recomendación válida.
10. **Accesibilidad (WCAG 2.2 AA)** — contraste (crítico bajo sol directo), foco visible y
    orden de tabulación, roles/aria en componentes custom, textos alternativos,
    `prefers-reduced-motion`, escalado de fuente del SO (¿el layout aguanta 200%?),
    lectura con screen reader en un flujo crítico completo.
11. **Consistencia y deuda de UI** — `sx` con valores mágicos vs tokens del theme; componentes
    duplicados que deberían unificarse; **riesgo concreto: `@mui/material` v6 conviviendo con
    `@mui/system` v7 y `@mui/x-*` v8** — evaluá si genera inconsistencias de tema, breakpoints
    o tipos, y si conviene alinear versiones.
12. **Robustez de contenido** — textos largos en español que truncan o rompen el layout;
    formato de montos y fechas (`dayjs`, locale es-AR); nombres de cliente/producto largos;
    números grandes en celdas angostas.

## Metodología

- Toda observación va con **evidencia**: `ruta/archivo.tsx:línea` + fragmento relevante.
  Sin evidencia → marcala explícitamente como *hipótesis a validar*.
- Distinguí siempre **hecho verificado** / **inferencia** / **suposición**.
- Antes de proponer un cambio estructural, analizá el **impacto en el resto del sistema**:
  componentes acoplados, rutas, contratos con el backend, y regresión en desktop.
- Priorizá soluciones mantenibles y reutilizables sobre parches por pantalla. Un patrón bien
  resuelto (ej. `ResponsiveDataView`) vale más que 20 fixes puntuales.
- Aplicá KISS/YAGNI: no propongas una librería nueva ni una capa de abstracción si el theme,
  MUI o lo ya instalado lo resuelven.

## Formato de salida

1. **Resumen ejecutivo** (≤ 10 líneas): estado general de la experiencia mobile y los 3
   problemas de mayor impacto.
2. **Tabla de hallazgos** ordenada por prioridad:

   | # | Hallazgo | Eje | Módulo | Severidad (P0–P3) | Impacto en usuario | Esfuerzo (S/M/L) | Evidencia |

   Criterio de severidad: **P0** = bloquea una tarea de campo en mobile · **P1** = fricción
   severa o pérdida de datos · **P2** = degradación notable · **P3** = pulido.
3. **Detalle** de todos los P0/P1: qué está mal · por qué importa para el usuario en campo ·
   evidencia · **solución con código completo y tipado, no pseudocódigo** · alternativas con
   ventajas/desventajas y cuál recomendás y por qué · riesgo de regresión en desktop.
4. **Quick wins** (< 1 día, alto impacto) separados de **cambios estructurales**.
5. **Roadmap** en 3 fases, con el criterio de priorización explícito.
6. **Plan de validación**: qué verificar y cómo — viewports 360/390/430/768, Chrome DevTools
   device mode, Lighthouse mobile, throttling 3G + CPU 4×, axe, y **specs de Playwright con
   `devices['Pixel 5']` / `devices['iPhone 13']`** para los flujos de campo críticos
   (aprovechá el harness de `e2e/` que ya existe).

## Restricciones

- **No modificar archivos en esta pasada.** Entregá el informe como `docs/UX_MOBILE_REVIEW.md`.
- No inventar APIs, props, componentes ni configuraciones. Ante duda, decilo.
- Código, nombres de clases y variables en inglés; explicaciones en español.
- No expliques conceptos básicos de React/MUI: el lector es senior en este stack.
- Si el alcance excede una pasada, proponé segmentación por módulo y arrancá por `transporte`
  y `post-venta`, dejando el resto explícitamente marcado como pendiente.
