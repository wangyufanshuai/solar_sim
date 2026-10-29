"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { StellarMaterialProfile } from "../lib/stellarMaterialProfile";
import type { StellarPortraitProfileV2 } from "../lib/stellarPortraitProfileV2";
import type { StellarPortraitProfileV3 } from "../lib/stellarPortraitProfileV3";
import type { StellarPortraitProfileV4 } from "../lib/stellarPortraitProfileV4";
import type { StellarPortraitProfileV5 } from "../lib/stellarPortraitProfileV5";
import type { StellarPortraitProfileV6 } from "../lib/stellarPortraitProfileV6";
import type { StellarPortraitProfileV7 } from "../lib/stellarPortraitProfileV7";
import {
  STELLAR_PORTRAIT_PROFILE_V594_VERSION,
  resolveStellarPortraitEvolutionPhaseV594,
  resolveStellarPortraitRotationPhaseV594,
  type StellarPortraitProfileV594,
  type StellarPortraitRenderContractV594,
  type StellarPortraitRenderModeV594,
  type StellarPortraitVisualSignatureProfileV594,
} from "../lib/stellarPortraitRenderContractV594";

type StellarPortraitProfile =
  | StellarPortraitProfileV2
  | StellarPortraitProfileV3
  | StellarPortraitProfileV4
  | StellarPortraitProfileV5
  | StellarPortraitProfileV6
  | StellarPortraitProfileV7
  | StellarPortraitProfileV594;

export type StellarAbsolutePhaseSourceV594 = Readonly<{
  getJulianDate: () => number;
}>;

type StellarRenderContractMaterialPropsV594 = Readonly<{
  mode: StellarPortraitRenderModeV594;
  renderContract: StellarPortraitRenderContractV594;
  phaseSource: StellarAbsolutePhaseSourceV594;
}>;

type GenericStellarMaterialProps = Readonly<{
  mode?: StellarPortraitRenderModeV594;
  renderContract?: never;
  phaseSource?: never;
}>;

type StellarMaterialRuntimeProps =
  | StellarRenderContractMaterialPropsV594
  | GenericStellarMaterialProps;

export const STELLAR_SURFACE_VERTEX_SHADER_V594 = /* glsl */ `
precision highp float;
varying vec3 vNormal;
varying vec3 vPosition;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;

export const STELLAR_CORONA_VERTEX_SHADER_V594 = /* glsl */ `
precision highp float;
varying vec3 vNormalView;
varying vec3 vPosition;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vNormalView = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;

export const STELLAR_CORONA_FRAGMENT_SHADER_V594 = /* glsl */ `
precision highp float;
uniform float uEvolutionPhase;
uniform float uStrength;
uniform float uLayers;
uniform float uSoftness;
uniform float uFalloff;
uniform float uWindStrength;
uniform float uSeed;
uniform vec3 uColor;
varying vec3 vNormalView;
varying vec3 vPosition;
#include <logdepthbuf_pars_fragment>
float hashCoronaV594(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33 + uSeed);
  return fract((p.x + p.y) * p.z);
}
void main() {
  #include <logdepthbuf_fragment>
  vec3 direction = normalize(vPosition);
  float fresnel = pow(
    clamp(1.0 - abs(vNormalView.z), 0.0, 1.0),
    max(0.25, uFalloff * mix(1.2, 0.72, uSoftness))
  );
  float azimuth = atan(vPosition.y, vPosition.x);
  float phase = uEvolutionPhase;
  float wind = clamp(uWindStrength, 0.0, 1.0);
  float flow = 0.48
    + (0.12 + wind * 0.11) * sin(azimuth * 9.0 + phase + hashCoronaV594(direction * 7.0) * 2.0)
    + (0.07 + wind * 0.08) * sin(azimuth * (5.0 + uLayers * 1.4) - phase * 0.61);
  float deterministicBreakup = hashCoronaV594(direction * 19.0 + vec3(cos(phase), sin(phase), 0.0));
  float brokenFlow = smoothstep(0.18, 0.86, flow + deterministicBreakup * 0.14);
  float alpha = fresnel * brokenFlow * (0.012 + uStrength * 0.038);
  gl_FragColor = vec4(uColor * (0.38 + fresnel * 0.34), alpha);
}`;

export const STELLAR_HALO_VERTEX_SHADER_V594 = /* glsl */ `
precision highp float;
varying vec2 vUv;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;

export const STELLAR_HALO_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uStrength;
varying vec2 vUv;
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  vec2 p = vUv - 0.5;
  float radius = length(p) * 2.0;
  float inner = exp(-radius * radius * 3.8);
  float outer = exp(-radius * 2.65);
  float feather = 1.0 - smoothstep(0.5, 1.0, radius);
  float alpha = (inner * 0.1 + outer * 0.32) * uStrength * feather;
  gl_FragColor = vec4(uColor * (0.38 + inner * 0.28), alpha);
}`;

export const STELLAR_SURFACE_FRAGMENT_SHADER_V594 = /* glsl */ `
precision highp float;
uniform float uRotationPhase;
uniform float uEvolutionPhase;
uniform float uSeed;
uniform float uGranulation;
uniform float uGranulationOctaves;
uniform float uActivity;
uniform float uSpots;
uniform float uContrast;
uniform float uFacula;
uniform float uActiveLatitude;
uniform float uLimb;
uniform float uConvectiveWarp;
uniform float uSpotClusters;
uniform float uGranuleBoundary;
uniform float uDifferentialShear;
uniform float uActiveLatitudeWidth;
uniform float uRadiance;
uniform float uToneMapShoulder;
uniform float uGravityDarkening;
uniform float uHotFactor;
uniform float uGiantFactor;
uniform float uRapidRotatorFactor;
uniform float uSignaturePhase;
uniform float uSignatureFrequency;
uniform float uCellAnisotropy;
uniform float uRadiativeBands;
uniform float uConvectiveCells;
uniform float uWindFilaments;
uniform float uPolarRadiance;
uniform float uEquatorialShade;
uniform float uPulsationAmplitude;
uniform float uPresentationEnhancement;
uniform vec3 uSceneLinearColor;
uniform vec3 uCore;
uniform vec3 uSurface;
uniform vec3 uCorona;
varying vec3 vNormal;
varying vec3 vPosition;
#include <logdepthbuf_pars_fragment>
float hashSurfaceV594(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.17, 0.31, 0.53) * uSeed);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noiseSurfaceV594(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hashSurfaceV594(i), hashSurfaceV594(i + vec3(1,0,0)), f.x), mix(hashSurfaceV594(i + vec3(0,1,0)), hashSurfaceV594(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hashSurfaceV594(i + vec3(0,0,1)), hashSurfaceV594(i + vec3(1,0,1)), f.x), mix(hashSurfaceV594(i + vec3(0,1,1)), hashSurfaceV594(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}
float fbmSurfaceV594(vec3 p) {
  float value = 0.0;
  float amplitude = 0.56;
  for (int octave = 0; octave < 5; octave += 1) {
    if (float(octave) < uGranulationOctaves) {
      value += amplitude * noiseSurfaceV594(p);
    }
    p = p.yzx * 2.03 + vec3(7.1, 3.7, 5.9);
    amplitude *= 0.48;
  }
  return value;
}
void main() {
  #include <logdepthbuf_fragment>
  vec3 n = normalize(vPosition);
  float rotationAngle = uRotationPhase * (1.0 - uDifferentialShear * n.y * n.y);
  n.xz = mat2(cos(rotationAngle), -sin(rotationAngle), sin(rotationAngle), cos(rotationAngle)) * n.xz;
  vec3 temporalOffset = vec3(
    cos(uEvolutionPhase),
    sin(uEvolutionPhase * 0.73),
    cos(uEvolutionPhase * 0.41)
  );
  float warpDriver = fbmSurfaceV594(n * 2.1 + vec3(uSeed) + temporalOffset * 0.12) - 0.5;
  vec3 convectionN = normalize(
    n + vec3(warpDriver, -warpDriver * 0.45, warpDriver * 0.7) * uConvectiveWarp
  );
  float compactCells = fbmSurfaceV594(convectionN * uGranulation + temporalOffset * 0.42);
  float giantCells = fbmSurfaceV594(n * max(3.0, uGranulation * 0.44) - temporalOffset * 0.26);
  float signatureLongitude = atan(n.z, n.x) * uSignatureFrequency + uSignaturePhase;
  float signatureLatitude = asin(clamp(n.y, -1.0, 1.0));
  float stretchedCells = fbmSurfaceV594(vec3(
    n.x * (1.0 + uCellAnisotropy * 1.8),
    n.y * (1.0 - uCellAnisotropy * 0.34),
    n.z * (1.0 + uCellAnisotropy * 0.72)
  ) * max(2.8, uGranulation * 0.56) + temporalOffset * 0.19);
  float cells = mix(compactCells, giantCells, uGiantFactor);
  cells = mix(cells, stretchedCells, uCellAnisotropy * 0.58);
  float fine = noiseSurfaceV594(n * uGranulation * 2.4 - temporalOffset * 0.31);
  float micro = noiseSurfaceV594(n * uGranulation * 5.6 + temporalOffset * 0.17);
  float warped = noiseSurfaceV594(n * (uGranulation * 0.46) + vec3(cells * 1.8, fine, -cells));
  float cellField = cells * 0.46 + fine * 0.27 + warped * 0.22 + micro * 0.11;
  float granules = smoothstep(0.25, 0.78, cellField);
  float cellBoundary = 1.0 - smoothstep(0.055, 0.19, abs(cells - fine));
  float radiativeSmoothing = mix(1.0, 0.62, uHotFactor);
  float facing = clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float radiativeBands = 0.5 + 0.5 * sin(
    signatureLatitude * (9.0 + uRadiativeBands * 7.0)
      + signatureLongitude * (1.6 + uCellAnisotropy)
      + warpDriver * 2.2
  );
  float bandVeil = smoothstep(0.2, 0.84, radiativeBands)
    * uRadiativeBands * (0.1 + facing * 0.08);
  float surfaceStructure = clamp(
    granules * 0.78 + micro * 0.16 - cellBoundary * uGranuleBoundary,
    0.0,
    1.0
  ) * radiativeSmoothing;
  float spotNoise = noiseSurfaceV594(
    n * (2.4 + uSpotClusters * 0.24) + vec3(uSeed * 8.0) + temporalOffset * 0.2
  );
  float activeBand = exp(
    -pow((abs(n.y) - uActiveLatitude) / max(0.08, uActiveLatitudeWidth), 2.0)
  );
  float spotAmplitude = clamp(uSpots * 7.0, 0.0, 1.0) * activeBand;
  float spots = 1.0 - smoothstep(0.82 - uSpots * 0.35, 0.91, spotNoise)
    * spotAmplitude * (0.35 + uActivity * 0.35);
  float limb = mix(1.0 - uLimb, 1.0, pow(facing, 0.62));
  float rim = pow(1.0 - facing, 3.0);
  float facula = smoothstep(0.74, 0.94, fine) * uFacula;
  float polarWeight = pow(abs(n.y), 1.45);
  float gravityBrightness = mix(
    1.0,
    mix(0.72, 1.18, polarWeight),
    clamp(uGravityDarkening + uRapidRotatorFactor * 0.08, 0.0, 1.0)
  );
  gravityBrightness *= 1.0
    + polarWeight * uPolarRadiance
    - (1.0 - polarWeight) * uEquatorialShade;
  vec3 anchor = mix(uSurface * uSceneLinearColor, uSceneLinearColor, 0.94);
  vec3 hotCell = mix(anchor, uCore * uSceneLinearColor, 0.2);
  float convectiveSignature = mix(0.5, surfaceStructure, uConvectiveCells);
  vec3 color = mix(
    anchor * (0.66 - uContrast * 0.08),
    hotCell,
    0.18 + convectiveSignature * (0.48 + uContrast * 0.28)
  ) * spots * limb * gravityBrightness;
  color += mix(anchor, uCore * uSceneLinearColor, 0.15) * bandVeil;
  float windSheen = smoothstep(0.54, 0.94, 0.5 + 0.5 * sin(
    signatureLongitude * (4.0 + uWindFilaments * 5.0)
      - signatureLatitude * 3.0
      + uEvolutionPhase * 0.27
  )) * uWindFilaments * rim * 0.18;
  color += uCorona * windSheen;
  color += mix(anchor, uCore * uSceneLinearColor, 0.28) * facula * facing;
  color += uCorona * rim * (0.2 + uActivity * 0.16) * uPresentationEnhancement;
  float pulsation = 1.0 + uPulsationAmplitude * sin(uEvolutionPhase);
  color *= pulsation;
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float saturation = mix(1.0, 1.56, uPresentationEnhancement);
  color = max(vec3(0.0), mix(vec3(luminance), color, saturation) * uRadiance);
  vec3 presentationMapped = color / (color + vec3(uToneMapShoulder));
  color = mix(color, presentationMapped, uPresentationEnhancement);
  gl_FragColor = vec4(color, 1.0);
}`;

function profileValue(
  portrait: StellarPortraitProfile,
  key: string,
  fallback: number,
): number {
  const value = (portrait as unknown as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const GENERIC_STELLAR_VISUAL_SIGNATURE_V594: StellarPortraitVisualSignatureProfileV594 =
  Object.freeze({
    signaturePhaseRad: 0,
    signatureFrequency: 1,
    cellAnisotropy: 0,
    radiativeBandStrength: 0,
    convectiveCellStrength: 1,
    windFilamentStrength: 0,
    polarRadiance: 0,
    equatorialShade: 0,
  });

function visualSignatureForMaterialV594(
  portrait: StellarPortraitProfile,
): StellarPortraitVisualSignatureProfileV594 {
  const versioned = portrait as StellarPortraitProfile & {
    version?: string;
    visualSignature?: StellarPortraitVisualSignatureProfileV594;
  };
  return versioned.version === STELLAR_PORTRAIT_PROFILE_V594_VERSION
    && versioned.visualSignature
    ? versioned.visualSignature
    : GENERIC_STELLAR_VISUAL_SIGNATURE_V594;
}

export function createStellarSurfaceUniformsV594(
  portrait: StellarPortraitProfile,
  mode: StellarPortraitRenderModeV594,
  renderContract?: StellarPortraitRenderContractV594,
): Record<string, THREE.IUniform> {
  const visualSignature = visualSignatureForMaterialV594(portrait);
  const presentationEnhancement = renderContract
    ? renderContract.surface.linearOutput ? 0 : 1
    : mode === "cinematic" ? 1 : 0;
  return {
    uRotationPhase: { value: 0 },
    uEvolutionPhase: { value: 0 },
    uSeed: { value: portrait.seed },
    uGranulation: { value: portrait.granulationScale },
    uGranulationOctaves: { value: profileValue(portrait, "surfaceDetailOctaves", 3) },
    uActivity: { value: portrait.activity },
    uSpots: { value: portrait.spotCoverage },
    uContrast: { value: portrait.granulationContrast },
    uFacula: { value: portrait.faculaStrength },
    uActiveLatitude: { value: profileValue(portrait, "activeLatitude", 0.36) },
    uLimb: { value: portrait.limbDarkening },
    uConvectiveWarp: { value: profileValue(portrait, "convectiveWarp", 0.3) },
    uSpotClusters: { value: profileValue(portrait, "spotClusterCount", 2) },
    uGranuleBoundary: { value: profileValue(portrait, "granuleBoundaryStrength", 0.12) },
    uDifferentialShear: {
      value: profileValue(portrait, "differentialRotationShear", 0.14),
    },
    uActiveLatitudeWidth: { value: profileValue(portrait, "activeLatitudeWidth", 0.28) },
    uRadiance: { value: profileValue(portrait, "surfaceRadiance", 0.78) },
    uToneMapShoulder: { value: profileValue(portrait, "toneMapShoulder", 0.7) },
    uGravityDarkening: { value: profileValue(portrait, "gravityDarkening", 0) },
    uHotFactor: { value: profileValue(portrait, "hotFactor", 0) },
    uGiantFactor: { value: profileValue(portrait, "giantFactor", 0) },
    uRapidRotatorFactor: { value: profileValue(portrait, "rapidRotatorFactor", 0) },
    uSignaturePhase: { value: visualSignature.signaturePhaseRad },
    uSignatureFrequency: { value: visualSignature.signatureFrequency },
    uCellAnisotropy: { value: visualSignature.cellAnisotropy },
    uRadiativeBands: { value: visualSignature.radiativeBandStrength },
    uConvectiveCells: { value: visualSignature.convectiveCellStrength },
    uWindFilaments: { value: visualSignature.windFilamentStrength },
    uPolarRadiance: { value: visualSignature.polarRadiance },
    uEquatorialShade: { value: visualSignature.equatorialShade },
    uPulsationAmplitude: { value: profileValue(portrait, "pulsationAmplitude", 0) },
    uPresentationEnhancement: { value: presentationEnhancement },
    uSceneLinearColor: {
      value: new THREE.Color().fromArray(
        "sceneLinearColor" in portrait
          ? [...portrait.sceneLinearColor]
          : [0.86, 0.78, 0.68],
      ),
    },
    uCore: { value: new THREE.Color(portrait.coreColor) },
    uSurface: { value: new THREE.Color(portrait.displayColor) },
    uCorona: { value: new THREE.Color(portrait.coronaColor) },
  };
}

export function createStellarCoronaUniformsV594(
  portrait: StellarPortraitProfile,
  mode: StellarPortraitRenderModeV594,
  renderContract?: StellarPortraitRenderContractV594,
): Record<string, THREE.IUniform> {
  const enabled = renderContract
    ? renderContract.corona.enabled
    : mode === "cinematic";
  return {
    uEvolutionPhase: { value: 0 },
    uStrength: { value: enabled ? portrait.coronaStrength : 0 },
    uLayers: { value: profileValue(portrait, "coronaLayerCount", 1) },
    uSoftness: { value: profileValue(portrait, "coronaSoftness", 0.78) },
    uFalloff: { value: profileValue(portrait, "coronaFalloff", 2.9) },
    uWindStrength: { value: profileValue(portrait, "windStrength", 0) },
    uSeed: { value: portrait.seed },
    uColor: { value: new THREE.Color(portrait.coronaColor) },
  };
}

export function createStellarHaloUniformsV594(
  portrait: StellarPortraitProfileV5
    | StellarPortraitProfileV6
    | StellarPortraitProfileV7
    | StellarPortraitProfileV594,
  mode: StellarPortraitRenderModeV594,
  renderContract?: StellarPortraitRenderContractV594,
): Record<string, THREE.IUniform> {
  const enabled = renderContract
    ? renderContract.halo.enabled
    : mode === "cinematic";
  return {
    uColor: { value: new THREE.Color().fromArray([...portrait.sceneLinearColor]) },
    uStrength: {
      value: enabled
        ? profileValue(portrait, "haloStrength", 0.68 + portrait.activity * 0.12)
        : 0,
    },
  };
}

const THREE_BUILTIN_UNIFORM_NAMES_V594 = new Set([
  "cameraPosition",
  "modelMatrix",
  "modelViewMatrix",
  "normalMatrix",
  "projectionMatrix",
  "viewMatrix",
]);

export function declaredStellarShaderUniformNamesV594(
  shaderSources: readonly string[],
): readonly string[] {
  const names = new Set<string>();
  const pattern = /\buniform\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+([A-Za-z_]\w*)\s*;/g;
  for (const source of shaderSources) {
    for (const match of source.matchAll(pattern)) {
      const name = match[1];
      if (!THREE_BUILTIN_UNIFORM_NAMES_V594.has(name)) names.add(name);
    }
  }
  return Object.freeze([...names].sort());
}

function finiteUniformValueV594(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value instanceof THREE.Color) {
    return Number.isFinite(value.r) && Number.isFinite(value.g) && Number.isFinite(value.b);
  }
  return false;
}

export function assertStellarShaderUniformParityV594(
  shaderSources: readonly string[],
  uniforms: Readonly<Record<string, THREE.IUniform>>,
): void {
  const declared = declaredStellarShaderUniformNamesV594(shaderSources);
  const initialized = Object.keys(uniforms).sort();
  if (declared.join("\n") !== initialized.join("\n")) {
    const missing = declared.filter((name) => !(name in uniforms));
    const extra = initialized.filter((name) => !declared.includes(name));
    throw new Error(
      `v594-stellar-uniform-parity:missing=${missing.join(",")}:extra=${extra.join(",")}`,
    );
  }
  for (const [name, uniform] of Object.entries(uniforms)) {
    if (!finiteUniformValueV594(uniform.value)) {
      throw new Error(`v594-stellar-uniform-non-finite:${name}`);
    }
  }
}

function contractUserData(
  contract: StellarPortraitRenderContractV594 | undefined,
  layer: "surface" | "corona" | "halo",
): Record<string, unknown> {
  if (!contract) return { atlasStellarPortraitLayer: layer };
  return {
    atlasCandidate: "v594",
    atlasStellarPortraitLayer: layer,
    atlasStellarHeroId: contract.heroId,
    atlasStellarArchetype: contract.archetype,
    atlasStellarRenderContractSha256: contract.contractSha256,
    atlasStellarRenderMode: contract.mode,
    atlasStellarAuthoritative: false,
    atlasStellarPresentationOnly: true,
    atlasObservationTextureClaim: false,
  };
}

function updateSurfacePhase(
  shader: THREE.ShaderMaterial,
  portrait: StellarPortraitProfile,
  elapsedSeconds: number,
  renderContract: StellarPortraitRenderContractV594 | undefined,
  phaseSource: StellarAbsolutePhaseSourceV594 | undefined,
): void {
  if (renderContract && phaseSource) {
    const julianDate = phaseSource.getJulianDate();
    shader.uniforms.uRotationPhase.value = resolveStellarPortraitRotationPhaseV594(
      renderContract,
      julianDate,
    );
    shader.uniforms.uEvolutionPhase.value = resolveStellarPortraitEvolutionPhaseV594(
      renderContract,
      julianDate,
    );
    return;
  }
  const rotationRate = profileValue(portrait, "rotationRate", 0.035);
  shader.uniforms.uRotationPhase.value = portrait.seed * Math.PI * 2
    + elapsedSeconds * rotationRate;
  shader.uniforms.uEvolutionPhase.value = portrait.seed * Math.PI * 2
    + elapsedSeconds * (0.025 + portrait.activity * 0.04);
}

export default function StellarPortraitMaterial({
  portrait,
  mode = "cinematic",
  renderContract,
  phaseSource,
}: Readonly<{
  material: StellarMaterialProfile;
  portrait: StellarPortraitProfile;
}> & StellarMaterialRuntimeProps) {
  const shader = useMemo(() => {
    const next = new THREE.ShaderMaterial({
      vertexShader: STELLAR_SURFACE_VERTEX_SHADER_V594,
      fragmentShader: STELLAR_SURFACE_FRAGMENT_SHADER_V594,
      uniforms: createStellarSurfaceUniformsV594(portrait, mode, renderContract),
      transparent: false,
      depthWrite: true,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    Object.assign(next.userData, contractUserData(renderContract, "surface"));
    return next;
  }, [mode, portrait, renderContract]);
  const shaderRef = useRef(shader);
  shaderRef.current = shader;
  useFrame((state) => {
    updateSurfacePhase(
      shaderRef.current,
      portrait,
      state.clock.elapsedTime,
      renderContract,
      phaseSource,
    );
  });
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}

export function StellarCoronaMaterial({
  portrait,
  mode = "cinematic",
  renderContract,
  phaseSource,
}: Readonly<{
  portrait: StellarPortraitProfile;
}> & StellarMaterialRuntimeProps) {
  const shader = useMemo(() => {
    const next = new THREE.ShaderMaterial({
      vertexShader: STELLAR_CORONA_VERTEX_SHADER_V594,
      fragmentShader: STELLAR_CORONA_FRAGMENT_SHADER_V594,
      uniforms: createStellarCoronaUniformsV594(portrait, mode, renderContract),
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    Object.assign(next.userData, contractUserData(renderContract, "corona"));
    return next;
  }, [mode, portrait, renderContract]);
  const shaderRef = useRef(shader);
  shaderRef.current = shader;
  useFrame((state) => {
    if (renderContract && phaseSource) {
      shaderRef.current.uniforms.uEvolutionPhase.value =
        resolveStellarPortraitEvolutionPhaseV594(
          renderContract,
          phaseSource.getJulianDate(),
        );
      return;
    }
    shaderRef.current.uniforms.uEvolutionPhase.value = portrait.seed * Math.PI * 2
      + state.clock.elapsedTime * 0.025;
  });
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}

export function StellarHaloMaterial({
  portrait,
  mode = "cinematic",
  renderContract,
}: Readonly<{
  portrait: StellarPortraitProfileV5
    | StellarPortraitProfileV6
    | StellarPortraitProfileV7
    | StellarPortraitProfileV594;
}> & StellarMaterialRuntimeProps) {
  const shader = useMemo(() => {
    const next = new THREE.ShaderMaterial({
      vertexShader: STELLAR_HALO_VERTEX_SHADER_V594,
      fragmentShader: STELLAR_HALO_FRAGMENT_SHADER,
      uniforms: createStellarHaloUniformsV594(portrait, mode, renderContract),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    Object.assign(next.userData, contractUserData(renderContract, "halo"));
    return next;
  }, [mode, portrait, renderContract]);
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}
