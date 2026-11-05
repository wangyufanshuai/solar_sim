import { CELESTIAL_NEBULA_OVERLAY_SHA256_V591, CELESTIAL_NEBULA_OVERLAY_URL_V591 } from "../data/celestialNebulaV591.generated";
import { sha256BytesHexV566 } from "./sha256BrowserV566";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";

export { CELESTIAL_NEBULA_OVERLAY_SHA256_V591, CELESTIAL_NEBULA_OVERLAY_URL_V591 };

export type NebulaIdV591 =
  | "orion-nebula"
  | "lagoon-nebula"
  | "eagle-nebula"
  | "helix-nebula"
  | "veil-nebula"
  | "north-america-nebula";

export type NebulaTextureFileV591 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb";
  compression: string;
  role: string;
}>;

export type NebulaAssetV591 = Readonly<{
  id: NebulaIdV591;
  target: string;
  nasaId: string;
  instrument: string;
  raDeg: number;
  decDeg: number;
  angularSizeDeg: number;
  admission: "admitted";
  source: Readonly<{
    sourceUrl: string;
    finalUrl: string;
    host: string;
    license: Readonly<{ id: "NASA-public-domain"; url: string }>;
    path: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    colorSpace: "srgb";
    fieldCoverage: string;
    observationColorPolicy: string;
    acquisitionReceiptSha256: string;
  }>;
  derivation: Readonly<Record<string, unknown>>;
  variants: Readonly<{
    desktopKtx2: NebulaTextureFileV591;
    desktopFallback: NebulaTextureFileV591;
    mobileKtx2: NebulaTextureFileV591;
    mobileFallback: NebulaTextureFileV591;
    liteDesktop: NebulaTextureFileV591;
    liteMobile: NebulaTextureFileV591;
  }>;
  presentationOnly: true;
  scientificAuthority: false;
}>;

export type NebulaBlockedV591 = Readonly<{
  id: NebulaIdV591;
  target: string;
  nasaId: string;
  status: "asset-blocked";
  reason: string;
  acquisitionReceiptSha256: string;
  automaticRetryPerformed: false;
  automaticReplacementPerformed: false;
}>;

export type NebulaAssetOverlayV591 = Readonly<{
  version: "v591-nebula-asset-overlay-v1";
  generatedAt: string;
  status: "6-of-6-runtime-admitted";
  policy: Readonly<{
    science: "marker-only-no-image-payload";
    cinematic: "verified-nasa-presentation-impostor-only";
    maxConcurrentHighOrder: 3;
    fixedJ2000Directions: true;
    noSyntheticReplacement: true;
    presentationOnly: true;
  }>;
  assets: readonly NebulaAssetV591[];
  blocked: readonly NebulaBlockedV591[];
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
    gpuAuthorityGranted: false;
  }>;
  receiptSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const ALLOWED_HOST = /(?:^|\.)nasa\.gov$/i;
const NEBULA_IDS = new Set<NebulaIdV591>([
  "orion-nebula", "lagoon-nebula", "eagle-nebula", "helix-nebula", "veil-nebula", "north-america-nebula",
]);
export const V591_ADMITTED_NEBULA_IDS: readonly NebulaIdV591[] = Object.freeze([
  "orion-nebula", "lagoon-nebula", "eagle-nebula", "helix-nebula", "veil-nebula", "north-america-nebula",
]);
export const V591_BLOCKED_NEBULA_IDS: readonly NebulaIdV591[] = Object.freeze([]);
export const V591_OVERVIEW_NEBULA_IMPOSTOR_IDS: readonly NebulaIdV591[] = Object.freeze([
  "orion-nebula", "lagoon-nebula", "eagle-nebula",
]);
const V591_NO_NEBULA_IMPOSTOR_IDS: readonly NebulaIdV591[] = Object.freeze([]);
const VARIANT_KEYS_V591 = Object.freeze([
  "desktopKtx2", "desktopFallback", "mobileKtx2", "mobileFallback", "liteDesktop", "liteMobile",
] as const);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}

function canonicalSha(value: unknown): string {
  return sha256BytesHexV566(new TextEncoder().encode(JSON.stringify(canonicalize(value))));
}

function assertVariant(value: unknown, id: string): asserts value is NebulaTextureFileV591 {
  if (!value || typeof value !== "object") throw new Error(`v591-nebula-variant:${id}`);
  const file = value as Record<string, unknown>;
  if (
    typeof file.url !== "string" || !file.url.startsWith("/textures/candidate-v591/nebulae/")
    || file.url.includes("..") || file.url.includes("\\")
    || typeof file.bytes !== "number" || file.bytes <= 0
    || typeof file.width !== "number" || typeof file.height !== "number"
    || !Number.isInteger(file.width) || !Number.isInteger(file.height)
    || !SHA256.test(String(file.sha256))
    || (file.format !== "ktx2" && file.format !== "webp")
    || file.colorSpace !== "srgb"
  ) throw new Error(`v591-nebula-variant:${id}`);
}

function assertHttpsUrl(value: unknown, expectedHost: string, id: string): void {
  if (typeof value !== "string") throw new Error(`v591-nebula-source-url:${id}`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`v591-nebula-source-url:${id}`);
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hostname !== expectedHost || !ALLOWED_HOST.test(parsed.hostname)) {
    throw new Error(`v591-nebula-source-url:${id}`);
  }
}

export async function parseNebulaAssetOverlayV591(value: unknown): Promise<NebulaAssetOverlayV591> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-nebula-overlay-object");
  const root = value as Record<string, unknown>;
  const unsigned = { ...root };
  delete unsigned.receiptSha256;
  if (
    root.version !== "v591-nebula-asset-overlay-v1"
    || root.status !== "6-of-6-runtime-admitted"
    || root.receiptSha256 !== CELESTIAL_NEBULA_OVERLAY_SHA256_V591
  ) throw new Error("v591-nebula-overlay-identity");
  const policy = root.policy as Record<string, unknown>;
  if (
    policy?.science !== "marker-only-no-image-payload"
    || policy?.cinematic !== "verified-nasa-presentation-impostor-only"
    || policy?.maxConcurrentHighOrder !== 3
    || policy?.fixedJ2000Directions !== true
    || policy?.noSyntheticReplacement !== true
    || policy?.presentationOnly !== true
  ) throw new Error("v591-nebula-overlay-policy");
  if (!Array.isArray(root.assets) || root.assets.length !== 6 || !Array.isArray(root.blocked) || root.blocked.length !== 0) {
    throw new Error("v591-nebula-overlay-cardinality");
  }
  const admittedIds = new Set<NebulaIdV591>();
  for (const candidate of root.assets) {
    if (!candidate || typeof candidate !== "object") throw new Error("v591-nebula-asset-object");
    const asset = candidate as Record<string, unknown>;
    if (!NEBULA_IDS.has(asset.id as NebulaIdV591) || asset.admission !== "admitted" || asset.presentationOnly !== true || asset.scientificAuthority !== false) throw new Error(`v591-nebula-asset-admission:${String(asset.id)}`);
    if (admittedIds.has(asset.id as NebulaIdV591)) throw new Error(`v591-nebula-asset-identity:${String(asset.id)}`);
    admittedIds.add(asset.id as NebulaIdV591);
    const source = asset.source as Record<string, unknown>;
    const license = source?.license as Record<string, unknown> | undefined;
    if (
      !source
      || license?.id !== "NASA-public-domain"
      || !ALLOWED_HOST.test(String(source.host))
      || typeof source.path !== "string"
      || !source.path.startsWith("source-cache/celestial-convergence-v591/nebulae/")
      || source.path.includes("\\")
      || source.path.split("/").includes("..")
      || typeof source.bytes !== "number" || source.bytes <= 0
      || typeof source.width !== "number" || typeof source.height !== "number"
      || source.width < 1600 || source.height < 900
      || source.colorSpace !== "srgb"
      || !SHA256.test(String(source.sha256))
      || !SHA256.test(String(source.acquisitionReceiptSha256))
    ) throw new Error(`v591-nebula-source:${String(asset.id)}`);
    assertHttpsUrl(source.sourceUrl, String(source.host), `${String(asset.id)}:source`);
    assertHttpsUrl(source.finalUrl, String(source.host), `${String(asset.id)}:final`);
    const variants = asset.variants as Record<string, unknown>;
    if (!variants || Object.keys(variants).sort().join(",") !== [...VARIANT_KEYS_V591].sort().join(",")) throw new Error(`v591-nebula-variant-cardinality:${String(asset.id)}`);
    for (const name of VARIANT_KEYS_V591) assertVariant(variants[name], `${String(asset.id)}:${name}`);
  }
  if (V591_ADMITTED_NEBULA_IDS.some((id) => !admittedIds.has(id))) throw new Error("v591-nebula-overlay-cardinality");
  const authority = root.authorityState as Record<string, unknown> | undefined;
  if (!authority || authority.presentationOnly !== true || authority.scientificAuthorityChanged !== false || authority.scientificPayloadWriteback !== false || authority.measuredAuthorityGranted !== false || authority.gpuAuthorityGranted !== false) throw new Error("v591-nebula-authority");
  if (canonicalSha(unsigned) !== root.receiptSha256) throw new Error("v591-nebula-overlay-identity");
  return root as unknown as NebulaAssetOverlayV591;
}

let overlayPromise: Promise<NebulaAssetOverlayV591> | null = null;
export function loadNebulaAssetOverlayV591(signal?: AbortSignal): Promise<NebulaAssetOverlayV591> {
  const load = async () => {
    const response = await fetch(`${CELESTIAL_NEBULA_OVERLAY_URL_V591}?sha256=${CELESTIAL_NEBULA_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-nebula-overlay-fetch:${response.status}`);
    const bytes = await response.arrayBuffer();
    return parseNebulaAssetOverlayV591(JSON.parse(new TextDecoder().decode(bytes)));
  };
  if (signal) return load();
  overlayPromise ??= load().catch((error) => { overlayPromise = null; throw error; });
  return overlayPromise;
}

export function selectNebulaTextureFilesV591(asset: NebulaAssetV591, deliveryTier: CelestialDeliveryTierV590, deviceTier: CelestialDeviceTierV590): Readonly<{ primary: NebulaTextureFileV591 | null; fallback: NebulaTextureFileV591 }> {
  if (deliveryTier === "vercel-lite") return { primary: null, fallback: deviceTier === "mobile" ? asset.variants.liteMobile : asset.variants.liteDesktop };
  return deviceTier === "mobile"
    ? { primary: asset.variants.mobileKtx2, fallback: asset.variants.mobileFallback }
    : { primary: asset.variants.desktopKtx2, fallback: asset.variants.desktopFallback };
}

export function isNebulaFocusTargetV591(value: string): value is NebulaIdV591 {
  return NEBULA_IDS.has(value as NebulaIdV591);
}

/**
 * Selects presentation-only image layers. Science deliberately returns no
 * imagery, overview is capped at three, and a focused admitted catalog target
 * requests only its own verified presentation asset.
 */
export function selectNebulaImpostorIdsV591(
  mode: "science" | "cinematic",
  focusTarget: string,
): readonly NebulaIdV591[] {
  if (mode !== "cinematic") return V591_NO_NEBULA_IMPOSTOR_IDS;
  if (focusTarget === "overview") return V591_OVERVIEW_NEBULA_IMPOSTOR_IDS;
  if (!isNebulaFocusTargetV591(focusTarget)) return V591_NO_NEBULA_IMPOSTOR_IDS;
  return V591_ADMITTED_NEBULA_IDS.includes(focusTarget)
    ? Object.freeze([focusTarget])
    : V591_NO_NEBULA_IMPOSTOR_IDS;
}
