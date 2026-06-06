"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { LoaderCircle } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { markRenderAssetStage } from "../lib/renderAssetQueue";
import type { ResourcePackManifest, SpacecraftResourcePackItem } from "../lib/resourcePackTypes";

type LoadedModelProps = {
  item: SpacecraftResourcePackItem;
};

const modelCache = new Map<string, THREE.Object3D>();

function normalizeModel(object: THREE.Object3D, scaleHint: number) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  object.position.sub(center);
  object.scale.setScalar((1.55 / maxAxis) * Math.max(0.2, scaleHint));
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    const material = mesh.material;
    const mats = Array.isArray(material) ? material : [material];
    for (const mat of mats) {
      if (mat && "metalness" in mat) {
        const standard = mat as THREE.MeshStandardMaterial;
        standard.roughness = Math.max(0.42, standard.roughness ?? 0.6);
      }
    }
  });
}

function GalleryModel({ item }: LoadedModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [scene, setScene] = useState<THREE.Object3D | null>(() => modelCache.get(item.localPath)?.clone(true) ?? null);

  useEffect(() => {
    let cancelled = false;
    const cached = modelCache.get(item.localPath);
    if (cached) {
      setScene(cached.clone(true));
      markRenderAssetStage("spacecraft-pack-ready");
      return;
    }
    const loader = new GLTFLoader();
    loader.load(
      item.localPath,
      (gltf) => {
        if (cancelled) return;
        const root = gltf.scene;
        normalizeModel(root, item.modelScale);
        modelCache.set(item.localPath, root);
        setScene(root.clone(true));
        markRenderAssetStage("spacecraft-pack-ready");
      },
      undefined,
      () => {
        if (!cancelled) setScene(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [item]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.28;
  });

  if (!scene) return null;
  return (
    <group ref={groupRef} rotation={[0.22, -0.4, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function GalleryStage({ item }: LoadedModelProps) {
  return (
    <Canvas
      dpr={[1, 1.25]}
      camera={{ position: [0, 0.55, 3.2], fov: 38, near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 2, 4]} intensity={2.2} />
      <directionalLight position={[-2, -1, -2]} intensity={0.55} color="#b7d4ff" />
      <Suspense fallback={null}>
        <GalleryModel item={item} />
      </Suspense>
      <mesh position={[0, -0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.78, 96]} />
        <meshBasicMaterial color="#7aa7ff" transparent opacity={0.34} depthWrite={false} />
      </mesh>
    </Canvas>
  );
}

async function fetchSpacecraftManifest() {
  const res = await fetch("/models/spacecraft/nasa-v2/manifest.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`spacecraft manifest ${res.status}`);
  return (await res.json()) as ResourcePackManifest;
}

export default function SpacecraftGalleryPanel() {
  const [items, setItems] = useState<SpacecraftResourcePackItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSpacecraftManifest()
      .then((manifest) => {
        if (cancelled) return;
        const next = manifest.spacecraft ?? [];
        setItems(next);
        setSelectedId((current) => current ?? next[0]?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  if (items.length === 0) {
    return (
      <div className="mt-3 border-t border-white/5 pt-3 text-[11px] text-white/34">
        <LoaderCircle className="mr-2 inline h-3.5 w-3.5 animate-spin" />
        Loading NASA spacecraft manifest
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[11px] tracking-[0.2em] text-slate-400">SPACECRAFT GALLERY</div>
        <div className="text-[10px] text-white/28">{items.length} NASA GLB</div>
      </div>
      {selected ? (
        <div className="mb-2 h-36 overflow-hidden rounded-xl border border-white/8 bg-black/24">
          <GalleryStage item={selected} />
        </div>
      ) : null}
      <div className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const active = item.id === selected?.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              data-solar-spacecraft={item.id}
              className={`min-h-9 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors ${
                active ? "bg-white/10 text-white/86" : "bg-white/[0.03] text-white/54 hover:bg-white/[0.07] hover:text-white/78"
              }`}
            >
              <span className="block truncate">{item.title}</span>
              <span className="block truncate text-[9px] text-white/28">
                {(item.bytes / 1024 / 1024).toFixed(1)} MB
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
