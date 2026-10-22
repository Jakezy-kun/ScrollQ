import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { handleVideoRequest } from './src/server/pixabay';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

const THEME = '#1B1530';

/** Serves /api/videos during `npm run dev`, like the Vercel Function does in production. */
function devVideoApi(): Plugin {
  return {
    name: 'scrollq-dev-video-api',
    configureServer(server) {
      // Not VITE_-prefixed, so the key stays on the server and never reaches the app bundle.
      const { PIXABAY_API_KEY } = loadEnv(server.config.mode, process.cwd(), '');
      server.middlewares.use('/api/videos', (req, res) => {
        const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
        void handleVideoRequest(params, PIXABAY_API_KEY).then(async (response) => {
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    devVideoApi(),
    VitePWA({
      // Ask before reloading into a new version, so a round is never cut short.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'ScrollQ',
        short_name: 'ScrollQ',
        description:
          "100 coins of attention. A feed that never ends. Spend them on what's worth it.",
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: THEME,
        background_color: THEME,
        categories: ['education', 'games'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the whole app (every lazy screen and the curated posts) so curated
        // rounds work fully offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase, the Live feed and Pixabay videos are never cached by the app:
          // they must be fresh and private, and videos would fill the phone's storage.
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
});
