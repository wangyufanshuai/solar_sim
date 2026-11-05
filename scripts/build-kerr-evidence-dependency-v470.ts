import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  analyzeKerrEvidenceDependencyGraphV470,
  canonicalKerrEvidenceDependencyPayloadV470,
  KERR_EVIDENCE_DEPENDENCY_ARTIFACT_VERSION_V470,
  parseKerrEvidenceDependencyArtifactV470,
  type KerrEvidenceDependencyEdgeV470,
  type KerrEvidenceDependencyNodeV470,
} from "../app/lib/kerrEvidenceDependencyV470";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v459: "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
  v460: "dist/science/kerr-measured-detector-blind-results-v460/blind-results.json",
  v461: "dist/science/kerr-uncertainty-residual-ledger-v461/residual-ledger.json",
  v462: "dist/science/kerr-scientific-measurement-join-v462/measurement-join.json",
  v463: "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  v464: "dist/science/kerr-measured-detector-provenance-v464/provenance-observatory.json",
  v465: "dist/science/kerr-detector-response-v465/response-contract.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v467: "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v469: "dist/science/kerr-unified-workbench-v469/workbench.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
});

const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalSha = (value: unknown) =>
  createHash("sha256")
    .update(canonicalKerrEvidenceDependencyPayloadV470(value))
    .digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;

const docs = {
  v458: read(paths.v458),
  v459: read(paths.v459),
  v460: read(paths.v460),
  v461: read(paths.v461),
  v462: read(paths.v462),
  v463: read(paths.v463),
  v464: read(paths.v464),
  v465: read(paths.v465),
  v466: read(paths.v466),
  v467: read(paths.v467),
  v468: read(paths.v468),
  v469: read(paths.v469),
  dense: read(paths.dense),
  formal: read(paths.formal),
};
const formalEvidence = read(String(docs.formal.source));

if (
  nested(docs.v458, "inspect").readyFileCount !== 0 ||
  (nested(docs.v458, "inspect").missingFileIds as unknown[])?.length !== 6 ||
  nested(docs.v458, "productionAdmission").measuredDetectorAuthorityGranted !== false ||
  nested(docs.v459, "qualification").measuredBlindValidationQualified !== false ||
  nested(docs.v460, "qualification").productionResultQualified !== false ||
  nested(docs.v461, "qualification").productionLedgerQualified !== false ||
  nested(docs.v462, "join").joinAllowed !== false ||
  nested(docs.v463, "admission").sciencePayloadAllowed !== false ||
  nested(docs.v464, "admission").authorityGranted !== false ||
  nested(docs.v465, "boundary").productionResponseExecutable !== false ||
  nested(docs.v466, "boundary").productionRadiativeTransferAllowed !== false ||
  nested(docs.v467, "boundary").productionThinDiskAllowed !== false ||
  nested(docs.v468, "boundary").productionCouplingAllowed !== false ||
  nested(docs.v469, "lifecycle").allResourcesAtBaseline !== true ||
  docs.dense.status !== "incomplete-0-of-49" ||
  docs.dense.completedShardCount !== 0 ||
  docs.dense.attemptConsumed !== false ||
  docs.dense.aggregateAvailable !== false ||
  docs.formal.version !== "v263-current-product-evidence-pointer" ||
  nested(formalEvidence, "science").defaultKernel !== "legacy-eih-1pn" ||
  nested(formalEvidence, "contracts").singleCanvas !== true ||
  nested(formalEvidence, "contracts").legacyRootAttributes !== 603 ||
  nested(formalEvidence, "contracts").evidenceLedgerClaims !== 84
) {
  throw new Error("v470-upstream-boundary");
}

const node = (
  value: Omit<KerrEvidenceDependencyNodeV470, "authorityGranted" | "sciencePixelRows">,
): KerrEvidenceDependencyNodeV470 =>
  Object.freeze({ ...value, authorityGranted: false as const, sciencePixelRows: 0 as const });

const nodes: readonly KerrEvidenceDependencyNodeV470[] = Object.freeze([
  node({ id: "v458-measured-intake", kind: "evidence-stage", label: "Measured detector intake", upstreamStatus: String(docs.v458.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v458.artifactSha256), blockReason: "measured-files-missing-6-of-6", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v459-blind-validation", kind: "evidence-stage", label: "Blind validation", upstreamStatus: String(docs.v459.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v459.artifactSha256), blockReason: "measured-inputs-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v460-blind-results", kind: "evidence-stage", label: "Blind results", upstreamStatus: String(docs.v460.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v460.artifactSha256), blockReason: "production-results-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v461-residual-ledger", kind: "evidence-stage", label: "Residual ledger", upstreamStatus: String(docs.v461.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v461.artifactSha256), blockReason: "production-ledger-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v462-atomic-join", kind: "evidence-stage", label: "Atomic measurement join", upstreamStatus: String(docs.v462.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v462.artifactSha256), blockReason: "measured-inputs-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v463-payload-admission", kind: "evidence-stage", label: "Science payload admission", upstreamStatus: String(docs.v463.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v463.artifactSha256), blockReason: "measurement-join-incomplete", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v464-provenance", kind: "evidence-stage", label: "Measured provenance", upstreamStatus: String(docs.v464.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v464.artifactSha256), blockReason: "measured-files-missing", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v465-response", kind: "evidence-stage", label: "Detector response", upstreamStatus: String(docs.v465.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v465.artifactSha256), blockReason: "production-calibration-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v466-radiative-transfer", kind: "evidence-stage", label: "Radiative transfer", upstreamStatus: String(docs.v466.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v466.artifactSha256), blockReason: "measured-input-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v467-thin-disk", kind: "evidence-stage", label: "Analytic thin disk", upstreamStatus: String(docs.v467.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v467.artifactSha256), blockReason: "measured-input-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v468-coupling", kind: "evidence-stage", label: "Emission / observer coupling", upstreamStatus: String(docs.v468.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v468.artifactSha256), blockReason: "measured-input-unavailable", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "v469-workbench", kind: "evidence-stage", label: "Unified evidence rail", upstreamStatus: String(docs.v469.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.v469.artifactSha256), blockReason: "browser-qualification-not-run", blocksOutcome: false, browserQualification: "not-run" }),
  node({ id: "v314-dense-campaign", kind: "campaign", label: "Dense Kerr campaign", upstreamStatus: String(docs.dense.status), protocolQualified: true, productionQualified: false, artifactSha256: String(docs.dense.stateSha256), blockReason: "dense-campaign-incomplete-0-of-49", blocksOutcome: true, browserQualification: "not-applicable" }),
  node({ id: "heavy-qualification", kind: "qualification", label: "Browser / visual / soak / RTX", upstreamStatus: "not-run", protocolQualified: false, productionQualified: false, artifactSha256: null, blockReason: "heavy-qualification-not-run", blocksOutcome: true, browserQualification: "not-run" }),
  node({ id: "science-raster-authority", kind: "outcome", label: "Science raster authority", upstreamStatus: "blocked", protocolQualified: false, productionQualified: false, artifactSha256: null, blockReason: "upstream-production-prerequisites-blocked", blocksOutcome: true, browserQualification: "not-applicable" }),
  node({ id: "local-shadow-promotion", kind: "outcome", label: "Local-shadow promotion", upstreamStatus: "blocked", protocolQualified: false, productionQualified: false, artifactSha256: null, blockReason: "science-raster-and-heavy-qualification-blocked", blocksOutcome: true, browserQualification: "not-run" }),
]);

const edge = (
  from: KerrEvidenceDependencyEdgeV470["from"],
  to: KerrEvidenceDependencyEdgeV470["to"],
  requirement: string,
  propagatesBlocker = true,
): KerrEvidenceDependencyEdgeV470 => Object.freeze({ from, to, requirement, propagatesBlocker });

const edges: readonly KerrEvidenceDependencyEdgeV470[] = Object.freeze([
  edge("v458-measured-intake", "v459-blind-validation", "measured-input-availability"),
  edge("v458-measured-intake", "v460-blind-results", "measured-intake-identity"),
  edge("v459-blind-validation", "v460-blind-results", "blind-validation"),
  edge("v458-measured-intake", "v461-residual-ledger", "measured-provenance"),
  edge("v459-blind-validation", "v461-residual-ledger", "validated-model"),
  edge("v460-blind-results", "v461-residual-ledger", "measured-residuals"),
  edge("v458-measured-intake", "v462-atomic-join", "measured-input-ready"),
  edge("v460-blind-results", "v462-atomic-join", "blind-results-ready"),
  edge("v461-residual-ledger", "v462-atomic-join", "residual-ledger-closed"),
  edge("v462-atomic-join", "v463-payload-admission", "atomic-measurement-join"),
  edge("v458-measured-intake", "v464-provenance", "v458-measured-boundary"),
  edge("v464-provenance", "v465-response", "measured-calibration-provenance"),
  edge("v463-payload-admission", "v465-response", "science-payload-admission"),
  edge("v462-atomic-join", "v465-response", "atomic-measurement-join"),
  edge("v463-payload-admission", "v466-radiative-transfer", "pixel-admission"),
  edge("v464-provenance", "v466-radiative-transfer", "measured-authority"),
  edge("v463-payload-admission", "v467-thin-disk", "pixel-admission"),
  edge("v464-provenance", "v467-thin-disk", "measured-authority"),
  edge("v466-radiative-transfer", "v468-coupling", "transport-source"),
  edge("v467-thin-disk", "v468-coupling", "local-emission-source"),
  edge("v463-payload-admission", "v468-coupling", "pixel-admission"),
  edge("v464-provenance", "v468-coupling", "measured-authority"),
  edge("v463-payload-admission", "v469-workbench", "summarized-status", false),
  edge("v464-provenance", "v469-workbench", "summarized-status", false),
  edge("v465-response", "v469-workbench", "summarized-status", false),
  edge("v466-radiative-transfer", "v469-workbench", "summarized-status", false),
  edge("v467-thin-disk", "v469-workbench", "summarized-status", false),
  edge("v468-coupling", "v469-workbench", "summarized-status", false),
  edge("v463-payload-admission", "science-raster-authority", "payload-admission"),
  edge("v465-response", "science-raster-authority", "detector-response"),
  edge("v468-coupling", "science-raster-authority", "radiative-coupling"),
  edge("v314-dense-campaign", "science-raster-authority", "complete-dense-aggregate"),
  edge("science-raster-authority", "local-shadow-promotion", "science-authority"),
  edge("heavy-qualification", "local-shadow-promotion", "runtime-qualification"),
]);

const analysis = analyzeKerrEvidenceDependencyGraphV470(nodes, edges);
const expectedRootBlockers = [
  "v458-measured-intake",
  "v314-dense-campaign",
  "heavy-qualification",
];
if (
  JSON.stringify(analysis.rootBlockers.map((entry) => entry.nodeId)) !==
  JSON.stringify(expectedRootBlockers)
) {
  throw new Error("v470-root-blocker-identity");
}

const source = Object.fromEntries(
  Object.entries(paths)
    .filter(([key]) => !["formal", "output"].includes(key))
    .map(([key, path]) => [key, fileSha(path)]),
);
const unsigned = {
  version: KERR_EVIDENCE_DEPENDENCY_ARTIFACT_VERSION_V470,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "dependency-graph-qualified-authority-blocked-browser-pending" as const,
  source,
  contract: {
    graphKind: "qualification-prerequisite-dag" as const,
    nodeCount: 16 as const,
    edgeCount: edges.length,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    sourceShaRequired: true as const,
    failClosedPropagation: true as const,
    noCounterfactualAuthority: true as const,
    noLargeArraysInReactState: true as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
  },
  nodes,
  edges,
  analysis,
  outcomes: {
    measuredAuthorityGranted: false as const,
    scienceRasterAuthorityGranted: false as const,
    localShadowPromotionAllowed: false as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  recovery: [
    { blocker: "v458-measured-intake" as const, requiredExternalAction: "supply-and-independently-validate-six-measured-files", automaticActionAllowed: false as const },
    { blocker: "v314-dense-campaign" as const, requiredExternalAction: "explicit-per-shard-authorization-until-49-of-49", automaticActionAllowed: false as const },
    { blocker: "heavy-qualification" as const, requiredExternalAction: "stable-seven-gib-then-browser-visual-soak-rtx-gates", automaticActionAllowed: false as const },
  ],
  lifecycle: {
    existingCanvasCount: 1 as const,
    newCanvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    workers: 0 as const,
    gpuBuffers: 0 as const,
    pipelines: 0 as const,
    textures: 0 as const,
    renderTargets: 0 as const,
    typedArrayCaches: 0 as const,
    objectUrls: 0 as const,
    cameraLeases: 0 as const,
    subscriptions: 0 as const,
    allResourcesAtBaseline: true as const,
  },
  boundary: {
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
    imageProductsGenerated: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};

const artifact = parseKerrEvidenceDependencyArtifactV470({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);

console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      nodeCount: artifact.nodes.length,
      edgeCount: artifact.edges.length,
      rootBlockers: artifact.analysis.rootBlockers,
      authorityGranted: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
