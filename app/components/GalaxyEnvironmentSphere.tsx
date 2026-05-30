"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

type GalaxyEnvironmentSphereProps = {
  onTextureState?: (loaded: boolean) => void;
  visible?: boolean;
};

const SKY_TEXTURES = [
  "/textures/sky/universe-sandbox-sky-8k.jpg",
  "/textures/sky/nasa_milkyway_2020_4k_balanced.jpg",
] as const;

const SKY_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldDir;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldDir = normalize(world.xyz - cameraPosition);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
varying vec3 vWorldDir;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 sampleUv = vec2(fract(vUv.x + 0.055), clamp(vUv.y + 0.02, 0.0, 1.0));
  vec3 tex = texture2D(uMap, sampleUv).rgb;
  float n = hash(vUv * vec2(1630.0, 815.0));
  float tinyStars = pow(smoothstep(0.9987, 1.0, n), 4.5);
  float luma = dot(tex, vec3(0.299, 0.587, 0.114));
  float dustLane = smoothstep(0.12, 0.34, luma) * (1.0 - smoothstep(0.45, 0.82, luma));
  float brightCloud = smoothstep(0.24, 0.78, luma);
  vec3 color = max(tex - vec3(0.0055, 0.0065, 0.0075), vec3(0.0));
  color *= vec3(0.70, 0.78, 0.9);
  color = mix(color * 0.82, color * 1.22, brightCloud);
  color -= vec3(0.018, 0.02, 0.024) * dustLane;
  color = max(color, vec3(0.0));
  color = color / (color + vec3(0.55));
  color = pow(color, vec3(0.92));
  color += vec3(0.62, 0.72, 0.95) * tinyStars * 0.0045;
  gl_FragColor = vec4(color, 1.0);
}
`;

export default function GalaxyEnvironmentSphere({
  onTextureState,
  visible = true,
}: GalaxyEnvironmentSphereProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const onTextureStateRef = useRef(onTextureState);
  const { gl } = useThree();

  onTextureStateRef.current = onTextureState;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uMap: { value: null as THREE.Texture | null },
        },
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    let loadedTexture: THREE.Texture | null = null;
    const configure = (loaded: THREE.Texture) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loadedTexture = loaded;
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.mapping = THREE.UVMapping;
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.wrapT = THREE.ClampToEdgeWrapping;
      loaded.minFilter = THREE.LinearMipmapLinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      loaded.generateMipmaps = true;
      loaded.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      loaded.needsUpdate = true;
      material.uniforms.uMap.value = loaded;
      material.needsUpdate = true;
      setTexture(loaded);
      onTextureStateRef.current?.(true);
    };
    const loadAt = (index: number) => {
      const url = SKY_TEXTURES[index];
      if (!url) {
        if (!cancelled) onTextureStateRef.current?.(false);
        return;
      }
      loader.load(url, configure, undefined, () => loadAt(index + 1));
    };
    loadAt(0);
    return () => {
      cancelled = true;
      material.uniforms.uMap.value = null;
      if (loadedTexture) {
        loadedTexture.dispose();
        loadedTexture = null;
      }
      setTexture((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [gl, material]);

  useEffect(() => () => material.dispose(), [material]);

  if (!visible || !texture) return null;

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      renderOrder={-10000}
      rotation={[0.1, Math.PI + 0.34, -0.62]}
      scale={12000}
    >
      <sphereGeometry args={[1, 96, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
