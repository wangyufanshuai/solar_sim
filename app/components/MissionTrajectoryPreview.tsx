"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { MissionPlan, MissionSegment } from "../lib/missionDesignerTypes";
import type { MutableRefObject } from "react";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";
import type { MissionInspectionSelection } from "../lib/missionDesignerTypes";

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
      opacity: VISUAL_CALIBRATION.orbits.missionOpacity,
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

function Marker({ segment, index, showLabel }: { segment: MissionSegment; index: number; showLabel: boolean }) {
  const p = segment.trajectoryAu[segment.trajectoryAu.length - 1] ?? [0, 0, 0];
  const pos = scenePoint(p);
  const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length]!;
  return (
    <group position={pos} renderOrder={-22}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1.35 + index * 0.35, 18, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.86} depthWrite={false} toneMapped={false} />
      </mesh>
      {showLabel ? (
        <Html center distanceFactor={18} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded bg-black/45 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.16em] text-cyan-100 shadow-[0_0_14px_rgba(80,210,255,0.32)]">
            {labelFor(segment)} / {markerStatus(segment)} / {segment.communicationDelayMin.toFixed(0)}m
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function EventMarker({
  position,
  label,
  color,
  showLabel,
}: {
  position: [number, number, number];
  label: string;
  color: string;
  showLabel: boolean;
}) {
  const pos = scenePoint(position);
  return (
    <group position={pos} renderOrder={-21}>
      <mesh frustumCulled={false}>
        <octahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.92} depthWrite={false} toneMapped={false} />
      </mesh>
      {showLabel ? (
        <Html center distanceFactor={16} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap rounded bg-black/45 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.16em] text-white/80 shadow-[0_0_12px_rgba(80,210,255,0.22)]">
            {label}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

export default function MissionTrajectoryPreview({
  plan,
  floatingOriginRef,
  inspectionSelection = null,
  showLabels = false,
}: {
  plan: MissionPlan | null;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  inspectionSelection?: MissionInspectionSelection | null;
  showLabels?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.copy(floatingOriginRef.current.offsetScene).multiplyScalar(-1);
  }, -12);

  if (!plan) return null;
  const maneuverMarkers = (plan.cowellAudit?.maneuverEvents ?? [])
    .map((event) => {
      const segment = plan.segments.find((item) => item.id === event.segmentId);
      if (!segment) return null;
      const u = Math.max(0, Math.min(1, (event.simDay - segment.departureDay) / Math.max(1, segment.tofDays)));
      const idx = Math.min(segment.trajectoryAu.length - 1, Math.max(0, Math.round(u * (segment.trajectoryAu.length - 1))));
      return {
        id: event.id,
        position: segment.trajectoryAu[idx] ?? segment.departurePositionAu,
        label: `${event.type.toUpperCase()} ${event.deltaVMagnitudeKmS.toFixed(2)} km/s`,
        color: event.type === "injection" ? "#9be7ff" : "#ffd166",
      };
    })
    .filter(Boolean) as Array<{ id: string; position: [number, number, number]; label: string; color: string }>;

  return (
    <group ref={groupRef}>
      {plan.segments.map((segment, index) => (
        <SegmentLine key={segment.id} segment={segment} index={index} />
      ))}
      {plan.segments.map((segment, index) => (
        <Marker key={`${segment.id}-marker`} segment={segment} index={index} showLabel={showLabels} />
      ))}
      {maneuverMarkers.map((marker) => (
        <EventMarker key={marker.id} position={marker.position} label={marker.label} color={marker.color} showLabel={showLabels} />
      ))}
      {inspectionSelection?.positionAu ? (
        <EventMarker
          position={inspectionSelection.positionAu}
          label={`${inspectionSelection.kind.toUpperCase()} T+${inspectionSelection.simDay?.toFixed(1) ?? "--"}`}
          color="#ffffff"
          showLabel={showLabels}
        />
      ) : null}
    </group>
  );
}
