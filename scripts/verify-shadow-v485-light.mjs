import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
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
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactPath = "dist/science/kerr-photon-metrology-cockpit-v485/cockpit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v485-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v485.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v484-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v484.json");
const upstreamPaths = [
  "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  "dist/science/kerr-spectral-identifiability-v484/identifiability.json",
];
const upstream = upstreamPaths.map(read);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(artifact.stages) !== artifact.stageChainSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v485-kerr-photon-metrology-cockpit-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v485-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v485" ||
  artifact.stages.length !== 6 ||
  artifact.stages.some(
    (stage, index) =>
      stage.artifactSha256 !== upstream[index].artifactSha256 ||
      stage.fileSha256 !== fileSha(upstreamPaths[index]) ||
      !stage.detailEndpoint.startsWith("/api/atlas/relativity-evidence/") ||
      !stage.downloadHref.startsWith(`${stage.detailEndpoint}?download=`) ||
      stage.browserQualification !== "not-run" ||
      stage.scienceWritebackAllowed !== false,
  ) ||
  artifact.audit.summaryMatrixElementCount !== 0 ||
  artifact.audit.summaryProjectionRecordCount !== 0 ||
  artifact.audit.summaryExecutionRecordCount !== 0 ||
  artifact.audit.presentationScientificFieldCount !== 0 ||
  artifact.audit.stageMetricMutationCount !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.imageProducts !== 0 ||
  artifact.audit.stageChainQualified !== true ||
  artifact.audit.boundedSummaryQualified !== true ||
  artifact.audit.detailArtifactsIsolated !== true ||
  artifact.presentation.stageMetricsSharedAcrossViews !== true ||
  artifact.presentation.stageMetricMutationAllowed !== false ||
  artifact.presentation.scienceWritebackAllowed !== false ||
  artifact.presentation.cinematicScienceWritebackAllowed !== false ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.cockpitSummaryAuthorityGranted !== true ||
  artifact.boundary.detailedArtifactsAutoLoaded !== false ||
  artifact.boundary.physicalDetectorObservableAuthorityGranted !== false ||
  artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  artifact.boundary.observedSpectrumAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v485-fail-closed-validation");
}

const serializedArtifact = JSON.stringify(artifact);
if (
  serializedArtifact.includes("moorePenrosePseudoInverse") ||
  serializedArtifact.includes("covarianceUpperBound") ||
  serializedArtifact.includes('"projections"') ||
  serializedArtifact.includes('"executions"')
) {
  throw new Error("v485-large-detail-leak");
}

if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v484EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v484PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v485ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v485StageChainSha256 !== artifact.stageChainSha256 ||
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
  throw new Error("v485-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v485-source-manifest:${entry.path}`);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v485-source-manifest-canonical");

const runtimeFiles = [
  "app/lib/kerrPhotonMetrologyCockpitV485.ts",
  "app/lib/kerrPhotonMetrologyCockpitServerV485.ts",
  "app/lib/kerrPhotonMetrologyCockpitClientV485.ts",
  "app/components/KerrPhotonMetrologyCockpitV485.tsx",
  "app/api/atlas/relativity-evidence/v485/photon-metrology-cockpit/route.ts",
  "app/local-shadow-v485/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("六站证据航线，一套不越权的光子计量舱") ||
  !runtimeSource.includes("矩阵、投影和完整科学数组留在白名单 artifact") ||
  !runtimeSource.includes('data-atlas-v485-detail-autoload="false"') ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v485-runtime-boundary");
}
const forbidden = readdirSync(resolve(root, "dist/science/kerr-photon-metrology-cockpit-v485")).filter(
  (name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v485-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v485-transient-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v485-low-memory-photon-metrology-cockpit-fail-closed",
      artifactSha256: artifact.artifactSha256,
      stageChainSha256: artifact.stageChainSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 6,
      stageMetrics: 12,
      summaryMatrixElements: 0,
      summaryProjectionRecords: 0,
      summaryExecutionRecords: 0,
      detailEndpoints: 6,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
