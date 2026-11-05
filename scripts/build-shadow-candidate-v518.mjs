import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v517-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v517.json",
  audit: "dist/science/kerr-provenance-constellation-v518/visual-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v518-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v518.json",
};
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
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
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
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
const audit = read(paths.audit);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v517-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v517" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  audit.version !== "v518-kerr-provenance-constellation-visual-audit-v1" ||
  sha(audit) !== audit.artifactSha256 ||
  audit.encoding.profileId !== "science-cinematic-v7r2-v518" ||
  audit.encoding.modeCount !== 2 ||
  audit.encoding.nodeCount !== 8 ||
  audit.encoding.edgeCount !== 7 ||
  audit.encoding.witnessCount !== 512 ||
  audit.encoding.checkpointCount !== 8 ||
  audit.encoding.scientificPayloadStable !== true ||
  audit.encoding.geometryStable !== true ||
  audit.encoding.numericScientificStyleInputCount !== 0 ||
  audit.encoding.hashDrivenStyleCount !== 0 ||
  audit.encoding.uncertaintyDrivenStyleCount !== 0 ||
  audit.encoding.scientificFieldMutation !== false ||
  audit.science.linearDisplay !== true ||
  audit.science.bloomIntensity !== 0 ||
  audit.science.colorGradeIntensity !== 0 ||
  audit.science.animated !== false ||
  audit.science.seed !== null ||
  audit.cinematic.seed !== "orbit-atlas-v518-provenance-constellation-seed-01" ||
  audit.cinematic.geometryMutationAllowed !== false ||
  audit.cinematic.scientificWritebackAllowed !== false ||
  audit.runtime.automaticRequestCount !== 0 ||
  audit.runtime.explicitRequestCount !== 1 ||
  audit.runtime.subscriptionCount !== 2 ||
  audit.runtime.finalMode !== "science" ||
  audit.runtime.finalResourceStatus !== "baseline" ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  detector.boundary.detectorResponseAvailable !== false ||
  detector.boundary.scienceRasterAvailable !== false ||
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
  throw new Error("v518-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.audit,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrProvenanceConstellationV518.ts",
  "app/lib/kerrProvenanceConstellationV518.test.ts",
  "app/components/KerrProvenanceConstellationV518.tsx",
  "app/components/KerrProvenanceConstellationV518.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV518.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV518.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV518.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV518.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/kerrUncertaintyIndependentVerificationV517.ts",
  "app/lib/kerrUncertaintyIndependentVerificationClientV517.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-provenance-constellation-audit-v518.ts",
  "scripts/build-shadow-candidate-v518.mjs",
  "scripts/build-shadow-v518.mjs",
  "scripts/verify-shadow-v518-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v518-science-cinematic-v7r2-provenance-constellation-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v518-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v517EvidenceSha256: previousEvidence.evidenceSha256,
    v517PointerSha256: previousPointer.pointerSha256,
    v518VisualAuditArtifactSha256: audit.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  encoding: audit.encoding,
  science: audit.science,
  cinematic: audit.cinematic,
  runtime: audit.runtime,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
    fitsProducts: detector.boundary.fitsProducts,
    pngProducts: detector.boundary.pngProducts,
  },
  scienceBoundary: audit.boundary,
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
  qualification: [
    "v518-v7r2-eight-node-seven-edge-provenance-constellation-two-modes-identical-geometry-payload-zero-scientific-hash-uncertainty-style-inputs-science-linear-zero-bloom-grade-static-cinematic-fixed-seed-no-writeback-runtime-baseline",
  ],
  boundaryStatement:
    "Science and Cinematic V7.2 share identical proof geometry and immutable verification identity. Cinematic tokens and fixed-seed rhythm never depend on scientific values, hashes, uncertainty magnitudes, or mutate any science field.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v518",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v517IndependentVerification: "qualified",
    v518VisualProfile: "science-cinematic-v7r2-v518",
    v518ProvenanceNodes: "qualified-8",
    v518ProvenanceEdges: "qualified-7",
    v518ScientificPayloadStability: "qualified",
    v518GeometryStability: "qualified-identical-two-modes",
    v518NumericScientificStyleInputs: "qualified-0",
    v518HashDrivenStyles: "forbidden-0",
    v518UncertaintyDrivenStyles: "forbidden-0",
    v518ScienceDisplay: "linear-bloom-0-grade-0-static",
    v518CinematicSeed: "qualified-explicit",
    v518CinematicScienceWriteback: "forbidden",
    v518Lifecycle: "qualified-2-subscriptions-baseline",
    v518DetectorCalibration: "incomplete-0-of-6",
    v518DetectorAuthority: "unavailable",
    v518ScienceRaster: "unavailable",
    v518BrowserQualification: "not-run",
    v518VisualMatrixQualification: "not-run",
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
      visualAuditSha256: audit.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      profileId: audit.encoding.profileId,
      nodes: audit.encoding.nodeCount,
      edges: audit.encoding.edgeCount,
      geometryStable: audit.encoding.geometryStable,
      numericScientificStyleInputs: 0,
      hashDrivenStyles: 0,
      scienceBloom: 0,
      scienceGrade: 0,
      finalResourceStatus: audit.runtime.finalResourceStatus,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
