"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";
import { useOptionalRenderAssetQueue } from "../context/RenderAssetQueueContext";
import { markRenderAssetStage } from "../lib/renderAssetQueue";

type GalaxyEnvironmentSphereProps = {
  onTextureState?: (loaded: boolean) => void;
  visible?: boolean;
  qualityEnabled?: boolean;
};

const PREVIEW_SKY_TEXTURES = [
  "/textures/sky/nasa_milkyway_2020_4k_balanced.jpg",
  "/textures/sky/universe-sandbox-sky.jpg",
] as const;
const QUALITY_SKY_TEXTURES = [
  "/textures/sky/universe-sandbox-sky-8k.jpg",
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
uniform float uExposure;
uniform float uContrast;
uniform float uTinyStarIntensity;
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
  color *= uExposure;
  color = mix(vec3(luma), color, uContrast);
  color = color / (color + vec3(0.55));
  color = pow(color, vec3(0.92));
  color += vec3(0.62, 0.72, 0.95) * tinyStars * uTinyStarIntensity;
  gl_FragColor = vec4(color, 1.0);
}
`;

export default function GalaxyEnvironmentSphere({
  onTextureState,
  visible = true,
  qualityEnabled = false,
}: GalaxyEnvironmentSphereProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const onTextureStateRef = useRef(onTextureState);
  const { gl } = useThree();
  const queue = useOptionalRenderAssetQueue();

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
          uExposure: { value: VISUAL_CALIBRATION.sky.exposure },
          uContrast: { value: VISUAL_CALIBRATION.sky.contrast },
          uTinyStarIntensity: { value: VISUAL_CALIBRATION.sky.tinyStarIntensity },
        },
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const configure = (loaded: THREE.Texture, stage: "preview" | "quality") => {
      if (cancelled) {
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.mapping = THREE.UVMapping;
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.wrapT = THREE.ClampToEdgeWrapping;
      loaded.minFilter = THREE.LinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      loaded.generateMipmaps = false;
      loaded.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      loaded.needsUpdate = true;
      const sky = VISUAL_CALIBRATION.sky;
      material.uniforms.uExposure.value =
        stage === "quality" ? sky.exposure : sky.previewExposure;
      material.uniforms.uContrast.value =
        stage === "quality" ? sky.contrast : sky.previewContrast;
      material.uniforms.uTinyStarIntensity.value =
        stage === "quality" ? sky.tinyStarIntensity : sky.previewTinyStarIntensity;
      material.uniforms.uMap.value = loaded;
      material.needsUpdate = true;
      setTexture(loaded);
      markRenderAssetStage(stage === "quality" ? "quality-sky-ready" : "preview-sky-ready");
      if (stage === "preview") markRenderAssetStage("sky-ready");
      onTextureStateRef.current?.(true);
    };
    const loadAt = (urls: readonly string[], index: number, stage: "preview" | "quality") => {
      const url = urls[index];
      if (!url) {
        if (!cancelled && stage === "preview") onTextureStateRef.current?.(false);
        return;
      }
      if (queue) {
        queue.loadTexture({
          url,
          priority: stage === "quality" ? "quality" : "preview",
          colorSpace: THREE.SRGBColorSpace,
          anisotropy: Math.min(8, gl.capabilities.getMaxAnisotropy()),
          configure: (tex) => {
            tex.mapping = THREE.UVMapping;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
          },
          onLoad: (tex) => configure(tex, stage),
          onError: () => loadAt(urls, index + 1, stage),
        });
      } else {
        loader.load(url, (tex) => configure(tex, stage), undefined, () => loadAt(urls, index + 1, stage));
      }
    };
    loadAt(PREVIEW_SKY_TEXTURES, 0, "preview");
    if (qualityEnabled) loadAt(QUALITY_SKY_TEXTURES, 0, "quality");
    return () => {
      cancelled = true;
      material.uniforms.uMap.value = null;
      setTexture(null);
    };
  }, [gl, material, qualityEnabled, queue]);

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
