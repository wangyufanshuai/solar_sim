"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  mapOrbitAtlasPositionAu,
  ORBIT_ATLAS_DEFAULT_LABEL_IDS,
  ORBIT_ATLAS_LABELS,
  type OrbitAtlasScaleMode,
} from "../lib/orbitAtlasPresentation";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

const LABEL_OFFSET: Readonly<Record<string, [number, number]>> = {
  sun: [12, -16],
  mercury: [10, 10],
  venus: [12, -10],
  earth: [12, -14],
  mars: [12, 8],
  jupiter: [14, -14],
  saturn: [14, -10],
  uranus: [12, 10],
  neptune: [12, -12],
  pluto: [12, 10],
  ceres: [10, 8],
  eris: [10, -10],
  sedna: [10, 8],
};

const BODY_INDEX_BY_ID = new Map(
  SOLAR_SYSTEM_BODIES.map((body, index) => [body.id, index]),
);

function AtlasBodyLabel({
  bodyId,
  physicsRef,
  scaleMode,
}: {
  bodyId: string;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  scaleMode: OrbitAtlasScaleMode;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyIndex = BODY_INDEX_BY_ID.get(bodyId) ?? -1;
  const offset = LABEL_OFFSET[bodyId] ?? [10, -10];

  useFrame(() => {
    const root = rootRef.current;
    const physics = physicsRef.current;
    if (!root || !physics || bodyIndex < 0 || bodyIndex >= physics.n) {
      if (root) root.visible = false;
      return;
    }
    root.visible = true;
    mapOrbitAtlasPositionAu(
      physics.posAu[bodyIndex * 3]!,
      physics.posAu[bodyIndex * 3 + 1]!,
      physics.posAu[bodyIndex * 3 + 2]!,
      scaleMode,
      root.position,
    );
  });

  if (bodyIndex < 0) return null;

  return (
    <group ref={rootRef} frustumCulled={false}>
      <Html center={false} style={{ pointerEvents: "none" }} zIndexRange={[8, 0]}>
        <span
          data-orbit-atlas-label={bodyId}
          className="whitespace-nowrap"
          style={{
            display: "block",
            transform: `translate(${offset[0]}px, ${offset[1]}px)`,
            fontFamily: "var(--font-body)",
            fontSize: bodyId === "sun" ? 12 : 11,
            fontWeight: bodyId === "sun" ? 500 : 400,
            color: bodyId === "sun" ? "rgba(246,219,166,0.82)" : "rgba(224,221,210,0.65)",
            textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 0 9px rgba(0,0,0,0.9)",
          }}
        >
          {ORBIT_ATLAS_LABELS[bodyId]}
        </span>
      </Html>
    </group>
  );
}

export default function OrbitAtlasLabels({
  physicsRef,
  scaleMode,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  scaleMode: OrbitAtlasScaleMode;
}) {
  const { size } = useThree();
  const labelLimit = size.width < 640 ? 7 : 11;
  const visibleIds = useMemo(
    () => ORBIT_ATLAS_DEFAULT_LABEL_IDS.filter((id) => BODY_INDEX_BY_ID.has(id)).slice(0, labelLimit),
    [labelLimit],
  );
  return (
    <>
      {visibleIds.map((bodyId) => (
        <AtlasBodyLabel key={bodyId} bodyId={bodyId} physicsRef={physicsRef} scaleMode={scaleMode} />
      ))}
    </>
  );
}
