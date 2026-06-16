import { useRef, useEffect, useCallback } from 'react';

/**
 * Tags and ARIA roles that should NOT trigger drag-to-scroll.
 * We walk up the DOM tree from the click target to the scroll container,
 * stopping the moment we hit one of these.
 */
const INTERACTIVE_TAGS = new Set([
  'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'LABEL', 'SUMMARY',
]);
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'option', 'tab', 'combobox', 'listbox', 'textbox',
  'spinbutton', 'slider', 'switch',
]);

function isInteractiveTarget(target: EventTarget | null, container: HTMLElement): boolean {
  if (!target || !(target instanceof Element)) return false;
  let el: Element | null = target;
  while (el && el !== container) {
    if (INTERACTIVE_TAGS.has(el.tagName)) return true;
    const role = el.getAttribute('role');
    if (role && INTERACTIVE_ROLES.has(role)) return true;
    if ((el as HTMLElement).contentEditable === 'true') return true;
    el = el.parentElement;
  }
  return false;
}

export interface HorizontalScrollRefs {
  /** Attach to the overflow:auto scroll container (the actual table wrapper). */
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Attach to the sticky scrollbar's outer div (the one that scrolls). */
  scrollbarRef: React.RefObject<HTMLDivElement | null>;
  /** Attach to the spacer div inside the sticky scrollbar. Its width = table.scrollWidth. */
  scrollbarInnerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Provides refs for:
 * - Two-way scroll sync between a hidden-scrollbar table container and a sticky scrollbar.
 * - Drag-to-scroll (mouse): fires on empty areas, skips interactive elements.
 * - ResizeObserver to keep the sticky scrollbar's phantom width in sync with the table.
 *
 * Safe for: mouse, trackpad (two-finger swipe uses native scroll), touch.
 * Safe for: inputs, selects, checkboxes, buttons, links, menus.
 */
export function useHorizontalScroll(): HorizontalScrollRefs {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarInnerRef = useRef<HTMLDivElement>(null);

  // Guard to break the mutual scroll-sync feedback loop.
  const syncing = useRef(false);

  const updateScrollbarWidth = useCallback(() => {
    const tc = tableContainerRef.current;
    const inner = scrollbarInnerRef.current;
    if (tc && inner) inner.style.width = `${tc.scrollWidth}px`;
  }, []);

  useEffect(() => {
    const tc = tableContainerRef.current;
    const sb = scrollbarRef.current;
    if (!tc || !sb) return;

    // ── Scroll sync ──────────────────────────────────────────────────────────
    const onTableScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      sb.scrollLeft = tc.scrollLeft;
      syncing.current = false;
    };

    const onScrollbarScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      tc.scrollLeft = sb.scrollLeft;
      syncing.current = false;
    };

    tc.addEventListener('scroll', onTableScroll, { passive: true });
    sb.addEventListener('scroll', onScrollbarScroll, { passive: true });

    // ── ResizeObserver ────────────────────────────────────────────────────────
    // Watch both the container and the <table> element so we react to:
    //   - window resize / browser zoom
    //   - new rows loaded (table height/width change)
    //   - column additions
    const ro = new ResizeObserver(updateScrollbarWidth);
    ro.observe(tc);
    const tableEl = tc.querySelector('table');
    if (tableEl) ro.observe(tableEl);
    updateScrollbarWidth();

    // ── Drag-to-scroll ────────────────────────────────────────────────────────
    // We apply the "grab" cursor to document.body during drag so it shows even
    // when the pointer moves over interactive elements (buttons, etc.).
    // We do NOT apply it in resting state to avoid interfering with normal cursors.
    const DRAG_THRESHOLD = 4; // px — below this, treat the event as a click

    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (isInteractiveTarget(e.target, tc)) return;

      isDragging = true;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = tc.scrollLeft;

      // Prevent text selection highlight appearing during drag.
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;

      if (!hasDragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        hasDragged = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      tc.scrollLeft = startScrollLeft - dx;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      if (hasDragged) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        hasDragged = false;
      }
    };

    // mouseup on document (not tc) so drag ends even when pointer drifts outside.
    tc.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      tc.removeEventListener('scroll', onTableScroll);
      sb.removeEventListener('scroll', onScrollbarScroll);
      tc.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      ro.disconnect();
      // Safety: restore body styles if component unmounts mid-drag.
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [updateScrollbarWidth]);

  return { tableContainerRef, scrollbarRef, scrollbarInnerRef };
}
