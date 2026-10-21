import { useCallback, useState } from 'react';

/** Index + direction state for a slide deck. */
export function useSlides(count: number) {
  const [[index, dir], setPage] = useState<[number, number]>([0, 0]);
  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= count) return;
      setPage(([current]) => [next, next > current ? 1 : -1]);
    },
    [count],
  );
  return { index, dir, go, isLast: index === count - 1, isFirst: index === 0 };
}
