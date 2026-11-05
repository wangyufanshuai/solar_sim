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

const profilePath = "dist/science/atlas-science-cinematic-v8-v472/profile-audit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v472-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v472.json";
const profile = read(profilePath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v471-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v471.json");
const v457Evidence = read("dist/science/orbit-atlas-shadow-v457-evidence.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const bindingPaths = profile.bindings.map((entry) => entry.tokenPath);
const consumers = [...new Set(profile.bindings.map((entry) => entry.consumerId))];
const v7Manifest = v457Evidence.sourceManifest.find(
  (entry) => entry.path === "app/lib/atlasScienceCinematicV7V457.ts",
);

if (
  canonicalSha(profile) !== profile.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  profile.version !== "v472-atlas-science-cinematic-v8-profile-audit-v1" ||
  profile.status !== "science-cinematic-v8-runtime-consumed-browser-pending" ||
  evidence.version !== "orbit-atlas-shadow-v472-evidence-v1" ||
  evidence.status !== "v472-science-cinematic-v8-runtime-consumed-browser-pending" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v472" ||
  pointer.status !== evidence.status ||
  profile.profileId !== "science-cinematic-v8-v472" ||
  profile.contract.tokenCount !== 33 ||
  profile.contract.bindingCount !== 33 ||
  profile.contract.consumerCount !== 13 ||
  profile.bindings.length !== 33 ||
  new Set(bindingPaths).size !== 33 ||
  consumers.length !== 13 ||
  profile.audit.unconsumedTokenPaths.length !== 0 ||
  profile.audit.duplicateTokenPaths.length !== 0 ||
  profile.bindings.some(
    (entry) => entry.presentationOnly !== true || entry.scienceWritebackAllowed !== false,
  ) ||
  profile.profiles.science.strongGravity.linearDisplay !== true ||
  profile.profiles.science.strongGravity.bloomIntensity !== 0 ||
  profile.profiles.science.strongGravity.colorGradeIntensity !== 0 ||
  profile.profiles.science.strongGravity.seed !== null ||
  profile.profiles.science.postFx.grain !== 0 ||
  profile.profiles.science.postFx.chromaticAberration !== 0 ||
  profile.profiles.cinematic.strongGravity.seed !== "orbit-atlas-v472-cinematic-seed-01" ||
  profile.profiles.science.scientificFieldMutation !== false ||
  profile.profiles.cinematic.scientificFieldMutation !== false ||
  profile.runtime.v8DefaultApplied !== false ||
  profile.runtime.initialMode !== "science" ||
  profile.runtime.canvasCreated !== false ||
  profile.runtime.sceneRevisionDelta !== 0 ||
  profile.observableBoundary.productionAuthorityGrantedRowCount !== 0 ||
  profile.observableBoundary.sciencePixelRows !== 0 ||
  profile.lifecycle.allResourcesAtBaseline !== true ||
  profile.boundary.classificationMutationAllowed !== false ||
  profile.boundary.redshiftMutationAllowed !== false ||
  profile.boundary.evpaMutationAllowed !== false ||
  profile.boundary.intensityMutationAllowed !== false ||
  profile.boundary.imageProductsGenerated !== false ||
  profile.boundary.browserQualification !== "not-run"
) {
  throw new Error("v472-fail-closed-validation");
}

if (
  !v7Manifest ||
  v7Manifest.sha256 !== fileSha("app/lib/atlasScienceCinematicV7V457.ts") ||
  profile.source.frozenV7SourceSha256 !== v7Manifest.sha256 ||
  evidence.dependency.v471EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v471PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v472ProfileArtifactSha256 !== profile.artifactSha256 ||
  evidence.dependency.v472ProfileFileSha256 !== fileSha(profilePath) ||
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
  throw new Error("v472-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error("v472-source-manifest-mismatch:" + entry.path);
  }
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v472-source-manifest-canonical-mismatch");
}

const component = readFileSync(
  resolve(root, "app/components/ScienceCinematicV8ObservableStageV472.tsx"),
  "utf8",
);
for (const tokenPath of bindingPaths) {
  if (!component.includes("tokens." + tokenPath)) {
    throw new Error("v472-runtime-token-not-consumed:" + tokenPath);
  }
}
for (const consumer of consumers) {
  if (!component.includes(consumer)) throw new Error("v472-runtime-consumer-missing:" + consumer);
}
const page = readFileSync(resolve(root, "app/local-shadow-v472/page.tsx"), "utf8");
if (
  !component.includes("同一组观测量，两种光线；科学字段只有一份") ||
  !component.includes("classification、") ||
  !component.includes("redshift、EVPA 与 intensity 永远只读") ||
  !page.includes("V471 不可变观测量之上的双通道展示层；电影效果不接触科学字段") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/.test(component + "\n" + page)
) {
  throw new Error("v472-utf8-runtime-boundary");
}

const forbiddenImages = readdirSync(
  resolve(root, "dist/science/atlas-science-cinematic-v8-v472"),
).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (forbiddenImages.length > 0) throw new Error("v472-forbidden-image-product");

const serialized = JSON.stringify({ profile, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v472-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v472-low-memory-science-cinematic-v8-fail-closed",
      artifactSha256: profile.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      tokenCount: 33,
      bindingCount: 33,
      consumerCount: 13,
      unconsumedTokens: 0,
      scienceEffects: 0,
      cinematicSeed: profile.audit.cinematicSeed,
      scientificFieldMutation: false,
      v8DefaultApplied: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
