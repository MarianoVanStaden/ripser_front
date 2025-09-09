// Deprecated standalone instance. Re-export the configured instance from config.ts
// to ensure consistent auth (token + refresh) behavior across legacy imports.
export { default } from './config';