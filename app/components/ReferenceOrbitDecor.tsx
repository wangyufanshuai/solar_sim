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
  setLineGeometryFromVectors,
} from "../lib/hairlineOrbitLine";
import {
  lodAlphaFromScreenDiameterPx,
  ORBIT_SCREEN_LOD_FADE_END_PX,
  ORBIT_SCREEN_LOD_FADE_START_PX,
  screenDiscDiameterPx,
} from "../lib/screenSpaceBodyLod";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";

const MAJOR_REFERENCE_IDS = new Set([
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);

function budgetOrbitStyle(
  def: ReferenceKeplerOrbitDef,
  renderBudget: SimulationViewSettings["renderBudget"],
) {
  const major = MAJOR_REFERENCE_IDS.has(def.id);
  if (renderBudget === "quality") {
    return { visible: true, opacityMul: major ? 0.78 : 0.52, glowMul: major ? 0.55 : 0.28, label: major };
  }
  if (renderBudget === "safe") {
    return { visible: major, opacityMul: major ? 0.34 : 0, glowMul: 0, label: false };
  }
  return { visible: major || def.aAu < 4.2, opacityMul: major ? 0.46 : 0.16, glowMul: major ? 0.12 : 0, label: major };
}

function DecorOrbit({
  def,
  renderBudget,
}: {
  def: ReferenceKeplerOrbitDef;
  renderBudget: SimulationViewSettings["renderBudget"];
}) {
  const bloomActions = useOptionalBloomSceneActions();
  const { camera, size } = useThree();
  const style = useMemo(() => budgetOrbitStyle(def, renderBudget), [def, renderBudget]);

  const mutedColor = useMemo(
    () => orbitColorForBodyId(def.id),
    [def.id]
  );

  const flatScratch = useMemo(
    () => new Float32Array((def.segments + 2) * 3),
    [def.segments]
  );

  const bundle = useMemo(
    () =>
      createHairlineOrbitLineBundle(mutedColor, {
        linewidthPx: renderBudget === "quality" ? 0.58 : 0.46,
        glowWidthPx: renderBudget === "quality" ? 1.35 : 0.92,
        renderOrder: -37,
      }),
    [mutedColor, renderBudget]
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
    return au.map((p) => p.clone().multiplyScalar(s));
  }, [def]);

  const closed = useMemo(() => {
    if (linePointsScene.length < 2) return [] as THREE.Vector3[];
    return [...linePointsScene, linePointsScene[0].clone()];
  }, [linePointsScene]);

  const markerPos = useMemo(() => {
    if (def.markerRadiusScene == null || def.meanAnomalyRad == null) return null;
    const s = AU_TO_SCENE;
    return positionAuFromMeanAnomaly(
      def.aAu,
      def.e,
      def.incDeg,
      def.lanDeg,
      def.argPeriDeg,
      def.meanAnomalyRad
    ).multiplyScalar(s);
  }, [def]);

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
    bundle.coreMaterial.color.copy(mutedColor);
    bundle.glowMaterial.color.copy(mutedColor).lerp(new THREE.Color("#fff1c7"), 0.18);
    setLineGeometryFromVectors(bundle, closed, closed.length, false, flatScratch);
    return () => {
      bundle.geometry.dispose();
      bundle.coreMaterial.dispose();
      bundle.glowMaterial.dispose();
    };
  }, [bundle, closed, flatScratch, mutedColor]);

  useFrame(() => {
    bundle.coreMaterial.resolution.set(size.width, size.height);
    bundle.glowMaterial.resolution.set(size.width, size.height);
    const cam = camera as THREE.PerspectiveCamera;
    const discPx = screenDiscDiameterPx(
      cam,
      size.height,
      labelAnchor,
      lodRadiusScene
    );
    const lodA = lodAlphaFromScreenDiameterPx(
      discPx,
      ORBIT_SCREEN_LOD_FADE_START_PX,
      ORBIT_SCREEN_LOD_FADE_END_PX
    );
    const sizeMul = orbitOpacityMulFromLodWorldRadius(bodyDiscForOpacity);
    const op = THREE.MathUtils.clamp(
      ORBIT_CINEMATIC_BASE_OPACITY *
        VISUAL_CALIBRATION.orbits.referenceOpacity *
        style.opacityMul *
        sizeMul *
        lodA,
      0,
      1
    );
    bundle.coreMaterial.opacity = op;
    bundle.glowMaterial.opacity = THREE.MathUtils.clamp(op * VISUAL_CALIBRATION.orbits.glowScale * style.glowMul, 0, 0.16);
    bundle.root.visible = style.visible && op > 0.012;
  });

  if (!style.visible || closed.length < 4) return null;

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
      {style.label ? <Html
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
            color: "rgba(224,219,205,0.58)",
            textShadow:
              "0 0 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.75)",
            transform: "translate(15px, -15px)",
            transformOrigin: "0 0",
          }}
        >
          {def.label}
        </span>
      </Html> : null}
    </group>
  );
}

export default function ReferenceOrbitDecor({
  renderBudget,
}: {
  renderBudget: SimulationViewSettings["renderBudget"];
}) {
  return (
    <>
      {REFERENCE_KEPLER_ORBITS.map((def) => (
        <DecorOrbit key={def.id} def={def} renderBudget={renderBudget} />
      ))}
    </>
  );
}
