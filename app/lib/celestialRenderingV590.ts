import {
  CELESTIAL_RENDERING_FREEZE_BEFORE_SHA256_V590,
  CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
} from "../data/celestialRenderingManifestV590.generated";
import {
  KERR_OBSERVATION_V587_ROOT,
  parseKerrObservationSummaryV587,
} from "./kerrObservationV587";

export const CELESTIAL_RENDERING_VERSION_V590 = "v590-celestial-rendering-candidate-v1" as const;
export const CELESTIAL_RENDERING_NAMESPACE_V590 = "candidate-v590-celestial-rendering" as const;
export const CELESTIAL_RENDERING_ROUTE_V590 = "/local-shadow-v590" as const;
export const CELESTIAL_RENDERING_MANIFEST_URL_V590 = "/data/celestial-rendering-v590/manifest.json" as const;
export const CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590 = "v263" as const;
export const CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590 =
  "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674" as const;
export const CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590 =
  `${KERR_OBSERVATION_V587_ROOT}/observation-summary.json` as const;

export {
  CELESTIAL_RENDERING_FREEZE_BEFORE_SHA256_V590,
  CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
};

export type CelestialModeV590 = "science" | "cinematic";
export type CelestialDeliveryTierV590 = "standalone-full" | "vercel-lite";
export type CelestialDeviceTierV590 = "desktop" | "mobile";
export type CelestialExposurePresetV590 = "nominal" | "extreme-dark" | "extreme-bright";
export type CelestialQualityTierV590 = "overview" | "closeup";

export type HeroBodyIdV590 =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "ceres"
  | "vesta"
  | "bennu"
  | "eros"
  | "kleopatra"
  | "tempel-1";

export type NebulaIdV590 =
  | "orion-nebula"
  | "lagoon-nebula"
  | "eagle-nebula"
  | "helix-nebula"
  | "veil-nebula"
  | "north-america-nebula";

export type ConstellationFocusIdV590 = "orion" | "ursa-major" | "cassiopeia";
export type DeepSpaceFocusTargetV590 =
  | "milky-way-center"
  | "milky-way-anticenter"
  | NebulaIdV590
  | ConstellationFocusIdV590;
export type CelestialFocusTargetV590 = "overview" | HeroBodyIdV590 | DeepSpaceFocusTargetV590;

export type CelestialRenderProfileV590 = Readonly<{
  mode: CelestialModeV590;
  deliveryTier: CelestialDeliveryTierV590;
  deviceTier: CelestialDeviceTierV590;
  selectedBody: HeroBodyIdV590;
  focusTarget: CelestialFocusTargetV590;
  exposurePreset: CelestialExposurePresetV590;
  qualityTier: CelestialQualityTierV590;
  cleanView: boolean;
  presentationEpoch: 590;
}>;

export type HeroAssetAdmissionV590 = "admitted" | "asset-blocked";
export type HeroGeometryKindV590 = "star" | "sphere" | "ringed-sphere" | "irregular-mesh" | "comet-nucleus";
export type HeroMaterialKindV590 =
  | "solar-photosphere-limb"
  | "rocky-hapke"
  | "venus-cloud-deck"
  | "earth-atmosphere-lut"
  | "gas-giant-flow"
  | "ice-giant-flow-primary"
  | "saturn-optical-depth"
  | "regolith-triplanar";

export type HeroBodyVisualSpecV590 = Readonly<{
  id: HeroBodyIdV590;
  name: string;
  shortName: string;
  group: "major" | "small-body";
  geometry: HeroGeometryKindV590;
  material: HeroMaterialKindV590;
  requiredAssets: readonly string[];
  maximumDesktopLodPixels: 4096 | 8192;
  maximumMobileLodPixels: 2048;
  radius: number;
  axialTiltRad: number;
  rotationRate: number;
  accent: string;
  subtitle: string;
  initialAdmission: HeroAssetAdmissionV590;
  proceduralPrimaryAllowed: boolean;
  presentationOnly: true;
}>;

export type CelestialOrbitV590 = Readonly<{
  bodyId: HeroBodyIdV590;
  semiMajorAxis: number;
  eccentricity: number;
  inclinationRad: number;
  ascendingNodeRad: number;
  argumentOfPeriapsisRad: number;
  phaseRad: number;
  periodLabel: string;
  presentationOnly: true;
}>;

export type VisualAssetFormatV590 = "ktx2" | "webp" | "jpeg" | "png" | "glb" | "bin" | "json";
export type VisualAssetFileV590 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: VisualAssetFormatV590;
  colorSpace: "srgb" | "linear" | "not-applicable";
  compression: string;
  lod?: 0 | 1 | 2;
  inheritedFrom?: "v9" | "v588" | "v589" | "v590";
}>;

export type VisualAssetQualityMinimumV590 = Readonly<{
  desktop: Readonly<{ width: number; height: number }>;
  mobile: Readonly<{ width: number; height: number }>;
}>;

export type VisualAssetManifestEntryV590 = Readonly<{
  id: string;
  body: HeroBodyIdV590 | "sky" | "stars" | "constellations" | NebulaIdV590;
  role: string;
  sourceUrl: string;
  sourceHost: string;
  license: Readonly<{
    id: "NASA-public-domain" | "USGS-public-domain" | "PDS-public-domain" | "Poly-Haven-CC0" | "Gaia-existing-admission";
    url: string;
  }>;
  sourceBytes: number;
  sourceSha256: string;
  derivation: Readonly<{
    tool: string;
    version: string;
    parameters: string;
  }>;
  /** Shipping floor for a Hero texture/model channel. Catalog assets omit it. */
  fullQualityMinimum?: VisualAssetQualityMinimumV590;
  variants: Readonly<{
    fullDesktop?: VisualAssetFileV590;
    fullMobile?: VisualAssetFileV590;
    liteDesktop?: VisualAssetFileV590;
    liteMobile?: VisualAssetFileV590;
  }>;
  presentationOnly: true;
}>;

export type DeepSpaceLayerManifestV590 = Readonly<{
  id: "milky-way" | "milky-way-stars" | "milky-way-dust" | NebulaIdV590;
  kind: "fixed-celestial-sphere" | "dust-sphere" | "catalog-nebula";
  rightAscensionDeg: number;
  declinationDeg: number;
  angularSizeDeg: number;
  cinematicDepthSlices: number;
  mobileDepthSlices: number;
  sciencePolicy: "linear-image" | "catalog-outline-only";
  admission: "admitted-readonly-dependency" | "asset-blocked";
  presentationOnly: true;
}>;

export type VisualAssetManifestV590 = Readonly<{
  version: typeof CELESTIAL_RENDERING_VERSION_V590;
  authorityNamespace: typeof CELESTIAL_RENDERING_NAMESPACE_V590;
  generatedAt: string;
  status: "candidate-integration-partial" | "visual-core-qualified" | "qualified-additive-3a-visual-candidate";
  manifestSha256: string;
  assets: readonly VisualAssetManifestEntryV590[];
  heroBodies: Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
  deepSpaceLayers: readonly DeepSpaceLayerManifestV590[];
  runtime: Readonly<{
    ktx2SentinelAssetId: string;
    basisTranscoderPath: "/basis-v590/";
    basisRuntimeReceiptSha256: string;
    basisTranscoderJsSha256: string;
    basisTranscoderWasmSha256: string;
    unsafeEvalRequired: false;
    coldStartTimeoutMs: 15000;
    warmAssetTimeoutMs: 6000;
    workerLimit: 1;
    assetFailureIsolation: true;
  }>;
  inheritedDependencies: readonly Readonly<{
    candidate: "v9" | "v588" | "v589";
    path: string;
    sha256: string;
    mode: "read-only";
  }>[];
  boundaries: Readonly<{
    formalProductPointer: "v263";
    frozenCandidatesRewritten: false;
    historicalEvidenceRewritten: false;
    scientificPayloadWriteback: false;
    scientificPayloadSha256: typeof CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590;
    singleCanvasRequired: true;
    productionPromotionAllowed: false;
    scientificAuthorityChanged: false;
  }>;
  budgets: Readonly<{
    sourceCacheBytesMaximum: 2147483648;
    fullCompressedBytesMaximum: 786432000;
    liteIncrementBytesMaximum: 9437184;
    liteTotalBytesMaximum: 85983232;
  }>;
}>;

export type HeroMaterialPacketV590 = Readonly<{
  body: HeroBodyIdV590;
  lod: 0 | 1 | 2;
  shaderProfile: HeroMaterialKindV590;
  requiredChannels: readonly string[];
  admission: HeroAssetAdmissionV590;
  residentBytes: number;
  sources: Readonly<Record<string, "ktx2" | "fallback" | "procedural-primary" | "blocked">>;
  scientificPayloadMutation: false;
}>;

export type StarfieldSnapshotV590 = Readonly<{
  directions: Float32Array;
  linearRgb: Float32Array;
  apparentFlux: Float32Array;
  psfClass: Uint8Array;
  sourceIds: BigUint64Array;
  constellationAnchorIndex: Int32Array;
  catalogVersion: string;
  recordCount: number;
  presentationOnly: true;
}>;

export type ScientificProjectionStateV590 = Readonly<{
  connection: "connected-v587-observation-summary";
  sourceUrl: typeof CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590;
  sourceVersion: "ObservationSummaryV3";
  sourceSummarySha256: string;
  formalProductPointer: typeof CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590;
  scientificPayloadSha256: typeof CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590;
  scientificPayloadWriteback: false;
  scientificAuthorityChanged: false;
}>;

const radians = (degrees: number) => degrees * Math.PI / 180;

const BODY_SPECS_V590: readonly HeroBodyVisualSpecV590[] = [
  { id: "sun", name: "Sun", shortName: "Sun", group: "major", geometry: "star", material: "solar-photosphere-limb", requiredAssets: ["sun-photosphere", "sun-chromosphere"], maximumDesktopLodPixels: 8192, maximumMobileLodPixels: 2048, radius: 1.04, axialTiltRad: radians(7.25), rotationRate: 0.018, accent: "#ffd39a", subtitle: "HMI photosphere · limb darkening · restrained corona", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "mercury", name: "Mercury", shortName: "Mercury", group: "major", geometry: "sphere", material: "rocky-hapke", requiredAssets: ["mercury-albedo", "mercury-normal", "mercury-roughness"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.28, axialTiltRad: radians(0.034), rotationRate: 0.007, accent: "#b8afa2", subtitle: "MESSENGER mosaic · crater relief · Hapke response", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "venus", name: "Venus", shortName: "Venus", group: "major", geometry: "sphere", material: "venus-cloud-deck", requiredAssets: ["venus-surface", "venus-clouds"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.44, axialTiltRad: radians(177.36), rotationRate: -0.003, accent: "#e8c788", subtitle: "Magellan surface · optically thick cloud deck", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "earth", name: "Earth", shortName: "Earth", group: "major", geometry: "sphere", material: "earth-atmosphere-lut", requiredAssets: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"], maximumDesktopLodPixels: 8192, maximumMobileLodPixels: 2048, radius: 0.48, axialTiltRad: radians(23.44), rotationRate: 0.055, accent: "#75d9ee", subtitle: "Blue Marble · cloud shadow · night limb · atmosphere LUT", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "moon", name: "Moon", shortName: "Moon", group: "major", geometry: "sphere", material: "rocky-hapke", requiredAssets: ["moon-albedo", "moon-normal", "moon-roughness"], maximumDesktopLodPixels: 8192, maximumMobileLodPixels: 2048, radius: 0.26, axialTiltRad: radians(6.68), rotationRate: 0.002, accent: "#d8d2c6", subtitle: "LRO color · LDEM relief · powder regolith", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "mars", name: "Mars", shortName: "Mars", group: "major", geometry: "sphere", material: "rocky-hapke", requiredAssets: ["mars-albedo", "mars-normal", "mars-roughness"], maximumDesktopLodPixels: 8192, maximumMobileLodPixels: 2048, radius: 0.37, axialTiltRad: radians(25.19), rotationRate: 0.053, accent: "#d98258", subtitle: "Viking albedo · MOLA relief · suspended dust", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "jupiter", name: "Jupiter", shortName: "Jupiter", group: "major", geometry: "sphere", material: "gas-giant-flow", requiredAssets: ["jupiter-albedo", "jupiter-band-mask"], maximumDesktopLodPixels: 8192, maximumMobileLodPixels: 2048, radius: 0.88, axialTiltRad: radians(3.13), rotationRate: 0.115, accent: "#e8bd8f", subtitle: "Juno/Cassini bands · Great Red Spot · limb depth", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "saturn", name: "Saturn", shortName: "Saturn", group: "major", geometry: "ringed-sphere", material: "saturn-optical-depth", requiredAssets: ["saturn-albedo", "saturn-band-mask", "saturn-ring-color", "saturn-ring-alpha"], maximumDesktopLodPixels: 8192, maximumMobileLodPixels: 2048, radius: 0.78, axialTiltRad: radians(26.73), rotationRate: 0.1, accent: "#ddcf9f", subtitle: "Cassini atmosphere · optical-depth rings · mutual shadows", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "uranus", name: "Uranus", shortName: "Uranus", group: "major", geometry: "sphere", material: "ice-giant-flow-primary", requiredAssets: [], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.61, axialTiltRad: radians(97.77), rotationRate: -0.068, accent: "#9ee1dc", subtitle: "Voyager-calibrated explicit flow primary", initialAdmission: "admitted", proceduralPrimaryAllowed: true, presentationOnly: true },
  { id: "neptune", name: "Neptune", shortName: "Neptune", group: "major", geometry: "sphere", material: "ice-giant-flow-primary", requiredAssets: [], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.6, axialTiltRad: radians(28.32), rotationRate: 0.072, accent: "#4f83d8", subtitle: "Voyager-calibrated bands · storm flow primary", initialAdmission: "admitted", proceduralPrimaryAllowed: true, presentationOnly: true },
  { id: "ceres", name: "Ceres", shortName: "Ceres", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["ceres-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.34, axialTiltRad: radians(4), rotationRate: 0.065, accent: "#b7b1a7", subtitle: "Dawn shape · Occator relief", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "vesta", name: "Vesta", shortName: "Vesta", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["vesta-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.32, axialTiltRad: radians(27), rotationRate: 0.085, accent: "#aa9b8b", subtitle: "Dawn shape · Rheasilvia relief", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "bennu", name: "Bennu", shortName: "Bennu", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["bennu-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.31, axialTiltRad: radians(175), rotationRate: 0.092, accent: "#8f877f", subtitle: "OSIRIS-REx rubble-pile silhouette", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "eros", name: "Eros", shortName: "Eros", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["eros-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.33, axialTiltRad: radians(89), rotationRate: 0.06, accent: "#9f8d79", subtitle: "NEAR Shoemaker shape · regolith microdetail", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "kleopatra", name: "216 Kleopatra", shortName: "Kleopatra", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["kleopatra-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.36, axialTiltRad: radians(83), rotationRate: 0.07, accent: "#9d826d", subtitle: "NASA radar dog-bone shape", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "tempel-1", name: "9P/Tempel 1", shortName: "Tempel 1", group: "small-body", geometry: "comet-nucleus", material: "regolith-triplanar", requiredAssets: ["tempel-1-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], maximumDesktopLodPixels: 4096, maximumMobileLodPixels: 2048, radius: 0.34, axialTiltRad: radians(12), rotationRate: 0.045, accent: "#9aa7a8", subtitle: "Deep Impact nucleus · deterministic dual tail", initialAdmission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
] as const;

export const HERO_BODY_SPECS_V590: readonly HeroBodyVisualSpecV590[] = Object.freeze(BODY_SPECS_V590);
export const HERO_BODY_SPEC_BY_ID_V590: Readonly<Record<HeroBodyIdV590, HeroBodyVisualSpecV590>> = Object.freeze(
  Object.fromEntries(BODY_SPECS_V590.map((body) => [body.id, body])) as Record<HeroBodyIdV590, HeroBodyVisualSpecV590>,
);

/** A file cannot grant admission until this route has a renderer that consumes
 * that exact asset identity. Future irregular-body files therefore stay
 * blocked instead of silently falling back to a sphere. */
export const HERO_RENDERER_CAPABILITIES_V590: Readonly<Record<HeroBodyIdV590, boolean>> = Object.freeze({
  sun: true,
  mercury: true,
  venus: true,
  earth: true,
  moon: true,
  mars: true,
  jupiter: true,
  saturn: true,
  uranus: true,
  neptune: true,
  ceres: false,
  vesta: false,
  bennu: true,
  eros: false,
  kleopatra: false,
  "tempel-1": false,
});

const qualityMinimumV590 = (
  desktopWidth: number,
  desktopHeight: number,
  mobileWidth = 2048,
  mobileHeight = 1024,
): VisualAssetQualityMinimumV590 => Object.freeze({
  desktop: Object.freeze({ width: desktopWidth, height: desktopHeight }),
  mobile: Object.freeze({ width: mobileWidth, height: mobileHeight }),
});

/** Exact per-channel Full admission floors. A 1024px texture can never satisfy a Hero channel. */
export const HERO_ASSET_QUALITY_MINIMUMS_V590: Readonly<Record<string, VisualAssetQualityMinimumV590>> = Object.freeze({
  "sun-photosphere": qualityMinimumV590(8192, 4096),
  "sun-chromosphere": qualityMinimumV590(4096, 2048),
  "mercury-albedo": qualityMinimumV590(4096, 2048),
  "mercury-normal": qualityMinimumV590(2048, 1024),
  "mercury-roughness": qualityMinimumV590(2048, 1024),
  "venus-surface": qualityMinimumV590(4096, 2048),
  "venus-clouds": qualityMinimumV590(4096, 2048),
  "earth-albedo": qualityMinimumV590(8192, 4096),
  "earth-normal": qualityMinimumV590(4096, 2048),
  "earth-roughness": qualityMinimumV590(4096, 2048),
  "earth-clouds": qualityMinimumV590(4096, 2048),
  "earth-cloud-alpha": qualityMinimumV590(4096, 2048),
  "earth-night": qualityMinimumV590(4096, 2048),
  "earth-night-mask": qualityMinimumV590(4096, 2048),
  "moon-albedo": qualityMinimumV590(8192, 4096),
  "moon-normal": qualityMinimumV590(4096, 2048),
  "moon-roughness": qualityMinimumV590(2048, 1024),
  "mars-albedo": qualityMinimumV590(8192, 4096),
  "mars-normal": qualityMinimumV590(4096, 2048),
  "mars-roughness": qualityMinimumV590(2048, 1024),
  "jupiter-albedo": qualityMinimumV590(8192, 4096),
  "jupiter-band-mask": qualityMinimumV590(4096, 2048),
  "saturn-albedo": qualityMinimumV590(8192, 4096),
  "saturn-band-mask": qualityMinimumV590(4096, 2048),
  "saturn-ring-color": qualityMinimumV590(4096, 4096, 2048, 2048),
  "saturn-ring-alpha": qualityMinimumV590(4096, 4096, 2048, 2048),
  "ceres-model": qualityMinimumV590(1, 1, 1, 1),
  "vesta-model": qualityMinimumV590(1, 1, 1, 1),
  "bennu-model": qualityMinimumV590(1, 1, 1, 1),
  "eros-model": qualityMinimumV590(1, 1, 1, 1),
  "kleopatra-model": qualityMinimumV590(1, 1, 1, 1),
  "tempel-1-model": qualityMinimumV590(1, 1, 1, 1),
  "regolith-cc0": qualityMinimumV590(4096, 4096, 2048, 2048),
  "regolith-normal-cc0": qualityMinimumV590(4096, 4096, 2048, 2048),
  "regolith-roughness-cc0": qualityMinimumV590(4096, 4096, 2048, 2048),
});

const rasterFallbackFormatsV590 = new Set<VisualAssetFormatV590>(["webp", "jpeg", "png"]);

export function visualAssetMeetsFullQualityV590(
  asset: VisualAssetManifestEntryV590,
  file: VisualAssetFileV590 | undefined,
  device: CelestialDeviceTierV590,
): boolean {
  if (!file || !asset.fullQualityMinimum) return false;
  const minimum = asset.fullQualityMinimum[device];
  return file.width >= minimum.width && file.height >= minimum.height;
}

export function computeHeroAdmissionsV590(
  assets: readonly VisualAssetManifestEntryV590[],
): Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>> {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return Object.freeze(Object.fromEntries(HERO_BODY_SPECS_V590.map((spec) => {
    if (spec.proceduralPrimaryAllowed) return [spec.id, "admitted"];
    if (!HERO_RENDERER_CAPABILITIES_V590[spec.id]) return [spec.id, "asset-blocked"];
    const admitted = spec.requiredAssets.length > 0 && spec.requiredAssets.every((assetId) => {
      const asset = byId.get(assetId);
      const expectedMinimum = HERO_ASSET_QUALITY_MINIMUMS_V590[assetId];
      if (!asset || !expectedMinimum || JSON.stringify(asset.fullQualityMinimum) !== JSON.stringify(expectedMinimum)) return false;
      const desktop = asset.variants.fullDesktop;
      const mobile = asset.variants.fullMobile;
      if (!visualAssetMeetsFullQualityV590(asset, desktop, "desktop") || !visualAssetMeetsFullQualityV590(asset, mobile, "mobile")) return false;
      if (desktop?.format === "glb") {
        return mobile?.format === "glb" && desktop.lod === 0 && mobile.lod === 1;
      }
      return desktop?.format === "ktx2"
        && mobile !== undefined
        && ["ktx2", "webp", "jpeg", "png"].includes(mobile.format)
        && rasterFallbackFormatsV590.has(asset.variants.liteDesktop?.format ?? "json")
        && rasterFallbackFormatsV590.has(asset.variants.liteMobile?.format ?? "json");
    });
    return [spec.id, admitted ? "admitted" : "asset-blocked"];
  })) as Record<HeroBodyIdV590, HeroAssetAdmissionV590>);
}

export function createScientificProjectionStateV590(value: unknown): ScientificProjectionStateV590 {
  const summary = parseKerrObservationSummaryV587(value);
  if (
    summary.authorityReference !== CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590
    || summary.authority.sciencePayloadMutationAllowed !== false
  ) throw new Error("v590-scientific-projection-identity");
  return Object.freeze({
    connection: "connected-v587-observation-summary",
    sourceUrl: CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590,
    sourceVersion: summary.version,
    sourceSummarySha256: summary.summarySha256,
    formalProductPointer: CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590,
    scientificPayloadSha256: summary.authorityReference,
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
  });
}

export function serializeScientificProjectionStateV590(state: ScientificProjectionStateV590): string {
  return JSON.stringify([
    state.connection,
    state.sourceUrl,
    state.sourceVersion,
    state.sourceSummarySha256,
    state.formalProductPointer,
    state.scientificPayloadSha256,
    state.scientificPayloadWriteback,
    state.scientificAuthorityChanged,
  ]);
}

const ORBIT_ROWS_V590: readonly [HeroBodyIdV590, number, number, number, number, number, number, string][] = [
  ["sun", 0, 0, 0, 0, 0, 0, "central"],
  ["mercury", 2.3, 0.2056, 7, 48.33, 29.12, 35, "87.97 d"],
  ["venus", 3.3, 0.0068, 3.39, 76.68, 54.88, 110, "224.70 d"],
  ["earth", 4.6, 0.0167, 0, -11.26, 114.2, 178, "365.26 d"],
  ["moon", 5.25, 0.055, 5.14, 125.08, 318.15, 198, "27.32 d"],
  ["mars", 6.2, 0.0934, 1.85, 49.56, 286.5, 245, "686.98 d"],
  ["ceres", 7.25, 0.0758, 10.59, 80.31, 73.6, 292, "4.60 y"],
  ["vesta", 8.2, 0.0887, 7.14, 103.85, 151.2, 319, "3.63 y"],
  ["jupiter", 10, 0.0489, 1.3, 100.46, 273.9, 34, "11.86 y"],
  ["tempel-1", 11.1, 0.517, 10.47, 68.94, 178.9, 82, "5.58 y"],
  ["saturn", 13.3, 0.0565, 2.49, 113.67, 339.4, 120, "29.46 y"],
  ["bennu", 15.1, 0.2037, 6.03, 2.06, 66.2, 164, "1.20 y"],
  ["eros", 16.8, 0.2227, 10.83, 304.4, 178.7, 207, "1.76 y"],
  ["kleopatra", 18.6, 0.25, 13.1, 215.2, 179.1, 250, "4.67 y"],
  ["uranus", 21, 0.0457, 0.77, 74, 96.9, 300, "84.0 y"],
  ["neptune", 25.5, 0.0113, 1.77, 131.8, 273.2, 344, "164.8 y"],
];

export const CELESTIAL_ORBITS_V590: readonly CelestialOrbitV590[] = Object.freeze(
  ORBIT_ROWS_V590.map(([bodyId, semiMajorAxis, eccentricity, inclinationDeg, ascendingNodeDeg, argumentDeg, phaseDeg, periodLabel]) => ({
    bodyId,
    semiMajorAxis,
    eccentricity,
    inclinationRad: radians(inclinationDeg),
    ascendingNodeRad: radians(ascendingNodeDeg),
    argumentOfPeriapsisRad: radians(argumentDeg),
    phaseRad: radians(phaseDeg),
    periodLabel,
    presentationOnly: true as const,
  })),
);

export const CELESTIAL_ORBIT_BY_ID_V590: Readonly<Record<HeroBodyIdV590, CelestialOrbitV590>> = Object.freeze(
  Object.fromEntries(CELESTIAL_ORBITS_V590.map((orbit) => [orbit.bodyId, orbit])) as Record<HeroBodyIdV590, CelestialOrbitV590>,
);

export const DEEP_SPACE_LAYERS_V590: readonly DeepSpaceLayerManifestV590[] = Object.freeze([
  { id: "milky-way", kind: "fixed-celestial-sphere", rightAscensionDeg: 266.4051, declinationDeg: -28.9362, angularSizeDeg: 360, cinematicDepthSlices: 1, mobileDepthSlices: 1, sciencePolicy: "linear-image", admission: "admitted-readonly-dependency", presentationOnly: true },
  { id: "milky-way-stars", kind: "fixed-celestial-sphere", rightAscensionDeg: 266.4051, declinationDeg: -28.9362, angularSizeDeg: 360, cinematicDepthSlices: 1, mobileDepthSlices: 1, sciencePolicy: "linear-image", admission: "admitted-readonly-dependency", presentationOnly: true },
  { id: "milky-way-dust", kind: "dust-sphere", rightAscensionDeg: 266.4051, declinationDeg: -28.9362, angularSizeDeg: 360, cinematicDepthSlices: 2, mobileDepthSlices: 1, sciencePolicy: "linear-image", admission: "admitted-readonly-dependency", presentationOnly: true },
  { id: "orion-nebula", kind: "catalog-nebula", rightAscensionDeg: 83.8221, declinationDeg: -5.3911, angularSizeDeg: 1.1, cinematicDepthSlices: 8, mobileDepthSlices: 2, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "lagoon-nebula", kind: "catalog-nebula", rightAscensionDeg: 270.925, declinationDeg: -24.375, angularSizeDeg: 1.5, cinematicDepthSlices: 6, mobileDepthSlices: 2, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "eagle-nebula", kind: "catalog-nebula", rightAscensionDeg: 274.7, declinationDeg: -13.8067, angularSizeDeg: 0.6, cinematicDepthSlices: 6, mobileDepthSlices: 2, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "helix-nebula", kind: "catalog-nebula", rightAscensionDeg: 337.4108, declinationDeg: -20.8372, angularSizeDeg: 0.47, cinematicDepthSlices: 6, mobileDepthSlices: 1, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "veil-nebula", kind: "catalog-nebula", rightAscensionDeg: 312.75, declinationDeg: 30.7, angularSizeDeg: 3, cinematicDepthSlices: 6, mobileDepthSlices: 1, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "north-america-nebula", kind: "catalog-nebula", rightAscensionDeg: 314.7, declinationDeg: 44.3, angularSizeDeg: 2, cinematicDepthSlices: 6, mobileDepthSlices: 1, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
] as const);

function rotateOrbitPlaneV590(vector: readonly [number, number, number], orbit: CelestialOrbitV590): readonly [number, number, number] {
  const [x, y, z] = vector;
  const cosI = Math.cos(orbit.inclinationRad);
  const sinI = Math.sin(orbit.inclinationRad);
  const inclinedY = y * cosI - z * sinI;
  const inclinedZ = y * sinI + z * cosI;
  const cosNode = Math.cos(orbit.ascendingNodeRad);
  const sinNode = Math.sin(orbit.ascendingNodeRad);
  return [x * cosNode + inclinedZ * sinNode, inclinedY, -x * sinNode + inclinedZ * cosNode];
}

export function celestialOrbitPointV590(orbit: CelestialOrbitV590, trueAnomalyRad: number): readonly [number, number, number] {
  if (orbit.semiMajorAxis === 0) return [0, 0, 0];
  const p = orbit.semiMajorAxis * (1 - orbit.eccentricity ** 2);
  const radius = p / (1 + orbit.eccentricity * Math.cos(trueAnomalyRad));
  const argument = trueAnomalyRad + orbit.argumentOfPeriapsisRad;
  return rotateOrbitPlaneV590([radius * Math.cos(argument), 0, radius * Math.sin(argument)], orbit);
}

export function celestialOrbitPathV590(orbit: CelestialOrbitV590, segments = 240): readonly number[] {
  if (orbit.semiMajorAxis === 0) return [];
  const result: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    result.push(...celestialOrbitPointV590(orbit, index / segments * Math.PI * 2));
  }
  return result;
}

export function resolveExposureV590(profile: CelestialRenderProfileV590): number {
  if (profile.mode === "science") return 1;
  if (profile.exposurePreset === "extreme-dark") return 0.36;
  if (profile.exposurePreset === "extreme-bright") return 1.55;
  return profile.deviceTier === "mobile" ? 0.94 : 1.06;
}

export function heroLodV590(projectedDiameterPixels: number, device: CelestialDeviceTierV590): 0 | 1 | 2 {
  if (projectedDiameterPixels >= (device === "mobile" ? 230 : 350)) return 0;
  if (projectedDiameterPixels >= (device === "mobile" ? 44 : 58)) return 1;
  return 2;
}

export function validateHeroBodySpecsV590(specs: readonly HeroBodyVisualSpecV590[] = HERO_BODY_SPECS_V590): void {
  if (specs.length !== 16 || new Set(specs.map((entry) => entry.id)).size !== 16) {
    throw new Error("v590-hero-body-count");
  }
  for (const spec of specs) {
    if (!spec.presentationOnly || spec.radius <= 0 || !Number.isFinite(spec.axialTiltRad)) {
      throw new Error(`v590-hero-spec:${spec.id}`);
    }
    if (spec.proceduralPrimaryAllowed && !["uranus", "neptune"].includes(spec.id)) {
      throw new Error(`v590-procedural-primary-forbidden:${spec.id}`);
    }
    if (spec.initialAdmission === "admitted" && spec.requiredAssets.length === 0 && !spec.proceduralPrimaryAllowed) {
      throw new Error(`v590-empty-admission:${spec.id}`);
    }
  }
}
