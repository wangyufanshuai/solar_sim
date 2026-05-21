/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "E:/pagefile.sys",
          "E:/DumpStack.log.tmp",
        ],
      };
    }
    return config;
  },
  /**
   * Enable `crossOriginIsolated` so SharedArrayBuffer works for the physics worker path.
   * `credentialless` avoids requiring CORP on all cross-origin assets (e.g. texture proxy).
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
  /**
   * Dev: HTTP fallback for textures living on viz_server (8765).
   * Files in public/textures take precedence. WebSocket /ws/sim is not proxied here — use
   * ws://127.0.0.1:8765/ws/sim from the client (see README / .env.example).
   */
  async rewrites() {
    return {
      /** Only proxy to viz_server when `public/textures/...` has no matching file (avoids 404 blackholes). */
      fallback: [
        {
          source: "/textures/:path*",
          destination: "http://127.0.0.1:8765/textures/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
