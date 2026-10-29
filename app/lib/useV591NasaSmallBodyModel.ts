"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_EROS_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_EROS_MODEL_LOD_RECEIPT_SHA256_V591,
  CELESTIAL_CONVERGENCE_KLEOPATRA_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_KLEOPATRA_MODEL_LOD_RECEIPT_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";

export type NasaSmallBodyIdV591 = "eros" | "kleopatra";
type NasaSmallBodyLodV591 = Readonly<{
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
export type NasaSmallBodyAssetOverlayV591 = Readonly<{
  version: "v591-nasa-small-body-asset-overlay-v1";
  status: string;
  body: NasaSmallBodyIdV591;
  acquisitionReceiptSha256: string;
  modelLodReceiptSha256: string;
  noNetworkRequestsPerformedDuringDerivation: true;
  noTextureBytesCopied: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  model: Readonly<{
    candidate: "v591-owned";
    sourceSha256: string;
    sourceUrl: string;
    sourceGitBlobSha1: string;
    license: Readonly<{ id: "NASA-public-domain"; url: string }>;
    observationLimit: string;
    sourceDetailCeiling: string;
    printableSplitReconstruction: Readonly<Record<string, unknown>> | null;
    units: "normalized-diameter-2";
    pivot: "bounds-midpoint";
    rotationAxis: "positive-y";
    normals: true;
    watertight: true;
    lods: readonly NasaSmallBodyLodV591[];
  }>;
  microtextureReuse: Readonly<{
    candidate: "v591-readonly-exact-byte-reuse";
    sourceOverlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json";
    sourceOverlaySha256: string;
    noTextureBytesCopied: true;
    assets: readonly Readonly<{
      id: string;
      inheritedAssetId: string;
      body: NasaSmallBodyIdV591;
      sourceSha256: string;
      observationLimit: string;
      exactByteReuse: true;
      presentationOnly: true;
    }>[];
  }>;
  materialPolicy: Readonly<{
    substrate: string;
    microtexture: string;
    reflectance: string;
  }>;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredPhotometryClaim: false;
    measuredAuthorityGranted: false;
  }>;
  receiptSha256: string;
}>;
export type V591NasaSmallBodyModelLoadState = Readonly<{
  scene: THREE.Group | null;
  status: "idle" | "loading" | "ready" | "blocked";
  assetId: string;
  sha256: string;
  lod: 0 | 1 | 2 | null;
  sourceBytes: number;
  estimatedGpuBytes: number;
  sourceDetailCeiling: string;
  printableSplitReconstruction: Readonly<Record<string, unknown>> | null;
  reason: string;
}>;

const SHA256_V591 = /^[a-f0-9]{64}$/;
const GIT_BLOB_SHA1_V591 = /^[a-f0-9]{40}$/;
const REQUIRED_MICROTEXTURES_V591 = Object.freeze([
  ["regolith-albedo", "bennu-regolith-albedo"],
  ["regolith-normal", "bennu-regolith-normal"],
  ["regolith-roughness", "bennu-regolith-roughness"],
] as const);
const IDLE_NASA_SMALL_BODY_MODEL_V591: Readonly<Record<NasaSmallBodyIdV591, V591NasaSmallBodyModelLoadState>> = Object.freeze({
  eros: Object.freeze({
    scene: null, status: "idle", assetId: "eros-model", sha256: "none", lod: null,
    sourceBytes: 0, estimatedGpuBytes: 0, sourceDetailCeiling: "unknown", printableSplitReconstruction: null, reason: "none",
  }),
  kleopatra: Object.freeze({
    scene: null, status: "idle", assetId: "kleopatra-model", sha256: "none", lod: null,
    sourceBytes: 0, estimatedGpuBytes: 0, sourceDetailCeiling: "unknown", printableSplitReconstruction: null, reason: "none",
  }),
});
function canonicalizeV591(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV591);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalizeV591(record[key])]));
}
function expectedOverlayShaV591(body: NasaSmallBodyIdV591): string {
  return body === "eros"
    ? CELESTIAL_CONVERGENCE_EROS_ASSET_OVERLAY_SHA256_V591
    : CELESTIAL_CONVERGENCE_KLEOPATRA_ASSET_OVERLAY_SHA256_V591;
}
function expectedModelReceiptShaV591(body: NasaSmallBodyIdV591): string {
  return body === "eros"
    ? CELESTIAL_CONVERGENCE_EROS_MODEL_LOD_RECEIPT_SHA256_V591
    : CELESTIAL_CONVERGENCE_KLEOPATRA_MODEL_LOD_RECEIPT_SHA256_V591;
}
export function parseNasaSmallBodyAssetOverlayV591(body: NasaSmallBodyIdV591, value: unknown): NasaSmallBodyAssetOverlayV591 {
  if (!value || typeof value !== "object") throw new Error(`v591-${body}-overlay-shape`);
  const overlay = value as NasaSmallBodyAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-nasa-small-body-asset-overlay-v1"
    || overlay.body !== body
    || overlay.status !== `${body}-assets-derived-awaiting-runtime-admission`
    || overlay.receiptSha256 !== expectedOverlayShaV591(body)
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error(`v591-${body}-overlay-seal`);
  if (
    overlay.noNetworkRequestsPerformedDuringDerivation !== true
    || overlay.noTextureBytesCopied !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || !SHA256_V591.test(overlay.acquisitionReceiptSha256)
    || overlay.modelLodReceiptSha256 !== expectedModelReceiptShaV591(body)
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredPhotometryClaim !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error(`v591-${body}-overlay-authority`);
  if (
    overlay.model?.candidate !== "v591-owned"
    || overlay.model.license?.id !== "NASA-public-domain"
    || !overlay.model.sourceUrl.startsWith("https://api.github.com/repos/nasa/NASA-3D-Resources/git/blobs/")
    || !SHA256_V591.test(overlay.model.sourceSha256)
    || !GIT_BLOB_SHA1_V591.test(overlay.model.sourceGitBlobSha1)
    || !overlay.model.sourceUrl.endsWith(overlay.model.sourceGitBlobSha1)
    || overlay.model.units !== "normalized-diameter-2"
    || overlay.model.pivot !== "bounds-midpoint"
    || overlay.model.rotationAxis !== "positive-y"
    || overlay.model.normals !== true
    || overlay.model.watertight !== true
    || overlay.model.lods?.length !== 3
  ) throw new Error(`v591-${body}-overlay-model`);
  for (const [index, lod] of overlay.model.lods.entries()) {
    if (
      lod.lod !== index
      || lod.path !== `public/models/candidate-v591/${body}/${body}-lod${index}.glb`
      || !Number.isSafeInteger(lod.bytes) || lod.bytes <= 0
      || !SHA256_V591.test(lod.sha256)
      || !Number.isSafeInteger(lod.triangleCount) || lod.triangleCount <= 0
      || !Number.isSafeInteger(lod.vertexCount) || lod.vertexCount <= 0
      || lod.normals !== true || lod.meshopt !== true
      || lod.pivot !== "bounds-midpoint" || lod.units !== "normalized-diameter-2" || lod.rotationAxis !== "positive-y"
    ) throw new Error(`v591-${body}-overlay-lod:${index}`);
  }
  const reconstruction = overlay.model.printableSplitReconstruction;
  if (body === "eros" && (
    !reconstruction
    || reconstruction.sourceComponentCount !== 2
    || reconstruction.watertight !== true
    || reconstruction.outputComponentCount !== 1
    || reconstruction.outputEulerNumber !== 2
    || reconstruction.boundaryEdgeCount !== 0
    || reconstruction.nonManifoldEdgeCount !== 0
    || Number(reconstruction.seamRmsSourceUnits) > 2e-6
    || Number(reconstruction.seamMaximumSourceUnits) > 4e-6
    || overlay.model.sourceDetailCeiling !== "nasa-shape-200856-triangles"
  )) throw new Error("v591-eros-overlay-printable-split");
  if (body === "kleopatra" && (
    reconstruction !== null
    || overlay.model.sourceDetailCeiling !== "nasa-low-resolution-radar-shape-4092-triangles"
    || overlay.model.lods[0]?.triangleCount !== 4_092
  )) throw new Error("v591-kleopatra-overlay-source-detail-ceiling");
  const reuse = overlay.microtextureReuse;
  if (
    reuse?.candidate !== "v591-readonly-exact-byte-reuse"
    || reuse.sourceOverlayPath !== "public/data/celestial-convergence-v591/bennu-asset-overlay.json"
    || reuse.sourceOverlaySha256 !== CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591
    || reuse.noTextureBytesCopied !== true
    || reuse.assets?.length !== REQUIRED_MICROTEXTURES_V591.length
  ) throw new Error(`v591-${body}-overlay-microtexture`);
  for (const [index, [suffix, inheritedAssetId]] of REQUIRED_MICROTEXTURES_V591.entries()) {
    const asset = reuse.assets[index];
    if (
      asset?.id !== `${body}-${suffix}`
      || asset.inheritedAssetId !== inheritedAssetId
      || asset.body !== body
      || !SHA256_V591.test(asset.sourceSha256)
      || !asset.observationLimit.includes(`not ${body} observation data`)
      || asset.exactByteReuse !== true
      || asset.presentationOnly !== true
    ) throw new Error(`v591-${body}-overlay-microtexture:${index}`);
  }
  const expectedSubstrate = body === "eros" ? "bounded-s-type-silicate-reference" : "bounded-metal-rich-m-type-reference";
  const expectedReflectance = body === "eros"
    ? "oren-nayar-plus-bounded-opposition-no-glossy-specular"
    : "oren-nayar-plus-bounded-metallic-edge-response-no-glossy-specular";
  if (
    overlay.materialPolicy?.substrate !== expectedSubstrate
    || overlay.materialPolicy.microtexture !== `poly-haven-cc0-presentation-only-not-${body}-observation`
    || overlay.materialPolicy.reflectance !== expectedReflectance
  ) throw new Error(`v591-${body}-overlay-material-policy`);
  return overlay;
}
function parseGlbV591(loader: GLTFLoader, bytes: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => loader.parse(bytes, "", resolve, reject));
}
function collectResourcesV591(scene: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
  });
  let estimatedGpuBytes = 0;
  const arrays = new Set<ArrayBufferView>();
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes)) {
      if (attribute instanceof THREE.InterleavedBufferAttribute) arrays.add(attribute.data.array);
      else if (attribute instanceof THREE.BufferAttribute) arrays.add(attribute.array);
    }
    if (geometry.index) arrays.add(geometry.index.array);
  }
  for (const array of arrays) estimatedGpuBytes += array.byteLength;
  return { geometries, materials, estimatedGpuBytes };
}
function disposeAfterDetachV591(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window !== "undefined") window.requestAnimationFrame(() => window.requestAnimationFrame(() => resource.dispose()));
}

export function useV591NasaSmallBodyModel(body: NasaSmallBodyIdV591, preferredLod: 0 | 1 | 2, enabled = true): V591NasaSmallBodyModelLoadState {
  const idle = IDLE_NASA_SMALL_BODY_MODEL_V591[body];
  const [state, setState] = useState<V591NasaSmallBodyModelLoadState>(() => idle);
  useEffect(() => {
    const abort = new AbortController();
    let alive = true;
    let scene: THREE.Group | null = null;
    let resources: ReturnType<typeof collectResourcesV591> | null = null;
    let releaseModel: (() => void) | null = null;
    let releaseGpu: (() => void) | null = null;
    const disposeLoaded = () => {
      releaseGpu?.(); releaseGpu = null;
      releaseModel?.(); releaseModel = null;
      resources?.geometries.forEach(disposeAfterDetachV591);
      resources?.materials.forEach((material) => material.dispose());
      resources = null; scene = null;
    };
    if (!enabled) { setState(idle); return () => abort.abort(); }
    setState({ ...idle, status: "loading" });
    void (async () => {
      const overlayResponse = await fetch(`/data/celestial-convergence-v591/${body}-asset-overlay.json?sha256=${expectedOverlayShaV591(body)}`, { cache: "force-cache", signal: abort.signal });
      if (!overlayResponse.ok) throw new Error(`v591-${body}-overlay-fetch:${overlayResponse.status}`);
      const overlay = parseNasaSmallBodyAssetOverlayV591(body, await overlayResponse.json());
      const lod = overlay.model.lods.find((entry) => entry.lod === preferredLod);
      if (!lod) throw new Error(`v591-${body}-model-lod:${preferredLod}`);
      const response = await fetch(`/${lod.path.replace(/^public\//, "")}?sha256=${lod.sha256}`, { cache: "force-cache", signal: abort.signal });
      if (!response.ok) throw new Error(`v591-${body}-model-fetch:${response.status}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== lod.bytes || sha256BytesHexV566(new Uint8Array(bytes)) !== lod.sha256) throw new Error(`v591-${body}-model-drift:${preferredLod}`);
      await MeshoptDecoder.ready;
      const gltf = await parseGlbV591(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), bytes);
      scene = gltf.scene;
      resources = collectResourcesV591(scene);
      if (resources.geometries.size === 0) throw new Error(`v591-${body}-model-geometry:${preferredLod}`);
      for (const geometry of resources.geometries) if (!geometry.attributes.position || !geometry.attributes.normal) throw new Error(`v591-${body}-model-attributes:${preferredLod}`);
      scene.traverse((object) => {
        object.userData = {
          ...object.userData, atlasCandidate: "v591", atlasHeroBodyV591: body,
          atlasVisualAssetId: `${body}-model`, atlasVisualAssetSha256: lod.sha256,
          atlasVisualAssetOverlaySha256: expectedOverlayShaV591(body), atlasPresentationOnly: true,
          atlasMeasuredPhotometryClaim: false, atlasScientificPayloadMutation: false,
          atlasProceduralFallback: false, atlasModelLod: lod.lod,
        };
      });
      if (!alive || abort.signal.aborted) { disposeLoaded(); return; }
      releaseModel = acquireAtlasResource("model", "atlas", `v591-${body}-model-lod${lod.lod}`, { owner: "v591-celestial-convergence", estimatedBytes: lod.bytes, contentSha256: lod.sha256, manifestSha256: expectedOverlayShaV591(body) });
      releaseGpu = acquireAtlasResource("gpu-buffer", "atlas", `v591-${body}-model-lod${lod.lod}-geometry`, { owner: "v591-celestial-convergence", estimatedBytes: resources.estimatedGpuBytes, contentSha256: lod.sha256, manifestSha256: expectedOverlayShaV591(body) });
      setState({ scene, status: "ready", assetId: `${body}-model`, sha256: lod.sha256, lod: lod.lod, sourceBytes: lod.bytes, estimatedGpuBytes: resources.estimatedGpuBytes, sourceDetailCeiling: overlay.model.sourceDetailCeiling, printableSplitReconstruction: overlay.model.printableSplitReconstruction, reason: "none" });
    })().catch((error: unknown) => {
      if (!alive || abort.signal.aborted) return;
      disposeLoaded();
      setState({ ...idle, status: "blocked", reason: error instanceof Error ? error.message : `v591-${body}-model-unknown` });
    });
    return () => { alive = false; abort.abort(); disposeLoaded(); };
  }, [body, enabled, idle, preferredLod]);
  return state;
}
