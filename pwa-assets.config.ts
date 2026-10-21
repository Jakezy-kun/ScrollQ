import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/**
 * App icons (amber Q on the dark background) generated from public/logo.svg.
 * Regenerate with `npm run icons` after changing the logo.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.3,
      resizeOptions: { background: '#1B1530' },
    },
    apple: { ...minimal2023Preset.apple, padding: 0.3, resizeOptions: { background: '#1B1530' } },
  },
  images: ['public/logo.svg'],
});
