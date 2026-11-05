import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = "dist/release/orbit-atlas-active-release-gate-v562.json";
const paths = Object.freeze({
  visual: "dist/science/atlas-visual-candidate-v562/manifest.json",
  revalidation: "dist/science/orbit-atlas-current-worktree-revalidation-v561.json",
  engine: "dist/science/orbit-relativity-engine-v561/import-manifest.json",
  transport: "dist/science/orbit-relativity-engine-v561/transport-verification-receipt.json",
  intake: "dist/science/ixpe-measured-intake-v562/intake.json",
  metadata: "dist/science/ixpe-metadata-probe-v563/metadata-probe.json",
  build: "dist/release/atlas-build-resource-v562.json",
  browser: "dist/release/atlas-browser-qualification-v562.json",
  heroBrowser: "dist/release/atlas-hero-browser-qualification-v562.json",
  historicalVisualAudit: "dist/release/atlas-historical-visual-audit-v562.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "manifestSha256", "resultSha256", "receiptSha256", "evidenceSha256", "pointerSha256", "capabilitySha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const visual = read(paths.visual);
const revalidation = read(paths.revalidation);
const engine = read(paths.engine);
const transport = read(paths.transport);
const intake = read(paths.intake);
const metadata = read(paths.metadata);
const build = read(paths.build);
const browser = read(paths.browser);
const heroBrowser = read(paths.heroBrowser);
const historicalVisualAudit = read(paths.historicalVisualAudit);
const dense = read(paths.dense);
const formal = read(paths.formal);
if (visual.status !== "candidate-qualified-history-immutable" || visual.conversion?.ktx2Primary !== true || visual.boundary?.historicalEvidenceRewritten !== false) throw new Error("v562-active-visual");
if (revalidation.currentWorktree?.sourceAudit?.mismatchCount !== 0 || revalidation.historicalDrift?.historicalEvidenceMutated !== false) throw new Error("v562-active-revalidation");
if (engine.boundary?.transportStatus !== "qualified-cpu-kerr-walker-penrose-independent-parallel-transport" || engine.qualification?.measuredAuthority !== false) throw new Error("v562-active-engine");
if (transport.status !== "passed-walker-penrose-independent-parallel-transport" || transport.measuredAuthority !== false) throw new Error("v562-active-transport");
if (intake.qualification?.measuredAuthorityGranted !== false || metadata.probe?.payloadRead !== false || metadata.qualification?.measuredAuthorityGranted !== false) throw new Error("v562-active-measured-boundary");
if (build.status !== "passed" || build.heapMb !== 8192 || build.standaloneTopologyQualified !== true || build.rollbackSlotAvailable !== true || build.routeOverlayDirectoryCount < 257 || build.browserStarted !== false || build.denseStarted !== false || build.gpuStarted !== false) throw new Error("v562-active-build-boundary");
if (browser.status !== "passed-standalone-desktop-mobile-visual-regression-pending" || browser.qualification?.desktopBrowser !== true || browser.qualification?.mobileBrowser !== true || browser.qualification?.hardwareRenderer !== true || browser.qualification?.singleCanvas !== true || browser.qualification?.consoleErrorsZero !== true || browser.qualification?.pageErrorsZero !== true || browser.qualification?.rendererErrorsZero !== true || browser.qualification?.resourceLifecycleReturned !== true || browser.qualification?.overviewPerformanceQualified !== true || browser.qualification?.visualRegressionQualified !== false || browser.qualification?.scientificScenePerformanceQualified !== false || browser.qualification?.soakQualified !== false || browser.boundary?.productionPromotionAllowed !== false) throw new Error("v562-active-browser-boundary");
if (heroBrowser.status !== "passed-interaction-screenshot-visual-regression-performance-pending" || heroBrowser.desktop?.uniqueSceneCount !== 4 || heroBrowser.qualification?.heroSceneInteractionQualified !== true || heroBrowser.qualification?.desktopScreenshotQualified !== true || heroBrowser.qualification?.mobileScreenshotQualified !== true || heroBrowser.qualification?.scienceCinematicBoundaryQualified !== true || heroBrowser.qualification?.visualRegressionQualified !== false || heroBrowser.qualification?.scientificScenePerformanceQualified !== false || heroBrowser.qualification?.productionPromotionAllowed !== false) throw new Error("v562-active-hero-browser-boundary");
if (historicalVisualAudit.status !== "passed-expected-historical-negative-evidence" || historicalVisualAudit.observedFailureCount !== 3 || historicalVisualAudit.historicalEvidenceRewritten !== false || historicalVisualAudit.historicalAssetsRestored !== false) throw new Error("v562-active-historical-visual-audit");
if (dense.status !== "incomplete-0-of-49" || formal.version !== "v263-current-product-evidence-pointer") throw new Error("v562-active-frozen-boundary");

const sourcePaths = [
  ...Object.values(paths),
  "proxy.ts",
  "app/lib/atlasProxyContractV562.ts",
  "app/lib/atlasProxyContractV562.test.ts",
  "app/components/OrbitAtlasHeroScenesV562.tsx",
  "app/components/OrbitAtlasHeroScenesV562.test.tsx",
  "scripts/build-atlas-profile.mjs",
  "next.config.mjs",
  "app/components/RelativityResearchWorkbenchReleaseBoundaryV564.tsx",
  "app/lib/atlasBuildRouteOverlayV564.test.ts",
  "app/lib/atlasNextDevWatchOptionsV566.test.ts",
  "app/lib/kerrSpectralEnvelopeV356.ts",
  "app/lib/sha256BrowserV566.ts",
  "app/lib/sha256BrowserV566.test.ts",
  "app/api/atlas/content-packs/[pack]/files/[...path]/route.ts",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/data/planetTextureManifest.ts",
  "app/lib/atlasBrowserQualificationV562.test.ts",
  "app/lib/atlasHeroBrowserQualificationV562.test.ts",
  "app/lib/atlasContentPackServerV3.ts",
  "app/lib/atlasVisualRuntimeCandidateV562.ts",
  "app/lib/planetAlbedoUrl.ts",
  "scripts/build-visual-candidate-v562.mjs",
  "scripts/verify-visual-candidate-v562.mjs",
  "scripts/build-browser-qualification-v562.mjs",
  "scripts/verify-browser-qualification-v562.mjs",
  "scripts/build-hero-browser-qualification-v562.mjs",
  "scripts/verify-hero-browser-qualification-v562.mjs",
  "scripts/run-atlas-historical-visual-audit-v562.mjs",
  "scripts/run-atlas-current-focused-v562.mjs",
  "scripts/build-active-release-gate-v562.mjs",
  "scripts/verify-active-release-gate-v562.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, bytes: statSync(resolve(root, path)).size, sha256: fileSha(path) })).sort((left, right) => left.path.localeCompare(right.path));
const unsigned = {
  version: "v562-orbit-atlas-active-release-gate-v3",
  generatedAt: "2026-08-03T00:00:00Z",
  status: "active-candidate-science-art-transport-build-browser-qualified-visual-regression-pending",
  activeCandidate: { visual: "v562-visual-candidate-ktx2-first", visualManifestSha256: visual.manifestSha256, heroSceneCount: 4, heroSceneIds: ["kerr-volume-disk", "photon-ring-lensing", "polarization-field", "science-cinematic-ab"], sharedScientificGeometry: true, singleCanvas: true, scienceLinearDisplay: true, cinematicScienceWriteback: false },
  science: { revalidationSha256: revalidation.artifactSha256, engineImportSha256: engine.artifactSha256, transportReceiptSha256: transport.receiptSha256, transportQualified: true, radiativeTransferQualified: false, measuredAuthorityGranted: false, denseCampaignStatus: "incomplete-0-of-49", gpuShadowRun: false },
  measuredLane: { target: "Cyg X-1", intakeStatus: intake.status, metadataStatus: metadata.status, metadataOnly: true, payloadRead: false, automaticRetry: false, automaticTargetReplacement: false, measuredAuthorityGranted: false },
  releaseGates: { currentWorktreeRevalidation: true, visualCandidate: true, proxyContract: true, sparseKerrTransport: true, metadataProbeContract: true, standaloneBuild: true, liteBuild: false, desktopBrowser: true, mobileBrowser: true, heroSceneBrowser: true, visualRegression: false, scientificScenePerformance: false, soak: false, publicPreview: false },
  buildGate: { status: "qualified", profile: build.profile, heapMb: build.heapMb, lowMemoryMode: build.lowMemoryMode, routeOverlayDirectoryCount: build.routeOverlayDirectoryCount, versionedEvidenceDirectoryCount: build.routeOverlayVersionedEvidenceDirectoryCount, standaloneTopologyQualified: build.standaloneTopologyQualified, rollbackSlotAvailable: build.rollbackSlotAvailable, browserStarted: false, denseStarted: false, gpuStarted: false },
  browserGate: { status: "qualified-overview-only", receiptSha256: browser.receiptSha256, buildId: browser.build.id, desktop: { width: 1440, height: 900, medianFps: browser.observations.desktop.medianFps, frameP95Ms: browser.observations.desktop.frameP95Ms, captureSha256: browser.observations.desktop.capture.sha256 }, mobile: { width: 390, height: 844, medianFps: browser.observations.mobile.medianFps, frameP95Ms: browser.observations.mobile.frameP95Ms, captureSha256: browser.observations.mobile.capture.sha256 }, consoleErrors: 0, pageErrors: 0, rendererErrors: 0, canvasCount: 1, hardwareRenderer: true, resourcesReturned: true, visualRegressionQualified: false, scientificScenePerformanceQualified: false, soakQualified: false },
  heroSceneBrowserGate: { status: "interaction-screenshots-qualified", receiptSha256: heroBrowser.receiptSha256, heroSceneCount: 4, captureCount: heroBrowser.captures.length, desktopQualified: true, mobileQualified: true, scienceCinematicBoundaryQualified: true, additionalCanvasCount: 0, browserErrors: 0, visualRegressionQualified: false, scientificScenePerformanceQualified: false },
  blocker: null,
  boundary: { formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", legacyV9Mutated: false, legacyEih1pnMutated: false, v559EvidenceRewritten: false, historicalVisualAudit: "expected-negative-evidence-3-of-3", productionPromotionAllowed: false, publicDeploymentAllowed: false, denseRunAllowed: false, gpuRunAllowed: false },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const partial = `${target}.${process.pid}.part`;
writeFileSync(partial, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
renameSync(partial, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, heroScenes: 4, transportQualified: true, measuredAuthorityGranted: false, build: "qualified-standalone-8192MiB", browser: "desktop-mobile-overview-qualified", visualRegression: "pending", formalProductPointer: "v263", denseCampaign: "0/49" }, null, 2));
