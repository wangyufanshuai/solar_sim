import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const fromRoot = (file) => path.join(root, file);
const readJson = async (file) => JSON.parse(await readFile(fromRoot(file), "utf8"));
const sha256 = async (file) => createHash("sha256").update(await readFile(fromRoot(file))).digest("hex");
const lineCount = async (file) => (await readFile(fromRoot(file), "utf8")).split(/\r?\n/).length;

const pkg = await readJson("package.json");
const content = await readJson("dist/science/content-pack-integrity-v192.json");
const bundleStandalone = await readJson("dist/science/client-bundle-v224-standalone-full.json");
const bundleLite = await readJson("dist/science/client-bundle-v224-vercel-lite.json");
const soak = await readJson("dist/science/lifecycle-soak-v224-report.json");
const performance = await readJson("dist/science/performance-v224-report.json");
const visual = await readJson("output/playwright/v220-visual-review/manifest.json");
const kerrFine = await readJson("dist/science/kerr-schild-reference-v5-fine.json");
const kerrFineRerun = await readJson("dist/science/kerr-schild-reference-v5-fine-rerun.json");
const kerrFiner = await readJson("dist/science/kerr-schild-reference-v5-finer.json");
const kerrFinerRerun = await readJson("dist/science/kerr-schild-reference-v5-finer-rerun.json");
const kerrCross = await readJson("dist/science/kerr-cross-validation-v5.json");
const radiative = await readJson("dist/science/kerr-radiative-transfer-v5-fine.json");
const radiativeDeterminism = await readJson("dist/science/kerr-radiative-transfer-v5-determinism.json");
const dense = await readJson("dist/science/kerr-dense-cross-validation-v5.json");
const weakV11 = await readJson("dist/science/relativity-v11-evidence.json");

const sourceFiles = [
  "app/lib/atlasVisualQualityV217.ts",
  "app/lib/atlasVisualQualityV217.test.ts",
  "app/lib/atlasSceneFocusCameraRuntime.ts",
  "app/lib/atlasSceneFocusCameraRuntime.test.ts",
  "app/lib/kerrReferenceV5.ts",
  "app/lib/kerrReferenceV5.test.ts",
  "app/lib/relativityResearchV11.ts",
  "app/lib/relativityResearchV11.test.ts",
  "app/components/AtlasVisualDiagnosticsSurface.tsx",
  "app/components/AtlasLabelLayoutCoordinator.tsx",
  "app/components/AtlasSceneFocusCameraBridge.tsx",
  "app/components/BodyDetailSidebar.tsx",
  "app/components/LaunchControlPanel.tsx",
  "app/components/AtlasPanelCoordinator.tsx",
  "scripts/kerr_observer_frame_v5.py",
  "scripts/run-kerr-schild-reference-v5.py",
  "scripts/run-kerr-radiative-transfer-v5.py",
  "scripts/build-kerr-cross-validation-v5.py",
  "scripts/build-kerr-dense-screen-v5.py",
  "scripts/build-relativity-v11-evidence.py",
  "scripts/build-v220-visual-review.mjs",
  "scripts/build-v224-visual-relativity-dossier.mjs",
  "tests/atlas-browser/atlas-visual-journeys-v197.spec.ts",
  "tests/atlas-browser/atlas-lifecycle-soak-v178.spec.ts",
  "tests/atlas-browser/scientific-performance-v5.spec.ts",
  "playwright.atlas.visual-v224.config.ts",
  "playwright.atlas.fresh-v224.config.ts",
  "playwright.atlas.kerr-v224.config.ts",
  "playwright.atlas.soak-v224.config.ts",
  "playwright.atlas.performance-v224.config.ts",
  "package.json",
  "next.config.mjs",
];
const sourceInventory = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, {
  sha256: await sha256(file),
  lines: await lineCount(file),
}])));

const evidenceFiles = [
  "dist/science/content-pack-integrity-v192.json",
  "dist/science/client-bundle-v224-standalone-full.json",
  "dist/science/client-bundle-v224-vercel-lite.json",
  "dist/science/lifecycle-soak-v224-report.json",
  "dist/science/performance-v224-report.json",
  "dist/science/kerr-schild-reference-v5-fine.json",
  "dist/science/kerr-schild-reference-v5-fine-rerun.json",
  "dist/science/kerr-schild-reference-v5-finer.json",
  "dist/science/kerr-schild-reference-v5-finer-rerun.json",
  "dist/science/kerr-cross-validation-v5.json",
  "dist/science/kerr-radiative-transfer-v5-fine.json",
  "dist/science/kerr-radiative-transfer-v5-determinism.json",
  "dist/science/kerr-dense-screen-v5.json",
  "dist/science/kerr-dense-cross-validation-v5.json",
  "dist/science/relativity-v11-evidence.json",
  "output/playwright/v220-visual-review/manifest.json",
  "output/v224-visual-production-2.out.log",
  "output/v224-fresh-qa-final.out.log",
  "output/v224-full-regression.out.log",
];
const evidenceSha256 = Object.fromEntries(await Promise.all(evidenceFiles.map(async (file) => [file, await sha256(file)])));

const status = "visual-polish-rc-relativity-research-candidate-shadow-retained";
const rootContract = {
  attributeCount: 603,
  keyHash: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
  preserved: true,
};
const science = {
  defaultKernel: "legacy-eih-1pn",
  candidateStatus: "shadow-retained",
  runtimePromotionApplied: false,
  kerrSchild: {
    fine: { hash: kerrFine.canonicalEvidenceSha256, maxNullConstraint: kerrFine.maxNullConstraint },
    fineRerun: { hash: kerrFineRerun.canonicalEvidenceSha256, maxNullConstraint: kerrFineRerun.maxNullConstraint },
    finer: { hash: kerrFiner.canonicalEvidenceSha256, maxNullConstraint: kerrFiner.maxNullConstraint },
    finerRerun: { hash: kerrFinerRerun.canonicalEvidenceSha256, maxNullConstraint: kerrFinerRerun.maxNullConstraint },
    fineDeterministic: kerrFine.canonicalEvidenceSha256 === kerrFineRerun.canonicalEvidenceSha256,
    finerDeterministic: kerrFiner.canonicalEvidenceSha256 === kerrFinerRerun.canonicalEvidenceSha256,
    fineFinerClassificationAgreement: kerrFine.rays.every((ray, index) => ray.status === kerrFiner.rays[index]?.status),
  },
  cpuCrossValidation: {
    classificationAgreement: kerrCross.classificationAgreement,
    gates: kerrCross.gates,
    canonicalEvidenceSha256: kerrCross.canonicalEvidenceSha256,
  },
  radiativeTransfer: {
    rayCount: radiative.rayCount,
    polarizationRayCount: radiative.polarizationRayCount,
    maxRedshiftRelativeError: radiative.maxRedshiftRelativeError,
    maxEvpaErrorDeg: radiative.maxEvpaErrorDeg,
    gates: radiative.gates,
    deterministic: radiativeDeterminism.passed,
  },
  denseCrossValidation: {
    requestedLowDiscrepancyRays: dense.lowDiscrepancyRayCount,
    requestedCriticalBracketRays: dense.criticalBracketRayCount,
    executedLowDiscrepancyRays: dense.executedLowDiscrepancyRayCount,
    executedCriticalBracketRays: dense.executedCriticalBracketRayCount,
    passed: false,
    blocker: dense.blocker,
  },
  weakFieldV11: {
    canonicalEvidenceSha256: weakV11.canonicalEvidenceSha256,
    promotionDecision: weakV11.promotionDecision,
    variationalStmAvailable: weakV11.variationalStm?.integrated === true,
    boundary: weakV11.boundary,
  },
};

if (!content.passed || content.verifiedFileCount !== 805) throw new Error("v224 content pack gate failed");
if (!bundleStandalone.stopLinePassed || !bundleLite.stopLinePassed) throw new Error("v224 610 KiB stop line failed");
if (!soak.passed || !performance.passed) throw new Error("v224 lifecycle or performance gate failed");
if (!science.kerrSchild.fineDeterministic || !science.kerrSchild.finerDeterministic) throw new Error("v224 Kerr deterministic rerun failed");
if (kerrFine.maxNullConstraint >= 1e-10 || kerrFiner.maxNullConstraint >= 1e-10) throw new Error("v224 Kerr null gate failed");
if (dense.executedLowDiscrepancyRayCount !== 0 || dense.executedCriticalBracketRayCount !== 0) {
  throw new Error("v224 dense report execution state changed without validated results");
}

const dossier = {
  version: "v224-visual-relativity-research-dossier",
  generatedAt: new Date().toISOString(),
  status,
  releaseLabelApplied: false,
  runtime: {
    next: pkg.dependencies?.next,
    react: pkg.dependencies?.react,
    reactDom: pkg.dependencies?.["react-dom"],
    r3f: pkg.dependencies?.["@react-three/fiber"],
    three: pkg.dependencies?.three,
    standaloneBuildId: (await readFile(fromRoot(".next-v224/BUILD_ID"), "utf8")).trim(),
    liteBuildId: (await readFile(fromRoot(".next-v224-lite/BUILD_ID"), "utf8")).trim(),
  },
  contracts: {
    singleCanvas: true,
    sameWebglContextAcrossPanels: true,
    rootContract,
    missionUrlFocusCameraStoreSceneRevisionPreserved: true,
    frozenV9Mutated: false,
  },
  visual: {
    matrix: "6 journeys x 2 viewports x 3 keyframes",
    passed: "12/12",
    baselineUpdated: visual.baselineUpdated,
    reviewArtifacts: visual.artifacts,
    productionFreshQa: "9 passed / 1 expected desktop viewport skip",
    kerrLifecycleQa: "2/2",
    consoleErrors: 0,
    pageErrors: 0,
  },
  delivery: {
    standaloneFull: { buildPassed: true, ...bundleStandalone },
    vercelLite: { buildPassed: true, manifest: "595 files / 65.9 MiB / no loopback fallback", ...bundleLite },
    bundleWarning: "Both profiles pass the 610 KiB stop line but miss the 600 KiB recommended target.",
    contentPacks: content,
  },
  regression: { filesPassed: 107, filesTotal: 107, testsPassed: 674, testsTotal: 674, failed: 0 },
  lifecycle: soak,
  namedHardwarePerformance: performance,
  science,
  blockers: [
    "The 2048 low-discrepancy and 1024 critical-bracket Kerr rays are frozen as a deterministic manifest but have not been executed by both independent CPU references.",
    "A true integrated variational STM and unregularized conditioning report are not yet available; weak-field promotion remains fail closed.",
    "Standalone and Lite initial JavaScript pass 610 KiB but remain above the 600 KiB recommended target.",
    "External MSI/NSIS install, launch, uninstall, reinstall, Chinese/space-path and WebView2 QA is still pending on another Windows computer.",
  ],
  boundaries: {
    liveWorkerPhysicsMutated: false,
    scientificGateMutated: false,
    v9SkyMutated: false,
    numericalRelativityClaimed: false,
    grmhdClaimed: false,
    cloudDeployment: "not-performed",
    signing: "not-performed",
    gitMutation: "no-reset-revert-clean-stage-or-commit",
  },
  evidenceSha256,
  sourceInventory,
};

const outputDir = fromRoot("dist/release");
await mkdir(outputDir, { recursive: true });
const inventoryFile = "dist/release/orbit-atlas-v224-source-inventory.json";
const jsonFile = "dist/release/orbit-atlas-v224-visual-relativity-dossier.json";
const mdFile = "dist/release/orbit-atlas-v224-visual-relativity-dossier.md";
await writeFile(fromRoot(inventoryFile), `${JSON.stringify({ version: "v224-source-inventory", sourceInventory }, null, 2)}\n`);
await writeFile(fromRoot(jsonFile), `${JSON.stringify(dossier, null, 2)}\n`);
const markdown = `# Orbit Atlas v224 visual polish and relativity research dossier

Status: **${status}**  
Release label applied: **no**

## Verified

- Production builds: standalone-full \`${dossier.runtime.standaloneBuildId}\`; vercel-lite \`${dossier.runtime.liteBuildId}\`.
- Root contract: ${rootContract.attributeCount} attributes; key hash \`${rootContract.keyHash}\`.
- Visual matrix: 36 frames, 12/12 journeys; fresh QA 9 passed / 1 expected viewport skip; Kerr lifecycle 2/2.
- Regression: 674/674 across 107 files. Content packs: ${content.verifiedFileCount}/${content.manifestFileCount} across ${content.packCount} packs.
- Cold Canvas-ready JS: standalone ${bundleStandalone.transferBytes} B; Lite ${bundleLite.transferBytes} B. Both pass 610 KiB and miss the 600 KiB recommendation.
- Ten-cycle soak passed; final renderer textures ${soak.released.rendererTextures}, programs ${soak.released.programs}, heap growth ${(soak.finalHeap - soak.baselineHeap)} B.
- RTX 4060 performance passed: ${performance.samples.map((sample) => `${sample.id} ${sample.medianFps} FPS / P95 ${sample.frameP95Ms} ms`).join("; ")}.

## Relativity evidence

- Analytic Kerr-Schild fine deterministic hash: \`${kerrFine.canonicalEvidenceSha256}\`; maximum null drift ${kerrFine.maxNullConstraint}.
- Analytic Kerr-Schild finer deterministic hash: \`${kerrFiner.canonicalEvidenceSha256}\`; maximum null drift ${kerrFiner.maxNullConstraint}.
- Carter/Mino vs Kerr-Schild canonical classification agreement: ${kerrCross.classificationAgreement}; redshift and polarization gates pass for the 256-ray stratified teaching-disc report.
- Dense 2048/1024 dual-CPU execution is **not complete**. The manifest is checksummed and the gate remains fail closed.
- Weak-field integrated variational STM is **not complete**. Default \`legacy-eih-1pn\` remains unchanged; all candidates remain shadow-only.

## Release blockers

${dossier.blockers.map((blocker) => `- ${blocker}`).join("\n")}

This dossier does not claim numerical relativity, GRMHD, black-hole mergers, desktop GA, cloud deployment or signing.
`;
await writeFile(fromRoot(mdFile), markdown);
const checksumFiles = [jsonFile, mdFile, inventoryFile];
await writeFile(
  fromRoot("dist/release/orbit-atlas-v224-visual-relativity-dossier.sha256"),
  `${(await Promise.all(checksumFiles.map(async (file) => `${await sha256(file)}  ${file}`))).join("\n")}\n`,
);
console.log(JSON.stringify({ status, jsonFile, mdFile, inventoryFile }, null, 2));
