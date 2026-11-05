import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export type Tempel1VisualAssetFileV591 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb" | "linear";
  compression: string;
}>;

export type Tempel1VisualAssetEntryV591 = Readonly<{
  id: "tempel-1-observation" | "tempel-1-observation-mask";
  body: "tempel-1";
  role: "pds-simple-cylindrical-surface-mosaic" | "pds-observed-coverage-mask";
  source: Readonly<{
    acquisitionReceiptSha256: string;
    datasetId: "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0";
    packageSha256: string;
    path: string;
    sha256: string;
    bytes: number;
    width: 2880;
    height: 1440;
    sourceUrl: string;
    license: Readonly<{ id: "NASA-PDS-SBN-public-data"; url: string }>;
    observationIdentity: string;
    observationLimit: string;
  }>;
  derivation: Readonly<{
    tool: string;
    parameters: string;
    projection: "simple-cylindrical";
    longitudeEastDeg: readonly [-180, 180];
    latitudeDeg: readonly [90, -90];
    observedPixelFraction: number;
    unobservedPixelFraction: number;
    sourceDocumentationPath: string;
    sourceDocumentationSha256: string;
    sourceLabelPath: string;
    sourceLabelSha256: string;
  }>;
  fullQualityMinimum: Readonly<{
    desktop: Readonly<{ width: 2880; height: 1440 }>;
    mobile: Readonly<{ width: 1440; height: 720 }>;
  }>;
  variants: Readonly<{
    desktopKtx2: Tempel1VisualAssetFileV591;
    desktopFallback: Tempel1VisualAssetFileV591;
    mobileKtx2: Tempel1VisualAssetFileV591;
    mobileFallback: Tempel1VisualAssetFileV591;
    liteDesktop: Tempel1VisualAssetFileV591;
    liteMobile: Tempel1VisualAssetFileV591;
  }>;
  presentationOnly: true;
}>;

export type Tempel1ModelLodV591 = Readonly<{
  lod: 0 | 1 | 2;
  path: string;
  bytes: number;
  sha256: string;
  triangleCount: number;
  vertexCount: number;
  normals: true;
  meshopt: true;
  pivot: "bounds-midpoint";
  units: "normalized-diameter-2";
  rotationAxis: "positive-y";
}>;

export type Tempel1AssetOverlayV591 = Readonly<{
  version: "v591-tempel-1-asset-overlay-v1";
  generatedAt: string;
  status: "tempel-1-assets-derived-awaiting-runtime-admission" | "tempel-1-runtime-admitted";
  body: "tempel-1";
  acquisitionReceiptSha256: string;
  modelLodReceiptSha256: string;
  noNetworkRequestsPerformedDuringDerivation: true;
  noTextureBytesCopiedForCc0Reuse: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  model: Readonly<{
    candidate: "v591-owned";
    sourcePath: string;
    sourceSha256: string;
    sourceUrl: string;
    sourceDatasetId: "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0";
    sourceDetailCeiling: string;
    license: Readonly<{ id: "NASA-PDS-SBN-public-data"; url: string }>;
    units: "normalized-diameter-2";
    sourceUnits: "kilometer";
    pivot: "bounds-midpoint";
    rotationAxis: "positive-y";
    normals: true;
    watertight: true;
    lods: readonly Tempel1ModelLodV591[];
  }>;
  observationMapping: Readonly<{
    projection: "simple-cylindrical";
    sourceLongitudeDomain: "minus-180-to-plus-180-east";
    sourceLatitudeDomain: "plus-90-to-minus-90";
    runtimePositiveYSpinAxis: true;
    shaderUv: string;
    observedPixelFraction: number;
    unobservedPixelsAreMeasuredDarkTerrain: false;
  }>;
  assets: readonly Tempel1VisualAssetEntryV591[];
  microtextureReuse: Readonly<{
    candidate: "v591-readonly-exact-byte-reuse";
    sourceOverlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json";
    sourceOverlaySha256: string;
    noTextureBytesCopied: true;
    assets: readonly Readonly<{
      id: string;
      inheritedAssetId: string;
      body: "tempel-1";
      sourceSha256: string;
      sourceOverlaySha256: string;
      exactByteReuse: true;
      presentationOnly: true;
      observationLimit: string;
    }>[];
  }>;
  materialPolicy: Readonly<{
    observedSurface: string;
    unobservedSurface: string;
    reflectance: string;
    tails: "fixed-seed-presentation-only-dust-anti-solar-ion-velocity";
  }>;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredPhotometryClaim: false;
    measuredAuthorityGranted: false;
  }>;
  blockers: readonly [];
  receiptSha256: string;
}>;

const SHA256_V591 = /^[a-f0-9]{64}$/;
const ACQUISITION_SHA256_V591 = "4f2c35ca750e975295f7b7560df87bd8913bbad3b07378c97addf287a3cda012";
const MOSAIC_SHA256_V591 = "e41d08c437f804fb2cb6da292d38ef10e603abc9eb819171ebe3644b3ba37d4a";
const LOD_TRIANGLES_V591 = Object.freeze([32_040, 8_010, 2_002] as const);
const REQUIRED_ASSETS_V591 = Object.freeze(["tempel-1-observation", "tempel-1-observation-mask"] as const);
const REQUIRED_MICROTEXTURES_V591 = Object.freeze([
  ["tempel-1-regolith-albedo", "bennu-regolith-albedo"],
  ["tempel-1-regolith-normal", "bennu-regolith-normal"],
  ["tempel-1-regolith-roughness", "bennu-regolith-roughness"],
] as const);
let overlayPromiseV591: Promise<Tempel1AssetOverlayV591> | null = null;

function canonicalizeV591(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV591);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalizeV591(record[key])]));
}

function validateFileV591(assetId: string, file: Tempel1VisualAssetFileV591, format: "ktx2" | "webp"): void {
  if (
    !file.url.startsWith("/textures/candidate-v591/tempel-1/")
    || file.url.includes("\\")
    || decodeURIComponent(file.url).split("/").includes("..")
    || file.format !== format
    || !Number.isSafeInteger(file.bytes)
    || file.bytes <= 0
    || !SHA256_V591.test(file.sha256)
    || !Number.isSafeInteger(file.width)
    || !Number.isSafeInteger(file.height)
    || file.width <= 0
    || file.height <= 0
  ) throw new Error(`v591-tempel1-overlay-file:${assetId}:${file.url}`);
}

export function parseTempel1AssetOverlayV591(value: unknown): Tempel1AssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-tempel1-overlay-shape");
  const overlay = value as Tempel1AssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-tempel-1-asset-overlay-v1"
    || !["tempel-1-assets-derived-awaiting-runtime-admission", "tempel-1-runtime-admitted"].includes(overlay.status)
    || overlay.body !== "tempel-1"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-tempel1-overlay-seal");
  if (
    overlay.acquisitionReceiptSha256 !== ACQUISITION_SHA256_V591
    || overlay.modelLodReceiptSha256 !== CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591
    || overlay.noNetworkRequestsPerformedDuringDerivation !== true
    || overlay.noTextureBytesCopiedForCc0Reuse !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredPhotometryClaim !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
    || overlay.blockers?.length !== 0
  ) throw new Error("v591-tempel1-overlay-authority");
  const model = overlay.model;
  if (
    model?.candidate !== "v591-owned"
    || model.sourceUrl !== "https://pdssbn.astro.umd.edu/holdings/dif-c-hriv_its_mri-5-tempel1-shape-v2.0/DOWNLOAD/dimodl_0001.tgz"
    || model.sourceDatasetId !== "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0"
    || model.license?.id !== "NASA-PDS-SBN-public-data"
    || model.units !== "normalized-diameter-2"
    || model.sourceUnits !== "kilometer"
    || model.pivot !== "bounds-midpoint"
    || model.rotationAxis !== "positive-y"
    || model.normals !== true
    || model.watertight !== true
    || model.lods?.length !== 3
  ) throw new Error("v591-tempel1-overlay-model");
  for (const [index, lod] of model.lods.entries()) {
    if (
      lod.lod !== index
      || lod.path !== `public/models/candidate-v591/tempel-1/tempel-1-lod${index}.glb`
      || lod.triangleCount !== LOD_TRIANGLES_V591[index]
      || !Number.isSafeInteger(lod.vertexCount)
      || lod.vertexCount <= 0
      || !Number.isSafeInteger(lod.bytes)
      || lod.bytes <= 0
      || !SHA256_V591.test(lod.sha256)
      || lod.normals !== true
      || lod.meshopt !== true
      || lod.pivot !== "bounds-midpoint"
      || lod.units !== "normalized-diameter-2"
      || lod.rotationAxis !== "positive-y"
    ) throw new Error(`v591-tempel1-overlay-model-lod:${index}`);
  }
  if (
    overlay.observationMapping?.projection !== "simple-cylindrical"
    || overlay.observationMapping.sourceLongitudeDomain !== "minus-180-to-plus-180-east"
    || overlay.observationMapping.sourceLatitudeDomain !== "plus-90-to-minus-90"
    || overlay.observationMapping.runtimePositiveYSpinAxis !== true
    || Math.abs(overlay.observationMapping.observedPixelFraction - 0.8043214699074074) > 1e-15
    || overlay.observationMapping.unobservedPixelsAreMeasuredDarkTerrain !== false
  ) throw new Error("v591-tempel1-overlay-mapping");
  if (overlay.assets?.length !== REQUIRED_ASSETS_V591.length) throw new Error("v591-tempel1-overlay-assets");
  const ids = new Set<string>();
  for (const asset of overlay.assets) {
    if (
      !REQUIRED_ASSETS_V591.includes(asset.id)
      || ids.has(asset.id)
      || asset.body !== "tempel-1"
      || asset.source?.acquisitionReceiptSha256 !== ACQUISITION_SHA256_V591
      || asset.source.datasetId !== "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0"
      || asset.source.sha256 !== MOSAIC_SHA256_V591
      || asset.source.width !== 2880
      || asset.source.height !== 1440
      || asset.source.license?.id !== "NASA-PDS-SBN-public-data"
      || asset.derivation?.projection !== "simple-cylindrical"
      || Math.abs(asset.derivation.observedPixelFraction - 0.8043214699074074) > 1e-15
      || asset.presentationOnly !== true
    ) throw new Error(`v591-tempel1-overlay-asset:${asset.id}`);
    const expectedRole = asset.id === "tempel-1-observation" ? "pds-simple-cylindrical-surface-mosaic" : "pds-observed-coverage-mask";
    if (asset.role !== expectedRole) throw new Error(`v591-tempel1-overlay-role:${asset.id}`);
    ids.add(asset.id);
    validateFileV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateFileV591(asset.id, asset.variants.desktopFallback, "webp");
    validateFileV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateFileV591(asset.id, asset.variants.mobileFallback, "webp");
    validateFileV591(asset.id, asset.variants.liteDesktop, "webp");
    validateFileV591(asset.id, asset.variants.liteMobile, "webp");
    const colorSpace = asset.id === "tempel-1-observation" ? "srgb" : "linear";
    if (
      asset.variants.desktopKtx2.width !== 2880 || asset.variants.desktopKtx2.height !== 1440
      || asset.variants.desktopFallback.width !== 2880 || asset.variants.desktopFallback.height !== 1440
      || asset.variants.mobileKtx2.width !== 1440 || asset.variants.mobileKtx2.height !== 720
      || asset.variants.mobileFallback.width !== 1440 || asset.variants.mobileFallback.height !== 720
      || asset.variants.liteDesktop.width !== 1024 || asset.variants.liteDesktop.height !== 512
      || asset.variants.liteMobile.width !== 512 || asset.variants.liteMobile.height !== 256
      || Object.values(asset.variants).some((file) => file.colorSpace !== colorSpace)
    ) throw new Error(`v591-tempel1-overlay-quality:${asset.id}`);
  }
  if (REQUIRED_ASSETS_V591.some((id) => !ids.has(id))) throw new Error("v591-tempel1-overlay-required-assets");
  const reuse = overlay.microtextureReuse;
  if (
    reuse?.candidate !== "v591-readonly-exact-byte-reuse"
    || reuse.sourceOverlayPath !== "public/data/celestial-convergence-v591/bennu-asset-overlay.json"
    || reuse.sourceOverlaySha256 !== CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591
    || reuse.noTextureBytesCopied !== true
    || reuse.assets?.length !== REQUIRED_MICROTEXTURES_V591.length
  ) throw new Error("v591-tempel1-overlay-microtexture");
  for (const [index, [id, inheritedAssetId]] of REQUIRED_MICROTEXTURES_V591.entries()) {
    const asset = reuse.assets[index];
    if (
      asset?.id !== id
      || asset.inheritedAssetId !== inheritedAssetId
      || asset.body !== "tempel-1"
      || asset.sourceOverlaySha256 !== CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591
      || !SHA256_V591.test(asset.sourceSha256)
      || asset.exactByteReuse !== true
      || asset.presentationOnly !== true
    ) throw new Error(`v591-tempel1-overlay-microtexture:${index}`);
  }
  if (
    overlay.materialPolicy?.observedSurface !== "pds-filtered-manually-stretched-grayscale-mosaic"
    || overlay.materialPolicy.unobservedSurface !== "poly-haven-cc0-regolith-presentation-substrate-never-observation"
    || overlay.materialPolicy.reflectance !== "rough-oren-nayar-plus-bounded-opposition-no-glossy-specular"
    || overlay.materialPolicy.tails !== "fixed-seed-presentation-only-dust-anti-solar-ion-velocity"
  ) throw new Error("v591-tempel1-overlay-material-policy");
  return overlay;
}

export async function loadTempel1AssetOverlayV591(signal?: AbortSignal): Promise<Tempel1AssetOverlayV591> {
  const url = `/data/celestial-convergence-v591/tempel-1-asset-overlay.json?sha256=${CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591}`;
  if (signal) {
    const response = await fetch(url, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-tempel1-overlay-fetch:${response.status}`);
    return parseTempel1AssetOverlayV591(await response.json());
  }
  overlayPromiseV591 ??= fetch(url, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-tempel1-overlay-fetch:${response.status}`);
      return parseTempel1AssetOverlayV591(await response.json());
    })
    .catch((error) => {
      overlayPromiseV591 = null;
      throw error;
    });
  return overlayPromiseV591;
}
