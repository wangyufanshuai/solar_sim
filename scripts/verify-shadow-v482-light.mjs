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

const artifactPath = "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v482-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v482.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v481-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v481.json");
const v481 = read("dist/science/kerr-spectral-landmark-transport-v481/landmarks.json");
const v480 = read("dist/science/kerr-photon-evidence-workbench-v480/workbench.json");
const v479 = read("dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(artifact.rows) !== artifact.payloadSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v482-kerr-spectral-landmark-correlated-uncertainty-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v482-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v482" ||
  artifact.rows.length !== 4 ||
  artifact.rows.some(
    (row) =>
      row.covarianceUpperBound.length !== 5 ||
      row.covarianceUpperBound.some((line) => line.length !== 5) ||
      row.audit.rankUpperBound !== 1 ||
      row.audit.zeroEigenvalueCount !== 4 ||
      row.audit.independentNoiseAssumed !== false ||
      row.audit.covarianceInterpretation !== "deterministic-upper-bound-not-1sigma" ||
      row.audit.correlationStructure !== "fully-correlated-common-redshift-scale",
  ) ||
  artifact.sourceArtifactSha256.v481 !== v481.artifactSha256 ||
  artifact.sourceArtifactSha256.v480 !== v480.artifactSha256 ||
  artifact.sourceArtifactSha256.v479 !== v479.artifactSha256 ||
  artifact.audit.covarianceElementCount !== 100 ||
  artifact.audit.rankOneMatrixCount !== 4 ||
  artifact.audit.symmetricMatrixCount !== 4 ||
  artifact.audit.positiveSemidefiniteMatrixCount !== 4 ||
  artifact.audit.zeroEigenvalueCount !== 16 ||
  artifact.audit.maximumScaleConsistencyRelativeResidual > 2e-15 ||
  artifact.audit.maximumDiagonalProjectionRelativeResidual > 2e-15 ||
  artifact.audit.maximumPrincipalEigenvalueTraceRelativeResidual > 2e-15 ||
  artifact.audit.deterministicUpperBoundQualified !== true ||
  artifact.audit.statisticalOneSigmaQualified !== false ||
  artifact.audit.physicalLineRows !== 0 ||
  artifact.audit.observedIntensityRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.covarianceMutationCount !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.presentation.sharedCovariancePayloadIdentity !== true ||
  artifact.presentation.scienceWritebackAllowed !== false ||
  artifact.presentation.cinematicScienceWritebackAllowed !== false ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.correlatedUncertaintyUpperBoundAuthorityGranted !== true ||
  artifact.boundary.statisticalCovarianceAuthorityGranted !== false ||
  artifact.boundary.independentNoiseAuthorityGranted !== false ||
  artifact.boundary.physicalLineIdentityAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.observedSpectrumAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v482-fail-closed-validation");
}

if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v481EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v481PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v482ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v482PayloadSha256 !== artifact.payloadSha256 ||
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
  throw new Error("v482-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v482-source-manifest:${entry.path}`);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v482-source-manifest-canonical");

const runtimeFiles = [
  "app/lib/kerrSpectralLandmarkCovarianceV482.ts",
  "app/lib/kerrSpectralLandmarkCovarianceServerV482.ts",
  "app/lib/kerrSpectralLandmarkCovarianceClientV482.ts",
  "app/components/KerrSpectralLandmarkCovarianceViewerV482.tsx",
  "app/api/atlas/relativity-evidence/v482/spectral-landmark-covariance/route.ts",
  "app/local-shadow-v482/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("rank-1 外积上界") ||
  !runtimeSource.includes("不是五个独立噪声的 1σ covariance") ||
  !runtimeSource.includes("covariance matrix") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v482-runtime-boundary");
}
const forbidden = readdirSync(resolve(root, "dist/science/kerr-spectral-landmark-covariance-v482")).filter(
  (name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v482-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v482-transient-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v482-low-memory-correlated-uncertainty-upper-bound-fail-closed",
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      matrices: 4,
      elements: 100,
      rankOneMatrices: 4,
      zeroEigenvalues: 16,
      statisticalOneSigmaAuthority: false,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
