"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CelestialClockControllerV592 } from "../lib/celestialClockV592";
import type { CelestialDeviceTierV590, CelestialModeV590 } from "../lib/celestialRenderingV590";
import {
  STELLAR_HERO_BY_ID_V592,
  STELLAR_HERO_PACKET_SHA256_V592,
  resolveStellarRotationPhaseV592,
  stellarInspectionScaleV592,
  stellarTemperatureSrgbV592,
  type StellarHeroV592,
  type StellarHeroIdV592,
} from "../lib/stellarHeroesV592";

const STELLAR_SURFACE_VERTEX_V592 = /* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vLocalNormal = normalize(normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
    #include <logdepthbuf_vertex>
  }
`;

const STELLAR_NOISE_GLSL_V592 = /* glsl */ `
  float hashV592(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noiseV592(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hashV592(i), hashV592(i + vec3(1,0,0)), f.x), mix(hashV592(i + vec3(0,1,0)), hashV592(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hashV592(i + vec3(0,0,1)), hashV592(i + vec3(1,0,1)), f.x), mix(hashV592(i + vec3(0,1,1)), hashV592(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbmV592(vec3 p) {
    float value = 0.0;
    float amplitude = 0.54;
    mat3 rotation = mat3(
      0.00, 0.80, 0.60,
      -0.80, 0.36, -0.48,
      -0.60, -0.48, 0.64
    );
    for (int octave = 0; octave < 4; octave += 1) {
      value += amplitude * noiseV592(p);
      p = rotation * p * 2.03 + vec3(7.1, 3.7, 5.9);
      amplitude *= 0.48;
    }
    return value;
  }
`;

const STELLAR_SURFACE_FRAGMENT_V592 = /* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uPhotosphereColor;
  uniform float uGranulationScale;
  uniform float uSpotStrength;
  uniform float uFaculaStrength;
  uniform float uGiantFactor;
  uniform float uHotFactor;
  uniform float uGravityDarkening;
  uniform float uLimbStrength;
  uniform float uOutputScale;
  uniform float uCinematic;
  uniform float uSeed;
  #include <logdepthbuf_pars_fragment>
  ${STELLAR_NOISE_GLSL_V592}
  void main() {
    #include <logdepthbuf_fragment>
    vec3 localNormal = normalize(vLocalNormal);
    vec3 worldNormal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = clamp(dot(worldNormal, viewDirection), 0.0, 1.0);
    vec3 seedOffset = vec3(uSeed * 0.013, -uSeed * 0.007, uSeed * 0.019);
    float macro = fbmV592(localNormal * mix(uGranulationScale * 0.16, 4.8, uGiantFactor) + seedOffset);
    float meso = fbmV592(localNormal * uGranulationScale + seedOffset.yzx);
    float micro = noiseV592(localNormal * uGranulationScale * 3.1 - seedOffset.zxy);
    float compactCells = smoothstep(0.27, 0.82, meso);
    float giantCells = smoothstep(0.30, 0.78, macro);
    float cells = mix(compactCells, giantCells, uGiantFactor);
    // Hot radiative photospheres have fine, low-contrast granules; broad,
    // high-contrast cells are reserved for cool giants and supergiants.
    float contrast = mix(0.042, 0.34, uGiantFactor) * mix(1.0, 0.46, uHotFactor);
    float granulation = mix(1.0 - contrast, 1.0 + contrast, cells) * mix(0.96, 1.045, micro);
    float latitude = abs(localNormal.y);
    float spotField = fbmV592(localNormal * mix(8.2, 5.0, uGiantFactor) + seedOffset.zxy * 2.1);
    float spotDetail = noiseV592(localNormal * 23.0 - seedOffset.xyz * 1.7);
    float latitudeWindow = mix(smoothstep(0.95, 0.24, latitude), 1.0, uGiantFactor * 0.72);
    float spot = smoothstep(0.66, 0.82, spotField)
      * smoothstep(0.36, 0.72, spotDetail)
      * latitudeWindow
      * uSpotStrength;
    float oneMinusMu = 1.0 - mu;
    float limb = max(0.12, 1.0 - uLimbStrength * oneMinusMu - 0.14 * oneMinusMu * oneMinusMu);
    float limbWarmth = pow(oneMinusMu, 1.35) * 0.16;
    float facula = pow(oneMinusMu, 1.6) * smoothstep(0.53, 0.88, meso) * uFaculaStrength;
    float polarWeight = pow(latitude, 1.45);
    float gravityBrightness = mix(1.0, mix(0.74, 1.17, polarWeight), uGravityDarkening);
    vec3 coolCellTint = mix(vec3(1.16, 0.76, 0.56), vec3(0.76, 0.88, 1.13), uHotFactor);
    vec3 hotCellTint = mix(vec3(1.08, 0.96, 0.82), vec3(0.92, 0.98, 1.08), uHotFactor);
    vec3 cellularTint = mix(coolCellTint, hotCellTint, cells);
    vec3 color = uPhotosphereColor * cellularTint * granulation;
    vec3 spotTint = mix(vec3(0.20, 0.10, 0.055), vec3(0.42, 0.49, 0.62), uHotFactor);
    color = mix(color, color * spotTint, spot);
    color *= limb * gravityBrightness * (1.0 + facula) * uOutputScale;
    color *= mix(vec3(1.0), mix(vec3(1.08, 0.97, 0.90), vec3(0.90, 0.96, 1.08), uHotFactor), limbWarmth);
    color *= mix(vec3(1.0), vec3(0.93, 0.985, 1.095), uGravityDarkening * polarWeight * 0.32);
    color *= mix(0.97, 1.055, uCinematic);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STELLAR_CORONA_FRAGMENT_V592 = /* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uCoronaColor;
  uniform float uSeed;
  #include <logdepthbuf_pars_fragment>
  ${STELLAR_NOISE_GLSL_V592}
  void main() {
    #include <logdepthbuf_fragment>
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = clamp(dot(normalize(vWorldNormal), viewDirection), 0.0, 1.0);
    float rim = pow(1.0 - mu, 3.4);
    float plume = fbmV592(normalize(vWorldNormal) * 7.2 + vec3(uSeed * 0.019));
    float streamer = pow(smoothstep(0.34, 0.82, plume), 1.7);
    float alpha = rim * mix(0.012, 0.058, streamer);
    gl_FragColor = vec4(uCoronaColor * mix(0.54, 1.24, streamer), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function stableStarSeedV592(id: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) / 0xffff_ffff * 10_000;
}

function stellarSurfaceProfileV592(hero: StellarHeroV592) {
  const hotFactor = THREE.MathUtils.smoothstep(hero.temperatureK, 5_300, 18_000);
  const giantFactor = THREE.MathUtils.clamp((Math.log10(Math.max(1, hero.radiusSolar)) - 0.72) / 2.2, 0, 1);
  const gravityDarkening = THREE.MathUtils.clamp((hero.equatorialPolarRadiusRatio - 1) / 0.35, 0, 1);
  const radiative = hero.shaderProfile.includes("radiative");
  const coolConvective = hero.shaderProfile.includes("cool-convective");
  return Object.freeze({
    hotFactor,
    giantFactor,
    gravityDarkening,
    granulationScale: giantFactor > 0.68 ? 9.5 : coolConvective ? 22 : radiative ? 32 : 38,
    spotStrength: radiative ? 0.10 : THREE.MathUtils.lerp(0.34, 0.66, giantFactor),
    faculaStrength: radiative ? 0.055 : THREE.MathUtils.lerp(0.11, 0.21, giantFactor),
    limbStrength: THREE.MathUtils.lerp(0.48, 0.70, 1 - hotFactor * 0.58 + giantFactor * 0.34),
    outputScale: THREE.MathUtils.lerp(0.66, 0.73, hotFactor),
  });
}

function StellarIsolationBridgeV592({ active }: Readonly<{ active: boolean }>) {
  const scene = useThree((state) => state.scene);
  const hidden = useRef(new Map<THREE.Object3D, boolean>());
  const frame = useRef(0);
  useFrame(() => {
    if (!active) return;
    frame.current += 1;
    if (frame.current % 20 !== 1) return;
    scene.traverse((node) => {
      if (node.userData.atlasCandidate !== "v591" || !node.userData.atlasHeroBodyV591) return;
      if (!hidden.current.has(node)) hidden.current.set(node, node.visible);
      node.visible = false;
    });
  }, -0.75);
  useEffect(() => () => {
    for (const [node, visible] of hidden.current) node.visible = visible;
    hidden.current.clear();
  }, []);
  return null;
}

export default function StellarHeroV592({
  starId,
  mode,
  deviceTier,
  clock,
}: Readonly<{
  starId: StellarHeroIdV592;
  mode: CelestialModeV590;
  deviceTier: CelestialDeviceTierV590;
  clock: CelestialClockControllerV592;
}>) {
  const hero = STELLAR_HERO_BY_ID_V592[starId];
  const group = useRef<THREE.Group>(null);
  const lastTelemetry = useRef(0);
  const seed = useMemo(() => stableStarSeedV592(starId), [starId]);
  const inspectionScale = useMemo(() => stellarInspectionScaleV592(starId), [starId]);
  const surfaceProfile = useMemo(() => stellarSurfaceProfileV592(hero), [hero]);
  const temperatureColor = useMemo(() => stellarTemperatureSrgbV592(hero.temperatureK), [hero.temperatureK]);
  const photosphereColor = useMemo(() => new THREE.Color(...temperatureColor).convertSRGBToLinear(), [temperatureColor]);
  const surfaceMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STELLAR_SURFACE_VERTEX_V592,
    fragmentShader: STELLAR_SURFACE_FRAGMENT_V592,
    uniforms: {
      uPhotosphereColor: { value: photosphereColor.clone() },
      uGranulationScale: { value: surfaceProfile.granulationScale },
      uSpotStrength: { value: surfaceProfile.spotStrength },
      uFaculaStrength: { value: surfaceProfile.faculaStrength },
      uGiantFactor: { value: surfaceProfile.giantFactor },
      uHotFactor: { value: surfaceProfile.hotFactor },
      uGravityDarkening: { value: surfaceProfile.gravityDarkening },
      uLimbStrength: { value: surfaceProfile.limbStrength },
      uOutputScale: { value: surfaceProfile.outputScale },
      uCinematic: { value: mode === "cinematic" ? 1 : 0 },
      uSeed: { value: seed },
    },
    toneMapped: mode === "cinematic",
  }), [mode, photosphereColor, seed, surfaceProfile]);
  const coronaMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STELLAR_SURFACE_VERTEX_V592,
    fragmentShader: STELLAR_CORONA_FRAGMENT_V592,
    uniforms: {
      uCoronaColor: { value: photosphereColor.clone().multiplyScalar(1.14) },
      uSeed: { value: seed },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [photosphereColor, seed]);
  useEffect(() => () => {
    surfaceMaterial.dispose();
    coronaMaterial.dispose();
  }, [coronaMaterial, surfaceMaterial]);

  useFrame(({ clock: frameClock }) => {
    if (!group.current) return;
    const julianDate = clock.getJulianDate(performance.now());
    group.current.rotation.y = resolveStellarRotationPhaseV592(starId, julianDate);
    if (frameClock.elapsedTime - lastTelemetry.current < 0.25) return;
    lastTelemetry.current = frameClock.elapsedTime;
    const root = document.querySelector<HTMLElement>('section[data-atlas-v592-candidate]');
    if (!root) return;
    root.dataset.atlasV592StellarHeroId = starId;
    root.dataset.atlasV592StellarHeroName = hero.name;
    root.dataset.atlasV592StellarHeroPacketSha = STELLAR_HERO_PACKET_SHA256_V592;
    root.dataset.atlasV592StellarHeroGaiaSourceId = hero.gaiaSourceId;
    root.dataset.atlasV592StellarHeroGaiaCrossmatch = hero.gaiaCrossmatchStatus;
    root.dataset.atlasV592StellarHeroTemperatureK = String(hero.temperatureK);
    root.dataset.atlasV592StellarHeroRadiusSolar = hero.radiusSolar.toFixed(6);
    root.dataset.atlasV592StellarHeroLuminositySolar = String(hero.luminositySolar);
    root.dataset.atlasV592StellarHeroRotationPeriodDays = String(hero.rotationPeriodDays);
    root.dataset.atlasV592StellarHeroRotationPhaseRad = group.current.rotation.y.toFixed(8);
    root.dataset.atlasV592StellarHeroShader = hero.shaderProfile;
    root.dataset.atlasV592StellarHeroSurfacePolicy = "physics-generated-presentation-model-not-observation-texture";
    root.dataset.atlasV592StellarHeroScientificWriteback = "false";
    root.dataset.atlasV592StellarHeroRuntimeAdmission = "admitted";
  }, -0.5);

  const segments = deviceTier === "mobile" ? 96 : 160;
  return (
    <>
      <StellarIsolationBridgeV592 active />
      <group
        ref={group}
        scale={inspectionScale as [number, number, number]}
        userData={{
          atlasCandidate: "v592",
          atlasStellarHeroV592: starId,
          atlasGaiaSourceId: hero.gaiaSourceId,
          atlasPhysicsGeneratedPhotosphere: true,
          atlasObservationTextureClaim: false,
          atlasScientificPayloadWriteback: false,
        }}
      >
        <mesh material={surfaceMaterial} renderOrder={10}>
          <sphereGeometry args={[1.08, segments, Math.floor(segments / 2)]} />
        </mesh>
        {mode === "cinematic" ? (
          <mesh material={coronaMaterial} scale={1.045} renderOrder={9}>
            <sphereGeometry args={[1.08, Math.floor(segments * 0.72), Math.floor(segments * 0.36)]} />
          </mesh>
        ) : null}
      </group>
    </>
  );
}
