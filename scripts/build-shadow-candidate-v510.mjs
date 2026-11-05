import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v509-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v509.json",
  envelope: "dist/science/kerr-detector-provenance-envelope-v510/envelope-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v510-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v510.json",
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
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const envelopeAudit = read(paths.envelope);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v509-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v509" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  envelopeAudit.version !== "v510-kerr-detector-provenance-envelope-audit-v1" ||
  sha(envelopeAudit) !== envelopeAudit.artifactSha256 ||
  envelopeAudit.status !== "portable-provenance-qualified-detector-authority-blocked" ||
  envelopeAudit.replay.stageCount !== 3 ||
  envelopeAudit.replay.subscriptionCount !== 4 ||
  envelopeAudit.replay.automaticRequestCount !== 0 ||
  envelopeAudit.replay.explicitRequestDistribution !== "1/1/1" ||
  envelopeAudit.replay.peakObjectUrlCount !== 2 ||
  envelopeAudit.replay.finalResourceStatus !== "baseline" ||
  envelopeAudit.envelope.authority.measuredDetectorAuthorityGranted !== false ||
  envelopeAudit.envelope.authority.scienceRasterAvailable !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v510-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.envelope,
  paths.dense,
  paths.formal,
  "app/lib/kerrDetectorProvenanceEnvelopeV510.ts",
  "app/lib/kerrDetectorProvenanceEnvelopeV510.test.ts",
  "app/components/KerrDetectorProvenanceEnvelopeV510.tsx",
  "app/components/KerrDetectorProvenanceEnvelopeV510.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV510.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV510.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV510.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV510.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/kerrTopologyDetectorAdmissionClientV501.ts",
  "app/lib/atlasCalibrationEvidenceClientV508.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-detector-provenance-envelope-v510.ts",
  "scripts/build-shadow-candidate-v510.mjs",
  "scripts/build-shadow-v510.mjs",
  "scripts/verify-shadow-v510-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v510-portable-detector-provenance-qualified-detector-authority-blocked-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v510-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v509EvidenceSha256: previousEvidence.evidenceSha256,
    v509PointerSha256: previousPointer.pointerSha256,
    v510EnvelopeArtifactSha256: envelopeAudit.artifactSha256,
    v510EnvelopeCanonicalSha256: envelopeAudit.envelope.canonicalSha256,
    v510StageChainSha256: envelopeAudit.envelope.chain.chainSha256,
    v314StateSha256: dense.stateSha256,
  },
  replay: envelopeAudit.replay,
  envelope: envelopeAudit.envelope,
  exports: envelopeAudit.exports,
  scienceBoundary: envelopeAudit.boundary,
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
  qualification: [
    "v510-three-stage-sanitized-portable-provenance-json-csv-canonical-chain-two-idempotently-released-object-urls-four-subscriptions-returned-to-baseline-zero-automatic-requests-zero-detector-authority-science-raster-or-scientific-field-mutation",
  ],
  boundaryStatement:
    "Portable provenance qualified; measured detector authority remains blocked at 0/6, response/counts/intensity/science raster remain unavailable, dense campaign remains 0/49, and browser qualification remains not-run.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v510",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v509DetectorTimeline: "qualified-3-stages",
    v510PortableProvenance: "qualified",
    v510StageChain: "qualified-3-of-3",
    v510ObservatoryDetails: "qualified-12-exclusive",
    v510AutomaticRequests: "qualified-0",
    v510ExplicitRequests: "qualified-1-1-1",
    v510ExportFormats: "qualified-json-csv",
    v510ObjectUrlLifecycle: "qualified-2-returned-to-baseline",
    v510MeasuredCalibrationPack: "blocked-0-of-6",
    v510DetectorAuthority: "blocked",
    v510ScienceRaster: "unavailable",
    v510BrowserQualification: "not-run",
    v510VisualMatrixQualification: "not-run",
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
      envelopeArtifactSha256: envelopeAudit.artifactSha256,
      envelopeCanonicalSha256: envelopeAudit.envelope.canonicalSha256,
      chainSha256: envelopeAudit.envelope.chain.chainSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 3,
      exports: "json/csv",
      automaticRequests: 0,
      explicitRequests: "1/1/1",
      finalResourceStatus: envelopeAudit.replay.finalResourceStatus,
      detectorAuthority: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
