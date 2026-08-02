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
        name: "AI Development Dashboard",
        short_name: "Dashboard",
        description: "AI Development Dashboard",
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
            urlPattern: /^\/telemetry\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "telemetry-api",
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
    port: 5180,
    proxy: {
      "/telemetry": {
        target: "http://127.0.0.1:4310",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/telemetry/, ""),
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 6180,
    proxy: {
      "/telemetry": {
        target: "http://127.0.0.1:4310",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/telemetry/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
