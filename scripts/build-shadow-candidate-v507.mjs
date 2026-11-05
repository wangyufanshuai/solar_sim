import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v506-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v506.json",
  integration:
    "dist/science/atlas-detector-hud-integration-v507/integration-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v507-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v507.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
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
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const integration = read(paths.integration);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v506-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v506" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  integration.version !== "v507-atlas-detector-hud-integration-audit-v1" ||
  sha(integration) !== integration.artifactSha256 ||
  integration.integration.consumerSurfaceCount !== 3 ||
  integration.integration.admissionTokenConsumption !== "12-of-12" ||
  integration.admissionBoundary.admitted !== false ||
  integration.admissionBoundary.sciencePayloadReferencePreservedAcrossModes !== true ||
  integration.lifecycle.returnedToBaseline !== true ||
  integration.lifecycle.finalDiff.status !== "baseline" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v507-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.integration,
  paths.dense,
  paths.formal,
  "app/components/KerrTopologyDetectorAdmissionV501.tsx",
  "app/components/KerrTopologyDetectorAdmissionV501.test.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/components/AtlasCalibrationHudAdmissionRuntimeV507.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasCalibrationHudProfileV505.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "app/lib/kerrTopologyDetectorAdmissionV501.ts",
  "app/lib/kerrTopologyDetectorAdmissionClientV501.ts",
  "scripts/build-atlas-detector-hud-integration-v507.ts",
  "scripts/build-shadow-candidate-v507.mjs",
  "scripts/build-shadow-v507.mjs",
  "scripts/verify-shadow-v507-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v507-three-stage-detector-hud-integration-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v507-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v506EvidenceSha256: previousEvidence.evidenceSha256,
    v506PointerSha256: previousPointer.pointerSha256,
    v507IntegrationArtifactSha256: integration.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  integration: integration.integration,
  admissionBoundary: integration.admissionBoundary,
  lifecycle: integration.lifecycle,
  runtime: integration.runtime,
  qualification: integration.qualification,
  scienceBoundary: {
    measuredCalibrationFiles: "0/6",
    detectorAuthority: false,
    detectorResponse: "unavailable",
    observedCounts: "unavailable",
    observedIntensity: "unavailable",
    scienceRaster: "unavailable",
    sciencePixelRows: 0,
    fitsProducts: 0,
    pngProducts: 0,
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: integration.release,
  boundaryStatement: integration.boundary,
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v507",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v501AdmissionArtifact: "canonical-sha-preserved",
    v501AdmissionPayload: "canonical-sha-preserved",
    v505StableHudProfile: "qualified",
    v506SharedHudModeStore: "qualified",
    v507DetectorHudConsumers: "qualified-3",
    v507AdmissionTokenConsumption: "qualified-12-of-12",
    v507LifecycleBaseline: "qualified",
    v507SciencePayloadIsolation: "qualified",
    v507MeasuredCalibrationPack: "blocked-0-of-6",
    v507DetectorAuthority: "blocked",
    v507ScienceRaster: "unavailable",
    v507BrowserQualification: "not-run",
    v507VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceRasterPayloadAllowed: false,
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
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status,
      integrationArtifactSha256: integration.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      detectorHudConsumers: 3,
      admissionTokens: "12/12",
      admissionArtifactSha256: integration.admissionBoundary.artifactSha256,
      admissionPayloadSha256: integration.admissionBoundary.payloadSha256,
      finalResourceStatus: integration.lifecycle.finalDiff.status,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
