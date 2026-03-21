import { useEffect, useRef, useState } from 'react';

interface UseSmartRefreshOptions {
  /** Callback to fire when auto-refresh triggers. Should be stable (e.g. from useQuery). */
  onRefetch: () => void;
  /** Milliseconds between auto-refreshes while user is idle. Default: 60_000. */
  intervalMs?: number;
  /** Pass true when a modal or form is open to suppress auto-refresh. */
  hasOpenModal?: boolean;
}

/**
 * Auto-refreshes data only when the user is idle (no mouse/keyboard for 30s)
 * and no modal is open. Safe to use in financial screens.
 */
export function useSmartRefresh({
  onRefetch,
  intervalMs = 60_000,
  hasOpenModal = false,
}: UseSmartRefreshOptions): { isIdle: boolean } {
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep onRefetch stable via ref so interval doesn't recreate on every render
  const onRefetchRef = useRef(onRefetch);
  onRefetchRef.current = onRefetch;

  // Idle detection: reset on any user interaction
  useEffect(() => {
    const IDLE_MS = 30_000;

    const resetIdle = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle(); // start timer immediately

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Auto-refresh interval: only when idle AND no modal open
  useEffect(() => {
    if (!isIdle || hasOpenModal) return;

    const interval = setInterval(() => onRefetchRef.current(), intervalMs);
    return () => clearInterval(interval);
  }, [isIdle, hasOpenModal, intervalMs]);

  return { isIdle };
}

/**
 * Formats a React Query `dataUpdatedAt` timestamp as a human-readable string.
 * Call inside a component that has a periodic re-render (e.g. every 10s).
 */
export function formatLastUpdated(dataUpdatedAt: number): string {
  if (!dataUpdatedAt) return '';
  const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
  if (seconds < 5) return 'ahora';
  if (seconds < 60) return `hace ${seconds} seg`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return 'hace 1 min';
  return `hace ${minutes} min`;
}
