import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v473-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v473.json",
  payload: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v474-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v474.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
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
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const payload = read(paths.payload);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v473-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v473" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  payload.version !== "v474-kerr-sparse-science-payload-artifact-v1" ||
  payload.status !== "sparse-science-envelope-qualified-production-payload-blocked-browser-pending" ||
  canonicalSha(payload) !== payload.artifactSha256 ||
  canonicalSha(payload.rows) !== payload.payloadSha256 ||
  payload.rows?.length !== 4 ||
  payload.rows.some((row) => canonicalSha(row) !== row.rowSha256 || row.uncertainty.length !== 7) ||
  payload.join?.joinedRowCount !== 4 ||
  payload.join?.classificationMismatchCount !== 0 ||
  payload.join?.spinMismatchCount !== 0 ||
  payload.join?.redshiftMismatchCount !== 0 ||
  payload.join?.evpaMismatchCount !== 0 ||
  payload.join?.coordinateMismatchCount !== 0 ||
  payload.qualification?.sparseAuthorityQualified !== true ||
  payload.qualification?.productionPayloadQualified !== false ||
  payload.boundary?.sciencePixelRows !== 0 ||
  payload.lifecycle?.allResourcesAtBaseline !== true ||
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
  throw new Error("v474-evidence-boundary");
}

const sourcePaths = [
  paths.payload,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/kerrSparseSciencePayloadV474.ts",
  "app/lib/kerrSparseSciencePayloadServerV474.ts",
  "app/lib/kerrSparseSciencePayloadClientV474.ts",
  "app/components/KerrSparseSciencePayloadInspectorV474.tsx",
  "app/api/atlas/relativity-evidence/v474/sparse-science-payload/route.ts",
  "app/local-shadow-v474/page.tsx",
  "scripts/build-kerr-sparse-science-payload-v474.ts",
  "scripts/build-shadow-candidate-v474.mjs",
  "scripts/verify-shadow-v474-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v474-sparse-science-envelope-qualified-production-payload-blocked-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v474-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v473EvidenceSha256: previousEvidence.evidenceSha256,
    v473EvidenceFileSha256: fileSha(paths.previousEvidence),
    v473PointerSha256: previousPointer.pointerSha256,
    v473PointerFileSha256: fileSha(paths.previousPointer),
    v474PayloadArtifactSha256: payload.artifactSha256,
    v474PayloadSha256: payload.payloadSha256,
    v474PayloadFileSha256: fileSha(paths.payload),
    v314StateSha256: dense.stateSha256,
  },
  sparsePayload: {
    rowCount: payload.rows.length,
    uncertaintyReferenceCount: payload.rows.reduce(
      (sum, row) => sum + row.uncertainty.length,
      0,
    ),
    rowShaQualifiedCount: payload.rows.filter((row) => canonicalSha(row) === row.rowSha256).length,
    payloadShaQualified: canonicalSha(payload.rows) === payload.payloadSha256,
    atomicJoinCommitted: true,
    partialJoinPublished: false,
    joinMismatchCount: 0,
    maximumContinuousCoordinateDifference:
      payload.join.maximumContinuousCoordinateDifference,
    maximumEvpaDifferenceDeg: payload.join.maximumEvpaDifferenceDeg,
    sparseAuthorityQualified: true,
    denseAuthorityQualified: false,
    productionPayloadQualified: false,
  },
  applicability: {
    classification: "disk-hit-4-of-4",
    intensity: "unavailable-4-of-4",
    stokes: "unavailable-4-of-4",
    pixelSample: "unavailable-4-of-4",
    interpolationAllowed: false,
    nearestPixelAssignmentAllowed: false,
    unavailableIsNotZero: true,
  },
  lifecycle: {
    ...payload.lifecycle,
    canvasCreatedByV474: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: payload.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v474/page.tsx",
    component: "KerrSparseSciencePayloadInspectorV474",
    endpoint: "/api/atlas/relativity-evidence/v474/sparse-science-payload",
    downloadQuery: "download=sparse-payload",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    atomicSparseJoin: "qualified-4-of-4",
    rowCanonicalSha: "qualified-4-of-4",
    payloadCanonicalSha: "qualified",
    provenanceJoin: "qualified",
    uncertaintyJoin: "qualified-28-references",
    applicabilityBoundary: "qualified",
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
    "v474-four-ray-immutable-sparse-envelope-only-no-production-payload-dense-authority-pixels-stokes-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v474",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v473UncertaintyLedger: "qualified-production-open",
    v474SparseScienceEnvelope: "qualified-4-rays",
    v474AtomicJoin: "qualified-no-mismatch",
    v474UncertaintyReferences: "qualified-28",
    v474SparseAuthority: "qualified",
    v474DenseAuthority: "blocked-0-of-49",
    v474ProductionPayload: "blocked",
    v474SciencePixelRows: 0,
    v474StokesMeasurementRows: 0,
    v474FitsImageRows: 0,
    v474BrowserQualification: "not-run",
    v474VisualMatrixQualification: "not-run",
    v474SoakQualification: "not-run",
    v474RtxWebGpuQualification: "not-run",
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
      artifactSha256: payload.artifactSha256,
      payloadSha256: payload.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rowCount: 4,
      uncertaintyReferences: 28,
      joinMismatches: 0,
      sparseAuthority: true,
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
