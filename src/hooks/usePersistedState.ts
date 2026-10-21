import { useCallback, useState } from 'react';
import type { Guard } from '@/lib/storage';
import { readJSON, writeJSON } from '@/lib/storage';

type SetValue<T> = (next: T | ((prev: T) => T)) => void;

/** useState that is saved to localStorage. Falls back to in-memory state if storage fails. */
export function usePersistedState<T>(key: string, initial: T, guard?: Guard<T>): [T, SetValue<T>] {
  const [value, setValue] = useState<T>(() => readJSON(key, initial, guard));

  const set = useCallback<SetValue<T>>(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
