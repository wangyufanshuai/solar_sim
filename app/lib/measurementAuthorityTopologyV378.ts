export const MEASUREMENT_AUTHORITY_TOPOLOGY_VERSION_V378 =
  "v378-measurement-authority-topology-v1" as const;

export const MEASUREMENT_AUTHORITY_INPUT_IDS_V378 = [
  "v367-detector-admission",
  "v367-detector-authority-pointer",
  "v361-detector-manifest",
  "v373-geometry-admission",
  "v373-geometry-authority-pointer",
  "v374-geometry-publication-receipt",
  "v369-runtime-observation-geometry",
  "v328-photon-radiance",
] as const;

export type MeasurementAuthorityInputIdV378 =
  (typeof MEASUREMENT_AUTHORITY_INPUT_IDS_V378)[number];
export type MeasurementAuthorityNodeIdV378 =
  | MeasurementAuthorityInputIdV378
  | "v375-dual-authority-envelope"
  | "v376-expected-electron-image";
export type MeasurementAuthorityLaneV378 =
  | "photon"
  | "detector"
  | "geometry"
  | "fusion"
  | "image";

export type MeasurementAuthorityNodeV378 = Readonly<{
  id: MeasurementAuthorityNodeIdV378;
  label: string;
  lane: MeasurementAuthorityLaneV378;
  role:
    | "science-input"
    | "measured-input"
    | "authority-admission"
    | "authority-pointer"
    | "publication-receipt"
    | "runtime-geometry"
    | "derived-envelope"
    | "derived-image";
  status: "qualified" | "missing" | "withheld";
  available: boolean;
  authoritative: boolean;
  sourcePath: string | null;
  sourceFileSha256: string | null;
  canonicalSha256: string | null;
  reason: string;
}>;

export type MeasurementAuthorityEdgeV378 = Readonly<{
  from: MeasurementAuthorityNodeIdV378;
  to: MeasurementAuthorityNodeIdV378;
  requirement: "required-no-fallback";
  satisfied: boolean;
}>;

export type MeasurementAuthorityTopologyV378 = Readonly<{
  version: typeof MEASUREMENT_AUTHORITY_TOPOLOGY_VERSION_V378;
  generatedAt: string;
  status: "provenance-topology-qualified-inputs-partial-1-of-8-image-unavailable";
  expectedInputCount: 8;
  presentInputCount: 1;
  missingInputCount: 7;
  nodeCount: 10;
  edgeCount: 9;
  acyclic: true;
  topologicalOrder: readonly MeasurementAuthorityNodeIdV378[];
  nodes: readonly MeasurementAuthorityNodeV378[];
  edges: readonly MeasurementAuthorityEdgeV378[];
  boundaries: Readonly<{
    detectorAndGeometryAuthorityRequired: true;
    syntheticFallbackAllowed: false;
    expectationCanBecomeObservedCounts: false;
    observedCountsNodeExists: false;
    scienceImageRequiresV375Envelope: true;
    zeroImageFallbackAllowed: false;
    cinematicConsumerAllowed: false;
    sciencePayloadMutationAllowed: false;
  }>;
  attemptConsumed: false;
  networkAttempted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function parseMeasurementAuthorityTopologyV378(
  value: unknown,
): MeasurementAuthorityTopologyV378 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<MeasurementAuthorityTopologyV378>)
      : null;
  const nodes = source?.nodes ?? [];
  const edges = source?.edges ?? [];
  const ids = nodes.map((node) => node.id);
  const expectedOrder: MeasurementAuthorityNodeIdV378[] = [
    ...MEASUREMENT_AUTHORITY_INPUT_IDS_V378,
    "v375-dual-authority-envelope",
    "v376-expected-electron-image",
  ];
  const qualified = nodes.filter((node) => node.status === "qualified");
  const missing = nodes.filter((node) => node.status === "missing");
  const withheld = nodes.filter((node) => node.status === "withheld");
  const requiredEdgeKeys = new Set([
    ...MEASUREMENT_AUTHORITY_INPUT_IDS_V378.map(
      (id) => `${id}->v375-dual-authority-envelope`,
    ),
    "v375-dual-authority-envelope->v376-expected-electron-image",
  ]);
  if (
    !source ||
    source.version !== MEASUREMENT_AUTHORITY_TOPOLOGY_VERSION_V378 ||
    source.status !==
      "provenance-topology-qualified-inputs-partial-1-of-8-image-unavailable" ||
    source.expectedInputCount !== 8 ||
    source.presentInputCount !== 1 ||
    source.missingInputCount !== 7 ||
    source.nodeCount !== 10 ||
    source.edgeCount !== 9 ||
    source.acyclic !== true ||
    JSON.stringify(source.topologicalOrder) !== JSON.stringify(expectedOrder) ||
    JSON.stringify(ids) !== JSON.stringify(expectedOrder) ||
    new Set(ids).size !== 10 ||
    edges.length !== 9 ||
    new Set(edges.map((edge) => `${edge.from}->${edge.to}`)).size !== 9 ||
    edges.some(
      (edge) =>
        edge.requirement !== "required-no-fallback" ||
        !requiredEdgeKeys.has(`${edge.from}->${edge.to}`),
    ) ||
    qualified.length !== 1 ||
    qualified[0]?.id !== "v328-photon-radiance" ||
    qualified[0].available !== true ||
    qualified[0].authoritative !== true ||
    !SHA256.test(qualified[0].sourceFileSha256 ?? "") ||
    !SHA256.test(qualified[0].canonicalSha256 ?? "") ||
    missing.length !== 7 ||
    missing.some(
      (node) =>
        node.available ||
        node.authoritative ||
        node.sourceFileSha256 !== null ||
        node.canonicalSha256 !== null,
    ) ||
    withheld.length !== 2 ||
    withheld.some(
      (node) =>
        node.available ||
        node.authoritative ||
        node.sourcePath !== null ||
        node.sourceFileSha256 !== null ||
        node.canonicalSha256 !== null,
    ) ||
    edges.filter((edge) => edge.satisfied).length !== 1 ||
    source.boundaries?.detectorAndGeometryAuthorityRequired !== true ||
    source.boundaries.syntheticFallbackAllowed !== false ||
    source.boundaries.expectationCanBecomeObservedCounts !== false ||
    source.boundaries.observedCountsNodeExists !== false ||
    source.boundaries.scienceImageRequiresV375Envelope !== true ||
    source.boundaries.zeroImageFallbackAllowed !== false ||
    source.boundaries.cinematicConsumerAllowed !== false ||
    source.boundaries.sciencePayloadMutationAllowed !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v378-measurement-authority-topology-identity");
  }
  return value as MeasurementAuthorityTopologyV378;
}
