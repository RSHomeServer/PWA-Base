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
        name: "Documents",
        short_name: "Docs",
        description: "Documents",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0d7a72",
        background_color: "#f5f5f4",
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
            urlPattern: /^\/docs-api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "docs-api",
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5176,
    proxy: {
      "/docs-api": {
        target: "http://127.0.0.1:4320",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs-api/, ""),
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 6176,
    proxy: {
      "/docs-api": {
        target: "http://127.0.0.1:4320",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/docs-api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
