"use client";

import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import {
  CELESTIAL_ORBIT_BY_ID_V590,
  DEEP_SPACE_LAYERS_V590,
  HERO_BODY_SPEC_BY_ID_V590,
  celestialOrbitPointV590,
  resolveExposureV590,
  type CelestialDeviceTierV590,
  type CelestialFocusTargetV590,
  type CelestialRenderProfileV590,
  type HeroAssetAdmissionV590,
  type HeroBodyIdV590,
} from "../lib/celestialRenderingV590";
import { V590Ktx2Prewarm, disposeV590TextureLoader } from "../lib/useV590Texture";
import CelestialBodiesV590 from "./CelestialBodiesV590";
import CelestialDeepSpaceV590 from "./CelestialDeepSpaceV590";

function isHeroBodyV590(value: CelestialFocusTargetV590): value is HeroBodyIdV590 {
  return value in HERO_BODY_SPEC_BY_ID_V590;
}

function directionFromEquatorialV590(rightAscensionDeg: number, declinationDeg: number, target: THREE.Vector3): THREE.Vector3 {
  const ra = THREE.MathUtils.degToRad(rightAscensionDeg);
  const dec = THREE.MathUtils.degToRad(declinationDeg);
  return target.set(Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra));
}

function deepSpaceDirectionV590(focusTarget: CelestialFocusTargetV590, target: THREE.Vector3): THREE.Vector3 {
  if (focusTarget === "milky-way-center") return directionFromEquatorialV590(266.4051, -28.9362, target);
  if (focusTarget === "milky-way-anticenter") return directionFromEquatorialV590(86.4051, 28.9362, target);
  if (focusTarget === "orion") return directionFromEquatorialV590(83.8, -1.2, target);
  if (focusTarget === "ursa-major") return directionFromEquatorialV590(165, 55, target);
  if (focusTarget === "cassiopeia") return directionFromEquatorialV590(15, 60, target);
  const nebula = DEEP_SPACE_LAYERS_V590.find((layer) => layer.id === focusTarget);
  return nebula
    ? directionFromEquatorialV590(nebula.rightAscensionDeg, nebula.declinationDeg, target)
    : target.set(0, 0, -1);
}

export const CELESTIAL_CAMERA_UNIT_TARGET_DISTANCE_V590 = 1 as const;
export const CELESTIAL_CAMERA_MAX_DISTANCE_V590 = 96 as const;

export function celestialCameraGoalV590(
  focusTarget: CelestialFocusTargetV590,
  currentPosition: readonly [number, number, number],
  deviceTier: CelestialDeviceTierV590 = "desktop",
): Readonly<{ position: readonly [number, number, number]; target: readonly [number, number, number] }> {
  const desiredPosition = new THREE.Vector3(...currentPosition);
  const desiredTarget = new THREE.Vector3();
  if (focusTarget === "overview") {
    desiredTarget.set(0, 0, 0);
    desiredPosition.set(0, 16.5, 31.5);
  } else if (isHeroBodyV590(focusTarget)) {
    const orbit = CELESTIAL_ORBIT_BY_ID_V590[focusTarget];
    const spec = HERO_BODY_SPEC_BY_ID_V590[focusTarget];
    const point = celestialOrbitPointV590(orbit, orbit.phaseRad);
    desiredTarget.set(point[0], point[1], point[2]);
    const isSmallBody = spec.group === "small-body";
    const baseDistance = Math.max(isSmallBody ? 1.8 : 3.2, spec.radius * (focusTarget === "saturn" ? 8 : isSmallBody ? 5.2 : 6.4));
    const distance = baseDistance * (deviceTier === "mobile" ? 1.24 : 1);
    const sunward = desiredTarget.lengthSq() > 0.0001
      ? desiredTarget.clone().multiplyScalar(-1).normalize()
      : new THREE.Vector3(0.36, 0.18, 0.92).normalize();
    const tangent = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), sunward);
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
    else tangent.normalize();
    const cameraOffset = sunward.multiplyScalar(0.56)
      .addScaledVector(tangent, 0.76)
      .addScaledVector(new THREE.Vector3(0, 1, 0), 0.28)
      .normalize();
    desiredPosition.copy(desiredTarget).addScaledVector(cameraOffset, distance);
  } else {
    const direction = deepSpaceDirectionV590(focusTarget, new THREE.Vector3()).normalize();
    const tangent = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction);
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
    else tangent.normalize();
    desiredPosition.copy(tangent).multiplyScalar(24).addScaledVector(new THREE.Vector3(0, 1, 0), 9);
    desiredTarget.copy(desiredPosition).addScaledVector(direction, CELESTIAL_CAMERA_UNIT_TARGET_DISTANCE_V590);
  }
  return {
    position: desiredPosition.toArray(),
    target: desiredTarget.toArray(),
  };
}

function CameraRigV590({ focusTarget, deviceTier }: { focusTarget: CelestialFocusTargetV590; deviceTier: CelestialDeviceTierV590 }) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controls = useRef<OrbitControlsImpl>(null);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const transitionActive = useRef(true);
  const [controlsEnabled, setControlsEnabled] = useState(false);

  useEffect(() => {
    const goal = celestialCameraGoalV590(focusTarget, camera.position.toArray(), deviceTier);
    desiredPosition.fromArray(goal.position);
    desiredTarget.fromArray(goal.target);
    transitionActive.current = true;
    if (controls.current) controls.current.enabled = false;
    setControlsEnabled(false);
  }, [camera, desiredPosition, desiredTarget, deviceTier, focusTarget]);

  useFrame((_, delta) => {
    if (!transitionActive.current || !controls.current) return;
    const damping = 1 - Math.exp(-delta * 3.8);
    camera.position.lerp(desiredPosition, damping);
    controls.current.target.lerp(desiredTarget, damping);
    controls.current.update();
    if (camera.position.distanceToSquared(desiredPosition) > 1e-5
      || controls.current.target.distanceToSquared(desiredTarget) > 1e-5) return;
    camera.position.copy(desiredPosition);
    controls.current.target.copy(desiredTarget);
    controls.current.update();
    transitionActive.current = false;
    controls.current.enabled = true;
    setControlsEnabled(true);
  }, -2);

  return (
    <OrbitControls
      ref={controls}
      enabled={controlsEnabled}
      enableDamping
      dampingFactor={0.075}
      enablePan={false}
      minDistance={0.18}
      maxDistance={CELESTIAL_CAMERA_MAX_DISTANCE_V590}
      rotateSpeed={0.48}
      zoomSpeed={0.72}
    />
  );
}

function RenderProfileDirectorV590({ profile }: { profile: CelestialRenderProfileV590 }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.toneMapping = profile.mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = resolveExposureV590(profile);
  }, [gl, profile]);
  return null;
}

function RuntimeProbeV590() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.25) return;
    last.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v590-celestial-rendering-browser-acceptance"]');
    if (!root) return;
    let candidateNodes = 0;
    scene.traverse((object) => {
      if (object.userData.atlasCandidate === "v590" || object.userData.atlasHeroBodyV590 || object.userData.atlasDeepSpaceV590) candidateNodes += 1;
    });
    const resources = getAtlasResourceSnapshot();
    root.dataset.atlasV590DrawCalls = String(gl.info.render.calls);
    root.dataset.atlasV590Triangles = String(gl.info.render.triangles);
    root.dataset.atlasV590Programs = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasV590Textures = String(gl.info.memory.textures);
    root.dataset.atlasV590Geometries = String(gl.info.memory.geometries);
    root.dataset.atlasV590GpuBytes = String(resources.estimatedGpuBytes);
    root.dataset.atlasV590ResourceBytes = String(resources.estimatedBytes);
    root.dataset.atlasV590CandidateNodes = String(candidateNodes);
  });
  return null;
}

export function CelestialRenderingReleaseProbeV590({
  active,
  baseline,
}: {
  active: boolean;
  baseline: AtlasRuntimeResourceSnapshot;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const last = useRef(0);
  const rendererBaseline = useRef({
    textures: gl.info.memory.textures,
    geometries: gl.info.memory.geometries,
    programs: gl.info.programs?.length ?? 0,
  });
  useEffect(() => {
    if (active) return;
    gl.renderLists.dispose();
  }, [active, gl]);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.12) return;
    last.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v590-celestial-rendering-browser-acceptance"]');
    if (!root) return;
    const resources = getAtlasResourceSnapshot();
    const diff = diffAtlasResourceSnapshotsV300(baseline, resources);
    let nodes = 0;
    scene.traverse((object) => {
      if (object.userData.atlasCandidate === "v590" || object.userData.atlasHeroBodyV590 || object.userData.atlasDeepSpaceV590) nodes += 1;
    });
    const candidateResources = resources.byOwner["v590-celestial-rendering"]?.count ?? 0;
    const memory = rendererBaseline.current;
    const programDelta = Math.max(0, (gl.info.programs?.length ?? 0) - memory.programs);
    const released = !active
      && diff.status === "baseline"
      && candidateResources === 0
      && nodes === 0
      && gl.info.memory.geometries === memory.geometries
      && gl.info.memory.textures === memory.textures
      && programDelta <= 1;
    root.dataset.atlasV590ReleaseRegistryStatus = diff.status;
    root.dataset.atlasV590ReleaseCandidateResources = String(candidateResources);
    root.dataset.atlasV590ReleaseSceneNodes = String(nodes);
    root.dataset.atlasV590ReleaseProgramDelta = String(programDelta);
    root.dataset.atlasV590ResourceReleaseStatus = active ? "armed" : released ? "released-zero" : "draining";
  });
  return null;
}

export default function CelestialRenderingStageV590({
  profile,
  admissions,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  admissions: Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
  focusTarget: CelestialFocusTargetV590;
}>) {
  const gl = useThree((state) => state.gl);
  useEffect(() => () => disposeV590TextureLoader(gl), [gl]);
  return (
    <>
      <V590Ktx2Prewarm />
      <RenderProfileDirectorV590 profile={profile} />
      <CelestialDeepSpaceV590 profile={profile} focusTarget={focusTarget} />
      <CelestialBodiesV590 profile={profile} admissions={admissions} focusTarget={focusTarget} />
      <CameraRigV590 focusTarget={focusTarget} deviceTier={profile.deviceTier} />
      <RuntimeProbeV590 />
    </>
  );
}
