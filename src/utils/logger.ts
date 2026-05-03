// FRONT-005: canal explícito para logs.
//
// - log/info/debug → solo en DEV. Vite reemplaza `import.meta.env.DEV` por
//   `false` en el build de prod; esbuild's DCE elimina la rama, dejando
//   las funciones como no-op vacíos en el bundle. Defensa en profundidad
//   sobre el `esbuild.pure` configurado en vite.config.ts.
// - warn/error → siempre. En prod los captura Sentry vía la integración
//   de consola; en DEV salen a la consola del browser.
//
// Para nuevos logs de diagnóstico, importar logger en lugar de console.

const isDev = import.meta.env.DEV;

type LogArgs = unknown[];

export const logger = {
  log: (...args: LogArgs): void => {
    if (isDev) console.log(...args);
  },
  info: (...args: LogArgs): void => {
    if (isDev) console.info(...args);
  },
  debug: (...args: LogArgs): void => {
    if (isDev) console.debug(...args);
  },
  warn: (...args: LogArgs): void => {
    console.warn(...args);
  },
  error: (...args: LogArgs): void => {
    console.error(...args);
  },
};

export default logger;
