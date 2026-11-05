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
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
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

const payloadPath = "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v474-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v474.json";
const payload = read(payloadPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v473-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v473.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const expectedRayIds = ["disk-00", "disk-01", "disk-02", "disk-03"];

if (
  canonicalSha(payload) !== payload.artifactSha256 ||
  canonicalSha(payload.rows) !== payload.payloadSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  payload.version !== "v474-kerr-sparse-science-payload-artifact-v1" ||
  payload.status !== "sparse-science-envelope-qualified-production-payload-blocked-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v474-evidence-v1" ||
  evidence.status !==
    "v474-sparse-science-envelope-qualified-production-payload-blocked-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v474" ||
  pointer.status !== evidence.status ||
  payload.rows.length !== 4 ||
  JSON.stringify(payload.rows.map((row) => row.rayId)) !== JSON.stringify(expectedRayIds) ||
  payload.rows.some((row) => canonicalSha(row) !== row.rowSha256) ||
  payload.rows.reduce((sum, row) => sum + row.uncertainty.length, 0) !== 28 ||
  payload.join.joinedRowCount !== 4 ||
  payload.join.exactJoinKeyCount !== 4 ||
  payload.join.duplicateJoinKeyCount !== 0 ||
  payload.join.missingJoinKeyCount !== 0 ||
  payload.join.classificationMismatchCount !== 0 ||
  payload.join.spinMismatchCount !== 0 ||
  payload.join.redshiftMismatchCount !== 0 ||
  payload.join.evpaMismatchCount !== 0 ||
  payload.join.coordinateMismatchCount !== 0 ||
  payload.join.maximumContinuousCoordinateDifference >= 1e-12 ||
  payload.join.maximumEvpaDifferenceDeg >= 1e-12 ||
  payload.join.atomicJoinCommitted !== true ||
  payload.join.partialJoinPublished !== false ||
  payload.qualification.sparseAuthorityQualified !== true ||
  payload.qualification.denseAuthorityQualified !== false ||
  payload.qualification.productionPayloadQualified !== false ||
  payload.qualification.scienceRasterQualified !== false ||
  payload.qualification.fitsImageQualified !== false ||
  payload.boundary.productionSciencePayloadAllowed !== false ||
  payload.boundary.sciencePixelRows !== 0 ||
  payload.boundary.stokesMeasurementRows !== 0 ||
  payload.boundary.fitsImageRows !== 0 ||
  payload.boundary.imageProductsGenerated !== false ||
  payload.boundary.browserQualification !== "not-run" ||
  payload.lifecycle.allResourcesAtBaseline !== true
) {
  throw new Error("v474-fail-closed-validation");
}

for (const row of payload.rows) {
  const basisNorm = row.polarization.orientationQHat ** 2 + row.polarization.orientationUHat ** 2;
  if (
    row.geometry.classification !== "disk-hit" ||
    !Number.isFinite(row.geometry.emissionRadiusM) ||
    !Number.isFinite(row.geometry.redshiftFactor) ||
    !Number.isFinite(row.polarization.evpaDeg) ||
    Math.abs(basisNorm - 1) >= 1e-12 ||
    row.polarization.polarizationAmplitude !== null ||
    row.polarization.stokesI !== null ||
    row.polarization.stokesQ !== null ||
    row.polarization.stokesU !== null ||
    row.polarization.stokesV !== null ||
    row.coordinate.pixelSample !== null ||
    row.coordinate.interpolationAllowed !== false ||
    row.coordinate.nearestPixelAssignmentAllowed !== false ||
    row.radiometry.intensity !== null ||
    row.uncertainty.some(
      (entry) =>
        entry.productionBudgetClosed !== false ||
        !Number.isFinite(entry.combinedValue) ||
        entry.ledgerArtifactSha256 !== payload.rows[0].uncertainty[0].ledgerArtifactSha256,
    )
  ) {
    throw new Error("v474-row-boundary:" + row.rayId);
  }
}

const upstream = {
  v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v422: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
};
for (const [id, path] of Object.entries(upstream)) {
  if (payload.source[id] !== fileSha(path)) throw new Error("v474-source-sha-mismatch:" + id);
}

if (
  evidence.dependency.v473EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v473PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v474PayloadArtifactSha256 !== payload.artifactSha256 ||
  evidence.dependency.v474PayloadSha256 !== payload.payloadSha256 ||
  evidence.dependency.v474PayloadFileSha256 !== fileSha(payloadPath) ||
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
  throw new Error("v474-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v474-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v474-source-manifest-canonical-mismatch");
}

const component = readFileSync(
  resolve(root, "app/components/KerrSparseSciencePayloadInspectorV474.tsx"),
  "utf8",
);
const page = readFileSync(resolve(root, "app/local-shadow-v474/page.tsx"), "utf8");
if (
  !component.includes("四条真实光线，原子连接成一封不可变科研信封") ||
  !component.includes("它仍不是 dense image、Stokes measurement 或 production pixel") ||
  !component.includes("atomic join 4/4") ||
  !page.includes("四条 authority disk ray 的真实数值、provenance、适用性和 uncertainty 原子连接") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/.test(component + "\n" + page)
) {
  throw new Error("v474-utf8-runtime-boundary");
}
const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-sparse-science-payload-v474"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v474-forbidden-image-product");
const serialized = JSON.stringify({ payload, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v474-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v474-low-memory-sparse-science-payload-fail-closed",
      artifactSha256: payload.artifactSha256,
      payloadSha256: payload.payloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rowCount: 4,
      uncertaintyReferences: 28,
      joinMismatches: 0,
      maximumContinuousCoordinateDifference:
        payload.join.maximumContinuousCoordinateDifference,
      maximumEvpaDifferenceDeg: payload.join.maximumEvpaDifferenceDeg,
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
