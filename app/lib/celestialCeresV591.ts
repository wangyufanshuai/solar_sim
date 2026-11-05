"use client";

import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_CERES_MODEL_LOD_RECEIPT_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const CERES_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "ceres-albedo",
  "ceres-normal",
  "ceres-roughness",
  "ceres-height",
] as const);

export type CeresVisualAssetIdV591 = typeof CERES_REQUIRED_ASSET_IDS_V591[number];

export type CeresVisualAssetFileV591 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb" | "linear";
  compression: string;
}>;

export type CeresVisualAssetEntryV591 = Readonly<{
  id: CeresVisualAssetIdV591;
  body: "ceres";
  role:
    | "pds-dawn-spc-global-relative-albedo"
    | "pds-global-radius-derived-tangent-normal"
    | "pds-radius-slope-derived-bounded-roughness"
    | "pds-global-radius-normalized-presentation-height";
  variants: Readonly<{
    desktopKtx2: CeresVisualAssetFileV591;
    desktopFallback: CeresVisualAssetFileV591;
    mobileKtx2: CeresVisualAssetFileV591;
    mobileFallback: CeresVisualAssetFileV591;
    liteDesktop: CeresVisualAssetFileV591;
    liteMobile: CeresVisualAssetFileV591;
  }>;
  source: Readonly<{
    acquisitionReceiptSha256: string;
    productId: string;
    path: string;
    bytes: number;
    sha256: string;
    md5: string;
    width: 2222;
    height: 1111;
    sourceUrl: string;
    license: Readonly<{ id: "NASA-PDS-public-data"; url: string }>;
    observationIdentity: string;
    observationLimit: string;
  }>;
  derivation: Readonly<{
    receiptSha256: string;
    tool: string;
    parameters: string;
    sourceDetailCeiling: "2222x1111";
    deliveryUpscaleAddsObservationDetail: false;
    syntheticDetailAdded: false;
  }>;
  fullQualityMinimum: Readonly<{
    desktop: Readonly<{ width: 4096; height: 2048 }>;
    mobile: Readonly<{ width: 2048; height: 1024 }>;
  }>;
  presentationOnly: true;
}>;

export type CeresModelLodV591 = Readonly<{
  lod: 0 | 1 | 2;
  path: string;
  bytes: number;
  sha256: string;
  triangleCount: number;
  vertexCount: number;
  normals: true;
  meshopt: true;
  pivot: "body-center-origin";
  units: "mean-radius-1";
  rotationAxis: "positive-y";
}>;

export type CeresAssetOverlayV591 = Readonly<{
  version: "v591-ceres-asset-overlay-v1";
  generatedAt: string;
  status: "ceres-assets-derived-awaiting-runtime-admission" | "ceres-runtime-admitted";
  body: "ceres";
  metadataReceiptSha256: string;
  acquisitionReceiptSha256: string;
  modelLodReceiptSha256: string;
  shapeBlockedReceiptSha256: string;
  centralMirrorBlockedReceiptSha256: string;
  noNetworkRequestsPerformedDuringDerivation: true;
  noTextureBytesCopiedForCc0Reuse: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  model: Readonly<{
    candidate: "v591-owned";
    sourcePath: string;
    sourceSha256: string;
    sourceUrl: string;
    sourceProductId: string;
    sourceDetailCeiling: "pds-dawn-spc-radius-2222x1111-261120-triangles";
    license: Readonly<{ id: "NASA-PDS-public-data"; url: string }>;
    units: "mean-radius-1";
    sourceUnits: "meter-from-body-center";
    pivot: "body-center-origin";
    rotationAxis: "positive-y";
    normals: true;
    watertight: true;
    lods: readonly CeresModelLodV591[];
  }>;
  assets: readonly CeresVisualAssetEntryV591[];
  microtextureReuse: Readonly<{
    candidate: "v591-readonly-exact-byte-reuse";
    sourceOverlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json";
    sourceOverlaySha256: string;
    noTextureBytesCopied: true;
    assets: readonly Readonly<{
      id: "ceres-regolith-albedo" | "ceres-regolith-normal" | "ceres-regolith-roughness";
      inheritedAssetId: "bennu-regolith-albedo" | "bennu-regolith-normal" | "bennu-regolith-roughness";
      body: "ceres";
      sourceSha256: string;
      sourceOverlaySha256: string;
      variants: CeresVisualAssetEntryV591["variants"];
      exactByteReuse: true;
      presentationOnly: true;
      observationLimit: string;
    }>[];
  }>;
  materialPolicy: Readonly<{
    macroSurface: "pds-dawn-spc-relative-albedo-and-global-radius";
    microSurface: "poly-haven-cc0-regolith-presentation-only-not-ceres-observation";
    reflectance: "rough-oren-nayar-plus-bounded-opposition-no-glossy-specular";
    opticalColorClaim: false;
    syntheticDetailAdded: false;
  }>;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredPhotometryClaim: false;
    measuredAuthorityGranted: false;
  }>;
  blockers: readonly never[];
  receiptSha256: string;
}>;

const CERES_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/ceres-asset-overlay.json";
const SHA256_PATTERN_V591 = /^[a-f0-9]{64}$/;
const EXPECTED_ROLES_V591 = Object.freeze(new Map<CeresVisualAssetIdV591, CeresVisualAssetEntryV591["role"]>([
  ["ceres-albedo", "pds-dawn-spc-global-relative-albedo"],
  ["ceres-normal", "pds-global-radius-derived-tangent-normal"],
  ["ceres-roughness", "pds-radius-slope-derived-bounded-roughness"],
  ["ceres-height", "pds-global-radius-normalized-presentation-height"],
]));
const EXPECTED_REUSE_V591 = Object.freeze([
  ["ceres-regolith-albedo", "bennu-regolith-albedo"],
  ["ceres-regolith-normal", "bennu-regolith-normal"],
  ["ceres-regolith-roughness", "bennu-regolith-roughness"],
] as const);
const VARIANT_PLAN_V591 = Object.freeze({
  desktopKtx2: Object.freeze({ folder: "full/desktop", width: 4096, height: 2048, format: "ktx2" }),
  desktopFallback: Object.freeze({ folder: "full/desktop", width: 4096, height: 2048, format: "webp" }),
  mobileKtx2: Object.freeze({ folder: "full/mobile", width: 2048, height: 1024, format: "ktx2" }),
  mobileFallback: Object.freeze({ folder: "full/mobile", width: 2048, height: 1024, format: "webp" }),
  liteDesktop: Object.freeze({ folder: "lite/desktop", width: 1024, height: 512, format: "webp" }),
  liteMobile: Object.freeze({ folder: "lite/mobile", width: 512, height: 256, format: "webp" }),
} as const);

function canonicalizeV591(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV591);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalizeV591(record[key])]));
}

function assertShaV591(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !SHA256_PATTERN_V591.test(value)) throw new Error(`v591-ceres-overlay-sha:${label}`);
}

export function parseCeresAssetOverlayV591(value: unknown): CeresAssetOverlayV591 {
  if (!value || typeof value !== "object") throw new Error("v591-ceres-overlay-shape");
  const overlay = value as CeresAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-ceres-asset-overlay-v1"
    || !["ceres-assets-derived-awaiting-runtime-admission", "ceres-runtime-admitted"].includes(overlay.status)
    || overlay.body !== "ceres"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-ceres-overlay-seal");
  for (const [label, digest] of Object.entries({
    metadata: overlay.metadataReceiptSha256,
    acquisition: overlay.acquisitionReceiptSha256,
    model: overlay.modelLodReceiptSha256,
    shapeBlocked: overlay.shapeBlockedReceiptSha256,
    centralMirrorBlocked: overlay.centralMirrorBlockedReceiptSha256,
  })) assertShaV591(digest, label);
  if (
    overlay.modelLodReceiptSha256 !== CELESTIAL_CONVERGENCE_CERES_MODEL_LOD_RECEIPT_SHA256_V591
    || overlay.noNetworkRequestsPerformedDuringDerivation !== true
    || overlay.noTextureBytesCopiedForCc0Reuse !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.blockers?.length !== 0
  ) throw new Error("v591-ceres-overlay-policy");

  const model = overlay.model;
  if (
    model?.candidate !== "v591-owned"
    || model.sourcePath !== "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/ceres_radius_g.tif"
    || !model.sourceUrl.startsWith("https://sbnarchive.psi.edu/pds4/dawn/")
    || model.license?.id !== "NASA-PDS-public-data"
    || model.sourceDetailCeiling !== "pds-dawn-spc-radius-2222x1111-261120-triangles"
    || model.units !== "mean-radius-1"
    || model.sourceUnits !== "meter-from-body-center"
    || model.pivot !== "body-center-origin"
    || model.rotationAxis !== "positive-y"
    || model.normals !== true
    || model.watertight !== true
    || model.lods?.length !== 3
  ) throw new Error("v591-ceres-overlay-model");
  assertShaV591(model.sourceSha256, "model-source");
  for (const [index, lod] of model.lods.entries()) {
    if (
      lod.lod !== index
      || lod.path !== `public/models/candidate-v591/ceres/ceres-lod${index}.glb`
      || !Number.isSafeInteger(lod.bytes) || lod.bytes <= 0
      || !Number.isSafeInteger(lod.triangleCount) || lod.triangleCount <= 0
      || !Number.isSafeInteger(lod.vertexCount) || lod.vertexCount <= 0
      || lod.normals !== true || lod.meshopt !== true
      || lod.pivot !== "body-center-origin" || lod.units !== "mean-radius-1" || lod.rotationAxis !== "positive-y"
    ) throw new Error(`v591-ceres-overlay-model-lod:${index}`);
    assertShaV591(lod.sha256, `model-lod-${index}`);
  }

  if (overlay.assets?.length !== CERES_REQUIRED_ASSET_IDS_V591.length) throw new Error("v591-ceres-overlay-assets");
  for (const [index, assetId] of CERES_REQUIRED_ASSET_IDS_V591.entries()) {
    const asset = overlay.assets[index];
    if (
      asset?.id !== assetId
      || asset.body !== "ceres"
      || asset.role !== EXPECTED_ROLES_V591.get(assetId)
      || asset.source?.license?.id !== "NASA-PDS-public-data"
      || !asset.source.sourceUrl.startsWith("https://sbnarchive.psi.edu/pds4/dawn/")
      || asset.source.width !== 2222 || asset.source.height !== 1111
      || asset.derivation?.sourceDetailCeiling !== "2222x1111"
      || asset.derivation.deliveryUpscaleAddsObservationDetail !== false
      || asset.derivation.syntheticDetailAdded !== false
      || asset.fullQualityMinimum?.desktop?.width !== 4096
      || asset.fullQualityMinimum.desktop.height !== 2048
      || asset.fullQualityMinimum?.mobile?.width !== 2048
      || asset.fullQualityMinimum.mobile.height !== 1024
      || asset.presentationOnly !== true
    ) throw new Error(`v591-ceres-overlay-asset:${assetId}`);
    assertShaV591(asset.source.acquisitionReceiptSha256, `${assetId}-acquisition`);
    assertShaV591(asset.source.sha256, `${assetId}-source`);
    assertShaV591(asset.derivation.receiptSha256, `${assetId}-derivation`);
    for (const [variantId, plan] of Object.entries(VARIANT_PLAN_V591)) {
      const file = asset.variants[variantId as keyof typeof VARIANT_PLAN_V591];
      if (
        file?.url !== `/textures/candidate-v591/ceres/${plan.folder}/${assetId}.${plan.format}`
        || !Number.isSafeInteger(file.bytes) || file.bytes <= 0
        || file.width !== plan.width || file.height !== plan.height || file.format !== plan.format
        || file.colorSpace !== (assetId === "ceres-albedo" ? "srgb" : "linear")
      ) throw new Error(`v591-ceres-overlay-variant:${assetId}:${variantId}`);
      assertShaV591(file.sha256, `${assetId}-${variantId}`);
    }
  }

  const reuse = overlay.microtextureReuse;
  if (
    reuse?.candidate !== "v591-readonly-exact-byte-reuse"
    || reuse.sourceOverlayPath !== "public/data/celestial-convergence-v591/bennu-asset-overlay.json"
    || reuse.sourceOverlaySha256 !== CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591
    || reuse.noTextureBytesCopied !== true
    || reuse.assets?.length !== EXPECTED_REUSE_V591.length
  ) throw new Error("v591-ceres-overlay-microtexture");
  for (const [index, [id, inheritedAssetId]] of EXPECTED_REUSE_V591.entries()) {
    const asset = reuse.assets[index];
    if (
      asset?.id !== id || asset.inheritedAssetId !== inheritedAssetId || asset.body !== "ceres"
      || asset.sourceOverlaySha256 !== reuse.sourceOverlaySha256
      || asset.exactByteReuse !== true || asset.presentationOnly !== true
      || !asset.observationLimit.includes("not Ceres observation data")
    ) throw new Error(`v591-ceres-overlay-microtexture:${index}`);
    assertShaV591(asset.sourceSha256, `microtexture-${index}`);
  }
  if (
    overlay.materialPolicy?.macroSurface !== "pds-dawn-spc-relative-albedo-and-global-radius"
    || overlay.materialPolicy.microSurface !== "poly-haven-cc0-regolith-presentation-only-not-ceres-observation"
    || overlay.materialPolicy.reflectance !== "rough-oren-nayar-plus-bounded-opposition-no-glossy-specular"
    || overlay.materialPolicy.opticalColorClaim !== false
    || overlay.materialPolicy.syntheticDetailAdded !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState.scientificAuthorityChanged !== false
    || overlay.authorityState.scientificPayloadWriteback !== false
    || overlay.authorityState.measuredPhotometryClaim !== false
    || overlay.authorityState.measuredAuthorityGranted !== false
  ) throw new Error("v591-ceres-overlay-authority");
  return overlay;
}

export async function loadCeresAssetOverlayV591(signal?: AbortSignal): Promise<CeresAssetOverlayV591> {
  const response = await fetch(`${CERES_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591}`, {
    cache: "force-cache",
    signal,
  });
  if (!response.ok) throw new Error(`v591-ceres-overlay-fetch:${response.status}`);
  return parseCeresAssetOverlayV591(await response.json());
}
