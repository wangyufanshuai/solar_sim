"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CelestialClockControllerV592 } from "../lib/celestialClockV592";
import type { HeroBodyIdV590 } from "../lib/celestialRenderingV590";
import {
  CELESTIAL_ROTATION_ADMITTED_BODIES_V592,
  CELESTIAL_ROTATION_INCOMPLETE_BODIES_V592,
  CELESTIAL_ROTATION_KINEMATIC_BODIES_V592,
  CELESTIAL_ROTATION_PACKET_SHA256_V592,
  resolveBodyOrientationV592,
} from "../lib/celestialRotationV592";

type RotationTargetV592 = Readonly<{
  bodyId: HeroBodyIdV590;
  node: THREE.Object3D;
  placementNode: THREE.Object3D | null;
  sourceRoot: THREE.Object3D;
}>;

function candidateRootV592(): HTMLElement | null {
  return document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
}

function resolveRotationNodeV592(bodyId: HeroBodyIdV590, sourceRoot: THREE.Object3D): THREE.Object3D {
  if (bodyId !== "tempel-1") return sourceRoot;
  return sourceRoot.children.find((child) => child.type === "Group") ?? sourceRoot;
}

function discoverRotationTargetsV592(scene: THREE.Scene): ReadonlyMap<HeroBodyIdV590, RotationTargetV592> {
  const targets = new Map<HeroBodyIdV590, RotationTargetV592>();
  scene.traverse((node) => {
    const bodyId = (node.userData.atlasHeroBodyV591 ?? node.userData.atlasHeroBodyV590) as HeroBodyIdV590 | undefined;
    const admitted = node.userData.atlasAdmission === "admitted" && node.userData.atlasAssetBlocked !== true;
    if (!bodyId || !admitted || targets.has(bodyId)) return;
    targets.set(bodyId, Object.freeze({
      bodyId,
      node: resolveRotationNodeV592(bodyId, node),
      placementNode: bodyId === "earth" && node.parent?.userData.atlasHeroPlacementV591 === "earth" ? node.parent : null,
      sourceRoot: node,
    }));
  });
  return targets;
}

function instrumentSolarDifferentialMaterialV592(material: THREE.Material): boolean {
  if (!(material instanceof THREE.ShaderMaterial)) return false;
  if (!material.uniforms.uPhotosphere || material.userData.atlasV592DifferentialRotation === true) {
    return material.userData.atlasV592DifferentialRotation === true;
  }
  const declaration = "uniform float uEpoch;";
  const anchor = "    vec3 observed = texture2D(uPhotosphere, vUv).rgb;";
  if (!material.fragmentShader.includes(declaration) || !material.fragmentShader.includes(anchor)) return false;
  material.uniforms.uPhysicalDaysV592 = { value: 0 };
  material.fragmentShader = material.fragmentShader
    .replace(declaration, `${declaration}\n  uniform float uPhysicalDaysV592;`)
    .replace(anchor, `    float v592SinLatitude2 = n.y * n.y;
    float v592DifferentialRate = 14.713 - 2.396 * v592SinLatitude2 - 1.787 * v592SinLatitude2 * v592SinLatitude2;
    float v592LongitudeOffset = uPhysicalDaysV592 * (v592DifferentialRate - 14.1844) / 360.0;
    vec2 v592SolarUv = vec2(fract(vUv.x + v592LongitudeOffset), vUv.y);
    vec3 observed = texture2D(uPhotosphere, v592SolarUv).rgb;`)
    .replace("texture2D(uChromosphere, vUv).rgb", "texture2D(uChromosphere, v592SolarUv).rgb")
    .replaceAll("texture2D(uPhotosphere, vUv +", "texture2D(uPhotosphere, v592SolarUv +")
    .replaceAll("texture2D(uPhotosphere, vUv -", "texture2D(uPhotosphere, v592SolarUv -");
  material.userData.atlasV592DifferentialRotation = true;
  material.userData.atlasV592DifferentialRotationPolicy = "bounded-photospheric-presentation-model-not-observation";
  material.needsUpdate = true;
  return true;
}

function instrumentSolarDifferentialRootV592(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) if (instrumentSolarDifferentialMaterialV592(material)) count += 1;
  });
  return count;
}

function updateSolarDifferentialRootV592(root: THREE.Object3D, daysSinceJ2000: number): number {
  let count = 0;
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!(material instanceof THREE.ShaderMaterial) || material.userData.atlasV592DifferentialRotation !== true) continue;
      const uniform = material.uniforms.uPhysicalDaysV592;
      if (uniform) uniform.value = daysSinceJ2000;
      count += 1;
    }
  });
  return count;
}

export default function CelestialRotationBridgeV592({
  clock,
}: Readonly<{
  clock: CelestialClockControllerV592;
}>) {
  const scene = useThree((state) => state.scene);
  const targets = useRef<ReadonlyMap<HeroBodyIdV590, RotationTargetV592>>(new Map());
  const lastDiscoveryFrame = useRef(-1_000);
  const frameCount = useRef(0);
  const lastTelemetrySeconds = useRef(-1);
  const sunMaterials = useRef(0);
  const previousPrimeMeridians = useRef(new Map<HeroBodyIdV590, number>());
  const quaternion = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    const root = candidateRootV592();
    if (!root) return;
    root.dataset.atlasV592RotationPacketSha = CELESTIAL_ROTATION_PACKET_SHA256_V592;
    root.dataset.atlasV592RotationAdmission = `${CELESTIAL_ROTATION_ADMITTED_BODIES_V592.length}/16`;
    root.dataset.atlasV592RotationKinematicAdmission = `${CELESTIAL_ROTATION_KINEMATIC_BODIES_V592.length}/16`;
    root.dataset.atlasV592RotationIncomplete = CELESTIAL_ROTATION_INCOMPLETE_BODIES_V592.join(",") || "none";
    root.dataset.atlasV592PhysicalClockWriteback = "false";
  }, []);

  useFrame(({ clock: frameClock }, delta) => {
    frameCount.current += 1;
    if (frameCount.current - lastDiscoveryFrame.current >= 30 || targets.current.size === 0) {
      targets.current = discoverRotationTargetsV592(scene);
      lastDiscoveryFrame.current = frameCount.current;
      const sun = targets.current.get("sun");
      if (sun) sunMaterials.current = instrumentSolarDifferentialRootV592(sun.sourceRoot);
    }

    const julianDate = clock.getJulianDate(performance.now());
    const daysSinceJ2000 = julianDate - 2_451_545;
    let applied = 0;
    const appliedBodies: string[] = [];
    const primeMeridians: string[] = [];
    let rotationMotion = false;
    for (const [bodyId, target] of targets.current) {
      const orientation = resolveBodyOrientationV592(bodyId, julianDate);
      if (!orientation.quaternionScene) continue;
      const previousPrimeMeridian = previousPrimeMeridians.current.get(bodyId);
      if (
        previousPrimeMeridian !== undefined
        && orientation.primeMeridianDeg !== null
        && Math.abs(orientation.primeMeridianDeg - previousPrimeMeridian) > 1e-10
      ) rotationMotion = true;
      if (orientation.primeMeridianDeg !== null) previousPrimeMeridians.current.set(bodyId, orientation.primeMeridianDeg);
      quaternion.fromArray(orientation.quaternionScene);
      if (target.placementNode) target.placementNode.quaternion.identity();
      target.node.quaternion.copy(quaternion);
      target.node.userData.atlasV592RotationAuthority = orientation.authority;
      target.node.userData.atlasV592RotationKinematicAuthority = orientation.kinematicAuthority;
      target.node.userData.atlasV592AbsolutePrimeMeridian = orientation.absolutePrimeMeridian;
      target.node.userData.atlasV592PrimeMeridianDeg = orientation.primeMeridianDeg;
      target.node.userData.atlasV592PhysicalJulianDate = julianDate;
      target.node.userData.atlasV592ScientificPayloadWriteback = false;
      appliedBodies.push(bodyId);
      primeMeridians.push(`${bodyId}:${orientation.primeMeridianDeg === null ? "unknown" : orientation.primeMeridianDeg.toFixed(6)}`);
      applied += 1;
    }
    const sun = targets.current.get("sun");
    if (sun) sunMaterials.current = updateSolarDifferentialRootV592(sun.sourceRoot, daysSinceJ2000);

    if (frameClock.elapsedTime - lastTelemetrySeconds.current < 0.25) return;
    lastTelemetrySeconds.current = frameClock.elapsedTime;
    const root = candidateRootV592();
    if (!root) return;
    const readout = clock.getReadout(performance.now());
    root.dataset.atlasV592JulianDate = readout.julianDate.toFixed(8);
    root.dataset.atlasV592J2000Days = readout.daysSinceJ2000.toFixed(8);
    root.dataset.atlasV592Utc = readout.utcIso;
    root.dataset.atlasV592TimeRate = String(readout.rateSecondsPerSecond);
    root.dataset.atlasV592TimeDirection = readout.rateSecondsPerSecond < 0 ? "reverse" : readout.rateSecondsPerSecond === 0 ? "paused" : "forward";
    root.dataset.atlasV592RotationTargets = String(targets.current.size);
    const sceneCandidates: string[] = [];
    const sceneAdmitted: string[] = [];
    scene.traverse((node) => {
      const bodyId = (node.userData.atlasHeroBodyV591 ?? node.userData.atlasHeroBodyV590) as HeroBodyIdV590 | undefined;
      if (!bodyId) return;
      if (!sceneCandidates.includes(bodyId)) sceneCandidates.push(bodyId);
      if (node.userData.atlasAdmission === "admitted" && node.userData.atlasAssetBlocked !== true && !sceneAdmitted.includes(bodyId)) sceneAdmitted.push(bodyId);
    });
    root.dataset.atlasV592RotationSceneCandidates = sceneCandidates.join(",") || "none";
    root.dataset.atlasV592RotationSceneAdmitted = sceneAdmitted.join(",") || "none";
    root.dataset.atlasV592RotationApplied = String(applied);
    root.dataset.atlasV592RotationAppliedBodies = appliedBodies.join(",") || "none";
    root.dataset.atlasV592RotationPrimeMeridians = primeMeridians.join("|") || "none";
    root.dataset.atlasV592RotationMotion = rotationMotion
      ? "advancing"
      : readout.rateSecondsPerSecond === 0 ? "paused" : "initializing";
    root.dataset.atlasV592SunDifferentialMaterials = String(sunMaterials.current);
    root.dataset.atlasV592SunDifferentialRotation = sunMaterials.current > 0 ? "active-presentation-physics-model" : "awaiting-sun-material";
    root.dataset.atlasV592FrameDeltaMs = (delta * 1_000).toFixed(3);
  }, -1);

  return null;
}
