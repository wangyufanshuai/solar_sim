"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { skyEquirectCandidateUrls } from "../lib/skyEquirectUrl";
import {
  ORBIT_ATLAS_V6_SKY,
  type SolarPresentationMode,
} from "../lib/orbitAtlasPresentation";

type GalaxyEnvironmentSphereProps = {
  onTextureState?: (loaded: boolean) => void;
  visible?: boolean;
  presentationMode?: SolarPresentationMode;
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
uniform float uOrbitAtlas;
uniform vec2 uUvOffset;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uDustLaneStrength;
uniform float uCenterProtection;
varying vec2 vUv;
varying vec3 vWorldDir;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 sampleUv = vec2(fract(vUv.x + uUvOffset.x), clamp(vUv.y + uUvOffset.y, 0.0, 1.0));
  vec3 tex = texture2D(uMap, sampleUv).rgb;
  float n = hash(vUv * vec2(1630.0, 815.0));
  float tinyStars = pow(smoothstep(0.9987, 1.0, n), 4.2) * (1.0 - uOrbitAtlas);
  vec3 color = max(tex - vec3(0.006, 0.007, 0.009), vec3(0.0)) * uExposure;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  float band = smoothstep(0.018, 0.24, luma);
  float darkLane = smoothstep(0.08, 0.46, 1.0 - luma) * band;
  color = max((color - vec3(0.055)) * uContrast + vec3(0.055), vec3(0.0));
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);
  color *= mix(vec3(0.82, 0.88, 1.0), vec3(0.70, 0.77, 0.86), uOrbitAtlas);
  float brightFog = smoothstep(0.20, 0.82, luma);
  color *= 1.0 - brightFog * uCenterProtection * uOrbitAtlas;
  color = color / (color + mix(vec3(0.42), vec3(0.92), uOrbitAtlas));
  color = pow(max(color, vec3(0.0)), vec3(mix(0.9, 1.16, uOrbitAtlas)));
  color *= 1.0 - darkLane * uDustLaneStrength;
  color += vec3(0.64, 0.74, 0.96) * tinyStars * 0.0042;
  gl_FragColor = vec4(color, 1.0);
}
`;

export default function GalaxyEnvironmentSphere({
  onTextureState,
  visible = true,
  presentationMode = "sandbox",
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
          uOrbitAtlas: { value: 0 },
          uUvOffset: { value: new THREE.Vector2(0.018, 0.002) },
          uExposure: { value: 1 },
          uContrast: { value: 1 },
          uSaturation: { value: 1 },
          uDustLaneStrength: { value: 0.1 },
          uCenterProtection: { value: 0 },
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

  useEffect(() => {
    const atlas = presentationMode === "orbit-atlas";
    material.uniforms.uOrbitAtlas.value = atlas ? 1 : 0;
    material.uniforms.uUvOffset.value.set(
      atlas ? ORBIT_ATLAS_V6_SKY.uvOffset[0] : 0.018,
      atlas ? ORBIT_ATLAS_V6_SKY.uvOffset[1] : 0.002,
    );
    material.uniforms.uExposure.value = atlas ? ORBIT_ATLAS_V6_SKY.exposure : 1;
    material.uniforms.uContrast.value = atlas ? ORBIT_ATLAS_V6_SKY.contrast : 1;
    material.uniforms.uSaturation.value = atlas ? ORBIT_ATLAS_V6_SKY.saturation : 1;
    material.uniforms.uDustLaneStrength.value = atlas ? ORBIT_ATLAS_V6_SKY.dustLaneStrength : 0.1;
    material.uniforms.uCenterProtection.value = atlas ? ORBIT_ATLAS_V6_SKY.centerProtection : 0;
  }, [material, presentationMode]);

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
      rotation={
        presentationMode === "orbit-atlas"
          ? [...ORBIT_ATLAS_V6_SKY.rotation]
          : [0.1, Math.PI + 0.22, -0.76]
      }
      scale={900000}
    >
      <sphereGeometry args={[1, 96, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
