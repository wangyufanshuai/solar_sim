"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { skyEquirectCandidateUrls } from "../lib/skyEquirectUrl";

type GalaxyEnvironmentSphereProps = {
  onTextureState?: (loaded: boolean) => void;
  visible?: boolean;
};

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
  float tinyStars = pow(smoothstep(0.9984, 1.0, n), 4.0);
  vec3 color = max(tex - vec3(0.006, 0.007, 0.008), vec3(0.0));
  color *= vec3(0.72, 0.78, 0.88);
  color = color / (color + vec3(0.58));
  color = pow(max(color, vec3(0.0)), vec3(0.94));
  color += vec3(0.66, 0.74, 0.94) * tinyStars * 0.006;
  gl_FragColor = vec4(color, 1.0);
}
`;

export default function GalaxyEnvironmentSphere({
  onTextureState,
  visible = true,
}: GalaxyEnvironmentSphereProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const localCameraPosRef = useRef(new THREE.Vector3());
  const onTextureStateRef = useRef(onTextureState);
  const { camera, gl } = useThree();

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
    const skyTextures = skyEquirectCandidateUrls();
    const loadAt = (index: number) => {
      const url = skyTextures[index];
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

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !visible) return;
    localCameraPosRef.current.copy(camera.position);
    mesh.parent?.worldToLocal(localCameraPosRef.current);
    mesh.position.copy(localCameraPosRef.current);
  }, -1000);

  if (!visible || !texture) return null;

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      renderOrder={-10000}
      rotation={[0.1, Math.PI + 0.34, -0.62]}
      scale={900000}
    >
      <sphereGeometry args={[1, 96, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
