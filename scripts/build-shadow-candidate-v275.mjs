import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statfsSync } from "node:fs";
import { freemem } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const PRODUCT_POINTER_PATH = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const VALIDATION_PATH = "dist/science/v271-v275-shadow-light-validation.json";
const BROWSER_DIAGNOSTIC_PATH = "dist/science/v275-shadow-browser-diagnostic-evidence.json";
const SOAK_DIAGNOSTIC_NEGATIVE_PATH = "dist/science/lifecycle-soak-v275-diagnostic-negative-evidence.json";
const SOAK_CORRECTED_PATH = "dist/science/lifecycle-soak-v275-corrected-current-memory-evidence.json";
const PERFORMANCE_DIAGNOSTIC_PATH = "dist/science/performance-v275-diagnostic-evidence.json";
const VISUAL_DIAGNOSTIC_NEGATIVE_PATH = "dist/science/visual-matrix-v275-current-memory-negative-evidence.json";
const VISUAL_MOBILE_CORRECTED_NEGATIVE_PATH = "dist/science/visual-matrix-v275-mobile-corrected-negative-evidence.json";
const FREEZE_COMMIT = "8315160a6f7afd4763e3840c7b6d5bb4da0ca663";
const FREEZE_BRANCH = "codex/orbit-atlas-v241-science-freeze";
const PROTECTED_SCIENCE_SOURCES = [
  "scripts/run-kerr-dense-shards-v8.py",
  "scripts/run-kerr-dense-shards-v6.py",
  "scripts/kerr_finite_observer_separatrix_v8.py",
  "scripts/build-kerr-finite-observer-screen-v8.py",
  "scripts/run-kerr-schild-reference-v5.py",
  "scripts/run-kerr-carter-mino-reference-v6.py",
  "scripts/kerr_observer_frame_v5.py",
];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const sourceHashes = async (paths) => Object.fromEntries(await Promise.all(paths.map(async (path) => [path, await fileSha256(path)])));

const [progress, productPointer, v263, validation, browserDiagnostic, soakDiagnostic, correctedSoak, performanceDiagnostic, visualDiagnostic, visualMobileCorrected, v271Closure, v272Closure] = await Promise.all([
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson(PRODUCT_POINTER_PATH),
  readJson("dist/release/orbit-atlas-v263-local-validation-evidence.json"),
  readJson(VALIDATION_PATH),
  readJson(BROWSER_DIAGNOSTIC_PATH),
  readJson(SOAK_DIAGNOSTIC_NEGATIVE_PATH),
  readJson(SOAK_CORRECTED_PATH),
  readJson(PERFORMANCE_DIAGNOSTIC_PATH),
  readJson(VISUAL_DIAGNOSTIC_NEGATIVE_PATH),
  readJson(VISUAL_MOBILE_CORRECTED_NEGATIVE_PATH),
  readJson("dist/science/gaia-research-v271-closure-evidence.json"),
  readJson("dist/science/gaia-presentation-v272-closure-evidence.json"),
]);
if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) throw new Error("Protected science SHA changed before v271-v275 evidence");
if (validation.status !== "passed-lightweight-shadow-validation") throw new Error("v271-v275 lightweight validation is not passing");
if (browserDiagnostic.status !== "passed-low-memory-diagnostic-browser-matrix-nonqualifying"
  || browserDiagnostic.formalQualificationApplied !== false) {
  throw new Error("v275 diagnostic browser matrix is not passing its non-qualifying boundary");
}
if (soakDiagnostic.status !== "failed-overstrict-webgl-live-identity-diagnostic-no-retry"
  || soakDiagnostic.correctedRunApplied !== false) {
  throw new Error("v275 soak diagnostic negative evidence changed its no-retry boundary");
}
if (performanceDiagnostic.status !== "passed-current-memory-rtx4060-diagnostic-nonqualifying"
  || performanceDiagnostic.formalQualificationApplied !== false) {
  throw new Error("v275 current-memory performance diagnostic is not passing its non-qualifying boundary");
}
if (correctedSoak.status !== "passed-current-memory-corrected-30-cycle-soak-nonqualifying"
  || correctedSoak.explicitCorrectedAttemptApplied !== true) {
  throw new Error("v275 corrected current-memory soak is not passing");
}
if (visualDiagnostic.status !== "failed-mobile-hidden-desktop-launch-route-no-retry"
  || visualDiagnostic.correctedRunApplied !== false) {
  throw new Error("v275 visual diagnostic negative evidence changed its no-retry boundary");
}
if (visualMobileCorrected.status !== "failed-mobile-more-accessible-name-route-no-retry"
  || visualMobileCorrected.nextCorrectedRunApplied !== false) {
  throw new Error("v275 corrected mobile visual negative evidence changed its no-retry boundary");
}
if (productPointer.version !== "v263-current-product-evidence-pointer") throw new Error("Formal product pointer moved away from v263");
if (v263.contracts?.legacyRootAttributes !== 603 || v263.contracts?.evidenceLedgerClaims !== 84) throw new Error("Legacy contract counts changed");
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim();
if (branch !== FREEZE_BRANCH) throw new Error(`Science freeze branch changed: ${branch}`);
const protectedDiff = execFileSync("git", ["diff", "--name-only", FREEZE_COMMIT, "--", ...PROTECTED_SCIENCE_SOURCES], { cwd: ROOT, encoding: "utf8" }).trim();
if (protectedDiff) throw new Error(`Protected science sources differ from freeze: ${protectedDiff}`);

const freeMemoryBytes = freemem();
const disk = statfsSync("E:\\");
const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
const resourcePreflight = {
  checkedAt: new Date().toISOString(),
  freePhysicalMemoryBytes: freeMemoryBytes,
  freePhysicalMemoryGiB: Number((freeMemoryBytes / 2 ** 30).toFixed(2)),
  minimumPhysicalMemoryGiB: 7,
  stabilitySamplesRequired: 18,
  stabilityDurationSeconds: 180,
  stabilityEvidenceStatus: "not-passed-this-run",
  eDriveFreeBytes: freeDiskBytes,
  eDriveFreeGiB: Number((freeDiskBytes / 2 ** 30).toFixed(2)),
  minimumEDriveFreeGiB: 30,
  heavyGateAllowed: false,
};
const heavyStatus = resourcePreflight.heavyGateAllowed ? "not-run-shadow-closure-pending" : "blocked-resource-preflight";
const generatedAt = new Date().toISOString();
const aggregateManifest = "dist/gaia-research-v271/gaia-research-v271.manifest.json";
const catalogManifest = "dist/gaia-dr3-presentation-10000000-v9/manifest.json";
const checkpointRoot = resolve(ROOT, "tools/asset-cache/gaia-dr3-presentation-v272-shards");
const completedShardCount = existsSync(checkpointRoot)
  ? readdirSync(checkpointRoot).filter((name) => name.endsWith(".csv")).length
  : 0;
const v272CheckpointEvidence = "dist/science/gaia-presentation-v272-low-memory-series-negative-evidence.json";
const visualAssetManifest = "dist/science-cinematic-v3-v274-assets/manifest.json";
const v271State = v271Closure.status === "implemented-awaiting-browser-qualification"
  ? "implemented-awaiting-browser-qualification"
  : "blocked";
const v272State = existsSync(resolve(ROOT, catalogManifest))
  && v272Closure.status === "implemented-awaiting-browser-qualification"
  ? "implemented-awaiting-browser-qualification"
  : "incomplete";
const v273State = validation.status === "passed-lightweight-shadow-validation"
  ? "implemented-awaiting-browser-qualification"
  : "blocked";
const v274State = validation.status === "passed-lightweight-shadow-validation" && existsSync(resolve(ROOT, visualAssetManifest))
  ? "implemented-awaiting-browser-qualification"
  : "blocked";
const science = {
  status: "science-failed-shadow-retained",
  defaultKernel: "legacy-eih-1pn",
  codeSha256: progress.codeSha256,
  screenSha256: progress.finiteObserverScreenManifestSha256,
  workerPhysicsMutation: "not-applied",
  eihOnePnMutation: "not-applied",
  kerrMutation: "not-applied",
  campaignRerunApplied: false,
  freezeCommit: FREEZE_COMMIT,
  freezeBranch: FREEZE_BRANCH,
};
const contracts = {
  legacyRootAttributes: v263.contracts.legacyRootAttributes,
  legacyRootKeySha256: v263.contracts.legacyRootKeySha256,
  evidenceLedgerClaims: v263.contracts.evidenceLedgerClaims,
  evidenceLedgerCanonicalSha256: v263.contracts.evidenceLedgerCanonicalSha256,
  singleCanvas: true,
  sceneRevisionSemanticsChanged: false,
  formalProductPointer: "v263",
  formalProductPointerSha256: await fileSha256(PRODUCT_POINTER_PATH),
};
const release = {
  profile: "local-shadow-candidate",
  promotionApplied: false,
  localShadowVisualDefaultApplied: false,
  formalDefaultProfile: "legacy-v9",
  liteDefaultProfile: "legacy-v9",
  gaiaShardDownloadApplied: completedShardCount > 0,
  gaiaCatalogBuildApplied: existsSync(resolve(ROOT, catalogManifest)),
  vercelApplied: false,
  productionApplied: false,
  dnsApplied: false,
  signingApplied: false,
  publicDeploymentBlocked: true,
};
const commonValidation = {
  lightweight: { path: VALIDATION_PATH, sha256: await fileSha256(VALIDATION_PATH), status: validation.status },
  build: {
    diagnosticStatus: "passed-standalone-and-lite-current-memory-nonqualifying",
    formalStatus: heavyStatus,
    formalQualificationApplied: false,
    buildIds: Object.fromEntries(browserDiagnostic.results.map((entry) => [entry.id, entry.buildId])),
  },
  browserMatrix: {
    diagnosticStatus: browserDiagnostic.status,
    formalStatus: heavyStatus,
    formalQualificationApplied: false,
    path: BROWSER_DIAGNOSTIC_PATH,
    sha256: await fileSha256(BROWSER_DIAGNOSTIC_PATH),
    aggregate: browserDiagnostic.aggregate,
  },
  soak: {
    diagnosticStatus: correctedSoak.status,
    formalStatus: heavyStatus,
    resourceStabilityGateDisposition: "user-authorized-current-memory-local-shadow-waiver",
    correctedRunApplied: true,
    path: SOAK_CORRECTED_PATH,
    sha256: await fileSha256(SOAK_CORRECTED_PATH),
    measurements: correctedSoak.measurements,
    priorNegative: { path: SOAK_DIAGNOSTIC_NEGATIVE_PATH, sha256: await fileSha256(SOAK_DIAGNOSTIC_NEGATIVE_PATH) },
  },
  rtx: {
    diagnosticStatus: performanceDiagnostic.status,
    formalStatus: heavyStatus,
    formalQualificationApplied: false,
    path: PERFORMANCE_DIAGNOSTIC_PATH,
    sha256: await fileSha256(PERFORMANCE_DIAGNOSTIC_PATH),
    adapter: performanceDiagnostic.adapter,
    samples: performanceDiagnostic.samples,
  },
  visualMatrix: {
    diagnosticStatus: visualMobileCorrected.status,
    formalStatus: heavyStatus,
    correctedRunApplied: false,
    path: VISUAL_MOBILE_CORRECTED_NEGATIVE_PATH,
    sha256: await fileSha256(VISUAL_MOBILE_CORRECTED_NEGATIVE_PATH),
    frameCount: 24 + visualMobileCorrected.frameCount,
    expectedFrameCount: 48,
    correctedRoutePrepared: visualMobileCorrected.nextCorrectionPrepared,
    priorNegative: { path: VISUAL_DIAGNOSTIC_NEGATIVE_PATH, sha256: await fileSha256(VISUAL_DIAGNOSTIC_NEGATIVE_PATH) },
  },
  resourcePreflight,
};

const phases = [
  {
    phase: "v271",
    output: "dist/science/gaia-research-v271-shadow-evidence.json",
    capabilityState: v271State,
    version: "v271-gaia-research-workbench-shadow-evidence-v1",
    implementation: {
      aggregateManifest: existsSync(resolve(ROOT, aggregateManifest)) ? aggregateManifest : "not-generated-resource-preflight",
      fixedConservation: { scienceRows: 200000, gold: 30028, silver: 169972, motherPresentation: 1066208, motherGaiaId: 1047028, motherWithoutGaiaId: 19180, selectedCube: 199957, rawHrDensity: 159330 },
      queryWorker: "single-long-lived-read-only-worker",
      gaiaSurveyCompleteness: "unavailable",
      sourceHashes: await sourceHashes(["scripts/build-gaia-research-v271.py", "app/lib/gaiaResearchWorkbenchV271.ts", "app/lib/gaiaResearchQueryServiceV271.ts", "app/workers/gaiaResearchQuery.worker.mjs", "app/components/GaiaResearchDensityViewsV267.tsx", "app/components/GaiaResearchDiagnosticsV271.tsx"]),
    },
    boundary: "frozen-200k-derived-research-no-survey-completeness-or-physics",
  },
  {
    phase: "v272",
    output: "dist/science/gaia-presentation-v272-shadow-evidence.json",
    capabilityState: v272State,
    version: "v272-gaia-10m-presentation-shadow-evidence-v1",
    implementation: {
      targetRows: 10000000,
      completedShardCount,
      catalogManifest: existsSync(resolve(ROOT, catalogManifest)) ? catalogManifest : "not-generated-no-esa-request",
      catalogManifestCanonicalSha256: v272Closure.catalog.manifestCanonicalSha256,
      closureEvidence: "dist/science/gaia-presentation-v272-closure-evidence.json",
      closureEvidenceSha256: await fileSha256("dist/science/gaia-presentation-v272-closure-evidence.json"),
      closureEvidenceCanonicalSha256: v272Closure.evidenceSha256,
      fetchMode: "automatic-serial-one-child-per-shard-3-gib-user-override-no-automatic-retry",
      checkpointEvidence: existsSync(resolve(ROOT, v272CheckpointEvidence)) ? v272CheckpointEvidence : "not-generated",
      externalSort: "order3-spool-bounded-runs-k-way-merge",
      liteIsolation: true,
      sourceHashes: await sourceHashes(["scripts/fetch-gaia-presentation-v272.py", "scripts/fetch-gaia-presentation-series-v272.py", "scripts/gaia_presentation_external_sort_v272.py", "scripts/build-gaia-presentation-v272.py", "app/lib/gaiaPresentationLowMemoryV272.ts", "app/lib/gaiaPresentationCatalogV272.ts", "app/workers/gaiaPresentationStream.worker.ts", "app/components/CatalogFaintStarFieldV272.tsx"]),
    },
    boundary: "presentation-catalog-checkpoint-only-not-science-mother-or-completeness",
  },
  {
    phase: "v273",
    output: "dist/science/scale-camera-v273-shadow-evidence.json",
    capabilityState: v273State,
    version: "v273-scale-camera-cache-shadow-evidence-v1",
    implementation: {
      bands: ["solar", "stellar", "galactic", "local-group", "near-universe"],
      orbitMaximums: [2400, 2400, 6000, 12000, 20000],
      cameraPriority: ["scene-handoff", "scale-journey", "focus-lock", "ordinary-orbit"],
      workerCoordinator: "single-cosmic-worker-with-module-readonly-cache",
      cosmicflowsPublicDeploymentBlocked: true,
      sourceHashes: await sourceHashes(["app/lib/atlasCameraPresentationLeaseV273.ts", "app/lib/atlasScalePresentationV273.ts", "app/lib/atlasScaleResourceSnapshotV273.ts", "app/components/AtlasScaleTransitionBridgeV268.tsx", "app/components/AtlasScaleLayerGroupV273.tsx", "app/components/AtlasSceneFocusCameraBridge.tsx", "app/components/CosmicScaleDataLayerV260.tsx", "app/api/atlas/openngc/route.ts"]),
    },
    boundary: "presentation-only-independent-local-origins-no-physics-coordinate-mutation",
  },
  {
    phase: "v274",
    output: "dist/science/science-cinematic-v274-shadow-evidence.json",
    capabilityState: v274State,
    version: "v274-science-cinematic-v3-shadow-evidence-v1",
    implementation: {
      profiles: ["legacy-v9", "science-cinematic-v256", "science-cinematic-v2-v269", "science-cinematic-v3-v274"],
      defaultProfile: "legacy-v9",
      localShadowCandidate: "science-cinematic-v3-v274",
      localShadowDefaultApplied: false,
      presentationGroups: ["sky", "solar", "catalog", "postFx", "hud"],
      assetManifest: existsSync(resolve(ROOT, visualAssetManifest)) ? visualAssetManifest : "not-generated",
      sourceHashes: await sourceHashes(["app/lib/atlasVisualProfileV274.ts", "app/lib/atlasVisualAssetManifestV274.ts", "scripts/build-visual-assets-v274.mjs", "scripts/build-shadow-visual-diagnostic-negative-v275.mjs", "scripts/build-shadow-visual-mobile-corrected-negative-v275.mjs", "playwright.atlas.visual-v275-four-way.config.ts", "playwright.atlas.visual-v275-mobile-corrected.config.ts", "tests/atlas-browser/atlas-visual-v275-four-way.spec.ts", "app/components/AtlasVisualABControlV261.tsx", "app/components/ScienceCinematicVisualSurfaceV261.tsx", "app/components/GalaxyEnvironmentSphere.tsx", "app/components/UniversePmndrsPostProcessing.tsx", "app/globals.css"]),
    },
    boundary: "visual-only-four-way-local-ab-no-default-or-science-promotion",
  },
  {
    phase: "v275",
    output: "dist/science/performance-security-v275-shadow-evidence.json",
    capabilityState: "blocked",
    version: "v275-performance-security-lifecycle-shadow-evidence-v1",
    implementation: {
      boundedApiServices: ["catalog", "science-workbench", "science-record", "cosmicflows", "openngc", "weather", "locations"],
      resourceRegistry: ["owner", "label", "estimatedBytes", "workers", "subscriptions", "objectUrls", "typedArrayCaches", "cameraLeases", "gpuBuffers", "renderTargets"],
      performanceSignals: ["r3f-frame", "raf", "long-task", "gpu-timer-when-available", "gl-info", "estimated-gpu-bytes"],
      contentPackHashing: "streaming-create-read-stream-1-mib-high-water-mark",
      cosmicCacheUnmountRelease: true,
      userTextureObjectUrlAndGpuRelease: true,
      serverQueryWorkerExplicitDispose: true,
      deepSpaceDynamicChunk: true,
      ordinaryResearchStartsRelativityWorker: false,
      permissionsPolicy: "geolocation=(self)",
      nextHydrationUnsafeInlineRetained: true,
      sourceHashes: await sourceHashes(["app/lib/atlasApiPolicyV275.ts", "app/lib/atlasResourceLifecycle.ts", "app/lib/atlasPerformanceRingV275.ts", "app/lib/gaiaScienceRecordQueryServiceV275.ts", "app/context/PlanetUserTextureContext.tsx", "app/components/AtlasAppShell.tsx", "app/components/CosmicScaleDataLayerV260.tsx", "app/components/AtlasRuntimePerformanceProbe.tsx", "app/components/AtlasUniverseSceneRuntime.tsx", "app/components/AtlasDeepSpacePresentationSubtreeV275.tsx", "app/components/GaiaStarField.tsx", "app/components/SatelliteConstellationOverlay.tsx", "scripts/build-content-packs.mjs", "scripts/start-atlas-standalone.mjs", "scripts/verify-shadow-v275-light.mjs", "scripts/build-shadow-browser-diagnostic-v275.mjs", "scripts/build-shadow-soak-diagnostic-negative-v275.mjs", "scripts/build-shadow-soak-corrected-v275.mjs", "scripts/build-shadow-performance-diagnostic-v275.mjs", "scripts/build-webpack-chunk-attribution-v253.mjs", "playwright.atlas.shadow-v275.config.ts", "playwright.atlas.shadow-lite-v275.config.ts", "playwright.atlas.soak-v275-diagnostic.config.ts", "playwright.atlas.soak-v275-corrected.config.ts", "playwright.atlas.performance-v275-diagnostic.config.ts", "tests/atlas-browser/atlas-shadow-v275.spec.ts", "tests/atlas-browser/atlas-shadow-lite-v275.spec.ts", "tests/atlas-browser/atlas-lifecycle-soak-v178.spec.ts", "tests/atlas-browser/atlas-performance-v275-diagnostic.spec.ts", "next.config.mjs"]),
    },
    boundary: "local-shadow-hardening-heavy-qualification-blocked-or-pending-no-release-claim",
  },
];

await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
for (const phase of phases) {
  const document = {
    version: phase.version,
    generatedAt,
    status: `${phase.capabilityState}-${heavyStatus}`,
    capabilityState: phase.capabilityState,
    qualificationApplied: false,
    implementation: phase.implementation,
    validation: commonValidation,
    science,
    contracts,
    release,
    boundary: phase.boundary,
  };
  document.evidenceSha256 = sha256(canonicalJson(document));
  await writeFile(resolve(ROOT, phase.output), `${JSON.stringify(document, null, 2)}\n`);
}
const sources = Object.fromEntries(await Promise.all(phases.map(async ({ phase, output }) => [phase, { path: output, sha256: await fileSha256(output) }])));
const capabilities = Object.fromEntries(phases.map(({ phase, capabilityState }) => [phase, {
  state: capabilityState,
  reason: capabilityState === "incomplete"
    ? phase === "v272" ? `${completedShardCount} verified shards; 10m manifest not built` : "required generated data is not present"
    : phase === "v274"
      ? `desktop visual matrix passed 24/24; authorized mobile correction stopped at 4/24 because the visible More control accessible name did not resolve; structural visible-control correction prepared and unrun`
      : capabilityState === "implemented-awaiting-browser-qualification"
      ? `implementation/light and current-memory diagnostic browser gates passed; formal heavy qualification ${heavyStatus}`
      : phase === "v275"
        ? `current-memory browser/RTX/corrected 30-cycle soak passed under user-authorized resource waiver; v274 visual correction remains unrun; formal heavy qualification ${heavyStatus}`
        : `heavy qualification ${heavyStatus}`,
} ]));
const pointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v275",
  generatedAt,
  status: `partial-local-shadow-${heavyStatus}-formal-product-v263-retained`,
  formalProductPointer: PRODUCT_POINTER_PATH,
  formalProductPointerSha256: await fileSha256(PRODUCT_POINTER_PATH),
  formalProductPointerAdvanced: false,
  promotionApplied: false,
  localShadowVisualDefaultApplied: false,
  sources,
  capabilities,
  diagnosticBrowserMatrix: commonValidation.browserMatrix,
  diagnosticSoak: commonValidation.soak,
  diagnosticPerformance: commonValidation.rtx,
  diagnosticVisualMatrix: commonValidation.visualMatrix,
  priorNegativeEvidence: {
    v264r3: "dist/science/catalog-stream-v264r3-preflight-negative-evidence.json",
    v265: "dist/science/gaia-presentation-v265-negative-evidence.json",
    v266: "dist/science/observation-planner-v266-negative-evidence.json",
    v270: "dist/release/orbit-atlas-current-local-shadow-candidate-v270.json",
    v272LowMemorySeries: v272CheckpointEvidence,
    v275SoakDiagnostic: SOAK_DIAGNOSTIC_NEGATIVE_PATH,
    v275VisualDiagnostic: VISUAL_DIAGNOSTIC_NEGATIVE_PATH,
    v275VisualMobileCorrected: VISUAL_MOBILE_CORRECTED_NEGATIVE_PATH,
  },
  resourcePreflight,
  publicDeploymentBlocked: true,
  science,
  contracts,
};
pointer.pointerSha256 = sha256(canonicalJson(pointer));
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v275.json";
await writeFile(resolve(ROOT, pointerPath), `${JSON.stringify(pointer, null, 2)}\n`);
const dossierPath = "dist/release/orbit-atlas-v275-local-shadow-dossier.md";
await writeFile(resolve(ROOT, dossierPath), `# Orbit Atlas v271-v275 Local Shadow Dossier\n\nGenerated: ${generatedAt}\n\n- Formal product pointer: **v263 retained**.\n- Capability states: **${Object.entries(capabilities).map(([id, value]) => `${id}=${value.state}`).join(", ")}**.\n- Heavy gates: **${heavyStatus}**; user authorized a current-memory local-shadow waiver instead of the 18-sample resource gate; E drive ${resourcePreflight.eDriveFreeGiB} GiB / required 30 GiB.\n- Diagnostic builds/browser: **standalone and Lite passed at current memory, non-qualifying**; machine evidence ${BROWSER_DIAGNOSTIC_PATH}.\n- Diagnostic RTX: **passed on RTX 4060 at current memory, non-qualifying**; machine evidence ${PERFORMANCE_DIAGNOSTIC_PATH}.\n- Corrected 30-cycle soak: **passed at current memory**; prior strict-identity negative remains preserved; machine evidence ${SOAK_CORRECTED_PATH}.\n- Four-way visual matrix: **desktop 24/24 passed; authorized corrected mobile attempt stopped at 4/24** because the visible More control's accessible name did not resolve after exoplanet return. The structural visible-control route is prepared and unrun; negative evidence ${VISUAL_MOBILE_CORRECTED_NEGATIVE_PATH}.\n- Gaia 10m: **${existsSync(resolve(ROOT, catalogManifest)) ? "manifest present but unqualified" : `incomplete (${completedShardCount} verified checkpoint shards; first blocked preflight was not retried)`}**.\n- Visual defaults: **Legacy V9** for formal, Lite and ordinary standalone; v274 is not promoted.\n- Science: **science-failed-shadow-retained**, default **legacy-eih-1pn**, protected code/screen SHA unchanged.\n- Formal production qualification, Vercel, production, DNS, signing and Git publication: **not applied**.\n`);
console.log(JSON.stringify({ pointer: pointerPath, pointerSha256: pointer.pointerSha256, status: pointer.status, heavyStatus, capabilities }, null, 2));
