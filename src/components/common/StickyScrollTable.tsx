import React from 'react';
import { Box, Paper } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

// ─── Sticky column sx helpers ────────────────────────────────────────────────
//
// Usage:
//   <TableCell sx={sxStickyCheckboxHead} padding="checkbox">…</TableCell>
//   <TableCell sx={sxStickyClienteHead}>Cliente</TableCell>
//   …in body rows:
//   <TableCell sx={sxStickyCheckboxBody} padding="checkbox">…</TableCell>
//   <TableCell sx={sxStickyClienteBody}>…</TableCell>
//
// The checkbox column is ~48 px wide (MUI spec for padding="checkbox").
// The "Cliente" column is sticky at left: 48px, immediately after it.
// Both have an opaque background so they paint over scrolling columns.

const CHECKBOX_WIDTH = 48; // px — MUI padding="checkbox"

export const sxStickyCheckboxHead: SxProps<Theme> = {
  position: 'sticky',
  left: 0,
  zIndex: 4,
  bgcolor: 'grey.100',
  width: CHECKBOX_WIDTH,
  minWidth: CHECKBOX_WIDTH,
};

export const sxStickyCheckboxBody: SxProps<Theme> = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  bgcolor: 'background.paper',
  width: CHECKBOX_WIDTH,
  minWidth: CHECKBOX_WIDTH,
  // Mirror TableRow hover/selected so the cell doesn't look detached.
  '.MuiTableRow-root.MuiTableRow-hover:hover &': { bgcolor: 'action.hover' },
  '.MuiTableRow-root.Mui-selected &': { bgcolor: 'action.selected' },
  '.MuiTableRow-root.Mui-selected.MuiTableRow-hover:hover &': { bgcolor: 'action.selected' },
};

export const sxStickyClienteHead: SxProps<Theme> = {
  position: 'sticky',
  left: CHECKBOX_WIDTH,
  zIndex: 4,
  bgcolor: 'grey.100',
  // Right-side shadow to signal that this column is frozen.
  borderRight: '2px solid',
  borderColor: 'divider',
  boxShadow: 'inset -4px 0 6px -4px rgba(0,0,0,0.15)',
};

export const sxStickyClienteBody: SxProps<Theme> = {
  position: 'sticky',
  left: CHECKBOX_WIDTH,
  zIndex: 2,
  bgcolor: 'background.paper',
  borderRight: '2px solid',
  borderColor: 'divider',
  boxShadow: 'inset -4px 0 6px -4px rgba(0,0,0,0.08)',
  // Mirror TableRow hover/selected.
  '.MuiTableRow-root.MuiTableRow-hover:hover &': { bgcolor: 'action.hover' },
  '.MuiTableRow-root.Mui-selected &': { bgcolor: 'action.selected' },
  '.MuiTableRow-root.Mui-selected.MuiTableRow-hover:hover &': { bgcolor: 'action.selected' },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface StickyScrollTableProps {
  /** The <Table> (and any loading states). Pagination goes in `pagination`. */
  children: React.ReactNode;
  /** Rendered below the sticky scrollbar, still inside the Paper. */
  pagination?: React.ReactNode;
  /**
   * Minimum width for the <table> element. Set this to the sum of all column
   * widths so the table never collapses below its design width.
   */
  minWidth?: number;
  sx?: SxProps<Theme>;
}

/**
 * Wrapper that gives any MUI `<Table>` three UX improvements:
 *
 * 1. **Sticky horizontal scrollbar** — always visible at the bottom of the
 *    viewport while the table is on screen; disappears when you scroll past it.
 * 2. **Drag-to-scroll** — click and drag on any empty area to pan horizontally.
 *    Interactive elements (inputs, buttons, checkboxes, links…) are not affected.
 * 3. **Sticky column support** — export `sxStickyCheckboxHead`, `sxStickyCheckboxBody`,
 *    `sxStickyClienteHead`, `sxStickyClienteBody` and apply them to the cells you
 *    want to freeze.
 *
 * The native scrollbar is hidden (CSS). The sticky scrollbar below is a thin
 * phantom div that mirrors the scroll position via `useHorizontalScroll`.
 *
 * @example
 * ```tsx
 * <StickyScrollTable
 *   minWidth={1200}
 *   pagination={<TablePagination … />}
 * >
 *   <Table>
 *     <TableHead>
 *       <TableRow>
 *         <TableCell sx={sxStickyCheckboxHead} padding="checkbox">…</TableCell>
 *         <TableCell sx={sxStickyClienteHead}>Cliente</TableCell>
 *         …
 *       </TableRow>
 *     </TableHead>
 *     …
 *   </Table>
 * </StickyScrollTable>
 * ```
 */
export const StickyScrollTable: React.FC<StickyScrollTableProps> = ({
  children,
  pagination,
  minWidth = 900,
  sx,
}) => {
  const { tableContainerRef, scrollbarRef, scrollbarInnerRef } = useHorizontalScroll();

  return (
    <Paper sx={sx}>
      {/* ── Scrollable table area (native scrollbar hidden) ─────────────── */}
      <Box
        ref={tableContainerRef}
        sx={{
          overflowX: 'auto',
          overflowY: 'visible',
          // Hide the native scrollbar — our sticky one replaces it.
          scrollbarWidth: 'none',           // Firefox
          '&::-webkit-scrollbar': { display: 'none' }, // Chrome / Edge / Safari
          // Ensure the <table> never collapses below design width.
          '& > table, & table': { minWidth },
        }}
      >
        {children}
      </Box>

      {/* ── Sticky phantom scrollbar ─────────────────────────────────────── */}
      {/*
        position: sticky; bottom: 0 means:
        • While the Paper is in the viewport → scrollbar sticks to the bottom of the viewport.
        • When the user scrolls past the Paper → scrollbar leaves with the Paper naturally.
        The Paper must NOT have overflow:hidden for this to work (MUI Paper doesn't).
      */}
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
          // Style the scrollbar thumb/track.
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
          // Firefox
          scrollbarColor: 'var(--mui-palette-grey-400) var(--mui-palette-grey-100)',
          scrollbarWidth: 'thin',
        }}
      >
        {/* Phantom spacer — width is kept in sync with table.scrollWidth by the hook. */}
        <Box ref={scrollbarInnerRef} sx={{ height: 1 }} />
      </Box>

      {/* ── Pagination (outside the scroll area, full-width) ─────────────── */}
      {pagination}
    </Paper>
  );
};
