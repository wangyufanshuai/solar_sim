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

const artifactPath = "dist/science/kerr-spectral-identifiability-v484/identifiability.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v484-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v484.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v483-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v483.json");
const v483 = read("dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json");
const v482 = read("dist/science/kerr-spectral-landmark-covariance-v482/covariance.json");
const v481 = read("dist/science/kerr-spectral-landmark-transport-v481/landmarks.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(artifact.rows) !== artifact.payloadSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v484-kerr-spectral-identifiability-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v484-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v484" ||
  artifact.rows.length !== 4 ||
  artifact.rows.some(
    (row) =>
      row.identifiableDimension !== 1 ||
      row.unidentifiableDimension !== 4 ||
      row.determinant !== 0 ||
      row.fullConditionNumber !== "infinite-singular" ||
      row.nonzeroSpectrumConditionNumber !== 1 ||
      row.audit.algebraicPseudoInverseOnly !== true ||
      row.audit.inverseNoiseCovarianceInterpretationAllowed !== false,
  ) ||
  artifact.sourceArtifactSha256.v483 !== v483.artifactSha256 ||
  artifact.sourceArtifactSha256.v482 !== v482.artifactSha256 ||
  artifact.sourceArtifactSha256.v481 !== v481.artifactSha256 ||
  artifact.audit.identifiableDimensionCount !== 4 ||
  artifact.audit.unidentifiableDimensionCount !== 16 ||
  artifact.audit.penroseConditionAuditCount !== 16 ||
  artifact.audit.singularMatrixCount !== 4 ||
  artifact.audit.maximumPenroseRelativeResidual > 1e-12 ||
  artifact.audit.maximumPenroseSymmetryAbsoluteResidual > 1e-12 ||
  artifact.audit.maximumProjectorIdempotenceRelativeResidual > 1e-12 ||
  artifact.audit.maximumProjectorComplementAbsoluteResidual > 1e-12 ||
  artifact.audit.maximumProjectorOrthogonalityAbsoluteResidual > 1e-12 ||
  artifact.audit.maximumProjectorTraceResidual > 1e-12 ||
  artifact.audit.fisherInformationQualified !== false ||
  artifact.audit.likelihoodQualified !== false ||
  artifact.audit.detectorObservableRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.identifiabilityMutationCount !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.presentation.sharedIdentifiabilityPayloadIdentity !== true ||
  artifact.presentation.scienceWritebackAllowed !== false ||
  artifact.presentation.cinematicScienceWritebackAllowed !== false ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.algebraicIdentifiabilityAuthorityGranted !== true ||
  artifact.boundary.algebraicPseudoInverseAuthorityGranted !== true ||
  artifact.boundary.inverseNoiseCovarianceAuthorityGranted !== false ||
  artifact.boundary.fisherInformationAuthorityGranted !== false ||
  artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  artifact.boundary.parameterPosteriorAuthorityGranted !== false ||
  artifact.boundary.physicalDetectorObservableAuthorityGranted !== false ||
  artifact.boundary.observedSpectrumAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v484-fail-closed-validation");
}

if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v483EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v483PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v484ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v484PayloadSha256 !== artifact.payloadSha256 ||
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
  throw new Error("v484-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v484-source-manifest:${entry.path}`);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v484-source-manifest-canonical");

const runtimeFiles = [
  "app/lib/kerrSpectralIdentifiabilityV484.ts",
  "app/lib/kerrSpectralIdentifiabilityServerV484.ts",
  "app/lib/kerrSpectralIdentifiabilityClientV484.ts",
  "app/components/KerrSpectralIdentifiabilityViewerV484.tsx",
  "app/api/atlas/relativity-evidence/v484/spectral-identifiability/route.ts",
  "app/local-shadow-v484/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("可辨识的只有一维，剩余四维必须承认沉默") ||
  !runtimeSource.includes("algebraic pseudoinverse ≠ inverse-noise covariance") ||
  !runtimeSource.includes("Fisher information") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v484-runtime-boundary");
}
const forbidden = readdirSync(resolve(root, "dist/science/kerr-spectral-identifiability-v484")).filter(
  (name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v484-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v484-transient-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v484-low-memory-algebraic-identifiability-fail-closed",
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      pseudoInverseMatrices: 4,
      identifiableDimensions: 4,
      unidentifiableDimensions: 16,
      penroseAudits: 16,
      fisherInformationAuthority: false,
      likelihoodAuthority: false,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
