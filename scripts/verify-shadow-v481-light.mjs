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

const artifactPath = "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v481-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v481.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v480-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v480.json");
const v478 = read("dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json");
const v479 = read("dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json");
const v480 = read("dist/science/kerr-photon-evidence-workbench-v480/workbench.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const features = artifact.rows.flatMap((row) => row.features);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(artifact.rows) !== artifact.payloadSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v481-kerr-spectral-landmark-transport-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v481-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v481" ||
  artifact.rows.length !== 4 ||
  features.length !== 20 ||
  artifact.rows.some((row) => row.features.length !== 5 || row.sourceNormalizedFrequencyRowSha256 !== row.sourceProvenanceRowSha256) ||
  features.some(
    (feature) =>
      !Number.isFinite(feature.observerCoordinate) ||
      feature.observerCoordinate <= 0 ||
      feature.observerCoordinateInterval.lower > feature.observerCoordinate ||
      feature.observerCoordinateInterval.upper < feature.observerCoordinate ||
      feature.applicability !== "dimensionless-feature-position-only",
  ) ||
  artifact.sourceArtifactSha256.v478 !== v478.artifactSha256 ||
  artifact.sourceArtifactSha256.v479 !== v479.artifactSha256 ||
  artifact.sourceArtifactSha256.v480 !== v480.artifactSha256 ||
  artifact.audit.landmarkCount !== 20 ||
  artifact.audit.pairwiseRatioAuditCount !== 40 ||
  artifact.audit.adjacentSpacingAuditCount !== 16 ||
  artifact.audit.intervalContainmentCount !== 20 ||
  artifact.audit.maximumDirectOracleRelativeResidual > 2e-15 ||
  artifact.audit.maximumInverseRoundTripRelativeResidual > 2e-15 ||
  artifact.audit.maximumPairwiseRatioRelativeResidual > 2e-15 ||
  artifact.audit.maximumAdjacentSpacingRelativeResidual > 2e-15 ||
  artifact.audit.physicalLineRows !== 0 ||
  artifact.audit.absoluteFrequencyRows !== 0 ||
  artifact.audit.physicalBandpassRows !== 0 ||
  artifact.audit.observedIntensityRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.imageProducts !== 0 ||
  artifact.audit.landmarkMutationCount !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.presentation.sharedLandmarkPayloadIdentity !== true ||
  artifact.presentation.scienceWritebackAllowed !== false ||
  artifact.presentation.cinematicScienceWritebackAllowed !== false ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.dimensionlessLandmarkPositionAuthorityGranted !== true ||
  artifact.boundary.physicalLineIdentityAuthorityGranted !== false ||
  artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
  artifact.boundary.lineWidthAuthorityGranted !== false ||
  artifact.boundary.lineAmplitudeAuthorityGranted !== false ||
  artifact.boundary.equivalentWidthAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.observedSpectrumAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v481-fail-closed-validation");
}

if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v480EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v480PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v481ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v481PayloadSha256 !== artifact.payloadSha256 ||
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
  throw new Error("v481-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v481-source-manifest:${entry.path}`);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v481-source-manifest-canonical");
}

const runtimeFiles = [
  "app/lib/kerrSpectralLandmarkTransportV481.ts",
  "app/lib/kerrSpectralLandmarkServerV481.ts",
  "app/lib/kerrSpectralLandmarkClientV481.ts",
  "app/components/KerrSpectralLandmarkViewerV481.tsx",
  "app/api/atlas/relativity-evidence/v481/spectral-landmarks/route.ts",
  "app/local-shadow-v481/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("xₒ = g·xₑ") ||
  !runtimeSource.includes("physical line identity") ||
  !runtimeSource.includes("observed spectrum") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v481-runtime-boundary");
}

const forbidden = readdirSync(resolve(root, "dist/science/kerr-spectral-landmark-transport-v481")).filter(
  (name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v481-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v481-transient-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v481-low-memory-spectral-landmark-position-only-fail-closed",
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rays: 4,
      landmarks: 20,
      pairwiseRatioAudits: 40,
      adjacentSpacingAudits: 16,
      physicalLineRows: 0,
      observedIntensityRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
