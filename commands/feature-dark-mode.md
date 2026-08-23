# /feature — Modo claro/oscuro en toda la app (ripser_front)

## Rol

Actuás como **Senior Frontend Engineer + Design Systems Engineer**, especialista en MUI y en
theming con tokens. Sabés que el toggle es la parte trivial del trabajo y que el 90% del costo
está en los colores hardcodeados que hoy nadie ve porque el fondo siempre fue blanco.

## Objetivo — el reencuadre importa

El pedido es "modo oscuro/claro en toda la app". Implementado como un toggle que cambia
`palette.mode`, el resultado es una app rota: textos negros sobre fondos negros, cards blancas
flotando en pantallas oscuras y chips de estado ilegibles. **Ya está medido: 638 colores
hardcodeados en 85 archivos.**

El objetivo real es una **migración a tokens semánticos**, con el toggle como consecuencia:
que ningún componente decida un color literal, sino que pida un rol (`superficie`, `texto
secundario`, `estado peligroso`) y el theme resuelva el valor según el esquema activo.

Corolario que define la estrategia: **esto no se hace en un big-bang.** Se hace por lotes
deployables, con un mecanismo que impida que entren colores literales nuevos mientras dura la
migración.

## Contexto verificado — estado real del repo

| Pieza | Estado |
|---|---|
| Stack | React 19.1, TS 5.8, Vite 7, **`@mui/material` ^6.5 + `@mui/system` ^7.3.5** (majors mezclados), `@mui/x-data-grid` ^8.14, `@mui/x-date-pickers` ^8.6 |
| Theme | `src/theme/index.ts` — **un solo `createTheme` estático con `palette.mode: 'light'` hardcodeado**; augmentation de módulo con paleta custom `tertiary`; overrides de `MuiButton/Card/Paper/TextField/AppBar` con `boxShadow: rgba(0,0,0,…)` fijos |
| Montaje | `src/main.tsx` → `QueryClientProvider` → `App`; el `ThemeProvider`/`CssBaseline` vive en `src/App.tsx` |
| CSS global | `src/index.css` — `body { background-color: #f5f5f5 }` fijo, colores de `<a>` heredados de la plantilla Vite (`#646cff`/`#535bf2`), bloque `prefers-reduced-motion` ya presente |
| HTML | `index.html` — `<meta name="theme-color" content="#1976d2">` **fijo**, PWA con `vite-plugin-pwa` |
| Superficie a migrar | **638 ocurrencias de hex en 85 `.tsx`** (`components/` + `pages/`), **34 archivos con `rgba()`**, **50 archivos con `'white'`/`'black'`** literales |
| Trabajo mobile reciente | `ResponsiveDataView` (tabla desktop / cards mobile), `ResponsiveDialog`, `ToastProvider`, `FieldBottomNav` con safe-area, `OfflineBanner` — **todo eso hay que verificarlo en dark** |
| Accesibilidad ya ganada | `text.secondary: #616161` se eligió para pasar AA sobre `#f5f5f5` con sol directo. **Ese trabajo hay que repetirlo para el esquema oscuro, no heredarlo** |
| Testing | Vitest + Testing Library; Playwright con projects `mobile-android` (Pixel 5) y `mobile-ios` (iPhone 13) |

## Decisión de arquitectura obligatoria (resolvela antes de escribir componentes)

Compará y **recomendá una**, verificando la API contra la versión instalada
(`node_modules/@mui/material/package.json` y sus tipos) — **no asumas la API por memoria**:

- **(a) CSS theme variables de MUI** (`colorSchemes` light/dark + variables CSS + atributo en
  `<html>`). Ventajas: evita el flash de tema incorrecto al cargar, un solo theme, cambio sin
  re-render del árbol, y las variables quedan disponibles para CSS plano y para librerías
  externas. Riesgos a verificar: soporte real en `@mui/material` **v6** (no v5), interacción con
  `@mui/system` v7 y con `@mui/x-data-grid` v8, y el script de inicialización que hay que
  inyectar antes del primer paint.
- **(b) Dos `createTheme` (light/dark) + estado en un `ThemeContext`.** Más simple y explícito,
  compatible con todo; el costo es re-render completo al cambiar y **flash de tema incorrecto**
  en el arranque si no se resuelve la preferencia antes del render.
- **(c) Híbrido**: variables CSS propias en `:root` para lo que no pasa por MUI (CSS plano,
  Recharts, jsPDF) + una de las anteriores para los componentes MUI.

Justificá con: riesgo de la mezcla de majors, esfuerzo de migración, y qué pasa con el flash
inicial en 3G — el personal de campo abre la app en condiciones malas y un flash blanco a la
noche es exactamente lo que el feature viene a evitar.

## Fase 0 — Inventario y taxonomía de color (entregable previo, sin migrar nada)

1. **Clasificá las 638 ocurrencias** en categorías, con conteo y archivos de ejemplo:
   - color de marca ya presente en la paleta (reemplazo directo por token);
   - **estado semántico** (chips y badges de PENDIENTE / ENTREGADO / ANULADO / VENCIDO / etc.) —
     probablemente el grupo más grande y el que necesita tokens nuevos;
   - superficies y bordes (`#fff`, `#f5f5f5`, grises);
   - sombras `rgba(0,0,0,…)` — en dark las sombras casi no se ven: se reemplazan por borde o
     elevación por color de superficie;
   - decorativos y one-offs.
2. **Proponé la taxonomía de tokens semánticos**: nombre, rol, valor en claro, valor en oscuro,
   y contraste medido contra su fondo. Regla: **un token nombra su función, no su color**
   (`estado.entregado`, no `verde`).
3. Marcá los **casos que NO deben cambiar con el tema**: logos, exportaciones, y todo lo que
   se imprime.

Frená acá y esperá mi aprobación antes de tocar componentes.

## Riesgos a resolver explícitamente

1. **Flash de tema incorrecto (FOUC).** Resolver la preferencia (localStorage → `prefers-color-scheme`
   → default) **antes del primer paint**, no en un `useEffect`. Definí exactamente dónde se
   inyecta y cómo convive con el service worker en modo `prompt` y con la PWA.
2. **`theme-color` y manifest de la PWA.** Hoy `#1976d2` está fijo en `index.html`. Hay que
   actualizarlo al cambiar de esquema (barra del navegador y splash de la PWA instalada), y
   revisar `background_color`/`theme_color` del manifest generado por `vite-plugin-pwa`.
3. **`@mui/x-data-grid` v8.** Es el componente más presente en el ERP. Verificá que herede el
   esquema y qué overrides propios hacen falta (bordes, filas alternadas, header, checkbox,
   toolbar). Chequealo también dentro de `ResponsiveDataView`, que en mobile renderiza cards.
4. **Recharts no conoce el theme de MUI.** Ejes, grillas, tooltips y series se pasan por props:
   definí cómo consumen los tokens y garantizá contraste de las series en ambos esquemas
   (incluida la distinguibilidad para daltonismo, que en fondo oscuro cambia).
5. **🔴 Exportaciones e impresión.** `jspdf`/`jspdf-autotable`, `exceljs` y `docx` generan
   documentos que **siempre deben salir en claro**, y el `@media print` también. Si alguien
   exporta un remito con fondo negro, es un bug de cara al cliente. Auditá si algún export toma
   colores del theme en runtime.
6. **Contraste AA en oscuro, medido — no heredado.** El equivalente de `text.secondary` en dark
   necesita su propio cálculo contra el fondo oscuro. **Y un dato de contexto que puede cambiar el
   default**: bajo sol directo el modo oscuro es *menos* legible que el claro. El caso de uso real
   del dark es depósito, turno noche y manejo nocturno. Recomendá el default en consecuencia
   (probablemente `system`) y decí por qué.
7. **Persistencia y alcance de la preferencia.** ¿Sólo `localStorage` (por dispositivo) o también
   por usuario en el backend? Un operario que usa dos dispositivos, y el multi-empresa: al cambiar
   de empresa, ¿se conserva? Recomendá lo más simple que sirva — probablemente localStorage — y
   dejá el guardado server-side como opción futura, sin implementarlo por las dudas.
8. **Elementos ya migrados a mobile.** `FieldBottomNav` (con safe-area), `OfflineBanner`,
   `ToastProvider`, `ResponsiveDialog` en `fullScreen`, skeletons de loading y estados vacíos:
   todos necesitan verificación explícita en oscuro. Que funcionen en claro no dice nada.
9. **Overrides con `rgba(0,0,0,…)` en `theme/index.ts`.** Las sombras de `MuiCard`/`MuiPaper`/
   `MuiAppBar` son invisibles sobre fondo oscuro: la jerarquía visual se pierde. Definí la
   estrategia de elevación para dark (superficies más claras a mayor elevación, o bordes).
10. **`index.css` y la plantilla Vite.** `body { background-color: #f5f5f5 }` pisa el theme, y los
    colores de `<a>` (`#646cff`/`#535bf2`) son restos de la plantilla. Limpiar y pasar a variables.
11. **Anti-drift.** Mientras dure la migración van a entrar features nuevos. Proponé el mecanismo
    que impida colores literales nuevos: regla ESLint (el repo ya usa `eslint.config.js` flat con
    `typescript-eslint`) que prohíba hex en `sx`/`styled`, con allowlist para los casos legítimos
    del punto 3 de la Fase 0. Sin esto, la migración nunca termina.
12. **Mezcla de majors de MUI.** `@mui/material` v6 con `@mui/system` v7 y `@mui/x-*` v8 es un
    riesgo específico para el camino de variables CSS. Verificá qué versión de `@mui/system`
    resuelve realmente el bundle y si conviene alinear versiones **antes** de empezar.

## Plan de migración exigido

- **Lote 0**: infraestructura (theme dual, provider, toggle, persistencia, anti-FOUC, regla
  ESLint en modo `warn`) — sin migrar componentes. Deployable: en claro nada cambia.
- **Lotes 1..N por módulo**, priorizando: componentes compartidos y layout → módulos de campo
  (`transporte`, `post-venta`) → resto. Un lote = un commit = un módulo.
- **Lote final**: regla ESLint a `error` + limpieza de allowlist.
- Cada lote deja la app **funcionando en claro exactamente igual que antes**. Un regression
  visual en claro es un bug bloqueante, no un efecto colateral aceptable.

## Verificación

- `tsc -b` y `npm run build` limpios; comparar el tamaño de bundle antes/después.
- Playwright: agregar cobertura en oscuro para los flujos de campo ya cubiertos, reutilizando los
  projects `mobile-android` / `mobile-ios` existentes. Decidí si con un project nuevo o con un
  fixture que setee la preferencia.
- Contraste: verificar los tokens contra WCAG AA (4.5:1 texto normal, 3:1 texto grande y
  elementos de UI) en **ambos** esquemas, con los valores calculados en la tabla de tokens.
- Checklist manual: login, dashboard, un listado con `DataGrid`, un formulario largo, un diálogo
  `fullScreen` en mobile, un gráfico de Recharts, un PDF exportado y una vista de impresión.

## Formato de salida

1. **Inventario y taxonomía** (Fase 0) con números y tabla de tokens (rol · claro · oscuro · contraste).
2. **Decisión de arquitectura**: las 3 opciones comparadas, la recomendada y por qué, con la API
   verificada contra la versión instalada.
3. **Resolución de los 12 riesgos**, uno por uno, con la decisión y su fundamento.
4. **Plan de lotes** con criterio de *Done* y verificación por lote.
5. **Implementación del Lote 0 completa** (TypeScript real, componentes funcionales con hooks,
   tipado estricto, sin pseudocódigo) — **sólo después de que apruebe los puntos 1–4**.

## Restricciones

- **No inventar APIs de MUI.** Verificá `colorSchemes`, `cssVariables`, el provider y el script de
  inicialización contra los tipos instalados en `node_modules`. Si algo no existe en v6, decilo
  y proponé la alternativa real.
- Preservar la augmentation de módulo de la paleta `tertiary` y todo contrato de tipos existente.
- No introducir dependencias nuevas para esto.
- Código, nombres y comentarios técnicos en inglés; explicaciones en español.
- Si falta información para decidir (default preferido, si la preferencia debe persistir por
  usuario), **preguntá antes de asumir**.
