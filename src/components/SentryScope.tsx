import { useEffect } from 'react';
import { sentryEnabled, setSentryUser, setSentryTag } from '../sentry';
import { useAuth } from '../context/AuthContext';

const SentryScope: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!sentryEnabled) return;
    if (!user) {
      setSentryUser(null);
      setSentryTag('empresa_id', undefined);
      setSentryTag('sucursal_id', undefined);
      setSentryTag('super_admin', undefined);
      return;
    }
    setSentryUser({
      id: user.id?.toString(),
      username: user.username,
      email: user.email,
    });
    setSentryTag('super_admin', user.esSuperAdmin ? 'true' : 'false');
  }, [user]);

  useEffect(() => {
    if (!sentryEnabled) return;
    const sync = () => {
      setSentryTag('empresa_id', sessionStorage.getItem('empresaId') ?? undefined);
      setSentryTag('sucursal_id', sessionStorage.getItem('sucursalId') ?? undefined);
    };
    sync();
    window.addEventListener('tenant-context-updated', sync);
    return () => window.removeEventListener('tenant-context-updated', sync);
  }, []);

  return null;
};

export default SentryScope;
