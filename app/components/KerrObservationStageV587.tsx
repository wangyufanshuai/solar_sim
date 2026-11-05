"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { acquireAtlasTextureResourceV289, getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { useV587Ktx2Texture } from "../lib/useV587Ktx2Texture";
import type { KerrObservationModeV587, KerrObservationSummaryV587, KerrObservationVariantV587 } from "../lib/kerrObservationV587";

type Projection = Readonly<{
  width: number;
  height: number;
  scienceRgba: ArrayBuffer;
  cinematicRgba: ArrayBuffer;
}>;

const CINEMATIC_VERTEX_SHADER_V587 = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CINEMATIC_FRAGMENT_SHADER_V587 = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uSpin;
  uniform float uExposure;

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, fraction.x), mix(c, d, fraction.x), fraction.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float weight = 0.5;
    for (int octave = 0; octave < 5; octave += 1) {
      value += valueNoise(point) * weight;
      point = mat2(1.72, 1.18, -1.18, 1.72) * point + 3.17;
      weight *= 0.5;
    }
    return value;
  }

  float gaussian(float value, float center, float width) {
    float normalized = (value - center) / width;
    return exp(-normalized * normalized);
  }

  void main() {
    vec2 point = (vUv - 0.5) * vec2(2.15, 1.18);
    point.x += 0.018 * uSpin;

    float radial = length(vec2(point.x * 0.69, point.y * 1.08));
    float angle = atan(point.y * 1.08, point.x * 0.69);
    float shadowRadius = 0.35 + 0.018 * uSpin * sin(angle) - 0.012 * uSpin * point.x;
    float shadow = 1.0 - smoothstep(shadowRadius - 0.008, shadowRadius + 0.008, radial);

    float warpedPlane = point.y + 0.09 - 0.055 * point.x + 0.012 * sin(point.x * 5.4 + 0.7);
    float radialWindow = smoothstep(0.33, 0.42, radial) * (1.0 - smoothstep(0.92, 1.18, radial));
    float directDisk = gaussian(abs(warpedPlane), 0.012, 0.026) * radialWindow;
    float diskHalo = gaussian(abs(warpedPlane), 0.022, 0.082) * radialWindow;

    float photonCore = gaussian(radial, shadowRadius + 0.014, 0.0065);
    float photonGlow = gaussian(radial, shadowRadius + 0.02, 0.028);
    float upperGate = smoothstep(-0.09, 0.17, point.y);
    float lowerGate = smoothstep(-0.1, 0.12, -point.y);
    float upperLens = gaussian(radial, shadowRadius + 0.098, 0.034) * upperGate;
    float lowerLens = gaussian(radial, shadowRadius + 0.076, 0.02) * lowerGate * 0.48;

    float dust = 0.76 + 0.34 * fbm(vec2(point.x * 13.0 - point.y * 4.0, point.y * 34.0));
    float filaments = 0.9 + 0.1 * sin(point.x * 108.0 + fbm(point * 21.0) * 8.0);
    float textureDetail = clamp(dust * filaments, 0.52, 1.24);
    float approaching = smoothstep(-0.8, 0.75, point.x + 0.15 * uSpin);
    vec3 ember = vec3(0.92, 0.12, 0.025);
    vec3 copper = vec3(1.0, 0.43, 0.12);
    vec3 hot = vec3(1.0, 0.7, 0.32);
    vec3 diskColor = mix(ember, copper, approaching);
    diskColor = mix(diskColor, hot, pow(approaching, 2.5) * 0.66);

    float diskSignal = (directDisk * 1.32 + diskHalo * 0.25) * textureDetail;
    float lensSignal = (upperLens * 0.92 + lowerLens * 0.54) * (0.72 + 0.42 * dust);
    float ringAnisotropy = 0.2
      + 0.34 * abs(cos(angle))
      + 0.28 * max(0.0, -sin(angle))
      + 0.28 * approaching;
    float ringSignal = (photonCore * 1.48 + photonGlow * 0.3) * ringAnisotropy;
    float foregroundDisk = gaussian(abs(warpedPlane), 0.01, 0.021)
      * (1.0 - smoothstep(0.86, 1.1, abs(point.x)))
      * smoothstep(0.02, 0.1, -point.y)
      * textureDetail;
    vec3 color = diskColor * (diskSignal + lensSignal);
    color += mix(copper, hot, approaching) * ringSignal;

    float outerWisp = gaussian(abs(warpedPlane), 0.16, 0.18)
      * (1.0 - smoothstep(0.72, 1.15, radial))
      * smoothstep(0.42, 0.7, radial)
      * fbm(point * vec2(8.0, 20.0));
    color += vec3(0.44, 0.11, 0.045) * outerWisp * 0.3;

    color *= 0.88 + 0.42 * uExposure;
    color = mix(color, vec3(0.0), shadow);
    color += diskColor * foregroundDisk * (0.72 + 0.28 * approaching) * uExposure;
    float alpha = clamp(
      diskSignal * 0.95
      + lensSignal * 0.8
      + ringSignal * 0.7
      + foregroundDisk * 0.9
      + outerWisp * 0.22
      + shadow * 0.99,
      0.0,
      1.0
    );
    gl_FragColor = vec4(color, alpha);
  }
`;

function ObservationRuntimeProbeV587() {
  const gl = useThree((state) => state.gl);
  const lastPublishRef = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastPublishRef.current < 0.25) return;
    lastPublishRef.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>(
      '[data-atlas-browser-acceptance-version="v587-postbuild-browser-acceptance"]',
    );
    if (!root) return;
    const resources = getAtlasResourceSnapshot();
    const context = gl.getContext();
    root.dataset.atlasRenderDrawCalls = String(gl.info.render.calls);
    root.dataset.atlasRenderTriangles = String(gl.info.render.triangles);
    root.dataset.atlasRenderPrograms = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasRenderTextures = String(gl.info.memory.textures);
    root.dataset.atlasRenderTargets = String(resources.gpuRenderTargets);
    root.dataset.atlasRenderResourceEstimatedBytes = String(resources.estimatedBytes);
    root.dataset.atlasRenderResourceEstimatedGpuBytes = String(resources.estimatedGpuBytes);
    root.dataset.atlasRenderDrawingBuffer = `${context.drawingBufferWidth}x${context.drawingBufferHeight}`;
  });
  return null;
}

function CinematicKerrHeroV587({ spinA, exposure }: { spinA: number; exposure: number }) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CINEMATIC_VERTEX_SHADER_V587,
    fragmentShader: CINEMATIC_FRAGMENT_SHADER_V587,
    uniforms: {
      uSpin: { value: spinA },
      uExposure: { value: exposure },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: true,
  }), [exposure, spinA]);
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);
  useEffect(() => () => {
    material.dispose();
  }, [material]);
  return (
    <mesh
      geometry={geometry}
      material={material}
      scale={[10.8, 6.08, 1]}
      position={[0, -0.02, 0.05]}
      renderOrder={11}
      frustumCulled={false}
      userData={{
        atlasCandidate: "v587",
        atlasLayer: "cinematic-kerr-hero",
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
        atlasDeterministicSeed: 587,
      }}
    />
  );
}

function deterministicStars(count: number): Float32Array {
  let state = 0x5870b5e5;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() * 2 - 1) * 15;
    positions[index * 3 + 1] = (random() * 2 - 1) * 9;
    positions[index * 3 + 2] = -4 - random() * 7;
  }
  return positions;
}

function StarsV587({ cinematic }: { cinematic: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(deterministicStars(900), 3));
    return next;
  }, []);
  const material = useMemo(
    () => new THREE.PointsMaterial({
      color: cinematic ? 0xffe2bd : 0xc7d7dc,
      size: cinematic ? 0.025 : 0.017,
      sizeAttenuation: true,
      transparent: true,
      opacity: cinematic ? 0.72 : 0.42,
      depthWrite: false,
      toneMapped: cinematic,
    }),
    [cinematic],
  );
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);
  useEffect(() => () => {
    material.dispose();
  }, [material]);
  useFrame((_, delta) => {
    if (cinematic && groupRef.current) groupRef.current.rotation.z += delta * 0.0014;
  });
  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

function PolarizationFieldV587({ summary, cinematic }: { summary: KerrObservationSummaryV587; cinematic: boolean }) {
  const geometry = useMemo(() => {
    const samples = summary.samples.filter(
      (sample) => {
        if (sample.classification !== "disk_hit" || sample.evpaRad === null) return false;
        const alphaMin = Number(summary.camera.alphaMinM);
        const alphaMax = Number(summary.camera.alphaMaxM);
        const betaMin = Number(summary.camera.betaMinM);
        const betaMax = Number(summary.camera.betaMaxM);
        const screenX = (sample.alphaM - alphaMin) / (alphaMax - alphaMin) * 2 - 1;
        const screenY = (sample.betaM - betaMin) / (betaMax - betaMin) * 2 - 1;
        const warpedPlane = screenY + screenX * 0.12 + 0.055 * Math.sin(screenX * Math.PI * 1.4);
        return Math.abs(warpedPlane) < 0.34 && Math.hypot(screenX * 0.8, screenY * 1.32) < 0.92;
      },
    );
    const stride = Math.max(1, Math.ceil(samples.length / 52));
    const selected = samples.filter((_, index) => index % stride === 0).slice(0, 52);
    const alphaMin = Number(summary.camera.alphaMinM);
    const alphaMax = Number(summary.camera.alphaMaxM);
    const betaMin = Number(summary.camera.betaMinM);
    const betaMax = Number(summary.camera.betaMaxM);
    const positions = new Float32Array(selected.length * 6);
    selected.forEach((sample, index) => {
      const x = ((sample.alphaM - alphaMin) / (alphaMax - alphaMin) - 0.5) * 10.6;
      const y = ((sample.betaM - betaMin) / (betaMax - betaMin) - 0.5) * 5.95;
      const half = 0.055 + Math.min(0.07, Math.sqrt(Math.max(0, sample.sampleAreaM2)) * 0.025);
      const dx = Math.sin(sample.evpaRad!) * half;
      const dy = Math.cos(sample.evpaRad!) * half;
      const offset = index * 6;
      positions.set([x - dx, y - dy, 1.2, x + dx, y + dy, 1.2], offset);
    });
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return next;
  }, [summary]);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({
      color: cinematic ? 0xcbb6ff : 0xa6f2f4,
      transparent: true,
      opacity: cinematic ? 0.24 : 0.56,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
    [cinematic],
  );
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);
  useEffect(() => () => {
    material.dispose();
  }, [material]);
  return <lineSegments geometry={geometry} material={material} renderOrder={14} />;
}

function ObservationProjectionV587({
  mode,
  projection,
  cinematicGain,
}: {
  mode: KerrObservationModeV587;
  projection: Projection;
  cinematicGain: number;
}) {
  const bytes = mode === "science" ? projection.scienceRgba : projection.cinematicRgba;
  const texture = useMemo(() => {
    const next = new THREE.DataTexture(
      new Uint8Array(bytes),
      projection.width,
      projection.height,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
    );
    next.colorSpace = mode === "science" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    // The binary sidecars remain exact and verified. This texture is explicitly
    // presentation-only, so linear sampling removes raster stair-steps without
    // altering the canonical classification or observable arrays.
    next.minFilter = THREE.LinearFilter;
    next.magFilter = THREE.LinearFilter;
    next.generateMipmaps = false;
    next.needsUpdate = true;
    next.userData = {
      atlasCandidate: "v587",
      atlasSource: "verified-observation-web-fields",
      atlasPresentationOnly: true,
      atlasScientificPayloadMutation: false,
      atlasMode: mode,
    };
    return next;
  }, [bytes, mode, projection.height, projection.width]);
  useEffect(() => {
    const release = acquireAtlasTextureResourceV289(
      texture,
      "kerr",
      `kerr-observation-v587-${mode}`,
      "v587-observation-stage",
    );
    return () => {
      release();
      texture.dispose();
    };
  }, [mode, texture]);
  return (
    <sprite scale={[10.8, 6.08, 1]} renderOrder={12} userData={{ atlasObservationProjection: "v587", atlasMode: mode }}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={mode === "cinematic"}
        blending={mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending}
        opacity={mode === "science" ? 1 : Math.min(0.48, 0.29 + cinematicGain * 0.1)}
      />
    </sprite>
  );
}

function CinematicBackdropV587({
  variant,
  spinA,
  exposure,
}: {
  variant: KerrObservationVariantV587;
  spinA: number;
  exposure: number;
}) {
  const texture = useV587Ktx2Texture(variant, true);
  if (!texture) return <CinematicKerrHeroV587 spinA={spinA} exposure={exposure} />;
  return (
    <sprite
      scale={[13.5, 7.6, 1]}
      position={[0.12, 0.02, -0.8]}
      renderOrder={8}
      userData={{
        atlasCandidate: "v587",
        atlasLayer: "cinematic-kerr-hero-ktx2",
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped
        opacity={0.96}
      />
    </sprite>
  );
}

export default function KerrObservationStageV587({
  mode,
  summary,
  projection,
  showPolarization,
  cinematicGain,
  variant,
}: {
  mode: KerrObservationModeV587;
  summary: KerrObservationSummaryV587;
  projection: Projection;
  showPolarization: boolean;
  cinematicGain: number;
  variant: KerrObservationVariantV587;
}) {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    scene.background = new THREE.Color(0x010204);
  }, [camera, scene]);
  const cinematic = mode === "cinematic";
  return (
    <group userData={{
      atlasCandidate: "v587-event-horizon-observatory",
      atlasSharedScientificGeometry: true,
      atlasScientificPayloadSha256: summary.authorityReference,
      atlasScientificPayloadMutation: false,
    }}>
      <ObservationRuntimeProbeV587 />
      <StarsV587 cinematic={cinematic} />
      {cinematic ? (
        <CinematicBackdropV587
          variant={variant}
          spinA={Number(summary.spin)}
          exposure={cinematicGain}
        />
      ) : null}
      {mode === "science" ? (
        <ObservationProjectionV587 mode={mode} projection={projection} cinematicGain={cinematicGain} />
      ) : null}
      {showPolarization ? <PolarizationFieldV587 summary={summary} cinematic={cinematic} /> : null}
    </group>
  );
}
