"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { AU_METERS } from "../lib/physicalConstants";
import { AU_TO_SCENE, EARTH_BODY_INDEX } from "../data/planetsJ2000";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { TleRecord } from "../lib/satelliteTle";
import {
  getSatelliteUiSnapshot,
  setSatelliteLinkMetrics,
  setSatelliteSelection,
  subscribeSatelliteUi,
} from "../lib/satelliteUiState";

const TOKYO_LAT_RAD = (35.6764 * Math.PI) / 180;
const TOKYO_LON_RAD = (139.6500 * Math.PI) / 180;
const EARTH_RADIUS_M = 6_378_137;
const BEAM_HALF_ANGLE_RAD = (22 * Math.PI) / 180;

type Props = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
};

type SatPose = {
  id: string;
  name: string;
  group: string;
  x: number;
  y: number;
  z: number;
};

export default function SatelliteConstellationOverlay({ physicsRef }: Props) {
  const camera = useThree((s) => s.camera);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const recordsRef = useRef<TleRecord[]>([]);
  const posesRef = useRef<SatPose[]>([]);
  const [poseCount, setPoseCount] = useState(0);
  const poseCountRef = useRef(0);
  poseCountRef.current = poseCount;
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;
  const [groupFilter, setGroupFilter] = useState<
    "all" | "stations" | "qzss" | "starlink"
  >(getSatelliteUiSnapshot().groupFilter);
  const lastPropagateMsRef = useRef(0);
  const lastLinkUpdateMsRef = useRef(0);
  const updateCursorRef = useRef(0);
  const tmpObj = useMemo(() => new THREE.Object3D(), []);
  const workerRef = useRef<Worker | null>(null);

  useEffect(
    () => subscribeSatelliteUi(() => setGroupFilter(getSatelliteUiSnapshot().groupFilter)),
    []
  );

  useEffect(() => {
    const w = new Worker(new URL("../workers/satellite.worker.ts", import.meta.url));
    workerRef.current = w;
    w.onmessage = (ev: MessageEvent<{ type: "poses"; poses: SatPose[] }>) => {
      const msg = ev.data;
      if (msg?.type !== "poses") return;
      posesRef.current = msg.poses;
      if (msg.poses.length !== poseCountRef.current) setPoseCount(msg.poses.length);
      if (selectedRef.current && !msg.poses.some((x) => x.id === selectedRef.current)) {
        const first = msg.poses[0] ?? null;
        setSelected(first?.id ?? null);
        setSatelliteSelection(first?.id ?? null, first?.name ?? null);
      }
    };
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let dead = false;
    async function pull() {
      try {
        const r = await fetch("/api/tle", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { records?: TleRecord[] };
        if (!dead && Array.isArray(j.records)) {
          recordsRef.current = j.records;
          if (!selected && j.records.length > 0) {
            setSelected(j.records[0].id);
            setSatelliteSelection(j.records[0].id, j.records[0].name);
          }
        }
      } catch {
        // Keep previous records.
      }
    }
    pull();
    const id = window.setInterval(pull, 60_000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, [selected]);

  useFrame(() => {
    const p = physicsRef.current;
    if (!p || EARTH_BODY_INDEX < 0 || EARTH_BODY_INDEX >= p.n || recordsRef.current.length === 0)
      return;
    const earthAuX = p.posAu[3 * EARTH_BODY_INDEX] ?? 0;
    const earthAuY = p.posAu[3 * EARTH_BODY_INDEX + 1] ?? 0;
    const earthAuZ = p.posAu[3 * EARTH_BODY_INDEX + 2] ?? 0;
    const earthM = {
      x: earthAuX * AU_METERS,
      y: earthAuY * AU_METERS,
      z: earthAuZ * AU_METERS,
    };

    const nowMs = performance.now();
    if (nowMs - lastPropagateMsRef.current > 250) {
      lastPropagateMsRef.current = nowMs;
      workerRef.current?.postMessage({
        type: "tick",
        records: recordsRef.current,
        groupFilter,
        earthM,
      });
    }
    const next = posesRef.current;

    const m = meshRef.current;
    if (!m) return;
    const count = Math.min(500, next.length);
    const batch = Math.min(120, count);
    const start = updateCursorRef.current % Math.max(1, count);
    for (let n = 0; n < batch; n++) {
      const i = (start + n) % Math.max(1, count);
      const s = next[i]!;
      tmpObj.position.set(s.x / AU_METERS * AU_TO_SCENE, s.y / AU_METERS * AU_TO_SCENE, s.z / AU_METERS * AU_TO_SCENE);
      const camDistM = camera.position.distanceTo(tmpObj.position) * (AU_METERS / AU_TO_SCENE);
      const pointScale = camDistM > 100_000 ? 1.0 : 0.35;
      tmpObj.scale.setScalar(pointScale);
      tmpObj.updateMatrix();
      m.setMatrixAt(i, tmpObj.matrix);
    }
    updateCursorRef.current = start + batch;
    m.count = count;
    m.instanceMatrix.needsUpdate = true;

    if (!selected) return;
    if (nowMs - lastLinkUpdateMsRef.current < 500) return;
    lastLinkUpdateMsRef.current = nowMs;
    const sel = next.find((x) => x.id === selected) ?? null;
    if (!sel) return;
    const dx = sel.x - earthM.x;
    const dy = sel.y - earthM.y;
    const dz = sel.z - earthM.z;
    const dM = Math.hypot(dx, dy, dz);
    const dKm = dM / 1000;
    const fMhz = getSatelliteUiSnapshot().fsplFrequencyMHz;
    const fspl = 20 * Math.log10(Math.max(1, dKm)) + 20 * Math.log10(Math.max(1, fMhz)) + 32.44;
    const tx = EARTH_RADIUS_M * Math.cos(TOKYO_LAT_RAD) * Math.cos(TOKYO_LON_RAD);
    const ty = EARTH_RADIUS_M * Math.cos(TOKYO_LAT_RAD) * Math.sin(TOKYO_LON_RAD);
    const tz = EARTH_RADIUS_M * Math.sin(TOKYO_LAT_RAD);
    const ux = (earthM.x + tx) - sel.x;
    const uy = (earthM.y + ty) - sel.y;
    const uz = (earthM.z + tz) - sel.z;
    const ur = Math.hypot(ux, uy, uz);
    const toEarthX = earthM.x - sel.x;
    const toEarthY = earthM.y - sel.y;
    const toEarthZ = earthM.z - sel.z;
    const toEarthR = Math.hypot(toEarthX, toEarthY, toEarthZ);
    const c = (ux * toEarthX + uy * toEarthY + uz * toEarthZ) / Math.max(1e-6, ur * toEarthR);
    const ang = Math.acos(Math.max(-1, Math.min(1, c)));
    setSatelliteLinkMetrics(dKm, fspl, ang <= BEAM_HALF_ANGLE_RAD);
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, 500]}
        onClick={(e) => {
          const i = e.instanceId ?? -1;
          if (i < 0 || i >= posesRef.current.length) return;
          const sat = posesRef.current[i]!;
          setSelected(sat.id);
          setSatelliteSelection(sat.id, sat.name);
        }}
      >
        <icosahedronGeometry args={[0.012, 0]} />
        <meshBasicMaterial color="#9cd7ff" toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>
      <SelectedSatelliteCone
        selectedId={selected}
        posesRef={posesRef}
        physicsRef={physicsRef}
      />
      <SelectedSatelliteModel
        selectedId={selected}
        posesRef={posesRef}
        physicsRef={physicsRef}
        camera={camera}
      />
    </group>
  );
}

function SelectedSatelliteCone({
  selectedId,
  posesRef,
  physicsRef,
}: {
  selectedId: string | null;
  posesRef: MutableRefObject<SatPose[]>;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
}) {
  const coneRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = physicsRef.current;
    const cone = coneRef.current;
    const selected = selectedId ? posesRef.current.find((s) => s.id === selectedId) : null;
    if (!p || !cone || !selected) {
      if (cone) cone.visible = false;
      return;
    }
    const ex = (p.posM[3 * EARTH_BODY_INDEX] ?? 0);
    const ey = (p.posM[3 * EARTH_BODY_INDEX + 1] ?? 0);
    const ez = (p.posM[3 * EARTH_BODY_INDEX + 2] ?? 0);
    const dx = ex - selected.x;
    const dy = ey - selected.y;
    const dz = ez - selected.z;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1) {
      cone.visible = false;
      return;
    }
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const satPos = new THREE.Vector3(
      (selected.x / AU_METERS) * AU_TO_SCENE,
      (selected.y / AU_METERS) * AU_TO_SCENE,
      (selected.z / AU_METERS) * AU_TO_SCENE
    );
    cone.position.copy(satPos).addScaledVector(dir, ((len / AU_METERS) * AU_TO_SCENE) * 0.5);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    cone.scale.set(
      Math.tan(BEAM_HALF_ANGLE_RAD) * ((len / AU_METERS) * AU_TO_SCENE),
      (len / AU_METERS) * AU_TO_SCENE,
      Math.tan(BEAM_HALF_ANGLE_RAD) * ((len / AU_METERS) * AU_TO_SCENE),
    );
    cone.visible = true;
  });

  const overTokyo = getSatelliteUiSnapshot().overTokyo;
  return (
    <mesh ref={coneRef} visible={false}>
      <coneGeometry args={[1, 1, 24, 1, true]} />
      <meshBasicMaterial
        color={overTokyo ? "#7dffb0" : "#66c1ff"}
        transparent
        opacity={0.18}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function SelectedSatelliteModel({
  selectedId,
  posesRef,
  physicsRef,
  camera,
}: {
  selectedId: string | null;
  posesRef: MutableRefObject<SatPose[]>;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  camera: THREE.Camera;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const separatedAtMsRef = useRef<number | null>(null);
  const prevSelectedRef = useRef<string | null>(null);

  useFrame(() => {
    const p = physicsRef.current;
    const g = groupRef.current;
    if (!p || !g || !selectedId) {
      if (g) g.visible = false;
      prevSelectedRef.current = selectedId;
      return;
    }
    const selected = posesRef.current.find((s) => s.id === selectedId);
    if (!selected) {
      g.visible = false;
      return;
    }
    if (prevSelectedRef.current !== selectedId) {
      separatedAtMsRef.current = performance.now();
      prevSelectedRef.current = selectedId;
    }
    const camDistM =
      camera.position.distanceTo(
        new THREE.Vector3(
          (selected.x / AU_METERS) * AU_TO_SCENE,
          (selected.y / AU_METERS) * AU_TO_SCENE,
          (selected.z / AU_METERS) * AU_TO_SCENE
        )
      ) *
      (AU_METERS / AU_TO_SCENE);
    g.visible = camDistM <= 100_000;
    if (!g.visible) return;
    g.position.set(
      (selected.x / AU_METERS) * AU_TO_SCENE,
      (selected.y / AU_METERS) * AU_TO_SCENE,
      (selected.z / AU_METERS) * AU_TO_SCENE
    );

    // Sun-tracking: +X axis of group points to Sun.
    const sunX = p.posM[0] ?? 0;
    const sunY = p.posM[1] ?? 0;
    const sunZ = p.posM[2] ?? 0;
    const toSun = new THREE.Vector3(sunX - selected.x, sunY - selected.y, sunZ - selected.z);
    if (toSun.lengthSq() > 1) {
      toSun.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), toSun);
      g.quaternion.slerp(q, 0.12);
    }

    const elapsed = separatedAtMsRef.current == null ? 0 : (performance.now() - separatedAtMsRef.current) / 1000;
    const u = THREE.MathUtils.clamp((elapsed - 10) / 5, 0, 1);
    const eased = u * u * (3 - 2 * u);
    if (leftWingRef.current) leftWingRef.current.rotation.z = THREE.MathUtils.degToRad(-92 * eased);
    if (rightWingRef.current) rightWingRef.current.rotation.z = THREE.MathUtils.degToRad(92 * eased);
  });

  return (
    <group ref={groupRef} visible={false} scale={[0.18, 0.18, 0.18]}>
      <mesh>
        <boxGeometry args={[0.16, 0.12, 0.12]} />
        <meshStandardMaterial color="#c4d7ff" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh ref={leftWingRef} position={[-0.14, 0, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.14]} />
        <meshStandardMaterial color="#3d5f91" metalness={0.2} roughness={0.55} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.14, 0, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.14]} />
        <meshStandardMaterial color="#3d5f91" metalness={0.2} roughness={0.55} />
      </mesh>
    </group>
  );
}

