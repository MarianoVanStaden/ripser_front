import './sentry'  // init early so SDK captures boot-time errors
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import DevEnvBadge from './components/DevEnvBadge.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Personal de campo en 3G: dos reintentos con backoff antes de rendirse.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      // Offline: servir cache si hay y reintentar al volver la señal, en vez
      // de dejar la query 'paused' sin feedback (default 'online').
      networkMode: 'offlineFirst',
      // SSE push invalidates queries in real time — no polling needed.
      staleTime: 5 * 60 * 1000,   // 5 min: data is fresh until SSE invalidates it
      refetchInterval: false,      // no background polling
      refetchOnWindowFocus: false, // SSE keeps data fresh; window focus refetch adds noise
    },
    mutations: {
      // NUNCA reintentar mutaciones automáticamente: tocan dinero/stock y un
      // reintento tras timeout ambiguo puede duplicar la operación.
      retry: 0,
      networkMode: 'online',
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <DevEnvBadge />
    </QueryClientProvider>
  </StrictMode>,
)
