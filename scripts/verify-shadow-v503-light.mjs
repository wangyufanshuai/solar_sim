import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
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
const text = (path) => bytes(path).toString("utf8");
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

const artifactPath =
  "dist/science/kerr-measured-calibration-readiness-v503/readiness.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v503-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v503.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v502-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v502.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  artifact.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v503-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v503" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v502EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v502PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v503ReadinessArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v503-canonical-chain");
}

if (
  artifact.files.length !== 6 ||
  artifact.files.some(
    (file) =>
      file.status !== "missing" ||
      file.bytes !== 0 ||
      file.sha256 !== null ||
      file.requiredFields.length === 0 ||
      file.unitContract.length === 0,
  ) ||
  artifact.decision.admitted !== false ||
  artifact.decision.readyFileCount !== 0 ||
  artifact.decision.missingFileCount !== 6 ||
  artifact.decision.passedGateCount !== 3 ||
  artifact.decision.blockingGateCount !== 8 ||
  artifact.outputs.detectorResponse !== "unavailable" ||
  artifact.outputs.observedIntensity !== "unavailable" ||
  artifact.outputs.scienceRaster !== "unavailable" ||
  artifact.outputs.fitsProducts !== 0 ||
  artifact.outputs.pngProducts !== 0 ||
  artifact.boundary.stagingInspectedByV503 !== false ||
  artifact.boundary.networkAttempted !== false ||
  artifact.boundary.missingFilesGenerated !== false ||
  artifact.boundary.syntheticAuthorityAllowed !== false
) {
  throw new Error("v503-readiness-boundary");
}

const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV503.tsx");
const readinessSurface = text("app/components/KerrMeasuredCalibrationReadinessV503.tsx");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
const detailIds = [
  "coordinate-atlas",
  "contrast-lattice",
  "gauge-reconstruction",
  "edge-redundancy",
  "double-edge-identifiability",
  "minimum-cut",
  "connectivity-lattice",
  "detector-admission",
  "calibration-readiness",
];
if (
  !wrapper.includes('useState<KerrPhotonMetrologyDetailSurfaceV503>("none")') ||
  detailIds.some((id) => !wrapper.includes(`detail === "${id}"`)) ||
  !wrapper.includes('data-atlas-v503-static-network-budget="0"') ||
  !wrapper.includes('data-atlas-v503-calibration-pack-ready="false"') ||
  wrapper.includes("/api/atlas/relativity-evidence/") ||
  !readinessSurface.includes("Load readiness checklist") ||
  readinessSurface.includes("useEffect") ||
  !readinessSurface.includes("六个真实文件，才是探测器权威的起点") ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV503"') ||
  !workbench.includes(
    '<KerrPhotonMetrologyObservatoryIntentV503 active={tab === "campaign-evidence"} />',
  ) ||
  [wrapper, readinessSurface].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v503-runtime-boundary");
}

if (
  evidence.observatory.staticAuthorityStageCount !== 7 ||
  evidence.observatory.detailComponentCatalogSize !== 9 ||
  evidence.observatory.concurrentDetailSurfaceCount !== 1 ||
  evidence.observatory.staticNetworkRequestBudget !== 0 ||
  evidence.readiness.readyFileCount !== 0 ||
  evidence.scienceBoundary.sciencePixelRows !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.localShadowDefaultApplied !== false
) {
  throw new Error("v503-continuity-boundary");
}

for (const entry of artifact.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v503-artifact-source-manifest:${entry.path}`);
  }
}
if (sha(artifact.sourceManifest) !== artifact.sourceSha256) {
  throw new Error("v503-artifact-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v503-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v503-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v503-low-memory-measured-calibration-readiness",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      measuredFiles: "0/6",
      passedGates: 3,
      blockingGates: 8,
      stagingInspected: false,
      networkAttempted: false,
      detectorResponse: "unavailable",
      scienceRaster: "unavailable",
      observatoryDetails: 9,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
