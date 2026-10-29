import {
  DEEP_SPACE_VISUAL_ASSET_COUNT_V592,
  DEEP_SPACE_VISUAL_ASSETS_V592,
  DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
} from "../data/deepSpaceVisualAssetsV592.generated";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export {
  DEEP_SPACE_VISUAL_ASSET_COUNT_V592,
  DEEP_SPACE_VISUAL_ASSETS_V592,
  DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
};

export const DEEP_SPACE_VISUAL_MANIFEST_URL_V592 = "/data/living-universe-v592/deep-space-visual-assets.json" as const;
export const DEEP_SPACE_VISUAL_IDS_V592 = Object.freeze([
  "andromeda-galaxy",
  "triangulum-galaxy",
  "omega-centauri",
  "sombrero-galaxy",
  "whirlpool-galaxy",
  "bodes-galaxy",
  "southern-pinwheel-galaxy",
  "centaurus-a",
  "cigar-galaxy",
  "pinwheel-galaxy",
  "virgo-a-galaxy",
  "black-eye-galaxy",
  "sunflower-galaxy",
  "pleiades",
  "hyades",
  "47-tucanae",
  "hercules-globular-cluster",
  "messier-3",
  "messier-5",
  "messier-15",
  "messier-22",
  "beehive-cluster",
  "double-cluster",
  "jewel-box-cluster",
] as const);
export type DeepSpaceVisualIdV592 = (typeof DEEP_SPACE_VISUAL_IDS_V592)[number];

export type DeepSpaceVisualFileV592 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb";
  compression: string;
  role: string;
  depthIndex: number;
}>;

export type DeepSpaceVisualSliceV592 = Readonly<{
  depthIndex: number;
  depthOffset: number;
  opacityPolicy: string;
  ktx2?: DeepSpaceVisualFileV592;
  fallback: DeepSpaceVisualFileV592;
}>;

export type DeepSpaceVisualTierV592 = Readonly<{
  width: number;
  height: number;
  aspect: number;
  depthSliceCount: number;
  slices: readonly DeepSpaceVisualSliceV592[];
}>;

export type DeepSpaceVisualAssetV592 = Readonly<{
  target: DeepSpaceVisualIdV592;
  category: "galaxy" | "cluster";
  nasaId: string;
  status: "source-crop-and-runtime-variants-admitted" | "gaia-catalog-derived-runtime-variants-admitted" | "openngc-catalog-derived-analytic-model-admitted";
  visualModelKind: "source-observation-depth-impostor" | "gaia-catalog-derived-star-field-impostor" | "openngc-catalog-derived-galaxy-analytic";
  source: Readonly<{
    url: string;
    path: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    colorSpace: "srgb" | "not-applicable";
    license: string;
    licenseUrl: string;
    credit: string;
    observationEncoding: Readonly<{
      bands: readonly string[];
      colorPolicy: string;
      nakedEyeRepresentationClaimed: false;
      scienceModePolicy: string;
      cinematicModePolicy: string;
    }>;
  }>;
  crop?: Readonly<{
    policy: string;
    left: number;
    top: number;
    width: number;
    height: number;
    retainedSourcePixelFraction: number;
    visualAnalysisReceiptSha256: string;
  }>;
  catalogSelection?: Readonly<{
    coordinateFrame: "ICRS/J2000";
    selectionRadiusDeg?: number;
    candidateRecordCount?: number;
    desktopRecordCount?: number;
    mobileRecordCount?: number;
    liteRecordCount?: number;
    sort?: "apparent-g-ascending-then-source-id";
    openNgcId?: string;
    hubbleType?: string;
    bMag?: number;
    vMag?: number;
    colorIndexBV?: number;
    axisRatio?: number;
    positionAngleDeg?: number | null;
    sourceIdentityControlsBrightness: false;
    noSyntheticCoverageFill: true;
  }>;
  analyticModel?: Readonly<{
    profileKind: "lenticular-dust-lane" | "edge-on-starburst" | "grand-design-spiral" | "elliptical-sersic" | "early-spiral-dust-eye" | "flocculent-spiral";
    armCount: number;
    pitchAngleDeg: number;
    bulgeFraction: number;
    dustStrength: number;
    starFormingStrength: number;
    turbulenceStrength: number;
    deterministicSeed: number;
    shaderVersion: "v592-openngc-galaxy-analytic-v1";
    modelBasis: string;
    observationImageClaim: false;
    explicitPrimaryModel: true;
  }>;
  reference: Readonly<{
    coordinateFrame: "ICRS/J2000";
    raDeg: number;
    decDeg: number;
    angularSize: Readonly<{
      majorArcmin: number;
      minorArcmin: number;
      positionAngleDeg: number | null;
      orientationPolicy: string;
    }>;
    distancePc: number;
    referencePacketSha256: string;
  }>;
  derivation: Readonly<{
    tool: string;
    sharpVersion: string;
    ktxSoftwareVersion: string;
    parameters: string;
    sourceChain: "primary-chain" | "alternative-chain" | "gaia-10m-derived-chain" | "openngc-catalog-derived-chain";
    noInpainting: true;
    noSyntheticCoverageFill: true;
    noAnnotationRemoval: true;
  }>;
  variants?: Readonly<{
    desktop: DeepSpaceVisualTierV592;
    mobile: DeepSpaceVisualTierV592;
    lite: DeepSpaceVisualTierV592;
  }>;
  mappedColorLabelRequired: true;
  observationImageClaim: boolean;
  catalogDerivedVisualModel: boolean;
  nakedEyeRepresentationClaimed: false;
  scienceImagePayload: false;
  presentationOnly: true;
  scientificAuthority: false;
  scientificPayloadWriteback: false;
}>;

export type DeepSpaceVisualManifestV592 = Readonly<{
  version: "v592-deep-space-visual-assets-v1";
  generatedAt: string;
  status: "24-of-24-deep-space-visual-models-admitted";
  policy: Readonly<{
    requiredGalaxyCount: 12;
    requiredClusterCount: 12;
    fixedCoordinateFrame: "ICRS/J2000";
    ktx2FirstFull: true;
    shaVerifiedFallback: true;
    onlyFocusedCinematicObjectLoadsImage: true;
    scienceModeMarkerOnly: true;
    mappedColorMustRemainLabeled: true;
    nakedEyeRepresentationClaimed: false;
    noInpainting: true;
    noSyntheticCoverageFill: true;
    noProceduralObservationFallback: true;
    gaiaCatalogDerivedPrimaryModelsAllowed: true;
    openNgcCatalogDerivedPrimaryModelsAllowed: true;
    missingAssetBehavior: "asset-blocked";
    maximumConcurrentHighOrderImages: 1;
    presentationOnly: true;
    scientificPayloadWriteback: false;
  }>;
  sourceReceipts: Readonly<{
    referencePacketSha256: string;
    acquisitionReceiptSha256: string;
    licenseReviewReceiptSha256: string;
    visualAnalysisReceiptSha256: string;
    alternativeLicenseReviewReceiptSha256: string;
    alternativeVisualAnalysisReceiptSha256: string;
    alternativeContactSheetReceiptSha256: string;
    gaiaCatalogManifestSha256: string;
    openNgcCatalogManifestSha256: string;
    openNgcCatalogArchiveSha256: string;
    openNgcCatalogLicenseSha256: string;
  }>;
  admission: Readonly<{
    requiredGalaxyCount: 12;
    admittedGalaxyAssetCount: 12;
    requiredClusterCount: 12;
    admittedClusterAssetCount: 12;
    totalAssetAdmittedCount: 24;
    blockedCount: 0;
    admittedGalaxies: readonly DeepSpaceVisualIdV592[];
    admittedClusters: readonly DeepSpaceVisualIdV592[];
    blockedObjects: readonly string[];
  }>;
  assets: readonly DeepSpaceVisualAssetV592[];
  manifestSha256: string;
}>;

export type DeepSpaceVisualSliceSelectionV592 = Readonly<{
  depthIndex: number;
  depthOffset: number;
  opacityPolicy: string;
  primary: DeepSpaceVisualFileV592 | null;
  fallback: DeepSpaceVisualFileV592;
}>;

const SHA256_V592 = /^[a-f0-9]{64}$/;
const VISUAL_ID_SET_V592 = new Set<string>(DEEP_SPACE_VISUAL_IDS_V592);

function canonicalizeV592(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV592);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalizeV592(source[key])]));
}

function validateFileV592(value: unknown, target: string, expectedFormat: "ktx2" | "webp", depthIndex: number): asserts value is DeepSpaceVisualFileV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v592-deep-space-visual-file:${target}:${depthIndex}`);
  const file = value as Record<string, unknown>;
  if (
    typeof file.url !== "string"
    || !file.url.startsWith("/textures/candidate-v592/deep-space-v592/")
    || file.url.includes("\\")
    || file.url.split("/").includes("..")
    || typeof file.bytes !== "number" || file.bytes <= 0
    || !SHA256_V592.test(String(file.sha256))
    || typeof file.width !== "number" || file.width <= 0
    || typeof file.height !== "number" || file.height <= 0
    || file.format !== expectedFormat
    || file.colorSpace !== "srgb"
    || typeof file.compression !== "string" || file.compression.length === 0
    || typeof file.role !== "string" || file.role.length === 0
    || file.depthIndex !== depthIndex
  ) throw new Error(`v592-deep-space-visual-file-contract:${target}:${depthIndex}:${expectedFormat}`);
}

function validateTierV592(value: unknown, target: string, tierName: "desktop" | "mobile" | "lite", depthCount: number): asserts value is DeepSpaceVisualTierV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v592-deep-space-visual-tier:${target}:${tierName}`);
  const tier = value as Record<string, unknown>;
  if (
    typeof tier.width !== "number" || tier.width <= 0
    || typeof tier.height !== "number" || tier.height <= 0
    || typeof tier.aspect !== "number" || tier.aspect <= 0
    || tier.depthSliceCount !== depthCount
    || !Array.isArray(tier.slices) || tier.slices.length !== depthCount
  ) throw new Error(`v592-deep-space-visual-tier-contract:${target}:${tierName}`);
  tier.slices.forEach((valueSlice, depthIndex) => {
    if (!valueSlice || typeof valueSlice !== "object" || Array.isArray(valueSlice)) throw new Error(`v592-deep-space-visual-slice:${target}:${tierName}:${depthIndex}`);
    const slice = valueSlice as Record<string, unknown>;
    if (
      slice.depthIndex !== depthIndex
      || typeof slice.depthOffset !== "number" || !Number.isFinite(slice.depthOffset)
      || typeof slice.opacityPolicy !== "string"
      || (!slice.opacityPolicy.startsWith("straight-alpha-luma-") && slice.opacityPolicy !== "gaia-apparent-flux-moffat-airy-catalog-derived")
    ) throw new Error(`v592-deep-space-visual-slice-contract:${target}:${tierName}:${depthIndex}`);
    if (tierName === "lite") {
      if ("ktx2" in slice) throw new Error(`v592-deep-space-visual-lite-ktx2:${target}:${depthIndex}`);
      validateFileV592(slice.fallback, target, "webp", depthIndex);
    } else {
      validateFileV592(slice.ktx2, target, "ktx2", depthIndex);
      validateFileV592(slice.fallback, target, "webp", depthIndex);
    }
  });
}

export function parseDeepSpaceVisualManifestV592(value: unknown): DeepSpaceVisualManifestV592 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v592-deep-space-visual-manifest-object");
  const root = value as Record<string, unknown>;
  const unsigned = { ...root };
  delete unsigned.manifestSha256;
  const policy = root.policy as Record<string, unknown> | undefined;
  const admission = root.admission as Record<string, unknown> | undefined;
  if (
    root.version !== "v592-deep-space-visual-assets-v1"
    || root.status !== "24-of-24-deep-space-visual-models-admitted"
    || root.manifestSha256 !== DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV592(unsigned))) !== root.manifestSha256
    || policy?.requiredGalaxyCount !== 12
    || policy.requiredClusterCount !== 12
    || policy.fixedCoordinateFrame !== "ICRS/J2000"
    || policy.ktx2FirstFull !== true
    || policy.shaVerifiedFallback !== true
    || policy.onlyFocusedCinematicObjectLoadsImage !== true
    || policy.scienceModeMarkerOnly !== true
    || policy.mappedColorMustRemainLabeled !== true
    || policy.nakedEyeRepresentationClaimed !== false
    || policy.noInpainting !== true
    || policy.noSyntheticCoverageFill !== true
    || policy.noProceduralObservationFallback !== true
    || policy.gaiaCatalogDerivedPrimaryModelsAllowed !== true
    || policy.openNgcCatalogDerivedPrimaryModelsAllowed !== true
    || policy.missingAssetBehavior !== "asset-blocked"
    || policy.maximumConcurrentHighOrderImages !== 1
    || policy.presentationOnly !== true
    || policy.scientificPayloadWriteback !== false
    || admission?.admittedGalaxyAssetCount !== 12
    || admission.admittedClusterAssetCount !== 12
    || admission.totalAssetAdmittedCount !== 24
    || admission.blockedCount !== 0
    || !Array.isArray(admission.admittedGalaxies) || admission.admittedGalaxies.join(",") !== "andromeda-galaxy,triangulum-galaxy,sombrero-galaxy,whirlpool-galaxy,bodes-galaxy,southern-pinwheel-galaxy,centaurus-a,cigar-galaxy,pinwheel-galaxy,virgo-a-galaxy,black-eye-galaxy,sunflower-galaxy"
    || !Array.isArray(admission.admittedClusters) || admission.admittedClusters.join(",") !== "omega-centauri,pleiades,hyades,47-tucanae,hercules-globular-cluster,messier-3,messier-5,messier-15,messier-22,beehive-cluster,double-cluster,jewel-box-cluster"
    || !Array.isArray(root.assets) || root.assets.length !== DEEP_SPACE_VISUAL_ASSET_COUNT_V592
  ) throw new Error("v592-deep-space-visual-manifest-identity");

  const seen = new Set<string>();
  for (const valueAsset of root.assets) {
    if (!valueAsset || typeof valueAsset !== "object" || Array.isArray(valueAsset)) throw new Error("v592-deep-space-visual-asset-object");
    const asset = valueAsset as Record<string, unknown>;
    const target = String(asset.target);
    const source = asset.source as Record<string, unknown> | undefined;
    const sourceEncoding = source?.observationEncoding as Record<string, unknown> | undefined;
    const reference = asset.reference as Record<string, unknown> | undefined;
    const derivation = asset.derivation as Record<string, unknown> | undefined;
    const variants = asset.variants as Record<string, unknown> | undefined;
    const crop = asset.crop as Record<string, unknown> | undefined;
    const catalogSelection = asset.catalogSelection as Record<string, unknown> | undefined;
    const analyticModel = asset.analyticModel as Record<string, unknown> | undefined;
    const gaiaDerived = asset.visualModelKind === "gaia-catalog-derived-star-field-impostor";
    const openNgcDerived = asset.visualModelKind === "openngc-catalog-derived-galaxy-analytic";
    if (
      !VISUAL_ID_SET_V592.has(target) || seen.has(target)
      || (asset.category !== "galaxy" && asset.category !== "cluster")
      || !source || typeof source.url !== "string"
      || typeof source.path !== "string" || source.path.includes("\\") || source.path.split("/").includes("..")
      || !SHA256_V592.test(String(source.sha256))
      || !sourceEncoding || sourceEncoding.nakedEyeRepresentationClaimed !== false
      || !reference || reference.coordinateFrame !== "ICRS/J2000"
      || typeof reference.raDeg !== "number" || reference.raDeg < 0 || reference.raDeg >= 360
      || typeof reference.decDeg !== "number" || reference.decDeg < -90 || reference.decDeg > 90
      || !derivation || !["primary-chain", "alternative-chain", "gaia-10m-derived-chain", "openngc-catalog-derived-chain"].includes(String(derivation.sourceChain)) || derivation.noInpainting !== true || derivation.noSyntheticCoverageFill !== true || derivation.noAnnotationRemoval !== true
      || asset.mappedColorLabelRequired !== true
      || asset.nakedEyeRepresentationClaimed !== false
      || asset.scienceImagePayload !== false
      || asset.presentationOnly !== true
      || asset.scientificAuthority !== false
      || asset.scientificPayloadWriteback !== false
    ) throw new Error(`v592-deep-space-visual-asset:${target}`);
    if (gaiaDerived) {
      if (
        asset.category !== "cluster"
        || asset.status !== "gaia-catalog-derived-runtime-variants-admitted"
        || asset.nasaId !== "gaia-dr3-presentation-10000000-v9"
        || source.url !== "https://gea.esac.esa.int/tap-server/tap/sync"
        || source.path !== "public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin"
        || source.colorSpace !== "not-applicable"
        || source.license !== "Gaia DR3 existing admitted provenance reuse"
        || source.licenseUrl !== "https://www.cosmos.esa.int/web/gaia-users/archive/acknowledgements"
        || derivation.sourceChain !== "gaia-10m-derived-chain"
        || crop !== undefined
        || !catalogSelection || catalogSelection.coordinateFrame !== "ICRS/J2000"
        || typeof catalogSelection.selectionRadiusDeg !== "number" || catalogSelection.selectionRadiusDeg < 1 || catalogSelection.selectionRadiusDeg > 6
        || typeof catalogSelection.candidateRecordCount !== "number" || catalogSelection.candidateRecordCount < 128
        || typeof catalogSelection.desktopRecordCount !== "number" || catalogSelection.desktopRecordCount <= 0 || catalogSelection.desktopRecordCount > 2048
        || typeof catalogSelection.mobileRecordCount !== "number" || catalogSelection.mobileRecordCount <= 0 || catalogSelection.mobileRecordCount > 1024
        || typeof catalogSelection.liteRecordCount !== "number" || catalogSelection.liteRecordCount <= 0 || catalogSelection.liteRecordCount > 256
        || catalogSelection.sort !== "apparent-g-ascending-then-source-id"
        || catalogSelection.sourceIdentityControlsBrightness !== false
        || catalogSelection.noSyntheticCoverageFill !== true
        || asset.observationImageClaim !== false
        || asset.catalogDerivedVisualModel !== true
      ) throw new Error(`v592-deep-space-visual-gaia-cluster:${target}`);
    } else if (openNgcDerived) {
      if (
        asset.category !== "galaxy"
        || asset.status !== "openngc-catalog-derived-analytic-model-admitted"
        || !String(asset.nasaId).startsWith("openngc-v260-NGC")
        || source.url !== "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"
        || source.path !== "public/data/openngc-v260/openngc-v260.json.gz"
        || source.colorSpace !== "not-applicable"
        || source.license !== "CC-BY-SA-4.0"
        || source.licenseUrl !== "https://github.com/mattiaverga/OpenNGC/blob/master/LICENSE"
        || derivation.sourceChain !== "openngc-catalog-derived-chain"
        || crop !== undefined
        || variants !== undefined
        || !catalogSelection || catalogSelection.coordinateFrame !== "ICRS/J2000"
        || typeof catalogSelection.openNgcId !== "string" || !catalogSelection.openNgcId.startsWith("NGC")
        || typeof catalogSelection.hubbleType !== "string" || catalogSelection.hubbleType.length === 0
        || typeof catalogSelection.bMag !== "number" || !Number.isFinite(catalogSelection.bMag)
        || typeof catalogSelection.vMag !== "number" || !Number.isFinite(catalogSelection.vMag)
        || typeof catalogSelection.colorIndexBV !== "number" || !Number.isFinite(catalogSelection.colorIndexBV)
        || typeof catalogSelection.axisRatio !== "number" || catalogSelection.axisRatio <= 0 || catalogSelection.axisRatio > 1
        || typeof catalogSelection.positionAngleDeg !== "number" || !Number.isFinite(catalogSelection.positionAngleDeg)
        || catalogSelection.sourceIdentityControlsBrightness !== false
        || catalogSelection.noSyntheticCoverageFill !== true
        || !analyticModel
        || !["lenticular-dust-lane", "edge-on-starburst", "grand-design-spiral", "elliptical-sersic", "early-spiral-dust-eye", "flocculent-spiral"].includes(String(analyticModel.profileKind))
        || typeof analyticModel.armCount !== "number" || analyticModel.armCount < 0 || analyticModel.armCount > 6
        || typeof analyticModel.pitchAngleDeg !== "number" || analyticModel.pitchAngleDeg < 0 || analyticModel.pitchAngleDeg > 45
        || typeof analyticModel.bulgeFraction !== "number" || analyticModel.bulgeFraction < 0 || analyticModel.bulgeFraction > 1
        || typeof analyticModel.dustStrength !== "number" || analyticModel.dustStrength < 0 || analyticModel.dustStrength > 1
        || typeof analyticModel.starFormingStrength !== "number" || analyticModel.starFormingStrength < 0 || analyticModel.starFormingStrength > 1
        || typeof analyticModel.turbulenceStrength !== "number" || analyticModel.turbulenceStrength < 0 || analyticModel.turbulenceStrength > 1
        || typeof analyticModel.deterministicSeed !== "number" || analyticModel.deterministicSeed < 0 || analyticModel.deterministicSeed > 1
        || analyticModel.shaderVersion !== "v592-openngc-galaxy-analytic-v1"
        || analyticModel.observationImageClaim !== false
        || analyticModel.explicitPrimaryModel !== true
        || asset.observationImageClaim !== false
        || asset.catalogDerivedVisualModel !== true
      ) throw new Error(`v592-deep-space-visual-openngc-galaxy:${target}`);
    } else if (
      asset.visualModelKind !== "source-observation-depth-impostor"
      || asset.status !== "source-crop-and-runtime-variants-admitted"
      || !source.url.startsWith("https://images-assets.nasa.gov/")
      || source.colorSpace !== "srgb"
      || typeof source.licenseUrl !== "string" || !source.licenseUrl.startsWith("https://www.nasa.gov/")
      || !crop || typeof crop.retainedSourcePixelFraction !== "number" || crop.retainedSourcePixelFraction <= 0
      || !["primary-chain", "alternative-chain"].includes(String(derivation.sourceChain))
      || catalogSelection !== undefined
      || asset.observationImageClaim !== true
      || asset.catalogDerivedVisualModel !== false
    ) throw new Error(`v592-deep-space-visual-observation-image:${target}`);
    if (!openNgcDerived) {
      if (!variants) throw new Error(`v592-deep-space-visual-variants:${target}`);
      validateTierV592(variants.desktop, target, "desktop", target === "sombrero-galaxy" ? 2 : 3);
      validateTierV592(variants.mobile, target, "mobile", target === "sombrero-galaxy" ? 1 : 2);
      validateTierV592(variants.lite, target, "lite", 1);
    }
    seen.add(target);
  }
  if (DEEP_SPACE_VISUAL_IDS_V592.some((id) => !seen.has(id))) throw new Error("v592-deep-space-visual-cardinality");
  return root as unknown as DeepSpaceVisualManifestV592;
}

let manifestPromiseV592: Promise<DeepSpaceVisualManifestV592> | null = null;
export function loadDeepSpaceVisualManifestV592(signal?: AbortSignal): Promise<DeepSpaceVisualManifestV592> {
  const load = async () => {
    const response = await fetch(`${DEEP_SPACE_VISUAL_MANIFEST_URL_V592}?sha256=${DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592}`, {
      cache: "force-cache",
      signal,
    });
    if (!response.ok) throw new Error(`v592-deep-space-visual-manifest-fetch:${response.status}`);
    return parseDeepSpaceVisualManifestV592(await response.json());
  };
  if (signal) return load();
  manifestPromiseV592 ??= load().catch((error) => {
    manifestPromiseV592 = null;
    throw error;
  });
  return manifestPromiseV592;
}

export function isDeepSpaceVisualIdV592(value: string | null): value is DeepSpaceVisualIdV592 {
  return value !== null && VISUAL_ID_SET_V592.has(value);
}

export function selectDeepSpaceVisualSlicesV592(
  asset: DeepSpaceVisualAssetV592,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
): readonly DeepSpaceVisualSliceSelectionV592[] {
  if (!asset.variants) return Object.freeze([]);
  const tier = deliveryTier === "vercel-lite"
    ? asset.variants.lite
    : deviceTier === "mobile" ? asset.variants.mobile : asset.variants.desktop;
  return Object.freeze(tier.slices.map((slice) => Object.freeze({
    depthIndex: slice.depthIndex,
    depthOffset: slice.depthOffset,
    opacityPolicy: slice.opacityPolicy,
    primary: "ktx2" in slice ? slice.ktx2 ?? null : null,
    fallback: slice.fallback,
  })));
}

export function selectDeepSpaceVisualFocusV592(
  mode: "science" | "cinematic",
  focusTarget: string,
): readonly DeepSpaceVisualIdV592[] {
  return mode === "cinematic" && isDeepSpaceVisualIdV592(focusTarget)
    ? Object.freeze([focusTarget])
    : Object.freeze([]);
}
