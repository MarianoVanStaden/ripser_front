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
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
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
