import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * EquiposPage — Page Object for /fabricacion/equipos.
 *
 * Selectors derived from src/components/Fabricacion/EquiposList.tsx:
 *   - Heading: "Gestión de Equipos Fabricados"
 *   - Button: "Nuevo Equipo"
 *   - Tabs: "Lista de Equipos", "KPIs y Análisis"
 *   - Filters: Select "Tipo de Equipo", Select "Estado Fabricación", Select "Estado Asignación"
 */
export class EquiposPage extends BasePage {
  readonly path = '/fabricacion/equipos';

  readonly heading: Locator;
  readonly nuevoEquipoButton: Locator;
  readonly tabLista: Locator;
  readonly tabKpis: Locator;
  readonly tipoFilter: Locator;
  readonly estadoFabricacionFilter: Locator;
  readonly estadoAsignacionFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.heading             = page.getByText('Gestión de Equipos Fabricados');
    this.nuevoEquipoButton   = page.getByRole('button', { name: /nuevo equipo/i });
    this.tabLista            = page.getByRole('tab', { name: /lista de equipos/i });
    this.tabKpis             = page.getByRole('tab', { name: /kpis/i });
    this.tipoFilter          = page.getByLabel(/tipo de equipo/i).first();
    this.estadoFabricacionFilter  = page.getByLabel(/estado fabricación/i).first();
    this.estadoAsignacionFilter   = page.getByLabel(/estado asignación/i).first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.nuevoEquipoButton).toBeVisible();
  }

  async gotoListaTab(): Promise<void> {
    await this.tabLista.click();
    await expect(this.tabLista).toHaveAttribute('aria-selected', 'true');
  }

  async gotoKpisTab(): Promise<void> {
    await this.tabKpis.click();
    await expect(this.tabKpis).toHaveAttribute('aria-selected', 'true');
  }
}

/**
 * RecetasPage — Page Object for /fabricacion/recetas.
 *
 * Selectors derived from src/components/Fabricacion/RecetasList.tsx:
 *   - Heading: "Estructura de Producción"
 *   - Button: "Nueva Receta"
 *   - Search: label "Buscar por nombre o código"
 *   - Filter: Select "Tipo de Equipo"
 */
export class RecetasPage extends BasePage {
  readonly path = '/fabricacion/recetas';

  readonly heading: Locator;
  readonly nuevaRecetaButton: Locator;
  readonly searchInput: Locator;
  readonly tipoFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.heading           = page.getByRole('heading', { name: 'Estructura de Producción' });
    this.nuevaRecetaButton = page.getByRole('button', { name: /nueva receta/i });
    this.searchInput       = page.getByLabel(/buscar por nombre o código/i).first();
    this.tipoFilter        = page.getByLabel(/tipo de equipo/i).first();
  }

  async assertOnPage(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.nuevaRecetaButton).toBeVisible();
  }

  async buscar(term: string): Promise<void> {
    await this.fillField(this.searchInput, term);
  }
}
