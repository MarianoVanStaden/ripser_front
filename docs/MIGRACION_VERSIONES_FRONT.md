# Migración de versiones — ripser_front

**Snapshot: 10-sep-2026.** Versiones "latest" verificadas contra registry.npmjs.org y changelogs oficiales en esa fecha; usos en el repo verificados por grep (números citados abajo). Formato hermano de `ripser_back/docs/MIGRACION_BOOT4_JAVA25.md`: releases chicos (R0→R4), cada uno deployable y reversible por separado.

## Estado actual

- `package.json` usa rangos `^`, así que lo **instalado real ya está arriba del floor** en varios casos (react 19.2.5, vite 7.3.2, react-router-dom 7.14.2, eslint 9.39.4, x-data-grid 8.28.2). Los saltos de abajo se miden contra lo instalado.
- Node: `engines >=24`, CI (`ci.yml`) y deploy (`deploy.yml`) fijan Node 24 — **alineados**. Node 24 es Active LTS hasta el 20-oct-2026; Node 26 entra en Active LTS el 28-oct-2026.
- Typecheck de referencia: `tsc -b` (el `--noEmit` en raíz es falso verde — ver memory `project_front_typecheck_tsc_b`).

## Tabla de versiones

Clasificación: ✅ actual · 🔼 minor/patch (riesgo ~0) · 🟠 major con breaking changes · ☠️ muerta o reemplazable.

### Runtime / dependencies

| Paquete | Instalado | Latest (10-sep-2026) | Salto | Riesgo |
|---|---|---|---|---|
| react / react-dom | 19.2.5 | 19.3.0 | 🔼 | No existe React 20 |
| @mui/material / icons | 6.5.0 | **9.4.0** (no existe 8.x; 6→7→9) | 🟠🟠 | El plato fuerte — ver "Caso MUI" |
| @mui/system | 7.3.10 | 9.4.0 | 🟠 | Dep directa **innecesaria** (0 imports en src/) — eliminar y dejar que material arrastre la suya |
| @mui/lab | 6.0.1-beta.36 | `latest-v7` = 7.0.1-beta.25 / v9 = 9.0.0-beta.9 | 🟠 | 1 solo consumidor (`EquipoDetail.tsx`, Timeline*). La 6.x NO es compatible con material 7/9 |
| @mui/x-data-grid | 8.28.2 | 9.13.0 | 🟠 (liviano) | v9 acepta material `^7.3.0 \|\| ^9` → se puede subir junto con material 7 |
| @mui/x-date-pickers | 8.28.3 | 9.13.0 | 🟠 (liviano) | Ídem; `PickersDay`→`PickerDay` no nos pega (0 usos) |
| @emotion/react / styled | 11.14.x | 11.14.x | ✅ | material 9 lo sigue soportando como peer — no migrar a Pigment |
| @tanstack/react-query | 5.100.5 | 5.102.8 | 🔼 | No existe v6 |
| @tanstack/react-virtual | 3.13.24 | 3.14.11 | 🔼 | |
| react-router-dom | 7.14.2 | 7.18.3 (fin de línea) | 🔼 hoy / 🟠 después | Existe **react-router v8** (8.3.1): el paquete `react-router-dom` desaparece, ESM-only, Node 22.22+, React 19.2.7+, Vite 7+. Codemod oficial |
| axios | 1.15.2 | 1.20.0 | 🔼 | No existe axios 2 |
| dayjs | 1.11.13 | 1.11.23 | 🔼 | |
| react-hook-form | 7.73.1 | 7.87.0 | 🔼 | v8 aún en beta |
| yup / @hookform/resolvers | 1.7.1 / 5.2.2 | 1.7.1 / 5.9.1 | ✅ / 🔼 | |
| @sentry/react | 10.51.0 | 10.74.0 | 🔼 | v11 aún en beta |
| recharts | 3.8.1 | 3.10.1 | 🔼 | Activo |
| @dnd-kit/* | core 6.3.1 / sortable 10.0.0 | = | ✅⚠️ | Sin releases desde dic-2024 (~21 meses). Funciona; vigilar, no reemplazar (non-goal) |
| @microsoft/fetch-event-source | 2.0.1 | 2.0.1 | ☠️⚠️ | Última release **abr-2021**. Funciona para el SSE actual; candidata a inline/vendorear si algún día rompe |
| docx | 9.6.1 | 9.7.1 | 🔼 | |
| exceljs | 4.4.0 | 4.4.0 | ✅⚠️ | Sin releases desde oct-2023; estable, sin reemplazo forzado |
| jspdf / jspdf-autotable | 4.2.1 / 5.0.2 | 4.2.1 / 5.0.8 | ✅ / 🔼 | |
| qrcode.react | 4.2.0 | 4.2.0 | ✅ | |
| react-mui-sidebar | 1.6.3 | 1.6.10 | ☠️ | **0 imports en src/** — dep muerta, eliminar (queda solo mencionada en un comentario histórico de vite.config) |

### devDependencies / tooling

| Paquete | Instalado | Latest | Salto | Riesgo |
|---|---|---|---|---|
| typescript | 5.8.3 | 7.0.2 (tsgo nativo); último 5.x = 5.9.3; 6.0 = puente | 🟠🟠 | **Tope práctico hoy: 6.0.x** — typescript-eslint 8.70 soporta TS `<6.1`, no TS 7 |
| vite | 7.3.2 | **8.3.0** (Rolldown) | 🟠 | Nuestro `vite.config.ts` usa `rollupOptions.manualChunks` (función → OK), `esbuild.pure` (→ migrar a `oxc`), interop CJS más estricto (los comentarios del chunking ya documentan casos de interop) |
| @vitejs/plugin-react | 4.5.2 | 6.1.1 (peer vite ^8; Babel→Oxc) | 🟠🟠 | No usamos `react({babel})` → impacto bajo |
| vite-plugin-pwa | 1.3.0 | 1.3.0 | ✅ | Peer ya incluye `^8.0.0` → compatible Vite 8 sin cambios |
| vitest / @vitest/coverage-v8 | 4.1.5 | **5.0.0** | 🟠 | `clearMocks` pasa a default `true` — puede romper tests que acumulan calls; config lookup ya no sube por ancestros |
| jsdom | 29.0.0 | 30.0.1 | 🟠 (liviano) | Node ≥22.22; no se puede reasignar `window.location` |
| @playwright/test | 1.59.1 | 1.63.0 | 🔼 | |
| eslint / @eslint/js | 9.39.4 | **10.10.0 / 10.0.1** | 🟠 (liviano) | Ya estamos en flat config → impacto bajo; codemod `@eslint/v9-to-v10` |
| typescript-eslint | 8.34.1→8.70.0 | 8.70.0 | 🔼 | Soporta ESLint 10 y TS 6.0 |
| eslint-plugin-react-hooks | 5.2.0 | 7.1.1 | 🟠 (liviano) | v6 flat default, v7 ESLint 10; reglas nuevas del React Compiler pueden sumar warnings |
| eslint-plugin-react-refresh | 0.4.20 | 0.5.6 | 🔼 | |
| globals | 16.2.0 | 17.12.0 | 🔼 | Paquete de datos |
| @types/node | 25.5.0 | línea 26.5.1 (el dist-tag `latest` apunta a 22 LTS) | 🔼 | Subir a 26.x junto con Node 26 |
| @types/react / react-dom | 19.1.x | 19.3.0 | 🔼 | |
| @testing-library/react / user-event | 16.3.2 / 14.6.1 | 16.3.3 / 14.6.7 | 🔼 | |
| @testing-library/jest-dom | 6.9.1 | 7.0.1 | 🟠 (liviano) | `@testing-library/dom` pasa a peer requerida |
| @faker-js/faker | 10.4.0 | 10.6.0 | 🔼 | |
| dotenv | 17.3.1 | 17.4.2 | 🔼 | Solo lo usa `e2e/playwright.config.ts` |
| @types/jspdf | 1.3.3 | — | ☠️ | **Deprecado en npm** ("stub — jspdf provides its own types"). Eliminar |
| @types/react-router-dom | 5.3.3 | — | ☠️ | Tipa la API v5; RR7 trae types propios. Eliminar |

## Caso MUI — estrategia

Situación: material/icons **6.5** + system **7.3** + x-* **8.28** + lab **6-beta** conviviendo. No existe material 8: el camino es 6 → 7.3.11 → 9.4.

**Decisión: parar en material 7.3.11 (R1) y dejar material 9 como release propio y opcional (R4).** Razones, con números del repo:

- El costo de 6→7 es **Grid**: 1.219 usos de `<Grid item xs=…>` legacy en **118 archivos**, conviviendo con 28 archivos ya en `Grid2`. En v7, `Grid2` pasa a llamarse `Grid` y el viejo queda como `GridLegacy`. Hay codemod oficial; el uso mixto actual se unifica solo con esta migración.
- El costo de 7→9 es otro y mayor: **eliminan `InputProps`/`inputProps`/`InputLabelProps`/`SelectProps` de TextField** → en este ERP son **~490 usos** (164+189+134+2) a migrar a `slotProps.input/htmlInput/inputLabel/select`. Eso es un release entero en sí mismo, no un anexo.
- Lo que NO nos pega (verificado 0 usos): `componentsProps`, `onBackdropClick`, `Hidden`, deep imports de 3 niveles, `Grid direction="column"`, `theme.palette.mode` condicional (el dark mode ya usa `cssVariables`/`theme.vars`/`applyStyles` en `src/theme/index.ts` — la inversión de `project_dark_mode_tokens_semanticos` deja v7 casi gratis en theming). Sí hay ~7 usos de iconos `*Outline` legacy a revisar para v9.
- **x-data-grid/x-date-pickers 9 aceptan material `^7.3.0`** → se suben en R1 junto con material 7, no hay que esperar a material 9. En pickers v9 lo único que nos toca es el shape `slotProps.textField.*` (39 objetos `textField:{…}`) y ya no existe `PickersDay` viejo (0 usos acá).
- `@mui/system` como dep directa se **elimina** (0 imports); material arrastra la versión correcta y muere el drift 6/7.
- `@mui/lab`: subir a `@mui/lab@latest-v7` en R1 (la 6-beta es incompatible con material 7). Un solo archivo la usa (Timeline en `EquipoDetail.tsx`); si la beta v7/v9 diera problemas, plan B barato: reimplementar ese timeline con Stack/Box y eliminar lab (también simplifica el chunk `vendor-mui-lab`).
- `react-mui-sidebar`: eliminar en R0 (0 imports; además sin peerDeps declarados de MUI — riesgo puro).
- Emotion se queda: material 9 lo sigue soportando como peer; migrar a Pigment CSS es non-goal.

## Plan por releases

Cada release = una rama, un deploy, una señal de rollback. Gates comunes: `npm run typecheck` + `tsc -b`, `npm test` (vitest), `npm run build`, smoke Playwright (`test:e2e`), y comparación de tamaño de bundle (los chunks manuales de `vite.config.ts` son sensibles).

### R0 — Limpieza + bumps sin fricción (½ día)

- Eliminar: `react-mui-sidebar`, `@types/jspdf`, `@types/react-router-dom`, `@mui/system` (dep directa).
- Bumps minor/patch: react 19.3, @types/react*, react-query, react-virtual, react-router-dom 7.18, axios, dayjs, RHF, resolvers, sentry, recharts, docx, jspdf-autotable, playwright, testing-library (react/user-event), faker, dotenv, typescript-eslint 8.70, eslint-plugin-react-refresh, TS **5.9.3**.
- Riesgo: ~0. Rollback: revert del commit.

### R1 — MUI 7 + MUI X 9 (el grueso; 3-5 días)

- `@mui/material`+`icons` → 7.3.11 · `@mui/lab` → `latest-v7` · `x-data-grid`/`x-date-pickers` → 9.13.
- Correr codemods oficiales v7 (Grid renombre + `size={{}}`); migrar los 28 archivos `Grid2` (renombre de import) y los 118 archivos de Grid legacy. Es mecánico pero masivo: revisar visualmente los layouts densos (SueldoFormDialog 42 usos, EmpleadosPage 84, AuditoriaPage 31…).
- Pickers v9: ajustar los 39 `slotProps.textField.{…}` que usen `InputProps/InputLabelProps` internos; verificar CSS que targetee `.MuiDataGrid-virtualScroller*` (DOM interno cambió).
- Verificar `vite.config.ts`: regex de `test.server.deps.inline` para x-date-pickers y nombres de chunks `vendor-mui-*` siguen matcheando las rutas nuevas.
- Gate extra: recorrida visual módulo por módulo en dev + smoke e2e. Señal de rollback: errores de layout/hydration en Sentry tras deploy.

### R2 — Tooling: Vite 8 + Vitest 5 + ESLint 10 (1-2 días)

- `vite` 8.3 + `@vitejs/plugin-react` 6 + `vite-plugin-pwa` (sin cambio) · `vitest`/`coverage-v8` 5 · `jsdom` 30 · `eslint`/`@eslint/js` 10 + `eslint-plugin-react-hooks` 7 + `globals` 17 · `@testing-library/jest-dom` 7 (+ `@testing-library/dom` como dep explícita).
- `vite.config.ts`: `build.rollupOptions` → `rolldownOptions` (nuestro `manualChunks` es función → soportado), `esbuild.pure` → equivalente `oxc`. **Vigilar el interop CJS de Rolldown**: los comentarios del chunking documentan errores pasados de interop (`createContext` undefined, TDZ) — probar `legacy.inconsistentCjsInterop` solo como escape temporal. Paso previo recomendado: probar `rolldown-vite` sobre Vite 7 en una rama.
- Vitest 5: `clearMocks` default `true` — auditar tests que asserten calls acumuladas entre tests.
- Gate extra: build de prod + **verificación PWA** (precache del SW, `navigateFallbackDenylist` de `/api/`, ReloadPrompt) y diff de tamaño/nombres de chunks. Señal de rollback: SW sirviendo stale o bundle roto en `/ripser/`.

### R3 — TS 6.0 + Node 26 + react-router 8 (1-2 días; ventana: post 28-oct-2026)

- TypeScript → **6.0.x** (tope por typescript-eslint; `strict` default ya lo cumplimos, revisar defaults de `module`/`target` en los 3 tsconfig del build `tsc -b`). TS 7 (tsgo) queda PEND hasta que typescript-eslint soporte ≥6.1.
- Node **26** (Active LTS desde 28-oct-2026): `engines`, `ci.yml` (4 jobs), `deploy.yml`, `@types/node` 26.x. Coordinar con el VPS.
- `react-router-dom` → `react-router` 8 (codemod oficial; ESM-only; middleware default). Requiere React 19.2.7+ (cumplido tras R0) y Vite 7+ (cumplido).
- Señal de rollback: fallos de routing bajo `/ripser/` (basename) o del proxy dev.

### R4 — MUI material 9 (opcional/planificable; 4-6 días)

- material/icons 7.3.11 → 9.4; lab → 9.0.0-beta.x. x-* ya está en 9 desde R1.
- El grueso: **~490 props de TextField** (`InputProps`/`inputProps`/`InputLabelProps`/`SelectProps` → `slotProps.*`) repartidas por todos los forms del ERP + props legacy de Dialog/Drawer/Menu (`PaperProps`, `TransitionProps`…) + ~7 iconos `*Outline`→`*Outlined` + system props directas (`mt=` en Box/Typography) → `sx`. Codemods cubren la mayoría; el riesgo es el volumen de forms de dinero (cheques, sueldos, cajas) — recorrida manual por módulo.
- Cambios de comportamiento a smoke-testear: TablePagination con `Intl.NumberFormat`, Stepper `<ol>/<li>` (snapshots), Slider pointer events.
- Solo encararlo cuando 7.3 deje de recibir fixes o algo lo fuerce — no hay urgencia funcional.

## Riesgos transversales

- **Deploy front no gateado por CI** (memoria `project_cicd_pipeline_optimizado`): para R1/R2/R4 conviene deployar en horario de baja carga y tener a mano `deploy/scripts/03-rollback.sh`.
- Los thresholds de coverage son candado anti-regresión (suben, no bajan) — Vitest 5 con `reportOnFailure` debe seguir emitiendo el reporte.
- SSE (`@microsoft/fetch-event-source`, abandonada 2021): no tocarla en estos releases; si Vite 8/Rolldown la rompe por interop, vendorear el archivo (es chico).

## Orden recomendado y esfuerzo total

R0 (½d) → R1 (3-5d) → R2 (1-2d) → R3 (1-2d, después del 28-oct-2026) → R4 (4-6d, opcional). Entre releases: al menos una semana de prod estable antes del siguiente.
