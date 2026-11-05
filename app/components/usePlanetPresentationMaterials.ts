"use client";

import * as THREE from "three";
import { useLayoutEffect, useMemo, type RefObject } from "react";
import { getProceduralPlanetTexture } from "../lib/celestialTextures";
import { ORBIT_ATLAS_V11_BODY_STYLES } from "../lib/orbitAtlasPresentation";
import { V76_CLOSEUP_VISUAL_BUDGETS } from "../lib/atlasCloseupVisualFidelity";
import { SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS } from "../lib/scientificVisualFidelityV152";
import type { PlanetBodyProps } from "./PlanetBodyProps";

type PlanetPresentationMaterialsArgs = {
  bodyId: string; radius: number; map: THREE.Texture | null;
  color: PlanetBodyProps["color"]; emissive: PlanetBodyProps["emissive"];
  emissiveIntensity: number; roughness: number; envMapIntensity: number;
  terminatorSoftness: number;
  selected: boolean; showAtmosphere: boolean;
  nightMap: THREE.Texture | null; nightMaskMap: THREE.Texture | null;
  atlasVisualProfile: PlanetBodyProps["atlasVisualProfile"];
  cinematicLightingProfile: PlanetBodyProps["cinematicLightingProfile"];
  referenceGradePlanetMaterialProfile: PlanetBodyProps["referenceGradePlanetMaterialProfile"];
  selectedBodyMaterialProfile: PlanetBodyProps["selectedBodyMaterialProfile"];
  selectedBodyAtmosphereDepthProfile: PlanetBodyProps["selectedBodyAtmosphereDepthProfile"];
  selectedBodyTerminatorProfile: PlanetBodyProps["selectedBodyTerminatorProfile"];
  selectedBodyKeyLightProfile: PlanetBodyProps["selectedBodyKeyLightProfile"];
  selectedBodyDepthLightingProfile: PlanetBodyProps["selectedBodyDepthLightingProfile"];
  selectedBodyColorGradeProfile: PlanetBodyProps["selectedBodyColorGradeProfile"];
  selectedBodyGasGiantArtProfile: PlanetBodyProps["selectedBodyGasGiantArtProfile"];
  selectedBodyEarthCloudNightProfile: PlanetBodyProps["selectedBodyEarthCloudNightProfile"];
  globalColorGradeProfile: PlanetBodyProps["globalColorGradeProfile"];
  closeupCompositionProfile: PlanetBodyProps["closeupCompositionProfile"];
  baseColorStore: RefObject<THREE.Color>; baseEmissiveStore: RefObject<number>;
};

export function usePlanetPresentationMaterials({
  bodyId, radius, map,
  color, emissive, emissiveIntensity,
  roughness, envMapIntensity, selected,
  terminatorSoftness,
  showAtmosphere, nightMap, nightMaskMap,
  atlasVisualProfile, cinematicLightingProfile, referenceGradePlanetMaterialProfile,
  selectedBodyMaterialProfile, selectedBodyAtmosphereDepthProfile, selectedBodyTerminatorProfile,
  selectedBodyKeyLightProfile, selectedBodyDepthLightingProfile, selectedBodyColorGradeProfile,
  selectedBodyGasGiantArtProfile, selectedBodyEarthCloudNightProfile, globalColorGradeProfile,
  closeupCompositionProfile, baseColorStore, baseEmissiveStore,
}: PlanetPresentationMaterialsArgs) {
  const planetColor = useMemo(() => {
    if (color !== undefined) return new THREE.Color(color);
    return new THREE.Color("#c8c8d8");
  }, [color]);

  const emissiveBaseColor = useMemo(() => {
    if (emissive !== undefined && emissive !== null) {
      const ec = new THREE.Color(emissive as THREE.ColorRepresentation);
      if (ec.r + ec.g + ec.b > 1e-5) return ec;
    }
    return planetColor.clone();
  }, [emissive, planetColor]);

  const fallbackMap = useMemo(
    () => getProceduralPlanetTexture(bodyId, planetColor),
    [bodyId, planetColor],
  );
  const surfaceMap = map ?? fallbackMap;
  const hasRealTexture = !!map;
  const atlasSurface = atlasVisualProfile !== undefined;
  const atlasBodyStyle = atlasVisualProfile
    ? ORBIT_ATLAS_V11_BODY_STYLES[atlasVisualProfile]
    : undefined;
  const atlasGasGiant = atlasVisualProfile === "gas-giant" || atlasVisualProfile === "ringed";
  const atlasTerrestrial = atlasVisualProfile === "terrestrial";
  const cinematicCloseup = cinematicLightingProfile !== "overview";
  const cinematicEarth = cinematicLightingProfile === "earth-night-closeup";
  const cinematicGasGiant = cinematicLightingProfile === "gas-giant-closeup";
  const cinematicLunarMars = cinematicLightingProfile === "lunar-mars-closeup";
  const cinematicTerrestrial = cinematicLightingProfile === "terrestrial-closeup";
  const referenceCloseupMaterial = referenceGradePlanetMaterialProfile === "closeup-microcontrast-fill";
  const referenceGasGiantMaterial = referenceGradePlanetMaterialProfile === "gas-giant-ring-readability";
  const v50GasPortrait =
    closeupCompositionProfile === "gas-giant-band-portrait" ||
    closeupCompositionProfile === "saturn-ring-showcase";
  const v50EarthPortrait = closeupCompositionProfile === "earth-limb-portrait";
  const v50AirlessPortrait = closeupCompositionProfile === "lunar-mars-relief-portrait";
  const v51GasKeyFill =
    selectedBodyKeyLightProfile === "gas-giant-readable-key-fill" ||
    selectedBodyKeyLightProfile === "saturn-ring-key-fill";
  const v51SaturnKeyFill = selectedBodyKeyLightProfile === "saturn-ring-key-fill";
  const v51EarthKeyBalance = selectedBodyKeyLightProfile === "earth-cloud-night-key-balance";
  const v51AirlessReliefKey = selectedBodyKeyLightProfile === "lunar-mars-relief-key";
  const v52EarthDepth = selectedBodyDepthLightingProfile === "earth-atmospheric-terminator-depth";
  const v52GasDepth =
    selectedBodyDepthLightingProfile === "gas-giant-banded-phase-depth" ||
    selectedBodyDepthLightingProfile === "saturn-ring-shadow-depth";
  const v52SaturnDepth = selectedBodyDepthLightingProfile === "saturn-ring-shadow-depth";
  const v52AirlessDepth = selectedBodyDepthLightingProfile === "airless-relief-terminator-depth";
  const v53EarthColor = selectedBodyColorGradeProfile === "earth-ocean-cloud-color-depth";
  const v53GasColor =
    selectedBodyColorGradeProfile === "gas-giant-layer-color-grade" ||
    selectedBodyColorGradeProfile === "saturn-ring-occlusion-color-grade";
  const v53SaturnColor = selectedBodyColorGradeProfile === "saturn-ring-occlusion-color-grade";

  const v53AirlessColor = selectedBodyColorGradeProfile === "airless-regolith-color-depth";
  const v55GasArt = selectedBodyGasGiantArtProfile !== "overview-no-gas-giant-art";
  const v55SaturnGasArt = selectedBodyGasGiantArtProfile === "saturn-muted-bands-ring-aware";
  const v55EarthCloudNight =
    selectedBodyEarthCloudNightProfile === "earth-clean-cloud-night-shadow-art";
  const v152EarthInspect = selected && bodyId === "earth" && v55EarthCloudNight;
  const v152JupiterInspect = selected && bodyId === "jupiter" && v55GasArt && !v55SaturnGasArt;
  const v55GlobalColor =
    globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
  const v49EarthMaterial = selectedBodyMaterialProfile === "earth-cloud-night-depth";
  const v49GasMaterial =
    selectedBodyMaterialProfile === "gas-giant-band-depth" ||
    selectedBodyMaterialProfile === "saturn-ring-material-depth";
  const v49AirlessMaterial = selectedBodyMaterialProfile === "lunar-mars-relief-depth";
  const v49TerrestrialMaterial = selectedBodyMaterialProfile === "terrestrial-terminator-depth";
  const v49AtmosphereDepth = selectedBodyAtmosphereDepthProfile !== "overview-atmosphere";
  const v49TerminatorDepth = selectedBodyTerminatorProfile !== "overview-terminator";
  const atlasRimOpacity = atlasBodyStyle
    ? selected
      ? atlasBodyStyle.selectedRimOpacity
      : atlasBodyStyle.rimOpacity
    : undefined;
  const atlasTextureFill = atlasBodyStyle
    ? selected
      ? atlasBodyStyle.selectedTextureFill
      : atlasBodyStyle.textureFill
    : undefined;
  const atlasTextureFillRuntime = atlasTextureFill !== undefined
    ? atlasTextureFill *
      (selected
        ? v49GasMaterial || cinematicGasGiant || atlasGasGiant || v55GasArt
          ? v55GasArt ? (v55SaturnGasArt ? 1.22 : 1.86) : v52GasDepth ? 2.56 : v51GasKeyFill ? 2.72 : v50GasPortrait ? 2.18 : v49GasMaterial ? 1.45 : referenceGasGiantMaterial ? 1.48 : 1.82
          : v49EarthMaterial || cinematicEarth || bodyId === "earth" || v55EarthCloudNight
            ? v55EarthCloudNight ? 0.19 : v52EarthDepth ? 0.29 : v51EarthKeyBalance ? 0.34 : v50EarthPortrait ? 0.3 : v49EarthMaterial ? 0.24 : referenceCloseupMaterial ? 0.38 : 0.46
            : cinematicLunarMars
              ? v52AirlessDepth ? 0.84 : v51AirlessReliefKey ? 0.92 : v50AirlessPortrait ? 0.78 : v49AirlessMaterial ? 0.7 : referenceCloseupMaterial ? 0.86 : 0.98
              : v49TerrestrialMaterial || cinematicTerrestrial || atlasTerrestrial
                ? v49TerrestrialMaterial ? 0.52 : referenceCloseupMaterial ? 0.64 : 0.72
                : 0.78
        : 0.78)
    : undefined;
  const materialRoughness = atlasSurface
    ? v49GasMaterial || cinematicGasGiant || atlasGasGiant || v55GasArt
      ? selected ? (v55GasArt ? 0.92 : 0.96) : 0.76
      : atlasTerrestrial
        ? selected ? (v55EarthCloudNight ? 0.86 : v49EarthMaterial ? 0.82 : 0.9) : 0.72
        : 0.82
    : Math.max(hasRealTexture ? (selected ? (v55GasArt ? 0.96 : v49GasMaterial ? 0.9 : v55EarthCloudNight ? 0.82 : v49EarthMaterial ? 0.78 : 0.76) : 0.58) : 0.62, roughness);
  const materialEnvMapIntensity = atlasSurface
    ? atlasGasGiant
      ? selected ? (v55GasArt ? 0.16 : v52GasDepth ? 0.18 : v51GasKeyFill ? 0.25 : 0.16) : 0.12
      : atlasTerrestrial
        ? selected ? (v55EarthCloudNight ? 0.16 : 0.2) : 0.14
        : selected ? 0.14 : 0.08
    : selected
      ? Math.min(Math.max(envMapIntensity, v55GasArt ? 0.08 : 0.12), v55GasArt ? 0.2 : 0.28)
      : Math.min(Math.max(envMapIntensity, 0.08), 0.22);
  const materialColor = useMemo(
    () => (atlasSurface && hasRealTexture ? new THREE.Color("#ffffff") : planetColor),
    [atlasSurface, hasRealTexture, planetColor],
  );
  const textureEmissiveColor = hasRealTexture
    ? selected
      ? v49GasMaterial || cinematicGasGiant || atlasGasGiant || v55GasArt
        ? v55GasArt ? (v55SaturnGasArt ? "#c9b890" : "#c8b29d") : v53GasColor ? (v53SaturnColor ? "#6f624d" : "#75573f") : v52GasDepth ? (v52SaturnDepth ? "#7e715a" : "#7f664f") : v51GasKeyFill ? (v51SaturnKeyFill ? "#a58f6a" : "#a9855e") : v49GasMaterial ? "#756f68" : referenceGasGiantMaterial ? "#8f8578" : "#c6b7a5"
        : v49AirlessMaterial || cinematicLunarMars
          ? v51AirlessReliefKey ? "#b0957a" : "#9c846e"
          : v49EarthMaterial || cinematicEarth || v55EarthCloudNight
            ? v55EarthCloudNight ? "#2f4058" : v51EarthKeyBalance ? "#5d7185" : "#465669"
            : "#8d98a3"
      : "#263142"
    : emissiveBaseColor;
  const selectedSurfaceFillOpacity = selected && hasRealTexture
    ? v49GasMaterial || cinematicGasGiant || atlasGasGiant || v55GasArt
      ? v55GasArt ? (v55SaturnGasArt ? 0.092 : 0.155) : v53GasColor ? (v53SaturnColor ? 0.16 : 0.18) : v52GasDepth ? (v52SaturnDepth ? 0.18 : 0.2) : v51GasKeyFill ? (v51SaturnKeyFill ? 0.24 : 0.28) : v50GasPortrait ? 0.28 : v49GasMaterial ? 0.16 : referenceGasGiantMaterial ? 0.22 : 0.38
      : v49EarthMaterial || cinematicEarth || bodyId === "earth" || v55EarthCloudNight
        ? v152EarthInspect ? SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.earth.darkSideTextureFillOpacity : v55EarthCloudNight ? 0.026 : v53EarthColor ? 0.026 : v52EarthDepth ? 0.032 : v51EarthKeyBalance ? 0.045 : v50EarthPortrait ? 0.03 : v49EarthMaterial ? 0.024 : referenceCloseupMaterial ? 0.038 : 0.05
        : v49AirlessMaterial || cinematicLunarMars
          ? v53AirlessColor ? 0.08 : v52AirlessDepth ? 0.092 : v51AirlessReliefKey ? 0.118 : v50AirlessPortrait ? 0.096 : v49AirlessMaterial ? 0.082 : referenceCloseupMaterial ? 0.105 : 0.14
          : v49TerrestrialMaterial || cinematicTerrestrial || atlasTerrestrial
            ? v49TerrestrialMaterial ? 0.066 : referenceCloseupMaterial ? 0.085 : 0.105
            : 0.11
    : 0;
  const selectedSurfaceFillColor =
    v49GasMaterial || cinematicGasGiant || atlasGasGiant || v55GasArt
      ? v55GasArt ? (v55SaturnGasArt ? "#b8a47a" : "#d7b58a") : v51SaturnKeyFill ? "#d3ba8d" : v51GasKeyFill ? "#d1a46d" : "#cdbb9d"
      : v49AirlessMaterial || cinematicLunarMars
        ? "#b69a82"
        : v49EarthMaterial || cinematicEarth || v55EarthCloudNight
          ? v55EarthCloudNight ? "#5c7798" : "#7890a8"
          : "#8fa0b3";

  useLayoutEffect(() => {
    baseColorStore.current.copy(planetColor);
    baseEmissiveStore.current = emissiveIntensity;
  }, [baseColorStore, baseEmissiveStore, planetColor, emissiveIntensity]);

  const normalScale = useMemo(
    () =>
      new THREE.Vector2(
        v152JupiterInspect ? SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.jupiter.normalScale[0] : v55GasArt ? (v55SaturnGasArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturn.normalScale[0] : V76_CLOSEUP_VISUAL_BUDGETS.jupiter.normalScale[0]) : v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.normalScale[0] : v52GasDepth ? 2.92 : v51GasKeyFill ? 2.62 : v50GasPortrait ? 2.35 : v49GasMaterial ? 2.0 : v52AirlessDepth ? 2.72 : v51AirlessReliefKey ? 2.5 : v50AirlessPortrait ? 2.35 : v49AirlessMaterial ? 2.15 : v52EarthDepth ? 1.9 : v49EarthMaterial ? 1.7 : 1.65,
        v152JupiterInspect ? SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.jupiter.normalScale[1] : v55GasArt ? (v55SaturnGasArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturn.normalScale[1] : V76_CLOSEUP_VISUAL_BUDGETS.jupiter.normalScale[1]) : v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.normalScale[1] : v52GasDepth ? 2.92 : v51GasKeyFill ? 2.62 : v50GasPortrait ? 2.35 : v49GasMaterial ? 2.0 : v52AirlessDepth ? 2.72 : v51AirlessReliefKey ? 2.5 : v50AirlessPortrait ? 2.35 : v49AirlessMaterial ? 2.15 : v52EarthDepth ? 1.9 : v49EarthMaterial ? 1.7 : 1.65,
      ),
    [v49AirlessMaterial, v49EarthMaterial, v49GasMaterial, v50AirlessPortrait, v50GasPortrait, v51AirlessReliefKey, v51GasKeyFill, v52AirlessDepth, v52EarthDepth, v52GasDepth, v55EarthCloudNight, v55GasArt, v55SaturnGasArt, v152JupiterInspect]
  );

  const limbMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.FrontSide,
        uniforms: {
          uColor: { value: planetColor.clone().lerp(new THREE.Color("#9fc8ff"), showAtmosphere ? 0.62 : 0.24) },
          uOpacity: { value: atlasRimOpacity ?? (showAtmosphere ? (v55EarthCloudNight ? 0.2 : v52EarthDepth ? 0.18 : v49AtmosphereDepth ? 0.22 : 0.32) : v55GasArt ? 0.095 : v52AirlessDepth ? 0.085 : v49AtmosphereDepth ? 0.1 : 0.13) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          uniform vec3 uColor;
          uniform float uOpacity;
          #include <logdepthbuf_pars_fragment>
          void main() {
            float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(-vView)), 0.0), 2.7);
            float edge = smoothstep(0.18, 1.0, rim);
            gl_FragColor = vec4(uColor, edge * uOpacity);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [atlasRimOpacity, planetColor, showAtmosphere, v49AtmosphereDepth, v52AirlessDepth, v52EarthDepth, v55EarthCloudNight, v55GasArt]
  );
  const atlasFallbackOverviewPoint = atlasVisualProfile === "fallback" && !selected;
  const atlasSpriteOpacity = atlasFallbackOverviewPoint ? 0.32 : 1;
  const atlasSpriteColor = useMemo(
    () => atlasFallbackOverviewPoint ? planetColor.clone().multiplyScalar(0.58) : planetColor,
    [atlasFallbackOverviewPoint, planetColor],
  );
  const atlasSpriteBlending = atlasFallbackOverviewPoint ? THREE.NormalBlending : THREE.AdditiveBlending;
  const atlasEmissiveIntensity = atlasBodyStyle
    ? selected
      ? atlasBodyStyle.selectedEmissiveIntensity
      : atlasBodyStyle.emissiveIntensity
    : undefined;
  const atlasBumpScale = atlasBodyStyle
    ? radius * atlasBodyStyle.bumpScale * (selected ? v55GasArt ? (v55SaturnGasArt ? 0.48 : 0.42) : v52GasDepth ? 2.98 : v51GasKeyFill ? 2.62 : v50GasPortrait ? 2.42 : v49GasMaterial ? 2.15 : v52AirlessDepth ? 2.72 : v51AirlessReliefKey ? 2.48 : v50AirlessPortrait ? 2.42 : v49AirlessMaterial ? 2.2 : v52EarthDepth ? 1.95 : v49EarthMaterial ? 1.72 : referenceCloseupMaterial || referenceGasGiantMaterial ? 1.8 : 1.45 : 1)
    : undefined;

  const nightSideMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uNightMap: { value: nightMap },
          uNightMaskMap: { value: nightMaskMap },
          uHasNightMask: { value: nightMaskMap ? 1 : 0 },
          uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
          uOpacity: { value: 0.72 },
          uProfileTerminatorSoftness: { value: terminatorSoftness },
          uTerminatorDepth: { value: v49TerminatorDepth ? 1 : 0 },
          uV55EarthNight: { value: v55EarthCloudNight ? 1 : 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vUv = uv;
            vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          uniform sampler2D uNightMap;
          uniform sampler2D uNightMaskMap;
          uniform float uHasNightMask;
          uniform vec3 uSunDirection;
          uniform float uOpacity;
          uniform float uProfileTerminatorSoftness;
          uniform float uTerminatorDepth;
          uniform float uV55EarthNight;
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          #include <logdepthbuf_pars_fragment>
          void main() {
            vec3 n = normalize(vNormalWorld);
            float sunDot = dot(n, normalize(uSunDirection));
            float profileSoftness = clamp(uProfileTerminatorSoftness, 0.5, 2.0);
            float night = 1.0 - smoothstep(mix(-0.16, -0.06, max(uTerminatorDepth, uV55EarthNight)) * profileSoftness, mix(0.18, 0.045, max(uTerminatorDepth, uV55EarthNight)) * profileSoftness, sunDot);
            float terminator = smoothstep(-0.34 * profileSoftness, -0.08, sunDot) * (1.0 - smoothstep(0.02, mix(0.22, 0.14, uV55EarthNight) * profileSoftness, sunDot));
            vec3 city = texture2D(uNightMap, vUv).rgb;
            float mask = uHasNightMask > 0.5 ? texture2D(uNightMaskMap, vUv).r : 1.0;
            float luma = dot(city, vec3(0.2126, 0.7152, 0.0722));
            vec3 warm = city * mix(vec3(1.08, 0.86, 0.62), vec3(0.96, 0.77, 0.58), uV55EarthNight);
            float glow = luma * mix(1.4, 0.86, max(uTerminatorDepth, uV55EarthNight)) * mask;
            float alpha = clamp((glow + terminator * mix(0.018, 0.006, uV55EarthNight)) * night * uOpacity, 0.0, mix(0.78, 0.34, max(uTerminatorDepth, uV55EarthNight)));
            gl_FragColor = vec4(warm, alpha);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [nightMap, nightMaskMap, terminatorSoftness, v49TerminatorDepth, v55EarthCloudNight],
  );

  const keyLightFillMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uColor: { value: new THREE.Color(v55GasArt ? (v55SaturnGasArt ? "#b59a70" : "#b58562") : v51SaturnKeyFill ? "#d7bd84" : "#c89f6a") },
          uOpacity: { value: v152JupiterInspect ? SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.jupiter.keyFillOpacity : v55GasArt ? (v55SaturnGasArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturn.keyFillOpacity : V76_CLOSEUP_VISUAL_BUDGETS.jupiter.keyFillOpacity) : v51SaturnKeyFill ? 0.11 : 0.145 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vView;
          uniform vec3 uColor;
          uniform float uOpacity;
          #include <logdepthbuf_pars_fragment>
          void main() {
            vec3 n = normalize(vNormal);
            vec3 viewDir = normalize(-vView);
            float facing = max(dot(n, viewDir), 0.0);
            float limbFade = smoothstep(0.02, 0.34, facing) * (1.0 - smoothstep(0.9, 1.0, facing) * 0.26);
            float latitude = abs(vUv.y - 0.5) * 2.0;
            float equator = 1.0 - smoothstep(0.3, 1.0, latitude);
            float bandMicro = 0.84 + 0.16 * sin(vUv.y * 88.0) + 0.08 * sin(vUv.y * 213.0);
            float alpha = clamp(uOpacity * limbFade * mix(0.72, 1.16, equator) * bandMicro, 0.0, uOpacity * 1.28);
            gl_FragColor = vec4(uColor, alpha);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [v51SaturnKeyFill, v55GasArt, v55SaturnGasArt, v152JupiterInspect],
  );

  const depthLightingMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
        toneMapped: false,
        uniforms: {
          uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
          uOpacity: { value: v52SaturnDepth ? V76_CLOSEUP_VISUAL_BUDGETS.saturn.depthLightingOpacity : v52GasDepth ? 0.13 : v52EarthDepth ? V76_CLOSEUP_VISUAL_BUDGETS.earth.depthLightingOpacity : 0.1 },
          uRingShadow: { value: v52SaturnDepth ? 1 : 0 },
          uGasDepth: { value: v52GasDepth ? 1 : 0 },
          uEarthDepth: { value: v52EarthDepth ? 1 : 0 },
          uAirlessDepth: { value: v52AirlessDepth ? 1 : 0 },
          uProfileTerminatorSoftness: { value: terminatorSoftness },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          varying vec3 vNormalView;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vUv = uv;
            vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            vNormalView = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          uniform vec3 uSunDirection;
          uniform float uOpacity;
          uniform float uRingShadow;
          uniform float uGasDepth;
          uniform float uEarthDepth;
          uniform float uAirlessDepth;
          uniform float uProfileTerminatorSoftness;
          varying vec2 vUv;

          varying vec3 vNormalWorld;
          varying vec3 vNormalView;
          varying vec3 vView;
          #include <logdepthbuf_pars_fragment>
          void main() {
            vec3 nw = normalize(vNormalWorld);
            vec3 nv = normalize(vNormalView);
            vec3 viewDir = normalize(-vView);
            float facing = max(dot(nv, viewDir), 0.0);
            float sunDot = dot(nw, normalize(uSunDirection));
            float profileSoftness = clamp(uProfileTerminatorSoftness, 0.5, 2.0);
            float night = 1.0 - smoothstep(-0.22 * profileSoftness, 0.28 * profileSoftness, sunDot);
            float terminator = smoothstep(-0.26 * profileSoftness, 0.04, sunDot) * (1.0 - smoothstep(0.18, 0.5 * profileSoftness, sunDot));
            float limb = pow(1.0 - facing, 2.15);
            float latitude = abs(vUv.y - 0.5) * 2.0;
            float gasBands = 0.58 + 0.22 * sin(vUv.y * 92.0) + 0.12 * sin(vUv.y * 211.0);
            float ringShadow = smoothstep(0.035, 0.0, abs(vUv.y - 0.5)) * smoothstep(0.12, 0.46, facing);
            float bandDepth = clamp((terminator * 0.74 + night * 0.38) * mix(0.82, 1.22, gasBands), 0.0, 1.0);
            float earthDepth = clamp(terminator * 0.55 + limb * 0.18 + night * 0.22, 0.0, 1.0);
            float airlessDepth = clamp(terminator * 0.72 + limb * 0.26 + night * 0.32, 0.0, 1.0);
            float gasLatitudeFade = 1.0 - smoothstep(0.84, 1.0, latitude) * 0.42;
            float alpha = 0.0;
            alpha += bandDepth * gasLatitudeFade * uGasDepth;
            alpha += earthDepth * uEarthDepth;
            alpha += airlessDepth * uAirlessDepth;
            alpha += ringShadow * uRingShadow * ${V76_CLOSEUP_VISUAL_BUDGETS.saturn.ringShadowContribution.toFixed(2)};
            vec3 color = mix(vec3(0.008, 0.01, 0.014), vec3(0.055, 0.045, 0.032), uRingShadow * ringShadow);
            gl_FragColor = vec4(color, clamp(alpha * uOpacity, 0.0, 0.36));
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [terminatorSoftness, v52AirlessDepth, v52EarthDepth, v52GasDepth, v52SaturnDepth],
  );

  const colorGradeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
        toneMapped: false,
        uniforms: {
          uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
          uWarmColor: { value: new THREE.Color(v53SaturnColor ? "#cda66f" : v53GasColor ? "#c1784d" : v53EarthColor ? "#89b3c7" : "#b99a80") },
          uCoolColor: { value: new THREE.Color(v53EarthColor ? "#17314d" : v53AirlessColor ? "#322920" : "#241f1c") },
          uEarth: { value: v53EarthColor ? 1 : 0 },
          uGas: { value: v53GasColor ? 1 : 0 },
          uSaturn: { value: v53SaturnColor ? 1 : 0 },
          uAirless: { value: v53AirlessColor ? 1 : 0 },
          uV55GasArt: { value: v55GasArt ? 1 : 0 },
          uV55SaturnGasArt: { value: v55SaturnGasArt ? 1 : 0 },
          uV55EarthNight: { value: v55EarthCloudNight ? 1 : 0 },
          uV55GlobalColor: { value: v55GlobalColor ? 1 : 0 },
          uOpacity: { value: v55GasArt ? (v55SaturnGasArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturn.colorGradeOpacity : V76_CLOSEUP_VISUAL_BUDGETS.jupiter.colorGradeOpacity) : v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.colorGradeOpacity : v53SaturnColor ? 0.17 : v53GasColor ? 0.15 : v53EarthColor ? 0.105 : v53AirlessColor ? 0.12 : 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          varying vec3 vNormalView;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vUv = uv;
            vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            vNormalView = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          uniform vec3 uSunDirection;
          uniform vec3 uWarmColor;
          uniform vec3 uCoolColor;

          uniform float uEarth;
          uniform float uGas;
          uniform float uSaturn;
          uniform float uAirless;
          uniform float uV55GasArt;
          uniform float uV55SaturnGasArt;
          uniform float uV55EarthNight;
          uniform float uV55GlobalColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          varying vec3 vNormalView;
          varying vec3 vView;
          #include <logdepthbuf_pars_fragment>
          void main() {
            vec3 nw = normalize(vNormalWorld);
            vec3 nv = normalize(vNormalView);
            vec3 viewDir = normalize(-vView);
            float facing = max(dot(nv, viewDir), 0.0);
            float sunDot = dot(nw, normalize(uSunDirection));
            float day = smoothstep(-0.12, 0.56, sunDot);
            float terminator = smoothstep(-0.34, 0.04, sunDot) * (1.0 - smoothstep(0.2, 0.66, sunDot));
            float limb = pow(1.0 - facing, 2.4);
            float latitude = abs(vUv.y - 0.5) * 2.0;
            float gasBands = 0.5 + 0.28 * sin(vUv.y * 96.0) + 0.12 * sin(vUv.y * 238.0);
            float fineBands = 0.48 + 0.26 * sin(vUv.y * 178.0 + vUv.x * 0.38) + 0.11 * sin(vUv.y * 411.0);
            float gasMicro = clamp(0.5 + gasBands * 0.5 + fineBands * uV55GasArt * 0.22, 0.0, 1.0) * (1.0 - smoothstep(0.86, 1.0, latitude) * 0.35);
            float earthOcean = smoothstep(0.18, 0.72, day) * (0.58 + 0.18 * sin(vUv.x * 11.0 + vUv.y * 7.0));
            float saturnOcclusion = smoothstep(0.025, 0.0, abs(vUv.y - 0.5)) * smoothstep(0.18, 0.66, facing);
            vec3 grade = mix(uCoolColor, uWarmColor, day);
            float alpha = uOpacity * (terminator * 0.58 + limb * 0.24);
            alpha += max(uGas, uV55GasArt) * gasMicro * uOpacity * mix(0.82, 0.58, uV55GasArt);
            alpha += max(uEarth, uV55EarthNight) * earthOcean * uOpacity * mix(0.32, 0.18, uV55EarthNight);
            alpha += uAirless * terminator * uOpacity * 0.34;
            grade = mix(grade, uWarmColor * mix(vec3(1.06, 1.02, 0.92), vec3(0.92, 0.86, 0.76), uV55GasArt), max(uGas, uV55GasArt) * gasMicro * mix(0.42, 0.34, uV55GasArt));
            grade = mix(grade, vec3(0.05, 0.04, 0.03), max(uSaturn, uV55SaturnGasArt) * saturnOcclusion * mix(0.72, ${V76_CLOSEUP_VISUAL_BUDGETS.saturn.occlusionMixMax.toFixed(2)}, uV55SaturnGasArt));
            grade = mix(grade, vec3(${V76_CLOSEUP_VISUAL_BUDGETS.earth.nightCoolFloor.join(", ")}), uV55EarthNight * (1.0 - day) * ${V76_CLOSEUP_VISUAL_BUDGETS.earth.nightCoolFloorMix.toFixed(2)});
            grade = mix(grade, grade * vec3(0.86, 0.91, 1.02), uV55GlobalColor * (1.0 - day) * 0.22);
            gl_FragColor = vec4(grade, clamp(alpha, 0.0, mix(0.24, 0.2, max(uV55GasArt, uV55EarthNight))));
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [v53AirlessColor, v53EarthColor, v53GasColor, v53SaturnColor, v55EarthCloudNight, v55GasArt, v55GlobalColor, v55SaturnGasArt],
  );

  useLayoutEffect(() => {
    return () => {
      depthLightingMaterial.dispose();
      colorGradeMaterial.dispose();
      limbMaterial.dispose();
      nightSideMaterial.dispose();
      keyLightFillMaterial.dispose();
    };
  }, [colorGradeMaterial, depthLightingMaterial, keyLightFillMaterial, limbMaterial, nightSideMaterial]);


  return {
    atlasBodyStyle, atlasBumpScale, atlasEmissiveIntensity,
    atlasGasGiant,
    atlasSpriteBlending, atlasSpriteColor, atlasSpriteOpacity,
    atlasSurface, atlasTerrestrial, atlasTextureFillRuntime,
    cinematicCloseup, cinematicEarth, cinematicGasGiant,
    colorGradeMaterial, depthLightingMaterial, hasRealTexture,
    keyLightFillMaterial, limbMaterial, materialColor,
    materialEnvMapIntensity, materialRoughness, nightSideMaterial,
    normalScale, referenceCloseupMaterial, referenceGasGiantMaterial,
    selectedSurfaceFillColor, selectedSurfaceFillOpacity, surfaceMap,
    textureEmissiveColor, v152EarthInspect, v152JupiterInspect,
    v49AtmosphereDepth, v49EarthMaterial, v49GasMaterial,
    v50GasPortrait, v51EarthKeyBalance, v51GasKeyFill,
    v51SaturnKeyFill, v52EarthDepth, v52GasDepth,
    v52SaturnDepth, v53EarthColor, v55EarthCloudNight,
    v55GasArt, v55GlobalColor, v55SaturnGasArt,
  };
}
