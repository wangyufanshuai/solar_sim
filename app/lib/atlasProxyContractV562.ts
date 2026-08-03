export const ATLAS_PROXY_CONTRACT_VERSION_V562 = "v562-proxy-semantic-contract" as const;

export type AtlasProxyPathDecisionV562 = "next" | "redirect-root";
export type AtlasProxyDeliveryProfileV562 = "standalone-full" | "vercel-lite" | "local-shadow";

export const ATLAS_PROXY_SEMANTIC_CASES_V562 = Object.freeze([
  { id: "root", method: "GET", pathname: "/", decision: "next" },
  { id: "downloads", method: "GET", pathname: "/downloads", decision: "next" },
  { id: "api", method: "GET", pathname: "/api/atlas/current", decision: "next" },
  { id: "next-assets", method: "GET", pathname: "/_next/static/chunk.js", decision: "next" },
  { id: "textures", method: "GET", pathname: "/textures/ktx2/earth.ktx2", decision: "next" },
  { id: "favicon", method: "GET", pathname: "/favicon.ico", decision: "next" },
  { id: "public-file", method: "GET", pathname: "/manifest.json", decision: "next" },
  { id: "post", method: "POST", pathname: "/mission", decision: "next" },
  { id: "local-shadow", method: "GET", pathname: "/local-shadow-v562", deliveryProfile: "local-shadow", decision: "next" },
  { id: "local-shadow-closed", method: "GET", pathname: "/local-shadow-v562", deliveryProfile: "standalone-full", decision: "redirect-root" },
  { id: "spa-path", method: "GET", pathname: "/mission/earth", decision: "redirect-root" },
] as const);

export function classifyAtlasProxyPathV562(
  method: string,
  pathname: string,
  deliveryProfile: AtlasProxyDeliveryProfileV562 = "standalone-full",
): AtlasProxyPathDecisionV562 {
  if (method !== "GET" && method !== "HEAD") return "next";
  if (deliveryProfile === "local-shadow" && /^\/local-shadow-v\d+(?:\/|$)/.test(pathname)) return "next";
  if (pathname === "/" || pathname === "/downloads" || pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.startsWith("/textures") || pathname === "/favicon.ico" || /\.[a-zA-Z0-9]{1,10}$/.test(pathname)) return "next";
  return "redirect-root";
}

export const ATLAS_PROXY_AUTHORITY_BOUNDARY_V562 = Object.freeze({
  version: ATLAS_PROXY_CONTRACT_VERSION_V562,
  canonicalRuntimeEntry: "proxy.ts",
  middlewareShimAllowed: false,
  desktopAuthorizationBeforePathRouting: true,
  apiNeverSpaRedirected: true,
  nextAssetsNeverSpaRedirected: true,
  publicFilesNeverSpaRedirected: true,
  localShadowRoutesRequireLocalShadowProfile: true,
});
