import { Button, Snackbar } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Aviso de versión nueva del service worker (registerType: 'prompt').
 * El SW nuevo queda en waiting hasta que el usuario acepta — nunca se
 * recarga la app sola en medio de un formulario.
 */
const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <Snackbar
      open={needRefresh}
      message="Hay una versión nueva de Ripser"
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      action={
        <>
          <Button color="inherit" size="small" onClick={() => setNeedRefresh(false)}>
            Después
          </Button>
          <Button color="secondary" size="small" onClick={() => updateServiceWorker(true)}>
            Actualizar
          </Button>
        </>
      }
    />
  );
};

export default ReloadPrompt;
