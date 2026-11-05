"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  assertStellarShaderUniformParityV594,
  declaredStellarShaderUniformNamesV594,
  type StellarAbsolutePhaseSourceV594,
} from "./StellarPortraitMaterial";
import {
  resolveStellarPortraitEvolutionPhaseV596,
  resolveStellarPortraitRotationPhaseV596,
  type StellarPortraitProfileV596,
  type StellarPortraitRenderContractV596,
} from "../lib/stellarPortraitRenderContractV596";

export const STELLAR_SURFACE_VERTEX_SHADER_V596 = /* glsl */ `
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

export const STELLAR_SURFACE_FRAGMENT_SHADER_V596 = /* glsl */ `
precision highp float;
uniform float uRotationPhase;
uniform float uEvolutionPhase;
uniform float uSeed;
uniform float uMacroScale;
uniform float uMesoScale;
uniform float uMicroScale;
uniform float uMacroStrength;
uniform float uMesoStrength;
uniform float uMicroStrength;
uniform float uBoundaryStrength;
uniform float uBoundarySharpness;
uniform float uRadiativeLayerStrength;
uniform float uRadiativeFiberScale;
uniform float uLatitudeOrganization;
uniform float uLatitudeFrequency;
uniform float uActivityRegionStrength;
uniform float uActivityRegionScale;
uniform float uActivityLatitude;
uniform float uActivityLatitudeWidth;
uniform float uPlumeStrength;
uniform float uIrregularity;
uniform float uPolarBrightening;
uniform float uEquatorialDarkening;
uniform float uGravityTransition;
uniform float uLimbCrispness;
uniform float uSurfaceContrast;
uniform float uActivity;
uniform float uPresentationEnhancement;
uniform vec3 uSceneLinearColor;
uniform vec3 uCore;
uniform vec3 uSurface;
uniform vec3 uCorona;
varying vec3 vNormalView;
varying vec3 vPosition;
#include <logdepthbuf_pars_fragment>

float hashV596(vec3 p) {
  p = fract(p * 0.1031 + vec3(0.13, 0.29, 0.47) * uSeed);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noiseV596(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hashV596(i), hashV596(i + vec3(1,0,0)), f.x), mix(hashV596(i + vec3(0,1,0)), hashV596(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hashV596(i + vec3(0,0,1)), hashV596(i + vec3(1,0,1)), f.x), mix(hashV596(i + vec3(0,1,1)), hashV596(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

float fbmV596(vec3 p) {
  float value = 0.0;
  float amplitude = 0.54;
  for (int octave = 0; octave < 5; octave += 1) {
    value += amplitude * noiseV596(p);
    p = p.yzx * 2.07 + vec3(5.3, 7.1, 3.7);
    amplitude *= 0.48;
  }
  return value;
}

float cellularBoundaryV596(float field, float sharpness) {
  float width = mix(0.19, 0.045, clamp(sharpness, 0.0, 1.0));
  return 1.0 - smoothstep(width * 0.28, width, abs(field - 0.5));
}

void main() {
  #include <logdepthbuf_fragment>
  vec3 n = normalize(vPosition);
  float latitude = asin(clamp(n.y, -1.0, 1.0));
  float differentialRotation = uRotationPhase * (1.0 - 0.1 * n.y * n.y);
  n.xz = mat2(
    cos(differentialRotation), -sin(differentialRotation),
    sin(differentialRotation), cos(differentialRotation)
  ) * n.xz;

  vec3 evolution = vec3(
    cos(uEvolutionPhase),
    sin(uEvolutionPhase * 0.73),
    cos(uEvolutionPhase * 0.41)
  );
  float topologyWarp = fbmV596(n * 1.7 + evolution * 0.08) - 0.5;
  vec3 irregularNormal = normalize(n + vec3(
    topologyWarp,
    noiseV596(n * 2.3 + evolution) - 0.5,
    -topologyWarp * 0.7
  ) * uIrregularity * 0.7);

  float macroField = fbmV596(irregularNormal * uMacroScale + evolution * 0.12);
  float mesoField = fbmV596(
    (irregularNormal + vec3(macroField - 0.5) * uIrregularity * 0.22)
      * uMesoScale - evolution * 0.2
  );
  float microField = noiseV596(n * uMicroScale + evolution * 0.35);
  float macroBoundary = cellularBoundaryV596(macroField, uBoundarySharpness * 0.72);
  float mesoBoundary = cellularBoundaryV596(mesoField, uBoundarySharpness);
  float boundary = mix(macroBoundary, mesoBoundary, clamp(uMesoStrength, 0.0, 1.0));

  float fiberWarp = (mesoField - 0.5) * (1.4 + uIrregularity * 3.6);
  vec3 fiberPosition = irregularNormal * uRadiativeFiberScale;
  float radiativeBreakup = fbmV596(
    irregularNormal * (uRadiativeFiberScale * 0.62 + 1.7)
      + evolution.yzx * 0.19
  );
  float radiativeCross = fbmV596(
    irregularNormal.zxy * (uRadiativeFiberScale * 0.39 + 2.3)
      - evolution.zxy * 0.16
  );
  float phaseDisorder = (radiativeBreakup - 0.5)
      * (3.4 + uIrregularity * 5.2)
    + (radiativeCross - 0.5) * 2.3;
  float fiberA = 0.5 + 0.5 * sin(
    dot(fiberPosition, normalize(vec3(1.0, 0.37, 0.61))) * 1.03
      + latitude * (0.7 + uLatitudeFrequency * 0.18)
      + fiberWarp * 0.68
      + phaseDisorder
      + uEvolutionPhase * 0.11
  );
  float fiberB = 0.5 + 0.5 * sin(
    dot(fiberPosition, normalize(vec3(-0.53, 0.81, 0.24))) * 0.83
      - latitude * 1.15
      - fiberWarp * 0.47
      + phaseDisorder * 0.61
  );
  float fiberC = 0.5 + 0.5 * sin(
    dot(fiberPosition, normalize(vec3(0.28, -0.44, 0.85))) * 0.57
      + phaseDisorder * 0.79
      - uEvolutionPhase * 0.07
  );
  float crossWeave = mix(fiberA, sqrt(max(0.0, fiberA * fiberB)), 0.55);
  float ridgedBreakup = 1.0 - abs(radiativeBreakup * 2.0 - 1.0);
  float brokenWeave = mix(
    crossWeave,
    ridgedBreakup * (0.68 + fiberC * 0.32),
    0.54 + uIrregularity * 0.18
  );
  float radiativeFibers = clamp(
    mix(brokenWeave, radiativeCross, 0.18 + uIrregularity * 0.16),
    0.0,
    1.0
  );
  float latitudeField = 0.5 + 0.5 * sin(
    latitude * uLatitudeFrequency + topologyWarp * 2.4
  );

  float activeBand = exp(-pow(
    (abs(n.y) - uActivityLatitude) / max(0.08, uActivityLatitudeWidth),
    2.0
  ));
  float activityNoise = fbmV596(
    irregularNormal * uActivityRegionScale
      + vec3(uSeed * 11.0)
      - evolution * 0.1
  );
  float activityRegion = smoothstep(0.58, 0.83, activityNoise + macroField * 0.12)
    * activeBand * uActivityRegionStrength;
  float plume = smoothstep(0.5, 0.84, macroField + (mesoField - 0.5) * 0.28)
    * uPlumeStrength;

  float signedStructure =
      (macroField - 0.5) * uMacroStrength * 1.25
    + (mesoField - 0.5) * uMesoStrength * 1.05
    + (microField - 0.5) * uMicroStrength * 0.72
    + (radiativeFibers - 0.5) * uRadiativeLayerStrength * 0.58
    + (latitudeField - 0.5) * uLatitudeOrganization * 0.34;
  float boundaryDarkening = boundary * uBoundaryStrength * 0.32;
  float cellHeat = clamp(0.5 + signedStructure * 1.1 + plume * 0.24, 0.0, 1.0);

  float facing = clamp(dot(normalize(vNormalView), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float limbExponent = mix(0.42, 0.82, uLimbCrispness);
  float limbFloor = mix(0.3, 0.1, uLimbCrispness);
  float limb = mix(limbFloor, 1.0, pow(facing, limbExponent));
  float rim = pow(1.0 - facing, 3.2);
  float polarWeight = pow(abs(n.y), mix(1.35, 3.1, uGravityTransition));
  float gravityBrightness = 1.0
    + polarWeight * uPolarBrightening
    - (1.0 - polarWeight) * uEquatorialDarkening;

  vec3 neutralSurface = mix(uSurface * uSceneLinearColor, uSceneLinearColor, 0.82);
  vec3 hotSurface = mix(neutralSurface, uCore * uSceneLinearColor, 0.46);
  vec3 coolSurface = mix(neutralSurface, uSurface * 0.5, 0.34);
  vec3 color = mix(coolSurface, hotSurface, cellHeat);
  float contrastGain = 0.72 + uSurfaceContrast * 1.2;
  color *= (1.0 + signedStructure * contrastGain - boundaryDarkening);
  color *= limb * gravityBrightness;
  color *= 1.0 - activityRegion * (0.22 + uActivity * 0.16);
  color += hotSurface * plume * (0.14 + uPresentationEnhancement * 0.12);
  color += uCorona * rim * uPresentationEnhancement * (0.1 + uActivity * 0.08);

  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luminance), color, mix(1.0, 1.18, uPresentationEnhancement));
  color = max(vec3(0.0), color);
  vec3 restrainedShoulder = color / (color + vec3(0.92));
  color = mix(color, restrainedShoulder, uPresentationEnhancement * 0.42);
  gl_FragColor = vec4(color, 1.0);
}`;

export const STELLAR_CORONA_VERTEX_SHADER_V596 = /* glsl */ `
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

export const STELLAR_CORONA_FRAGMENT_SHADER_V596 = /* glsl */ `
precision highp float;
uniform float uEvolutionPhase;
uniform float uStrength;
uniform float uFalloff;
uniform float uWindStrength;
uniform float uLayerSeparation;
uniform float uFilamentScale;
uniform float uFilamentBreakup;
uniform float uRadialSpokeStrength;
uniform float uSeed;
uniform vec3 uColor;
varying vec3 vNormalView;
varying vec3 vPosition;
#include <logdepthbuf_pars_fragment>

float hashCoronaV596(vec3 p) {
  p = fract(p * 0.1031 + uSeed * vec3(0.17, 0.31, 0.47));
  p += dot(p, p.yzx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noiseCoronaV596(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hashCoronaV596(i), hashCoronaV596(i + vec3(1,0,0)), f.x), mix(hashCoronaV596(i + vec3(0,1,0)), hashCoronaV596(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hashCoronaV596(i + vec3(0,0,1)), hashCoronaV596(i + vec3(1,0,1)), f.x), mix(hashCoronaV596(i + vec3(0,1,1)), hashCoronaV596(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

float fbmCoronaV596(vec3 p) {
  float value = 0.0;
  float amplitude = 0.57;
  for (int octave = 0; octave < 4; octave += 1) {
    value += amplitude * noiseCoronaV596(p);
    p = p.yzx * 2.13 + vec3(4.1, 6.7, 2.9);
    amplitude *= 0.46;
  }
  return value;
}

void main() {
  #include <logdepthbuf_fragment>
  vec3 n = normalize(vPosition);
  float fresnel = pow(
    clamp(1.0 - abs(vNormalView.z), 0.0, 1.0),
    max(0.28, uFalloff * 0.72)
  );
  vec3 evolution = vec3(
    cos(uEvolutionPhase),
    sin(uEvolutionPhase * 0.79),
    cos(uEvolutionPhase * 0.43)
  );
  float turbulence = fbmCoronaV596(
    n * (3.2 + uFilamentScale * 0.31) + evolution * 0.18
  );
  float breakup = fbmCoronaV596(
    n.yzx * (6.4 + uFilamentScale * 0.54) - evolution.zxy * 0.24
  );
  float phaseWarp = (turbulence - 0.5) * (4.0 + uFilamentBreakup * 7.0)
    + (breakup - 0.5) * 3.2;
  float filamentA = 1.0 - abs(sin(
    dot(n, normalize(vec3(0.92, 0.31, -0.24))) * uFilamentScale
      + phaseWarp
      + uEvolutionPhase * 0.13
  ));
  float filamentB = 1.0 - abs(sin(
    dot(n, normalize(vec3(-0.38, 0.83, 0.41)))
      * (uFilamentScale * 0.71 + 1.8)
      - phaseWarp * 0.67
      - uEvolutionPhase * 0.09
  ));
  float strandField = mix(filamentA, max(filamentA, filamentB * 0.82), 0.58);
  float brokenEnvelope = smoothstep(
    0.34,
    0.84,
    breakup + (turbulence - 0.5) * 0.42
  );
  float filaments = smoothstep(0.56, 0.94, strandField)
    * mix(1.0, brokenEnvelope, uFilamentBreakup)
    + smoothstep(0.68, 0.96, turbulence) * uFilamentBreakup * 0.42;
  float radialSpokes = smoothstep(
    0.68,
    0.95,
    1.0 - abs(sin(
      dot(n, normalize(vec3(0.22, -0.51, 0.83)))
        * (5.0 + uFilamentScale * 0.41)
        + phaseWarp * 0.38
    ))
  ) * uRadialSpokeStrength * mix(0.82, 0.38, uFilamentBreakup);
  float wind = clamp(uWindStrength, 0.0, 1.0);
  float shellSeparation = mix(0.78, 1.48, clamp(uLayerSeparation, 0.0, 1.0));
  float windKnots = smoothstep(0.58, 0.94, turbulence + breakup * 0.24)
    * wind * uFilamentBreakup;
  float alpha = fresnel
    * (0.06 + filaments * (0.74 + wind * 0.5)
      + radialSpokes * 0.34 + windKnots * 0.52)
    * (0.024 + uStrength * (0.082 + wind * 0.038))
    * shellSeparation;
  gl_FragColor = vec4(
    uColor * (0.4 + fresnel * 0.3 + filaments * 0.16 + windKnots * 0.12),
    alpha
  );
}`;

export const STELLAR_HALO_VERTEX_SHADER_V596 = /* glsl */ `
precision highp float;
varying vec2 vUv;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;

export const STELLAR_HALO_FRAGMENT_SHADER_V596 = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uStrength;
uniform float uCoreTightness;
uniform float uOuterFalloff;
varying vec2 vUv;
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  vec2 p = vUv - 0.5;
  float radius = length(p) * 2.0;
  float inner = exp(-radius * radius * uCoreTightness);
  float outer = exp(-radius * uOuterFalloff);
  float feather = 1.0 - smoothstep(0.54, 1.0, radius);
  float alpha = (inner * 0.1 + outer * 0.38) * uStrength * feather;
  gl_FragColor = vec4(uColor * (0.48 + inner * 0.32), alpha);
}`;

export function createStellarSurfaceUniformsV596(
  portrait: StellarPortraitProfileV596,
  contract: StellarPortraitRenderContractV596,
): Record<string, THREE.IUniform> {
  const morphology = contract.surface.morphology;
  return {
    uRotationPhase: { value: 0 },
    uEvolutionPhase: { value: 0 },
    uSeed: { value: portrait.seed },
    uMacroScale: { value: morphology.macroScale },
    uMesoScale: { value: morphology.mesoScale },
    uMicroScale: { value: morphology.microScale },
    uMacroStrength: { value: morphology.macroStrength },
    uMesoStrength: { value: morphology.mesoStrength },
    uMicroStrength: { value: morphology.microStrength },
    uBoundaryStrength: { value: morphology.boundaryStrength },
    uBoundarySharpness: { value: morphology.boundarySharpness },
    uRadiativeLayerStrength: { value: morphology.radiativeLayerStrength },
    uRadiativeFiberScale: { value: morphology.radiativeFiberScale },
    uLatitudeOrganization: { value: morphology.latitudeOrganization },
    uLatitudeFrequency: { value: morphology.latitudeFrequency },
    uActivityRegionStrength: { value: morphology.activityRegionStrength },
    uActivityRegionScale: { value: morphology.activityRegionScale },
    uActivityLatitude: { value: morphology.activityLatitude },
    uActivityLatitudeWidth: { value: morphology.activityLatitudeWidth },
    uPlumeStrength: { value: morphology.plumeStrength },
    uIrregularity: { value: morphology.irregularity },
    uPolarBrightening: { value: morphology.polarBrightening },
    uEquatorialDarkening: { value: morphology.equatorialDarkening },
    uGravityTransition: { value: morphology.gravityTransition },
    uLimbCrispness: { value: morphology.limbCrispness },
    uSurfaceContrast: { value: portrait.granulationContrast },
    uActivity: { value: portrait.activity },
    uPresentationEnhancement: { value: contract.surface.linearOutput ? 0 : 1 },
    uSceneLinearColor: { value: new THREE.Color().fromArray([...portrait.sceneLinearColor]) },
    uCore: { value: new THREE.Color(portrait.coreColor) },
    uSurface: { value: new THREE.Color(portrait.displayColor) },
    uCorona: { value: new THREE.Color(portrait.coronaColor) },
  };
}

export function createStellarCoronaUniformsV596(
  portrait: StellarPortraitProfileV596,
  contract: StellarPortraitRenderContractV596,
): Record<string, THREE.IUniform> {
  const morphology = contract.corona.morphology;
  return {
    uEvolutionPhase: { value: 0 },
    uStrength: { value: contract.corona.enabled ? portrait.coronaStrength : 0 },
    uFalloff: { value: portrait.coronaFalloff },
    uWindStrength: { value: contract.corona.windEnabled ? portrait.windStrength : 0 },
    uLayerSeparation: { value: morphology.layerSeparation },
    uFilamentScale: { value: morphology.filamentScale },
    uFilamentBreakup: { value: morphology.filamentBreakup },
    uRadialSpokeStrength: { value: morphology.radialSpokeStrength },
    uSeed: { value: portrait.seed },
    uColor: { value: new THREE.Color().fromArray([...portrait.sceneLinearColor]) },
  };
}

export function createStellarHaloUniformsV596(
  portrait: StellarPortraitProfileV596,
  contract: StellarPortraitRenderContractV596,
): Record<string, THREE.IUniform> {
  const morphology = contract.halo.morphology;
  return {
    uColor: { value: new THREE.Color().fromArray([...portrait.sceneLinearColor]) },
    uStrength: { value: contract.halo.enabled ? portrait.haloStrength : 0 },
    uCoreTightness: { value: morphology.coreTightness },
    uOuterFalloff: { value: morphology.outerFalloff },
  };
}

export function declaredStellarShaderUniformNamesV596(
  shaderSources: readonly string[],
): readonly string[] {
  return declaredStellarShaderUniformNamesV594(shaderSources);
}

export function assertStellarShaderUniformParityV596(
  shaderSources: readonly string[],
  uniforms: Readonly<Record<string, THREE.IUniform>>,
): void {
  assertStellarShaderUniformParityV594(shaderSources, uniforms);
}

function contractUserDataV596(
  contract: StellarPortraitRenderContractV596,
  layer: "surface" | "corona" | "halo",
): Record<string, unknown> {
  return {
    atlasCandidate: "v596",
    atlasStellarPortraitLayer: layer,
    atlasStellarRendererV596: true,
    atlasStellarRendererVersion: contract.version,
    atlasStellarHeroId: contract.heroId,
    atlasStellarArchetype: contract.archetype,
    atlasStellarMorphologyVersion: contract.morphology.version,
    atlasStellarMorphologyTopology: contract.morphology.topology,
    atlasStellarMorphologySha256: contract.morphology.profileSha256,
    atlasStellarRenderContractSha256: contract.contractSha256,
    atlasStellarBaselineV594ContractSha256: contract.baselineV594ContractSha256,
    atlasStellarRenderMode: contract.mode,
    atlasStellarAuthoritative: false,
    atlasStellarPresentationOnly: true,
    atlasStellarResolvedSurface: false,
    atlasObservationTextureClaim: false,
    atlasScientificPayloadWriteback: false,
  };
}

function updateSurfacePhaseV596(
  shader: THREE.ShaderMaterial,
  contract: StellarPortraitRenderContractV596,
  phaseSource: StellarAbsolutePhaseSourceV594,
): void {
  const julianDate = phaseSource.getJulianDate();
  shader.uniforms.uRotationPhase.value = resolveStellarPortraitRotationPhaseV596(
    contract,
    julianDate,
  );
  shader.uniforms.uEvolutionPhase.value = resolveStellarPortraitEvolutionPhaseV596(
    contract,
    julianDate,
  );
}

export default function StellarPortraitMaterialV596({
  portrait,
  renderContract,
  phaseSource,
}: Readonly<{
  portrait: StellarPortraitProfileV596;
  renderContract: StellarPortraitRenderContractV596;
  phaseSource: StellarAbsolutePhaseSourceV594;
}>) {
  const shader = useMemo(() => {
    const uniforms = createStellarSurfaceUniformsV596(portrait, renderContract);
    assertStellarShaderUniformParityV596(
      [STELLAR_SURFACE_VERTEX_SHADER_V596, STELLAR_SURFACE_FRAGMENT_SHADER_V596],
      uniforms,
    );
    const next = new THREE.ShaderMaterial({
      vertexShader: STELLAR_SURFACE_VERTEX_SHADER_V596,
      fragmentShader: STELLAR_SURFACE_FRAGMENT_SHADER_V596,
      uniforms,
      transparent: false,
      depthWrite: true,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    Object.assign(next.userData, contractUserDataV596(renderContract, "surface"));
    return next;
  }, [portrait, renderContract]);
  const shaderRef = useRef(shader);
  shaderRef.current = shader;
  useFrame(() => updateSurfacePhaseV596(shaderRef.current, renderContract, phaseSource));
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}

export function StellarCoronaMaterialV596({
  portrait,
  renderContract,
  phaseSource,
}: Readonly<{
  portrait: StellarPortraitProfileV596;
  renderContract: StellarPortraitRenderContractV596;
  phaseSource: StellarAbsolutePhaseSourceV594;
}>) {
  const shader = useMemo(() => {
    const uniforms = createStellarCoronaUniformsV596(portrait, renderContract);
    assertStellarShaderUniformParityV596(
      [STELLAR_CORONA_VERTEX_SHADER_V596, STELLAR_CORONA_FRAGMENT_SHADER_V596],
      uniforms,
    );
    const next = new THREE.ShaderMaterial({
      vertexShader: STELLAR_CORONA_VERTEX_SHADER_V596,
      fragmentShader: STELLAR_CORONA_FRAGMENT_SHADER_V596,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    Object.assign(next.userData, contractUserDataV596(renderContract, "corona"));
    return next;
  }, [portrait, renderContract]);
  const shaderRef = useRef(shader);
  shaderRef.current = shader;
  useFrame(() => {
    shaderRef.current.uniforms.uEvolutionPhase.value =
      resolveStellarPortraitEvolutionPhaseV596(
        renderContract,
        phaseSource.getJulianDate(),
      );
  });
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}

export function StellarHaloMaterialV596({
  portrait,
  renderContract,
}: Readonly<{
  portrait: StellarPortraitProfileV596;
  renderContract: StellarPortraitRenderContractV596;
}>) {
  const shader = useMemo(() => {
    const uniforms = createStellarHaloUniformsV596(portrait, renderContract);
    assertStellarShaderUniformParityV596(
      [STELLAR_HALO_VERTEX_SHADER_V596, STELLAR_HALO_FRAGMENT_SHADER_V596],
      uniforms,
    );
    const next = new THREE.ShaderMaterial({
      vertexShader: STELLAR_HALO_VERTEX_SHADER_V596,
      fragmentShader: STELLAR_HALO_FRAGMENT_SHADER_V596,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    Object.assign(next.userData, contractUserDataV596(renderContract, "halo"));
    return next;
  }, [portrait, renderContract]);
  useEffect(() => () => shader.dispose(), [shader]);
  return <primitive object={shader} attach="material" />;
}
