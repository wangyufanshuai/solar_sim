import { readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configuredDistDir = process.env.ATLAS_NEXT_DIST_DIR?.trim();
const configuredTsconfigPath = process.env.ATLAS_TSCONFIG_PATH?.trim();
const projectRoot = dirname(fileURLToPath(import.meta.url));
const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE?.trim() || "standalone-full";
const visualQaOnly = process.env.ATLAS_VISUAL_QA_ONLY?.trim() === "1";
const configuredBuildCpus = Number(process.env.ATLAS_BUILD_CPUS?.trim() || "4");
if (!Number.isInteger(configuredBuildCpus) || configuredBuildCpus < 1 || configuredBuildCpus > 8) {
  throw new Error(`Invalid ATLAS_BUILD_CPUS: ${process.env.ATLAS_BUILD_CPUS}`);
}
export const ATLAS_V594_NEXT_BUILD_ID_PATTERN = /^v594b-[a-f0-9]{64}$/;
export const ATLAS_V595_NEXT_BUILD_ID_PATTERN = /^v595b-[a-f0-9]{64}$/;
export const ATLAS_V596_NEXT_BUILD_ID_PATTERN = /^v596b-[a-f0-9]{64}$/;
const ATLAS_NEXT_BUILD_ID_PATTERNS = Object.freeze([
  ATLAS_V594_NEXT_BUILD_ID_PATTERN,
  ATLAS_V595_NEXT_BUILD_ID_PATTERN,
  ATLAS_V596_NEXT_BUILD_ID_PATTERN,
]);

export function configureAtlasPreservedBuildCache(config, { dev, isServer, nextRuntime }, environment = process.env) {
  if (dev || environment.ATLAS_MAINLINE_A_PRESERVED_BUILD !== "1") return null;
  const requestedMode = environment.ATLAS_MAINLINE_A_DISK_CACHE ?? "default";
  if (requestedMode !== "default" && requestedMode !== "off") {
    throw new Error("Invalid ATLAS_MAINLINE_A_DISK_CACHE for preserved build");
  }
  if (requestedMode === "off") config.cache = false;
  return {
    target: !isServer ? "client" : nextRuntime === "edge" ? "edge" : "nodejs",
    requestedMode,
    cacheType: config.cache === false ? "disabled"
      : config.cache === true ? "memory" : config.cache?.type ?? "not-configured",
  };
}

export function resolveAtlasNextBuildId(environment = process.env) {
  const value = environment.ATLAS_NEXT_BUILD_ID?.trim();
  if (!value) return null;
  if (!ATLAS_NEXT_BUILD_ID_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(`Invalid ATLAS_NEXT_BUILD_ID: ${value}`);
  }
  return value;
}

const configuredAtlasNextBuildId = resolveAtlasNextBuildId();
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
  // Use an explicit project-root-relative dot directory. Picomatch does not
  // let a leading wildcard consume dot-prefixed path segments by default.
  .map((entry) => `./${entry.name}/**/*`);
const atlasTraceExcludes = [
  ...generatedNextTraceExcludes,
  "**/dist/content-packs/**/*",
  "**/dist/desktop-stage/**/*",
  "**/output/**/*",
  "**/test-results/**/*",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  ...(configuredTsconfigPath ? { typescript: { tsconfigPath: configuredTsconfigPath } } : {}),
  outputFileTracingRoot: projectRoot,
  // Keep the Windows standalone trace explicit across the Next 15 -> 16
  // migration; the server loads these lazy logging dependencies at runtime.
  outputFileTracingIncludes: {
    "/*": [
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
    // Next 16.3 applies this special key to the root next-server trace.
    "next-server": atlasTraceExcludes,
    "/*": atlasTraceExcludes,
  },
  ...(configuredDistDir ? { distDir: configuredDistDir } : {}),
  // Next 16's generateBuildId contract accepts null to retain its default
  // fallback. v594/v595 set this only after deriving a content-addressed ID
  // from the complete page build fingerprint; other builds remain on the
  // framework default path.
  generateBuildId: async () => configuredAtlasNextBuildId,
  reactStrictMode: true,
  experimental: {
    // This workstation exposes 31 logical CPUs but has 16 GiB of physical
    // memory. Next otherwise launches roughly 25 page-data workers, forcing a
    // large pagefile expansion during sealed builds. Keep builds explicitly
    // bounded; concurrency changes scheduling only, not candidate semantics.
    cpus: configuredBuildCpus,
    optimizePackageImports: ["lucide-react"],
    sri: { algorithm: "sha384" },
  },
  webpack(config, { dev, isServer, nextRuntime, webpack }) {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: /[\\/](?:node_modules|\.next(?:-[^\\/]+)?)(?:[\\/]|$)|[\\/](?:pagefile\.sys|DumpStack\.log\.tmp)$/i,
      };
    }
    if (visualQaOnly || (!dev && deliveryProfile !== "local-shadow" && process.env.ATLAS_RESEARCH_WORKBENCH !== "full")) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /RelativityResearchWorkbenchV280$/,
        resolve(projectRoot, "app/components/RelativityResearchWorkbenchReleaseBoundaryV564.tsx"),
      ));
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
              dependentModules: true,
              ids: true,
              modules: true,
              modulesSpace: Infinity,
              nestedModules: true,
              orphanModules: true,
              reasons: true,
              runtimeModules: true,
            })));
          });
        },
      });
    }
    const preservedCache = configureAtlasPreservedBuildCache(config, { dev, isServer, nextRuntime });
    if (preservedCache) console.log("[mainline-a-webpack-cache] " + JSON.stringify(preservedCache));
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()" },
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
