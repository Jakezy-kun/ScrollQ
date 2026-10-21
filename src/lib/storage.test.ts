import { act, renderHook } from '@testing-library/react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { isBoolean, readJSON, removeKey, writeJSON } from './storage';

describe('storage', () => {
  it('round-trips JSON under a namespaced key', () => {
    expect(writeJSON('feedStyle', 'gallery')).toBe(true);
    expect(window.localStorage.getItem('scrollq:feedStyle')).toBe('"gallery"');
    expect(readJSON('feedStyle', 'vertical')).toBe('gallery');
    removeKey('feedStyle');
    expect(readJSON('feedStyle', 'vertical')).toBe('vertical');
  });

  it('falls back on malformed or wrongly typed data', () => {
    window.localStorage.setItem('scrollq:broken', '{not json');
    expect(readJSON('broken', 42)).toBe(42);
    window.localStorage.setItem('scrollq:flag', '"yes"');
    expect(readJSON('flag', false, isBoolean)).toBe(false);
  });

  it('never throws when storage itself throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readJSON('x', 'fallback')).toBe('fallback');
    expect(writeJSON('x', 1)).toBe(false);
    expect(() => removeKey('x')).not.toThrow();
  });
});

describe('usePersistedState', () => {
  it('persists updates and restores them', () => {
    const { result, unmount } = renderHook(() => usePersistedState('sound', true, isBoolean));
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    unmount();
    const { result: again } = renderHook(() => usePersistedState('sound', true, isBoolean));
    expect(again.current[0]).toBe(false);
  });

  it('keeps working in memory when storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => usePersistedState('count', 0));
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(1);
  });
});
