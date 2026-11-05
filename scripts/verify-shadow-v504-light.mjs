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

const preflightPath =
  "dist/science/kerr-measured-calibration-preflight-v504/preflight.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v504-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v504.json";
const preflight = read(preflightPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v503-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v503.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  preflight.version !== "v504-kerr-measured-calibration-preflight-v1" ||
  evidence.version !== "orbit-atlas-shadow-v504-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v504" ||
  sha(preflight) !== preflight.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v503EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v503PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v504PreflightArtifactSha256 !== preflight.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v504-canonical-chain");
}

if (
  preflight.status !== "blocked-inputs-missing" ||
  preflight.observation.stagingRootPresent !== false ||
  preflight.observation.stagingRootSafe !== true ||
  preflight.observation.files.length !== 6 ||
  preflight.observation.readyFileCount !== 0 ||
  preflight.observation.missingFileIds.length !== 6 ||
  preflight.observation.invalidFileIds.length !== 0 ||
  preflight.observation.bytesRead !== 0 ||
  preflight.observation.candidateReadyForIndependentValidation !== false ||
  preflight.decision.measuredDetectorAuthorityGranted !== false ||
  preflight.decision.runtimeProjectionAllowed !== false ||
  preflight.decision.scienceRasterAllowed !== false ||
  preflight.boundary.attemptConsumed !== false ||
  preflight.boundary.fileContentsPersistedInArtifact !== false ||
  preflight.boundary.stagingWritePerformed !== false ||
  preflight.boundary.networkAttempted !== false ||
  preflight.boundary.automaticRetryApplied !== false
) {
  throw new Error("v504-preflight-boundary");
}

const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx");
const surface = text("app/components/KerrMeasuredCalibrationPreflightV504.tsx");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
const cli = text("scripts/atlas.mjs");
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
  "candidate-preflight",
];
if (
  detailIds.some((id) => !wrapper.includes(`"${id}"`)) ||
  !wrapper.includes('useState<KerrPhotonMetrologyDetailSurfaceV504>("none")') ||
  !wrapper.includes('data-atlas-v504-static-network-budget="0"') ||
  !wrapper.includes('data-atlas-v504-preflight-ready="false"') ||
  wrapper.includes("/api/atlas/relativity-evidence/") ||
  !surface.includes("Load latest preflight") ||
  surface.includes("useEffect") ||
  !surface.includes("先验收文件，再讨论探测器响应") ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV504"') ||
  !workbench.includes(
    '<KerrPhotonMetrologyObservatoryIntentV504 active={tab === "campaign-evidence"} />',
  ) ||
  !cli.includes('action === "detector-calibration-v504-preflight"') ||
  [wrapper, surface].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v504-runtime-boundary");
}

if (
  evidence.command.automaticInvocationAllowed !== false ||
  evidence.command.networkAllowed !== false ||
  evidence.command.stagingWriteAllowed !== false ||
  evidence.observatory.staticAuthorityStageCount !== 8 ||
  evidence.observatory.detailComponentCatalogSize !== 10 ||
  evidence.observatory.concurrentDetailSurfaceCount !== 1 ||
  evidence.preflight.bytesRead !== 0 ||
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
  throw new Error("v504-continuity-boundary");
}

for (const entry of preflight.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v504-preflight-source-manifest:${entry.path}`);
  }
}
if (sha(preflight.sourceManifest) !== preflight.sourceSha256) {
  throw new Error("v504-preflight-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v504-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v504-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v504-low-memory-explicit-read-only-calibration-preflight",
      preflightArtifactSha256: preflight.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      files: "0/6",
      bytesRead: 0,
      stagingWrite: false,
      networkAttempted: false,
      authorityGranted: false,
      scienceRaster: "unavailable",
      observatoryDetails: 10,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
