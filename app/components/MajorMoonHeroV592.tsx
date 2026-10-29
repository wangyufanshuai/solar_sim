"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CelestialClockControllerV592 } from "../lib/celestialClockV592";
import type { CelestialRenderProfileV590 } from "../lib/celestialRenderingV590";
import {
  MAJOR_MOON_BY_ID_V592,
  resolveMajorMoonRotationV592,
  type MajorMoonIdV592,
} from "../lib/majorMoonsV592";
import {
  MAJOR_MOON_RUNTIME_HERO_IDS_V592,
  MAJOR_MOON_VISUAL_ASSETS_V592,
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
  isMajorMoonRuntimeHeroIdV592,
  type MajorMoonRuntimeHeroIdV592,
} from "../lib/majorMoonVisualAssetsV592";
import {
  estimateMajorMoonScreenDiameterPxV592,
  resolveMajorMoonInspectionCameraV592,
} from "../lib/majorMoonInspectionCameraV592";
import { useMajorMoonVisualTextureV592 } from "../lib/useMajorMoonVisualTextureV592";

const MAJOR_MOON_SURFACE_VERTEX_V592 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec2 vMoonUv;
  varying vec3 vMoonWorldNormal;
  varying vec3 vMoonWorldPosition;
  void main() {
    vMoonUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vMoonWorldPosition = worldPosition.xyz;
    vMoonWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    #include <logdepthbuf_vertex>
  }
`;

const MAJOR_MOON_SURFACE_FRAGMENT_V592 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform sampler2D uAlbedo;
  uniform vec3 uSunDirectionWorld;
  uniform vec3 uCinematicTint;
  uniform float uScience;
  uniform float uMappedColor;
  uniform float uContrast;
  uniform float uRoughness;
  varying vec2 vMoonUv;
  varying vec3 vMoonWorldNormal;
  varying vec3 vMoonWorldPosition;

  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vMoonWorldNormal);
    vec3 lightDirection = normalize(uSunDirectionWorld);
    vec3 viewDirection = normalize(cameraPosition - vMoonWorldPosition);
    float nDotL = dot(normal, lightDirection);
    float directLight = max(nDotL, 0.0);
    float horizonFill = 0.015 + 0.035 * max(normal.y, 0.0);
    float lunarDiffuse = directLight * (1.0 - 0.18 * uRoughness) + directLight * directLight * 0.18 * uRoughness;
    float opposition = pow(max(dot(viewDirection, lightDirection), 0.0), 12.0) * directLight * 0.055;
    vec3 encoded = texture2D(uAlbedo, vMoonUv).rgb;
    // The texture is registered as SRGBColorSpace, so Three/WebGL already
    // delivers linear samples to this shader. A second EOTF here crushed the
    // NASA grayscale mosaics into near-black and was physically incorrect.
    vec3 observed = encoded;
    float luminance = dot(observed, vec3(0.2126, 0.7152, 0.0722));
    observed = mix(vec3(luminance), observed, uMappedColor);
    observed = max(vec3(0.0), (observed - 0.18) * uContrast + 0.18);
    vec3 cinematicMapped = observed * uCinematicTint;
    vec3 albedo = mix(cinematicMapped, observed, uScience);
    float grazing = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);
    vec3 color = albedo * (horizonFill + lunarDiffuse + opposition);
    color += albedo * grazing * (uScience > 0.5 ? 0.0 : 0.018);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const TITAN_ATMOSPHERE_VERTEX_V592 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec3 vAtmosphereWorldNormal;
  varying vec3 vAtmosphereWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vAtmosphereWorldPosition = worldPosition.xyz;
    vAtmosphereWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    #include <logdepthbuf_vertex>
  }
`;

const TITAN_ATMOSPHERE_FRAGMENT_V592 = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
  uniform vec3 uSunDirectionWorld;
  varying vec3 vAtmosphereWorldNormal;
  varying vec3 vAtmosphereWorldPosition;
  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vAtmosphereWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vAtmosphereWorldPosition);
    vec3 lightDirection = normalize(uSunDirectionWorld);
    float viewMu = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float sunMu = dot(normal, lightDirection);
    float daylight = smoothstep(-0.18, 0.58, sunMu);
    float limbColumn = pow(1.0 - viewMu, 1.65);
    float forwardScatter = pow(max(dot(viewDirection, lightDirection), 0.0), 8.0);
    // Titan's optically thick aerosol column suppresses the contrast of the
    // admitted 938 nm surface mosaic across the disk, not only at the limb.
    // This shell is Cinematic-only presentation state; Science remains the
    // unmodified admitted near-infrared map.
    float diskHaze = 0.105 + daylight * 0.105;
    float alpha = clamp(diskHaze + limbColumn * (0.19 + daylight * 0.18) + forwardScatter * 0.035, 0.0, 0.48);
    vec3 nightHaze = vec3(0.24, 0.075, 0.018);
    vec3 dayHaze = vec3(0.96, 0.46, 0.105);
    vec3 color = mix(nightHaze, dayHaze, 0.22 + daylight * 0.78);
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type MoonMaterialProfileV592 = Readonly<{
  cinematicTint: readonly [number, number, number];
  mappedColor: number;
  contrast: number;
  roughness: number;
  materialLabel: string;
}>;

const MOON_MATERIAL_PROFILES_V592: Readonly<Record<MajorMoonRuntimeHeroIdV592, MoonMaterialProfileV592>> = Object.freeze({
  titan: Object.freeze({
    cinematicTint: [1.12, 0.78, 0.48] as const,
    mappedColor: 0,
    contrast: 0.88,
    roughness: 0.94,
    materialLabel: "cassini-938nm-surface+deterministic-optical-depth-haze-presentation",
  }),
  enceladus: Object.freeze({
    cinematicTint: [0.88, 0.97, 1.08] as const,
    mappedColor: 1,
    contrast: 1.14,
    roughness: 0.98,
    materialLabel: "cassini-global-map+oren-nayar-ice",
  }),
  rhea: Object.freeze({
    cinematicTint: [0.96, 0.98, 1.02] as const,
    mappedColor: 1,
    contrast: 1.18,
    roughness: 0.99,
    materialLabel: "cassini-global-map+rough-regolith",
  }),
  io: Object.freeze({
    cinematicTint: [1.18, 0.52, 0.22] as const,
    mappedColor: 1,
    contrast: 1.12,
    roughness: 0.86,
    materialLabel: "usgs-galileo-voyager-global-map+sulfur-regolith",
  }),
  europa: Object.freeze({
    cinematicTint: [0.92, 0.98, 1.08] as const,
    mappedColor: 1,
    contrast: 1.08,
    roughness: 0.96,
    materialLabel: "usgs-voyager-galileo-global-map+ice-regolith",
  }),
  ganymede: Object.freeze({
    cinematicTint: [0.92, 0.88, 0.78] as const,
    mappedColor: 1,
    contrast: 1.05,
    roughness: 0.94,
    materialLabel: "usgs-voyager-galileo-color-mosaic+ice-rock-regolith",
  }),
  callisto: Object.freeze({
    cinematicTint: [0.78, 0.72, 0.66] as const,
    mappedColor: 1,
    contrast: 1.12,
    roughness: 0.98,
    materialLabel: "usgs-voyager-galileo-global-map+dark-regolith",
  }),
  iapetus: Object.freeze({
    cinematicTint: [0.88, 0.86, 0.82] as const,
    mappedColor: 1,
    contrast: 1.15,
    roughness: 0.99,
    materialLabel: "usgs-voyager-airbrush-global-map+two-tone-regolith",
  }),
  charon: Object.freeze({
    cinematicTint: [1.00, 0.82, 0.76] as const,
    mappedColor: 1,
    contrast: 1.10,
    roughness: 0.97,
    materialLabel: "usgs-new-horizons-global-map+volatile-regolith",
  }),
});

const SUN_DIRECTION_WORLD_V592 = new THREE.Vector3(-2.45, 1.18, 4.6).normalize();

function candidateRootV592(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
}

function clearMajorMoonTelemetryV592(root: HTMLElement): void {
  for (const key of Object.keys(root.dataset)) {
    if (key.startsWith("atlasV592MajorMoon") && !key.startsWith("atlasV592MajorMoonKtx2")) delete root.dataset[key];
  }
}

function textureDimensionsV592(texture: THREE.Texture | null): string {
  if (!texture) return "unknown";
  const candidates: unknown[] = [texture.image, texture.source?.data, texture.mipmaps?.[0]];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const { width, height } = candidate as { width?: unknown; height?: unknown };
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) return `${Math.trunc(width)}x${Math.trunc(height)}`;
  }
  return "unknown";
}

function easeCameraV592(progress: number): number {
  const bounded = THREE.MathUtils.clamp(progress, 0, 1);
  return bounded * bounded * (3 - 2 * bounded);
}

function BlockedMajorMoonV592({ moonId }: Readonly<{ moonId: MajorMoonIdV592 }>) {
  useEffect(() => {
    const root = candidateRootV592();
    if (!root) return;
    clearMajorMoonTelemetryV592(root);
    root.dataset.atlasV592MajorMoonBody = moonId;
    root.dataset.atlasV592MajorMoonRuntimeAdmission = "asset-blocked";
    root.dataset.atlasV592MajorMoonSubjectVisible = "false";
    root.dataset.atlasV592MajorMoonProceduralFallback = "false";
    root.dataset.atlasV592MajorMoonColoredPlaceholder = "false";
    root.dataset.atlasV592MajorMoonScientificPayloadMutation = "false";
    return () => {
      if (
        root.dataset.atlasV592MajorMoonBody === moonId
        && root.dataset.atlasV592MajorMoonRuntimeAdmission === "asset-blocked"
      ) clearMajorMoonTelemetryV592(root);
    };
  }, [moonId]);
  return <group userData={{ atlasCandidate: "v592", atlasMajorMoonV592: moonId, atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
}

function RuntimeMajorMoonV592({
  moonId,
  profile,
  clock,
}: Readonly<{
  moonId: MajorMoonRuntimeHeroIdV592;
  profile: CelestialRenderProfileV590;
  clock: CelestialClockControllerV592;
}>) {
  const visual = useMajorMoonVisualTextureV592(moonId, profile.deliveryTier, profile.deviceTier, true);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const viewport = useThree((state) => state.size);
  const group = useRef<THREE.Group>(null);
  const profileSpec = MOON_MATERIAL_PROFILES_V592[moonId];
  const sourceAsset = MAJOR_MOON_VISUAL_ASSETS_V592.find((asset) => asset.target === moonId);
  const startMs = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startQuaternion = useRef(new THREE.Quaternion());
  const restoreFov = useRef(45);
  const cameraSpec = resolveMajorMoonInspectionCameraV592(profile.deviceTier);
  const desiredPosition = useMemo(
    () => new THREE.Vector3(...cameraSpec.position),
    [cameraSpec.position],
  );
  const desiredTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const probe = useMemo(() => new THREE.PerspectiveCamera(), []);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const rotationQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const targetFov = cameraSpec.fovDeg;
  const runtimeAdmitted = visual.status === "ready"
    && Boolean(visual.texture)
    && (profile.deliveryTier !== "standalone-full" || visual.fullQualityGate === "passed");

  const surfaceMaterial = useMemo(() => visual.texture ? new THREE.ShaderMaterial({
    vertexShader: MAJOR_MOON_SURFACE_VERTEX_V592,
    fragmentShader: MAJOR_MOON_SURFACE_FRAGMENT_V592,
    uniforms: {
      uAlbedo: { value: visual.texture },
      uSunDirectionWorld: { value: SUN_DIRECTION_WORLD_V592.clone() },
      uCinematicTint: { value: new THREE.Vector3(...profileSpec.cinematicTint) },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
      uMappedColor: { value: profileSpec.mappedColor },
      uContrast: { value: profile.mode === "science" ? 1 : profileSpec.contrast },
      uRoughness: { value: profileSpec.roughness },
    },
    toneMapped: true,
    depthTest: true,
    depthWrite: true,
    userData: {
      atlasCandidate: "v592",
      atlasMajorMoonMaterial: profileSpec.materialLabel,
      atlasObservationColorPolicy: sourceAsset?.observationColorPolicy ?? "unknown",
      atlasPresentationOnly: true,
      atlasScientificPayloadMutation: false,
    },
  }) : null, [profile.mode, profileSpec, sourceAsset?.observationColorPolicy, visual.texture]);

  const atmosphereMaterial = useMemo(() => moonId === "titan" && profile.mode === "cinematic" ? new THREE.ShaderMaterial({
    vertexShader: TITAN_ATMOSPHERE_VERTEX_V592,
    fragmentShader: TITAN_ATMOSPHERE_FRAGMENT_V592,
    uniforms: { uSunDirectionWorld: { value: SUN_DIRECTION_WORLD_V592.clone() } },
    transparent: true,
    premultipliedAlpha: false,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: true,
    side: THREE.FrontSide,
    userData: {
      atlasCandidate: "v592",
      atlasPresentationModel: "titan-observation-informed-deterministic-haze",
      atlasScientificAuthority: false,
      atlasScientificPayloadMutation: false,
    },
  }) : null, [moonId, profile.mode]);

  useEffect(() => {
    startMs.current = performance.now();
    startPosition.current.copy(camera.position);
    startQuaternion.current.copy(camera.quaternion);
    restoreFov.current = camera.fov;
    return () => {
      camera.fov = restoreFov.current;
      camera.updateProjectionMatrix();
    };
  }, [camera, moonId]);

  useEffect(() => () => {
    surfaceMaterial?.dispose();
    atmosphereMaterial?.dispose();
  }, [atmosphereMaterial, surfaceMaterial]);

  useEffect(() => {
    const root = candidateRootV592();
    if (!root) return;
    clearMajorMoonTelemetryV592(root);
    root.dataset.atlasV592MajorMoonBody = moonId;
    root.dataset.atlasV592MajorMoonMode = profile.mode;
    root.dataset.atlasV592MajorMoonRuntimeAdmission = runtimeAdmitted ? "admitted" : visual.status === "blocked" ? "asset-blocked" : "loading";
    root.dataset.atlasV592MajorMoonTextureSource = visual.source;
    root.dataset.atlasV592MajorMoonTextureSha = visual.sha256;
    root.dataset.atlasV592MajorMoonTextureReason = visual.reason;
    root.dataset.atlasV592MajorMoonPrewarmStatus = visual.prewarmStatus;
    root.dataset.atlasV592MajorMoonTextureDimensions = textureDimensionsV592(visual.texture);
    root.dataset.atlasV592MajorMoonFullQualityGate = visual.fullQualityGate;
    root.dataset.atlasV592MajorMoonMaterial = profileSpec.materialLabel;
    root.dataset.atlasV592MajorMoonObservationColorPolicy = sourceAsset?.observationColorPolicy ?? "unknown";
    root.dataset.atlasV592MajorMoonManifestSha = MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592;
    root.dataset.atlasV592MajorMoonProceduralFallback = "false";
    root.dataset.atlasV592MajorMoonColoredPlaceholder = "false";
    root.dataset.atlasV592MajorMoonPrimeMeridianTextureAlignment = "global-map-central-longitude-to-local-positive-x";
    root.dataset.atlasV592MajorMoonTitanAtmosphere = moonId === "titan" && profile.mode === "cinematic"
      ? "observation-informed-deterministic-presentation-model"
      : "not-rendered";
    root.dataset.atlasV592MajorMoonEnceladusPlume = moonId === "enceladus" ? "blocked-not-rendered" : "not-applicable";
    root.dataset.atlasV592MajorMoonScientificPayloadMutation = "false";
    const telemetryTextureSha = visual.sha256;
    const telemetryMode = profile.mode;
    return () => {
      if (
        root.dataset.atlasV592MajorMoonBody === moonId
        && root.dataset.atlasV592MajorMoonMode === telemetryMode
        && root.dataset.atlasV592MajorMoonTextureSha === telemetryTextureSha
      ) clearMajorMoonTelemetryV592(root);
    };
  }, [moonId, profile.mode, profileSpec.materialLabel, runtimeAdmitted, sourceAsset?.observationColorPolicy, visual.fullQualityGate, visual.prewarmStatus, visual.reason, visual.sha256, visual.source, visual.status, visual.texture]);

  useFrame(({ gl, scene }) => {
    const root = candidateRootV592();
    const now = performance.now();
    const blend = easeCameraV592((now - startMs.current) / 900);
    probe.position.copy(desiredPosition);
    probe.up.set(0, 1, 0);
    probe.lookAt(desiredTarget);
    camera.position.lerpVectors(startPosition.current, desiredPosition, blend);
    camera.quaternion.slerpQuaternions(startQuaternion.current, probe.quaternion, blend);
    camera.fov = THREE.MathUtils.lerp(restoreFov.current, targetFov, blend);
    camera.updateProjectionMatrix();

    const orientation = resolveMajorMoonRotationV592(moonId, clock.getJulianDate(now));
    if (group.current) {
      rotationQuaternion.fromArray(orientation.quaternionScene);
      group.current.quaternion.copy(rotationQuaternion);
      group.current.userData.atlasV592PrimeMeridianDeg = orientation.primeMeridianDeg;
      group.current.userData.atlasV592PhysicalJulianDate = orientation.julianDate;
      group.current.userData.atlasV592ScientificPayloadWriteback = false;
    }
    // A positive R3F priority intentionally takes over the render call. The
    // frozen v591 camera rig still runs at priority 0, then this inspection
    // camera applies the final view and renders exactly once. Unmounting this
    // component removes the takeover and restores the inherited auto render.
    gl.render(scene, camera);
    if (!root) return;
    // Re-assert the read-only runtime admission fields from the render loop.
    // React effect cleanup can race a mode transition while the R3F object is
    // still visible; frame-local telemetry must describe the object that is
    // actually being rendered, without mutating the scientific projection.
    root.dataset.atlasV592MajorMoonBody = moonId;
    root.dataset.atlasV592MajorMoonMode = profile.mode;
    root.dataset.atlasV592MajorMoonRuntimeAdmission = runtimeAdmitted ? "admitted" : visual.status === "blocked" ? "asset-blocked" : "loading";
    root.dataset.atlasV592MajorMoonTextureSource = visual.source;
    root.dataset.atlasV592MajorMoonTextureSha = visual.sha256;
    root.dataset.atlasV592MajorMoonTextureDimensions = textureDimensionsV592(visual.texture);
    root.dataset.atlasV592MajorMoonFullQualityGate = visual.fullQualityGate;
    root.dataset.atlasV592MajorMoonTextureReason = visual.reason;
    root.dataset.atlasV592MajorMoonPrewarmStatus = visual.prewarmStatus;
    root.dataset.atlasV592MajorMoonManifestSha = MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592;
    root.dataset.atlasV592MajorMoonProceduralFallback = "false";
    root.dataset.atlasV592MajorMoonColoredPlaceholder = "false";
    root.dataset.atlasV592MajorMoonScientificPayloadMutation = "false";
    root.dataset.atlasV592MajorMoonCameraSettled = blend >= 1 ? "true" : "false";
    root.dataset.atlasV592MajorMoonCameraFovDeg = camera.fov.toFixed(3);
    root.dataset.atlasV592MajorMoonPrimeMeridianDeg = orientation.primeMeridianDeg.toFixed(6);
    root.dataset.atlasV592MajorMoonRotationDirection = orientation.direction;
    root.dataset.atlasV592MajorMoonRotationApplied = group.current ? "true" : "false";
    if (!group.current || !runtimeAdmitted) {
      root.dataset.atlasV592MajorMoonSubjectVisible = "false";
      root.dataset.atlasV592MajorMoonScreenDiameterPx = "0";
      root.dataset.atlasV592MajorMoonFrameFits = "false";
      return;
    }
    group.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const pixelDiameter = estimateMajorMoonScreenDiameterPxV592(1, distance, camera.fov, viewport.height);
    const visible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.94
      && Math.abs(projectedCenter.y) <= 0.94
      && pixelDiameter >= 96;
    root.dataset.atlasV592MajorMoonSubjectVisible = visible ? "true" : "false";
    root.dataset.atlasV592MajorMoonScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV592MajorMoonFrameFits = visible && pixelDiameter <= Math.min(
      viewport.width * cameraSpec.maximumViewportWidthFraction,
      viewport.height * cameraSpec.maximumViewportHeightFraction,
    ) ? "true" : "false";
    root.dataset.atlasV592MajorMoonNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  }, 1);

  if (!runtimeAdmitted || !surfaceMaterial) {
    return <group userData={{ atlasCandidate: "v592", atlasMajorMoonV592: moonId, atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }

  const segments = profile.deviceTier === "mobile" ? 112 : 176;
  return (
    <group
      ref={group}
      userData={{
        atlasCandidate: "v592",
        atlasMajorMoonV592: moonId,
        atlasAdmission: "admitted",
        atlasVisualAssetSha256: visual.sha256,
        atlasVisualAssetManifestSha256: MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
        atlasObservationColorPolicy: sourceAsset?.observationColorPolicy ?? "unknown",
        atlasPresentationScale: "unit-inspection-sphere",
        atlasProceduralFallback: false,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={surfaceMaterial} renderOrder={8}>
        <sphereGeometry args={[1, segments, Math.floor(segments / 2)]} />
      </mesh>
      {atmosphereMaterial ? (
        <mesh material={atmosphereMaterial} scale={1.035} renderOrder={9}>
          <sphereGeometry args={[1, Math.floor(segments * 0.72), Math.floor(segments * 0.36)]} />
        </mesh>
      ) : null}
    </group>
  );
}

export default function MajorMoonHeroV592({
  moonId,
  profile,
  clock,
}: Readonly<{
  moonId: MajorMoonIdV592;
  profile: CelestialRenderProfileV590;
  clock: CelestialClockControllerV592;
}>) {
  const model = MAJOR_MOON_BY_ID_V592[moonId];
  if (!model) return null;
  return isMajorMoonRuntimeHeroIdV592(moonId)
    ? <RuntimeMajorMoonV592 moonId={moonId} profile={profile} clock={clock} />
    : <BlockedMajorMoonV592 moonId={moonId} />;
}

export const MAJOR_MOON_RUNTIME_HERO_COUNT_V592 = MAJOR_MOON_RUNTIME_HERO_IDS_V592.length;
