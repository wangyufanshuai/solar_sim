import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v458-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v458.json",
  validation: "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v457: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v459-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v459.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
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
const validation = read(paths.validation);
const intake = read(paths.intake);
const v457 = read(paths.v457);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v458-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v458" ||
  validation.version !== "v459-kerr-measured-detector-blind-validation-artifact-v1" ||
  validation.status !== "blind-validation-protocol-qualified-measured-inputs-unavailable" ||
  validation.protocol?.fixedFoldCount !== 3 ||
  validation.protocol?.minimumRepeatsPerFold !== 3 ||
  validation.protocol?.sourceRowsNeverFitOnHoldout !== true ||
  validation.protocol?.holdoutReadOnlyAfterLock !== true ||
  validation.protocol?.overlapTolerance !== 0 ||
  validation.control?.status !== "validation-only" ||
  validation.control?.authorityGranted !== false ||
  validation.control?.split?.overlapIds?.length !== 0 ||
  validation.adversarialFixtures?.length !== 6 ||
  validation.inspect?.measuredInputReady !== false ||
  validation.inspect?.fitExecuted !== false ||
  validation.inspect?.holdoutExecuted !== false ||
  validation.inspect?.validationExecuted !== false ||
  validation.inspect?.authorityGranted !== false ||
  validation.qualification?.protocolQualified !== true ||
  validation.qualification?.measuredBlindValidationQualified !== false ||
  validation.uncertaintyBudget?.combination !== "linear-unless-independence-proven" ||
  validation.uncertaintyBudget?.rssAllowed !== false ||
  validation.uncertaintyBudget?.budgetClosed !== false ||
  validation.boundary?.holdoutValuesPresent !== false ||
  validation.boundary?.sciencePixelsAvailable !== false ||
  validation.boundary?.fitsWriteAllowed !== false ||
  validation.boundary?.pngWriteAllowed !== false ||
  intake.inspect?.readyFileCount !== 0 ||
  v457.decisions?.promotionAllowed !== false ||
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
  throw new Error("v459-evidence-boundary");
}
const sourcePaths = [
  paths.validation,
  paths.intake,
  paths.v457,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrMeasuredDetectorBlindValidationV459.ts",
  "app/lib/kerrMeasuredDetectorBlindValidationServerV459.ts",
  "app/lib/kerrMeasuredDetectorBlindValidationClientV459.ts",
  "app/components/KerrMeasuredDetectorBlindValidationV459.tsx",
  "app/api/atlas/relativity-evidence/v459/measured-detector-blind-validation/route.ts",
  "app/local-shadow-v459/page.tsx",
  "scripts/build-kerr-measured-detector-blind-validation-v459.ts",
  "scripts/build-shadow-candidate-v459.mjs",
  "scripts/verify-shadow-v459-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v459-blind-validation-protocol-qualified-fit-holdout-not-run-measured-authority-blocked-science-product-promotion-closed";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v459-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v458EvidenceSha256: previousEvidence.evidenceSha256,
    v458PointerSha256: previousPointer.pointerSha256,
    v458EvidenceFileSha256: fileSha(paths.previousEvidence),
    v458PointerFileSha256: fileSha(paths.previousPointer),
    v459ValidationArtifactSha256: validation.artifactSha256,
    v459ValidationFileSha256: fileSha(paths.validation),
    v458IntakeArtifactSha256: intake.artifactSha256,
    v457PromotionGateArtifactSha256: v457.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  blindValidation: {
    protocol: validation.protocol,
    leakageControls: validation.leakageControls,
    thresholds: validation.thresholds,
    uncertaintyBudget: validation.uncertaintyBudget,
    control: validation.control,
    adversarialFixtures: validation.adversarialFixtures,
    measuredInputReady: false,
    fitExecuted: false,
    holdoutExecuted: false,
    authorityGranted: false,
  },
  authorityBoundary: {
    protocol: "qualified",
    measuredInputInventory: "blocked-0-of-6",
    blindFit: "not-run",
    blindHoldout: "not-run",
    selectionBiasQuantification: "not-run",
    uncertaintyBudget: "contract-qualified-values-unavailable",
    detectorAuthority: "not-granted",
    sciencePixels: "unavailable",
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    sciencePayloadMutationAllowed: false,
  },
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v459/page.tsx",
    component: "KerrMeasuredDetectorBlindValidationV459",
    boundedSummaryBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    canvasCreated: false,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    protocol: "qualified",
    leakageControls: "qualified",
    uncertaintyBudgetContract: "qualified",
    measuredBlindValidation: "blocked-inputs-unavailable",
    detectorAuthority: "not-granted",
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
  boundary:
    "v459-blind-protocol-only-no-fit-holdout-pixel-authority-or-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: canonicalSha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v459",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v458MeasuredDetectorIntake: "blocked-0-of-6",
    v459BlindValidationProtocol: "qualified",
    v459LeakageControls: "qualified",
    v459UncertaintyBudgetContract: "qualified",
    v459BlindFit: "not-run-inputs-unavailable",
    v459BlindHoldout: "not-run-inputs-unavailable",
    v459SelectionBias: "not-run",
    v459MeasuredDetectorAuthority: "not-granted",
    v459SciencePixels: "unavailable",
    v459BrowserQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
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
      artifactSha256: validation.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      protocol: "qualified",
      controlSplit: "6/6 with 0 overlap",
      fitExecuted: false,
      holdoutExecuted: false,
      authorityGranted: false,
      promotionAllowed: false,
    },
    null,
    2,
  ),
);
