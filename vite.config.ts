import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { VitePWA } from "vite-plugin-pwa";
import { ENV } from "varlock/env";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_MONTH = 60 * 60 * 24 * 30;
const ONE_DAY = 60 * 60 * 24;

export default defineConfig({
    plugins: [
        varlockVitePlugin(),
        tanstackRouter({ target: "react", autoCodeSplitting: true }),
        react(),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            devOptions: { enabled: false },

            manifestFilename: "manifest.webmanifest",
            manifest: {
                name: "Safarnama",
                short_name: "Safarnama",
                description: "Modern trips for modern people",
                id: "/",
                start_url: "/",
                scope: "/",
                display: "standalone",
                orientation: "any",
                theme_color: "#1a1512",
                background_color: "#1a1512",
                lang: "en",
                dir: "ltr",

                icons: [
                    {
                        src: "/icons/icon-48.png",
                        sizes: "48x48",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-72.png",
                        sizes: "72x72",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-96.png",
                        sizes: "96x96",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-128.png",
                        sizes: "128x128",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-144.png",
                        sizes: "144x144",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-152.png",
                        sizes: "152x152",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-256.png",
                        sizes: "256x256",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-384.png",
                        sizes: "384x384",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "/icons/icon-maskable-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable",
                    },
                    {
                        src: "/icons/icon-maskable-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                    {
                        src: "/icons/icon.svg",
                        sizes: "any",
                        type: "image/svg+xml",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-monochrome.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "monochrome",
                    },
                ],

                shortcuts: [
                    {
                        name: "Trips",
                        short_name: "Trips",
                        description: "View your trips",
                        url: "/trips",
                        icons: [
                            {
                                src: "/icons/shortcut-trips.png",
                                sizes: "96x96",
                                type: "image/png",
                            },
                        ],
                    },
                    {
                        name: "Dashboard",
                        short_name: "Dashboard",
                        description: "View your dashboard",
                        url: "/dashboard",
                        icons: [
                            {
                                src: "/icons/shortcut-dashboard.png",
                                sizes: "96x96",
                                type: "image/png",
                            },
                        ],
                    },
                    {
                        name: "Blogs",
                        short_name: "Blogs",
                        description: "View your blogs",
                        url: "/blogs",
                        icons: [
                            {
                                src: "/icons/shortcut-blogs.png",
                                sizes: "96x96",
                                type: "image/png",
                            },
                        ],
                    },
                ],

                share_target: {
                    action: "/share",
                    method: "POST",
                    enctype: "multipart/form-data",
                    params: {
                        title: "title",
                        text: "text",
                        url: "url",
                        files: [
                            {
                                name: "media",
                                accept: ["image/*", "video/*", "audio/*"],
                            },
                            {
                                name: "files",
                                accept: ["application/pdf", "text/*"],
                            },
                        ],
                    },
                },

                categories: ["social", "communication", "productivity"],
                prefer_related_applications: false,

                display_override: [
                    "window-controls-overlay",
                    "standalone",
                    "minimal-ui",
                ],
                protocol_handlers: [
                    { protocol: "web+chat", url: "/open?uri=%s" },
                ],
                file_handlers: [
                    {
                        action: "/open-file",
                        accept: {
                            "image/*": [
                                ".jpg",
                                ".jpeg",
                                ".png",
                                ".gif",
                                ".webp",
                            ],
                            "video/*": [".mp4", ".webm"],
                            "audio/*": [".mp3", ".ogg", ".wav"],
                        },
                    },
                ],
                handle_links: "preferred",
                launch_handler: { client_mode: ["focus-existing", "auto"] },
                edge_side_panel: { preferred_width: 400 },
            },

            workbox: {
                importScripts: ["/push-sw.js"],
                globPatterns: [
                    "**/*.{js,css,html,ico,png,svg,webp,woff2,woff,ttf,otf,riv}",
                ],
                globDirectory: "dist",
                skipWaiting: true,
                clientsClaim: true,
                cleanupOutdatedCaches: true,
                navigateFallback: "index.html",
                navigateFallbackDenylist: [
                    /^\/api/,
                    /^\/manifest/,
                    /\.webmanifest$/,
                ],

                runtimeCaching: [
                    {
                        urlPattern: ({ url }) =>
                            url.origin === ENV.VITE_CONVEX_URL,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "convex-api-cache",
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: ONE_DAY,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /\.riv$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "rive-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: ONE_YEAR,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "image-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: ONE_MONTH,
                            },
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
                            expiration: {
                                maxEntries: 300,
                                maxAgeSeconds: ONE_YEAR,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/(light_all|dark_all|rastertiles)\/.*\.png(\?.*)?$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "carto-raster-tiles",
                            expiration: {
                                maxEntries: 2000,
                                maxAgeSeconds: ONE_MONTH,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*\.png(\?.*)?$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "osm-tiles",
                            expiration: {
                                maxEntries: 2000,
                                maxAgeSeconds: ONE_MONTH,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "map-tiles-satellite",
                            expiration: {
                                maxEntries: 1000,
                                maxAgeSeconds: ONE_MONTH,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "cdn-libs",
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: ONE_YEAR,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "unsplash-images",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: ONE_MONTH,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "geocoding-cache",
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: ONE_DAY,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/(en\.wikipedia|commons\.wikimedia)\.org\/w\/api\.php.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "wiki-cache",
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: ONE_DAY,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "weather-forecast-cache",
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: ONE_DAY,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/archive-api\.open-meteo\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "weather-history-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: ONE_MONTH,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/api\.exchangerate-api\.com\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "exchange-rate-cache",
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: ONE_DAY,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/router\.project-osrm\.org\/route\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "osrm-routing-cache",
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: ONE_MONTH,
                            },
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
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;

                    if (
                        /\/node_modules\/(\.pnpm\/)?react-dom\//.test(id) ||
                        /\/node_modules\/(\.pnpm\/)?react\//.test(id) ||
                        id.includes("/scheduler/")
                    )
                        return "vendor-react";

                    if (
                        id.includes("/framer-motion/") ||
                        id.includes("/motion-dom/") ||
                        id.includes("/motion-utils/")
                    )
                        return "vendor-motion";

                    if (id.includes("/recharts/") || id.includes("/d3-"))
                        return "vendor-charts";

                    if (
                        id.includes("/date-fns/") ||
                        id.includes("/react-day-picker/")
                    )
                        return "vendor-dates";

                    if (id.includes("/leaflet/")) return "vendor-maps";

                    if (id.includes("/lucide-react/")) return "vendor-icons";

                    if (id.includes("/@base-ui/")) return "vendor-base-ui";

                    if (id.includes("/@dnd-kit/")) return "vendor-dnd";

                    if (id.includes("/@tanstack/react-form/"))
                        return "vendor-form";

                    if (id.includes("/zod/")) return "vendor-zod";

                    if (
                        id.includes("/convex/") ||
                        id.includes("/convex-helpers/")
                    )
                        return "vendor-convex";
                },
            },
        },
    },
    server: {
        port: 3000,
        strictPort: true,
        host: "0.0.0.0",
        allowedHosts: true,
    },
    preview: {
        port: 4000,
        strictPort: true,
        host: "0.0.0.0",
        allowedHosts: true,
    },
});
