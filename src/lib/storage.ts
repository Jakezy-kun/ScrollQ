/**
 * Safe wrappers around localStorage. Storage can throw (private mode, quota, blocked site data)
 * or hold stale/malformed data; none of that may crash the app, so every access is guarded.
 */

const PREFIX = 'scrollq:';

export type Guard<T> = (value: unknown) => value is T;

function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Read a JSON value. Returns `fallback` when missing, unreadable, malformed or failing `guard`. */
export function readJSON<T>(key: string, fallback: T, guard?: Guard<T>): T {
  try {
    const raw = store()?.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (guard && !guard(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** Write a JSON value. Returns false if storage is unavailable or full. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    const s = store();
    if (!s) return false;
    s.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    store()?.removeItem(PREFIX + key);
  } catch {
    // Ignore: nothing to clean up if storage is unavailable.
  }
}

/** A string key/value store that never throws, for zustand's `persist` middleware. */
export interface SafeStringStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export function safeStringStorage(kind: 'local' | 'session'): SafeStringStorage {
  const get = (): Storage | null => {
    try {
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };
  return {
    getItem: (name) => {
      try {
        return get()?.getItem(PREFIX + name) ?? null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        get()?.setItem(PREFIX + name, value);
      } catch {
        // Full or blocked storage: keep running in memory.
      }
    },
    removeItem: (name) => {
      try {
        get()?.removeItem(PREFIX + name);
      } catch {
        // Ignore.
      }
    },
  };
}

export const isBoolean: Guard<boolean> = (v): v is boolean => typeof v === 'boolean';
export const isString: Guard<string> = (v): v is string => typeof v === 'string';
