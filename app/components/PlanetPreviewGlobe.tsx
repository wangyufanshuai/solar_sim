"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function SpinningTexturedSphere({ url }: { url: string }) {
  const tex = useLoader(THREE.TextureLoader, url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.42;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 56, 56]} />
      <meshStandardMaterial map={tex} roughness={0.72} metalness={0.06} />
    </mesh>
  );
}

function SpinningSun() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.12;
  });
  const c = new THREE.Color("#ffecd8");
  c.multiplyScalar(2.2);
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial color={c} toneMapped={false} />
    </mesh>
  );
}

type PlanetPreviewGlobeProps = {
  textureMap?: string;
  isSun: boolean;
};

/**
 * Small sidebar WebGL preview (auto-rotate). Separate Canvas; `pointer-events: none`.
 */
export default function PlanetPreviewGlobe({
  textureMap,
  isSun,
}: PlanetPreviewGlobeProps) {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#0a0a12] to-black">
      <Canvas
        camera={{ position: [0, 0.15, 2.55], fov: 42 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 2, 5]} intensity={1.1} />
        <pointLight position={[-3, -1, 2]} intensity={0.35} color="#a8c8ff" />
        <Suspense fallback={null}>
          {isSun ? (
            <SpinningSun />
          ) : textureMap ? (
            <SpinningTexturedSphere url={textureMap} />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
