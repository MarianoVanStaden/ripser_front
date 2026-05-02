import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type FilterKind = 'string' | 'number' | 'boolean' | 'string[]' | 'number[]';

export type FilterSchema = Record<string, FilterKind>;

type ValueOf<K extends FilterKind> =
  K extends 'string' ? string | undefined :
  K extends 'number' ? number | undefined :
  K extends 'boolean' ? boolean | undefined :
  K extends 'string[]' ? string[] :
  K extends 'number[]' ? number[] :
  never;

export type FiltersOf<S extends FilterSchema> = {
  [K in keyof S]: ValueOf<S[K]>;
};

const isEmpty = (kind: FilterKind, value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (kind === 'string' && value === '') return true;
  if ((kind === 'string[]' || kind === 'number[]') && Array.isArray(value) && value.length === 0) return true;
  return false;
};

const decode = (kind: FilterKind, raw: string | null): unknown => {
  if (raw === null || raw === '') {
    return kind === 'string[]' || kind === 'number[]' ? [] : undefined;
  }
  switch (kind) {
    case 'string':
      return raw;
    case 'number': {
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    case 'boolean':
      return raw === 'true';
    case 'string[]':
      return raw.split(',').filter(Boolean);
    case 'number[]':
      return raw
        .split(',')
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
  }
};

const encode = (kind: FilterKind, value: unknown): string | null => {
  if (isEmpty(kind, value)) return null;
  switch (kind) {
    case 'string':
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'string[]':
      return (value as string[]).join(',');
    case 'number[]':
      return (value as number[]).join(',');
  }
};

/**
 * Mirrors a typed filters object to/from URL search params.
 *
 * - Reads on every render (params are the source of truth).
 * - `setFilters` writes with `replace: true` so filter tweaks don't inflate history.
 * - Empty/undefined values remove the key from the URL — keeps URLs tidy.
 * - Arrays serialize as CSV (`?estados=NUEVA,EN_GESTION`) for readability.
 *
 * Defaults are merged into the result: a key absent from the URL falls back to
 * its default. Setting a value equal to the default still writes it (callers
 * who want "default = absent" can pass `undefined` instead).
 */
export function useUrlFilters<S extends FilterSchema>(
  schema: S,
  defaults: Partial<FiltersOf<S>> = {}
): {
  filters: FiltersOf<S>;
  setFilter: <K extends keyof S>(key: K, value: FiltersOf<S>[K]) => void;
  setFilters: (partial: Partial<FiltersOf<S>>) => void;
  resetFilters: () => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const out = {} as FiltersOf<S>;
    (Object.keys(schema) as (keyof S)[]).forEach((key) => {
      const kind = schema[key];
      const raw = searchParams.get(key as string);
      const decoded = decode(kind, raw);
      const fallback = defaults[key];
      const useDefault = isEmpty(kind, decoded);
      (out[key] as unknown) = useDefault
        ? (fallback !== undefined ? fallback : decoded)
        : decoded;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const writePartial = useCallback(
    (partial: Partial<FiltersOf<S>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          (Object.keys(partial) as (keyof S)[]).forEach((key) => {
            const kind = schema[key];
            if (!kind) return;
            const encoded = encode(kind, partial[key]);
            if (encoded === null) {
              next.delete(key as string);
            } else {
              next.set(key as string, encoded);
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchParams]
  );

  const setFilter = useCallback(
    <K extends keyof S>(key: K, value: FiltersOf<S>[K]) => {
      writePartial({ [key]: value } as unknown as Partial<FiltersOf<S>>);
    },
    [writePartial]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        (Object.keys(schema) as (keyof S)[]).forEach((key) => next.delete(key as string));
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchParams]);

  return { filters, setFilter, setFilters: writePartial, resetFilters };
}
