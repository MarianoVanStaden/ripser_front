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
    // exceljs dynamic chunk is legitimately ~900 KB raw — users only pay
    // for it when they click "Export". Bump above that to avoid noise.
    chunkSizeWarningLimit: 1000,
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
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Stable eager core — changes rarely, keep separate for caching.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/react-router') ||
            id.includes('/react-router-dom/')
          ) {
            return 'vendor-react'
          }
          if (
            id.includes('/@mui/material/') ||
            id.includes('/@mui/system/') ||
            id.includes('/@mui/lab/') ||
            id.includes('/@emotion/')
          ) {
            return 'vendor-mui'
          }

          // Heavy, route-conditional libs — isolate.
          if (id.includes('/@mui/icons-material/')) return 'vendor-mui-icons'
          if (id.includes('/@mui/x-data-grid/')) return 'vendor-mui-datagrid'
          if (id.includes('/@mui/x-date-pickers/')) return 'vendor-mui-pickers'
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-recharts'
          if (id.includes('/exceljs/')) return 'vendor-exceljs'
          if (id.includes('/jspdf')) return 'vendor-jspdf'

          // Everything else (query, forms, dayjs, axios, hookform, yup,
          // misc utilities) — one catch-all cacheable chunk.
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
