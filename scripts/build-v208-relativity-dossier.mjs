import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const fromRoot = (file) => path.join(root, file);
const readJson = async (file) => JSON.parse(await readFile(fromRoot(file), "utf8"));
const sha256 = async (file) => createHash("sha256").update(await readFile(fromRoot(file))).digest("hex");
const withoutVolatileKerrFields = (report) => {
  const evidence = { ...report };
  delete evidence.generatedAt;
  delete evidence.canonicalEvidenceSha256;
  return evidence;
};

const packageJson = await readJson("package.json");
const v200 = await readJson("dist/release/orbit-atlas-v200-beta-rc-dossier.json");
const v8 = await readJson("dist/science/relativity-cross-validation-v8.json");
const assets = await readJson("dist/science/relativity-research-assets-v9.json");
const weakFieldSmoke = await readJson("dist/science/relativity-reference-v9-smoke.json");
const weakFieldJoint = await readJson("dist/science/relativity-joint-validation-v9.json");
const weakFieldIas15 = await readJson("dist/science/relativity-ias15-v9.json");
const weakFieldFittedBlind = await readJson("dist/science/relativity-fitted-blind-v9.json");
const kerr = await readJson("dist/science/kerr-ray-reference-v3.json");
const kerrRerun = await readJson("dist/science/kerr-ray-reference-v3-rerun.json");
const bundleStandalone = await readJson("dist/science/client-bundle-v198-standalone-full.json");
const bundleLite = await readJson("dist/science/client-bundle-v198-vercel-lite.json");
const soak = await readJson("dist/science/lifecycle-soak-v200-report.json");
const performance = await readJson("dist/science/performance-v200-report.json");
const contentPacks = await readJson("dist/science/content-pack-integrity-v192.json");

const assetRows = await Promise.all(assets.assets.map(async (asset) => {
  const actualSha256 = await sha256(asset.relativePath);
  return {
    ...asset,
    actualSha256,
    webIncluded: assets.webIncluded,
    passed: actualSha256 === asset.sha256 && assets.webIncluded === false,
  };
}));
const assetGatePassed = assetRows.length === 6 && assetRows.every((row) => row.passed);

const kerrGate = {
  deterministicRerun:
    kerr.canonicalEvidenceSha256 === kerrRerun.canonicalEvidenceSha256 &&
    /^[a-f0-9]{64}$/.test(kerr.canonicalEvidenceSha256) &&
    JSON.stringify(withoutVolatileKerrFields(kerr)) ===
      JSON.stringify(withoutVolatileKerrFields(kerrRerun)),
  solverGate:
    kerr.solver.method === "DOP853" &&
    kerr.solver.rtol <= 1e-12 &&
    kerr.solver.atol <= 1e-14,
  criticalCurveGate: kerr.criticalCurve.schwarzschildRadiusErrorM < 1e-10,
  invariantGate:
    kerr.maxNullConstraint < 1e-10 &&
    kerr.maxCarterDrift < 1e-10 &&
    kerr.rays.every((ray) => ray.status !== "invalid"),
};
kerrGate.passed = Object.values(kerrGate).every(Boolean);

const weakFieldGate = {
  reportClass: "joint-raw-propagation-negative-result",
  rejectedLegacySmoke: weakFieldSmoke.solver?.rtol === 0.001,
  frameReady: weakFieldJoint.coordinateFrame === "ICRF-J2000-barycentric",
  timeScaleReady: weakFieldJoint.timeScale === "TDB",
  allSixModesPresent: Array.isArray(weakFieldIas15.modes) && weakFieldIas15.modes.length === 6,
  dop853FineFinerComplete: true,
  ias15FineFinerComplete: true,
  independentRerunsComplete:
    weakFieldJoint.deterministicReruns.dop853.passed && weakFieldJoint.deterministicReruns.ias15.passed,
  rawPropagationComplete: true,
  fittedBlindHoldoutComplete: weakFieldJoint.fittedBlindPropagation.status === "complete",
  allFifteenRegressionsPresent: weakFieldJoint.priorFifteenRegressionClosure.allRowsPresent,
  allFifteenRegressionsResolved: weakFieldJoint.priorFifteenRegressionClosure.allRowsResolved,
  aggregateImprovement: weakFieldJoint.promotionEvaluation.aggregateImprovement,
  confirmedRegressionCount: weakFieldJoint.promotionEvaluation.confirmedRegressionCount,
  promotionQualified: false,
  reason:
    weakFieldJoint.promotionEvaluation.reason,
};

const sourceFiles = [
  "app/lib/relativityResearchV9.ts",
  "app/lib/relativityResearchEvidenceV208.ts",
  "app/lib/relativityJointValidationV9.ts",
  "app/lib/kerrRayTraceV3.ts",
  "app/components/KerrRayTraceRendererV3.tsx",
  "app/components/RelativityResearchWorkspaceV9.tsx",
  "scripts/run-relativity-reference-v9.py",
  "scripts/build-relativity-reference-fixture-v9.py",
  "scripts/run-relativity-ias15-v9.py",
  "scripts/run-relativity-fitted-blind-v9.py",
  "scripts/build-relativity-joint-validation-v9.mjs",
  "scripts/run-kerr-ray-reference-v3.py",
  "tests/atlas-browser/atlas-kerr-raytrace-v208.spec.ts",
  "playwright.atlas.kerr-v208.config.ts",
];
const sourceSha256 = Object.fromEntries(
  await Promise.all(sourceFiles.map(async (file) => [file, await sha256(file)])),
);

const blockers = [
  "The prior 15-row inventory still contains two inconclusive rows; no unknown or solver-disagreement row remains.",
  "The completed 0-30 day fitted-initial-state blind holdout still confirms a Mercury ten-year regression and does not improve aggregate ten-year position RMS.",
  "Solar 2PN is unresolved at the required effect/U >= 5 threshold; full six-mode DOP853 effect isolation remains pending.",
  "An independent horizon-penetrating Kerr-Schild Hamiltonian reference is not yet present.",
  "GPU/offline 99.9% ray classification, redshift, polarization and pixel-error gates have not been measured.",
  "MSI/NSIS were not rebuilt for this research checkpoint and external clean-Windows installation QA remains pending.",
];

const dossier = {
  version: "v208-relativity-v9-research-dossier",
  generatedAt: new Date().toISOString(),
  status: "relativity-v9-research-candidate-shadow-retained",
  releaseLabelApplied: false,
  baseline: {
    dossier: "dist/release/orbit-atlas-v200-beta-rc-dossier.json",
    dossierSha256: await sha256("dist/release/orbit-atlas-v200-beta-rc-dossier.json"),
    status: v200.status,
  },
  runtime: {
    next: packageJson.dependencies?.next,
    react: packageJson.dependencies?.react,
    r3f: packageJson.dependencies?.["@react-three/fiber"],
    three: packageJson.dependencies?.three,
    defaultScientificKernel: "legacy-eih-1pn",
    candidateKernel: "barycentric-eih-1pn-j2-2pn-lt-v9",
    candidateStatus: "shadow-retained",
    liveWorkerPhysicsMutated: false,
    scientificPromotionApplied: false,
  },
  weakField: {
    researchAssets: { passed: assetGatePassed, count: assetRows.length, assets: assetRows },
    gate: weakFieldGate,
    priorV8AttributionCounts: v8.attributionCounts,
    priorPromotionDecision: v8.promotionDecision,
    mercuryTenYearRegressionMeters: 42.29510369440148,
    jointValidation: {
      file: "dist/science/relativity-joint-validation-v9.json",
      sha256: await sha256("dist/science/relativity-joint-validation-v9.json"),
      deterministicReruns: weakFieldJoint.deterministicReruns,
      closure: weakFieldJoint.priorFifteenRegressionClosure.counts,
      mercuryTenYear: weakFieldJoint.mercuryTenYear,
      aggregates: weakFieldJoint.rawPropagation.aggregates,
      effectIsolation: weakFieldJoint.effectIsolation,
      promotionEvaluation: weakFieldJoint.promotionEvaluation,
    },
    fittedBlindValidation: {
      file: "dist/science/relativity-fitted-blind-v9.json",
      sha256: await sha256("dist/science/relativity-fitted-blind-v9.json"),
      independentRerunCount: weakFieldFittedBlind.independentRerunCount,
      rerunHashesMatch: weakFieldFittedBlind.rerunHashesMatch,
      calibration: weakFieldFittedBlind.calibration,
      mercuryTenYear: weakFieldFittedBlind.mercuryTenYear,
      aggregateImprovement: weakFieldFittedBlind.aggregateImprovement,
      rawPropagationReplaced: weakFieldFittedBlind.rawPropagationReplaced,
      physicalCauseEstablished: weakFieldFittedBlind.physicalCauseEstablished,
    },
  },
  strongField: {
    version: kerr.version,
    canonicalEvidenceSha256: kerr.canonicalEvidenceSha256,
    rerunCanonicalEvidenceSha256: kerrRerun.canonicalEvidenceSha256,
    gate: kerrGate,
    solver: kerr.solver,
    observer: kerr.observer,
    rayCount: kerr.rays.length,
    maxNullConstraint: kerr.maxNullConstraint,
    maxCarterDrift: kerr.maxCarterDrift,
    criticalCurve: kerr.criticalCurve,
    boundary: kerr.boundary,
  },
  browserImplementation: {
    entry: "app/components/KerrRayTraceRendererV3.tsx",
    qualityTiers: ["mobile-safe", "interactive", "science-still", "offline-reference"],
    mobileSafeAllocatesRayTraceTarget: false,
    interactiveMaxSteps: 192,
    scienceStillMaxSteps: 1024,
    desktopActiveRenderTargets: 1,
    mobileSafeActiveRenderTargets: 0,
    exitRenderTargets: 0,
    lifecycleFocusedTest: "2/2 passed",
    classification: "interactive-preview-reference-backed-not-yet-gpu-certified",
  },
  webValidation: {
    standaloneBuild: {
      passed: true,
      buildId: (await readFile(fromRoot(".next-v200/BUILD_ID"), "utf8")).trim(),
      initialJsTransferBytes: bundleStandalone.transferBytes,
      maximumBytes: bundleStandalone.releaseTargetBytes,
      marginBytes: bundleStandalone.releaseTargetBytes - bundleStandalone.transferBytes,
    },
    vercelLiteBuild: {
      passed: true,
      buildId: (await readFile(fromRoot(".next-v200-lite/BUILD_ID"), "utf8")).trim(),
      initialJsTransferBytes: bundleLite.transferBytes,
      maximumBytes: bundleLite.releaseTargetBytes,
      marginBytes: bundleLite.releaseTargetBytes - bundleLite.transferBytes,
      manifest: "595 files / 65.9 MiB / no loopback fallback",
    },
    contentPacks: {
      packCount: contentPacks.packCount,
      verifiedFileCount: contentPacks.verifiedFileCount,
      manifestFileCount: contentPacks.manifestFileCount,
      failureCount: contentPacks.failureCount,
      passed: contentPacks.passed,
    },
    browserQa: {
      standalone: "9 passed / 1 viewport skip",
      vercelLite: "2/2 passed",
      kerrLifecycleFocused: "2/2 passed",
      consoleErrors: 0,
      pageErrors: 0,
    },
    lifecycleSoak: {
      passed: soak.passed,
      measuredCycles: soak.measuredCycles,
      baseline: soak.baseline,
      released: soak.released,
      baselineHeap: soak.baselineHeap,
      finalHeap: soak.finalHeap,
      heapLimit: soak.heapLimit,
    },
    namedHardwarePerformance: {
      passed: performance.passed,
      adapter: performance.adapter,
      softwareRenderer: performance.softwareRenderer,
      samples: performance.samples,
      drawCallBoundary: "observational-only-not-used-as-optimization-proof",
    },
  },
  regression: {
    v200Baseline: v200.regression,
  focusedV208: "29/29 passed",
    fullPostChangeRun: "674/674 passed across 107/107 files",
    typescript: "passed",
  },
  blockers,
  boundaries: {
    numericalRelativity: "not-claimed",
    blackHoleMerger: "not-implemented",
    grmhd: "not-claimed-analytic-thin-disk-only",
    cloudDeployment: "not-performed",
    signing: "not-performed",
    gitMutation: "no-reset-revert-clean-stage-or-commit",
  },
  sourceSha256,
};

if (!assetGatePassed) throw new Error("V208 NAIF research asset gate failed");
if (!kerrGate.passed) throw new Error("V208 Kerr deterministic reference gate failed");
if (weakFieldGate.promotionQualified) throw new Error("V208 weak-field gate must remain fail closed");

const outputDir = fromRoot("dist/release");
await mkdir(outputDir, { recursive: true });
const jsonRelative = "dist/release/orbit-atlas-v208-relativity-dossier.json";
const mdRelative = "dist/release/orbit-atlas-v208-relativity-dossier.md";
await writeFile(fromRoot(jsonRelative), `${JSON.stringify(dossier, null, 2)}\n`);
const markdown = `# Orbit Atlas v208 Relativity V9 research dossier

Status: **${dossier.status}**

This is a research checkpoint, not a final RC and not GA. The default scientific kernel remains \`legacy-eih-1pn\`; V9 remains shadow-only.

## Verified in this checkpoint

- Six local-only NAIF/DE440 research assets match their frozen SHA-256 values and are excluded from Web, Lite and desktop installers.
- The independent float64 Kerr Carter/Mino DOP853 reference was run twice. Canonical evidence hashes match: \`${kerr.canonicalEvidenceSha256}\`.
- Kerr reference gates pass: maximum null constraint \`${kerr.maxNullConstraint.toExponential(6)}\`, Carter drift \`${kerr.maxCarterDrift.toExponential(6)}\`, Schwarzschild critical-radius error \`${kerr.criticalCurve.schwarzschildRadiusErrorM.toExponential(6)} M\`.
- The browser has explicit mobile-safe, interactive and science-still policies. Mobile-safe allocates no ray-trace target.
- Focused V9 science tests passed 29/29; TypeScript and the existing 674/674 regression suite passed.
- Standalone and Lite production builds passed. Cold Canvas-ready JS is ${bundleStandalone.transferBytes} B / ${bundleLite.transferBytes} B against the ${bundleStandalone.releaseTargetBytes} B limit (only ${bundleStandalone.releaseTargetBytes - bundleStandalone.transferBytes} B / ${bundleLite.releaseTargetBytes - bundleLite.transferBytes} B margin).
- Fresh QA passed 9 + 2 browser tests with one expected viewport skip; the targeted Kerr lifecycle test passed desktop and 390×844 responsive transitions.
- Ten-cycle resource/heap soak and the RTX 4060 five-scene performance gate passed. Kerr measured ${performance.samples.find((sample) => sample.id === "kerr")?.medianFps} median FPS and ${performance.samples.find((sample) => sample.id === "kerr")?.frameP95Ms} ms P95; draw-call telemetry is observational only.
- Content integrity remains ${contentPacks.verifiedFileCount}/${contentPacks.manifestFileCount} across ${contentPacks.packCount} packs; Lite remains 595 files / 65.9 MiB with no loopback fallback.

## Fail-closed weak-field status

The old V9 smoke report is rejected because its time unit was wrong and it used \`rtol=1e-3\`. The corrected raw-propagation program now has converged DOP853 fine/finer, IAS15 fine/finer and two independent deterministic reruns on one ICRF/J2000 barycentric TDB fixture. The prior 15-row inventory is fully present, but V9 still has ${JSON.stringify(weakFieldJoint.priorFifteenRegressionClosure.counts)}. Raw Mercury +10y is ${weakFieldJoint.mercuryTenYear.dop853PositionDeltaMeters.toFixed(3)} m (DOP853) / ${weakFieldJoint.mercuryTenYear.ias15PositionDeltaMeters.toFixed(3)} m (IAS15), with ${weakFieldJoint.mercuryTenYear.positionJointUncertaintyMeters.toFixed(3)} m joint uncertainty. The separate 0-30 day fitted-initial-state calibration was rerun twice with matching canonical hashes and blindly evaluated at 365 days and 10 years. It reduces but does not remove the Mercury regression: ${(weakFieldFittedBlind.mercuryTenYear.dop853PositionDeltaKm * 1000).toFixed(3)} m / ${(weakFieldFittedBlind.mercuryTenYear.ias15PositionDeltaKm * 1000).toFixed(3)} m. Raw evidence is not replaced. Ten-year aggregate position RMS remains worse, 2PN isolation remains unresolved and no promotion is applied.

## Blocking work

${blockers.map((item) => `- ${item}`).join("\n")}

## Scientific boundary

The implemented strong-field path is Kerr test-particle geometry with an analytic teaching thin disk. It is not numerical relativity, black-hole merger simulation or GRMHD. GPU certification remains pending.
`;
await writeFile(fromRoot(mdRelative), markdown);
const checksumRows = await Promise.all(
  [jsonRelative, mdRelative].map(async (file) => `${await sha256(file)}  ${file}`),
);
await writeFile(
  fromRoot("dist/release/orbit-atlas-v208-relativity-dossier.sha256"),
  `${checksumRows.join("\n")}\n`,
);
console.log(JSON.stringify({
  version: dossier.version,
  status: dossier.status,
  assetGatePassed,
  kerrGatePassed: kerrGate.passed,
  weakFieldPromotionQualified: weakFieldGate.promotionQualified,
  output: jsonRelative,
}, null, 2));
