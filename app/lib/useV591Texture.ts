"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { acquireAtlasResource, estimateAtlasTextureBytesV289 } from "./atlasResourceLifecycle";
import { CELESTIAL_ART_MANIFEST_SHA256_V589 } from "./celestialArtV589";
import {
  CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
  type CelestialDeliveryTierV590,
  type CelestialDeviceTierV590,
  type VisualAssetFileV590,
  type VisualAssetManifestEntryV590,
} from "./celestialRenderingV590";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";
import {
  loadVerifiedVisualAssetBytesV590,
  loadVisualAssetManifestV590,
  estimateV590TextureGpuBytes,
  parseKtx2V590,
  selectVisualAssetFilesV590,
} from "./useV590Texture";
import {
  CELESTIAL_NEBULA_OVERLAY_SHA256_V591,
  loadNebulaAssetOverlayV591,
  selectNebulaTextureFilesV591,
  type NebulaIdV591,
  type NebulaTextureFileV591,
} from "./celestialNebulaV591";
import {
  loadTempel1AssetOverlayV591,
  type Tempel1VisualAssetEntryV591,
} from "./celestialTempel1V591";
import {
  CERES_REQUIRED_ASSET_IDS_V591,
  loadCeresAssetOverlayV591,
  type CeresVisualAssetEntryV591,
} from "./celestialCeresV591";

export type VisualAssetFileV591 = Readonly<{
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb" | "linear";
  compression: string;
}>;

export type VisualAssetEntryV591 = Readonly<{
  id:
    | "sun-photosphere"
    | "sun-chromosphere"
    | "mercury-albedo"
    | "mercury-normal"
    | "mercury-roughness"
    | "mercury-height"
    | "moon-albedo"
    | "moon-normal"
    | "moon-roughness"
    | "moon-height"
    | "jupiter-albedo"
    | "jupiter-band-mask"
    | "jupiter-storm-mask"
    | "saturn-atmosphere-albedo"
    | "saturn-band-mask"
    | "saturn-polar-detail"
    | "saturn-ring-color"
    | "saturn-ring-optical-depth";
  body: "sun" | "mercury" | "moon" | "jupiter" | "saturn";
  role:
    | "photosphere"
    | "chromosphere"
    | "albedo"
    | "nasa-photojournal-global-albedo"
    | "messenger-height-derived-normal"
    | "messenger-height-derived-regolith-roughness"
    | "messenger-height-presentation-relief"
    | "height-derived-normal"
    | "height-derived-roughness"
    | "height-displacement"
    | "cassini-global-albedo"
    | "cassini-derived-latitudinal-flow-mask"
    | "cassini-derived-great-red-spot-mask"
    | "cassini-global-atmosphere-albedo"
    | "cassini-derived-latitudinal-band-mask"
    | "cassini-north-polar-morphology"
    | "cassini-derived-radial-ring-color"
    | "cassini-derived-radial-ring-optical-depth";
  source: Readonly<{
    acquisitionReceiptSha256: string;
    path: string;
    url: string;
    finalUrl: string;
    host: string;
    license: Readonly<{ id: "NASA-public-domain" | "NASA-JPL-public-domain" | "USGS-public-domain"; url: string }>;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    bitDepth?: number;
    units?: string;
    observationIdentity: string;
    observationLimit?: string;
    exactByteV589SourceReuse?: true;
    inheritedManifestSha256?: string;
    inheritedAcquisitionReceiptSha256?: string;
    metadataReceiptSha256?: string;
  }>;
  derivation: Readonly<{
    tool: string;
    version: string;
    parameters: string;
    observationLimit?: string;
    seamMeanAbsoluteDelta: number;
    sourceRangeRaw?: Readonly<{ minimum: number; maximum: number; mean: number }>;
    heightMetersPerRawUnit?: number;
    lunarRadiusMeters?: number;
    normalReliefGain?: number;
    vertexReliefGain?: number;
    sourceRangeMeters?: Readonly<{ minimum: number; maximum: number; mean: number }>;
    mercuryRadiusMeters?: number;
    sourceDetailCeiling?: string;
    stormMaskMaximum?: number;
    stormMaskMean?: number;
    sphereRegistration?: Readonly<Record<string, unknown>>;
    radialGradientAngleDeg?: number;
    radialValidBinRange?: readonly [number, number];
    ringKilometers?: Readonly<Record<string, number>>;
    cassiniNormalizedRange?: readonly [number, number];
    enckeNormalizedCenter?: number;
    enckeNormalizedHalfWidth?: number;
  }>;
  fullQualityMinimum: Readonly<{
    desktop: Readonly<{ width: number; height: number }>;
    mobile: Readonly<{ width: number; height: number }>;
  }>;
  variants: Readonly<{
    desktopKtx2: VisualAssetFileV591;
    desktopFallback: VisualAssetFileV591;
    mobileKtx2: VisualAssetFileV591;
    mobileFallback: VisualAssetFileV591;
    liteDesktop: VisualAssetFileV591;
    liteMobile: VisualAssetFileV591;
  }>;
  presentationOnly: true;
}>;

export type MarsVisualAssetEntryV591 = Readonly<{
  id: "mars-albedo" | "mars-normal" | "mars-roughness" | "mars-height";
  body: "mars";
  role:
    | "usgs-viking-color-bounded-resample"
    | "mola-height-derived-normal"
    | "mola-height-derived-dust-roughness"
    | "mola-height-presentation-relief";
  source: Readonly<{
    acquisitionReceiptSha256: string;
    path: string;
    url: string;
    finalUrl: string;
    host: "astrogeology.usgs.gov" | "pds-geosciences.wustl.edu";
    license: Readonly<{
      id: "NASA-USGS-public-domain" | "NASA-PDS-public-domain";
      url: string;
    }>;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    bitDepth?: number;
    units?: string;
    observationIdentity: string;
    observationLimit: string;
  }>;
  derivation: Readonly<{
    tool: string;
    version: string;
    parameters: string | Readonly<Record<string, unknown>>;
    sourceRangeMeters?: Readonly<{ minimum: number; maximum: number; mean: number }>;
    marsRadiusMeters?: number;
    normalReliefGain?: number;
  }>;
  resampleAuditReceiptSha256?: string;
  observationDisclosure?: string;
  fullQualityMinimum: Readonly<{
    desktop: Readonly<{ width: number; height: number }>;
    mobile: Readonly<{ width: number; height: number }>;
  }>;
  variants: VisualAssetEntryV591["variants"];
  presentationOnly: true;
}>;

export type BennuVisualAssetEntryV591 = Readonly<{
  id: "bennu-regolith-albedo" | "bennu-regolith-normal" | "bennu-regolith-roughness";
  body: "bennu";
  role: "cc0-regolith-micro-albedo" | "cc0-regolith-micro-normal" | "cc0-regolith-micro-roughness";
  source: Readonly<{
    acquisitionReceiptSha256: string;
    path: string;
    url: string;
    finalUrl: string;
    host: "dl.polyhaven.org";
    license: Readonly<{ id: "Poly-Haven-CC0"; url: string }>;
    bytes: number;
    sha256: string;
    width: 4096;
    height: 4096;
    observationIdentity: string;
    observationLimit: string;
  }>;
  derivation: Readonly<{
    tool: string;
    version: string;
    parameters: string;
    physicalPolicy: string;
  }>;
  fullQualityMinimum: Readonly<{
    desktop: Readonly<{ width: 4096; height: 4096 }>;
    mobile: Readonly<{ width: 2048; height: 2048 }>;
  }>;
  variants: VisualAssetEntryV591["variants"];
  presentationOnly: true;
}>;

export type VenusVisualAssetEntryV591 = Readonly<{
  id: "venus-surface" | "venus-normal" | "venus-roughness" | "venus-height";
  body: "venus";
  role:
    | "magellan-colorized-radar-surface"
    | "magellan-color-topography-derived-normal"
    | "magellan-color-topography-derived-roughness"
    | "magellan-color-topography-presentation-relief"
    | "magellan-multiview-radar-surface"
    | "magellan-radar-derived-normal"
    | "magellan-radar-derived-roughness"
    | "magellan-radar-presentation-relief";
  source: Readonly<{
    id?: string;
    acquisitionReceiptSha256: string;
    path: string;
    url: string;
    finalUrl: string;
    host: "s3.us-west-2.amazonaws.com" | "images-assets.nasa.gov";
    license: Readonly<{ id: "USGS-public-domain" | "NASA-public-domain"; url: string }>;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    bitDepth?: number;
    units?: string;
    observationIdentity: string;
    observationLimit?: string;
    fieldCoverage?: string;
    longitudeEastDeg?: number;
    gridReference?: boolean;
  }>;
  sourceComponents?: readonly Readonly<{
    id: string;
    acquisitionReceiptSha256: string;
    path: string;
    url: string;
    finalUrl: string;
    host: "images-assets.nasa.gov";
    license: Readonly<{ id: "NASA-public-domain"; url: string }>;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    observationIdentity: string;
    fieldCoverage: string;
    longitudeEastDeg: number;
    gridReference: boolean;
  }>[];
  derivation: Readonly<{
    tool: string;
    version: string;
    parameters: string;
    sourceRangeMeters?: Readonly<{ minimum: number; maximum: number; mean: number }>;
    venusRadiusMeters?: number;
    normalReliefGain?: number;
    terrainMode?: string;
    sourceLuminancePercentiles?: Readonly<{ low: number; high: number }>;
    reliefScaleRadiusFraction?: number;
    gridReferenceWeightFraction?: number;
    observationLimit?: string;
  }>;
  fullQualityMinimum: Readonly<{ desktop: Readonly<{ width: number; height: number }>; mobile: Readonly<{ width: number; height: number }> }>;
  variants: VisualAssetEntryV591["variants"];
  presentationOnly: true;
}>;

export type SunAssetOverlayV591 = Readonly<{
  version: "v591-sun-asset-overlay-v1";
  generatedAt: string;
  status: "sun-assets-derived-awaiting-runtime-admission" | "sun-runtime-admitted";
  acquisitionReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  mirroredHemisphereDisclosure: true;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly VisualAssetEntryV591[];
  receiptSha256: string;
}>;

export type VenusAssetOverlayV591 = Readonly<{
  version: "v591-venus-asset-overlay-v1";
  generatedAt: string;
  status: "venus-assets-derived-awaiting-runtime-admission" | "venus-runtime-admitted" | "venus-assets-blocked-incomplete-source";
  acquisitionReceiptSha256: string;
  sourceReceiptSha256s?: readonly string[];
  metadataReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  cloudModel: Readonly<{ id: string; observationTextureClaim: false; resourceMissingFallback: false; presentationOnly: true }>;
  surfaceCoverage?: Readonly<Record<string, unknown>>;
  authorityState: Readonly<{ presentationOnly: true; scientificAuthorityChanged: false; scientificPayloadWriteback: false; measuredAuthorityGranted: false }>;
  assets: readonly VenusVisualAssetEntryV591[];
  blockers?: readonly Readonly<{ code: string; receiptSha256: string; detail: string }>[];
  receiptSha256: string;
}>;

export type EarthAssetOverlayV591 = Readonly<{
  version: "v591-earth-asset-overlay-v1";
  generatedAt: string;
  status: "earth-runtime-admitted-inherited-exact-bytes";
  baseline: Readonly<{
    candidate: "v590-readonly";
    manifestPath: "public/data/celestial-rendering-v590/manifest.json";
    manifestSha256: string;
  }>;
  noNetworkRequestsPerformed: true;
  noAssetBytesCopied: true;
  reusePolicy: "exact-v590-sealed-asset-bytes-readonly";
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly Readonly<{
    id: string;
    body: "earth";
    role: string;
    inheritedIdentity: Readonly<{
      candidate: "v590-readonly";
      manifestSha256: string;
      sourceUrl: string;
      sourceHost: string;
      license: Readonly<{ id: string; url: string }>;
      sourceBytes: number;
      sourceSha256: string;
    }>;
    fullQualityMinimum: NonNullable<VisualAssetManifestEntryV590["fullQualityMinimum"]>;
    variants: VisualAssetManifestEntryV590["variants"];
    presentationOnly: true;
  }>[];
  receiptSha256: string;
}>;

export type MoonAssetOverlayV591 = Readonly<{
  version: "v591-moon-asset-overlay-v1";
  generatedAt: string;
  status: "moon-assets-derived-awaiting-runtime-admission" | "moon-runtime-admitted";
  acquisitionReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  derivationDeterministic: true;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly VisualAssetEntryV591[];
  receiptSha256: string;
}>;

export type MercuryAssetOverlayV591 = Readonly<{
  version: "v591-mercury-asset-overlay-v1";
  generatedAt: string;
  status: "mercury-assets-derived-awaiting-runtime-admission" | "mercury-runtime-admitted";
  acquisitionReceiptSha256: string;
  metadataReceiptSha256: string;
  inheritedV589ManifestSha256: string;
  inheritedV589AcquisitionReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  exactByteV589AlbedoSourceReuse: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly VisualAssetEntryV591[];
  receiptSha256: string;
}>;

export type MarsAssetOverlayV591 = Readonly<{
  version: "v591-mars-asset-overlay-v3";
  generatedAt: string;
  status: "mars-usgs-viking-color-mola-terrain-admitted";
  acquisitionReceiptSha256: string;
  albedoIdentityAuditReceiptSha256: string;
  fullAlbedoBlockedReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  blockers: readonly [];
  assets: readonly MarsVisualAssetEntryV591[];
  albedoResampleAuditReceiptSha256: string;
  compositeRejectionReceiptSha256: string;
  preservedNegativeEvidence: Readonly<{
    directIdentityAuditReceiptSha256: string;
    fullAlbedoBlockedReceiptSha256: string;
    nasa3dTiffBlockedReceiptSha256: string;
    nasa3dJpegBlockedReceiptSha256: string;
    experimentalCompositeAuditReceiptSha256: string;
  }>;
  receiptSha256: string;
}>;

export type JupiterAssetOverlayV591 = Readonly<{
  version: "v591-jupiter-asset-overlay-v1";
  generatedAt: string;
  status: "jupiter-assets-derived-awaiting-runtime-admission" | "jupiter-runtime-admitted";
  acquisitionReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly VisualAssetEntryV591[];
  receiptSha256: string;
}>;

export type SaturnAssetOverlayV591 = Readonly<{
  version: "v591-saturn-asset-overlay-v1";
  generatedAt: string;
  status: "saturn-assets-derived-awaiting-runtime-admission" | "saturn-runtime-admitted";
  acquisitionReceiptSha256: string;
  atmosphereSupplementReceiptSha256: string;
  noNetworkRequestsPerformed: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  mirroredObservedSectorDisclosure: true;
  ringGeometry: Readonly<{
    innerRadiusSaturnEquatorial: number;
    outerRadiusSaturnEquatorial: number;
    cassiniNormalizedRange: readonly [number, number];
    enckeNormalizedCenter: number;
    enckeNormalizedHalfWidth: number;
    radialUv: true;
    premultipliedAlpha: true;
    depthWrite: false;
    depthTest: true;
  }>;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly VisualAssetEntryV591[];
  receiptSha256: string;
}>;

export type BennuAssetOverlayV591 = Readonly<{
  version: "v591-bennu-asset-overlay-v1";
  generatedAt: string;
  status: "bennu-assets-derived-awaiting-runtime-admission" | "bennu-runtime-admitted";
  acquisitionReceiptSha256: string;
  noNetworkRequestsPerformedDuringDerivation: true;
  noModelBytesCopied: true;
  derivationDeterministic: true;
  proceduralFallback: false;
  inheritedModel: Readonly<{
    candidate: "v589-readonly";
    manifestPath: "public/data/celestial-art-v589/manifest.json";
    manifestSha256: string;
    assetId: "bennu-model";
    sourceUrl: string;
    sourceBytes: number;
    sourceSha256: string;
    license: Readonly<{ id: "NASA-public-domain"; url: string }>;
    lodReceiptPath: "docs/release/v589/bennu-lod-receipt-v589.json";
    lodReceiptSha256: string;
    lods: readonly Readonly<{
      lod: 0 | 1 | 2;
      path: string;
      bytes: number;
      sha256: string;
      triangleCount: number;
      normals: true;
      meshopt: true;
      pivot: "bounds-midpoint";
      units: "normalized-diameter-2";
      rotationAxis: "source-frame-y-up";
    }>[];
  }>;
  materialPolicy: Readonly<{
    substrate: "bounded-low-albedo-carbonaceous-reference";
    microtexture: "poly-haven-cc0-presentation-only-not-bennu-observation";
    reflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular";
  }>;
  authorityState: Readonly<{
    presentationOnly: true;
    scientificAuthorityChanged: false;
    scientificPayloadWriteback: false;
    measuredAuthorityGranted: false;
  }>;
  assets: readonly BennuVisualAssetEntryV591[];
  receiptSha256: string;
}>;

export type V591TextureLoadState = Readonly<{
  texture: THREE.Texture | null;
  status: "idle" | "loading" | "ready" | "blocked";
  source: "none" | "ktx2" | "full-raster" | "fallback";
  assetId: string;
  sha256: string;
  reason: string;
  prewarmStatus: "idle" | "warming" | "ready" | "failed" | "disposed";
  fullQualityGate: "not-applicable" | "passed" | "blocked-full-fallback" | "blocked-full-dimensions";
}>;

type LoaderRuntimeV591 = {
  loader: KTX2Loader | null;
  loaderPromise: Promise<KTX2Loader> | null;
  prewarmPromise: Promise<void> | null;
  prewarmStatus: V591TextureLoadState["prewarmStatus"];
  generation: number;
  assetFailures: Map<string, string>;
};

const OVERLAY_URL_V591 = "/data/celestial-convergence-v591/sun-asset-overlay.json";
const EARTH_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/earth-asset-overlay.json";
const MOON_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/moon-asset-overlay.json";
const MERCURY_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/mercury-asset-overlay.json";
const MARS_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/mars-asset-overlay.json";
const JUPITER_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/jupiter-asset-overlay.json";
const SATURN_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/saturn-asset-overlay.json";
const BENNU_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/bennu-asset-overlay.json";
const VENUS_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/venus-asset-overlay.json";
const BASIS_PATH_V591 = "/basis-v590/";
const COLD_START_TIMEOUT_MS_V591 = 15_000;
const WARM_ASSET_TIMEOUT_MS_V591 = 12_000;
const SHA256_PATTERN_V591 = /^[a-f0-9]{64}$/;
const ALLOWED_SUN_SOURCE_HOSTS_V591 = new Set(["sdo.gsfc.nasa.gov"]);
const ALLOWED_MOON_SOURCE_HOSTS_V591 = new Set(["svs.gsfc.nasa.gov"]);
const ALLOWED_MERCURY_SOURCE_HOSTS_V591 = new Set(["assets.science.nasa.gov", "asc-pds-services.s3.us-west-2.amazonaws.com"]);
const ALLOWED_MARS_SOURCE_HOSTS_V591 = new Set(["astrogeology.usgs.gov", "pds-geosciences.wustl.edu"]);
const ALLOWED_JUPITER_SOURCE_HOSTS_V591 = new Set(["assets.science.nasa.gov"]);
const ALLOWED_SATURN_SOURCE_HOSTS_V591 = new Set(["images-assets.nasa.gov"]);
const ALLOWED_BENNU_SOURCE_HOSTS_V591 = new Set(["dl.polyhaven.org"]);
const ALLOWED_VENUS_SOURCE_HOSTS_V591 = new Set(["s3.us-west-2.amazonaws.com", "images-assets.nasa.gov"]);
const EXPECTED_DIMENSIONS_V591: Readonly<Record<VisualAssetEntryV591["id"], Readonly<{
  desktop: readonly [number, number];
  mobile: readonly [number, number];
}>>> = Object.freeze({
  "sun-photosphere": Object.freeze({ desktop: [8192, 4096] as const, mobile: [2048, 1024] as const }),
  "sun-chromosphere": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "mercury-albedo": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "mercury-normal": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "mercury-roughness": Object.freeze({ desktop: [2048, 1024] as const, mobile: [2048, 1024] as const }),
  "mercury-height": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "moon-albedo": Object.freeze({ desktop: [8192, 4096] as const, mobile: [2048, 1024] as const }),
  "moon-normal": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "moon-roughness": Object.freeze({ desktop: [2048, 1024] as const, mobile: [2048, 1024] as const }),
  "moon-height": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "jupiter-albedo": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "jupiter-band-mask": Object.freeze({ desktop: [2048, 1024] as const, mobile: [2048, 1024] as const }),
  "jupiter-storm-mask": Object.freeze({ desktop: [2048, 1024] as const, mobile: [2048, 1024] as const }),
  "saturn-atmosphere-albedo": Object.freeze({ desktop: [8192, 4096] as const, mobile: [2048, 1024] as const }),
  "saturn-band-mask": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "saturn-polar-detail": Object.freeze({ desktop: [1024, 1024] as const, mobile: [1024, 1024] as const }),
  "saturn-ring-color": Object.freeze({ desktop: [4096, 64] as const, mobile: [2048, 64] as const }),
  "saturn-ring-optical-depth": Object.freeze({ desktop: [4096, 64] as const, mobile: [2048, 64] as const }),
});
const MARS_EXPECTED_DIMENSIONS_V591: Readonly<Record<MarsVisualAssetEntryV591["id"], Readonly<{
  desktop: readonly [number, number];
  desktopFallback: readonly [number, number];
  mobile: readonly [number, number];
}>>> = Object.freeze({
  "mars-albedo": Object.freeze({ desktop: [8192, 4096] as const, desktopFallback: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "mars-normal": Object.freeze({ desktop: [4096, 2048] as const, desktopFallback: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "mars-roughness": Object.freeze({ desktop: [2048, 1024] as const, desktopFallback: [2048, 1024] as const, mobile: [2048, 1024] as const }),
  "mars-height": Object.freeze({ desktop: [4096, 2048] as const, desktopFallback: [4096, 2048] as const, mobile: [2048, 1024] as const }),
});
const BENNU_EXPECTED_DIMENSIONS_V591: Readonly<Record<BennuVisualAssetEntryV591["id"], Readonly<{
  desktop: readonly [4096, 4096];
  mobile: readonly [2048, 2048];
}>>> = Object.freeze({
  "bennu-regolith-albedo": Object.freeze({ desktop: [4096, 4096] as const, mobile: [2048, 2048] as const }),
  "bennu-regolith-normal": Object.freeze({ desktop: [4096, 4096] as const, mobile: [2048, 2048] as const }),
  "bennu-regolith-roughness": Object.freeze({ desktop: [4096, 4096] as const, mobile: [2048, 2048] as const }),
});
const IDLE_V591: V591TextureLoadState = Object.freeze({
  texture: null,
  status: "idle",
  source: "none",
  assetId: "none",
  sha256: "none",
  reason: "none",
  prewarmStatus: "idle",
  fullQualityGate: "not-applicable",
});

const VENUS_REQUIRED_ASSET_IDS_V591 = Object.freeze(["venus-surface", "venus-normal", "venus-roughness", "venus-height"] as const);
const VENUS_EXPECTED_DIMENSIONS_V591: Readonly<Record<typeof VENUS_REQUIRED_ASSET_IDS_V591[number], Readonly<{ desktop: readonly [number, number]; mobile: readonly [number, number] }>>> = Object.freeze({
  "venus-surface": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "venus-normal": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
  "venus-roughness": Object.freeze({ desktop: [2048, 1024] as const, mobile: [2048, 1024] as const }),
  "venus-height": Object.freeze({ desktop: [4096, 2048] as const, mobile: [2048, 1024] as const }),
});

let overlayPromiseV591: Promise<SunAssetOverlayV591> | null = null;
let earthOverlayPromiseV591: Promise<EarthAssetOverlayV591> | null = null;
let moonOverlayPromiseV591: Promise<MoonAssetOverlayV591> | null = null;
let mercuryOverlayPromiseV591: Promise<MercuryAssetOverlayV591> | null = null;
let marsOverlayPromiseV591: Promise<MarsAssetOverlayV591> | null = null;
let jupiterOverlayPromiseV591: Promise<JupiterAssetOverlayV591> | null = null;
let saturnOverlayPromiseV591: Promise<SaturnAssetOverlayV591> | null = null;
let bennuOverlayPromiseV591: Promise<BennuAssetOverlayV591> | null = null;
let venusOverlayPromiseV591: Promise<VenusAssetOverlayV591> | null = null;
let loaderModulePromiseV591: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;
const loaderRuntimeByRendererV591 = new WeakMap<THREE.WebGLRenderer, LoaderRuntimeV591>();
const trackedTextureResourcesV591 = new WeakMap<THREE.Texture, { references: number; releaseRegistry: () => void }>();

function canonicalizeV591(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV591);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalizeV591(source[key])]));
}

function validateVariantV591(assetId: string, file: VisualAssetFileV591, expectedFormat?: VisualAssetFileV591["format"]): void {
  if (!file.url.startsWith("/textures/candidate-v591/") || file.url.includes("\\") || decodeURIComponent(file.url).split("/").includes("..")) {
    throw new Error(`v591-asset-url:${assetId}`);
  }
  if (!Number.isSafeInteger(file.bytes) || file.bytes <= 0 || !SHA256_PATTERN_V591.test(file.sha256)) throw new Error(`v591-asset-identity:${assetId}`);
  if (!Number.isSafeInteger(file.width) || !Number.isSafeInteger(file.height) || file.width <= 0 || file.height <= 0) throw new Error(`v591-asset-dimensions:${assetId}`);
  if (expectedFormat && file.format !== expectedFormat) throw new Error(`v591-asset-format:${assetId}`);
}

export function parseSunAssetOverlayV591(value: unknown): SunAssetOverlayV591 {
  if (!value || typeof value !== "object") throw new Error("v591-overlay-shape");
  const overlay = value as SunAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-sun-asset-overlay-v1"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-overlay-seal");
  if (
    overlay.noNetworkRequestsPerformed !== true
    || overlay.mirroredHemisphereDisclosure !== true
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== 2) throw new Error("v591-overlay-assets");
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly VisualAssetEntryV591[]) {
    if (ids.has(asset.id)) throw new Error(`v591-overlay-duplicate:${asset.id}`);
    ids.add(asset.id);
    if (
      asset.body !== "sun"
      || asset.presentationOnly !== true
      || asset.source.license.id !== "NASA-public-domain"
      || !ALLOWED_SUN_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || asset.source.width !== 4096
      || asset.source.height !== 4096
      || asset.derivation.seamMeanAbsoluteDelta > 2
    ) throw new Error(`v591-overlay-provenance:${asset.id}`);
    const assetId = asset.id as VisualAssetEntryV591["id"];
    const expected = EXPECTED_DIMENSIONS_V591[assetId];
    if (!expected) throw new Error(`v591-overlay-id:${asset.id}`);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0]
      || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktop[0]
      || asset.variants.desktopFallback.height !== expected.desktop[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0]
      || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0]
      || asset.variants.mobileFallback.height !== expected.mobile[1]
    ) throw new Error(`v591-overlay-quality:${asset.id}`);
  }
  if (!ids.has("sun-photosphere") || !ids.has("sun-chromosphere")) throw new Error("v591-overlay-required-assets");
  return overlay;
}

export async function loadSunAssetOverlayV591(signal?: AbortSignal): Promise<SunAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-overlay-fetch:${response.status}`);
    return parseSunAssetOverlayV591(await response.json());
  }
  overlayPromiseV591 ??= fetch(`${OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-overlay-fetch:${response.status}`);
      return parseSunAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      overlayPromiseV591 = null;
      throw error;
    });
  return overlayPromiseV591;
}

const MOON_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "moon-albedo",
  "moon-normal",
  "moon-roughness",
  "moon-height",
] as const);

const MERCURY_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "mercury-albedo",
  "mercury-normal",
  "mercury-roughness",
  "mercury-height",
] as const);

const MARS_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "mars-albedo",
  "mars-normal",
  "mars-roughness",
  "mars-height",
] as const);

const JUPITER_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "jupiter-albedo",
  "jupiter-band-mask",
  "jupiter-storm-mask",
] as const);

const SATURN_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "saturn-atmosphere-albedo",
  "saturn-band-mask",
  "saturn-polar-detail",
  "saturn-ring-color",
  "saturn-ring-optical-depth",
] as const);

export function parseMoonAssetOverlayV591(value: unknown): MoonAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-moon-overlay-shape");
  const overlay = value as MoonAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-moon-asset-overlay-v1"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-moon-overlay-seal");
  if (
    overlay.noNetworkRequestsPerformed !== true
    || overlay.derivationDeterministic !== true
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-moon-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== MOON_REQUIRED_ASSET_IDS_V591.length) {
    throw new Error("v591-moon-overlay-assets");
  }
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly VisualAssetEntryV591[]) {
    const expected = EXPECTED_DIMENSIONS_V591[asset.id];
    const isAlbedo = asset.id === "moon-albedo";
    if (
      !MOON_REQUIRED_ASSET_IDS_V591.includes(asset.id as typeof MOON_REQUIRED_ASSET_IDS_V591[number])
      || ids.has(asset.id)
      || asset.body !== "moon"
      || asset.presentationOnly !== true
      || asset.source.license.id !== "NASA-public-domain"
      || !ALLOWED_MOON_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || asset.source.bitDepth !== 16
      || asset.source.width !== (isAlbedo ? 8192 : 5760)
      || asset.source.height !== (isAlbedo ? 4096 : 2880)
      || !expected
      || asset.derivation.seamMeanAbsoluteDelta !== 0
    ) throw new Error(`v591-moon-overlay-provenance:${asset.id}`);
    if (!isAlbedo) {
      const range = asset.derivation.sourceRangeRaw;
      if (
        range?.minimum !== 2037
        || range.maximum !== 41371
        || Math.abs(range.mean - 18961.595629099153) > 1e-9
        || asset.derivation.heightMetersPerRawUnit !== 0.5
        || asset.derivation.lunarRadiusMeters !== 1_737_400
        || asset.derivation.normalReliefGain !== 1.35
        || asset.derivation.vertexReliefGain !== 1
      ) throw new Error(`v591-moon-overlay-height-contract:${asset.id}`);
    }
    ids.add(asset.id);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    const expectedColorSpace = isAlbedo ? "srgb" : "linear";
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0]
      || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktop[0]
      || asset.variants.desktopFallback.height !== expected.desktop[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0]
      || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0]
      || asset.variants.mobileFallback.height !== expected.mobile[1]
      || asset.variants.desktopKtx2.colorSpace !== expectedColorSpace
      || asset.variants.desktopFallback.colorSpace !== expectedColorSpace
      || asset.variants.mobileKtx2.colorSpace !== expectedColorSpace
      || asset.variants.mobileFallback.colorSpace !== expectedColorSpace
    ) throw new Error(`v591-moon-overlay-quality:${asset.id}`);
  }
  if (MOON_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-moon-overlay-required-assets");
  return overlay;
}

export async function loadMoonAssetOverlayV591(signal?: AbortSignal): Promise<MoonAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${MOON_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-moon-overlay-fetch:${response.status}`);
    return parseMoonAssetOverlayV591(await response.json());
  }
  moonOverlayPromiseV591 ??= fetch(`${MOON_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-moon-overlay-fetch:${response.status}`);
      return parseMoonAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      moonOverlayPromiseV591 = null;
      throw error;
    });
  return moonOverlayPromiseV591;
}

export function parseMercuryAssetOverlayV591(value: unknown): MercuryAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-mercury-overlay-shape");
  const overlay = value as MercuryAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-mercury-asset-overlay-v1"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-mercury-overlay-seal");
  if (
    overlay.noNetworkRequestsPerformed !== true
    || overlay.exactByteV589AlbedoSourceReuse !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-mercury-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== MERCURY_REQUIRED_ASSET_IDS_V591.length) throw new Error("v591-mercury-overlay-assets");
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly VisualAssetEntryV591[]) {
    const isAlbedo = asset.id === "mercury-albedo";
    const expected = EXPECTED_DIMENSIONS_V591[asset.id];
    if (
      !MERCURY_REQUIRED_ASSET_IDS_V591.includes(asset.id as typeof MERCURY_REQUIRED_ASSET_IDS_V591[number])
      || ids.has(asset.id)
      || asset.body !== "mercury"
      || asset.presentationOnly !== true
      || !ALLOWED_MERCURY_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || asset.source.license.id !== (isAlbedo ? "NASA-public-domain" : "USGS-public-domain")
      || asset.source.width !== (isAlbedo ? 6132 : 23040)
      || asset.source.height !== (isAlbedo ? 3066 : 11520)
      || asset.source.bitDepth !== (isAlbedo ? 8 : 16)
      || (isAlbedo && asset.source.exactByteV589SourceReuse !== true)
      || !expected
      || asset.derivation.seamMeanAbsoluteDelta !== 0
    ) throw new Error(`v591-mercury-overlay-provenance:${asset.id}`);
    if (!isAlbedo) {
      const range = asset.derivation.sourceRangeMeters;
      if (
        range?.minimum !== -10764
        || range.maximum !== 8994
        || Math.abs(range.mean - -478.08443944860386) > 1e-9
        || asset.derivation.mercuryRadiusMeters !== 2_439_700
        || asset.derivation.normalReliefGain !== 1.7
        || asset.derivation.vertexReliefGain !== 1
      ) throw new Error(`v591-mercury-overlay-height-contract:${asset.id}`);
    }
    ids.add(asset.id);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    const expectedColorSpace = isAlbedo ? "srgb" : "linear";
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0]
      || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktop[0]
      || asset.variants.desktopFallback.height !== expected.desktop[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0]
      || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0]
      || asset.variants.mobileFallback.height !== expected.mobile[1]
      || asset.variants.desktopKtx2.colorSpace !== expectedColorSpace
      || asset.variants.mobileKtx2.colorSpace !== expectedColorSpace
    ) throw new Error(`v591-mercury-overlay-quality:${asset.id}`);
  }
  if (MERCURY_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-mercury-overlay-required-assets");
  return overlay;
}

export async function loadMercuryAssetOverlayV591(signal?: AbortSignal): Promise<MercuryAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${MERCURY_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-mercury-overlay-fetch:${response.status}`);
    return parseMercuryAssetOverlayV591(await response.json());
  }
  mercuryOverlayPromiseV591 ??= fetch(`${MERCURY_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-mercury-overlay-fetch:${response.status}`);
      return parseMercuryAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      mercuryOverlayPromiseV591 = null;
      throw error;
    });
  return mercuryOverlayPromiseV591;
}

export function parseMarsAssetOverlayV591(value: unknown): MarsAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-mars-overlay-shape");
  const overlay = value as MarsAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-mars-asset-overlay-v3"
    || overlay.status !== "mars-usgs-viking-color-mola-terrain-admitted"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-mars-overlay-seal");
  if (
    overlay.acquisitionReceiptSha256 !== "716141e3e6c98e582a7ffc0350c08649b47577a7480a6bd07fcb176cb06e24b0"
    || overlay.albedoIdentityAuditReceiptSha256 !== "f7acac6bd69edb339b003a9b8facd1b4d1b81c496b56f15f69b63111684288d8"
    || overlay.fullAlbedoBlockedReceiptSha256 !== "e9c7c217b14c36ed93d0879f9049c1ed18b4af2a5148336b595b870a92b2ca74"
    || overlay.albedoResampleAuditReceiptSha256 !== "b97619365064d0102b4abe176d2c3458625a02423792ff5ec1c5db4a5bb8b856"
    || overlay.compositeRejectionReceiptSha256 !== "7e4ecd303c0cd229da38cbbffc81b78d3f966fb77df50b2fd15161fca4db3dff"
    || overlay.preservedNegativeEvidence?.nasa3dTiffBlockedReceiptSha256 !== "486e5b95ae253b453008b8ba273d03c470d8167feda6288054448d9c77e48e98"
    || overlay.preservedNegativeEvidence?.nasa3dJpegBlockedReceiptSha256 !== "9c92e6de88f723924a0b1d80a1cd965598bd303fd306d6a4b81a5af9e476af5e"
    || overlay.noNetworkRequestsPerformed !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
    || !Array.isArray(overlay.blockers)
    || overlay.blockers.length !== 0
  ) throw new Error("v591-mars-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== MARS_REQUIRED_ASSET_IDS_V591.length) {
    throw new Error("v591-mars-overlay-assets");
  }
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly MarsVisualAssetEntryV591[]) {
    const expected = MARS_EXPECTED_DIMENSIONS_V591[asset.id];
    const albedo = asset.id === "mars-albedo";
    const expectedHost = albedo ? "astrogeology.usgs.gov" : "pds-geosciences.wustl.edu";
    const expectedRole = asset.id === "mars-albedo" ? "usgs-viking-color-bounded-resample"
      : asset.id === "mars-normal" ? "mola-height-derived-normal"
        : asset.id === "mars-roughness" ? "mola-height-derived-dust-roughness"
          : "mola-height-presentation-relief";
    if (
      !MARS_REQUIRED_ASSET_IDS_V591.includes(asset.id as typeof MARS_REQUIRED_ASSET_IDS_V591[number])
      || ids.has(asset.id)
      || asset.body !== "mars"
      || asset.role !== expectedRole
      || asset.presentationOnly !== true
      || asset.source.acquisitionReceiptSha256 !== overlay.acquisitionReceiptSha256
      || asset.source.host !== expectedHost
      || !ALLOWED_MARS_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || asset.source.license.id !== (albedo ? "NASA-USGS-public-domain" : "NASA-PDS-public-domain")
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || !expected
    ) throw new Error(`v591-mars-overlay-provenance:${asset.id}`);
    if (albedo) {
      const parameters = asset.derivation.parameters;
      if (
        asset.source.width !== 1024
        || asset.source.height !== 512
        || asset.source.sha256 !== "1368021e0416da0f626a337bd79d8b26e6e67b2b8b49cccb6103dad25b333a9b"
        || asset.resampleAuditReceiptSha256 !== overlay.albedoResampleAuditReceiptSha256
        || !asset.observationDisclosure?.includes("not native 8K observation detail")
        || typeof parameters !== "object"
        || parameters === null
        || parameters.sourceDetailCeiling !== "1024x512"
        || parameters.highFrequencySourceAdded !== false
        || parameters.generativeOrAiDetail !== false
      ) throw new Error(`v591-mars-overlay-albedo-contract:${asset.id}`);
    } else {
      const range = asset.derivation.sourceRangeMeters;
      if (
        asset.source.width !== 5760
        || asset.source.height !== 2880
        || asset.source.bitDepth !== 16
        || asset.source.sha256 !== "d18d9b9ab8c5516d02e157dd2cde0f1d0d160c21940e953ba22391269a545e7b"
        || range?.minimum !== -8177
        || range.maximum !== 21171
        || Math.abs(range.mean - (-721.1070361930941)) > 1e-9
        || asset.derivation.marsRadiusMeters !== 3_396_000
        || asset.derivation.normalReliefGain !== 1.6
      ) throw new Error(`v591-mars-overlay-terrain-contract:${asset.id}`);
    }
    ids.add(asset.id);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    const expectedColorSpace = albedo ? "srgb" : "linear";
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0]
      || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktopFallback[0]
      || asset.variants.desktopFallback.height !== expected.desktopFallback[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0]
      || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0]
      || asset.variants.mobileFallback.height !== expected.mobile[1]
      || asset.variants.liteDesktop.width !== 1024
      || asset.variants.liteDesktop.height !== 512
      || asset.variants.liteMobile.width !== 512
      || asset.variants.liteMobile.height !== 256
      || asset.variants.desktopKtx2.colorSpace !== expectedColorSpace
      || asset.variants.desktopFallback.colorSpace !== expectedColorSpace
      || asset.variants.mobileKtx2.colorSpace !== expectedColorSpace
      || asset.variants.mobileFallback.colorSpace !== expectedColorSpace
      || asset.variants.liteDesktop.colorSpace !== expectedColorSpace
      || asset.variants.liteMobile.colorSpace !== expectedColorSpace
    ) throw new Error(`v591-mars-overlay-quality:${asset.id}`);
  }
  if (MARS_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-mars-overlay-required-assets");
  return overlay;
}

export async function loadMarsAssetOverlayV591(signal?: AbortSignal): Promise<MarsAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${MARS_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-mars-overlay-fetch:${response.status}`);
    return parseMarsAssetOverlayV591(await response.json());
  }
  marsOverlayPromiseV591 ??= fetch(`${MARS_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-mars-overlay-fetch:${response.status}`);
      return parseMarsAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      marsOverlayPromiseV591 = null;
      throw error;
    });
  return marsOverlayPromiseV591;
}

export function parseJupiterAssetOverlayV591(value: unknown): JupiterAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-jupiter-overlay-shape");
  const overlay = value as JupiterAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-jupiter-asset-overlay-v1"
    || !["jupiter-assets-derived-awaiting-runtime-admission", "jupiter-runtime-admitted"].includes(overlay.status)
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-jupiter-overlay-seal");
  if (
    overlay.acquisitionReceiptSha256 !== "f69fe164189ffd29d5dd8d805cace552b5281a1446c60ebec344c7e72379660d"
    || overlay.noNetworkRequestsPerformed !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-jupiter-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== JUPITER_REQUIRED_ASSET_IDS_V591.length) {
    throw new Error("v591-jupiter-overlay-assets");
  }
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly VisualAssetEntryV591[]) {
    const expected = EXPECTED_DIMENSIONS_V591[asset.id];
    const isAlbedo = asset.id === "jupiter-albedo";
    if (
      !JUPITER_REQUIRED_ASSET_IDS_V591.includes(asset.id as typeof JUPITER_REQUIRED_ASSET_IDS_V591[number])
      || ids.has(asset.id)
      || asset.body !== "jupiter"
      || asset.presentationOnly !== true
      || asset.source.acquisitionReceiptSha256 !== overlay.acquisitionReceiptSha256
      || asset.source.host !== "assets.science.nasa.gov"
      || !ALLOWED_JUPITER_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || asset.source.license.id !== "NASA-JPL-public-domain"
      || asset.source.width !== 3601
      || asset.source.height !== 1801
      || asset.source.bitDepth !== 8
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || asset.derivation.sourceDetailCeiling !== "3601x1801"
      || !expected
    ) throw new Error(`v591-jupiter-overlay-provenance:${asset.id}`);
    if (isAlbedo && asset.role !== "cassini-global-albedo") throw new Error(`v591-jupiter-overlay-role:${asset.id}`);
    if (!isAlbedo && asset.role !== "cassini-derived-latitudinal-flow-mask" && asset.role !== "cassini-derived-great-red-spot-mask") {
      throw new Error(`v591-jupiter-overlay-role:${asset.id}`);
    }
    ids.add(asset.id);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    const expectedColorSpace = isAlbedo ? "srgb" : "linear";
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0]
      || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktop[0]
      || asset.variants.desktopFallback.height !== expected.desktop[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0]
      || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0]
      || asset.variants.mobileFallback.height !== expected.mobile[1]
      || asset.variants.desktopKtx2.colorSpace !== expectedColorSpace
      || asset.variants.desktopFallback.colorSpace !== expectedColorSpace
      || asset.variants.mobileKtx2.colorSpace !== expectedColorSpace
      || asset.variants.mobileFallback.colorSpace !== expectedColorSpace
      || asset.variants.liteDesktop.width !== 1024
      || asset.variants.liteDesktop.height !== 512
      || asset.variants.liteMobile.width !== 512
      || asset.variants.liteMobile.height !== 256
      || asset.variants.liteDesktop.colorSpace !== expectedColorSpace
      || asset.variants.liteMobile.colorSpace !== expectedColorSpace
    ) throw new Error(`v591-jupiter-overlay-quality:${asset.id}`);
    if (!isAlbedo && (asset.derivation.stormMaskMaximum !== 255 || Math.abs((asset.derivation.stormMaskMean ?? NaN) - 4.747074755206474) > 1e-12)) {
      throw new Error(`v591-jupiter-overlay-mask-contract:${asset.id}`);
    }
  }
  if (JUPITER_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-jupiter-overlay-required-assets");
  return overlay;
}

export async function loadJupiterAssetOverlayV591(signal?: AbortSignal): Promise<JupiterAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${JUPITER_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-jupiter-overlay-fetch:${response.status}`);
    return parseJupiterAssetOverlayV591(await response.json());
  }
  jupiterOverlayPromiseV591 ??= fetch(`${JUPITER_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-jupiter-overlay-fetch:${response.status}`);
      return parseJupiterAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      jupiterOverlayPromiseV591 = null;
      throw error;
    });
  return jupiterOverlayPromiseV591;
}

export function parseSaturnAssetOverlayV591(value: unknown): SaturnAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-saturn-overlay-shape");
  const overlay = value as SaturnAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-saturn-asset-overlay-v1"
    || !["saturn-assets-derived-awaiting-runtime-admission", "saturn-runtime-admitted"].includes(overlay.status)
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-saturn-overlay-seal");
  if (
    overlay.acquisitionReceiptSha256 !== "9eba7e8c9a194ea4b321c9ef368cf40028a6c8d2e6c12ea7a608f4c51435a15b"
    || overlay.atmosphereSupplementReceiptSha256 !== "3d4fc5ffeb67c23f90bc1927934a04df46f7f92483976026e1e76b1422eaafbf"
    || overlay.noNetworkRequestsPerformed !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.mirroredObservedSectorDisclosure !== true
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
    || overlay.ringGeometry?.radialUv !== true
    || overlay.ringGeometry?.premultipliedAlpha !== true
    || overlay.ringGeometry?.depthWrite !== false
    || overlay.ringGeometry?.depthTest !== true
  ) throw new Error("v591-saturn-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== SATURN_REQUIRED_ASSET_IDS_V591.length) throw new Error("v591-saturn-overlay-assets");
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly VisualAssetEntryV591[]) {
    const expected = EXPECTED_DIMENSIONS_V591[asset.id];
    const expectedSource = asset.id === "saturn-polar-detail"
      ? { receipt: overlay.acquisitionReceiptSha256, width: 5001, height: 5301, sha256: "6eb81d651f115a557dc27de310c7e02a0a417b4089738894680c6aeca4a00c0f" }
      : asset.id.startsWith("saturn-ring-")
        ? { receipt: overlay.acquisitionReceiptSha256, width: 1959, height: 1000, sha256: "bfc76184160b70e7647a2a8d2609372378059be5e62ab73675345fc35343e21f" }
        : { receipt: overlay.atmosphereSupplementReceiptSha256, width: 8888, height: 4544, sha256: "1095bbfe968cbac1a5b905fac02a244ed4686ff04fb3d55ebc1a71a67b387b77" };
    if (
      !SATURN_REQUIRED_ASSET_IDS_V591.includes(asset.id as typeof SATURN_REQUIRED_ASSET_IDS_V591[number])
      || ids.has(asset.id)
      || asset.body !== "saturn"
      || asset.presentationOnly !== true
      || asset.source.acquisitionReceiptSha256 !== expectedSource.receipt
      || asset.source.host !== "images-assets.nasa.gov"
      || !ALLOWED_SATURN_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || asset.source.license.id !== "NASA-JPL-public-domain"
      || asset.source.width !== expectedSource.width
      || asset.source.height !== expectedSource.height
      || asset.source.sha256 !== expectedSource.sha256
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || !expected
    ) throw new Error(`v591-saturn-overlay-provenance:${asset.id}`);
    const expectedRole = asset.id === "saturn-atmosphere-albedo" ? "cassini-global-atmosphere-albedo"
      : asset.id === "saturn-band-mask" ? "cassini-derived-latitudinal-band-mask"
        : asset.id === "saturn-polar-detail" ? "cassini-north-polar-morphology"
          : asset.id === "saturn-ring-color" ? "cassini-derived-radial-ring-color"
            : "cassini-derived-radial-ring-optical-depth";
    if (asset.role !== expectedRole) throw new Error(`v591-saturn-overlay-role:${asset.id}`);
    ids.add(asset.id);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    const expectedColorSpace = asset.id === "saturn-atmosphere-albedo" || asset.id === "saturn-ring-color" ? "srgb" : "linear";
    const expectedLite = asset.id === "saturn-polar-detail"
      ? { desktop: [512, 512], mobile: [256, 256] }
      : asset.id.startsWith("saturn-ring-")
        ? { desktop: [1024, 32], mobile: [512, 16] }
        : { desktop: [1024, 512], mobile: [512, 256] };
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0]
      || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktop[0]
      || asset.variants.desktopFallback.height !== expected.desktop[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0]
      || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0]
      || asset.variants.mobileFallback.height !== expected.mobile[1]
      || asset.variants.liteDesktop.width !== expectedLite.desktop[0]
      || asset.variants.liteDesktop.height !== expectedLite.desktop[1]
      || asset.variants.liteMobile.width !== expectedLite.mobile[0]
      || asset.variants.liteMobile.height !== expectedLite.mobile[1]
      || asset.variants.desktopKtx2.colorSpace !== expectedColorSpace
      || asset.variants.desktopFallback.colorSpace !== expectedColorSpace
      || asset.variants.mobileKtx2.colorSpace !== expectedColorSpace
      || asset.variants.mobileFallback.colorSpace !== expectedColorSpace
      || asset.variants.liteDesktop.colorSpace !== expectedColorSpace
      || asset.variants.liteMobile.colorSpace !== expectedColorSpace
    ) throw new Error(`v591-saturn-overlay-quality:${asset.id}`);
  }
  if (SATURN_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-saturn-overlay-required-assets");
  return overlay;
}

export async function loadSaturnAssetOverlayV591(signal?: AbortSignal): Promise<SaturnAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${SATURN_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-saturn-overlay-fetch:${response.status}`);
    return parseSaturnAssetOverlayV591(await response.json());
  }
  saturnOverlayPromiseV591 ??= fetch(`${SATURN_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-saturn-overlay-fetch:${response.status}`);
      return parseSaturnAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      saturnOverlayPromiseV591 = null;
      throw error;
    });
  return saturnOverlayPromiseV591;
}

export function parseVenusAssetOverlayV591(value: unknown): VenusAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-venus-overlay-shape");
  const overlay = value as VenusAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-venus-asset-overlay-v1"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-venus-overlay-seal");
  if (
    overlay.noNetworkRequestsPerformed !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.cloudModel?.observationTextureClaim !== false
    || overlay.cloudModel?.resourceMissingFallback !== false
    || overlay.cloudModel?.presentationOnly !== true
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-venus-overlay-authority");
  if (overlay.status === "venus-assets-blocked-incomplete-source") {
    if (overlay.assets.length !== 0 || !Array.isArray(overlay.blockers) || overlay.blockers.length < 2) {
      throw new Error("v591-venus-overlay-blocked-contract");
    }
    for (const blocker of overlay.blockers) {
      if (!blocker || typeof blocker.code !== "string" || !SHA256_PATTERN_V591.test(blocker.receiptSha256) || typeof blocker.detail !== "string") {
        throw new Error("v591-venus-overlay-blocker-identity");
      }
    }
    return overlay;
  }
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== VENUS_REQUIRED_ASSET_IDS_V591.length) throw new Error("v591-venus-overlay-assets");
  const multiview = overlay.assets.every((asset) => asset.source.host === "images-assets.nasa.gov");
  const multiviewSources = Object.freeze([
    Object.freeze({ id: "venus-magellan-0e", receipt: "bd8281ea2d55e5cd487c12f3919003e9965088dcf0b9debb6f50fe61488f0538", sha256: "031816fb0d5ed9c04f18753b1d896ced4cfddfaf3f3073950253859f9abd0379", width: 4096, height: 4096, longitudeEastDeg: 0 }),
    Object.freeze({ id: "venus-magellan-90e", receipt: "34dbad98e79dc32eda90220f15012ce176b9c4e68e15b397368bbc85a58f5831", sha256: "98c77004dd66ad924e38ceec76aaeb2504d2b4a27c5c1d84d95fd9e5bd3a0b8d", width: 4096, height: 4096, longitudeEastDeg: 90 }),
    Object.freeze({ id: "venus-magellan-270e", receipt: "966f8c03afe6762166eef798a9b1d5a4cbab257856a730dc618eb94109114150", sha256: "22b1457c717bb776078854d1a4025824419f1f313b6aed6f566bd3068c751d59", width: 6000, height: 6000, longitudeEastDeg: 270 }),
  ]);
  if (multiview) {
    const surfaceCoverage = overlay.surfaceCoverage as Readonly<Record<string, unknown>> | undefined;
    if (
      overlay.acquisitionReceiptSha256 !== "92e260e672b80628a78a89ad5539ceea540af648d639484ebac7ac209faa133c"
      || overlay.sourceReceiptSha256s?.length !== multiviewSources.length
      || multiviewSources.some((source, index) => overlay.sourceReceiptSha256s?.[index] !== source.receipt)
      || surfaceCoverage?.gridReferencePolicy !== "PIA00478-excluded-after-visual-qa-grid-and-label-contamination"
      || surfaceCoverage?.measuredTopographyClaim !== false
    ) throw new Error("v591-venus-overlay-multiview-chain");
  }
  const ids = new Set<string>();
  for (const asset of overlay.assets as readonly VenusVisualAssetEntryV591[]) {
    const assetId = asset.id as typeof VENUS_REQUIRED_ASSET_IDS_V591[number];
    const expected = VENUS_EXPECTED_DIMENSIONS_V591[assetId];
    if (
      !VENUS_REQUIRED_ASSET_IDS_V591.includes(assetId)
      || ids.has(asset.id)
      || asset.body !== "venus"
      || asset.presentationOnly !== true
      || !ALLOWED_VENUS_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || asset.source.license.id !== (multiview ? "NASA-public-domain" : "USGS-public-domain")
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || !expected
    ) throw new Error(`v591-venus-overlay-provenance:${asset.id}`);
    const isSurface = asset.id === "venus-surface";
    const expectedRole = multiview
      ? isSurface ? "magellan-multiview-radar-surface"
        : asset.id === "venus-normal" ? "magellan-radar-derived-normal"
          : asset.id === "venus-roughness" ? "magellan-radar-derived-roughness"
            : "magellan-radar-presentation-relief"
      : isSurface ? "magellan-colorized-radar-surface"
        : asset.id === "venus-normal" ? "magellan-color-topography-derived-normal"
          : asset.id === "venus-roughness" ? "magellan-color-topography-derived-roughness"
            : "magellan-color-topography-presentation-relief";
    if (asset.role !== expectedRole) throw new Error(`v591-venus-overlay-role:${asset.id}`);
    if (multiview) {
      if (
        asset.source.acquisitionReceiptSha256 !== multiviewSources[0].receipt
        || asset.source.sha256 !== multiviewSources[0].sha256
        || asset.source.width !== multiviewSources[0].width
        || asset.source.height !== multiviewSources[0].height
        || asset.sourceComponents?.length !== multiviewSources.length
      ) throw new Error(`v591-venus-overlay-multiview-source:${asset.id}`);
      for (const [index, source] of multiviewSources.entries()) {
        const component = asset.sourceComponents[index];
        if (
          !component
          || component.id !== source.id
          || component.acquisitionReceiptSha256 !== source.receipt
          || component.sha256 !== source.sha256
          || component.width !== source.width
          || component.height !== source.height
          || component.longitudeEastDeg !== source.longitudeEastDeg
          || component.host !== "images-assets.nasa.gov"
          || component.license.id !== "NASA-public-domain"
          || component.gridReference !== false
        ) throw new Error(`v591-venus-overlay-multiview-component:${asset.id}:${index}`);
      }
      if (asset.derivation.gridReferenceWeightFraction !== 0 || !asset.derivation.observationLimit?.includes("not physical elevation")) {
        throw new Error(`v591-venus-overlay-multiview-disclosure:${asset.id}`);
      }
    } else if (asset.source.width < 5000 || asset.source.height < 2500) {
      throw new Error(`v591-venus-overlay-source-quality:${asset.id}`);
    }
    ids.add(asset.id);
    for (const file of Object.values(asset.variants) as VisualAssetFileV591[]) validateVariantV591(asset.id, file, file.format);
    const expectedColorSpace = isSurface ? "srgb" : "linear";
    if (
      asset.variants.desktopKtx2.width !== expected.desktop[0] || asset.variants.desktopKtx2.height !== expected.desktop[1]
      || asset.variants.desktopFallback.width !== expected.desktop[0] || asset.variants.desktopFallback.height !== expected.desktop[1]
      || asset.variants.mobileKtx2.width !== expected.mobile[0] || asset.variants.mobileKtx2.height !== expected.mobile[1]
      || asset.variants.mobileFallback.width !== expected.mobile[0] || asset.variants.mobileFallback.height !== expected.mobile[1]
      || asset.variants.desktopKtx2.colorSpace !== expectedColorSpace || asset.variants.desktopFallback.colorSpace !== expectedColorSpace
      || asset.variants.mobileKtx2.colorSpace !== expectedColorSpace || asset.variants.mobileFallback.colorSpace !== expectedColorSpace
      || asset.variants.liteDesktop.width !== 1024 || asset.variants.liteDesktop.height !== 512
      || asset.variants.liteMobile.width !== 512 || asset.variants.liteMobile.height !== 256
    ) throw new Error(`v591-venus-overlay-quality:${asset.id}`);
  }
  if (VENUS_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-venus-overlay-required-assets");
  return overlay;
}

export async function loadVenusAssetOverlayV591(signal?: AbortSignal): Promise<VenusAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${VENUS_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-venus-overlay-fetch:${response.status}`);
    return parseVenusAssetOverlayV591(await response.json());
  }
  venusOverlayPromiseV591 ??= fetch(`${VENUS_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-venus-overlay-fetch:${response.status}`);
      return parseVenusAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      venusOverlayPromiseV591 = null;
      throw error;
    });
  return venusOverlayPromiseV591;
}

const BENNU_MODEL_SOURCE_SHA256_V589 = "bd580d0d01ee7e93b25e0262b5c986cacb21ff240a8600158fa570c7d085b95f";
const BENNU_MODEL_LOD_RECEIPT_SHA256_V589 = "1329e20befa500150b8eadbb81577c69d4b2c7c42a3f849ecad1fe9e65375195";
const BENNU_MODEL_LOD_SHA256_V589 = Object.freeze([
  "b18127153437a6ea8ed9c29fe0af7341bb464efe08870f12b63778a0763f2083",
  "b9991bd5bac057a79d8f860b70d9120444261a4f454f859635b2b98c101c1ebb",
  "5b494905c23d3fd905025679035b22597b7f4442c6bcc7bc7ad4f19cdae2714c",
] as const);
const BENNU_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "bennu-regolith-albedo",
  "bennu-regolith-normal",
  "bennu-regolith-roughness",
] as const);

export function parseBennuAssetOverlayV591(value: unknown): BennuAssetOverlayV591 {
  if (!value || typeof value !== "object") throw new Error("v591-bennu-overlay-shape");
  const overlay = value as BennuAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-bennu-asset-overlay-v1"
    || !["bennu-assets-derived-awaiting-runtime-admission", "bennu-runtime-admitted"].includes(overlay.status)
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
  ) throw new Error("v591-bennu-overlay-seal");
  if (
    overlay.noNetworkRequestsPerformedDuringDerivation !== true
    || overlay.noModelBytesCopied !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-bennu-overlay-authority");
  const model = overlay.inheritedModel;
  if (
    model?.candidate !== "v589-readonly"
    || model.manifestPath !== "public/data/celestial-art-v589/manifest.json"
    || model.manifestSha256 !== CELESTIAL_ART_MANIFEST_SHA256_V589
    || model.assetId !== "bennu-model"
    || model.sourceBytes !== 60_591_548
    || model.sourceSha256 !== BENNU_MODEL_SOURCE_SHA256_V589
    || model.license?.id !== "NASA-public-domain"
    || model.lodReceiptPath !== "docs/release/v589/bennu-lod-receipt-v589.json"
    || model.lodReceiptSha256 !== BENNU_MODEL_LOD_RECEIPT_SHA256_V589
    || model.lods?.length !== 3
  ) throw new Error("v591-bennu-overlay-model");
  for (const [index, lod] of model.lods.entries()) {
    if (
      lod.lod !== index
      || lod.sha256 !== BENNU_MODEL_LOD_SHA256_V589[index]
      || lod.path !== `public/models/candidate-v589/bennu/bennu-lod${index}.glb`
      || !Number.isSafeInteger(lod.bytes)
      || lod.bytes <= 0
      || !Number.isSafeInteger(lod.triangleCount)
      || lod.triangleCount <= 0
      || lod.normals !== true
      || lod.meshopt !== true
      || lod.pivot !== "bounds-midpoint"
      || lod.units !== "normalized-diameter-2"
      || lod.rotationAxis !== "source-frame-y-up"
    ) throw new Error(`v591-bennu-overlay-model-lod:${index}`);
  }
  if (
    overlay.materialPolicy?.substrate !== "bounded-low-albedo-carbonaceous-reference"
    || overlay.materialPolicy?.microtexture !== "poly-haven-cc0-presentation-only-not-bennu-observation"
    || overlay.materialPolicy?.reflectance !== "oren-nayar-plus-bounded-opposition-no-glossy-specular"
  ) throw new Error("v591-bennu-overlay-material-policy");
  if (!Array.isArray((overlay as unknown as { assets?: unknown }).assets)) throw new Error("v591-bennu-overlay-assets");
  const assets: readonly BennuVisualAssetEntryV591[] = overlay.assets;
  if (assets.length !== BENNU_REQUIRED_ASSET_IDS_V591.length) {
    throw new Error("v591-bennu-overlay-assets");
  }
  const ids = new Set<string>();
  for (const asset of assets) {
    if (ids.has(asset.id)) throw new Error(`v591-bennu-overlay-duplicate:${asset.id}`);
    ids.add(asset.id);
    const expected = BENNU_EXPECTED_DIMENSIONS_V591[asset.id];
    const expectedColorSpace = asset.id === "bennu-regolith-albedo" ? "srgb" : "linear";
    if (
      !expected
      || asset.body !== "bennu"
      || asset.presentationOnly !== true
      || asset.source.acquisitionReceiptSha256 !== overlay.acquisitionReceiptSha256
      || asset.source.license?.id !== "Poly-Haven-CC0"
      || !ALLOWED_BENNU_SOURCE_HOSTS_V591.has(asset.source.host)
      || new URL(asset.source.finalUrl).hostname !== asset.source.host
      || !asset.source.path.startsWith("source-cache/celestial-convergence-v591/bennu/")
      || !SHA256_PATTERN_V591.test(asset.source.sha256)
      || asset.source.width !== 4096
      || asset.source.height !== 4096
      || !asset.source.observationLimit.includes("not Bennu")
      || asset.fullQualityMinimum.desktop.width !== expected.desktop[0]
      || asset.fullQualityMinimum.desktop.height !== expected.desktop[1]
      || asset.fullQualityMinimum.mobile.width !== expected.mobile[0]
      || asset.fullQualityMinimum.mobile.height !== expected.mobile[1]
    ) throw new Error(`v591-bennu-overlay-provenance:${asset.id}`);
    validateVariantV591(asset.id, asset.variants.desktopKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.desktopFallback, "webp");
    validateVariantV591(asset.id, asset.variants.mobileKtx2, "ktx2");
    validateVariantV591(asset.id, asset.variants.mobileFallback, "webp");
    validateVariantV591(asset.id, asset.variants.liteDesktop, "webp");
    validateVariantV591(asset.id, asset.variants.liteMobile, "webp");
    if (
      asset.variants.desktopKtx2.width !== 4096
      || asset.variants.desktopKtx2.height !== 4096
      || asset.variants.desktopFallback.width !== 4096
      || asset.variants.desktopFallback.height !== 4096
      || asset.variants.mobileKtx2.width !== 2048
      || asset.variants.mobileKtx2.height !== 2048
      || asset.variants.mobileFallback.width !== 2048
      || asset.variants.mobileFallback.height !== 2048
      || asset.variants.liteDesktop.width !== 1024
      || asset.variants.liteDesktop.height !== 1024
      || asset.variants.liteMobile.width !== 512
      || asset.variants.liteMobile.height !== 512
      || (Object.values(asset.variants) as VisualAssetFileV591[]).some((file) => file.colorSpace !== expectedColorSpace)
    ) throw new Error(`v591-bennu-overlay-variants:${asset.id}`);
  }
  if (BENNU_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-bennu-overlay-required-assets");
  return overlay;
}

export async function loadBennuAssetOverlayV591(signal?: AbortSignal): Promise<BennuAssetOverlayV591> {
  const url = `${BENNU_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591}`;
  if (signal) {
    const response = await fetch(url, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-bennu-overlay-fetch:${response.status}`);
    return parseBennuAssetOverlayV591(await response.json());
  }
  bennuOverlayPromiseV591 ??= fetch(url, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-bennu-overlay-fetch:${response.status}`);
      return parseBennuAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      bennuOverlayPromiseV591 = null;
      throw error;
    });
  return bennuOverlayPromiseV591;
}

const EARTH_REQUIRED_ASSET_IDS_V591 = Object.freeze([
  "earth-albedo",
  "earth-normal",
  "earth-roughness",
  "earth-clouds",
  "earth-cloud-alpha",
  "earth-night",
  "earth-night-mask",
] as const);

export function parseEarthAssetOverlayV591(value: unknown): EarthAssetOverlayV591 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v591-earth-overlay-shape");
  const overlay = value as EarthAssetOverlayV591;
  const unsigned = { ...(overlay as unknown as Record<string, unknown>) };
  delete unsigned.receiptSha256;
  if (
    overlay.version !== "v591-earth-asset-overlay-v1"
    || overlay.status !== "earth-runtime-admitted-inherited-exact-bytes"
    || overlay.receiptSha256 !== CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591
    || sha256Utf8HexV566(JSON.stringify(canonicalizeV591(unsigned))) !== overlay.receiptSha256
    || overlay.baseline?.candidate !== "v590-readonly"
    || overlay.baseline?.manifestSha256 !== CELESTIAL_RENDERING_MANIFEST_SHA256_V590
  ) throw new Error("v591-earth-overlay-seal");
  if (
    overlay.noNetworkRequestsPerformed !== true
    || overlay.noAssetBytesCopied !== true
    || overlay.reusePolicy !== "exact-v590-sealed-asset-bytes-readonly"
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error("v591-earth-overlay-authority");
  if (!Array.isArray(overlay.assets) || overlay.assets.length !== EARTH_REQUIRED_ASSET_IDS_V591.length) {
    throw new Error("v591-earth-overlay-assets");
  }
  const ids = new Set<string>();
  for (const asset of overlay.assets) {
    if (
      ids.has(asset.id)
      || asset.body !== "earth"
      || asset.presentationOnly !== true
      || asset.inheritedIdentity?.candidate !== "v590-readonly"
      || asset.inheritedIdentity?.manifestSha256 !== CELESTIAL_RENDERING_MANIFEST_SHA256_V590
      || !SHA256_PATTERN_V591.test(asset.inheritedIdentity?.sourceSha256 ?? "")
    ) throw new Error(`v591-earth-overlay-identity:${asset.id}`);
    ids.add(asset.id);
    for (const file of Object.values(asset.variants) as (VisualAssetFileV590 | undefined)[]) {
      if (!file || !file.url.startsWith("/") || file.url.startsWith("//") || file.url.includes("\\")) {
        throw new Error(`v591-earth-overlay-variant:${asset.id}`);
      }
      const decoded = decodeURIComponent(file.url.split("?")[0]);
      if (
        decoded.split("/").includes("..")
        || !Number.isSafeInteger(file.bytes)
        || file.bytes <= 0
        || !SHA256_PATTERN_V591.test(file.sha256)
      ) throw new Error(`v591-earth-overlay-variant:${asset.id}`);
    }
  }
  if (EARTH_REQUIRED_ASSET_IDS_V591.some((id) => !ids.has(id))) throw new Error("v591-earth-overlay-required-assets");
  return overlay;
}

export async function loadEarthAssetOverlayV591(signal?: AbortSignal): Promise<EarthAssetOverlayV591> {
  if (signal) {
    const response = await fetch(`${EARTH_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache", signal });
    if (!response.ok) throw new Error(`v591-earth-overlay-fetch:${response.status}`);
    return parseEarthAssetOverlayV591(await response.json());
  }
  earthOverlayPromiseV591 ??= fetch(`${EARTH_OVERLAY_URL_V591}?sha256=${CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591}`, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`v591-earth-overlay-fetch:${response.status}`);
      return parseEarthAssetOverlayV591(await response.json());
    })
    .catch((error) => {
      earthOverlayPromiseV591 = null;
      throw error;
    });
  return earthOverlayPromiseV591;
}

export async function loadVerifiedVisualAssetBytesV591(file: VisualAssetFileV591, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(`${file.url}?sha256=${file.sha256}`, { cache: "force-cache", signal });
  if (!response.ok) throw new Error(`v591-asset-fetch:${response.status}:${file.url}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== file.bytes) throw new Error(`v591-asset-bytes:${file.url}`);
  if (sha256BytesHexV566(new Uint8Array(bytes)) !== file.sha256) throw new Error(`v591-asset-sha:${file.url}`);
  return bytes;
}

function runtimeForV591(gl: THREE.WebGLRenderer): LoaderRuntimeV591 {
  const current = loaderRuntimeByRendererV591.get(gl);
  if (current) return current;
  const created: LoaderRuntimeV591 = { loader: null, loaderPromise: null, prewarmPromise: null, prewarmStatus: "idle", generation: 0, assetFailures: new Map() };
  loaderRuntimeByRendererV591.set(gl, created);
  return created;
}

async function ensureKtx2LoaderV591(gl: THREE.WebGLRenderer): Promise<KTX2Loader> {
  const runtime = runtimeForV591(gl);
  if (runtime.loader) return runtime.loader;
  if (runtime.loaderPromise) return runtime.loaderPromise;
  const generation = runtime.generation;
  runtime.loaderPromise = (async () => {
    loaderModulePromiseV591 ??= import("three/examples/jsm/loaders/KTX2Loader.js");
    const { KTX2Loader } = await loaderModulePromiseV591;
    const loader = new KTX2Loader().setTranscoderPath(BASIS_PATH_V591).setWorkerLimit(1).detectSupport(gl);
    if (runtime.generation !== generation) {
      loader.dispose();
      throw new Error("v591-ktx2-loader-disposed");
    }
    runtime.loader = loader;
    return loader;
  })().catch((error) => {
    runtime.loaderPromise = null;
    throw error;
  });
  return runtime.loaderPromise;
}

function invalidateV591TextureLoader(gl: THREE.WebGLRenderer, reason: string): void {
  const runtime = runtimeForV591(gl);
  runtime.generation += 1;
  runtime.loader?.dispose();
  runtime.loader = null;
  runtime.loaderPromise = null;
  runtime.prewarmPromise = null;
  runtime.prewarmStatus = "failed";
  runtime.assetFailures.set("__loader-generation__", reason);
}

async function prewarmV591Ktx2(gl: THREE.WebGLRenderer, signal?: AbortSignal): Promise<void> {
  const runtime = runtimeForV591(gl);
  if (runtime.prewarmPromise) return runtime.prewarmPromise;
  const generation = runtime.generation;
  runtime.prewarmStatus = "warming";
  runtime.prewarmPromise = (async () => {
    const baseline = await loadVisualAssetManifestV590(signal);
    const sentinel = baseline.assets.find((asset) => asset.id === baseline.runtime.ktx2SentinelAssetId);
    const file = sentinel ? selectVisualAssetFilesV590(sentinel, "standalone-full", "desktop").primary : null;
    if (!file) throw new Error("v591-ktx2-sentinel-missing");
    const bytes = await loadVerifiedVisualAssetBytesV590(file, signal);
    const texture = await parseKtx2V590(
      await ensureKtx2LoaderV591(gl),
      bytes,
      COLD_START_TIMEOUT_MS_V591,
      () => runtime.generation === generation && !signal?.aborted,
      () => invalidateV591TextureLoader(gl, "v591-ktx2-cold-start-timeout"),
    );
    texture.dispose();
    runtime.prewarmStatus = "ready";
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV591Ktx2Prewarm = "ready";
      root.dataset.atlasV591Ktx2Sentinel = sentinel?.id ?? "missing";
    }
  })().catch((error: unknown) => {
    runtime.prewarmStatus = runtime.generation === generation ? "failed" : "disposed";
    const root = document.querySelector<HTMLElement>('[data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"]');
    if (root) {
      root.dataset.atlasV591Ktx2Prewarm = runtime.prewarmStatus;
      root.dataset.atlasV591Ktx2PrewarmReason = error instanceof Error ? error.message : "v591-ktx2-prewarm-unknown";
    }
  });
  return runtime.prewarmPromise;
}

type TextureFileV591 = VisualAssetFileV591 | VisualAssetFileV590;
type OwnedVisualAssetEntryV591 =
  | VisualAssetEntryV591
  | MarsVisualAssetEntryV591
  | BennuVisualAssetEntryV591
  | VenusVisualAssetEntryV591
  | Tempel1VisualAssetEntryV591
  | CeresVisualAssetEntryV591;
type OwnedVisualAssetIdV591 = OwnedVisualAssetEntryV591["id"];

function configureTextureV591(
  texture: THREE.Texture,
  file: TextureFileV591,
  assetId: string,
  manifestSha256: string,
  inheritedManifestSha256: string | null = null,
): THREE.Texture {
  texture.colorSpace = file.colorSpace === "srgb" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  const radialSaturnRing = assetId === "saturn-ring-color" || assetId === "saturn-ring-optical-depth";
  const triplanarBennu = assetId.startsWith("bennu-regolith-");
  const sphericalTempel1 = assetId.startsWith("tempel-1-");
  texture.wrapS = radialSaturnRing ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  texture.wrapT = triplanarBennu ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  if (sphericalTempel1) texture.flipY = false;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  texture.userData.atlasCandidate = "v591";
  texture.userData.atlasVisualAssetId = assetId;
  texture.userData.atlasVisualAssetSha256 = file.sha256;
  texture.userData.atlasVisualAssetOverlaySha256 = manifestSha256;
  texture.userData.atlasVisualAssetManifestSha256 = manifestSha256;
  texture.userData.atlasInheritedVisualAssetManifestSha256 = inheritedManifestSha256;
  texture.userData.atlasPresentationOnly = true;
  texture.userData.atlasScientificPayloadMutation = false;
  texture.userData.atlasProceduralFallback = false;
  return texture;
}

async function parseRasterV591(bytes: ArrayBuffer, file: TextureFileV591, signal?: AbortSignal): Promise<THREE.Texture> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const mime = file.format === "png" ? "image/png" : file.format === "jpeg" ? "image/jpeg" : "image/webp";
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`v591-raster-decode:${file.url}`));
    });
    image.src = url;
    const decoded = await loaded;
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (decoded.naturalWidth !== file.width || decoded.naturalHeight !== file.height) throw new Error(`v591-raster-dimensions:${file.url}`);
    return new THREE.Texture(decoded);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function acquireV591TextureResource(texture: THREE.Texture, label: string, manifestSha256: string): () => void {
  const shared = trackedTextureResourcesV591.get(texture);
  if (shared) {
    shared.references += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      shared.references -= 1;
      if (shared.references > 0) return;
      trackedTextureResourcesV591.delete(texture);
      shared.releaseRegistry();
    };
  }
  const estimate = texture instanceof THREE.CompressedTexture
    ? { estimatedBytes: estimateV590TextureGpuBytes(texture) }
    : estimateAtlasTextureBytesV289(texture);
  const releaseRegistry = acquireAtlasResource("texture", "atlas", label, {
    owner: "v591-celestial-convergence",
    estimatedBytes: estimate.estimatedBytes,
    contentSha256: texture.userData.atlasVisualAssetSha256,
    manifestSha256,
  });
  const entry = { references: 1, releaseRegistry };
  trackedTextureResourcesV591.set(texture, entry);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.references -= 1;
    if (entry.references > 0) return;
    trackedTextureResourcesV591.delete(texture);
    releaseRegistry();
  };
}

/**
 * React can commit the replacement tree before every material that referenced
 * the previous texture has left Three's render lists. Disposing only in the
 * effect cleanup lets that last render upload the texture again, after its
 * first dispose event has already fired. Repeat the disposal after two frames,
 * matching the proven v590 detach contract, so WebGLRenderer releases the
 * late upload as well.
 */
function disposeTextureAfterDetachV591(texture: THREE.Texture): void {
  texture.dispose();
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => texture.dispose()));
}

function selectFilesV591(asset: OwnedVisualAssetEntryV591, deliveryTier: CelestialDeliveryTierV590, deviceTier: CelestialDeviceTierV590) {
  if (deliveryTier === "vercel-lite") {
    return { primary: null, fallback: deviceTier === "mobile" ? asset.variants.liteMobile : asset.variants.liteDesktop };
  }
  return deviceTier === "mobile"
    ? { primary: asset.variants.mobileKtx2, fallback: asset.variants.mobileFallback }
    : { primary: asset.variants.desktopKtx2, fallback: asset.variants.desktopFallback };
}

/**
 * Lifecycle cancellation and stale loader generations are not asset defects.
 * Returning null prevents a viewport/focus transition from poisoning the
 * renderer-wide per-asset KTX2 failure cache.
 */
export function persistentV591AssetFailureReason(
  error: unknown,
  lifecycleAborted: boolean,
): string | null {
  if (lifecycleAborted) return null;
  if (error instanceof DOMException && error.name === "AbortError") return null;
  const reason = error instanceof Error ? error.message : "v591-ktx2-unknown";
  if (
    reason === "AbortError"
    || reason.includes("aborted")
    || reason.includes("ktx2-parse-disposed")
    || reason.includes("ktx2-loader-disposed")
  ) return null;
  return reason;
}

export function disposeV591TextureLoader(gl: THREE.WebGLRenderer): void {
  const runtime = runtimeForV591(gl);
  runtime.generation += 1;
  runtime.prewarmStatus = "disposed";
  runtime.loader?.dispose();
  runtime.loader = null;
  runtime.loaderPromise = null;
  runtime.prewarmPromise = null;
  runtime.assetFailures.clear();
}

export function V591Ktx2Prewarm(): null {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const abort = new AbortController();
    void prewarmV591Ktx2(gl, abort.signal);
    return () => abort.abort();
  }, [gl]);
  return null;
}

/**
 * Loads an exact-byte v590 dependency through the v591 Basis generation and
 * resource owner. This keeps frozen asset identity intact while ensuring the
 * additive scene has one cancellable KTX2 worker lane and can prove release
 * to zero without attributing new runtime ownership to v590.
 */
export function useV591ReadonlyV590Texture(
  assetId: string,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<V591TextureLoadState>(IDLE_V591);
  const generationRef = useRef(0);

  useEffect(() => {
    const effectGeneration = ++generationRef.current;
    const abort = new AbortController();
    let texture: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    const current = () => generationRef.current === effectGeneration && !abort.signal.aborted;
    if (!enabled) {
      setState(IDLE_V591);
      return () => abort.abort();
    }
    setState({ ...IDLE_V591, status: "loading", assetId, prewarmStatus: runtimeForV591(gl).prewarmStatus });
    const accept = (
      candidate: THREE.Texture,
      file: VisualAssetFileV590,
      source: "ktx2" | "full-raster" | "fallback",
      reason: string,
    ) => {
      if (!current()) {
        candidate.dispose();
        return;
      }
      texture = configureTextureV591(
        candidate,
        file,
        assetId,
        CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
        CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
      );
      texture.userData.atlasInheritedDependency = "v590-readonly";
      release = acquireV591TextureResource(
        texture,
        `v591-inherited-v590-${assetId}-${deviceTier}`,
        CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
      );
      setState({
        texture,
        status: "ready",
        source,
        assetId,
        sha256: file.sha256,
        reason,
        prewarmStatus: runtimeForV591(gl).prewarmStatus,
        // The bytes remain v590-frozen, but the v591 loader still has to
        // advertise the same verified Full admission that the old hook did.
        // `not-applicable` would make Earth appear blocked even after every
        // KTX2 channel decoded successfully.
        fullQualityGate: deliveryTier === "standalone-full"
          ? source === "ktx2" || (source === "full-raster" && reason === "verified-v590-readonly-raster")
            ? "passed"
            : "blocked-full-fallback"
          : "not-applicable",
      });
    };
    void (async () => {
      const manifest = await loadVisualAssetManifestV590(abort.signal);
      const asset = manifest.assets.find((entry) => entry.id === assetId);
      if (!asset) throw new Error(`v591-inherited-v590-asset-id:${assetId}`);
      const files = selectVisualAssetFilesV590(asset, deliveryTier, deviceTier);
      const runtime = runtimeForV591(gl);
      let primaryFailure = runtime.assetFailures.get(`inherited:${assetId}`) ?? "none";
      if (files.primary && primaryFailure === "none") {
        await prewarmV591Ktx2(gl, abort.signal);
        try {
          const generation = runtime.generation;
          const bytes = await loadVerifiedVisualAssetBytesV590(files.primary, abort.signal);
          const candidate = await parseKtx2V590(
            await ensureKtx2LoaderV591(gl),
            bytes,
            WARM_ASSET_TIMEOUT_MS_V591,
            () => current() && runtime.generation === generation,
            () => invalidateV591TextureLoader(gl, `v591-inherited-ktx2-timeout:${assetId}`),
          );
          accept(candidate, files.primary, "ktx2", "verified-v590-readonly-ktx2");
          return;
        } catch (error: unknown) {
          const persistentFailure = persistentV591AssetFailureReason(error, !current());
          if (persistentFailure === null) return;
          primaryFailure = persistentFailure;
          runtime.assetFailures.set(`inherited:${assetId}`, primaryFailure);
        }
      }
      const raster = files.fullRaster ?? files.fallback;
      if (!raster || raster.format === "ktx2" || raster.format === "glb" || raster.format === "bin" || raster.format === "json") {
        throw new Error(`v591-inherited-v590-raster-missing:${assetId}`);
      }
      const bytes = await loadVerifiedVisualAssetBytesV590(raster, abort.signal);
      accept(
        await parseRasterV591(bytes, raster, abort.signal),
        raster,
        files.fullRaster ? "full-raster" : "fallback",
        primaryFailure === "none" ? "verified-v590-readonly-raster" : `ktx2-fallback:${primaryFailure}`,
      );
    })().catch((error: unknown) => {
      if (!current()) return;
      setState({
        texture: null,
        status: "blocked",
        source: "none",
        assetId,
        sha256: "none",
        reason: error instanceof Error ? error.message : "v591-inherited-v590-asset-unknown",
        prewarmStatus: runtimeForV591(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
      });
    });
    return () => {
      abort.abort();
      release?.();
      if (texture) disposeTextureAfterDetachV591(texture);
      texture = null;
    };
  }, [assetId, deliveryTier, deviceTier, enabled, gl]);

  return state;
}

type OwnedAssetResolverV591 = (
  assetId: OwnedVisualAssetIdV591,
  signal: AbortSignal,
) => Promise<OwnedVisualAssetEntryV591>;

async function resolveSunAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadSunAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "sun");
  if (!asset) throw new Error(`v591-sun-asset-id:${assetId}`);
  return asset;
}

async function resolveMoonAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadMoonAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "moon");
  if (!asset) throw new Error(`v591-moon-asset-id:${assetId}`);
  return asset;
}

async function resolveMercuryAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadMercuryAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "mercury");
  if (!asset) throw new Error(`v591-mercury-asset-id:${assetId}`);
  return asset;
}

async function resolveMarsAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadMarsAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "mars");
  if (!asset) throw new Error(`v591-mars-asset-id:${assetId}`);
  return asset;
}

async function resolveJupiterAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadJupiterAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "jupiter");
  if (!asset) throw new Error(`v591-jupiter-asset-id:${assetId}`);
  return asset;
}

async function resolveSaturnAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadSaturnAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "saturn");
  if (!asset) throw new Error(`v591-saturn-asset-id:${assetId}`);
  return asset;
}

async function resolveBennuAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadBennuAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "bennu");
  if (!asset) throw new Error(`v591-bennu-asset-id:${assetId}`);
  return asset;
}

async function resolveVenusAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadVenusAssetOverlayV591(signal);
  if (overlay.status === "venus-assets-blocked-incomplete-source") {
    throw new Error(`v591-venus-assets-blocked:${overlay.blockers?.map((blocker) => blocker.code).join(",") ?? "unknown"}`);
  }
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "venus");
  if (!asset) throw new Error(`v591-venus-asset-id:${assetId}`);
  return asset;
}

async function resolveTempel1AssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadTempel1AssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "tempel-1");
  if (!asset) throw new Error(`v591-tempel1-asset-id:${assetId}`);
  return asset;
}

async function resolveCeresAssetV591(assetId: OwnedVisualAssetIdV591, signal: AbortSignal): Promise<OwnedVisualAssetEntryV591> {
  const overlay = await loadCeresAssetOverlayV591(signal);
  const asset = overlay.assets.find((entry) => entry.id === assetId && entry.body === "ceres");
  if (!asset) throw new Error(`v591-ceres-asset-id:${assetId}`);
  return asset;
}

function useV591OwnedTexture(
  assetId: OwnedVisualAssetIdV591,
  overlaySha256: string,
  resolveAsset: OwnedAssetResolverV591,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<V591TextureLoadState>(IDLE_V591);
  const generationRef = useRef(0);
  useEffect(() => {
    const effectGeneration = ++generationRef.current;
    const abort = new AbortController();
    let texture: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    const current = () => generationRef.current === effectGeneration && !abort.signal.aborted;
    if (!enabled) {
      setState(IDLE_V591);
      return () => abort.abort();
    }
    setState({ ...IDLE_V591, status: "loading", assetId, prewarmStatus: runtimeForV591(gl).prewarmStatus });
    const accept = (candidate: THREE.Texture, file: VisualAssetFileV591, source: "ktx2" | "fallback", reason: string) => {
      if (!current()) {
        candidate.dispose();
        return;
      }
      texture = configureTextureV591(candidate, file, assetId, overlaySha256);
      release = acquireV591TextureResource(texture, `v591-${assetId}-${deviceTier}`, overlaySha256);
      setState({
        texture,
        status: "ready",
        source,
        assetId,
        sha256: file.sha256,
        reason,
        prewarmStatus: runtimeForV591(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" ? (source === "ktx2" ? "passed" : "blocked-full-fallback") : "not-applicable",
      });
    };
    void (async () => {
      const asset = await resolveAsset(assetId, abort.signal);
      const files = selectFilesV591(asset, deliveryTier, deviceTier);
      const runtime = runtimeForV591(gl);
      let primaryFailure = runtime.assetFailures.get(assetId) ?? "none";
      if (files.primary && primaryFailure === "none") {
        await prewarmV591Ktx2(gl, abort.signal);
        try {
          const generation = runtime.generation;
          const bytes = await loadVerifiedVisualAssetBytesV591(files.primary, abort.signal);
          const candidate = await parseKtx2V590(
            await ensureKtx2LoaderV591(gl),
            bytes,
            WARM_ASSET_TIMEOUT_MS_V591,
            () => current() && runtime.generation === generation,
            () => invalidateV591TextureLoader(gl, `v591-ktx2-asset-timeout:${assetId}`),
          );
          accept(candidate, files.primary, "ktx2", "verified-ktx2");
          return;
        } catch (error: unknown) {
          const persistentFailure = persistentV591AssetFailureReason(error, !current());
          if (persistentFailure === null) return;
          primaryFailure = persistentFailure;
          runtime.assetFailures.set(assetId, primaryFailure);
        }
      }
      const bytes = await loadVerifiedVisualAssetBytesV591(files.fallback, abort.signal);
      accept(await parseRasterV591(bytes, files.fallback, abort.signal), files.fallback, "fallback", primaryFailure);
    })().catch((error: unknown) => {
      if (!current()) return;
      setState({
        texture: null,
        status: "blocked",
        source: "none",
        assetId,
        sha256: "none",
        reason: error instanceof Error ? error.message : "v591-asset-unknown",
        prewarmStatus: runtimeForV591(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
      });
    });
    return () => {
      abort.abort();
      release?.();
      if (texture) disposeTextureAfterDetachV591(texture);
      texture = null;
    };
  }, [assetId, deliveryTier, deviceTier, enabled, gl, overlaySha256, resolveAsset]);
  return state;
}

export function useV591Texture(
  assetId: "sun-photosphere" | "sun-chromosphere",
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591,
    resolveSunAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591MoonTexture(
  assetId: typeof MOON_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591,
    resolveMoonAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591MercuryTexture(
  assetId: typeof MERCURY_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591,
    resolveMercuryAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591MarsTexture(
  assetId: typeof MARS_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591,
    resolveMarsAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591JupiterTexture(
  assetId: typeof JUPITER_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591,
    resolveJupiterAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591SaturnTexture(
  assetId: typeof SATURN_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591,
    resolveSaturnAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591BennuTexture(
  assetId: typeof BENNU_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
    resolveBennuAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591VenusTexture(
  assetId: typeof VENUS_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591,
    resolveVenusAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591Tempel1Texture(
  assetId: "tempel-1-observation" | "tempel-1-observation-mask",
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
    resolveTempel1AssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

export function useV591CeresTexture(
  assetId: typeof CERES_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  return useV591OwnedTexture(
    assetId,
    CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591,
    resolveCeresAssetV591,
    deliveryTier,
    deviceTier,
    enabled,
  );
}

/**
 * Candidate-only NASA nebula lane. It shares the v591 KTX2 worker and failure
 * isolation with body textures, but keeps nebula imagery presentation-only.
 * Science never calls this hook; a missing/failed asset remains blocked.
 */
export function useV591NebulaTexture(
  assetId: NebulaIdV591,
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  const gl = useThree((state) => state.gl);
  const [state, setState] = useState<V591TextureLoadState>({ ...IDLE_V591, assetId });
  const generationRef = useRef(0);
  useEffect(() => {
    const generation = ++generationRef.current;
    const abort = new AbortController();
    let texture: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    const current = () => generationRef.current === generation && !abort.signal.aborted;
    if (!enabled) {
      setState({ ...IDLE_V591, assetId });
      return () => abort.abort();
    }
    setState({ ...IDLE_V591, assetId, status: "loading", prewarmStatus: runtimeForV591(gl).prewarmStatus });
    const accept = (candidate: THREE.Texture, file: NebulaTextureFileV591, source: "ktx2" | "fallback", reason: string) => {
      if (!current()) {
        disposeTextureAfterDetachV591(candidate);
        return;
      }
      texture = configureTextureV591(candidate, file, assetId, CELESTIAL_NEBULA_OVERLAY_SHA256_V591);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      release = acquireV591TextureResource(texture, `v591-nebula-${assetId}-${deviceTier}`, CELESTIAL_NEBULA_OVERLAY_SHA256_V591);
      setState({
        texture,
        status: "ready",
        source,
        assetId,
        sha256: file.sha256,
        reason,
        prewarmStatus: runtimeForV591(gl).prewarmStatus,
        fullQualityGate: deliveryTier === "standalone-full" && source !== "ktx2" ? "blocked-full-fallback" : deliveryTier === "standalone-full" ? "passed" : "not-applicable",
      });
    };
    void (async () => {
      const overlay = await loadNebulaAssetOverlayV591(abort.signal);
      const asset = overlay.assets.find((candidate) => candidate.id === assetId);
      if (!asset) throw new Error(`v591-nebula-asset-blocked:${assetId}`);
      const files = selectNebulaTextureFilesV591(asset, deliveryTier, deviceTier);
      const runtime = runtimeForV591(gl);
      let primaryFailure = runtime.assetFailures.get(`nebula:${assetId}`) ?? "none";
      if (files.primary && primaryFailure === "none") {
        await prewarmV591Ktx2(gl, abort.signal);
        try {
          const loaderGeneration = runtime.generation;
          const bytes = await loadVerifiedVisualAssetBytesV591(files.primary, abort.signal);
          const candidate = await parseKtx2V590(
            await ensureKtx2LoaderV591(gl),
            bytes,
            WARM_ASSET_TIMEOUT_MS_V591,
            () => current() && runtime.generation === loaderGeneration,
            () => invalidateV591TextureLoader(gl, `v591-nebula-ktx2-timeout:${assetId}`),
          );
          accept(candidate, files.primary, "ktx2", "verified-v591-nebula-ktx2");
          return;
        } catch (error: unknown) {
          const persistent = persistentV591AssetFailureReason(error, !current());
          if (persistent === null) return;
          primaryFailure = persistent;
          runtime.assetFailures.set(`nebula:${assetId}`, primaryFailure);
        }
      }
      const bytes = await loadVerifiedVisualAssetBytesV591(files.fallback, abort.signal);
      accept(await parseRasterV591(bytes, files.fallback, abort.signal), files.fallback, "fallback", primaryFailure === "none" ? "verified-v591-nebula-raster" : `ktx2-fallback:${primaryFailure}`);
    })().catch((error: unknown) => {
      if (!current()) return;
      setState({ ...IDLE_V591, assetId, status: "blocked", reason: error instanceof Error ? error.message : "v591-nebula-unknown", prewarmStatus: runtimeForV591(gl).prewarmStatus, fullQualityGate: deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable" });
    });
    return () => {
      abort.abort();
      release?.();
      if (texture) disposeTextureAfterDetachV591(texture);
      texture = null;
    };
  }, [assetId, deliveryTier, deviceTier, enabled, gl]);
  return state;
}

function assertEarthOverlayAssetMatchesV590(
  overlay: EarthAssetOverlayV591,
  baselineAsset: VisualAssetManifestEntryV590,
): void {
  const overlayAsset = overlay.assets.find((entry) => entry.id === baselineAsset.id);
  if (!overlayAsset || baselineAsset.body !== "earth") throw new Error(`v591-earth-overlay-asset:${baselineAsset.id}`);
  const inherited = overlayAsset.inheritedIdentity;
  if (
    inherited.sourceUrl !== baselineAsset.sourceUrl
    || inherited.sourceHost !== baselineAsset.sourceHost
    || inherited.sourceBytes !== baselineAsset.sourceBytes
    || inherited.sourceSha256 !== baselineAsset.sourceSha256
    || JSON.stringify(canonicalizeV591(inherited.license)) !== JSON.stringify(canonicalizeV591(baselineAsset.license))
    || JSON.stringify(canonicalizeV591(overlayAsset.fullQualityMinimum)) !== JSON.stringify(canonicalizeV591(baselineAsset.fullQualityMinimum))
    || JSON.stringify(canonicalizeV591(overlayAsset.variants)) !== JSON.stringify(canonicalizeV591(baselineAsset.variants))
  ) throw new Error(`v591-earth-overlay-baseline-drift:${baselineAsset.id}`);
}

/**
 * Loads the exact, sealed v590 Earth bytes through the v591-owned Basis
 * generation. This preserves the frozen source identity and device-strict
 * mobile raster policy while preventing Earth from creating a second KTX2
 * loader beside the v591 deep-space lane. The overlay reference remains
 * zero-byte because the physical allocation is already attributed by
 * useV591ReadonlyV590Texture.
 */
export function useV591InheritedEarthTexture(
  assetId: typeof EARTH_REQUIRED_ASSET_IDS_V591[number],
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  enabled = true,
): V591TextureLoadState {
  const inherited = useV591ReadonlyV590Texture(assetId, deliveryTier, deviceTier, enabled);
  const [overlayState, setOverlayState] = useState<Readonly<{
    status: "idle" | "loading" | "ready" | "blocked";
    reason: string;
  }>>({ status: "idle", reason: "none" });
  useEffect(() => {
    const abort = new AbortController();
    if (!enabled) {
      setOverlayState({ status: "idle", reason: "none" });
      return () => abort.abort();
    }
    setOverlayState({ status: "loading", reason: "none" });
    void (async () => {
      const [overlay, baseline] = await Promise.all([
        loadEarthAssetOverlayV591(abort.signal),
        loadVisualAssetManifestV590(abort.signal),
      ]);
      const asset = baseline.assets.find((entry) => entry.id === assetId);
      if (!asset) throw new Error(`v591-earth-asset-id:${assetId}`);
      assertEarthOverlayAssetMatchesV590(overlay, asset);
      if (!abort.signal.aborted) setOverlayState({ status: "ready", reason: "verified-v590-exact-byte-overlay" });
    })().catch((error: unknown) => {
      if (!abort.signal.aborted) setOverlayState({
        status: "blocked",
        reason: error instanceof Error ? error.message : "v591-earth-overlay-unknown",
      });
    });
    return () => abort.abort();
  }, [assetId, enabled]);
  useEffect(() => {
    if (!enabled || overlayState.status !== "ready" || inherited.status !== "ready" || !inherited.texture) return;
    inherited.texture.userData.atlasConsumedByCandidateV591 = true;
    inherited.texture.userData.atlasV591AssetOverlaySha256 = CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591;
    inherited.texture.userData.atlasV591ScientificPayloadMutation = false;
    return acquireAtlasResource("texture", "atlas", `v591-earth-reference-${assetId}-${deviceTier}`, {
      owner: "v591-celestial-convergence",
      estimatedBytes: 0,
      contentSha256: inherited.sha256,
      manifestSha256: CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591,
    });
  }, [assetId, deviceTier, enabled, inherited.sha256, inherited.status, inherited.texture, overlayState.status]);
  if (!enabled) return IDLE_V591;
  if (overlayState.status === "blocked") return {
    ...IDLE_V591,
    status: "blocked",
    assetId,
    reason: overlayState.reason,
    prewarmStatus: inherited.prewarmStatus,
    fullQualityGate: deliveryTier === "standalone-full" ? "blocked-full-fallback" : "not-applicable",
  };
  if (overlayState.status !== "ready" || inherited.status !== "ready" || !inherited.texture) return {
    ...IDLE_V591,
    status: inherited.status === "blocked" ? "blocked" : "loading",
    assetId,
    reason: inherited.status === "blocked" ? inherited.reason : overlayState.reason,
    prewarmStatus: inherited.prewarmStatus,
    fullQualityGate: inherited.fullQualityGate,
  };
  return {
    ...inherited,
    reason: `v591-overlay:${overlayState.reason};v591-readonly-v590-loader:${inherited.reason}`,
  };
}
