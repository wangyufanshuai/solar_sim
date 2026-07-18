"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  resolveAtlasAsset,
  type AtlasAssetLoadState,
} from "../lib/atlasAssetResolver";
import { LAUNCH_ASSET_TRANSFORMS_V2 } from "../lib/launchCompositionV2";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";

type LaunchAssetId = "sls-block-1" | "orion-capsule" | "cubesat-1ru" | "gateway-core";

function LoadedLaunchSpacecraftAsset({ asset, url }: { asset: LaunchAssetId; url: string }) {
  const transform = LAUNCH_ASSET_TRANSFORMS_V2[asset];
  const gltf = useGLTF(url);
  useEffect(() => acquireAtlasResource("model", "launch", `launch-${asset}`), [asset]);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const materials = sourceMaterials.map((source) => {
        const material = source.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          if (!material.map && material.color.getHSL({ h: 0, s: 0, l: 0 }).s < 0.08) {
            material.color.set(asset === "cubesat-1ru" ? "#c7a84b" : "#edf1f4");
          }
          material.metalness = asset === "cubesat-1ru" ? 0.64 : 0.12;
          material.roughness = asset === "gateway-core" ? 0.42 : 0.5;
          material.envMapIntensity = 0.72;
          material.toneMapped = true;
        }
        return material;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0]!;
    });
    return clone;
  }, [asset, gltf.scene]);

  return (
    <group
      scale={transform.scale}
      position={[...transform.position]}
      rotation={[...transform.rotation]}
    >
      <primitive object={scene} />
    </group>
  );
}

export default function LaunchSpacecraftAsset({
  asset,
  onLoadState,
}: {
  asset: LaunchAssetId;
  onLoadState?: (state: AtlasAssetLoadState) => void;
}) {
  const transform = LAUNCH_ASSET_TRANSFORMS_V2[asset];
  const resolution = useMemo(() => resolveAtlasAsset(transform.path), [transform.path]);
  const [state, setState] = useState<AtlasAssetLoadState>("probing");

  useEffect(() => {
    const controller = new AbortController();
    setState("probing");
    onLoadState?.("probing");
    void fetch(resolution.primaryUrl, {
      headers: { Range: "bytes=0-0" },
      signal: controller.signal,
    }).then((response) => {
      const next: AtlasAssetLoadState = response.ok ? "ready" : "fallback";
      setState(next);
      onLoadState?.(next);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setState("fallback");
      onLoadState?.("fallback");
      if (process.env.NODE_ENV === "development") console.warn("Launch asset unavailable", asset, error);
    });
    return () => controller.abort();
  }, [asset, onLoadState, resolution.primaryUrl]);

  if (state !== "ready") return null;
  return <LoadedLaunchSpacecraftAsset asset={asset} url={resolution.primaryUrl} />;
}
