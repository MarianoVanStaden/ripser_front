import { test, expect } from '../../fixtures';
import type { Page } from '@playwright/test';

/**
 * Smoke tests for the FRONT-003 refactor of the Ventas module.
 *
 * Goal: catch regressions introduced when splitting the three big page files
 *  - PresupuestosPage.tsx     (2.232 LOC)
 *  - NotasPedidoPage.tsx      (2.590 LOC)
 *  - FacturacionPage.tsx      (1.938 LOC, partially split already in FRONT-002)
 *
 * The tests below run with the global mocks installed by `_routeMocks` in
 * e2e/fixtures/index.ts — every /api/** call returns an empty paginated
 * response.  That makes the smoke deliberately UI-shaped: we verify
 * scaffolding (pages mount, headings render, primary CTAs are wired,
 * dialogs open with their expected fields) without requiring a live backend.
 *
 * What this guards against during a component-by-component split:
 *   - Broken imports / props after extracting a sub-component
 *   - Dialog state desync after extracting a Dialog presentational
 *   - Tabs disappearing or swapped after splitting tab bodies
 *   - Buttons no longer wired after moving handlers
 *   - **NEW** unhandled crashes that the Sentry ErrorBoundary catches
 *
 * What this does NOT guard against (covered by other tests):
 *   - End-to-end correctness of the conversion chain
 *     (presupuesto → nota pedido → factura).  See `ventas.test.ts` for the
 *     API-driven version, and the `test.fixme` block at the bottom of this
 *     file for the planned UI-driven full-chain smoke.
 */

/** Returns the locator for the Sentry ErrorBoundary fallback ("Algo salió mal"). */
const errorBoundaryFallback = (page: Page) =>
  page.getByRole('heading', { name: /algo salió mal/i });

/**
 * Fail-fast assertion: if the ErrorBoundary is visible, fail with a clear
 * message before any other selector has a chance to time out.
 */
async function assertNoErrorBoundary(page: Page, pageName: string): Promise<void> {
  const fallback = errorBoundaryFallback(page);
  // Quick check — don't wait long; we want a fast signal, not a 30s timeout.
  if (await fallback.isVisible({ timeout: 1_500 }).catch(() => false)) {
    throw new Error(
      `Sentry ErrorBoundary fallback ("Algo salió mal") visible on ${pageName}. ` +
      `Página crasheó al montar con los mocks empty-shape del fixture global. ` +
      `Inspeccionar el page snapshot adjunto y agregar la mock específica que ` +
      `falte como override LIFO-higher dentro del propio test.`,
    );
  }
}

test.describe('FRONT-003 smoke — Ventas pages render & primary CTAs wired', () => {
  /*
   * Empty-response shape is handled centrally by the fixture's catch-all:
   * URLs with `?page=` get `{content:[]}`, everything else gets `[]`.
   * That covers the Ventas catalog endpoints (productos, recetas, colores,
   * medidas, opciones-financiamiento, …) and the helper endpoints on the
   * tenant context (usuario-empresa, sucursales, empresas).  Any endpoint
   * that needs a specific payload installs its own LIFO-higher override
   * inside the test that needs it.
   */

  // ── Presupuestos: heading, "Nuevo Presupuesto" CTA, dialog opens with form ──
  test('Presupuestos page mounts and the create dialog opens with cliente field', async ({
    ventasPage,
    page,
  }) => {
    await ventasPage.gotoPresupuestos();
    await assertNoErrorBoundary(page, '/ventas/presupuestos');

    // Heading renders. PresupuestosPage uses a single h1 styled as h4.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });

    // Primary CTA — `aria-label="Crear nuevo presupuesto"` (PresupuestosPage.tsx:987).
    const nuevoPresupuesto = page.getByRole('button', { name: 'Crear nuevo presupuesto' });
    await expect(nuevoPresupuesto).toBeVisible();

    // Dialog opens — confirms the dialog component still mounts after the split.
    await nuevoPresupuesto.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Identity-bearing fields render: the CLIENTE/LEAD toggle and the
    // ClienteAutocomplete (default `label="Cliente"`).  If the dialog body
    // ever swaps these out, the next "create flow" test would fail before
    // even hitting the form, so this check fails fast.
    await expect(dialog.getByRole('group', { name: /tipo de destinatario/i })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Cliente' })).toBeVisible();

    // Close cleanly so the next test starts from a known state.
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  // ── Notas de Pedido: heading, "Convertir Presupuesto" CTA renders ──────────
  test('Notas Pedido page mounts and surfaces the "Convertir Presupuesto" CTA', async ({
    ventasPage,
    page,
  }) => {
    await ventasPage.gotoNotasPedido();
    await assertNoErrorBoundary(page, '/ventas/notas-pedido');

    await expect(page.getByRole('heading', { name: /notas de pedido/i, level: 1 }))
      .toBeVisible({ timeout: 10_000 });

    // CTA — "Convertir Presupuesto".  The label is rendered twice on the page:
    // once as the header CTA (NotasPedidoPage.tsx:1250) and once inside the
    // empty-state callout (NotasPedidoPage.tsx:1494).  With empty mocks both
    // are visible at the same time, so we anchor on the header CTA via its
    // adjacent "Crear Nota Pedido Manual" sibling.  Disabled when there are
    // no pending presupuestos — assert it's *rendered*, not enabled.
    const convertirBtn = page.getByRole('button', { name: /convertir presupuesto/i }).first();
    await expect(convertirBtn).toBeVisible();
  });

  // ── Facturación: heading + both tabs (Manual / Desde Nota de Pedido) ───────

  test('Facturacion page mounts with both tabs ("Facturación Manual" + "Desde Nota de Pedido")', async ({
    ventasPage,
    page,
  }) => {
    await ventasPage.gotoFacturacion();
    await assertNoErrorBoundary(page, '/ventas/facturacion');

    // FacturacionPage.tsx:1677 uses `variant="h4"` without `component="h1"`,
    // so it isn't reachable as a heading. Match the visible text instead.
    await expect(page.getByText('Facturación', { exact: false }).first())
      .toBeVisible({ timeout: 10_000 });

    // Tabs — FacturacionPage.tsx:1731-1732.  These are the seam most at risk
    // when extracting tab bodies into <FacturarManualTab> / <DesdeNotaPedidoTab>.
    await expect(page.getByRole('tab', { name: /facturación manual/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /desde nota de pedido/i })).toBeVisible();
  });

  // ── No JS error / ErrorBoundary across all four ventas pages ───────────────

  test('Cross-page navigation does not crash any ventas page', async ({ ventasPage, page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
    });

    // Visit each route AND assert ErrorBoundary fallback is not shown.
    // If any page crashes, the assertion fails with the page name.
    for (const [pathName, navigate] of [
      ['/ventas/presupuestos',  () => ventasPage.gotoPresupuestos()],
      ['/ventas/notas-pedido',  () => ventasPage.gotoNotasPedido()],
      ['/ventas/facturacion',   () => ventasPage.gotoFacturacion()],
      ['/ventas/notas-credito', () => ventasPage.gotoNotasCredito()],
    ] as const) {
      await navigate();
      // Use expect.soft so we collect *all* crashing pages instead of stopping
      // at the first one — more useful diagnosis after a refactor.
      await expect.soft(
        errorBoundaryFallback(page),
        `ErrorBoundary fallback visible on ${pathName} — page crashed at mount`,
      ).not.toBeVisible({ timeout: 1_500 });
    }

    // Filter out the noise we expect (Sentry breadcrumbs, network 401 from
    // the fixture's auth/validate mock interplay, etc.) but flag genuine
    // React errors that bypassed the ErrorBoundary.
    const realErrors = consoleErrors.filter(
      (e) =>
        !/Failed to load resource/i.test(e) &&
        !/sentry/i.test(e) &&
        !/Sentry Logger/i.test(e),
    );
    expect.soft(
      realErrors,
      `Unexpected JS errors during navigation:\n${realErrors.join('\n')}`,
    ).toEqual([]);
  });

  // ── STRETCH: full conversion chain via UI clicks ──────────────────────────
  //
  // Pendiente — necesita observar en runtime los endpoints exactos que cada
  // página llama durante la conversión (search de presupuestos pendientes,
  // POST /api/documentos/.../convertir-a-nota-pedido, POST .../factura, …).
  // Mockearlos en orden con datos sintéticos evolutivos (presupuesto activo →
  // nota creada → factura emitida) requiere correr el dev server local +
  // capturar tráfico real una vez, no se puede inferir de ojo desde los
  // services del front.
  //
  // Plan para activarlo:
  //   1. Levantar `npm run dev` localmente, hacer la conversión P→NP→F real.
  //   2. Capturar las request URLs y payloads exactos (DevTools Network).
  //   3. Reemplazar este `fixme` por `test()` con `page.route` que devuelva
  //      datos sintéticos coherentes con esas URLs.
  //   4. Verificar tabla → click "Convertir" → dialog → confirm → tabla
  //      siguiente página → click "Convertir a Factura" → estado.
  // ───────────────────────────────────────────────────────────────────────
  test.fixme('Full chain via UI: presupuesto → nota pedido → factura', async () => {
    // Implementation deferred — see the long comment above.
  });
});
