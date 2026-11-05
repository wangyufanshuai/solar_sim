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

const artifactPath = "dist/science/kerr-unified-workbench-v469/workbench.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v469-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v469.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v468-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v468.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const expectedStageIds = [
  "v463-payload-admission",
  "v464-provenance",
  "v465-response",
  "v466-radiative-transfer",
  "v467-thin-disk",
  "v468-coupling",
];
const stageSourcePaths = {
  "v463-payload-admission": "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  "v464-provenance": "dist/science/kerr-measured-detector-provenance-v464/provenance-observatory.json",
  "v465-response": "dist/science/kerr-detector-response-v465/response-contract.json",
  "v466-radiative-transfer": "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  "v467-thin-disk": "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  "v468-coupling": "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
};

if (
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v469-kerr-unified-workbench-artifact-v1" ||
  artifact.status !== "unified-kerr-workbench-qualified-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v469-evidence-v1" ||
  evidence.status !== "v469-unified-kerr-workbench-qualified-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v469" ||
  pointer.status !== evidence.status ||
  artifact.stages?.length !== 6 ||
  JSON.stringify(artifact.stages.map((stage) => stage.id)) !== JSON.stringify(expectedStageIds) ||
  new Set(artifact.stages.map((stage) => stage.id)).size !== 6 ||
  artifact.stages.some(
    (stage) =>
      stage.authorityGranted !== false ||
      stage.sciencePixelRows !== 0 ||
      stage.browserQualification !== "not-run" ||
      !stage.reason ||
      !stage.status,
  ) ||
  artifact.lifecycle?.existingCanvasCount !== 1 ||
  artifact.lifecycle?.newCanvasCreated !== false ||
  artifact.lifecycle?.sceneRevisionDelta !== 0 ||
  artifact.lifecycle?.allResourcesAtBaseline !== true ||
  [
    "workers",
    "gpuBuffers",
    "pipelines",
    "textures",
    "renderTargets",
    "typedArrayCaches",
    "objectUrls",
    "cameraLeases",
    "subscriptions",
  ].some((key) => artifact.lifecycle?.[key] !== 0) ||
  artifact.boundary?.sciencePayloadMutationAllowed !== false ||
  artifact.boundary?.cinematicScienceWritebackAllowed !== false ||
  artifact.boundary?.fitsWriteAllowed !== false ||
  artifact.boundary?.pngWriteAllowed !== false ||
  artifact.qualification?.browserQualification !== "not-run" ||
  artifact.qualification?.visualMatrixQualification !== "not-run" ||
  artifact.qualification?.soakQualification !== "not-run" ||
  artifact.qualification?.rtxWebGpuQualification !== "not-run" ||
  evidence.workbench?.authorityGranted !== false ||
  evidence.workbench?.sciencePixelRows !== 0 ||
  evidence.lifecycle?.allResourcesAtBaseline !== true ||
  evidence.boundary?.imageProductsGenerated !== false ||
  evidence.qualification?.browser !== "not-run" ||
  pointer.capabilities?.v469Authority !== "not-granted" ||
  pointer.capabilities?.v469SciencePixelRows !== 0 ||
  pointer.capabilities?.v469BrowserQualification !== "not-run" ||
  pointer.promotion?.promotionAllowed !== false ||
  pointer.promotion?.sciencePayloadAllowed !== false
) {
  throw new Error("v469-fail-closed-validation");
}

for (const stage of artifact.stages) {
  const sourcePath = stageSourcePaths[stage.id];
  const upstream = read(sourcePath);
  if (
    artifact.source[stage.id] !== fileSha(sourcePath) ||
    stage.artifactSha256 !== upstream.artifactSha256
  ) {
    throw new Error(`v469-stage-sha-mismatch:${stage.id}`);
  }
}

if (
  evidence.dependency?.v468EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency?.v468PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency?.v469WorkbenchArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency?.v469WorkbenchFileSha256 !== fileSha(artifactPath) ||
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
  throw new Error("v469-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v469-source-manifest-mismatch:${entry.path}`);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v469-source-manifest-canonical-mismatch");
}

const forbiddenImageProducts = readdirSync(
  resolve(root, "dist/science/kerr-unified-workbench-v469"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImageProducts.length > 0) {
  throw new Error("v469-forbidden-image-product");
}

const serialized = JSON.stringify({ artifact, evidence, pointer });
if (
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)
) {
  throw new Error("v469-transient-evidence-leak");
}

const component = readFileSync(
  resolve(root, "app/components/KerrUnifiedWorkbenchV469.tsx"),
  "utf8",
);
const page = readFileSync(resolve(root, "app/local-shadow-v469/page.tsx"), "utf8");
if (
  !component.includes("六道证据，一条可追溯的轨道") ||
  !component.includes("完整") ||
  !component.includes("ray/pixel 数组留在白名单 artifact") ||
  !page.includes("资格、SHA、生命周期和失败原因的统一只读工作台") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/.test(`${component}\n${page}`)
) {
  throw new Error("v469-utf8-runtime-boundary");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v469-low-memory-unified-kerr-workbench-fail-closed",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stageCount: artifact.stages.length,
      authorityGranted: false,
      sciencePixelRows: 0,
      lifecycleBaseline: true,
      imageProductsGenerated: false,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
