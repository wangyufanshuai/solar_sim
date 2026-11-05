import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v509-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v509.json",
  envelope: "dist/science/kerr-detector-provenance-envelope-v510/envelope-audit.json",
  evidence: "dist/science/orbit-atlas-shadow-v510-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v510.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
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
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const envelope = read(paths.envelope);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v509-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v509" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  envelope.version !== "v510-kerr-detector-provenance-envelope-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v510-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v510" ||
  sha(envelope) !== envelope.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  evidence.dependency.v509EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v509PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v510EnvelopeArtifactSha256 !== envelope.artifactSha256 ||
  evidence.dependency.v510EnvelopeCanonicalSha256 !== envelope.envelope.canonicalSha256 ||
  evidence.dependency.v510StageChainSha256 !== envelope.envelope.chain.chainSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
) {
  throw new Error("v510-canonical-chain");
}
if (
  envelope.status !== "portable-provenance-qualified-detector-authority-blocked" ||
  envelope.replay.stageCount !== 3 ||
  envelope.replay.subscriptionCount !== 4 ||
  envelope.replay.automaticRequestCount !== 0 ||
  envelope.replay.explicitRequestCount !== 3 ||
  envelope.replay.explicitRequestDistribution !== "1/1/1" ||
  envelope.replay.exportFormatCount !== 2 ||
  envelope.replay.peakObjectUrlCount !== 2 ||
  envelope.replay.finalResourceStatus !== "baseline" ||
  envelope.envelope.chain.readyStageCount !== 3 ||
  envelope.envelope.chain.requestedStageCount !== 3 ||
  envelope.envelope.authority.measuredCalibrationFiles !== "0/6" ||
  envelope.envelope.authority.measuredDetectorAuthorityGranted !== false ||
  envelope.envelope.authority.detectorResponseAvailable !== false ||
  envelope.envelope.authority.observedCountsAvailable !== false ||
  envelope.envelope.authority.observedIntensityAvailable !== false ||
  envelope.envelope.authority.scienceRasterAvailable !== false ||
  envelope.envelope.authority.denseCampaignStatus !== "incomplete-0-of-49" ||
  envelope.exports.csvRowCount !== 3 ||
  envelope.exports.objectUrlsReleased !== true ||
  envelope.exports.duplicateReleaseIdempotent !== true ||
  envelope.boundary.scientificFieldMutation !== false ||
  envelope.boundary.canvasCreated !== false ||
  envelope.boundary.sceneRevisionDelta !== 0 ||
  envelope.boundary.formalProductPointer !== "v263" ||
  envelope.boundary.formalDefaultKernel !== "legacy-eih-1pn"
) {
  throw new Error("v510-envelope-boundary");
}
if (
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
  pointer.capabilities.v510MeasuredCalibrationPack !== "blocked-0-of-6" ||
  pointer.capabilities.v510DetectorAuthority !== "blocked" ||
  pointer.capabilities.v510ScienceRaster !== "unavailable" ||
  pointer.capabilities.v510BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v510-continuity-boundary");
}

const provenanceSource = text("app/components/KerrDetectorProvenanceEnvelopeV510.tsx");
const wrapperSource = text("app/components/KerrPhotonMetrologyObservatoryIntentV510.tsx");
const workbenchSource = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !provenanceSource.includes('data-atlas-v510-automatic-request-count="0"') ||
  !provenanceSource.includes('data-atlas-v510-subscription-count="4"') ||
  !provenanceSource.includes('data-atlas-v510-export-format-count="2"') ||
  !provenanceSource.includes('data-atlas-v510-detector-authority="false"') ||
  !provenanceSource.includes('data-atlas-v510-science-raster="false"') ||
  provenanceSource.includes("loadKerrTopologyDetectorAdmissionSummaryV501") ||
  provenanceSource.includes("loadAtlasCalibrationReadinessV508") ||
  provenanceSource.includes("loadAtlasCalibrationPreflightV508") ||
  !wrapperSource.includes('data-atlas-v510-detail-catalog-size') ||
  !wrapperSource.includes('data-atlas-v510-static-network-budget="0"') ||
  !wrapperSource.includes('lazy(() => import("./KerrDetectorProvenanceEnvelopeV510"))') ||
  wrapperSource.includes("fetch(") ||
  !workbenchSource.includes('from "./KerrPhotonMetrologyObservatoryIntentV510"') ||
  [provenanceSource, wrapperSource, workbenchSource].some((source) => source.includes("�"))
) {
  throw new Error("v510-runtime-boundary");
}

for (const entry of envelope.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v510-envelope-source-manifest:${entry.path}`);
  }
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v510-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(envelope.sourceManifest) !== envelope.sourceSha256) {
  throw new Error("v510-envelope-source-manifest-canonical");
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v510-evidence-source-manifest-canonical");
}
for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v510-empty-artifact:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v510-low-memory-portable-detector-provenance",
      envelopeArtifactSha256: envelope.artifactSha256,
      envelopeCanonicalSha256: envelope.envelope.canonicalSha256,
      chainSha256: envelope.envelope.chain.chainSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 3,
      subscriptions: 4,
      exports: "json/csv",
      automaticRequests: 0,
      explicitRequests: "1/1/1",
      finalResourceStatus: "baseline",
      detectorAuthority: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
