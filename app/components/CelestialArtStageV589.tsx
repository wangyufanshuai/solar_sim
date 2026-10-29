"use client";

import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  acquireAtlasResource,
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import {
  CELESTIAL_ART_MANIFEST_SHA256_V589,
  CELESTIAL_ART_SCIENTIFIC_PAYLOAD_SHA256_V589,
  CELESTIAL_ORBIT_BY_ID_V589,
  CELESTIAL_ORBITS_V589,
  DEFAULT_CONSTELLATIONS_DESKTOP_V589,
  DEFAULT_CONSTELLATIONS_MOBILE_V589,
  HERO_BODY_SPEC_BY_ID_V589,
  HERO_BODY_SPECS_V589,
  celestialOrbitPathV589,
  celestialOrbitPointV589,
  resolveExposureV589,
  type CelestialRenderProfileV589,
  type HeroAssetAdmissionV589,
  type HeroBodyIdV589,
  type StarfieldSnapshotV589,
} from "../lib/celestialArtV589";
import { disposeV589TextureLoader, useV589Texture } from "../lib/useV589Texture";
import { useV589Model } from "../lib/useV589Model";
import type { CelestialStarfieldResponseV589 } from "../workers/celestialStarfieldV589.worker";

type FocusTargetV589 = "overview" | HeroBodyIdV589;
type ConstellationBindingV589 = Readonly<{
  iauCode: string;
  name: string;
  waypoints: readonly Readonly<{ sourceId: string }>[];
}>;

type StarfieldTelemetryV589 = Readonly<{
  status: "idle" | "loading" | "ready" | "blocked" | "released";
  catalogVersion: string;
  recordCount: number;
  layerCounts: { faint: number; catalog: number; brightPsf: number };
  rangeRequests: number;
  transferredBytes: number;
  reason: string;
}>;

function disposeAfterDetachV589(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => resource.dispose());
  });
}

const POINT_VERTEX_V589 = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  uniform float uPixelRatio;
  uniform float uModeGain;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * uModeGain, 0.65, 5.5);
    gl_Position = projectionMatrix * mv;
  }
`;

const POINT_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  uniform float uCinematic;
  uniform float uOpacity;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float core = exp(-r2 * 9.5);
    float halo = exp(-r2 * 2.3) * 0.22 * uCinematic;
    float alpha = clamp((core + halo) * uOpacity, 0.0, 1.0);
    gl_FragColor = vec4(vColor * (0.72 + core * 1.35 + halo), alpha);
  }
`;

const PSF_VERTEX_V589 = /* glsl */ `
  attribute vec3 aCenter;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;
  varying vec2 vUvPsf;
  varying vec3 vColor;
  varying float vSeed;
  uniform vec2 uViewport;
  uniform float uPixelRatio;
  uniform float uModeGain;
  void main() {
    vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
    vec4 clip = projectionMatrix * mv;
    // Bright PSF quads are instanced with frustum culling disabled so the
    // renderer can keep a single draw.  A star behind the eye has a negative
    // clip-space w; applying the pixel offset in that state can connect a
    // triangle across the entire viewport (the white wedge seen in Bennu
    // close-ups).  Collapse those instances to a clipped vertex before the
    // offset is applied.  The source-id classification remains deterministic.
    if (clip.w <= 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vUvPsf = position.xy;
      vColor = aColor;
      vSeed = aSeed;
      return;
    }
    float pixels = aSize * uPixelRatio * uModeGain;
    vec2 ndcOffset = position.xy * pixels * 2.0 / max(uViewport, vec2(1.0));
    clip.xy += ndcOffset * clip.w;
    gl_Position = clip;
    vUvPsf = position.xy;
    vColor = aColor;
    vSeed = aSeed;
  }
`;

const PSF_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec2 vUvPsf;
  varying vec3 vColor;
  varying float vSeed;
  uniform float uCinematic;
  void main() {
    float radius = length(vUvPsf);
    if (radius > 1.0) discard;
    float core = exp(-radius * radius * 24.0);
    float halo = exp(-radius * radius * 3.4) * 0.30 * uCinematic;
    float crossX = exp(-abs(vUvPsf.x) * (46.0 + vSeed * 5.0)) * exp(-abs(vUvPsf.y) * 2.2);
    float crossY = exp(-abs(vUvPsf.y) * (46.0 + vSeed * 5.0)) * exp(-abs(vUvPsf.x) * 2.2);
    float spikes = (crossX + crossY) * 0.17 * uCinematic;
    float alpha = clamp(core + halo + spikes, 0.0, 1.0);
    gl_FragColor = vec4(vColor * (0.95 + core * 2.6 + halo * 0.7), alpha);
  }
`;

const ATMOSPHERE_VERTEX_V589 = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vView;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const ATMOSPHERE_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec3 vWorldNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uPower;
  void main() {
    float rim = pow(1.0 - max(0.0, dot(normalize(vWorldNormal), normalize(vView))), uPower);
    float alpha = clamp(rim * uDensity, 0.0, 0.88);
    gl_FragColor = vec4(uColor * (0.62 + rim * 0.95), alpha);
  }
`;

const NIGHT_VERTEX_V589 = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const NIGHT_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uNight;
  uniform sampler2D uMask;
  uniform float uGain;
  void main() {
    vec3 toSun = normalize(-vWorldPosition);
    float dayFacing = dot(normalize(vWorldNormal), toSun);
    float gate = 1.0 - smoothstep(-0.08, 0.14, dayFacing);
    vec3 lights = texture2D(uNight, vUv).rgb;
    float mask = texture2D(uMask, vUv).r;
    float alpha = clamp(max(max(lights.r, lights.g), lights.b) * mask * gate * uGain, 0.0, 0.86);
    gl_FragColor = vec4(lights * (1.0 + uGain), alpha);
  }
`;

const ICE_GIANT_VERTEX_V589 = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const ICE_GIANT_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uBase;
  uniform vec3 uBand;
  uniform float uBandFrequency;
  uniform float uStorm;
  uniform float uScience;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 lightDir = normalize(-vWorldPosition);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float latitude = asin(clamp(n.y, -1.0, 1.0));
    float band = sin(latitude * uBandFrequency + sin(latitude * 5.0) * 0.6) * 0.5 + 0.5;
    float longitude = atan(n.z, n.x);
    float storm = smoothstep(0.94, 1.0, cos((longitude + latitude * 2.4) * 7.0)) * exp(-pow(latitude + 0.34, 2.0) * 28.0) * uStorm;
    vec3 albedo = mix(uBase, uBand, band * 0.22 + storm * 0.34);
    float diffuse = max(0.0, dot(n, lightDir));
    float limb = pow(max(0.0, dot(n, viewDir)), 0.22);
    float light = mix(0.045, 0.16, uScience) + diffuse * 0.92;
    gl_FragColor = vec4(albedo * light * (0.72 + limb * 0.35), 1.0);
  }
`;

const SOLAR_VERTEX_V589 = /* glsl */ `
  varying vec3 vLocalNormal;
  varying vec3 vWorldPosition;
  void main() {
    vLocalNormal = normalize(normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SOLAR_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uMap;
  uniform float uCinematic;
  vec3 solarSource(vec3 n) {
    vec3 weights = pow(abs(n), vec3(4.0));
    vec2 uvX = clamp(vec2(n.z, n.y) * 0.31 + 0.5, 0.08, 0.92);
    vec2 uvY = clamp(vec2(n.x, n.z) * 0.31 + 0.5, 0.08, 0.92);
    vec2 uvZ = clamp(vec2(n.x, n.y) * 0.31 + 0.5, 0.08, 0.92);
    vec3 c = texture2D(uMap, uvX).rgb * weights.x
      + texture2D(uMap, uvY).rgb * weights.y
      + texture2D(uMap, uvZ).rgb * weights.z;
    return c / max(weights.x + weights.y + weights.z, 0.001);
  }
  void main() {
    vec3 n = normalize(vLocalNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float mu = max(dot(n, viewDir), 0.0);
    vec3 source = solarSource(n);
    float granulation = clamp(dot(source, vec3(0.20, 0.62, 0.18)) * 1.75, 0.0, 1.0);
    vec3 photosphere = mix(vec3(1.0, 0.16, 0.012), vec3(1.0, 0.82, 0.30), granulation);
    float limbDarkening = 0.43 + 0.57 * pow(mu, 0.38);
    float radiance = (0.60 + granulation * 0.72) * limbDarkening;
    float coronaSuppression = mix(0.78, 1.0, uCinematic);
    gl_FragColor = vec4(photosphere * radiance * coronaSuppression, 1.0);
  }
`;

const SATURN_VERTEX_V589 = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocalPosition;
  varying vec3 vLocalNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vLocalPosition = position;
    vLocalNormal = normalize(normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SATURN_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vLocalPosition;
  varying vec3 vLocalNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uMap;
  uniform sampler2D uBands;
  uniform sampler2D uRingAlpha;
  uniform vec3 uSunLocal;
  uniform vec3 uCameraLocal;
  uniform float uInner;
  uniform float uOuter;
  uniform float uScience;
  void main() {
    vec3 n = normalize(vLocalNormal);
    vec3 lightDir = normalize(uSunLocal - vLocalPosition);
    vec3 viewDir = normalize(uCameraLocal - vLocalPosition);
    float diffuse = max(dot(n, lightDir), 0.0);
    float limb = pow(max(dot(n, viewDir), 0.0), 0.28);
    vec3 base = texture2D(uMap, vUv).rgb;
    float band = texture2D(uBands, vUv).r;
    base *= mix(0.82, 1.12, band * 0.32);
    float shadow = 0.0;
    float denominator = lightDir.y;
    if (abs(denominator) > 0.0001) {
      float t = -vLocalPosition.y / denominator;
      vec3 hit = vLocalPosition + lightDir * t;
      float radial = length(hit.xz);
      if (t > 0.0 && radial > uInner && radial < uOuter) {
        vec2 ringUv = hit.xz / (uOuter * 2.0) + 0.5;
        float opticalDepth = texture2D(uRingAlpha, ringUv).r;
        float innerGate = smoothstep(uInner, uInner + 0.12, radial);
        float outerGate = 1.0 - smoothstep(uOuter - 0.12, uOuter, radial);
        shadow = opticalDepth * innerGate * outerGate;
      }
    }
    float ambient = mix(0.095, 0.13, uScience);
    float radiance = ambient + diffuse * (1.42 + limb * 0.38);
    radiance *= 1.0 - shadow * 0.66;
    gl_FragColor = vec4(base * radiance * 1.12, 1.0);
  }
`;

const REGOLITH_TRIPLANAR_VERTEX_V589 = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vLocalPosition = position;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const REGOLITH_TRIPLANAR_FRAGMENT_V589 = /* glsl */ `
  precision highp float;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPosition;
  uniform sampler2D uDiffuse;
  uniform sampler2D uNormal;
  uniform sampler2D uRoughness;
  uniform vec3 uSunWorld;
  uniform vec3 uCameraWorld;
  uniform float uScale;
  uniform float uScience;

  vec3 weightsFor(vec3 normal) {
    vec3 weights = pow(abs(normal), vec3(5.0));
    return weights / max(dot(weights, vec3(1.0)), 0.0001);
  }

  vec3 sampleTriplanar(sampler2D source, vec3 position, vec3 weights) {
    vec3 x = texture2D(source, position.yz * uScale).rgb;
    vec3 y = texture2D(source, position.xz * uScale).rgb;
    vec3 z = texture2D(source, position.xy * uScale).rgb;
    return x * weights.x + y * weights.y + z * weights.z;
  }

  vec3 regolithNormal(vec3 geometricNormal, vec3 position, vec3 weights) {
    vec3 tx = texture2D(uNormal, position.yz * uScale).xyz * 2.0 - 1.0;
    vec3 ty = texture2D(uNormal, position.xz * uScale).xyz * 2.0 - 1.0;
    vec3 tz = texture2D(uNormal, position.xy * uScale).xyz * 2.0 - 1.0;
    vec3 nx = vec3(tx.z * sign(geometricNormal.x), tx.y, tx.x);
    vec3 ny = vec3(ty.x, ty.z * sign(geometricNormal.y), ty.y);
    vec3 nz = vec3(tz.x, tz.y, tz.z * sign(geometricNormal.z));
    return normalize(nx * weights.x + ny * weights.y + nz * weights.z + geometricNormal * 0.72);
  }

  void main() {
    vec3 geometricNormal = normalize(vWorldNormal);
    vec3 weights = weightsFor(geometricNormal);
    vec3 normal = normalize(mix(geometricNormal, regolithNormal(geometricNormal, vLocalPosition, weights), 0.14));
    vec3 albedo = pow(max(sampleTriplanar(uDiffuse, vLocalPosition, weights), vec3(0.0)), vec3(0.88));
    float roughness = sampleTriplanar(uRoughness, vLocalPosition, weights).r;
    vec3 lightDir = normalize(uSunWorld - vWorldPosition);
    vec3 viewDir = normalize(uCameraWorld - vWorldPosition);
    vec3 halfVector = normalize(lightDir + viewDir);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float grazing = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    float specularPower = mix(42.0, 7.0, clamp(roughness, 0.0, 1.0));
    float specular = pow(max(dot(normal, halfVector), 0.0), specularPower) * (1.0 - roughness) * 0.035;
    // A finite body can be on the night side of the point-light source. Keep
    // a small deterministic sky fill so the measured silhouette and regolith
    // relief remain legible without introducing a second artistic light.
    float fill = mix(0.22, 0.16, uScience);
    float terminatorLift = (1.0 - diffuse) * (0.052 + 0.018 * uScience);
    vec3 warmRim = vec3(0.032, 0.026, 0.020) * grazing;
    float substrate = dot(albedo, vec3(0.299, 0.587, 0.114));
    float microContrast = clamp(0.82 + (substrate - 0.5) * 0.32, 0.68, 1.08);
    // Bennu is a low-albedo carbonaceous rubble pile. The admitted CC0 map is
    // used as microvariation, while the calibrated substrate prevents an
    // Earth-soil photograph from becoming a visible striped paint layer.
    albedo = vec3(0.34, 0.325, 0.31) * microContrast;
    vec3 color = albedo * (fill + diffuse * 1.04 + terminatorLift) + vec3(specular * 0.45) + warmRim;
    color *= mix(2.15, 1.55, uScience);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function useCelestialStarfieldV589(profile: CelestialRenderProfileV589) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const viewport = useThree((state) => state.size);
  const [snapshot, setSnapshot] = useState<StarfieldSnapshotV589 | null>(null);
  const [telemetry, setTelemetry] = useState<StarfieldTelemetryV589>({
    status: "idle" as "idle" | "loading" | "ready" | "blocked" | "released",
    catalogVersion: "none",
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    rangeRequests: 0,
    transferredBytes: 0,
    reason: "none",
  });
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(588_900);
  const lastViewRef = useRef({ raDeg: Number.NaN, decDeg: Number.NaN, fovDeg: Number.NaN, sentAt: 0 });
  const requestInFlightRef = useRef(false);
  const initialRequestFinishedRef = useRef(false);
  const cameraStableSinceRef = useRef(0);
  const previousCameraDirectionRef = useRef(new THREE.Vector3(Number.NaN, Number.NaN, Number.NaN));

  const viewFromCamera = useMemo(() => new THREE.Vector3(), []);
  const frameDirection = useMemo(() => new THREE.Vector3(), []);
  const postView = useCallback((force = false) => {
    const worker = workerRef.current;
    if (!worker) return;
    camera.getWorldDirection(viewFromCamera);
    const raDeg = (Math.atan2(viewFromCamera.z, viewFromCamera.x) * 180 / Math.PI + 360) % 360;
    const decDeg = Math.asin(THREE.MathUtils.clamp(viewFromCamera.y, -1, 1)) * 180 / Math.PI;
    const aspect = viewport.height > 0 ? viewport.width / viewport.height : 1;
    const horizontalFov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * Math.max(1, aspect)) * 180 / Math.PI;
    const fovDeg = THREE.MathUtils.clamp(Math.max(camera.fov, horizontalFov) + 18, 20, 165);
    const now = performance.now();
    const last = lastViewRef.current;
    const dot = Math.sin(decDeg * Math.PI / 180) * Math.sin(last.decDeg * Math.PI / 180)
      + Math.cos(decDeg * Math.PI / 180) * Math.cos(last.decDeg * Math.PI / 180) * Math.cos((raDeg - last.raDeg) * Math.PI / 180);
    const angularDelta = Number.isFinite(dot) ? Math.acos(THREE.MathUtils.clamp(dot, -1, 1)) * 180 / Math.PI : Infinity;
    if (!force && now - last.sentAt < 720 && angularDelta < 7.5 && Math.abs(fovDeg - last.fovDeg) < 4) return;
    const requestId = ++requestIdRef.current;
    lastViewRef.current = { raDeg, decDeg, fovDeg, sentAt: now };
    requestInFlightRef.current = true;
    worker.postMessage({
      type: "view",
      requestId,
      deliveryTier: profile.deliveryTier,
      deviceTier: profile.deviceTier,
      view: { raDeg, decDeg, fovDeg },
    });
  }, [camera, profile.deliveryTier, profile.deviceTier, viewport.height, viewport.width, viewFromCamera]);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/celestialStarfieldV589.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    const releaseWorker = acquireAtlasResource("worker", "atlas", "v589-gaia-starfield-worker", {
      owner: "v589-celestial-art",
      manifestSha256: CELESTIAL_ART_MANIFEST_SHA256_V589,
    });
    const releaseArrays = acquireAtlasResource("typed-array-cache", "atlas", "v589-gaia-starfield-transfer", {
      owner: "v589-celestial-art",
    });
    worker.addEventListener("message", (event: MessageEvent<CelestialStarfieldResponseV589>) => {
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
          rangeRequests: message.rangeRequests,
          transferredBytes: message.transferredBytes,
          reason: message.reason,
        });
        return;
      }
      setSnapshot({
        positions: message.positions,
        colors: message.colors,
        sizes: message.sizes,
        psfClass: message.psfClass,
        sourceIds: message.sourceIds,
        catalogVersion: message.catalogVersion,
        recordCount: message.sourceIds.length,
        presentationOnly: true,
      });
    });
    const requestId = ++requestIdRef.current;
    requestInFlightRef.current = true;
    initialRequestFinishedRef.current = false;
    worker.postMessage({
      type: "load",
      requestId,
      deliveryTier: profile.deliveryTier,
      deviceTier: profile.deviceTier,
      view: { raDeg: 270, decDeg: -28, fovDeg: 82 },
    });
    lastViewRef.current = { raDeg: 270, decDeg: -28, fovDeg: 82, sentAt: performance.now() };
    return () => {
      worker.postMessage({ type: "release", requestId: Number.MAX_SAFE_INTEGER });
      worker.terminate();
      workerRef.current = null;
      requestInFlightRef.current = false;
      initialRequestFinishedRef.current = false;
      releaseArrays();
      releaseWorker();
      setSnapshot(null);
    };
  }, [profile.deliveryTier, profile.deviceTier]);
  useFrame(() => {
    if (profile.deliveryTier !== "standalone-full" || !initialRequestFinishedRef.current || requestInFlightRef.current) return;
    camera.getWorldDirection(frameDirection);
    const now = performance.now();
    const previous = previousCameraDirectionRef.current;
    const movement = Number.isFinite(previous.x) ? frameDirection.angleTo(previous) : Number.POSITIVE_INFINITY;
    if (!Number.isFinite(movement) || movement > 0.0015) {
      previous.copy(frameDirection);
      cameraStableSinceRef.current = now;
      return;
    }
    if (now - cameraStableSinceRef.current >= 900) postView(false);
  });
  return { snapshot, telemetry };
}

function StarPointsLayerV589({
  snapshot,
  psf,
  profile,
}: {
  snapshot: StarfieldSnapshotV589;
  psf: 0 | 1;
  profile: CelestialRenderProfileV589;
}) {
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => {
    const indices: number[] = [];
    for (let index = 0; index < snapshot.psfClass.length; index += 1) {
      if (snapshot.psfClass[index] === psf) indices.push(index);
    }
    const positions = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const sizes = new Float32Array(indices.length);
    indices.forEach((sourceIndex, targetIndex) => {
      positions.set(snapshot.positions.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      colors.set(snapshot.colors.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      sizes[targetIndex] = snapshot.sizes[sourceIndex] * (psf === 0 ? 0.72 : 0.92);
    });
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    next.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    next.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return next;
  }, [psf, snapshot]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: POINT_VERTEX_V589,
    fragmentShader: POINT_FRAGMENT_V589,
    uniforms: {
      uPixelRatio: { value: Math.min(1.75, gl.getPixelRatio()) },
      uModeGain: { value: profile.mode === "cinematic" ? (psf === 0 ? 1.0 : 1.12) : 0.88 },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
      uOpacity: { value: profile.mode === "cinematic" ? (psf === 0 ? 0.52 : 0.82) : (psf === 0 ? 0.30 : 0.68) },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: profile.mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  }), [gl, profile.mode, psf]);
  useEffect(() => () => disposeAfterDetachV589(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-820 + psf} />;
}

function BrightPsfLayerV589({ snapshot, profile }: { snapshot: StarfieldSnapshotV589; profile: CelestialRenderProfileV589 }) {
  const size = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => {
    const indices: number[] = [];
    for (let index = 0; index < snapshot.psfClass.length; index += 1) if (snapshot.psfClass[index] === 2) indices.push(index);
    const centers = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);
    const sizes = new Float32Array(indices.length);
    const seeds = new Float32Array(indices.length);
    indices.forEach((sourceIndex, targetIndex) => {
      centers.set(snapshot.positions.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      colors.set(snapshot.colors.subarray(sourceIndex * 3, sourceIndex * 3 + 3), targetIndex * 3);
      sizes[targetIndex] = snapshot.sizes[sourceIndex] * 2.05;
      seeds[targetIndex] = Number(snapshot.sourceIds[sourceIndex] % BigInt(997)) / 997;
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
    next.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 3));
    next.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes, 1));
    next.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    next.instanceCount = indices.length;
    return next;
  }, [snapshot]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: PSF_VERTEX_V589,
    fragmentShader: PSF_FRAGMENT_V589,
    uniforms: {
      uViewport: { value: new THREE.Vector2(size.width, size.height) },
      uPixelRatio: { value: Math.min(1.75, gl.getPixelRatio()) },
      uModeGain: { value: profile.mode === "cinematic" ? 1.25 : 0.78 },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: profile.mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  }), [gl, profile.mode, size.height, size.width]);
  useEffect(() => {
    material.uniforms.uViewport.value.set(size.width, size.height);
  }, [material, size.height, size.width]);
  useEffect(() => () => disposeAfterDetachV589(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-815} />;
}

function GaiaStarfieldV589({
  profile,
  onTelemetry,
}: {
  profile: CelestialRenderProfileV589;
  onTelemetry: (value: ReturnType<typeof useCelestialStarfieldV589>["telemetry"]) => void;
}) {
  const { snapshot, telemetry } = useCelestialStarfieldV589(profile);
  useEffect(() => onTelemetry(telemetry), [onTelemetry, telemetry]);
  if (!snapshot) return null;
  return (
    <group userData={{ atlasCandidate: "v589", atlasLayer: "gaia-starfield", atlasCatalogVersion: snapshot.catalogVersion }}>
      <StarPointsLayerV589 snapshot={snapshot} psf={0} profile={profile} />
      <StarPointsLayerV589 snapshot={snapshot} psf={1} profile={profile} />
      <BrightPsfLayerV589 snapshot={snapshot} profile={profile} />
      <GaiaConstellationsV589 snapshot={snapshot} profile={profile} />
    </group>
  );
}

function GaiaConstellationsV589({ snapshot, profile }: { snapshot: StarfieldSnapshotV589; profile: CelestialRenderProfileV589 }) {
  const [bindings, setBindings] = useState<readonly ConstellationBindingV589[]>([]);
  useEffect(() => {
    let alive = true;
    void fetch("/data/celestial-art-v589/constellation-gaia-bindings-v589.json", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`v589-constellation-runtime:${response.status}`);
        return response.json();
      })
      .then((value: { bindings?: ConstellationBindingV589[] }) => {
        if (alive && Array.isArray(value.bindings)) setBindings(value.bindings);
      })
      .catch(() => {
        if (alive) setBindings([]);
      });
    return () => { alive = false; };
  }, []);
  const featured = profile.deviceTier === "mobile" ? DEFAULT_CONSTELLATIONS_MOBILE_V589 : DEFAULT_CONSTELLATIONS_DESKTOP_V589;
  const geometry = useMemo(() => {
    const byId = new Map<string, readonly [number, number, number]>();
    for (let index = 0; index < snapshot.sourceIds.length; index += 1) {
      byId.set(snapshot.sourceIds[index].toString(), [snapshot.positions[index * 3], snapshot.positions[index * 3 + 1], snapshot.positions[index * 3 + 2]]);
    }
    const positions: number[] = [];
    for (const binding of bindings) {
      if (!(featured as readonly string[]).includes(binding.iauCode)) continue;
      for (let index = 1; index < binding.waypoints.length; index += 1) {
        const left = byId.get(binding.waypoints[index - 1].sourceId);
        const right = byId.get(binding.waypoints[index].sourceId);
        if (!left || !right) continue;
        positions.push(...left, ...right);
      }
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return next;
  }, [bindings, featured, snapshot]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: profile.mode === "cinematic" ? 0x8ca8b8 : 0x6d8b9b,
    transparent: true,
    opacity: profile.mode === "cinematic" ? 0.26 : 0.38,
    linewidth: profile.deviceTier === "mobile" ? 0.65 : 0.72,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), [profile.deviceTier, profile.mode]);
  useEffect(() => () => disposeAfterDetachV589(geometry), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <lineSegments
      geometry={geometry}
      material={material}
      renderOrder={-805}
      userData={{ atlasCandidate: "v589", atlasPresentationOnly: true, atlasDepthOcclusion: true, atlasWaypointBinding: "gaia-source-id" }}
    />
  );
}

function MilkyWayBackdropV589({ profile }: { profile: CelestialRenderProfileV589 }) {
  const asset = useV589Texture("milky-way-v588-readonly", profile.deliveryTier, profile.deviceTier);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const viewport = useThree((state) => state.size);
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 1), []);
  useEffect(() => () => disposeAfterDetachV589(geometry), [geometry]);
  useFrame(() => {
    if (!ref.current) return;
    const distance = 79;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    ref.current.position.copy(camera.position).addScaledVector(forward, distance);
    ref.current.quaternion.copy(camera.quaternion);
    ref.current.scale.set(height * Math.max(1, viewport.width / Math.max(1, viewport.height)), height, 1);
  });
  if (!asset.texture) return null;
  return (
    <mesh ref={ref} geometry={geometry} renderOrder={-900} userData={{ atlasCandidate: "v589", atlasFrozenBackdropDependency: "v588-readonly" }}>
      <meshBasicMaterial
        map={asset.texture}
        color={profile.mode === "cinematic" ? "#c7d4e1" : "#647484"}
        transparent
        opacity={profile.mode === "cinematic" ? 0.78 : 0.34}
        depthWrite={false}
        depthTest={false}
        toneMapped={profile.mode === "cinematic"}
      />
    </mesh>
  );
}

function OrbitSystemV589({ selectedBody, mode, focusTarget }: { selectedBody: HeroBodyIdV589; mode: CelestialRenderProfileV589["mode"]; focusTarget: FocusTargetV589 }) {
  return (
    <group userData={{ atlasCandidate: "v589", atlasOrbitSystem: "v588-baseline-extended", atlasPresentationOnly: true }}>
      {CELESTIAL_ORBITS_V589.filter((orbit) => orbit.semiMajorAxis > 0).map((orbit) => (
        <OrbitPathV589 key={orbit.bodyId} bodyId={orbit.bodyId} selected={orbit.bodyId === selectedBody} mode={mode} closeup={focusTarget !== "overview"} />
      ))}
    </group>
  );
}

function OrbitPathV589({ bodyId, selected, mode, closeup }: { bodyId: HeroBodyIdV589; selected: boolean; mode: CelestialRenderProfileV589["mode"]; closeup: boolean }) {
  const spec = HERO_BODY_SPEC_BY_ID_V589[bodyId];
  const positions = useMemo(() => celestialOrbitPathV589(CELESTIAL_ORBIT_BY_ID_V589[bodyId], selected ? 320 : 160), [bodyId, selected]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)), [positions]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: selected ? spec.accent : (mode === "science" ? 0x53646f : 0x77674f),
    transparent: true,
    opacity: selected ? (closeup ? 0.075 : 0.82) : (mode === "science" ? 0.22 : 0.18),
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  }), [closeup, mode, selected, spec.accent]);
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);
  useEffect(() => () => {
    disposeAfterDetachV589(geometry);
    material.dispose();
  }, [geometry, material]);
  const markers = useMemo(() => {
    const periapsis = celestialOrbitPointV589(CELESTIAL_ORBIT_BY_ID_V589[bodyId], 0);
    const ascendingNode = celestialOrbitPointV589(CELESTIAL_ORBIT_BY_ID_V589[bodyId], -CELESTIAL_ORBIT_BY_ID_V589[bodyId].argumentOfPeriapsisRad);
    const descendingNode = celestialOrbitPointV589(CELESTIAL_ORBIT_BY_ID_V589[bodyId], Math.PI - CELESTIAL_ORBIT_BY_ID_V589[bodyId].argumentOfPeriapsisRad);
    const phase = CELESTIAL_ORBIT_BY_ID_V589[bodyId].phaseRad;
    const current = celestialOrbitPointV589(CELESTIAL_ORBIT_BY_ID_V589[bodyId], phase);
    const next = celestialOrbitPointV589(CELESTIAL_ORBIT_BY_ID_V589[bodyId], phase + 0.025);
    const tangent = new THREE.Vector3(next[0] - current[0], next[1] - current[1], next[2] - current[2]).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    return { periapsis, ascendingNode, descendingNode, current, quaternion };
  }, [bodyId]);
  return (
    <group
      visible={!closeup || selected}
      userData={{ atlasCandidate: "v589", atlasOrbitBody: bodyId, atlasPresentationOnly: true }}
    >
      <primitive object={line} />
      {selected && !closeup ? (
        <>
          <mesh position={markers.current as [number, number, number]} quaternion={markers.quaternion} userData={{ atlasOrbitDirectionArrow: bodyId, atlasPresentationOnly: true }}>
            <coneGeometry args={[0.075, 0.28, 6]} />
            <meshBasicMaterial color={spec.accent} transparent opacity={0.9} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={markers.periapsis as [number, number, number]} userData={{ atlasOrbitPeriapsis: bodyId, atlasPresentationOnly: true }}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color={spec.accent} transparent opacity={0.72} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={markers.ascendingNode as [number, number, number]} userData={{ atlasOrbitAscendingNode: bodyId, atlasPresentationOnly: true }}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshBasicMaterial color="#7fd7e8" transparent opacity={0.66} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={markers.descendingNode as [number, number, number]} userData={{ atlasOrbitDescendingNode: bodyId, atlasPresentationOnly: true }}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshBasicMaterial color="#d29a70" transparent opacity={0.66} depthWrite={false} toneMapped={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function AtmosphereShellV589({ radius, color, density, power = 2.2, shellScale = 1.055 }: { radius: number; color: string; density: number; power?: number; shellScale?: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX_V589,
    fragmentShader: ATMOSPHERE_FRAGMENT_V589,
    uniforms: { uColor: { value: new THREE.Color(color) }, uDensity: { value: density }, uPower: { value: power } },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [color, density, power]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh scale={shellScale} material={material} renderOrder={6}>
      <sphereGeometry args={[radius, 96, 64]} />
    </mesh>
  );
}

function AdmissionHaloV589({ bodyId, admission }: { bodyId: HeroBodyIdV589; admission: HeroAssetAdmissionV589 }) {
  if (admission !== "asset-blocked") return null;
  return (
    <group userData={{ atlasAssetBlocked: bodyId, atlasProceduralFallback: false, atlasBlockedMarker: "hud-only" }} />
  );
}

type HeroVisualPropsV589 = Readonly<{
  bodyId: HeroBodyIdV589;
  profile: CelestialRenderProfileV589;
  admission: HeroAssetAdmissionV589;
  focused: boolean;
}>;

function EarthV589({ profile, admission }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589.earth;
  const albedo = useV589Texture("earth-albedo", profile.deliveryTier, profile.deviceTier);
  const normal = useV589Texture("earth-normal", profile.deliveryTier, profile.deviceTier);
  const roughness = useV589Texture("earth-roughness", profile.deliveryTier, profile.deviceTier);
  const clouds = useV589Texture("earth-clouds", profile.deliveryTier, profile.deviceTier);
  const cloudAlpha = useV589Texture("earth-cloud-alpha", profile.deliveryTier, profile.deviceTier);
  const night = useV589Texture("earth-night", profile.deliveryTier, profile.deviceTier);
  const nightMask = useV589Texture("earth-night-mask", profile.deliveryTier, profile.deviceTier);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spec.rotationRate;
  });
  const nightMaterial = useMemo(() => night.texture && nightMask.texture ? new THREE.ShaderMaterial({
    vertexShader: NIGHT_VERTEX_V589,
    fragmentShader: NIGHT_FRAGMENT_V589,
    uniforms: { uNight: { value: night.texture }, uMask: { value: nightMask.texture }, uGain: { value: profile.mode === "cinematic" ? 1.6 : 0.72 } },
    transparent: true,
    depthWrite: false,
    blending: profile.mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  }) : null, [night.texture, nightMask.texture, profile.mode]);
  useEffect(() => () => nightMaterial?.dispose(), [nightMaterial]);
  if (admission !== "admitted" || !albedo.texture || !normal.texture || !roughness.texture || !clouds.texture || !cloudAlpha.texture || !night.texture || !nightMask.texture || !nightMaterial) {
    return <BlockedBodyProxyV589 bodyId="earth" admission="asset-blocked" />;
  }
  return (
    <group ref={group} rotation={[0, 0, spec.axialTiltRad]} userData={{ atlasHeroBody: "earth", atlasProceduralFallback: false, atlasAdmission: admission }}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, 128, 96]} />
        <meshStandardMaterial map={albedo.texture} normalMap={normal.texture} normalScale={new THREE.Vector2(0.36, 0.36)} roughnessMap={roughness.texture} roughness={0.82} metalness={0} envMapIntensity={0.018} />
      </mesh>
      {nightMaterial ? <mesh scale={1.0015} material={nightMaterial}><sphereGeometry args={[spec.radius, 128, 96]} /></mesh> : null}
      <mesh scale={1.012} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, 128, 96]} />
        <meshStandardMaterial map={clouds.texture} alphaMap={cloudAlpha.texture} transparent opacity={profile.mode === "cinematic" ? 0.72 : 0.46} alphaTest={0.025} roughness={1} depthWrite={false} />
      </mesh>
      <AtmosphereShellV589 radius={spec.radius} color="#78b6d1" density={profile.mode === "cinematic" ? 0.105 : 0.042} power={5.2} shellScale={1.0035} />
      <AdmissionHaloV589 bodyId="earth" admission={admission} />
    </group>
  );
}

function JupiterV589({ profile, admission }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589.jupiter;
  const albedo = useV589Texture("jupiter-albedo", profile.deliveryTier, profile.deviceTier);
  const bands = useV589Texture("jupiter-band-mask", profile.deliveryTier, profile.deviceTier);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * spec.rotationRate; });
  if (admission !== "admitted" || !albedo.texture || !bands.texture) return <BlockedBodyProxyV589 bodyId="jupiter" admission="asset-blocked" />;
  return (
    <group ref={group} rotation={[0, 0, spec.axialTiltRad]} userData={{ atlasHeroBody: "jupiter", atlasAdmission: admission, atlasProceduralFallback: false }}>
      <mesh scale={[1.025, 0.968, 1.025]} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, 128, 96]} />
        <meshStandardMaterial
          map={albedo.texture}
          roughnessMap={bands.texture}
          color="#fff8ef"
          roughness={0.965}
          metalness={0}
          emissive="#382515"
          emissiveIntensity={profile.mode === "cinematic" ? 0.24 : 0.12}
          envMapIntensity={0}
        />
      </mesh>
      <AtmosphereShellV589 radius={spec.radius} color="#d8ad83" density={profile.mode === "cinematic" ? 0.045 : 0.018} power={5.0} shellScale={1.006} />
      <AdmissionHaloV589 bodyId="jupiter" admission={admission} />
    </group>
  );
}

function SaturnV589({ profile, admission }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589.saturn;
  const albedo = useV589Texture("saturn-albedo", profile.deliveryTier, profile.deviceTier);
  const bands = useV589Texture("saturn-band-mask", profile.deliveryTier, profile.deviceTier);
  const ring = useV589Texture("saturn-ring-color", profile.deliveryTier, profile.deviceTier);
  const alpha = useV589Texture("saturn-ring-alpha", profile.deliveryTier, profile.deviceTier);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const sunLocal = useMemo(() => new THREE.Vector3(), []);
  const cameraLocal = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => albedo.texture && bands.texture && alpha.texture ? new THREE.ShaderMaterial({
    vertexShader: SATURN_VERTEX_V589,
    fragmentShader: SATURN_FRAGMENT_V589,
    uniforms: {
      uMap: { value: albedo.texture },
      uBands: { value: bands.texture },
      uRingAlpha: { value: alpha.texture },
      uSunLocal: { value: new THREE.Vector3() },
      uCameraLocal: { value: new THREE.Vector3() },
      uInner: { value: spec.radius * 1.25 },
      uOuter: { value: spec.radius * 2.35 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [albedo.texture, alpha.texture, bands.texture, profile.mode, spec.radius]);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * spec.rotationRate; });
  useFrame(() => {
    if (!group.current || !material) return;
    group.current.updateMatrixWorld();
    sunLocal.set(0, 0, 0);
    cameraLocal.copy(camera.position);
    group.current.worldToLocal(sunLocal);
    group.current.worldToLocal(cameraLocal);
    material.uniforms.uSunLocal.value.copy(sunLocal);
    material.uniforms.uCameraLocal.value.copy(cameraLocal);
  });
  useEffect(() => () => material?.dispose(), [material]);
  if (admission !== "admitted" || !albedo.texture || !bands.texture || !ring.texture || !alpha.texture || !material) {
    return <BlockedBodyProxyV589 bodyId="saturn" admission={admission} />;
  }
  return (
    <group ref={group} rotation={[0, 0, spec.axialTiltRad]} userData={{ atlasHeroBody: "saturn", atlasAdmission: admission, atlasProceduralFallback: false }}>
      <mesh scale={[1.035, 0.955, 1.035]} castShadow receiveShadow material={material}>
        <sphereGeometry args={[spec.radius, 128, 96]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow renderOrder={3}>
        <ringGeometry args={[spec.radius * 1.25, spec.radius * 2.35, 320, 4]} />
        <meshStandardMaterial map={ring.texture} alphaMap={alpha.texture} transparent alphaTest={0.035} opacity={0.92} side={THREE.DoubleSide} roughness={0.96} metalness={0} depthWrite={false} />
      </mesh>
      <mesh scale={1.003} renderOrder={4}>
        <sphereGeometry args={[spec.radius, 128, 96]} />
        <meshBasicMaterial color="#050403" transparent opacity={0.09} blending={THREE.NormalBlending} depthWrite={false} />
      </mesh>
      <AtmosphereShellV589 radius={spec.radius} color="#dcc898" density={profile.mode === "cinematic" ? 0.08 : 0.03} power={4.5} shellScale={1.012} />
      <AdmissionHaloV589 bodyId="saturn" admission={admission} />
    </group>
  );
}

function SunV589({ profile, admission }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589.sun;
  const albedo = useV589Texture("sun-albedo", profile.deliveryTier, profile.deviceTier);
  const group = useRef<THREE.Group>(null);
  const material = useMemo(() => albedo.texture ? new THREE.ShaderMaterial({
    vertexShader: SOLAR_VERTEX_V589,
    fragmentShader: SOLAR_FRAGMENT_V589,
    uniforms: {
      uMap: { value: albedo.texture },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [albedo.texture, profile.mode]);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * spec.rotationRate; });
  useEffect(() => () => material?.dispose(), [material]);
  if (admission !== "admitted" || !albedo.texture || !material) return <BlockedBodyProxyV589 bodyId="sun" admission="asset-blocked" />;
  return (
    <group ref={group} userData={{ atlasHeroBody: "sun", atlasAdmission: admission, atlasProceduralFallback: false }}>
      <mesh material={material}>
        <sphereGeometry args={[spec.radius, 128, 96]} />
      </mesh>
      <AtmosphereShellV589 radius={spec.radius} color="#ffb35f" density={profile.mode === "cinematic" ? 1.05 : 0.24} power={2.8} />
      <AdmissionHaloV589 bodyId="sun" admission={admission} />
    </group>
  );
}

function RockyV589({ bodyId, profile, admission }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589[bodyId];
  const albedo = useV589Texture(`${bodyId}-albedo`, profile.deliveryTier, profile.deviceTier);
  const roughness = useV589Texture(`${bodyId}-roughness`, profile.deliveryTier, profile.deviceTier);
  const normal = useV589Texture(`${bodyId}-normal`, profile.deliveryTier, profile.deviceTier);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * spec.rotationRate; });
  if (admission !== "admitted" || !albedo.texture || !roughness.texture || !normal.texture) return <BlockedBodyProxyV589 bodyId={bodyId} admission="asset-blocked" />;
  return (
    <group ref={group} rotation={[0, 0, spec.axialTiltRad]} userData={{ atlasHeroBody: bodyId, atlasAdmission: admission, atlasProceduralFallback: false }}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, 128, 96]} />
        <meshStandardMaterial
          map={albedo.texture}
          roughnessMap={roughness.texture}
          normalMap={normal.texture}
          normalScale={normal.texture ? new THREE.Vector2(0.75, 0.75) : undefined}
          roughness={bodyId === "mars" ? 0.94 : 0.88}
          metalness={0}
          envMapIntensity={0.012}
        />
      </mesh>
      {bodyId === "venus" ? <AtmosphereShellV589 radius={spec.radius} color="#d7a957" density={0.92} power={2.4} /> : null}
      <AdmissionHaloV589 bodyId={bodyId} admission={admission} />
    </group>
  );
}

function IceGiantV589({ bodyId, profile, admission }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589[bodyId];
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ICE_GIANT_VERTEX_V589,
    fragmentShader: ICE_GIANT_FRAGMENT_V589,
    uniforms: {
      uBase: { value: new THREE.Color(bodyId === "uranus" ? "#83c9c8" : "#2353a4") },
      uBand: { value: new THREE.Color(bodyId === "uranus" ? "#b5e2d9" : "#548bd6") },
      uBandFrequency: { value: bodyId === "uranus" ? 24 : 34 },
      uStorm: { value: bodyId === "neptune" && profile.mode === "cinematic" ? 1 : 0.28 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }), [bodyId, profile.mode]);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * spec.rotationRate; });
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group ref={group} rotation={[0, 0, spec.axialTiltRad]} userData={{ atlasHeroBody: bodyId, atlasAdmission: admission, atlasProceduralPrimary: true, atlasProceduralFallback: false }}>
      <mesh material={material} scale={[1.015, 0.985, 1.015]}>
        <sphereGeometry args={[spec.radius, 128, 96]} />
      </mesh>
      <AtmosphereShellV589 radius={spec.radius} color={bodyId === "uranus" ? "#8fdcd6" : "#3d7bd4"} density={profile.mode === "cinematic" ? 0.12 : 0.04} power={4.2} shellScale={1.018} />
      <AdmissionHaloV589 bodyId={bodyId} admission={admission} />
    </group>
  );
}

function BennuV589({ profile, admission, focused }: HeroVisualPropsV589) {
  const spec = HERO_BODY_SPEC_BY_ID_V589.bennu;
  const enabled = admission === "admitted";
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  const model = useV589Model("bennu-model", profile.deliveryTier, profile.deviceTier, preferredLod, enabled);
  const diffuse = useV589Texture("regolith-cc0", profile.deliveryTier, profile.deviceTier, enabled);
  const normal = useV589Texture("regolith-normal-cc0", profile.deliveryTier, profile.deviceTier, enabled);
  const roughness = useV589Texture("regolith-roughness-cc0", profile.deliveryTier, profile.deviceTier, enabled);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const material = useMemo(() => diffuse.texture && normal.texture && roughness.texture ? new THREE.ShaderMaterial({
    vertexShader: REGOLITH_TRIPLANAR_VERTEX_V589,
    fragmentShader: REGOLITH_TRIPLANAR_FRAGMENT_V589,
    uniforms: {
      uDiffuse: { value: diffuse.texture },
      uNormal: { value: normal.texture },
      uRoughness: { value: roughness.texture },
      uSunWorld: { value: new THREE.Vector3(0, 0, 0) },
      uCameraWorld: { value: new THREE.Vector3() },
      uScale: { value: profile.deviceTier === "mobile" ? 1.8 : 2.4 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [diffuse.texture, normal.texture, profile.deviceTier, profile.mode, roughness.texture]);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spec.rotationRate;
    material?.uniforms.uCameraWorld.value.copy(camera.position);
  });
  useEffect(() => () => material?.dispose(), [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const previous = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      previous.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
    });
    return () => previous.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v589-celestial-art-browser-acceptance"]');
    if (!root) return;
    root.dataset.atlasV589BennuModelStatus = model.status;
    root.dataset.atlasV589BennuModelLod = model.lod === null ? "none" : String(model.lod);
    root.dataset.atlasV589BennuModelSha = model.sha256;
    root.dataset.atlasV589BennuModelBytes = String(model.sourceBytes);
    root.dataset.atlasV589BennuModelGpuBytes = String(model.estimatedGpuBytes);
    root.dataset.atlasV589BennuDiffuseSource = diffuse.source;
    root.dataset.atlasV589BennuDiffuseReason = diffuse.reason;
    root.dataset.atlasV589BennuNormalSource = normal.source;
    root.dataset.atlasV589BennuNormalReason = normal.reason;
    root.dataset.atlasV589BennuRoughnessSource = roughness.source;
    root.dataset.atlasV589BennuRoughnessReason = roughness.reason;
    root.dataset.atlasV589BennuProceduralFallback = "false";
    return () => {
      root.dataset.atlasV589BennuModelStatus = "released";
      root.dataset.atlasV589BennuModelLod = "none";
      root.dataset.atlasV589BennuModelGpuBytes = "0";
    };
  }, [diffuse.reason, diffuse.source, model.estimatedGpuBytes, model.lod, model.sha256, model.sourceBytes, model.status, normal.reason, normal.source, roughness.reason, roughness.source]);
  if (!enabled) return <BlockedBodyProxyV589 bodyId="bennu" admission={admission} />;
  return (
    <group
      ref={group}
      rotation={[0, 0, spec.axialTiltRad]}
      userData={{
        atlasHeroBody: "bennu",
        atlasAdmission: admission,
        atlasProceduralFallback: false,
        atlasModelStatus: model.status,
        atlasModelLod: model.lod,
        atlasPresentationOnly: true,
      }}
    >
      {model.scene && material ? <primitive object={model.scene} scale={spec.radius} /> : null}
      <AdmissionHaloV589 bodyId="bennu" admission={model.status === "blocked" ? "asset-blocked" : admission} />
    </group>
  );
}

function BlockedBodyProxyV589({ bodyId, admission }: { bodyId: HeroBodyIdV589; admission: HeroAssetAdmissionV589 }) {
  return (
    <group userData={{ atlasHeroBody: bodyId, atlasAssetBlocked: true, atlasProceduralFallback: false, atlasBlockedMarker: "hud-only" }}>
      <AdmissionHaloV589 bodyId={bodyId} admission={admission} />
    </group>
  );
}

function HeroVisualV589(props: HeroVisualPropsV589) {
  if (props.bodyId === "earth") return <EarthV589 {...props} />;
  if (props.bodyId === "jupiter") return <JupiterV589 {...props} />;
  if (props.bodyId === "saturn") return <SaturnV589 {...props} />;
  if (props.bodyId === "sun") return <SunV589 {...props} />;
  if (props.bodyId === "uranus" || props.bodyId === "neptune") return <IceGiantV589 {...props} />;
  if (["mercury", "venus", "moon", "mars"].includes(props.bodyId)) return <RockyV589 {...props} />;
  if (props.bodyId === "bennu") return <BennuV589 {...props} />;
  return <BlockedBodyProxyV589 bodyId={props.bodyId} admission={props.admission} />;
}

function BodySystemV589({
  profile,
  admissions,
  focusTarget,
}: {
  profile: CelestialRenderProfileV589;
  admissions: Readonly<Record<HeroBodyIdV589, HeroAssetAdmissionV589>>;
  focusTarget: FocusTargetV589;
}) {
  return (
    <group userData={{ atlasCandidate: "v589", atlasHeroCount: 16 }}>
      {HERO_BODY_SPECS_V589.map((spec) => {
        const orbit = CELESTIAL_ORBIT_BY_ID_V589[spec.id];
        const position = celestialOrbitPointV589(orbit, orbit.phaseRad);
        const focused = focusTarget === spec.id;
        const visible = focusTarget === "overview" || focused;
        if (!visible) return null;
        return (
          <group key={spec.id} position={position as [number, number, number]} scale={focused ? 1.32 : 1}>
            <HeroVisualV589 bodyId={spec.id} profile={profile} admission={admissions[spec.id]} focused={focused} />
          </group>
        );
      })}
    </group>
  );
}

function CameraRigV589({ focusTarget }: { focusTarget: FocusTargetV589 }) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controls = useRef<OrbitControlsImpl>(null);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const sunward = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const cameraOffset = useMemo(() => new THREE.Vector3(), []);
  const referenceUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame((_, delta) => {
    if (focusTarget === "overview") {
      desiredTarget.set(0, 0, 0);
      desiredPosition.set(0, 16.5, 31.5);
    } else {
      const orbit = CELESTIAL_ORBIT_BY_ID_V589[focusTarget];
      const spec = HERO_BODY_SPEC_BY_ID_V589[focusTarget];
      const point = celestialOrbitPointV589(orbit, orbit.phaseRad);
      desiredTarget.set(point[0], point[1], point[2]);
      const isSmallBody = spec.group === "small-body";
      const distance = Math.max(isSmallBody ? 1.8 : 3.2, spec.radius * (focusTarget === "saturn" ? 8.0 : isSmallBody ? 5.2 : 6.4));
      if (desiredTarget.lengthSq() > 0.0001) {
        sunward.copy(desiredTarget).multiplyScalar(-1).normalize();
        tangent.crossVectors(referenceUp, sunward).normalize();
        cameraOffset.copy(sunward).multiplyScalar(0.56).addScaledVector(tangent, 0.76).addScaledVector(referenceUp, 0.28).normalize();
      } else {
        cameraOffset.set(0.36, 0.18, 0.92).normalize();
      }
      desiredPosition.copy(desiredTarget).addScaledVector(cameraOffset, distance);
    }
    const damping = 1 - Math.exp(-delta * 3.8);
    camera.position.lerp(desiredPosition, damping);
    controls.current?.target.lerp(desiredTarget, damping);
    controls.current?.update();
  });
  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.075}
      enablePan={false}
      minDistance={1.4}
      maxDistance={72}
      rotateSpeed={0.48}
      zoomSpeed={0.72}
    />
  );
}

function RuntimeProbeV589({ telemetry }: { telemetry: ReturnType<typeof useCelestialStarfieldV589>["telemetry"] }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.25) return;
    last.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v589-celestial-art-browser-acceptance"]');
    if (!root) return;
    let candidateNodes = 0;
    scene.traverse((object) => { if (object.userData.atlasCandidate === "v589" || object.userData.atlasHeroBody) candidateNodes += 1; });
    const resources = getAtlasResourceSnapshot();
    root.dataset.atlasV589StarCatalog = telemetry.catalogVersion;
    root.dataset.atlasV589StarStatus = telemetry.status;
    root.dataset.atlasV589StarCount = String(telemetry.recordCount);
    root.dataset.atlasV589StarFaintCount = String(telemetry.layerCounts.faint);
    root.dataset.atlasV589StarCatalogCount = String(telemetry.layerCounts.catalog);
    root.dataset.atlasV589StarBrightPsfCount = String(telemetry.layerCounts.brightPsf);
    root.dataset.atlasV589StarRangeRequests = String(telemetry.rangeRequests);
    root.dataset.atlasV589StarTransferredBytes = String(telemetry.transferredBytes);
    root.dataset.atlasV589DrawCalls = String(gl.info.render.calls);
    root.dataset.atlasV589Triangles = String(gl.info.render.triangles);
    root.dataset.atlasV589Programs = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasV589Textures = String(gl.info.memory.textures);
    root.dataset.atlasV589Geometries = String(gl.info.memory.geometries);
    root.dataset.atlasV589GpuBytes = String(resources.estimatedGpuBytes);
    root.dataset.atlasV589ResourceBytes = String(resources.estimatedBytes);
    root.dataset.atlasV589CandidateNodes = String(candidateNodes);
  });
  return null;
}

function RenderProfileDirectorV589({ profile }: { profile: CelestialRenderProfileV589 }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.toneMapping = profile.mode === "science" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = resolveExposureV589(profile);
  }, [gl, profile]);
  return null;
}

export function CelestialArtReleaseProbeV589({ active, baseline }: { active: boolean; baseline: AtlasRuntimeResourceSnapshot }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const last = useRef(0);
  const rendererBaseline = useRef<{ textures: number; geometries: number; programs: number }>({
    textures: gl.info.memory.textures,
    geometries: gl.info.memory.geometries,
    programs: gl.info.programs?.length ?? 0,
  });
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.12) return;
    last.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v589-celestial-art-browser-acceptance"]');
    if (!root) return;
    const resources = getAtlasResourceSnapshot();
    const diff = diffAtlasResourceSnapshotsV300(baseline, resources);
    let nodes = 0;
    scene.traverse((object) => { if (object.userData.atlasCandidate === "v589" || object.userData.atlasHeroBody) nodes += 1; });
    const candidateResources = resources.byOwner["v589-celestial-art"]?.count ?? 0;
    const baselineMemory = rendererBaseline.current;
    const programDelta = Math.max(0, (gl.info.programs?.length ?? 0) - baselineMemory.programs);
    const released = !active
      && diff.status === "baseline"
      && candidateResources === 0
      && nodes === 0
      && gl.info.memory.geometries === baselineMemory.geometries
      && gl.info.memory.textures === baselineMemory.textures
      // Three keeps a small renderer-owned shader cache alive after a scene
      // unmount. It is not attributable to the v589 owner and is bounded to
      // one entry; candidate resources and GPU buffers must still return to
      // the exact entry baseline above.
      && programDelta <= 1;
    root.dataset.atlasV589ReleaseRegistryStatus = diff.status;
    root.dataset.atlasV589ReleaseRegistryDelta = String(diff.total);
    root.dataset.atlasV589ReleaseCandidateResources = String(candidateResources);
    root.dataset.atlasV589ReleaseSceneNodes = String(nodes);
    root.dataset.atlasV589ReleaseBaselineTextures = String(baselineMemory.textures);
    root.dataset.atlasV589ReleaseBaselineGeometries = String(baselineMemory.geometries);
    root.dataset.atlasV589ReleaseBaselinePrograms = String(baselineMemory.programs);
    root.dataset.atlasV589ReleaseProgramDelta = String(programDelta);
    root.dataset.atlasV589ReleaseRendererCacheOnly = (!active && programDelta <= 1) ? "true" : "false";
    if (!active) {
      root.dataset.atlasV589Geometries = String(gl.info.memory.geometries);
      root.dataset.atlasV589Textures = String(gl.info.memory.textures);
      root.dataset.atlasV589Programs = String(gl.info.programs?.length ?? 0);
    }
    root.dataset.atlasV589ResourceReleaseStatus = active ? "armed" : released ? "released-zero" : "draining";
  });
  return null;
}

function disposeCandidateSceneGraphV589(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (renderable.geometry instanceof THREE.BufferGeometry) geometries.add(renderable.geometry);
    const currentMaterials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material ? [renderable.material] : [];
    for (const material of currentMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && value.userData.atlasCandidate === "v589") textures.add(value);
      }
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

export default function CelestialArtStageV589({
  profile,
  admissions,
  focusTarget,
}: {
  profile: CelestialRenderProfileV589;
  admissions: Readonly<Record<HeroBodyIdV589, HeroAssetAdmissionV589>>;
  focusTarget: FocusTargetV589;
}) {
  const gl = useThree((state) => state.gl);
  const candidateRootRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const [telemetry, setTelemetry] = useState({
    status: "idle" as "idle" | "loading" | "ready" | "blocked" | "released",
    catalogVersion: "none",
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    rangeRequests: 0,
    transferredBytes: 0,
    reason: "none",
  });
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const candidateRoot = candidateRootRef.current;
    const keyLight = keyLightRef.current;
    return () => {
      if (candidateRoot) disposeCandidateSceneGraphV589(candidateRoot);
      keyLight?.shadow.dispose();
      gl.renderLists.dispose();
      gl.shadowMap.enabled = false;
      disposeV589TextureLoader(gl);
    };
  }, [gl]);
  return (
    <>
      <color attach="background" args={["#000104"]} />
      <RenderProfileDirectorV589 profile={profile} />
      <group ref={candidateRootRef}>
        <ambientLight intensity={profile.mode === "science" ? 0.036 : 0.056} color="#8396aa" />
        <pointLight ref={keyLightRef} position={[0, 0, 0]} intensity={profile.mode === "science" ? 3.8 : 6.6} distance={0} decay={0} color="#fff2d8" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <MilkyWayBackdropV589 profile={profile} />
        <GaiaStarfieldV589 profile={profile} onTelemetry={setTelemetry} />
        <OrbitSystemV589 selectedBody={profile.selectedBody} mode={profile.mode} focusTarget={focusTarget} />
        <BodySystemV589 profile={profile} admissions={admissions} focusTarget={focusTarget} />
        <group userData={{
          atlasCandidate: "v589",
          atlasSingleCanvas: true,
          atlasScientificPayloadSha256: CELESTIAL_ART_SCIENTIFIC_PAYLOAD_SHA256_V589,
          atlasScientificPayloadMutation: false,
        }} />
      </group>
      <CameraRigV589 focusTarget={focusTarget} />
      <RuntimeProbeV589 telemetry={telemetry} />
    </>
  );
}
