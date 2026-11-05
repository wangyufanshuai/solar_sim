"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  CELESTIAL_ART_MANIFEST_SHA256_V589,
  type CelestialDeliveryTierV589,
  type CelestialDeviceTierV589,
  type VisualAssetFileV589,
  type VisualAssetManifestEntryV589,
} from "./celestialArtV589";
import { loadVerifiedVisualAssetBytesV589, loadVisualAssetManifestV589 } from "./useV589Texture";

export type V589ModelLoadState = Readonly<{
  scene: THREE.Group | null;
  status: "idle" | "loading" | "ready" | "blocked";
  assetId: string;
  sha256: string;
  lod: 0 | 1 | 2 | null;
  sourceBytes: number;
  estimatedGpuBytes: number;
  reason: string;
}>;

const IDLE: V589ModelLoadState = Object.freeze({
  scene: null,
  status: "idle",
  assetId: "none",
  sha256: "none",
  lod: null,
  sourceBytes: 0,
  estimatedGpuBytes: 0,
  reason: "none",
});

function modelFiles(
  asset: VisualAssetManifestEntryV589,
  deliveryTier: CelestialDeliveryTierV589,
  deviceTier: CelestialDeviceTierV589,
): readonly VisualAssetFileV589[] {
  const order = deliveryTier === "vercel-lite"
    ? deviceTier === "mobile"
      ? [asset.variants.liteMobile, asset.variants.liteDesktop]
      : [asset.variants.liteDesktop, asset.variants.liteMobile]
    : deviceTier === "mobile"
      ? [asset.variants.fullMobile, asset.variants.fullDesktop, asset.variants.liteMobile, asset.variants.liteDesktop]
      : [asset.variants.fullDesktop, asset.variants.fullMobile, asset.variants.liteDesktop, asset.variants.liteMobile];
  const seen = new Set<string>();
  return order.filter((file): file is VisualAssetFileV589 => {
    if (!file || file.format !== "glb" || file.lod === undefined || seen.has(file.sha256)) return false;
    seen.add(file.sha256);
    return true;
  });
}

function selectModelFile(
  asset: VisualAssetManifestEntryV589,
  deliveryTier: CelestialDeliveryTierV589,
  deviceTier: CelestialDeviceTierV589,
  preferredLod: 0 | 1 | 2,
): VisualAssetFileV589 {
  const files = modelFiles(asset, deliveryTier, deviceTier);
  const selected = [...files].sort((left, right) => {
    const distance = Math.abs((left.lod ?? 2) - preferredLod) - Math.abs((right.lod ?? 2) - preferredLod);
    return distance || (left.lod ?? 2) - (right.lod ?? 2);
  })[0];
  if (!selected) throw new Error(`v589-model-variant:${asset.id}:${deliveryTier}:${deviceTier}`);
  return selected;
}

function parseGlb(loader: GLTFLoader, bytes: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => loader.parse(bytes, "", resolve, reject));
}

function estimateSceneGpuBytes(scene: THREE.Object3D): number {
  const geometries = new Set<THREE.BufferGeometry>();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BufferGeometry) geometries.add(object.geometry);
  });
  let bytes = 0;
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes)) {
      if (attribute instanceof THREE.BufferAttribute || attribute instanceof THREE.InterleavedBufferAttribute) {
        bytes += attribute.count * attribute.itemSize * attribute.array.BYTES_PER_ELEMENT;
      }
    }
    if (geometry.index) bytes += geometry.index.count * geometry.index.array.BYTES_PER_ELEMENT;
  }
  return bytes;
}

function collectDisposables(scene: THREE.Object3D): {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
} {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object.geometry instanceof THREE.BufferGeometry) geometries.add(object.geometry);
    const current = Array.isArray(object.material) ? object.material : [object.material];
    current.forEach((material) => { if (material) materials.add(material); });
  });
  return { geometries, materials };
}

function disposeModelResourceAfterDetachV589(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => resource.dispose());
  });
}

export function useV589Model(
  assetId: string,
  deliveryTier: CelestialDeliveryTierV589,
  deviceTier: CelestialDeviceTierV589,
  preferredLod: 0 | 1 | 2,
  enabled = true,
): V589ModelLoadState {
  const [state, setState] = useState<V589ModelLoadState>(IDLE);

  useEffect(() => {
    let alive = true;
    let scene: THREE.Group | null = null;
    let disposables: ReturnType<typeof collectDisposables> | null = null;
    let releaseModel: (() => void) | null = null;
    let releaseGpu: (() => void) | null = null;
    const disposeLoaded = () => {
      releaseGpu?.();
      releaseGpu = null;
      releaseModel?.();
      releaseModel = null;
      disposables?.geometries.forEach((geometry) => disposeModelResourceAfterDetachV589(geometry));
      disposables?.materials.forEach((material) => material.dispose());
      scene = null;
      disposables = null;
    };
    if (!enabled) {
      setState(IDLE);
      return () => undefined;
    }
    setState({ ...IDLE, status: "loading", assetId });
    const run = async () => {
      const manifest = await loadVisualAssetManifestV589();
      const asset = manifest.assets.find((entry) => entry.id === assetId);
      if (!asset) throw new Error(`v589-model-asset:${assetId}`);
      const file = selectModelFile(asset, deliveryTier, deviceTier, preferredLod);
      const bytes = await loadVerifiedVisualAssetBytesV589(file);
      await MeshoptDecoder.ready;
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await parseGlb(loader, bytes);
      scene = gltf.scene;
      disposables = collectDisposables(scene);
      const estimatedGpuBytes = estimateSceneGpuBytes(scene);
      scene.traverse((object) => {
        object.userData = {
          ...object.userData,
          atlasCandidate: "v589",
          atlasVisualAssetId: assetId,
          atlasVisualAssetSha256: file.sha256,
          atlasVisualAssetManifestSha256: CELESTIAL_ART_MANIFEST_SHA256_V589,
          atlasPresentationOnly: true,
          atlasScientificPayloadMutation: false,
          atlasProceduralFallback: false,
          atlasModelLod: file.lod,
        };
      });
      if (!alive) {
        disposeLoaded();
        return;
      }
      releaseModel = acquireAtlasResource("model", "atlas", `v589-${assetId}-lod${file.lod}`, {
        owner: "v589-celestial-art",
        estimatedBytes: file.bytes,
        contentSha256: file.sha256,
        manifestSha256: CELESTIAL_ART_MANIFEST_SHA256_V589,
      });
      releaseGpu = acquireAtlasResource("gpu-buffer", "atlas", `v589-${assetId}-lod${file.lod}-geometry`, {
        owner: "v589-celestial-art",
        estimatedBytes: estimatedGpuBytes,
        contentSha256: file.sha256,
        manifestSha256: CELESTIAL_ART_MANIFEST_SHA256_V589,
      });
      setState({
        scene,
        status: "ready",
        assetId,
        sha256: file.sha256,
        lod: file.lod ?? null,
        sourceBytes: file.bytes,
        estimatedGpuBytes,
        reason: "none",
      });
    };
    void run().catch((error: unknown) => {
      if (!alive) {
        disposeLoaded();
        return;
      }
      disposeLoaded();
      setState({
        ...IDLE,
        status: "blocked",
        assetId,
        reason: error instanceof Error ? error.message : "v589-model-unknown",
      });
    });
    return () => {
      alive = false;
      disposeLoaded();
    };
  }, [assetId, deliveryTier, deviceTier, enabled, preferredLod]);

  return state;
}
