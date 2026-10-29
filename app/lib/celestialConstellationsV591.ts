import type { ConstellationBindingV590 } from "./celestialDeepSpaceV590";
import {
  CONSTELLATION_LABEL_ATLAS_BYTES_V591,
  CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591,
  CONSTELLATION_PACKET_BYTES_V591,
  CONSTELLATION_PACKET_FILE_SHA256_V591,
  CONSTELLATION_PACKET_SHA256_V591,
} from "../data/celestialConstellationsV591.generated";

export {
  CONSTELLATION_LABEL_ATLAS_BYTES_V591,
  CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591,
  CONSTELLATION_PACKET_BYTES_V591,
  CONSTELLATION_PACKET_FILE_SHA256_V591,
  CONSTELLATION_PACKET_SHA256_V591,
};

export const CONSTELLATION_PACKET_URL_V591 =
  "/data/celestial-convergence-v591/constellation-gaia-binding-v591.json" as const;
export const CONSTELLATION_PACKET_VERSION_V591 = "v591-constellation-gaia-packet-v1" as const;
export const CONSTELLATION_FROZEN_SOURCE_FILE_SHA256_V591 =
  "6c5aefed75d78f566fa598a2fe15bad5482af41f7a600d055c1554544012f5f5" as const;
export const CONSTELLATION_FROZEN_BINDING_SHA256_V591 =
  "5d5faefe782b221729084dc9796969579515151afab8c1ed377f0cbf718937a8" as const;
export const CONSTELLATION_LABEL_FONT_URL_V591 =
  "/fonts/candidate-v591/ibm-plex-sans-condensed-latin-500.woff2" as const;
export const CONSTELLATION_LABEL_FONT_SHA256_V591 =
  "e3b4fd97fd20bc70fda66d8d5f0745d8d6958068a024cb4724bbc1ffb6cbc183" as const;
export const CONSTELLATION_COUNT_V591 = 88 as const;
export const CONSTELLATION_WAYPOINT_COUNT_V591 = 484 as const;
export const CONSTELLATION_UNIQUE_GAIA_SOURCE_COUNT_V591 = 420 as const;
export const CONSTELLATION_MAXIMUM_ANGULAR_ERROR_DEG_V591 = 1.4008261815085659 as const;
export const CONSTELLATION_MEDIAN_ANGULAR_ERROR_DEG_V591 = 0.4760630074038235 as const;
export const CONSTELLATION_THRESHOLD_DEG_V591 = 1.5 as const;
export const CONSTELLATION_DEFAULT_DESKTOP_V591 = Object.freeze([
  "Ori", "UMa", "Cas", "Cyg", "Lyr", "Aql", "Sco", "Sgr", "Tau", "Gem", "Leo", "And",
] as const);
export const CONSTELLATION_DEFAULT_MOBILE_V591 = Object.freeze([
  "Ori", "UMa", "Cas", "Cyg", "Lyr", "Aql", "Sco", "Sgr",
] as const);

function canonicalizeV591(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeV591);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => (
    [key, canonicalizeV591((value as Record<string, unknown>)[key])]
  )));
}

export function canonicalConstellationPacketJsonV591(packet: Record<string, unknown>): string {
  const unsigned = { ...packet };
  delete unsigned.packetSha256;
  return JSON.stringify(canonicalizeV591(unsigned));
}

const SHA256 = /^[a-f0-9]{64}$/;

export type ConstellationPacketV591 = Readonly<{
  version: typeof CONSTELLATION_PACKET_VERSION_V591;
  status: "admitted-presentation-only-frozen-gaia-binding";
  packetSha256: string;
  frozenSource: Readonly<{
    path: "public/data/celestial-art-v589/constellation-gaia-bindings-v589.json";
    bytes: 145613;
    fileSha256: typeof CONSTELLATION_FROZEN_SOURCE_FILE_SHA256_V591;
    version: "v589-constellation-gaia-binding-v1";
    bindingSha256: typeof CONSTELLATION_FROZEN_BINDING_SHA256_V591;
    exactBindingReuse: true;
    sourceBytesCopied: false;
    frozenSourceModified: false;
  }>;
  metrics: Readonly<{
    constellationCount: typeof CONSTELLATION_COUNT_V591;
    waypointCount: typeof CONSTELLATION_WAYPOINT_COUNT_V591;
    uniqueGaiaSourceIdCount: typeof CONSTELLATION_UNIQUE_GAIA_SOURCE_COUNT_V591;
    maximumAngularDistanceDeg: typeof CONSTELLATION_MAXIMUM_ANGULAR_ERROR_DEG_V591;
    medianAngularDistanceDeg: typeof CONSTELLATION_MEDIAN_ANGULAR_ERROR_DEG_V591;
    thresholdDeg: typeof CONSTELLATION_THRESHOLD_DEG_V591;
    allWaypointsWithinThreshold: true;
  }>;
  defaults: Readonly<{ desktop: 12; mobile: 8 }>;
  presentationPolicy: Readonly<{
    presentationOnly: true;
    normalizedCelestialDirections: true;
    randomParallax: false;
    depthOcclusion: true;
    closeupSuppressesNonFocus: true;
    labels: "local-gpu-sdf-focus-or-overview";
    scientificPayloadWriteback: false;
  }>;
  labelFont: Readonly<{
    family: "IBM Plex Sans Condensed";
    weight: 500;
    runtimePath: typeof CONSTELLATION_LABEL_FONT_URL_V591;
    bytes: 19952;
    sha256: typeof CONSTELLATION_LABEL_FONT_SHA256_V591;
    license: "OFL-1.1";
    licenseRuntimePath: "/fonts/candidate-v591/OFL-1.1.txt";
    licenseBytes: 4314;
    licenseSha256: "18aabf190848725e2576eefb5c29ba06aac1029d02132252a7f312eac2e50cf3";
    externalNetworkRequest: false;
  }>;
  labelAtlas: Readonly<{
    metadataPath: "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json";
    metadataBytes: number;
    metadataFileSha256: string;
    path: "/textures/candidate-v591/constellations/labels-sdf.png";
    bytes: number;
    sha256: string;
    width: 2048;
    height: 1024;
    channels: 1;
    format: "png-l8-signed-distance-field";
    fontSizePx: 44;
    spreadPx: 10;
    paddingPx: 14;
    entryCount: 88;
    entries: readonly Readonly<{
      iauCode: string;
      name: string;
      pixelRect: readonly [number, number, number, number];
      uvRect: readonly [number, number, number, number];
      aspect: number;
    }>[];
    presentationOnly: true;
    runtimeFontWorkerRequired: false;
    resourceOwner: "v591-celestial-convergence";
  }>;
  bindings: readonly ConstellationBindingV590[];
}>;

function objectV591(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

/** Browser-safe structural parser. Raw-file and canonical packet SHA are verified by the caller. */
export function parseConstellationPacketV591(value: unknown): ConstellationPacketV591 {
  const packet = objectV591(value, "v591-constellation-packet-object") as Partial<ConstellationPacketV591>;
  const frozen = objectV591(packet.frozenSource, "v591-constellation-frozen-object") as ConstellationPacketV591["frozenSource"];
  const metrics = objectV591(packet.metrics, "v591-constellation-metrics-object") as ConstellationPacketV591["metrics"];
  const defaults = objectV591(packet.defaults, "v591-constellation-defaults-object") as ConstellationPacketV591["defaults"];
  const policy = objectV591(packet.presentationPolicy, "v591-constellation-policy-object") as ConstellationPacketV591["presentationPolicy"];
  const labelFont = objectV591(packet.labelFont, "v591-constellation-font-object") as ConstellationPacketV591["labelFont"];
  const labelAtlas = objectV591(packet.labelAtlas, "v591-constellation-atlas-object") as ConstellationPacketV591["labelAtlas"];
  if (
    packet.version !== CONSTELLATION_PACKET_VERSION_V591
    || packet.status !== "admitted-presentation-only-frozen-gaia-binding"
    || packet.packetSha256 !== CONSTELLATION_PACKET_SHA256_V591
    || frozen.path !== "public/data/celestial-art-v589/constellation-gaia-bindings-v589.json"
    || frozen.bytes !== 145_613
    || frozen.fileSha256 !== CONSTELLATION_FROZEN_SOURCE_FILE_SHA256_V591
    || frozen.version !== "v589-constellation-gaia-binding-v1"
    || frozen.bindingSha256 !== CONSTELLATION_FROZEN_BINDING_SHA256_V591
    || frozen.exactBindingReuse !== true
    || frozen.sourceBytesCopied !== false
    || frozen.frozenSourceModified !== false
    || metrics.constellationCount !== CONSTELLATION_COUNT_V591
    || metrics.waypointCount !== CONSTELLATION_WAYPOINT_COUNT_V591
    || metrics.uniqueGaiaSourceIdCount !== CONSTELLATION_UNIQUE_GAIA_SOURCE_COUNT_V591
    || metrics.maximumAngularDistanceDeg !== CONSTELLATION_MAXIMUM_ANGULAR_ERROR_DEG_V591
    || metrics.medianAngularDistanceDeg !== CONSTELLATION_MEDIAN_ANGULAR_ERROR_DEG_V591
    || metrics.thresholdDeg !== CONSTELLATION_THRESHOLD_DEG_V591
    || metrics.allWaypointsWithinThreshold !== true
    || defaults.desktop !== CONSTELLATION_DEFAULT_DESKTOP_V591.length
    || defaults.mobile !== CONSTELLATION_DEFAULT_MOBILE_V591.length
    || policy.presentationOnly !== true
    || policy.normalizedCelestialDirections !== true
    || policy.randomParallax !== false
    || policy.depthOcclusion !== true
    || policy.closeupSuppressesNonFocus !== true
    || policy.labels !== "local-gpu-sdf-focus-or-overview"
    || policy.scientificPayloadWriteback !== false
    || labelFont.family !== "IBM Plex Sans Condensed"
    || labelFont.weight !== 500
    || labelFont.runtimePath !== CONSTELLATION_LABEL_FONT_URL_V591
    || labelFont.bytes !== 19_952
    || labelFont.sha256 !== CONSTELLATION_LABEL_FONT_SHA256_V591
    || labelFont.license !== "OFL-1.1"
    || labelFont.licenseRuntimePath !== "/fonts/candidate-v591/OFL-1.1.txt"
    || labelFont.licenseBytes !== 4_314
    || labelFont.licenseSha256 !== "18aabf190848725e2576eefb5c29ba06aac1029d02132252a7f312eac2e50cf3"
    || labelFont.externalNetworkRequest !== false
    || labelAtlas.metadataPath !== "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json"
    || !Number.isSafeInteger(labelAtlas.metadataBytes)
    || labelAtlas.metadataBytes <= 0
    || !SHA256.test(labelAtlas.metadataFileSha256 ?? "")
    || labelAtlas.path !== "/textures/candidate-v591/constellations/labels-sdf.png"
    || !Number.isSafeInteger(labelAtlas.bytes)
    || labelAtlas.bytes <= 0
    || !SHA256.test(labelAtlas.sha256 ?? "")
    || labelAtlas.width !== 2_048
    || labelAtlas.height !== 1_024
    || labelAtlas.channels !== 1
    || labelAtlas.format !== "png-l8-signed-distance-field"
    || labelAtlas.fontSizePx !== 44
    || labelAtlas.spreadPx !== 10
    || labelAtlas.paddingPx !== 14
    || labelAtlas.entryCount !== CONSTELLATION_COUNT_V591
    || !Array.isArray(labelAtlas.entries)
    || labelAtlas.entries.length !== CONSTELLATION_COUNT_V591
    || labelAtlas.presentationOnly !== true
    || labelAtlas.runtimeFontWorkerRequired !== false
    || labelAtlas.resourceOwner !== "v591-celestial-convergence"
    || !Array.isArray(packet.bindings)
    || packet.bindings.length !== CONSTELLATION_COUNT_V591
  ) throw new Error("v591-constellation-packet-identity");

  const iauCodes = new Set<string>();
  const sourceIds = new Set<string>();
  let waypointCount = 0;
  let observedMaximum = 0;
  for (const rawBinding of packet.bindings) {
    const binding = objectV591(rawBinding, "v591-constellation-binding-object") as unknown as ConstellationBindingV590;
    if (
      typeof binding.iauCode !== "string"
      || binding.iauCode.length < 3
      || iauCodes.has(binding.iauCode)
      || typeof binding.name !== "string"
      || binding.name.length === 0
      || !Array.isArray(binding.waypoints)
    ) throw new Error("v591-constellation-binding-identity");
    iauCodes.add(binding.iauCode);
    const waypointIndices = new Set<number>();
    for (const rawWaypoint of binding.waypoints) {
      const waypoint = objectV591(rawWaypoint, "v591-constellation-waypoint-object") as Record<string, unknown>;
      if (
        !Number.isInteger(waypoint.waypointIndex)
        || waypointIndices.has(Number(waypoint.waypointIndex))
        || !/^[0-9]+$/.test(String(waypoint.sourceId ?? ""))
        || !Number.isFinite(waypoint.anchorRaDeg)
        || Number(waypoint.anchorRaDeg) < 0
        || Number(waypoint.anchorRaDeg) >= 360
        || !Number.isFinite(waypoint.anchorDecDeg)
        || Number(waypoint.anchorDecDeg) < -90
        || Number(waypoint.anchorDecDeg) > 90
        || !Number.isFinite(waypoint.angularDistanceDeg)
        || Number(waypoint.angularDistanceDeg) < 0
        || Number(waypoint.angularDistanceDeg) > CONSTELLATION_THRESHOLD_DEG_V591
      ) throw new Error("v591-constellation-waypoint-identity");
      waypointIndices.add(Number(waypoint.waypointIndex));
      sourceIds.add(String(waypoint.sourceId));
      observedMaximum = Math.max(observedMaximum, Number(waypoint.angularDistanceDeg));
      waypointCount += 1;
    }
  }
  const atlasCodes = new Set<string>();
  for (const rawEntry of labelAtlas.entries) {
    const entry = objectV591(rawEntry, "v591-constellation-atlas-entry-object") as ConstellationPacketV591["labelAtlas"]["entries"][number];
    if (
      !iauCodes.has(entry.iauCode)
      || atlasCodes.has(entry.iauCode)
      || typeof entry.name !== "string"
      || entry.name.length === 0
      || !Array.isArray(entry.pixelRect)
      || entry.pixelRect.length !== 4
      || entry.pixelRect.some((coordinate) => !Number.isFinite(coordinate))
      || !Array.isArray(entry.uvRect)
      || entry.uvRect.length !== 4
      || entry.uvRect.some((coordinate) => !Number.isFinite(coordinate) || coordinate < 0 || coordinate > 1)
      || !Number.isFinite(entry.aspect)
      || entry.aspect <= 0
    ) throw new Error("v591-constellation-atlas-entry-identity");
    atlasCodes.add(entry.iauCode);
  }
  if (
    waypointCount !== CONSTELLATION_WAYPOINT_COUNT_V591
    || sourceIds.size !== CONSTELLATION_UNIQUE_GAIA_SOURCE_COUNT_V591
    || atlasCodes.size !== CONSTELLATION_COUNT_V591
    || Math.abs(observedMaximum - 1.400826182) > 1e-9
  ) throw new Error("v591-constellation-packet-metrics");
  return packet as ConstellationPacketV591;
}
