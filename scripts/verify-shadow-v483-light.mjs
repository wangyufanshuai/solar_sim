import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "rowSha256",
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
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactPath = "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v483-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v483.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v482-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v482.json");
const v482 = read("dist/science/kerr-spectral-landmark-covariance-v482/covariance.json");
const v481 = read("dist/science/kerr-spectral-landmark-transport-v481/landmarks.json");
const v480 = read("dist/science/kerr-photon-evidence-workbench-v480/workbench.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const projections = artifact.rows.flatMap((row) => row.projections);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha({ basis: artifact.basis, rows: artifact.rows }) !== artifact.payloadSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v483-kerr-spectral-sensitivity-modes-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v483-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v483" ||
  artifact.basis.modes.length !== 5 ||
  artifact.rows.length !== 4 ||
  projections.length !== 20 ||
  artifact.basis.audit.maximumOrthonormalityAbsoluteResidual > 1e-14 ||
  artifact.basis.audit.maximumCompletenessAbsoluteResidual > 1e-14 ||
  artifact.basis.audit.maximumNullspaceEmitterDotAbsoluteResidual > 1e-14 ||
  artifact.audit.commonScaleProjectionCount !== 4 ||
  artifact.audit.nullspaceProjectionCount !== 16 ||
  artifact.audit.maximumProjectionAbsoluteResidual > 1e-14 ||
  artifact.audit.maximumVarianceOracleRelativeResidual > 1e-14 ||
  artifact.audit.maximumNullspaceCoordinateAbsoluteResidual > 1e-14 ||
  artifact.audit.maximumNegativeRoundoffAbsoluteValue > 1e-40 ||
  artifact.rows.some((row) => row.audit.nullspaceZeroDoesNotMeanMeasurementExact !== true) ||
  projections.some(
    (projection, index) =>
      projection.kind !== (index % 5 === 0 ? "common-scale-sensitive" : "common-scale-nullspace") ||
      (projection.directRoundoffClamped &&
        (projection.varianceUpperBoundDirectRaw >= 0 || projection.varianceUpperBoundDirect !== 0)),
  ) ||
  artifact.sourceArtifactSha256.v482 !== v482.artifactSha256 ||
  artifact.sourceArtifactSha256.v481 !== v481.artifactSha256 ||
  artifact.sourceArtifactSha256.v480 !== v480.artifactSha256 ||
  artifact.audit.detectorObservableRows !== 0 ||
  artifact.audit.observedIntensityRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.sensitivityMutationCount !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.presentation.sharedSensitivityPayloadIdentity !== true ||
  artifact.presentation.scienceWritebackAllowed !== false ||
  artifact.presentation.cinematicScienceWritebackAllowed !== false ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.dimensionlessSensitivityModeAuthorityGranted !== true ||
  artifact.boundary.physicalDetectorObservableAuthorityGranted !== false ||
  artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  artifact.boundary.independentNoiseAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.observedSpectrumAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v483-fail-closed-validation");
}

if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v482EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v482PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v483ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v483PayloadSha256 !== artifact.payloadSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath) ||
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
  throw new Error("v483-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v483-source-manifest:${entry.path}`);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v483-source-manifest-canonical");

const runtimeFiles = [
  "app/lib/kerrSpectralSensitivityModesV483.ts",
  "app/lib/kerrSpectralSensitivityServerV483.ts",
  "app/lib/kerrSpectralSensitivityClientV483.ts",
  "app/components/KerrSpectralSensitivityViewerV483.tsx",
  "app/api/atlas/relativity-evidence/v483/spectral-sensitivity-modes/route.ts",
  "app/local-shadow-v483/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("一条敏感轴，四条沉默方向") ||
  !runtimeSource.includes("zero under model ≠ exact measurement") ||
  !runtimeSource.includes("detector weight vector") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v483-runtime-boundary");
}
const forbidden = readdirSync(resolve(root, "dist/science/kerr-spectral-sensitivity-modes-v483")).filter(
  (name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v483-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v483-transient-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v483-low-memory-spectral-sensitivity-modes-fail-closed",
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      modes: 5,
      projections: 20,
      commonScaleProjections: 4,
      nullspaceProjections: 16,
      directRoundoffClampCount: artifact.audit.directRoundoffClampCount,
      detectorObservableRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
