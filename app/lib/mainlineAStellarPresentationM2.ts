import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroV592,
} from "./stellarHeroesV592";
import { stellarMaterialProfile, type StellarMaterialProfile } from "./stellarMaterialProfile";
import {
  canonicalSerializeStellarPortraitRenderContractV594,
  type StellarPortraitRenderModeV594,
} from "./stellarPortraitRenderContractV594";
import {
  createStellarPortraitProfileFromRenderContractV596,
  createStellarPortraitRenderContractV596,
  type StellarPortraitProfileV596,
  type StellarPortraitRenderContractV596,
} from "./stellarPortraitRenderContractV596";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const MAINLINE_A_STELLAR_PRESENTATION_M2_VERSION = "mainline-a-stellar-presentation-m2-v1" as const;

/** Fixed A-line scope; this display adapter does not admit additional Beta objects. */
export const MAINLINE_A_STELLAR_PRESENTATION_M2_IDS = Object.freeze([
  "alpha-centauri-a", "achernar", "betelgeuse", "sirius-a", "rigel", "antares",
  "canopus", "arcturus", "vega", "capella-a", "procyon-a", "aldebaran",
] as const);

const permittedIds = new Set<string>(MAINLINE_A_STELLAR_PRESENTATION_M2_IDS);
const nearbyAliases: Readonly<Record<string, string>> = Object.freeze({
  sirius: "sirius-a",
  "alpha-centauri": "alpha-centauri-a",
  capella: "capella-a",
  procyon: "procyon-a",
});

type LinearColor = readonly [number, number, number];

export type MainlineAStellarAppearanceM2 = Readonly<{
  version: typeof MAINLINE_A_STELLAR_PRESENTATION_M2_VERSION;
  heroId: string;
  mode: StellarPortraitRenderModeV594;
  contractSha256: string;
  morphologySha256: string;
  signatureSha256: string;
  colorPolicy: "bounded-scene-linear-to-srgb-display-only";
  baseColor: string;
  coreColor: string;
  limbColor: string;
  haloColor: string;
  sceneLinearColor: LinearColor;
  coreLinearColor: LinearColor;
  limbLinearColor: LinearColor;
  haloLinearColor: LinearColor;
  colorTemperatureK: number;
  family: StellarPortraitRenderContractV596["archetype"];
  topology: StellarPortraitRenderContractV596["morphology"]["topology"];
  deterministicSeed: number;
  axisRatio: number;
  geometryScale: StellarPortraitRenderContractV596["geometry"]["scale"];
  surface: StellarPortraitRenderContractV596["morphology"]["surface"];
  corona: StellarPortraitRenderContractV596["morphology"]["corona"];
  halo: StellarPortraitRenderContractV596["morphology"]["halo"];
  polarBrightening: number;
  equatorialDarkening: number;
  gravityTransition: number;
  surfaceContrast: number;
  limbDarkening: number;
  haloEnabled: boolean;
  coronaEnabled: boolean;
  haloStrength: number;
  coronaStrength: number;
  coronaFalloff: number;
  presentationOnly: true;
  resolvedSurface: false;
  observationTexture: false;
  measuredAuthorityGranted: false;
  scientificPayloadWriteback: false;
}>;

export type MainlineAStellarPresentationM2 = Readonly<{
  version: typeof MAINLINE_A_STELLAR_PRESENTATION_M2_VERSION;
  hero: StellarHeroV592;
  material: Readonly<StellarMaterialProfile>;
  contract: StellarPortraitRenderContractV596;
  portrait: StellarPortraitProfileV596;
  appearance: MainlineAStellarAppearanceM2;
  presentationOnly: true;
  scientificPayloadWriteback: false;
}>;

function boundedLinearColor(color: LinearColor): LinearColor {
  if (color.some((channel) => !Number.isFinite(channel))) {
    throw new Error("mainline-a-m2-nonfinite-display-color");
  }
  const bound = (channel: number) => Math.min(1, Math.max(0, channel));
  return Object.freeze([bound(color[0]), bound(color[1]), bound(color[2])] as const);
}

function mapLinearColor(color: LinearColor, operation: (channel: number) => number): LinearColor {
  return boundedLinearColor([operation(color[0]), operation(color[1]), operation(color[2])]);
}

function displayHex(color: LinearColor): string {
  return `#${color.map((channel) => {
    const srgb = channel <= 0.0031308
      ? channel * 12.92
      : 1.055 * channel ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, srgb)) * 255).toString(16).padStart(2, "0");
  }).join("")}`;
}

/** Separate display seal: never inserted into, or substituted for, the sealed v596 contract. */
export function computeMainlineAStellarAppearanceSignatureM2(
  appearance: Omit<MainlineAStellarAppearanceM2, "signatureSha256"> | MainlineAStellarAppearanceM2,
): string {
  const unsigned = { ...appearance } as Record<string, unknown>;
  delete unsigned.signatureSha256;
  return sha256Utf8HexV566(canonicalSerializeStellarPortraitRenderContractV594(unsigned));
}

/** A 2D display vocabulary derived from the same contract/profile consumed by the scene. */
export function createMainlineAStellarAppearanceM2(
  contract: StellarPortraitRenderContractV596,
  portrait: StellarPortraitProfileV596,
): MainlineAStellarAppearanceM2 {
  if (portrait.renderContractSha256 !== contract.contractSha256
    || portrait.baselineV594ContractSha256 !== contract.baselineV594ContractSha256
    || portrait.morphology.profileSha256 !== contract.morphology.profileSha256) {
    throw new Error("mainline-a-m2-profile-contract-mismatch");
  }
  const colorTemperatureK = contract.fields.temperatureK.value;
  if (typeof colorTemperatureK !== "number" || !Number.isFinite(colorTemperatureK)) {
    throw new Error("mainline-a-m2-temperature-unavailable");
  }
  // Legacy displayColor classifies some blue giants as orange. The scene uses
  // sceneLinearColor as its common temperature-driven base, so all SVG tones
  // derive from that base instead of introducing another temperature palette.
  const sceneLinearColor = boundedLinearColor(portrait.sceneLinearColor);
  const coreLinearColor = mapLinearColor(sceneLinearColor, (channel) => channel * 0.74 + 0.26);
  const limbLinearColor = mapLinearColor(sceneLinearColor, (channel) => channel * 0.14);
  const haloLinearColor = mapLinearColor(sceneLinearColor, (channel) => channel * 0.82);
  const surface = contract.morphology.surface;
  const unsigned: Omit<MainlineAStellarAppearanceM2, "signatureSha256"> = {
    version: MAINLINE_A_STELLAR_PRESENTATION_M2_VERSION,
    heroId: contract.heroId,
    mode: contract.mode,
    contractSha256: contract.contractSha256,
    morphologySha256: contract.morphology.profileSha256,
    colorPolicy: "bounded-scene-linear-to-srgb-display-only",
    baseColor: displayHex(sceneLinearColor),
    coreColor: displayHex(coreLinearColor),
    limbColor: displayHex(limbLinearColor),
    haloColor: displayHex(haloLinearColor),
    sceneLinearColor,
    coreLinearColor,
    limbLinearColor,
    haloLinearColor,
    colorTemperatureK,
    family: contract.archetype,
    topology: contract.morphology.topology,
    deterministicSeed: contract.deterministicSeed,
    axisRatio: contract.geometry.axisRatio,
    geometryScale: contract.geometry.scale,
    surface,
    corona: contract.morphology.corona,
    halo: contract.morphology.halo,
    polarBrightening: surface.polarBrightening,
    equatorialDarkening: surface.equatorialDarkening,
    gravityTransition: surface.gravityTransition,
    surfaceContrast: portrait.granulationContrast,
    limbDarkening: portrait.limbDarkening,
    haloEnabled: contract.halo.enabled,
    coronaEnabled: contract.corona.enabled,
    haloStrength: portrait.haloStrength,
    coronaStrength: portrait.coronaStrength,
    coronaFalloff: portrait.coronaFalloff,
    presentationOnly: true,
    resolvedSurface: false,
    observationTexture: false,
    measuredAuthorityGranted: false,
    scientificPayloadWriteback: false,
  };
  return Object.freeze({ ...unsigned, signatureSha256: computeMainlineAStellarAppearanceSignatureM2(unsigned) });
}

/** Exact presentation identity only; never infer identity from a name or Gaia anchor. */
export function resolveMainlineAStellarPresentationM2(
  objectOrCatalogId: string,
  mode: StellarPortraitRenderModeV594 = "cinematic",
): MainlineAStellarPresentationM2 | null {
  const separator = objectOrCatalogId.indexOf(":");
  const prefix = separator < 0 ? "" : objectOrCatalogId.slice(0, separator);
  let objectId = separator < 0 ? objectOrCatalogId : objectOrCatalogId.slice(separator + 1);
  if (prefix && !["stellar-hero", "star", "nearby-star", "bright-star"].includes(prefix)) return null;
  if (prefix === "nearby-star" && Object.hasOwn(nearbyAliases, objectId)) objectId = nearbyAliases[objectId];
  if (!permittedIds.has(objectId)) return null;
  const hero = STELLAR_HERO_BY_ID_V592[objectId as keyof typeof STELLAR_HERO_BY_ID_V592];
  const material = Object.freeze(stellarMaterialProfile({
    id: `stellar-hero:${hero.id}`,
    colorBpRp: hero.colorBpRp,
    mag: hero.apparentMagnitudeV,
    parallaxMas: hero.parallaxMas,
    fallbackColor: "#ffd891",
  }));
  const contract = createStellarPortraitRenderContractV596(hero, mode);
  const portrait = createStellarPortraitProfileFromRenderContractV596(contract, material);
  return Object.freeze({
    version: MAINLINE_A_STELLAR_PRESENTATION_M2_VERSION,
    hero,
    material,
    contract,
    portrait,
    appearance: createMainlineAStellarAppearanceM2(contract, portrait),
    presentationOnly: true,
    scientificPayloadWriteback: false,
  });
}
