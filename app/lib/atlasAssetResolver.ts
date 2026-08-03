export const ATLAS_ASSET_RESOLVER_VERSION =
  "v160-logical-asset-resolution" as const;

export type AtlasAssetId =
  | "spacecraft:sls-block-1"
  | "spacecraft:orion-capsule"
  | "spacecraft:cubesat-1ru"
  | "spacecraft:gateway-core"
  | `planet:${string}:${string}`
  | `sky:${string}`
  | `data:${string}`;

export type AtlasAssetLoadState = "idle" | "probing" | "ready" | "fallback" | "error";

export type AtlasAssetResolution = {
  version: typeof ATLAS_ASSET_RESOLVER_VERSION;
  packId: "core" | "planet-hd" | "deep-sky" | "spacecraft" | "science-fixtures" | "runtime-codecs" | "gaia-presentation";
  path: string;
  primaryUrl: string;
  candidates: readonly string[];
};

const API_PREFIX = "/api/atlas/content-packs";

function isExternalAssetUrl(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value);
}

function cleanAssetPath(value: string): string {
  const path = value.replaceAll("\\", "/").replace(/^\/+/, "").split(/[?#]/, 1)[0] ?? "";
  return path.replace(/^solar-assets\/solar\//i, "");
}

function assetUrlSuffix(value: string): string {
  const index = value.search(/[?#]/);
  return index >= 0 ? value.slice(index) : "";
}

export function atlasPackForAssetPath(assetPath: string): AtlasAssetResolution["packId"] {
  const path = cleanAssetPath(assetPath);
  if (path.startsWith("data/gaia-dr3-presentation-10000000-v9/")) return "gaia-presentation";
  if (/^data\/(?:horizons|kerr|observation-fixtures)/.test(path)) return "science-fixtures";
  if (path.startsWith("models/spacecraft/")) return "spacecraft";
  if (path.startsWith("textures/ktx2/") || path.startsWith("textures/planets/hd/") || path.startsWith("textures/planets/v49/") || path.startsWith("textures/planets/v55/")) return "planet-hd";
  if (path.startsWith("textures/sky/orbit-atlas-v9-")) return "core";
  if (path.startsWith("textures/sky/")) return "deep-sky";
  if (path.startsWith("basis/")) return "runtime-codecs";
  if (path.startsWith("data/") || path.startsWith("textures/planets/")) return "core";
  return "core";
}

export function atlasContentPackAssetUrl(packId: string, assetPath: string): string {
  const encoded = cleanAssetPath(assetPath).split("/").map(encodeURIComponent).join("/");
  return `${API_PREFIX}/${encodeURIComponent(packId)}/files/${encoded}`;
}

export function resolveAtlasAsset(assetPath: string): AtlasAssetResolution {
  const cleanPath = cleanAssetPath(assetPath);
  const suffix = assetUrlSuffix(assetPath);
  const packId = atlasPackForAssetPath(cleanPath);
  const localUrl = atlasContentPackAssetUrl(packId, cleanPath);
  const deliveryProfile = getAtlasDeliveryProfile();
  const liteUrl = atlasPublicAssetUrl(cleanPath, "vercel-lite") + suffix;
  const remoteRoot = process.env.NEXT_PUBLIC_ATLAS_ASSET_PACK_BASE_URL?.trim().replace(/\/$/, "");
  const remoteUrl = remoteRoot ? `${remoteRoot}/${packId}/files/${cleanPath}${suffix}` : "";
  const publicFallback = atlasPublicAssetUrl(cleanPath, "standalone-full") + suffix;
  const candidates = deliveryProfile === "vercel-lite"
    ? [liteUrl]
    : [localUrl, remoteUrl, publicFallback].filter(Boolean);
  return {
    version: ATLAS_ASSET_RESOLVER_VERSION,
    packId,
    path: cleanPath,
    primaryUrl: deliveryProfile === "vercel-lite" ? liteUrl : localUrl,
    candidates: Array.from(new Set(candidates)),
  };
}

export function atlasAssetCandidates(assetPath: string | undefined): readonly string[] {
  if (!assetPath) return [];
  if (isExternalAssetUrl(assetPath)) return [assetPath];
  return resolveAtlasAsset(assetPath).candidates;
}

export async function fetchAtlasAsset(
  assetPath: string,
  init?: RequestInit,
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;
  for (const candidate of atlasAssetCandidates(assetPath)) {
    try {
      const response = await fetch(candidate, init);
      if (response.ok) return response;
      await response.body?.cancel().catch(() => undefined);
      lastResponse = response;
    } catch (error) {
      if (init?.signal?.aborted) throw error;
      lastError = error;
    }
  }
  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error(`Atlas asset unavailable: ${assetPath}`);
}
import { atlasPublicAssetUrl, getAtlasDeliveryProfile } from "./atlasDeliveryProfile";
