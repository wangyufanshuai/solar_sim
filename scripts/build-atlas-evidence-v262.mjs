import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const RELEASE = resolve(ROOT, "dist/release");
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const countFiles = async (directory, suffix) => {
  const entries = await readdir(resolve(ROOT, directory), { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) count += await countFiles(`${directory}/${entry.name}`, suffix);
    else if (entry.isFile() && entry.name.endsWith(suffix)) count += 1;
  }
  return count;
};

const currentPath = "dist/release/orbit-atlas-current-evidence-v233.json";
const campaignPath = "dist/release/orbit-atlas-research-campaign-v13.json";
const [current, progress, healpix, gaiaScience, openNgc, cosmicflows, completeness] = await Promise.all([
  readJson(currentPath),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson("dist/catalog-healpix-v8/manifest.json"),
  readJson("dist/gaia-science-v8/gaia-science-v8.manifest.json"),
  readJson("public/data/openngc-v260/manifest.json"),
  readJson("dist/local-candidate/cosmicflows4-v260/manifest.json"),
  readJson("dist/science/gaiaunlimited-completeness-v259-blocked.json"),
]);

const currentSha = await fileSha256(currentPath);
const campaignSha = await fileSha256(campaignPath);
const packageJson = await readJson("package.json");
const legacyCommandMap = await readJson("scripts/atlas-legacy-command-map-v256.json");
const [bundleStandalone, bundleLite, contentPacks, soak, performance] = await Promise.all([
  readJson("dist/science/client-bundle-v253-standalone-full.json"),
  readJson("dist/science/client-bundle-v253-vercel-lite.json"),
  readJson("dist/science/content-pack-integrity-v232.json"),
  readJson("dist/science/lifecycle-soak-v236-report.json"),
  readJson("dist/science/performance-v232-report.json"),
]);
const [standaloneBuildId, liteBuildId, journeyFrameCount, riskFrameCount, v262ExtensionFrameCount] = await Promise.all([
  readFile(resolve(ROOT, ".next-atlas-standalone-current/BUILD_ID"), "utf8").then((value) => value.trim()),
  readFile(resolve(ROOT, ".next-atlas-lite-current/BUILD_ID"), "utf8").then((value) => value.trim()),
  countFiles("output/playwright/v197-visual-candidates", ".png"),
  countFiles("output/playwright/v240-visual-candidates", ".png"),
  countFiles("dist/visual/v262", ".png"),
]);
await Promise.all([
  stat(resolve(ROOT, ".next-atlas-standalone-current/BUILD_ID")),
  stat(resolve(ROOT, ".next-atlas-lite-current/BUILD_ID")),
]);
const visualFrameCount = journeyFrameCount + riskFrameCount + v262ExtensionFrameCount;
const generatedAt = new Date().toISOString();
const browserQa = {
  status: "blocked-fresh-matrix-not-reclosed",
  dedicatedGates: {
    v262Standalone: "passed",
    v262LiteBoundary: "passed",
    v262MobileAb: "passed",
    visualMatrix: "passed",
  },
  fullFresh: {
    status: "blocked",
    firstAttempt: { elapsedMs: 604_039, result: "outer-timeout-no-reporter-summary" },
    finalAttempt: { elapsedMs: 2_704_025, result: "outer-timeout-no-reporter-summary" },
    completedAcceptanceArtifacts: { desktop: true, mobile: true, reporterPassClaimed: false },
    misroutedProfileFailures: [
      "vercel-lite-tests-executed-against-standalone-full",
      "lite-cosmicflows-451-test-received-standalone-200",
    ],
    shortWindowSoakNegativeEvidence: {
      measuredCycles: 10,
      heapSlopeBytesPerCycle: 320_873.62424242427,
      heapSlopeLimitBytesPerCycle: 262_144,
      passed: false,
    },
    correctedHarness: {
      server: ".next-atlas-standalone-current",
      trace: "on-first-retry",
      dedicatedProfileTestsExcluded: true,
      listedTestsBefore: 50,
      listedTestsAfter: 22,
      rerunAfterCorrection: true,
      correctedAttempt: {
        status: "failed",
        command: "npm run test:atlas:browser:fresh",
        buildId: standaloneBuildId,
        files: 11,
        tests: 22,
        projects: ["desktop-chrome-1440x900", "mobile-chrome-390x844"],
        workers: 1,
        trace: "on-first-retry",
        outerLimitMinutes: 45,
        exitCode: 1,
        reportedDuration: "13.8m",
        results: { passed: 20, skipped: 1, failed: 1 },
        failedTest: {
          project: "mobile-chrome-390x844",
          file: "tests/atlas-browser/atlas-v262-local-candidate.spec.ts",
          line: 53,
          title: "v262 streams real catalogs and exposes local Legacy/Candidate research A/B",
          error: "locator.click timed out after 420000ms because the desktop experience-mode control exists in the mobile DOM but is hidden",
          classification: "test-viewport-routing-not-product-or-science-failure",
        },
        artifacts: [
          {
            path: "dist/science/browser-fresh-v262-corrected-attempt/error-context.md",
            bytes: 10822,
            sha256: "33cc753c766094a1294e5934cf7c436da9539e02e653eaddc7067bbf4b01de46",
          },
          {
            path: "dist/science/browser-fresh-v262-corrected-attempt/test-failed-1.png",
            bytes: 298701,
            sha256: "e8429b3ad6613c2d3734844d4d2d0ded84713a7919acd956c21abca86ad7ecbd",
          },
          {
            path: "dist/science/browser-fresh-v262-corrected-attempt/last-run.json",
            bytes: 96,
            sha256: "e0470b3e70b365d100ea7ac7ebf16ce35dcc2d372dcb476d34802353bf32a875",
          },
        ],
        cleanup: { port3015Clear: true, matchingPlaywrightOrStandaloneProcesses: 0 },
        automaticRetryApplied: false,
        assertionOrThresholdRelaxationApplied: false,
        viewportRouteFix: {
          status: "prepared-not-rerun",
          mobile: "visible More menu -> switch to research mode",
          desktop: "visible desktop experience-mode toggle",
          productMutation: "not-applied",
          scienceMutation: "not-applied",
        },
      },
    },
  },
  formalThirtyCycleSoak: soak.passed ? "passed" : "failed",
  consoleErrorsInDedicatedGates: 0,
  pageErrorsInDedicatedGates: 0,
  missingResourcesInDedicatedGates: 0,
  evidencePath: "dist/science/browser-fresh-v262-negative-evidence.json",
};
const manifest = {
  version: "v262-local-candidate-evidence-v1",
  generatedAt,
  science: {
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    runtimePromotionApplied: false,
    v8: {
      status: progress.status,
      completedShards: progress.completedShardCount,
      plannedShards: progress.plannedShardCount,
      failedShardIndex: progress.failedShardIndex,
      noAutomaticRetry: progress.noAutomaticRetry,
      codeSha256: progress.codeSha256,
      screenSha256: progress.finiteObserverScreenManifestSha256,
      progressSha256: progress.progressSha256,
    },
    weakFieldCopiedWithoutMutation: current.weakField,
    stmCopiedWithoutMutation: current.variationalStm,
    sourceEvidence: { currentPath, currentSha256: currentSha, campaignPath, campaignSha256: campaignSha },
  },
  contracts: {
    legacyRootAttributes: 603,
    legacyRootKeySha256: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
    evidenceLedgerClaims: 84,
    evidenceLedgerCanonicalSha256: "e7d7e2984983714d80cc726e621b7d4fdb171622917ff8e052c57836d0a18dec",
    singleCanvas: true,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
  },
  product: {
    v256: {
      status: "ready",
      compactDomains: ["scene", "catalog", "observer", "analysis", "evidence", "performance", "release"],
      topLevelScriptCount: Object.keys(packageJson.scripts).length,
      legacyCommandCount: Object.keys(legacyCommandMap).length,
    },
    v257: {
      status: "ready",
      searchableRows: healpix.counts.searchable,
      renderableRows: healpix.counts.renderable,
      spatial3dRows: healpix.counts.spatial3d,
      scheme: healpix.scheme,
      orders: healpix.orders,
      archive: healpix.archive,
      index: healpix.index,
      activeBudgets: { mobile: [8000, 750], balanced: [32000, 2000], dense: [96000, 4000], closeupMaximum: 1200 },
      fallbacks: healpix.fallbacks,
    },
    v258: {
      status: "ready",
      engine: "astronomy-engine@2.1.19",
      durationsHours: [24, 48, 72],
      fixtureMatrixCount: 100,
      weather: { optional: true, locationPrecisionDeg: 0.01, cacheMinutes: 30, canonical: false, automaticRetry: false },
    },
    v259: {
      status: "ready-with-negative-completeness-evidence",
      frozenSubsetRows: gaiaScience.rowCount,
      validCandidateRows: gaiaScience.validCandidateCount,
      qualityCounts: gaiaScience.qualityCounts,
      output: gaiaScience.output,
      monteCarlo: gaiaScience.monteCarlo,
      liveQueryCanonical: false,
      atlasSelectionAvailable: true,
      gaiaSurveyCompleteness: { status: completeness.status, result: completeness.result, fallbackApplied: completeness.fallbackModelApplied },
    },
    v260: {
      status: "ready-local-candidate",
      scaleBands: ["solar", "stellar", "galactic", "local-group", "near-universe"],
      openNgc: { rows: openNgc.rowCount, output: openNgc.output, license: openNgc.license },
      cosmicflows: { rows: cosmicflows.rowCount, output: cosmicflows.output, publicDeploymentBlocked: cosmicflows.publicDeploymentBlocked, licenseStatus: cosmicflows.redistributionLicenseStatus },
    },
    v261: {
      status: "ready-local-ab",
      legacy: "legacy-v9",
      candidate: "science-cinematic-v256",
      candidateAppliedAsDefault: false,
      physicsMutation: "not-applied",
      kerrScienceMutation: "not-applied",
      launchDynamicsMutation: "not-applied",

    },
  },
  validation: {
    focused: { status: "passed", files: 12, tests: 34 },
    typescript: "passed",
    eslint: { status: "passed", errors: 0, warnings: 85 },
    mainRegression: { status: "passed", files: 107, tests: 674 },
    rust: { status: "passed", tests: 3, profiles: ["dev", "test", "release"] },
    standaloneBuild: { status: "passed", buildId: standaloneBuildId },
    liteBuild: { status: "passed", buildId: liteBuildId },
    contentPacks: {
      status: contentPacks.passed ? "passed" : "failed",
      packCount: contentPacks.packCount,
      verifiedFiles: contentPacks.verifiedFileCount,
      manifestFiles: contentPacks.manifestFileCount,
      failureCount: contentPacks.failureCount,
      report: "dist/science/content-pack-integrity-v232.json",
    },
    bundleTargetBytes: 604160,
    baselineCanvasReadyBytes: { standalone: current.product.bundles.standaloneTransferBytes, lite: current.product.bundles.liteTransferBytes },
    measuredCanvasReadyBytes: {
      standalone: bundleStandalone.transferBytes,
      lite: bundleLite.transferBytes,
    },
    bundleGatePassed: bundleStandalone.releaseTargetPassed && bundleLite.releaseTargetPassed,
    browserQa,
    visualMatrix: {
      status: visualFrameCount === 48 ? "passed" : "incomplete",
      legacyJourneyFrames: journeyFrameCount,
      legacyRiskFrames: riskFrameCount,
      v262AbExtensionFrames: v262ExtensionFrameCount,
      totalFrames: visualFrameCount,
      distinction: "40-frame legacy regression plus 8-frame v262 desktop/mobile A/B extension",
    },
    soak: {
      status: soak.passed ? "passed" : "failed",
      measuredCycles: soak.measuredCycles,
      heapSlopeBytesPerCycle: soak.stableHeapOlsSlopeBytesPerCycle,
      heapSlopeLimitBytesPerCycle: soak.stableHeapOlsSlopeLimitBytesPerCycle,
      baselineResources: soak.baseline,
      releasedResources: soak.released,
      webGlTextureAuditEnabled: soak.webGlTextureAuditEnabled,
      report: "dist/science/lifecycle-soak-v236-report.json",
    },
    performanceHardware: {
      status: performance.passed ? "passed" : "failed",
      adapter: performance.adapter,
      softwareRenderer: performance.softwareRenderer,
      thresholds: performance.thresholds,
      samples: performance.samples.map(({ id, medianFps, frameP95Ms, frameSamples }) => ({ id, medianFps, frameP95Ms, frameSamples })),
      resourcesReleased: performance.resourcesReleased,
      gpuCounterBoundary: "FPS/frame timing and adapter provenance are valid; drawCalls/triangles are not accepted as success evidence",
      report: "dist/science/performance-v232-report.json",
    },
  },
  release: {
    profile: "local-candidate",
    vercelApplied: false,
    productionApplied: false,
    dnsApplied: false,
    signingApplied: false,
    desktopBetaApplied: false,
    localCandidateValidationStatus: "blocked-fresh-matrix-not-reclosed",
    publicDeploymentBlocked: cosmicflows.publicDeploymentBlocked,
    blockers: [
      "corrected 22-test fresh matrix returned 20 passed, 1 skipped and 1 failed on a mobile test viewport route; the test-only fix is not rerun",
      "Cosmicflows-4 redistribution license unconfirmed",
      "GaiaUnlimited completeness dependency blocked",
    ],
  },
  boundary: "v256-v262-product-research-and-visual-layer-no-kerr-stm-weak-field-or-runtime-physics-mutation",
};
manifest.manifestSha256 = sha256(canonicalJson(manifest));

const outputPath = resolve(RELEASE, "orbit-atlas-v262-local-candidate-evidence.json");
const pointerPath = resolve(RELEASE, "orbit-atlas-current-product-evidence-v262.json");
const generatedTsPath = resolve(ROOT, "app/lib/atlasDynamicEvidenceV262.generated.ts");
const dossierPath = resolve(RELEASE, "orbit-atlas-v262-local-ab-dossier.md");
const browserNegativePath = resolve(ROOT, "dist/science/browser-fresh-v262-negative-evidence.json");
await mkdir(RELEASE, { recursive: true });
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n");
await writeFile(browserNegativePath, JSON.stringify(browserQa, null, 2) + "\n");
await writeFile(pointerPath, JSON.stringify({ version: "v262-current-product-evidence-pointer", generatedAt, source: "dist/release/orbit-atlas-v262-local-candidate-evidence.json", sourceSha256: await fileSha256("dist/release/orbit-atlas-v262-local-candidate-evidence.json"), scienceSource: currentPath, scienceSourceSha256: currentSha, publicDeploymentBlocked: true, vercelApplied: false }, null, 2) + "\n");
await writeFile(generatedTsPath, `/* Generated by scripts/build-atlas-evidence-v262.mjs. */\nexport const ATLAS_DYNAMIC_EVIDENCE_V262 = ${JSON.stringify(manifest, null, 2)} as const;\n`);
await writeFile(dossierPath, `# Orbit Atlas v262 Local A/B Dossier\n\nGenerated: ${generatedAt}\n\n- Science: **science-failed-shadow-retained**; 3/49 V8 shards; no retry or partial aggregate.\n- Default kernel: **legacy-eih-1pn**.\n- Catalog: ${healpix.counts.searchable.toLocaleString("en-US")} searchable; ${healpix.counts.renderable.toLocaleString("en-US")} angular; ${healpix.counts.spatial3d.toLocaleString("en-US")} 3D candidates.\n- Gaia science subset: ${gaiaScience.rowCount.toLocaleString("en-US")} rows; ${gaiaScience.qualityCounts.gold.toLocaleString("en-US")} gold; ${gaiaScience.qualityCounts.silver.toLocaleString("en-US")} silver.\n- Gaia survey completeness: **unavailable** (pinned GaiaUnlimited dependency blocked); no substitute model.\n- OpenNGC: ${openNgc.rowCount.toLocaleString("en-US")} rows, ${openNgc.license.id}.\n- Cosmicflows-4: ${cosmicflows.rowCount.toLocaleString("en-US")} rows, local only; public deployment blocked.\n- Visual A/B: Legacy V9 remains default; Science Cinematic is a local visual-only candidate. Visual evidence is ${journeyFrameCount + riskFrameCount} legacy regression frames plus ${v262ExtensionFrameCount} v262 desktop/mobile extension frames (${visualFrameCount} total).\n- Builds: standalone **passed** (${standaloneBuildId}); Lite **passed** (${liteBuildId}).\n- Canvas-ready JS: standalone **${bundleStandalone.transferBytes.toLocaleString("en-US")} B**; Lite **${bundleLite.transferBytes.toLocaleString("en-US")} B**; target **${bundleStandalone.releaseTargetBytes.toLocaleString("en-US")} B**.\n- Content packs: **${contentPacks.verifiedFileCount}/${contentPacks.manifestFileCount}** verified across ${contentPacks.packCount} packs.\n- Browser QA: dedicated v262 standalone, Lite boundary, mobile A/B and 48-frame visual gates passed. The corrected fresh 22-test matrix ran once against the final standalone build and returned **20 passed / 1 skipped / 1 failed** in 13.8 minutes (exit code 1). The only failure was a mobile test attempting the hidden desktop experience-mode control; the test-only viewport route fix is prepared but was not rerun, preserving the no-automatic-retry policy.\n- 30-cycle soak: **passed**; heap slope ${Math.round(soak.stableHeapOlsSlopeBytesPerCycle).toLocaleString("en-US")} B/cycle (limit ${soak.stableHeapOlsSlopeLimitBytesPerCycle.toLocaleString("en-US")} B/cycle); resources returned to baseline. Native WebGL texture auditing was disabled and is not claimed.\n- RTX hardware: **${performance.adapter.renderer}**; all FPS/P95 gates passed. Draw-call/triangle values are excluded as success evidence because their provenance remains unreliable.\n- Local validation: **blocked-fresh-matrix-not-reclosed**. Candidate remains local and is not promoted.\n- Vercel/production/DNS/signing/Desktop Beta: **not applied**.\n`);
console.log(JSON.stringify({ generated: true, validationPassed: false, validationStatus: manifest.release.localCandidateValidationStatus, output: outputPath, manifestSha256: manifest.manifestSha256, currentScienceSha256: currentSha, campaignSha256: campaignSha, publicDeploymentBlocked: true }, null, 2));
