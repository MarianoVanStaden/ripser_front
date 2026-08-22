import { Alert, Collapse } from '@mui/material';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Banner global de sin conexión. navigator.onLine puede dar falsos
 * positivos (hay red pero no internet), nunca falsos negativos: si dice
 * offline, es seguro avisar.
 */
const OfflineBanner: React.FC = () => {
  const online = useOnlineStatus();
  return (
    <Collapse in={!online}>
      <Alert severity="warning" sx={{ borderRadius: 0 }}>
        Sin conexión — los datos que cargues no se enviarán hasta recuperar señal.
      </Alert>
    </Collapse>
  );
};

export default OfflineBanner;
