import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v474-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v474.json",
  dualRender: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  sparse: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
  visual: "dist/science/atlas-science-cinematic-v8-v472/profile-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v475-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v475.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "payloadSha256",
  "rowSha256",
  "scienceBufferSha256",
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
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const dualRender = read(paths.dualRender);
const sparse = read(paths.sparse);
const visual = read(paths.visual);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v474-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v474" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  dualRender.version !== "v475-kerr-dual-render-boundary-artifact-v1" ||
  dualRender.status !== "dual-render-boundary-qualified-browser-pending" ||
  canonicalSha(dualRender) !== dualRender.artifactSha256 ||
  canonicalSha(dualRender.scienceBuffer) !== dualRender.scienceBuffer?.scienceBufferSha256 ||
  dualRender.scienceBuffer?.rayIds?.length !== 4 ||
  dualRender.contract?.scienceFieldArrayCount !== 13 ||
  dualRender.contract?.presentationFieldCount !== 8 ||
  dualRender.audit?.scienceBufferCanonicalIdentityShared !== true ||
  dualRender.audit?.presentationScientificFieldCount !== 0 ||
  dualRender.audit?.presentationWritebackCount !== 0 ||
  dualRender.audit?.scienceEffectsZero !== true ||
  dualRender.lifecycle?.allResourcesAtBaseline !== true ||
  dualRender.boundary?.productionPayloadQualified !== false ||
  dualRender.boundary?.sciencePixelRows !== 0 ||
  sparse.payloadSha256 !== dualRender.scienceBuffer.sourcePayloadSha256 ||
  visual.status !== "science-cinematic-v8-runtime-consumed-browser-pending" ||
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
  throw new Error("v475-evidence-boundary");
}

const sourcePaths = [
  paths.dualRender,
  paths.previousEvidence,
  paths.previousPointer,
  paths.sparse,
  paths.visual,
  paths.dense,
  "app/lib/kerrDualRenderBoundaryV475.ts",
  "app/lib/kerrDualRenderBoundaryServerV475.ts",
  "app/lib/kerrDualRenderBoundaryClientV475.ts",
  "app/components/KerrDualRenderBoundaryV475.tsx",
  "app/api/atlas/relativity-evidence/v475/dual-render-boundary/route.ts",
  "app/local-shadow-v475/page.tsx",
  "scripts/build-kerr-dual-render-boundary-v475.ts",
  "scripts/build-shadow-candidate-v475.mjs",
  "scripts/verify-shadow-v475-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v475-dual-render-boundary-qualified-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v475-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v474EvidenceSha256: previousEvidence.evidenceSha256,
    v474EvidenceFileSha256: fileSha(paths.previousEvidence),
    v474PointerSha256: previousPointer.pointerSha256,
    v474PointerFileSha256: fileSha(paths.previousPointer),
    v475ArtifactSha256: dualRender.artifactSha256,
    v475ArtifactFileSha256: fileSha(paths.dualRender),
    v475ScienceBufferSha256: dualRender.scienceBuffer.scienceBufferSha256,
    v314StateSha256: dense.stateSha256,
  },
  dualRenderBoundary: {
    scienceBufferRowCount: 4,
    scienceFieldArrayCount: 13,
    presentationFieldCount: 8,
    modeCount: 2,
    sharedScienceBufferCanonicalIdentity: true,
    scienceViewScienceBufferSha256: dualRender.scienceBuffer.scienceBufferSha256,
    cinematicViewScienceBufferSha256: dualRender.scienceBuffer.scienceBufferSha256,
    stableRuntimeReferenceCache: true,
    presentationScientificFieldCount: 0,
    presentationWritebackCount: 0,
    scienceEffectsZero: true,
    cinematicSeed: dualRender.presentation.cinematic.seed,
    cinematicSeedDeterministic: true,
  },
  applicability: {
    sparseAuthority: "qualified-4-of-4",
    denseAuthority: "blocked-0-of-49",
    intensity: "unavailable-4-of-4",
    stokes: "unavailable-4-of-4",
    sciencePixels: "unavailable-0-rows",
    unavailableIsNotZero: true,
  },
  lifecycle: {
    ...dualRender.lifecycle,
    canvasCreatedByV475: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: dualRender.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v475/page.tsx",
    component: "KerrDualRenderBoundaryV475",
    endpoint: "/api/atlas/relativity-evidence/v475/dual-render-boundary",
    downloadQuery: "download=dual-render",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    weakMapViewCache: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    immutableScienceBuffer: "qualified-4-rays",
    sharedCanonicalIdentity: "qualified",
    stableRuntimeReferenceIdentity: "qualified-by-unit-test-browser-pending",
    sciencePresentationIsolation: "qualified",
    cinematicPresentationIsolation: "qualified",
    scientificFieldMutation: "qualified-zero",
    productionPayload: "blocked",
    denseAuthority: "blocked-0-of-49",
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
    "v475-one-immutable-sparse-science-buffer-two-presentation-only-views-no-science-writeback-production-payload-dense-raster-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v475",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v474SparseScienceEnvelope: "qualified-4-rays",
    v475ImmutableScienceBuffer: "qualified-4-rays",
    v475SharedScienceBufferIdentity: "qualified",
    v475SciencePresentation: "qualified-zero-measurement-effects",
    v475CinematicPresentation: "qualified-seeded-no-science-writeback",
    v475PresentationScientificFields: 0,
    v475ScientificMutationCount: 0,
    v475ProductionPayload: "blocked",
    v475SciencePixelRows: 0,
    v475BrowserQualification: "not-run",
    v475VisualMatrixQualification: "not-run",
    v475SoakQualification: "not-run",
    v475RtxWebGpuQualification: "not-run",
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
      artifactSha256: dualRender.artifactSha256,
      scienceBufferSha256: dualRender.scienceBuffer.scienceBufferSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rowCount: 4,
      sharedScienceBuffer: true,
      presentationScientificFields: 0,
      scientificMutationCount: 0,
      scienceEffectsZero: true,
      productionPayload: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
