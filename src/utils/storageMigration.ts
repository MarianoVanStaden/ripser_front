/**
 * Storage Migration Utility
 *
 * Migrates tenant context from localStorage to sessionStorage.
 * Run this once when the app initializes to ensure smooth transition.
 */

import { safeLocal, safeSession } from './safeStorage';

export interface MigrationConfig {
  keys: string[];          // Keys to migrate
  removeFromLocal?: boolean; // Remove from localStorage after migration (default: false)
}

export function migrateTenantContext(config?: Partial<MigrationConfig>): void {
  const defaultConfig: MigrationConfig = {
    keys: ['empresaId', 'sucursalId', 'esSuperAdmin', 'sucursalFiltro'],
    removeFromLocal: false, // Keep for safety during transition
  };

  const finalConfig = { ...defaultConfig, ...config };

  console.log('🔄 Starting tenant context migration from localStorage to sessionStorage');

  finalConfig.keys.forEach((key) => {
    const value = safeLocal.getItem(key);

    if (value !== null) {
      // Only migrate if sessionStorage doesn't already have a value
      const existingSessionValue = safeSession.getItem(key);

      if (existingSessionValue === null) {
        safeSession.setItem(key, value);
        console.log(`✅ Migrated ${key}: ${value}`);

        if (finalConfig.removeFromLocal) {
          safeLocal.removeItem(key);
          console.log(`🗑️ Removed ${key} from localStorage`);
        }
      } else {
        console.log(`⏭️ Skipped ${key} - already exists in sessionStorage`);
      }
    }
  });

  console.log('✅ Migration complete');
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  const hasLocalEmpresaId = !!safeLocal.getItem('empresaId');
  const hasSessionEmpresaId = !!safeSession.getItem('empresaId');

  // Migration needed if data exists in localStorage but not in sessionStorage
  return hasLocalEmpresaId && !hasSessionEmpresaId;
}
