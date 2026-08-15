import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

interface TabPanelProps {
  children?: ReactNode;
  value: number;
  index: number;
  /** Prefijo para los ids de accesibilidad (`{prefix}-tabpanel-{i}` / `{prefix}-tab-{i}`). */
  idPrefix?: string;
  /** Padding del contenido. Las páginas migradas usan p:3 (default), pt:3 o pt:2. */
  sx?: SxProps<Theme>;
}

/**
 * Panel de contenido para Tabs de MUI (Etapa 6.4: antes cada página definía
 * el suyo). Solo monta los children de la tab activa.
 */
export default function TabPanel({ children, value, index, idPrefix, sx = { p: 3 } }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={idPrefix ? `${idPrefix}-tabpanel-${index}` : undefined}
      aria-labelledby={idPrefix ? `${idPrefix}-tab-${index}` : undefined}
    >
      {value === index && <Box sx={sx}>{children}</Box>}
    </div>
  );
}
