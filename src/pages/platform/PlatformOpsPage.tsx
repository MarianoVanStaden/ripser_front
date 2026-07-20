import { useEffect, useState } from 'react';
import { Alert, Box, Tab, Tabs, Typography } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { platformApi } from '../../api/services/platformApi';
import OperacionesTab from './tabs/OperacionesTab';
import InspectorTab from './tabs/InspectorTab';
import ResumenTab from './tabs/ResumenTab';
import SesionesTab from './tabs/SesionesTab';

/**
 * Panel de mantenimiento del SaaS — visible solo para el platform owner
 * (guard de ruta + backend ROLE_PLATFORM_OWNER). Cuatro herramientas:
 * Operaciones destructivas (preview→execute→revert), Inspector read-only,
 * Resumen por empresa y Sesiones (force-logout + impersonación).
 */
export default function PlatformOpsPage() {
  const [tab, setTab] = useState(0);
  const [tablas, setTablas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    platformApi.getTablas()
      .then(setTablas)
      .catch(() => setError('No se pudo cargar la lista de tablas (metadata)'));
  }, []);

  const onError = (msg: string) => { setOk(null); setError(msg); };
  const onOk = (msg: string) => { setError(null); setOk(msg); };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Mantenimiento de plataforma</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Herramientas exclusivas del platform owner. Todo queda registrado en el historial de
        operaciones; las destructivas guardan snapshot para poder revertir.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(null); setOk(null); }} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<BuildIcon />} iconPosition="start" label="Operaciones" />
        <Tab icon={<SearchIcon />} iconPosition="start" label="Inspector" />
        <Tab icon={<AssessmentIcon />} iconPosition="start" label="Resumen" />
        <Tab icon={<ManageAccountsIcon />} iconPosition="start" label="Sesiones" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk(null)}>{ok}</Alert>}

      {tab === 0 && <OperacionesTab tablas={tablas} onError={onError} onOk={onOk} />}
      {tab === 1 && <InspectorTab tablas={tablas} onError={onError} />}
      {tab === 2 && <ResumenTab onError={onError} />}
      {tab === 3 && <SesionesTab onError={onError} onOk={onOk} />}
    </Box>
  );
}
