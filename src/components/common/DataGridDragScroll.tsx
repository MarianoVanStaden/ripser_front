import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

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
 * Wraps a MUI `<DataGrid>` and adds:
 * 1. **Drag-to-scroll** — click and drag on the rows area to pan horizontally.
 * 2. **Sticky horizontal scrollbar** — a thin scrollbar that sticks to the
 *    bottom of the viewport while the DataGrid is on screen, synced two-way
 *    with the DataGrid's internal `.MuiDataGrid-virtualScroller`.
 */
export const DataGridDragScroll: React.FC<DataGridDragScrollProps> = ({ children, sx }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollbarInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const sb = scrollbarRef.current;
    const sbInner = scrollbarInnerRef.current;
    if (!container || !sb || !sbInner) return;

    // DataGrid renders async — poll briefly until the virtualScroller appears.
    let scroller: HTMLElement | null = null;
    let rafId = 0;
    let settled = false;

    const findScroller = () => {
      scroller = container.querySelector<HTMLElement>('.MuiDataGrid-virtualScroller');
      return scroller;
    };

    const syncing = { current: false };

    const onScrollerScroll = () => {
      if (syncing.current || !scroller) return;
      syncing.current = true;
      sb.scrollLeft = scroller.scrollLeft;
      syncing.current = false;
    };

    const onScrollbarScroll = () => {
      if (syncing.current || !scroller) return;
      syncing.current = true;
      scroller.scrollLeft = sb.scrollLeft;
      syncing.current = false;
    };

    const updateWidth = () => {
      if (!scroller) return;
      // scrollWidth of the virtual scroller reflects the full content width.
      sbInner.style.width = `${scroller.scrollWidth}px`;
    };

    let ro: ResizeObserver | null = null;

    const setup = () => {
      if (!findScroller()) return false;
      settled = true;

      scroller!.addEventListener('scroll', onScrollerScroll, { passive: true });
      sb.addEventListener('scroll', onScrollbarScroll, { passive: true });

      ro = new ResizeObserver(updateWidth);
      ro.observe(scroller!);
      // Also watch the content div to detect column additions / data loads.
      const content = container.querySelector<HTMLElement>('.MuiDataGrid-virtualScrollerContent');
      if (content) ro.observe(content);
      updateWidth();
      return true;
    };

    // Retry until the DataGrid has mounted its scroller (usually within 1 frame).
    const retry = () => {
      if (settled || setup()) return;
      rafId = requestAnimationFrame(retry);
    };
    rafId = requestAnimationFrame(retry);

    // ── Drag-to-scroll ────────────────────────────────────────────────────────
    const DRAG_THRESHOLD = 4;
    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let startScrollLeft = 0;
    let dragScroller: HTMLElement | null = null;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragScroller = container.querySelector('.MuiDataGrid-virtualScroller');
      if (!dragScroller) return;
      if (!dragScroller.contains(e.target as Node)) return;
      if (isInteractiveTarget(e.target, container)) return;

      isDragging = true;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = dragScroller.scrollLeft;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragScroller) return;
      const dx = e.clientX - startX;
      if (!hasDragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        hasDragged = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      dragScroller.scrollLeft = startScrollLeft - dx;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      dragScroller = null;
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
      cancelAnimationFrame(rafId);
      if (scroller) scroller.removeEventListener('scroll', onScrollerScroll);
      sb.removeEventListener('scroll', onScrollbarScroll);
      ro?.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        '& .MuiDataGrid-virtualScroller': { cursor: 'grab' },
        '& .MuiDataGrid-virtualScroller:active': { cursor: 'grabbing' },
        ...sx,
      }}
    >
      {children}

      {/* Sticky phantom scrollbar — stays at bottom of viewport while DataGrid is visible */}
      <Box
        ref={scrollbarRef}
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 5,
          overflowX: 'auto',
          overflowY: 'hidden',
          height: 10,
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
          '&::-webkit-scrollbar': { height: 10 },
          '&::-webkit-scrollbar-track': { bgcolor: 'grey.100' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.400',
            borderRadius: '5px',
            border: '2px solid',
            borderColor: 'grey.100',
            '&:hover': { bgcolor: 'grey.600' },
            '&:active': { bgcolor: 'grey.700' },
          },
          scrollbarColor: 'var(--mui-palette-grey-400) var(--mui-palette-grey-100)',
          scrollbarWidth: 'thin',
        }}
      >
        <Box ref={scrollbarInnerRef} sx={{ height: 1 }} />
      </Box>
    </Box>
  );
};

export default DataGridDragScroll;
