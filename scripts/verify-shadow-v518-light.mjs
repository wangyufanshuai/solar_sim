import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v517-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v517.json",
  audit: "dist/science/kerr-provenance-constellation-v518/visual-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  evidence: "dist/science/orbit-atlas-shadow-v518-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v518.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
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
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
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

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const audit = read(paths.audit);
const detector = read(paths.detector);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v517-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v517" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  audit.version !== "v518-kerr-provenance-constellation-visual-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v518-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v518" ||
  sha(audit) !== audit.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  evidence.dependency.v518VisualAuditArtifactSha256 !== audit.artifactSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
) {
  throw new Error("v518-canonical-chain");
}

if (
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
  audit.cinematic.scientificWritebackAllowed !== false
) {
  throw new Error("v518-visual-boundary");
}

if (
  audit.runtime.automaticRequestCount !== 0 ||
  audit.runtime.explicitRequestCount !== 1 ||
  audit.runtime.subscriptionCount !== 2 ||
  audit.runtime.receiptNotifications !== 2 ||
  audit.runtime.modeNotifications !== 2 ||
  audit.runtime.finalMode !== "science" ||
  audit.runtime.finalResourceStatus !== "baseline" ||
  audit.boundary.defaultApplied !== false ||
  audit.boundary.canvasCreated !== false ||
  audit.boundary.sceneRevisionDelta !== 0
) {
  throw new Error("v518-runtime-boundary");
}

if (
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
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.formalProductPointerAdvanced !== false ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v518NumericScientificStyleInputs !== "qualified-0" ||
  pointer.capabilities.v518HashDrivenStyles !== "forbidden-0" ||
  pointer.capabilities.v518UncertaintyDrivenStyles !== "forbidden-0" ||
  pointer.capabilities.v518DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v518BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v518-continuity-boundary");
}

const component = text("app/components/KerrProvenanceConstellationV518.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV518.tsx");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v518-node-count="8"') ||
  !component.includes('data-atlas-v518-edge-count="7"') ||
  !component.includes('data-atlas-v518-numeric-scientific-style-input-count="0"') ||
  !component.includes('data-atlas-v518-hash-driven-style-count="0"') ||
  !component.includes('data-atlas-v518-scientific-mutation="false"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  !wrapper.includes('import("./KerrProvenanceConstellationV518")') ||
  wrapper.includes("fetch(") ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV518"') ||
  [component, wrapper, workbench].some((source) => source.includes("�"))
) {
  throw new Error("v518-source-boundary");
}

for (const [label, manifest, sourceSha256] of [
  ["audit", audit.sourceManifest, audit.sourceSha256],
  ["evidence", evidence.sourceManifest, evidence.sourceSha256],
]) {
  for (const entry of manifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v518-${label}-source-manifest:${entry.path}`);
    }
  }
  if (sha(manifest) !== sourceSha256) {
    throw new Error(`v518-${label}-source-manifest-canonical`);
  }
}

for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v518-empty:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v518-low-memory-science-cinematic-v7r2-provenance-constellation",
      visualAuditSha256: audit.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      profileId: audit.encoding.profileId,
      nodes: 8,
      edges: 7,
      modes: 2,
      geometryStable: true,
      numericScientificStyleInputs: 0,
      hashDrivenStyles: 0,
      uncertaintyDrivenStyles: 0,
      scienceBloom: 0,
      scienceGrade: 0,
      automaticRequests: 0,
      explicitRequests: 1,
      finalResourceStatus: "baseline",
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
