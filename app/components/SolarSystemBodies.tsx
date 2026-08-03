"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import CelestialBody from "./CelestialBody";
import OrbitTrail, { type OrbitTrailHandle } from "./OrbitTrail";
import {
  EARTH_MOON_VIEW_MESH_SCALE,
  MAJOR_BODY_LABEL_IDS,
  MAJOR_PLANET_IDS,
  SOLAR_SYSTEM_BODIES,
  orbitTrailParams,
  type SolarSystemBodyDef,
} from "../data/planetsJ2000";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import { planetMaterialPreset } from "../lib/planetMaterialPresets";
import {
  hdTextureManifestEntryForBodyId,
  textureManifestEntryForBodyId,
  v49TextureManifestEntryForBodyId,
} from "../data/planetTextureManifest";
import { useOptionalDataTexture, useOptionalTexture } from "../lib/useOptionalTexture";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import {
  bodyVisualBandForDef,
  labelParamsForBand,
  TRAIL_ALWAYS_VISIBLE_IDS,
} from "../lib/bodyVisualTier";
import OsculatingOrbitEllipse from "./OsculatingOrbitEllipse";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { applyFloatingOffsetScene } from "../lib/floatingOrigin";
import { siderealSpinRadPerSimDayForBodyId } from "../lib/planetSiderealSpin";
import {
  mapOrbitAtlasPositionAu,
  orbitAtlasBodyDisplayRadius,
  orbitAtlasBodyVisualProfile,
  type OrbitAtlasScaleMode,
  type SolarPresentationMode,
} from "../lib/orbitAtlasPresentation";
import type {
  AtlasCloseupCompositionProfile,
  AtlasCloseupRingShowcaseProfile,
  AtlasReferenceGradePlanetMaterialProfile,
  AtlasSelectedBodyAtmosphereDepthProfile,
  AtlasSelectedBodyColorGradeProfile,
  AtlasSelectedBodyDepthLightingProfile,
  AtlasSelectedBodyKeyLightProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasSelectedBodyMaterialProfile,
  AtlasSelectedBodyRingProfile,
  AtlasSelectedBodyTerminatorProfile,
  AtlasSelectedBodyGasGiantArtProfile,
  AtlasSelectedBodySaturnRingArtProfile,
  AtlasSelectedBodyEarthCloudNightProfile,
  AtlasSelectedBodySolarSurfaceProfile,
  AtlasGlobalColorGradeProfile,
} from "../lib/simulationDiagnosticsTypes";

import { SaturnRings } from "./SaturnRingLayers";

type BodyRefs = {
  group: THREE.Group | null;
  visual: THREE.Group | null;
  trail: OrbitTrailHandle | null;
  isPlanet: boolean;
  spinRadPerSimDay: number;
  spinAngleRef: MutableRefObject<number> | null;
};

function BodyShell({
  def,
  bodyIndex,
  bodyRefs,
  onSelectBody,
  onBodyCanvasPick,
  isSelected,
  earthMoonView,
  showOrbitTrails,
  showBodyLabels,
  showRelativisticOptics,
  globalSelectedBodyIndex,
  physicsRef,
  presentationMode,
  atlasScaleMode,
  closeupOrbitBudgetActive,
  selectedBodyLightingProfile,
  referenceGradePlanetMaterialProfile,
  selectedBodyMaterialProfile,
  selectedBodyAtmosphereDepthProfile,
  selectedBodyTerminatorProfile,
  selectedBodyRingProfile,
  selectedBodyKeyLightProfile,
  selectedBodyDepthLightingProfile,
  selectedBodyColorGradeProfile,
  selectedBodyGasGiantArtProfile,
  selectedBodySaturnRingArtProfile,
  selectedBodyEarthCloudNightProfile,
  selectedBodySolarSurfaceProfile,
  globalColorGradeProfile,
  closeupCompositionProfile,
  closeupRingShowcaseProfile,
}: {
  def: SolarSystemBodyDef;
  bodyIndex: number;
  bodyRefs: BodyRefs;
  onSelectBody: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  isSelected: boolean;
  earthMoonView: boolean;
  showOrbitTrails: boolean;
  showBodyLabels: boolean;
  showRelativisticOptics: boolean;
  globalSelectedBodyIndex: number | null;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  presentationMode: SolarPresentationMode;
  atlasScaleMode: OrbitAtlasScaleMode;
  closeupOrbitBudgetActive?: boolean;
  selectedBodyLightingProfile: AtlasSelectedBodyLightingProfile;
  referenceGradePlanetMaterialProfile: AtlasReferenceGradePlanetMaterialProfile;
  selectedBodyMaterialProfile: AtlasSelectedBodyMaterialProfile;
  selectedBodyAtmosphereDepthProfile: AtlasSelectedBodyAtmosphereDepthProfile;
  selectedBodyTerminatorProfile: AtlasSelectedBodyTerminatorProfile;
  selectedBodyRingProfile: AtlasSelectedBodyRingProfile;
  selectedBodyKeyLightProfile: AtlasSelectedBodyKeyLightProfile;
  selectedBodyDepthLightingProfile: AtlasSelectedBodyDepthLightingProfile;
  selectedBodyColorGradeProfile: AtlasSelectedBodyColorGradeProfile;
  selectedBodyGasGiantArtProfile: AtlasSelectedBodyGasGiantArtProfile;
  selectedBodySaturnRingArtProfile: AtlasSelectedBodySaturnRingArtProfile;
  selectedBodyEarthCloudNightProfile: AtlasSelectedBodyEarthCloudNightProfile;
  selectedBodySolarSurfaceProfile: AtlasSelectedBodySolarSurfaceProfile;
  globalColorGradeProfile: AtlasGlobalColorGradeProfile;
  closeupCompositionProfile: AtlasCloseupCompositionProfile;
  closeupRingShowcaseProfile: AtlasCloseupRingShowcaseProfile;
}) {
  const atlasCompressed = presentationMode === "orbit-atlas" && atlasScaleMode === "compressed";
  const useHdTexture = isSelected;
  const useV49Material = isSelected;
  const manifest = useMemo(() => textureManifestEntryForBodyId(def.id), [def.id]);
  const hdManifest = useMemo(() => hdTextureManifestEntryForBodyId(def.id), [def.id]);
  const v49Manifest = useMemo(() => v49TextureManifestEntryForBodyId(def.id), [def.id]);
  const diffuseMap = useOptionalTexture(
    useV49Material
      ? v49Manifest.albedo ?? hdManifest.albedo ?? def.textureMap
      : useHdTexture
        ? hdManifest.albedo ?? def.textureMap
        : def.textureMap,
  );
  const normalMap = useOptionalDataTexture(def.normalMap);
  const roughnessMap = useOptionalDataTexture(useV49Material ? v49Manifest.roughness : undefined);
  const cloudMap = useOptionalTexture(
    useV49Material
      ? v49Manifest.clouds ?? hdManifest.clouds ?? manifest.clouds
      : useHdTexture
        ? hdManifest.clouds ?? manifest.clouds
        : manifest.clouds,
  );
  const cloudAlphaMap = useOptionalDataTexture(useV49Material ? v49Manifest.cloudAlpha : undefined);
  const nightMap = useOptionalTexture(
    useV49Material
      ? v49Manifest.night ?? hdManifest.night ?? manifest.night
      : useHdTexture
        ? hdManifest.night ?? manifest.night
        : manifest.night,
  );
  const nightMaskMap = useOptionalDataTexture(useV49Material ? v49Manifest.nightMask : undefined);
  const bandMaskMap = useOptionalDataTexture(useV49Material ? v49Manifest.bandMask : undefined);
  const ringColorMap = useOptionalTexture(useV49Material ? v49Manifest.ringColorMap : undefined);
  const ringAlphaMap = useOptionalDataTexture(useV49Material ? v49Manifest.ringAlphaMap : undefined);
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const spinAngleRef = useRef(0);
  const trailCfg = orbitTrailParams(def);
  const spinRadPerSimDay = useMemo(
    () => siderealSpinRadPerSimDayForBodyId(def.id) ?? 0,
    [def.id],
  );

  // Wire up refs for centralized position updates
  bodyRefs.group = groupRef.current;
  bodyRefs.visual = visualRef.current;
  bodyRefs.trail = null; // set via ref callback below
  bodyRefs.spinRadPerSimDay = spinRadPerSimDay;
  bodyRefs.spinAngleRef = spinAngleRef;

  /** Smart LOD: decide whether this body should show its orbit trail. */
  const shouldShowTrail = (() => {
    if (trailCfg.maxPoints === 0) return false;
    if (presentationMode === "orbit-atlas" && closeupOrbitBudgetActive) return false;
    if (MAJOR_PLANET_IDS.has(def.id)) return true;
    if (def.variant === "sun") return false;
    if (TRAIL_ALWAYS_VISIBLE_IDS.has(def.id)) return true;
    if (def.osculatingCentralBodyIndex !== null) {
      return globalSelectedBodyIndex === def.osculatingCentralBodyIndex;
    }
    return isSelected;
  })();

  const band = bodyVisualBandForDef(def);
  const labelTier = labelParamsForBand(band);

  // Reduced segments: major planets 64, small bodies 24-32
  const isMajor = def.variant === "sun" || MAJOR_PLANET_IDS.has(def.id);
  const sphereSegments: [number, number] = isSelected
    ? (def.variant === "sun" ? [128, 96] : [128, 96])
    : isMajor
    ? (def.variant === "sun" ? [80, 56] : [72, 48])
    : def.radiusScene < 0.05
      ? [16, 16]
      : [32, 32];

  const preset =
    def.variant === "planet" ? planetMaterialPreset(def.id) : null;
  const planetRoughness = preset?.roughness ?? 0.82;
  const planetMetalness = preset?.metalness ?? 0.04;
  const baseEmissive = preset?.emissiveIntensity ?? 0.1;
  const planetEmissiveIntensity =
    def.radiusScene < 0.026 ? baseEmissive * 1.5 : baseEmissive;

  const earthMoonMesh =
    earthMoonView && (def.id === "earth" || def.id === "moon");
  const atlasBodyProfile = atlasCompressed
    ? orbitAtlasBodyVisualProfile(def.id, def.showRings)
    : undefined;
  const visualRadius = atlasCompressed
    ? orbitAtlasBodyDisplayRadius(def.id, def.radiusScene, isSelected, def.showRings)
    : earthMoonView && def.id === "earth"
      ? def.radiusScene * EARTH_MOON_VIEW_MESH_SCALE.earth
      : earthMoonView && def.id === "moon"
        ? def.radiusScene * EARTH_MOON_VIEW_MESH_SCALE.moon
        : def.radiusScene;
  const surfaceVisualRadius =
    atlasCompressed && def.showRings
      ? visualRadius * (isSelected ? 0.58 : 0.62)
      : visualRadius;
  const bodyLightingProfile = isSelected ? selectedBodyLightingProfile : "overview";
  const bodyKeyLightProfile = isSelected ? selectedBodyKeyLightProfile : "overview-natural-phase";
  const bodyDepthLightingProfile = isSelected ? selectedBodyDepthLightingProfile : "overview-no-depth-lighting";
  const bodyColorGradeProfile = isSelected ? selectedBodyColorGradeProfile : "overview-neutral-color";
  const bodyGasGiantArtProfile = isSelected ? selectedBodyGasGiantArtProfile : "overview-no-gas-giant-art";
  const bodySaturnRingArtProfile = isSelected ? selectedBodySaturnRingArtProfile : "no-ring-art-profile";
  const bodyEarthCloudNightProfile = isSelected ? selectedBodyEarthCloudNightProfile : "overview-no-earth-cloud-night-art";
  const bodySolarSurfaceProfile = isSelected ? selectedBodySolarSurfaceProfile : "overview-no-solar-surface-art";

  const labelText =
    presentationMode !== "orbit-atlas" && showBodyLabels && MAJOR_BODY_LABEL_IDS.has(def.id) ? def.name : undefined;

  if (def.variant === "sun") {
    const sunVisualRadius = atlasCompressed ? visualRadius : def.radiusScene * 0.62;
    return (
      <group ref={groupRef} frustumCulled={false}>
        <group ref={visualRef} frustumCulled={false}>
          <CelestialBody
            variant="sun"
            radius={sunVisualRadius}
            position={[0, 0, 0]}
            map={diffuseMap}
            sphereSegments={sphereSegments}
            label={labelText}
            labelBodyIndex={bodyIndex}
            labelFadeNear={labelTier.fadeNear}
            labelFadeFar={labelTier.fadeFar}
            labelDistanceFactor={labelTier.distanceFactor}
            labelFontSizePx={labelTier.fontSizePx}
            labelLodDiscWorldRadius={sunVisualRadius}
            labelSurfaceFadeNear={sunVisualRadius * 4}
            labelSurfaceFadeFar={sunVisualRadius * 8}
            pointLightIntensity={2600}
            pointLightColor="#ffd49a"
            selected={isSelected}
            onBodyPointerDown={() => onBodyCanvasPick(bodyIndex)}
            onBodyDoubleClick={() => onSelectBody(bodyIndex)}
            opticsBodyIndex={showRelativisticOptics ? bodyIndex : undefined}
            opticsPhysicsRef={showRelativisticOptics ? physicsRef : undefined}
            detailShadowBodyIndex={globalSelectedBodyIndex ?? undefined}
            detailShadowPhysicsRef={physicsRef}
            spinAngleRef={spinAngleRef}
            atlasVisualProfile={atlasBodyProfile}
            forceSurface={atlasCompressed}
            cinematicLightingProfile={bodyLightingProfile}
            referenceGradePlanetMaterialProfile={isSelected ? referenceGradePlanetMaterialProfile : "overview-local-hd"}
            selectedBodyMaterialProfile={isSelected ? selectedBodyMaterialProfile : "overview-local-material"}
            selectedBodyAtmosphereDepthProfile={isSelected ? selectedBodyAtmosphereDepthProfile : "overview-atmosphere"}
            selectedBodyTerminatorProfile={isSelected ? selectedBodyTerminatorProfile : "overview-terminator"}
            selectedBodyKeyLightProfile={bodyKeyLightProfile}
            selectedBodyDepthLightingProfile={bodyDepthLightingProfile}
            selectedBodyColorGradeProfile={bodyColorGradeProfile}
            selectedBodySolarSurfaceProfile={bodySolarSurfaceProfile}
            globalColorGradeProfile={globalColorGradeProfile}
          />
        </group>
      </group>
    );
  }

  return (
    <group ref={(g) => { (groupRef as React.MutableRefObject<THREE.Group | null>).current = g; bodyRefs.group = g; }} frustumCulled={false}>
      {showOrbitTrails && shouldShowTrail ? (
        <OrbitTrail
          ref={(r) => { bodyRefs.trail = r; }}
          bodyIndex={bodyIndex}
          bodyId={def.id}
          lodWorldRadius={visualRadius}
          maxPoints={trailCfg.maxPoints}
          minVertexDistance={trailCfg.minVertexDistance}
          selected={isSelected}
          renderOrder={-40}
        />
      ) : null}
      <group ref={visualRef} frustumCulled={false}>
        {def.showRings ? <SaturnRings radiusScene={surfaceVisualRadius} orbitAtlas={atlasCompressed} referenceGradePlanetMaterialProfile={referenceGradePlanetMaterialProfile} selectedBodyRingProfile={isSelected ? selectedBodyRingProfile : "no-ring-profile"} selectedBodyKeyLightProfile={bodyKeyLightProfile} selectedBodyDepthLightingProfile={bodyDepthLightingProfile} selectedBodyColorGradeProfile={bodyColorGradeProfile} selectedBodySaturnRingArtProfile={bodySaturnRingArtProfile} globalColorGradeProfile={globalColorGradeProfile} closeupRingShowcaseProfile={isSelected ? closeupRingShowcaseProfile : "no-ring-showcase"} ringColorMap={ringColorMap} ringAlphaMap={ringAlphaMap} /> : null}
        <CelestialBody
          variant="planet"

          bodyId={def.id}
          radius={surfaceVisualRadius}
          position={[0, 0, 0]}
          color={def.color}
          map={diffuseMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          emissive={def.color}
          emissiveIntensity={planetEmissiveIntensity}
          envMapIntensity={0.56}
          roughness={planetRoughness}
          metalness={planetMetalness}
          sunCastPointLight={false}
          sphereSegments={sphereSegments}
          label={labelText}
          labelBodyIndex={bodyIndex}
          labelFadeNear={earthMoonMesh ? 400 : labelTier.fadeNear}
          labelFadeFar={earthMoonMesh ? 52000 : labelTier.fadeFar}
          labelSurfaceFadeNear={surfaceVisualRadius * 4}
          labelSurfaceFadeFar={surfaceVisualRadius * 8}
          labelDistanceFactor={
            earthMoonMesh && def.id === "moon"
              ? 172_000
              : earthMoonMesh && def.id === "earth"
                ? 162_000
                : labelTier.distanceFactor
          }
          labelFontSizePx={earthMoonMesh ? 560_000 : labelTier.fontSizePx}
          labelLodDiscWorldRadius={surfaceVisualRadius}
          selected={isSelected}
          onBodyPointerDown={() => onBodyCanvasPick(bodyIndex)}
          onBodyDoubleClick={() => onSelectBody(bodyIndex)}
          opticsBodyIndex={showRelativisticOptics ? bodyIndex : undefined}
          opticsPhysicsRef={showRelativisticOptics ? physicsRef : undefined}
          showAtmosphere={!!def.atmosphereColor}
          atmosphereColor={def.atmosphereColor}
          clouds={cloudMap}
          cloudAlphaMap={cloudAlphaMap}
          nightMap={nightMap}
          nightMaskMap={nightMaskMap}
          bandMask={bandMaskMap}
          spinAngleRef={spinAngleRef}
          atlasVisualProfile={atlasBodyProfile}
          forceSurface={atlasCompressed && (isMajor || isSelected)}
          cinematicLightingProfile={bodyLightingProfile}
          referenceGradePlanetMaterialProfile={isSelected ? referenceGradePlanetMaterialProfile : "overview-local-hd"}
          selectedBodyMaterialProfile={isSelected ? selectedBodyMaterialProfile : "overview-local-material"}
          selectedBodyAtmosphereDepthProfile={isSelected ? selectedBodyAtmosphereDepthProfile : "overview-atmosphere"}
          selectedBodyTerminatorProfile={isSelected ? selectedBodyTerminatorProfile : "overview-terminator"}
          selectedBodyKeyLightProfile={bodyKeyLightProfile}
          selectedBodyDepthLightingProfile={bodyDepthLightingProfile}
          selectedBodyColorGradeProfile={bodyColorGradeProfile}
          selectedBodyGasGiantArtProfile={bodyGasGiantArtProfile}
          selectedBodyEarthCloudNightProfile={bodyEarthCloudNightProfile}
          globalColorGradeProfile={globalColorGradeProfile}
          closeupCompositionProfile={isSelected ? closeupCompositionProfile : "overview-no-closeup-director"}
        />
      </group>
    </group>
  );
}

const _tmpPos = new THREE.Vector3();

/**
 * Sun + planets + Moon: positions driven by `SolarSystemPhysics` (N-body + optional 1PN).
 * Uses a single centralized useFrame for all 102 bodies instead of per-body useFrame hooks.
 */
export default function SolarSystemBodies({
  physicsRef,
  floatingOriginRef,
  onSelectBody,
  onBodyCanvasPick,
  selectedBodyIndex,
  earthMoonView,
  viewSettings,
  simDaysRef,
  presentationMode,
  atlasScaleMode,
  closeupOrbitBudgetActive = false,
  selectedBodyLightingProfile = "overview",
  referenceGradePlanetMaterialProfile = "overview-local-hd",
  selectedBodyMaterialProfile = "overview-local-material",
  selectedBodyAtmosphereDepthProfile = "overview-atmosphere",
  selectedBodyTerminatorProfile = "overview-terminator",
  selectedBodyRingProfile = "no-ring-profile",
  selectedBodyKeyLightProfile = "overview-natural-phase",
  selectedBodyDepthLightingProfile = "overview-no-depth-lighting",
  selectedBodyColorGradeProfile = "overview-neutral-color",
  selectedBodyGasGiantArtProfile = "overview-no-gas-giant-art",
  selectedBodySaturnRingArtProfile = "no-ring-art-profile",
  selectedBodyEarthCloudNightProfile = "overview-no-earth-cloud-night-art",
  selectedBodySolarSurfaceProfile = "overview-no-solar-surface-art",
  globalColorGradeProfile = "overview-neutral-grade",
  closeupCompositionProfile = "overview-no-closeup-director",
  closeupRingShowcaseProfile = "no-ring-showcase",
  onReady,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  onSelectBody: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  selectedBodyIndex: number | null;
  earthMoonView: boolean;
  viewSettings: SimulationViewSettings;
  simDaysRef: MutableRefObject<number>;
  presentationMode: SolarPresentationMode;
  atlasScaleMode: OrbitAtlasScaleMode;
  closeupOrbitBudgetActive?: boolean;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  selectedBodyMaterialProfile?: AtlasSelectedBodyMaterialProfile;
  selectedBodyAtmosphereDepthProfile?: AtlasSelectedBodyAtmosphereDepthProfile;
  selectedBodyTerminatorProfile?: AtlasSelectedBodyTerminatorProfile;
  selectedBodyRingProfile?: AtlasSelectedBodyRingProfile;
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  selectedBodyGasGiantArtProfile?: AtlasSelectedBodyGasGiantArtProfile;
  selectedBodySaturnRingArtProfile?: AtlasSelectedBodySaturnRingArtProfile;
  selectedBodyEarthCloudNightProfile?: AtlasSelectedBodyEarthCloudNightProfile;
  selectedBodySolarSurfaceProfile?: AtlasSelectedBodySolarSurfaceProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  closeupCompositionProfile?: AtlasCloseupCompositionProfile;
  closeupRingShowcaseProfile?: AtlasCloseupRingShowcaseProfile;
  onReady?: () => void;
}) {
  // Pre-allocate refs array 鈥?one entry per body, persists across renders
  const refsArray = useRef<BodyRefs[]>(
    SOLAR_SYSTEM_BODIES.map((def) => ({
      group: null,
      visual: null,
      trail: null,
      isPlanet: def.variant === "planet",
      spinRadPerSimDay: siderealSpinRadPerSimDayForBodyId(def.id) ?? 0,
      spinAngleRef: null,
    }))
  );

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Single useFrame updates ALL body positions 鈥?replaces 102 individual useFrame hooks
  useFrame(() => {
    const p = physicsRef.current;
    if (!p) return;
    const origin = floatingOriginRef.current;
    const refs = refsArray.current;
    const n = SOLAR_SYSTEM_BODIES.length;

    for (let i = 0; i < n; i++) {
      const r = refs[i]!;
      const g = r.group;
      if (!g) continue;

      const k = i * 3;
      if (presentationMode === "orbit-atlas") {
        mapOrbitAtlasPositionAu(
          p.posAu[k]!,
          p.posAu[k + 1]!,
          p.posAu[k + 2]!,
          atlasScaleMode,
          _tmpPos,
        );
      } else {
        const [sx, sy, sz] = applyFloatingOffsetScene(
          p.posAu[k]!,
          p.posAu[k + 1]!,
          p.posAu[k + 2]!,
          origin
        );
        _tmpPos.set(sx, sy, sz);
      }
      g.position.copy(_tmpPos);

      if (r.isPlanet && r.trail) {
        const vx = p.velM[k]!;
        const vy = p.velM[k + 1]!;
        const vz = p.velM[k + 2]!;
        const speedKmS = Math.hypot(vx, vy, vz) / 1000;
        r.trail.updatePosition(_tmpPos, speedKmS);
      }

      if (r.spinAngleRef && r.spinRadPerSimDay !== 0) {
        r.spinAngleRef.current = r.spinRadPerSimDay * simDaysRef.current;
      }
    }
  });

  return (
    <>
      {SOLAR_SYSTEM_BODIES.map((def, bodyIndex) => (
        <BodyShell
          key={def.id}
          def={def}
          bodyIndex={bodyIndex}
          bodyRefs={refsArray.current[bodyIndex]!}
          onSelectBody={onSelectBody}
          onBodyCanvasPick={onBodyCanvasPick}
          isSelected={selectedBodyIndex === bodyIndex}
          earthMoonView={earthMoonView}
          showOrbitTrails={viewSettings.showOrbitTrails}
          showBodyLabels={viewSettings.showBodyLabels}
          showRelativisticOptics={viewSettings.showRelativisticOptics}
          globalSelectedBodyIndex={selectedBodyIndex}
          physicsRef={physicsRef}
          presentationMode={presentationMode}
          atlasScaleMode={atlasScaleMode}
          closeupOrbitBudgetActive={closeupOrbitBudgetActive}
          selectedBodyLightingProfile={selectedBodyLightingProfile}
          referenceGradePlanetMaterialProfile={referenceGradePlanetMaterialProfile}
          selectedBodyMaterialProfile={selectedBodyMaterialProfile}
          selectedBodyAtmosphereDepthProfile={selectedBodyAtmosphereDepthProfile}
          selectedBodyTerminatorProfile={selectedBodyTerminatorProfile}
          selectedBodyRingProfile={selectedBodyRingProfile}
          selectedBodyKeyLightProfile={selectedBodyKeyLightProfile}
          selectedBodyDepthLightingProfile={selectedBodyDepthLightingProfile}
          selectedBodyColorGradeProfile={selectedBodyColorGradeProfile}
          selectedBodyGasGiantArtProfile={selectedBodyGasGiantArtProfile}
          selectedBodySaturnRingArtProfile={selectedBodySaturnRingArtProfile}
          selectedBodyEarthCloudNightProfile={selectedBodyEarthCloudNightProfile}
          selectedBodySolarSurfaceProfile={selectedBodySolarSurfaceProfile}
          globalColorGradeProfile={globalColorGradeProfile}
          closeupCompositionProfile={closeupCompositionProfile}
          closeupRingShowcaseProfile={closeupRingShowcaseProfile}
        />
      ))}
      {SOLAR_SYSTEM_BODIES.map((def, bodyIndex) => {
        if (presentationMode === "orbit-atlas" || def.variant !== "planet" || !viewSettings.showOsculatingOrbits) {
          return null;
        }
        const atlasProminentOrbit = MAJOR_PLANET_IDS.has(def.id);
        if (!atlasProminentOrbit && selectedBodyIndex !== bodyIndex) {
          return null;
        }
        const central =
          def.osculatingCentralBodyIndex ??
          (def.heliocentricOsculatingOrbit === false ? null : 0);
        if (central === null) return null;
        return (
          <OsculatingOrbitEllipse
            key={`osc-${def.id}`}
            bodyIndex={bodyIndex}
            bodyId={def.id}
            centralBodyIndex={central}
            physicsRef={physicsRef}
            lodWorldRadius={def.radiusScene}
            selected={selectedBodyIndex === bodyIndex}
          />
        );
      })}
    </>
  );
}
