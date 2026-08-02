import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { appVersionPlugin } from "@platform/config/vite-app-version";
import { defineConfig } from "vite";

/**
 * Solo Birthday packaging (ADR-004): own SPA, own SW scope, base `/`.
 * Application code is `@platform/site-birthday` unchanged.
 */
export default defineConfig({
  base: "/",
  plugins: [
    appVersionPlugin(),
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Birthday",
        short_name: "Birthday",
        description: "Interactive keepsake experience",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1c1917",
        background_color: "#0c0a09",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json}"],
        runtimeCaching: [
          {
            urlPattern: /^\/packs\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "content-packs",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5174,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
