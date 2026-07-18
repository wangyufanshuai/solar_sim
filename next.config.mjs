import { readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const configuredDistDir = process.env.ATLAS_NEXT_DIST_DIR?.trim();
const projectRoot = dirname(fileURLToPath(import.meta.url));
const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE?.trim() || "standalone-full";
const isDevelopment = process.env.NODE_ENV === "development";
const cspMode = process.env.ATLAS_CSP_MODE?.trim() || (isDevelopment ? "report-only" : "enforce");
const cspHeaderName = cspMode === "report-only"
  ? "Content-Security-Policy-Report-Only"
  : "Content-Security-Policy";
const atlasCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  // Atlas keeps the public entry statically renderable and CDN-cacheable. Next
  // emits inline hydration records for static App Router pages, so the
  // documented non-nonce policy requires unsafe-inline; external scripts are
  // still same-origin and independently protected by SHA-384 SRI.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Screenshot diagnostics decode locally generated data URLs in production
  // Browser QA. data: cannot initiate an external connection and remains
  // excluded from script, worker and frame sources.
  "connect-src 'self' data: blob: ws: wss:",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
  ...(deliveryProfile === "vercel-lite" && !isDevelopment ? ["upgrade-insecure-requests"] : []),
].join("; ");
const generatedNextTraceExcludes = readdirSync(projectRoot, { withFileTypes: true })
  .filter((entry) => (
    entry.isDirectory()
    && entry.name.startsWith(".next")
    && entry.name !== configuredDistDir
  ))
  .map((entry) => `**/${entry.name}/**/*`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  // Keep the Windows standalone trace explicit across the Next 15 -> 16
  // migration; the server loads these lazy logging dependencies at runtime.
  outputFileTracingIncludes: {
    "*": [
      "./node_modules/next/dist/build/output/format.js",
      "./node_modules/next/dist/build/output/index.js",
      "./node_modules/next/dist/build/output/log.js",
      "./node_modules/next/dist/build/output/store.js",
      "./node_modules/next/dist/compiled/unistore/package.json",
      "./node_modules/next/dist/compiled/unistore/unistore.js",
    ],
  },
  // Content packs and other build outputs are external runtime payloads and
  // must never be recursively copied into a new standalone trace.
  outputFileTracingExcludes: {
    "*": [
      ...generatedNextTraceExcludes,
      "**/dist/content-packs/**/*",
      "**/dist/desktop-stage/**/*",
      "**/output/**/*",
      "**/test-results/**/*",
    ],
  },
  ...(configuredDistDir ? { distDir: configuredDistDir } : {}),
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    sri: { algorithm: "sha384" },
  },
  webpack(config, { dev, isServer, nextRuntime }) {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          /[\\/]pagefile\.sys$/i,
          /[\\/]DumpStack\.log\.tmp$/i,
        ],
      };
    }
    const statsOutput = process.env.ATLAS_WEBPACK_STATS?.trim();
    if (!dev && !isServer && !nextRuntime && statsOutput) {
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.done.tap("AtlasWebpackStats", (stats) => {
            writeFileSync(statsOutput, JSON.stringify(stats.toJson({
              all: false,
              chunks: true,
              chunkModules: true,
              chunkModulesSpace: Infinity,
              ids: true,
              modules: true,
              modulesSpace: Infinity,
              nestedModules: true,
              reasons: true,
            })));
          });
        },
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: cspHeaderName, value: atlasCsp },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
      {
        source: "/data/catalog-lite-v6/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  async rewrites() {
    const textureProxyEnabled =
      process.env.NODE_ENV === "development"
      && process.env.ATLAS_TEXTURE_PROXY !== "off";
    return {
      fallback: [
        {
          source: "/solar-assets/solar/textures/:path*",
          destination: "/textures/:path*",
        },
        ...(textureProxyEnabled
          ? [{
              source: "/textures/:path*",
              destination: "http://127.0.0.1:8765/textures/:path*",
            }]
          : []),
      ],
    };
  },
};

export default nextConfig;
