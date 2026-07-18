"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type {
  AtlasCinematicCameraProfile,
  AtlasGaiaStarfieldEnhancementQualityTier,
} from "../lib/simulationDiagnosticsTypes";
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
  enabled = true,
  orbitAtlas = false,
  cinematicCameraProfile = "overview-atlas",
  qualityTier = "balanced",
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled?: boolean;
  orbitAtlas?: boolean;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  qualityTier?: AtlasGaiaStarfieldEnhancementQualityTier;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const nodeRef = useRef<THREE.Points>(null);
  const lastConstellationFrameSignatureRef = useRef("");
  const data = useMemo(() => buildConstellationData(), []);

  useFrame(() => {
    const line = lineRef.current;
    const nodes = nodeRef.current;
    if (!line) return;
    const tier = floatingOriginRef.current.lodTier;
    const visible = enabled;
    const cinematicScale =
      cinematicCameraProfile === "selected-body-cinematic"
        ? 0.24
        : cinematicCameraProfile === "showcase-deep-space"
          ? 0.78
          : 1;
    const constellationMobileScale = qualityTier === "mobile" ? 0.62 : 1;
    const constellationDenseScale = qualityTier === "dense" ? 1.12 : 1.02;
    const artPolishScale = cinematicScale * constellationMobileScale * constellationDenseScale;
    const lineOpacity = (!enabled ? 0 : orbitAtlas ? 0.028 : tier === "solar" ? 0.014 : tier === "mid" ? 0.05 : 0.105) * artPolishScale;
    const nodeOpacity = (!enabled ? 0 : orbitAtlas ? 0.024 : tier === "solar" ? 0.01 : tier === "mid" ? 0.044 : 0.098) * artPolishScale;
    const signature = [
      "constellation-frame-signature-material-write-dedupe",
      visible,
      tier,
      orbitAtlas,
      cinematicCameraProfile,
      qualityTier,
      lineOpacity,
      nodeOpacity,
    ].join("|");
    if (lastConstellationFrameSignatureRef.current === signature) return;
    lastConstellationFrameSignatureRef.current = signature;

    line.visible = visible;
    if (nodes) nodes.visible = visible;
    const lineMat = line.material as THREE.LineBasicMaterial;
    lineMat.opacity = lineOpacity;
    const nodeMat = nodes?.material as THREE.PointsMaterial | undefined;
    if (nodeMat) nodeMat.opacity = nodeOpacity;
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

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#8aa0b8",
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
        color: "#d7c48f",
        size: 1.12,
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
    </>
  );
}
