import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v469-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v469.json",
  graph: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v470-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v470.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const graph = read(paths.graph);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const expectedRoots = ["v458-measured-intake", "v314-dense-campaign", "heavy-qualification"];

if (
  previousEvidence.version !== "orbit-atlas-shadow-v469-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v469" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  graph.version !== "v470-kerr-evidence-dependency-artifact-v1" ||
  graph.status !== "dependency-graph-qualified-authority-blocked-browser-pending" ||
  canonicalSha(graph) !== graph.artifactSha256 ||
  graph.nodes?.length !== 16 ||
  graph.edges?.length !== 34 ||
  JSON.stringify(graph.analysis?.rootBlockers?.map((entry) => entry.nodeId)) !==
    JSON.stringify(expectedRoots) ||
  graph.analysis?.authorityGrantedNodeCount !== 0 ||
  graph.analysis?.sciencePixelRows !== 0 ||
  graph.outcomes?.scienceRasterAuthorityGranted !== false ||
  graph.outcomes?.localShadowPromotionAllowed !== false ||
  graph.lifecycle?.allResourcesAtBaseline !== true ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v470-evidence-boundary");
}

const sourcePaths = [
  paths.graph,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrEvidenceDependencyV470.ts",
  "app/lib/kerrEvidenceDependencyServerV470.ts",
  "app/lib/kerrEvidenceDependencyClientV470.ts",
  "app/components/KerrEvidenceDependencyRailV470.tsx",
  "app/api/atlas/relativity-evidence/v470/dependency-graph/route.ts",
  "app/local-shadow-v470/page.tsx",
  "scripts/build-kerr-evidence-dependency-v470.ts",
  "scripts/build-shadow-candidate-v470.mjs",
  "scripts/verify-shadow-v470-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v470-dependency-graph-qualified-authority-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v470-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v469EvidenceSha256: previousEvidence.evidenceSha256,
    v469EvidenceFileSha256: fileSha(paths.previousEvidence),
    v469PointerSha256: previousPointer.pointerSha256,
    v469PointerFileSha256: fileSha(paths.previousPointer),
    v470GraphArtifactSha256: graph.artifactSha256,
    v470GraphFileSha256: fileSha(paths.graph),
    v314StateSha256: dense.stateSha256,
  },
  graph: {
    graphKind: graph.contract.graphKind,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    acyclic: graph.analysis.acyclic,
    topologicalOrder: graph.analysis.topologicalOrder,
    rootBlockers: graph.analysis.rootBlockers,
    blockedProductionNodeCount: graph.analysis.blockedProductionNodeCount,
    protocolQualifiedNodeCount: graph.analysis.protocolQualifiedNodeCount,
    productionQualifiedNodeCount: graph.analysis.productionQualifiedNodeCount,
    authorityGrantedNodeCount: 0,
    sciencePixelRows: 0,
    failClosedPropagation: true,
    noCounterfactualAuthority: true,
  },
  outcomes: graph.outcomes,
  recovery: graph.recovery,
  lifecycle: {
    ...graph.lifecycle,
    canvasCreatedByV470: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: graph.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v470/page.tsx",
    component: "KerrEvidenceDependencyRailV470",
    endpoint: "/api/atlas/relativity-evidence/v470/dependency-graph",
    downloadQuery: "download=dependency-graph",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    dependencyDag: "qualified",
    rootBlockerDerivation: "qualified-three-roots",
    sourceShaChain: "qualified",
    scienceAuthority: "blocked-measured-dense",
    localShadowPromotion: "blocked-heavy-qualification",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    runNextAuthorized: dense.runNextAuthorized,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundaryStatement:
    "v470-causal-qualification-dag-only-no-authority-pixels-images-shards-runtime-mutation-or-promotion",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v470",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v469UnifiedEvidenceRail: "qualified-browser-pending",
    v470DependencyDag: "qualified-16-nodes-34-edges",
    v470RootBlockers: "qualified-three-roots",
    v470MeasuredAuthority: "blocked-v458-missing-6-of-6",
    v470ScienceRasterAuthority: "blocked-measured-and-dense",
    v470LocalShadowPromotion: "blocked-heavy-qualification",
    v470AuthorityGranted: false,
    v470SciencePixelRows: 0,
    v470ImageProducts: 0,
    v470BrowserQualification: "not-run",
    v470VisualMatrixQualification: "not-run",
    v470SoakQualification: "not-run",
    v470RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    sciencePayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);

console.log(
  JSON.stringify(
    {
      status,
      artifactSha256: graph.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      rootBlockers: graph.analysis.rootBlockers,
      authorityGranted: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
