import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { appVersionPlugin } from "@platform/config/vite-app-version";
import { defineConfig } from "vite";

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
        name: "Hello",
        short_name: "Hello",
        description: "Hello — scaffolded PWA",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0f766e",
        background_color: "#fafaf9",
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
    port: 5182,
  },
  preview: {
    host: "127.0.0.1",
    port: 6182,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
