"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CELESTIAL_ORBIT_BY_ID_V590,
  HERO_BODY_SPECS_V590,
  HERO_BODY_SPEC_BY_ID_V590,
  celestialOrbitPointV590,
  type CelestialDeliveryTierV590,
  type CelestialFocusTargetV590,
  type CelestialRenderProfileV590,
  type HeroAssetAdmissionV590,
  type HeroBodyIdV590,
  type HeroMaterialKindV590,
} from "../lib/celestialRenderingV590";
import {
  ATMOSPHERE_FRAGMENT_V590,
  CELESTIAL_PRESENTATION_EPOCH_V590,
  CELESTIAL_SURFACE_VERTEX_V590,
  EARTH_CLOUD_FRAGMENT_V590,
  EARTH_SURFACE_FRAGMENT_V590,
  GAS_GIANT_FRAGMENT_V590,
  ICE_GIANT_FRAGMENT_V590,
  ICE_RING_FRAGMENT_V590,
  RADIAL_RING_VERTEX_V590,
  REGOLITH_FRAGMENT_V590,
  ROCKY_SURFACE_FRAGMENT_V590,
  SATURN_PLANET_FRAGMENT_V590,
  SATURN_RING_FRAGMENT_V590,
  SOLAR_CHROMOSPHERE_FRAGMENT_V590,
  SOLAR_PHOTOSPHERE_FRAGMENT_V590,
  VENUS_SURFACE_FRAGMENT_V590,
  createRadialRingGeometryV590,
  deterministicBodyPhaseV590,
  sphereSegmentsV590,
} from "../lib/celestialMaterialsV590";
import { useV589Model } from "../lib/useV589Model";
import { useV590Texture, type V590TextureLoadState } from "../lib/useV590Texture";

type PlanetaryFocusTargetV590 = "overview" | HeroBodyIdV590;

function planetaryFocusTargetV590(focusTarget: CelestialFocusTargetV590): PlanetaryFocusTargetV590 | null {
  if (focusTarget === "overview") return focusTarget;
  return focusTarget in HERO_BODY_SPEC_BY_ID_V590 ? focusTarget as HeroBodyIdV590 : null;
}

type HeroVisualPropsV590 = Readonly<{
  bodyId: HeroBodyIdV590;
  profile: CelestialRenderProfileV590;
  admission: HeroAssetAdmissionV590;
  focused: boolean;
  auditActive: boolean;
}>;

const SUN_WORLD_V590 = new THREE.Vector3(0, 0, 0);

function disposeAfterDetachV590(resource: { dispose: () => void }): void {
  resource.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resource.dispose()));
}

function qualityDeliveryTierV590(
  profile: CelestialRenderProfileV590,
  focused: boolean,
): CelestialDeliveryTierV590 {
  // Full KTX2 is intentionally resident only for the focused body.  The
  // verified Lite derivative is the overview atlas, not a procedural proxy.
  return focused ? profile.deliveryTier : "vercel-lite";
}

function textureDimensionsV590(texture: THREE.Texture | null): string {
  if (!texture) return "unknown";
  const candidates: unknown[] = [
    texture.image,
    texture.source?.data,
    texture.mipmaps?.[0],
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const { width, height } = candidate as { width?: unknown; height?: unknown };
    if (
      typeof width === "number"
      && Number.isFinite(width)
      && width > 0
      && typeof height === "number"
      && Number.isFinite(height)
      && height > 0
    ) {
      return `${Math.trunc(width)}x${Math.trunc(height)}`;
    }
  }
  return "unknown";
}

function textureReceiptV590(states: readonly V590TextureLoadState[]): string {
  return states.map((state) => [
    state.assetId,
    state.status,
    state.source,
    `dimensions=${textureDimensionsV590(state.texture)}`,
    `quality=${state.fullQualityGate}`,
    `sha256=${state.sha256}`,
  ].join(":")).join("|");
}

function auditedLodV590(
  admission: HeroAssetAdmissionV590,
  textureReceipt: string,
  modelLod: 0 | 1 | 2 | null,
): string {
  if (modelLod !== null) return `model-lod-${modelLod}`;
  const dimensions = [...textureReceipt.matchAll(/dimensions=(\d+)x(\d+)/g)]
    .map((match) => ({ width: Number(match[1]), height: Number(match[2]) }))
    .filter(({ width, height }) => Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)
    .sort((left, right) => (right.width * right.height) - (left.width * left.height));
  if (dimensions[0]) return `texture-${dimensions[0].width}x${dimensions[0].height}`;
  return admission === "admitted" ? "partial-dimensions-unknown" : "unknown-asset-blocked";
}

function useBodyAuditV590({
  active,
  bodyId,
  admission,
  material,
  focused,
  profile,
  textureReceipt,
  inheritedDependency = "none",
  modelLod = null,
}: Readonly<{
  active: boolean;
  bodyId: HeroBodyIdV590;
  admission: HeroAssetAdmissionV590;
  material: HeroMaterialKindV590;
  focused: boolean;
  profile: CelestialRenderProfileV590;
  textureReceipt: string;
  inheritedDependency?: string;
  modelLod?: 0 | 1 | 2 | null;
}>): void {
  useEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v590-celestial-rendering-browser-acceptance"]');
    if (!root) return;
    root.dataset.atlasV590HeroBody = bodyId;
    root.dataset.atlasV590HeroAdmission = admission;
    root.dataset.atlasV590HeroMaterial = material;
    root.dataset.atlasV590HeroLod = auditedLodV590(admission, textureReceipt, modelLod);
    const [widthSegments, heightSegments] = sphereSegmentsV590(focused, profile.deviceTier === "mobile");
    root.dataset.atlasV590HeroGeometryQuality = modelLod === null
      ? `sphere-${widthSegments}x${heightSegments}`
      : `model-lod-${modelLod}`;
    root.dataset.atlasV590HeroAssetQuality = textureReceipt || "partial-no-texture-receipt";
    root.dataset.atlasV590HeroTextureReceipt = textureReceipt || "procedural-primary";
    root.dataset.atlasV590HeroInheritedDependency = inheritedDependency;
    root.dataset.atlasV590HeroProceduralFallback = "false";
    root.dataset.atlasV590HeroScientificPayloadMutation = "false";
  }, [active, admission, bodyId, focused, inheritedDependency, material, modelLod, profile.deviceTier, textureReceipt]);
}

function useAtmosphereMaterialV590({
  profile,
  rayleigh,
  mie,
  density,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  rayleigh: string;
  mie: string;
  density: number;
}>): THREE.ShaderMaterial {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: ATMOSPHERE_FRAGMENT_V590,
    uniforms: {
      uRayleighColor: { value: new THREE.Color(rayleigh) },
      uMieColor: { value: new THREE.Color(mie) },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uDensity: { value: density },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: profile.mode === "science" ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  }), [density, mie, profile.mode, rayleigh]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

function SphereGeometryV590({ radius, focused, mobile }: { radius: number; focused: boolean; mobile: boolean }) {
  const [widthSegments, heightSegments] = sphereSegmentsV590(focused, mobile);
  return <sphereGeometry args={[radius, widthSegments, heightSegments]} />;
}

function BlockedBodyProxyV590({
  bodyId,
  admission,
  reason,
  auditActive,
  profile,
}: Readonly<{
  bodyId: HeroBodyIdV590;
  admission: HeroAssetAdmissionV590;
  reason: string;
  auditActive: boolean;
  profile: CelestialRenderProfileV590;
}>) {
  const spec = HERO_BODY_SPEC_BY_ID_V590[bodyId];
  useBodyAuditV590({
    active: auditActive,
    bodyId,
    admission,
    material: spec.material,
    focused: false,
    profile,
    textureReceipt: `blocked:${reason}`,
  });
  return (
    <group
      userData={{
        atlasCandidate: "v590",
        atlasHeroBodyV590: bodyId,
        atlasAssetBlocked: true,
        atlasAssetBlockedReason: reason,
        atlasProceduralFallback: false,
        atlasBlockedMarker: "hud-only",
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    />
  );
}

function SunV590({ profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590.sun;
  const tier = qualityDeliveryTierV590(profile, focused);
  const enabled = admission === "admitted";
  // The renderer contract names both channels explicitly. A single legacy
  // disk cannot satisfy a photosphere + chromosphere admission; until both
  // exact identities are present the Hero stays blocked.
  const photosphere = useV590Texture("sun-photosphere", tier, profile.deviceTier, enabled);
  const chromosphere = useV590Texture("sun-chromosphere", tier, profile.deviceTier, enabled);
  const photosphereMaterial = useMemo(() => photosphere.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: SOLAR_PHOTOSPHERE_FRAGMENT_V590,
    uniforms: {
      uPhotosphere: { value: photosphere.texture },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
      uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V590 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [photosphere.texture, profile.mode]);
  const chromosphereMaterial = useMemo(() => chromosphere.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: SOLAR_CHROMOSPHERE_FRAGMENT_V590,
    uniforms: {
      uChromosphere: { value: chromosphere.texture },
      uCinematic: { value: profile.mode === "cinematic" ? 1 : 0 },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    premultipliedAlpha: true,
    blending: profile.mode === "science" ? THREE.NormalBlending : THREE.AdditiveBlending,
    toneMapped: false,
  }) : null, [chromosphere.texture, profile.mode]);
  useEffect(() => () => {
    photosphereMaterial?.dispose();
    chromosphereMaterial?.dispose();
  }, [chromosphereMaterial, photosphereMaterial]);
  const receipt = textureReceiptV590([photosphere, chromosphere]);
  useBodyAuditV590({ active: auditActive, bodyId: "sun", admission, material: spec.material, focused, profile, textureReceipt: receipt });
  if (!enabled || !photosphereMaterial || !chromosphereMaterial) {
    return <BlockedBodyProxyV590 bodyId="sun" admission={admission} reason={enabled ? receipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group
      rotation={[0, deterministicBodyPhaseV590("sun"), 0]}
      userData={{
        atlasCandidate: "v590",
        atlasHeroBodyV590: "sun",
        atlasAdmission: admission,
        atlasChromosphereSource: "sun-chromosphere-exact-manifest-channel",
        atlasProceduralFallback: false,
      }}
    >
      <mesh material={photosphereMaterial}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh material={chromosphereMaterial} scale={profile.mode === "cinematic" ? 1.055 : 1.018} renderOrder={7}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
    </group>
  );
}

function EarthV590({ profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590.earth;
  const tier = qualityDeliveryTierV590(profile, focused);
  const enabled = admission === "admitted";
  const albedo = useV590Texture("earth-albedo", tier, profile.deviceTier, enabled);
  const normal = useV590Texture("earth-normal", tier, profile.deviceTier, enabled);
  const roughness = useV590Texture("earth-roughness", tier, profile.deviceTier, enabled);
  const clouds = useV590Texture("earth-clouds", tier, profile.deviceTier, enabled);
  const cloudAlpha = useV590Texture("earth-cloud-alpha", tier, profile.deviceTier, enabled);
  const night = useV590Texture("earth-night", tier, profile.deviceTier, enabled);
  const nightMask = useV590Texture("earth-night-mask", tier, profile.deviceTier, enabled);
  const group = useRef<THREE.Group>(null);
  const sunLocal = useMemo(() => new THREE.Vector3(), []);
  const surfaceMaterial = useMemo(() => albedo.texture && normal.texture && roughness.texture && cloudAlpha.texture && night.texture && nightMask.texture
    ? new THREE.ShaderMaterial({
      vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
      fragmentShader: EARTH_SURFACE_FRAGMENT_V590,
      uniforms: {
        uAlbedo: { value: albedo.texture },
        uNormal: { value: normal.texture },
        uRoughness: { value: roughness.texture },
        uCloudAlpha: { value: cloudAlpha.texture },
        uNight: { value: night.texture },
        uNightMask: { value: nightMask.texture },
        uSunWorld: { value: SUN_WORLD_V590.clone() },
        uSunLocal: { value: new THREE.Vector3() },
        uScience: { value: profile.mode === "science" ? 1 : 0 },
      },
      toneMapped: profile.mode === "cinematic",
    }) : null,
  [albedo.texture, cloudAlpha.texture, night.texture, nightMask.texture, normal.texture, profile.mode, roughness.texture]);
  const cloudMaterial = useMemo(() => clouds.texture && cloudAlpha.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: EARTH_CLOUD_FRAGMENT_V590,
    uniforms: {
      uClouds: { value: clouds.texture },
      uCloudAlpha: { value: cloudAlpha.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }) : null, [cloudAlpha.texture, clouds.texture, profile.mode]);
  const atmosphereMaterial = useAtmosphereMaterialV590({
    profile,
    rayleigh: "#4da5dc",
    mie: "#d8edf3",
    density: profile.mode === "science" ? 0.22 : 0.48,
  });
  useFrame(() => {
    if (!group.current || !surfaceMaterial) return;
    group.current.updateWorldMatrix(true, false);
    sunLocal.copy(SUN_WORLD_V590);
    group.current.worldToLocal(sunLocal);
    surfaceMaterial.uniforms.uSunLocal.value.copy(sunLocal);
  });
  useEffect(() => () => {
    surfaceMaterial?.dispose();
    cloudMaterial?.dispose();
  }, [cloudMaterial, surfaceMaterial]);
  const states = [albedo, normal, roughness, clouds, cloudAlpha, night, nightMask] as const;
  const receipt = textureReceiptV590(states);
  useBodyAuditV590({ active: auditActive, bodyId: "earth", admission, material: spec.material, focused, profile, textureReceipt: receipt });
  if (!enabled || states.some((state) => !state.texture) || !surfaceMaterial || !cloudMaterial) {
    return <BlockedBodyProxyV590 bodyId="earth" admission={admission} reason={enabled ? receipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group
      ref={group}
      rotation={[0, deterministicBodyPhaseV590("earth"), 0]}
      userData={{ atlasCandidate: "v590", atlasHeroBodyV590: "earth", atlasAdmission: admission, atlasProceduralFallback: false }}
    >
      <mesh material={surfaceMaterial} castShadow receiveShadow>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh material={cloudMaterial} scale={1.009} castShadow renderOrder={3}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh material={atmosphereMaterial} scale={1.034} renderOrder={6}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
    </group>
  );
}

type RockyBodyIdV590 = "mercury" | "moon" | "mars";

function RockyBodyV590(props: HeroVisualPropsV590 & { bodyId: RockyBodyIdV590 }) {
  const { bodyId, profile, admission, focused, auditActive } = props;
  const spec = HERO_BODY_SPEC_BY_ID_V590[bodyId];
  const tier = qualityDeliveryTierV590(profile, focused);
  const enabled = admission === "admitted";
  const albedo = useV590Texture(`${bodyId}-albedo`, tier, profile.deviceTier, enabled);
  const normal = useV590Texture(`${bodyId}-normal`, tier, profile.deviceTier, enabled);
  const roughness = useV590Texture(`${bodyId}-roughness`, tier, profile.deviceTier, enabled);
  const material = useMemo(() => albedo.texture && normal.texture && roughness.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: ROCKY_SURFACE_FRAGMENT_V590,
    uniforms: {
      uAlbedo: { value: albedo.texture },
      uNormal: { value: normal.texture },
      uRoughness: { value: roughness.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uRelief: { value: bodyId === "moon" ? 0.42 : bodyId === "mercury" ? 0.34 : 0.24 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [albedo.texture, bodyId, normal.texture, profile.mode, roughness.texture]);
  const marsAtmosphere = useAtmosphereMaterialV590({
    profile,
    rayleigh: "#b85832",
    mie: "#e3a36c",
    density: bodyId === "mars" ? (profile.mode === "science" ? 0.045 : 0.085) : 0,
  });
  useEffect(() => () => material?.dispose(), [material]);
  const states = [albedo, normal, roughness] as const;
  const receipt = textureReceiptV590(states);
  useBodyAuditV590({ active: auditActive, bodyId, admission, material: spec.material, focused, profile, textureReceipt: receipt });
  if (!enabled || states.some((state) => !state.texture) || !material) {
    return <BlockedBodyProxyV590 bodyId={bodyId} admission={admission} reason={enabled ? receipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group
      rotation={[0, deterministicBodyPhaseV590(bodyId), 0]}
      userData={{ atlasCandidate: "v590", atlasHeroBodyV590: bodyId, atlasAdmission: admission, atlasProceduralFallback: false }}
    >
      <mesh material={material} castShadow receiveShadow>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      {bodyId === "mars" ? (
        <mesh material={marsAtmosphere} scale={1.018} renderOrder={6}>
          <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
        </mesh>
      ) : null}
    </group>
  );
}

function VenusV590({ profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590.venus;
  const tier = qualityDeliveryTierV590(profile, focused);
  const enabled = admission === "admitted";
  const surface = useV590Texture("venus-surface", tier, profile.deviceTier, enabled);
  const clouds = useV590Texture("venus-clouds", tier, profile.deviceTier, enabled);
  const material = useMemo(() => surface.texture && clouds.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: VENUS_SURFACE_FRAGMENT_V590,
    uniforms: {
      uSurface: { value: surface.texture },
      uClouds: { value: clouds.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
      uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V590 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [clouds.texture, profile.mode, surface.texture]);
  const atmosphere = useAtmosphereMaterialV590({
    profile,
    rayleigh: "#d59a4b",
    mie: "#fff0b0",
    density: profile.mode === "science" ? 0.34 : 0.62,
  });
  useEffect(() => () => material?.dispose(), [material]);
  const states = [surface, clouds] as const;
  const receipt = textureReceiptV590(states);
  useBodyAuditV590({ active: auditActive, bodyId: "venus", admission, material: spec.material, focused, profile, textureReceipt: receipt });
  if (!enabled || states.some((state) => !state.texture) || !material) {
    return <BlockedBodyProxyV590 bodyId="venus" admission={admission} reason={enabled ? receipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group rotation={[0, deterministicBodyPhaseV590("venus"), 0]} userData={{ atlasCandidate: "v590", atlasHeroBodyV590: "venus", atlasAdmission: admission, atlasProceduralFallback: false }}>
      <mesh material={material}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh material={atmosphere} scale={1.028} renderOrder={6}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
    </group>
  );
}

function JupiterV590({ profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590.jupiter;
  const tier = qualityDeliveryTierV590(profile, focused);
  const enabled = admission === "admitted";
  const albedo = useV590Texture("jupiter-albedo", tier, profile.deviceTier, enabled);
  const bands = useV590Texture("jupiter-band-mask", tier, profile.deviceTier, enabled);
  const material = useMemo(() => albedo.texture && bands.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: GAS_GIANT_FRAGMENT_V590,
    uniforms: {
      uAlbedo: { value: albedo.texture },
      uBands: { value: bands.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uFlowPhase: { value: CELESTIAL_PRESENTATION_EPOCH_V590 * 0.002 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [albedo.texture, bands.texture, profile.mode]);
  const atmosphere = useAtmosphereMaterialV590({
    profile,
    rayleigh: "#c48559",
    mie: "#f1d4a6",
    density: profile.mode === "science" ? 0.08 : 0.16,
  });
  useEffect(() => () => material?.dispose(), [material]);
  const states = [albedo, bands] as const;
  const receipt = textureReceiptV590(states);
  useBodyAuditV590({ active: auditActive, bodyId: "jupiter", admission, material: spec.material, focused, profile, textureReceipt: receipt });
  if (!enabled || states.some((state) => !state.texture) || !material) {
    return <BlockedBodyProxyV590 bodyId="jupiter" admission={admission} reason={enabled ? receipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group rotation={[0, deterministicBodyPhaseV590("jupiter"), 0]} userData={{ atlasCandidate: "v590", atlasHeroBodyV590: "jupiter", atlasAdmission: admission, atlasProceduralFallback: false }}>
      <mesh material={material} scale={[1.026, 0.962, 1.026]} castShadow receiveShadow>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh material={atmosphere} scale={[1.036, 0.974, 1.036]} renderOrder={6}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
    </group>
  );
}

function SaturnV590({ profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590.saturn;
  const tier = qualityDeliveryTierV590(profile, focused);
  const enabled = admission === "admitted";
  const albedo = useV590Texture("saturn-albedo", tier, profile.deviceTier, enabled);
  const bands = useV590Texture("saturn-band-mask", tier, profile.deviceTier, enabled);
  const ringColor = useV590Texture("saturn-ring-color", tier, profile.deviceTier, enabled);
  const ringAlpha = useV590Texture("saturn-ring-alpha", tier, profile.deviceTier, enabled);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const sunLocal = useMemo(() => new THREE.Vector3(), []);
  const innerRadius = spec.radius * 1.25;
  const outerRadius = spec.radius * 2.35;
  const ringGeometry = useMemo(() => createRadialRingGeometryV590(
    innerRadius,
    outerRadius,
    focused ? (profile.deviceTier === "mobile" ? 288 : 480) : 176,
    focused ? 8 : 4,
  ), [focused, innerRadius, outerRadius, profile.deviceTier]);
  const planetMaterial = useMemo(() => albedo.texture && bands.texture && ringAlpha.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: SATURN_PLANET_FRAGMENT_V590,
    uniforms: {
      uAlbedo: { value: albedo.texture },
      uBands: { value: bands.texture },
      uRingOpticalDepth: { value: ringAlpha.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uSunLocal: { value: new THREE.Vector3() },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [albedo.texture, bands.texture, innerRadius, outerRadius, profile.mode, ringAlpha.texture]);
  const ringMaterial = useMemo(() => ringColor.texture && ringAlpha.texture ? new THREE.ShaderMaterial({
    vertexShader: RADIAL_RING_VERTEX_V590,
    fragmentShader: SATURN_RING_FRAGMENT_V590,
    uniforms: {
      uRingColor: { value: ringColor.texture },
      uRingOpticalDepth: { value: ringAlpha.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uSunLocal: { value: new THREE.Vector3() },
      uCameraWorld: { value: new THREE.Vector3() },
      uPlanetRadius: { value: spec.radius },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    premultipliedAlpha: true,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }) : null, [profile.mode, ringAlpha.texture, ringColor.texture, spec.radius]);
  const atmosphere = useAtmosphereMaterialV590({
    profile,
    rayleigh: "#cbb37d",
    mie: "#efe0b5",
    density: profile.mode === "science" ? 0.055 : 0.12,
  });
  useFrame(() => {
    if (!group.current) return;
    group.current.updateWorldMatrix(true, false);
    sunLocal.copy(SUN_WORLD_V590);
    group.current.worldToLocal(sunLocal);
    planetMaterial?.uniforms.uSunLocal.value.copy(sunLocal);
    ringMaterial?.uniforms.uSunLocal.value.copy(sunLocal);
    ringMaterial?.uniforms.uCameraWorld.value.copy(camera.position);
  });
  useEffect(() => () => {
    disposeAfterDetachV590(ringGeometry);
    planetMaterial?.dispose();
    ringMaterial?.dispose();
  }, [planetMaterial, ringGeometry, ringMaterial]);
  const states = [albedo, bands, ringColor, ringAlpha] as const;
  const receipt = textureReceiptV590(states);
  useBodyAuditV590({ active: auditActive, bodyId: "saturn", admission, material: spec.material, focused, profile, textureReceipt: receipt });
  if (!enabled || states.some((state) => !state.texture) || !planetMaterial || !ringMaterial) {
    return <BlockedBodyProxyV590 bodyId="saturn" admission={admission} reason={enabled ? receipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group
      ref={group}
      rotation={[0, deterministicBodyPhaseV590("saturn"), 0]}
      userData={{ atlasCandidate: "v590", atlasHeroBodyV590: "saturn", atlasAdmission: admission, atlasProceduralFallback: false }}
    >
      <mesh material={planetMaterial} scale={[1.032, 0.956, 1.032]} renderOrder={2} castShadow receiveShadow>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh geometry={ringGeometry} material={ringMaterial} renderOrder={3} frustumCulled={false} />
      <mesh material={atmosphere} scale={[1.04, 0.968, 1.04]} renderOrder={6}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
    </group>
  );
}

function IceGiantV590({ bodyId, profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590[bodyId];
  const isUranus = bodyId === "uranus";
  const enabled = admission === "admitted" && (bodyId === "uranus" || bodyId === "neptune");
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: ICE_GIANT_FRAGMENT_V590,
    uniforms: {
      uDeepColor: { value: new THREE.Color(isUranus ? "#5ba7a8" : "#102e83") },
      uCloudColor: { value: new THREE.Color(isUranus ? "#b2e4dd" : "#4c82d4") },
      uStormColor: { value: new THREE.Color(isUranus ? "#d7f0e9" : "#bdd1ea") },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uBandFrequency: { value: isUranus ? 29 : 42 },
      uStormLatitude: { value: isUranus ? 0.48 : -0.34 },
      uStormStrength: { value: isUranus ? 0.24 : 0.92 },
      uEpoch: { value: CELESTIAL_PRESENTATION_EPOCH_V590 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }), [isUranus, profile.mode]);
  const atmosphere = useAtmosphereMaterialV590({
    profile,
    rayleigh: isUranus ? "#63c9c5" : "#295dca",
    mie: isUranus ? "#c8efea" : "#7ca9ec",
    density: profile.mode === "science" ? 0.08 : 0.16,
  });
  const innerRadius = spec.radius * (isUranus ? 1.45 : 1.28);
  const outerRadius = spec.radius * (isUranus ? 2.05 : 1.62);
  const ringGeometry = useMemo(() => createRadialRingGeometryV590(innerRadius, outerRadius, focused ? 224 : 112, 3),
    [focused, innerRadius, outerRadius]);
  const ringMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: RADIAL_RING_VERTEX_V590,
    fragmentShader: ICE_RING_FRAGMENT_V590,
    uniforms: {
      uColor: { value: new THREE.Color(isUranus ? "#9fc8bd" : "#587ca4") },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uOpacity: { value: isUranus ? (profile.mode === "science" ? 0.18 : 0.31) : (profile.mode === "science" ? 0.07 : 0.13) },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    premultipliedAlpha: true,
    blending: THREE.NormalBlending,
    toneMapped: profile.mode === "cinematic",
  }), [isUranus, profile.mode]);
  useEffect(() => () => {
    material.dispose();
    ringMaterial.dispose();
    disposeAfterDetachV590(ringGeometry);
  }, [material, ringGeometry, ringMaterial]);
  useBodyAuditV590({ active: auditActive, bodyId, admission, material: spec.material, focused, profile, textureReceipt: "procedural-primary" });
  if (!enabled) {
    return <BlockedBodyProxyV590 bodyId={bodyId} admission={admission} reason="procedural-primary-not-admitted" auditActive={auditActive} profile={profile} />;
  }
  return (
    <group
      rotation={[0, deterministicBodyPhaseV590(bodyId), 0]}
      userData={{ atlasCandidate: "v590", atlasHeroBodyV590: bodyId, atlasAdmission: admission, atlasProceduralPrimary: true, atlasProceduralFallback: false }}
    >
      <mesh material={material} scale={[1.014, 0.985, 1.014]}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
      <mesh geometry={ringGeometry} material={ringMaterial} renderOrder={3} />
      <mesh material={atmosphere} scale={1.025} renderOrder={6}>
        <SphereGeometryV590 radius={spec.radius} focused={focused} mobile={profile.deviceTier === "mobile"} />
      </mesh>
    </group>
  );
}

function BennuV590({ profile, admission, focused, auditActive }: HeroVisualPropsV590) {
  const spec = HERO_BODY_SPEC_BY_ID_V590.bennu;
  const enabled = admission === "admitted";
  const tier = qualityDeliveryTierV590(profile, focused);
  const preferredLod: 0 | 1 | 2 = focused ? (profile.deviceTier === "mobile" ? 1 : 0) : 2;
  // v590 reuses the byte-locked v589 Bennu GLB as an explicitly recorded
  // read-only dependency.  The model loader verifies that historical SHA and
  // never rewrites its manifest identity.
  const model = useV589Model("bennu-model", tier, profile.deviceTier, preferredLod, enabled);
  const diffuse = useV590Texture("regolith-cc0", tier, profile.deviceTier, enabled);
  const normal = useV590Texture("regolith-normal-cc0", tier, profile.deviceTier, enabled);
  const roughness = useV590Texture("regolith-roughness-cc0", tier, profile.deviceTier, enabled);
  const material = useMemo(() => diffuse.texture && normal.texture && roughness.texture ? new THREE.ShaderMaterial({
    vertexShader: CELESTIAL_SURFACE_VERTEX_V590,
    fragmentShader: REGOLITH_FRAGMENT_V590,
    uniforms: {
      uDiffuse: { value: diffuse.texture },
      uNormal: { value: normal.texture },
      uRoughness: { value: roughness.texture },
      uSunWorld: { value: SUN_WORLD_V590.clone() },
      uScale: { value: profile.deviceTier === "mobile" ? 1.8 : 2.5 },
      uScience: { value: profile.mode === "science" ? 1 : 0 },
    },
    toneMapped: profile.mode === "cinematic",
  }) : null, [diffuse.texture, normal.texture, profile.deviceTier, profile.mode, roughness.texture]);
  useEffect(() => () => material?.dispose(), [material]);
  useEffect(() => {
    if (!model.scene || !material) return;
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    model.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      originals.set(object, object.material);
      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return () => originals.forEach((original, mesh) => { mesh.material = original; });
  }, [material, model.scene]);
  const textureReceipt = `${textureReceiptV590([diffuse, normal, roughness])}|model:${model.status}:${model.lod ?? "none"}:${model.sha256}`;
  useBodyAuditV590({
    active: auditActive,
    bodyId: "bennu",
    admission,
    material: spec.material,
    focused,
    profile,
    textureReceipt,
    inheritedDependency: "v589:bennu-model:readonly",
    modelLod: model.lod,
  });
  if (!enabled || !model.scene || !material || !diffuse.texture || !normal.texture || !roughness.texture) {
    return <BlockedBodyProxyV590 bodyId="bennu" admission={admission} reason={enabled ? textureReceipt : "admission"} auditActive={auditActive} profile={profile} />;
  }
  return (
    <group
      rotation={[0, deterministicBodyPhaseV590("bennu"), 0]}
      userData={{
        atlasCandidate: "v590",
        atlasHeroBodyV590: "bennu",
        atlasAdmission: admission,
        atlasModelLod: model.lod,
        atlasInheritedDependency: "v589-bennu-model-readonly",
        atlasProceduralFallback: false,
      }}
    >
      <primitive object={model.scene} scale={spec.radius} />
    </group>
  );
}

function HeroVisualV590(props: HeroVisualPropsV590) {
  if (props.bodyId === "sun") return <SunV590 {...props} />;
  if (props.bodyId === "earth") return <EarthV590 {...props} />;
  if (props.bodyId === "venus") return <VenusV590 {...props} />;
  if (props.bodyId === "jupiter") return <JupiterV590 {...props} />;
  if (props.bodyId === "saturn") return <SaturnV590 {...props} />;
  if (props.bodyId === "uranus" || props.bodyId === "neptune") return <IceGiantV590 {...props} />;
  if (props.bodyId === "mercury" || props.bodyId === "moon" || props.bodyId === "mars") {
    return <RockyBodyV590 {...props} bodyId={props.bodyId} />;
  }
  if (props.bodyId === "bennu") return <BennuV590 {...props} />;
  return (
    <BlockedBodyProxyV590
      bodyId={props.bodyId}
      admission={props.admission}
      reason={props.admission === "asset-blocked" ? "asset-admission" : "v590-model-renderer-not-admitted"}
      auditActive={props.auditActive}
      profile={props.profile}
    />
  );
}

export default function CelestialBodiesV590({
  profile,
  admissions,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  admissions: Record<HeroBodyIdV590, HeroAssetAdmissionV590>;
  focusTarget: CelestialFocusTargetV590;
}>) {
  const planetaryFocus = planetaryFocusTargetV590(focusTarget);
  return (
    <group
      userData={{
        atlasCandidate: "v590",
        atlasCelestialBodiesV590: true,
        atlasHeroCount: 16,
        atlasSingleCanvas: true,
        atlasDeterministicLighting: "sun-world-origin",
        atlasPresentationEpoch: profile.presentationEpoch,
        atlasScientificPayloadMutation: false,
      }}
    >
      {HERO_BODY_SPECS_V590.map((spec) => {
        if (planetaryFocus === null) return null;
        const focused = planetaryFocus === spec.id;
        if (planetaryFocus !== "overview" && !focused) return null;
        const orbit = CELESTIAL_ORBIT_BY_ID_V590[spec.id];
        const position = celestialOrbitPointV590(orbit, orbit.phaseRad);
        const auditActive = focused || (planetaryFocus === "overview" && profile.selectedBody === spec.id);
        return (
          <group
            key={spec.id}
            position={position as [number, number, number]}
            rotation={[0, 0, spec.axialTiltRad]}
            scale={focused ? 1.28 : 1}
            userData={{
              atlasCandidate: "v590",
              atlasHeroPlacement: spec.id,
              atlasSolarTerminator: "world-origin",
              atlasPresentationOnly: true,
            }}
          >
            <HeroVisualV590
              bodyId={spec.id}
              profile={profile}
              admission={admissions[spec.id]}
              focused={focused}
              auditActive={auditActive}
            />
          </group>
        );
      })}
    </group>
  );
}
