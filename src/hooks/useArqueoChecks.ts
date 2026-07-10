import { useCallback, useEffect, useState } from 'react';

function storageKey(cajaId: number) {
  return `arqueo_checks_caja_${cajaId}`;
}

function loadFromStorage(cajaId: number): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(cajaId));
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as number[];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function useArqueoChecks(cajaId: number) {
  const [checkedIds, setCheckedIds] = useState<Set<number>>(() => loadFromStorage(cajaId));

  useEffect(() => {
    setCheckedIds(loadFromStorage(cajaId));
  }, [cajaId]);

  const toggle = useCallback(
    (id: number) => {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        localStorage.setItem(storageKey(cajaId), JSON.stringify([...next]));
        return next;
      });
    },
    [cajaId]
  );

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey(cajaId));
    setCheckedIds(new Set());
  }, [cajaId]);

  const isChecked = useCallback((id: number) => checkedIds.has(id), [checkedIds]);

  return { checkedIds, toggle, clear, isChecked };
}
