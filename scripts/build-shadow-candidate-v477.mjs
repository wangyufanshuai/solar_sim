import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v476-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v476.json",
  transfer: "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v474: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v477-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v477.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "payloadSha256",
  "rowSha256",
]);
const transientV476 = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalizeWith = (value, ignored) =>
  Array.isArray(value)
    ? value.map((entry) => canonicalizeWith(entry, ignored))
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !ignored.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalizeWith(entry, ignored)]),
        );
const canonicalShaWith = (value, ignored) =>
  createHash("sha256").update(JSON.stringify(canonicalizeWith(value, ignored))).digest("hex");
const canonicalSha = (value) => canonicalShaWith(value, transient);
const canonicalShaV476 = (value) => canonicalShaWith(value, transientV476);
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const transfer = read(paths.transfer);
const v476 = read(paths.v476);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v476-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v476" ||
  canonicalShaV476(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalShaV476(previousPointer) !== previousPointer.pointerSha256 ||
  transfer.version !== "v477-kerr-photon-radiometry-transfer-artifact-v1" ||
  transfer.status !== "photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending" ||
  canonicalSha(transfer) !== transfer.artifactSha256 ||
  canonicalSha(transfer.rows) !== transfer.payloadSha256 ||
  transfer.rows.length !== 4 ||
  transfer.rows.some((row) => canonicalSha(row) !== row.rowSha256) ||
  transfer.audit.applicableRowCount !== 4 ||
  transfer.audit.coefficientCount !== 12 ||
  transfer.audit.uncertaintyBoundCount !== 12 ||
  transfer.audit.maximumPowerOracleRelativeDifference >= 1e-12 ||
  transfer.audit.maximumInverseRoundTripResidual >= 1e-12 ||
  transfer.audit.measuredRadianceRowCount !== 0 ||
  transfer.audit.detectorProjectedRowCount !== 0 ||
  transfer.audit.stokesMeasurementRowCount !== 0 ||
  transfer.audit.sciencePixelRows !== 0 ||
  transfer.audit.presentationFieldInputCount !== 0 ||
  transfer.audit.scientificFieldMutationCount !== 0 ||
  transfer.applicability.productionRadiometryQualified !== false ||
  transfer.applicability.scienceRasterAllowed !== false ||
  transfer.boundary.imageProductsGenerated !== false ||
  transfer.lifecycle.allResourcesAtBaseline !== true ||
  v476.audit.observedIntensityAvailable !== false ||
  v476.audit.scienceRasterAllowed !== false ||
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
  throw new Error("v477-evidence-boundary");
}

const sourcePaths = [
  paths.transfer,
  paths.previousEvidence,
  paths.previousPointer,
  paths.v466,
  paths.v468,
  paths.v473,
  paths.v474,
  paths.v476,
  paths.dense,
  "app/lib/kerrPhotonRadiometryTransferV477.ts",
  "app/lib/kerrPhotonRadiometryTransferServerV477.ts",
  "app/lib/kerrPhotonRadiometryTransferClientV477.ts",
  "app/components/KerrPhotonRadiometryTransferV477.tsx",
  "app/api/atlas/relativity-evidence/v477/photon-radiometry-transfer/route.ts",
  "app/local-shadow-v477/page.tsx",
  "scripts/build-kerr-photon-radiometry-transfer-v477.ts",
  "scripts/build-shadow-candidate-v477.mjs",
  "scripts/verify-shadow-v477-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v477-photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v477-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v476EvidenceSha256: previousEvidence.evidenceSha256,
    v476EvidenceFileSha256: fileSha(paths.previousEvidence),
    v476PointerSha256: previousPointer.pointerSha256,
    v476PointerFileSha256: fileSha(paths.previousPointer),
    v477ArtifactSha256: transfer.artifactSha256,
    v477PayloadSha256: transfer.payloadSha256,
    v477ArtifactFileSha256: fileSha(paths.transfer),
    v314StateSha256: dense.stateSha256,
  },
  transfer: {
    rowCount: 4,
    coefficientCount: 12,
    uncertaintyBoundCount: 12,
    frequencyExponent: 1,
    spectralExponent: 3,
    bolometricExponent: 4,
    liouvilleInvariant: "I_nu_over_nu_cubed",
    redshiftAppliedExactlyOnce: true,
    directPowerAndLogExpOracle: "qualified",
    firstOrderAnalyticUncertaintyPropagation: "qualified",
    derivedChannelsCombinedByRss: false,
    transferCoefficientsAreMeasuredRadiance: false,
  },
  measurements: {
    measuredRadianceRows: 0,
    detectorProjectedRows: 0,
    measuredStokesRows: 0,
    sciencePixelRows: 0,
    fitsImageRows: 0,
    unavailableIsNotZero: true,
  },
  audit: transfer.audit,
  applicability: transfer.applicability,
  lifecycle: {
    ...transfer.lifecycle,
    canvasCreatedByV477: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: transfer.boundary,
  runtimeIntegration: {
    localShadowEntry: "app/local-shadow-v477/page.tsx",
    component: "KerrPhotonRadiometryTransferV477",
    endpoint: "/api/atlas/relativity-evidence/v477/photon-radiometry-transfer",
    downloadQuery: "download=transfer-payload",
    maximumResponseBytes: 128 * 1024,
    serverFingerprint: "path+mtime+size+sha256",
    clientSingleFlight: true,
    clientNoStore: true,
    liteOrOrdinaryStandaloneVisible: false,
  },
  qualification: {
    frequencyTransfer: "qualified-4-rays",
    spectralTransferG3: "qualified-4-rays",
    bolometricTransferG4: "qualified-4-rays",
    analyticPowerOracle: "qualified",
    inverseRoundTrip: "qualified",
    redshiftUncertaintyPropagation: "qualified-short-budget",
    productionRadiometry: "blocked-measured-inputs",
    detectorProjection: "blocked",
    measuredStokes: "blocked",
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
    "v477-four-ray-g-g3-g4-analytic-transfer-and-linear-uncertainty-only-no-measured-emission-radiance-detector-projection-stokes-pixels-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v477",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v476ScienceProductAdmission: "qualified-fail-closed",
    v477PhotonTransfer: "qualified-4-rays",
    v477FrequencyRatio: "qualified-g",
    v477SpectralTransfer: "qualified-g3",
    v477BolometricTransfer: "qualified-g4",
    v477AnalyticOracle: "qualified",
    v477UncertaintyPropagation: "qualified-short-budget",
    v477MeasuredRadianceRows: 0,
    v477DetectorProjectedRows: 0,
    v477StokesMeasurementRows: 0,
    v477SciencePixelRows: 0,
    v477ProductionRadiometry: "blocked",
    v477BrowserQualification: "not-run",
    v477VisualMatrixQualification: "not-run",
    v477SoakQualification: "not-run",
    v477RtxWebGpuQualification: "not-run",
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
      artifactSha256: transfer.artifactSha256,
      payloadSha256: transfer.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: 4,
      coefficients: 12,
      uncertaintyBounds: 12,
      measuredRadianceRows: 0,
      detectorProjectedRows: 0,
      stokesRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
