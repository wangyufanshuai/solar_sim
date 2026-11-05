import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v472-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v472.json",
  ledger: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v473-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v473.json",
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
const ledger = read(paths.ledger);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v472-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v472" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  ledger.version !== "v473-kerr-observable-uncertainty-artifact-v1" ||
  ledger.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  canonicalSha(ledger) !== ledger.artifactSha256 ||
  ledger.entries?.length !== 13 ||
  ledger.summary?.componentCount !== 16 ||
  ledger.summary?.quantifiedEntryCount !== 9 ||
  ledger.summary?.rssEntryCount !== 0 ||
  ledger.summary?.productionBudgetClosedCount !== 0 ||
  ledger.productionLedger?.status !== "open" ||
  ledger.boundary?.productionAuthorityGranted !== false ||
  ledger.boundary?.sciencePixelRows !== 0 ||
  ledger.lifecycle?.allResourcesAtBaseline !== true ||
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
  throw new Error("v473-evidence-boundary");
}

const sourcePaths = [
  paths.ledger,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrObservableUncertaintyV473.ts",
  "app/lib/kerrObservableUncertaintyServerV473.ts",
  "app/lib/kerrObservableUncertaintyClientV473.ts",
  "app/components/KerrObservableUncertaintyLedgerV473.tsx",
  "app/api/atlas/relativity-evidence/v473/observable-uncertainty/route.ts",
  "app/local-shadow-v473/page.tsx",
  "scripts/build-kerr-observable-uncertainty-v473.ts",
  "scripts/build-shadow-candidate-v473.mjs",
  "scripts/verify-shadow-v473-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v473-observable-uncertainty-qualified-production-ledger-open-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v473-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v472EvidenceSha256: previousEvidence.evidenceSha256,
    v472EvidenceFileSha256: fileSha(paths.previousEvidence),
    v472PointerSha256: previousPointer.pointerSha256,
    v472PointerFileSha256: fileSha(paths.previousPointer),
    v473LedgerArtifactSha256: ledger.artifactSha256,
    v473LedgerFileSha256: fileSha(paths.ledger),
    v314StateSha256: dense.stateSha256,
  },
  uncertainty: {
    entryCount: ledger.entries.length,
    componentCount: ledger.summary.componentCount,
    quantifiedEntryCount: ledger.summary.quantifiedEntryCount,
    combinedEntryCount: ledger.summary.combinedEntryCount,
    separateChannelEntryCount: ledger.summary.separateChannelEntryCount,
    unavailableEntryCount: ledger.summary.unavailableEntryCount,
    numericAcceptanceCount: ledger.summary.numericAcceptanceCount,
    sourceQualifiedWithoutNumericLimitCount:
      ledger.summary.sourceQualifiedWithoutNumericLimitCount,
    linearSumEntryCount: ledger.summary.linearSumEntryCount,
    maximumEntryCount: ledger.summary.maximumEntryCount,
    singleComponentEntryCount: ledger.summary.singleComponentEntryCount,
    rssEntryCount: 0,
    productionBudgetClosedCount: 0,
    independenceProven: false,
  },
  productionLedger: ledger.productionLedger,
  lifecycle: {
    ...ledger.lifecycle,
    canvasCreatedByV473: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: ledger.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v473/page.tsx",
    component: "KerrObservableUncertaintyLedgerV473",
    endpoint: "/api/atlas/relativity-evidence/v473/observable-uncertainty",
    downloadQuery: "download=uncertainty-ledger",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    observableUncertaintyLedger: "qualified-13-entries",
    numericComponents: "qualified-16",
    noRssWithoutIndependence: "qualified",
    linearCombinationPolicy: "qualified-3-entries",
    correlatedTolerancePolicy: "qualified-max-1-entry",
    separatePhysicalChannels: "qualified-1-entry",
    productionLedger: "open",
    productionAuthority: "blocked",
    scienceRaster: "blocked",
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
    "v473-bounded-observable-uncertainty-ledger-only-no-production-closure-rss-authority-pixels-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v473",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v472ScienceCinematicV8: "implemented-browser-pending",
    v473UncertaintyLedger: "qualified-13-entries",
    v473NumericComponents: "qualified-16",
    v473CombinationPolicy: "qualified-no-rss",
    v473ProductionLedger: "open",
    v473ProductionAuthorityGranted: false,
    v473SciencePixelRows: 0,
    v473BrowserQualification: "not-run",
    v473VisualMatrixQualification: "not-run",
    v473SoakQualification: "not-run",
    v473RtxWebGpuQualification: "not-run",
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
      artifactSha256: ledger.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      entryCount: 13,
      componentCount: 16,
      quantified: 9,
      rssUsed: 0,
      productionLedger: "open",
      productionAuthority: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
