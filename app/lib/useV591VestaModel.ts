"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_VESTA_MODEL_LOD_RECEIPT_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";

type VestaModelLodV591 = Readonly<{
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

type VestaAssetOverlayV591 = Readonly<{
  version: "v591-vesta-asset-overlay-v1";
  status: "vesta-assets-derived-awaiting-runtime-admission" | "vesta-runtime-admitted";
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
    license: Readonly<{ id: "NASA-public-domain"; url: string }>;
    observationLimit: string;
    units: "normalized-diameter-2";
    pivot: "bounds-midpoint";
    rotationAxis: "positive-y";
    normals: true;
    watertight: true;
    lods: readonly VestaModelLodV591[];
  }>;
  microtextureReuse: Readonly<{
    candidate: "v591-readonly-exact-byte-reuse";
    sourceOverlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json";
    sourceOverlaySha256: string;
    noTextureBytesCopied: true;
    assets: readonly Readonly<{
      id: string;
      inheritedAssetId: string;
      body: "vesta";
      exactByteReuse: true;
      presentationOnly: true;
    }>[];
  }>;
  materialPolicy: Readonly<{
    substrate: "bounded-basaltic-achondrite-reference";
    microtexture: "poly-haven-cc0-presentation-only-not-vesta-observation";
    reflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular";
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

export type V591VestaModelLoadState = Readonly<{
  scene: THREE.Group | null;
  status: "idle" | "loading" | "ready" | "blocked";
  assetId: "vesta-model";
  sha256: string;
  lod: 0 | 1 | 2 | null;
  sourceBytes: number;
  estimatedGpuBytes: number;
  reason: string;
}>;

const IDLE_VESTA_MODEL_V591: V591VestaModelLoadState = Object.freeze({
  scene: null,
  status: "idle",
  assetId: "vesta-model",
  sha256: "none",
  lod: null,
  sourceBytes: 0,
  estimatedGpuBytes: 0,
  reason: "none",
});
const SHA256_PATTERN_V591 = /^[a-f0-9]{64}$/;
const REQUIRED_REUSE_V591 = Object.freeze([
  ["vesta-regolith-albedo", "bennu-regolith-albedo"],
  ["vesta-regolith-normal", "bennu-regolith-normal"],
  ["vesta-regolith-roughness", "bennu-regolith-roughness"],
] as const);

function canonicalizeV591(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV591);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, canonicalizeV591(record[key])]));
}

export function parseVestaAssetOverlayV591(value: unknown): VestaAssetOverlayV591 {
  if (!value || typeof value !== "object") throw new Error("v591-vesta-overlay-shape");
  const overlay = value as VestaAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-vesta-asset-overlay-v1"
    || !["vesta-assets-derived-awaiting-runtime-admission", "vesta-runtime-admitted"].includes(overlay.status)
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-vesta-overlay-seal");
  if (
    overlay.modelLodReceiptSha256 !== CELESTIAL_CONVERGENCE_VESTA_MODEL_LOD_RECEIPT_SHA256_V591
    || overlay.noNetworkRequestsPerformedDuringDerivation !== true
    || overlay.noTextureBytesCopied !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredPhotometryClaim !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-vesta-overlay-authority");
  const model = overlay.model;
  if (
    model?.candidate !== "v591-owned"
    || model.license?.id !== "NASA-public-domain"
    || !model.sourceUrl.startsWith("https://raw.githubusercontent.com/nasa/NASA-3D-Resources/")
    || !SHA256_PATTERN_V591.test(model.sourceSha256)
    || model.units !== "normalized-diameter-2"
    || model.pivot !== "bounds-midpoint"
    || model.rotationAxis !== "positive-y"
    || model.normals !== true
    || model.watertight !== true
    || model.lods?.length !== 3
  ) throw new Error("v591-vesta-overlay-model");
  for (const [index, lod] of model.lods.entries()) {
    if (
      lod.lod !== index
      || lod.path !== `public/models/candidate-v591/vesta/vesta-lod${index}.glb`
      || !Number.isSafeInteger(lod.bytes)
      || lod.bytes <= 0
      || !SHA256_PATTERN_V591.test(lod.sha256)
      || !Number.isSafeInteger(lod.triangleCount)
      || lod.triangleCount <= 0
      || !Number.isSafeInteger(lod.vertexCount)
      || lod.vertexCount <= 0
      || lod.normals !== true
      || lod.meshopt !== true
      || lod.pivot !== "bounds-midpoint"
      || lod.units !== "normalized-diameter-2"
      || lod.rotationAxis !== "positive-y"
    ) throw new Error(`v591-vesta-overlay-model-lod:${index}`);
  }
  const reuse = overlay.microtextureReuse;
  if (
    reuse?.candidate !== "v591-readonly-exact-byte-reuse"
    || reuse.sourceOverlayPath !== "public/data/celestial-convergence-v591/bennu-asset-overlay.json"
    || reuse.sourceOverlaySha256 !== CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591
    || reuse.noTextureBytesCopied !== true
    || reuse.assets?.length !== REQUIRED_REUSE_V591.length
  ) throw new Error("v591-vesta-overlay-microtexture");
  for (const [index, [id, inheritedAssetId]] of REQUIRED_REUSE_V591.entries()) {
    const asset = reuse.assets[index];
    if (
      asset?.id !== id
      || asset.inheritedAssetId !== inheritedAssetId
      || asset.body !== "vesta"
      || asset.exactByteReuse !== true
      || asset.presentationOnly !== true
    ) throw new Error(`v591-vesta-overlay-microtexture:${index}`);
  }
  if (
    overlay.materialPolicy?.substrate !== "bounded-basaltic-achondrite-reference"
    || overlay.materialPolicy?.microtexture !== "poly-haven-cc0-presentation-only-not-vesta-observation"
    || overlay.materialPolicy?.reflectance !== "oren-nayar-plus-bounded-opposition-no-glossy-specular"
  ) throw new Error("v591-vesta-overlay-material-policy");
  return overlay;
}

async function loadVestaAssetOverlayV591(signal: AbortSignal): Promise<VestaAssetOverlayV591> {
  const response = await fetch(`/data/celestial-convergence-v591/vesta-asset-overlay.json?sha256=${CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591}`, {
    cache: "force-cache",
    signal,
  });
  if (!response.ok) throw new Error(`v591-vesta-overlay-fetch:${response.status}`);
  return parseVestaAssetOverlayV591(await response.json());
}

function parseGlbV591(loader: GLTFLoader, bytes: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => loader.parse(bytes, "", resolve, reject));
}

function collectVestaResourcesV591(scene: THREE.Object3D): {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
  estimatedGpuBytes: number;
} {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object.geometry instanceof THREE.BufferGeometry) geometries.add(object.geometry);
    const current = Array.isArray(object.material) ? object.material : [object.material];
    current.forEach((material) => { if (material) materials.add(material); });
  });
  let estimatedGpuBytes = 0;
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes)) {
      if (attribute instanceof THREE.BufferAttribute || attribute instanceof THREE.InterleavedBufferAttribute) {
        estimatedGpuBytes += attribute.count * attribute.itemSize * attribute.array.BYTES_PER_ELEMENT;
      }
    }
    if (geometry.index) estimatedGpuBytes += geometry.index.count * geometry.index.array.BYTES_PER_ELEMENT;
  }
  return { geometries, materials, estimatedGpuBytes };
}

function disposeAfterDetachV591(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resource.dispose()));
}

export function useV591VestaModel(preferredLod: 0 | 1 | 2, enabled = true): V591VestaModelLoadState {
  const [state, setState] = useState<V591VestaModelLoadState>(IDLE_VESTA_MODEL_V591);
  useEffect(() => {
    const abort = new AbortController();
    let alive = true;
    let scene: THREE.Group | null = null;
    let resources: ReturnType<typeof collectVestaResourcesV591> | null = null;
    let releaseModel: (() => void) | null = null;
    let releaseGpu: (() => void) | null = null;
    const disposeLoaded = () => {
      releaseGpu?.();
      releaseGpu = null;
      releaseModel?.();
      releaseModel = null;
      resources?.geometries.forEach(disposeAfterDetachV591);
      resources?.materials.forEach((material) => material.dispose());
      resources = null;
      scene = null;
    };
    if (!enabled) {
      setState(IDLE_VESTA_MODEL_V591);
      return () => abort.abort();
    }
    setState({ ...IDLE_VESTA_MODEL_V591, status: "loading" });
    void (async () => {
      const overlay = await loadVestaAssetOverlayV591(abort.signal);
      const lod = overlay.model.lods.find((entry) => entry.lod === preferredLod);
      if (!lod) throw new Error(`v591-vesta-model-lod:${preferredLod}`);
      const url = `/${lod.path.replace(/^public\//, "")}?sha256=${lod.sha256}`;
      const response = await fetch(url, { cache: "force-cache", signal: abort.signal });
      if (!response.ok) throw new Error(`v591-vesta-model-fetch:${response.status}:${preferredLod}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== lod.bytes || sha256BytesHexV566(new Uint8Array(bytes)) !== lod.sha256) {
        throw new Error(`v591-vesta-model-drift:${preferredLod}`);
      }
      await MeshoptDecoder.ready;
      const gltf = await parseGlbV591(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), bytes);
      scene = gltf.scene;
      resources = collectVestaResourcesV591(scene);
      if (resources.geometries.size === 0) throw new Error(`v591-vesta-model-geometry:${preferredLod}`);
      for (const geometry of resources.geometries) {
        if (!geometry.attributes.position || !geometry.attributes.normal) throw new Error(`v591-vesta-model-attributes:${preferredLod}`);
      }
      scene.traverse((object) => {
        object.userData = {
          ...object.userData,
          atlasCandidate: "v591",
          atlasHeroBodyV591: "vesta",
          atlasVisualAssetId: "vesta-model",
          atlasVisualAssetSha256: lod.sha256,
          atlasVisualAssetOverlaySha256: CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591,
          atlasPresentationOnly: true,
          atlasMeasuredPhotometryClaim: false,
          atlasScientificPayloadMutation: false,
          atlasProceduralFallback: false,
          atlasModelLod: lod.lod,
        };
      });
      if (!alive || abort.signal.aborted) {
        disposeLoaded();
        return;
      }
      releaseModel = acquireAtlasResource("model", "atlas", `v591-vesta-model-lod${lod.lod}`, {
        owner: "v591-celestial-convergence",
        estimatedBytes: lod.bytes,
        contentSha256: lod.sha256,
        manifestSha256: CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591,
      });
      releaseGpu = acquireAtlasResource("gpu-buffer", "atlas", `v591-vesta-model-lod${lod.lod}-geometry`, {
        owner: "v591-celestial-convergence",
        estimatedBytes: resources.estimatedGpuBytes,
        contentSha256: lod.sha256,
        manifestSha256: CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591,
      });
      setState({
        scene,
        status: "ready",
        assetId: "vesta-model",
        sha256: lod.sha256,
        lod: lod.lod,
        sourceBytes: lod.bytes,
        estimatedGpuBytes: resources.estimatedGpuBytes,
        reason: "none",
      });
    })().catch((error: unknown) => {
      if (!alive || abort.signal.aborted) return;
      disposeLoaded();
      setState({
        ...IDLE_VESTA_MODEL_V591,
        status: "blocked",
        reason: error instanceof Error ? error.message : "v591-vesta-model-unknown",
      });
    });
    return () => {
      alive = false;
      abort.abort();
      disposeLoaded();
    };
  }, [enabled, preferredLod]);
  return state;
}
