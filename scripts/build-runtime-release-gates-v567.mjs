import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const runtimeOutput = "dist/release/atlas-runtime-release-qualification-v567.json";
const scienceOutput = "dist/release/atlas-science-admission-v567.json";
const transient = new Set(["generatedAt", "receiptSha256", "artifactSha256", "evidenceSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const sourceManifest = (paths) => [...new Set(paths)].map((path) => ({
  path,
  bytes: statSync(resolve(root, path)).size,
  sha256: fileSha(path),
})).sort((left, right) => left.path.localeCompare(right.path));
const writeArtifact = (path, artifact) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

async function imageEvidence(id, baseline, candidate, expectedWidth, expectedHeight) {
  const [baselineMetadata, candidateMetadata, baselinePixels, candidatePixels] = await Promise.all([
    sharp(resolve(root, baseline)).metadata(),
    sharp(resolve(root, candidate)).metadata(),
    sharp(resolve(root, baseline)).resize(96, 60, { fit: "fill" }).removeAlpha().raw().toBuffer(),
    sharp(resolve(root, candidate)).resize(96, 60, { fit: "fill" }).removeAlpha().raw().toBuffer(),
  ]);
  if (baselineMetadata.width !== expectedWidth || baselineMetadata.height !== expectedHeight || candidateMetadata.width !== expectedWidth || candidateMetadata.height !== expectedHeight) {
    throw new Error(`v567-visual-dimensions:${id}`);
  }
  let absoluteDifference = 0;
  for (let index = 0; index < baselinePixels.length; index += 1) absoluteDifference += Math.abs(baselinePixels[index] - candidatePixels[index]);
  const similarity = 1 - absoluteDifference / Math.max(1, baselinePixels.length * 255);
  return {
    id,
    viewport: { width: expectedWidth, height: expectedHeight },
    baseline: { path: baseline, bytes: statSync(resolve(root, baseline)).size, sha256: fileSha(baseline) },
    candidate: { path: candidate, bytes: statSync(resolve(root, candidate)).size, sha256: fileSha(candidate) },
    perceptualSimilarity: similarity,
  };
}

const runtimeRawPath = "dist/release/atlas-browser-runtime-observation-v567.raw.json";
const heroRawPath = "dist/release/atlas-hero-visual-regression-observation-v567.raw.json";
const liteBuildPath = "dist/release/atlas-lite-build-resource-v562.json";
const browserPath = "dist/release/atlas-browser-qualification-v562.json";
const visualPath = "dist/science/atlas-visual-candidate-v562/manifest.json";
const runtimeRaw = read(runtimeRawPath);
const heroRaw = read(heroRawPath);
const liteBuild = read(liteBuildPath);
const browser = read(browserPath);
const visual = read(visualPath);
if (runtimeRaw.version !== "v567-atlas-browser-runtime-observation-v1" || runtimeRaw.browserSurface !== "Codex In-app Browser") throw new Error("v567-runtime-observation");
if (heroRaw.version !== "v567-atlas-hero-visual-regression-observation-v1" || heroRaw.browserSurface !== "Codex In-app Browser") throw new Error("v567-hero-observation");
if (liteBuild.status !== "passed" || liteBuild.profile !== "vercel-lite" || liteBuild.distDir !== ".next-atlas-lite-current" || liteBuild.heapMb !== 8192 || liteBuild.standaloneTopologyQualified !== true || liteBuild.rollbackSlotAvailable !== true) throw new Error("v567-lite-build");
if (browser.qualification?.hardwareRenderer !== true || browser.qualification?.singleCanvas !== true || browser.qualification?.consoleErrorsZero !== true) throw new Error("v567-hardware-browser");
if (visual.status !== "candidate-qualified-history-immutable" || visual.boundary?.historicalEvidenceRewritten !== false) throw new Error("v567-visual-candidate");

for (const viewport of [runtimeRaw.lite.desktop, runtimeRaw.lite.mobile]) {
  if (viewport.deliveryProfile !== "vercel-lite" || viewport.millionCatalog !== "disabled" || viewport.fullObservations !== "disabled" || viewport.sceneMode !== "atlas" || viewport.canvasCount !== 1 || viewport.overflow !== 0 || viewport.frameSamples < 241 || viewport.medianFps < 55 || viewport.frameP95Ms > 50) throw new Error("v567-lite-browser");
}
if (!Array.isArray(runtimeRaw.lite.pageLogs) || runtimeRaw.lite.pageLogs.length !== 0) throw new Error("v567-lite-logs");

const mainPairs = [
  ["overview-desktop", "output/playwright/orbit-atlas-final-desktop-iab-1440x900.jpg", "output/playwright/orbit-atlas-v567-visual-regression-desktop-iab-1440x900.jpg", 1440, 900],
  ["overview-mobile", "output/playwright/orbit-atlas-final-mobile-iab-390x844.jpg", "output/playwright/orbit-atlas-v567-visual-regression-mobile-iab-390x844.jpg", 390, 844],
];
const heroPairs = heroRaw.captures.map((capture) => [capture.id, capture.baseline, capture.candidate, capture.id.startsWith("mobile-") ? 390 : 1440, capture.id.startsWith("mobile-") ? 844 : 900]);
const comparisons = await Promise.all([...mainPairs, ...heroPairs].map((entry) => imageEvidence(...entry)));
const perceptualSimilarityFloor = 0.94;
if (comparisons.some((entry) => entry.perceptualSimilarity < perceptualSimilarityFloor)) throw new Error("v567-visual-regression");
const heroObservation = heroRaw.observation;
if (heroObservation.sceneIds.length !== 4 || heroObservation.observedSceneIds.length !== 1 || heroObservation.observedSceneIds[0] !== "kerr-volume-disk" || heroObservation.scienceObserved !== true || heroObservation.cinematicObserved !== false || heroObservation.sharedGeometry !== true || heroObservation.cinematicWriteback !== false || heroObservation.canvasCount !== 0 || heroObservation.svgCount !== 1 || heroObservation.desktopOverflow !== 0 || heroObservation.mobileOverflow !== 0 || heroObservation.pageLogs.length !== 0) throw new Error("v567-hero-boundary");
const heroInteractionTransitionQualified = heroObservation.hydrated === true && heroObservation.sceneTransitionsQualified === true && heroObservation.modeTransitionsQualified === true;

const samples = runtimeRaw.scientificPerformance.samples;
const expectedModes = { earth: "inspect", gaia: "inspect", launch: "launch", kerr: "kerr" };
for (const [id, sample] of Object.entries(samples)) {
  if (sample.sceneMode !== expectedModes[id] || sample.canvasCount !== 1 || sample.overflow !== 0 || sample.frameSamples < 241 || sample.medianFps < 45 || sample.frameP95Ms > 50) throw new Error(`v567-scientific-performance:${id}`);
}
const baselineResources = runtimeRaw.scientificPerformance.baseline.resources;
if (JSON.stringify(runtimeRaw.scientificPerformance.released.resources) !== JSON.stringify(baselineResources) || runtimeRaw.scientificPerformance.pageLogs.length !== 0) throw new Error("v567-scientific-release");

const soak = runtimeRaw.soak;
const heapSeries = soak.observations.map((entry) => entry.heapUsedSize);
const heapStrictlyGrowing = heapSeries.length > 1 && heapSeries.every((value, index) => index === 0 || value >= heapSeries[index - 1]) && heapSeries.at(-1) > heapSeries[0];
const resourcesReturnedEveryCycle = soak.observations.every((entry) => JSON.stringify(entry.released) === JSON.stringify(soak.baselineResources));
const finalHeapBelowBaseline = heapSeries.at(-1) <= soak.baselineHeap.usedSize;
if (soak.cycles !== 10 || soak.observations.length !== 10 || !resourcesReturnedEveryCycle || heapStrictlyGrowing || !finalHeapBelowBaseline || soak.pageLogs.length !== 0) throw new Error("v567-soak");

const runtimeSources = sourceManifest([
  runtimeRawPath,
  heroRawPath,
  liteBuildPath,
  browserPath,
  visualPath,
  "scripts/build-atlas-profile.mjs",
  "scripts/build-runtime-release-gates-v567.mjs",
  "scripts/verify-runtime-release-gates-v567.mjs",
  "app/components/OrbitAtlasHeroScenesV562.tsx",
  "app/components/OrbitAtlasHeroScenesV562.test.tsx",
  ...runtimeRaw.lite.desktop.screenshot ? [runtimeRaw.lite.desktop.screenshot] : [],
  ...runtimeRaw.lite.mobile.screenshot ? [runtimeRaw.lite.mobile.screenshot] : [],
  ...comparisons.flatMap((entry) => [entry.baseline.path, entry.candidate.path]),
]);
const runtimeUnsigned = {
  version: "v567-atlas-runtime-release-qualification-v1",
  generatedAt: "2026-08-03T05:00:00Z",
  status: "qualified-lite-overview-visual-scientific-performance-soak-hero-transition-blocked",
  browserSurface: "Codex In-app Browser",
  hardware: { renderer: browser.observations.desktop.adapter.renderer, vendor: browser.observations.desktop.adapter.vendor, softwareRenderer: false },
  liteBuild: { qualified: true, profile: liteBuild.profile, distDir: liteBuild.distDir, heapMb: liteBuild.heapMb, buildId: bytes(`${liteBuild.distDir}/BUILD_ID`).toString("utf8").trim(), rollbackSlotAvailable: true, desktop: runtimeRaw.lite.desktop, mobile: runtimeRaw.lite.mobile },
  visualRegression: { qualified: false, overviewQualified: true, heroScreenshotSimilarityQualified: true, heroInteractionTransitionQualified, baseline: "sealed-v562-built-in-browser-captures", automaticBaselineReplacement: false, perceptualSimilarityFloor, comparisonCount: comparisons.length, minimumPerceptualSimilarity: Math.min(...comparisons.map((entry) => entry.perceptualSimilarity)), comparisons },
  scientificPerformance: { qualified: true, threshold: { medianFpsMin: 45, frameP95MsMax: 50, minimumFrameSamples: 241 }, samples, resourcesReturned: true, pageLogs: [] },
  soak: { qualified: true, type: soak.type, cycles: soak.cycles, resourcesReturnedEveryCycle, baselineHeapUsedSize: soak.baselineHeap.usedSize, finalHeapUsedSize: heapSeries.at(-1), peakHeapUsedSize: Math.max(...heapSeries), heapStrictlyGrowing, finalHeapBelowBaseline, pageLogs: [] },
  qualification: { liteBuild: true, liteDesktopMobile: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, productionPromotionAllowed: false },
  boundary: { formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", measuredAuthorityGranted: false, denseCampaignStatus: "incomplete-0-of-49", gpuShadowRun: false, publicDeploymentAllowed: false },
  sourceManifest: runtimeSources,
  sourceSha256: canonicalSha(runtimeSources),
};
const runtimeArtifact = { ...runtimeUnsigned, receiptSha256: canonicalSha(runtimeUnsigned) };
writeArtifact(runtimeOutput, runtimeArtifact);

const radiativePath = "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json";
const metadataPath = "dist/science/ixpe-metadata-probe-v563/metadata-probe.json";
const intakePath = "dist/science/ixpe-measured-intake-v562/intake.json";
const densePath = "dist/science/kerr-campaign-v314/campaign-state.json";
const envelopePath = "dist/science/kerr-reference-v313/portable-envelope.json";
const enginePath = "dist/science/orbit-relativity-engine-v561/import-manifest.json";
const liveMetadataPath = "../../orbit-relativity-engine/dist/metadata-live-v567/metadata-probe.json";
const liveMetadataManifestPath = "../../orbit-relativity-engine/examples/ixpe-cyg-x1-metadata-v563.json";
const radiative = read(radiativePath);
const metadata = read(metadataPath);
const intake = read(intakePath);
const dense = read(densePath);
const envelope = read(envelopePath);
const engine = read(enginePath);
const liveMetadata = read(liveMetadataPath);
const drift = envelope.sourceManifest.map((entry) => ({ path: entry.path, expectedSha256: entry.sha256, actualSha256: fileSha(entry.path) })).filter((entry) => entry.expectedSha256 !== entry.actualSha256);
if (radiative.qualification?.productionRadiativeTransferQualified !== false || radiative.boundary?.productionRadiativeTransferAllowed !== false || metadata.status !== "blocked-metadata-identity-conflict" || metadata.qualification?.measuredAuthorityGranted !== false || intake.qualification?.measuredAuthorityGranted !== false || liveMetadata.status !== "blocked-metadata-identity-conflict" || liveMetadata.networkAttempted !== true || liveMetadata.payloadRead !== false || liveMetadata.automaticRetry !== false || liveMetadata.automaticTargetReplacement !== false || liveMetadata.measuredAuthorityGranted !== false || liveMetadata.sources?.length !== 2 || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || engine.qualification?.measuredAuthority !== false || drift.length !== 2) throw new Error("v567-science-admission-boundary");
const scienceSources = sourceManifest([
  radiativePath,
  metadataPath,
  intakePath,
  densePath,
  envelopePath,
  enginePath,
  liveMetadataPath,
  liveMetadataManifestPath,
  "scripts/run-kerr-dense-campaign-v314.py",
  "scripts/build-runtime-release-gates-v567.mjs",
  "scripts/verify-runtime-release-gates-v567.mjs",
  ...drift.map((entry) => entry.path),
]);
const scienceUnsigned = {
  version: "v567-atlas-science-admission-v1",
  generatedAt: "2026-08-03T05:00:00Z",
  status: "blocked-radiative-measured-dense-gpu-public-promotion",
  transport: { qualified: true, authority: "cpu-float64-sparse-kerr-polarization" },
  radiativeTransfer: { invariantFixtureQualified: true, productionQualified: false, status: radiative.status, reason: "engine-and-v466-production-transfer-remain-explicitly-blocked" },
  measuredAuthority: { granted: false, metadataStatus: metadata.status, currentProbeStatus: liveMetadata.status, currentProbeSha256: liveMetadata.artifactSha256, sourceStatuses: liveMetadata.sources.map((entry) => ({ id: entry.id, status: entry.status, httpStatus: entry.httpStatus ?? null })), payloadRead: false, automaticRetry: false, intakeStatus: intake.status, reason: "ixpe-metadata-identity-conflict-and-public-package-missing" },
  dense: { executed: false, status: dense.status, completedShardCount: 0, plannedShardCount: 49, controllerPreflight: "blocked-v313-source-manifest-drift", stateMutationApplied: false, sourceDrift: drift },
  gpuShadow: { executed: false, qualified: false, reason: "radiative-transfer-and-dense-cpu-authority-prerequisites-not-qualified" },
  publicRelease: { deployed: false, previewAuthorized: false, runtimeReleaseValidationQualified: false, scienceResearchPromotionAllowed: false, reason: "hero-visual-transition-and-science-admission-prerequisites-blocked" },
  qualification: { runtimeReleaseValidation: false, productionRadiativeTransfer: false, measuredAuthority: false, denseCpuAuthority: false, gpuShadow: false, publicResearchRelease: false },
  boundary: { formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", historicalEvidenceRewritten: false, denseStateMutated: false, gpuRun: false, metadataNetworkAttempted: true, sciencePayloadNetworkAttempted: false, productionDeploymentAttempted: false },
  sourceManifest: scienceSources,
  sourceSha256: canonicalSha(scienceSources),
};
const scienceArtifact = { ...scienceUnsigned, receiptSha256: canonicalSha(scienceUnsigned) };
writeArtifact(scienceOutput, scienceArtifact);

console.log(JSON.stringify({
  status: runtimeArtifact.status,
  runtimeReceiptSha256: runtimeArtifact.receiptSha256,
  liteBuild: true,
  overviewVisualRegression: true,
  heroVisualRegression: false,
  visualRegression: false,
  scientificPerformance: true,
  soak: true,
  minimumVisualSimilarity: runtimeArtifact.visualRegression.minimumPerceptualSimilarity,
  scienceAdmissionStatus: scienceArtifact.status,
  scienceReceiptSha256: scienceArtifact.receiptSha256,
  dense: "0/49-source-manifest-drift",
  measuredAuthorityGranted: false,
  gpuShadowQualified: false,
  publicResearchRelease: false,
}, null, 2));
