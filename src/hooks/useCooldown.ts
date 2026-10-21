import { useCallback, useEffect, useState } from 'react';

/** A countdown in whole seconds, e.g. to rate-limit "Resend email". */
export function useCooldown(seconds: number) {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= now) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [until, now]);

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setUntil(t + seconds * 1000);
  }, [seconds]);

  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  return { remaining, active: remaining > 0, start };
}
