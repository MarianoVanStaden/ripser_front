import React, { lazy, Suspense, useState } from 'react';
import { Box, Tabs, Tab, CircularProgress } from '@mui/material';
import { usePermisos } from '../../hooks/usePermisos';

// Las dos vistas conviven bajo un selector de Tabs. Se cargan lazy para
// preservar el code-split: solo se baja el bundle del tab activo.
const CrearNotaCredito = lazy(() => import('./NotasCreditoPage'));
const Anulaciones = lazy(() => import('./AnulacionesPage'));

type TabValue = 'crear' | 'anulaciones';

const NotasCreditoContainer: React.FC = () => {
  const { tieneRol } = usePermisos();

  // VENDEDOR no puede crear NC (bloqueado también en backend); solo ve el
  // reporte de Anulaciones. El resto (ADMIN-like) ve ambos tabs.
  const puedeCrear = !tieneRol('VENDEDOR');

  const [tab, setTab] = useState<TabValue>(puedeCrear ? 'crear' : 'anulaciones');

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_e, value: TabValue) => setTab(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        {puedeCrear && <Tab label="Crear Nota de Crédito" value="crear" />}
        <Tab label="Anulaciones" value="anulaciones" />
      </Tabs>

      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        }
      >
        {tab === 'crear' && puedeCrear ? <CrearNotaCredito /> : <Anulaciones />}
      </Suspense>
    </Box>
  );
};

export default NotasCreditoContainer;
