import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
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

const matrixPath = "dist/science/kerr-observable-provenance-v471/observable-matrix.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v471-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v471.json";
const matrix = read(matrixPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v470-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v470.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const expectedRows = [
  "geometry-classification",
  "emission-radius",
  "redshift-factor",
  "evpa",
  "screen-alpha-beta",
  "continuous-wcs-coordinate",
  "orientation-basis",
  "thin-disk-local-emission",
  "observed-radiance",
  "detector-response",
  "stokes-iquv",
  "science-raster-pixel",
  "fits-science-image",
];

if (
  canonicalSha(matrix) !== matrix.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  matrix.version !== "v471-kerr-observable-provenance-artifact-v1" ||
  matrix.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v471-evidence-v1" ||
  evidence.status !== "v471-observable-provenance-qualified-production-blocked-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v471" ||
  pointer.status !== evidence.status ||
  matrix.sources.length !== 11 ||
  matrix.rows.length !== 13 ||
  JSON.stringify(matrix.rows.map((row) => row.id)) !== JSON.stringify(expectedRows) ||
  matrix.summary.availableRowCount !== 9 ||
  matrix.summary.unavailableRowCount !== 4 ||
  matrix.summary.shortAuthorityRowCount !== 4 ||
  matrix.summary.coordinateAuthorityRowCount !== 3 ||
  matrix.summary.analyticFixtureRowCount !== 2 ||
  matrix.summary.productionAuthorityGrantedRowCount !== 0 ||
  matrix.summary.sciencePixelRows !== 0 ||
  matrix.summary.stokesMeasurementRows !== 0 ||
  matrix.summary.fitsImageRows !== 0 ||
  matrix.rows.some(
    (row) =>
      row.productionAuthorityGranted !== false ||
      row.productionPayloadAllowed !== false ||
      row.sciencePixelMutationAllowed !== false ||
      row.cinematicWritebackAllowed !== false ||
      (row.available && row.unavailableReason !== null) ||
      (!row.available && !row.unavailableReason),
  ) ||
  matrix.admission.detectorProjectionAllowed !== false ||
  matrix.admission.stokesMeasurementAvailable !== false ||
  matrix.admission.denseAggregateAvailable !== false ||
  matrix.admission.scienceRasterAllowed !== false ||
  matrix.admission.fitsImageAllowed !== false ||
  matrix.lifecycle.existingCanvasCount !== 1 ||
  matrix.lifecycle.newCanvasCreated !== false ||
  matrix.lifecycle.sceneRevisionDelta !== 0 ||
  matrix.lifecycle.allResourcesAtBaseline !== true ||
  matrix.boundary.imageProductsGenerated !== false ||
  matrix.boundary.denseShardRunAllowed !== false ||
  matrix.boundary.browserQualification !== "not-run"
) {
  throw new Error("v471-fail-closed-validation");
}

const rowById = new Map(matrix.rows.map((row) => [row.id, row]));
const checks = [
  ["geometry-classification", (row) => row.verification.observed >= 0.999],
  ["redshift-factor", (row) => row.verification.observed < 0.005],
  ["evpa", (row) => row.verification.observed < 0.5],
  ["screen-alpha-beta", (row) => row.verification.observed < 1e-12],
  ["continuous-wcs-coordinate", (row) => row.verification.observed < 1e-12],
  ["orientation-basis", (row) => row.verification.observed < 1e-12],
  ["observed-radiance", (row) => row.verification.observed < 1e-12],
];
for (const [id, predicate] of checks) {
  const row = rowById.get(id);
  if (!row || !predicate(row)) throw new Error("v471-observable-metric:" + id);
}
if (
  rowById.get("detector-response")?.unavailableReason !== "production-calibration-unavailable" ||
  rowById.get("stokes-iquv")?.recordCount !== 0 ||
  rowById.get("science-raster-pixel")?.recordCount !== 0 ||
  rowById.get("fits-science-image")?.recordCount !== 0
) {
  throw new Error("v471-unavailable-boundary");
}

const upstream = {
  v312: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  v313: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v422: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json",
  v463: "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  v465: "dist/science/kerr-detector-response-v465/response-contract.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v467: "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v470: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
};
for (const source of matrix.sources) {
  const path = upstream[source.id];
  const document = read(path);
  const authoritySha = document.evidenceSha256 ?? document.artifactSha256;
  if (source.fileSha256 !== fileSha(path) || source.authoritySha256 !== authoritySha) {
    throw new Error("v471-source-sha-mismatch:" + source.id);
  }
}

if (
  evidence.dependency.v470EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v470PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v471MatrixArtifactSha256 !== matrix.artifactSha256 ||
  evidence.dependency.v471MatrixFileSha256 !== fileSha(matrixPath) ||
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
  throw new Error("v471-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v471-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v471-source-manifest-canonical-mismatch");
}

const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-observable-provenance-v471"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v471-forbidden-image-product");

const serialized = JSON.stringify({ matrix, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v471-transient-evidence-leak");
}

const component = readFileSync(
  resolve(root, "app/components/KerrObservableProvenanceMatrixV471.tsx"),
  "utf8",
);
const page = readFileSync(resolve(root, "app/local-shadow-v471/page.tsx"), "utf8");
if (
  !component.includes("一个数值，必须带着它的来源、适用性与边界出现") ||
  !component.includes("连续坐标不是像素，方向基不是 Stokes") ||
  !component.includes("unavailable 永远不被写成零") ||
  !page.includes("从 geodesic event 到 FITS image 的逐观测量来源、适用性与生产边界") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/.test(component + "\n" + page)
) {
  throw new Error("v471-utf8-runtime-boundary");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v471-low-memory-observable-provenance-fail-closed",
      artifactSha256: matrix.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rowCount: matrix.rows.length,
      available: matrix.summary.availableRowCount,
      unavailable: matrix.summary.unavailableRowCount,
      productionAuthority: 0,
      sciencePixelRows: 0,
      stokesMeasurementRows: 0,
      fitsImageRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
