"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { MissionPlan, MissionSegment } from "../lib/missionDesignerTypes";
import type { MutableRefObject } from "react";

const SEGMENT_COLORS = ["#62e6ff", "#ff7ab6", "#ffd166"];

function scenePoint(p: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(p[0] * AU_TO_SCENE, p[1] * AU_TO_SCENE, p[2] * AU_TO_SCENE);
}

function labelFor(seg: MissionSegment): string {
  return seg.toBody === "venus" ? "VENUS FLYBY" : seg.toBody === "jupiter" ? "JUPITER FLYBY" : "SATURN ARRIVAL";
}

function markerStatus(seg: MissionSegment): string {
  if (seg.toBody === "saturn") return `v-inf ${seg.arrivalVinfinityKms.toFixed(1)} km/s`;
  return seg.flybyFeasible
    ? `B-plane ok / DSM ${seg.dsmDeltaVKms.toFixed(2)}`
    : `B-plane risk / req ${seg.requiredTurnAngleDeg.toFixed(0)} deg`;
}

function SegmentLine({ segment, index }: { segment: MissionSegment; index: number }) {
  const line = useMemo(() => {
    const pts = segment.trajectoryAu.map(scenePoint);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const obj = new THREE.Line(geo, mat);
    obj.frustumCulled = false;
    obj.renderOrder = -24;
    obj.raycast = () => {};
    return obj;
  }, [index, segment]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  return <primitive object={line} />;
}

function Marker({ segment, index }: { segment: MissionSegment; index: number }) {
  const p = segment.trajectoryAu[segment.trajectoryAu.length - 1] ?? [0, 0, 0];
  const pos = scenePoint(p);
  const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length]!;
  return (
    <group position={pos} renderOrder={-22}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1.35 + index * 0.35, 18, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.86} depthWrite={false} toneMapped={false} />
      </mesh>
      <Html center distanceFactor={18} style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap rounded bg-black/45 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.16em] text-cyan-100 shadow-[0_0_14px_rgba(80,210,255,0.32)]">
          {labelFor(segment)} / {markerStatus(segment)} / {segment.communicationDelayMin.toFixed(0)}m
        </span>
      </Html>
    </group>
  );
}

export default function MissionTrajectoryPreview({
  plan,
  floatingOriginRef,
}: {
  plan: MissionPlan | null;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.copy(floatingOriginRef.current.offsetScene).multiplyScalar(-1);
  }, -12);

  if (!plan) return null;

  return (
    <group ref={groupRef}>
      {plan.segments.map((segment, index) => (
        <SegmentLine key={segment.id} segment={segment} index={index} />
      ))}
      {plan.segments.map((segment, index) => (
        <Marker key={`${segment.id}-marker`} segment={segment} index={index} />
      ))}
    </group>
  );
}
