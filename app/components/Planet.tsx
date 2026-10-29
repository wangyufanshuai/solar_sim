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
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import { useOptionalLabelOcclusion } from "../context/LabelOcclusionContext";
import {
  DEFAULT_SPHERE_SEGMENTS,
  getSharedPlanetGlowTexture,
  MIN_PLANET_ICON_PX,
  SPRITE_LOD_ENTER_PX,
  SPRITE_LOD_EXIT_PX,
} from "../lib/celestialTextures";
import { V76_CLOSEUP_VISUAL_BUDGETS } from "../lib/atlasCloseupVisualFidelity";
import { SCIENTIFIC_VISUAL_FIDELITY_V152_BUDGETS } from "../lib/scientificVisualFidelityV152";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import { usePlanetPresentationMaterials } from "./usePlanetPresentationMaterials";

const _nightLayerWorldPos = new THREE.Vector3();

import type { PlanetBodyProps } from "./PlanetBodyProps";
export type { PlanetBodyProps } from "./PlanetBodyProps";

export default function Planet({
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
  const visualRendererProfile = useAtlasRuntimeStore(
    (snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile),
  );
  useAtlasVisualRuntimeConsumerV300({
    profile: visualRendererProfile.id,
    group: "solar",
    consumer: "Planet",
    tokenSignature: createAtlasVisualTokenSignatureV300(visualRendererProfile.groups.solar),
  });
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
        nightSideMaterial.uniforms.uOpacity.value = (selected
        ? v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.nightLayerOpacity : cinematicEarth ? referenceCloseupMaterial ? 0.52 : 0.64 : 0.68
        : 0.42) * visualRendererProfile.groups.solar.nightSideExposure;
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

  const {
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
  } = usePlanetPresentationMaterials({
    bodyId, radius, map,
    color, emissive, emissiveIntensity,
    roughness, envMapIntensity, selected,
    terminatorSoftness: visualRendererProfile.groups.solar.terminatorSoftness,
    showAtmosphere, nightMap, nightMaskMap,
    atlasVisualProfile, cinematicLightingProfile, referenceGradePlanetMaterialProfile,
    selectedBodyMaterialProfile, selectedBodyAtmosphereDepthProfile, selectedBodyTerminatorProfile,
    selectedBodyKeyLightProfile, selectedBodyDepthLightingProfile, selectedBodyColorGradeProfile,
    selectedBodyGasGiantArtProfile, selectedBodyEarthCloudNightProfile, globalColorGradeProfile,
    closeupCompositionProfile, baseColorStore, baseEmissiveStore,
  });

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
          roughness={Math.max(
            visualRendererProfile.planetRoughnessMinimum,
            materialRoughness * visualRendererProfile.planetRoughnessMultiplier,
          )}
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
          envMapIntensity={Math.min(
            visualRendererProfile.planetEnvironmentMaximum,
            materialEnvMapIntensity + visualRendererProfile.planetEnvironmentOffset,
          )}
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
            opacity={(selected ? (v55EarthCloudNight ? V76_CLOSEUP_VISUAL_BUDGETS.earth.cloudOpacity : v53EarthColor ? 0.36 : v49EarthMaterial ? 0.38 : cinematicEarth ? referenceCloseupMaterial ? 0.5 : 0.44 : 0.54) : 0.34) * visualRendererProfile.groups.solar.cloudOpacity}
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
