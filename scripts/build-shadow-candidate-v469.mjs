import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v468-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v468.json",
  workbench: "dist/science/kerr-unified-workbench-v469/workbench.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v469-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v469.json",
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
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const workbench = read(paths.workbench);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v468-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v468" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  workbench.version !== "v469-kerr-unified-workbench-artifact-v1" ||
  workbench.status !== "unified-kerr-workbench-qualified-browser-pending" ||
  canonicalSha(workbench) !== workbench.artifactSha256 ||
  workbench.stages?.length !== 6 ||
  workbench.stages.some(
    (stage) => stage.authorityGranted !== false || stage.sciencePixelRows !== 0,
  ) ||
  workbench.lifecycle?.allResourcesAtBaseline !== true ||
  workbench.boundary?.fitsWriteAllowed !== false ||
  workbench.boundary?.pngWriteAllowed !== false ||
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
  throw new Error("v469-evidence-boundary");
}

const sourcePaths = [
  paths.workbench,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrUnifiedWorkbenchV469.ts",
  "app/lib/kerrUnifiedWorkbenchServerV469.ts",
  "app/lib/kerrUnifiedWorkbenchClientV469.ts",
  "app/components/KerrUnifiedWorkbenchV469.tsx",
  "app/api/atlas/relativity-evidence/v469/unified-workbench/route.ts",
  "app/local-shadow-v469/page.tsx",
  "scripts/build-kerr-unified-workbench-v469.ts",
  "scripts/build-shadow-candidate-v469.mjs",
  "scripts/verify-shadow-v469-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v469-unified-kerr-workbench-qualified-browser-pending";

const unsigned = {
  version: "orbit-atlas-shadow-v469-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v468EvidenceSha256: previousEvidence.evidenceSha256,
    v468EvidenceFileSha256: fileSha(paths.previousEvidence),
    v468PointerSha256: previousPointer.pointerSha256,
    v468PointerFileSha256: fileSha(paths.previousPointer),
    v469WorkbenchArtifactSha256: workbench.artifactSha256,
    v469WorkbenchFileSha256: fileSha(paths.workbench),
    v314StateSha256: dense.stateSha256,
  },
  workbench: {
    stageCount: workbench.stages.length,
    stageIds: workbench.stages.map((stage) => stage.id),
    stageSummaryQualified: true,
    shaChainQualified: true,
    authorityGranted: false,
    sciencePixelRows: 0,
    summaryOnly: true,
    maximumResponseBytes: 128 * 1024,
    fullArraysInReactState: false,
    failureReasonsVisible: true,
  },
  lifecycle: {
    ...workbench.lifecycle,
    canvasCreatedByV469: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: {
    sciencePayloadMutationAllowed: false,
    cinematicScienceWritebackAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    imageProductsGenerated: false,
    networkAttempted: false,
    automaticRetryApplied: false,
    measuredAuthorityGranted: false,
    denseAggregateAvailable: false,
  },
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v469/page.tsx",
    component: "KerrUnifiedWorkbenchV469",
    endpoint: "/api/atlas/relativity-evidence/v469/unified-workbench",
    downloadQuery: "download=workbench",
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    unifiedStageRail: "qualified",
    lifecycleBaseline: "qualified",
    canonicalShaChain: "qualified",
    productionAuthority: "blocked-measured-inputs",
    sciencePixelPayload: "blocked-zero-rows",
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
    "v469-summary-only-six-stage-evidence-rail-no-authority-pixels-images-runtime-mutation-or-promotion",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v469",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v463PayloadAdmission: "qualified-protocol-join-blocked",
    v464MeasuredProvenance: "blocked-0-of-6",
    v465DetectorResponse: "qualified-validation-production-blocked",
    v466RadiativeTransfer: "qualified-invariant-measured-input-blocked",
    v467ThinDiskAnalytic: "qualified-measured-input-blocked",
    v468SingleRedshiftCoupling: "qualified-measured-input-blocked",
    v469UnifiedEvidenceRail: "qualified-browser-pending",
    v469LifecycleBaseline: "qualified",
    v469Authority: "not-granted",
    v469SciencePixelRows: 0,
    v469BrowserQualification: "not-run",
    v469VisualMatrixQualification: "not-run",
    v469SoakQualification: "not-run",
    v469RtxWebGpuQualification: "not-run",
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
      artifactSha256: workbench.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stageCount: workbench.stages.length,
      authorityGranted: false,
      sciencePixelRows: 0,
      lifecycleBaseline: true,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
