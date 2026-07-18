"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
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
import { V76_CLOSEUP_VISUAL_BUDGETS } from "../lib/atlasCloseupVisualFidelity";
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

function AtlasSaturnRings({
  radiusScene,
  referenceGrade = false,
  v49Ring = false,
  v50Showcase = false,
  v51RingKeyFill = false,
  v52RingDepth = false,
  v53RingColor = false,
  v55RingArt = false,
}: {
  radiusScene: number;
  referenceGrade?: boolean;
  v49Ring?: boolean;
  v50Showcase?: boolean;
  v51RingKeyFill?: boolean;
  v52RingDepth?: boolean;
  v53RingColor?: boolean;
  v55RingArt?: boolean;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: !v50Showcase,
        side: THREE.DoubleSide,
        toneMapped: !v50Showcase,
        uniforms: {
          uColorInner: { value: new THREE.Color("#8f846d") },
          uColorOuter: { value: new THREE.Color("#c2b18d") },
          uReferenceGrade: { value: referenceGrade ? 1 : 0 },
          uMaterialDepth: { value: v49Ring ? 1 : 0 },
          uShowcase: { value: v50Showcase ? 1 : 0 },
          uKeyFill: { value: v51RingKeyFill ? 1 : 0 },
          uDepthLighting: { value: v52RingDepth ? 1 : 0 },
          uColorGrade: { value: v53RingColor ? 1 : 0 },
          uV55RingArt: { value: v55RingArt ? 1 : 0 },
        },
        vertexShader: `
          varying vec2 vRingUv;
          void main() {
            vRingUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColorInner;
          uniform vec3 uColorOuter;
          uniform float uReferenceGrade;
          uniform float uMaterialDepth;
          uniform float uShowcase;
          uniform float uKeyFill;
          uniform float uDepthLighting;
          uniform float uColorGrade;
          uniform float uV55RingArt;
          varying vec2 vRingUv;
          void main() {
            float r = length(vRingUv - 0.5) * 2.0;
            float envelope = smoothstep(0.455, 0.50, r) * (1.0 - smoothstep(0.965, 1.0, r));
            float depth = max(max(uReferenceGrade, uMaterialDepth), max(max(uShowcase, uKeyFill), max(max(uDepthLighting, uColorGrade), uV55RingArt)));
            float fineBands = 0.74 + sin(r * 150.0) * mix(0.08, 0.155, depth) + sin(r * 420.0) * mix(0.035, 0.082, max(depth, uV55RingArt));
            float cassini = 1.0 - smoothstep(0.752, 0.772, r) * (1.0 - smoothstep(0.792, 0.816, r)) * mix(0.92, 0.999, max(depth, uV55RingArt));
            float cRing = mix(0.36, 0.9, smoothstep(0.50, 0.63, r));
            float outerFade = 1.0 - smoothstep(0.88, 0.98, r) * mix(0.52, 0.28, max(uMaterialDepth, uShowcase));
            vec3 color = mix(uColorInner, uColorOuter, smoothstep(0.48, 0.92, r));
            color = mix(color, color * vec3(1.08, 1.02, 0.88), uMaterialDepth * 0.42);
            color = mix(color, color * vec3(1.14, 1.08, 0.92), uShowcase * 0.46);
            float shadowBand = smoothstep(0.61, 0.68, r) * (1.0 - smoothstep(0.82, 0.9, r));
            color = mix(color, color * vec3(1.18, 1.10, 0.94), uKeyFill * 0.36);
            color = mix(color, color * mix(vec3(0.72, 0.68, 0.6), vec3(1.16, 1.08, 0.92), shadowBand), uDepthLighting * 0.32);
            color = mix(color, color * mix(vec3(0.66, 0.62, 0.54), vec3(1.20, 1.10, 0.90), smoothstep(0.54, 0.86, r)), uColorGrade * 0.22);
            color = mix(color, color * mix(vec3(0.52, 0.50, 0.48), vec3(1.26, 1.12, 0.86), smoothstep(0.50, 0.90, r)), uV55RingArt * 0.3);
            float alpha = envelope * fineBands * cassini * cRing * outerFade * mix(0.62, 0.94, depth) * mix(1.0, 1.12, uKeyFill) * mix(1.0, 1.08, uDepthLighting) * mix(1.0, 0.74, uColorGrade) * mix(1.0, ${V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.shaderArtAlphaBoost.toFixed(2)}, uV55RingArt);
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [referenceGrade, v49Ring, v50Showcase, v51RingKeyFill, v52RingDepth, v53RingColor, v55RingArt],
  );

  useEffect(() => () => material.dispose(), [material]);

  const ringRotation: [number, number, number] = [
    v50Showcase ? 0.56 : Math.PI / 2 + (v55RingArt ? 0.68 : v49Ring ? 0.72 : 0),
    v50Showcase ? 0.12 : 0,
    v50Showcase ? -0.34 : v55RingArt ? -0.22 : v49Ring ? -0.18 : 0,
  ];
  const outerRadius = radiusScene * (v50Showcase ? (v53RingColor ? 2.92 : 3.18) : v55RingArt ? 2.9 : v49Ring ? 2.62 : 2.42);

  return (
    <group>
      <mesh
        rotation={ringRotation}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.05, outerRadius, 224]} />
        <primitive object={material} attach="material" />
      </mesh>
      {v50Showcase ? (
        <mesh
          rotation={ringRotation}
          renderOrder={6}
          castShadow={false}
          receiveShadow={false}
        >
          <ringGeometry args={[radiusScene * 1.12, radiusScene * 3.24, 224]} />
          <meshBasicMaterial
            color={v53RingColor ? "#d8bd8c" : v51RingKeyFill ? "#efd7a8" : "#e4ca8d"}
            transparent
            opacity={v53RingColor ? 0.14 : v51RingKeyFill ? 0.42 : 0.48}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function SaturnRings({
  radiusScene,
  orbitAtlas = false,
  referenceGradePlanetMaterialProfile = "overview-local-hd",
  selectedBodyRingProfile = "no-ring-profile",
  selectedBodyKeyLightProfile = "overview-natural-phase",
  selectedBodyDepthLightingProfile = "overview-no-depth-lighting",
  selectedBodyColorGradeProfile = "overview-neutral-color",
  selectedBodySaturnRingArtProfile = "no-ring-art-profile",
  globalColorGradeProfile = "overview-neutral-grade",
  closeupRingShowcaseProfile = "no-ring-showcase",
  ringColorMap = null,
  ringAlphaMap = null,
}: {
  radiusScene: number;
  orbitAtlas?: boolean;
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  selectedBodyRingProfile?: AtlasSelectedBodyRingProfile;
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  selectedBodySaturnRingArtProfile?: AtlasSelectedBodySaturnRingArtProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  closeupRingShowcaseProfile?: AtlasCloseupRingShowcaseProfile;
  ringColorMap?: THREE.Texture | null;
  ringAlphaMap?: THREE.Texture | null;
}) {
  const referenceGrade = referenceGradePlanetMaterialProfile === "gas-giant-ring-readability";
  const v49Ring = selectedBodyRingProfile === "saturn-cassini-layered-ring";
  const v51RingKeyFill = selectedBodyKeyLightProfile === "saturn-ring-key-fill";
  const v52RingDepth = selectedBodyDepthLightingProfile === "saturn-ring-shadow-depth";
  const v53RingColor = selectedBodyColorGradeProfile === "saturn-ring-occlusion-color-grade";
  const v55RingArt = selectedBodySaturnRingArtProfile === "saturn-cassini-backlit-ring-art";
  const v55GlobalGrade = globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
  const v50Showcase = closeupRingShowcaseProfile === "saturn-wide-tilted-ring-showcase";
  if (orbitAtlas) return <AtlasSaturnRings radiusScene={radiusScene} referenceGrade={referenceGrade} v49Ring={v49Ring} v50Showcase={v50Showcase} v51RingKeyFill={v51RingKeyFill} v52RingDepth={v52RingDepth} v53RingColor={v53RingColor} v55RingArt={v55RingArt} />;
  const opacityMul = v50Showcase ? (v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.showcaseOpacityMultiplier : v53RingColor ? 1.72 : v51RingKeyFill ? 1.64 : 1.86) : v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.artOpacityMultiplier : v49Ring ? 1.52 : referenceGrade ? 1.18 : orbitAtlas ? 0.72 : 1;
  const mainRingColor = v55RingArt ? "#dbc08a" : v53RingColor ? "#d9c08f" : v52RingDepth ? "#dcc79b" : v51RingKeyFill ? "#e6cea0" : v50Showcase ? "#e0c990" : v49Ring ? "#d8c59a" : orbitAtlas ? "#b7aa8e" : "#d4c4a4";
  return (
    <group rotation={v50Showcase ? [-1.08, 0.12, -0.34] : v55RingArt ? [0.7, 0, -0.22] : v49Ring ? [0.72, 0, -0.18] : [0, 0, 0]}>
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
          opacity={0.15 * opacityMul}
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
          emissive={v55RingArt ? "#7e6a48" : v51RingKeyFill ? "#b89d6b" : v50Showcase ? "#9a875d" : "#000000"}
          emissiveIntensity={v55RingArt ? 0.08 : v51RingKeyFill ? 0.2 : v50Showcase ? 0.16 : 0}
          transparent
          opacity={0.28 * opacityMul}
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
        <ringGeometry args={[radiusScene * 1.53, radiusScene * (v50Showcase ? 2.12 : v49Ring ? 2.02 : 1.95), 160]} />
        <meshStandardMaterial
          color={mainRingColor}
          map={ringColorMap ?? undefined}
          alphaMap={ringAlphaMap ?? undefined}
          emissive={v51RingKeyFill ? mainRingColor : v50Showcase ? mainRingColor : "#000000"}
          emissiveIntensity={v51RingKeyFill ? 0.25 : v50Showcase ? 0.22 : 0}
          transparent
          opacity={(v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.mainRingOpacity : v50Showcase ? 0.68 : v52RingDepth ? 0.66 : 0.62) * opacityMul}
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
        <ringGeometry args={[radiusScene * 1.98, radiusScene * 2.06, 128]} />
        <meshStandardMaterial
          color={v55RingArt ? "#211d18" : "#3a352e"}
          transparent
          opacity={v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.cassiniGapOpacity : v50Showcase ? 0.08 : v49Ring ? 0.18 : orbitAtlas ? 0.2 : 0.12}
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
        <ringGeometry args={[radiusScene * 2.06, radiusScene * (v50Showcase ? 2.58 : v55RingArt ? 2.52 : v49Ring ? 2.42 : 2.27), 160]} />
        <meshStandardMaterial
          color={v55RingArt ? "#cab58d" : "#c8b898"}
          emissive={v55RingArt ? "#8c7550" : v51RingKeyFill ? "#d7c49a" : v50Showcase ? "#c8b898" : "#000000"}
          emissiveIntensity={v55RingArt ? 0.06 : v51RingKeyFill ? 0.21 : v50Showcase ? 0.18 : 0}
          transparent
          opacity={(v55RingArt ? 0.44 : v50Showcase ? 0.56 : 0.5) * opacityMul}
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
        <ringGeometry args={[radiusScene * 2.43, radiusScene * (v50Showcase ? 3.05 : v55RingArt ? 2.92 : v49Ring ? 2.72 : 2.42), 160]} />
        <meshStandardMaterial
          color={v55RingArt ? "#ad9871" : "#a89878"}
          emissive={v55RingArt ? "#715d3e" : v50Showcase ? "#a89878" : "#000000"}
          emissiveIntensity={v55RingArt ? 0.045 : v50Showcase ? 0.1 : 0}
          transparent
          opacity={(v55GlobalGrade ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.outerRingOpacity : 0.18) * opacityMul}
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

  useEffect(() => {
    onReady?.();
  }, [onReady]);

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
