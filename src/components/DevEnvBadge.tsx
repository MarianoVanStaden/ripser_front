/**
 * Indicador visual de entorno LOCAL.
 *
 * Solo se renderiza cuando la app corre en modo desarrollo (`npm run dev`),
 * es decir `import.meta.env.DEV === true`. En el build de producción
 * (`vite build`) esa condición es `false` y el bundler elimina el componente
 * por completo (dead-code elimination), así que NO aparece en el VPS.
 *
 * Muestra un panel ámbar fijo en la esquina inferior izquierda con:
 *   - etiqueta LOCALHOST + modo de Vite
 *   - host:puerto reales (útil para distinguir 5173 vs 5174)
 *   - rama y commit de git (inyectados en build-time por vite.config.ts)
 *   - destino del backend (proxy de Vite → :8080/RipserApp)
 * Además antepone "[LOCAL] " al título de la pestaña del navegador.
 */
import type { CSSProperties } from 'react'

// Reemplazados en tiempo de compilación por vite.config.ts (`define`).
declare const __GIT_BRANCH__: string
declare const __GIT_COMMIT__: string

export default function DevEnvBadge() {
  if (!import.meta.env.DEV) return null

  // Prefijo en el título de la pestaña (una sola vez; la app no cambia
  // document.title dinámicamente por ruta).
  if (typeof document !== 'undefined' && !document.title.startsWith('[LOCAL]')) {
    document.title = `[LOCAL] ${document.title}`
  }

  const hostPort =
    typeof window !== 'undefined' ? window.location.host : 'localhost'
  const branch = __GIT_BRANCH__
  const commit = __GIT_COMMIT__
  const mode = import.meta.env.MODE

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
  }
  const dim: CSSProperties = { opacity: 0.65 }

  return (
    <div
      title="Entorno LOCAL — backend y base de datos en localhost (no es producción)"
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 2147483647, // por encima de modales/overlays de MUI
        pointerEvents: 'none', // nunca bloquea clicks de la UI
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 10px',
        borderRadius: 8,
        background: 'rgba(17,24,39,0.92)', // gris muy oscuro translúcido
        color: '#fcd34d', // amber 300
        border: '1px solid #f59e0b', // amber 500
        borderLeft: '4px solid #f59e0b',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 11,
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        userSelect: 'none',
        maxWidth: 260,
      }}
    >
      {/* Encabezado: LOCALHOST + modo */}
      <div style={{ ...rowStyle, fontWeight: 700, letterSpacing: 0.5 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#34d399', // emerald 400
            display: 'inline-block',
            boxShadow: '0 0 6px #34d399',
          }}
        />
        LOCALHOST
        <span style={{ ...dim, fontWeight: 400 }}>· {mode}</span>
      </div>

      {/* host:puerto */}
      <div style={rowStyle}>
        <span style={dim}>host</span>
        {hostPort}
      </div>

      {/* rama · commit */}
      <div style={rowStyle}>
        <span style={dim}>git</span>
        {branch}
        {commit && commit !== 'unknown' && (
          <span style={dim}>· {commit}</span>
        )}
      </div>

      {/* destino del backend (proxy de Vite) */}
      <div style={rowStyle}>
        <span style={dim}>api</span>
        → :8080/RipserApp
      </div>
    </div>
  )
}
