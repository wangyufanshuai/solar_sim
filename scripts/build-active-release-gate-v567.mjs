import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = "dist/release/orbit-atlas-active-release-gate-v567.json";
const paths = {
  priorGate: "dist/release/orbit-atlas-active-release-gate-v562.json",
  runtime: "dist/release/atlas-runtime-release-qualification-v567.json",
  science: "dist/release/atlas-science-admission-v567.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
};
const transient = new Set(["generatedAt", "receiptSha256", "artifactSha256", "evidenceSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const priorGate = read(paths.priorGate);
const runtime = read(paths.runtime);
const science = read(paths.science);
const formal = read(paths.formal);
if (priorGate.version !== "v562-orbit-atlas-active-release-gate-v3" || priorGate.releaseGates.standaloneBuild !== true || priorGate.releaseGates.heroSceneBrowser !== true || priorGate.science.transportQualified !== true) throw new Error("v567-prior-gate");
if (runtime.status !== "qualified-lite-overview-visual-scientific-performance-soak-hero-transition-blocked" || runtime.qualification.liteBuild !== true || runtime.qualification.overviewVisualRegression !== true || runtime.qualification.heroVisualRegression !== false || runtime.qualification.visualRegression !== false || runtime.qualification.scientificScenePerformance !== true || runtime.qualification.soak !== true || runtime.qualification.productionPromotionAllowed !== false) throw new Error("v567-runtime-gate");
if (science.status !== "blocked-radiative-measured-dense-gpu-public-promotion" || science.qualification.runtimeReleaseValidation !== false || science.qualification.productionRadiativeTransfer !== false || science.qualification.measuredAuthority !== false || science.qualification.denseCpuAuthority !== false || science.qualification.gpuShadow !== false || science.qualification.publicResearchRelease !== false) throw new Error("v567-science-gate");
if (formal.version !== "v263-current-product-evidence-pointer") throw new Error("v567-formal-pointer");

const sourcePaths = [
  ...Object.values(paths),
  "scripts/build-active-release-gate-v567.mjs",
  "scripts/verify-active-release-gate-v567.mjs",
  "scripts/build-runtime-release-gates-v567.mjs",
  "scripts/verify-runtime-release-gates-v567.mjs",
  "app/lib/atlasRuntimeReleaseQualificationV567.test.ts",
  "app/lib/atlasActiveReleaseGateV567.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, bytes: statSync(resolve(root, path)).size, sha256: fileSha(path) })).sort((left, right) => left.path.localeCompare(right.path));
const unsigned = {
  version: "v567-orbit-atlas-active-release-gate-v1",
  generatedAt: "2026-08-03T05:10:00Z",
  status: "lite-scientific-performance-soak-qualified-hero-visual-regression-blocked",
  activeCandidate: { visual: "v562-visual-candidate-ktx2-first", heroSceneCount: 4, sharedScientificGeometry: true, singleCanvas: true, scienceLinearDisplay: true, cinematicScienceWriteback: false },
  releaseGates: { currentWorktreeRevalidation: true, standaloneBuild: true, liteBuild: true, desktopBrowser: true, mobileBrowser: true, heroSceneBrowser: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, publicPreview: false },
  runtimeQualification: { receiptSha256: runtime.receiptSha256, status: runtime.status, liteBuildId: runtime.liteBuild.buildId, minimumVisualSimilarity: runtime.visualRegression.minimumPerceptualSimilarity, visualComparisonCount: runtime.visualRegression.comparisonCount, overviewVisualRegressionQualified: true, heroVisualRegressionQualified: false, scientificSamples: Object.keys(runtime.scientificPerformance.samples), soakCycles: runtime.soak.cycles, qualified: false },
  scienceAdmission: { receiptSha256: science.receiptSha256, status: science.status, transportQualified: true, radiativeTransferQualified: false, measuredAuthorityGranted: false, denseCpuAuthorityQualified: false, denseCampaignStatus: "incomplete-0-of-49", denseControllerPreflight: science.dense.controllerPreflight, gpuShadowQualified: false, publicResearchRelease: false },
  blocker: { primary: "hero-interaction-transition-not-qualified", radiativeTransfer: "production-radiative-transfer-not-qualified", measured: "ixpe-metadata-identity-conflict", dense: "v313-source-manifest-drift", gpu: "cpu-authority-prerequisites-not-qualified", publicRelease: "runtime-and-science-admission-prerequisites-blocked" },
  boundary: { formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", legacyV9Mutated: false, legacyEih1pnMutated: false, v559EvidenceRewritten: false, priorV562GateRewritten: false, productionPromotionAllowed: false, publicDeploymentAllowed: false, denseRunAllowed: false, gpuRunAllowed: false },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, standaloneBuild: true, liteBuild: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, transportQualified: true, radiativeTransferQualified: false, measuredAuthorityGranted: false, denseCampaign: "0/49", gpuShadowQualified: false, publicResearchRelease: false, formalProductPointer: "v263" }, null, 2));
