import { Page, expect } from '@playwright/test';

/**
 * Mobile helpers — shared by the *.mobile.spec.ts suites.
 */

/**
 * Asserts that the page has no horizontal overflow: the document must fit
 * inside the mobile viewport (no sideways scrolling in the field).
 *
 * Polls briefly because MUI layouts settle asynchronously (fonts, drawers,
 * tables collapsing into cards).
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        ),
      {
        message:
          'Horizontal overflow: document.documentElement.scrollWidth exceeds window.innerWidth',
        timeout: 10_000,
      }
    )
    .toBeLessThanOrEqual(0);
}
