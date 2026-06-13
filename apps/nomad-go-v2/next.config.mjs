import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  disable: false,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "google-fonts-stylesheets" },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-images",
          expiration: { maxEntries: 256, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /\.(?:js|css|woff2|woff|ttf)$/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "static-assets" },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nomad-go/shared-ui", "@nomad-go/shared-configs"],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow the dev server (HMR, RSC, dev resources) to be reached through a
  // tunnel when testing on a phone (ngrok rotates the subdomain on free tier).
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
  experimental: {
    // Allow Server Actions to work when the app is reached through a tunnel /
    // reverse proxy (e.g. ngrok for phone testing). Without this, Next rejects
    // the action because the browser Origin (ngrok host) doesn't match the
    // server Host header, which silently breaks post-login data loading.
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.ngrok-free.app",
        "*.ngrok-free.dev",
        "*.ngrok.app",
        "*.ngrok.io",
      ],
    },
  },
};

export default withPWAConfig(nextConfig);
