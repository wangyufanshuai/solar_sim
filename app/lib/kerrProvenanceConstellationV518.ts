import type { KerrUncertaintyIndependentVerificationSummaryV517 } from "./kerrUncertaintyIndependentVerificationV517";

export const KERR_PROVENANCE_CONSTELLATION_PROFILE_ID_V518 =
  "science-cinematic-v7r2-v518" as const;
export type KerrProvenanceConstellationModeV518 = "science" | "cinematic";

export type KerrProvenanceConstellationProfileV518 = Readonly<{
  id: typeof KERR_PROVENANCE_CONSTELLATION_PROFILE_ID_V518;
  mode: KerrProvenanceConstellationModeV518;
  localShadowOnly: true;
  defaultApplied: false;
  panel: string;
  panelRaised: string;
  ink: string;
  muted: string;
  grid: string;
  nodeFill: string;
  nodeStroke: string;
  edgeStroke: string;
  halo: string;
  nodeGlowOpacity: number;
  edgeOpacity: number;
  scienceBoundary: Readonly<{
    linearDisplay: boolean;
    bloomIntensity: number;
    colorGradeIntensity: number;
    animated: boolean;
    numericScientificStyleInputCount: 0;
    scientificFieldMutation: false;
  }>;
  cinematicSeed: string | null;
}>;

export type KerrProvenanceConstellationNodeV518 = Readonly<{
  id: string;
  ordinal: number;
  transition: number;
  x: number;
  y: number;
  status: "verified";
}>;

export type KerrProvenanceConstellationEdgeV518 = Readonly<{
  id: string;
  from: string;
  to: string;
}>;

export type KerrProvenanceConstellationEncodingV518 = Readonly<{
  version: "v518-kerr-provenance-constellation-encoding-v1";
  profileId: typeof KERR_PROVENANCE_CONSTELLATION_PROFILE_ID_V518;
  mode: KerrProvenanceConstellationModeV518;
  scientificPayloadKey: string;
  chainHeadSha256: string;
  witnessCount: 512;
  checkpointCount: 8;
  nodes: readonly KerrProvenanceConstellationNodeV518[];
  edges: readonly KerrProvenanceConstellationEdgeV518[];
  numericScientificStyleInputCount: 0;
  hashDrivenStyleCount: 0;
  uncertaintyDrivenStyleCount: 0;
  scientificFieldMutation: false;
  cinematicWritebackAllowed: false;
}>;

const scienceProfile: KerrProvenanceConstellationProfileV518 = Object.freeze({
  id: KERR_PROVENANCE_CONSTELLATION_PROFILE_ID_V518,
  mode: "science",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#02090c",
  panelRaised: "#061216",
  ink: "#ddfbff",
  muted: "#74939a",
  grid: "rgba(110,232,242,.075)",
  nodeFill: "#06181d",
  nodeStroke: "#8debf3",
  edgeStroke: "#4caab4",
  halo: "rgba(94,222,234,.12)",
  nodeGlowOpacity: 0,
  edgeOpacity: 0.62,
  scienceBoundary: Object.freeze({
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    animated: false,
    numericScientificStyleInputCount: 0,
    scientificFieldMutation: false,
  }),
  cinematicSeed: null,
});

const cinematicProfile: KerrProvenanceConstellationProfileV518 = Object.freeze({
  id: KERR_PROVENANCE_CONSTELLATION_PROFILE_ID_V518,
  mode: "cinematic",
  localShadowOnly: true,
  defaultApplied: false,
  panel: "#0b0705",
  panelRaised: "#17100a",
  ink: "#fff1d0",
  muted: "#aa8f71",
  grid: "rgba(255,197,112,.07)",
  nodeFill: "#1d1108",
  nodeStroke: "#ffd38a",
  edgeStroke: "#d99a4a",
  halo: "rgba(255,181,80,.24)",
  nodeGlowOpacity: 0.24,
  edgeOpacity: 0.48,
  scienceBoundary: Object.freeze({
    linearDisplay: false,
    bloomIntensity: 0.14,
    colorGradeIntensity: 0.08,
    animated: true,
    numericScientificStyleInputCount: 0,
    scientificFieldMutation: false,
  }),
  cinematicSeed: "orbit-atlas-v518-provenance-constellation-seed-01",
});

const layout = Object.freeze([
  Object.freeze({ x: 10, y: 62 }),
  Object.freeze({ x: 21, y: 34 }),
  Object.freeze({ x: 34, y: 48 }),
  Object.freeze({ x: 47, y: 20 }),
  Object.freeze({ x: 59, y: 43 }),
  Object.freeze({ x: 72, y: 27 }),
  Object.freeze({ x: 83, y: 55 }),
  Object.freeze({ x: 92, y: 31 }),
]);

export const resolveKerrProvenanceConstellationProfileV518 = (
  mode: KerrProvenanceConstellationModeV518,
): KerrProvenanceConstellationProfileV518 =>
  mode === "science" ? scienceProfile : cinematicProfile;

export function createKerrProvenanceConstellationEncodingV518(
  summary: KerrUncertaintyIndependentVerificationSummaryV517,
  mode: KerrProvenanceConstellationModeV518,
): KerrProvenanceConstellationEncodingV518 {
  if (
    summary.verification.recomputedWitnessCount !== 512 ||
    summary.verification.matchedCheckpointCount !== 8 ||
    summary.verification.witnessMismatchCount !== 0 ||
    summary.verification.boundaryViolationCount !== 0 ||
    !/^[a-f0-9]{64}$/.test(summary.artifactSha256)
  ) {
    throw new Error("v518-provenance-source-boundary");
  }
  const nodes = layout.map((point, index) =>
    Object.freeze({
      id: `checkpoint-${String(index + 1).padStart(2, "0")}`,
      ordinal: index + 1,
      transition: (index + 1) * 64,
      x: point.x,
      y: point.y,
      status: "verified" as const,
    }),
  );
  const edges = nodes.slice(1).map((node, index) =>
    Object.freeze({
      id: `edge-${String(index + 1).padStart(2, "0")}`,
      from: nodes[index].id,
      to: node.id,
    }),
  );
  return Object.freeze({
    version: "v518-kerr-provenance-constellation-encoding-v1",
    profileId: KERR_PROVENANCE_CONSTELLATION_PROFILE_ID_V518,
    mode,
    scientificPayloadKey: summary.artifactSha256,
    chainHeadSha256: summary.verification.chainHeadSha256,
    witnessCount: 512,
    checkpointCount: 8,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    numericScientificStyleInputCount: 0,
    hashDrivenStyleCount: 0,
    uncertaintyDrivenStyleCount: 0,
    scientificFieldMutation: false,
    cinematicWritebackAllowed: false,
  });
}

export function compareKerrProvenanceConstellationEncodingsV518(
  science: KerrProvenanceConstellationEncodingV518,
  cinematic: KerrProvenanceConstellationEncodingV518,
) {
  const sameNodes = JSON.stringify(science.nodes) === JSON.stringify(cinematic.nodes);
  const sameEdges = JSON.stringify(science.edges) === JSON.stringify(cinematic.edges);
  if (
    science.mode !== "science" ||
    cinematic.mode !== "cinematic" ||
    science.scientificPayloadKey !== cinematic.scientificPayloadKey ||
    science.chainHeadSha256 !== cinematic.chainHeadSha256 ||
    !sameNodes ||
    !sameEdges ||
    science.numericScientificStyleInputCount !== 0 ||
    cinematic.numericScientificStyleInputCount !== 0 ||
    science.hashDrivenStyleCount !== 0 ||
    cinematic.hashDrivenStyleCount !== 0 ||
    science.uncertaintyDrivenStyleCount !== 0 ||
    cinematic.uncertaintyDrivenStyleCount !== 0 ||
    science.scientificFieldMutation ||
    cinematic.scientificFieldMutation
  ) {
    throw new Error("v518-science-cinematic-boundary");
  }
  return Object.freeze({
    scientificPayloadStable: true as const,
    geometryStable: true as const,
    witnessCountStable: true as const,
    checkpointCountStable: true as const,
    numericScientificStyleInputCount: 0 as const,
    hashDrivenStyleCount: 0 as const,
    uncertaintyDrivenStyleCount: 0 as const,
    scientificFieldMutation: false as const,
  });
}
