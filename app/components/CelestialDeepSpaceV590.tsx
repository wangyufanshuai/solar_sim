"use client";

import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  acquireAtlasResource,
  acquireAtlasTextureResourceV289,
  getAtlasResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import {
  CELESTIAL_SPHERE_RADIUS_V590,
  CONSTELLATION_BINDING_FILE_SHA256_V590,
  CONSTELLATION_BINDING_URL_V590,
  CONSTELLATION_SPHERE_RADIUS_V590,
  DEFAULT_CONSTELLATIONS_DESKTOP_V590,
  DEFAULT_CONSTELLATIONS_MOBILE_V590,
  FROZEN_SKY_ASSETS_V590,
  HERO_NEBULAE_V590,
  MILKY_WAY_ROTATION_V590,
  MILKY_WAY_SPHERE_RADIUS_V590,
  normalizeCelestialPositionV590,
  parseConstellationBindingReceiptV590,
  raDecToCelestialPositionV590,
  shouldRequestStarfieldViewV590,
  starfieldViewDeltaV590,
  starPsfRotationV590,
  type ConstellationBindingV590,
  type FrozenSkyAssetV590,
} from "../lib/celestialDeepSpaceV590";
import {
  CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
  CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590,
  HERO_BODY_SPEC_BY_ID_V590,
  type CelestialFocusTargetV590,
  type CelestialRenderProfileV590,
  type StarfieldSnapshotV590,
} from "../lib/celestialRenderingV590";
import type { CelestialStarfieldResponseV590 } from "../workers/celestialStarfieldV590.worker";
import { useV590Texture } from "../lib/useV590Texture";

type FocusTargetV590 = CelestialFocusTargetV590;

type RuntimeStarfieldSnapshotV590 = StarfieldSnapshotV590 & Readonly<{
  sizes: Float32Array;
}>;

type StarfieldTelemetryV590 = Readonly<{
  status: "idle" | "loading" | "ready" | "blocked" | "released";
  catalogVersion: string;
  recordCount: number;
  layerCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
  anchorCount: number;
  rangeRequests: number;
  transferredBytes: number;
  reason: string;
}>;

type SkyTextureStateV590 = Readonly<{
  status: "loading" | "ready" | "blocked";
  textures: Readonly<Record<FrozenSkyAssetV590["id"], THREE.Texture | null>>;
  sources: Readonly<Record<FrozenSkyAssetV590["id"], string>>;
  reason: string;
}>;

const EMPTY_SKY_TEXTURES_V590: SkyTextureStateV590["textures"] = Object.freeze({
  base: null,
  "catalog-stars": null,
  "dust-mask": null,
});

const EMPTY_SKY_SOURCES_V590: SkyTextureStateV590["sources"] = Object.freeze({
  base: "none",
  "catalog-stars": "none",
  "dust-mask": "none",
});

const SKY_VERTEX_V590 = /* glsl */ `
  varying vec3 vSkyDirection;
  void main() {
    vSkyDirection = normalize(mat3(modelMatrix) * position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_V590 = /* glsl */ `
  precision highp float;
  varying vec3 vSkyDirection;
  uniform sampler2D uBase;
  uniform sampler2D uStars;
  uniform sampler2D uDust;
  uniform float uCinematic;
  uniform float uCloseup;

  void main() {
    const float PI = 3.141592653589793;
    const float TAU = 6.283185307179586;
    vec3 direction = normalize(vSkyDirection);
    float rightAscension = mod(atan(direction.z, direction.x) + TAU, TAU);
    vec2 skyUv = vec2(rightAscension / TAU, 0.5 + asin(clamp(direction.y, -1.0, 1.0)) / PI);
    vec3 base = max(texture2D(uBase, skyUv).rgb, vec3(0.0));
    vec3 catalogStars = max(texture2D(uStars, skyUv).rgb, vec3(0.0));
    float dust = clamp(texture2D(uDust, skyUv).r, 0.0, 1.0);
    float dustStructure = smoothstep(0.08, 0.86, dust);

    vec3 science = base * mix(0.38, 0.56, dustStructure)
      + catalogStars * 0.22;

    vec3 dustTint = mix(vec3(0.72, 0.78, 0.88), vec3(1.08, 0.88, 0.68), dustStructure);
    float localContrast = mix(0.84, 1.46, pow(dustStructure, 0.72));
    vec3 photographicBase = pow(max(base * 0.83, vec3(0.0)), vec3(0.82));
    vec3 cinematic = photographicBase * dustTint * localContrast * 0.86
      + catalogStars * (0.38 + dustStructure * 0.20);
    cinematic += vec3(0.028, 0.039, 0.064) * pow(max(dustStructure - 0.26, 0.0), 1.35);

    vec3 color = mix(science, cinematic, uCinematic);
    color *= mix(1.0, 0.64, uCloseup);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STAR_POINT_VERTEX_V590 = /* glsl */ `
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
  }
`;

const STAR_POINT_FRAGMENT_V590 = /* glsl */ `
  precision highp float;
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uCinematic;
  uniform float uOpacity;

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float moffat = pow(1.0 + r2 * 9.0, -2.15);
    float radius = sqrt(r2);
    float airy = exp(-radius * 3.8) * (0.5 + 0.5 * cos(radius * 19.0));
    float cinematicHalo = airy * 0.075 * uCinematic;
    float fluxGain = clamp(0.72 + pow(max(vFlux, 0.000001), 0.12), 0.72, 1.65);
    float alpha = clamp((moffat + cinematicHalo) * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(vLinearRgb * fluxGain * (0.76 + moffat * 1.42 + cinematicHalo), alpha);
    #include <colorspace_fragment>
  }
`;

const STAR_PSF_VERTEX_V590 = /* glsl */ `
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
    vPsf = position.xy;
    vLinearRgb = aLinearRgb;
    vFlux = aFlux;
  }
`;

const STAR_PSF_FRAGMENT_V590 = /* glsl */ `
  precision highp float;
  varying vec2 vPsf;
  varying vec3 vLinearRgb;
  varying float vFlux;
  uniform float uCinematic;

  void main() {
    float radius = length(vPsf);
    if (radius > 1.0) discard;
    float r2 = radius * radius;
    float moffat = pow(1.0 + r2 * 18.0, -2.35);
    float airy = exp(-radius * 4.0) * (0.5 + 0.5 * cos(radius * 25.0));
    float spikeX = exp(-abs(vPsf.x) * 52.0) * exp(-abs(vPsf.y) * 3.2);
    float spikeY = exp(-abs(vPsf.y) * 52.0) * exp(-abs(vPsf.x) * 3.2);
    float presentation = (airy * 0.12 + (spikeX + spikeY) * 0.075) * uCinematic;
    float fluxGain = clamp(0.92 + pow(max(vFlux, 0.000001), 0.16), 0.92, 2.2);
    float alpha = clamp(moffat + presentation, 0.0, 1.0);
    gl_FragColor = vec4(vLinearRgb * fluxGain * (0.86 + moffat * 2.2 + presentation * 0.55), alpha);
    #include <colorspace_fragment>
  }
`;

async function sha256HexV590(bytes: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function disposeAfterDetachV590(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resource.dispose()));
}

function selectedSkyFileV590(asset: FrozenSkyAssetV590, deviceTier: CelestialRenderProfileV590["deviceTier"]) {
  return deviceTier === "mobile"
    ? { url: asset.mobileUrl, bytes: asset.mobileBytes, sha256: asset.mobileSha256 }
    : { url: asset.desktopUrl, bytes: asset.desktopBytes, sha256: asset.desktopSha256 };
}

async function textureFromVerifiedBytesV590(
  asset: FrozenSkyAssetV590,
  bytes: ArrayBuffer,
  gl: THREE.WebGLRenderer,
  isCurrent: () => boolean,
): Promise<THREE.Texture> {
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
  const releaseObjectUrl = acquireAtlasResource("object-url", "atlas", `v590-sky-${asset.id}-object-url`, {
    owner: "v590-celestial-deep-space",
    estimatedBytes: bytes.byteLength,
  });
  try {
    const texture = await new THREE.TextureLoader().loadAsync(objectUrl);
    if (!isCurrent()) {
      disposeAfterDetachV590(texture);
      throw new DOMException("v590-sky-generation-disposed", "AbortError");
    }
    texture.colorSpace = asset.colorSpace === "srgb" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(8, Math.max(1, gl.capabilities.getMaxAnisotropy()));
    texture.userData = {
      ...texture.userData,
      atlasCandidate: "v590",
      atlasLayer: `deep-space-${asset.id}`,
      atlasFrozenDependency: asset.frozenDependency,
      atlasVisualAssetSha256: selectedSkyFileV590(asset, gl.domElement.clientWidth <= 520 ? "mobile" : "desktop").sha256,
      atlasVisualAssetManifestSha256: CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
      atlasPresentationOnly: true,
      atlasScientificPayloadMutation: false,
    };
    texture.needsUpdate = true;
    return texture;
  } finally {
    URL.revokeObjectURL(objectUrl);
    releaseObjectUrl();
  }
}

function useFrozenSkyTexturesV590(profile: CelestialRenderProfileV590): SkyTextureStateV590 {
  const gl = useThree((state) => state.gl);
  const generationRef = useRef(0);
  const manifestBase = useV590Texture(
    "milky-way-v588-readonly",
    profile.deliveryTier,
    profile.deviceTier,
    true,
  );
  const [overlays, setOverlays] = useState<SkyTextureStateV590>({
    status: "loading",
    textures: EMPTY_SKY_TEXTURES_V590,
    sources: EMPTY_SKY_SOURCES_V590,
    reason: "initializing",
  });

  useEffect(() => {
    const generation = ++generationRef.current;
    let active = true;
    let failed = false;
    const controller = new AbortController();
    const loadedTextures: THREE.Texture[] = [];
    const releases: Array<() => void> = [];
    const isCurrent = () => active && !failed && generationRef.current === generation && !controller.signal.aborted;
    const cleanupLoaded = () => {
      releases.splice(0).forEach((release) => release());
      loadedTextures.splice(0).forEach((texture) => disposeAfterDetachV590(texture));
    };
    setOverlays({ status: "loading", textures: EMPTY_SKY_TEXTURES_V590, sources: EMPTY_SKY_SOURCES_V590, reason: "loading-overlays" });
    void Promise.all(FROZEN_SKY_ASSETS_V590.filter((asset) => asset.id !== "base").map(async (asset) => {
      const file = selectedSkyFileV590(asset, profile.deviceTier);
      const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache", signal: controller.signal });
      if (!response.ok) throw new Error(`v590-sky-fetch:${asset.id}:${response.status}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== file.bytes) throw new Error(`v590-sky-bytes:${asset.id}`);
      if (await sha256HexV590(bytes) !== file.sha256) throw new Error(`v590-sky-sha:${asset.id}`);
      const texture = await textureFromVerifiedBytesV590(asset, bytes, gl, isCurrent);
      if (!isCurrent()) {
        disposeAfterDetachV590(texture);
        throw new DOMException("v590-sky-generation-disposed", "AbortError");
      }
      texture.userData.atlasVisualAssetSha256 = file.sha256;
      loadedTextures.push(texture);
      releases.push(acquireAtlasTextureResourceV289(texture, "atlas", `v590-sky-${asset.id}`, "v590-celestial-deep-space"));
      return [asset.id, texture, file.url] as const;
    })).then((entries) => {
      if (!isCurrent()) {
        cleanupLoaded();
        return;
      }
      setOverlays({
        status: "ready",
        textures: Object.fromEntries(entries.map(([id, texture]) => [id, texture])) as SkyTextureStateV590["textures"],
        sources: Object.fromEntries(entries.map(([id, , url]) => [id, url])) as SkyTextureStateV590["sources"],
        reason: "verified-v9-readonly",
      });
    }).catch((error: unknown) => {
      failed = true;
      controller.abort();
      cleanupLoaded();
      if (!active || generationRef.current !== generation || (error instanceof DOMException && error.name === "AbortError")) return;
      setOverlays({
        status: "blocked",
        textures: EMPTY_SKY_TEXTURES_V590,
        sources: EMPTY_SKY_SOURCES_V590,
        reason: error instanceof Error ? error.message : "v590-sky-unknown",
      });
    });
    return () => {
      active = false;
      if (generationRef.current === generation) generationRef.current += 1;
      controller.abort();
      cleanupLoaded();
    };
  }, [gl, profile.deviceTier]);

  return useMemo(() => {
    const baseReady = manifestBase.status === "ready" && Boolean(manifestBase.texture);
    const status: SkyTextureStateV590["status"] = manifestBase.status === "blocked" || overlays.status === "blocked"
      ? "blocked"
      : baseReady && overlays.status === "ready" ? "ready" : "loading";
    return {
      status,
      textures: {
        ...overlays.textures,
        base: manifestBase.texture,
      },
      sources: {
        ...overlays.sources,
        base: baseReady ? `v590-manifest:${manifestBase.source}` : "none",
      },
      reason: status === "blocked"
        ? [manifestBase.reason, overlays.reason].filter((reason) => reason && reason !== "none").join("|")
        : status === "ready" ? `manifest-base:${manifestBase.source}|verified-v9-overlays` : "loading",
    };
  }, [manifestBase.reason, manifestBase.source, manifestBase.status, manifestBase.texture, overlays]);
}

function FixedMilkyWaySphereV590({
  profile,
  focusTarget,
  state,
}: {
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
  state: SkyTextureStateV590;
}) {
  const bodyCloseup = focusTarget in HERO_BODY_SPEC_BY_ID_V590;
  const geometry = useMemo(() => new THREE.SphereGeometry(
    MILKY_WAY_SPHERE_RADIUS_V590,
    profile.deviceTier === "mobile" ? 48 : 72,
    profile.deviceTier === "mobile" ? 24 : 40,
  ), [profile.deviceTier]);
  const material = useMemo(() => {
    if (!state.textures.base || !state.textures["catalog-stars"] || !state.textures["dust-mask"]) return null;
    return new THREE.ShaderMaterial({
      vertexShader: SKY_VERTEX_V590,
      fragmentShader: SKY_FRAGMENT_V590,
      uniforms: {
        uBase: { value: state.textures.base },
        uStars: { value: state.textures["catalog-stars"] },
        uDust: { value: state.textures["dust-mask"] },
        uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
        uCloseup: { value: bodyCloseup ? 1 : 0 },
      },
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      toneMapped: profile.mode === "cinematic",
    });
  }, [bodyCloseup, profile.mode, state.textures]);
  useEffect(() => () => disposeAfterDetachV590(geometry), [geometry]);
  useEffect(() => () => { if (material) material.dispose(); }, [material]);
  if (!material) return null;
  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={MILKY_WAY_ROTATION_V590}
      renderOrder={-1_000}
      frustumCulled={false}
      userData={{
        atlasCandidate: "v590",
        atlasLayer: "fixed-inward-celestial-sphere",
        atlasFrozenDependency: "V9-readonly",
        atlasFixedWorldRotation: MILKY_WAY_ROTATION_V590.join(","),
        atlasSkyUvFrame: "j2000-equatorial-direction",
        atlasCameraFollowing: true,
        atlasTranslationOnly: true,
        atlasPresentationOnly: true,
      }}
    />
  );
}

function cameraViewV590(camera: THREE.PerspectiveCamera, width: number, height: number) {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const raDeg = (Math.atan2(direction.z, direction.x) * 180 / Math.PI + 360) % 360;
  const decDeg = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1)) * 180 / Math.PI;
  const aspect = height > 0 ? width / height : 1;
  const horizontalFov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * Math.max(1, aspect)) * 180 / Math.PI;
  return { raDeg, decDeg, fovDeg: THREE.MathUtils.clamp(Math.max(camera.fov, horizontalFov) + 18, 20, 165) };
}

function useCelestialStarfieldV590(profile: CelestialRenderProfileV590) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const viewport = useThree((state) => state.size);
  const [snapshot, setSnapshot] = useState<RuntimeStarfieldSnapshotV590 | null>(null);
  const [telemetry, setTelemetry] = useState<StarfieldTelemetryV590>({
    status: "idle",
    catalogVersion: "none",
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    anchorCount: 0,
    rangeRequests: 0,
    transferredBytes: 0,
    reason: "none",
  });
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(590_000);
  const requestInFlightRef = useRef(false);
  const initialRequestFinishedRef = useRef(false);
  const lastViewRef = useRef({ raDeg: Number.NaN, decDeg: Number.NaN, fovDeg: Number.NaN, sentAt: 0 });
  const lastObservedViewRef = useRef({ raDeg: Number.NaN, decDeg: Number.NaN, fovDeg: Number.NaN });
  const lastAngleChangeAtRef = useRef(0);

  const postView = useCallback((view: ReturnType<typeof cameraViewV590>, force = false) => {
    const worker = workerRef.current;
    if (!worker) return;
    const now = performance.now();
    const requestId = ++requestIdRef.current;
    lastViewRef.current = { ...view, sentAt: now };
    requestInFlightRef.current = true;
    worker.postMessage({
      type: force ? "load" : "view",
      requestId,
      deliveryTier: profile.deliveryTier,
      deviceTier: profile.deviceTier,
      view,
    });
  }, [profile.deliveryTier, profile.deviceTier]);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/celestialStarfieldV590.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    const releaseWorker = acquireAtlasResource("worker", "atlas", "v590-gaia-starfield-worker", {
      owner: "v590-celestial-deep-space",
      manifestSha256: CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
    });
    const releaseArrays = acquireAtlasResource("typed-array-cache", "atlas", "v590-gaia-starfield-transfer", {
      owner: "v590-celestial-deep-space",
    });
    const onMessage = (event: MessageEvent<CelestialStarfieldResponseV590>) => {
      const message = event.data;
      if (message.requestId !== requestIdRef.current) return;
      if (message.type === "snapshot") {
        if (message.status === "ready" || message.status === "blocked") {
          requestInFlightRef.current = false;
          initialRequestFinishedRef.current = true;
        }
        setTelemetry({
          status: message.status,
          catalogVersion: message.catalogVersion,
          recordCount: message.recordCount,
          layerCounts: message.layerCounts,
          anchorCount: message.anchorCount,
          rangeRequests: message.rangeRequests,
          transferredBytes: message.transferredBytes,
          reason: message.reason,
        });
        return;
      }
      setSnapshot({
        directions: message.directions,
        linearRgb: message.linearRgb,
        apparentFlux: message.apparentFlux,
        psfClass: message.psfClass,
        sourceIds: message.sourceIds,
        constellationAnchorIndex: message.constellationAnchorIndex,
        sizes: message.sizes,
        catalogVersion: message.catalogVersion,
        recordCount: message.sourceIds.length,
        presentationOnly: true,
      });
    };
    worker.addEventListener("message", onMessage);
    initialRequestFinishedRef.current = false;
    requestInFlightRef.current = true;
    const view = cameraViewV590(camera, viewport.width, viewport.height);
    const now = performance.now();
    const requestId = ++requestIdRef.current;
    lastViewRef.current = { ...view, sentAt: now };
    lastObservedViewRef.current = view;
    lastAngleChangeAtRef.current = now;
    worker.postMessage({
      type: "load",
      requestId,
      deliveryTier: profile.deliveryTier,
      deviceTier: profile.deviceTier,
      view,
    });
    return () => {
      worker.removeEventListener("message", onMessage);
      worker.postMessage({ type: "release", requestId: Number.MAX_SAFE_INTEGER });
      worker.terminate();
      workerRef.current = null;
      requestInFlightRef.current = false;
      initialRequestFinishedRef.current = false;
      releaseArrays();
      releaseWorker();
    };
  }, [camera, profile.deliveryTier, profile.deviceTier, viewport.height, viewport.width]);

  useFrame(() => {
    if (!initialRequestFinishedRef.current || requestInFlightRef.current) return;
    const view = cameraViewV590(camera, viewport.width, viewport.height);
    const now = performance.now();
    const observed = lastObservedViewRef.current;
    const observedDelta = Number.isFinite(observed.raDeg)
      ? starfieldViewDeltaV590(view, observed)
      : { angleDeg: Number.POSITIVE_INFINITY, fovDeg: Number.POSITIVE_INFINITY };
    if (observedDelta.angleDeg > 0.08 || observedDelta.fovDeg > 0.12) {
      lastObservedViewRef.current = view;
      lastAngleChangeAtRef.current = now;
      return;
    }
    const lastRequested = lastViewRef.current;
    if (shouldRequestStarfieldViewV590({
      current: view,
      lastRequested: {
        raDeg: lastRequested.raDeg,
        decDeg: lastRequested.decDeg,
        fovDeg: lastRequested.fovDeg,
        sentAtMs: lastRequested.sentAt,
      },
      lastAngleChangeAtMs: lastAngleChangeAtRef.current,
      nowMs: now,
      requestInFlight: requestInFlightRef.current,
    })) postView(view, false);
  });

  return { snapshot, telemetry };
}

function PointStarLayerV590({
  snapshot,
  psfClass,
  profile,
  closeup,
}: {
  snapshot: RuntimeStarfieldSnapshotV590;
  psfClass: 0 | 1;
  profile: CelestialRenderProfileV590;
  closeup: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => {
    const indices: number[] = [];
    for (let index = 0; index < snapshot.psfClass.length; index += 1) {
      if (snapshot.psfClass[index] === psfClass) indices.push(index);
    }
    const directions = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const flux = new Float32Array(indices.length);
    const sizes = new Float32Array(indices.length);
    indices.forEach((sourceIndex, targetIndex) => {
      directions.set(snapshot.directions.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      colors.set(snapshot.linearRgb.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      flux[targetIndex] = snapshot.apparentFlux[sourceIndex] ?? 0;
      sizes[targetIndex] = (snapshot.sizes[sourceIndex] ?? 0.5) * (psfClass === 0 ? 0.82 : 1);
    });
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(directions, 3));
    next.setAttribute("aLinearRgb", new THREE.BufferAttribute(colors, 3));
    next.setAttribute("aFlux", new THREE.BufferAttribute(flux, 1));
    next.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return next;
  }, [psfClass, snapshot]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STAR_POINT_VERTEX_V590,
    fragmentShader: STAR_POINT_FRAGMENT_V590,
    uniforms: {
      uRadius: { value: CELESTIAL_SPHERE_RADIUS_V590 },
      uPixelRatio: { value: Math.min(1.75, gl.getPixelRatio()) },
      uSizeGain: { value: (profile.mode === "cinematic" ? 1.04 : 0.88) * (closeup ? 0.78 : 1) },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
      uOpacity: { value: profile.mode === "cinematic"
        ? (psfClass === 0 ? 0.34 : 0.72)
        : (psfClass === 0 ? 0.22 : 0.62) },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: profile.mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  }), [closeup, gl, profile.mode, psfClass]);
  useEffect(() => () => disposeAfterDetachV590(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-850 + psfClass} />;
}

function BrightPsfLayerV590({
  snapshot,
  profile,
  closeup,
}: {
  snapshot: RuntimeStarfieldSnapshotV590;
  profile: CelestialRenderProfileV590;
  closeup: boolean;
}) {
  const viewport = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => {
    const indices: number[] = [];
    for (let index = 0; index < snapshot.psfClass.length; index += 1) {
      if (snapshot.psfClass[index] === 2) indices.push(index);
    }
    const centers = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const flux = new Float32Array(indices.length);
    const sizes = new Float32Array(indices.length);
    const rotations = new Float32Array(indices.length);
    indices.forEach((sourceIndex, targetIndex) => {
      centers.set(snapshot.directions.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      colors.set(snapshot.linearRgb.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      flux[targetIndex] = snapshot.apparentFlux[sourceIndex] ?? 0;
      sizes[targetIndex] = (snapshot.sizes[sourceIndex] ?? 1) * 2.25;
      rotations[targetIndex] = starPsfRotationV590(snapshot.sourceIds[sourceIndex] ?? BigInt(0));
    });
    const next = new THREE.InstancedBufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute([
      -1, -1, 0,
      1, -1, 0,
      1, 1, 0,
      -1, 1, 0,
    ], 3));
    next.setIndex([0, 1, 2, 0, 2, 3]);
    next.setAttribute("aCenter", new THREE.InstancedBufferAttribute(centers, 3));
    next.setAttribute("aLinearRgb", new THREE.InstancedBufferAttribute(colors, 3));
    next.setAttribute("aFlux", new THREE.InstancedBufferAttribute(flux, 1));
    next.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes, 1));
    next.setAttribute("aRotation", new THREE.InstancedBufferAttribute(rotations, 1));
    next.instanceCount = indices.length;
    return next;
  }, [snapshot]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: STAR_PSF_VERTEX_V590,
    fragmentShader: STAR_PSF_FRAGMENT_V590,
    uniforms: {
      uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uRadius: { value: CELESTIAL_SPHERE_RADIUS_V590 - 0.06 },
      uPixelRatio: { value: Math.min(1.75, gl.getPixelRatio()) },
      uSizeGain: { value: (profile.mode === "cinematic" ? 1.15 : 0.86) * (closeup ? 0.8 : 1) },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: profile.mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  }), [closeup, gl, profile.mode, viewport.height, viewport.width]);
  useEffect(() => {
    material.uniforms.uViewport.value.set(viewport.width, viewport.height);
  }, [material, viewport.height, viewport.width]);
  useEffect(() => () => disposeAfterDetachV590(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-846} />;
}

function useConstellationBindingsV590() {
  const [bindings, setBindings] = useState<readonly ConstellationBindingV590[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">("loading");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void fetch(`${CONSTELLATION_BINDING_URL_V590}?sha256=${CONSTELLATION_BINDING_FILE_SHA256_V590}`, {
      cache: "force-cache",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error(`v590-constellation-fetch:${response.status}`);
      const bytes = await response.arrayBuffer();
      if (await sha256HexV590(bytes) !== CONSTELLATION_BINDING_FILE_SHA256_V590) throw new Error("v590-constellation-file-sha");
      return parseConstellationBindingReceiptV590(JSON.parse(new TextDecoder().decode(bytes))).bindings;
    }).then((value) => {
      if (!active) return;
      setBindings(value);
      setStatus("ready");
    }).catch((error: unknown) => {
      if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
      setBindings([]);
      setStatus("blocked");
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  return { bindings, status };
}

type ConstellationGeometryV590 = Readonly<{
  code: string;
  name: string;
  geometry: THREE.BufferGeometry;
  center: THREE.Vector3;
  angularRadiusRad: number;
  anchorPositions: readonly number[];
}>;

function buildConstellationGeometryV590(
  snapshot: RuntimeStarfieldSnapshotV590,
  bindings: readonly ConstellationBindingV590[],
  featured: readonly string[],
): ConstellationGeometryV590[] {
  const byId = new Map<string, readonly [number, number, number]>();
  for (let index = 0; index < snapshot.sourceIds.length; index += 1) {
    byId.set(snapshot.sourceIds[index]!.toString(), [
      snapshot.directions[index * 3]!,
      snapshot.directions[index * 3 + 1]!,
      snapshot.directions[index * 3 + 2]!,
    ]);
  }
  const result: ConstellationGeometryV590[] = [];
  for (const binding of bindings) {
    if (!featured.includes(binding.iauCode)) continue;
    const directions = binding.waypoints
      .map((waypoint) => byId.get(waypoint.sourceId))
      .filter((entry): entry is readonly [number, number, number] => Boolean(entry));
    if (directions.length < 2) continue;
    const center = directions.reduce((sum, direction) => sum.add(new THREE.Vector3(...direction)), new THREE.Vector3()).normalize();
    const angularRadiusRad = Math.max(...directions.map((direction) => center.angleTo(new THREE.Vector3(...direction))));
    const positions: number[] = [];
    for (let index = 1; index < directions.length; index += 1) {
      positions.push(
        ...normalizeCelestialPositionV590(directions[index - 1]!, CONSTELLATION_SPHERE_RADIUS_V590),
        ...normalizeCelestialPositionV590(directions[index]!, CONSTELLATION_SPHERE_RADIUS_V590),
      );
    }
    const anchorPositions = directions.flatMap((direction) => normalizeCelestialPositionV590(direction, CONSTELLATION_SPHERE_RADIUS_V590 - 0.08));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    result.push({
      code: binding.iauCode,
      name: binding.name,
      geometry,
      center: center.multiplyScalar(CONSTELLATION_SPHERE_RADIUS_V590 - 0.18),
      angularRadiusRad,
      anchorPositions,
    });
  }
  return result;
}

function FrustumAwareConstellationV590({
  constellation,
  profile,
  focusTarget,
}: {
  constellation: ConstellationGeometryV590;
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
}) {
  const focusedCode: Partial<Record<FocusTargetV590, string>> = {
    orion: "Ori",
    "ursa-major": "UMa",
    cassiopeia: "Cas",
  };
  const focused = focusedCode[focusTarget] === constellation.code;
  const groupRef = useRef<THREE.Group>(null);
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  const centerDirection = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: profile.mode === "cinematic" ? 0x839cad : 0x6f96aa,
    transparent: true,
    opacity: focused
      ? profile.mode === "cinematic" ? 0.72 : 0.82
      : focusTarget === "overview"
        ? profile.mode === "cinematic" ? 0.3 : 0.4
        : 0.07,
    linewidth: focused ? 1.2 : profile.deviceTier === "mobile" ? 0.65 : 0.72,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [focusTarget, focused, profile.deviceTier, profile.mode]);
  const anchorGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(constellation.anchorPositions, 3));
    return geometry;
  }, [constellation.anchorPositions]);
  const anchorMaterial = useMemo(() => new THREE.PointsMaterial({
    color: profile.mode === "cinematic" ? 0xc8deeb : 0xaed6e6,
    size: focused ? 2.1 : profile.deviceTier === "mobile" ? 1.25 : 1.55,
    sizeAttenuation: false,
    transparent: true,
    opacity: focused ? 0.9 : focusTarget === "overview" ? 0.72 : 0.12,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [focusTarget, focused, profile.deviceTier, profile.mode]);
  useFrame(({ camera, size }) => {
    const group = groupRef.current;
    if (!group) return;
    camera.getWorldDirection(cameraDirection);
    // The parent celestial shell follows camera translation only, therefore
    // this local vector is already the stable world-space sky direction.
    centerDirection.copy(constellation.center).normalize();
    const perspective = camera as THREE.PerspectiveCamera;
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const verticalHalf = THREE.MathUtils.degToRad(perspective.fov * 0.5);
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect);
    const viewHalf = Math.max(verticalHalf, horizontalHalf);
    group.visible = cameraDirection.angleTo(centerDirection) <= viewHalf + constellation.angularRadiusRad + 0.12;
  });
  useEffect(() => () => {
    material.dispose();
    disposeAfterDetachV590(anchorGeometry);
    anchorMaterial.dispose();
  }, [anchorGeometry, anchorMaterial, material]);
  return (
    <group
      ref={groupRef}
      userData={{ atlasCandidate: "v590", atlasFrustumAware: true, atlasConstellation: constellation.code }}
    >
      <lineSegments
        geometry={constellation.geometry}
        material={material}
        frustumCulled
        renderOrder={-810}
        userData={{ atlasNormalizedDirections: true, atlasDepthOcclusion: true, atlasPresentationOnly: true }}
      />
      <points geometry={anchorGeometry} material={anchorMaterial} frustumCulled renderOrder={-808} />
      {(focusTarget === "overview" || focused) && !profile.cleanView ? (
        <Html
          position={constellation.center.toArray()}
          center
          distanceFactor={48}
          occlude
          zIndexRange={[7, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span
            data-atlas-v590-constellation-label={constellation.code}
            className="whitespace-nowrap rounded-sm border border-cyan-100/10 bg-slate-950/45 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.18em] text-cyan-50/55 backdrop-blur-[2px]"
          >
            {constellation.name}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function ConstellationLayerV590({
  snapshot,
  profile,
  focusTarget,
  onStatus,
}: {
  snapshot: RuntimeStarfieldSnapshotV590;
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
  onStatus: (status: "loading" | "ready" | "blocked") => void;
}) {
  const { bindings, status } = useConstellationBindingsV590();
  const featured = profile.deviceTier === "mobile"
    ? DEFAULT_CONSTELLATIONS_MOBILE_V590
    : DEFAULT_CONSTELLATIONS_DESKTOP_V590;
  const geometries = useMemo(() => buildConstellationGeometryV590(
    snapshot,
    bindings,
    featured as readonly string[],
  ), [bindings, featured, snapshot]);
  useEffect(() => onStatus(status), [onStatus, status]);
  useEffect(() => () => geometries.forEach((entry) => disposeAfterDetachV590(entry.geometry)), [geometries]);
  return (
    <group userData={{
      atlasCandidate: "v590",
      atlasLayer: "gaia-bound-constellations",
      atlasDefaultCount: featured.length,
      atlasBindingCount: bindings.length,
      atlasWaypointRule: "484-of-484-within-1.5deg",
      atlasDepthOcclusion: true,
    }}>
      {geometries.map((constellation) => (
        <FrustumAwareConstellationV590
          key={constellation.code}
          constellation={constellation}
          profile={profile}
          focusTarget={focusTarget}
        />
      ))}
    </group>
  );
}

function GaiaStarfieldV590({
  profile,
  focusTarget,
  onTelemetry,
  onConstellationStatus,
}: {
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
  onTelemetry: (value: StarfieldTelemetryV590) => void;
  onConstellationStatus: (status: "loading" | "ready" | "blocked") => void;
}) {
  const { snapshot, telemetry } = useCelestialStarfieldV590(profile);
  useEffect(() => onTelemetry(telemetry), [onTelemetry, telemetry]);
  if (!snapshot) return null;
  const closeup = focusTarget !== "overview";
  return (
    <group userData={{
      atlasCandidate: "v590",
      atlasLayer: "gaia-common-celestial-sphere",
      atlasCatalogVersion: snapshot.catalogVersion,
      atlasCelestialRadius: CELESTIAL_SPHERE_RADIUS_V590,
      atlasRandomParallax: false,
      atlasSourceIdVisualPerturbationPolicy: "psf-rotation-only",
    }}>
      <PointStarLayerV590 snapshot={snapshot} psfClass={0} profile={profile} closeup={closeup} />
      <PointStarLayerV590 snapshot={snapshot} psfClass={1} profile={profile} closeup={closeup} />
      <BrightPsfLayerV590 snapshot={snapshot} profile={profile} closeup={closeup} />
      <ConstellationLayerV590
        snapshot={snapshot}
        profile={profile}
        focusTarget={focusTarget}
        onStatus={onConstellationStatus}
      />
    </group>
  );
}

function NebulaCoordinateMarkerV590({
  nebula,
  profile,
  focusTarget,
}: {
  nebula: (typeof HERO_NEBULAE_V590)[number];
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
}) {
  const direction = useMemo(() => new THREE.Vector3(...raDecToCelestialPositionV590(nebula.raDeg, nebula.decDeg, 1)), [nebula.decDeg, nebula.raDeg]);
  const center = useMemo(() => direction.clone().multiplyScalar(CONSTELLATION_SPHERE_RADIUS_V590 - 0.5), [direction]);
  const geometry = useMemo(() => {
    const reference = Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const east = new THREE.Vector3().crossVectors(reference, direction).normalize();
    const north = new THREE.Vector3().crossVectors(direction, east).normalize();
    const markerRadius = Math.max(0.3, Math.tan(THREE.MathUtils.degToRad(nebula.angularSizeDeg * 0.5)) * CONSTELLATION_SPHERE_RADIUS_V590);
    const positions: number[] = [];
    const segments = 28;
    for (let index = 0; index < segments; index += 1) {
      const a = index / segments * Math.PI * 2;
      const b = (index + 1) / segments * Math.PI * 2;
      positions.push(
        ...center.clone().addScaledVector(east, Math.cos(a) * markerRadius).addScaledVector(north, Math.sin(a) * markerRadius).toArray(),
        ...center.clone().addScaledVector(east, Math.cos(b) * markerRadius).addScaledVector(north, Math.sin(b) * markerRadius).toArray(),
      );
    }
    positions.push(
      ...center.clone().addScaledVector(east, -markerRadius * 1.28).toArray(),
      ...center.clone().addScaledVector(east, markerRadius * 1.28).toArray(),
      ...center.clone().addScaledVector(north, -markerRadius * 1.28).toArray(),
      ...center.clone().addScaledVector(north, markerRadius * 1.28).toArray(),
    );
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    next.computeBoundingSphere();
    return next;
  }, [center, direction, nebula.angularSizeDeg]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: profile.mode === "science" ? 0x5e8aa0 : 0x748fa4,
    transparent: true,
    opacity: focusTarget === "overview" ? 0.3 : 0.08,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [focusTarget, profile.mode]);
  useEffect(() => () => {
    disposeAfterDetachV590(geometry);
    material.dispose();
  }, [geometry, material]);
  return (
    <group userData={{
      atlasCandidate: "v590",
      atlasNebula: nebula.id,
      atlasNebulaAssetState: "asset-blocked",
      atlasCoordinateState: "verified-coordinate-marker",
      atlasSyntheticImpostor: false,
      atlasPresentationOnly: true,
    }}>
      <lineSegments geometry={geometry} material={material} frustumCulled renderOrder={-790} />
      {focusTarget === "overview" && !profile.cleanView ? (
        <Html position={center.toArray()} center distanceFactor={55} occlude zIndexRange={[6, 0]} style={{ pointerEvents: "none" }}>
          <span
            data-atlas-v590-nebula-marker={nebula.id}
            data-atlas-v590-nebula-admission="asset-blocked"
            className="whitespace-nowrap text-[6px] uppercase tracking-[0.16em] text-sky-100/36"
          >
            {nebula.commonName} · catalog only
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function HonestNebulaLayerV590({ profile, focusTarget }: { profile: CelestialRenderProfileV590; focusTarget: FocusTargetV590 }) {
  return (
    <group userData={{
      atlasCandidate: "v590",
      atlasLayer: "hero-nebula-coordinate-markers",
      atlasNebulaCount: HERO_NEBULAE_V590.length,
      atlasNebulaAdmittedCount: 0,
      atlasNebulaBlockedCount: HERO_NEBULAE_V590.length,
      atlasImpostorCount: 0,
      atlasNoSyntheticReplacement: true,
    }}>
      {HERO_NEBULAE_V590.map((nebula) => (
        <NebulaCoordinateMarkerV590 key={nebula.id} nebula={nebula} profile={profile} focusTarget={focusTarget} />
      ))}
    </group>
  );
}

function DeepSpaceTelemetryProbeV590({
  profile,
  focusTarget,
  sky,
  stars,
  constellationStatus,
}: {
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
  sky: SkyTextureStateV590;
  stars: StarfieldTelemetryV590;
  constellationStatus: "loading" | "ready" | "blocked";
}) {
  const gl = useThree((state) => state.gl);
  const last = useRef(0);
  const touched = useRef<HTMLElement[]>([]);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.25) return;
    last.current = clock.elapsedTime;
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(
      '[data-atlas-v590-candidate], [data-atlas-browser-acceptance-version*="v590"]',
    ));
    const roots = candidates.length > 0 ? candidates : [document.documentElement];
    touched.current = roots;
    const resources = getAtlasResourceSnapshot();
    for (const root of roots) {
      root.dataset.atlasV590DeepSpaceStatus = sky.status === "ready" && stars.status === "ready" && constellationStatus === "ready"
        ? "ready"
        : [sky.status, stars.status, constellationStatus].includes("blocked") ? "blocked" : "loading";
      root.dataset.atlasV590SkyStatus = sky.status;
      root.dataset.atlasV590SkyReason = sky.reason;
      root.dataset.atlasV590SkyBaseSource = sky.sources.base;
      root.dataset.atlasV590SkyStarSource = sky.sources["catalog-stars"];
      root.dataset.atlasV590SkyDustSource = sky.sources["dust-mask"];
      root.dataset.atlasV590SkyFixedSphere = "true";
      root.dataset.atlasV590SkyCameraFollowing = "translation-only";
      root.dataset.atlasV590SkyRotation = MILKY_WAY_ROTATION_V590.join(",");
      root.dataset.atlasV590SkyUvFrame = "j2000-equatorial-direction";
      root.dataset.atlasV590CelestialRadius = String(CELESTIAL_SPHERE_RADIUS_V590);
      root.dataset.atlasV590StarStatus = stars.status;
      root.dataset.atlasV590StarReason = stars.reason;
      root.dataset.atlasV590StarCatalog = stars.catalogVersion;
      root.dataset.atlasV590StarCount = String(stars.recordCount);
      root.dataset.atlasV590StarFaintCount = String(stars.layerCounts.faint);
      root.dataset.atlasV590StarCatalogCount = String(stars.layerCounts.catalog);
      root.dataset.atlasV590StarBrightPsfCount = String(stars.layerCounts.brightPsf);
      root.dataset.atlasV590StarAnchorCount = String(stars.anchorCount);
      root.dataset.atlasV590StarRangeRequests = String(stars.rangeRequests);
      root.dataset.atlasV590StarTransferredBytes = String(stars.transferredBytes);
      root.dataset.atlasV590ConstellationStatus = constellationStatus;
      root.dataset.atlasV590ConstellationDefaultCount = String(profile.deviceTier === "mobile" ? 8 : 12);
      root.dataset.atlasV590ConstellationWaypointRule = "484-of-484-within-1.5deg";
      root.dataset.atlasV590NebulaAdmittedCount = "0";
      root.dataset.atlasV590NebulaBlockedCount = String(HERO_NEBULAE_V590.length);
      root.dataset.atlasV590NebulaImpostorCount = "0";
      root.dataset.atlasV590FocusTarget = focusTarget;
      root.dataset.atlasV590DeepSpaceMode = profile.mode;
      root.dataset.atlasV590DeepSpaceGpuBytes = String(resources.byOwner["v590-celestial-deep-space"]?.estimatedBytes ?? 0);
      root.dataset.atlasV590DeepSpaceDrawCalls = String(gl.info.render.calls);
      root.dataset.atlasV590DeepSpaceTextures = String(gl.info.memory.textures);
      root.dataset.atlasV590DeepSpaceGeometries = String(gl.info.memory.geometries);
    }
  });
  useEffect(() => () => {
    for (const root of touched.current) {
      for (const key of Object.keys(root.dataset)) {
        if (key.startsWith("atlasV590DeepSpace") || key.startsWith("atlasV590Sky") || key.startsWith("atlasV590Star") || key.startsWith("atlasV590Constellation") || key.startsWith("atlasV590Nebula") || key === "atlasV590CelestialRadius" || key === "atlasV590FocusTarget") {
          delete root.dataset[key];
        }
      }
    }
  }, []);
  return null;
}

export type CelestialDeepSpaceV590Props = Readonly<{
  profile: CelestialRenderProfileV590;
  focusTarget: FocusTargetV590;
}>;

/**
 * Candidate-only deep-space layer for an existing UniverseCanvas. This
 * component never creates a Canvas, camera controller or scientific store.
 */
export default function CelestialDeepSpaceV590({ profile, focusTarget }: CelestialDeepSpaceV590Props) {
  const shellRef = useRef<THREE.Group>(null);
  const sky = useFrozenSkyTexturesV590(profile);
  const [stars, setStars] = useState<StarfieldTelemetryV590>({
    status: "idle",
    catalogVersion: "none",
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    anchorCount: 0,
    rangeRequests: 0,
    transferredBytes: 0,
    reason: "none",
  });
  const [constellationStatus, setConstellationStatus] = useState<"loading" | "ready" | "blocked">("loading");
  const onStars = useCallback((value: StarfieldTelemetryV590) => setStars(value), []);
  const onConstellations = useCallback((value: "loading" | "ready" | "blocked") => setConstellationStatus(value), []);
  useFrame(({ camera }) => {
    // Following translation eliminates false finite-radius parallax while the
    // untouched group quaternion preserves the J2000/Milky-Way orientation.
    shellRef.current?.position.copy(camera.position);
  });
  return (
    <group ref={shellRef} userData={{
      atlasCandidate: "v590",
      atlasLayer: "celestial-deep-space",
      atlasSingleCanvasConsumer: true,
      atlasCreatesCanvas: false,
      atlasScientificPayloadSha256: CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590,
      atlasScientificPayloadMutation: false,
      atlasSharedCoordinates: true,
      atlasCameraFollowing: "translation-only",
      atlasFixedOrientation: true,
      atlasFalseParallax: false,
      atlasPresentationOnly: true,
      atlasResourceOwner: "v590-celestial-deep-space",
    }}>
      <FixedMilkyWaySphereV590 profile={profile} focusTarget={focusTarget} state={sky} />
      <GaiaStarfieldV590
        profile={profile}
        focusTarget={focusTarget}
        onTelemetry={onStars}
        onConstellationStatus={onConstellations}
      />
      <HonestNebulaLayerV590 profile={profile} focusTarget={focusTarget} />
      <DeepSpaceTelemetryProbeV590
        profile={profile}
        focusTarget={focusTarget}
        sky={sky}
        stars={stars}
        constellationStatus={constellationStatus}
      />
    </group>
  );
}
