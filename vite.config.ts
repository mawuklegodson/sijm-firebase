import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Dev mode: enable SW during local development for testing
      devOptions: { enabled: false },
      // Assets to pre-cache (beyond the build output)
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Salvation In Jesus Ministry',
        short_name: 'SIJM',
        description: 'Salvation In Jesus Ministry — Official Church App',
        theme_color: '#002366',
        background_color: '#f9fafb',
        // standalone = runs like a native app (no browser chrome)
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // orientation: any allows both portrait and landscape on mobile
        orientation: 'any',
        // Screenshots and categories improve the install prompt on desktop & mobile
        categories: ['lifestyle', 'social'],
        icons: [
          {
            src: '/assets/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/assets/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // maskable = safe-zone icon for Android adaptive icons
            src: '/assets/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Desktop install: shortcuts appear in the OS start-menu / dock entry
        shortcuts: [
          {
            name: 'Admin Dashboard',
            short_name: 'Admin',
            description: 'Open the admin dashboard',
            url: '/?page=dashboard',
            icons: [{ src: '/assets/logo.png', sizes: '192x192' }],
          },
          {
            name: 'Live Service',
            short_name: 'Live',
            description: 'Watch the live service',
            url: '/?page=live',
            icons: [{ src: '/assets/logo.png', sizes: '192x192' }],
          },
        ],
        // Desktop: protocol handler lets the OS open sijm:// links in the app
        // (supported in Chrome 96+ on Windows/Mac/Linux)
        protocol_handlers: [
          { protocol: 'web+sijm', url: '/?from=%s' },
        ],
      },
      workbox: {
        // Raise the default 2 MiB limit so the main bundle + logo don't block the build
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        // Pre-cache compiled assets (exclude the oversized logo — it loads fine from CDN)
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        // Don't let Workbox try to cache the Paystack inline script (cross-origin)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Unsplash / remote images
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase Storage media
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // esnext lets Vite output modern JS without transpiling top-level await
    // (we removed TLA from firebase.ts, but keep esnext for tree-shaking)
    target: 'esnext',
    rollupOptions: {
      // Suppress warnings about circular deps in firebase SDK
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
    },
  },
  server: {
    port: 3000,
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
