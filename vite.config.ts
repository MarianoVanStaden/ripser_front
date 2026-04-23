/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  plugins: [react(), analyzePlugin].filter(Boolean),

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
    rollupOptions: {
      output: {
        // Splitting philosophy:
        //   - Eager-path, rarely-changing libs (react + mui core) get their
        //     own stable chunks for long-term HTTP caching across deploys.
        //   - Heavy, conditionally-used libs stay isolated so routes that
        //     don't import them don't pay their cost.
        //   - Everything else (query, forms, dayjs, axios, etc.) lives in
        //     ONE `vendor` chunk — tiny deps don't deserve separate HTTP
        //     requests, and consolidating improves gzip ratio + cache hits.
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
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-recharts'
          if (id.includes('/exceljs/')) return 'vendor-exceljs'
          if (id.includes('/jspdf'))    return 'vendor-jspdf'

          // Everything else (react, react-dom, react-router, @mui/material
          // + internals, @emotion, query, forms, dayjs, axios, …) → one
          // `vendor` chunk. Merging avoids all the cross-chunk interop
          // footguns and still gives us good caching: this chunk only
          // changes when we bump a dep.
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
  },
})
