import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const transientV475 = new Set([...transient, "scienceBufferSha256"]);
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
const canonicalShaV475 = (value) => canonicalShaWith(value, transientV475);

const artifactPath = "dist/science/kerr-science-product-admission-v476/admission.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v476-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v476.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v475-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v475.json");
const v475 = read("dist/science/kerr-dual-render-boundary-v475/dual-render.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const expectedIds = [
  "sparse-observable-hud",
  "sparse-vector-export",
  "detector-projection",
  "observed-intensity",
  "measured-stokes",
  "dense-transfer-map",
  "science-raster",
  "fits-science-image",
  "png-science-image",
];
const allowed = artifact.products.filter((entry) => entry.available);
const blocked = artifact.products.filter((entry) => !entry.available);

if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v476-kerr-science-product-admission-artifact-v1" ||
  artifact.status !== "science-product-admission-qualified-production-images-blocked-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v476-evidence-v1" ||
  evidence.status !== "v476-science-product-admission-qualified-production-images-blocked-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v476" ||
  pointer.status !== evidence.status ||
  JSON.stringify(artifact.products.map((entry) => entry.id)) !== JSON.stringify(expectedIds) ||
  allowed.length !== 2 ||
  JSON.stringify(allowed.map((entry) => entry.id)) !==
    JSON.stringify(["sparse-observable-hud", "sparse-vector-export"]) ||
  blocked.length !== 7 ||
  allowed.some((entry) => entry.status !== "available-sparse-authority" || entry.recordCount !== 4) ||
  blocked.some((entry) => entry.recordCount !== 0 || entry.blockedBy.length === 0) ||
  artifact.products.some(
    (entry) =>
      entry.placeholderAllowed !== false ||
      entry.presentationFallbackMayGrantScienceAuthority !== false ||
      entry.scienceWritebackAllowed !== false,
  ) ||
  artifact.contract.readyMeasuredFileCount !== 0 ||
  artifact.contract.missingMeasuredFileCount !== 6 ||
  artifact.contract.completedDenseShardCount !== 0 ||
  artifact.contract.plannedDenseShardCount !== 49 ||
  artifact.contract.productionBudgetClosedCount !== 0 ||
  artifact.blockers.rootBlockerCount !== 3 ||
  artifact.audit.sparseObservableHudAllowed !== true ||
  artifact.audit.sparseVectorExportAllowed !== true ||
  artifact.audit.detectorProjectionAllowed !== false ||
  artifact.audit.observedIntensityAvailable !== false ||
  artifact.audit.measuredStokesAvailable !== false ||
  artifact.audit.denseTransferMapAvailable !== false ||
  artifact.audit.scienceRasterAllowed !== false ||
  artifact.audit.fitsWriteAllowed !== false ||
  artifact.audit.pngWriteAllowed !== false ||
  artifact.audit.presentationToScienceConversionAllowed !== false ||
  artifact.audit.placeholderMeasurementAllowed !== false ||
  artifact.audit.unavailableIsNotZero !== true ||
  artifact.audit.v475ScienceBufferMutationCount !== 0 ||
  artifact.audit.v475PresentationScientificFieldCount !== 0 ||
  artifact.lifecycle.newCanvasCreated !== false ||
  artifact.lifecycle.sceneRevisionDelta !== 0 ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.productionAuthorityGranted !== false ||
  artifact.boundary.productionPayloadAllowed !== false ||
  artifact.boundary.sciencePixelRows !== 0 ||
  artifact.boundary.stokesMeasurementRows !== 0 ||
  artifact.boundary.fitsImageRows !== 0 ||
  artifact.boundary.imageProductsGenerated !== false ||
  artifact.boundary.sciencePayloadMutationAllowed !== false ||
  artifact.boundary.cinematicScienceWritebackAllowed !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v476-fail-closed-validation");
}

if (
  canonicalShaV475(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalShaV475(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v475EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v475PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v476ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v476ArtifactFileSha256 !== fileSha(artifactPath) ||
  artifact.scienceBufferSha256 !== v475.scienceBuffer.scienceBufferSha256 ||
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
  throw new Error("v476-continuity-boundary");
}

for (const [id, path] of Object.entries({
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v470: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
})) {
  if (artifact.source[id] !== fileSha(path)) throw new Error("v476-source-sha-mismatch:" + id);
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v476-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v476-source-manifest-canonical-mismatch");
}

const runtimeFiles = [
  "app/lib/kerrScienceProductAdmissionV476.ts",
  "app/lib/kerrScienceProductAdmissionServerV476.ts",
  "app/lib/kerrScienceProductAdmissionClientV476.ts",
  "app/components/KerrScienceProductAdmissionV476.tsx",
  "app/api/atlas/relativity-evidence/v476/science-product-admission/route.ts",
  "app/local-shadow-v476/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("科学信号可以停下，展示效果不能越过闸门") ||
  !runtimeSource.includes("将真实可读的稀疏观测量与尚无资格的探测器") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v476-utf8-runtime-boundary");
}
const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-science-product-admission-v476"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v476-forbidden-image-product");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v476-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v476-low-memory-science-product-admission-fail-closed",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      products: 9,
      allowed: 2,
      blocked: 7,
      measuredFiles: "0/6",
      denseCampaign: "0/49",
      productionBudgetsClosed: 0,
      sciencePixels: 0,
      stokesRows: 0,
      fitsRows: 0,
      placeholders: false,
      presentationFallbackAuthority: false,
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
