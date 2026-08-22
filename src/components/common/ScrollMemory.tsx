import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { safeSession } from '../../utils/safeStorage';

/**
 * Restauración de scroll para el router legacy (<Routes> no soporta el
 * <ScrollRestoration> de react-router, que exige data router). Volver de un
 * detalle al listado (botón atrás) recupera la posición; navegar hacia
 * adelante arranca arriba. Solo cubre el scroll del body — contenedores con
 * scroll propio (virtualizer de Leads) quedan fuera.
 */
const ScrollMemory: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const key = `scroll:${location.key}`;
    if (navigationType === 'POP') {
      const saved = safeSession.getItem(key);
      if (saved) window.scrollTo(0, parseInt(saved, 10));
    } else {
      window.scrollTo(0, 0);
    }
    return () => {
      safeSession.setItem(key, String(window.scrollY));
    };
  }, [location.key, navigationType]);

  return null;
};

export default ScrollMemory;
