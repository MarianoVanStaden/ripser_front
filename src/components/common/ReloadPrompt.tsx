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

  // El register.js del plugin solo recarga si event.isUpdate === true; cuando
  // el SW ya estaba en waiting al abrir la app (prompt ignorado en una sesión
  // anterior) o el update vino de otra pestaña, isUpdate es false: el SW se
  // activaba pero la página no recargaba y el botón parecía no hacer nada.
  // Recargamos nosotros cuando el SW nuevo toma control, con fallback por si
  // nunca lo toma (en ese caso recarga con la versión actual, sin daño).
  const handleActualizar = () => {
    let reloaded = false;
    const reload = () => {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true });
    setTimeout(reload, 3000);
    void updateServiceWorker(true);
  };

  return (
    <Snackbar
      open={needRefresh}
      message="Hay una versión nueva de Ripser App"
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      action={
        <>
          <Button color="inherit" size="small" onClick={() => setNeedRefresh(false)}>
            Después
          </Button>
          <Button color="secondary" size="small" onClick={handleActualizar}>
            Actualizar
          </Button>
        </>
      }
    />
  );
};

export default ReloadPrompt;
