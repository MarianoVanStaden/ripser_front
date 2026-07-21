import type { PlatformImpersonateResponse } from '../api/services/platformApi';
import { safeLocal, safeSession } from './safeStorage';

/**
 * Impersonación del platform owner: intercambia la sesión actual (owner) por la
 * del usuario objetivo usando el token corto que emite el backend, con backup
 * completo para volver sin re-login. El backend audita cada impersonación en
 * platform_ops_log y el token expira a los 15 minutos (sin refresh).
 */

const BACKUP_KEY = 'impersonation_backup';
const INFO_KEY = 'impersonation_info';

export interface ImpersonationInfo {
  nombre: string;
  username: string;
  empresa: string | null;
  expiresAt: string;
}

interface ImpersonationBackup {
  ownerToken: string;
  ownerRefreshToken: string | null;
  ownerUser: string | null;
  ownerEmpresaId: string | null;
  ownerSucursalId: string | null;
  ownerEsSuperAdmin: string | null;
  ownerEsPlatformOwner: string | null;
}

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
};

export const getImpersonationInfo = (): ImpersonationInfo | null => {
  const raw = safeSession.getItem(INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationInfo;
  } catch {
    return null;
  }
};

export const isImpersonating = (): boolean => safeSession.getItem(BACKUP_KEY) != null;

/** Backup del owner + swap de sesión al usuario objetivo. Recarga la app entera. */
export const startImpersonation = (res: PlatformImpersonateResponse): void => {
  const ownerToken = safeLocal.getItem('auth_token');
  if (!ownerToken) throw new Error('No hay sesión de owner activa');

  const backup: ImpersonationBackup = {
    ownerToken,
    ownerRefreshToken: safeLocal.getItem('auth_refresh_token'),
    ownerUser: safeLocal.getItem('auth_user'),
    ownerEmpresaId: safeSession.getItem('empresaId'),
    ownerSucursalId: safeSession.getItem('sucursalId'),
    ownerEsSuperAdmin: safeSession.getItem('esSuperAdmin'),
    ownerEsPlatformOwner: safeSession.getItem('esPlatformOwner'),
  };
  safeSession.setItem(BACKUP_KEY, JSON.stringify(backup));

  const info: ImpersonationInfo = {
    nombre: res.usuario.nombre || res.usuario.username,
    username: res.usuario.username,
    empresa: res.empresa?.nombre ?? null,
    expiresAt: res.expiresAt,
  };
  safeSession.setItem(INFO_KEY, JSON.stringify(info));

  // Sesión del impersonado: sin refresh token (el token corto no se renueva).
  const claims = decodeJwtPayload(res.token);
  const roles = Array.isArray(claims.roles)
    ? (claims.roles as string[]).map((r) => r.replace(/^ROLE_/, ''))
    : [];
  const impersonatedUser = {
    id: res.usuario.id,
    username: res.usuario.username,
    nombre: res.usuario.nombre,
    roles,
    esSuperAdmin: claims.esSuperAdmin === true,
    esPlatformOwner: false,
    empresaId: res.empresa?.id ?? undefined,
  };
  safeLocal.setItem('auth_token', res.token);
  safeLocal.removeItem('auth_refresh_token');
  safeLocal.setItem('auth_user', JSON.stringify(impersonatedUser));
  if (res.empresa?.id != null) {
    safeSession.setItem('empresaId', String(res.empresa.id));
  } else {
    safeSession.removeItem('empresaId');
  }
  if (claims.sucursalId != null) {
    safeSession.setItem('sucursalId', String(claims.sucursalId));
  } else {
    safeSession.removeItem('sucursalId');
  }
  safeSession.setItem('esSuperAdmin', String(claims.esSuperAdmin === true));
  safeSession.setItem('esPlatformOwner', 'false');
  safeSession.removeItem('sucursalFiltro');

  // Reload completo: AuthContext y TenantContext se rehidratan desde el storage,
  // sin estados a medias.
  window.location.href = '/';
};

/** Restaura la sesión del owner desde el backup y recarga en el panel de plataforma. */
export const exitImpersonation = (): void => {
  const raw = safeSession.getItem(BACKUP_KEY);
  safeSession.removeItem(BACKUP_KEY);
  safeSession.removeItem(INFO_KEY);
  if (!raw) {
    window.location.href = '/login';
    return;
  }
  const backup = JSON.parse(raw) as ImpersonationBackup;

  safeLocal.setItem('auth_token', backup.ownerToken);
  if (backup.ownerRefreshToken) safeLocal.setItem('auth_refresh_token', backup.ownerRefreshToken);
  else safeLocal.removeItem('auth_refresh_token');
  if (backup.ownerUser) safeLocal.setItem('auth_user', backup.ownerUser);
  const restore = (key: string, value: string | null) => {
    if (value != null) safeSession.setItem(key, value);
    else safeSession.removeItem(key);
  };
  restore('empresaId', backup.ownerEmpresaId);
  restore('sucursalId', backup.ownerSucursalId);
  restore('esSuperAdmin', backup.ownerEsSuperAdmin);
  restore('esPlatformOwner', backup.ownerEsPlatformOwner);

  window.location.href = '/platform/ops';
};
