import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { varlockVitePlugin } from "@varlock/vite-integration"
import { VitePWA } from "vite-plugin-pwa"

const ONE_YEAR = 60 * 60 * 24 * 365
const ONE_MONTH = 60 * 60 * 24 * 30
const ONE_DAY = 60 * 60 * 24

export default defineConfig({
  plugins: [
    varlockVitePlugin(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: { enabled: false },

      manifest: false,
      manifestFilename: "manifest.webmanifest",

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp,woff2,woff,ttf,otf,riv}",
        ],
        globDirectory: "dist",
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.yourapp\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: ONE_DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.riv$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "rive-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: ONE_MONTH },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:woff2?|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: { maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/assets\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "public-assets-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@backend/api": path.resolve(__dirname, "./convex/_generated/api"),
      "@backend/dataModel": path.resolve(
        __dirname,
        "./convex/_generated/dataModel"
      ),
      "@backend/authDataModel": path.resolve(
        __dirname,
        "./convex/betterAuth/_generated/dataModel"
      ),
      "@backend/types": path.resolve(__dirname, "./convex/types"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
})
