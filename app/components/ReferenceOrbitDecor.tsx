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

function DecorOrbit({ def }: { def: ReferenceKeplerOrbitDef }) {
  const bloomActions = useOptionalBloomSceneActions();
  const { camera, size } = useThree();

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
        linewidthPx: 0.58,
        glowWidthPx: 1.5,
        renderOrder: -37,
      }),
    [mutedColor]
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
      ORBIT_CINEMATIC_BASE_OPACITY * 0.64 * sizeMul * lodA,
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
            color: "rgba(224,219,205,0.58)",
            textShadow:
              "0 0 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.75)",
            transform: "translate(15px, -15px)",
            transformOrigin: "0 0",
          }}
        >
          {def.label}
        </span>
      </Html>
    </group>
  );
}

export default function ReferenceOrbitDecor() {
  return (
    <>
      {REFERENCE_KEPLER_ORBITS.map((def) => (
        <DecorOrbit key={def.id} def={def} />
      ))}
    </>
  );
}
