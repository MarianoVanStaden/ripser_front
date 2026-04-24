# CI Pipeline — ripser_front

## Jobs

| Job | Disparador | Herramienta | Required para merge |
|---|---|---|---|
| `lint` | Todo push + todo PR | ESLint | ✅ |
| `typecheck` | Todo push + todo PR | `tsc --noEmit` | ✅ |
| `test` | Todo push + todo PR | Vitest | ✅ |
| `build` | Después de lint + typecheck + test | `vite build` | ✅ |

## Cache

`actions/setup-node@v4` con `cache: 'npm'` cachea `~/.npm` usando como key el hash de `package-lock.json`. El cache se invalida automáticamente cuando cambian dependencias.

> Se usa `npm ci` (no `npm install`) en todos los jobs para reproducibilidad exacta del lockfile.

## Type Check

El script `typecheck` corre `tsc -p tsconfig.app.json --noEmit`. Usa el tsconfig de la app (no el root con project references) para obtener errores concretos sin generar archivos.

## Coverage de tests

El job `test` corre `npm run test:coverage` que ejecuta `vitest run --coverage`.

**Prerequisito**: `@vitest/coverage-v8` debe estar en `devDependencies`:
```bash
npm install -D @vitest/coverage-v8
```
Sin este paquete el job falla con _"No coverage provider was found"_. Es la única deuda pendiente para que el pipeline quede 100% verde.

## Prettier

Prettier **no está configurado** en este proyecto (no hay `.prettierrc`). El job `lint` cubre solo ESLint. Si se agrega Prettier en el futuro, agregar:
```yaml
- name: Check formatting
  run: npx prettier --check "src/**/*.{ts,tsx}"
```

## Branch protection — qué configurar en main

En _Settings → Branches → Branch protection rules → main_:

```
✅ Require status checks to pass before merging
   ✅ lint
   ✅ typecheck
   ✅ test
   ✅ build
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
```

## Artifacts

El job `build` sube `dist/` como artifact `dist` con retención de 7 días.

## Secrets

No se detectaron secrets hardcodeados en ningún workflow (el repo no tenía workflows previos).
