import { createTheme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Semantic status tokens
// ---------------------------------------------------------------------------
// A token names its ROLE, never its color. Domain states (ENTREGADO, ANULADO,
// EN_GESTION, VENCIDO, ...) map to one of these visual roles via
// `statusRoles.ts` — components must never pick a literal color for a state.
// Every fg/bg pair below is measured against WCAG AA (>= 4.5:1), in BOTH
// schemes. If you change a value, re-measure — do not eyeball it.

export interface StatusTone {
  /** Text/icon color, AA-compliant over `bg`. */
  fg: string;
  /** Soft background (chip/badge/row highlight). */
  bg: string;
}

export interface StatusPalette {
  success: StatusTone;
  warning: StatusTone;
  danger: StatusTone;
  info: StatusTone;
  process: StatusTone;
  neutral: StatusTone;
}

export interface ChartPalette {
  serie1: string;
  serie2: string;
  serie3: string;
  serie4: string;
  serie5: string;
  serie6: string;
  serie7: string;
  serie8: string;
  axis: string;
  grid: string;
  tooltipBg: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    status: StatusPalette;
    charts: ChartPalette;
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    status?: StatusPalette;
    charts?: ChartPalette;
  }
}

// Elevation strategy for dark: shadows are invisible on #121212, so hierarchy
// comes from surface steps + a subtle border instead. Light keeps its shadows.
const DARK_BORDER = '1px solid #343434';

const theme = createTheme({
  cssVariables: {
    // `data` -> attribute selector on <html>: [data-mui-color-scheme="dark"].
    // The inline script in index.html sets the attribute BEFORE first paint
    // (anti-FOUC) using the same storage key the ThemeProvider manages.
    colorSchemeSelector: 'data',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#1976d2',
          light: '#42a5f5',
          dark: '#1565c0',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#dc004e',
          light: '#ff5983',
          dark: '#9a0036',
          contrastText: '#ffffff',
        },
        tertiary: {
          main: '#9c27b0',
          light: '#ba68c8',
          dark: '#7b1fa2',
          contrastText: '#ffffff',
        },
        background: {
          default: '#f5f5f5',
          paper: '#ffffff',
        },
        text: {
          primary: '#212121',
          // #616161 sobre #f5f5f5 ≈ 4.95:1 (pasa WCAG AA); #757575 daba 4.05:1,
          // ilegible con sol directo para el personal de campo.
          secondary: '#616161',
        },
        status: {
          success: { fg: '#2e7d32', bg: '#e8f5e9' }, // 4.56:1
          warning: { fg: '#bf360c', bg: '#fff3e0' }, // 5.11:1
          danger: { fg: '#c62828', bg: '#ffebee' }, // 4.92:1
          info: { fg: '#01579b', bg: '#e3f2fd' }, // 6.48:1
          process: { fg: '#6a1b9a', bg: '#f3e5f5' }, // 7.75:1
          neutral: { fg: '#616161', bg: '#eeeeee' }, // 5.34:1
        },
        charts: {
          serie1: '#1976d2',
          serie2: '#e65100',
          serie3: '#2e7d32',
          serie4: '#7b1fa2',
          serie5: '#c2185b',
          serie6: '#00838f',
          serie7: '#5d4037',
          serie8: '#616161',
          axis: '#757575', // 4.61:1 on #ffffff
          grid: '#e0e0e0',
          tooltipBg: '#ffffff',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#90caf9', // 9.53:1 on paper — usable as text/icon color
          light: '#bbdefb',
          dark: '#42a5f5',
          contrastText: '#0a1929',
        },
        secondary: {
          main: '#f48fb1',
          light: '#f8bbd0',
          dark: '#ec407a',
          contrastText: '#1a0a10',
        },
        tertiary: {
          main: '#ce93d8',
          light: '#e1bee7',
          dark: '#ab47bc',
          contrastText: '#1c0f21',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#e6e6e6', // 13.4:1 on paper
          // 7.95:1 on paper — deliberately above AA for the same field-work
          // legibility reason as #616161 in light mode.
          secondary: '#b3b3b3',
        },
        status: {
          success: { fg: '#81c784', bg: '#16281a' }, // 7.72:1
          warning: { fg: '#ffb74d', bg: '#332411' }, // 8.66:1
          danger: { fg: '#ef9a9a', bg: '#331a1a' }, // 7.49:1
          info: { fg: '#64b5f6', bg: '#12253a' }, // 7.02:1
          process: { fg: '#ce93d8', bg: '#2a1a33' }, // 6.79:1
          neutral: { fg: '#bdbdbd', bg: '#2c2c2c' }, // 7.43:1
        },
        charts: {
          serie1: '#64b5f6',
          serie2: '#ffb74d',
          serie3: '#81c784',
          serie4: '#ce93d8',
          serie5: '#f48fb1',
          serie6: '#4dd0e1',
          serie7: '#bcaaa4',
          serie8: '#bdbdbd',
          axis: '#9e9e9e', // 6.99:1 on #121212
          grid: '#333333',
          tooltipBg: '#2c2c2c',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: ({ theme }) => ({
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.16)',
          },
          ...theme.applyStyles('dark', {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
          ...theme.applyStyles('dark', {
            boxShadow: 'none',
            border: DARK_BORDER,
            '&:hover': { boxShadow: 'none' },
          }),
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: ({ theme }) => ({
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          ...theme.applyStyles('dark', { boxShadow: 'none' }),
        }),
        elevation2: ({ theme }) => ({
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          ...theme.applyStyles('dark', { boxShadow: 'none' }),
        }),
        elevation3: ({ theme }) => ({
          boxShadow: '0 3px 9px rgba(0,0,0,0.12)',
          ...theme.applyStyles('dark', { boxShadow: 'none' }),
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          ...theme.applyStyles('dark', {
            boxShadow: 'none',
            borderBottom: DARK_BORDER,
          }),
        }),
      },
    },
  },
});

export default theme;
