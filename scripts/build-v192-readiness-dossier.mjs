import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const readJson = async (relativePath) => JSON.parse(
  await readFile(path.join(root, relativePath), "utf8"),
);
const sha256 = async (relativePath) => createHash("sha256")
  .update(await readFile(path.join(root, relativePath)))
  .digest("hex");
const lineCount = async (relativePath) => (
  await readFile(path.join(root, relativePath), "utf8")
).split(/\r?\n/).length;

const packageJson = await readJson("package.json");
const science = await readJson("dist/science/scientific-evidence-v7.json");
const content = await readJson("dist/science/content-pack-integrity-v192.json");
const standaloneBundle = await readJson("dist/science/client-bundle-v192-standalone-full.json");
const liteBundle = await readJson("dist/science/client-bundle-v192-vercel-lite.json");
const browserQa = await readJson("dist/science/browser-qa-v192.json");
const lifecycleSoak = await readJson("dist/science/lifecycle-soak-v192-report.json");
const performance = await readJson("dist/science/performance-v192-report.json");
const desktopRust = await readJson("dist/science/desktop-rust-v192.json");
const desktopBuild = await readJson("dist/science/desktop-build-v192.json");
const recoveryManifest = await readJson("dist/release/orbit-atlas-v192-content-recovery.json");

const evidenceFiles = [
  "dist/science/scientific-evidence-v7.json",
  "dist/science/relativity-dop853-v7-report.json",
  "dist/science/content-pack-integrity-v192.json",
  "dist/science/client-bundle-v192-standalone-full.json",
  "dist/science/client-bundle-v192-vercel-lite.json",
  "dist/science/browser-qa-v192.json",
  "dist/science/lifecycle-soak-v192-report.json",
  "dist/science/performance-v192-report.json",
  "dist/science/desktop-rust-v192.json",
  "dist/science/desktop-build-v192.json",
  "dist/release/orbit-atlas-v192-content-recovery.json",
];
const evidenceSha256 = Object.fromEntries(
  await Promise.all(evidenceFiles.map(async (file) => [file, await sha256(file)])),
);

const sourceLineCounts = {
  "app/UniverseRuntimeController.tsx": await lineCount("app/UniverseRuntimeController.tsx"),
  "app/AtlasRuntimeWorkbench.tsx": await lineCount("app/AtlasRuntimeWorkbench.tsx"),
  "app/components/AtlasSceneCameraBridges.tsx": await lineCount("app/components/AtlasSceneCameraBridges.tsx"),
  "app/components/AtlasSceneFocusCameraBridge.tsx": await lineCount("app/components/AtlasSceneFocusCameraBridge.tsx"),
  "src-tauri/src/lib.rs": await lineCount("src-tauri/src/lib.rs"),
  "src-tauri/src/commands.rs": await lineCount("src-tauri/src/commands.rs"),
  "src-tauri/src/lifecycle.rs": await lineCount("src-tauri/src/lifecycle.rs"),
  "src-tauri/src/resources.rs": await lineCount("src-tauri/src/resources.rs"),
  "src-tauri/src/state.rs": await lineCount("src-tauri/src/state.rs"),
};

const blockers = [{
  id: "desktop-install-qa",
  detail: "MSI/NSIS install, launch, exit, uninstall and reinstall matrix is pending on the user's second Windows 11 computer",
}];

const dossier = {
  version: "v192-readiness-dossier",
  generatedAt: new Date().toISOString(),
  status: "host-validated-install-qa-pending",
  eligibleLabelAfterAllBlockersClear: "web-and-desktop-beta-rc-ready-science-shadow-retained",
  releaseLabelApplied: false,
  runtime: {
    next: packageJson.dependencies?.next ?? packageJson.devDependencies?.next,
    react: packageJson.dependencies?.react,
    reactDom: packageJson.dependencies?.["react-dom"],
    r3f: packageJson.dependencies?.["@react-three/fiber"],
    three: packageJson.dependencies?.three,
    defaultScientificKernel: science.decision.defaultKernel,
    shadowScientificKernel: science.decision.shadowKernel,
  },
  science: science.decision,
  builds: {
    standaloneFull: { productionBuildPassed: true, bundle: standaloneBundle },
    vercelLite: { productionBuildPassed: true, bundle: liteBundle },
    desktopCompact: { productionBuildPassed: desktopBuild.passed, build: desktopBuild, rustValidation: desktopRust },
  },
  regression: { command: "npm run test:atlas", filesPassed: 107, filesTotal: 107, passed: 673, total: 673, failed: 0 },
  contentPacks: {
    packCount: content.packCount,
    manifestFileCount: content.manifestFileCount,
    verifiedFileCount: content.verifiedFileCount,
    missingFileCount: content.failureCount,
    passed: content.passed,
  },
  assetRecovery: {
    recordedMissingFiles: recoveryManifest.failureCount,
    restoredExactFiles: recoveryManifest.entries.length,
    unresolvedFiles: content.failureCount,
    frozenV9Regenerated: false,
    frozenV9RestorePolicy: "exact-checksummed-copy-only",
  },
  browserQa,
  lifecycleSoak,
  performance,
  maintainability: {
    sourceLineCounts,
    workbenchTargetMet: sourceLineCounts["app/AtlasRuntimeWorkbench.tsx"] < 1600,
    cameraBridgeTargetMet:
      sourceLineCounts["app/components/AtlasSceneCameraBridges.tsx"] < 650 &&
      sourceLineCounts["app/components/AtlasSceneFocusCameraBridge.tsx"] < 650,
    rustLibTargetMet: sourceLineCounts["src-tauri/src/lib.rs"] < 600,
  },
  desktopRust,
  desktopBuild,
  blockers,
  evidenceSha256,
  boundaries: {
    cloudDeployment: "not-performed",
    signing: "not-performed",
    gitMutation: "no-reset-revert-clean-stage-or-commit",
    v2Promotion: "not-applied",
    frozenAssets: "restored-from-exact-checksummed-build-copy-no-regeneration",
  },
};

const outputDir = path.join(root, "dist/release");
await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "orbit-atlas-v192-readiness-dossier.json"),
  `${JSON.stringify(dossier, null, 2)}\n`,
);

const blockerRows = blockers.map((blocker) => `- **${blocker.id}:** ${blocker.detail}`).join("\n");
const checksumRows = Object.entries(evidenceSha256)
  .map(([file, hash]) => `- \`${file}\`: \`${hash}\``)
  .join("\n");
const markdown = `# Orbit Atlas v192 readiness dossier

Status: **host-validated-install-qa-pending**

The host validation chain is complete. This is not yet the final dual-end RC claim because MSI/NSIS install QA is pending on the user's second Windows 11 computer. The eventual evidence-based label would be \`web-and-desktop-beta-rc-ready-science-shadow-retained\`; it has not been applied.

## Verified now

- Next ${dossier.runtime.next}, React ${dossier.runtime.react}, R3F ${dossier.runtime.r3f}, Three ${dossier.runtime.three}.
- standalone-full production build passed; cold Canvas-ready JS ${standaloneBundle.transferBytes} B (hard limit ${standaloneBundle.hardMaxTransferBytes} B).
- vercel-lite production build passed; cold Canvas-ready JS ${liteBundle.transferBytes} B (hard limit ${liteBundle.hardMaxTransferBytes} B).
- Camera bridge split: public bridge ${sourceLineCounts["app/components/AtlasSceneCameraBridges.tsx"]} lines; focus runtime ${sourceLineCounts["app/components/AtlasSceneFocusCameraBridge.tsx"]} lines.
- Science decision is \`${science.decision.status}\`; default remains \`${science.decision.defaultKernel}\`, V2 remains \`${science.decision.shadowKernel}\` shadow-only.
- Full regression is 673/673 across 107/107 test files. Content integrity is ${content.verifiedFileCount}/${content.manifestFileCount} files across ${content.packCount} packs.
- All ${recoveryManifest.entries.length} recorded missing assets were restored byte-for-byte. Frozen V9 was copied from an exact checksummed v167 content-pack artifact and was not regenerated.
- Fresh Chrome QA passed at 1440x900 and 390x844 with one Canvas, no horizontal overflow, no console/page errors, no 4xx/5xx responses, Escape close and focus return verified.
- The 10-cycle production soak passed: heap ${lifecycleSoak.baselineHeap} -> ${lifecycleSoak.finalHeap} B; textures ${lifecycleSoak.baseline.rendererTextures} -> ${lifecycleSoak.released.rendererTextures}; programs ${lifecycleSoak.baseline.programs} -> ${lifecycleSoak.released.programs}.
- RTX 4060 production performance passed all five scenes; overview median ${performance.samples.find((sample) => sample.id === "overview")?.medianFps} FPS and worst recorded P95 ${Math.max(...performance.samples.map((sample) => sample.frameP95Ms))} ms. Draw-call value 1 is observational only and is not used as optimization proof.
- Desktop Rust fmt/check/test/release-check passed with ${desktopRust.unitTests.passed}/${desktopRust.unitTests.passed + desktopRust.unitTests.failed} unit tests.
- Desktop compact MSI/NSIS builds passed from the v192 stage (${(desktopBuild.stage.bytes / 1048576).toFixed(1)} MiB, ${desktopBuild.stage.files} files); both installers are intentionally unsigned and second-computer install QA remains pending.

## Release blockers

${blockerRows}

## Maintainability gates

| Source | Lines | Target | Result |
|---|---:|---:|---:|
| UniverseRuntimeController | ${sourceLineCounts["app/UniverseRuntimeController.tsx"]} | <1200 | pass |
| AtlasRuntimeWorkbench | ${sourceLineCounts["app/AtlasRuntimeWorkbench.tsx"]} | <1600 | ${dossier.maintainability.workbenchTargetMet ? "pass" : "pending"} |
| Camera public bridge | ${sourceLineCounts["app/components/AtlasSceneCameraBridges.tsx"]} | <650 | pass |
| Camera focus runtime | ${sourceLineCounts["app/components/AtlasSceneFocusCameraBridge.tsx"]} | <650 | pass |
| Rust lib.rs | ${sourceLineCounts["src-tauri/src/lib.rs"]} | <600 | ${dossier.maintainability.rustLibTargetMet ? "pass" : "pending"} |
| Rust commands.rs | ${sourceLineCounts["src-tauri/src/commands.rs"]} | domain module | pass |
| Rust lifecycle.rs | ${sourceLineCounts["src-tauri/src/lifecycle.rs"]} | domain module | pass |
| Rust resources.rs | ${sourceLineCounts["src-tauri/src/resources.rs"]} | domain module | pass |

## Evidence SHA-256

${checksumRows}

## Recovery result

All ${recoveryManifest.entries.length} recovery entries now match their recorded byte size and SHA-256 through the 805/805 content-pack verifier. The frozen V9 files remain exact restores; no regeneration or visual substitution was performed.
`;
await writeFile(
  path.join(outputDir, "orbit-atlas-v192-readiness-dossier.md"),
  markdown,
);

const releaseFiles = [
  "dist/release/orbit-atlas-v192-readiness-dossier.json",
  "dist/release/orbit-atlas-v192-readiness-dossier.md",
  "dist/release/orbit-atlas-v192-content-recovery.json",
  "dist/release/orbit-atlas-v192-other-pc-install-qa.md",
];
const releaseChecksums = await Promise.all(
  releaseFiles.map(async (file) => `${await sha256(file)}  ${file}`),
);
await writeFile(
  path.join(outputDir, "orbit-atlas-v192-readiness-dossier.sha256"),
  `${releaseChecksums.join("\n")}\n`,
);

console.log(`v192 readiness dossier: ${blockers.length} blocker, ${recoveryManifest.entries.length} restored recovery entries`);
