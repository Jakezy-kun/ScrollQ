import type { Config } from 'tailwindcss';
import { appColumnWidth, colors, durations, minTap, radii } from './src/styles/tokens';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: radii,
      minHeight: { tap: `${minTap}px` },
      minWidth: { tap: `${minTap}px` },
      maxWidth: { app: `${appColumnWidth}px` },
      transitionDuration: {
        fast: `${durations.fast}ms`,
        base: `${durations.base}ms`,
        slow: `${durations.slow}ms`,
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        'coin-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        'coin-pulse': 'coin-pulse 0.7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
