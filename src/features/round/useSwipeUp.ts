import type { PointerEvent, RefObject } from 'react';
import { useRef } from 'react';

/** Travel (px) that always counts as a swipe. */
const SWIPE_DISTANCE = 80;
/** A quick flick counts with less travel: at least this far (px) at this speed (px/ms). */
const FLICK_DISTANCE = 30;
const FLICK_SPEED = 0.5;
/** Sideways travel (px) that cancels the gesture, so horizontal drags never skip. */
const SIDEWAYS_SLOP = 12;
/** How much of the finger's travel the feed follows while dragging. */
const FOLLOW = 0.35;

/**
 * Swipe up on a touch screen, like a short-video app. While the finger is down the element
 * follows it a little (transform set directly, so no re-renders), and springs back on release.
 * Mouse pointers are ignored; keyboard and the Skip button cover those.
 *
 * Pass `onSwipe: null` to switch it off (e.g. while a sheet is open).
 */
export function useSwipeUp<T extends HTMLElement>(
  ref: RefObject<T>,
  onSwipe: (() => void) | null,
  follow: boolean,
) {
  const start = useRef<{ id: number; x: number; y: number; t: number } | null>(null);

  const move = (dy: number) => {
    const el = ref.current;
    if (!el || !follow) return;
    el.style.transition = dy === 0 ? 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)' : 'none';
    el.style.transform = dy === 0 ? '' : `translateY(${dy * FOLLOW}px)`;
  };

  const reset = () => {
    if (!start.current) return;
    start.current = null;
    move(0);
  };

  return {
    onPointerDown: (e: PointerEvent<T>) => {
      if (!onSwipe || e.pointerType === 'mouse' || !e.isPrimary) return;
      start.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
    },
    onPointerMove: (e: PointerEvent<T>) => {
      const s = start.current;
      if (!s || e.pointerId !== s.id) return;
      if (Math.abs(e.clientX - s.x) > SIDEWAYS_SLOP) return reset();
      move(Math.min(0, e.clientY - s.y));
    },
    onPointerUp: (e: PointerEvent<T>) => {
      const s = start.current;
      if (!s || e.pointerId !== s.id) return;
      reset();
      const up = s.y - e.clientY;
      const speed = up / Math.max(1, e.timeStamp - s.t);
      if (!onSwipe) return;
      if (up >= SWIPE_DISTANCE || (up >= FLICK_DISTANCE && speed >= FLICK_SPEED)) onSwipe();
    },
    onPointerCancel: reset,
  };
}
