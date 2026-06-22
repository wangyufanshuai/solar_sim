"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import {
  REFERENCE_KEPLER_ORBITS,
  type ReferenceKeplerOrbitDef,
} from "../data/referenceKeplerOrbits";
import {
  keplerianEllipsePointsAu,
  positionAuFromMeanAnomaly,
} from "../lib/keplerianOrbit";
import {
  ORBIT_CINEMATIC_BASE_OPACITY,
  orbitColorForBodyId,
  orbitOpacityMulFromLodWorldRadius,
} from "../lib/orbitCinematicTokens";
import {
  createHairlineOrbitLineBundle,
  setHairlineOrbitBundleOpacity,
  setLineGeometryFromVectors,
} from "../lib/hairlineOrbitLine";
import {
  lodAlphaFromScreenDiameterPx,
  ORBIT_SCREEN_LOD_FADE_END_PX,
  ORBIT_SCREEN_LOD_FADE_START_PX,
  screenDiscDiameterPx,
} from "../lib/screenSpaceBodyLod";
import { MAJOR_PLANET_IDS } from "../data/planetsJ2000";
import {
  classifyReferenceOrbit,
  mapOrbitAtlasVector,
  type OrbitAtlasRenderBudget,
  type OrbitAtlasScaleMode,
  type SolarPresentationMode,
} from "../lib/orbitAtlasPresentation";

const BALANCED_ATLAS_ORBIT_IDS = new Set([
  "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
  "ceres", "vesta", "pallas", "hygiea", "juno", "hebe", "iris", "flora", "eros", "itokawa",
  "haumea", "quaoar", "salacia", "varuna", "ixion", "pholus", "chiron", "chariklo", "orcus",
  "makemake", "eris", "sedna", "c1996e1",
]);

function DecorOrbit({ def, presentationMode, scaleMode }: { def: ReferenceKeplerOrbitDef; presentationMode: SolarPresentationMode; scaleMode: OrbitAtlasScaleMode }) {
  const bloomActions = useOptionalBloomSceneActions();
  const { camera, size } = useThree();
  const isMajor = MAJOR_PLANET_IDS.has(def.id);
  const orbitClass = classifyReferenceOrbit(def.id, def.aAu);
  const orbitAtlas = presentationMode === "orbit-atlas";
  const showLabel = !orbitAtlas && (isMajor || def.opacity >= 0.32);

  const mutedColor = useMemo(
    () => orbitColorForBodyId(def.id),
    [def.id]
  );
  const atlasColor = useMemo(() => {
    if (!orbitAtlas) return mutedColor;
    const goldGray = new THREE.Color("#d6c18a");
    const coolGray = new THREE.Color("#9ca3a0");
    if (isMajor) return mutedColor.clone().lerp(goldGray, 0.52);
    return mutedColor.clone().lerp(coolGray, 0.68);
  }, [isMajor, mutedColor, orbitAtlas]);

  const flatScratch = useMemo(
    () => new Float32Array((def.segments + 2) * 3),
    [def.segments]
  );

  const bundle = useMemo(
    () =>
      createHairlineOrbitLineBundle(atlasColor, {
        linewidthPx: orbitAtlas ? (isMajor ? 1.15 : 0.48) : (isMajor ? 0.64 : 0.42),
        glowWidthPx: orbitAtlas ? (isMajor ? 1.45 : 0.28) : (isMajor ? 1.38 : 0.92),
        renderOrder: -37,
      }),
    [atlasColor, isMajor, orbitAtlas]
  );

  useLayoutEffect(() => {
    const line = bundle.glowLine;
    if (!bloomActions) return;
    bloomActions.registerBloomTarget(line);
    return () => bloomActions.unregisterBloomTarget(line);
  }, [bloomActions, bundle.glowLine]);

  const linePointsScene = useMemo(() => {
    const s = AU_TO_SCENE;
    const au = keplerianEllipsePointsAu(
      def.aAu,
      def.e,
      def.incDeg,
      def.lanDeg,
      def.argPeriDeg,
      def.segments
    );
    return au.map((p) =>
      orbitAtlas ? mapOrbitAtlasVector(p, scaleMode) : p.clone().multiplyScalar(s),
    );
  }, [def, orbitAtlas, scaleMode]);

  const closed = useMemo(() => {
    if (linePointsScene.length < 2) return [] as THREE.Vector3[];
    return [...linePointsScene, linePointsScene[0].clone()];
  }, [linePointsScene]);

  const markerPos = useMemo(() => {
    if (def.markerRadiusScene == null || def.meanAnomalyRad == null) return null;
    const s = AU_TO_SCENE;
    const positionAu = positionAuFromMeanAnomaly(
      def.aAu,
      def.e,
      def.incDeg,
      def.lanDeg,
      def.argPeriDeg,
      def.meanAnomalyRad
    );
    return orbitAtlas ? mapOrbitAtlasVector(positionAu, scaleMode) : positionAu.multiplyScalar(s);
  }, [def, orbitAtlas, scaleMode]);

  const labelAnchor = useMemo(() => {
    if (markerPos) {
      return markerPos.clone().multiplyScalar(1.06);
    }
    let best = linePointsScene[0]?.clone() ?? new THREE.Vector3();
    let d = 0;
    for (const p of linePointsScene) {
      const l = p.length();
      if (l > d) {
        d = l;
        best = p.clone();
      }
    }
    return best.multiplyScalar(1.05);
  }, [markerPos, linePointsScene]);

  const lodRadiusScene = useMemo(() => {
    const s = AU_TO_SCENE;
    return Math.max(3, def.aAu * s * 0.06);
  }, [def.aAu]);

  const bodyDiscForOpacity = def.markerRadiusScene ?? 0.032;

  useEffect(() => {
    bundle.root.userData.orbitClass = orbitClass;
    bundle.root.userData.orbitId = def.id;
    bundle.coreMaterial.color.copy(atlasColor);
    bundle.glowMaterial.color.copy(atlasColor).lerp(new THREE.Color("#fff1c7"), orbitAtlas ? 0.1 : 0.18);
    setLineGeometryFromVectors(bundle, closed, closed.length, false, flatScratch);
    return () => {
      bundle.geometry.dispose();
      bundle.coreMaterial.dispose();
      bundle.glowMaterial.dispose();
    };
  }, [atlasColor, bundle, closed, def.id, flatScratch, orbitAtlas, orbitClass]);

  useFrame(() => {
    bundle.coreMaterial.resolution.set(size.width, size.height);
    bundle.glowMaterial.resolution.set(size.width, size.height);
    const cam = camera as THREE.PerspectiveCamera;
    const discPx = screenDiscDiameterPx(cam, size.height, labelAnchor, lodRadiusScene);
    const lodA = orbitAtlas ? 1 : lodAlphaFromScreenDiameterPx(
      discPx,
      ORBIT_SCREEN_LOD_FADE_START_PX,
      ORBIT_SCREEN_LOD_FADE_END_PX
    );
    const sizeMul = orbitOpacityMulFromLodWorldRadius(bodyDiscForOpacity);
    const orbitTierMul = THREE.MathUtils.lerp(0.58, 0.94, def.opacity);
    const orbitMajorMul = isMajor ? 1.06 : 0.78;
    const highInclinationFade = !isMajor && orbitAtlas
      ? THREE.MathUtils.lerp(1, 0.58, THREE.MathUtils.clamp(Math.abs(def.incDeg) / 48, 0, 1))
      : 1;
    const farOrbitFade = !isMajor && orbitAtlas && def.aAu > 22 ? 0.68 : 1;
    const atlasOpacity = (isMajor
      ? THREE.MathUtils.lerp(0.68, 0.82, def.opacity)
      : THREE.MathUtils.lerp(0.08, 0.2, def.opacity)) * highInclinationFade * farOrbitFade;
    const op = THREE.MathUtils.clamp(
      orbitAtlas
        ? atlasOpacity
        : ORBIT_CINEMATIC_BASE_OPACITY * 0.64 * sizeMul * lodA * orbitTierMul * orbitMajorMul,
      0,
      1
    );
    setHairlineOrbitBundleOpacity(bundle, op);
    bundle.root.visible = op > 0.02;
  });

  if (closed.length < 4) return null;

  return (
    <group renderOrder={-38}>
      <primitive object={bundle.root} />
      {markerPos != null && def.markerRadiusScene != null ? (
        <mesh position={markerPos}>
          <sphereGeometry args={[def.markerRadiusScene, 18, 18]} />
          <meshStandardMaterial
            color={mutedColor}
            emissive={mutedColor}
            emissiveIntensity={0.22}
            roughness={0.88}
            metalness={0.04}
          />
        </mesh>
      ) : null}
      {showLabel ? (
        <Html
          position={[labelAnchor.x, labelAnchor.y, labelAnchor.z]}
          center={false}
          distanceFactor={20}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="whitespace-nowrap"
            style={{
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: isMajor ? "rgba(231,224,211,0.60)" : "rgba(214,210,198,0.42)",
              textShadow:
                "0 0 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.75)",
              transform: "translate(15px, -15px)",
              transformOrigin: "0 0",
            }}
          >
            {def.label}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

export default function ReferenceOrbitDecor({
  presentationMode = "sandbox",
  scaleMode = "physical",
  renderBudget = "dense",
}: {
  presentationMode?: SolarPresentationMode;
  scaleMode?: OrbitAtlasScaleMode;
  renderBudget?: OrbitAtlasRenderBudget;
}) {
  const visibleOrbits = presentationMode === "orbit-atlas" && renderBudget === "balanced"
    ? REFERENCE_KEPLER_ORBITS.filter((def) => BALANCED_ATLAS_ORBIT_IDS.has(def.id))
    : REFERENCE_KEPLER_ORBITS;
  return (
    <>
      {visibleOrbits.map((def) => (
        <DecorOrbit key={def.id} def={def} presentationMode={presentationMode} scaleMode={scaleMode} />
      ))}
    </>
  );
}
