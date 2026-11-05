"use client";

import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  NEBULA_ALL_VISUAL_CATALOG_V592,
  NEBULA_ALL_VISUAL_IDS_V592,
  isNebulaVisualFocusTargetV592,
  nebulaVisualManifestShaForIdV592,
  selectNebulaVisualImpostorsV592,
  type LivingUniverseFocusTargetV592,
  type NebulaVisualIdV592,
} from "../lib/nebulaVisualAssetsV592";
import { CONSTELLATION_SPHERE_RADIUS_V590, raDecToCelestialPositionV590 } from "../lib/celestialDeepSpaceV590";
import type { CelestialRenderProfileV590 } from "../lib/celestialRenderingV590";
import { useNebulaVisualTextureV592, type NebulaVisualTextureStateV592 } from "../lib/useNebulaVisualTextureV592";

type NebulaCatalogEntryV592 = typeof NEBULA_ALL_VISUAL_CATALOG_V592[number];
type SliceStatusV592 = NebulaVisualTextureStateV592["status"];

function nebulaFrameV592(entry: NebulaCatalogEntryV592, depthIndex = 0): Readonly<{
  direction: THREE.Vector3;
  center: THREE.Vector3;
  east: THREE.Vector3;
  north: THREE.Vector3;
}> {
  const direction = new THREE.Vector3(...raDecToCelestialPositionV590(entry.raDeg, entry.decDeg, 1)).normalize();
  const center = direction.clone().multiplyScalar(CONSTELLATION_SPHERE_RADIUS_V590 - 0.9 - depthIndex * 0.075);
  const reference = Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const east = new THREE.Vector3().crossVectors(reference, direction).normalize();
  const north = new THREE.Vector3().crossVectors(direction, east).normalize();
  return { direction, center, east, north };
}

function NebulaFocusRigV592({ focusTarget }: Readonly<{ focusTarget: LivingUniverseFocusTargetV592 }>) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const focus = useMemo(
    () => isNebulaVisualFocusTargetV592(focusTarget)
      ? NEBULA_ALL_VISUAL_CATALOG_V592.find((entry) => entry.id === focusTarget) ?? null
      : null,
    [focusTarget],
  );
  const direction = useMemo(
    () => focus ? new THREE.Vector3(...raDecToCelestialPositionV590(focus.raDeg, focus.decDeg, 1)).normalize() : new THREE.Vector3(0, 0, -1),
    [focus],
  );
  const desiredPosition = useMemo(() => {
    const tangent = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction);
    if (tangent.lengthSq() < 1e-8) tangent.set(1, 0, 0);
    else tangent.normalize();
    return tangent.multiplyScalar(24).addScaledVector(new THREE.Vector3(0, 1, 0), 9);
  }, [direction]);
  const desiredTarget = useMemo(
    () => direction.clone().multiplyScalar(CONSTELLATION_SPHERE_RADIUS_V590 - 0.9),
    [direction],
  );
  const desiredFovDeg = useMemo(
    () => focus ? THREE.MathUtils.clamp(focus.angularSizeDeg * 3, 2.4, 14) : null,
    [focus],
  );
  const desiredQuaternion = useMemo(() => {
    const probe = new THREE.PerspectiveCamera();
    probe.position.copy(desiredPosition);
    probe.lookAt(desiredTarget);
    return probe.quaternion.clone();
  }, [desiredPosition, desiredTarget]);
  const settled = useRef(false);
  const transitionElapsed = useRef(0);
  const transitionStartPosition = useRef(new THREE.Vector3());
  const transitionStartQuaternion = useRef(new THREE.Quaternion());
  const transitionStartFovDeg = useRef(camera.fov);
  const restoreFovDeg = useRef<number | null>(null);

  useEffect(() => {
    settled.current = false;
    transitionElapsed.current = 0;
    transitionStartPosition.current.copy(camera.position);
    transitionStartQuaternion.current.copy(camera.quaternion);
    transitionStartFovDeg.current = camera.fov;
    if (focus && desiredFovDeg !== null) restoreFovDeg.current = camera.fov;
    const root = document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
    if (root && focus) {
      root.dataset.atlasV592NebulaCameraFocus = focus.id;
      root.dataset.atlasV592NebulaCameraSettled = "false";
    }
    return () => {
      if (restoreFovDeg.current !== null) {
        camera.fov = restoreFovDeg.current;
        camera.updateProjectionMatrix();
        restoreFovDeg.current = null;
      }
      if (!root) return;
      for (const key of Object.keys(root.dataset)) {
        if (key.startsWith("atlasV592NebulaCamera")) delete root.dataset[key];
      }
    };
  }, [camera, desiredFovDeg, focus]);

  useFrame((_, delta) => {
    if (!focus || desiredFovDeg === null) return;
    if (!settled.current) {
      transitionElapsed.current += Math.min(delta, 1 / 15);
      const blend = 1 - Math.exp(-transitionElapsed.current * 4.1);
      camera.position.lerpVectors(transitionStartPosition.current, desiredPosition, blend);
      camera.quaternion.slerpQuaternions(transitionStartQuaternion.current, desiredQuaternion, blend);
      camera.fov = THREE.MathUtils.lerp(transitionStartFovDeg.current, desiredFovDeg, blend);
      if (blend >= 0.9998) settled.current = true;
    } else {
      // The frozen v591 baseline owns OrbitControls. Keep the additive
      // deep-field pose absolute while focused so the two camera lanes cannot
      // converge to a tug-of-war equilibrium between frames.
      camera.position.copy(desiredPosition);
      camera.quaternion.copy(desiredQuaternion);
      camera.fov = desiredFovDeg;
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const positionError = camera.position.distanceTo(desiredPosition);
    const angleError = camera.quaternion.angleTo(desiredQuaternion);
    if (!settled.current || positionError > 1e-3 || angleError > 1e-4) return;
    camera.position.copy(desiredPosition);
    camera.quaternion.copy(desiredQuaternion);
    camera.updateMatrixWorld();
    const root = document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV592NebulaCameraSettled = "true";
      root.dataset.atlasV592NebulaCameraPositionError = positionError.toExponential(3);
      root.dataset.atlasV592NebulaCameraAngleError = angleError.toExponential(3);
      root.dataset.atlasV592NebulaCameraTargetDistance = camera.position.distanceTo(desiredTarget).toFixed(3);
      root.dataset.atlasV592NebulaCameraFovDeg = camera.fov.toFixed(3);
    }
  }, 0);

  return null;
}

function NebulaCoordinateMarkerV592({
  entry,
  profile,
  focusTarget,
}: Readonly<{
  entry: NebulaCatalogEntryV592;
  profile: CelestialRenderProfileV590;
  focusTarget: LivingUniverseFocusTargetV592;
}>) {
  const selected = focusTarget === entry.id;
  const visibleContext = focusTarget === "overview" || selected;
  const frame = useMemo(() => nebulaFrameV592(entry), [entry]);
  const geometry = useMemo(() => {
    const markerRadius = Math.max(
      0.34,
      Math.tan(THREE.MathUtils.degToRad(entry.angularSizeDeg * 0.5)) * CONSTELLATION_SPHERE_RADIUS_V590,
    );
    const positions: number[] = [];
    const segments = 36;
    for (let index = 0; index < segments; index += 1) {
      const current = index / segments * Math.PI * 2;
      const next = (index + 1) / segments * Math.PI * 2;
      positions.push(
        ...frame.center.clone().addScaledVector(frame.east, Math.cos(current) * markerRadius).addScaledVector(frame.north, Math.sin(current) * markerRadius).toArray(),
        ...frame.center.clone().addScaledVector(frame.east, Math.cos(next) * markerRadius).addScaledVector(frame.north, Math.sin(next) * markerRadius).toArray(),
      );
    }
    positions.push(
      ...frame.center.clone().addScaledVector(frame.east, -markerRadius * 1.34).toArray(),
      ...frame.center.clone().addScaledVector(frame.east, markerRadius * 1.34).toArray(),
      ...frame.center.clone().addScaledVector(frame.north, -markerRadius * 1.34).toArray(),
      ...frame.center.clone().addScaledVector(frame.north, markerRadius * 1.34).toArray(),
    );
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    next.computeBoundingSphere();
    return next;
  }, [entry.angularSizeDeg, frame]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: profile.mode === "science" ? 0x78a9bb : 0x8d9cac,
    transparent: true,
    opacity: selected ? profile.mode === "science" ? 0.86 : 0.2 : visibleContext ? 0.3 : 0.035,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [profile.mode, selected, visibleContext]);

  useEffect(() => {
    const position = geometry.getAttribute("position");
    const release = acquireAtlasResource("model", "atlas", `v592-nebula-marker-${entry.id}`, {
      owner: "v592-nebula-visual-runtime",
      estimatedBytes: position ? position.array.byteLength : 0,
      manifestSha256: nebulaVisualManifestShaForIdV592(entry.id),
    });
    return () => {
      release();
      geometry.dispose();
      material.dispose();
    };
  }, [entry.id, geometry, material]);

  return (
    <group userData={{
      atlasCandidate: "v592",
      atlasNebula: entry.id,
      atlasCoordinateFrame: "ICRS/J2000",
      atlasCoordinateState: "verified-coordinate-angular-extent-marker",
      atlasObservationBands: entry.bands.join(","),
      atlasPresentationOnly: true,
      atlasScienceImagePayload: false,
      atlasScientificPayloadWriteback: false,
    }}>
      <lineSegments geometry={geometry} material={material} frustumCulled renderOrder={-775} />
      {visibleContext && !profile.cleanView ? (
        <Html position={frame.center.toArray()} center distanceFactor={52} occlude zIndexRange={[7, 0]} style={{ pointerEvents: "none" }}>
          <span
            data-atlas-v592-nebula-marker={entry.id}
            className={`whitespace-nowrap border-l px-2 py-1 text-[6px] uppercase tracking-[0.16em] backdrop-blur-sm ${selected ? "border-[#d9c18e]/60 bg-black/46 text-[#f0d8a8]/90" : "border-sky-200/20 bg-black/24 text-sky-100/42"}`}
          >
            {entry.catalogName} · {entry.bands.join("+")} · mapped color
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function NebulaDepthSliceV592({
  entry,
  depthIndex,
  profile,
  onStatus,
}: Readonly<{
  entry: NebulaCatalogEntryV592;
  depthIndex: number;
  profile: CelestialRenderProfileV590;
  onStatus: (key: string, status: SliceStatusV592, source: NebulaVisualTextureStateV592["source"], fullQualityGate: NebulaVisualTextureStateV592["fullQualityGate"]) => void;
}>) {
  const state = useNebulaVisualTextureV592(entry.id, depthIndex, profile.deliveryTier, profile.deviceTier, true);
  const frame = useMemo(() => nebulaFrameV592(entry, depthIndex), [depthIndex, entry]);
  const aspect = profile.deliveryTier === "vercel-lite"
    ? entry.liteAspect
    : profile.deviceTier === "mobile" ? entry.mobileAspect : entry.desktopAspect;
  const geometry = useMemo(() => {
    const majorRadius = Math.max(
      2.2,
      Math.tan(THREE.MathUtils.degToRad(entry.angularSizeDeg * 0.5)) * CONSTELLATION_SPHERE_RADIUS_V590 * 1.28,
    );
    const width = majorRadius * 2;
    const height = width / aspect;
    const next = new THREE.PlaneGeometry(width, height);
    next.applyMatrix4(new THREE.Matrix4().makeBasis(frame.east, frame.north, frame.direction));
    next.translate(frame.center.x, frame.center.y, frame.center.z);
    next.computeBoundingSphere();
    return next;
  }, [aspect, entry.angularSizeDeg, frame]);
  const material = useMemo(() => state.texture ? new THREE.MeshBasicMaterial({
    map: state.texture,
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    alphaTest: 0.004,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
    premultipliedAlpha: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  }) : null, [state.texture]);

  useEffect(() => {
    onStatus(`${entry.id}:${depthIndex}`, state.status, state.source, state.fullQualityGate);
    return () => onStatus(`${entry.id}:${depthIndex}`, "idle", "none", "not-applicable");
  }, [depthIndex, entry.id, onStatus, state.fullQualityGate, state.source, state.status]);

  useEffect(() => {
    const position = geometry.getAttribute("position");
    const release = acquireAtlasResource("model", "atlas", `v592-nebula-plane-${entry.id}-${depthIndex}`, {
      owner: "v592-nebula-visual-runtime",
      estimatedBytes: position ? position.array.byteLength : 0,
      manifestSha256: nebulaVisualManifestShaForIdV592(entry.id),
    });
    return () => {
      release();
      geometry.dispose();
      material?.dispose();
    };
  }, [depthIndex, entry.id, geometry, material]);

  if (!material || state.status !== "ready") return null;
  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-774 + depthIndex}
      userData={{
        atlasCandidate: "v592",
        atlasLayer: "verified-nasa-expanded-nebula-depth-impostor",
        atlasNebula: entry.id,
        atlasDepthIndex: depthIndex,
        atlasTextureSource: state.source,
        atlasTextureSha256: state.sha256,
        atlasFullQualityGate: state.fullQualityGate,
        atlasMappedColorDisclosure: true,
        atlasPresentationOnly: true,
        atlasScientificAuthority: false,
        atlasScientificPayloadWriteback: false,
        atlasFixedJ2000Direction: true,
      }}
    />
  );
}

function NebulaFocusBackdropV592({ entry }: Readonly<{ entry: NebulaCatalogEntryV592 }>) {
  const frame = useMemo(() => nebulaFrameV592(entry, -2), [entry]);
  const geometry = useMemo(() => {
    const imageRadius = Math.max(
      2.2,
      Math.tan(THREE.MathUtils.degToRad(entry.angularSizeDeg * 0.5)) * CONSTELLATION_SPHERE_RADIUS_V590 * 1.28,
    );
    const extent = imageRadius * 6.8;
    const next = new THREE.PlaneGeometry(extent, extent);
    next.applyMatrix4(new THREE.Matrix4().makeBasis(frame.east, frame.north, frame.direction));
    next.translate(frame.center.x, frame.center.y, frame.center.z);
    next.computeBoundingSphere();
    return next;
  }, [entry.angularSizeDeg, frame]);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x010205,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
  }), []);

  useEffect(() => {
    const position = geometry.getAttribute("position");
    const release = acquireAtlasResource("model", "atlas", `v592-nebula-focus-backdrop-${entry.id}`, {
      owner: "v592-nebula-visual-runtime",
      estimatedBytes: position ? position.array.byteLength : 0,
      manifestSha256: nebulaVisualManifestShaForIdV592(entry.id),
    });
    return () => {
      release();
      geometry.dispose();
      material.dispose();
    };
  }, [entry.id, geometry, material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-779}
      userData={{
        atlasCandidate: "v592",
        atlasLayer: "deep-field-focus-black-level-protection",
        atlasNebula: entry.id,
        atlasPresentationOnly: true,
        atlasScientificAuthority: false,
        atlasScientificPayloadWriteback: false,
      }}
    />
  );
}

function NebulaDepthStackV592({
  entry,
  profile,
  onStatus,
}: Readonly<{
  entry: NebulaCatalogEntryV592;
  profile: CelestialRenderProfileV590;
  onStatus: (key: string, status: SliceStatusV592, source: NebulaVisualTextureStateV592["source"], fullQualityGate: NebulaVisualTextureStateV592["fullQualityGate"]) => void;
}>) {
  const depthCount = profile.deliveryTier === "vercel-lite" ? 1 : profile.deviceTier === "mobile" ? 2 : 4;
  return (
    <group userData={{ atlasCandidate: "v592", atlasNebula: entry.id, atlasDepthSliceCount: depthCount }}>
      {Array.from({ length: depthCount }, (_, depthIndex) => (
        <NebulaDepthSliceV592 key={`${entry.id}:${depthIndex}`} entry={entry} depthIndex={depthIndex} profile={profile} onStatus={onStatus} />
      ))}
    </group>
  );
}

export default function ExpandedNebulaLayerV592({
  profile,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  focusTarget: LivingUniverseFocusTargetV592;
}>) {
  const requested = useMemo(
    () => selectNebulaVisualImpostorsV592(profile.mode, focusTarget),
    [focusTarget, profile.mode],
  );
  const requestedSet = useMemo(() => new Set<NebulaVisualIdV592>(requested), [requested]);
  const [sliceStates, setSliceStates] = useState<Readonly<Record<string, Readonly<{ status: SliceStatusV592; source: NebulaVisualTextureStateV592["source"]; fullQualityGate: NebulaVisualTextureStateV592["fullQualityGate"] }>>>>({});
  const onStatus = useCallback((key: string, status: SliceStatusV592, source: NebulaVisualTextureStateV592["source"], fullQualityGate: NebulaVisualTextureStateV592["fullQualityGate"]) => {
    setSliceStates((current) => {
      if (status === "idle") {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      }
      const previous = current[key];
      if (previous?.status === status && previous.source === source && previous.fullQualityGate === fullQualityGate) return current;
      return { ...current, [key]: { status, source, fullQualityGate } };
    });
  }, []);
  const requestedSliceCount = requested.length * (profile.deliveryTier === "vercel-lite" ? 1 : profile.deviceTier === "mobile" ? 2 : 4);
  const readySliceCount = Object.values(sliceStates).filter((entry) => entry.status === "ready").length;
  const blockedSliceCount = Object.values(sliceStates).filter((entry) => entry.status === "blocked").length;
  const fullFallbackCount = Object.values(sliceStates).filter((entry) => entry.fullQualityGate === "blocked-full-fallback").length;
  const textureSources = [...new Set(Object.values(sliceStates).map((entry) => entry.source).filter((source) => source !== "none"))].sort().join(",") || "none";
  const readyIds = requested.filter((id) => Object.keys(sliceStates).some((key) => key.startsWith(`${id}:`) && sliceStates[key]?.status === "ready"));

  useEffect(() => {
    let ownedRoot: HTMLElement | null = null;
    let frameId = 0;
    const publish = () => {
      const root = document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
      if (!root) {
        frameId = requestAnimationFrame(publish);
        return;
      }
      ownedRoot = root;
      const runtime = profile.mode === "science"
        ? "science-marker-only"
        : blockedSliceCount > 0 ? "blocked"
          : requestedSliceCount > 0 && readySliceCount === requestedSliceCount ? "ready" : requestedSliceCount > 0 ? "loading" : "focus-suppressed";
      root.dataset.atlasV592ExpandedNebulaAdmission = `${NEBULA_ALL_VISUAL_IDS_V592.length}/18`;
      root.dataset.atlasV592NebulaGoalCoverage = `${NEBULA_ALL_VISUAL_IDS_V592.length + 6}/24`;
      root.dataset.atlasV592ExpandedNebulaRuntime = runtime;
      root.dataset.atlasV592ExpandedNebulaRequestedIds = requested.join(",") || "none";
      root.dataset.atlasV592ExpandedNebulaRequestedSliceCount = String(requestedSliceCount);
      root.dataset.atlasV592ExpandedNebulaReadySliceCount = String(readySliceCount);
      root.dataset.atlasV592ExpandedNebulaBlockedSliceCount = String(blockedSliceCount);
      root.dataset.atlasV592ExpandedNebulaFullFallbackCount = String(fullFallbackCount);
      root.dataset.atlasV592ExpandedNebulaTextureSources = textureSources;
      root.dataset.atlasV592ExpandedNebulaPresentationOnly = "true";
      root.dataset.atlasV592ExpandedNebulaScienceImagePayload = "false";
      root.dataset.atlasV592ExpandedNebulaScientificWriteback = "false";
      root.dataset.atlasV592NebulaSelectedId = isNebulaVisualFocusTargetV592(focusTarget) ? focusTarget : "none";
      root.dataset.atlasV592NebulaStatus = runtime;
      root.dataset.atlasV592NebulaRequestedIds = requested.join(",") || "none";
      root.dataset.atlasV592NebulaReadyIds = readyIds.join(",") || "none";
      root.dataset.atlasV592NebulaImpostorCount = String(readyIds.length);
      root.dataset.atlasV592NebulaRequestedImpostorCount = String(requested.length);
      root.dataset.atlasV592NebulaRuntimeBlockedImpostorCount = String(blockedSliceCount > 0 ? requested.length : 0);
    };
    frameId = requestAnimationFrame(publish);
    return () => {
      cancelAnimationFrame(frameId);
      const root = ownedRoot;
      if (!root) return;
      for (const key of Object.keys(root.dataset)) {
        if (key.startsWith("atlasV592ExpandedNebula")) delete root.dataset[key];
        if (key.startsWith("atlasV592Nebula")) delete root.dataset[key];
      }
    };
  }, [blockedSliceCount, focusTarget, fullFallbackCount, profile.mode, readyIds, readySliceCount, requested, requestedSliceCount, textureSources]);

  return (
    <group userData={{
      atlasCandidate: "v592",
      atlasLayer: "expanded-nebula-coordinate-and-depth-impostor-layer",
      atlasAssetAdmissionCount: NEBULA_ALL_VISUAL_IDS_V592.length,
      atlasGoalCoverageCount: NEBULA_ALL_VISUAL_IDS_V592.length + 6,
      atlasMaxConcurrentHighOrderNebulae: 3,
      atlasCurrentHighOrderNebulae: requested.length,
      atlasScienceImagePayload: false,
      atlasPresentationOnly: true,
      atlasScientificPayloadWriteback: false,
    }}>
      <NebulaFocusRigV592 focusTarget={focusTarget} />
      {NEBULA_ALL_VISUAL_CATALOG_V592.map((entry) => (
        <group key={entry.id}>
          <NebulaCoordinateMarkerV592 entry={entry} profile={profile} focusTarget={focusTarget} />
          {focusTarget === entry.id ? <NebulaFocusBackdropV592 entry={entry} /> : null}
          {requestedSet.has(entry.id) ? <NebulaDepthStackV592 entry={entry} profile={profile} onStatus={onStatus} /> : null}
        </group>
      ))}
    </group>
  );
}
