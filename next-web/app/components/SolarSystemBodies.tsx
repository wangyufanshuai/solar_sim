"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, type MutableRefObject } from "react";
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
import { textureManifestEntryForBodyId } from "../data/planetTextureManifest";
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

function SaturnRings({ radiusScene }: { radiusScene: number }) {
  return (
    <group>
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
          opacity={0.58}
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
          opacity={0.12}
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
          opacity={0.45}
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
  globalSelectedBodyIndex,
  physicsRef,
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
}) {
  const diffuseMap = useOptionalTexture(def.textureMap);
  const normalMap = useOptionalDataTexture(def.normalMap);
  const manifest = useMemo(() => textureManifestEntryForBodyId(def.id), [def.id]);
  const cloudMap = useOptionalTexture(manifest?.clouds);
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const spinAngleRef = useRef(0);
  const trailRef = useRef<OrbitTrailHandle>(null);
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
  const visualRadius =
    earthMoonView && def.id === "earth"
      ? def.radiusScene * EARTH_MOON_VIEW_MESH_SCALE.earth
      : earthMoonView && def.id === "moon"
        ? def.radiusScene * EARTH_MOON_VIEW_MESH_SCALE.moon
        : def.radiusScene;

  const labelText =
    showBodyLabels && MAJOR_BODY_LABEL_IDS.has(def.id) ? def.name : undefined;

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
        {def.showRings ? <SaturnRings radiusScene={def.radiusScene} /> : null}
        <CelestialBody
          variant="planet"
          radius={visualRadius}
          position={[0, 0, 0]}
          color={def.color}
          map={diffuseMap}
          normalMap={normalMap}
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
          spinAngleRef={spinAngleRef}
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
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  onSelectBody: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  selectedBodyIndex: number | null;
  earthMoonView: boolean;
  viewSettings: SimulationViewSettings;
  simDaysRef: MutableRefObject<number>;
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
          globalSelectedBodyIndex={selectedBodyIndex}
          physicsRef={physicsRef}
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
