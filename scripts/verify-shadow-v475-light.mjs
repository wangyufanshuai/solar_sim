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
  "scienceBufferSha256",
]);
const fileBytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(fileBytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(fileBytes(path)).digest("hex");
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
const exactScientificFields = new Set([
  "classification",
  "emissionRadiusM",
  "redshiftFactor",
  "evpaDeg",
  "orientationQHat",
  "orientationUHat",
  "continuousPixelX",
  "continuousPixelY",
  "intensity",
  "stokesI",
  "stokesQ",
  "stokesU",
  "stokesV",
]);
const countScientificFields = (value) =>
  Array.isArray(value)
    ? value.reduce((sum, entry) => sum + countScientificFields(entry), 0)
    : !value || typeof value !== "object"
      ? 0
      : Object.entries(value).reduce(
          (sum, [key, entry]) =>
            sum + (exactScientificFields.has(key) ? 1 : 0) + countScientificFields(entry),
          0,
        );

const artifactPath = "dist/science/kerr-dual-render-boundary-v475/dual-render.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v475-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v475.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v474-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v474.json");
const sparsePath = "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json";
const visualPath = "dist/science/atlas-science-cinematic-v8-v472/profile-audit.json";
const densePath = "dist/science/kerr-campaign-v314/campaign-state.json";
const dense = read(densePath);
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const buffer = artifact.scienceBuffer;
const science = artifact.presentation?.science;
const cinematic = artifact.presentation?.cinematic;

if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(buffer) !== buffer?.scienceBufferSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v475-kerr-dual-render-boundary-artifact-v1" ||
  artifact.status !== "dual-render-boundary-qualified-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v475-evidence-v1" ||
  evidence.status !== "v475-dual-render-boundary-qualified-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v475" ||
  pointer.status !== evidence.status ||
  artifact.contract?.scienceBufferRowCount !== 4 ||
  artifact.contract?.scienceFieldArrayCount !== 13 ||
  artifact.contract?.presentationFieldCount !== 8 ||
  artifact.contract?.modeCount !== 2 ||
  JSON.stringify(buffer?.rayIds) !==
    JSON.stringify(["disk-00", "disk-01", "disk-02", "disk-03"]) ||
  buffer?.classification?.some((entry) => entry !== "disk-hit") ||
  buffer?.sourceRowSha256?.length !== 4 ||
  buffer?.readonly !== true ||
  artifact.audit?.scienceBufferCanonicalIdentityShared !== true ||
  artifact.audit?.scienceViewScienceBufferSha256 !== buffer.scienceBufferSha256 ||
  artifact.audit?.cinematicViewScienceBufferSha256 !== buffer.scienceBufferSha256 ||
  artifact.audit?.presentationScientificFieldCount !== 0 ||
  artifact.audit?.classificationMutationCount !== 0 ||
  artifact.audit?.redshiftMutationCount !== 0 ||
  artifact.audit?.evpaMutationCount !== 0 ||
  artifact.audit?.intensityMutationCount !== 0 ||
  artifact.audit?.stokesMutationCount !== 0 ||
  artifact.audit?.presentationWritebackCount !== 0 ||
  artifact.audit?.scienceEffectsZero !== true ||
  artifact.audit?.cinematicSeedDeterministic !== true ||
  countScientificFields(artifact.presentation) !== 0 ||
  science?.linearDisplay !== true ||
  science?.exposure !== 1 ||
  science?.bloomIntensity !== 0 ||
  science?.colorGradeIntensity !== 0 ||
  science?.grain !== 0 ||
  science?.chromaticAberration !== 0 ||
  science?.seed !== null ||
  cinematic?.mode !== "cinematic" ||
  !cinematic?.seed ||
  science?.scientificFieldMutation !== false ||
  cinematic?.scientificFieldMutation !== false ||
  artifact.lifecycle?.newCanvasCreated !== false ||
  artifact.lifecycle?.sceneRevisionDelta !== 0 ||
  artifact.lifecycle?.allResourcesAtBaseline !== true ||
  artifact.boundary?.sparseAuthorityQualified !== true ||
  artifact.boundary?.denseAuthorityQualified !== false ||
  artifact.boundary?.productionPayloadQualified !== false ||
  artifact.boundary?.sciencePixelRows !== 0 ||
  artifact.boundary?.imageProductsGenerated !== false ||
  artifact.boundary?.runtimeSciencePayloadMutationAllowed !== false ||
  artifact.boundary?.cinematicScienceWritebackAllowed !== false ||
  artifact.boundary?.browserQualification !== "not-run"
) {
  throw new Error("v475-fail-closed-validation");
}

for (const values of [
  buffer.emissionRadiusM,
  buffer.redshiftFactor,
  buffer.evpaDeg,
  buffer.orientationQHat,
  buffer.orientationUHat,
  buffer.continuousPixelX,
  buffer.continuousPixelY,
]) {
  if (values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) {
    throw new Error("v475-science-buffer-finite-values");
  }
}
for (const values of [buffer.intensity, buffer.stokesI, buffer.stokesQ, buffer.stokesU, buffer.stokesV]) {
  if (values.length !== 4 || values.some((entry) => entry !== null)) {
    throw new Error("v475-unavailable-measurement-boundary");
  }
}

if (
  artifact.source?.v474 !== fileSha(sparsePath) ||
  artifact.source?.v472 !== fileSha(visualPath) ||
  artifact.source?.dense !== fileSha(densePath) ||
  evidence.dependency?.v474EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency?.v474PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency?.v475ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency?.v475ArtifactFileSha256 !== fileSha(artifactPath) ||
  evidence.dependency?.v475ScienceBufferSha256 !== buffer.scienceBufferSha256 ||
  pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence?.fileSha256 !== fileSha(evidencePath) ||
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
  throw new Error("v475-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v475-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v475-source-manifest-canonical-mismatch");
}

const runtimeFiles = [
  "app/lib/kerrDualRenderBoundaryV475.ts",
  "app/lib/kerrDualRenderBoundaryServerV475.ts",
  "app/lib/kerrDualRenderBoundaryClientV475.ts",
  "app/components/KerrDualRenderBoundaryV475.tsx",
  "app/api/atlas/relativity-evidence/v475/dual-render-boundary/route.ts",
  "app/local-shadow-v475/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(fileBytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("同一份科学缓冲区，两种不可串写的观看方式") ||
  !runtimeSource.includes("四条真实 disk ray 只形成一份不可变科学缓冲区") ||
  !runtimeSource.includes("new WeakMap") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v475-utf8-runtime-boundary");
}
const forbiddenImages = readdirSync(
  resolve(root, "dist/science/kerr-dual-render-boundary-v475"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v475-forbidden-image-product");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v475-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v475-low-memory-dual-render-boundary-fail-closed",
      artifactSha256: artifact.artifactSha256,
      scienceBufferSha256: buffer.scienceBufferSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rowCount: 4,
      sharedScienceBuffer: true,
      presentationScientificFields: 0,
      mutationCount: 0,
      scienceEffectsZero: true,
      cinematicSeedDeterministic: true,
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
