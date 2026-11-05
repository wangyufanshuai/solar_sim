"use client";

import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { CONSTELLATION_SPHERE_RADIUS_V590, raDecToCelestialPositionV590 } from "../lib/celestialDeepSpaceV590";
import type { CelestialRenderProfileV590 } from "../lib/celestialRenderingV590";
import {
  DEEP_SPACE_REFERENCE_BY_ID_V592,
  DEEP_SPACE_REFERENCE_OBJECTS_V592,
  DEEP_SPACE_REFERENCE_PACKET_SHA256_V592,
  isDeepSpaceReferenceIdV592,
  type DeepSpaceReferenceObjectV592,
} from "../lib/deepSpaceReferenceV592";
import {
  DEEP_SPACE_VISUAL_ASSETS_V592,
  DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
  isDeepSpaceVisualIdV592,
  type DeepSpaceVisualAssetV592,
} from "../lib/deepSpaceVisualAssetsV592";
import type { LivingUniverseFocusTargetV592 } from "../lib/nebulaVisualAssetsV592";
import {
  useDeepSpaceVisualTextureV592,
  type DeepSpaceVisualTextureStateV592,
} from "../lib/useDeepSpaceVisualTextureV592";

const DEEP_SPACE_MARKER_RADIUS_V592 = CONSTELLATION_SPHERE_RADIUS_V590 - 1.35;

function frameV592(entry: DeepSpaceReferenceObjectV592): Readonly<{
  direction: THREE.Vector3;
  center: THREE.Vector3;
  major: THREE.Vector3;
  minor: THREE.Vector3;
  majorRadius: number;
  minorRadius: number;
}> {
  const direction = new THREE.Vector3(...raDecToCelestialPositionV590(entry.raDeg, entry.decDeg, 1)).normalize();
  const center = direction.clone().multiplyScalar(DEEP_SPACE_MARKER_RADIUS_V592);
  const reference = Math.abs(direction.y) < 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const east = new THREE.Vector3().crossVectors(reference, direction).normalize();
  const north = new THREE.Vector3().crossVectors(direction, east).normalize();
  const pa = THREE.MathUtils.degToRad(entry.angularSize.positionAngleDeg ?? 0);
  const major = north.clone().multiplyScalar(Math.cos(pa)).addScaledVector(east, Math.sin(pa)).normalize();
  const minor = new THREE.Vector3().crossVectors(direction, major).normalize();
  const majorRadius = Math.max(
    0.16,
    Math.tan(THREE.MathUtils.degToRad(entry.angularSize.majorArcmin / 120)) * DEEP_SPACE_MARKER_RADIUS_V592,
  );
  const minorRadius = Math.max(
    0.12,
    Math.tan(THREE.MathUtils.degToRad(entry.angularSize.minorArcmin / 120)) * DEEP_SPACE_MARKER_RADIUS_V592,
  );
  return { direction, center, major, minor, majorRadius, minorRadius };
}

function markerPositionsV592(entries: readonly DeepSpaceReferenceObjectV592[], selected: boolean): Float32Array {
  const positions: number[] = [];
  for (const entry of entries) {
    const frame = frameV592(entry);
    const segments = selected ? 64 : 32;
    for (let index = 0; index < segments; index += 1) {
      const first = index / segments * Math.PI * 2;
      const second = (index + 1) / segments * Math.PI * 2;
      positions.push(
        ...frame.center.clone().addScaledVector(frame.major, Math.cos(first) * frame.majorRadius).addScaledVector(frame.minor, Math.sin(first) * frame.minorRadius).toArray(),
        ...frame.center.clone().addScaledVector(frame.major, Math.cos(second) * frame.majorRadius).addScaledVector(frame.minor, Math.sin(second) * frame.minorRadius).toArray(),
      );
    }
    if (selected) {
      positions.push(
        ...frame.center.clone().addScaledVector(frame.major, -frame.majorRadius * 1.24).toArray(),
        ...frame.center.clone().addScaledVector(frame.major, frame.majorRadius * 1.24).toArray(),
        ...frame.center.clone().addScaledVector(frame.minor, -frame.minorRadius * 1.24).toArray(),
        ...frame.center.clone().addScaledVector(frame.minor, frame.minorRadius * 1.24).toArray(),
      );
    }
  }
  return new Float32Array(positions);
}

function geometryV592(positions: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

type DeepSpaceSliceStatusV592 = DeepSpaceVisualTextureStateV592["status"];
type DeepSpaceSliceTelemetryV592 = Readonly<{
  status: DeepSpaceSliceStatusV592;
  source: DeepSpaceVisualTextureStateV592["source"];
  fullQualityGate: DeepSpaceVisualTextureStateV592["fullQualityGate"];
  sha256: string;
}>;

type DeepSpaceRasterVisualAssetV592 = DeepSpaceVisualAssetV592 & Readonly<{
  variants: NonNullable<DeepSpaceVisualAssetV592["variants"]>;
}>;

function deepSpaceVisualWidthV592(
  frame: ReturnType<typeof frameV592>,
  asset: DeepSpaceRasterVisualAssetV592,
): number {
  const selectionRadiusDeg = asset.catalogSelection?.selectionRadiusDeg;
  if (asset.catalogDerivedVisualModel && typeof selectionRadiusDeg === "number") {
    // Gaia cluster rasters cover the complete deterministic catalog aperture,
    // not only the catalogued cluster diameter.  Preserve that angular scale
    // on the J2000 sphere so the central cluster is neither compressed nor
    // presented at a fabricated size.
    const apertureRadiusRad = THREE.MathUtils.degToRad(selectionRadiusDeg);
    return Math.max(0.9, Math.tan(apertureRadiusRad) * DEEP_SPACE_MARKER_RADIUS_V592 * 2);
  }
  return Math.max(0.9, frame.majorRadius * 3.8);
}

const OPEN_NGC_GALAXY_PROFILE_INDEX_V592 = Object.freeze({
  "lenticular-dust-lane": 0,
  "edge-on-starburst": 1,
  "grand-design-spiral": 2,
  "elliptical-sersic": 3,
  "early-spiral-dust-eye": 4,
  "flocculent-spiral": 5,
} as const);

const OPEN_NGC_GALAXY_VERTEX_SHADER_V592 = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const OPEN_NGC_GALAXY_FRAGMENT_SHADER_V592 = /* glsl */ `
  varying vec2 vUv;
  uniform float uProfile;
  uniform float uArmCount;
  uniform float uPitchAngleDeg;
  uniform float uBulgeFraction;
  uniform float uDustStrength;
  uniform float uStarFormingStrength;
  uniform float uTurbulenceStrength;
  uniform float uSeed;
  uniform float uColorIndexBV;

  float hash21(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7)) + uSeed * 91.73) * 43758.5453123);
  }

  float valueNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.56;
    mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);
    for (int octave = 0; octave < 4; octave += 1) {
      value += amplitude * valueNoise(point);
      point = rotation * point * 2.03 + vec2(7.1, 3.7);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 point = (vUv - 0.5) * 2.0;
    float radius = length(point);
    float theta = atan(point.y, point.x);
    float pitch = max(0.13, tan(radians(max(1.0, uPitchAngleDeg))));
    float spiralPhase = theta * max(1.0, uArmCount) - log(radius + 0.075) / pitch;
    float armCore = uArmCount > 0.5 ? pow(0.5 + 0.5 * cos(spiralPhase), 7.0) : 0.0;
    float armDust = uArmCount > 0.5 ? pow(0.5 + 0.5 * cos(spiralPhase + 0.46), 11.0) : 0.0;
    float structure = fbm(point * (7.0 + uTurbulenceStrength * 8.0) + uSeed * 13.0);
    float fineStructure = fbm(point * 23.0 - uSeed * 17.0);
    float envelope = 1.0 - smoothstep(0.72, 1.08, radius);
    float disk = exp(-radius * 3.25) * envelope;
    float bulge = exp(-3.4 * pow(max(radius, 0.001), 0.54));
    float armEmission = armCore * disk * (0.58 + structure * 0.72);
    float knots = pow(max(0.0, fineStructure - 0.48), 4.0) * armEmission * 8.0;
    float dust = armDust * disk * uDustStrength * (0.35 + 0.65 * structure);
    float intensity = mix(disk + armEmission * 1.28, bulge * 1.6 + disk * 0.34, uBulgeFraction);

    float centralLane = exp(-pow(abs(point.y + 0.035 * sin(point.x * 8.0 + uSeed * 5.0)) / (0.025 + 0.055 * radius), 2.0))
      * (1.0 - smoothstep(0.72, 0.96, abs(point.x)));
    float eyeLane = exp(-pow((radius - 0.29) / 0.052, 2.0)) * smoothstep(-0.55, 0.42, point.x);
    float starburstPlume = exp(-abs(point.x) / (0.045 + abs(point.y) * 0.31))
      * smoothstep(0.07, 0.88, abs(point.y)) * (1.0 - smoothstep(0.65, 1.06, abs(point.y)));

    if (uProfile < 1.5) {
      intensity = bulge * (0.72 + uBulgeFraction) + exp(-abs(point.y) * 13.0 - abs(point.x) * 2.4) * 0.76;
      dust += centralLane * uDustStrength * 0.92;
      if (uProfile > 0.5) {
        intensity += exp(-abs(point.y) * 8.5 - abs(point.x) * 2.0) * (0.32 + structure * 0.36);
        knots += starburstPlume * uStarFormingStrength * (0.34 + 0.66 * fineStructure) * 1.8;
      }
    } else if (uProfile > 2.5 && uProfile < 3.5) {
      intensity = bulge * 1.55 + exp(-radius * 2.3) * 0.16;
      dust *= 0.06;
      knots *= 0.04;
    } else if (uProfile > 3.5 && uProfile < 4.5) {
      dust += eyeLane * uDustStrength * 0.84;
      intensity += bulge * 0.48;
    } else if (uProfile > 4.5) {
      armEmission *= 0.55 + structure * 1.25;
      intensity += armEmission * 0.88;
      dust *= 0.55 + 0.8 * structure;
      knots *= 0.72 + uTurbulenceStrength;
    }

    intensity *= max(0.0, 1.0 - dust * 0.82);
    float warmMix = smoothstep(-0.15, 1.35, uColorIndexBV);
    vec3 oldStars = mix(vec3(0.56, 0.70, 1.0), vec3(1.0, 0.72, 0.42), warmMix);
    vec3 diskStars = mix(vec3(0.48, 0.68, 1.0), vec3(0.94, 0.82, 0.62), warmMix * 0.72);
    vec3 youngStars = vec3(0.38, 0.67, 1.0);
    vec3 starburstGas = vec3(1.0, 0.25, 0.11);
    vec3 color = diskStars * max(0.0, intensity - bulge * uBulgeFraction * 0.38)
      + oldStars * bulge * (0.55 + uBulgeFraction)
      + youngStars * knots * uStarFormingStrength * 1.45;
    if (uProfile > 0.5 && uProfile < 1.5) color += starburstGas * starburstPlume * uStarFormingStrength * 0.9;
    color *= 0.72 + 0.28 * structure;
    color = color / (vec3(1.0) + color * 0.7);
    float alpha = (1.0 - exp(-max(0.0, intensity + knots * 0.38) * 2.2)) * envelope;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

const GAIA_CLUSTER_VERTEX_SHADER_V592 = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GAIA_CLUSTER_FRAGMENT_SHADER_V592 = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform vec2 uTexel;
  uniform float uGain;

  void main() {
    // The catalog raster stores a sparse, physically weighted alpha field.
    // Reconstruct a deterministic circular PSF from admitted pixels. A
    // Gaussian-weighted 7x7 footprint avoids the square dilation artifacts
    // of a max filter while preserving every Gaia source position and color.
    float strongestCore = 0.0;
    float halo = 0.0;
    float colorWeight = 0.0;
    vec3 strongestColor = vec3(1.0);
    vec3 weightedColor = vec3(0.0);
    for (int y = -3; y <= 3; y += 1) {
      for (int x = -3; x <= 3; x += 1) {
        vec2 offset = vec2(float(x), float(y)) * uTexel;
        vec4 sampleValue = texture2D(uMap, clamp(vUv + offset, 0.001, 0.999));
        float radiusSquared = float(x * x + y * y);
        float coreWeight = exp(-radiusSquared * 0.62);
        float haloWeight = exp(-radiusSquared * 0.19);
        float core = sampleValue.a * coreWeight;
        if (core > strongestCore) {
          strongestCore = core;
          strongestColor = sampleValue.rgb;
        }
        halo += sampleValue.a * haloWeight;
        weightedColor += sampleValue.rgb * sampleValue.a * haloWeight;
        colorWeight += sampleValue.a * haloWeight;
      }
    }
    float alpha = clamp(strongestCore * uGain + halo * uGain * 0.075, 0.0, 0.86);
    if (alpha < 0.003) discard;
    vec3 haloColor = colorWeight > 0.0 ? weightedColor / colorWeight : strongestColor;
    vec3 color = mix(haloColor, strongestColor, smoothstep(0.08, 0.72, strongestCore * uGain));
    color = max(color, vec3(0.0)) * (1.0 + alpha * 1.1);
    gl_FragColor = vec4(color, alpha);
  }
`;

function isDeepSpaceRasterVisualAssetV592(asset: DeepSpaceVisualAssetV592): asset is DeepSpaceRasterVisualAssetV592 {
  return asset.visualModelKind !== "openngc-catalog-derived-galaxy-analytic" && asset.variants !== undefined;
}

function DeepSpaceAnalyticGalaxyV592({
  entry,
  asset,
}: Readonly<{
  entry: DeepSpaceReferenceObjectV592;
  asset: DeepSpaceVisualAssetV592;
}>) {
  const frame = useMemo(() => frameV592(entry), [entry]);
  const analyticModel = asset.analyticModel;
  const catalogSelection = asset.catalogSelection;
  const geometry = useMemo(() => {
    const width = Math.max(0.9, frame.majorRadius * 3.8);
    const height = Math.max(0.5, frame.minorRadius * 3.8);
    const next = new THREE.PlaneGeometry(width, height, 1, 1);
    next.applyMatrix4(new THREE.Matrix4().makeBasis(frame.major, frame.minor, frame.direction));
    next.translate(frame.center.x, frame.center.y, frame.center.z);
    next.computeBoundingSphere();
    return next;
  }, [frame]);
  const material = useMemo(() => {
    if (!analyticModel || !catalogSelection) return null;
    return new THREE.ShaderMaterial({
      vertexShader: OPEN_NGC_GALAXY_VERTEX_SHADER_V592,
      fragmentShader: OPEN_NGC_GALAXY_FRAGMENT_SHADER_V592,
      uniforms: {
        uProfile: { value: OPEN_NGC_GALAXY_PROFILE_INDEX_V592[analyticModel.profileKind] },
        uArmCount: { value: analyticModel.armCount },
        uPitchAngleDeg: { value: analyticModel.pitchAngleDeg },
        uBulgeFraction: { value: analyticModel.bulgeFraction },
        uDustStrength: { value: analyticModel.dustStrength },
        uStarFormingStrength: { value: analyticModel.starFormingStrength },
        uTurbulenceStrength: { value: analyticModel.turbulenceStrength },
        uSeed: { value: analyticModel.deterministicSeed },
        uColorIndexBV: { value: catalogSelection.colorIndexBV ?? 0.8 },
      },
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      premultipliedAlpha: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  }, [analyticModel, catalogSelection]);

  useEffect(() => {
    const position = geometry.getAttribute("position");
    const release = acquireAtlasResource("model", "atlas", `v592-openngc-analytic-galaxy-${asset.target}`, {
      owner: "v592-deep-space-openngc-analytic-runtime",
      estimatedBytes: position?.array.byteLength ?? 0,
      manifestSha256: DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
    });
    return () => {
      release();
      geometry.dispose();
      material?.dispose();
    };
  }, [asset.target, geometry, material]);

  if (!material || !analyticModel || !catalogSelection) return null;
  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-770}
      frustumCulled={false}
      userData={{
        atlasCandidate: "v592",
        atlasLayer: "j2000-focused-openngc-catalog-derived-galaxy",
        atlasDeepSpaceObject: asset.target,
        atlasOpenNgcId: catalogSelection.openNgcId,
        atlasHubbleType: catalogSelection.hubbleType,
        atlasAnalyticShaderVersion: analyticModel.shaderVersion,
        atlasObservationImageClaim: false,
        atlasCatalogDerivedVisualModel: true,
        atlasNakedEyeRepresentationClaimed: false,
        atlasPresentationOnly: true,
        atlasScientificAuthority: false,
        atlasScientificPayloadWriteback: false,
      }}
    />
  );
}

function DeepSpaceVisualSliceV592({
  entry,
  asset,
  depthIndex,
  profile,
  onStatus,
}: Readonly<{
  entry: DeepSpaceReferenceObjectV592;
  asset: DeepSpaceRasterVisualAssetV592;
  depthIndex: number;
  profile: CelestialRenderProfileV590;
  onStatus: (key: string, telemetry: DeepSpaceSliceTelemetryV592 | null) => void;
}>) {
  const state = useDeepSpaceVisualTextureV592(
    asset.target,
    depthIndex,
    profile.deliveryTier,
    profile.deviceTier,
    profile.mode === "cinematic",
  );
  const frame = useMemo(() => frameV592(entry), [entry]);
  const tier = profile.deliveryTier === "vercel-lite"
    ? asset.variants.lite
    : profile.deviceTier === "mobile" ? asset.variants.mobile : asset.variants.desktop;
  const slice = tier.slices[depthIndex];
  const geometry = useMemo(() => {
    const width = deepSpaceVisualWidthV592(frame, asset);
    const height = width / tier.aspect;
    const next = new THREE.PlaneGeometry(width, height, 1, 1);
    next.applyMatrix4(new THREE.Matrix4().makeBasis(frame.major, frame.minor, frame.direction));
    next.translate(
      frame.center.x + frame.direction.x * (slice?.depthOffset ?? 0),
      frame.center.y + frame.direction.y * (slice?.depthOffset ?? 0),
      frame.center.z + frame.direction.z * (slice?.depthOffset ?? 0),
    );
    next.computeBoundingSphere();
    return next;
  }, [asset, frame, slice?.depthOffset, tier.aspect]);
  const material = useMemo(() => {
    if (!state.texture) return null;
    if (asset.catalogDerivedVisualModel) {
      const file = slice?.ktx2 ?? slice?.fallback;
      return new THREE.ShaderMaterial({
        vertexShader: GAIA_CLUSTER_VERTEX_SHADER_V592,
        fragmentShader: GAIA_CLUSTER_FRAGMENT_SHADER_V592,
        uniforms: {
          uMap: { value: state.texture },
          uTexel: { value: new THREE.Vector2(1 / Math.max(1, file?.width ?? 1024), 1 / Math.max(1, file?.height ?? 1024)) },
          uGain: { value: 6.5 },
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
        userData: {
          atlasCandidate: "v592",
          atlasMaterial: "gaia-catalog-sparse-core-dilation-v1",
          atlasPresentationOnly: true,
          atlasScientificPayloadWriteback: false,
        },
      });
    }
    return new THREE.MeshBasicMaterial({
      map: state.texture,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      alphaTest: 0.001,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      premultipliedAlpha: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  }, [asset.catalogDerivedVisualModel, slice?.fallback, slice?.ktx2, state.texture]);

  useEffect(() => {
    const position = geometry.getAttribute("position");
    const release = acquireAtlasResource("model", "atlas", `v592-deep-space-image-plane-${asset.target}-${depthIndex}`, {
      owner: "v592-deep-space-visual-runtime",
      estimatedBytes: position?.array.byteLength ?? 0,
      manifestSha256: DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
    });
    return () => {
      release();
      geometry.dispose();
    };
  }, [asset.target, depthIndex, geometry]);

  useEffect(() => () => material?.dispose(), [material]);

  useEffect(() => {
    const key = `${asset.target}:${depthIndex}`;
    onStatus(key, {
      status: state.status,
      source: state.source,
      fullQualityGate: state.fullQualityGate,
      sha256: state.sha256,
    });
    return () => onStatus(key, null);
  }, [asset.target, depthIndex, onStatus, state.fullQualityGate, state.sha256, state.source, state.status]);

  if (!material || state.status !== "ready") return null;
  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={-770 + depthIndex}
      frustumCulled={false}
      userData={{
        atlasCandidate: "v592",
        atlasLayer: asset.catalogDerivedVisualModel
          ? "j2000-focused-gaia-catalog-derived-cluster"
          : "j2000-focused-deep-space-observation-image",
        atlasDeepSpaceObject: asset.target,
        atlasDepthIndex: depthIndex,
        atlasObservationBands: asset.source.observationEncoding.bands.join(","),
        atlasMappedColor: true,
        atlasObservationImageClaim: asset.observationImageClaim,
        atlasCatalogDerivedVisualModel: asset.catalogDerivedVisualModel,
        atlasNakedEyeRepresentationClaimed: false,
        atlasPresentationOnly: true,
        atlasScientificAuthority: false,
        atlasScientificPayloadWriteback: false,
      }}
    />
  );
}

function DeepSpaceVisualStackV592({
  entry,
  asset,
  profile,
  onStatus,
}: Readonly<{
  entry: DeepSpaceReferenceObjectV592;
  asset: DeepSpaceRasterVisualAssetV592;
  profile: CelestialRenderProfileV590;
  onStatus: (key: string, telemetry: DeepSpaceSliceTelemetryV592 | null) => void;
}>) {
  const depthCount = profile.deliveryTier === "vercel-lite"
    ? asset.variants.lite.depthSliceCount
    : profile.deviceTier === "mobile"
      ? asset.variants.mobile.depthSliceCount
      : asset.variants.desktop.depthSliceCount;
  return (
    <group userData={{
      atlasCandidate: "v592",
      atlasDeepSpaceObject: asset.target,
      atlasDepthSliceCount: depthCount,
      atlasMaximumConcurrentHighOrderImages: 1,
      atlasPresentationOnly: true,
      atlasScientificPayloadWriteback: false,
    }}>
      {Array.from({ length: depthCount }, (_, depthIndex) => (
        <DeepSpaceVisualSliceV592
          key={`${asset.target}:${depthIndex}`}
          entry={entry}
          asset={asset}
          depthIndex={depthIndex}
          profile={profile}
          onStatus={onStatus}
        />
      ))}
    </group>
  );
}

/**
 * Cinematic-only focus isolation for a deep-space inspection.
 *
 * The inherited v591 sky remains the global J2000 context, but at a 1.5°
 * inspection FOV its low-frequency Milky-Way atlas can read as a soft veil
 * over the selected object.  This camera-following shell gives the selected
 * verified image/analytic model a protected black level without changing the
 * coordinate frame, Science mode, or scientific payload.  It is deliberately
 * presentation-only and is released with the v592 deep-space scope.
 */
function DeepSpaceFocusBlackoutV592() {
  const camera = useThree((state) => state.camera);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x010207,
    transparent: true,
    opacity: 0.965,
    depthTest: false,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), []);
  const shell = useRef<THREE.Mesh>(null);

    useFrame(() => {
    if (!shell.current) return;
    shell.current.position.copy(camera.position);
    shell.current.scale.setScalar(640);
  }, -0.82);

  useEffect(() => {
    const position = geometry.getAttribute("position");
    const release = acquireAtlasResource("model", "atlas", "v592-deep-space-focus-blackout", {
      owner: "v592-deep-space-visual-runtime",
      estimatedBytes: position?.array.byteLength ?? 0,
      manifestSha256: DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
    });
    return () => {
      release();
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      ref={shell}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-900}
      userData={{
        atlasCandidate: "v592",
        atlasLayer: "deep-space-cinematic-focus-black-level-isolation",
        atlasPresentationOnly: true,
        atlasScientificAuthority: false,
        atlasScientificPayloadWriteback: false,
      }}
    />
  );
}

function DeepSpaceReferenceFocusRigV592({ focusTarget }: Readonly<{ focusTarget: LivingUniverseFocusTargetV592 }>) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const focus = isDeepSpaceReferenceIdV592(focusTarget) ? DEEP_SPACE_REFERENCE_BY_ID_V592[focusTarget] : null;
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
  const desiredTarget = useMemo(() => direction.clone().multiplyScalar(DEEP_SPACE_MARKER_RADIUS_V592), [direction]);
  const desiredFovDeg = focus
    ? THREE.MathUtils.clamp(focus.angularSize.majorArcmin / 60 * 3.2, 0.75, 24)
    : null;
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
      root.dataset.atlasV592DeepSpaceCameraFocus = focus.id;
      root.dataset.atlasV592DeepSpaceCameraSettled = "false";
    }
    return () => {
      if (restoreFovDeg.current !== null) {
        camera.fov = restoreFovDeg.current;
        camera.updateProjectionMatrix();
        restoreFovDeg.current = null;
      }
      if (!root) return;
      for (const key of Object.keys(root.dataset)) if (key.startsWith("atlasV592DeepSpaceCamera")) delete root.dataset[key];
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
      camera.position.copy(desiredPosition);
      camera.quaternion.copy(desiredQuaternion);
      camera.fov = desiredFovDeg;
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (!settled.current) return;
    const root = document.querySelector<HTMLElement>('[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV592DeepSpaceCameraSettled = "true";
      root.dataset.atlasV592DeepSpaceCameraFovDeg = camera.fov.toFixed(3);
      root.dataset.atlasV592DeepSpaceCameraPositionError = camera.position.distanceTo(desiredPosition).toExponential(3);
      root.dataset.atlasV592DeepSpaceCameraAngleError = camera.quaternion.angleTo(desiredQuaternion).toExponential(3);
    }
  }, 0);
  return null;
}

/**
 * Publish renderer-owned deep-space counters on the v592 acceptance root.
 *
 * The v591 layer still owns the shared scene and therefore still publishes its
 * legacy counters.  v592 must expose an additive, namespaced projection so a
 * browser receipt can read the actual frame's renderer state without treating
 * the historical namespace as the authority.  This bridge is read-only: it
 * never changes camera, scientific payload, or presentation state.
 */
function DeepSpaceRenderTelemetryV592() {
  const touchedRoot = useRef<HTMLElement | null>(null);
  useFrame(({ gl }) => {
    const root = document.querySelector<HTMLElement>(
      '[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]',
    );
    if (!root) return;
    touchedRoot.current = root;
    const snapshot = getAtlasResourceSnapshot();
    const deepSpaceOwners = Object.entries(snapshot.byOwner).filter(([owner]) =>
      owner.includes("deep-space") || owner.includes("celestial-convergence"),
    );
    const estimatedGpuBytes = deepSpaceOwners.reduce((total, [, value]) => total + value.estimatedBytes, 0);
    root.dataset.atlasV592DeepSpaceDrawCalls = String(gl.info.render.calls);
    root.dataset.atlasV592DeepSpaceGpuBytes = String(estimatedGpuBytes);
    root.dataset.atlasV592DeepSpaceTextures = String(gl.info.memory.textures);
    root.dataset.atlasV592DeepSpaceGeometries = String(gl.info.memory.geometries);
    root.dataset.atlasV592DeepSpacePrograms = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasV592DeepSpaceRenderTelemetrySource = "three-info-plus-v592-resource-snapshot";
  });
  useEffect(() => () => {
    const root = touchedRoot.current;
    if (!root) return;
    for (const key of [
      "atlasV592DeepSpaceDrawCalls",
      "atlasV592DeepSpaceGpuBytes",
      "atlasV592DeepSpaceTextures",
      "atlasV592DeepSpaceGeometries",
      "atlasV592DeepSpacePrograms",
      "atlasV592DeepSpaceRenderTelemetrySource",
    ]) delete root.dataset[key];
  }, []);
  return null;
}

export default function DeepSpaceReferenceLayerV592({
  profile,
  focusTarget,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  focusTarget: LivingUniverseFocusTargetV592;
}>) {
  const selected = isDeepSpaceReferenceIdV592(focusTarget) ? DEEP_SPACE_REFERENCE_BY_ID_V592[focusTarget] : null;
  const selectedVisualAsset = selected && isDeepSpaceVisualIdV592(selected.id)
    ? DEEP_SPACE_VISUAL_ASSETS_V592.find((asset) => asset.target === selected.id) as DeepSpaceVisualAssetV592 | undefined
    : undefined;
  const visualRequested = profile.mode === "cinematic" && Boolean(selectedVisualAsset);
  const selectedRasterVisualAsset = selectedVisualAsset && isDeepSpaceRasterVisualAssetV592(selectedVisualAsset)
    ? selectedVisualAsset
    : undefined;
  const selectedAnalyticVisualAsset = selectedVisualAsset?.visualModelKind === "openngc-catalog-derived-galaxy-analytic"
    ? selectedVisualAsset
    : undefined;
  const [sliceTelemetry, setSliceTelemetry] = useState<Readonly<Record<string, DeepSpaceSliceTelemetryV592>>>({});
  const onSliceStatus = useCallback((key: string, telemetry: DeepSpaceSliceTelemetryV592 | null) => {
    setSliceTelemetry((current) => {
      if (!telemetry) {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      }
      const previous = current[key];
      if (
        previous?.status === telemetry.status
        && previous.source === telemetry.source
        && previous.fullQualityGate === telemetry.fullQualityGate
        && previous.sha256 === telemetry.sha256
      ) return current;
      return { ...current, [key]: telemetry };
    });
  }, []);
  const requestedSliceCount = visualRequested && selectedAnalyticVisualAsset
    ? 1
    : visualRequested && selectedRasterVisualAsset
    ? profile.deliveryTier === "vercel-lite"
      ? selectedRasterVisualAsset.variants.lite.depthSliceCount
      : profile.deviceTier === "mobile"
        ? selectedRasterVisualAsset.variants.mobile.depthSliceCount
        : selectedRasterVisualAsset.variants.desktop.depthSliceCount
    : 0;
  const readySliceCount = selectedAnalyticVisualAsset && visualRequested
    ? 1
    : Object.values(sliceTelemetry).filter((entry) => entry.status === "ready").length;
  const blockedSliceCount = selectedAnalyticVisualAsset ? 0 : Object.values(sliceTelemetry).filter((entry) => entry.status === "blocked").length;
  const fullFallbackCount = selectedAnalyticVisualAsset ? 0 : Object.values(sliceTelemetry).filter((entry) => entry.fullQualityGate === "blocked-full-fallback").length;
  const textureSources = selectedAnalyticVisualAsset && visualRequested
    ? "openngc-analytic-shader"
    : [...new Set(Object.values(sliceTelemetry).map((entry) => entry.source).filter((source) => source !== "none"))].sort().join(",") || "none";
  const textureShas = selectedAnalyticVisualAsset && visualRequested
    ? "none"
    : [...new Set(Object.values(sliceTelemetry).map((entry) => entry.sha256).filter((sha) => sha !== "none"))].sort().join(",") || "none";
  const backgroundEntries = useMemo(
    () => selected ? DEEP_SPACE_REFERENCE_OBJECTS_V592.filter((entry) => entry.id !== selected.id) : DEEP_SPACE_REFERENCE_OBJECTS_V592,
    [selected],
  );
  const resources = useMemo(() => {
    const background = geometryV592(markerPositionsV592(backgroundEntries, false));
    const selectedGeometry = selected ? geometryV592(markerPositionsV592([selected], true)) : null;
    const backgroundMaterial = new THREE.LineBasicMaterial({
      color: profile.mode === "science" ? 0x6e9ba8 : 0x70808c,
      transparent: true,
      opacity: focusTarget === "overview" ? profile.mode === "science" ? 0.22 : 0.11 : 0.025,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    const selectedMaterial = selected ? new THREE.LineBasicMaterial({
      color: profile.mode === "science" ? 0x9ed3dd : 0xd9c18e,
      transparent: true,
      opacity: profile.mode === "science" ? 0.92 : visualRequested ? 0.18 : 0.68,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    }) : null;
    return { background, selectedGeometry, backgroundMaterial, selectedMaterial };
  }, [backgroundEntries, focusTarget, profile.mode, selected, visualRequested]);

  useEffect(() => {
    const backgroundBytes = resources.background.getAttribute("position").array.byteLength;
    const selectedBytes = resources.selectedGeometry?.getAttribute("position").array.byteLength ?? 0;
    const release = acquireAtlasResource("model", "atlas", "v592-deep-space-reference-markers", {
      owner: "v592-deep-space-reference-runtime",
      estimatedBytes: backgroundBytes + selectedBytes,
      manifestSha256: DEEP_SPACE_REFERENCE_PACKET_SHA256_V592,
    });
    return () => {
      release();
      resources.background.dispose();
      resources.selectedGeometry?.dispose();
      resources.backgroundMaterial.dispose();
      resources.selectedMaterial?.dispose();
    };
  }, [resources]);

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
      root.dataset.atlasV592DeepSpaceReferenceAdmission = "24/24";
      root.dataset.atlasV592DeepSpaceGalaxyReferenceAdmission = "12/12";
      root.dataset.atlasV592DeepSpaceClusterReferenceAdmission = "12/12";
      root.dataset.atlasV592DeepSpaceVisualMetadataCandidates = "18/24";
      root.dataset.atlasV592DeepSpaceVisualAssetAdmission = "24/24";
      root.dataset.atlasV592DeepSpaceGalaxyVisualAssetAdmission = "12/12";
      root.dataset.atlasV592DeepSpaceClusterVisualAssetAdmission = "12/12";
      root.dataset.atlasV592DeepSpaceSelectedId = selected?.id ?? "none";
      root.dataset.atlasV592DeepSpaceSelectedVisualState = !selected
        ? "none"
        : !selectedVisualAsset ? "asset-blocked"
          : profile.mode === "science" ? "admitted-science-marker-only"
            : blockedSliceCount > 0 ? "blocked"
              : requestedSliceCount > 0 && readySliceCount === requestedSliceCount ? "ready" : "loading";
      root.dataset.atlasV592DeepSpaceImageRequested = visualRequested ? selectedVisualAsset?.target ?? "none" : "none";
      root.dataset.atlasV592DeepSpaceImageRequestedSliceCount = String(requestedSliceCount);
      root.dataset.atlasV592DeepSpaceImageReadySliceCount = String(readySliceCount);
      root.dataset.atlasV592DeepSpaceImageBlockedSliceCount = String(blockedSliceCount);
      root.dataset.atlasV592DeepSpaceImageFullFallbackCount = String(fullFallbackCount);
      root.dataset.atlasV592DeepSpaceImageTextureSources = textureSources;
      root.dataset.atlasV592DeepSpaceImageTextureShas = textureShas;
      root.dataset.atlasV592DeepSpaceImageBands = selectedVisualAsset?.source.observationEncoding.bands.join(",") ?? "none";
      root.dataset.atlasV592DeepSpaceImageMappedColor = selectedVisualAsset?.observationImageClaim ? "true" : "false";
      root.dataset.atlasV592DeepSpaceObservationImageClaim = selectedVisualAsset?.observationImageClaim ? "true" : "false";
      root.dataset.atlasV592DeepSpaceCatalogDerivedVisualModel = selectedVisualAsset?.catalogDerivedVisualModel ? "true" : "false";
      root.dataset.atlasV592DeepSpaceVisualModelKind = selectedVisualAsset?.visualModelKind ?? "none";
      root.dataset.atlasV592DeepSpaceImageNakedEyeClaim = "false";
      root.dataset.atlasV592DeepSpaceMaximumConcurrentHighOrderImages = "1";
      root.dataset.atlasV592DeepSpaceCoordinateFrame = "ICRS/J2000";
      root.dataset.atlasV592DeepSpaceScienceImagePayload = "false";
      root.dataset.atlasV592DeepSpacePresentationOnly = "true";
      root.dataset.atlasV592DeepSpaceScientificWriteback = "false";
    };
    frameId = requestAnimationFrame(publish);
    return () => {
      cancelAnimationFrame(frameId);
      const root = ownedRoot;
      if (!root) return;
      for (const key of [
        "atlasV592DeepSpaceReferenceAdmission",
        "atlasV592DeepSpaceGalaxyReferenceAdmission",
        "atlasV592DeepSpaceClusterReferenceAdmission",
        "atlasV592DeepSpaceVisualMetadataCandidates",
        "atlasV592DeepSpaceVisualAssetAdmission",
        "atlasV592DeepSpaceGalaxyVisualAssetAdmission",
        "atlasV592DeepSpaceClusterVisualAssetAdmission",
        "atlasV592DeepSpaceSelectedId",
        "atlasV592DeepSpaceSelectedVisualState",
        "atlasV592DeepSpaceImageRequested",
        "atlasV592DeepSpaceImageRequestedSliceCount",
        "atlasV592DeepSpaceImageReadySliceCount",
        "atlasV592DeepSpaceImageBlockedSliceCount",
        "atlasV592DeepSpaceImageFullFallbackCount",
        "atlasV592DeepSpaceImageTextureSources",
        "atlasV592DeepSpaceImageTextureShas",
        "atlasV592DeepSpaceImageBands",
        "atlasV592DeepSpaceImageMappedColor",
        "atlasV592DeepSpaceObservationImageClaim",
        "atlasV592DeepSpaceCatalogDerivedVisualModel",
        "atlasV592DeepSpaceVisualModelKind",
        "atlasV592DeepSpaceImageNakedEyeClaim",
        "atlasV592DeepSpaceMaximumConcurrentHighOrderImages",
        "atlasV592DeepSpaceCoordinateFrame",
        "atlasV592DeepSpaceScienceImagePayload",
        "atlasV592DeepSpacePresentationOnly",
        "atlasV592DeepSpaceScientificWriteback",
      ]) delete root.dataset[key];
    };
  }, [blockedSliceCount, fullFallbackCount, profile.mode, readySliceCount, requestedSliceCount, selected, selectedVisualAsset, textureShas, textureSources, visualRequested]);

  const selectedFrame = selected ? frameV592(selected) : null;
  return (
    <group userData={{
      atlasCandidate: "v592",
      atlasLayer: "source-backed-j2000-galaxy-cluster-reference",
      atlasGalaxyReferenceCount: 12,
      atlasClusterReferenceCount: 12,
      atlasVisualAssetAdmissionCount: 24,
      atlasGalaxyVisualAssetAdmissionCount: 12,
      atlasClusterVisualAssetAdmissionCount: 12,
      atlasObservationImageClaim: visualRequested && Boolean(selectedVisualAsset?.observationImageClaim),
      atlasCatalogDerivedVisualModel: visualRequested && Boolean(selectedVisualAsset?.catalogDerivedVisualModel),
      atlasScienceImagePayload: false,
      atlasMaximumConcurrentHighOrderImages: 1,
      atlasPresentationOnly: true,
      atlasScientificPayloadWriteback: false,
    }}>
      <DeepSpaceReferenceFocusRigV592 focusTarget={focusTarget} />
      <DeepSpaceRenderTelemetryV592 />
      {selected && selectedVisualAsset && profile.mode === "cinematic" ? <DeepSpaceFocusBlackoutV592 /> : null}
      {selected && selectedAnalyticVisualAsset && visualRequested ? (
        <DeepSpaceAnalyticGalaxyV592 entry={selected} asset={selectedAnalyticVisualAsset} />
      ) : selected && selectedRasterVisualAsset && visualRequested ? (
        <DeepSpaceVisualStackV592 entry={selected} asset={selectedRasterVisualAsset} profile={profile} onStatus={onSliceStatus} />
      ) : null}
      <lineSegments geometry={resources.background} material={resources.backgroundMaterial} renderOrder={-772} frustumCulled />
      {resources.selectedGeometry && resources.selectedMaterial ? (
        <lineSegments geometry={resources.selectedGeometry} material={resources.selectedMaterial} renderOrder={-771} frustumCulled={false} />
      ) : null}
      {selected && selectedFrame && !profile.cleanView ? (
        <Html position={selectedFrame.center.toArray()} center distanceFactor={48} occlude zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
          <span
            data-atlas-v592-deep-space-marker={selected.id}
            className="whitespace-nowrap border-l border-[#d9c18e]/50 bg-black/58 px-2 py-1 text-[6px] uppercase tracking-[0.16em] text-[#f0d8a8]/88 backdrop-blur-sm"
          >
            {selected.catalogName} · {selectedVisualAsset
              ? selectedVisualAsset.catalogDerivedVisualModel
                ? `${selectedVisualAsset.source.observationEncoding.bands.join("/")} catalog-derived · presentation`
                : `${selectedVisualAsset.source.observationEncoding.bands.join("/")} mapped color · presentation`
              : selected.visualMetadata.candidateCount > 0 ? "asset blocked · metadata only" : "source blocked"}
          </span>
        </Html>
      ) : null}
    </group>
  );
}
