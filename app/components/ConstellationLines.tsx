"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type {
  AtlasCinematicCameraProfile,
  AtlasGaiaStarfieldEnhancementQualityTier,
} from "../lib/simulationDiagnosticsTypes";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { getAsterismsV255Sync, loadAsterismsV255 } from "../lib/deepSkyCatalogRuntimeV255";

const CONSTELLATION_DISTANCE_SCENE = 9500;

function raDecToSceneDir(raDeg: number, decDeg: number): THREE.Vector3 {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra));
}

type GuideDefinition = { name: string; waypoints: readonly [number, number][] };
type GuideGeometry = { positions: Float32Array; segmentCount: number };

function buildGuideGeometry(definitions: readonly GuideDefinition[]): GuideGeometry {
  let segmentCount = 0;
  for (const definition of definitions) segmentCount += Math.max(0, definition.waypoints.length - 1);
  const positions = new Float32Array(segmentCount * 6);
  let offset = 0;
  for (const definition of definitions) {
    for (let index = 0; index < definition.waypoints.length - 1; index += 1) {
      const a = raDecToSceneDir(...definition.waypoints[index]!);
      const b = raDecToSceneDir(...definition.waypoints[index + 1]!);
      positions[offset++] = a.x * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = a.y * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = a.z * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = b.x * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = b.y * CONSTELLATION_DISTANCE_SCENE;
      positions[offset++] = b.z * CONSTELLATION_DISTANCE_SCENE;
    }
  }
  return { positions, segmentCount };
}

function geometryFromPositions(positions: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function nodeGeometryFromDefinitions(definitions: readonly GuideDefinition[]): THREE.BufferGeometry {
  const seen = new Set<string>();
  const coords: number[] = [];
  for (const definition of definitions) {
    for (const [ra, dec] of definition.waypoints) {
      const key = `${ra.toFixed(3)}:${dec.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const direction = raDecToSceneDir(ra, dec);
      coords.push(direction.x * CONSTELLATION_DISTANCE_SCENE, direction.y * CONSTELLATION_DISTANCE_SCENE, direction.z * CONSTELLATION_DISTANCE_SCENE);
    }
  }
  return geometryFromPositions(new Float32Array(coords));
}

export default function ConstellationLines({
  floatingOriginRef,
  enabled = true,
  orbitAtlas = false,
  cinematicCameraProfile = "overview-atlas",
  qualityTier = "balanced",
  asterismEnabled = true,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled?: boolean;
  orbitAtlas?: boolean;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  qualityTier?: AtlasGaiaStarfieldEnhancementQualityTier;
  asterismEnabled?: boolean;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const asterismLineRef = useRef<THREE.LineSegments>(null);
  const nodeRef = useRef<THREE.Points>(null);
  const [asterisms, setAsterisms] = useState<readonly GuideDefinition[]>(() => getAsterismsV255Sync());
  useEffect(() => {
    if (!asterismEnabled) return;
    let disposed = false;
    void loadAsterismsV255()
      .then((next) => {
        if (!disposed) setAsterisms((previous) => previous === next ? previous : next);
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
    };
  }, [asterismEnabled]);
  const asterismData = useMemo(() => buildGuideGeometry(asterisms), [asterisms]);
  const constellationData = useMemo(() => buildGuideGeometry(CONSTELLATION_LINES), []);
  const constellationGeometry = useMemo(() => geometryFromPositions(constellationData.positions), [constellationData]);
  const asterismGeometry = useMemo(() => geometryFromPositions(asterismData.positions), [asterismData]);
  const nodeGeometry = useMemo(() => nodeGeometryFromDefinitions(CONSTELLATION_LINES), []);
  const lastSignatureRef = useRef("");

  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: "#8aa0b8", transparent: true, opacity: 0.18, depthWrite: false, depthTest: false,
    toneMapped: false, blending: THREE.AdditiveBlending,
  }), []);
  const asterismMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: "#6b93bd", transparent: true, opacity: 0.12, depthWrite: false, depthTest: false,
    toneMapped: false, blending: THREE.AdditiveBlending,
  }), []);
  const nodeMaterial = useMemo(() => new THREE.PointsMaterial({
    color: "#d7c48f", size: 1.12, sizeAttenuation: false, transparent: true, opacity: 0.24,
    depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending,
  }), []);

  useFrame(() => {
    const line = lineRef.current;
    const asterismLine = asterismLineRef.current;
    const nodes = nodeRef.current;
    if (!line || !asterismLine) return;
    const tier = floatingOriginRef.current.lodTier;
    const visible = enabled;
    const cinematicScale = cinematicCameraProfile === "selected-body-cinematic"
      ? 0.24
      : cinematicCameraProfile === "showcase-deep-space" ? 0.78 : 1;
    const constellationMobileScale = qualityTier === "mobile" ? 0.62 : 1;
    const constellationDenseScale = qualityTier === "dense" ? 1.12 : 1.02;
    const artPolishScale = cinematicScale * constellationMobileScale * constellationDenseScale;
    const lineOpacity = (!enabled ? 0 : orbitAtlas ? 0.028 : tier === "solar" ? 0.014 : tier === "mid" ? 0.05 : 0.105) * artPolishScale;
    const nodeOpacity = (!enabled ? 0 : orbitAtlas ? 0.024 : tier === "solar" ? 0.01 : tier === "mid" ? 0.044 : 0.098) * artPolishScale;
    const showAsterisms = visible && asterismEnabled && qualityTier !== "mobile" && tier !== "solar" && cinematicCameraProfile !== "selected-body-cinematic";
    const asterismOpacity = showAsterisms ? lineOpacity * (qualityTier === "dense" ? 0.72 : 0.48) : 0;
    const signature = [visible, tier, orbitAtlas, cinematicCameraProfile, qualityTier, lineOpacity, nodeOpacity, showAsterisms, asterismOpacity].join("|");
    if (lastSignatureRef.current === signature) return;
    lastSignatureRef.current = signature;
    line.visible = visible;
    asterismLine.visible = showAsterisms;
    if (nodes) nodes.visible = visible;
    (line.material as THREE.LineBasicMaterial).opacity = lineOpacity;
    (asterismLine.material as THREE.LineBasicMaterial).opacity = asterismOpacity;
    if (nodes) (nodes.material as THREE.PointsMaterial).opacity = nodeOpacity;
  });

  return (
    <>
      <lineSegments ref={lineRef} geometry={constellationGeometry} material={material} frustumCulled={false} renderOrder={-480} />
      <lineSegments ref={asterismLineRef} geometry={asterismGeometry} material={asterismMaterial} frustumCulled={false} renderOrder={-479} />
      <points ref={nodeRef} geometry={nodeGeometry} material={nodeMaterial} frustumCulled={false} renderOrder={-478} />
    </>
  );
}
