export const KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_VERSION_V512 =
  "v512-kerr-science-product-eligibility-graph-v1" as const;
export const KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512 =
  "v512-kerr-science-product-eligibility-graph-api-v1" as const;

export const KERR_SCIENCE_PRODUCT_NODE_IDS_V512 = Object.freeze([
  "fits-header-structure",
  "wcs-coordinate-envelope",
  "sparse-photon-observable",
  "measured-detector-inputs",
  "detector-response",
  "electron-expectation",
  "detector-pixel-values",
  "dense-aggregate",
  "heavy-qualification",
  "science-product-promotion",
] as const);

export type KerrScienceProductNodeIdV512 =
  (typeof KERR_SCIENCE_PRODUCT_NODE_IDS_V512)[number];

export type KerrScienceProductEligibilityNodeV512 = Readonly<{
  id: KerrScienceProductNodeIdV512;
  status: "qualified" | "blocked" | "incomplete" | "not-run";
  authorityClass:
    | "structure"
    | "coordinate"
    | "computational-observable"
    | "measured-input"
    | "detector-conversion"
    | "pixel-value"
    | "campaign"
    | "qualification"
    | "promotion";
  artifactSha256: string;
  availableRows: number;
  measuredRows: 0;
  grantsScienceImageAuthority: false;
  reason: string;
}>;

export type KerrScienceProductEligibilityGraphArtifactV512 = Readonly<{
  version: typeof KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_VERSION_V512;
  generatedAt: string;
  status: "science-product-eligibility-graph-qualified-promotion-blocked";
  source: Readonly<{
    v456ArtifactSha256: string;
    v457ArtifactSha256: string;
    v511MatrixArtifactSha256: string;
    v511RuntimeArtifactSha256: string;
    v511EvidenceSha256: string;
    v511PointerSha256: string;
  }>;
  nodes: readonly KerrScienceProductEligibilityNodeV512[];
  edges: readonly Readonly<{
    from: KerrScienceProductNodeIdV512;
    to: KerrScienceProductNodeIdV512;
    relation: "requires" | "constrains" | "qualifies-structure-only";
    satisfied: boolean;
  }>[];
  products: readonly Readonly<{
    id:
      | "fits-header-fixture"
      | "wcs-coordinate-overlay"
      | "sparse-photon-table"
      | "cinematic-coordinate-composite"
      | "science-fits-hdu"
      | "science-png-raster";
    availability: "qualified" | "local-shadow-presentation-only" | "blocked";
    scienceAuthority: boolean;
    detectorImageClaimAllowed: false;
    scientificFieldMutationAllowed: false;
    reason: string;
  }>[];
  counts: Readonly<{
    nodeCount: 10;
    edgeCount: number;
    qualifiedNodeCount: 3;
    blockedNodeCount: 5;
    incompleteNodeCount: 1;
    notRunNodeCount: 1;
    fitsHeaderCards: 22;
    wcsCoordinateRows: 4;
    sparsePhotonRows: 4;
    sparseValueRows: 0;
    detectorProjectionRows: 0;
    measuredResponseRows: 0;
    electronExpectationRows: 0;
    scienceRasterRows: 0;
    fitsHduCount: 0;
    pngCount: 0;
  }>;
  visualBoundary: Readonly<{
    profileId: "science-cinematic-v7-v457";
    scienceLinearDisplay: true;
    scienceBloomDisabled: true;
    scienceGradeDisabled: true;
    cinematicSeed: "orbit-atlas-v457-cinematic-seed-01";
    cinematicMayStyleCoordinates: true;
    cinematicMayClaimDetectorImage: false;
    scientificFieldMutation: false;
    localShadowOnly: true;
    defaultApplied: false;
  }>;
  decision: Readonly<{
    coordinateOnlyScienceDisplayAllowed: true;
    sparsePhotonTableAllowed: true;
    detectorImageAuthorityGranted: false;
    scienceProductPromotionAllowed: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    localShadowDefaultApplied: false;
  }>;
  boundary: Readonly<{
    detectorResponseAvailable: false;
    observedCountsAvailable: false;
    observedIntensityAvailable: false;
    scienceRasterAvailable: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    sciencePayloadMutationAllowed: false;
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrScienceProductEligibilityGraphSummaryV512 = Pick<
  KerrScienceProductEligibilityGraphArtifactV512,
  | "version"
  | "status"
  | "source"
  | "nodes"
  | "edges"
  | "products"
  | "counts"
  | "visualBoundary"
  | "decision"
  | "boundary"
  | "artifactSha256"
>;

export type KerrScienceProductEligibilityGraphApiV512 = Readonly<{
  version: typeof KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrScienceProductEligibilityGraphSummaryV512 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export const canonicalKerrScienceProductEligibilityGraphV512 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export function parseKerrScienceProductEligibilityGraphArtifactV512(
  value: unknown,
): KerrScienceProductEligibilityGraphArtifactV512 {
  if (!isRecord(value)) throw new Error("v512-product-graph-shape");
  const artifact = value as Partial<KerrScienceProductEligibilityGraphArtifactV512>;
  if (
    artifact.version !== KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_VERSION_V512 ||
    artifact.status !== "science-product-eligibility-graph-qualified-promotion-blocked" ||
    !isRecord(artifact.source) ||
    Object.values(artifact.source).some((entry) => !SHA256.test(String(entry))) ||
    !Array.isArray(artifact.nodes) ||
    artifact.nodes.length !== 10 ||
    artifact.nodes.some(
      (node, index) =>
        node.id !== KERR_SCIENCE_PRODUCT_NODE_IDS_V512[index] ||
        !["qualified", "blocked", "incomplete", "not-run"].includes(node.status) ||
        !SHA256.test(node.artifactSha256) ||
        node.availableRows < 0 ||
        node.measuredRows !== 0 ||
        node.grantsScienceImageAuthority !== false,
    ) ||
    artifact.nodes.filter((node) => node.status === "qualified").length !== 3 ||
    artifact.nodes.filter((node) => node.status === "blocked").length !== 5 ||
    artifact.nodes.filter((node) => node.status === "incomplete").length !== 1 ||
    artifact.nodes.filter((node) => node.status === "not-run").length !== 1 ||
    !Array.isArray(artifact.edges) ||
    artifact.edges.length < 9 ||
    artifact.edges.some(
      (edge) =>
        !KERR_SCIENCE_PRODUCT_NODE_IDS_V512.includes(edge.from) ||
        !KERR_SCIENCE_PRODUCT_NODE_IDS_V512.includes(edge.to) ||
        typeof edge.satisfied !== "boolean",
    ) ||
    !Array.isArray(artifact.products) ||
    artifact.products.length !== 6 ||
    artifact.products.some(
      (product) =>
        product.detectorImageClaimAllowed !== false ||
        product.scientificFieldMutationAllowed !== false,
    ) ||
    artifact.counts?.nodeCount !== 10 ||
    artifact.counts.edgeCount !== artifact.edges.length ||
    artifact.counts.qualifiedNodeCount !== 3 ||
    artifact.counts.blockedNodeCount !== 5 ||
    artifact.counts.incompleteNodeCount !== 1 ||
    artifact.counts.notRunNodeCount !== 1 ||
    artifact.counts.fitsHeaderCards !== 22 ||
    artifact.counts.wcsCoordinateRows !== 4 ||
    artifact.counts.sparsePhotonRows !== 4 ||
    artifact.counts.sparseValueRows !== 0 ||
    artifact.counts.detectorProjectionRows !== 0 ||
    artifact.counts.measuredResponseRows !== 0 ||
    artifact.counts.electronExpectationRows !== 0 ||
    artifact.counts.scienceRasterRows !== 0 ||
    artifact.counts.fitsHduCount !== 0 ||
    artifact.counts.pngCount !== 0 ||
    artifact.visualBoundary?.profileId !== "science-cinematic-v7-v457" ||
    artifact.visualBoundary.scienceLinearDisplay !== true ||
    artifact.visualBoundary.scienceBloomDisabled !== true ||
    artifact.visualBoundary.scienceGradeDisabled !== true ||
    artifact.visualBoundary.cinematicSeed !== "orbit-atlas-v457-cinematic-seed-01" ||
    artifact.visualBoundary.cinematicMayStyleCoordinates !== true ||
    artifact.visualBoundary.cinematicMayClaimDetectorImage !== false ||
    artifact.visualBoundary.scientificFieldMutation !== false ||
    artifact.visualBoundary.localShadowOnly !== true ||
    artifact.visualBoundary.defaultApplied !== false ||
    artifact.decision?.coordinateOnlyScienceDisplayAllowed !== true ||
    artifact.decision.sparsePhotonTableAllowed !== true ||
    artifact.decision.detectorImageAuthorityGranted !== false ||
    artifact.decision.scienceProductPromotionAllowed !== false ||
    artifact.decision.fitsWriteAllowed !== false ||
    artifact.decision.pngWriteAllowed !== false ||
    artifact.decision.localShadowDefaultApplied !== false ||
    artifact.boundary?.detectorResponseAvailable !== false ||
    artifact.boundary.observedCountsAvailable !== false ||
    artifact.boundary.observedIntensityAvailable !== false ||
    artifact.boundary.scienceRasterAvailable !== false ||
    artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    artifact.boundary.browserQualification !== "not-run" ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.formalProductPointer !== "v263" ||
    artifact.boundary.formalDefaultKernel !== "legacy-eih-1pn" ||
    !Array.isArray(artifact.sourceManifest) ||
    artifact.sourceManifest.some((entry) => !entry.path || !SHA256.test(entry.sha256)) ||
    !SHA256.test(artifact.sourceSha256 ?? "") ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v512-science-product-eligibility-boundary");
  }
  return artifact as KerrScienceProductEligibilityGraphArtifactV512;
}

export function createKerrScienceProductEligibilityGraphSummaryV512(
  value: unknown,
): KerrScienceProductEligibilityGraphSummaryV512 {
  const artifact = parseKerrScienceProductEligibilityGraphArtifactV512(value);
  return Object.freeze({
    version: artifact.version,
    status: artifact.status,
    source: artifact.source,
    nodes: artifact.nodes,
    edges: artifact.edges,
    products: artifact.products,
    counts: artifact.counts,
    visualBoundary: artifact.visualBoundary,
    decision: artifact.decision,
    boundary: artifact.boundary,
    artifactSha256: artifact.artifactSha256,
  });
}

function validateKerrScienceProductEligibilityGraphSummaryV512(
  value: unknown,
): asserts value is KerrScienceProductEligibilityGraphSummaryV512 {
  if (!isRecord(value)) throw new Error("v512-product-graph-summary-shape");
  parseKerrScienceProductEligibilityGraphArtifactV512({
    ...value,
    generatedAt: "summary-validation-only",
    sourceManifest: [],
    sourceSha256: "0".repeat(64),
  });
}

export function parseKerrScienceProductEligibilityGraphApiV512(
  value: unknown,
): KerrScienceProductEligibilityGraphApiV512 {
  if (!isRecord(value)) throw new Error("v512-product-graph-api-shape");
  if (
    value.version !== KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v512-product-graph-api-boundary");
  }
  if (value.available) validateKerrScienceProductEligibilityGraphSummaryV512(value.summary);
  else if (value.summary !== null) throw new Error("v512-product-graph-api-unavailable-summary");
  return value as unknown as KerrScienceProductEligibilityGraphApiV512;
}
