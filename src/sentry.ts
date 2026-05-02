import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const environment = (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined)
  ?? import.meta.env.MODE;
const release = import.meta.env.VITE_SENTRY_RELEASE as string | undefined;

export const sentryEnabled = Boolean(dsn);

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
    sendDefaultPii: false,
    beforeSend(event) {
      if (environment === 'development' && !import.meta.env.VITE_SENTRY_SEND_IN_DEV) {
        return null;
      }
      return event;
    },
  });
}

export { Sentry };

export function captureException(err: unknown) {
  if (sentryEnabled) Sentry.captureException(err);
}

export function setSentryUser(user: { id?: string; username?: string; email?: string } | null) {
  if (sentryEnabled) Sentry.setUser(user);
}

export function setSentryTag(name: string, value: string | undefined) {
  if (!sentryEnabled) return;
  if (value === undefined) Sentry.setTag(name, null);
  else Sentry.setTag(name, value);
}
