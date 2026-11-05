import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v504-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v504.json",
  hud: "dist/science/atlas-calibration-hud-v505/hud-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v505-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v505.json",
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
const hud = read(paths.hud);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v504-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v504" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  hud.version !== "v505-atlas-calibration-hud-audit-v1" ||
  sha(hud) !== hud.artifactSha256 ||
  hud.profile.allTokensConsumed !== true ||
  hud.profile.tokenCount !== 12 ||
  hud.payloadBoundary.sharedPayloadReferencePreserved !== true ||
  hud.payloadBoundary.scientificFieldMutationAllowed !== false ||
  hud.runtime.mojibakeMatches !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v505-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.hud,
  paths.dense,
  paths.formal,
  "app/lib/atlasCalibrationHudProfileV505.ts",
  "app/lib/atlasCalibrationHudProfileV505.test.ts",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/AtlasCalibrationHudRuntimeV505.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-atlas-calibration-hud-v505.ts",
  "scripts/build-shadow-candidate-v505.mjs",
  "scripts/build-shadow-v505.mjs",
  "scripts/verify-shadow-v505-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v505-science-cinematic-calibration-hud-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v505-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v504EvidenceSha256: previousEvidence.evidenceSha256,
    v504PointerSha256: previousPointer.pointerSha256,
    v505HudArtifactSha256: hud.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  visualProfile: hud.profile,
  payloadBoundary: hud.payloadBoundary,
  runtime: {
    ...hud.runtime,
    observatoryDetailCatalogSize: 10,
    concurrentDetailSurfaceCount: 1,
    staticNetworkRequestBudget: 0,
  },
  qualification: hud.qualification,
  scienceBoundary: {
    measuredCalibrationFiles: "0/6",
    detectorAuthority: false,
    detectorResponse: "unavailable",
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
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundaryStatement:
    "v505-two-real-calibration-hud-consumers-twelve-stable-tokens-shared-immutable-science-payload-zero-field-random-request-canvas-scene-physics-or-default-mutation",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v505",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v503ReadinessProtocol: "qualified-fail-closed",
    v504ReadOnlyPreflight: "qualified",
    v505StableHudProfile: "qualified",
    v505HudTokenConsumption: "qualified-12-of-12",
    v505ScienceCinematicIsolation: "qualified",
    v505Utf8: "qualified-zero-mojibake",
    v505MeasuredCalibrationPack: "blocked-0-of-6",
    v505DetectorAuthority: "blocked",
    v505ScienceRaster: "unavailable",
    v505BrowserQualification: "not-run",
    v505VisualMatrixQualification: "not-run",
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
      hudArtifactSha256: hud.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      tokenConsumption: "12/12",
      consumerSurfaces: 2,
      scientificFieldMutation: false,
      mojibakeMatches: 0,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
