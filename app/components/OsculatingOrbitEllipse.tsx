"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { osculatingEllipseRelativeAu } from "../lib/osculatingOrbit";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import {
  createHairlineOrbitLineBundle,
  setHairlineOrbitBundleOpacity,
  setLineGeometryFromVectors,
} from "../lib/hairlineOrbitLine";
import {
  ORBIT_CINEMATIC_BASE_OPACITY,
  orbitColorForBodyId,
  orbitOpacityMulFromLodWorldRadius,
} from "../lib/orbitCinematicTokens";
import {
  lodAlphaFromScreenDiameterPx,
  ORBIT_SCREEN_LOD_FADE_END_PX,
  ORBIT_SCREEN_LOD_FADE_START_PX,
  screenDiscDiameterPx,
} from "../lib/screenSpaceBodyLod";
import { MAJOR_PLANET_IDS } from "../data/planetsJ2000";

const FRAME_STRIDE = 14;
const _anchorWorld = new THREE.Vector3();

type Props = {
  bodyIndex: number;
  /** Body ID string for per-body orbit color. */
  bodyId?: string;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  color?: THREE.ColorRepresentation;
  selected: boolean;
  centralBodyIndex?: number;
  segments?: number;
  renderOrder?: number;
  lodWorldRadius: number;
};

/**
 * Closed osculating ellipse as 1px screen-space hairline (Line2).
 */
export default function OsculatingOrbitEllipse({
  bodyIndex,
  bodyId,
  physicsRef,
  selected,
  centralBodyIndex = 0,
  segments = 192,
  renderOrder = -42,
  lodWorldRadius,
}: Props) {
  const frameN = useRef(0);
  const planetWorldRef = useRef(new THREE.Vector3());
  const nPointsRef = useRef(0);
  const bloomActions = useOptionalBloomSceneActions();
  const { size } = useThree();

  const pointPool = useMemo(
    () => Array.from({ length: segments }, () => new THREE.Vector3()),
    [segments]
  );

  const flatScratch = useMemo(
    () => new Float32Array((segments + 2) * 3),
    [segments]
  );

  const hairlineColor = useMemo(
    () => orbitColorForBodyId(bodyId ?? `body-${bodyIndex}`),
    [bodyId, bodyIndex]
  );
  const atlasProminentOrbit = MAJOR_PLANET_IDS.has(bodyId ?? "");

  const bundle = useMemo(
    () =>
      createHairlineOrbitLineBundle(hairlineColor, {
        linewidthPx: selected ? 0.94 : atlasProminentOrbit ? 0.72 : 0.48,
        glowWidthPx: selected ? 2.2 : atlasProminentOrbit ? 1.65 : 1.12,
        renderOrder,
      }),
    [atlasProminentOrbit, hairlineColor, renderOrder, selected]
  );

  useFrame((state) => {
    const line = bundle.root;
    bundle.coreMaterial.resolution.set(size.width, size.height);
    bundle.glowMaterial.resolution.set(size.width, size.height);

    const p = physicsRef.current;
    if (!p || bodyIndex === centralBodyIndex) {
      line.visible = false;
      nPointsRef.current = 0;
      return;
    }

    const s = AU_TO_SCENE;
    const pi = bodyIndex * 3;
    const px = p.posAu[pi] * s;
    const py = p.posAu[pi + 1] * s;
    const pz = p.posAu[pi + 2] * s;
    planetWorldRef.current.set(px, py, pz);

    frameN.current += 1;
    const shouldRecomputeEllipse =
      nPointsRef.current === 0 || frameN.current % FRAME_STRIDE === 0;
    if (shouldRecomputeEllipse) {
      const c = centralBodyIndex;
      const mu = p.G * (p.mass[c] + p.mass[bodyIndex]);
      const flat = osculatingEllipseRelativeAu(
        p.posM,
        p.velM,
        c,
        bodyIndex,
        mu,
        segments
      );

      if (!flat || flat.length < 9) {
        nPointsRef.current = 0;
      } else {
        const ci = c * 3;
        const sx = p.posAu[ci] * s;
        const sy = p.posAu[ci + 1] * s;
        const sz = p.posAu[ci + 2] * s;
        const n = flat.length / 3;
        for (let i = 0; i < n; i++) {
          pointPool[i]!.set(
            sx + flat[3 * i]! * s,
            sy + flat[3 * i + 1]! * s,
            sz + flat[3 * i + 2]! * s
          );
        }
        nPointsRef.current = n;
        setLineGeometryFromVectors(
          bundle,
          pointPool,
          n,
          true,
          flatScratch
        );
      }
    }

    const n = nPointsRef.current;
    if (n < 3) {
      line.visible = false;
      return;
    }

    const anchor = _anchorWorld.copy(planetWorldRef.current);
    const cam = state.camera as THREE.PerspectiveCamera;
    const discPx = screenDiscDiameterPx(
      cam,
      size.height,
      anchor,
      lodWorldRadius
    );
    const lodA = lodAlphaFromScreenDiameterPx(
      discPx,
      ORBIT_SCREEN_LOD_FADE_START_PX,
      ORBIT_SCREEN_LOD_FADE_END_PX
    );
    const sizeMul = orbitOpacityMulFromLodWorldRadius(lodWorldRadius);
    const base =
      ORBIT_CINEMATIC_BASE_OPACITY *
      sizeMul *
      (selected ? 1.1 : atlasProminentOrbit ? 0.52 : 0.28) *
      lodA;
    const opacity = THREE.MathUtils.clamp(base, 0, 1);
    setHairlineOrbitBundleOpacity(bundle, opacity);
    line.visible = opacity > 0.02;
  });

  useEffect(() => {
    bundle.coreMaterial.color.copy(hairlineColor);
    bundle.glowMaterial.color.copy(hairlineColor).lerp(new THREE.Color("#fff1c7"), selected ? 0.28 : 0.16);
  }, [bundle.coreMaterial, bundle.glowMaterial, hairlineColor, selected]);

  useEffect(() => {
    return () => {
      bundle.geometry.dispose();
      bundle.coreMaterial.dispose();
      bundle.glowMaterial.dispose();
    };
  }, [bundle.coreMaterial, bundle.geometry, bundle.glowMaterial]);

  useLayoutEffect(() => {
    const line = bundle.glowLine;
    if (!bloomActions) return;
    bloomActions.registerBloomTarget(line);
    return () => bloomActions.unregisterBloomTarget(line);
  }, [bundle.glowLine, bloomActions]);

  return <primitive object={bundle.root} />;
}
