import {
  CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589,
  CELESTIAL_ART_GAIA_LITE_SHA256_V589,
  CELESTIAL_ART_MANIFEST_SHA256_V589,
} from "../data/celestialArtManifestV589.generated";

export const CELESTIAL_ART_VERSION_V589 = "v589-celestial-art-candidate-v1" as const;
export const CELESTIAL_ART_NAMESPACE_V589 = "candidate-v589-celestial-art" as const;
export const CELESTIAL_ART_ROUTE_V589 = "/local-shadow-v589" as const;
export const CELESTIAL_ART_MANIFEST_URL_V589 = "/data/celestial-art-v589/manifest.json" as const;
export const CELESTIAL_ART_CONSTELLATION_BINDING_URL_V589 =
  "/data/celestial-art-v589/constellation-gaia-bindings-v589.json" as const;
export const CELESTIAL_ART_GAIA_LITE_URL_V589 =
  "/data/celestial-art-v589/gaia-lite-46000-v589.bin" as const;
export const CELESTIAL_ART_FORMAL_PRODUCT_POINTER_V589 = "v263" as const;
export const CELESTIAL_ART_SCIENTIFIC_PAYLOAD_SHA256_V589 =
  "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674" as const;

export {
  CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589,
  CELESTIAL_ART_GAIA_LITE_SHA256_V589,
  CELESTIAL_ART_MANIFEST_SHA256_V589,
};

export type CelestialModeV589 = "science" | "cinematic";
export type CelestialDeliveryTierV589 = "standalone-full" | "vercel-lite";
export type CelestialDeviceTierV589 = "desktop" | "mobile";
export type CelestialExposurePresetV589 = "nominal" | "extreme-dark" | "extreme-bright";

export type HeroBodyIdV589 =
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

export type CelestialRenderProfileV589 = Readonly<{
  mode: CelestialModeV589;
  deliveryTier: CelestialDeliveryTierV589;
  deviceTier: CelestialDeviceTierV589;
  selectedBody: HeroBodyIdV589;
  exposurePreset: CelestialExposurePresetV589;
}>;

export type HeroAssetAdmissionV589 = "admitted" | "asset-blocked";
export type HeroGeometryKindV589 = "star" | "sphere" | "ringed-sphere" | "irregular-mesh" | "comet-nucleus";
export type HeroMaterialKindV589 =
  | "solar-photosphere"
  | "rocky-pbr"
  | "venus-cloud-deck"
  | "earth-layered"
  | "gas-giant-flow"
  | "ice-giant-flow-primary"
  | "saturn-ring-optical-depth"
  | "regolith-triplanar";

export type HeroBodyVisualSpecV589 = Readonly<{
  id: HeroBodyIdV589;
  name: string;
  shortName: string;
  group: "major" | "small-body";
  geometry: HeroGeometryKindV589;
  material: HeroMaterialKindV589;
  requiredAssets: readonly string[];
  radius: number;
  axialTiltRad: number;
  rotationRate: number;
  accent: string;
  subtitle: string;
  admission: HeroAssetAdmissionV589;
  proceduralPrimaryAllowed: boolean;
  presentationOnly: true;
}>;

export type CelestialOrbitV589 = Readonly<{
  bodyId: HeroBodyIdV589;
  semiMajorAxis: number;
  eccentricity: number;
  inclinationRad: number;
  ascendingNodeRad: number;
  argumentOfPeriapsisRad: number;
  phaseRad: number;
  periodLabel: string;
  presentationOnly: true;
}>;

export type VisualAssetFileV589 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp" | "jpeg" | "glb" | "bin" | "json";
  colorSpace: "srgb" | "linear" | "not-applicable";
  compression: string;
  lod?: 0 | 1 | 2;
}>;

export type VisualAssetManifestEntryV589 = Readonly<{
  id: string;
  body: HeroBodyIdV589 | "sky" | "stars" | "constellations";
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
  variants: Readonly<{
    fullDesktop?: VisualAssetFileV589;
    fullMobile?: VisualAssetFileV589;
    liteDesktop?: VisualAssetFileV589;
    liteMobile?: VisualAssetFileV589;
  }>;
  presentationOnly: true;
}>;

export type VisualAssetManifestV589 = Readonly<{
  version: typeof CELESTIAL_ART_VERSION_V589;
  authorityNamespace: typeof CELESTIAL_ART_NAMESPACE_V589;
  generatedAt: string;
  status: "all-heroes-admitted" | "candidate-partial-asset-blocked";
  manifestSha256: string;
  assets: readonly VisualAssetManifestEntryV589[];
  heroBodies: Readonly<Record<HeroBodyIdV589, HeroAssetAdmissionV589>>;
  boundaries: Readonly<{
    formalProductPointer: "v263";
    v588Rewritten: false;
    historicalEvidenceRewritten: false;
    scientificPayloadWriteback: false;
    singleCanvasRequired: true;
    productionPromotionAllowed: false;
  }>;
  budgets: Readonly<{
    fullCompressedBytesMaximum: 786432000;
    liteIncrementBytesMaximum: 9437184;
    liteTotalBytesMaximum: 85983232;
  }>;
  modelPipeline: Readonly<{
    bennuReceiptPath: string;
    bennuReceiptSha256: string;
    lodCount: 3;
    normals: true;
    meshopt: true;
    stablePivot: true;
  }> | null;
}>;

export type StarfieldSnapshotV589 = Readonly<{
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  psfClass: Uint8Array;
  sourceIds: BigUint64Array;
  catalogVersion: string;
  recordCount: number;
  presentationOnly: true;
}>;

const radians = (degrees: number) => degrees * Math.PI / 180;

const BODY_SPECS: readonly HeroBodyVisualSpecV589[] = [
  { id: "sun", name: "Sun", shortName: "Sun", group: "major", geometry: "star", material: "solar-photosphere", requiredAssets: ["sun-albedo"], radius: 1.04, axialTiltRad: radians(7.25), rotationRate: 0.018, accent: "#ffd6a0", subtitle: "SDO photosphere / restrained corona", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "mercury", name: "Mercury", shortName: "Mercury", group: "major", geometry: "sphere", material: "rocky-pbr", requiredAssets: ["mercury-albedo", "mercury-normal", "mercury-roughness"], radius: 0.28, axialTiltRad: radians(0.034), rotationRate: 0.007, accent: "#b8afa2", subtitle: "MESSENGER global mosaic / crater relief", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "venus", name: "Venus", shortName: "Venus", group: "major", geometry: "sphere", material: "venus-cloud-deck", requiredAssets: ["venus-surface", "venus-clouds"], radius: 0.44, axialTiltRad: radians(177.36), rotationRate: -0.003, accent: "#e8c788", subtitle: "Magellan surface / optically thick cloud deck", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "earth", name: "Earth", shortName: "Earth", group: "major", geometry: "sphere", material: "earth-layered", requiredAssets: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"], radius: 0.48, axialTiltRad: radians(23.44), rotationRate: 0.055, accent: "#76daf1", subtitle: "Blue Marble / cloud shadow / city-light night limb", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "moon", name: "Moon", shortName: "Moon", group: "major", geometry: "sphere", material: "rocky-pbr", requiredAssets: ["moon-albedo", "moon-normal", "moon-roughness"], radius: 0.26, axialTiltRad: radians(6.68), rotationRate: 0.002, accent: "#d8d2c6", subtitle: "LRO color / displacement-derived relief", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "mars", name: "Mars", shortName: "Mars", group: "major", geometry: "sphere", material: "rocky-pbr", requiredAssets: ["mars-albedo", "mars-normal", "mars-roughness"], radius: 0.37, axialTiltRad: radians(25.19), rotationRate: 0.053, accent: "#d98258", subtitle: "Viking / MOLA relief / mineral roughness", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "jupiter", name: "Jupiter", shortName: "Jupiter", group: "major", geometry: "sphere", material: "gas-giant-flow", requiredAssets: ["jupiter-albedo", "jupiter-band-mask"], radius: 0.88, axialTiltRad: radians(3.13), rotationRate: 0.115, accent: "#e8bd8f", subtitle: "Juno/Cassini bands / storm advection / limb darkening", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "saturn", name: "Saturn", shortName: "Saturn", group: "major", geometry: "ringed-sphere", material: "saturn-ring-optical-depth", requiredAssets: ["saturn-albedo", "saturn-band-mask", "saturn-ring-color", "saturn-ring-alpha"], radius: 0.78, axialTiltRad: radians(26.73), rotationRate: 0.1, accent: "#ddcf9f", subtitle: "Cassini atmosphere / optical-depth ring shadows", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "uranus", name: "Uranus", shortName: "Uranus", group: "major", geometry: "sphere", material: "ice-giant-flow-primary", requiredAssets: [], radius: 0.61, axialTiltRad: radians(97.77), rotationRate: -0.068, accent: "#9ee1dc", subtitle: "Voyager-calibrated ice-giant flow model", admission: "admitted", proceduralPrimaryAllowed: true, presentationOnly: true },
  { id: "neptune", name: "Neptune", shortName: "Neptune", group: "major", geometry: "sphere", material: "ice-giant-flow-primary", requiredAssets: [], radius: 0.60, axialTiltRad: radians(28.32), rotationRate: 0.072, accent: "#4f83d8", subtitle: "Voyager-calibrated bands / storm flow model", admission: "admitted", proceduralPrimaryAllowed: true, presentationOnly: true },
  { id: "ceres", name: "Ceres", shortName: "Ceres", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["ceres-model", "regolith-cc0"], radius: 0.34, axialTiltRad: radians(4), rotationRate: 0.065, accent: "#b7b1a7", subtitle: "Dawn shape / albedo / Occator relief", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "vesta", name: "Vesta", shortName: "Vesta", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["vesta-model", "regolith-cc0"], radius: 0.32, axialTiltRad: radians(27), rotationRate: 0.085, accent: "#aa9b8b", subtitle: "Dawn shape / Rheasilvia relief", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "bennu", name: "Bennu", shortName: "Bennu", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["bennu-model", "regolith-cc0"], radius: 0.31, axialTiltRad: radians(175), rotationRate: 0.092, accent: "#8f877f", subtitle: "OSIRIS-REx shape / rubble-pile silhouette", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "eros", name: "Eros", shortName: "Eros", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["eros-model", "regolith-cc0"], radius: 0.33, axialTiltRad: radians(89), rotationRate: 0.06, accent: "#9f8d79", subtitle: "NEAR Shoemaker shape / regolith microdetail", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "kleopatra", name: "216 Kleopatra", shortName: "Kleopatra", group: "small-body", geometry: "irregular-mesh", material: "regolith-triplanar", requiredAssets: ["kleopatra-model", "regolith-cc0"], radius: 0.36, axialTiltRad: radians(83), rotationRate: 0.07, accent: "#9d826d", subtitle: "NASA radar dog-bone shape", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
  { id: "tempel-1", name: "9P/Tempel 1", shortName: "Tempel 1", group: "small-body", geometry: "comet-nucleus", material: "regolith-triplanar", requiredAssets: ["tempel-1-model", "regolith-cc0"], radius: 0.34, axialTiltRad: radians(12), rotationRate: 0.045, accent: "#9aa7a8", subtitle: "Deep Impact nucleus / fixed-seed dust and ion tails", admission: "asset-blocked", proceduralPrimaryAllowed: false, presentationOnly: true },
] as const;

export const HERO_BODY_SPECS_V589 = Object.freeze(BODY_SPECS);
export const HERO_BODY_SPEC_BY_ID_V589 = Object.freeze(
  Object.fromEntries(BODY_SPECS.map((body) => [body.id, body])) as Record<HeroBodyIdV589, HeroBodyVisualSpecV589>,
);

const ORBIT_ROWS: readonly [HeroBodyIdV589, number, number, number, number, number, number, string][] = [
  ["sun", 0, 0, 0, 0, 0, 0, "central"],
  ["mercury", 2.3, 0.2056, 7.0, 48.33, 29.12, 35, "87.97 d"],
  ["venus", 3.3, 0.0068, 3.39, 76.68, 54.88, 110, "224.70 d"],
  ["earth", 4.6, 0.0167, 0, -11.26, 114.2, 178, "365.26 d"],
  ["moon", 5.25, 0.055, 5.14, 125.08, 318.15, 198, "27.32 d"],
  ["mars", 6.2, 0.0934, 1.85, 49.56, 286.5, 245, "686.98 d"],
  ["ceres", 7.25, 0.0758, 10.59, 80.31, 73.6, 292, "4.60 y"],
  ["vesta", 8.2, 0.0887, 7.14, 103.85, 151.2, 319, "3.63 y"],
  ["jupiter", 10.0, 0.0489, 1.30, 100.46, 273.9, 34, "11.86 y"],
  ["tempel-1", 11.1, 0.517, 10.47, 68.94, 178.9, 82, "5.58 y"],
  ["saturn", 13.3, 0.0565, 2.49, 113.67, 339.4, 120, "29.46 y"],
  ["bennu", 15.1, 0.2037, 6.03, 2.06, 66.2, 164, "1.20 y"],
  ["eros", 16.8, 0.2227, 10.83, 304.4, 178.7, 207, "1.76 y"],
  ["kleopatra", 18.6, 0.250, 13.1, 215.2, 179.1, 250, "4.67 y"],
  ["uranus", 21.0, 0.0457, 0.77, 74.0, 96.9, 300, "84.0 y"],
  ["neptune", 25.5, 0.0113, 1.77, 131.8, 273.2, 344, "164.8 y"],
];

export const CELESTIAL_ORBITS_V589: readonly CelestialOrbitV589[] = Object.freeze(
  ORBIT_ROWS.map(([bodyId, semiMajorAxis, eccentricity, inclinationDeg, ascendingNodeDeg, argumentDeg, phaseDeg, periodLabel]) => ({
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

export const CELESTIAL_ORBIT_BY_ID_V589 = Object.freeze(
  Object.fromEntries(CELESTIAL_ORBITS_V589.map((orbit) => [orbit.bodyId, orbit])) as Record<HeroBodyIdV589, CelestialOrbitV589>,
);

export const DEFAULT_CONSTELLATIONS_DESKTOP_V589 = Object.freeze([
  "Ori", "UMa", "Cas", "Cyg", "Lyr", "Aql", "Sco", "Sgr", "Tau", "Gem", "Leo", "And",
] as const);
export const DEFAULT_CONSTELLATIONS_MOBILE_V589 = Object.freeze([
  "Ori", "UMa", "Cas", "Cyg", "Lyr", "Aql", "Sco", "Sgr",
] as const);

function rotateOrbitPlane(vector: readonly [number, number, number], orbit: CelestialOrbitV589): readonly [number, number, number] {
  const [x, y, z] = vector;
  const cosI = Math.cos(orbit.inclinationRad);
  const sinI = Math.sin(orbit.inclinationRad);
  const inclinedY = y * cosI - z * sinI;
  const inclinedZ = y * sinI + z * cosI;
  const cosNode = Math.cos(orbit.ascendingNodeRad);
  const sinNode = Math.sin(orbit.ascendingNodeRad);
  return [
    x * cosNode + inclinedZ * sinNode,
    inclinedY,
    -x * sinNode + inclinedZ * cosNode,
  ];
}

export function celestialOrbitPointV589(
  orbit: CelestialOrbitV589,
  trueAnomalyRad: number,
): readonly [number, number, number] {
  if (orbit.semiMajorAxis === 0) return [0, 0, 0];
  const p = orbit.semiMajorAxis * (1 - orbit.eccentricity ** 2);
  const radius = p / (1 + orbit.eccentricity * Math.cos(trueAnomalyRad));
  const argument = trueAnomalyRad + orbit.argumentOfPeriapsisRad;
  return rotateOrbitPlane([radius * Math.cos(argument), 0, radius * Math.sin(argument)], orbit);
}

export function celestialOrbitPathV589(orbit: CelestialOrbitV589, segments = 240): readonly number[] {
  if (orbit.semiMajorAxis === 0) return [];
  const result: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    result.push(...celestialOrbitPointV589(orbit, index / segments * Math.PI * 2));
  }
  return result;
}

export function visualMagnitudeFluxV589(magnitude: number): number {
  if (!Number.isFinite(magnitude)) return 0;
  return Math.pow(10, -0.4 * magnitude);
}

export function deterministicSourceUnitV589(sourceId: string | bigint): number {
  const text = String(sourceId);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffff_ffff;
}

export function classifyStarPsfV589(magnitude: number, sourceId: string | bigint): 0 | 1 | 2 {
  const stable = deterministicSourceUnitV589(sourceId);
  if (magnitude <= 3.4 + stable * 0.16) return 2;
  if (magnitude <= 8.2 + stable * 0.24) return 1;
  return 0;
}

export function starSizeV589(magnitude: number, sourceId: string | bigint): number {
  const flux = visualMagnitudeFluxV589(magnitude);
  const jitter = 0.94 + deterministicSourceUnitV589(sourceId) * 0.12;
  return Math.min(5.8, Math.max(0.42, (0.52 + Math.sqrt(flux) * 7.2) * jitter));
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Deterministic Gaia BP-RP approximation, returned in linear RGB. */
export function bpRpToLinearRgbV589(bpRp: number | null): readonly [number, number, number] {
  const color = Number.isFinite(bpRp) ? Math.max(-0.5, Math.min(4, Number(bpRp))) : 0.82;
  const temperature = Math.max(2400, Math.min(12000, 4600 * (1 / (0.92 * color + 1.7) + 1 / (0.92 * color + 0.62))));
  const scaled = temperature / 100;
  let red: number;
  let green: number;
  let blue: number;
  if (scaled <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(scaled) - 161.1195681661;
    blue = scaled <= 19 ? 0 : 138.5177312231 * Math.log(scaled - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * Math.pow(scaled - 60, -0.1332047592);
    green = 288.1221695283 * Math.pow(scaled - 60, -0.0755148492);
    blue = 255;
  }
  return [red, green, blue].map((channel) => srgbToLinear(Math.max(0, Math.min(255, channel)) / 255)) as unknown as readonly [number, number, number];
}

export function angularDistanceDegV589(
  leftRaDeg: number,
  leftDecDeg: number,
  rightRaDeg: number,
  rightDecDeg: number,
): number {
  const leftRa = radians(leftRaDeg);
  const leftDec = radians(leftDecDeg);
  const rightRa = radians(rightRaDeg);
  const rightDec = radians(rightDecDeg);
  const cosine = Math.sin(leftDec) * Math.sin(rightDec)
    + Math.cos(leftDec) * Math.cos(rightDec) * Math.cos(leftRa - rightRa);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

export function resolveExposureV589(profile: CelestialRenderProfileV589): number {
  if (profile.mode === "science") return 1;
  if (profile.exposurePreset === "extreme-dark") return 0.35;
  if (profile.exposurePreset === "extreme-bright") return 1.7;
  return profile.deviceTier === "mobile" ? 0.96 : 1.08;
}

export function heroLodV589(projectedDiameterPixels: number, device: CelestialDeviceTierV589): 0 | 1 | 2 {
  if (projectedDiameterPixels >= (device === "mobile" ? 240 : 360)) return 0;
  if (projectedDiameterPixels >= (device === "mobile" ? 42 : 56)) return 1;
  return 2;
}

export function validateHeroBodySpecsV589(specs: readonly HeroBodyVisualSpecV589[] = HERO_BODY_SPECS_V589): void {
  if (specs.length !== 16 || new Set(specs.map((entry) => entry.id)).size !== 16) {
    throw new Error("v589-hero-body-count");
  }
  for (const spec of specs) {
    if (!spec.presentationOnly || spec.radius <= 0 || !Number.isFinite(spec.axialTiltRad)) {
      throw new Error(`v589-hero-spec:${spec.id}`);
    }
    if (spec.proceduralPrimaryAllowed && !["uranus", "neptune"].includes(spec.id)) {
      throw new Error(`v589-procedural-primary-forbidden:${spec.id}`);
    }
    if (spec.admission === "admitted" && spec.requiredAssets.length === 0 && !spec.proceduralPrimaryAllowed) {
      throw new Error(`v589-empty-admission:${spec.id}`);
    }
  }
}
