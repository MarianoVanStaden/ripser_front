import { useEffect } from 'react';
import { isInteractiveTarget } from '../utils/interactiveTarget';

/**
 * Drag-to-scroll horizontal GLOBAL, por delegación en `document`.
 *
 * Motivación: casi todas las tablas de la app son un `<TableContainer>` de MUI,
 * cuya raíz ya trae `overflow-x: auto`. En vez de envolver ~140 páginas a mano
 * (y volver a hacerlo con cada tabla nueva), un único listener delegado resuelve
 * el gesto para TODA tabla que hoy desborde y para las que vengan después —
 * incluidas las que viven dentro de diálogos, que se montan en portales.
 *
 * Cómo elige el contenedor: desde el target del mousedown camina hacia arriba y
 * se queda con el primer ancestro que realmente desborde en X y tenga
 * `overflow-x` scrollable. Si no hay ninguno, no pasa nada.
 *
 * Escapes (atributo `data-drag-scroll` en el contenedor o cualquier ancestro):
 *   - `"self"` → ese subárbol ya implementa su propio drag (StickyScrollTable,
 *     DataGridDragScroll). Sin esto el gesto se manejaría dos veces.
 *   - `"off"`  → deshabilitar el gesto (ej: una zona con drag & drop propio).
 *
 * Solo mouse: en touch el paneo nativo ya funciona y en trackpad el swipe de dos
 * dedos también, así que no se tocan esos caminos.
 */

/** px de movimiento antes de considerar que es un arrastre y no un click. */
const DRAG_THRESHOLD = 4;

const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

/**
 * Primer ancestro con desborde horizontal real. Devuelve `null` si en el camino
 * aparece un opt-out (`data-drag-scroll` = "self" | "off").
 */
function findScrollableX(target: EventTarget | null): HTMLElement | null {
  if (!target || !(target instanceof Element)) return null;

  let el: Element | null = target;
  let found: HTMLElement | null = null;

  // Se recorre la cadena COMPLETA aunque ya haya candidato: un opt-out puede
  // estar por encima del scroller (DataGridDragScroll envuelve al virtualScroller).
  while (el && el !== document.documentElement) {
    const optOut = el.getAttribute('data-drag-scroll');
    if (optOut === 'self' || optOut === 'off') return null;

    if (!found && el instanceof HTMLElement && el.scrollWidth - el.clientWidth > 1) {
      const overflowX = getComputedStyle(el).overflowX;
      if (SCROLLABLE_OVERFLOW.has(overflowX)) found = el;
    }
    el = el.parentElement;
  }

  return found;
}

export function useGlobalDragScroll(): void {
  useEffect(() => {
    let scroller: HTMLElement | null = null;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;

    const stopDragStyles = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const el = findScrollableX(e.target);
      if (!el) return;
      if (isInteractiveTarget(e.target, el)) return;

      scroller = el;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      // Ojo: NO se hace preventDefault acá. Un mousedown suelto sigue pudiendo
      // iniciar una selección de texto; recién al superar el umbral se decide
      // que el gesto es un paneo y se cancela la selección.
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!scroller) return;
      const dx = e.clientX - startX;

      if (!hasDragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        hasDragged = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        // Descartar lo que se haya empezado a seleccionar antes del umbral.
        document.getSelection()?.removeAllRanges();
      }

      scroller.scrollLeft = startScrollLeft - dx;
    };

    const onMouseUp = () => {
      const el = scroller;
      scroller = null;
      if (!el || !hasDragged) return;

      hasDragged = false;
      stopDragStyles();

      // Un arrastre no es un click: suprimir el click que el browser dispara al
      // soltar, para no activar filas clickeables ni abrir detalles por error.
      const suppressClick = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      el.addEventListener('click', suppressClick, { capture: true, once: true });
      // Si el click nunca llega (se soltó fuera), limpiar el listener.
      setTimeout(
        () => el.removeEventListener('click', suppressClick, { capture: true }),
        0,
      );
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Por si se desmonta en medio de un arrastre.
      stopDragStyles();
    };
  }, []);
}
