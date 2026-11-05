"use client";

import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  CELESTIAL_SPHERE_RADIUS_V590,
  starPsfRotationV590,
} from "../lib/celestialDeepSpaceV590";
import {
  CONSTELLATION_NAME_COVERAGE_V592,
  CONSTELLATION_RENDER_RADIUS_V592,
  constellationFocusCodeV592,
  constellationHorizontalViewOffsetPxV592,
  constellationLabelCountV592,
  constellationLabelV592,
  constellationMobileFovDegV592,
  defaultConstellationCodesV592,
  visibleConstellationCodesV592,
} from "../lib/livingConstellationsV592";
import { selectStarRenderIndicesV591 } from "../lib/celestialDeepSpaceV591";
import type { CelestialRenderProfileV590 } from "../lib/celestialRenderingV590";
import { LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592 } from "../lib/livingUniverseV592";
import ConstellationEngravingV592 from "./ConstellationEngravingV592";
import type {
  LivingConstellationRangeV592,
  LivingStarfieldResponseV592,
} from "../workers/livingStarfieldV592.worker";

type PointsResponseV592 = Extract<LivingStarfieldResponseV592, { type: "points" }>;
type SnapshotResponseV592 = Extract<LivingStarfieldResponseV592, { type: "snapshot" }>;

const STAR_POINT_VERTEX_V592 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  attribute float aSize;
  attribute float aFlux;
  attribute vec3 aLinearRgb;
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uRadius;
  uniform float uPixelRatio;
  uniform float uSizeGain;
  void main() {
    vLinearRgb = aLinearRgb;
    vFlux = aFlux;
    vec4 mv = modelViewMatrix * vec4(normalize(position) * uRadius, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * uSizeGain, 0.55, 6.8);
    gl_Position = projectionMatrix * mv;
    #include <logdepthbuf_vertex>
  }
`;

const STAR_POINT_FRAGMENT_V592 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uCinematic;
  uniform float uOpacity;
  void main() {
    #include <logdepthbuf_fragment>
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float radius = sqrt(r2);
    float moffat = pow(1.0 + r2 * 9.0, -2.15);
    float airy = exp(-radius * 3.8) * (0.5 + 0.5 * cos(radius * 19.0));
    float cinematicHalo = airy * 0.028 * uCinematic;
    float response = log(1.0 + max(vFlux, 0.0) * 18.0) / log(19.0);
    float fluxGain = clamp(0.76 + pow(max(vFlux, 0.000001), 0.12), 0.76, 1.5);
    float alpha = clamp((moffat * (0.32 + response * 0.88) + cinematicHalo) * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(vLinearRgb * fluxGain * (0.50 + moffat * (0.92 + response * 0.82) + cinematicHalo), alpha);
    #include <colorspace_fragment>
  }
`;

const STAR_PSF_VERTEX_V592 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  attribute vec3 aCenter;
  attribute vec3 aLinearRgb;
  attribute float aSize;
  attribute float aFlux;
  attribute float aRotation;
  varying vec2 vPsf;
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform vec2 uViewport;
  uniform float uRadius;
  uniform float uPixelRatio;
  uniform float uSizeGain;
  void main() {
    vec4 mv = modelViewMatrix * vec4(normalize(aCenter) * uRadius, 1.0);
    vec4 clip = projectionMatrix * mv;
    if (clip.w <= 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vPsf = position.xy;
      vLinearRgb = aLinearRgb;
      vFlux = aFlux;
      return;
    }
    float sine = sin(aRotation);
    float cosine = cos(aRotation);
    vec2 rotated = mat2(cosine, -sine, sine, cosine) * position.xy;
    float pixels = aSize * uPixelRatio * uSizeGain;
    vec2 offset = rotated * pixels * 2.0 / max(uViewport, vec2(1.0));
    clip.xy += offset * clip.w;
    gl_Position = clip;
    #include <logdepthbuf_vertex>
    vPsf = position.xy;
    vLinearRgb = aLinearRgb;
    vFlux = aFlux;
  }
`;

const STAR_PSF_FRAGMENT_V592 = /* glsl */ `
  precision highp float;
  #include <logdepthbuf_pars_fragment>
  varying vec2 vPsf;
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uCinematic;
  void main() {
    #include <logdepthbuf_fragment>
    float radius = length(vPsf);
    if (radius > 1.0) discard;
    float r2 = radius * radius;
    float moffat = pow(1.0 + r2 * 18.0, -2.35);
    float airy = exp(-radius * 4.0) * (0.5 + 0.5 * cos(radius * 25.0));
    float spikeX = exp(-abs(vPsf.x) * 52.0) * exp(-abs(vPsf.y) * 3.2);
    float spikeY = exp(-abs(vPsf.y) * 52.0) * exp(-abs(vPsf.x) * 3.2);
    float presentation = (airy * 0.048 + (spikeX + spikeY) * 0.024) * uCinematic;
    float response = log(1.0 + max(vFlux, 0.0) * 96.0) / log(97.0);
    float fluxGain = clamp(0.94 + pow(max(vFlux, 0.000001), 0.16), 0.94, 2.0);
    float alpha = clamp(moffat * (0.55 + response * 0.72) + presentation, 0.0, 1.0);
    gl_FragColor = vec4(vLinearRgb * fluxGain * (0.60 + moffat * (1.5 + response * 1.4) + presentation * 0.35), alpha);
    #include <colorspace_fragment>
  }
`;

function disposeAfterDetachV592(resource: { dispose: () => void }): void {
  resource.dispose();
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resource.dispose()));
}

function useLivingStarfieldV592(profile: CelestialRenderProfileV590) {
  const [points, setPoints] = useState<PointsResponseV592 | null>(null);
  const [telemetry, setTelemetry] = useState<SnapshotResponseV592>({
    type: "snapshot",
    requestId: 592_001,
    status: "loading",
    catalogVersion: "none",
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    anchorCount: 0,
    constellationCount: 0,
    waypointCount: 0,
    transferredBytes: 0,
    reason: "initializing",
  });
  useEffect(() => {
    const worker = new Worker(new URL("../workers/livingStarfieldV592.worker.ts", import.meta.url), { type: "module" });
    const requestId = 592_001;
    const releaseWorker = acquireAtlasResource("worker", "atlas", "v592-living-starfield-worker", {
      owner: "v592-living-universe",
    });
    let releaseArrays: (() => void) | null = null;
    const onMessage = (event: MessageEvent<LivingStarfieldResponseV592>) => {
      if (event.data.requestId !== requestId) return;
      if (event.data.type === "snapshot") {
        setTelemetry(event.data);
        return;
      }
      releaseArrays?.();
      const estimatedBytes = [
        event.data.directions,
        event.data.linearRgb,
        event.data.apparentFlux,
        event.data.sizes,
        event.data.psfClass,
        event.data.sourceIds,
        event.data.constellationAnchorIndex,
        event.data.constellationSegments,
      ].reduce((sum, value) => sum + value.byteLength, 0);
      releaseArrays = acquireAtlasResource("typed-array-cache", "atlas", "v592-living-starfield-arrays", {
        owner: "v592-living-universe",
        estimatedBytes,
      });
      setPoints(event.data);
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({
      type: "load",
      requestId,
      deliveryTier: profile.deliveryTier,
      deviceTier: profile.deviceTier,
    });
    return () => {
      worker.postMessage({ type: "release", requestId: requestId + 1 });
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      setPoints(null);
      releaseArrays?.();
      releaseWorker();
    };
  }, [profile.deliveryTier, profile.deviceTier]);
  return { points, telemetry };
}

function LegacyGaiaIsolationV592() {
  const scene = useThree((state) => state.scene);
  const hidden = useRef(new Map<THREE.Object3D, boolean>());
  const frame = useRef(0);
  useFrame(() => {
    frame.current += 1;
    if (frame.current % 20 !== 1) return;
    scene.traverse((node) => {
      if (node.userData.atlasLayer !== "gaia-v591-deterministic-psf-sphere") return;
      if (!hidden.current.has(node)) hidden.current.set(node, node.visible);
      node.visible = false;
    });
  }, -0.72);
  useEffect(() => () => {
    for (const [node, visible] of hidden.current) node.visible = visible;
    hidden.current.clear();
  }, []);
  return null;
}

function PointStarsV592({
  points,
  indices,
  profile,
  closeup,
}: Readonly<{
  points: PointsResponseV592;
  indices: readonly number[];
  profile: CelestialRenderProfileV590;
  closeup: boolean;
}>) {
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => {
    const positions = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const flux = new Float32Array(indices.length);
    const sizes = new Float32Array(indices.length);
    indices.forEach((sourceIndex, targetIndex) => {
      positions.set(points.directions.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      colors.set(points.linearRgb.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      flux[targetIndex] = points.apparentFlux[sourceIndex] ?? 0;
      sizes[targetIndex] = points.sizes[sourceIndex] ?? 1;
    });
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    next.setAttribute("aLinearRgb", new THREE.BufferAttribute(colors, 3));
    next.setAttribute("aFlux", new THREE.BufferAttribute(flux, 1));
    next.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    next.computeBoundingSphere();
    return next;
  }, [indices, points]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STAR_POINT_VERTEX_V592,
    fragmentShader: STAR_POINT_FRAGMENT_V592,
    uniforms: {
      uRadius: { value: CELESTIAL_SPHERE_RADIUS_V590 - 0.06 },
      uPixelRatio: { value: Math.min(1.75, gl.getPixelRatio()) },
      uSizeGain: { value: (profile.mode === "cinematic" ? 1.05 : 0.82) * (closeup ? 0.74 : 1) },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
      uOpacity: { value: closeup ? 0.34 : profile.mode === "cinematic" ? 0.90 : 0.76 },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [closeup, gl, profile.mode]);
  useEffect(() => () => disposeAfterDetachV592(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-847} />;
}

function BrightStarsV592({
  points,
  indices,
  profile,
  closeup,
}: Readonly<{
  points: PointsResponseV592;
  indices: readonly number[];
  profile: CelestialRenderProfileV590;
  closeup: boolean;
}>) {
  const viewport = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => {
    const centers = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const flux = new Float32Array(indices.length);
    const sizes = new Float32Array(indices.length);
    const rotations = new Float32Array(indices.length);
    indices.forEach((sourceIndex, targetIndex) => {
      centers.set(points.directions.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      colors.set(points.linearRgb.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      flux[targetIndex] = points.apparentFlux[sourceIndex] ?? 0;
      sizes[targetIndex] = (points.sizes[sourceIndex] ?? 1) * 1.86;
      rotations[targetIndex] = starPsfRotationV590(points.sourceIds[sourceIndex] ?? BigInt(0));
    });
    const next = new THREE.InstancedBufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    next.setIndex([0, 1, 2, 0, 2, 3]);
    next.setAttribute("aCenter", new THREE.InstancedBufferAttribute(centers, 3));
    next.setAttribute("aLinearRgb", new THREE.InstancedBufferAttribute(colors, 3));
    next.setAttribute("aFlux", new THREE.InstancedBufferAttribute(flux, 1));
    next.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes, 1));
    next.setAttribute("aRotation", new THREE.InstancedBufferAttribute(rotations, 1));
    next.instanceCount = indices.length;
    return next;
  }, [indices, points]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STAR_PSF_VERTEX_V592,
    fragmentShader: STAR_PSF_FRAGMENT_V592,
    uniforms: {
      uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uRadius: { value: CELESTIAL_SPHERE_RADIUS_V590 - 0.06 },
      uPixelRatio: { value: Math.min(1.75, gl.getPixelRatio()) },
      uSizeGain: { value: (profile.mode === "cinematic" ? 1.12 : 0.86) * (closeup ? 0.76 : 1) },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [closeup, gl, profile.mode, viewport.height, viewport.width]);
  useEffect(() => {
    material.uniforms.uViewport.value.set(viewport.width, viewport.height);
  }, [material, viewport.height, viewport.width]);
  useEffect(() => () => disposeAfterDetachV592(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-846} />;
}

type ConstellationViewV592 = Readonly<{
  visibleCodes: readonly string[];
  visibleRanges: readonly LivingConstellationRangeV592[];
  backgroundRanges: readonly LivingConstellationRangeV592[];
  focusedRange: LivingConstellationRangeV592 | null;
  labelRanges: readonly LivingConstellationRangeV592[];
  focusedCode: string | null;
  segmentCount: number;
  focusedSegmentCount: number;
}>;

function buildConstellationGeometryV592(
  points: PointsResponseV592,
  ranges: readonly LivingConstellationRangeV592[],
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const range of ranges) {
    const start = range.segmentOffset * 6;
    positions.push(...points.constellationSegments.subarray(start, start + range.segmentCount * 6));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function ConstellationLineLayerV592({
  points,
  ranges,
  profile,
  focused,
  closeup,
}: Readonly<{
  points: PointsResponseV592;
  ranges: readonly LivingConstellationRangeV592[];
  profile: CelestialRenderProfileV590;
  focused: boolean;
  closeup: boolean;
}>) {
  const geometry = useMemo(() => buildConstellationGeometryV592(points, ranges), [points, ranges]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: focused
      ? profile.mode === "science" ? 0xb9e7f2 : 0xd2e9ef
      : profile.mode === "science" ? 0x77a9bb : 0x8aa7b8,
    transparent: true,
    opacity: focused
      ? profile.mode === "science" ? 0.88 : 0.72
      : closeup ? 0.035 : profile.mode === "science" ? 0.46 : 0.30,
    linewidth: focused ? 1.2 : 0.65,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [closeup, focused, profile.mode]);
  useEffect(() => () => {
    disposeAfterDetachV592(geometry);
    material.dispose();
  }, [geometry, material]);
  if (ranges.length === 0) return null;
  return (
    <lineSegments
      geometry={geometry}
      material={material}
      renderOrder={focused ? -835 : -836}
      frustumCulled={false}
      userData={{
        atlasCandidate: "v592",
        atlasLayer: focused ? "focused-gaia-constellation-v592" : "default-gaia-constellations-v592",
        atlasDepthOcclusion: true,
        atlasNormalizedCelestialSphere: true,
      }}
    />
  );
}

function FocusedConstellationNodesV592({
  points,
  range,
  mode,
}: Readonly<{
  points: PointsResponseV592;
  range: LivingConstellationRangeV592 | null;
  mode: CelestialRenderProfileV590["mode"];
}>) {
  const geometry = useMemo(() => {
    if (!range) return new THREE.BufferGeometry();
    const start = range.segmentOffset * 6;
    const values = points.constellationSegments.subarray(start, start + range.segmentCount * 6);
    const unique = new Map<string, readonly [number, number, number]>();
    for (let index = 0; index + 2 < values.length; index += 3) {
      const coordinate = [values[index] ?? 0, values[index + 1] ?? 0, values[index + 2] ?? 0] as const;
      unique.set(coordinate.map((value) => value.toFixed(5)).join(":"), coordinate);
    }
    const positions = new Float32Array(unique.size * 3);
    let offset = 0;
    for (const coordinate of unique.values()) {
      positions.set(coordinate, offset);
      offset += 3;
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    next.computeBoundingSphere();
    return next;
  }, [points.constellationSegments, range]);
  const material = useMemo(() => new THREE.PointsMaterial({
    color: mode === "science" ? 0xd4f4fa : 0xe8f7fa,
    size: mode === "science" ? 3.2 : 3.8,
    sizeAttenuation: false,
    transparent: true,
    opacity: mode === "science" ? 0.88 : 0.76,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [mode]);
  useEffect(() => () => {
    disposeAfterDetachV592(geometry);
    material.dispose();
  }, [geometry, material]);
  if (!range) return null;
  return <points geometry={geometry} material={material} renderOrder={-834} frustumCulled={false} />;
}

function isForegroundHeroMeshV592(node: THREE.Object3D): node is THREE.Mesh {
  if (!(node instanceof THREE.Mesh)) return false;
  let current: THREE.Object3D | null = node;
  let heroAncestor = false;
  while (current) {
    if (!current.visible) return false;
    if (
      typeof current.userData.atlasHeroBodyV590 === "string"
      || typeof current.userData.atlasHeroBodyV591 === "string"
      || typeof current.userData.atlasMajorMoonIdV592 === "string"
      || typeof current.userData.atlasStellarHeroIdV592 === "string"
    ) heroAncestor = true;
    current = current.parent;
  }
  return heroAncestor;
}

function useForegroundHeroOccludersV592(focusTarget: string): readonly RefObject<THREE.Object3D>[] {
  const scene = useThree((state) => state.scene);
  const [occluders, setOccluders] = useState<readonly RefObject<THREE.Object3D>[]>([]);
  useEffect(() => {
    let cancelled = false;
    const collect = () => {
      if (cancelled) return;
      const next: RefObject<THREE.Object3D>[] = [];
      scene.traverse((node) => {
        if (isForegroundHeroMeshV592(node)) next.push({ current: node });
      });
      setOccluders(next);
    };
    collect();
    const frame = window.requestAnimationFrame(collect);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      setOccluders([]);
    };
  }, [focusTarget, scene]);
  return occluders;
}

function MobileConstellationFramingV592({
  range,
  profile,
}: Readonly<{
  range: LivingConstellationRangeV592 | null;
  profile: CelestialRenderProfileV590;
}>) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const size = useThree((state) => state.size);
  const center = useMemo(() => range ? new THREE.Vector3(...range.center) : null, [range]);
  const active = profile.deviceTier === "mobile" && Boolean(range);
  useEffect(() => {
    if (!active) return;
    const restoredFov = camera.fov;
    return () => {
      camera.clearViewOffset();
      camera.fov = restoredFov;
      camera.updateProjectionMatrix();
      const root = document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
      if (root) {
        root.dataset.atlasV592ConstellationCameraFraming = "inactive";
        root.dataset.atlasV592ConstellationCameraViewOffsetPx = "0.00";
      }
    };
  }, [active, camera, range?.code]);
  useFrame(() => {
    if (!active || !center || !range || !constellationFocusCodeV592(profile.focusTarget)) return;
    camera.clearViewOffset();
    camera.fov = constellationMobileFovDegV592(range.code as "Ori" | "UMa" | "Cas");
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const ndc = center.clone().project(camera);
    const offsetX = constellationHorizontalViewOffsetPxV592(ndc.x, size.width);
    camera.setViewOffset(size.width, size.height, offsetX, 0, size.width, size.height);
    camera.updateProjectionMatrix();
    const root = document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
    if (root) {
      root.dataset.atlasV592ConstellationCameraFraming = "mobile-focus-projection-only";
      root.dataset.atlasV592ConstellationCameraFocusCode = range.code;
      root.dataset.atlasV592ConstellationCameraFovDeg = camera.fov.toFixed(2);
      root.dataset.atlasV592ConstellationCameraViewOffsetPx = offsetX.toFixed(2);
      root.dataset.atlasV592ConstellationCameraCoordinateMutation = "false";
    }
  }, -0.25);
  return null;
}

function ConstellationsV592({
  points,
  profile,
  closeup,
  view,
}: Readonly<{
  points: PointsResponseV592;
  profile: CelestialRenderProfileV590;
  closeup: boolean;
  view: ConstellationViewV592;
}>) {
  const foregroundOccluders = useForegroundHeroOccludersV592(profile.focusTarget);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
    if (!root) return;
    root.dataset.atlasV592ConstellationForegroundOccluderCount = String(foregroundOccluders.length);
  }, [foregroundOccluders.length]);
  return (
    <group userData={{
      atlasCandidate: "v592",
      atlasLayer: "gaia-anchored-constellations-v592",
      atlasConstellationCount: points.constellationRanges.length,
      atlasVisibleConstellationCodes: view.visibleCodes.join(","),
      atlasFocusedConstellationCode: view.focusedCode ?? "none",
      atlasIauBoundaryAdmission: CONSTELLATION_NAME_COVERAGE_V592.iauBoundaryAdmission,
    }}>
      <ConstellationLineLayerV592 points={points} ranges={view.backgroundRanges} profile={profile} focused={false} closeup={closeup} />
      <ConstellationEngravingV592 segments={points.constellationSegments} range={view.focusedRange} profile={profile} />
      <ConstellationLineLayerV592 points={points} ranges={view.focusedRange ? [view.focusedRange] : []} profile={profile} focused closeup={closeup} />
      <FocusedConstellationNodesV592 points={points} range={view.focusedRange} mode={profile.mode} />
      {view.labelRanges.map((range: LivingConstellationRangeV592) => {
        const label = constellationLabelV592(range.code, range.name);
        const focused = range.code === view.focusedCode;
        return (
        <Html
          key={range.code}
          position={range.center as [number, number, number]}
          center
          distanceFactor={focused
            ? profile.deviceTier === "mobile" ? 150 : 174
            : profile.deviceTier === "mobile" ? 108 : 132}
          occlude={foregroundOccluders.length > 0 ? [...foregroundOccluders] : false}
          zIndexRange={[5, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span
            data-atlas-v592-constellation-label={range.code}
            data-atlas-v592-constellation-focused={String(focused)}
            className={`whitespace-nowrap rounded-sm border bg-black/48 px-2 py-1 text-sky-50 backdrop-blur-[1px] ${focused ? "border-sky-100/24 text-[9px] tracking-[0.14em]" : "border-sky-100/10 text-[7px] tracking-[0.12em] opacity-65"}`}
          >
            <span className="font-medium uppercase">{label.latin}</span>
            {label.chinese ? <span className="ml-1.5 text-sky-100/58">{label.chinese}</span> : null}
            <span className="ml-1.5 font-mono text-[0.78em] text-sky-100/38">{label.code}</span>
          </span>
        </Html>
        );
      })}
    </group>
  );
}

export default function LivingStarfieldV592({
  profile,
  closeup,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  closeup: boolean;
}>) {
  const { points, telemetry } = useLivingStarfieldV592(profile);
  const selection = useMemo(() => points ? selectStarRenderIndicesV591({
    apparentFlux: points.apparentFlux,
    psfClass: points.psfClass,
    sourceIds: points.sourceIds,
    constellationAnchorIndex: points.constellationAnchorIndex,
    deviceTier: profile.deviceTier,
  }) : null, [points, profile.deviceTier]);
  const constellationView = useMemo<ConstellationViewV592>(() => {
    const visibleCodes = visibleConstellationCodesV592(profile.deviceTier, profile.focusTarget);
    const codeSet = new Set(visibleCodes);
    const focusedCode = constellationFocusCodeV592(profile.focusTarget);
    const visibleRanges = points?.constellationRanges.filter((range) => codeSet.has(range.code)) ?? [];
    const focusedRange = focusedCode
      ? visibleRanges.find((range) => range.code === focusedCode) ?? null
      : null;
    const backgroundRanges = focusedRange
      ? visibleRanges.filter((range) => range.code !== focusedRange.code)
      : visibleRanges;
    const labelCount = constellationLabelCountV592({
      visibleCodeCount: visibleRanges.length,
      focusedCode,
      closeup,
      cleanView: profile.cleanView,
    });
    const labelRanges = labelCount === 0
      ? []
      : focusedRange
        ? [focusedRange]
        : visibleRanges;
    return Object.freeze({
      visibleCodes,
      visibleRanges,
      backgroundRanges,
      focusedRange,
      labelRanges,
      focusedCode,
      segmentCount: visibleRanges.reduce((sum, range) => sum + range.segmentCount, 0),
      focusedSegmentCount: focusedRange?.segmentCount ?? 0,
    });
  }, [closeup, points, profile.cleanView, profile.deviceTier, profile.focusTarget]);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
    if (!root) return;
    root.dataset.atlasV592GaiaStatus = telemetry.status;
    root.dataset.atlasV592GaiaCatalog = telemetry.catalogVersion;
    root.dataset.atlasV592GaiaRecordCount = String(telemetry.recordCount);
    root.dataset.atlasV592GaiaAnchorCount = String(telemetry.anchorCount);
    root.dataset.atlasV592GaiaTransferredBytes = String(telemetry.transferredBytes);
    root.dataset.atlasV592GaiaReason = telemetry.reason;
    root.dataset.atlasV592GaiaTransport = "direct-public-sha-verified-readonly-v592";
    root.dataset.atlasV592GaiaFullSupplement = profile.deliveryTier === "standalone-full" && profile.deviceTier === "desktop"
      ? telemetry.recordCount === 60_000 ? "ready-14000-stratified-no-lite-overlap" : "loading-or-blocked"
      : "not-required-for-tier";
    root.dataset.atlasV592ConstellationStatus = telemetry.constellationCount === 88 ? "ready" : telemetry.status;
    root.dataset.atlasV592ConstellationCount = String(telemetry.constellationCount);
    root.dataset.atlasV592ConstellationWaypointCount = String(telemetry.waypointCount);
    root.dataset.atlasV592ConstellationDefaultCount = String(defaultConstellationCodesV592(profile.deviceTier).length);
    root.dataset.atlasV592ConstellationVisibleCodes = constellationView.visibleCodes.join(",");
    root.dataset.atlasV592ConstellationVisibleCount = String(constellationView.visibleRanges.length);
    root.dataset.atlasV592ConstellationSegmentCount = String(constellationView.segmentCount);
    root.dataset.atlasV592ConstellationFocusedSegmentCount = String(constellationView.focusedSegmentCount);
    root.dataset.atlasV592ConstellationBackgroundSegmentCount = String(constellationView.segmentCount - constellationView.focusedSegmentCount);
    root.dataset.atlasV592ConstellationVertexCount = String(constellationView.segmentCount * 2);
    root.dataset.atlasV592ConstellationFocusCode = constellationView.focusedCode ?? "none";
    root.dataset.atlasV592ConstellationLabelCount = String(constellationView.labelRanges.length);
    root.dataset.atlasV592ConstellationLabelLanguage = "latin-chinese-iau-code";
    root.dataset.atlasV592ConstellationNormalizedDirections = "true";
    root.dataset.atlasV592ConstellationSphereRadius = CONSTELLATION_RENDER_RADIUS_V592.toFixed(2);
    root.dataset.atlasV592ConstellationDepthPolicy = "depth-test-true-foreground-occlusion";
    root.dataset.atlasV592ConstellationHtmlOcclusionScope = "visible-hero-meshes-only-no-sky-sphere";
    root.dataset.atlasV592ConstellationCloseupPolicy = constellationView.focusedCode
      ? "focused-emphasized-nonfocus-suppressed"
      : closeup ? "nonfocus-suppressed" : "overview-defaults";
    root.dataset.atlasV592ConstellationIauBoundaryAdmission = CONSTELLATION_NAME_COVERAGE_V592.iauBoundaryAdmission;
    root.dataset.atlasV592ConstellationPresentationOnly = "true";
    root.dataset.atlasV592ConstellationPayloadSha256 = LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592;
    root.dataset.atlasV592GaiaPositionColorMagnitudeSource = "Gaia-only";
    root.dataset.atlasV592GaiaPsfPolicy = "linear-Moffat-Airy-deterministic-source-id-optics";
    root.dataset.atlasV592GaiaRandomTwinkle = "false";
    root.dataset.atlasV592GaiaRandomParallax = "false";
    root.dataset.atlasV592ScientificWriteback = "false";
    if (selection) {
      root.dataset.atlasV592GaiaRenderedFaintCount = String(selection.renderedCounts.faint);
      root.dataset.atlasV592GaiaRenderedCatalogCount = String(selection.renderedCounts.catalog);
      root.dataset.atlasV592GaiaRenderedBrightPsfCount = String(selection.renderedCounts.brightPsf);
      root.dataset.atlasV592GaiaRetainedAnchorCount = String(selection.retainedAnchorCount);
    }
  }, [closeup, constellationView, profile, selection, telemetry]);
  if (!points || !selection) return <LegacyGaiaIsolationV592 />;
  return (
    <group userData={{
      atlasCandidate: "v592",
      atlasLayer: "living-gaia-starfield-v592",
      atlasCatalogVersion: points.catalogVersion,
      atlasStarSourcePolicy: "Gaia-position-color-magnitude-only",
      atlasRandomParallax: false,
      atlasScientificPayloadWriteback: false,
    }}>
      <LegacyGaiaIsolationV592 />
      <MobileConstellationFramingV592 range={constellationView.focusedRange} profile={profile} />
      <PointStarsV592 points={points} indices={selection.pointIndices} profile={profile} closeup={closeup} />
      <BrightStarsV592 points={points} indices={selection.brightIndices} profile={profile} closeup={closeup} />
      <ConstellationsV592 points={points} profile={profile} closeup={closeup} view={constellationView} />
    </group>
  );
}
