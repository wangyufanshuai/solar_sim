import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v479-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v479.json",
  workbench: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v480-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v480.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
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
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const workbench = read(paths.workbench);
const v476 = read(paths.v476);
const v479 = read(paths.v479);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v479-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v479" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  workbench.version !== "v480-kerr-photon-evidence-workbench-artifact-v1" ||
  workbench.status !== "photon-evidence-workbench-qualified-production-blocked-browser-pending" ||
  canonicalSha(workbench) !== workbench.artifactSha256 ||
  workbench.stages.length !== 3 ||
  workbench.products.length !== 9 ||
  workbench.products.filter((product) => product.available).length !== 2 ||
  workbench.products.filter((product) => !product.available).length !== 7 ||
  workbench.provenance.length !== 4 ||
  workbench.buffers.sparseScienceBufferSha256 !== v476.scienceBufferSha256 ||
  workbench.buffers.normalizedFrequencyBufferSha256 !== v479.frequencyBufferSha256 ||
  workbench.buffers.provenanceSha256 !== v479.provenanceSha256 ||
  workbench.buffers.sparseScienceBufferSha256 === workbench.buffers.normalizedFrequencyBufferSha256 ||
  workbench.audit.normalizedFrequencySamples !== 20 ||
  workbench.audit.scienceWritebackCount !== 0 ||
  workbench.audit.sciencePixelRows !== 0 ||
  workbench.boundary.absoluteFrequencyAuthorityGranted !== false ||
  workbench.boundary.physicalBandpassAuthorityGranted !== false ||
  workbench.boundary.denseAggregateAuthorityGranted !== false ||
  workbench.boundary.scienceRasterAuthorityGranted !== false ||
  workbench.lifecycle.allResourcesAtBaseline !== true ||
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
  throw new Error("v480-evidence-boundary");
}

const sourcePaths = [
  paths.workbench,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v476,
  paths.v479,
  paths.dense,
  "app/lib/kerrPhotonEvidenceWorkbenchV480.ts",
  "app/lib/kerrPhotonEvidenceWorkbenchServerV480.ts",
  "app/lib/kerrPhotonEvidenceWorkbenchClientV480.ts",
  "app/components/KerrPhotonEvidenceWorkbenchV480.tsx",
  "app/api/atlas/relativity-evidence/v480/photon-evidence-workbench/route.ts",
  "app/local-shadow-v480/page.tsx",
  "scripts/build-kerr-photon-evidence-workbench-v480.ts",
  "scripts/build-shadow-candidate-v480.mjs",
  "scripts/verify-shadow-v480-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v480-photon-evidence-workbench-qualified-production-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v480-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v479EvidenceSha256: previousEvidence.evidenceSha256,
    v479EvidenceFileSha256: fileSha(paths.previousEvidence),
    v479PointerSha256: previousPointer.pointerSha256,
    v479PointerFileSha256: fileSha(paths.previousPointer),
    v480ArtifactSha256: workbench.artifactSha256,
    v480ArtifactFileSha256: fileSha(paths.workbench),
    v476ScienceBufferSha256: v476.scienceBufferSha256,
    v479FrequencyBufferSha256: v479.frequencyBufferSha256,
    v479ProvenanceSha256: v479.provenanceSha256,
    v314StateSha256: dense.stateSha256,
  },
  evidenceModel: {
    stages: workbench.stages,
    productCount: 9,
    allowedProducts: 2,
    blockedProducts: 7,
    provenanceRows: 4,
    normalizedFrequencySamples: 20,
    noLargeExecutionArraysInReactState: true,
    maximumResponseBytes: 128 * 1024,
  },
  bufferIdentity: {
    sparseScienceBufferSha256: workbench.buffers.sparseScienceBufferSha256,
    normalizedFrequencyBufferSha256: workbench.buffers.normalizedFrequencyBufferSha256,
    provenanceSha256: workbench.buffers.provenanceSha256,
    sparseScienceAndFrequencyBuffersIntentionallyDistinct: true,
    scienceAndCinematicShareFrequencyBuffer: true,
    scienceWritebackCount: 0,
  },
  productAdmission: {
    products: workbench.products,
    placeholderProducts: 0,
    presentationFallbackProducts: 0,
    productionAuthorityGranted: false,
  },
  applicability: {
    sparseAuthority: "qualified-4-rays",
    normalizedFrequencyAuthority: "qualified-20-samples",
    absoluteFrequencyAuthority: "blocked",
    physicalBandpassAuthority: "blocked",
    observedIntensityAuthority: "blocked",
    measuredStokesAuthority: "blocked",
    denseAggregateAuthority: "blocked-0-of-49",
    scienceRasterAuthority: "blocked",
    sciencePixels: 0,
    images: 0,
    unavailableIsNotZero: true,
  },
  audit: workbench.audit,
  lifecycle: { ...workbench.lifecycle, canvasCreatedByV480: false, sceneRevisionMutationAllowed: false },
  boundary: workbench.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v480/page.tsx",
    component: "KerrPhotonEvidenceWorkbenchV480",
    endpoint: "/api/atlas/relativity-evidence/v480/photon-evidence-workbench",
    downloadQuery: "download=workbench",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    upstreamStages: "qualified-3-of-3",
    evidenceModel: "qualified-browser-pending",
    bufferIdentitySeparation: "qualified",
    frequencyBufferSharedAcrossViews: "qualified",
    productAdmission: "qualified-2-allowed-7-blocked",
    productionProducts: "blocked",
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
    "v480-unified-photon-evidence-model-preserves-distinct-science-and-frequency-buffer-identities-two-sparse-products-seven-production-products-blocked-no-raster-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v480",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v475DualRenderBoundary: "qualified-browser-pending",
    v476ProductAdmission: "qualified-2-allowed-7-blocked",
    v479FrequencyProvenance: "qualified-4-rays-20-samples",
    v480UnifiedEvidenceModel: "qualified-browser-pending",
    v480BufferIdentitySeparation: "qualified",
    v480SharedFrequencyBuffer: "qualified",
    v480ScienceWritebackCount: 0,
    v480AbsoluteFrequencyRows: 0,
    v480PhysicalBandpassRows: 0,
    v480SciencePixelRows: 0,
    v480BrowserQualification: "not-run",
    v480VisualMatrixQualification: "not-run",
    v480SoakQualification: "not-run",
    v480RtxWebGpuQualification: "not-run",
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

console.log(
  JSON.stringify(
    {
      status,
      artifactSha256: workbench.artifactSha256,
      sparseScienceBufferSha256: workbench.buffers.sparseScienceBufferSha256,
      normalizedFrequencyBufferSha256: workbench.buffers.normalizedFrequencyBufferSha256,
      provenanceSha256: workbench.buffers.provenanceSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 3,
      products: "2 allowed / 7 blocked",
      provenance: "4 rows / 20 samples",
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
