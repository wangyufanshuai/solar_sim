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
  resolveExposureV590,
  type CelestialDeviceTierV590,
  type CelestialFocusTargetV590,
  type CelestialRenderProfileV590,
  type HeroAssetAdmissionV590,
  type HeroBodyIdV590,
} from "../lib/celestialRenderingV590";
import { V590Ktx2Prewarm, disposeV590TextureLoader } from "../lib/useV590Texture";
import { V591Ktx2Prewarm, disposeV591TextureLoader } from "../lib/useV591Texture";
import CelestialBodiesV590 from "./CelestialBodiesV590";
import CelestialDeepSpaceV591 from "./CelestialDeepSpaceV591";
import {
  CELESTIAL_CAMERA_MAX_DISTANCE_V590,
  celestialCameraGoalV590,
} from "./CelestialRenderingStageV590";
import CelestialHeroOverridesV591, { suppressBaselineOverrideAdmissionsV591 } from "./CelestialHeroOverridesV591";

export const SATURN_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.8 as const;
export const MERCURY_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.04 as const;
export const MARS_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.04 as const;
export const JUPITER_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.08 as const;
export const URANUS_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.8 as const;
export const NEPTUNE_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.4 as const;
export const VESTA_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.34 as const;
export const CERES_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.38 as const;
export const BENNU_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.26 as const;
export const EROS_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.46 as const;
export const KLEOPATRA_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.52 as const;
export const TEMPEL1_MOBILE_CAMERA_DISTANCE_SCALE_V591 = 1.52 as const;

export function celestialCameraGoalV591(
  focusTarget: CelestialFocusTargetV590,
  currentPosition: readonly [number, number, number],
  deviceTier: CelestialDeviceTierV590 = "desktop",
): Readonly<{ position: readonly [number, number, number]; target: readonly [number, number, number] }> {
  const inheritedGoal = celestialCameraGoalV590(focusTarget, currentPosition, deviceTier);
  if (deviceTier !== "mobile") return inheritedGoal;
  const scale = focusTarget === "bennu"
    ? BENNU_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "eros"
    ? EROS_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "kleopatra"
    ? KLEOPATRA_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "tempel-1"
    ? TEMPEL1_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "vesta"
    ? VESTA_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "ceres"
    ? CERES_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "mercury"
      ? MERCURY_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "mars"
      ? MARS_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "jupiter"
      ? JUPITER_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "saturn"
    ? SATURN_MOBILE_CAMERA_DISTANCE_SCALE_V591
    : focusTarget === "uranus"
      ? URANUS_MOBILE_CAMERA_DISTANCE_SCALE_V591
      : focusTarget === "neptune"
        ? NEPTUNE_MOBILE_CAMERA_DISTANCE_SCALE_V591
        : 1;
  if (scale === 1) return inheritedGoal;

  const target = new THREE.Vector3(...inheritedGoal.target);
  const position = new THREE.Vector3(...inheritedGoal.position)
    .sub(target)
    .multiplyScalar(scale)
    .add(target);
  return { position: position.toArray(), target: inheritedGoal.target };
}

function CameraRigV591({
  focusTarget,
  deviceTier,
}: Readonly<{
  focusTarget: CelestialFocusTargetV590;
  deviceTier: CelestialDeviceTierV590;
}>) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controls = useRef<OrbitControlsImpl>(null);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const transitionActive = useRef(true);
  const [controlsEnabled, setControlsEnabled] = useState(false);

  useEffect(() => {
    const goal = celestialCameraGoalV591(focusTarget, camera.position.toArray(), deviceTier);
    desiredPosition.fromArray(goal.position);
    desiredTarget.fromArray(goal.target);
    transitionActive.current = true;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV591CameraSettled = "false";
      root.dataset.atlasV591CameraFocus = focusTarget;
      root.dataset.atlasV591CameraFraming = deviceTier === "mobile" && focusTarget === "saturn"
        ? "saturn-full-ring-mobile-1.8x"
        : deviceTier === "mobile" && focusTarget === "mercury"
          ? "mercury-terminator-safe-mobile-1.04x"
        : deviceTier === "mobile" && focusTarget === "mars"
          ? "mars-atmosphere-safe-mobile-1.04x"
        : deviceTier === "mobile" && focusTarget === "jupiter"
          ? "jupiter-limb-safe-mobile-1.08x"
        : deviceTier === "mobile" && focusTarget === "bennu"
          ? "bennu-full-outline-mobile-1.26x"
        : deviceTier === "mobile" && focusTarget === "eros"
          ? "eros-elongated-outline-mobile-1.46x"
        : deviceTier === "mobile" && focusTarget === "kleopatra"
          ? "kleopatra-dog-bone-outline-mobile-1.52x"
        : deviceTier === "mobile" && focusTarget === "tempel-1"
          ? "tempel-1-full-outline-mobile-1.52x"
        : deviceTier === "mobile" && focusTarget === "vesta"
          ? "vesta-full-outline-mobile-1.34x"
        : deviceTier === "mobile" && focusTarget === "ceres"
          ? "ceres-full-outline-mobile-1.38x"
        : deviceTier === "mobile" && focusTarget === "uranus"
          ? "uranus-full-faint-rings-mobile-1.8x"
          : deviceTier === "mobile" && focusTarget === "neptune"
            ? "neptune-full-faint-rings-mobile-1.4x"
            : "v590-readonly-base";
    }
    if (controls.current) controls.current.enabled = false;
    setControlsEnabled(false);
  }, [camera, desiredPosition, desiredTarget, deviceTier, focusTarget]);

  useFrame((_, delta) => {
    if (!transitionActive.current || !controls.current) return;
    const damping = 1 - Math.exp(-delta * 3.8);
    camera.position.lerp(desiredPosition, damping);
    controls.current.target.lerp(desiredTarget, damping);
    controls.current.update();
    if (
      camera.position.distanceToSquared(desiredPosition) > 1e-5
      || controls.current.target.distanceToSquared(desiredTarget) > 1e-5
    ) return;
    camera.position.copy(desiredPosition);
    controls.current.target.copy(desiredTarget);
    controls.current.update();
    transitionActive.current = false;
    controls.current.enabled = true;
    setControlsEnabled(true);
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV591CameraSettled = "true";
      root.dataset.atlasV591CameraFocus = focusTarget;
      root.dataset.atlasV591CameraPositionError = camera.position.distanceTo(desiredPosition).toExponential(3);
      root.dataset.atlasV591CameraTargetError = controls.current.target.distanceTo(desiredTarget).toExponential(3);
    }
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

function RenderProfileDirectorV591({ profile }: Readonly<{ profile: CelestialRenderProfileV590 }>) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.toneMapping = profile.mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = resolveExposureV590(profile);
  }, [gl, profile]);
  return null;
}

function RuntimeProbeV591() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.25) return;
    last.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    let v591Nodes = 0;
    scene.traverse((object) => {
      if (object.userData.atlasCandidate === "v591") v591Nodes += 1;
    });
    const resources = getAtlasResourceSnapshot();
    root.dataset.atlasV591DrawCalls = String(gl.info.render.calls);
    root.dataset.atlasV591Triangles = String(gl.info.render.triangles);
    root.dataset.atlasV591Programs = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasV591Textures = String(gl.info.memory.textures);
    root.dataset.atlasV591Geometries = String(gl.info.memory.geometries);
    root.dataset.atlasV591GpuBytes = String(resources.estimatedGpuBytes);
    root.dataset.atlasV591ResourceBytes = String(resources.estimatedBytes);
    root.dataset.atlasV591CandidateNodes = String(v591Nodes);
  });
  return null;
}

export function CelestialConvergenceReleaseProbeV591({
  active,
  baseline,
}: Readonly<{
  active: boolean;
  baseline: AtlasRuntimeResourceSnapshot;
}>) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const last = useRef(0);
  const rendererBaseline = useRef({
    textures: gl.info.memory.textures,
    geometries: gl.info.memory.geometries,
    programs: gl.info.programs?.length ?? 0,
  });
  useEffect(() => {
    if (!active) gl.renderLists.dispose();
  }, [active, gl]);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.12) return;
    last.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    const resources = getAtlasResourceSnapshot();
    const diff = diffAtlasResourceSnapshotsV300(baseline, resources);
    let nodes = 0;
    scene.traverse((object) => {
      if (object.userData.atlasCandidate === "v591") nodes += 1;
    });
    const candidateOwner = resources.byOwner["v591-celestial-convergence"];
    const candidateResources = candidateOwner?.count ?? 0;
    const memory = rendererBaseline.current;
    const programDelta = Math.max(0, (gl.info.programs?.length ?? 0) - memory.programs);
    const textureDelta = Math.max(0, gl.info.memory.textures - memory.textures);
    const geometryDelta = Math.max(0, gl.info.memory.geometries - memory.geometries);
    const released = !active
      && diff.status === "baseline"
      && candidateResources === 0
      && nodes === 0
      && programDelta <= 1
      && textureDelta === 0;
    root.dataset.atlasV591ReleaseRegistryStatus = diff.status;
    root.dataset.atlasV591ReleaseCandidateResources = String(candidateResources);
    root.dataset.atlasV591ReleaseCandidateBytes = String(candidateOwner?.estimatedBytes ?? 0);
    root.dataset.atlasV591ReleaseSceneNodes = String(nodes);
    root.dataset.atlasV591ReleaseProgramDelta = String(programDelta);
    root.dataset.atlasV591ReleaseRendererTextureDelta = String(textureDelta);
    root.dataset.atlasV591ReleaseRendererGeometryDelta = String(geometryDelta);
    root.dataset.atlasV591ReleaseRendererMemoryPolicy = "texture-zero;geometry-shared-global-observational-only";
    root.dataset.atlasV591ResourceReleaseStatus = active ? "armed" : released ? "released-zero" : "draining";
  });
  return null;
}

export default function CelestialConvergenceStageV591({
  profile,
  baselineAdmissions,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  baselineAdmissions: Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
  focusTarget: CelestialFocusTargetV590;
}>) {
  const gl = useThree((state) => state.gl);
  // v591 deep-space owns the shared read-only sky/Gaia loader lane as well as
  // Hero overlays. Keeping one lane per delivery tier prevents concurrent
  // Basis workers during overview -> close-up transitions.
  const desiredLoaderLane = profile.deliveryTier === "standalone-full" ? "v591" : "v590";
  const [loaderLane, setLoaderLane] = useState<"v590" | "v591">(desiredLoaderLane);
  const loaderLaneReady = loaderLane === desiredLoaderLane;
  const inheritedProfile = useMemo<CelestialRenderProfileV590>(() => desiredLoaderLane === "v591"
    ? { ...profile, deliveryTier: "vercel-lite" }
    : profile,
  [desiredLoaderLane, profile]);
  const isolatedBaselineAdmissions = useMemo(
    () => suppressBaselineOverrideAdmissionsV591(baselineAdmissions),
    [baselineAdmissions],
  );
  useEffect(() => {
    if (loaderLane === desiredLoaderLane) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV591Ktx2LoaderLane = "handoff";
      root.dataset.atlasV591Ktx2LoaderFrom = loaderLane;
      root.dataset.atlasV591Ktx2LoaderTo = desiredLoaderLane;
    }
    if (desiredLoaderLane === "v591") disposeV590TextureLoader(gl);
    else disposeV591TextureLoader(gl);
    setLoaderLane(desiredLoaderLane);
  }, [desiredLoaderLane, gl, loaderLane]);
  useEffect(() => {
    if (!loaderLaneReady) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (root) root.dataset.atlasV591Ktx2LoaderLane = loaderLane;
  }, [loaderLane, loaderLaneReady]);
  useEffect(() => () => {
    disposeV590TextureLoader(gl);
    disposeV591TextureLoader(gl);
  }, [gl]);
  return (
    <>
      {loaderLaneReady && loaderLane === "v590" ? <V590Ktx2Prewarm /> : null}
      {loaderLaneReady && loaderLane === "v591" ? <V591Ktx2Prewarm /> : null}
      <RenderProfileDirectorV591 profile={profile} />
      <CelestialDeepSpaceV591 profile={profile} focusTarget={focusTarget} />
      <CelestialBodiesV590 profile={inheritedProfile} admissions={isolatedBaselineAdmissions} focusTarget={focusTarget} />
      {loaderLaneReady ? <CelestialHeroOverridesV591 profile={profile} focusTarget={focusTarget} /> : null}
      <CameraRigV591 focusTarget={focusTarget} deviceTier={profile.deviceTier} />
      <RuntimeProbeV591 />
    </>
  );
}
