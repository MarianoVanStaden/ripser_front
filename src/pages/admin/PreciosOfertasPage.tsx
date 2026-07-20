import { lazy, Suspense, useMemo, useState } from 'react';
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Las páginas siguen accesibles en sus rutas originales (/admin/ofertas y
// /admin/importador-precios). Acá las re-componemos en tabs para reducir
// entradas en el sidebar.
const OfertasPrecioPage = lazy(() => import('./OfertasPrecioPage'));
const ImportadorPreciosPage = lazy(() => import('./ImportadorPreciosPage'));
const CostosEnvioPage = lazy(() => import('./CostosEnvioPage'));
const PreciosEquiposPage = lazy(() => import('./PreciosEquiposPage'));

type TabKey = 'precios-equipos' | 'ofertas' | 'importador' | 'costos-envio';

// Cambiar precios de equipos es solo para admins (el backend rechaza igual con 403);
// COORDINADORA_COMPRAS/LOGISTICA ven la página pero no esta tab.
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_EMPRESA_LIMITADO'];

export default function PreciosOfertasPage() {
  const { user, esSuperAdmin } = useAuth();

  const puedeGestionarPrecios = useMemo(
    () => esSuperAdmin || (user?.roles ?? []).some((r) => ADMIN_ROLES.includes(r)),
    [user, esSuperAdmin]
  );

  const tabDefs: Array<{ key: TabKey; label: string }> = useMemo(
    () => [
      ...(puedeGestionarPrecios
        ? [{ key: 'precios-equipos' as TabKey, label: 'Precios de Equipos' }]
        : []),
      { key: 'ofertas', label: 'Ofertas Mensuales' },
      { key: 'importador', label: 'Importador de Precios' },
      { key: 'costos-envio', label: 'Costos de Envío' },
    ],
    [puedeGestionarPrecios]
  );

  const [tab, setTab] = useState<TabKey>(puedeGestionarPrecios ? 'precios-equipos' : 'ofertas');

  return (
    <Box>
      <Box sx={{ px: 3, pt: 3, pb: 0 }}>
        <Typography variant="h5" fontWeight={700}>Precios y Ofertas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Gestión de precios de equipos, ofertas mensuales y carga masiva de precios desde listados externos.
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as TabKey)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabDefs.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>

      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>}>
        {tab === 'precios-equipos' && puedeGestionarPrecios && <PreciosEquiposPage />}
        {tab === 'ofertas' && <OfertasPrecioPage />}
        {tab === 'importador' && <ImportadorPreciosPage />}
        {tab === 'costos-envio' && <CostosEnvioPage />}
      </Suspense>
    </Box>
  );
}
