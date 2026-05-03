# Documentación — ripser_front

Índice de documentación viva del frontend. Para diagnósticos y deuda técnica
ver los archivos canónicos en la raíz del repo.

## Estructura

```
docs/
├── README.md            ← este archivo (índice)
├── ci.md                ← pipeline de CI (lint, typecheck, test, build)
├── contextos/           ← un archivo por módulo: rutas, API, contexts, types
└── instructivos/        ← guías de uso para usuarios finales
```

## Documentación viva

### Por módulo (técnica)

Los archivos en [`contextos/`](contextos/) describen, para cada módulo,
qué archivos lo componen, qué rutas registra, qué endpoints consume y qué
tipos/contexts usa. Sirven como mapa para navegar el código.

| Módulo | Archivo |
|---|---|
| Auth + multi-tenant | [contexto-auth-multitenant.md](contextos/contexto-auth-multitenant.md) |
| Admin / finanzas | [contexto-admin-finanzas.md](contextos/contexto-admin-finanzas.md) |
| Clientes | [contexto-clientes.md](contextos/contexto-clientes.md) |
| Cobranzas | [contexto-cobranzas.md](contextos/contexto-cobranzas.md) |
| Dashboard | [contexto-dashboard.md](contextos/contexto-dashboard.md) |
| Fabricación | [contexto-fabricacion.md](contextos/contexto-fabricacion.md) |
| Garantías | [contexto-garantias.md](contextos/contexto-garantias.md) |
| Layout y navegación | [contexto-layout-navegacion.md](contextos/contexto-layout-navegacion.md) |
| Leads | [contexto-leads.md](contextos/contexto-leads.md) |
| Logística | [contexto-logistica.md](contextos/contexto-logistica.md) |
| Préstamos | [contexto-prestamos.md](contextos/contexto-prestamos.md) |
| Proveedores | [contexto-proveedores.md](contextos/contexto-proveedores.md) |
| RRHH | [contexto-rrhh.md](contextos/contexto-rrhh.md) |
| Taller | [contexto-taller.md](contextos/contexto-taller.md) |
| Ventas | [contexto-ventas.md](contextos/contexto-ventas.md) |

### Por módulo (uso)

Los archivos en [`instructivos/`](instructivos/) son guías de usuario final
(qué hace cada pantalla, en qué orden se opera). Ver
[instructivos/README.md](instructivos/README.md) para el índice completo.

### CI

[ci.md](ci.md) — pipeline de jobs en `.github/workflows/ci.yml`
(lint, typecheck, test, build).

## Documentación canónica en la raíz

Cuatro archivos viven en la raíz porque son consultados con frecuencia o son
el primer punto de contacto:

| Archivo | Propósito |
|---|---|
| [`README.md`](../README.md) | Quickstart de desarrollo (stack, scripts, estructura). |
| [`AUDITORIA_TECNICA.md`](../AUDITORIA_TECNICA.md) | Auditoría técnica de back+front + backlog vivo de refactor (P0/P1/P2/P3). |
| [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) | Notas de performance / deuda enfocada en listados. |
| [`DEPLOY_VPS.md`](../DEPLOY_VPS.md) | Procedimiento de despliegue al VPS (workflow + setup). |

## Política

- **No se crean archivos nuevos en la raíz.** Las notas de implementación,
  fixes y debugging viven en commits + PR descriptions, no en `.md` sueltos.
- **Documentación por módulo va a [`contextos/`](contextos/)** o
  [`instructivos/`](instructivos/) según sea técnica o de usuario.
- **Snapshots de incidentes/fixes no se documentan en archivos.** El git log
  + el cuerpo del commit son la fuente; si un fix tiene contexto que vale la
  pena preservar, se escribe en la PR, no en un `FIX_*.md`.
- **Análisis puntuales (auditorías, planes, comparativos) van en
  [`../plans/`](../plans/)** si son outputs de agentes, o se anexan al
  AUDITORIA_TECNICA.md si son durables.

## Histórico

Hasta 2026-05-03 había 100+ archivos `.md` en la raíz (notas ad-hoc de fixes,
debug, implementación, guías paso-a-paso, referencias a DTOs del backend).
Se consolidaron en esta estructura como parte de **DOCS-003** del
AUDITORIA_TECNICA. Los archivos borrados están en git history; recuperarlos
es `git log --all --full-history -- <ruta>` + `git show`.
