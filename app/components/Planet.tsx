"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import BodyLabel from "./BodyLabel";
import EarthAtmosphereGlow from "./EarthAtmosphereGlow";
import { useRelativisticOpticsStateRef } from "../context/RelativisticOpticsContext";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import {
  applyDopplerTint,
  bodyVelScenePerRealSec,
  dopplerFrequencyRatio,
  lineOfSightBeta,
  opticsEffectStrength,
  searchlightBrightnessFactor,
} from "../lib/relativisticOptics";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import { useOptionalLabelOcclusion } from "../context/LabelOcclusionContext";
import {
  DEFAULT_SPHERE_SEGMENTS,
  getProceduralPlanetTexture,
  getSharedPlanetGlowTexture,
  MIN_PLANET_ICON_PX,
  SPRITE_LOD_ENTER_PX,
  SPRITE_LOD_EXIT_PX,
} from "../lib/celestialTextures";
import {
  ORBIT_ATLAS_V11_BODY_STYLES,
  type OrbitAtlasBodyVisualProfile,
} from "../lib/orbitAtlasPresentation";
import { V76_CLOSEUP_VISUAL_BUDGETS } from "../lib/atlasCloseupVisualFidelity";
import { SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS } from "../lib/scientificVisualFidelityV152";
import type {
  AtlasCloseupCompositionProfile,
  AtlasReferenceGradePlanetMaterialProfile,
  AtlasSelectedBodyAtmosphereDepthProfile,
  AtlasSelectedBodyColorGradeProfile,
  AtlasSelectedBodyDepthLightingProfile,
  AtlasSelectedBodyKeyLightProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasSelectedBodyMaterialProfile,
  AtlasSelectedBodyTerminatorProfile,
  AtlasSelectedBodyGasGiantArtProfile,
  AtlasSelectedBodyEarthCloudNightProfile,
  AtlasGlobalColorGradeProfile,
} from "../lib/simulationDiagnosticsTypes";

const _nightLayerWorldPos = new THREE.Vector3();

export type PlanetBodyProps = {
  variant: "planet";
  bodyId?: string;
  radius?: number;
  position?: [number, number, number];
  sunEmissiveIntensity?: number;
  sunCoronaRadiusScale?: number;
  sunCoronaOpacity?: number;
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  color?: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  sphereSegments?: [number, number];
  sunCastPointLight?: boolean;
  pointLightIntensity?: number;
  pointLightColor?: THREE.ColorRepresentation;
  label?: string;
  labelFadeNear?: number;
  labelFadeFar?: number;
  labelDistanceFactor?: number;
  labelFontSizePx?: number;
  labelBodyIndex?: number;
  labelSurfaceFadeNear?: number;
  labelSurfaceFadeFar?: number;
  labelLodDiscWorldRadius?: number;
  onBodyPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onBodyDoubleClick?: (e: ThreeEvent<PointerEvent>) => void;
  selected?: boolean;
  /** When set with `opticsPhysicsRef`, applies Doppler / searchlight from sim velocity vs camera. */
  opticsBodyIndex?: number;
  opticsPhysicsRef?: MutableRefObject<SolarSystemPhysicsRef | null>;
  /** Show atmospheric scattering glow (Earth only). */
  showAtmosphere?: boolean;
  /** Atmosphere glow color (defaults to Earth blue). */
  atmosphereColor?: THREE.ColorRepresentation;
  /** Cloud layer texture (semi-transparent sphere slightly larger than planet). */
  clouds?: THREE.Texture | null;
  /** Optional local alpha mask for the cloud layer. */
  cloudAlphaMap?: THREE.Texture | null;
  /** Optional night-light emissive texture, loaded for selected HD bodies. */
  nightMap?: THREE.Texture | null;
  /** Optional local mask to keep night lights constrained to city-light pixels. */
  nightMaskMap?: THREE.Texture | null;
  /** Optional local gas-giant band contrast mask. */
  bandMask?: THREE.Texture | null;
  /** Sim-driven visual spin angle; affects surface/clouds only, not physics or labels. */
  spinAngleRef?: MutableRefObject<number>;
  /** Keep the textured mesh visible at atlas overview distances. */
  forceSurface?: boolean;
  /** Presentation-only profile used by compressed Orbit Atlas. */
  atlasVisualProfile?: OrbitAtlasBodyVisualProfile;
  /** Presentation-only close-up lighting profile; does not affect physics. */
  cinematicLightingProfile?: AtlasSelectedBodyLightingProfile;
  /** Presentation-only v48 material/readability profile; does not affect physics. */
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  /** Presentation-only v49 material composition profile; does not affect physics. */
  selectedBodyMaterialProfile?: AtlasSelectedBodyMaterialProfile;
  /** Presentation-only v49 atmosphere-depth profile; does not affect physics. */
  selectedBodyAtmosphereDepthProfile?: AtlasSelectedBodyAtmosphereDepthProfile;
  /** Presentation-only v49 terminator profile; does not affect physics. */
  selectedBodyTerminatorProfile?: AtlasSelectedBodyTerminatorProfile;
  /** Presentation-only v51 key-light / phase profile; does not affect physics. */
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  /** Presentation-only v52 depth-lighting / ring-shadow profile; does not affect physics. */
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  /** Presentation-only v53 color-grading profile; does not affect physics. */
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  /** Presentation-only v55 gas-giant art direction profile; does not affect physics. */
  selectedBodyGasGiantArtProfile?: AtlasSelectedBodyGasGiantArtProfile;
  /** Presentation-only v55 Earth cloud/night profile; does not affect physics. */
  selectedBodyEarthCloudNightProfile?: AtlasSelectedBodyEarthCloudNightProfile;
  /** Presentation-only v55 global color grade; does not affect physics. */
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  /** Presentation-only v50 close-up composition profile; does not affect physics. */
  closeupCompositionProfile?: AtlasCloseupCompositionProfile;
};

export default function Planet({
  variant: _variant,
  bodyId = "body",
  radius = 1,
  position = [0, 0, 0],
  map = null,
  normalMap = null,
  roughnessMap = null,
  color,
  emissive,
  emissiveIntensity = 0,
  roughness = 0.82,
  metalness = 0.04,
  envMapIntensity = 0,
  sphereSegments = DEFAULT_SPHERE_SEGMENTS,
  label,
  labelFadeNear,
  labelFadeFar,
  labelDistanceFactor,
  labelFontSizePx,
  labelBodyIndex,
  labelSurfaceFadeNear,
  labelSurfaceFadeFar,
  labelLodDiscWorldRadius,
  onBodyPointerDown,
  onBodyDoubleClick,
  selected = false,
  opticsBodyIndex,
  opticsPhysicsRef,
  showAtmosphere = false,
  atmosphereColor = "#4488ff",
  clouds = null,
  cloudAlphaMap = null,
  nightMap = null,
  nightMaskMap = null,
  bandMask = null,
  spinAngleRef,
  forceSurface = false,
  atlasVisualProfile,
  cinematicLightingProfile = "overview",
  referenceGradePlanetMaterialProfile = "overview-local-hd",
  selectedBodyMaterialProfile = "overview-local-material",
  selectedBodyAtmosphereDepthProfile = "overview-atmosphere",
  selectedBodyTerminatorProfile = "overview-terminator",
  selectedBodyKeyLightProfile = "overview-natural-phase",
  selectedBodyDepthLightingProfile = "overview-no-depth-lighting",
  selectedBodyColorGradeProfile = "overview-neutral-color",
  selectedBodyGasGiantArtProfile = "overview-no-gas-giant-art",
  selectedBodyEarthCloudNightProfile = "overview-no-earth-cloud-night-art",
  globalColorGradeProfile = "overview-neutral-grade",
  closeupCompositionProfile = "overview-no-closeup-director",
}: PlanetBodyProps) {
  const [wSeg, hSeg] = sphereSegments;
  const visualRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const selectedFillRef = useRef<THREE.Mesh>(null);
  const bandMaskRef = useRef<THREE.Mesh>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const lastPointerDownMs = useRef(0);
  const bloomActions = useOptionalBloomSceneActions();
  const labelOcclusion = useOptionalLabelOcclusion();
  const { camera, size } = useThree();
  const opticsStateRef = useRelativisticOpticsStateRef();
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const baseColorStore = useRef(new THREE.Color());
  const baseEmissiveStore = useRef(0);
  const tmpBodyVel = useRef(new THREE.Vector3());
  const tmpRel = useRef(new THREE.Vector3());
  const tmpN = useRef(new THREE.Vector3());
  const shiftedColor = useRef(new THREE.Color());
  const spriteLodRef = useRef(false);
  const [spriteTex, setSpriteTex] = useState<THREE.CanvasTexture | null>(null);
  const closeQualityRef = useRef(false);
  const closeLightRef = useRef(0);
  const nightLayerRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    setSpriteTex(getSharedPlanetGlowTexture());
  }, []);

  // Track which bloom targets are currently registered (imperative, no React re-render).
  const bloomMeshRegistered = useRef(false);
  const bloomSpriteRegistered = useRef(false);

  // Register initial bloom target (mesh mode) and clean up on unmount.
  useLayoutEffect(() => {
    const mesh = visualRef.current;
    const sprite = spriteRef.current;
    if (!bloomActions || !mesh) return;
    if (!spriteLodRef.current) {
      bloomActions.registerBloomTarget(mesh);
      bloomMeshRegistered.current = true;
    }
    return () => {
      if (bloomMeshRegistered.current) {
        bloomActions.unregisterBloomTarget(mesh);
        bloomMeshRegistered.current = false;
      }
      if (sprite && bloomSpriteRegistered.current) {
        bloomActions.unregisterBloomTarget(sprite);
        bloomSpriteRegistered.current = false;
      }
    };
  }, [bloomActions]);

  useFrame((_, dt) => {
    const mesh = visualRef.current;
    if (!mesh) return;
    const gasCloseupTiltX = selected && v55GasArt ? (v55SaturnGasArt ? -0.24 : -0.42) : 0;
    const gasCloseupTiltZ = selected && v55GasArt ? (v55SaturnGasArt ? 0.03 : 0.02) : 0;
    const spinY = spinAngleRef ? spinAngleRef.current : mesh.rotation.y;
    if (spinAngleRef) {
      mesh.rotation.y = spinY;
      if (cloudsRef.current) cloudsRef.current.rotation.y = spinY * 1.018;
    }
    mesh.rotation.x = gasCloseupTiltX;
    mesh.rotation.z = gasCloseupTiltZ;
    if (selectedFillRef.current) selectedFillRef.current.rotation.set(gasCloseupTiltX, spinY, gasCloseupTiltZ);
    if (bandMaskRef.current) bandMaskRef.current.rotation.set(gasCloseupTiltX, spinY, gasCloseupTiltZ);
    if (nightLayerRef.current && v55GasArt) nightLayerRef.current.rotation.set(gasCloseupTiltX, spinY, gasCloseupTiltZ);
    if (cloudsRef.current && v55GasArt) cloudsRef.current.rotation.set(gasCloseupTiltX, spinY * 1.018, gasCloseupTiltZ);
    mesh.getWorldPosition(worldPos);
    const dist = worldPos.distanceTo(camera.position);
    const persp = camera as THREE.PerspectiveCamera;
    if (!persp.isPerspectiveCamera || dist < 1e-8) return;
    const vFov = (persp.fov * Math.PI) / 180;
    const frustumH = 2 * Math.tan(vFov / 2) * dist;
    const diameterPx = ((2 * radius) / frustumH) * size.height;

  const wasSprite = spriteLodRef.current;
    let next = wasSprite;
    closeQualityRef.current = selected || diameterPx > 92;
    if (forceSurface || closeQualityRef.current) {
      next = false;
    } else if (!wasSprite && diameterPx < SPRITE_LOD_ENTER_PX) next = true;
    if (wasSprite && diameterPx > SPRITE_LOD_EXIT_PX) next = false;
    if (next !== wasSprite) {
      spriteLodRef.current = next;
      // Imperative visibility toggle: no React setState, no re-render flicker.
      mesh.visible = !next;
      const sp = spriteRef.current;
      if (sp) sp.visible = next;
      // Handle bloom registration imperatively.
      if (bloomActions) {
        if (next) {
          // Switching to sprite: unregister mesh, register sprite.
          if (bloomMeshRegistered.current) {
            bloomActions.unregisterBloomTarget(mesh);
            bloomMeshRegistered.current = false;
          }
          if (sp && !bloomSpriteRegistered.current) {
            bloomActions.registerBloomTarget(sp);
            bloomSpriteRegistered.current = true;
          }
        } else {
          // Switching to mesh: unregister sprite, register mesh.
          if (sp && bloomSpriteRegistered.current) {
            bloomActions.unregisterBloomTarget(sp);
            bloomSpriteRegistered.current = false;
          }
          if (!bloomMeshRegistered.current) {
            bloomActions.registerBloomTarget(mesh);
            bloomMeshRegistered.current = true;
          }
        }
      }
    }

    if (next && spriteRef.current && frustumH > 1e-8) {
      const targetPx = Math.max(atlasBodyStyle?.spriteMinPx ?? MIN_PLANET_ICON_PX, diameterPx);
      const world = (targetPx / size.height) * frustumH;
      spriteRef.current.scale.setScalar(world);
    }

    const mat = mesh?.material as THREE.MeshPhysicalMaterial | undefined;
    const closeLight = closeQualityRef.current ? 1 : 0;
    closeLightRef.current = THREE.MathUtils.lerp(
      closeLightRef.current,
      closeLight,
      1 - Math.pow(0.0015, Math.max(0.001, dt))
    );
    const textureFill = atlasTextureFillRuntime !== undefined
      ? atlasTextureFillRuntime
      : map
        ? closeLightRef.current * (selected ? 0.105 : showAtmosphere ? 0.055 : 0.04)
        : closeLightRef.current * 0.045;
    if (nightSideMaterial) {
      const nightMesh = nightLayerRef.current;
      if (nightMesh) {
        nightMesh.getWorldPosition(_nightLayerWorldPos);
        _nightLayerWorldPos.negate().normalize();
        nightSideMaterial.uniforms.uSunDirection.value.copy(_nightLayerWorldPos);
        depthLightingMaterial.uniforms.uSunDirection.value.copy(_nightLayerWorldPos);
        colorGradeMaterial.uniforms.uSunDirection.value.copy(_nightLayerWorldPos);
      }
        nightSideMaterial.uniforms.uOpacity.value = selected
        ? v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.nightLayerOpacity : cinematicEarth ? referenceCloseupMaterial ? 0.52 : 0.64 : 0.68
        : 0.42;
    }
    const st = opticsStateRef?.current;
    const spMat = spriteRef.current?.material as THREE.SpriteMaterial | undefined;
    if (
      opticsBodyIndex === undefined ||
      !opticsPhysicsRef ||
      !mat ||
      !st
    ) {
      if (mat) mat.color.copy(baseColorStore.current);
      if (mat) mat.emissiveIntensity = Math.max(baseEmissiveStore.current, textureFill);
      if (spMat) spMat.color.copy(baseColorStore.current);
      return;
    }
    if (!st.active) {
      mat.color.copy(baseColorStore.current);
      mat.emissiveIntensity = Math.max(baseEmissiveStore.current, textureFill);
      if (spMat) spMat.color.copy(baseColorStore.current);
      return;
    }
    const p = opticsPhysicsRef.current;
    if (!p || opticsBodyIndex < 0 || opticsBodyIndex >= p.n) {
      mat.color.copy(baseColorStore.current);
      mat.emissiveIntensity = Math.max(baseEmissiveStore.current, textureFill);
      if (spMat) spMat.color.copy(baseColorStore.current);
      return;
    }
    const k = 3 * opticsBodyIndex;
    tmpBodyVel.current.set(
      p.velM[k]!,
      p.velM[k + 1]!,
      p.velM[k + 2]!,
    );
    bodyVelScenePerRealSec(
      tmpBodyVel.current,
      AU_TO_SCENE,
      st.daysPerSecond,
      tmpBodyVel.current,
    );
    const betaLos = lineOfSightBeta(
      worldPos,
      tmpBodyVel.current,
      camera.position,
      st.camVelScenePerReal,
      st.cEffScenePerReal,
      tmpRel.current,
      tmpN.current,
    );
    const strength = opticsEffectStrength(
      betaLos,
      st.daysPerSecond,
      st.relativityPhysicsOn,
    );
    const ratio = dopplerFrequencyRatio(betaLos);
    applyDopplerTint(baseColorStore.current, ratio, strength, shiftedColor.current);
    const g = searchlightBrightnessFactor(betaLos, strength);
    const bright = THREE.MathUtils.clamp(Math.sqrt(g), 0.62, 1.5);
    mat.color.copy(shiftedColor.current).multiplyScalar(bright);
    mat.emissiveIntensity = THREE.MathUtils.clamp(
      Math.max(baseEmissiveStore.current * g, textureFill * 0.78),
      0,
      3,
    );
    if (spMat) {
      spMat.color.copy(shiftedColor.current).multiplyScalar(bright);
    }
  });

  const pickRadius = useMemo(
    () => Math.max(radius * 10, 0.72),
    [radius]
  );

  useLayoutEffect(() => {
    const mesh = visualRef.current;
    if (!mesh || labelBodyIndex === undefined || !labelOcclusion) return;
    labelOcclusion.registerOccluder(mesh, labelBodyIndex);
    return () => labelOcclusion.unregisterOccluder(mesh);
  }, [labelOcclusion, labelBodyIndex, radius]);

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
  }, [planetColor, emissiveIntensity]);

  const spriteTint = useMemo(() => {
    const c = planetColor.clone();
    const t = Math.min(0.58, emissiveIntensity * 0.14 + 0.32);
    c.lerp(emissiveBaseColor, t);
    return c;
  }, [planetColor, emissiveBaseColor, emissiveIntensity]);

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
          uniform float uTerminatorDepth;
          uniform float uV55EarthNight;
          varying vec2 vUv;
          varying vec3 vNormalWorld;
          #include <logdepthbuf_pars_fragment>
          void main() {
            vec3 n = normalize(vNormalWorld);
            float sunDot = dot(n, normalize(uSunDirection));
            float night = 1.0 - smoothstep(mix(-0.16, -0.06, max(uTerminatorDepth, uV55EarthNight)), mix(0.18, 0.045, max(uTerminatorDepth, uV55EarthNight)), sunDot);
            float terminator = smoothstep(-0.34, -0.08, sunDot) * (1.0 - smoothstep(0.02, mix(0.22, 0.14, uV55EarthNight), sunDot));
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
    [nightMap, nightMaskMap, v49TerminatorDepth, v55EarthCloudNight],
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
            float night = 1.0 - smoothstep(-0.22, 0.28, sunDot);
            float terminator = smoothstep(-0.26, 0.04, sunDot) * (1.0 - smoothstep(0.18, 0.5, sunDot));
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
    [v52AirlessDepth, v52EarthDepth, v52GasDepth, v52SaturnDepth],
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

  const handlePickPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onBodyPointerDown?.(e);
      const now = performance.now();
      if (now - lastPointerDownMs.current < 420) {
        lastPointerDownMs.current = 0;
        onBodyDoubleClick?.(e);
      } else {
        lastPointerDownMs.current = now;
      }
    },
    [onBodyPointerDown, onBodyDoubleClick]
  );

  const colorGradeLayerActive = selected && hasRealTexture && (
    selectedBodyColorGradeProfile !== "overview-neutral-color" ||
    v55EarthCloudNight ||
    v55GlobalColor
  );
  const depthLightingLayerActive = selected && hasRealTexture && !v55GasArt &&
    selectedBodyDepthLightingProfile !== "overview-no-depth-lighting" &&
    !colorGradeLayerActive;

  return (
    <group position={position} frustumCulled={false}>
      <mesh renderOrder={3} onPointerDown={handlePickPointerDown}>
        <sphereGeometry args={[pickRadius, Math.max(20, wSeg / 6), Math.max(20, hSeg / 6)]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>
      <mesh
        ref={visualRef}
        renderOrder={2}
        visible={true}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[radius, wSeg, hSeg]} />
        <meshPhysicalMaterial
          color={materialColor}
          map={surfaceMap}
          normalMap={normalMap ?? undefined}
          normalScale={normalMap ? normalScale : undefined}
          bumpMap={!normalMap ? surfaceMap : undefined}
          bumpScale={!normalMap ? atlasBumpScale ?? radius * (hasRealTexture ? 0.026 : 0.011) : 0}
          roughnessMap={roughnessMap ?? undefined}
          roughness={materialRoughness}
          metalness={metalness}
          emissive={textureEmissiveColor}
          emissiveMap={hasRealTexture && selected ? surfaceMap : undefined}
          emissiveIntensity={
            atlasSurface
              ? Math.max(atlasTextureFillRuntime ?? (v55GasArt ? 0.036 : 0.055), v152EarthInspect ? SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.earth.minimumTextureEmissive : v55GasArt ? Math.min(atlasEmissiveIntensity ?? 0, 0.045) : atlasEmissiveIntensity ?? 0)
              : Math.max(
                  emissiveIntensity * (selected ? (v55GasArt || v55EarthCloudNight ? 0.13 : 0.22) : 0.28),
                  selected ? (hasRealTexture ? (v55GasArt ? 0.058 : v55EarthCloudNight ? 0.048 : 0.105) : 0.08) : 0,
                )
          }
          envMapIntensity={materialEnvMapIntensity}
          clearcoat={atlasSurface ? (atlasTerrestrial ? (v55EarthCloudNight ? 0.035 : v49EarthMaterial ? 0.045 : 0.08) : v55GasArt ? 0.018 : 0.035) : selected ? (v55GasArt ? 0.04 : v55EarthCloudNight ? 0.085 : v49EarthMaterial ? 0.11 : 0.18) : showAtmosphere ? 0.14 : 0.035}
          clearcoatRoughness={showAtmosphere ? (cinematicCloseup ? (v55EarthCloudNight ? 0.68 : v49EarthMaterial ? 0.62 : 0.5) : 0.42) : v55GasArt ? 0.96 : 0.82}
          sheen={showAtmosphere ? (cinematicCloseup ? (v55EarthCloudNight ? 0.055 : v49AtmosphereDepth ? 0.075 : 0.1) : 0.13) : v55GasArt ? 0.014 : 0.026}
          sheenRoughness={0.72}
          wireframe={false}
        />
      </mesh>
      {selected && hasRealTexture && selectedSurfaceFillOpacity > 0 ? (
        <mesh ref={selectedFillRef} renderOrder={2.66} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.0016, wSeg, hSeg]} />
          <meshBasicMaterial
            map={surfaceMap}
            color={selectedSurfaceFillColor}
            transparent
            opacity={selectedSurfaceFillOpacity}
            depthWrite={false}
            depthTest
            toneMapped={false}
            blending={v152EarthInspect ? THREE.AdditiveBlending : THREE.NormalBlending}
          />
        </mesh>
      ) : null}
      {selected && hasRealTexture && (v51GasKeyFill || v55GasArt) ? (
        <mesh renderOrder={2.72} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.0025, wSeg, hSeg]} />
          <primitive object={keyLightFillMaterial} attach="material" />
        </mesh>
      ) : null}
      {depthLightingLayerActive ? (
        <mesh renderOrder={2.86} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.0032, wSeg, hSeg]} />
          <primitive object={depthLightingMaterial} attach="material" />
        </mesh>
      ) : null}
      {colorGradeLayerActive ? (
        <mesh renderOrder={2.9} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.0038, wSeg, hSeg]} />
          <primitive object={colorGradeMaterial} attach="material" />
        </mesh>
      ) : null}
      {!showAtmosphere ? (
        <mesh renderOrder={3} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.01, wSeg, hSeg]} />
          <primitive object={limbMaterial} attach="material" />
        </mesh>
      ) : null}
      {spriteTex ? (
        <sprite ref={spriteRef} visible={false} renderOrder={2}>
          <spriteMaterial
            map={spriteTex}
            color={atlasSpriteColor}
            transparent
            opacity={atlasSpriteOpacity}
            toneMapped={false}
            depthTest
            depthWrite={false}
            blending={atlasSpriteBlending}
          />
        </sprite>
      ) : null}
      {showAtmosphere ? (
        <EarthAtmosphereGlow
          radius={radius}
          atmosphereColor={atmosphereColor}
          atmospherePower={selected ? 3.85 : 3.25}
          atmosphereIntensity={
            bodyId === "earth"
              ? selected ? (v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.atmosphereIntensity : v52EarthDepth ? 0.22 : v51EarthKeyBalance ? 0.29 : v49EarthMaterial ? 0.27 : cinematicEarth ? 0.34 : 0.42) : 0.32
              : v49GasMaterial || cinematicGasGiant || atlasGasGiant || v55GasArt
                ? selected ? v55GasArt ? 0.115 : v52GasDepth ? 0.155 : v51GasKeyFill ? 0.205 : v50GasPortrait ? 0.17 : v49GasMaterial ? 0.13 : referenceGasGiantMaterial ? 0.16 : 0.2 : 0.12
                : selected ? (v49AtmosphereDepth ? 0.14 : 0.26) : 0.18
          }
        />
      ) : null}
      {clouds ? (
        <mesh ref={cloudsRef} renderOrder={4} frustumCulled={false}>
          <sphereGeometry args={[radius * (v55EarthCloudNight ? 1.006 : 1.008), wSeg, hSeg]} />
          <meshStandardMaterial
            map={clouds}
            alphaMap={cloudAlphaMap ?? undefined}
            transparent
            opacity={selected ? (v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.cloudOpacity : v53EarthColor ? 0.36 : v49EarthMaterial ? 0.38 : cinematicEarth ? referenceCloseupMaterial ? 0.5 : 0.44 : 0.54) : 0.34}
            depthWrite={false}
            depthTest
            metalness={0}
            roughness={1}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ) : null}
      {bandMask && selected && (v49GasMaterial || v51GasKeyFill || v52GasDepth || v55GasArt) ? (
        <mesh ref={bandMaskRef} renderOrder={3.25} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.002, wSeg, hSeg]} />
          <meshBasicMaterial
            map={bandMask}
          color={v55GasArt ? (v55SaturnGasArt ? "#d1b982" : "#f0bf86") : v51SaturnKeyFill ? "#dfc38b" : "#d8c4a4"}
          transparent
            opacity={v152JupiterInspect ? SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS.jupiter.bandMaskOpacity : v55GasArt ? (v55SaturnGasArt ? 0.2 : V76_CLOSEUP_VISUAL_BUDGETS.jupiter.bandMaskOpacity) : v52GasDepth ? (v52SaturnDepth ? 0.12 : 0.14) : v51GasKeyFill ? (v51SaturnKeyFill ? 0.085 : 0.105) : v50GasPortrait ? 0.18 : 0.105}
            blending={v55GasArt ? THREE.AdditiveBlending : v51GasKeyFill ? THREE.AdditiveBlending : THREE.MultiplyBlending}
            depthWrite={false}
            depthTest
            toneMapped={false}
          />
        </mesh>
      ) : null}
      {nightMap ? (
        <mesh ref={nightLayerRef} renderOrder={4} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.004, wSeg, hSeg]} />
          <primitive object={nightSideMaterial} attach="material" />
        </mesh>
      ) : null}
      {label ? (
        <BodyLabel
          text={label}
          position={[0, radius * 1.32, 0]}
          fadeNear={labelFadeNear}
          fadeFar={labelFadeFar}
          distanceFactor={labelDistanceFactor}
          fontSizePx={labelFontSizePx}
          bodyIndex={labelBodyIndex}
          surfaceFadeNear={labelSurfaceFadeNear}
          surfaceFadeFar={labelSurfaceFadeFar}
          lodDiscWorldRadius={labelLodDiscWorldRadius ?? radius}
        />
      ) : null}
    </group>
  );
}
