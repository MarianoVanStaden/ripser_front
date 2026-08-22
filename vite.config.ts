/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// Info de git inyectada en build-time (el browser no tiene acceso a git).
// Se evalúa al arrancar Vite; si cambiás de rama, reiniciá `npm run dev` para
// refrescarla. Con try/catch para no romper en entornos sin .git (CI/VPS).
function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}
const GIT_BRANCH = git('rev-parse --abbrev-ref HEAD')
const GIT_COMMIT = git('rev-parse --short HEAD')

// Exponerlas a la app como import.meta.env.VITE_* (Vite incrusta las VITE_* de
// process.env que existan al resolver la config). Fiable en dev y en build.
process.env.VITE_GIT_BRANCH = GIT_BRANCH
process.env.VITE_GIT_COMMIT = GIT_COMMIT

// Run `ANALYZE=1 npm run build` to open the bundle visualizer after a build.
// Requires `npm i -D rollup-plugin-visualizer`. Imported dynamically so the
// dep is optional.
const analyze = process.env.ANALYZE === '1'
const analyzePlugin = analyze
  // @ts-expect-error — optional dev dep. Install with `npm i -D rollup-plugin-visualizer`.
  ? (await import('rollup-plugin-visualizer')).visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    })
  : null

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': el SW nuevo espera a que el usuario acepte (ReloadPrompt).
      // Con 'autoUpdate' + skipWaiting un deploy recargaba la app sin aviso,
      // descartando formularios de campo a medio llenar.
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        lang: 'es',
        name: 'Ripser App',
        short_name: 'Ripser',
        description: 'Sistema ERP Ripser',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        theme_color: '#1976d2', // primary.main del theme MUI
        background_color: '#ffffff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        // El chunk `vendor` pesa ~1.8 MB raw — el límite default de precache
        // (2 MiB) lo dejaría afuera con warning. Margen para que entre.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // El SW nunca debe responder navegaciones/requests de la API con el
        // index.html cacheado.
        navigateFallbackDenylist: [/^\/api\//],
        // Cache runtime SOLO de GETs de la API (NetworkFirst): con señal se
        // usa la red; sin señal el operario ve los últimos datos en vez de
        // una pantalla de error. Las escrituras (POST/PUT/...) nunca se
        // cachean — este bloque no las toca.
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
    }),
    analyzePlugin,
  ].filter(Boolean),

  // FRONT-005: marcamos los console.log/info/debug como pure para que el
  // minifier los elimine del bundle de producción. console.warn/error se
  // preservan (Sentry los captura, son la "señal" útil en prod).
  esbuild: {
    pure: ['console.log', 'console.info', 'console.debug'],
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => `/RipserApp${path}`,
      },
    },
  },

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Two chunks are legitimately large:
    //   - `vendor-exceljs` (~900 KB raw) — only loads on "Export to Excel"
    //   - `vendor` (~1.8 MB raw / ~540 KB gzip) — consolidated core, see
    //     the comment in manualChunks(). Gzip size is what the user actually
    //     downloads, so the raw-byte warning is misleading here.
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
    // Vite añade `<link rel="modulepreload">` para todos los chunks alcanzables
    // desde el entry, incluso a través de dynamic imports. Para libs pesadas
    // que viven detrás de `React.lazy` esto contradice el code-split: el
    // browser termina descargando jspdf/exceljs/recharts en el primer paint
    // aunque la ruta actual no los necesite. Este filtro recorta esos
    // chunks de la HTML; quedan en disco y se piden cuando una ruta los
    // importa de verdad.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (d) =>
            !/(?:^|\/)(?:vendor-jspdf|vendor-exceljs|vendor-html2canvas|vendor-recharts|vendor-mui-datagrid|vendor-mui-pickers|vendor-mui-icons|vendor-mui-lab|vendor-sentry|vendor-rhf|vendor-yup)-/.test(
              d,
            ),
        ),
    },
    rollupOptions: {
      output: {
        // Chunking philosophy (after debugging cross-chunk runtime errors):
        //
        // Only split libs that are BOTH heavy AND route-conditional. Do NOT
        // split react/react-dom or any "eager core" — Rollup's CJS↔ESM interop
        // breaks across chunks for libs that use `import React from 'react'`
        // (seen in `react-mui-sidebar` and similar non-ESM deps), producing
        // "Cannot read properties of undefined (reading 'createContext')" at
        // runtime. Likewise, never split @mui internals from @mui/material —
        // their circular deps cause TDZ errors ("Cannot access X before
        // initialization").
        //
        // Rule of thumb: when in doubt, let it fall into `vendor`. Splitting
        // is an optimization, not a default.
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Route-conditional heavy libs — check first so they don't get
          // swept into a broader rule below.
          if (id.includes('/@mui/icons-material/')) return 'vendor-mui-icons'
          if (id.includes('/@mui/x-data-grid'))     return 'vendor-mui-datagrid'
          if (id.includes('/@mui/x-date-pickers'))  return 'vendor-mui-pickers'
          // @mui/lab solo lo usa EquipoDetail.tsx (lazy). Lo sacamos del
          // vendor eager — la ruta paga el chunk on-demand cuando entra.
          if (id.includes('/@mui/lab/'))            return 'vendor-mui-lab'
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-recharts'
          if (id.includes('/exceljs/')) return 'vendor-exceljs'
          if (id.includes('/jspdf'))    return 'vendor-jspdf'
          // html2canvas solo se usa al exportar PDFs con gráficos; sin esta
          // regla caía al `vendor` eager (~200 KB raw en el first paint).
          if (id.includes('/html2canvas/')) return 'vendor-html2canvas'

          // Pure-ESM utility libs sin interop con React — seguros de
          // splittear. La meta es bajar el tamaño del chunk `vendor` que
          // se descarga eager en el primer paint.
          if (id.includes('/@sentry/'))    return 'vendor-sentry'
          if (
            id.includes('/yup/') ||
            id.includes('/property-expr/') ||
            id.includes('/tiny-case/') ||
            id.includes('/toposort/')
          ) return 'vendor-yup'
          if (id.includes('/@tanstack/'))  return 'vendor-query'
          if (
            id.includes('/react-hook-form/') ||
            id.includes('/@hookform/')
          ) return 'vendor-rhf'

          // Everything else (react, react-dom, react-router, @mui/material
          // + internals, @emotion, dayjs, axios, …) → one `vendor` chunk.
          return 'vendor'
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    // Pin TZ: la app es America/Argentina/Buenos_Aires (UTC-3). Sin esto, los
    // tests de fecha pasan/fallan según la TZ del runner (dev vs CI) — una bomba
    // de tiempo. Fijarla acá hace que dayjs y `new Date()` sean deterministas.
    env: { TZ: 'America/Argentina/Buenos_Aires' },
    // x-date-pickers/esm hace un directory-import de '@mui/material/styles' que
    // Node no resuelve al externalizarlo; inlinearlo hace que Vite lo transforme
    // y resuelva bien (necesario para LocalizationProvider en renderWithProviders).
    server: { deps: { inline: [/@mui\/x-date-pickers/] } },
    coverage: {
      provider: 'v8',
      // Emitir el reporte incluso si algún test falla; sin esto Vitest descarta
      // todo el coverage ante un solo fallo y los thresholds no se chequean.
      reportOnFailure: true,
      reporter: ['text-summary', 'html', 'clover', 'json-summary'],
      // Sólo medimos lo que puede tener lógica testeable. Excluimos infra de
      // test, tipos, barrels y assets que inflarían el denominador sin señal.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/types/**',
        'src/**/index.ts',
        'src/main.tsx',
        'src/sentry.ts',
        'src/theme/**',
      ],
      // Thresholds calibrados al piso real medido (ago 2026, denominador = toda
      // la app): stmts 3.56 / branch 2.25 / func 2.66 / lines 3.66. Se fijan
      // apenas por debajo como candado anti-regresión — SUBEN con cada bloque de
      // tests, nunca bajan. Cobertura global baja a propósito: la deuda histórica
      // es real, el objetivo es que no empeore.
      thresholds: {
        statements: 3.5,
        branches: 2.2,
        functions: 2.6,
        lines: 3.6,
      },
    },
  },
})
