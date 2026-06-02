import { lazy, Suspense, useState } from 'react';
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';

// Las tres páginas que se unifican siguen montadas en sus rutas originales
// (/admin/especificaciones-tecnicas, /admin/medidas, /admin/colores). Acá
// las re-componemos en tabs para reducir entradas en el sidebar. Lazy load
// para no traer las tres a la vez si el usuario sólo entra a una.
const EspecificacionesTecnicasPage = lazy(() => import('../../components/Admin/EspecificacionesTecnicasPage'));
const MedidasPage = lazy(() => import('../../components/Admin/MedidasPage'));
const ColoresPage = lazy(() => import('../../components/Admin/ColoresPage'));
const ModeloCodigoEquipoPage = lazy(() => import('../../components/Admin/ModeloCodigoEquipoPage'));

type TabKey = 'fichas' | 'medidas' | 'colores' | 'codigos';

const TAB_DEFS: Array<{ key: TabKey; label: string }> = [
  { key: 'fichas', label: 'Fichas técnicas' },
  { key: 'medidas', label: 'Medidas' },
  { key: 'colores', label: 'Colores' },
  { key: 'codigos', label: 'Códigos de venta' },
];

export default function CatalogosEquiposPage() {
  const [tab, setTab] = useState<TabKey>('fichas');

  return (
    <Box>
      <Box sx={{ px: 3, pt: 3, pb: 0 }}>
        <Typography variant="h5" fontWeight={700}>Catálogos de Equipos</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fichas técnicas por modelo, catálogo de medidas y catálogo de colores.
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
        {tab === 'fichas' && <EspecificacionesTecnicasPage />}
        {tab === 'medidas' && <MedidasPage />}
        {tab === 'colores' && <ColoresPage />}
        {tab === 'codigos' && <ModeloCodigoEquipoPage />}
      </Suspense>
    </Box>
  );
}
