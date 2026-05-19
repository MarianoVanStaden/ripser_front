import { lazy, Suspense, useState } from 'react';
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';

// Las páginas siguen accesibles en sus rutas originales (/admin/ofertas y
// /admin/importador-precios). Acá las re-componemos en tabs para reducir
// entradas en el sidebar.
const OfertasPrecioPage = lazy(() => import('./OfertasPrecioPage'));
const ImportadorPreciosPage = lazy(() => import('./ImportadorPreciosPage'));

type TabKey = 'ofertas' | 'importador';

const TAB_DEFS: Array<{ key: TabKey; label: string }> = [
  { key: 'ofertas', label: 'Ofertas Mensuales' },
  { key: 'importador', label: 'Importador de Precios' },
];

export default function PreciosOfertasPage() {
  const [tab, setTab] = useState<TabKey>('ofertas');

  return (
    <Box>
      <Box sx={{ px: 3, pt: 3, pb: 0 }}>
        <Typography variant="h5" fontWeight={700}>Precios y Ofertas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Gestión de ofertas mensuales y carga masiva de precios desde listados externos.
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as TabKey)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {TAB_DEFS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>}>
        {tab === 'ofertas' && <OfertasPrecioPage />}
        {tab === 'importador' && <ImportadorPreciosPage />}
      </Suspense>
    </Box>
  );
}
