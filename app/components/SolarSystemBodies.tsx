"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import CelestialBody from "./CelestialBody";
import OrbitTrail, { type OrbitTrailHandle } from "./OrbitTrail";
import {
  AU_TO_SCENE,
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
  resolveTieredPlanetTextureManifest,
  tieredTextureManifestEntryForBodyId,
} from "../data/planetTextureManifest";
import { useOptionalDataTexture, useOptionalTieredTexture } from "../lib/useOptionalTexture";
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
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";
import { closeupLightingProfile } from "../lib/closeupLightingProfile";
import { solarOcclusionFactor } from "../lib/solarOcclusion";

const SOLAR_BODY_IDS = SOLAR_SYSTEM_BODIES.map((body) => body.id);

function createSaturnRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const center = canvas.width / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.445, "rgba(0,0,0,0)");
  gradient.addColorStop(0.46, "rgba(128,112,86,0.06)");
  gradient.addColorStop(0.51, "rgba(172,154,120,0.2)");
  gradient.addColorStop(0.61, "rgba(218,199,158,0.48)");
  gradient.addColorStop(0.72, "rgba(235,219,178,0.7)");
  gradient.addColorStop(0.79, "rgba(218,199,157,0.58)");
  gradient.addColorStop(0.802, "rgba(30,26,22,0.18)");
  gradient.addColorStop(0.83, "rgba(18,16,14,0.12)");
  gradient.addColorStop(0.845, "rgba(214,196,150,0.58)");
  gradient.addColorStop(0.93, "rgba(174,151,110,0.32)");
  gradient.addColorStop(0.985, "rgba(112,96,72,0.1)");
  gradient.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function SaturnRings({
  radiusScene,
  bodyIndex,
  physicsRef,
  litOpacity = VISUAL_CALIBRATION.closeups.saturn.ringLitOpacity,
  darkOpacity = VISUAL_CALIBRATION.closeups.saturn.ringDarkOpacity,
  phaseContrast = VISUAL_CALIBRATION.closeups.saturn.ringPhaseContrast,
}: {
  radiusScene: number;
  bodyIndex: number;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  litOpacity?: number;
  darkOpacity?: number;
  phaseContrast?: number;
}) {
  const ringTexture = useMemo(() => (typeof document === "undefined" ? null : createSaturnRingTexture()), []);
  const mainMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const occlusionFrameRef = useRef(0);
  useFrame(() => {
    if (!mainMaterialRef.current) return;
    occlusionFrameRef.current += 1;
    if (occlusionFrameRef.current % 12 !== 1) return;
    const visibility = solarOcclusionFactor(physicsRef.current, bodyIndex, SOLAR_BODY_IDS);
    mainMaterialRef.current.opacity = litOpacity * (0.14 + (0.86 + phaseContrast * 0.18) * visibility);
  });
  return (
    <group rotation={[0.34, 0.08, -0.2]}>
      {ringTexture ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={6} castShadow receiveShadow>
          <ringGeometry args={[radiusScene * 1.11, radiusScene * 2.43, 192]} />
          <meshStandardMaterial
            ref={mainMaterialRef}
            map={ringTexture}
            transparent
            opacity={litOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            metalness={0}
            roughness={0.9}
          />
        </mesh>
      ) : null}
      {ringTexture ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={7}>
          <ringGeometry args={[radiusScene * 1.11, radiusScene * 2.43, 192]} />
          <meshBasicMaterial
            map={ringTexture}
            color="#d8c49b"
            transparent
            opacity={litOpacity * (0.38 + phaseContrast * 0.24)}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped
          />
        </mesh>
      ) : null}
      {/* D Ring — faint inner ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.11, radiusScene * 1.24, 96]} />
        <meshStandardMaterial
          color="#9a8e78"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={1}
        />
      </mesh>
      {/* C Ring — semi-transparent */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.24, radiusScene * 1.53, 96]} />
        <meshStandardMaterial
          color="#b8a888"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={0.95}
        />
      </mesh>
      {/* B Ring — brightest, main ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.53, radiusScene * 1.95, 96]} />
        <meshStandardMaterial
          color="#d4c4a4"
          transparent
          opacity={0.58 + phaseContrast * 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.02}
          roughness={0.92}
        />
      </mesh>
      {/* Cassini Division gap — dark ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.95, radiusScene * 2.02, 96]} />
        <meshStandardMaterial
          color="#3a352e"
          transparent
          opacity={darkOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={1}
        />
      </mesh>
      {/* A Ring — second brightest */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 2.02, radiusScene * 2.27, 96]} />
        <meshStandardMaterial
          color="#c8b898"
          transparent
          opacity={0.45 + phaseContrast * 0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.02}
          roughness={0.94}
        />
      </mesh>
      {/* Encke Gap + F Ring — faint outer */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 2.30, radiusScene * 2.42, 96]} />
        <meshStandardMaterial
          color="#a89878"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={0.98}
        />
      </mesh>
    </group>
  );
}

/** Per-body refs needed for position updates, stored in a flat array. */
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
  renderBudget,
  highQualityRendering,
  visualTest,
  globalSelectedBodyIndex,
  physicsRef,
  closeupPresentationRef,
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
  renderBudget: SimulationViewSettings["renderBudget"];
  highQualityRendering: boolean;
  visualTest: boolean;
  globalSelectedBodyIndex: number | null;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  closeupPresentationRef?: MutableRefObject<boolean>;
}) {
  const qualityOnInspect =
    !visualTest &&
    isSelected &&
    ["sun", "earth", "moon", "jupiter", "saturn"].includes(def.id);
  const preferQuality = qualityOnInspect || (highQualityRendering && isSelected && def.variant === "planet");
  const tieredManifest = useMemo(() => tieredTextureManifestEntryForBodyId(def.id), [def.id]);
  const resolvedManifest = useMemo(
    () => resolveTieredPlanetTextureManifest(def.id, renderBudget, preferQuality),
    [def.id, preferQuality, renderBudget],
  );
  const diffuseMap = useOptionalTieredTexture({
    previewUrl: tieredManifest.albedo?.preview ?? resolvedManifest.albedo,
    qualityUrl: tieredManifest.albedo?.quality,
    preferQuality,
    previewPriority: "visible",
    qualityPriority: "upgrade",
  });
  const normalMap = useOptionalDataTexture(def.normalMap);
  const cloudMap = useOptionalTieredTexture({
    previewUrl: tieredManifest.clouds?.preview,
    qualityUrl: tieredManifest.clouds?.quality,
    preferQuality,
    previewPriority: "idle",
    qualityPriority: "upgrade",
  });
  const nightMap = useOptionalTieredTexture({
    previewUrl: tieredManifest.night?.preview,
    qualityUrl: tieredManifest.night?.quality,
    preferQuality,
    previewPriority: "idle",
    qualityPriority: "upgrade",
  });
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const spinAngleRef = useRef(0);
  const trailRef = useRef<OrbitTrailHandle>(null);
  const trailGroupRef = useRef<THREE.Group>(null);
  const trailCfg = orbitTrailParams(def);
  const spinRadPerSimDay = useMemo(
    () => siderealSpinRadPerSimDayForBodyId(def.id) ?? 0,
    [def.id],
  );
  useFrame(() => {
    if (trailGroupRef.current) {
      trailGroupRef.current.visible = !closeupPresentationRef?.current || isSelected;
    }
  });

  // Wire up refs for centralized position updates
  bodyRefs.group = groupRef.current;
  bodyRefs.visual = visualRef.current;
  bodyRefs.trail = null; // set via ref callback below
  bodyRefs.spinRadPerSimDay = spinRadPerSimDay;
  bodyRefs.spinAngleRef = spinAngleRef;

  /** Smart LOD: decide whether this body should show its orbit trail. */
  const shouldShowTrail = (() => {
    if (trailCfg.maxPoints === 0) return false;
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
  const closeupProfile = closeupLightingProfile(def.id, isSelected || preferQuality);
  const planetRoughness = closeupProfile.roughness ?? preset?.roughness ?? 0.82;
  const planetMetalness = preset?.metalness ?? 0.04;
  const baseEmissive = preset?.emissiveIntensity ?? 0.1;
  const planetEmissiveIntensity =
    def.radiusScene < 0.026 ? baseEmissive * 1.5 : baseEmissive;

  const earthMoonMesh =
    earthMoonView && (def.id === "earth" || def.id === "moon");
  const visualRadius =
    earthMoonView && def.id === "earth"
      ? def.radiusScene * EARTH_MOON_VIEW_MESH_SCALE.earth
      : earthMoonView && def.id === "moon"
        ? def.radiusScene * EARTH_MOON_VIEW_MESH_SCALE.moon
        : def.radiusScene;

  const labelText =
    showBodyLabels && (isSelected || MAJOR_BODY_LABEL_IDS.has(def.id)) ? def.name : undefined;

  if (def.variant === "sun") {
    const sunVisualRadius = def.radiusScene * 0.62;
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
          />
        </group>
      </group>
    );
  }

  return (
    <group ref={(g) => { (groupRef as React.MutableRefObject<THREE.Group | null>).current = g; bodyRefs.group = g; }} frustumCulled={false}>
      {showOrbitTrails && shouldShowTrail ? (
        <group ref={trailGroupRef}>
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
        </group>
      ) : null}
      <group ref={visualRef} frustumCulled={false}>
        {def.showRings ? (
          <SaturnRings
            radiusScene={def.radiusScene}
            bodyIndex={bodyIndex}
            physicsRef={physicsRef}
            litOpacity={closeupProfile.ringLitOpacity}
            darkOpacity={closeupProfile.ringDarkOpacity}
            phaseContrast={closeupProfile.ringPhaseContrast}
          />
        ) : null}
        <CelestialBody
          variant="planet"
          bodyId={def.id}
          radius={visualRadius}
          position={[0, 0, 0]}
          color={def.color}
          map={diffuseMap}
          nightMap={nightMap}
          normalMap={normalMap}
          emissive={def.color}
          emissiveIntensity={planetEmissiveIntensity}
          envMapIntensity={0.24}
          calibratedEnvMapIntensity={closeupProfile.envMapIntensity}
          calibratedFillIntensity={closeupProfile.fillIntensity}
          calibratedRimIntensity={closeupProfile.rimIntensity}
          calibratedBandContrast={closeupProfile.bandContrast ?? closeupProfile.ringPhaseContrast}
          calibratedCloudSilverLining={closeupProfile.cloudSilverLining}
          calibratedNightTerminatorCutoff={closeupProfile.nightTerminatorCutoff}
          normalScaleIntensity={closeupProfile.normalScale}
          roughness={planetRoughness}
          metalness={planetMetalness}
          sunCastPointLight={false}
          sphereSegments={sphereSegments}
          label={labelText}
          labelBodyIndex={bodyIndex}
          labelFadeNear={earthMoonMesh ? 400 : labelTier.fadeNear}
          labelFadeFar={earthMoonMesh ? 52000 : labelTier.fadeFar}
          labelSurfaceFadeNear={visualRadius * 4}
          labelSurfaceFadeFar={visualRadius * 8}
          labelDistanceFactor={
            earthMoonMesh && def.id === "moon"
              ? 172_000
              : earthMoonMesh && def.id === "earth"
                ? 162_000
                : labelTier.distanceFactor
          }
          labelFontSizePx={earthMoonMesh ? 560_000 : labelTier.fontSizePx}
          labelLodDiscWorldRadius={visualRadius}
          selected={isSelected}
          onBodyPointerDown={() => onBodyCanvasPick(bodyIndex)}
          onBodyDoubleClick={() => onSelectBody(bodyIndex)}
          opticsBodyIndex={showRelativisticOptics ? bodyIndex : undefined}
          opticsPhysicsRef={showRelativisticOptics ? physicsRef : undefined}
          showAtmosphere={!!def.atmosphereColor}
          atmosphereColor={def.atmosphereColor}
          clouds={cloudMap}
          illuminationBodyIndex={bodyIndex}
          illuminationPhysicsRef={physicsRef}
          spinAngleRef={spinAngleRef}
        />
      </group>
    </group>
  );
}

const _tmpPos = new THREE.Vector3();

function ContextOrbitGate({
  closeupPresentationRef,
  selected,
  children,
}: {
  closeupPresentationRef?: MutableRefObject<boolean>;
  selected: boolean;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = !closeupPresentationRef?.current || selected;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

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
  visualTest = false,
  closeupPresentationRef,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  onSelectBody: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  selectedBodyIndex: number | null;
  earthMoonView: boolean;
  viewSettings: SimulationViewSettings;
  simDaysRef: MutableRefObject<number>;
  visualTest?: boolean;
  closeupPresentationRef?: MutableRefObject<boolean>;
}) {
  // Pre-allocate refs array — one entry per body, persists across renders
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

  // Single useFrame updates ALL body positions — replaces 102 individual useFrame hooks
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
      const [sx, sy, sz] = applyFloatingOffsetScene(
        p.posAu[k]!,
        p.posAu[k + 1]!,
        p.posAu[k + 2]!,
        origin
      );
      _tmpPos.set(sx, sy, sz);
      g.position.copy(_tmpPos);

      if (r.isPlanet && r.trail) {
        r.trail.updatePosition(_tmpPos);
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
          renderBudget={viewSettings.renderBudget}
          highQualityRendering={viewSettings.highQualityRendering}
          visualTest={visualTest}
          globalSelectedBodyIndex={selectedBodyIndex}
          physicsRef={physicsRef}
          closeupPresentationRef={closeupPresentationRef}
        />
      ))}
      {SOLAR_SYSTEM_BODIES.map((def, bodyIndex) => {
        if (def.variant !== "planet" || !viewSettings.showOsculatingOrbits) {
          return null;
        }
        const central =
          def.osculatingCentralBodyIndex ??
          (def.heliocentricOsculatingOrbit === false ? null : 0);
        if (central === null) return null;
        return (
          <ContextOrbitGate
            key={`osc-${def.id}`}
            closeupPresentationRef={closeupPresentationRef}
            selected={selectedBodyIndex === bodyIndex}
          >
            <OsculatingOrbitEllipse
              bodyIndex={bodyIndex}
              bodyId={def.id}
              centralBodyIndex={central}
              physicsRef={physicsRef}
              lodWorldRadius={def.radiusScene}
              selected={selectedBodyIndex === bodyIndex}
            />
          </ContextOrbitGate>
        );
      })}
    </>
  );
}
