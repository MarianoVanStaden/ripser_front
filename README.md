# ripser-front

[![CI](https://github.com/MarianoVanStaden/ripser_front/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MarianoVanStaden/ripser_front/actions/workflows/ci.yml)

Frontend del sistema Ripser — React 19 + TypeScript + Vite + MUI.

## Stack

- **UI**: React 19 + MUI v6
- **Lenguaje**: TypeScript 5.8
- **Build**: Vite 7
- **Tests**: Vitest 4 + Testing Library
- **Forms**: React Hook Form + Yup
- **HTTP**: Axios + TanStack Query

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (sin generar archivos)
npm test           # Vitest (sin coverage)
npm run test:coverage  # Vitest con coverage (requiere @vitest/coverage-v8)
npm run build      # Build de producción
```

## CI/CD

Ver [docs/ci.md](docs/ci.md) para la descripción completa del pipeline.

| Job | Descripción |
|---|---|
| `lint` | ESLint en todo el código fuente |
| `typecheck` | Verificación de tipos TypeScript |
| `test` | Vitest con coverage |
| `build` | Build de producción + artifact en GitHub Actions |

## Documentación

- [docs/](docs/README.md) — índice general de documentación viva.
- [docs/contextos/](docs/contextos/) — un archivo por módulo: rutas, API, contexts, types.
- [docs/instructivos/](docs/instructivos/) — guías de uso para usuarios finales.
- [AUDITORIA_TECNICA.md](AUDITORIA_TECNICA.md) — auditoría back+front + backlog de refactor (P0/P1/P2/P3).
- [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) — deuda técnica de performance en listados.
- [DEPLOY_VPS.md](DEPLOY_VPS.md) — procedimiento de despliegue.

> Política: no se agregan archivos `.md` nuevos en la raíz. Las notas de
> implementación, fixes y debug viven en commits + PR descriptions, no en
> archivos sueltos. Documentación por módulo va a `docs/contextos/` o
> `docs/instructivos/`.
