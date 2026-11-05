import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v507-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v507.json",
  replay: "dist/science/atlas-calibration-evidence-replay-v508/replay-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v508-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v508.json",
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
const replay = read(paths.replay);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v507-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v507" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  replay.version !== "v508-atlas-calibration-evidence-replay-audit-v1" ||
  sha(replay) !== replay.artifactSha256 ||
  replay.replay.requestCount !== 2 ||
  replay.replay.readinessRequestCount !== 1 ||
  replay.replay.preflightRequestCount !== 1 ||
  replay.replay.readinessReferencePreserved !== true ||
  replay.resources.returnedToBaseline !== true ||
  replay.resources.finalDiff.status !== "baseline" ||
  replay.scienceBoundary.scientificFieldMutationAllowed !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v508-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.replay,
  paths.dense,
  paths.formal,
  "app/lib/atlasCalibrationEvidenceClientV508.ts",
  "app/lib/atlasCalibrationEvidenceClientV508.test.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/components/AtlasCalibrationHudAdmissionRuntimeV507.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-atlas-calibration-evidence-replay-v508.ts",
  "scripts/build-shadow-candidate-v508.mjs",
  "scripts/build-shadow-v508.mjs",
  "scripts/verify-shadow-v508-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v508-external-calibration-evidence-single-flight-replay-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v508-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v507EvidenceSha256: previousEvidence.evidenceSha256,
    v507PointerSha256: previousPointer.pointerSha256,
    v508ReplayArtifactSha256: replay.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  replay: replay.replay,
  evidenceStores: replay.evidenceStores,
  scienceBoundary: replay.scienceBoundary,
  resources: replay.resources,
  qualification: replay.qualification,
  runtime: {
    externalEvidenceChannelCount: 2,
    componentLocalFetchCount: 0,
    componentLocalRequestRefCount: 0,
    appShellSubscription: false,
    automaticNetworkRequestBeforeDetailIntent: 0,
    sceneRevisionDelta: 0,
    canvasCreated: false,
    physicsMutationAllowed: false,
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
  release: replay.release,
  boundaryStatement: replay.boundary,
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v508",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v507DetectorHudIntegration: "qualified-3-consumers",
    v508EvidenceChannels: "qualified-2",
    v508ReadinessSingleFlight: "qualified-1-request",
    v508PreflightSingleFlight: "qualified-1-request",
    v508CrossUnmountCache: "qualified",
    v508ModePersistence: "qualified-cinematic",
    v508ResourceBaseline: "qualified",
    v508SciencePayloadIsolation: "qualified",
    v508MeasuredCalibrationPack: "blocked-0-of-6",
    v508DetectorAuthority: "blocked",
    v508ScienceRaster: "unavailable",
    v508BrowserQualification: "not-run",
    v508SoakQualification: "not-run",
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
      replayArtifactSha256: replay.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      requests: "1/1",
      crossUnmountCache: "qualified",
      finalMode: replay.replay.finalMode,
      finalResourceStatus: replay.resources.finalDiff.status,
      scienceMutation: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
