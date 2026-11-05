"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import {
  CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { loadTempel1AssetOverlayV591 } from "./celestialTempel1V591";
import { sha256BytesHexV566 } from "./sha256BrowserV566";

export type V591Tempel1ModelLoadState = Readonly<{
  scene: THREE.Group | null;
  status: "idle" | "loading" | "ready" | "blocked";
  assetId: "tempel-1-model";
  sha256: string;
  lod: 0 | 1 | 2 | null;
  sourceBytes: number;
  estimatedGpuBytes: number;
  sourceDetailCeiling: string;
  reason: string;
}>;

const IDLE_TEMPEL1_MODEL_V591: V591Tempel1ModelLoadState = Object.freeze({
  scene: null,
  status: "idle",
  assetId: "tempel-1-model",
  sha256: "none",
  lod: null,
  sourceBytes: 0,
  estimatedGpuBytes: 0,
  sourceDetailCeiling: "unknown",
  reason: "none",
});

function parseGlbV591(loader: GLTFLoader, bytes: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => loader.parse(bytes, "", resolve, reject));
}

function collectResourcesV591(scene: THREE.Object3D): {
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

export function useV591Tempel1Model(preferredLod: 0 | 1 | 2, enabled = true): V591Tempel1ModelLoadState {
  const [state, setState] = useState<V591Tempel1ModelLoadState>(IDLE_TEMPEL1_MODEL_V591);
  useEffect(() => {
    const abort = new AbortController();
    let alive = true;
    let scene: THREE.Group | null = null;
    let resources: ReturnType<typeof collectResourcesV591> | null = null;
    let releaseModel: (() => void) | null = null;
    let releaseGpu: (() => void) | null = null;
    const disposeLoaded = () => {
      releaseGpu?.();
      releaseGpu = null;
      releaseModel?.();
      releaseModel = null;
      resources?.geometries.forEach(disposeAfterDetachV591);
      resources?.materials.forEach(disposeAfterDetachV591);
      resources = null;
      scene = null;
    };
    if (!enabled) {
      setState(IDLE_TEMPEL1_MODEL_V591);
      return () => abort.abort();
    }
    setState({ ...IDLE_TEMPEL1_MODEL_V591, status: "loading" });
    void (async () => {
      const overlay = await loadTempel1AssetOverlayV591(abort.signal);
      const lod = overlay.model.lods.find((entry) => entry.lod === preferredLod);
      if (!lod) throw new Error(`v591-tempel1-model-lod:${preferredLod}`);
      const response = await fetch(`/${lod.path.replace(/^public\//, "")}?sha256=${lod.sha256}`, { cache: "force-cache", signal: abort.signal });
      if (!response.ok) throw new Error(`v591-tempel1-model-fetch:${response.status}:${preferredLod}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== lod.bytes || sha256BytesHexV566(new Uint8Array(bytes)) !== lod.sha256) {
        throw new Error(`v591-tempel1-model-drift:${preferredLod}`);
      }
      await MeshoptDecoder.ready;
      const gltf = await parseGlbV591(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), bytes);
      scene = gltf.scene;
      resources = collectResourcesV591(scene);
      if (resources.geometries.size === 0) throw new Error(`v591-tempel1-model-geometry:${preferredLod}`);
      for (const geometry of resources.geometries) {
        if (!geometry.attributes.position || !geometry.attributes.normal) throw new Error(`v591-tempel1-model-attributes:${preferredLod}`);
      }
      scene.traverse((object) => {
        object.userData = {
          ...object.userData,
          atlasCandidate: "v591",
          atlasHeroBodyV591: "tempel-1",
          atlasVisualAssetId: "tempel-1-model",
          atlasVisualAssetSha256: lod.sha256,
          atlasVisualAssetOverlaySha256: CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
          atlasModelLodReceiptSha256: CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591,
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
      releaseModel = acquireAtlasResource("model", "atlas", `v591-tempel-1-model-lod${lod.lod}`, {
        owner: "v591-celestial-convergence",
        estimatedBytes: lod.bytes,
        contentSha256: lod.sha256,
        manifestSha256: CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
      });
      releaseGpu = acquireAtlasResource("gpu-buffer", "atlas", `v591-tempel-1-model-lod${lod.lod}-geometry`, {
        owner: "v591-celestial-convergence",
        estimatedBytes: resources.estimatedGpuBytes,
        contentSha256: lod.sha256,
        manifestSha256: CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
      });
      setState({
        scene,
        status: "ready",
        assetId: "tempel-1-model",
        sha256: lod.sha256,
        lod: lod.lod,
        sourceBytes: lod.bytes,
        estimatedGpuBytes: resources.estimatedGpuBytes,
        sourceDetailCeiling: overlay.model.sourceDetailCeiling,
        reason: "none",
      });
    })().catch((error: unknown) => {
      if (!alive || abort.signal.aborted) return;
      disposeLoaded();
      setState({
        ...IDLE_TEMPEL1_MODEL_V591,
        status: "blocked",
        reason: error instanceof Error ? error.message : "v591-tempel1-model-unknown",
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
