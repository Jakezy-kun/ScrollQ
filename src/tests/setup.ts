import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';

// Finish animations instantly so presence/exit assertions are deterministic.
MotionGlobalConfig.skipAnimations = true;

// jsdom has no matchMedia; framer-motion uses it for prefers-reduced-motion.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom has no PointerEvent; without it fireEvent.pointer* drops clientX/Y and pointerType.
if (!window.PointerEvent) {
  class PointerEventStub extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? '';
      this.isPrimary = init.isPrimary ?? false;
    }
  }
  window.PointerEvent = PointerEventStub as unknown as typeof PointerEvent;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
