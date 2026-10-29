export const KERR_EVIDENCE_DEPENDENCY_ARTIFACT_VERSION_V470 =
  "v470-kerr-evidence-dependency-artifact-v1" as const;
export const KERR_EVIDENCE_DEPENDENCY_SUMMARY_VERSION_V470 =
  "v470-kerr-evidence-dependency-summary-v1" as const;
export const KERR_EVIDENCE_DEPENDENCY_API_VERSION_V470 =
  "v470-kerr-evidence-dependency-api-v1" as const;

export const KERR_EVIDENCE_DEPENDENCY_NODE_IDS_V470 = Object.freeze([
  "v458-measured-intake",
  "v459-blind-validation",
  "v460-blind-results",
  "v461-residual-ledger",
  "v462-atomic-join",
  "v463-payload-admission",
  "v464-provenance",
  "v465-response",
  "v466-radiative-transfer",
  "v467-thin-disk",
  "v468-coupling",
  "v469-workbench",
  "v314-dense-campaign",
  "heavy-qualification",
  "science-raster-authority",
  "local-shadow-promotion",
] as const);

const SHA256 = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  }
  return value;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !TRANSIENT.has(key))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};

export const canonicalKerrEvidenceDependencyPayloadV470 = (value: unknown): string =>
  JSON.stringify(canonicalize(value));

export type KerrEvidenceDependencyNodeIdV470 =
  (typeof KERR_EVIDENCE_DEPENDENCY_NODE_IDS_V470)[number];

export type KerrEvidenceDependencyNodeV470 = Readonly<{
  id: KerrEvidenceDependencyNodeIdV470;
  kind: "evidence-stage" | "campaign" | "qualification" | "outcome";
  label: string;
  upstreamStatus: string;
  protocolQualified: boolean;
  productionQualified: boolean;
  authorityGranted: false;
  sciencePixelRows: 0;
  artifactSha256: string | null;
  blockReason: string | null;
  blocksOutcome: boolean;
  browserQualification: "not-run" | "not-applicable";
}>;

export type KerrEvidenceDependencyEdgeV470 = Readonly<{
  from: KerrEvidenceDependencyNodeIdV470;
  to: KerrEvidenceDependencyNodeIdV470;
  requirement: string;
  propagatesBlocker: boolean;
}>;

export type KerrEvidenceRootBlockerV470 = Readonly<{
  nodeId: KerrEvidenceDependencyNodeIdV470;
  reason: string;
  blockedDescendantCount: number;
}>;

export type KerrEvidenceDependencyAnalysisV470 = Readonly<{
  acyclic: true;
  topologicalOrder: readonly KerrEvidenceDependencyNodeIdV470[];
  rootBlockers: readonly KerrEvidenceRootBlockerV470[];
  blockedProductionNodeCount: number;
  protocolQualifiedNodeCount: number;
  productionQualifiedNodeCount: number;
  authorityGrantedNodeCount: 0;
  sciencePixelRows: 0;
}>;

export type KerrEvidenceDependencyArtifactV470 = Readonly<{
  version: typeof KERR_EVIDENCE_DEPENDENCY_ARTIFACT_VERSION_V470;
  generatedAt: string;
  status: "dependency-graph-qualified-authority-blocked-browser-pending";
  source: Readonly<Record<string, string>>;
  contract: Readonly<{
    graphKind: "qualification-prerequisite-dag";
    nodeCount: 16;
    edgeCount: number;
    boundedSummaryOnly: true;
    maximumResponseBytes: 131072;
    sourceShaRequired: true;
    failClosedPropagation: true;
    noCounterfactualAuthority: true;
    noLargeArraysInReactState: true;
    formalProductPointer: "v263";
    denseCampaignStatus: "incomplete-0-of-49";
  }>;
  nodes: readonly KerrEvidenceDependencyNodeV470[];
  edges: readonly KerrEvidenceDependencyEdgeV470[];
  analysis: KerrEvidenceDependencyAnalysisV470;
  outcomes: Readonly<{
    measuredAuthorityGranted: false;
    scienceRasterAuthorityGranted: false;
    localShadowPromotionAllowed: false;
    browserQualification: "not-run";
    visualMatrixQualification: "not-run";
    soakQualification: "not-run";
    rtxWebGpuQualification: "not-run";
  }>;
  recovery: readonly Readonly<{
    blocker: KerrEvidenceDependencyNodeIdV470;
    requiredExternalAction: string;
    automaticActionAllowed: false;
  }>[];
  lifecycle: Readonly<{
    existingCanvasCount: 1;
    newCanvasCreated: false;
    sceneRevisionDelta: 0;
    workers: 0;
    gpuBuffers: 0;
    pipelines: 0;
    textures: 0;
    renderTargets: 0;
    typedArrayCaches: 0;
    objectUrls: 0;
    cameraLeases: 0;
    subscriptions: 0;
    allResourcesAtBaseline: true;
  }>;
  boundary: Readonly<{
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackAllowed: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    imageProductsGenerated: false;
    networkAttempted: false;
    automaticRetryApplied: false;
    denseShardRunAllowed: false;
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type KerrEvidenceDependencySummaryV470 = Readonly<{
  version: typeof KERR_EVIDENCE_DEPENDENCY_SUMMARY_VERSION_V470;
  status: KerrEvidenceDependencyArtifactV470["status"];
  artifactSha256: string;
  contract: KerrEvidenceDependencyArtifactV470["contract"];
  nodes: KerrEvidenceDependencyArtifactV470["nodes"];
  edges: KerrEvidenceDependencyArtifactV470["edges"];
  analysis: KerrEvidenceDependencyArtifactV470["analysis"];
  outcomes: KerrEvidenceDependencyArtifactV470["outcomes"];
  recovery: KerrEvidenceDependencyArtifactV470["recovery"];
  lifecycle: KerrEvidenceDependencyArtifactV470["lifecycle"];
  boundary: KerrEvidenceDependencyArtifactV470["boundary"];
}>;

export type KerrEvidenceDependencyApiV470 = Readonly<{
  version: typeof KERR_EVIDENCE_DEPENDENCY_API_VERSION_V470;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrEvidenceDependencySummaryV470 | null;
}>;

export function analyzeKerrEvidenceDependencyGraphV470(
  nodes: readonly KerrEvidenceDependencyNodeV470[],
  edges: readonly KerrEvidenceDependencyEdgeV470[],
): KerrEvidenceDependencyAnalysisV470 {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  if (nodeById.size !== nodes.length) throw new Error("v470-duplicate-node");

  const rank = new Map(nodes.map((node, index) => [node.id, index]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const adjacency = new Map(nodes.map((node) => [node.id, [] as KerrEvidenceDependencyNodeIdV470[]]));
  const blockingAdjacency = new Map(
    nodes.map((node) => [node.id, [] as KerrEvidenceDependencyNodeIdV470[]]),
  );
  const blockingIndegree = new Map(nodes.map((node) => [node.id, 0]));

  for (const edge of edges) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to) || edge.from === edge.to) {
      throw new Error("v470-edge-identity");
    }
    adjacency.get(edge.from)?.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    if (edge.propagatesBlocker) {
      blockingAdjacency.get(edge.from)?.push(edge.to);
      blockingIndegree.set(edge.to, (blockingIndegree.get(edge.to) ?? 0) + 1);
    }
  }

  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const topologicalOrder: KerrEvidenceDependencyNodeIdV470[] = [];
  while (ready.length > 0) {
    ready.sort((left, right) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
    const current = ready.shift();
    if (!current) break;
    topologicalOrder.push(current);
    for (const next of adjacency.get(current) ?? []) {
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) ready.push(next);
    }
  }
  if (topologicalOrder.length !== nodes.length) throw new Error("v470-dependency-cycle");

  const rootBlockers = nodes
    .filter(
      (node) =>
        node.blocksOutcome && !node.productionQualified && blockingIndegree.get(node.id) === 0,
    )
    .map((node) => {
      const descendants = new Set<KerrEvidenceDependencyNodeIdV470>();
      const queue = [...(blockingAdjacency.get(node.id) ?? [])];
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next || descendants.has(next)) continue;
        descendants.add(next);
        queue.push(...(blockingAdjacency.get(next) ?? []));
      }
      return Object.freeze({
        nodeId: node.id,
        reason: node.blockReason ?? "production-not-qualified",
        blockedDescendantCount: descendants.size,
      });
    });

  return freezeDeep({
    acyclic: true as const,
    topologicalOrder,
    rootBlockers,
    blockedProductionNodeCount: nodes.filter(
      (node) => node.blocksOutcome && !node.productionQualified,
    ).length,
    protocolQualifiedNodeCount: nodes.filter((node) => node.protocolQualified).length,
    productionQualifiedNodeCount: nodes.filter((node) => node.productionQualified).length,
    authorityGrantedNodeCount: 0 as const,
    sciencePixelRows: 0 as const,
  });
}

export function parseKerrEvidenceDependencyArtifactV470(
  value: unknown,
): KerrEvidenceDependencyArtifactV470 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrEvidenceDependencyArtifactV470>)
      : null;
  const nodes = artifact?.nodes;
  const edges = artifact?.edges;
  const nodeIds = nodes?.map((node) => node.id) ?? [];

  if (
    !artifact ||
    artifact.version !== KERR_EVIDENCE_DEPENDENCY_ARTIFACT_VERSION_V470 ||
    artifact.status !== "dependency-graph-qualified-authority-blocked-browser-pending" ||
    !artifact.source ||
    Object.values(artifact.source).some((sha) => !SHA256.test(sha)) ||
    artifact.contract?.graphKind !== "qualification-prerequisite-dag" ||
    artifact.contract.nodeCount !== 16 ||
    artifact.contract.boundedSummaryOnly !== true ||
    artifact.contract.maximumResponseBytes !== 131072 ||
    artifact.contract.sourceShaRequired !== true ||
    artifact.contract.failClosedPropagation !== true ||
    artifact.contract.noCounterfactualAuthority !== true ||
    artifact.contract.noLargeArraysInReactState !== true ||
    artifact.contract.formalProductPointer !== "v263" ||
    artifact.contract.denseCampaignStatus !== "incomplete-0-of-49" ||
    !nodes ||
    nodes.length !== KERR_EVIDENCE_DEPENDENCY_NODE_IDS_V470.length ||
    nodeIds.some((id, index) => id !== KERR_EVIDENCE_DEPENDENCY_NODE_IDS_V470[index]) ||
    new Set(nodeIds).size !== nodeIds.length ||
    nodes.some(
      (node) =>
        !node.label ||
        !node.upstreamStatus ||
        node.authorityGranted !== false ||
        node.sciencePixelRows !== 0 ||
        (node.artifactSha256 !== null && !SHA256.test(node.artifactSha256)) ||
        (node.blockReason !== null && node.blockReason.length === 0),
    ) ||
    !edges ||
    edges.length !== artifact.contract.edgeCount ||
    edges.some((edge) => !nodeIds.includes(edge.from) || !nodeIds.includes(edge.to) || !edge.requirement) ||
    artifact.analysis?.acyclic !== true ||
    artifact.analysis.topologicalOrder.length !== nodes.length ||
    artifact.analysis.rootBlockers.length !== 3 ||
    artifact.analysis.authorityGrantedNodeCount !== 0 ||
    artifact.analysis.sciencePixelRows !== 0 ||
    artifact.outcomes?.measuredAuthorityGranted !== false ||
    artifact.outcomes.scienceRasterAuthorityGranted !== false ||
    artifact.outcomes.localShadowPromotionAllowed !== false ||
    artifact.outcomes.browserQualification !== "not-run" ||
    artifact.outcomes.visualMatrixQualification !== "not-run" ||
    artifact.outcomes.soakQualification !== "not-run" ||
    artifact.outcomes.rtxWebGpuQualification !== "not-run" ||
    artifact.recovery?.length !== 3 ||
    artifact.recovery.some((entry) => entry.automaticActionAllowed !== false) ||
    artifact.lifecycle?.existingCanvasCount !== 1 ||
    artifact.lifecycle.newCanvasCreated !== false ||
    artifact.lifecycle.sceneRevisionDelta !== 0 ||
    artifact.lifecycle.allResourcesAtBaseline !== true ||
    [
      artifact.lifecycle.workers,
      artifact.lifecycle.gpuBuffers,
      artifact.lifecycle.pipelines,
      artifact.lifecycle.textures,
      artifact.lifecycle.renderTargets,
      artifact.lifecycle.typedArrayCaches,
      artifact.lifecycle.objectUrls,
      artifact.lifecycle.cameraLeases,
      artifact.lifecycle.subscriptions,
    ].some((count) => count !== 0) ||
    artifact.boundary?.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.cinematicScienceWritebackAllowed !== false ||
    artifact.boundary.fitsWriteAllowed !== false ||
    artifact.boundary.pngWriteAllowed !== false ||
    artifact.boundary.imageProductsGenerated !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.boundary.denseShardRunAllowed !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    !SHA256.test(artifact.artifactSha256 ?? "")
  ) {
    throw new Error("v470-dependency-artifact-identity");
  }

  const recomputed = analyzeKerrEvidenceDependencyGraphV470(nodes, edges);
  if (JSON.stringify(recomputed) !== JSON.stringify(artifact.analysis)) {
    throw new Error("v470-dependency-analysis-mismatch");
  }
  return freezeDeep(value as KerrEvidenceDependencyArtifactV470);
}

export function createKerrEvidenceDependencySummaryV470(
  value: unknown,
): KerrEvidenceDependencySummaryV470 {
  const artifact = parseKerrEvidenceDependencyArtifactV470(value);
  return freezeDeep({
    version: KERR_EVIDENCE_DEPENDENCY_SUMMARY_VERSION_V470,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    contract: artifact.contract,
    nodes: artifact.nodes,
    edges: artifact.edges,
    analysis: artifact.analysis,
    outcomes: artifact.outcomes,
    recovery: artifact.recovery,
    lifecycle: artifact.lifecycle,
    boundary: artifact.boundary,
  });
}

export function parseKerrEvidenceDependencyApiV470(value: unknown): KerrEvidenceDependencyApiV470 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrEvidenceDependencyApiV470>)
      : null;
  if (
    !api ||
    api.version !== KERR_EVIDENCE_DEPENDENCY_API_VERSION_V470 ||
    typeof api.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(
      api.reason ?? "",
    ) ||
    (api.available && (!api.summary || api.reason !== "ready")) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v470-dependency-api-identity");
  }
  return freezeDeep(value as KerrEvidenceDependencyApiV470);
}
