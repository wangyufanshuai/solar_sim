import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "receiptSha256", "artifactSha256", "evidenceSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const verifySources = (artifact, label) => {
  if (sha(artifact.sourceManifest) !== artifact.sourceSha256) throw new Error(`${label}-source-sha`);
  for (const source of artifact.sourceManifest) {
    const stat = statSync(resolve(root, source.path));
    if (stat.size !== source.bytes || fileSha(source.path) !== source.sha256) throw new Error(`${label}-source-drift:${source.path}`);
  }
};

const runtime = read("dist/release/atlas-runtime-release-qualification-v567.json");
const science = read("dist/release/atlas-science-admission-v567.json");
if (runtime.version !== "v567-atlas-runtime-release-qualification-v1" || runtime.status !== "qualified-lite-overview-visual-scientific-performance-soak-hero-transition-blocked" || sha(runtime) !== runtime.receiptSha256) throw new Error("v567-runtime-receipt");
if (runtime.qualification.liteBuild !== true || runtime.qualification.overviewVisualRegression !== true || runtime.qualification.heroVisualRegression !== false || runtime.qualification.visualRegression !== false || runtime.qualification.scientificScenePerformance !== true || runtime.qualification.soak !== true || runtime.qualification.productionPromotionAllowed !== false) throw new Error("v567-runtime-qualification");
if (runtime.visualRegression.comparisonCount !== 8 || runtime.visualRegression.minimumPerceptualSimilarity < runtime.visualRegression.perceptualSimilarityFloor || runtime.visualRegression.overviewQualified !== true || runtime.visualRegression.heroScreenshotSimilarityQualified !== true || runtime.visualRegression.heroInteractionTransitionQualified !== false || runtime.scientificPerformance.resourcesReturned !== true || runtime.soak.cycles !== 10 || runtime.soak.resourcesReturnedEveryCycle !== true || runtime.soak.heapStrictlyGrowing !== false || runtime.soak.finalHeapBelowBaseline !== true) throw new Error("v567-runtime-details");
verifySources(runtime, "v567-runtime");
if (science.version !== "v567-atlas-science-admission-v1" || science.status !== "blocked-radiative-measured-dense-gpu-public-promotion" || sha(science) !== science.receiptSha256) throw new Error("v567-science-receipt");
if (science.qualification.runtimeReleaseValidation !== false || science.qualification.productionRadiativeTransfer !== false || science.qualification.measuredAuthority !== false || science.qualification.denseCpuAuthority !== false || science.qualification.gpuShadow !== false || science.qualification.publicResearchRelease !== false || science.dense.sourceDrift.length !== 2 || science.dense.stateMutationApplied !== false) throw new Error("v567-science-boundary");
verifySources(science, "v567-science");
console.log(JSON.stringify({ status: "passed-v567-runtime-release-gates", runtimeReceiptSha256: runtime.receiptSha256, scienceReceiptSha256: science.receiptSha256, liteBuild: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, dense: "blocked-0-of-49-source-manifest-drift", measuredAuthorityGranted: false, gpuShadowQualified: false, publicResearchRelease: false }, null, 2));
