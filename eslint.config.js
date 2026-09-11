import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import noLiteralColors from './eslint-rules/no-literal-colors.js'

export default tseslint.config([
  globalIgnores(['dist', 'coverage', '*.cjs', 'scripts/**/*.cjs']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // v7: los flat configs viven bajo `configs.flat`; `configs['recommended-latest']`
      // a secas volvió a ser el shape legacy (eslintrc) y ESLint 10 lo rechaza.
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // react-hooks v7: el preset trae las reglas nuevas del React Compiler en
      // 'error' (~330 hallazgos en código existente). Las bajamos a 'warn' para
      // no frenar el lint con deuda histórica — rules-of-hooks sigue en error.
      // Cleanup futuro: ir promoviendo módulo a módulo (ver docs/MIGRACION_VERSIONES_FRONT.md).
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/void-use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/config': 'warn',
      'react-hooks/gating': 'warn',
      // ESLint 10: reglas nuevas en js.configs.recommended que flaggean código
      // preexistente (9 + 5 hallazgos). En warn hasta hacer el cleanup puntual.
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
    },
  },
  // Anti-drift de la migración a tokens semánticos (modo oscuro): nada de
  // colores literales en componentes. Migración completada (ago 2026) — la
  // regla quedó en 'error'; los literales legítimos viven en la allowlist de
  // abajo o bajo eslint-disable con motivo.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      // Fuente de verdad de los tokens: acá los literales son legítimos.
      'src/theme/**',
      // Exportaciones (PDF/Excel/Word) e impresión: SIEMPRE salen en claro,
      // con colores propios — prohibido que lean el theme, permitido el literal.
      'src/utils/exportPDF.ts',
      'src/utils/exportExcel.ts',
      'src/utils/pdfExportUtils.ts',
      'src/utils/metricasExportUtils.ts',
      'src/utils/capacitacionPlanillaPdf.ts',
      'src/services/pdfService.ts',
      'src/services/puestoPdfService.ts',
      'src/services/ripserLogo.ts',
      'src/components/RRHH/Asistencias/exportService.ts',
      // Ficha pública (QR, la ven terceros) y su versión interna imprimible.
      'src/components/Public/**',
      'src/components/Fabricacion/FichaEquipoPage.tsx',
      // Tests: fixtures con strings arbitrarios.
      'src/**/*.test.{ts,tsx}',
      'src/test/**',
    ],
    plugins: {
      ripser: { rules: { 'no-literal-colors': noLiteralColors } },
    },
    rules: {
      'ripser/no-literal-colors': 'error',
    },
  },
  // react-refresh no aplica a infra de test: esos archivos no participan del
  // HMR de Vite y sus re-exports (`export *` de testing-library) son legítimos.
  {
    files: ['src/test/**', 'src/**/*.test.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // Cutover / → /ripser: toda navegación con URL absoluta pasa por
  // src/utils/navigation.ts (appPath/hardRedirect/isAtPath), que respeta
  // import.meta.env.BASE_URL. Un literal '/...' en window.location.href o en
  // href= ignora el base de Vite y rompe la app cuando se sirve bajo subpath.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/utils/navigation.ts', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "AssignmentExpression[left.object.object.name='window'][left.object.property.name='location'][left.property.name='href'][right.value=/^\\u002F/]",
          message:
            "No asignes window.location.href con una ruta absoluta: usá hardRedirect() de src/utils/navigation.ts (respeta BASE_URL).",
        },
        {
          selector: "JSXAttribute[name.name='href'] Literal[value=/^\\u002F/]",
          message:
            'href="/..." ignora el base de Vite: usá <Link to> de react-router o appPath() de src/utils/navigation.ts.',
        },
      ],
    },
  },
])
