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
        name: "Memories",
        short_name: "Memories",
        description: "Memory Experience Library — reusable keepsake stages",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#4a3124",
        background_color: "#120e0c",
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
        // JS/CSS/HTML only — large GLBs load on demand and must not fail the SW build.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json}"],
        globIgnores: ["**/models/**"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5181,
  },
  preview: {
    host: "127.0.0.1",
    port: 6181,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
