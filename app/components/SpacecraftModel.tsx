"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { solarAssetUrl } from "../lib/runtimeUrls";

type SpacecraftModelProps = {
  modelUrls: readonly string[];
  radiusScene: number;
};

function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const m = mesh.material;
    if (Array.isArray(m)) m.forEach((x) => x.dispose());
    else if (m) m.dispose();
  });
}

export default function SpacecraftModel({
  modelUrls,
  radiusScene,
}: SpacecraftModelProps) {
  const [sceneObj, setSceneObj] = useState<THREE.Object3D | null>(null);
  const loader = useMemo(() => new GLTFLoader(), []);

  useEffect(() => {
    let disposed = false;
    let loadedObj: THREE.Object3D | null = null;
    (async () => {
      for (const url of modelUrls.map((entry) => solarAssetUrl(entry))) {
        try {
          const gltf = await loader.loadAsync(url);
          loadedObj = gltf.scene.clone(true);
          loadedObj.traverse((n) => {
            const mesh = n as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            }
          });
          break;
        } catch {
          // Try next model URL.
        }
      }
      if (disposed) {
        if (loadedObj) disposeObject3D(loadedObj);
        return;
      }
      setSceneObj(loadedObj);
    })();
    return () => {
      disposed = true;
      if (loadedObj) disposeObject3D(loadedObj);
    };
  }, [loader, modelUrls]);

  if (!sceneObj) return null;
  const scale = Math.max(0.01, radiusScene * 0.11);
  return (
    <primitive
      object={sceneObj}
      scale={[scale, scale, scale]}
      rotation={[Math.PI / 2, 0, Math.PI]}
      position={[0, 0, 0]}
    />
  );
}

