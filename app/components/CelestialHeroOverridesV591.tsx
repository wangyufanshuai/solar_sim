"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_CERES_MODEL_LOD_RECEIPT_SHA256_V591,
  CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_EROS_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_EROS_MODEL_LOD_RECEIPT_SHA256_V591,
  CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_ICE_GIANT_PRIMARY_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_KLEOPATRA_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_KLEOPATRA_MODEL_LOD_RECEIPT_SHA256_V591,
  CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591,
  CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_VESTA_MODEL_LOD_RECEIPT_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { heroFrameFitsV591 } from "../lib/celestialConvergenceV591";
import type {
  CelestialFocusTargetV590,
  CelestialRenderProfileV590,
  HeroAssetAdmissionV590,
  HeroBodyIdV590,
} from "../lib/celestialRenderingV590";
import {
  CELESTIAL_ORBIT_BY_ID_V590,
  HERO_BODY_SPEC_BY_ID_V590,
  celestialOrbitPointV590,
} from "../lib/celestialRenderingV590";
import {
  CELESTIAL_PRESENTATION_EPOCH_V591,
  CELESTIAL_SURFACE_VERTEX_V591,
  EARTH_ATMOSPHERE_FRAGMENT_V591,
  EARTH_CLOUD_FRAGMENT_V591,
  EARTH_SURFACE_FRAGMENT_V591,
  BENNU_REGOLITH_FRAGMENT_V591,
  CERES_SURFACE_FRAGMENT_V591,
  ICE_GIANT_ATMOSPHERE_FRAGMENT_V591,
  ICE_GIANT_RING_FRAGMENT_V591,
  ICE_GIANT_SURFACE_FRAGMENT_V591,
  JUPITER_SURFACE_FRAGMENT_V591,
  MARS_ATMOSPHERE_FRAGMENT_V591,
  MARS_SURFACE_FRAGMENT_V591,
  MARS_SURFACE_VERTEX_V591,
  MERCURY_SURFACE_FRAGMENT_V591,
  MERCURY_SURFACE_VERTEX_V591,
  MOON_SURFACE_FRAGMENT_V591,
  MOON_SURFACE_VERTEX_V591,
  NASA_SMALL_BODY_REGOLITH_FRAGMENT_V591,
  SATURN_ATMOSPHERE_FRAGMENT_V591,
  SATURN_RING_FRAGMENT_V591,
  SATURN_RING_VERTEX_V591,
  SATURN_SURFACE_FRAGMENT_V591,
  SOLAR_CHROMOSPHERE_FRAGMENT_V591,
  SOLAR_PHOTOSPHERE_FRAGMENT_V591,
  TEMPEL1_SURFACE_FRAGMENT_V591,
  VENUS_ATMOSPHERE_FRAGMENT_V591,
  VENUS_SURFACE_FRAGMENT_V591,
  VENUS_SURFACE_VERTEX_V591,
  VESTA_REGOLITH_FRAGMENT_V591,
} from "../lib/celestialMaterialsV591";
import { deterministicBodyPhaseV590 } from "../lib/celestialMaterialsV590";
import { createRadialRingGeometryV590 } from "../lib/celestialMaterialsV590";
import { useV591InheritedBennuModel } from "../lib/useV591BennuModel";
import {
  useV591NasaSmallBodyModel,
  type NasaSmallBodyIdV591,
} from "../lib/useV591NasaSmallBodyModel";
import { useV591VestaModel } from "../lib/useV591VestaModel";
import { useV591CeresModel } from "../lib/useV591CeresModel";
import { useV591Tempel1Model } from "../lib/useV591Tempel1Model";
import {
  useV591BennuTexture,
  useV591CeresTexture,
  useV591InheritedEarthTexture,
  useV591JupiterTexture,
  useV591MarsTexture,
  useV591MercuryTexture,
  useV591MoonTexture,
  useV591SaturnTexture,
  useV591Texture,
  useV591Tempel1Texture,
  useV591VenusTexture,
  type V591TextureLoadState,
} from "../lib/useV591Texture";

export type HeroOverrideAdmissionV591 = "admitted" | "asset-blocked" | "not-authored";

export const HERO_OVERRIDE_ADMISSIONS_V591: Readonly<Record<HeroBodyIdV590, HeroOverrideAdmissionV591>> = Object.freeze({
  sun: "admitted",
  mercury: "admitted",
  venus: "admitted",
  earth: "admitted",
  moon: "admitted",
  mars: "admitted",
  jupiter: "admitted",
  saturn: "admitted",
  uranus: "admitted",
  neptune: "admitted",
  ceres: "admitted",
  vesta: "admitted",
  bennu: "admitted",
  eros: "admitted",
  kleopatra: "admitted",
  "tempel-1": "admitted",
});

export const V591_ADMITTED_OVERRIDE_COUNT = 16 as const;

export function suppressBaselineOverrideAdmissionsV591(
  admissions: Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>,
): Record<HeroBodyIdV590, HeroAssetAdmissionV590> {
  const isolated = { ...admissions };
  for (const [body, status] of Object.entries(HERO_OVERRIDE_ADMISSIONS_V591)) {
    if (status === "admitted") isolated[body as HeroBodyIdV590] = "asset-blocked";
  }
  return isolated;
}

function textureDimensionsV591(texture: THREE.Texture | null): string {
  if (!texture) return "unknown";
  const candidates: unknown[] = [texture.image, texture.source?.data, texture.mipmaps?.[0]];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const { width, height } = candidate as { width?: unknown; height?: unknown };
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) return `${Math.trunc(width)}x${Math.trunc(height)}`;
  }
  return "unknown";
}

function textureTexelSizeV591(texture: THREE.Texture): THREE.Vector2 {
  const dimensions = textureDimensionsV591(texture).split("x").map(Number);
  const width = dimensions[0] > 0 ? dimensions[0] : 1024;
  const height = dimensions[1] > 0 ? dimensions[1] : 512;
  return new THREE.Vector2(1 / width, 1 / height);
}

function textureReceiptV591(states: readonly V591TextureLoadState[]): string {
  return states.map((state) => [
    state.assetId,
    state.status,
    state.source,
    `dimensions=${textureDimensionsV591(state.texture)}`,
    `quality=${state.fullQualityGate}`,
    `sha256=${state.sha256}`,
  ].join(":")).join("|");
}

function clearFocusedHeroTelemetryV591(root: HTMLElement): void {
  for (const key of Object.keys(root.dataset)) {
    if (key.startsWith("atlasV591Hero")) delete root.dataset[key];
  }
}

function disposeAfterDetachV591(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resource.dispose()));
}

function createCoronaTextureV591(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("v591-corona-canvas-context");
  const pixels = context.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size * 2 - 1;
      const ny = (y + 0.5) / size * 2 - 1;
      const radius = Math.hypot(nx, ny);
      const angle = Math.atan2(ny, nx);
      const outside = Math.max(0, radius - 0.53);
      const envelope = radius >= 0.50 && radius <= 1 ? Math.exp(-outside * 7.8) : 0;
      const plume = 0.78 + Math.sin(angle * 7 + 1.31) * 0.10 + Math.sin(angle * 13 - 0.72) * 0.06;
      const alpha = Math.max(0, Math.min(1, envelope * plume * 0.34));
      const offset = (y * size + x) * 4;
      pixels.data[offset] = 255;
      pixels.data[offset + 1] = Math.round(112 + plume * 42);
      pixels.data[offset + 2] = 24;
      pixels.data[offset + 3] = Math.round(alpha * 255);
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.atlasCandidate = "v591";
  texture.userData.atlasPresentationModel = "deterministic-corona-sprite";
  texture.userData.atlasProceduralFallback = false;
  return texture;
}

function SunOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "sun";
  const focused = focusTarget === "sun";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const photosphere = useV591Texture("sun-photosphere", deliveryTier, profile.deviceTier, visible);
  const chromosphere = useV591Texture("sun-chromosphere", deliveryTier, profile.deviceTier, visible);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const photosphereMaterial = useMemo(() => photosphere.texture && chromosphere.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: SOLAR_PHOTOSPHERE_FRAGMENT_V591,
    uniforms: {
      uPhotosphere: { value: photosphere.texture },
      uChromosphere: { value: chromosphere.texture },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
      uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V591 },
      uTexelSize: { value: textureTexelSizeV591(photosphere.texture) },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [chromosphere.texture, photosphere.texture, profile.mode]);
  const chromosphereMaterial = useMemo(() => chromosphere.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: SOLAR_CHROMOSPHERE_FRAGMENT_V591,
    uniforms: {
      uChromosphere: { value: chromosphere.texture },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
    },
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    premultipliedAlpha: false,
    blending: profile.mode === "science" ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  }) : null, [chromosphere.texture, profile.mode]);
  const coronaTexture = useMemo(() => visible && profile.mode === "cinematic" ? createCoronaTextureV591() : null, [profile.mode, visible]);
  const coronaMaterial = useMemo(() => coronaTexture ? new THREE.SpriteMaterial({
    map: coronaTexture,
    color: new THREE.Color("#ff9a32"),
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    opacity: 0.72,
  }) : null, [coronaTexture]);
  useEffect(() => {
    if (!coronaTexture) return;
    const release = acquireAtlasResource("texture", "atlas", "v591-sun-corona-presentation", {
      owner: "v591-celestial-convergence",
      estimatedBytes: 512 * 512 * 4,
      manifestSha256: CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591,
    });
    return () => {
      release();
      disposeAfterDetachV591(coronaTexture);
    };
  }, [coronaTexture]);
  useEffect(() => () => {
    if (photosphereMaterial) disposeAfterDetachV591(photosphereMaterial);
    if (chromosphereMaterial) disposeAfterDetachV591(chromosphereMaterial);
    if (coronaMaterial) disposeAfterDetachV591(coronaMaterial);
  }, [chromosphereMaterial, coronaMaterial, photosphereMaterial]);
  const states = [photosphere, chromosphere] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && photosphereMaterial && chromosphereMaterial);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.sun.radius * 1.28;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "sun";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "solar-photosphere-chromosphere-corona";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(photosphere.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroMirroredHemisphereDisclosure = "true";
    root.dataset.atlasV591HeroCoronaModel = "deterministic-presentation-sprite";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [focused, ktx2First, photosphere.texture, receipt, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !photosphereMaterial || !chromosphereMaterial) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "sun", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.sun;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.sun;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 192 : profile.deviceTier === "mobile" ? 80 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, CELESTIAL_PRESENTATION_EPOCH_V591 * 0.001, spec.axialTiltRad]}
      scale={focused ? 1.28 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "sun",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "sun-photosphere+sun-chromosphere",
        atlasProceduralFallback: false,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={photosphereMaterial}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
      <mesh material={chromosphereMaterial} scale={profile.mode === "cinematic" ? 1.012 : 1.004} renderOrder={7}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
      {profile.mode === "cinematic" && coronaMaterial ? (
        <sprite material={coronaMaterial} scale={[3.7, 3.7, 1]} renderOrder={5} userData={{ atlasCandidate: "v591", atlasPresentationModel: "corona-sprite", atlasProceduralFallback: false }} />
      ) : null}
    </group>
  );
}

function EarthOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "earth";
  const focused = focusTarget === "earth";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const albedo = useV591InheritedEarthTexture("earth-albedo", deliveryTier, profile.deviceTier, visible);
  const normal = useV591InheritedEarthTexture("earth-normal", deliveryTier, profile.deviceTier, visible);
  const roughness = useV591InheritedEarthTexture("earth-roughness", deliveryTier, profile.deviceTier, visible);
  const clouds = useV591InheritedEarthTexture("earth-clouds", deliveryTier, profile.deviceTier, visible);
  const cloudAlpha = useV591InheritedEarthTexture("earth-cloud-alpha", deliveryTier, profile.deviceTier, visible);
  const night = useV591InheritedEarthTexture("earth-night", deliveryTier, profile.deviceTier, visible);
  const nightMask = useV591InheritedEarthTexture("earth-night-mask", deliveryTier, profile.deviceTier, visible);
  const rotatingGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const sunLocal = useMemo(() => new THREE.Vector3(), []);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const surfaceMaterial = useMemo(() => (
    albedo.texture
    && normal.texture
    && roughness.texture
    && cloudAlpha.texture
    && night.texture
    && nightMask.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: EARTH_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uCloudAlpha: { value: cloudAlpha.texture },
        uNight: { value: night.texture },
        uNightMask: { value: nightMask.texture },
        uSunWorld: { value: sunWorld.clone() },
        uSunLocal: { value: new THREE.Vector3() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V591 },
      },
      toneMapped: profile.mode === "cinematic",
    }) : null,
  [albedo.texture, cloudAlpha.texture, night.texture, nightMask.texture, normal.texture, profile.mode, roughness.texture, sunWorld]);
  const lowerCloudMaterial = useMemo(() => clouds.texture && cloudAlpha.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: EARTH_CLOUD_FRAGMENT_V591,
    uniforms: {
      uClouds: { value: clouds.texture },
      uCloudAlpha: { value: cloudAlpha.texture },
      uSunWorld: { value: sunWorld.clone() },
      uUvOffset: { value: new THREE.Vector2(0, 0) },
      uLayerOpacity: { value: profile.mode === "science" ? 0.54 : 0.66 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }) : null, [cloudAlpha.texture, clouds.texture, profile.mode, sunWorld]);
  const upperCloudMaterial = useMemo(() => clouds.texture && cloudAlpha.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: EARTH_CLOUD_FRAGMENT_V591,
    uniforms: {
      uClouds: { value: clouds.texture },
      uCloudAlpha: { value: cloudAlpha.texture },
      uSunWorld: { value: sunWorld.clone() },
      uUvOffset: { value: new THREE.Vector2(0.0083, 0.0017) },
      uLayerOpacity: { value: profile.mode === "science" ? 0.16 : 0.24 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }) : null, [cloudAlpha.texture, clouds.texture, profile.mode, sunWorld]);
  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: EARTH_ATMOSPHERE_FRAGMENT_V591,
    uniforms: {
      uSunWorld: { value: sunWorld.clone() },
      uRayleighColor: { value: new THREE.Color(profile.mode === "science" ? "#327fb5" : "#3c91c8") },
      uMieColor: { value: new THREE.Color("#e0c4a6") },
      uDensity: { value: profile.mode === "science" ? 0.22 : 0.32 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: profile.mode === "science" ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  }), [profile.mode, sunWorld]);
  useFrame(() => {
    if (!rotatingGroup.current || !surfaceMaterial) return;
    rotatingGroup.current.updateWorldMatrix(true, false);
    sunLocal.copy(sunWorld);
    rotatingGroup.current.worldToLocal(sunLocal);
    surfaceMaterial.uniforms.uSunLocal.value.copy(sunLocal);
  });
  useEffect(() => () => {
    if (surfaceMaterial) disposeAfterDetachV591(surfaceMaterial);
    if (lowerCloudMaterial) disposeAfterDetachV591(lowerCloudMaterial);
    if (upperCloudMaterial) disposeAfterDetachV591(upperCloudMaterial);
    disposeAfterDetachV591(atmosphereMaterial);
  }, [atmosphereMaterial, lowerCloudMaterial, surfaceMaterial, upperCloudMaterial]);
  const states = [albedo, normal, roughness, clouds, cloudAlpha, night, nightMask] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && surfaceMaterial && lowerCloudMaterial && upperCloudMaterial);
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  const ktx2First = states.every((state) => state.source === "ktx2");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !rotatingGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
      }
      return;
    }
    rotatingGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.earth.radius * 1.28 * 1.043;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "earth";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "blue-marble-gebco-ocean-fresnel-dual-cloud-night-rayleigh-mie";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(albedo.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroInheritedAssetBytes = "v590-readonly-exact-sha";
    root.dataset.atlasV591HeroCloudLayers = "2";
    root.dataset.atlasV591HeroAtmosphereModel = "bounded-rayleigh-mie";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [albedo.texture, focused, ktx2First, receipt, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !surfaceMaterial || !lowerCloudMaterial || !upperCloudMaterial) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "earth", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.earth;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.earth;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 192 : profile.deviceTier === "mobile" ? 96 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      position={position as [number, number, number]}
      rotation={[0, 0, spec.axialTiltRad]}
      scale={focused ? 1.28 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroPlacementV591: "earth",
        atlasSolarTerminator: "world-origin",
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <group
        ref={rotatingGroup}
        rotation={[0, deterministicBodyPhaseV590("earth"), 0]}
        userData={{
          atlasCandidate: "v591",
          atlasHeroBodyV591: "earth",
          atlasAdmission: "admitted",
          atlasVisualAssetChannels: "albedo+normal+roughness+cloud-color+cloud-alpha+night+night-mask",
          atlasCloudLayerCount: 2,
          atlasAtmosphereModel: "bounded-rayleigh-mie",
          atlasProceduralFallback: false,
          atlasScientificPayloadMutation: false,
        }}
      >
        <mesh material={surfaceMaterial} castShadow receiveShadow>
          <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
        </mesh>
        <mesh material={lowerCloudMaterial} scale={1.008} castShadow renderOrder={3}>
          <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
        </mesh>
        <mesh material={upperCloudMaterial} scale={1.016} castShadow renderOrder={4}>
          <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
        </mesh>
        <mesh material={atmosphereMaterial} scale={1.043} renderOrder={6}>
          <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
        </mesh>
      </group>
    </group>
  );
}

function MoonOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "moon";
  const focused = focusTarget === "moon";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const albedo = useV591MoonTexture("moon-albedo", deliveryTier, profile.deviceTier, visible);
  const normal = useV591MoonTexture("moon-normal", deliveryTier, profile.deviceTier, visible);
  const roughness = useV591MoonTexture("moon-roughness", deliveryTier, profile.deviceTier, visible);
  const height = useV591MoonTexture("moon-height", deliveryTier, profile.deviceTier, visible);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    albedo.texture && normal.texture && roughness.texture && height.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: MOON_SURFACE_VERTEX_V591,
      fragmentShader: MOON_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uHeight: { value: height.texture },
        uSunWorld: { value: sunWorld.clone() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uRadius: { value: HERO_BODY_SPEC_BY_ID_V590.moon.radius },
        uHeightMinimumRaw: { value: 2037 },
        uHeightMaximumRaw: { value: 41371 },
        uHeightReferenceRaw: { value: 18961.595629099153 },
        uHeightMetersPerRawUnit: { value: 0.5 },
        uLunarRadiusMeters: { value: 1_737_400 },
        uVertexReliefGain: { value: 1 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [albedo.texture, height.texture, normal.texture, profile.mode, roughness.texture, sunWorld]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  const states = [albedo, normal, roughness, height] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && material);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.moon.radius * 1.28;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "moon";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "lroc-lola-oren-nayar-bounded-opposition-finite-relief";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(albedo.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroHeightRangeRaw = "2037:41371:mean=18961.595629099153";
    root.dataset.atlasV591HeroHeightScale = "0.5m-per-raw-unit;physical-radius=1737400m;vertex-gain=1";
    root.dataset.atlasV591HeroNormalModel = "lola-spherical-gradient-gain-1.35";
    root.dataset.atlasV591HeroReflectance = "rough-regolith-oren-nayar-opposition-surge";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [albedo.texture, focused, ktx2First, receipt, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !material) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "moon", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.moon;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.moon;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 256 : profile.deviceTier === "mobile" ? 128 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("moon"), spec.axialTiltRad]}
      scale={focused ? 1.28 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "moon",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "lroc-albedo+lola-normal+lola-roughness+lola-height",
        atlasSolarTerminator: "world-origin",
        atlasFiniteVertexRelief: true,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={material} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

function MercuryOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "mercury";
  const focused = focusTarget === "mercury";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const albedo = useV591MercuryTexture("mercury-albedo", deliveryTier, profile.deviceTier, visible);
  const normal = useV591MercuryTexture("mercury-normal", deliveryTier, profile.deviceTier, visible);
  const roughness = useV591MercuryTexture("mercury-roughness", deliveryTier, profile.deviceTier, visible);
  const height = useV591MercuryTexture("mercury-height", deliveryTier, profile.deviceTier, visible);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    albedo.texture && normal.texture && roughness.texture && height.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: MERCURY_SURFACE_VERTEX_V591,
      fragmentShader: MERCURY_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uHeight: { value: height.texture },
        uSunWorld: { value: sunWorld.clone() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uRadius: { value: HERO_BODY_SPEC_BY_ID_V590.mercury.radius },
        uHeightMinimumMeters: { value: -10764 },
        uHeightMaximumMeters: { value: 8994 },
        uHeightReferenceMeters: { value: -478.08443944860386 },
        uMercuryRadiusMeters: { value: 2_439_700 },
        uVertexReliefGain: { value: 1 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [albedo.texture, height.texture, normal.texture, profile.mode, roughness.texture, sunWorld]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  const states = [albedo, normal, roughness, height] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && material);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.mercury.radius * 1.52;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "mercury";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "nasa-pia15063-messenger-dem-oren-nayar-bounded-opposition-finite-relief-no-specular";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(albedo.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroAlbedoDetailCeiling = "6132x3066-nasa-pia15063";
    root.dataset.atlasV591HeroTerrainSource = "messenger-usgs-dem-23040x11520-signed-int16-meters";
    root.dataset.atlasV591HeroHeightRangeMeters = "-10764:8994:mean=-478.08443944860386";
    root.dataset.atlasV591HeroNormalModel = "messenger-spherical-gradient-gain-1.7";
    root.dataset.atlasV591HeroReflectance = "rough-regolith-oren-nayar-bounded-opposition-no-specular";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [albedo.texture, focused, ktx2First, receipt, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !material) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "mercury", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.mercury;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.mercury;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 256 : profile.deviceTier === "mobile" ? 128 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("mercury"), spec.axialTiltRad]}
      scale={focused ? 1.52 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "mercury",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "nasa-pia15063-albedo+messenger-normal+roughness+height",
        atlasSolarTerminator: "world-origin",
        atlasFiniteVertexRelief: true,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={material} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

function VenusOverrideV591({
  profile,
  focusTarget,
  enabled,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  focusTarget: CelestialFocusTargetV590;
  enabled: boolean;
}>) {
  const visible = enabled && (focusTarget === "overview" || focusTarget === "venus");
  const focused = focusTarget === "venus";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const surface = useV591VenusTexture("venus-surface", deliveryTier, profile.deviceTier, visible);
  const normal = useV591VenusTexture("venus-normal", deliveryTier, profile.deviceTier, visible);
  const roughness = useV591VenusTexture("venus-roughness", deliveryTier, profile.deviceTier, visible);
  const height = useV591VenusTexture("venus-height", deliveryTier, profile.deviceTier, visible);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const surfaceMaterial = useMemo(() => (
    surface.texture && normal.texture && roughness.texture && height.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: VENUS_SURFACE_VERTEX_V591,
      fragmentShader: VENUS_SURFACE_FRAGMENT_V591,
      uniforms: {
        uSurface: { value: surface.texture },
        uNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uHeight: { value: height.texture },
        uSunWorld: { value: sunWorld.clone() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V591 },
        uRadius: { value: HERO_BODY_SPEC_BY_ID_V590.venus.radius },
        uReliefScaleRadiusFraction: { value: 0.0014 },
        uVertexReliefGain: { value: 1 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [height.texture, normal.texture, profile.mode, roughness.texture, sunWorld, surface.texture]);
  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: VENUS_ATMOSPHERE_FRAGMENT_V591,
    uniforms: {
      uSunWorld: { value: sunWorld.clone() },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }), [profile.mode, sunWorld]);
  useEffect(() => () => {
    if (surfaceMaterial) disposeAfterDetachV591(surfaceMaterial);
    disposeAfterDetachV591(atmosphereMaterial);
  }, [atmosphereMaterial, surfaceMaterial]);
  const states = [surface, normal, roughness, height] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && surfaceMaterial);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.venus.radius * 1.36;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "venus";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "nasa-jpl-magellan-three-view-radar-thick-cloud-oren-nayar-no-specular";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(surface.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroSurfaceSource = "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular";
    root.dataset.atlasV591HeroUsgsAliasAcquisition = "blocked-timeout-no-retry-negative-evidence";
    root.dataset.atlasV591HeroCloudModel = "deterministic-physical-inspired-primary-not-observation-texture";
    root.dataset.atlasV591HeroCloudObservationTextureClaim = "false";
    root.dataset.atlasV591HeroReliefModel = "bounded-color-topography-presentation-relief-not-measured-elevation";
    root.dataset.atlasV591HeroMeasuredTopographyClaim = "false";
    root.dataset.atlasV591HeroOpticalColorClaim = "false";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [focused, ktx2First, receipt, runtimeAdmitted, surface.texture, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !surfaceMaterial) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "venus", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.venus;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.venus;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 224 : profile.deviceTier === "mobile" ? 112 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("venus"), spec.axialTiltRad]}
      scale={focused ? 1.36 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "venus",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "nasa-jpl-magellan-multiview-surface+radar-derived-normal+roughness+presentation-relief",
        atlasCloudModel: "deterministic-physical-inspired-primary",
        atlasCloudObservationTextureClaim: false,
        atlasSolarTerminator: "world-origin",
        atlasFiniteVertexRelief: true,
        atlasMeasuredTopographyClaim: false,
        atlasOpticalColorClaim: false,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={surfaceMaterial} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
      <mesh material={atmosphereMaterial} scale={1.036} renderOrder={6}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

function MarsOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "mars";
  const focused = focusTarget === "mars";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const albedo = useV591MarsTexture("mars-albedo", deliveryTier, profile.deviceTier, visible);
  const normal = useV591MarsTexture("mars-normal", deliveryTier, profile.deviceTier, visible);
  const roughness = useV591MarsTexture("mars-roughness", deliveryTier, profile.deviceTier, visible);
  const height = useV591MarsTexture("mars-height", deliveryTier, profile.deviceTier, visible);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const surfaceMaterial = useMemo(() => (
    albedo.texture && normal.texture && roughness.texture && height.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: MARS_SURFACE_VERTEX_V591,
      fragmentShader: MARS_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uHeight: { value: height.texture },
        uSunWorld: { value: sunWorld.clone() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uRadius: { value: HERO_BODY_SPEC_BY_ID_V590.mars.radius },
        uHeightMinimumMeters: { value: -8177 },
        uHeightMaximumMeters: { value: 21171 },
        uHeightReferenceMeters: { value: -721.1070361930941 },
        uMarsRadiusMeters: { value: 3_396_000 },
        uVertexReliefGain: { value: 1 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [albedo.texture, height.texture, normal.texture, profile.mode, roughness.texture, sunWorld]);
  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: MARS_ATMOSPHERE_FRAGMENT_V591,
    uniforms: {
      uSunWorld: { value: sunWorld.clone() },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    toneMapped: profile.mode === "cinematic",
  }), [profile.mode, sunWorld]);
  useEffect(() => () => {
    if (surfaceMaterial) disposeAfterDetachV591(surfaceMaterial);
    disposeAfterDetachV591(atmosphereMaterial);
  }, [atmosphereMaterial, surfaceMaterial]);
  const states = [albedo, normal, roughness, height] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && surfaceMaterial);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.mars.radius * 1.30;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "mars";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "usgs-viking-color-bounded-1024-mola-normal-height-dust-roughness-thin-atmosphere-no-specular";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(albedo.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroAlbedoDetailCeiling = "1024x512-usgs-observation";
    root.dataset.atlasV591HeroAlbedoDeliveryContainer = profile.deviceTier === "mobile" ? "2048x1024" : "8192x4096";
    root.dataset.atlasV591HeroTerrainSource = "mgs-mola-megdr-5760x2880-signed-msb-int16-meters";
    root.dataset.atlasV591HeroHeightRangeMeters = "-8177:21171:mean=-721.1070361930941";
    root.dataset.atlasV591HeroReflectance = "rough-dust-oren-nayar-bounded-backscatter-no-specular-lobe";
    root.dataset.atlasV591HeroAtmosphereModel = "thin-co2-dust-haze-presentation-layer";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [albedo.texture, focused, ktx2First, profile.deviceTier, receipt, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !surfaceMaterial) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "mars", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.mars;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.mars;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 224 : profile.deviceTier === "mobile" ? 112 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("mars"), spec.axialTiltRad]}
      scale={focused ? 1.30 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "mars",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "usgs-viking-albedo+mola-normal+mola-roughness+mola-height",
        atlasAlbedoDetailCeiling: "1024x512-observed",
        atlasSolarTerminator: "world-origin",
        atlasFiniteVertexRelief: true,
        atlasReflectanceModel: "rough-dust-oren-nayar-no-specular",
        atlasAtmosphereModel: "thin-co2-dust-haze",
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={surfaceMaterial} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
      <mesh material={atmosphereMaterial} scale={1.035} renderOrder={6}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

function JupiterOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "jupiter";
  const focused = focusTarget === "jupiter";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const albedo = useV591JupiterTexture("jupiter-albedo", deliveryTier, profile.deviceTier, visible);
  const bandMask = useV591JupiterTexture("jupiter-band-mask", deliveryTier, profile.deviceTier, visible);
  const stormMask = useV591JupiterTexture("jupiter-storm-mask", deliveryTier, profile.deviceTier, visible);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    albedo.texture && bandMask.texture && stormMask.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: JUPITER_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uBandMask: { value: bandMask.texture },
        uStormMask: { value: stormMask.texture },
        uSunWorld: { value: sunWorld.clone() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V591 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [albedo.texture, bandMask.texture, profile.mode, stormMask.texture, sunWorld]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  const states = [albedo, bandMask, stormMask] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && material);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.jupiter.radius * 1.28;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "jupiter";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "cassini-global-albedo-source-derived-bands-grs-mask-limb-darkening-no-specular";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(albedo.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroFlowModel = "fixed-epoch-source-mask-bounded-zonal-flow-cinematic-only";
    root.dataset.atlasV591HeroReflectance = "gas-giant-multiple-scattering-limb-darkening-no-specular-lobe";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [albedo.texture, focused, ktx2First, receipt, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !material) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "jupiter", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.jupiter;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.jupiter;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 192 : profile.deviceTier === "mobile" ? 96 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("jupiter"), spec.axialTiltRad]}
      scale={focused ? 1.28 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "jupiter",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "cassini-albedo+cassini-band-mask+cassini-grs-mask",
        atlasSolarTerminator: "world-origin",
        atlasFlowModel: "fixed-epoch-source-mask-bounded-cinematic-only",
        atlasReflectanceModel: "gas-giant-limb-darkening-no-specular",
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={material} castShadow receiveShadow>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

function SaturnOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "saturn";
  const focused = focusTarget === "saturn";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const atmosphereAlbedo = useV591SaturnTexture("saturn-atmosphere-albedo", deliveryTier, profile.deviceTier, visible);
  const bands = useV591SaturnTexture("saturn-band-mask", deliveryTier, profile.deviceTier, visible);
  const polarDetail = useV591SaturnTexture("saturn-polar-detail", deliveryTier, profile.deviceTier, visible);
  const ringColor = useV591SaturnTexture("saturn-ring-color", deliveryTier, profile.deviceTier, visible);
  const ringOpticalDepth = useV591SaturnTexture("saturn-ring-optical-depth", deliveryTier, profile.deviceTier, visible);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const sunLocal = useMemo(() => new THREE.Vector3(), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const spec = HERO_BODY_SPEC_BY_ID_V590.saturn;
  const innerRadius = spec.radius * (66_900 / 60_268);
  const outerRadius = spec.radius * (140_220 / 60_268);
  const cassiniStart = (117_580 - 66_900) / (140_220 - 66_900);
  const cassiniEnd = (122_170 - 66_900) / (140_220 - 66_900);
  const enckeCenter = (133_589 - 66_900) / (140_220 - 66_900);
  const enckeHalfWidth = 325 * 0.5 / (140_220 - 66_900);
  const ringGeometry = useMemo(() => createRadialRingGeometryV590(
    innerRadius,
    outerRadius,
    focused ? (profile.deviceTier === "mobile" ? 288 : 480) : 176,
    focused ? 8 : 4,
  ), [focused, innerRadius, outerRadius, profile.deviceTier]);
  const planetMaterial = useMemo(() => (
    atmosphereAlbedo.texture && bands.texture && polarDetail.texture && ringOpticalDepth.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: SATURN_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: atmosphereAlbedo.texture },
        uBands: { value: bands.texture },
        uPolarDetail: { value: polarDetail.texture },
        uRingOpticalDepth: { value: ringOpticalDepth.texture },
        uSunWorld: { value: sunWorld.clone() },
        uSunLocal: { value: new THREE.Vector3() },
        uInnerRadius: { value: innerRadius },
        uOuterRadius: { value: outerRadius },
        uCassiniStart: { value: cassiniStart },
        uCassiniEnd: { value: cassiniEnd },
        uEnckeCenter: { value: enckeCenter },
        uEnckeHalfWidth: { value: enckeHalfWidth },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [atmosphereAlbedo.texture, bands.texture, cassiniEnd, cassiniStart, enckeCenter, enckeHalfWidth, innerRadius, outerRadius, polarDetail.texture, profile.mode, ringOpticalDepth.texture, sunWorld]);
  const ringMaterial = useMemo(() => (
    ringColor.texture && ringOpticalDepth.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: SATURN_RING_VERTEX_V591,
      fragmentShader: SATURN_RING_FRAGMENT_V591,
      uniforms: {
        uRingColor: { value: ringColor.texture },
        uRingOpticalDepth: { value: ringOpticalDepth.texture },
        uSunWorld: { value: sunWorld.clone() },
        uSunLocal: { value: new THREE.Vector3() },
        uCameraWorld: { value: new THREE.Vector3() },
        uPlanetRadius: { value: spec.radius },
        uCassiniStart: { value: cassiniStart },
        uCassiniEnd: { value: cassiniEnd },
        uEnckeCenter: { value: enckeCenter },
        uEnckeHalfWidth: { value: enckeHalfWidth },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      premultipliedAlpha: true,
      blending: THREE.NormalBlending,
      toneMapped: profile.mode === "cinematic",
    }) : null,
  [cassiniEnd, cassiniStart, enckeCenter, enckeHalfWidth, profile.mode, ringColor.texture, ringOpticalDepth.texture, spec.radius, sunWorld]);
  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: SATURN_ATMOSPHERE_FRAGMENT_V591,
    uniforms: {
      uSunWorld: { value: sunWorld.clone() },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    toneMapped: profile.mode === "cinematic",
  }), [profile.mode, sunWorld]);
  useFrame(() => {
    if (!heroGroup.current) return;
    heroGroup.current.updateWorldMatrix(true, false);
    sunLocal.copy(sunWorld);
    heroGroup.current.worldToLocal(sunLocal);
    planetMaterial?.uniforms.uSunLocal.value.copy(sunLocal);
    ringMaterial?.uniforms.uSunLocal.value.copy(sunLocal);
    ringMaterial?.uniforms.uCameraWorld.value.copy(camera.position);
  });
  useEffect(() => () => {
    disposeAfterDetachV591(ringGeometry);
    planetMaterial?.dispose();
    ringMaterial?.dispose();
    atmosphereMaterial.dispose();
  }, [atmosphereMaterial, planetMaterial, ringGeometry, ringMaterial]);
  const states = [atmosphereAlbedo, bands, polarDetail, ringColor, ringOpticalDepth] as const;
  const receipt = textureReceiptV591(states);
  const texturesReady = states.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || states.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(texturesReady && qualityReady && planetMaterial && ringMaterial);
  const ktx2First = states.every((state) => state.source === "ktx2");
  const textureSources = states.map((state) => `${state.assetId}:${state.source}`).join("|");
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const focusedScale = 1.12;
    const angularDiameter = 2 * Math.atan2(outerRadius * focusedScale * 1.04, Math.max(outerRadius, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const frameFits = pixelDiameter <= canvasSize.width * 0.92;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72
      && frameFits;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = frameFits ? "true" : "false";
    root.dataset.atlasV591HeroFramingPolicy = "full-ring-bounding-circle-within-92pct-viewport-width";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "saturn";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "cassini-global-latitude-profile-polar-detail-radial-ring-optical-depth-mutual-shadows";
    root.dataset.atlasV591HeroLod = textureDimensionsV591(atmosphereAlbedo.texture);
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroRingGeometry = `radial-uv;inner=${innerRadius.toFixed(6)};outer=${outerRadius.toFixed(6)};cassini=${cassiniStart.toFixed(6)}-${cassiniEnd.toFixed(6)};encke=${enckeCenter.toFixed(6)}±${enckeHalfWidth.toFixed(6)}`;
    root.dataset.atlasV591HeroRingOrdering = "planet-opaque-before-ring-premultiplied-alpha-depth-test-ring-shadow-analytic";
    root.dataset.atlasV591HeroAtmosphereModel = "cassini-pia06193-latitude-profile-plus-pia21617-north-polar-detail";
    root.dataset.atlasV591HeroReflectance = "gas-giant-multiple-scattering-limb-darkening-no-specular-lobe";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [atmosphereAlbedo.texture, cassiniEnd, cassiniStart, enckeCenter, enckeHalfWidth, focused, innerRadius, ktx2First, outerRadius, receipt, ringMaterial, runtimeAdmitted, textureSources]);
  if (!visible || !texturesReady || !qualityReady || !planetMaterial || !ringMaterial) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "saturn", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.saturn;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 224 : profile.deviceTier === "mobile" ? 112 : 128;
  const heightSegments = Math.floor(widthSegments / 2);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("saturn"), spec.axialTiltRad]}
      scale={focused ? 1.12 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "saturn",
        atlasAdmission: "admitted",
        atlasVisualAssetChannels: "cassini-pia06193-atmosphere+pia21617-polar+pia21628-ring-color-optical-depth",
        atlasSolarTerminator: "world-origin",
        atlasRingGeometry: "radial-uv-cassini-division-encke-gap",
        atlasRingMutualShadows: true,
        atlasReflectanceModel: "gas-giant-limb-darkening-no-specular",
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={planetMaterial} castShadow receiveShadow renderOrder={2}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
      <mesh geometry={ringGeometry} material={ringMaterial} renderOrder={3} frustumCulled={false} />
      <mesh material={atmosphereMaterial} scale={[1.045, 0.972, 1.045]} renderOrder={6}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

type IceGiantBodyV591 = "uranus" | "neptune";

function IceGiantVisualV591({
  bodyId,
  profile,
  focused,
}: Readonly<{
  bodyId: IceGiantBodyV591;
  profile: CelestialRenderProfileV590;
  focused: boolean;
}>) {
  const isNeptune = bodyId === "neptune";
  const spec = HERO_BODY_SPEC_BY_ID_V590[bodyId];
  const orbit = CELESTIAL_ORBIT_BY_ID_V590[bodyId];
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const widthSegments = focused && profile.deviceTier === "desktop" ? 192 : profile.deviceTier === "mobile" ? 96 : 112;
  const heightSegments = Math.floor(widthSegments / 2);
  const focusedScale = 1.06;
  const innerRadius = spec.radius * (isNeptune ? 1.28 : 1.45);
  const outerRadius = spec.radius * (isNeptune ? 1.62 : 2.05);
  const sunWorld = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const ringGeometry = useMemo(() => createRadialRingGeometryV590(
    innerRadius,
    outerRadius,
    focused ? (profile.deviceTier === "mobile" ? 192 : 320) : 112,
    focused ? 5 : 3,
  ), [focused, innerRadius, outerRadius, profile.deviceTier]);
  const surfaceMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: ICE_GIANT_SURFACE_FRAGMENT_V591,
    uniforms: {
      uEquatorialColor: { value: new THREE.Color(isNeptune ? "#274777" : "#6ca9a8") },
      uPolarColor: { value: new THREE.Color(isNeptune ? "#5b78a0" : "#a9d3cc") },
      uCloudColor: { value: new THREE.Color(isNeptune ? "#6d8fbd" : "#c3e3de") },
      uStormColor: { value: new THREE.Color(isNeptune ? "#b7c9de" : "#e0f0eb") },
      uSunWorld: { value: sunWorld.clone() },
      uBandFrequency: { value: isNeptune ? 42 : 29 },
      uStormLatitude: { value: isNeptune ? -0.34 : 0.48 },
      uStormStrength: { value: isNeptune ? 0.82 : 0.20 },
      uPolarHaze: { value: isNeptune ? 0.52 : 0.82 },
      uBodyKind: { value: isNeptune ? 1 : 0 },
      uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V591 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
    depthWrite: true,
    depthTest: true,
  }), [isNeptune, profile.mode, sunWorld]);
  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
    fragmentShader: ICE_GIANT_ATMOSPHERE_FRAGMENT_V591,
    uniforms: {
      uRayleighColor: { value: new THREE.Color(isNeptune ? "#315eaa" : "#76c5c0") },
      uMieColor: { value: new THREE.Color(isNeptune ? "#92acd0" : "#c8e8e3") },
      uSunWorld: { value: sunWorld.clone() },
      uBodyKind: { value: isNeptune ? 1 : 0 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    toneMapped: profile.mode === "cinematic",
  }), [isNeptune, profile.mode, sunWorld]);
  const ringMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SATURN_RING_VERTEX_V591,
    fragmentShader: ICE_GIANT_RING_FRAGMENT_V591,
    uniforms: {
      uRingColor: { value: new THREE.Color(isNeptune ? "#68809a" : "#9dbdb4") },
      uSunWorld: { value: sunWorld.clone() },
      uBodyKind: { value: isNeptune ? 1 : 0 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    premultipliedAlpha: true,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }), [isNeptune, profile.mode, sunWorld]);
  useEffect(() => () => {
    disposeAfterDetachV591(ringGeometry);
    disposeAfterDetachV591(surfaceMaterial);
    disposeAfterDetachV591(atmosphereMaterial);
    disposeAfterDetachV591(ringMaterial);
  }, [atmosphereMaterial, ringGeometry, ringMaterial, surfaceMaterial]);
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current) return;
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const angularDiameter = 2 * Math.atan2(outerRadius * focusedScale, Math.max(outerRadius, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const frameFits = pixelDiameter <= canvasSize.width * 0.92;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72
      && frameFits;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroFrameFits = frameFits ? "true" : "false";
    root.dataset.atlasV591HeroFramingPolicy = "full-faint-ring-bounding-circle-within-92pct-viewport-width";
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    const lod = `analytical-primary-${widthSegments}x${heightSegments}`;
    const receipt = `ice-giant-flow-primary:ready:procedural-primary:dimensions=${lod}:quality=passed:sha256=${CELESTIAL_CONVERGENCE_ICE_GIANT_PRIMARY_OVERLAY_SHA256_V591}`;
    root.dataset.atlasV591HeroBody = bodyId;
    root.dataset.atlasV591HeroAdmission = "admitted";
    root.dataset.atlasV591HeroMaterial = "registered-voyager-calibrated-qualitative-ice-giant-primary-v591";
    root.dataset.atlasV591HeroLod = lod;
    root.dataset.atlasV591HeroTextureReceipt = receipt;
    root.dataset.atlasV591HeroKtx2First = "false";
    root.dataset.atlasV591HeroTextureSources = "ice-giant-flow-primary:procedural-primary";
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_ICE_GIANT_PRIMARY_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroPrimaryModel = "registered-analytical-primary-fixed-epoch";
    root.dataset.atlasV591HeroObservationTextureClaim = "false";
    root.dataset.atlasV591HeroMeasuredPhotometryClaim = "false";
    root.dataset.atlasV591HeroFlowModel = isNeptune ? "bounded-fixed-epoch-storm-zonal-clouds" : "low-amplitude-fixed-epoch-zonal-clouds-polar-haze";
    root.dataset.atlasV591HeroReflectance = "methane-limb-multiple-scattering-no-specular-lobe";
    root.dataset.atlasV591HeroProceduralPrimary = "true";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [bodyId, focused, heightSegments, isNeptune, widthSegments]);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590(bodyId), spec.axialTiltRad]}
      scale={focused ? focusedScale : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: bodyId,
        atlasAdmission: "admitted",
        atlasRegisteredPrimary: "v590-ice-giant-flow-primary-readonly-identity",
        atlasObservationTextureClaim: false,
        atlasMeasuredPhotometryClaim: false,
        atlasSolarTerminator: "world-origin",
        atlasProceduralPrimary: true,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <mesh material={surfaceMaterial} scale={[1.018, 0.986, 1.018]} castShadow receiveShadow renderOrder={2}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
      <mesh geometry={ringGeometry} material={ringMaterial} renderOrder={3} frustumCulled={false} />
      <mesh material={atmosphereMaterial} scale={1.035} renderOrder={6}>
        <sphereGeometry args={[spec.radius, widthSegments, heightSegments]} />
      </mesh>
    </group>
  );
}

function IceGiantOverrideV591({
  bodyId,
  profile,
  focusTarget,
}: Readonly<{
  bodyId: IceGiantBodyV591;
  profile: CelestialRenderProfileV590;
  focusTarget: CelestialFocusTargetV590;
}>) {
  const visible = focusTarget === "overview" || focusTarget === bodyId;
  return visible
    ? <IceGiantVisualV591 bodyId={bodyId} profile={profile} focused={focusTarget === bodyId} />
    : <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: bodyId, atlasRegisteredPrimary: true, atlasProceduralPrimary: true, atlasProceduralFallback: false }} />;
}

function BennuOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "bennu";
  const focused = focusTarget === "bennu";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  const model = useV591InheritedBennuModel(deliveryTier, profile.deviceTier, preferredLod, visible);
  const microAlbedo = useV591BennuTexture("bennu-regolith-albedo", deliveryTier, profile.deviceTier, visible);
  const microNormal = useV591BennuTexture("bennu-regolith-normal", deliveryTier, profile.deviceTier, visible);
  const microRoughness = useV591BennuTexture("bennu-regolith-roughness", deliveryTier, profile.deviceTier, visible);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    microAlbedo.texture && microNormal.texture && microRoughness.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: BENNU_REGOLITH_FRAGMENT_V591,
      uniforms: {
        uMicroAlbedo: { value: microAlbedo.texture },
        uMicroNormal: { value: microNormal.texture },
        uMicroRoughness: { value: microRoughness.texture },
        uSunWorld: { value: new THREE.Vector3(0, 0, 0) },
        uTextureScale: { value: profile.deviceTier === "mobile" ? 2.15 : 3.15 },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [microAlbedo.texture, microNormal.texture, microRoughness.texture, profile.deviceTier, profile.mode]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      originals.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
    });
    return () => originals.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);
  const textureStates = [microAlbedo, microNormal, microRoughness] as const;
  const texturesReady = textureStates.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || textureStates.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(model.status === "ready" && model.scene && material && texturesReady && qualityReady);
  const ktx2First = textureStates.every((state) => state.source === "ktx2");
  const textureSources = textureStates.map((state) => `${state.assetId}:${state.source}`).join("|");
  const textureReceipt = `${textureReceiptV591(textureStates)}|model:${model.status}:lod=${model.lod ?? "none"}:sha256=${model.sha256}`;
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.bennu.radius * 1.34;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroFrameFits = subjectVisible && pixelDiameter <= canvasSize.width * 0.92 ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "bennu";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "nasa-shape-cc0-triplanar-carbonaceous-oren-nayar-bounded-opposition";
    root.dataset.atlasV591HeroLod = `model-lod${model.lod ?? "none"};micro=${textureDimensionsV591(microAlbedo.texture)}`;
    root.dataset.atlasV591HeroTextureReceipt = textureReceipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroModelStatus = model.status;
    root.dataset.atlasV591HeroModelLod = model.lod === null ? "none" : String(model.lod);
    root.dataset.atlasV591HeroModelSha = model.sha256;
    root.dataset.atlasV591HeroModelGpuBytes = String(model.estimatedGpuBytes);
    root.dataset.atlasV591HeroModelDependency = "v589-bennu-model-readonly";
    root.dataset.atlasV591HeroMicrotexturePolicy = "poly-haven-cc0-presentation-only-not-bennu-observation";
    root.dataset.atlasV591HeroReflectance = "low-albedo-carbonaceous-oren-nayar-bounded-opposition-no-glossy-specular";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [focused, ktx2First, microAlbedo.texture, model.estimatedGpuBytes, model.lod, model.sha256, model.status, runtimeAdmitted, textureReceipt, textureSources]);
  if (!visible || !runtimeAdmitted || !model.scene) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "bennu", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.bennu;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.bennu;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("bennu"), spec.axialTiltRad]}
      scale={focused ? 1.34 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "bennu",
        atlasAdmission: "admitted",
        atlasModelLod: model.lod,
        atlasInheritedDependency: "v589-bennu-model-readonly",
        atlasMicrotexture: "poly-haven-cc0-presentation-only",
        atlasSolarTerminator: "world-origin",
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <primitive object={model.scene} scale={spec.radius} />
    </group>
  );
}

function VestaOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const visible = focusTarget === "overview" || focusTarget === "vesta";
  const focused = focusTarget === "vesta";
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  const model = useV591VestaModel(preferredLod, visible);
  // Exact-byte reuse is deliberate: the Poly Haven channels are bounded
  // presentation microstructure, while NASA geometry remains the body source.
  const microAlbedo = useV591BennuTexture("bennu-regolith-albedo", deliveryTier, profile.deviceTier, visible);
  const microNormal = useV591BennuTexture("bennu-regolith-normal", deliveryTier, profile.deviceTier, visible);
  const microRoughness = useV591BennuTexture("bennu-regolith-roughness", deliveryTier, profile.deviceTier, visible);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    microAlbedo.texture && microNormal.texture && microRoughness.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: VESTA_REGOLITH_FRAGMENT_V591,
      uniforms: {
        uMicroAlbedo: { value: microAlbedo.texture },
        uMicroNormal: { value: microNormal.texture },
        uMicroRoughness: { value: microRoughness.texture },
        uSunWorld: { value: new THREE.Vector3(0, 0, 0) },
        uTextureScale: { value: profile.deviceTier === "mobile" ? 2.35 : 3.6 },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [microAlbedo.texture, microNormal.texture, microRoughness.texture, profile.deviceTier, profile.mode]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      originals.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
    });
    return () => originals.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);
  const textureStates = [microAlbedo, microNormal, microRoughness] as const;
  const texturesReady = textureStates.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || textureStates.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(model.status === "ready" && model.scene && material && texturesReady && qualityReady);
  const ktx2First = textureStates.every((state) => state.source === "ktx2");
  const textureSources = textureStates.map((state) => `${state.assetId}:${state.source}`).join("|");
  const textureReceipt = `exact-byte-reuse:${textureReceiptV591(textureStates)}|model:${model.status}:lod=${model.lod ?? "none"}:sha256=${model.sha256}`;
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.vesta.radius * 1.34;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroFrameFits = subjectVisible && pixelDiameter <= canvasSize.width * 0.92 ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = "vesta";
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "nasa-global-shape-cc0-triplanar-achondrite-oren-nayar-bounded-opposition";
    root.dataset.atlasV591HeroLod = `model-lod${model.lod ?? "none"};micro=${textureDimensionsV591(microAlbedo.texture)}`;
    root.dataset.atlasV591HeroTextureReceipt = textureReceipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroModelLodReceiptSha = CELESTIAL_CONVERGENCE_VESTA_MODEL_LOD_RECEIPT_SHA256_V591;
    root.dataset.atlasV591HeroModelStatus = model.status;
    root.dataset.atlasV591HeroModelLod = model.lod === null ? "none" : String(model.lod);
    root.dataset.atlasV591HeroModelSha = model.sha256;
    root.dataset.atlasV591HeroModelGpuBytes = String(model.estimatedGpuBytes);
    root.dataset.atlasV591HeroModelDependency = "v591-vesta-nasa-shape-owned";
    root.dataset.atlasV591HeroMicrotexturePolicy = "poly-haven-cc0-exact-byte-reuse-presentation-only-not-vesta-observation";
    root.dataset.atlasV591HeroMicrotextureSourceOverlaySha = CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroMicrotextureExactByteReuse = "true";
    root.dataset.atlasV591HeroReflectance = "basaltic-achondrite-oren-nayar-bounded-opposition-no-glossy-specular";
    root.dataset.atlasV591HeroMeasuredPhotometryClaim = "false";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [focused, ktx2First, microAlbedo.texture, model.estimatedGpuBytes, model.lod, model.sha256, model.status, runtimeAdmitted, textureReceipt, textureSources]);
  if (!visible || !runtimeAdmitted || !model.scene) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: "vesta", atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.vesta;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.vesta;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590("vesta"), spec.axialTiltRad]}
      scale={focused ? 1.34 : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: "vesta",
        atlasAdmission: "admitted",
        atlasModelLod: model.lod,
        atlasOwnedDependency: "v591-vesta-nasa-shape",
        atlasMicrotexture: "poly-haven-cc0-exact-byte-reuse-presentation-only",
        atlasSolarTerminator: "world-origin",
        atlasMeasuredPhotometryClaim: false,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <primitive object={model.scene} scale={spec.radius} />
    </group>
  );
}

function CeresOverrideV591({ profile, focusTarget }: Readonly<{ profile: CelestialRenderProfileV590; focusTarget: CelestialFocusTargetV590 }>) {
  const bodyId = "ceres" as const;
  const visible = focusTarget === "overview" || focusTarget === bodyId;
  const focused = focusTarget === bodyId;
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  const model = useV591CeresModel(preferredLod, visible);
  const albedo = useV591CeresTexture("ceres-albedo", deliveryTier, profile.deviceTier, visible);
  const normal = useV591CeresTexture("ceres-normal", deliveryTier, profile.deviceTier, visible);
  const roughness = useV591CeresTexture("ceres-roughness", deliveryTier, profile.deviceTier, visible);
  const height = useV591CeresTexture("ceres-height", deliveryTier, profile.deviceTier, visible);
  // The sealed overlay records these as exact-byte Poly Haven reuse. They add
  // bounded microstructure only and are never represented as Ceres data.
  const microAlbedo = useV591BennuTexture("bennu-regolith-albedo", deliveryTier, profile.deviceTier, visible);
  const microNormal = useV591BennuTexture("bennu-regolith-normal", deliveryTier, profile.deviceTier, visible);
  const microRoughness = useV591BennuTexture("bennu-regolith-roughness", deliveryTier, profile.deviceTier, visible);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    albedo.texture
    && normal.texture
    && roughness.texture
    && height.texture
    && microAlbedo.texture
    && microNormal.texture
    && microRoughness.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: CERES_SURFACE_FRAGMENT_V591,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uMacroNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uHeight: { value: height.texture },
        uMicroAlbedo: { value: microAlbedo.texture },
        uMicroNormal: { value: microNormal.texture },
        uMicroRoughness: { value: microRoughness.texture },
        uSunWorld: { value: new THREE.Vector3(0, 0, 0) },
        uTextureScale: { value: profile.deviceTier === "mobile" ? 2.15 : 3.45 },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [
    albedo.texture,
    height.texture,
    microAlbedo.texture,
    microNormal.texture,
    microRoughness.texture,
    normal.texture,
    profile.deviceTier,
    profile.mode,
    roughness.texture,
  ]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      originals.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
    });
    return () => originals.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);

  const textureStates = [albedo, normal, roughness, height, microAlbedo, microNormal, microRoughness] as const;
  const texturesReady = textureStates.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || textureStates.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(model.status === "ready" && model.scene && material && texturesReady && qualityReady);
  const ktx2First = textureStates.every((state) => state.source === "ktx2");
  const textureSources = textureStates.map((state) => `${state.assetId}:${state.source}`).join("|");
  const textureReceipt = `pds-macro+exact-byte-cc0-micro:${textureReceiptV591(textureStates)}|model:${model.status}:lod=${model.lod ?? "none"}:sha256=${model.sha256}`;
  const focusedScale = 1.38;
  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590.ceres.radius * focusedScale;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });
  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = bodyId;
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "pds-dawn-spc-radius-relative-albedo-cc0-bounded-micro-oren-nayar";
    root.dataset.atlasV591HeroLod = `model-lod${model.lod ?? "none"};macro=${textureDimensionsV591(albedo.texture)}`;
    root.dataset.atlasV591HeroTextureReceipt = textureReceipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroModelLodReceiptSha = CELESTIAL_CONVERGENCE_CERES_MODEL_LOD_RECEIPT_SHA256_V591;
    root.dataset.atlasV591HeroModelStatus = model.status;
    root.dataset.atlasV591HeroModelLod = model.lod === null ? "none" : String(model.lod);
    root.dataset.atlasV591HeroModelSha = model.sha256;
    root.dataset.atlasV591HeroModelGpuBytes = String(model.estimatedGpuBytes);
    root.dataset.atlasV591HeroModelDependency = "v591-ceres-pds-dawn-radius-shape-owned";
    root.dataset.atlasV591HeroSourceDetailCeiling = model.sourceDetailCeiling;
    root.dataset.atlasV591HeroObservationGrid = "2222x1111-pds-dawn-spc-relative-albedo-and-radius";
    root.dataset.atlasV591HeroRadiusRangeMeters = "442618.25:486849.59375";
    root.dataset.atlasV591HeroMicrotexturePolicy = "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation";
    root.dataset.atlasV591HeroMicrotextureSourceOverlaySha = CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroMicrotextureExactByteReuse = "true";
    root.dataset.atlasV591HeroReflectance = "rough-oren-nayar-bounded-opposition-no-glossy-specular";
    root.dataset.atlasV591HeroOpticalColorClaim = "false";
    root.dataset.atlasV591HeroSyntheticDetailAdded = "false";
    root.dataset.atlasV591HeroMeasuredPhotometryClaim = "false";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [
    albedo.texture,
    bodyId,
    focused,
    ktx2First,
    model.estimatedGpuBytes,
    model.lod,
    model.sha256,
    model.sourceDetailCeiling,
    model.status,
    runtimeAdmitted,
    textureReceipt,
    textureSources,
  ]);
  if (!visible || !runtimeAdmitted || !model.scene) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: bodyId, atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590.ceres;
  const orbit = CELESTIAL_ORBIT_BY_ID_V590.ceres;
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590(bodyId), spec.axialTiltRad]}
      scale={focused ? focusedScale : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: bodyId,
        atlasAdmission: "admitted",
        atlasModelLod: model.lod,
        atlasOwnedDependency: "v591-ceres-pds-dawn-radius-shape",
        atlasSourceDetailCeiling: model.sourceDetailCeiling,
        atlasObservationGrid: "2222x1111-pds-dawn-spc-relative-albedo-and-radius",
        atlasMicrotexture: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation",
        atlasMicrotextureExactByteReuse: true,
        atlasSolarTerminator: "world-origin",
        atlasOpticalColorClaim: false,
        atlasSyntheticDetailAdded: false,
        atlasMeasuredPhotometryClaim: false,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <primitive object={model.scene} scale={spec.radius} />
    </group>
  );
}

const NASA_SMALL_BODY_VISUAL_PROFILE_V591 = Object.freeze({
  eros: Object.freeze({
    bodyKind: 0,
    focusedScale: 1.46,
    mobileTextureScale: 2.35,
    desktopTextureScale: 3.75,
    material: "nasa-shape-cc0-triplanar-s-type-silicate-oren-nayar-bounded-opposition",
    reflectance: "s-type-silicate-oren-nayar-bounded-opposition-no-glossy-specular",
    dependency: "v591-eros-nasa-shape-owned-watertight-reconstruction",
    microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-eros-observation",
    overlaySha256: CELESTIAL_CONVERGENCE_EROS_ASSET_OVERLAY_SHA256_V591,
    modelReceiptSha256: CELESTIAL_CONVERGENCE_EROS_MODEL_LOD_RECEIPT_SHA256_V591,
  }),
  kleopatra: Object.freeze({
    bodyKind: 1,
    focusedScale: 1.42,
    mobileTextureScale: 2.05,
    desktopTextureScale: 3.25,
    material: "nasa-radar-shape-cc0-triplanar-m-type-rough-broad-edge-response",
    reflectance: "metal-rich-rough-oren-nayar-bounded-broad-edge-response-no-glossy-specular",
    dependency: "v591-kleopatra-nasa-low-resolution-radar-shape-owned",
    microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-kleopatra-observation",
    overlaySha256: CELESTIAL_CONVERGENCE_KLEOPATRA_ASSET_OVERLAY_SHA256_V591,
    modelReceiptSha256: CELESTIAL_CONVERGENCE_KLEOPATRA_MODEL_LOD_RECEIPT_SHA256_V591,
  }),
});

function NasaSmallBodyOverrideV591({
  bodyId,
  profile,
  focusTarget,
}: Readonly<{
  bodyId: NasaSmallBodyIdV591;
  profile: CelestialRenderProfileV590;
  focusTarget: CelestialFocusTargetV590;
}>) {
  const visible = focusTarget === "overview" || focusTarget === bodyId;
  const focused = focusTarget === bodyId;
  const visual = NASA_SMALL_BODY_VISUAL_PROFILE_V591[bodyId];
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  const model = useV591NasaSmallBodyModel(bodyId, preferredLod, visible);
  // These are the exact Bennu-overlay bytes referenced by each body's sealed
  // overlay. The substrate below is body-specific; the textures are explicitly
  // presentation-only and are never represented as Eros/Kleopatra observation.
  const microAlbedo = useV591BennuTexture("bennu-regolith-albedo", deliveryTier, profile.deviceTier, visible);
  const microNormal = useV591BennuTexture("bennu-regolith-normal", deliveryTier, profile.deviceTier, visible);
  const microRoughness = useV591BennuTexture("bennu-regolith-roughness", deliveryTier, profile.deviceTier, visible);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => (
    microAlbedo.texture && microNormal.texture && microRoughness.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: NASA_SMALL_BODY_REGOLITH_FRAGMENT_V591,
      uniforms: {
        uMicroAlbedo: { value: microAlbedo.texture },
        uMicroNormal: { value: microNormal.texture },
        uMicroRoughness: { value: microRoughness.texture },
        uSunWorld: { value: new THREE.Vector3(0, 0, 0) },
        uTextureScale: { value: profile.deviceTier === "mobile" ? visual.mobileTextureScale : visual.desktopTextureScale },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
        uBodyKind: { value: visual.bodyKind },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [
    microAlbedo.texture,
    microNormal.texture,
    microRoughness.texture,
    profile.deviceTier,
    profile.mode,
    visual.bodyKind,
    visual.desktopTextureScale,
    visual.mobileTextureScale,
  ]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      originals.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
    });
    return () => originals.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);

  const textureStates = [microAlbedo, microNormal, microRoughness] as const;
  const texturesReady = textureStates.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || textureStates.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(model.status === "ready" && model.scene && material && texturesReady && qualityReady);
  const ktx2First = textureStates.every((state) => state.source === "ktx2");
  const textureSources = textureStates.map((state) => `${state.assetId}:${state.source}`).join("|");
  const textureReceipt = `exact-byte-reuse:${textureReceiptV591(textureStates)}|model:${model.status}:lod=${model.lod ?? "none"}:sha256=${model.sha256}`;

  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = HERO_BODY_SPEC_BY_ID_V590[bodyId].radius * visual.focusedScale;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });

  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = bodyId;
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = visual.material;
    root.dataset.atlasV591HeroLod = `model-lod${model.lod ?? "none"};micro=${textureDimensionsV591(microAlbedo.texture)}`;
    root.dataset.atlasV591HeroTextureReceipt = textureReceipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = visual.overlaySha256;
    root.dataset.atlasV591HeroModelLodReceiptSha = visual.modelReceiptSha256;
    root.dataset.atlasV591HeroModelStatus = model.status;
    root.dataset.atlasV591HeroModelLod = model.lod === null ? "none" : String(model.lod);
    root.dataset.atlasV591HeroModelSha = model.sha256;
    root.dataset.atlasV591HeroModelGpuBytes = String(model.estimatedGpuBytes);
    root.dataset.atlasV591HeroModelDependency = visual.dependency;
    root.dataset.atlasV591HeroSourceDetailCeiling = model.sourceDetailCeiling;
    root.dataset.atlasV591HeroPrintableSplitReconstruction = bodyId === "eros"
      ? model.printableSplitReconstruction?.watertight === true ? "watertight-topology-paired" : "blocked"
      : "not-applicable";
    root.dataset.atlasV591HeroMicrotexturePolicy = visual.microtexturePolicy;
    root.dataset.atlasV591HeroMicrotextureSourceOverlaySha = CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroMicrotextureExactByteReuse = "true";
    root.dataset.atlasV591HeroReflectance = visual.reflectance;
    root.dataset.atlasV591HeroMeasuredPhotometryClaim = "false";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [
    bodyId,
    focused,
    ktx2First,
    microAlbedo.texture,
    model.estimatedGpuBytes,
    model.lod,
    model.printableSplitReconstruction,
    model.sha256,
    model.sourceDetailCeiling,
    model.status,
    runtimeAdmitted,
    textureReceipt,
    textureSources,
    visual,
  ]);

  if (!visible || !runtimeAdmitted || !model.scene) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: bodyId, atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  const spec = HERO_BODY_SPEC_BY_ID_V590[bodyId];
  const orbit = CELESTIAL_ORBIT_BY_ID_V590[bodyId];
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      rotation={[0, deterministicBodyPhaseV590(bodyId), spec.axialTiltRad]}
      scale={focused ? visual.focusedScale : 1}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: bodyId,
        atlasAdmission: "admitted",
        atlasModelLod: model.lod,
        atlasOwnedDependency: visual.dependency,
        atlasSourceDetailCeiling: model.sourceDetailCeiling,
        atlasMicrotexture: visual.microtexturePolicy,
        atlasMicrotextureExactByteReuse: true,
        atlasSolarTerminator: "world-origin",
        atlasMeasuredPhotometryClaim: false,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <primitive object={model.scene} scale={spec.radius} />
    </group>
  );
}

type TempelTailPacketV591 = Readonly<{
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  estimatedBytes: number;
}>;

function seededRandomV591(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4_294_967_296;
  };
}

function createTempelTailPacketV591({
  direction,
  count,
  length,
  spread,
  seed,
  dust,
  pointSize,
}: Readonly<{
  direction: THREE.Vector3;
  count: number;
  length: number;
  spread: number;
  seed: number;
  dust: boolean;
  pointSize: number;
}>): TempelTailPacketV591 {
  const random = seededRandomV591(seed);
  const axis = direction.clone().normalize();
  const reference = Math.abs(axis.y) < 0.88 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const side = new THREE.Vector3().crossVectors(axis, reference).normalize();
  const up = new THREE.Vector3().crossVectors(side, axis).normalize();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const progress = Math.pow(random(), dust ? 0.72 : 0.58);
    const envelope = spread * (0.12 + progress * (dust ? 1.0 : 0.46));
    const angle = random() * Math.PI * 2;
    const radial = Math.sqrt(random()) * envelope;
    const curve = dust ? Math.sin(progress * Math.PI) * spread * 0.42 : Math.sin(progress * Math.PI * 1.35) * spread * 0.10;
    const position = axis.clone().multiplyScalar(progress * length)
      .addScaledVector(side, Math.cos(angle) * radial + curve)
      .addScaledVector(up, Math.sin(angle) * radial * (dust ? 0.72 : 0.30));
    positions[index * 3] = position.x;
    positions[index * 3 + 1] = position.y;
    positions[index * 3 + 2] = position.z;
    const fade = 1 - progress;
    const color = dust
      ? new THREE.Color(0.62 + fade * 0.22, 0.50 + fade * 0.18, 0.37 + fade * 0.12)
      : new THREE.Color(0.18 + fade * 0.18, 0.46 + fade * 0.22, 0.78 + fade * 0.18);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  geometry.userData.atlasCandidate = "v591";
  geometry.userData.atlasHeroBodyV591 = "tempel-1";
  geometry.userData.atlasPresentationOnly = true;
  geometry.userData.atlasFixedSeed = seed;
  const material = new THREE.PointsMaterial({
    size: pointSize,
    sizeAttenuation: true,
    transparent: true,
    opacity: dust ? 0.34 : 0.40,
    vertexColors: true,
    depthWrite: false,
    depthTest: true,
    blending: dust ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  });
  material.userData.atlasCandidate = "v591";
  material.userData.atlasHeroBodyV591 = "tempel-1";
  material.userData.atlasPresentationOnly = true;
  return { geometry, material, estimatedBytes: positions.byteLength + colors.byteLength };
}

function Tempel1OverrideV591({
  profile,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  focusTarget: CelestialFocusTargetV590;
}>) {
  const bodyId = "tempel-1" as const;
  const visible = focusTarget === "overview" || focusTarget === bodyId;
  const focused = focusTarget === bodyId;
  const deliveryTier = focused ? profile.deliveryTier : "vercel-lite";
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  const model = useV591Tempel1Model(preferredLod, visible);
  const observation = useV591Tempel1Texture("tempel-1-observation", deliveryTier, profile.deviceTier, visible);
  const coverageMask = useV591Tempel1Texture("tempel-1-observation-mask", deliveryTier, profile.deviceTier, visible);
  const microAlbedo = useV591BennuTexture("bennu-regolith-albedo", deliveryTier, profile.deviceTier, visible);
  const microNormal = useV591BennuTexture("bennu-regolith-normal", deliveryTier, profile.deviceTier, visible);
  const microRoughness = useV591BennuTexture("bennu-regolith-roughness", deliveryTier, profile.deviceTier, visible);
  const heroGroup = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const canvasSize = useThree((state) => state.size);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const spec = HERO_BODY_SPEC_BY_ID_V590[bodyId];
  const orbit = CELESTIAL_ORBIT_BY_ID_V590[bodyId];
  const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
  const directions = useMemo(() => {
    const center = new THREE.Vector3(...position);
    const before = new THREE.Vector3(...celestialOrbitPointV590(orbit, orbit.phaseRad - 0.0025));
    const after = new THREE.Vector3(...celestialOrbitPointV590(orbit, orbit.phaseRad + 0.0025));
    return {
      antiSolar: center.clone().normalize(),
      velocity: after.sub(before).normalize(),
    };
  }, [orbit, position]);
  const material = useMemo(() => (
    observation.texture
    && coverageMask.texture
    && microAlbedo.texture
    && microNormal.texture
    && microRoughness.texture
  ) ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V591,
      fragmentShader: TEMPEL1_SURFACE_FRAGMENT_V591,
      uniforms: {
        uObservation: { value: observation.texture },
        uCoverageMask: { value: coverageMask.texture },
        uMicroAlbedo: { value: microAlbedo.texture },
        uMicroNormal: { value: microNormal.texture },
        uMicroRoughness: { value: microRoughness.texture },
        uSunWorld: { value: new THREE.Vector3(0, 0, 0) },
        uTextureScale: { value: profile.deviceTier === "mobile" ? 2.2 : 3.7 },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      toneMapped: profile.mode === "cinematic",
      depthWrite: true,
      depthTest: true,
    }) : null,
  [
    coverageMask.texture,
    microAlbedo.texture,
    microNormal.texture,
    microRoughness.texture,
    observation.texture,
    profile.deviceTier,
    profile.mode,
  ]);
  useEffect(() => () => {
    if (material) disposeAfterDetachV591(material);
  }, [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      originals.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
    });
    return () => originals.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);

  const tailsVisible = focused && profile.mode === "cinematic";
  const dustTail = useMemo(() => tailsVisible ? createTempelTailPacketV591({
    direction: directions.antiSolar,
    count: profile.deviceTier === "mobile" ? 180 : 360,
    length: spec.radius * 11.5,
    spread: spec.radius * 0.46,
    seed: 0x591d057,
    dust: true,
    pointSize: spec.radius * (profile.deviceTier === "mobile" ? 0.105 : 0.082),
  }) : null, [directions.antiSolar, profile.deviceTier, spec.radius, tailsVisible]);
  const ionTail = useMemo(() => tailsVisible ? createTempelTailPacketV591({
    direction: directions.velocity,
    count: profile.deviceTier === "mobile" ? 120 : 260,
    length: spec.radius * 14.0,
    spread: spec.radius * 0.24,
    seed: 0x59110a1,
    dust: false,
    pointSize: spec.radius * (profile.deviceTier === "mobile" ? 0.080 : 0.060),
  }) : null, [directions.velocity, profile.deviceTier, spec.radius, tailsVisible]);
  useEffect(() => {
    const packets = [dustTail, ionTail].filter((packet): packet is TempelTailPacketV591 => packet !== null);
    if (packets.length === 0) return;
    const releases = packets.map((packet, index) => acquireAtlasResource("gpu-buffer", "atlas", `v591-tempel-1-${index === 0 ? "dust" : "ion"}-tail`, {
      owner: "v591-celestial-convergence",
      estimatedBytes: packet.estimatedBytes,
      manifestSha256: CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
    }));
    return () => {
      releases.forEach((release) => release());
      packets.forEach((packet) => {
        disposeAfterDetachV591(packet.geometry);
        disposeAfterDetachV591(packet.material);
      });
    };
  }, [dustTail, ionTail]);

  const textureStates = [observation, coverageMask, microAlbedo, microNormal, microRoughness] as const;
  const texturesReady = textureStates.every((state) => state.status === "ready" && state.texture);
  const qualityReady = deliveryTier !== "standalone-full" || textureStates.every((state) => state.fullQualityGate === "passed");
  const runtimeAdmitted = Boolean(model.status === "ready" && model.scene && material && texturesReady && qualityReady);
  const ktx2First = textureStates.every((state) => state.source === "ktx2");
  const textureSources = textureStates.map((state) => `${state.assetId}:${state.source}`).join("|");
  const textureReceipt = `${textureReceiptV591(textureStates)}|model:${model.status}:lod=${model.lod ?? "none"}:sha256=${model.sha256}`;
  const focusedScale = 1.48;

  useFrame(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root || !heroGroup.current || !runtimeAdmitted) {
      if (root) {
        root.dataset.atlasV591HeroSubjectVisible = "false";
        root.dataset.atlasV591HeroScreenDiameterPx = "0";
        root.dataset.atlasV591HeroFrameFits = "false";
      }
      return;
    }
    heroGroup.current.getWorldPosition(projectedCenter);
    const distance = camera.position.distanceTo(projectedCenter);
    projectedCenter.project(camera);
    const radiusWorld = spec.radius * focusedScale;
    const angularDiameter = 2 * Math.atan2(radiusWorld, Math.max(radiusWorld, distance));
    const pixelDiameter = angularDiameter / THREE.MathUtils.degToRad(camera.fov) * canvasSize.height;
    const subjectVisible = projectedCenter.z >= -1 && projectedCenter.z <= 1
      && Math.abs(projectedCenter.x) <= 0.96
      && Math.abs(projectedCenter.y) <= 0.96
      && pixelDiameter >= 72;
    root.dataset.atlasV591HeroSubjectVisible = subjectVisible ? "true" : "false";
    root.dataset.atlasV591HeroFrameFits = heroFrameFitsV591(subjectVisible, pixelDiameter, canvasSize.width) ? "true" : "false";
    root.dataset.atlasV591HeroScreenDiameterPx = pixelDiameter.toFixed(2);
    root.dataset.atlasV591HeroNdc = `${projectedCenter.x.toFixed(4)},${projectedCenter.y.toFixed(4)},${projectedCenter.z.toFixed(4)}`;
  });

  useEffect(() => {
    if (!focused) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (!root) return;
    clearFocusedHeroTelemetryV591(root);
    root.dataset.atlasV591HeroBody = bodyId;
    root.dataset.atlasV591HeroAdmission = runtimeAdmitted ? "admitted" : "asset-blocked";
    root.dataset.atlasV591HeroMaterial = "pds-simple-cylindrical-observation-mask-cc0-regolith-oren-nayar";
    root.dataset.atlasV591HeroLod = `model-lod${model.lod ?? "none"};observation=${textureDimensionsV591(observation.texture)}`;
    root.dataset.atlasV591HeroTextureReceipt = textureReceipt;
    root.dataset.atlasV591HeroKtx2First = ktx2First ? "true" : "false";
    root.dataset.atlasV591HeroTextureSources = textureSources;
    root.dataset.atlasV591HeroAssetOverlaySha = CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroModelLodReceiptSha = CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591;
    root.dataset.atlasV591HeroModelStatus = model.status;
    root.dataset.atlasV591HeroModelLod = model.lod === null ? "none" : String(model.lod);
    root.dataset.atlasV591HeroModelSha = model.sha256;
    root.dataset.atlasV591HeroModelGpuBytes = String(model.estimatedGpuBytes);
    root.dataset.atlasV591HeroModelDependency = "v591-tempel-1-pds-deep-impact-stardust-next-shape-owned";
    root.dataset.atlasV591HeroSourceDetailCeiling = model.sourceDetailCeiling;
    root.dataset.atlasV591HeroObservationDataset = "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0";
    root.dataset.atlasV591HeroObservedCoverageFraction = "0.8043214699074074";
    root.dataset.atlasV591HeroUnobservedAreaPolicy = "cc0-regolith-presentation-substrate-never-observation";
    root.dataset.atlasV591HeroMicrotextureSourceOverlaySha = CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591;
    root.dataset.atlasV591HeroMicrotextureExactByteReuse = "true";
    root.dataset.atlasV591HeroTailPolicy = "fixed-seed-dust-anti-solar-ion-velocity-presentation-only";
    root.dataset.atlasV591HeroTailVisible = tailsVisible ? "true" : "false";
    root.dataset.atlasV591HeroMeasuredPhotometryClaim = "false";
    root.dataset.atlasV591HeroProceduralFallback = "false";
    root.dataset.atlasV591HeroScientificPayloadMutation = "false";
  }, [
    bodyId,
    focused,
    ktx2First,
    model.estimatedGpuBytes,
    model.lod,
    model.sha256,
    model.sourceDetailCeiling,
    model.status,
    observation.texture,
    runtimeAdmitted,
    tailsVisible,
    textureReceipt,
    textureSources,
  ]);

  if (!visible || !runtimeAdmitted || !model.scene) {
    return <group userData={{ atlasCandidate: "v591", atlasHeroBodyV591: bodyId, atlasAssetBlocked: true, atlasProceduralFallback: false }} />;
  }
  return (
    <group
      ref={heroGroup}
      position={position as [number, number, number]}
      userData={{
        atlasCandidate: "v591",
        atlasHeroBodyV591: bodyId,
        atlasAdmission: "admitted",
        atlasModelLod: model.lod,
        atlasObservedCoverageFraction: 0.8043214699074074,
        atlasUnobservedAreaPolicy: "cc0-regolith-presentation-substrate-never-observation",
        atlasTailPolicy: "fixed-seed-dust-anti-solar-ion-velocity-presentation-only",
        atlasSolarTerminator: "world-origin",
        atlasMeasuredPhotometryClaim: false,
        atlasProceduralFallback: false,
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <group rotation={[0, deterministicBodyPhaseV590(bodyId), spec.axialTiltRad]} scale={focused ? focusedScale : 1}>
        <primitive object={model.scene} scale={spec.radius} />
      </group>
      {dustTail ? <points geometry={dustTail.geometry} material={dustTail.material} renderOrder={8} /> : null}
      {ionTail ? <points geometry={ionTail.geometry} material={ionTail.material} renderOrder={9} /> : null}
    </group>
  );
}

/**
 * v591 override root. A blocked v590 Hero is an empty audited group, so an
 * admitted v591 body can later occupy the exact same orbit placement inside
 * this one Canvas without hiding, mutating, or monkey-patching v590 objects.
 */
export default function CelestialHeroOverridesV591({
  profile,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  focusTarget: CelestialFocusTargetV590;
}>) {
  return (
    <group
      visible
      userData={{
        atlasCandidate: "v591",
        atlasCelestialHeroOverridesV591: true,
        atlasHeroOverrideCount: V591_ADMITTED_OVERRIDE_COUNT,
        atlasFocusTargetV591: focusTarget,
        atlasInheritedPresentationEpoch: profile.presentationEpoch,
        atlasPresentationEpochV591: 591,
        atlasSingleCanvas: true,
        atlasProceduralFallback: false,
        atlasScientificPayloadMutation: false,
      }}
    >
      <SunOverrideV591 profile={profile} focusTarget={focusTarget} />
      <EarthOverrideV591 profile={profile} focusTarget={focusTarget} />
      <MercuryOverrideV591 profile={profile} focusTarget={focusTarget} />
      <VenusOverrideV591
        profile={profile}
        focusTarget={focusTarget}
        enabled={HERO_OVERRIDE_ADMISSIONS_V591.venus === "admitted"}
      />
      <MoonOverrideV591 profile={profile} focusTarget={focusTarget} />
      <MarsOverrideV591 profile={profile} focusTarget={focusTarget} />
      <JupiterOverrideV591 profile={profile} focusTarget={focusTarget} />
      <SaturnOverrideV591 profile={profile} focusTarget={focusTarget} />
      <VestaOverrideV591 profile={profile} focusTarget={focusTarget} />
      <BennuOverrideV591 profile={profile} focusTarget={focusTarget} />
      <NasaSmallBodyOverrideV591 bodyId="eros" profile={profile} focusTarget={focusTarget} />
      <NasaSmallBodyOverrideV591 bodyId="kleopatra" profile={profile} focusTarget={focusTarget} />
      <Tempel1OverrideV591 profile={profile} focusTarget={focusTarget} />
      <CeresOverrideV591 profile={profile} focusTarget={focusTarget} />
      <IceGiantOverrideV591 bodyId="uranus" profile={profile} focusTarget={focusTarget} />
      <IceGiantOverrideV591 bodyId="neptune" profile={profile} focusTarget={focusTarget} />
    </group>
  );
}
