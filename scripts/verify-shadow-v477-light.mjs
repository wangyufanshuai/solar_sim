import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "payloadSha256",
  "rowSha256",
]);
const transientV476 = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
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

const artifactPath = "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v477-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v477.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v476-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v476.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(artifact.rows) !== artifact.payloadSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v477-kerr-photon-radiometry-transfer-artifact-v1" ||
  artifact.status !== "photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v477-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v477" ||
  pointer.status !== evidence.status ||
  artifact.rows.length !== 4 ||
  JSON.stringify(artifact.rows.map((row) => row.rayId)) !==
    JSON.stringify(["disk-00", "disk-01", "disk-02", "disk-03"]) ||
  artifact.rows.some((row) => canonicalSha(row) !== row.rowSha256) ||
  artifact.contract.frequencyExponent !== 1 ||
  artifact.contract.spectralExponent !== 3 ||
  artifact.contract.bolometricExponent !== 4 ||
  artifact.contract.redshiftAppliedExactlyOnce !== true ||
  artifact.contract.noRssAcrossDerivedChannels !== true ||
  artifact.contract.transferCoefficientsAreNotMeasuredRadiance !== true ||
  artifact.audit.maximumPowerOracleRelativeDifference >= 1e-12 ||
  artifact.audit.maximumInverseRoundTripResidual >= 1e-12 ||
  artifact.audit.v466MaximumLiouvilleInvariantRelativeError >= 1e-12 ||
  artifact.audit.v468MaximumSpectralInverseRelativeError >= 1e-12 ||
  artifact.audit.v468MaximumBolometricInverseRelativeError >= 1e-12 ||
  artifact.audit.measuredRadianceRowCount !== 0 ||
  artifact.audit.detectorProjectedRowCount !== 0 ||
  artifact.audit.stokesMeasurementRowCount !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.presentationFieldInputCount !== 0 ||
  artifact.audit.scientificFieldMutationCount !== 0 ||
  artifact.applicability.analyticTransferQualified !== true ||
  artifact.applicability.productionRadiometryQualified !== false ||
  artifact.applicability.scienceRasterAllowed !== false ||
  artifact.lifecycle.newCanvasCreated !== false ||
  artifact.lifecycle.sceneRevisionDelta !== 0 ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.productionAuthorityGranted !== false ||
  artifact.boundary.productionPayloadAllowed !== false ||
  artifact.boundary.observedIntensityRows !== 0 ||
  artifact.boundary.stokesMeasurementRows !== 0 ||
  artifact.boundary.sciencePixelRows !== 0 ||
  artifact.boundary.fitsImageRows !== 0 ||
  artifact.boundary.imageProductsGenerated !== false ||
  artifact.boundary.sciencePayloadMutationAllowed !== false ||
  artifact.boundary.cinematicScienceWritebackAllowed !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v477-fail-closed-validation");
}

for (const row of artifact.rows) {
  const g = row.redshiftFactor;
  const expectedG3 = g ** 3;
  const expectedG4 = g ** 4;
  const expectedU3 = Math.abs(3 * g ** 2) * row.uncertainty.redshiftAbsoluteUpperBound;
  const expectedU4 = Math.abs(4 * g ** 3) * row.uncertainty.redshiftAbsoluteUpperBound;
  const measurements = Object.entries(row.measurements).filter(
    ([key]) => key !== "unavailableReason",
  );
  if (
    row.classification !== "disk-hit" ||
    row.applicability !== "analytic-transfer-coefficients-only" ||
    row.frequencyRatioObservedToEmitter !== g ||
    row.spectralRadianceTransferG3 !== expectedG3 ||
    row.bolometricRadianceTransferG4 !== expectedG4 ||
    row.uncertainty.spectralTransferAbsoluteUpperBound !== expectedU3 ||
    row.uncertainty.bolometricTransferAbsoluteUpperBound !== expectedU4 ||
    row.uncertainty.combinationPolicy !== "shared-redshift-channel-not-combined" ||
    row.uncertainty.independenceProven !== false ||
    row.uncertainty.productionBudgetClosed !== false ||
    measurements.some(([, value]) => value !== null)
  ) {
    throw new Error("v477-row-boundary:" + row.rayId);
  }
}

if (
  canonicalShaV476(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalShaV476(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v476EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v476PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v477ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v477PayloadSha256 !== artifact.payloadSha256 ||
  evidence.dependency.v477ArtifactFileSha256 !== fileSha(artifactPath) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath) ||
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
  throw new Error("v477-continuity-boundary");
}

for (const [id, path] of Object.entries({
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v474: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
})) {
  if (artifact.source[id] !== fileSha(path)) throw new Error("v477-source-sha-mismatch:" + id);
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v477-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v477-source-manifest-canonical-mismatch");
}

const runtimeFiles = [
  "app/lib/kerrPhotonRadiometryTransferV477.ts",
  "app/lib/kerrPhotonRadiometryTransferServerV477.ts",
  "app/lib/kerrPhotonRadiometryTransferClientV477.ts",
  "app/components/KerrPhotonRadiometryTransferV477.tsx",
  "app/api/atlas/relativity-evidence/v477/photon-radiometry-transfer/route.ts",
  "app/local-shadow-v477/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("追踪光如何缩放，不假装已经测到光") ||
  !runtimeSource.includes("用四条权威 disk ray 验证 g、g³、g⁴") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v477-utf8-runtime-boundary");
}
const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-photon-radiometry-transfer-v477"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v477-forbidden-image-product");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v477-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v477-low-memory-photon-radiometry-transfer-fail-closed",
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: 4,
      coefficients: 12,
      uncertaintyBounds: 12,
      maxPowerOracleRelativeDifference: artifact.audit.maximumPowerOracleRelativeDifference,
      maxInverseRoundTripResidual: artifact.audit.maximumInverseRoundTripResidual,
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
