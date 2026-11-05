import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v478-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v478.json",
  viewer: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  v478: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v479-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v479.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "provenanceSha256",
  "frequencyBufferSha256",
  "payloadSha256",
  "rowSha256",
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
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const viewer = read(paths.viewer);
const v475 = read(paths.v475);
const v478 = read(paths.v478);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v478-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v478" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  viewer.version !== "v479-kerr-frequency-provenance-viewer-artifact-v1" ||
  viewer.status !== "frequency-provenance-viewer-qualified-bandpass-blocked-browser-pending" ||
  canonicalSha(viewer) !== viewer.artifactSha256 ||
  viewer.frequencyBuffer.length !== 4 ||
  viewer.provenance.length !== 4 ||
  viewer.frequencyBufferSha256 !== v478.payloadSha256 ||
  viewer.audit.presentationScientificFieldCount !== 0 ||
  viewer.audit.frequencyBufferMutationCount !== 0 ||
  viewer.audit.scienceWritebackCount !== 0 ||
  viewer.audit.sourceChainComplete !== true ||
  viewer.boundary.absoluteFrequencyAuthorityGranted !== false ||
  viewer.boundary.physicalBandpassAuthorityGranted !== false ||
  viewer.boundary.sciencePixelRows !== 0 ||
  viewer.lifecycle.allResourcesAtBaseline !== true ||
  v475.audit.scienceBufferCanonicalIdentityShared !== true ||
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
  throw new Error("v479-evidence-boundary");
}

const sourcePaths = [
  paths.viewer,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v475,
  paths.v478,
  paths.dense,
  "app/lib/kerrFrequencyProvenanceViewerV479.ts",
  "app/lib/kerrFrequencyProvenanceServerV479.ts",
  "app/lib/kerrFrequencyProvenanceClientV479.ts",
  "app/components/KerrFrequencyProvenanceViewerV479.tsx",
  "app/api/atlas/relativity-evidence/v479/frequency-provenance-viewer/route.ts",
  "app/local-shadow-v479/page.tsx",
  "scripts/build-kerr-frequency-provenance-viewer-v479.ts",
  "scripts/build-shadow-candidate-v479.mjs",
  "scripts/verify-shadow-v479-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v479-frequency-provenance-viewer-qualified-bandpass-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v479-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v478EvidenceSha256: previousEvidence.evidenceSha256,
    v478EvidenceFileSha256: fileSha(paths.previousEvidence),
    v478PointerSha256: previousPointer.pointerSha256,
    v478PointerFileSha256: fileSha(paths.previousPointer),
    v479ArtifactSha256: viewer.artifactSha256,
    v479FrequencyBufferSha256: viewer.frequencyBufferSha256,
    v479ProvenanceSha256: viewer.provenanceSha256,
    v479ArtifactFileSha256: fileSha(paths.viewer),
    v314StateSha256: dense.stateSha256,
  },
  sourceChain: viewer.sourceChain,
  viewerBoundary: {
    frequencyBufferRows: 4,
    frequencyBufferSamples: 20,
    provenanceRows: 4,
    provenanceSamples: 20,
    sharedFrequencyBufferCanonicalIdentity: true,
    scienceViewFrequencyBufferSha256: viewer.frequencyBufferSha256,
    cinematicViewFrequencyBufferSha256: viewer.frequencyBufferSha256,
    presentationScientificFieldCount: 0,
    frequencyBufferMutationCount: 0,
    scienceWritebackCount: 0,
    scienceEffectsZero: true,
    cinematicSeedDeterministic: true,
  },
  applicability: {
    normalizedFrequencyAuthority: "qualified-20-samples",
    absoluteFrequencyAuthority: "blocked",
    physicalBandpassAuthority: "blocked",
    bandIntegratedRadianceAuthority: "blocked",
    sciencePixels: 0,
    images: 0,
    unavailableIsNotZero: true,
  },
  audit: viewer.audit,
  lifecycle: { ...viewer.lifecycle, canvasCreatedByV479: false, sceneRevisionMutationAllowed: false },
  boundary: viewer.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v479/page.tsx",
    component: "KerrFrequencyProvenanceViewerV479",
    endpoint: "/api/atlas/relativity-evidence/v479/frequency-provenance-viewer",
    downloadQuery: "download=provenance-viewer",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    stableWeakMapViewCache: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    sourceChain: "qualified-5-stages",
    frequencyBuffer: "qualified-20-samples",
    provenance: "qualified-4-rays-20-samples",
    scienceViewer: "qualified-browser-pending",
    cinematicViewer: "qualified-seeded-no-writeback",
    scientificFieldLeak: "qualified-zero",
    absoluteFrequency: "blocked",
    physicalBandpass: "blocked",
    scienceRaster: "blocked",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    runNextAuthorized: dense.runNextAuthorized,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundaryStatement:
    "v479-five-stage-frequency-provenance-chain-one-shared-buffer-two-presentation-views-no-scientific-field-leak-bandpass-raster-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v479",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v478NormalizedFrequency: "qualified-20-samples",
    v479ProvenanceChain: "qualified-5-stages",
    v479SharedFrequencyBuffer: "qualified",
    v479ScienceViewer: "qualified-browser-pending",
    v479CinematicViewer: "qualified-seeded-no-writeback",
    v479PresentationScientificFields: 0,
    v479FrequencyBufferMutations: 0,
    v479AbsoluteFrequencyRows: 0,
    v479PhysicalBandpassRows: 0,
    v479SciencePixelRows: 0,
    v479BrowserQualification: "not-run",
    v479VisualMatrixQualification: "not-run",
    v479SoakQualification: "not-run",
    v479RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    sciencePayloadAllowed: false,
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
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: viewer.artifactSha256, frequencyBufferSha256: viewer.frequencyBufferSha256, provenanceSha256: viewer.provenanceSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, sourceChain: 5, rows: 4, samples: 20, presentationScientificFields: 0, frequencyBufferMutations: 0, absoluteFrequencyRows: 0, physicalBandpassRows: 0, sciencePixels: 0, denseCampaign: "0/49", browserQualification: "not-run", formalProductPointer: "v263" }, null, 2));
