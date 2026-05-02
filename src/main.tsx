import './sentry'  // init early so SDK captures boot-time errors
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // SSE push invalidates queries in real time — no polling needed.
      staleTime: 5 * 60 * 1000,   // 5 min: data is fresh until SSE invalidates it
      refetchInterval: false,      // no background polling
      refetchOnWindowFocus: false, // SSE keeps data fresh; window focus refetch adds noise
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
