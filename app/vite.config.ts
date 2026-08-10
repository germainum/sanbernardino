import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "San Bernardino",
        short_name: "San Bernardino",
        description: "Tunnel, col, ou déviation Gothard ? La décision pour l'axe A13.",
        theme_color: "#22432E",
        background_color: "#EDF2E6",
        display: "standalone",
        lang: "fr",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Cache the last successful /api/state and /api/history response (wired in Phase 7)
        // so the offline fallback in prompt-implementation-san-bernardino.md §6/§10 has data to show.
        runtimeCaching: [
          {
            urlPattern: /\/api\/(state|history)/,
            handler: "NetworkFirst",
            options: { cacheName: "san-bernardino-api", networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
});
