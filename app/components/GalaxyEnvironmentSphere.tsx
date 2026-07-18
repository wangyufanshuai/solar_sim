"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { skyEquirectCandidateUrls } from "../lib/skyEquirectUrl";
import { atlasAssetCandidates } from "../lib/atlasAssetResolver";
import {
  ORBIT_ATLAS_SKY,
  type OrbitAtlasRenderBudget,
  type OrbitAtlasSkyLayerManifest,
  type SolarPresentationMode,
} from "../lib/orbitAtlasPresentation";
import { createLegacyV9SkyUniformProfile } from "../lib/legacyV9SkyProfile";
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

type GalaxyEnvironmentSphereProps = {
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

const SKY_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = /* glsl */ `
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

const STAR_FRAGMENT = /* glsl */ `
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

function configureSkyTexture(texture: THREE.Texture, gl: THREE.WebGLRenderer): void {
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

function loadFirstAvailable(
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

export default function GalaxyEnvironmentSphere({
  onTextureState,
  visible = true,
  presentationMode = "sandbox",
  renderBudget = "balanced",
  closeupActive = false,
  skyCloseupProfile = "overview-layered-deep-space",
  selectedBodyLightingProfile = "overview",
  cinematicCameraProfile = "overview-atlas",
  cinematicBackgroundNoiseProfile = "atlas-balanced-low-noise",
  backgroundDepthProfile = "overview-sparse-layered-milky-way",
  referenceGradeSkyLayerProfile = "v48-local-generated-layered-sky",
  referenceGradeStarfieldProfile = "sparse-primary-stars",
  referenceGradeSubjectMatteProfile = "overview-no-subject-matte",
  backgroundArtGradeProfile = "overview-balanced-starfield",
  globalColorGradeProfile = "overview-neutral-grade",
  cinematicBackdropStarfieldProfile = "sparse-primary-stars-faint-distant-field",
  cinematicBackdropNebulaProfile = "soft-local-nebula-haze-layer",
  cinematicBackdropNegativeSpaceProfile = "layered-milky-way-negative-space",
  sparseDeepSpaceStarfieldProfile = "sparse-primary-stars-ultrafaint-distant-field",
  sparseDeepSpaceMilkyWayProfile = "deep-cold-gray-blue-dark-lanes",
  sparseDeepSpaceNebulaProfile = "barely-visible-local-haze",
  sparseDeepSpaceNegativeSpaceProfile = "overview-wide-negative-space",
  subjectMatteRef,
  layerManifest = ORBIT_ATLAS_SKY,
}: GalaxyEnvironmentSphereProps) {
  const [baseTexture, setBaseTexture] = useState<THREE.Texture | null>(null);
  const [starsTexture, setStarsTexture] = useState<THREE.Texture | null>(null);
  const [distantStarsTexture, setDistantStarsTexture] = useState<THREE.Texture | null>(null);
  const rootRef = useRef<THREE.Group>(null);
  const localCameraPosRef = useRef(new THREE.Vector3());
  const viewDirRef = useRef(new THREE.Vector3());
  const onTextureStateRef = useRef(onTextureState);
  const { camera, gl, size } = useThree();
  const orbitAtlas = presentationMode === "orbit-atlas";
  const mobile = size.width < 768;
  const cinematicCloseup = selectedBodyLightingProfile !== "overview";
  const solarCloseup = selectedBodyLightingProfile === "solar-closeup";
  const gasGiantCloseup = selectedBodyLightingProfile === "gas-giant-closeup";
  const selectedBodyCinematic = cinematicCameraProfile === "selected-body-cinematic";
  const showcaseDeepSpace = cinematicCameraProfile === "showcase-deep-space";
  const dimCloseupSky =
    closeupActive ||
    cinematicCloseup ||
    skyCloseupProfile === "closeup-deep-space-dimmed" ||
    skyCloseupProfile === "deep-space-filmic-dim";

  onTextureStateRef.current = onTextureState;

  const baseMaterial = useMemo(
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
          uDustMap: { value: null as THREE.Texture | null },
          uNegativeSpaceMap: { value: null as THREE.Texture | null },
          uNebulaHazeMap: { value: null as THREE.Texture | null },
          uHasDust: { value: 0 },
          uHasNegativeSpaceMap: { value: 0 },
          uHasNebulaHazeMap: { value: 0 },
          uOrbitAtlas: { value: 0 },
          uCinematicBackdrop: { value: 0 },
          uExposure: { value: 1 },
          uContrast: { value: 1 },
          uSaturation: { value: 1 },
          uNoiseSuppression: { value: 0.28 },
          uMilkyWayRestraint: { value: 0.25 },
          uReferenceDepth: { value: 0.35 },
          uNegativeSpace: { value: 0 },
          uSubjectMatteActive: { value: 0 },
          uSubjectCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uSubjectRadius: { value: 0 },
          uSubjectMatteStrength: { value: 0 },
          uCleanCloseup: { value: 0 },
          uViewport: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uParallaxOffset: { value: new THREE.Vector2(0, 0) },
          uParallaxStrength: { value: 0 },
          uExposureRolloff: { value: 0 },
          uVignetteStrength: { value: 0 },
          uDarkfieldStrength: { value: 0 },
          uPeripheralGuard: { value: 1 },
        },
      }),
    [],
  );

  const starsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        side: THREE.BackSide,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMap: { value: null as THREE.Texture | null },
          uOpacity: { value: 0.03 },
          uThreshold: { value: 0.58 },
          uFaintScale: { value: 0.12 },
          uColorRestraint: { value: 0.42 },
          uCinematicBackdrop: { value: 0 },
          uSubjectMatteActive: { value: 0 },
          uSubjectCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uSubjectRadius: { value: 0 },
          uSubjectMatteStrength: { value: 0 },
          uViewport: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uTwinkleStrength: { value: 0 },
        },
      }),
    [],
  );

  const distantStarsMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        side: THREE.BackSide,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMap: { value: null as THREE.Texture | null },
          uOpacity: { value: 0.006 },
          uThreshold: { value: 0.72 },
          uFaintScale: { value: 0.008 },
          uColorRestraint: { value: 0.16 },
          uCinematicBackdrop: { value: 0 },
          uSubjectMatteActive: { value: 0 },
          uSubjectCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uSubjectRadius: { value: 0 },
          uSubjectMatteStrength: { value: 0 },
          uViewport: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uTwinkleStrength: { value: 0 },
        },
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];
    const fallback = skyEquirectCandidateUrls();
    const manifestDrivenBackdrop = layerManifest.desktopBase.includes("/orbit-atlas-");
    const baseLayerUrl = mobile ? layerManifest.mobileBase : layerManifest.desktopBase;
    const baseCandidates = manifestDrivenBackdrop
      ? [baseLayerUrl, ...fallback]
      : [...fallback];

    loadFirstAvailable(
      loader,
      baseCandidates,
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        configureSkyTexture(texture, gl);
        loaded.push(texture);
        baseMaterial.uniforms.uMap.value = texture;
        setBaseTexture(texture);
        onTextureStateRef.current?.(true);

        if (orbitAtlas && !mobile && baseLayerUrl === layerManifest.mobileBase && layerManifest.desktopBase !== layerManifest.mobileBase) {
          loadFirstAvailable(loader, [layerManifest.desktopBase], (qualityTexture) => {
            if (cancelled) {
              qualityTexture.dispose();
              return;
            }
            configureSkyTexture(qualityTexture, gl);
            loaded.push(qualityTexture);
            baseMaterial.uniforms.uMap.value = qualityTexture;
            setBaseTexture(qualityTexture);
          });
        }
      },
      () => {
        if (!cancelled) onTextureStateRef.current?.(false);
      },
    );

    if (manifestDrivenBackdrop) {
      loadFirstAvailable(
        loader,
        [mobile ? layerManifest.mobileStars : layerManifest.desktopStars],
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          configureSkyTexture(texture, gl);
          loaded.push(texture);
          starsMaterial.uniforms.uMap.value = texture;
          starsMaterial.needsUpdate = true;
          setStarsTexture(texture);
        },
      );
      const loadOptionalDeepLayers = renderBudget === "dense";
      const distantStarsUrl = loadOptionalDeepLayers
        ? mobile ? layerManifest.mobileDistantStars : layerManifest.desktopDistantStars
        : undefined;
      if (distantStarsUrl) {
        loadFirstAvailable(
          loader,
          [distantStarsUrl],
          (texture) => {
            if (cancelled) {
              texture.dispose();
              return;
            }
            configureSkyTexture(texture, gl);
            loaded.push(texture);
            distantStarsMaterial.uniforms.uMap.value = texture;
            distantStarsMaterial.needsUpdate = true;
            setDistantStarsTexture(texture);
          },
        );
      }
      loadFirstAvailable(loader, [layerManifest.dustMask], (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        configureSkyTexture(texture, gl);
        loaded.push(texture);
        baseMaterial.uniforms.uDustMap.value = texture;
        baseMaterial.uniforms.uHasDust.value = 1;
      });
      if (layerManifest.negativeSpaceMask) {
        loadFirstAvailable(loader, [layerManifest.negativeSpaceMask], (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          configureSkyTexture(texture, gl);
          loaded.push(texture);
          baseMaterial.uniforms.uNegativeSpaceMap.value = texture;
          baseMaterial.uniforms.uHasNegativeSpaceMap.value = 1;
        });
      }
      if (layerManifest.nebulaHazeMask && loadOptionalDeepLayers) {
        loadFirstAvailable(loader, [layerManifest.nebulaHazeMask], (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          configureSkyTexture(texture, gl);
          loaded.push(texture);
          baseMaterial.uniforms.uNebulaHazeMap.value = texture;
          baseMaterial.uniforms.uHasNebulaHazeMap.value = 1;
        });
      }
    }

    return () => {
      cancelled = true;
      baseMaterial.uniforms.uMap.value = null;
      baseMaterial.uniforms.uDustMap.value = null;
      baseMaterial.uniforms.uNegativeSpaceMap.value = null;
      baseMaterial.uniforms.uNebulaHazeMap.value = null;
      baseMaterial.uniforms.uHasDust.value = 0;
      baseMaterial.uniforms.uHasNegativeSpaceMap.value = 0;
      baseMaterial.uniforms.uHasNebulaHazeMap.value = 0;
      starsMaterial.uniforms.uMap.value = null;
      distantStarsMaterial.uniforms.uMap.value = null;
      for (const texture of loaded) texture.dispose();
      setBaseTexture(null);
      setStarsTexture(null);
      setDistantStarsTexture(null);
    };
  }, [
    baseMaterial,
    distantStarsMaterial,
    gl,
    layerManifest.desktopBase,
    layerManifest.desktopDistantStars,
    layerManifest.desktopStars,
    layerManifest.dustMask,
    layerManifest.mobileBase,
    layerManifest.mobileDistantStars,
    layerManifest.mobileStars,
    layerManifest.negativeSpaceMask,
    layerManifest.nebulaHazeMask,
    mobile,
    orbitAtlas,
    renderBudget,
    starsMaterial,
  ]);

  useEffect(() => {
    const referenceDepth =
      backgroundDepthProfile === "closeup-subject-negative-space"
        ? 0.94
        : backgroundDepthProfile === "showcase-reference-depth"
          ? 0.64
          : 0.54;
    const negativeSpace =
      backgroundDepthProfile === "closeup-subject-negative-space"
        ? 0.94
        : backgroundDepthProfile === "showcase-reference-depth"
          ? 0.42
          : 0.22;
    const generatedSky = referenceGradeSkyLayerProfile === "v48-local-generated-layered-sky";
    const closeupSky = referenceGradeSkyLayerProfile === "v48-local-closeup-negative-space";
    const showcaseSky = referenceGradeSkyLayerProfile === "v48-local-showcase-milky-way";
    const closeupStarfield = referenceGradeStarfieldProfile === "closeup-star-noise-suppressed";
    const showcaseStarfield = referenceGradeStarfieldProfile === "showcase-structured-starfield";
    const v55ColorGrade = globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
    const v55BackgroundArt =
      backgroundArtGradeProfile !== "overview-balanced-starfield";
    const v55CloseupMatte =
      backgroundArtGradeProfile === "closeup-subject-star-noise-matte";
    const v55NegativeSpace =
      backgroundArtGradeProfile === "sparse-negative-space-milky-way-depth" ||
      v55CloseupMatte;
    const v56Backdrop = layerManifest.nebulaHazeMask?.includes("v56") ?? false;
    const v56CloseupStarfield =
      cinematicBackdropStarfieldProfile === "closeup-subject-star-noise-suppressed";
    const v56NebulaRestrained =
      cinematicBackdropNebulaProfile === "closeup-nebula-haze-restrained";
    const v56CleanBackdrop =
      cinematicBackdropNegativeSpaceProfile === "selected-body-clean-dark-backdrop";
    const v57Backdrop = layerManifest.desktopBase.includes("v57");
    const v59Backdrop = layerManifest.desktopBase.includes("v59");
    const v60Backdrop = layerManifest.desktopBase.includes("v60");
    const v61Backdrop = layerManifest.desktopBase.includes("v61");
    const v62Backdrop = layerManifest.desktopBase.includes("v=62") || layerManifest.desktopBase.includes("v62");
    const v63Backdrop = layerManifest.desktopBase.includes("v63-final");
    const v64Backdrop = layerManifest.desktopBase.includes("v64-cinematic");
    const v65Backdrop = layerManifest.desktopBase.includes("v65-lock");
    const v66Backdrop = layerManifest.desktopBase.includes("v66-milky-way-depth");
    const v67Backdrop = layerManifest.desktopBase.includes("v67-galactic-depth");
    const v68Backdrop = layerManifest.desktopBase.includes("v68-reference-backdrop");
    const legacyV9Backdrop = layerManifest.desktopBase.includes("v9-base");
    const finalBackdrop = v62Backdrop || v63Backdrop || v64Backdrop || v65Backdrop || v66Backdrop || v67Backdrop || v68Backdrop;
    const referenceBackdropMode = orbitAtlas || v68Backdrop || legacyV9Backdrop;
    const v57CloseupStarfield =
      sparseDeepSpaceStarfieldProfile === "closeup-primary-stars-subject-matte";
    const v57NebulaRestrained =
      sparseDeepSpaceNebulaProfile === "closeup-haze-nearly-suppressed";
    const v57CleanBackdrop =
      sparseDeepSpaceNegativeSpaceProfile === "selected-body-clean-negative-space";
    const v57DarkLanes =
      sparseDeepSpaceMilkyWayProfile === "deep-cold-gray-blue-dark-lanes" ||
      sparseDeepSpaceMilkyWayProfile === "closeup-dark-lane-negative-space";
    const layeredBackdrop = v56Backdrop || v57Backdrop || v59Backdrop || v60Backdrop || v61Backdrop || finalBackdrop;
    const cleanBackdrop = v57CleanBackdrop || v56CleanBackdrop;
    const solarCleanBackdrop = solarCloseup && selectedBodyCinematic && cleanBackdrop;
    const closeupStarfieldDirector = v57CloseupStarfield || v56CloseupStarfield;
    baseMaterial.uniforms.uOrbitAtlas.value = referenceBackdropMode ? 1 : 0;
    baseMaterial.uniforms.uCinematicBackdrop.value = finalBackdrop ? (v68Backdrop ? 0.1 : v67Backdrop ? 0.16 : v66Backdrop ? 0.12 : v65Backdrop ? 0.18 : v64Backdrop ? 0.24 : v63Backdrop ? 0.34 : 0.46) : v61Backdrop ? 0.38 : v60Backdrop ? 0.64 : v59Backdrop ? 0.82 : v57Backdrop ? v57NebulaRestrained ? 0.96 : 1.1 : v56Backdrop ? v56NebulaRestrained ? 0.78 : 1 : 0;
    baseMaterial.uniforms.uCleanCloseup.value = solarCloseup && (v67Backdrop || v68Backdrop)
      ? v68Backdrop ? 0.88 : 1
      : selectedBodyCinematic
        ? solarCloseup ? finalBackdrop ? (v68Backdrop ? 0.16 : v65Backdrop ? 0.1 : v64Backdrop ? 0.12 : 0.18) : v61Backdrop ? 0.38 : v60Backdrop ? 0.62 : 1 : finalBackdrop ? (v68Backdrop ? 0.07 : v67Backdrop ? 0.085 : v65Backdrop ? 0.06 : v64Backdrop ? 0.075 : 0.1) : v61Backdrop ? 0.18 : v60Backdrop ? 0.34 : v59Backdrop ? 0.72 : 0.52
        : 0;
    baseMaterial.uniforms.uParallaxStrength.value = finalBackdrop ? (selectedBodyCinematic ? (v68Backdrop ? 0.38 : v67Backdrop ? 0.42 : v65Backdrop ? 0.36 : v64Backdrop ? 0.42 : 0.38) : (v68Backdrop ? 0.66 : v67Backdrop ? 0.62 : v65Backdrop ? 0.52 : v64Backdrop ? 0.66 : 0.58)) : 0;
    baseMaterial.uniforms.uExposureRolloff.value = finalBackdrop ? (selectedBodyCinematic ? (v68Backdrop ? 0.34 : v67Backdrop ? 0.32 : v65Backdrop ? 0.28 : v64Backdrop ? 0.34 : 0.42) : (v68Backdrop ? 0.16 : v67Backdrop ? 0.2 : v65Backdrop ? 0.18 : v64Backdrop ? 0.22 : 0.26)) : 0;
    baseMaterial.uniforms.uVignetteStrength.value = finalBackdrop ? (solarCloseup && v68Backdrop ? 0.38 : solarCloseup && v67Backdrop ? 0.44 : selectedBodyCinematic ? (v68Backdrop ? 0.18 : v67Backdrop ? 0.22 : v66Backdrop ? 0.26 : v65Backdrop ? 0.34 : 0.4) : (v68Backdrop ? 0.08 : v67Backdrop ? 0.08 : v66Backdrop ? 0.12 : v65Backdrop ? 0.2 : 0.26)) : 0;
    baseMaterial.uniforms.uDarkfieldStrength.value = finalBackdrop ? (solarCloseup && v68Backdrop ? 0.56 : solarCloseup && v67Backdrop ? 0.62 : selectedBodyCinematic ? (solarCloseup ? 0.2 : v68Backdrop ? 0.16 : v67Backdrop ? 0.18 : v66Backdrop ? 0.2 : 0.24) : (v68Backdrop ? 0.16 : v67Backdrop ? 0.12 : v66Backdrop ? 0.18 : v65Backdrop ? 0.3 : 0.24)) : 0;
    baseMaterial.uniforms.uPeripheralGuard.value = v68Backdrop ? (selectedBodyCinematic ? 0.42 : 0.08) : v67Backdrop ? (selectedBodyCinematic ? 0.52 : 0.22) : v66Backdrop ? (selectedBodyCinematic ? 0.58 : 0.32) : 1;
    starsMaterial.uniforms.uCinematicBackdrop.value = layeredBackdrop ? 1 : 0;
    distantStarsMaterial.uniforms.uCinematicBackdrop.value = finalBackdrop || v57Backdrop ? 1 : 0;
    baseMaterial.uniforms.uNoiseSuppression.value =
      solarCleanBackdrop
        ? 1
        : cleanBackdrop
        ? v57CleanBackdrop ? 0.996 : 0.986
        : v55CloseupMatte
        ? 0.965
        : closeupStarfieldDirector || closeupStarfield || cinematicBackgroundNoiseProfile === "closeup-low-noise"
          ? v57Backdrop ? 0.965 : v55BackgroundArt ? 0.94 : 0.92
        : cinematicBackgroundNoiseProfile === "showcase-structured-low-noise"
          ? v55BackgroundArt ? 0.72 : 0.62
        : generatedSky ? finalBackdrop ? (v68Backdrop ? 0.18 : v67Backdrop ? 0.26 : v65Backdrop ? 0.2 : 0.28) : v61Backdrop ? 0.32 : v60Backdrop ? 0.62 : v59Backdrop ? 0.88 : v57Backdrop ? 0.8 : v56Backdrop ? 0.72 : v55BackgroundArt ? 0.64 : 0.5 : v55BackgroundArt ? 0.58 : 0.42;
    baseMaterial.uniforms.uMilkyWayRestraint.value = solarCleanBackdrop
      ? 1
      : v55CloseupMatte
      ? cleanBackdrop ? v57CleanBackdrop ? 1 : 0.99 : 0.975
      : selectedBodyCinematic
        ? v57Backdrop ? 0.985 : v55BackgroundArt ? 0.96 : 0.94
        : showcaseDeepSpace
          ? v57Backdrop ? 0.84 : v56Backdrop ? 0.76 : v55BackgroundArt ? 0.68 : 0.6
          : finalBackdrop ? (v68Backdrop ? 0.16 : v67Backdrop ? 0.28 : v65Backdrop ? 0.44 : 0.52) : v61Backdrop ? 0.58 : v60Backdrop ? 0.62 : v59Backdrop ? 0.9 : v57DarkLanes ? 0.78 : v56Backdrop ? 0.66 : v55BackgroundArt ? 0.58 : 0.48;
    baseMaterial.uniforms.uReferenceDepth.value = solarCleanBackdrop
      ? 1
      : v55CloseupMatte
      ? Math.max(referenceDepth, cleanBackdrop ? v57CleanBackdrop ? 1 : 0.995 : 0.98)
      : closeupSky
        ? Math.max(referenceDepth, 0.96)
        : showcaseSky
          ? Math.max(referenceDepth, 0.66)
          : finalBackdrop ? Math.max(referenceDepth, selectedBodyCinematic ? (v68Backdrop ? 0.42 : v67Backdrop ? 0.44 : v65Backdrop ? 0.44 : 0.5) : (v68Backdrop ? 0.34 : v67Backdrop ? 0.38 : v65Backdrop ? 0.42 : 0.48)) : v61Backdrop ? Math.max(referenceDepth, 0.52) : v60Backdrop ? Math.max(referenceDepth, 0.62) : v59Backdrop ? Math.max(referenceDepth, 0.86) : v57Backdrop ? Math.max(referenceDepth, 0.78) : v56Backdrop ? Math.max(referenceDepth, 0.7) : v55BackgroundArt ? Math.max(referenceDepth, 0.62) : referenceDepth;
    baseMaterial.uniforms.uNegativeSpace.value = solarCleanBackdrop
      ? 1
      : v55CloseupMatte
      ? Math.max(negativeSpace, cleanBackdrop ? v57CleanBackdrop ? 1 : 0.995 : 0.985)
      : closeupSky
        ? Math.max(negativeSpace, 0.96)
      : finalBackdrop ? Math.max(negativeSpace, selectedBodyCinematic ? (v68Backdrop ? 0.26 : v67Backdrop ? 0.26 : v65Backdrop ? 0.22 : v64Backdrop ? 0.26 : 0.3) : (v68Backdrop ? 0.18 : v67Backdrop ? 0.36 : v65Backdrop ? 0.3 : v64Backdrop ? 0.34 : 0.38)) : v61Backdrop ? Math.max(negativeSpace, selectedBodyCinematic ? 0.34 : 0.42) : v60Backdrop ? Math.max(negativeSpace, selectedBodyCinematic ? 0.48 : 0.38) : v59Backdrop ? Math.max(negativeSpace, 0.8) : v57Backdrop ? Math.max(negativeSpace, 0.68) : v56Backdrop ? Math.max(negativeSpace, 0.58) : v55NegativeSpace ? Math.max(negativeSpace, 0.42) : negativeSpace;
    baseMaterial.uniforms.uExposure.value = dimCloseupSky
      ? referenceBackdropMode
        ? solarCloseup && v68Backdrop ? 0.055 : solarCloseup && v67Backdrop ? 0.035 : selectedBodyCinematic ? finalBackdrop ? solarCloseup ? (v68Backdrop ? 0.5 : v65Backdrop ? 0.72 : v64Backdrop ? 0.6 : 0.46) : (v68Backdrop ? 0.84 : v67Backdrop ? 0.78 : v65Backdrop ? 0.86 : v64Backdrop ? 0.78 : 0.72) : v61Backdrop ? solarCloseup ? 0.42 : 0.68 : v60Backdrop ? solarCloseup ? 0.34 : 0.54 : v57CleanBackdrop ? 0.19 : v56CleanBackdrop ? 0.22 : v55BackgroundArt ? 0.255 : 0.3 : finalBackdrop ? (v68Backdrop ? 1.04 : v67Backdrop ? 0.9 : v65Backdrop ? 0.86 : v64Backdrop ? 0.74 : 0.68) : v61Backdrop ? 0.64 : v60Backdrop ? 0.48 : v57Backdrop ? 0.26 : v56Backdrop ? 0.31 : v55BackgroundArt ? 0.34 : 0.42
        : solarCloseup ? solarCleanBackdrop ? 0.035 : finalBackdrop ? (v68Backdrop ? 0.46 : v67Backdrop ? 0.5 : 0.46) : v61Backdrop ? 0.42 : v60Backdrop ? 0.32 : v57CleanBackdrop ? 0.17 : v56CleanBackdrop ? 0.19 : v55BackgroundArt ? 0.22 : 0.26 : gasGiantCloseup ? finalBackdrop ? (v68Backdrop ? 0.74 : v67Backdrop ? 0.72 : 0.7) : v61Backdrop ? 0.66 : v60Backdrop ? 0.5 : v57CleanBackdrop ? 0.19 : v56CleanBackdrop ? 0.215 : v55BackgroundArt ? 0.245 : 0.29 : finalBackdrop ? (v68Backdrop ? 0.74 : v67Backdrop ? 0.7 : 0.66) : v61Backdrop ? 0.62 : v60Backdrop ? 0.48 : v55BackgroundArt ? 0.24 : 0.28
      : showcaseDeepSpace
        ? orbitAtlas ? v57Backdrop ? 0.44 : v56Backdrop ? 0.5 : v55BackgroundArt ? 0.56 : 0.62 : v55BackgroundArt ? 0.46 : 0.5
        : referenceBackdropMode ? finalBackdrop ? (v68Backdrop ? 1.18 : v67Backdrop ? 0.92 : v66Backdrop ? 1.04 : v65Backdrop ? 0.92 : 0.82) : v61Backdrop ? 0.78 : v60Backdrop ? 0.86 : v59Backdrop ? 0.68 : v57Backdrop ? 0.48 : v56Backdrop ? 0.56 : v55BackgroundArt ? 0.62 : 0.7 : v55BackgroundArt ? 0.5 : 0.54;
    baseMaterial.uniforms.uContrast.value = dimCloseupSky
      ? referenceBackdropMode ? v57Backdrop ? 1.92 : v56Backdrop ? 1.82 : v55ColorGrade ? 1.72 : 1.62 : v55ColorGrade ? 1.52 : 1.44
      : showcaseDeepSpace ? v57Backdrop ? 1.66 : v56Backdrop ? 1.58 : v55ColorGrade ? 1.5 : 1.42 : referenceBackdropMode ? finalBackdrop ? (v68Backdrop ? 1.36 : v67Backdrop ? 1.38 : 1.16) : v61Backdrop ? 1.22 : v60Backdrop ? 1.28 : v59Backdrop ? 1.48 : v57Backdrop ? 1.66 : v56Backdrop ? 1.58 : v55ColorGrade ? 1.5 : 1.44 : v55ColorGrade ? 1.28 : 1.22;
    baseMaterial.uniforms.uSaturation.value = dimCloseupSky
      ? referenceBackdropMode ? v57Backdrop ? 0.1 : v56Backdrop ? 0.13 : v55ColorGrade ? 0.16 : 0.18 : solarCloseup ? v55ColorGrade ? 0.28 : 0.32 : v55ColorGrade ? 0.3 : 0.34
      : showcaseDeepSpace ? referenceBackdropMode ? v57Backdrop ? 0.2 : v56Backdrop ? 0.24 : v55ColorGrade ? 0.28 : 0.32 : v55ColorGrade ? 0.44 : 0.48 : referenceBackdropMode ? finalBackdrop ? (v68Backdrop ? 0.38 : v67Backdrop ? 0.3 : 0.28) : v61Backdrop ? 0.34 : v60Backdrop ? 0.2 : v59Backdrop ? 0.16 : v57Backdrop ? 0.21 : v56Backdrop ? 0.26 : v55ColorGrade ? 0.3 : 0.34 : v55ColorGrade ? 0.52 : 0.56;
    starsMaterial.uniforms.uOpacity.value = selectedBodyCinematic
      ? referenceBackdropMode ? finalBackdrop ? solarCloseup ? (v68Backdrop ? 0.014 : v67Backdrop ? 0.012 : 0.016) : (v68Backdrop ? 0.026 : v67Backdrop ? 0.024 : 0.026) : v61Backdrop ? solarCloseup ? 0.014 : 0.032 : v60Backdrop ? solarCloseup ? 0.006 : 0.014 : solarCleanBackdrop ? 0.0008 : v57CleanBackdrop ? 0.0018 : v56CleanBackdrop ? 0.0028 : v55BackgroundArt ? 0.0048 : 0.0075 : 0
      : dimCloseupSky
        ? referenceBackdropMode ? v57CloseupStarfield ? 0.0032 : v56CloseupStarfield ? 0.0048 : v55BackgroundArt ? 0.0065 : 0.012 : 0
        : showcaseDeepSpace
          ? referenceBackdropMode ? v57Backdrop ? 0.016 : v56Backdrop ? 0.022 : v55BackgroundArt ? 0.026 : 0.033 : 0
          : referenceBackdropMode ? finalBackdrop ? (v68Backdrop ? 0.014 : v67Backdrop ? 0.072 : v66Backdrop ? 0.052 : v65Backdrop ? 0.018 : v64Backdrop ? 0.035 : 0.05) : v61Backdrop ? 0.058 : v60Backdrop ? 0.052 : v57Backdrop ? 0.018 : v56Backdrop ? 0.026 : v55BackgroundArt ? 0.032 : 0.04 : 0;
    starsMaterial.uniforms.uThreshold.value = selectedBodyCinematic ? finalBackdrop ? (v68Backdrop ? 0.76 : v67Backdrop ? 0.74 : v65Backdrop ? 0.78 : v64Backdrop ? 0.72 : 0.68) : v61Backdrop ? 0.66 : v60Backdrop ? 0.74 : v57CloseupStarfield ? 0.92 : v56CloseupStarfield ? 0.89 : v55BackgroundArt ? 0.84 : 0.78 : showcaseStarfield ? v57Backdrop ? 0.82 : v56Backdrop ? 0.76 : v55BackgroundArt ? 0.72 : 0.66 : finalBackdrop ? (v68Backdrop ? 0.66 : v67Backdrop ? 0.58 : v66Backdrop ? 0.68 : v65Backdrop ? 0.74 : v64Backdrop ? 0.66 : 0.62) : v61Backdrop ? 0.58 : v60Backdrop ? 0.68 : v57Backdrop ? 0.8 : v56Backdrop ? 0.74 : v55BackgroundArt ? 0.7 : 0.64;
    starsMaterial.uniforms.uFaintScale.value = selectedBodyCinematic ? finalBackdrop ? solarCloseup ? (v68Backdrop ? 0.0022 : v67Backdrop ? 0.003 : v65Backdrop ? 0.004 : v64Backdrop ? 0.008 : 0.012) : (v68Backdrop ? 0.005 : v67Backdrop ? 0.008 : v65Backdrop ? 0.008 : v64Backdrop ? 0.016 : 0.024) : v61Backdrop ? solarCloseup ? 0.016 : 0.034 : v60Backdrop ? solarCloseup ? 0.006 : 0.018 : solarCleanBackdrop ? 0.00045 : v57CleanBackdrop ? 0.001 : v56CloseupStarfield ? 0.0018 : v55BackgroundArt ? 0.0035 : 0.008 : showcaseStarfield ? v57Backdrop ? 0.01 : v56Backdrop ? 0.018 : v55BackgroundArt ? 0.026 : 0.038 : finalBackdrop ? (v68Backdrop ? 0.0025 : v67Backdrop ? 0.0065 : v66Backdrop ? 0.012 : v65Backdrop ? 0.006 : v64Backdrop ? 0.024 : 0.036) : v61Backdrop ? 0.05 : v60Backdrop ? 0.042 : v57Backdrop ? 0.012 : v56Backdrop ? 0.024 : v55BackgroundArt ? 0.034 : 0.048;
    starsMaterial.uniforms.uColorRestraint.value = selectedBodyCinematic ? finalBackdrop ? (v68Backdrop ? 0.16 : v67Backdrop ? 0.16 : 0.2) : v61Backdrop ? 0.18 : v60Backdrop ? 0.1 : v55ColorGrade ? 0.14 : 0.18 : showcaseStarfield ? v55ColorGrade ? 0.24 : 0.28 : finalBackdrop ? (v68Backdrop ? 0.2 : v67Backdrop ? 0.22 : 0.3) : v61Backdrop ? 0.32 : v60Backdrop ? 0.2 : v55ColorGrade ? 0.26 : 0.3;
    starsMaterial.uniforms.uTwinkleStrength.value = finalBackdrop ? (v68Backdrop ? (selectedBodyCinematic ? 0.022 : 0.038) : v67Backdrop ? (selectedBodyCinematic ? 0.024 : 0.045) : (selectedBodyCinematic ? 0.035 : 0.06)) : 0;
    distantStarsMaterial.uniforms.uOpacity.value = selectedBodyCinematic
      ? orbitAtlas ? solarCleanBackdrop ? 0.0002 : v57CleanBackdrop ? 0.00075 : 0.0012 : 0
      : dimCloseupSky
        ? orbitAtlas ? v57CloseupStarfield ? 0.0012 : 0.002 : 0
        : showcaseDeepSpace
          ? orbitAtlas ? v57Backdrop ? 0.0048 : 0.006 : 0
          : orbitAtlas ? v57Backdrop ? 0.0058 : 0.007 : 0;
    distantStarsMaterial.uniforms.uThreshold.value = selectedBodyCinematic ? 0.9 : v57Backdrop ? 0.78 : 0.72;
    distantStarsMaterial.uniforms.uFaintScale.value = selectedBodyCinematic ? 0.0008 : dimCloseupSky ? 0.0016 : 0.006;
    distantStarsMaterial.uniforms.uColorRestraint.value = selectedBodyCinematic ? 0.08 : 0.14;
    distantStarsMaterial.uniforms.uTwinkleStrength.value = finalBackdrop ? 0.025 : 0;

    if (legacyV9Backdrop) {
      const legacyV9Profile = createLegacyV9SkyUniformProfile({
        selectedBodyCinematic,
        solarCloseup,
        gasGiantCloseup,
        dimCloseupSky,
        referenceDepth,
        negativeSpace,
      });
      baseMaterial.uniforms.uOrbitAtlas.value = legacyV9Profile.base.uOrbitAtlas;
      baseMaterial.uniforms.uCinematicBackdrop.value = legacyV9Profile.base.uCinematicBackdrop;
      baseMaterial.uniforms.uParallaxStrength.value = legacyV9Profile.base.uParallaxStrength;
      baseMaterial.uniforms.uExposureRolloff.value = legacyV9Profile.base.uExposureRolloff;
      baseMaterial.uniforms.uVignetteStrength.value = legacyV9Profile.base.uVignetteStrength;
      baseMaterial.uniforms.uDarkfieldStrength.value = legacyV9Profile.base.uDarkfieldStrength;
      baseMaterial.uniforms.uPeripheralGuard.value = legacyV9Profile.base.uPeripheralGuard;
      baseMaterial.uniforms.uCleanCloseup.value = legacyV9Profile.base.uCleanCloseup;
      baseMaterial.uniforms.uNoiseSuppression.value = legacyV9Profile.base.uNoiseSuppression;
      baseMaterial.uniforms.uMilkyWayRestraint.value = legacyV9Profile.base.uMilkyWayRestraint;
      baseMaterial.uniforms.uReferenceDepth.value = legacyV9Profile.base.uReferenceDepth;
      baseMaterial.uniforms.uNegativeSpace.value = legacyV9Profile.base.uNegativeSpace;
      baseMaterial.uniforms.uExposure.value = legacyV9Profile.base.uExposure;
      baseMaterial.uniforms.uContrast.value = legacyV9Profile.base.uContrast;
      baseMaterial.uniforms.uSaturation.value = legacyV9Profile.base.uSaturation;
      starsMaterial.uniforms.uOpacity.value = legacyV9Profile.stars.uOpacity;
      starsMaterial.uniforms.uThreshold.value = legacyV9Profile.stars.uThreshold;
      starsMaterial.uniforms.uFaintScale.value = legacyV9Profile.stars.uFaintScale;
      starsMaterial.uniforms.uColorRestraint.value = legacyV9Profile.stars.uColorRestraint;
      starsMaterial.uniforms.uTwinkleStrength.value = legacyV9Profile.stars.uTwinkleStrength;
    }
  }, [
    backgroundArtGradeProfile,
    backgroundDepthProfile,
    baseMaterial,
    cinematicBackgroundNoiseProfile,
    cinematicBackdropNebulaProfile,
    cinematicBackdropNegativeSpaceProfile,
    cinematicBackdropStarfieldProfile,
    distantStarsMaterial,
    dimCloseupSky,
    gasGiantCloseup,
    globalColorGradeProfile,
    layerManifest.desktopBase,
    layerManifest.nebulaHazeMask,
    orbitAtlas,
    referenceGradeSkyLayerProfile,
    referenceGradeStarfieldProfile,
    selectedBodyCinematic,
    showcaseDeepSpace,
    solarCloseup,
    sparseDeepSpaceMilkyWayProfile,
    sparseDeepSpaceNebulaProfile,
    sparseDeepSpaceNegativeSpaceProfile,
    sparseDeepSpaceStarfieldProfile,
    starsMaterial,
  ]);

  useEffect(
    () => () => {
      baseMaterial.dispose();
      starsMaterial.dispose();
      distantStarsMaterial.dispose();
    },
    [baseMaterial, distantStarsMaterial, starsMaterial],
  );

  useFrame((state) => {
    const root = rootRef.current;
    if (!root || !visible) return;
    localCameraPosRef.current.copy(camera.position);
    root.parent?.worldToLocal(localCameraPosRef.current);
    root.position.copy(localCameraPosRef.current);
    const t = state.clock.elapsedTime;
    camera.getWorldDirection(viewDirRef.current);
    const parallaxStrength = baseMaterial.uniforms.uParallaxStrength.value as number;
    const parallaxX = viewDirRef.current.x * 0.012 * parallaxStrength + Math.sin(t * 0.021) * 0.0018 * parallaxStrength;
    const parallaxY = viewDirRef.current.y * 0.008 * parallaxStrength + Math.cos(t * 0.017) * 0.0012 * parallaxStrength;
    baseMaterial.uniforms.uTime.value = t;
    baseMaterial.uniforms.uParallaxOffset.value.set(parallaxX, parallaxY);
    starsMaterial.uniforms.uTime.value = t;
    distantStarsMaterial.uniforms.uTime.value = t;

    baseMaterial.uniforms.uViewport.value.set(size.width, size.height);
    starsMaterial.uniforms.uViewport.value.set(size.width, size.height);
    distantStarsMaterial.uniforms.uViewport.value.set(size.width, size.height);

    const subject = subjectMatteRef?.current;
    const v55Matte = backgroundArtGradeProfile === "closeup-subject-star-noise-matte";
    const solarMatte = solarCloseup && selectedBodyCinematic;
    const v63Matte = layerManifest.desktopBase.includes("v63-final") || layerManifest.desktopBase.includes("v64-cinematic") || layerManifest.desktopBase.includes("v65-lock");
    const matteActive =
      subject?.active &&
      subject.inFrame &&
      (referenceGradeSubjectMatteProfile === "selected-body-background-matte" || v55Matte || (solarMatte && !v63Matte));
    const matteStrength = matteActive
      ? Math.min(1, (solarMatte ? v63Matte ? 0.14 : 0.98 : v55Matte ? 0.9 : 0.78) + subject.radius * (solarMatte ? v63Matte ? 0.08 : 0.62 : v55Matte ? 0.48 : 0.35))
      : 0;
    const subjectRadius = matteActive ? Math.max(solarMatte ? v63Matte ? 0.075 : 0.2 : v55Matte ? 0.11 : 0.09, subject.radius * (solarMatte ? v63Matte ? 0.92 : 1.72 : v55Matte ? 1.18 : 1.08)) : 0;
    const subjectCenterX = Number.isFinite(subject?.x) ? THREE.MathUtils.clamp(subject!.x, 0, 1) : 0.5;
    const subjectCenterY = Number.isFinite(subject?.y) ? THREE.MathUtils.clamp(subject!.y, 0, 1) : 0.5;

    baseMaterial.uniforms.uSubjectMatteActive.value = matteActive ? 1 : 0;
    baseMaterial.uniforms.uSubjectCenter.value.set(subjectCenterX, subjectCenterY);
    baseMaterial.uniforms.uSubjectRadius.value = subjectRadius;
    baseMaterial.uniforms.uSubjectMatteStrength.value = matteStrength;

    starsMaterial.uniforms.uSubjectMatteActive.value = matteActive ? 1 : 0;
    starsMaterial.uniforms.uSubjectCenter.value.set(subjectCenterX, subjectCenterY);
    starsMaterial.uniforms.uSubjectRadius.value = subjectRadius;
    starsMaterial.uniforms.uSubjectMatteStrength.value = matteStrength;

    distantStarsMaterial.uniforms.uSubjectMatteActive.value = matteActive ? 1 : 0;
    distantStarsMaterial.uniforms.uSubjectCenter.value.set(subjectCenterX, subjectCenterY);
    distantStarsMaterial.uniforms.uSubjectRadius.value = subjectRadius;
    distantStarsMaterial.uniforms.uSubjectMatteStrength.value = Math.min(1, matteStrength + 0.08);
  }, -1000);

  if (!visible || !baseTexture) return null;

  const useManifestBackdropRotation = layerManifest.desktopBase.includes("/orbit-atlas-");
  const rotation = useManifestBackdropRotation
    ? [...layerManifest.rotation] as [number, number, number]
    : [0.1, Math.PI + 0.22, -0.76] as [number, number, number];

  return (
    <group ref={rootRef} rotation={rotation} frustumCulled={false}>
      <mesh frustumCulled={false} renderOrder={-10000} scale={900000}>
        <sphereGeometry args={[1, 128, 64]} />
        <primitive object={baseMaterial} attach="material" />
      </mesh>
      {orbitAtlas && distantStarsTexture ? (
        <mesh frustumCulled={false} renderOrder={-9999} scale={899850}>
          <sphereGeometry args={[1, 128, 64]} />
          <primitive object={distantStarsMaterial} attach="material" />
        </mesh>
      ) : null}
      {useManifestBackdropRotation && starsTexture ? (
        <mesh frustumCulled={false} renderOrder={-9998} scale={899900}>
          <sphereGeometry args={[1, 128, 64]} />
          <primitive object={starsMaterial} attach="material" />
        </mesh>
      ) : null}
      {mobile && gasGiantCloseup && selectedBodyCinematic ? (
        <mesh frustumCulled={false} renderOrder={-9997} scale={899700}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial
            color="#020308"
            depthTest={false}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

