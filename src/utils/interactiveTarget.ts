/**
 * Detección de targets "interactivos" para el drag-to-scroll horizontal.
 *
 * Arrastrar para panear una tabla NO debe dispararse cuando el usuario apoya el
 * mouse sobre algo con lo que se interactúa (un input, un botón, un link, el
 * separador de columnas de DataGrid…): ahí el gesto pertenece al control, no al
 * scroll. Se camina el DOM desde el target hasta el contenedor y se corta apenas
 * aparece uno de estos.
 */

const INTERACTIVE_TAGS = new Set([
  'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'LABEL', 'SUMMARY',
]);

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'option', 'tab', 'combobox', 'listbox', 'textbox',
  'spinbutton', 'slider', 'switch',
]);

/**
 * @param target  El `event.target` del mousedown.
 * @param container  Nodo donde frenar la búsqueda (el scroller). Si es `null`
 *                   se camina hasta la raíz del documento.
 */
export function isInteractiveTarget(
  target: EventTarget | null,
  container: HTMLElement | null,
): boolean {
  if (!target || !(target instanceof Element)) return false;
  let el: Element | null = target;
  while (el && el !== container) {
    if (INTERACTIVE_TAGS.has(el.tagName)) return true;
    const role = el.getAttribute('role');
    if (role && INTERACTIVE_ROLES.has(role)) return true;
    if ((el as HTMLElement).contentEditable === 'true') return true;
    // Redimensionar columnas de DataGrid es su propio gesto de arrastre.
    if (el.classList.contains('MuiDataGrid-columnSeparator')) return true;
    el = el.parentElement;
  }
  return false;
}
