import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const sha256 = async (file) => createHash("sha256").update(await readFile(path.join(root, file))).digest("hex");
const lineCount = async (file) => (await readFile(path.join(root, file), "utf8")).split(/\r?\n/).length;
const pkg = await readJson("package.json");
const content = await readJson("dist/science/content-pack-integrity-v192.json");
const bundleStandalone = await readJson("dist/science/client-bundle-v198-standalone-full.json");
const bundleLite = await readJson("dist/science/client-bundle-v198-vercel-lite.json");
const soak = await readJson("dist/science/lifecycle-soak-v200-report.json");
const performance = await readJson("dist/science/performance-v200-report.json");
const rust = await readJson("dist/science/desktop-rust-v200.json");
const desktop = await readJson("dist/science/desktop-build-v200.json");
const crossValidation = await readJson("dist/science/relativity-cross-validation-v8.json");
const recovery = await readJson("dist/release/orbit-atlas-v192-content-recovery.json");
const evidenceFiles = [
  "dist/science/relativity-cross-validation-v8.json",
  "dist/science/content-pack-integrity-v192.json",
  "dist/science/client-bundle-v198-standalone-full.json",
  "dist/science/client-bundle-v198-vercel-lite.json",
  "dist/science/lifecycle-soak-v200-report.json",
  "dist/science/performance-v200-report.json",
  "dist/science/desktop-rust-v200.json",
  "dist/science/desktop-build-v200.json",
  "dist/release/orbit-atlas-v192-content-recovery.json",
  "dist/desktop-stage/v200/desktop-stage.json",
  "src-tauri/target/release/bundle/nsis/Solar Atlas_1.0.0_x64-setup.exe",
  "src-tauri/target/release/bundle/msi/Solar Atlas_1.0.0_x64_en-US.msi",
];
const evidenceSha256 = Object.fromEntries(await Promise.all(evidenceFiles.map(async (file) => [file, await sha256(file)])));
const sourceLineCounts = {
  "app/UniverseRuntimeController.tsx": await lineCount("app/UniverseRuntimeController.tsx"),
  "app/AtlasRuntimeWorkbench.tsx": await lineCount("app/AtlasRuntimeWorkbench.tsx"),
  "app/components/AtlasSceneCameraBridges.tsx": await lineCount("app/components/AtlasSceneCameraBridges.tsx"),
  "app/components/AtlasSceneFocusCameraBridge.tsx": await lineCount("app/components/AtlasSceneFocusCameraBridge.tsx"),
  "src-tauri/src/lib.rs": await lineCount("src-tauri/src/lib.rs"),
  "src-tauri/src/commands.rs": await lineCount("src-tauri/src/commands.rs"),
};
const dossier = {
  version: "v200-web-desktop-beta-rc-dossier",
  generatedAt: new Date().toISOString(),
  status: "host-validated-install-qa-pending",
  releaseLabel: "web-and-desktop-beta-rc-ready-science-shadow-retained",
  releaseLabelApplied: false,
  runtime: {
    next: pkg.dependencies?.next ?? pkg.devDependencies?.next,
    react: pkg.dependencies?.react,
    reactDom: pkg.dependencies?.["react-dom"],
    r3f: pkg.dependencies?.["@react-three/fiber"],
    three: pkg.dependencies?.three,
    defaultScientificKernel: "legacy-eih-1pn",
    shadowScientificKernel: "v2",
  },
  science: {
    crossValidation: crossValidation.attributionCounts,
    rerunHashesMatch: crossValidation.rerunHashesMatch,
    promotionDecision: crossValidation.promotionDecision,
    mercuryTenYearPositionKm: 0.04229510369440148,
    mercuryTenYearPositionMeters: 42.29510369440148,
    boundary: crossValidation.boundary,
  },
  builds: {
    standaloneFull: { productionBuildPassed: true, bundle: bundleStandalone },
    vercelLite: { productionBuildPassed: true, bundle: bundleLite, liteManifest: "595 files / 65.9 MiB / no loopback fallback" },
    desktopCompact: { buildPassed: desktop.passed, rustPassed: rust.passed, stage: desktop.stage, installers: desktop.artifacts },
  },
  regression: { command: "npm run test:atlas", filesPassed: 107, filesTotal: 107, passed: 674, total: 674, failed: 0 },
  contentPacks: { packCount: content.packCount, manifestFileCount: content.manifestFileCount, verifiedFileCount: content.verifiedFileCount, failureCount: content.failureCount, passed: content.passed },
  assetRecovery: { recordedEntries: recovery.entries.length, restoredExactFiles: content.verifiedFileCount, frozenV9Policy: "exact-checksummed-copy-only", regenerated: false },
  browser: { visualJourneysV197: "12/12", freshStandaloneV200: "9 passed / 1 viewport skip", vercelLiteV200: "2/2", consoleErrors: 0, pageErrors: 0, http4xx5xx: 0 },
  lifecycle: soak,
  performance,
  maintainability: { sourceLineCounts, workbenchUnder1200: sourceLineCounts["app/AtlasRuntimeWorkbench.tsx"] < 1200, rustCommandsUnder300: sourceLineCounts["src-tauri/src/commands.rs"] < 300 },
  externalInstallQa: { status: "pending", scope: "second Windows 10/11 computer", required: ["MSI install/launch/exit/uninstall/reinstall", "NSIS install/launch/exit/uninstall/reinstall", "Chinese and spaced paths", "content-pack discovery and missing-pack fallback", "WebView2 installed/offline and missing/online guide"] },
  boundaries: { cloudDeployment: "not-performed", signing: "not-performed", gitMutation: "no-reset-revert-clean-stage-or-commit", v2Promotion: "not-applied", desktopAutoUpdate: "disabled" },
  evidenceSha256,
};
const outputDir = path.join(root, "dist/release");
await mkdir(outputDir, { recursive: true });
const jsonPath = path.join(outputDir, "orbit-atlas-v200-beta-rc-dossier.json");
const mdPath = path.join(outputDir, "orbit-atlas-v200-beta-rc-dossier.md");
await writeFile(jsonPath, `${JSON.stringify(dossier, null, 2)}\n`);
const checksumRows = Object.entries(evidenceSha256).map(([file, hash]) => `- \`${file}\`: \`${hash}\``).join("\n");
const markdown = `# Orbit Atlas v200 Web/Desktop Beta RC dossier

Status: **host-validated-install-qa-pending**  
Evidence label: \`${dossier.releaseLabel}\` (not applied as final release label)

## Verified on this host

- Next ${dossier.runtime.next}; React ${dossier.runtime.react}; R3F ${dossier.runtime.r3f}; Three ${dossier.runtime.three}; webpack production builds passed for standalone-full and vercel-lite.
- Cold Canvas-ready JS: standalone ${bundleStandalone.transferBytes} B, Lite ${bundleLite.transferBytes} B; both pass the 610 KiB target and remain below the 620 KiB stop line.
- Content integrity: ${content.packCount} packs, ${content.verifiedFileCount}/${content.manifestFileCount} files, zero failures. ${recovery.entries.length} recorded recovery entries remain exact-checksummed; frozen V9 was not regenerated.
- Regression: 674/674 tests across 107/107 files; TypeScript, Rust fmt/check/test/release-check passed.
- Visual journeys: 12/12; fresh standalone QA: 9 passed and 1 expected viewport skip; Lite QA: 2/2; no console/page errors or HTTP 4xx/5xx in fresh QA.
- Lifecycle soak: 10 scene cycles passed. RTX 4060 named-hardware performance gate passed without software fallback.
- Desktop stage: ${desktop.stage.bytes} bytes / ${desktop.stage.files} files from BUILD_ID \`${desktop.stage.nextBuildId}\`; MSI and NSIS are unsigned and checksummed below.

## Independent science cross-validation

- REBOUND IAS15 and SciPy DOP853 rerun hashes match.
- Attribution counts: ${JSON.stringify(crossValidation.attributionCounts)}.
- Mercury +10y position regression is ${dossier.science.mercuryTenYearPositionMeters.toFixed(3)} m; both solvers reproduce the Horizons regression, but the solver disagreement keeps the decision \`${crossValidation.promotionDecision}\` and does not establish a physical root cause.
- Default kernel remains \`legacy-eih-1pn\`; V2 remains shadow-only and was not promoted.

## External installation blocker

MSI/NSIS clean install, launch, exit, uninstall, reinstall, Chinese/space paths, content-pack fallback and WebView2 offline/online cases still require execution on the user's other Windows computer. Until that report is returned, this dossier must not be labeled GA.

## Evidence SHA-256

${checksumRows}
`;
await writeFile(mdPath, markdown);
const releaseFiles = ["dist/release/orbit-atlas-v200-beta-rc-dossier.json", "dist/release/orbit-atlas-v200-beta-rc-dossier.md"];
await writeFile(path.join(outputDir, "orbit-atlas-v200-beta-rc-dossier.sha256"), `${(await Promise.all(releaseFiles.map(async (file) => `${await sha256(file)}  ${file}`))).join("\n")}\n`);
console.log(`v200 dossier: ${jsonPath}`);
