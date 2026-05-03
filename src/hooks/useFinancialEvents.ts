import { useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import {
  SSE_EVENTS,
  EVENT_QUERY_MAP,
  ALL_SSE_QUERY_KEYS,
  parseSseData,
} from '../lib/sse-contract';

// ---------------------------------------------------------------------------
// Legacy event names — supplemental map during backend migration.
// Remove entries once the backend exclusively emits canonical names.
// ---------------------------------------------------------------------------
const LEGACY_EVENT_QUERY_MAP: Record<string, readonly string[]> = {
  'pago.registrado':              ['prestamos', 'cuentaCorrienteCliente', 'flujoCaja'],
  'flujo-caja.actualizado':       ['flujoCaja'],
  'cuenta-corriente.actualizado': ['cuentaCorrienteCliente'],
  'prestamo.actualizado':         ['prestamos'],
  'cuotas.actualizadas':          ['cuotas'],
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const INVALIDATION_THROTTLE_MS  = 200;    // batch window: coalesce invalidations
const HEALTH_CHECK_INTERVAL_MS  = 15_000; // how often to check for silent connection
// Backend contract: pings every 15–30s.
// Threshold must be > 2× max ping interval to avoid false-positive reconnects.
// At 75s, even a ping delayed to 30s leaves a 45s safety margin.
const PING_TIMEOUT_MS           = 75_000; // reconnect if no events for this long
const MAX_DEDUP_IDS             = 100;    // rolling window for client-side dedup

// HTTP status codes that should NOT be retried (client errors).
// 5xx, 429, and network errors are retriable via the library's built-in back-off.
// 401 is handled separately — we attempt a token refresh before giving up.
const NON_RETRIABLE_STATUS = new Set([400, 403, 404, 410, 422]);

// Exponential back-off for retriable errors (5xx, network failures).
// Delays: 1s → 2s → 4s → 8s → 16s → 30s → 30s → …
const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS  = 30_000;

// ---------------------------------------------------------------------------
// Custom error for fatal (non-retriable) connection failures
// ---------------------------------------------------------------------------
class FatalSSEError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`[SSE] Fatal HTTP ${status} — retries stopped`);
    this.name = 'FatalSSEError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Base URL — mirrors the resolution logic in src/api/config.ts
// ---------------------------------------------------------------------------
const rawBase = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL ?? '');
const BASE_URL = /^https?:\/\//.test(rawBase)
  ? rawBase.replace(/\/$/, '')
  : rawBase;
const SSE_URL = `${BASE_URL}/api/eventos/stream`;

// ---------------------------------------------------------------------------
// Hook — call ONCE in the authenticated layout (Layout.tsx)
// ---------------------------------------------------------------------------
export function useFinancialEvents(): void {
  const { token, refreshSession } = useAuth();
  const { empresaId }             = useTenant();
  const queryClient               = useQueryClient();

  // Incrementing this triggers a clean reconnect from the health check.
  // useState (not a ref) so the useEffect dependency array reacts to it.
  const [reconnectKey, setReconnectKey] = useState(0);

  // Stable refs — mutations do NOT cause re-renders.
  const abortRef         = useRef<AbortController | null>(null);
  const pendingKeysRef   = useRef<Set<string>>(new Set());
  const flushTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedIdsRef  = useRef<Set<string>>(new Set());
  const lastEventTimeRef = useRef<number>(Date.now());
  const healthCheckRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  // Counts consecutive retriable failures — reset to 0 on successful open.
  const retryCountRef    = useRef<number>(0);
  // refreshSession is recreated on every AuthContext render; keep the latest
  // in a ref so the SSE effect's dep array doesn't churn.
  const refreshSessionRef = useRef(refreshSession);
  refreshSessionRef.current = refreshSession;

  // ---------------------------------------------------------------------------
  // Visibility: when the tab regains focus, invalidate all SSE-tracked queries.
  //
  // The library (openWhenHidden: false by default) already pauses the TCP
  // connection while hidden and reconnects on show. This effect ensures that
  // any events missed while hidden are flushed immediately on return.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && token && empresaId) {
        console.log('[SSE] Tab visible — refreshing real-time queries');
        ALL_SSE_QUERY_KEYS.forEach(key =>
          queryClient.invalidateQueries({ queryKey: [key] })
        );
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [token, empresaId, queryClient]);

  // ---------------------------------------------------------------------------
  // Main SSE connection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!token || !empresaId) {
      console.log('[SSE] No token or empresaId — skipping connection');
      return;
    }

    // Cancel any previous connection before opening a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Fresh connection attempt (triggered by auth change or health-check reconnect)
    // — reset the back-off counter so we start at 1s again.
    retryCountRef.current = 0;

    // ---- Health check -------------------------------------------------------
    // Detects "zombie" connections: TCP appears alive but no data flows.
    // Common when intermediate proxies silently drop idle HTTP/1.1 streams.
    lastEventTimeRef.current = Date.now();
    if (healthCheckRef.current) clearInterval(healthCheckRef.current);

    healthCheckRef.current = setInterval(() => {
      const silentMs = Date.now() - lastEventTimeRef.current;
      if (silentMs > PING_TIMEOUT_MS) {
        console.warn(
          `[SSE HEALTH] No events for ${Math.round(silentMs / 1000)}s — forcing reconnect`
        );
        controller.abort();
        setReconnectKey(k => k + 1);
      }
    }, HEALTH_CHECK_INTERVAL_MS);

    // ---- Helpers (defined inside effect for correct queryClient closure) ----

    /**
     * Accumulate query keys and flush them to React Query in a single batch
     * after INVALIDATION_THROTTLE_MS. Prevents event bursts from triggering
     * redundant re-renders for the same query.
     */
    function scheduleInvalidation(keys: readonly string[]): void {
      keys.forEach(k => pendingKeysRef.current.add(k));
      if (flushTimerRef.current !== null) return; // already scheduled

      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        const toFlush = Array.from(pendingKeysRef.current);
        pendingKeysRef.current.clear();
        console.log('[SSE FLUSH] Invalidating queries:', toFlush);
        toFlush.forEach(key =>
          queryClient.invalidateQueries({ queryKey: [key] })
        );
      }, INVALIDATION_THROTTLE_MS);
    }

    /**
     * Client-side deduplication via the SSE event id field.
     * The library already sends Last-Event-ID on reconnect (protocol-level
     * dedup). This is a safety net for servers that re-broadcast after reconnect.
     * Returns true if the event should be skipped.
     */
    function isDuplicate(id: string): boolean {
      if (!id) return false; // no id → can't dedup safely, always process
      if (processedIdsRef.current.has(id)) {
        console.warn('[SSE DEDUP] Duplicate event skipped — id:', id);
        return true;
      }
      processedIdsRef.current.add(id);
      // Rolling window: evict oldest entry to cap memory usage.
      if (processedIdsRef.current.size > MAX_DEDUP_IDS) {
        const oldest = processedIdsRef.current.values().next().value as string;
        processedIdsRef.current.delete(oldest);
      }
      return false;
    }

    // ---- fetchEventSource ---------------------------------------------------
    console.log('[SSE] Connecting to', SSE_URL, '— empresaId:', empresaId);

    fetchEventSource(SSE_URL, {
      method: 'GET',
      headers: {
        Authorization:  `Bearer ${token}`,
        'X-Empresa-Id': String(empresaId),
        Accept:         'text/event-stream',
      },
      signal: controller.signal,
      // openWhenHidden defaults to false — the library manages visibilitychange
      // internally: pauses the stream when hidden, resumes on show.

      onopen: async (response: Response) => {
        if (response.ok) {
          retryCountRef.current = 0; // successful connection — reset back-off
          lastEventTimeRef.current = Date.now();
          console.log('[SSE CONNECTED] empresaId:', empresaId);
          return;
        }
        if (response.status === 401) {
          // Token expired/invalid: try a refresh. On success, setToken in
          // AuthContext re-fires this effect with the new token (fresh
          // connection). On failure, the axios pipeline will redirect to
          // /login on the next API call.
          try {
            await refreshSessionRef.current();
            console.log('[SSE] 401 — token refreshed, reconnecting');
          } catch (err) {
            console.warn('[SSE] 401 — refresh failed, giving up', err);
          }
          throw new FatalSSEError(401);
        }
        if (NON_RETRIABLE_STATUS.has(response.status)) {
          // FatalSSEError propagates to onerror, which re-throws it.
          // The library then calls dispose() + reject() → no more retries.
          throw new FatalSSEError(response.status);
        }
        // Retriable server error (5xx, 429, etc.) — plain Error.
        // onerror will compute and return the back-off delay.
        throw new Error(`[SSE] Server error ${response.status}`);
      },

      onmessage: (ev: { data: string; event: string; id: string }) => {
        lastEventTimeRef.current = Date.now();

        // --- Keep-alive events: update health timer, no business logic -------
        if (ev.event === SSE_EVENTS.PING) return;

        if (ev.event === SSE_EVENTS.CONNECTED) {
          const data = parseSseData(ev.data);
          console.log('[SSE CONNECTED EVENT] payload:', data?.payload);
          return;
        }

        // --- Business events -------------------------------------------------
        console.log('[SSE EVENT]', ev.event, ev.data);

        if (isDuplicate(ev.id)) return;

        // Resolve query keys: canonical contract map first, then legacy map.
        const queryKeys =
          (EVENT_QUERY_MAP as Record<string, readonly string[] | undefined>)[ev.event]
          ?? LEGACY_EVENT_QUERY_MAP[ev.event];

        if (!queryKeys) {
          console.warn('[SSE UNKNOWN EVENT]', ev.event);
          return;
        }

        scheduleInvalidation(queryKeys);
      },

      onclose: () => {
        // The server cleanly closed the stream.
        // fetchEventSource does NOT auto-retry after a clean close.
        console.log('[SSE CLOSED] Connection closed by server');
      },

      onerror: (err: unknown) => {
        if (err instanceof FatalSSEError) {
          // Re-throw → library stops retrying permanently.
          throw err;
        }

        // Exponential back-off: 1s, 2s, 4s, 8s, 16s, 30s, 30s, …
        retryCountRef.current += 1;
        const delay = Math.min(BASE_RETRY_MS * 2 ** (retryCountRef.current - 1), MAX_RETRY_MS);
        console.error(`[SSE ERROR] retry ${retryCountRef.current} in ${delay / 1000}s`, err);

        // Returning a number tells the library to wait exactly that many ms
        // before the next attempt (overrides its own fixed 1s default).
        return delay;
      },
    });

    // ---- Cleanup ------------------------------------------------------------
    return () => {
      console.log('[SSE] Cleanup — aborting connection');
      controller.abort();

      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = null;
      }
      // Cancel pending flush and discard the queue.
      // The next connection will deliver fresh events.
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      pendingKeysRef.current.clear();
    };

    // reconnectKey: incremented by the health check to force a fresh connection.
  }, [token, empresaId, queryClient, reconnectKey]);
}
