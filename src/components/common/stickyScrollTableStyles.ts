import type { SxProps, Theme } from '@mui/material';

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
  '.MuiTableRow-root.MuiTableRow-hover:hover &': { bgcolor: 'action.hover' },
  '.MuiTableRow-root.Mui-selected &': { bgcolor: 'action.selected' },
  '.MuiTableRow-root.Mui-selected.MuiTableRow-hover:hover &': { bgcolor: 'action.selected' },
};

export const sxStickyClienteHead: SxProps<Theme> = {
  position: 'sticky',
  left: CHECKBOX_WIDTH,
  zIndex: 4,
  bgcolor: 'grey.100',
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
  '.MuiTableRow-root.MuiTableRow-hover:hover &': { bgcolor: 'action.hover' },
  '.MuiTableRow-root.Mui-selected &': { bgcolor: 'action.selected' },
  '.MuiTableRow-root.Mui-selected.MuiTableRow-hover:hover &': { bgcolor: 'action.selected' },
};
