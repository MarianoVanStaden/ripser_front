import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

// After loginAs(), the sidebar starts OPEN (Layout uses useState(true)).
// MUI Drawer renders role="presentation", NOT role="navigation".
// Use the AppBar (role="banner") and username text to confirm the layout loaded.

test.describe('Authenticated navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test.describe('Layout', () => {
    test('AppBar is visible on dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      // MUI AppBar renders as <header> → implicit role="banner"
      await expect(page.getByRole('banner')).toBeVisible({ timeout: 10_000 });
    });

    test('sidebar renders with logged-in username', async ({ page }) => {
      await page.goto('/dashboard');
      // Sidebar always shows the authenticated user's username in the profile section.
      // Use exact match to avoid colliding with the dashboard greeting "¡Hola, testadmin! 👋".
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });
    });

    test('sidebar contains section headers', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      // These section headers are ListSubheaders in the sidebar
      await expect(page.getByText('VENTAS').first()).toBeVisible();
      await expect(page.getByText('CLIENTES').first()).toBeVisible();
    });
  });

  test.describe('Client-side navigation via sidebar', () => {
    test('clicking "Gestión Clientes" navigates to /clientes/gestion', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      await page.getByText('Gestión Clientes').click();
      await expect(page).toHaveURL(/\/clientes\/gestion/);
    });

    test('clicking "Dashboard de Ventas" navigates to /ventas/dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      await page.getByText('Dashboard de Ventas').click();
      await expect(page).toHaveURL(/\/ventas\/dashboard/);
    });

    test('clicking "Gestión Proveedores" navigates to /proveedores/gestion', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      await page.getByText('Gestión Proveedores').click();
      await expect(page).toHaveURL(/\/proveedores\/gestion/);
    });

    test('clicking "Órdenes Servicio" navigates to /taller/ordenes', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      await page.getByText('Órdenes Servicio').click();
      await expect(page).toHaveURL(/\/taller\/ordenes/);
    });
  });

  test.describe('Direct URL navigation', () => {
    const protectedRoutes = [
      '/clientes/gestion',
      '/ventas/dashboard',
      '/proveedores/gestion',
      '/admin/users',
      '/fabricacion/equipos',
      '/logistica/stock',
    ];

    for (const route of protectedRoutes) {
      test(`${route} loads without redirecting to login`, async ({ page }) => {
        await page.goto(route);
        await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });
        await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));
      });
    }
  });

  test.describe('Logout', () => {
    test('clicking logout opens confirmation dialog', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      // The logout button is CSS-translated out of its container (opacity:0,
      // translateY(100%)). dispatchEvent fires onClick without needing the
      // element to be positioned in the viewport.
      await page.locator('.logout-button').dispatchEvent('click');

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Confirmar cierre de sesión')).toBeVisible();
    });

    test('confirming logout redirects to /login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      // The logout button is CSS-translated out of its container (opacity:0,
      // translateY(100%)). dispatchEvent fires onClick without needing the
      // element to be positioned in the viewport.
      await page.locator('.logout-button').dispatchEvent('click');
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click the confirm button inside the dialog
      await page.getByRole('button', { name: 'Cerrar sesión' }).click();

      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    });

    test('cancelling logout keeps the user on the page', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByText('testadmin', { exact: true })).toBeVisible({ timeout: 10_000 });

      // The logout button is CSS-translated out of its container (opacity:0,
      // translateY(100%)). dispatchEvent fires onClick without needing the
      // element to be positioned in the viewport.
      await page.locator('.logout-button').dispatchEvent('click');
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: 'Cancelar' }).click();

      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
