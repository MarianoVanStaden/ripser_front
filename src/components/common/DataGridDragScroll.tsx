import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Tags / ARIA roles that should NOT trigger drag-to-scroll. We walk up the DOM
 * from the click target so a drag started on a button, link, input, etc. is
 * ignored and the element keeps its normal click behaviour.
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
    // The column resize separator manages its own drag — don't fight it.
    if (el.classList.contains('MuiDataGrid-columnSeparator')) return true;
    el = el.parentElement;
  }
  return false;
}

interface DataGridDragScrollProps {
  /** A single MUI `<DataGrid>` (the wrapper finds its internal scroller). */
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Wraps a MUI `<DataGrid>` and enables click-and-drag horizontal panning over
 * the rows area (the same UX the cobranzas tables have via `StickyScrollTable`,
 * but adapted to DataGrid's internal `.MuiDataGrid-virtualScroller`).
 *
 * - Only starts a drag on the rows area; headers/footer keep normal behaviour.
 * - Skips interactive elements (buttons, links, inputs, column resize handles).
 * - A < 4px movement is treated as a click, so row/button clicks still work.
 *
 * @example
 * <DataGridDragScroll sx={{ width: '100%' }}>
 *   <DataGrid rows={rows} columns={columns} … />
 * </DataGridDragScroll>
 */
export const DataGridDragScroll: React.FC<DataGridDragScrollProps> = ({ children, sx }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const DRAG_THRESHOLD = 4; // px — below this, treat as a click, not a drag.

    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;
    let scroller: HTMLElement | null = null;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Re-query each time: DataGrid may re-create the scroller on data changes.
      scroller = container.querySelector('.MuiDataGrid-virtualScroller');
      if (!scroller) return;
      // Only drag when the press starts inside the scrollable rows area.
      if (!scroller.contains(e.target as Node)) return;
      if (isInteractiveTarget(e.target, container)) return;

      isDragging = true;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = scroller.scrollLeft;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scroller) return;
      const dx = e.clientX - startX;

      if (!hasDragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        hasDragged = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      scroller.scrollLeft = startScrollLeft - dx;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      scroller = null;
      if (hasDragged) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        hasDragged = false;
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Safety: restore body styles if unmounted mid-drag.
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        // Hint that the rows area can be grabbed (DataGrid resets cursor on
        // interactive cells/headers itself).
        '& .MuiDataGrid-virtualScroller': { cursor: 'grab' },
        '& .MuiDataGrid-virtualScroller:active': { cursor: 'grabbing' },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default DataGridDragScroll;
