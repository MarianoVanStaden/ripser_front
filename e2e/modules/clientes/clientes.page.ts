import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * ClientesPage — Page Object for /clientes/gestion.
 *
 * The page renders a card grid with a search bar and a "Nuevo Cliente" button.
 * Each card exposes an edit icon (EditIcon) and a view icon (VisibilityIcon).
 *
 * Selector strategy:
 *  - Primary: getByRole / getByPlaceholder / getByLabel
 *  - Fallback: data-testid where available
 */
export class ClientesPage extends BasePage {
  readonly path = '/clientes/gestion';

  // ─── Locators ──────────────────────────────────────────────────────────────

  readonly searchInput: Locator;
  readonly nuevoClienteButton: Locator;
  readonly successAlert: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    this.searchInput = page.getByPlaceholder('Buscar clientes');
    this.nuevoClienteButton = page.getByRole('button', { name: 'Nuevo Cliente' });
    this.successAlert = page.locator('[role="alert"]').filter({ hasText: /exitosamente/i });
    this.errorAlert = page.locator('[role="alert"]').filter({ hasText: /error/i });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  /** Navigate to the new cliente form. */
  async gotoForm(): Promise<void> {
    await this.page.goto('/clientes/nuevo');
  }

  /** Navigate to the edit form for a specific cliente by id. */
  async gotoEdit(id: number): Promise<void> {
    await this.page.goto(`/clientes/editar/${id}`);
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /** Fill the search input and wait for the list to settle. */
  async buscar(term: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(term);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Returns the card locator for a cliente identified by name.
   * The card contains the cliente's nombre as visible text.
   */
  getClienteCard(nombre: string): Locator {
    return this.page.locator('[class*="Card"],[data-testid*="cliente-card"]').filter({
      hasText: nombre,
    });
  }

  /**
   * Clicks the EditIcon button within the card for the given cliente name.
   * The icon button targets the SVG with data-testid="EditIcon".
   */
  async clickEditarCliente(nombre: string): Promise<void> {
    const card = this.getClienteCard(nombre);
    await expect(card).toBeVisible();
    // Click the edit icon button inside the card
    await card.locator('[data-testid="EditIcon"]').click();
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  /** Assert that a client card with the given name is visible in the grid. */
  async assertClienteVisible(nombre: string): Promise<void> {
    await expect(this.getClienteCard(nombre)).toBeVisible({ timeout: 10_000 });
  }

  /** Assert that no client card with the given name is visible. */
  async assertClienteNotVisible(nombre: string): Promise<void> {
    await expect(this.getClienteCard(nombre)).not.toBeVisible({ timeout: 10_000 });
  }
}

/**
 * ClienteFormPage — Page Object for /clientes/nuevo and /clientes/editar/:id.
 *
 * The form contains MUI TextField and Select components bound by label text.
 */
export class ClienteFormPage extends BasePage {
  readonly path = '/clientes/nuevo';

  // ─── Locators ──────────────────────────────────────────────────────────────

  readonly tipoSelect: Locator;
  readonly nombreInput: Locator;
  readonly apellidoInput: Locator;
  readonly emailInput: Locator;
  readonly telefonoInput: Locator;
  readonly estadoSelect: Locator;
  readonly submitButton: Locator;
  readonly successAlert: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    this.tipoSelect = page.getByLabel('Tipo de Cliente');
    this.nombreInput = page.getByLabel('Nombre');
    this.apellidoInput = page.getByLabel('Apellido');
    this.emailInput = page.getByLabel('Email');
    this.telefonoInput = page.getByLabel('Teléfono');
    this.estadoSelect = page.getByLabel('Estado');
    // The submit button may be labelled "Guardar" or "Crear Cliente" etc.
    this.submitButton = page.getByRole('button', { name: /guardar|crear cliente/i });
    this.successAlert = page.locator('[role="alert"]').filter({
      hasText: /exitosamente/i,
    });
    this.errorAlert = page.locator('[role="alert"]').filter({
      hasText: /error/i,
    });
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Fill all provided form fields.
   * Only fields present in data are filled — undefined fields are left as-is.
   */
  async fillForm(data: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    tipo?: string;
    estado?: string;
  }): Promise<void> {
    if (data.tipo !== undefined) {
      await this.tipoSelect.click();
      await this.page.getByRole('option', { name: data.tipo }).click();
    }

    if (data.nombre !== undefined) {
      await this.fillField(this.nombreInput, data.nombre);
    }

    if (data.apellido !== undefined) {
      await this.fillField(this.apellidoInput, data.apellido);
    }

    if (data.email !== undefined) {
      await this.fillField(this.emailInput, data.email);
    }

    if (data.telefono !== undefined) {
      await this.fillField(this.telefonoInput, data.telefono);
    }

    if (data.estado !== undefined) {
      await this.estadoSelect.click();
      await this.page.getByRole('option', { name: data.estado }).click();
    }
  }

  /** Click the submit (Guardar) button. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Assert that the success alert is visible.
   * Accepts "Cliente creado exitosamente" or "Cliente actualizado exitosamente".
   */
  async assertSuccess(): Promise<void> {
    await expect(this.successAlert).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Assert that an error alert is visible, optionally matching a substring.
   */
  async assertError(text?: string): Promise<void> {
    const alert = text
      ? this.page.locator('[role="alert"]').filter({ hasText: text })
      : this.errorAlert;
    await expect(alert).toBeVisible({ timeout: 10_000 });
  }
}
