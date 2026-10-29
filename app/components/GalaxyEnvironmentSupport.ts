import type { MutableRefObject } from "react";
import * as THREE from "three";
import { atlasAssetCandidates } from "../lib/atlasAssetResolver";
import type { AtlasVisualPresentationGroupsV274 } from "../lib/atlasVisualProfileV274";
import type {
  OrbitAtlasRenderBudget,
  OrbitAtlasSkyLayerManifest,
  SolarPresentationMode,
} from "../lib/orbitAtlasPresentation";
import type {
  AtlasBackgroundDepthProfile,
  AtlasCinematicBackgroundNoiseProfile,
  AtlasCinematicCameraProfile,
  AtlasReferenceGradeSkyLayerProfile,
  AtlasReferenceGradeStarfieldProfile,
  AtlasReferenceGradeSubjectMatteProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasBackgroundArtGradeProfile,
  AtlasGlobalColorGradeProfile,
  AtlasCinematicBackdropNebulaProfile,
  AtlasCinematicBackdropNegativeSpaceProfile,
  AtlasCinematicBackdropStarfieldProfile,
  AtlasSparseDeepSpaceMilkyWayProfile,
  AtlasSparseDeepSpaceNebulaProfile,
  AtlasSparseDeepSpaceNegativeSpaceProfile,
  AtlasSparseDeepSpaceStarfieldProfile,
} from "../lib/simulationDiagnosticsTypes";
import type { AtlasReferenceGradeSubjectState } from "./UniverseScene";

export function applyAtlasSkyToneTokensV316(
  material: THREE.ShaderMaterial,
  sky: AtlasVisualPresentationGroupsV274["sky"],
): void {
  material.uniforms.uExposure.value *= sky.backgroundExposure;
  material.uniforms.uDarkfieldStrength.value = THREE.MathUtils.clamp(material.uniforms.uDarkfieldStrength.value + sky.blackLevel, 0, 1);
  material.uniforms.uExposureRolloff.value *= sky.highlightShoulder;
}

export type GalaxyEnvironmentSphereProps = {
  onTextureState?: (loaded: boolean) => void;
  visible?: boolean;
  presentationMode?: SolarPresentationMode;
  renderBudget?: OrbitAtlasRenderBudget;
  closeupActive?: boolean;
  skyCloseupProfile?: string;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  cinematicBackgroundNoiseProfile?: AtlasCinematicBackgroundNoiseProfile;
  backgroundDepthProfile?: AtlasBackgroundDepthProfile;
  referenceGradeSkyLayerProfile?: AtlasReferenceGradeSkyLayerProfile;
  referenceGradeStarfieldProfile?: AtlasReferenceGradeStarfieldProfile;
  referenceGradeSubjectMatteProfile?: AtlasReferenceGradeSubjectMatteProfile;
  backgroundArtGradeProfile?: AtlasBackgroundArtGradeProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  cinematicBackdropStarfieldProfile?: AtlasCinematicBackdropStarfieldProfile;
  cinematicBackdropNebulaProfile?: AtlasCinematicBackdropNebulaProfile;
  cinematicBackdropNegativeSpaceProfile?: AtlasCinematicBackdropNegativeSpaceProfile;
  sparseDeepSpaceStarfieldProfile?: AtlasSparseDeepSpaceStarfieldProfile;
  sparseDeepSpaceMilkyWayProfile?: AtlasSparseDeepSpaceMilkyWayProfile;
  sparseDeepSpaceNebulaProfile?: AtlasSparseDeepSpaceNebulaProfile;
  sparseDeepSpaceNegativeSpaceProfile?: AtlasSparseDeepSpaceNegativeSpaceProfile;
  subjectMatteRef?: MutableRefObject<AtlasReferenceGradeSubjectState>;
  layerManifest?: OrbitAtlasSkyLayerManifest;
};

export const SKY_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SKY_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uDustMap;
uniform sampler2D uNegativeSpaceMap;
uniform sampler2D uNebulaHazeMap;
uniform float uHasDust;
uniform float uHasNegativeSpaceMap;
uniform float uHasNebulaHazeMap;
uniform float uOrbitAtlas;
uniform float uCinematicBackdrop;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uNoiseSuppression;
uniform float uMilkyWayRestraint;
uniform float uReferenceDepth;
uniform float uNegativeSpace;
uniform float uSubjectMatteActive;
uniform vec2 uSubjectCenter;
uniform float uSubjectRadius;
uniform float uSubjectMatteStrength;
uniform float uCleanCloseup;
uniform vec2 uViewport;
uniform float uTime;
uniform vec2 uParallaxOffset;
uniform float uParallaxStrength;
uniform float uExposureRolloff;
uniform float uVignetteStrength;
uniform float uDarkfieldStrength;
uniform float uPeripheralGuard;
varying vec2 vUv;

void main() {
  vec2 baseUv = vec2(fract(vUv.x + uParallaxOffset.x * 0.42), clamp(vUv.y + uParallaxOffset.y * 0.28, 0.001, 0.999));
  vec2 dustUv = vec2(fract(vUv.x + uParallaxOffset.x * 1.12 + sin(uTime * 0.018 + vUv.y * 6.28318) * 0.0012 * uParallaxStrength), clamp(vUv.y + uParallaxOffset.y * 0.72, 0.001, 0.999));
  vec2 hazeUv = vec2(fract(vUv.x + uParallaxOffset.x * 0.78 - uTime * 0.0008 * uParallaxStrength), clamp(vUv.y + uParallaxOffset.y * 0.46, 0.001, 0.999));
  vec3 tex = texture2D(uMap, baseUv).rgb;
  float dust = mix(0.0, texture2D(uDustMap, dustUv).r, uHasDust);
  float sourceLum = dot(tex, vec3(0.299, 0.587, 0.114));
  float whiteNoise = smoothstep(0.22, 0.72, sourceLum);
  float faintNoise = smoothstep(0.07, 0.26, sourceLum) * (1.0 - smoothstep(0.32, 0.58, dust));
  float milkyWayStructure = smoothstep(0.12, 0.68, dust);
  float localNegativeSpace = mix(0.0, texture2D(uNegativeSpaceMap, dustUv).r, uHasNegativeSpaceMap);
  float nebulaHaze = mix(0.0, texture2D(uNebulaHazeMap, hazeUv).r, uHasNebulaHazeMap);
  vec3 color = tex * uExposure;
  color *= 1.0 - whiteNoise * uNoiseSuppression * 0.38;
  color *= 1.0 - faintNoise * uReferenceDepth * 0.44;
  color *= 1.0 - dust * (0.32 + uMilkyWayRestraint * 0.18 + uReferenceDepth * 0.16) * uOrbitAtlas;
  color *= 1.0 - dust * uCinematicBackdrop * 0.1;
  color *= 1.0 - whiteNoise * uCinematicBackdrop * 0.16;
  color *= 1.0 - localNegativeSpace * (0.16 + uReferenceDepth * 0.18);
  color *= 1.0 - uNegativeSpace * (0.1 + faintNoise * 0.26);
  vec2 normalizedFrag = gl_FragCoord.xy / vec2(max(1.0, uViewport.x), max(1.0, uViewport.y));
  normalizedFrag.y = 1.0 - normalizedFrag.y;
  vec2 centeredFrag = normalizedFrag - vec2(0.5);
  float vignette = smoothstep(0.1, 0.82, length(centeredFrag));
  float leftWallGuard = smoothstep(0.52, 0.02, normalizedFrag.x) * clamp(uVignetteStrength + uDarkfieldStrength * 2.4, 0.0, 0.95) * uPeripheralGuard;
  color *= 1.0 - vignette * uVignetteStrength * 0.42;
  color *= 1.0 - leftWallGuard * (0.92 + whiteNoise * 0.6 + dust * 0.38);
  color *= 1.0 - smoothstep(0.18, 0.74, sourceLum) * uExposureRolloff * (0.18 + dust * 0.2);
  color += vec3(0.0075, 0.0082, 0.0096) * uDarkfieldStrength * (1.0 - smoothstep(0.18, 0.92, sourceLum)) * (1.0 - localNegativeSpace * 0.42);
  float subjectDist = distance(normalizedFrag, uSubjectCenter);
  float subjectMask = (1.0 - smoothstep(uSubjectRadius * 1.05, uSubjectRadius * 2.45, subjectDist)) * uSubjectMatteActive;
  color *= 1.0 - subjectMask * uSubjectMatteStrength * (0.2 + whiteNoise * 0.46 + faintNoise * 0.36);
  color += nebulaHaze * vec3(0.0018, 0.003, 0.0058) * uCinematicBackdrop * (1.0 - subjectMask * 0.72) * (1.0 - localNegativeSpace * 0.55);
  float cleanLum = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 cleanNeutral = vec3(cleanLum) * vec3(0.66, 0.72, 0.82);
  color = mix(color, cleanNeutral, uCleanCloseup * 0.92);
  color *= mix(1.0, 0.24, uCleanCloseup);
  color *= 1.0 - subjectMask * uCleanCloseup * 0.48;
  color += vec3(0.0042, 0.0052, 0.0072) * uCleanCloseup * (1.0 - subjectMask * 0.68);
  color = max((color - vec3(0.035)) * uContrast + vec3(0.035), vec3(0.0));
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);
  color *= mix(vec3(1.0), vec3(0.72, 0.79, 0.92), max(uOrbitAtlas, uMilkyWayRestraint * 0.65));
  color *= mix(vec3(1.0), vec3(0.82, 0.88, 1.0), milkyWayStructure * max(uOrbitAtlas, uMilkyWayRestraint * 0.72));
  color += vec3(0.0015, 0.0022, 0.0036) * uReferenceDepth * (1.0 - smoothstep(0.18, 0.82, sourceLum));
  color = color / (vec3(1.0) + color * mix(0.45, 0.42, uOrbitAtlas));
  color = pow(max(color, vec3(0.0)), vec3(mix(0.94, 0.9, uOrbitAtlas)));
  color += vec3(0.008, 0.009, 0.011) * uDarkfieldStrength * (1.0 - subjectMask * 0.62);
  gl_FragColor = vec4(color, 1.0);
}
`;

export const STAR_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uThreshold;
uniform float uFaintScale;
uniform float uColorRestraint;
uniform float uCinematicBackdrop;
uniform float uSubjectMatteActive;
uniform vec2 uSubjectCenter;
uniform float uSubjectRadius;
uniform float uSubjectMatteStrength;
uniform vec2 uViewport;
uniform float uTime;
uniform float uTwinkleStrength;
varying vec2 vUv;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 tex = texture2D(uMap, vUv).rgb;
  float lum = dot(tex, vec3(0.299, 0.587, 0.114));
  float brightCore = smoothstep(uThreshold, 1.0, lum);
  float faintField = smoothstep(0.12, uThreshold, lum) * (1.0 - brightCore) * uFaintScale;
  vec2 normalizedFrag = gl_FragCoord.xy / vec2(max(1.0, uViewport.x), max(1.0, uViewport.y));
  normalizedFrag.y = 1.0 - normalizedFrag.y;
  float subjectDist = distance(normalizedFrag, uSubjectCenter);
  float subjectMask = (1.0 - smoothstep(uSubjectRadius * 1.05, uSubjectRadius * 2.55, subjectDist)) * uSubjectMatteActive;
  float twinkleSeed = hash12(floor(vUv * vec2(1024.0, 512.0)));
  float twinkle = 1.0 + (sin(uTime * (0.38 + twinkleSeed * 0.42) + twinkleSeed * 6.28318) * 0.5 + 0.5 - 0.5) * uTwinkleStrength;
  float alpha = (brightCore + faintField * mix(1.0, 0.58, uCinematicBackdrop)) * uOpacity * twinkle * (1.0 - subjectMask * uSubjectMatteStrength * mix(0.78, 0.92, uCinematicBackdrop));
  vec3 starColor = mix(vec3(lum), tex, uColorRestraint);
  starColor = mix(vec3(0.64, 0.74, 0.9), starColor, brightCore);
  gl_FragColor = vec4(starColor, alpha);
}
`;

export function configureSkyTexture(texture: THREE.Texture, gl: THREE.WebGLRenderer): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.UVMapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
}

export function loadFirstAvailable(
  loader: THREE.TextureLoader,
  urls: readonly string[],
  onLoad: (texture: THREE.Texture) => void,
  onExhausted?: () => void,
): void {
  const candidates = Array.from(new Set(urls.flatMap((url) => atlasAssetCandidates(url))));
  const loadAt = (index: number) => {
    const url = candidates[index];
    if (!url) {
      onExhausted?.();
      return;
    }
    loader.load(url, onLoad, undefined, () => loadAt(index + 1));
  };
  loadAt(0);
}
