"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";

const CONSTELLATION_DISTANCE_SCENE = 9500;

/** Convert RA/Dec to 3D scene direction. */
function raDecToSceneDir(raDeg: number, decDeg: number): THREE.Vector3 {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(dec) * Math.cos(ra),
    Math.sin(dec),
    Math.cos(dec) * Math.sin(ra)
  );
}

type ConstellationLineGroup = {
  name: string;
  centroid: THREE.Vector3;
  positions: Float32Array;  // flat [x,y,z, x,y,z, ...]
  segmentCount: number;
};

function buildConstellationData(): ConstellationLineGroup[] {
  return CONSTELLATION_LINES.map((c) => {
    const positions = new Float32Array((c.waypoints.length - 1) * 6);
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < c.waypoints.length - 1; i++) {
      const dirA = raDecToSceneDir(c.waypoints[i][0], c.waypoints[i][1]);
      const dirB = raDecToSceneDir(c.waypoints[i + 1][0], c.waypoints[i + 1][1]);
      const off = i * 6;
      positions[off] = dirA.x * CONSTELLATION_DISTANCE_SCENE;
      positions[off + 1] = dirA.y * CONSTELLATION_DISTANCE_SCENE;
      positions[off + 2] = dirA.z * CONSTELLATION_DISTANCE_SCENE;
      positions[off + 3] = dirB.x * CONSTELLATION_DISTANCE_SCENE;
      positions[off + 4] = dirB.y * CONSTELLATION_DISTANCE_SCENE;
      positions[off + 5] = dirB.z * CONSTELLATION_DISTANCE_SCENE;
      cx += dirA.x; cy += dirA.y; cz += dirA.z;
    }
    const lastWp = c.waypoints[c.waypoints.length - 1]!;
    const lastDir = raDecToSceneDir(lastWp[0], lastWp[1]);
    cx += lastDir.x; cy += lastDir.y; cz += lastDir.z;
    const n = c.waypoints.length;
    const centroid = new THREE.Vector3(
      (cx / n) * CONSTELLATION_DISTANCE_SCENE,
      (cy / n) * CONSTELLATION_DISTANCE_SCENE,
      (cz / n) * CONSTELLATION_DISTANCE_SCENE,
    );
    return { name: c.name, centroid, positions, segmentCount: c.waypoints.length - 1 };
  });
}

export default function ConstellationLines({
  floatingOriginRef,
}: {
  floatingOriginRef: React.MutableRefObject<FloatingOriginState>;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const nodeRef = useRef<THREE.Points>(null);
  const orionLineRef = useRef<THREE.LineSegments>(null);
  const orionNodeRef = useRef<THREE.Points>(null);
  const lastTierRef = useRef<string | null>(null);
  const data = useMemo(() => buildConstellationData(), []);
  const orionData = useMemo(
    () => data.find((item) => item.name === "Orion") ?? null,
    [data],
  );

  useFrame(() => {
    const line = lineRef.current;
    const nodes = nodeRef.current;
    const orionLine = orionLineRef.current;
    const orionNodes = orionNodeRef.current;
    if (!line) return;
    const tier = floatingOriginRef.current.lodTier;
    if (lastTierRef.current === tier) return;
    lastTierRef.current = tier;
    const visible = true;
    line.visible = visible;
    if (nodes) nodes.visible = visible;
    const lineMat = line.material as THREE.LineBasicMaterial;
    lineMat.opacity = tier === "solar" ? 0.075 : tier === "mid" ? 0.12 : 0.2;
    const nodeMat = nodes?.material as THREE.PointsMaterial | undefined;
    if (nodeMat) nodeMat.opacity = tier === "solar" ? 0.055 : tier === "mid" ? 0.1 : 0.18;
    if (orionLine) {
      const mat = orionLine.material as THREE.LineBasicMaterial;
      mat.opacity = tier === "solar" ? 0.58 : tier === "mid" ? 0.52 : 0.46;
    }
    if (orionNodes) {
      const mat = orionNodes.material as THREE.PointsMaterial;
      mat.opacity = tier === "solar" ? 0.82 : tier === "mid" ? 0.74 : 0.62;
    }
  });

  // Merge all constellation segments into a single LineSegments for performance.
  const mergedPositions = useMemo(() => {
    let totalSegs = 0;
    for (const g of data) totalSegs += g.segmentCount;
    const buf = new Float32Array(totalSegs * 6);
    let offset = 0;
    for (const g of data) {
      buf.set(g.positions, offset);
      offset += g.segmentCount * 6;
    }
    return buf;
  }, [data]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(mergedPositions, 3));
    return geo;
  }, [mergedPositions]);

  const nodeGeometry = useMemo(() => {
    const seen = new Set<string>();
    const coords: number[] = [];
    for (const c of CONSTELLATION_LINES) {
      for (const [ra, dec] of c.waypoints) {
        const key = `${ra.toFixed(3)}:${dec.toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const dir = raDecToSceneDir(ra, dec);
        coords.push(
          dir.x * CONSTELLATION_DISTANCE_SCENE,
          dir.y * CONSTELLATION_DISTANCE_SCENE,
          dir.z * CONSTELLATION_DISTANCE_SCENE,
        );
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
    return geo;
  }, []);

  const orionGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(orionData?.positions ?? new Float32Array(), 3),
    );
    return geo;
  }, [orionData]);

  const orionNodeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const orion = CONSTELLATION_LINES.find((c) => c.name === "Orion");
    if (!orion) {
      geo.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
      return geo;
    }
    const coords: number[] = [];
    for (const [ra, dec] of orion.waypoints) {
      const dir = raDecToSceneDir(ra, dec);
      coords.push(
        dir.x * CONSTELLATION_DISTANCE_SCENE,
        dir.y * CONSTELLATION_DISTANCE_SCENE,
        dir.z * CONSTELLATION_DISTANCE_SCENE,
      );
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#6f91b8",
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const nodeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#b8d6ff",
        size: 1.35,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const orionMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#9fc8ff",
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const orionNodeMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#fff0c6",
        size: 3.2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  return (
    <>
      <lineSegments
        ref={lineRef}
        geometry={geometry}
        material={material}
        frustumCulled={false}
        renderOrder={-480}
      />
      <points
        ref={nodeRef}
        geometry={nodeGeometry}
        material={nodeMaterial}
        frustumCulled={false}
        renderOrder={-479}
      />
      {orionData ? (
        <>
          <lineSegments
            ref={orionLineRef}
            geometry={orionGeometry}
            material={orionMaterial}
            frustumCulled={false}
            renderOrder={-478}
          />
          <points
            ref={orionNodeRef}
            geometry={orionNodeGeometry}
            material={orionNodeMaterial}
            frustumCulled={false}
            renderOrder={-477}
          />
          <Html
            position={[
              orionData.centroid.x,
              orionData.centroid.y + 260,
              orionData.centroid.z,
            ]}
            center
            distanceFactor={18}
            style={{ pointerEvents: "none" }}
          >
            <span className="whitespace-nowrap text-[11px] tracking-[0.22em] text-[#cfe5ff]/80 drop-shadow-[0_0_10px_rgba(90,150,220,0.75)]">
              ORION
            </span>
          </Html>
        </>
      ) : null}
    </>
  );
}
